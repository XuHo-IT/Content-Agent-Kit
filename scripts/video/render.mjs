// render.mjs — turn a script.json into a finished 9:16 video.
//   node scripts/video/render.mjs <script.json>
//   node scripts/video/render.mjs <script.json> --estimate      # what TTS would cost, then stop
//   node scripts/video/render.mjs <script.json> --skip-validate --skip-preflight
//   node scripts/video/render.mjs <script.json> --strict        # craft warnings block the render
//
// Nine deterministic steps: validate → script.txt → TTS per scene → concat voice
// → mix SFX → resolve media → render+fit each template clip → concat+mux → report.
// Prints `VIDEO=<path>` on success so callers can capture it (same convention as
// publish.mjs printing `ID=`).
//
// Outputs land NEXT TO the script.json: voice/, clips/, voice.mp3, script.txt, video.mp4.
// IDEMPOTENT — narration is reused only when its fingerprint (provider, voice, speed,
// model, text) still matches; clips are reused whenever they exist. Delete
// clips/scene-<id>.mp4 to force one scene to re-render after editing its `inputs`.
//
// ENV: TTS_PROVIDER, TTS_VOICE_ID, TTS_SPEED, TTS_CONCURRENCY, VIDEO_TEMPLATES_DIR,
//      VIDEO_SFX_DIR (+ the provider's own key — see docs/14). Needs ffmpeg + Chrome.
import fs from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateScript } from "./lib/validate.mjs";
import { preflight, reportPreflight } from "./lib/preflight.mjs";
import { createTtsClient, ttsConfig } from "./lib/tts.mjs";
import { fingerprint, checkCache, writeCache } from "./lib/voice-cache.mjs";
import { pLimit } from "./lib/proc.mjs";
import { getDurationSec, concatWithSilence, mixSfxOntoVoice, applySpeed } from "./lib/ffmpeg-audio.mjs";
import {
  fitClipToDuration,
  concatVideos,
  concatWithTransitions,
  transitionPlan,
  muxAudioOntoVideo,
  getVideoSize,
  TRANSITIONS,
  DEFAULT_TRANSITION_SEC,
} from "./lib/ffmpeg-video.mjs";
import { indexSfxLibrary, pickSfxForScene, defaultPlayback } from "./lib/sfx.mjs";
import { composeTemplate } from "./lib/compose.mjs";
import { sfxDir } from "./lib/paths.mjs";
import { resolveTheme, themeKey } from "./lib/theme.mjs";
import { resolveSceneMedia } from "../media/lib/resolve.mjs";
import { loadProfile, resolveSettings } from "./lib/profile.mjs";
import { assertBackend, loadBackend, describeBackends } from "./lib/backends/index.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `render.mjs — render a video script.json to video.mp4\n` +
      `  <script.json>       the script to render (outputs land beside it)\n` +
      `  --estimate          print which scenes would call TTS + billable chars, then stop\n` +
      `  --skip-validate     skip the script check (not recommended)\n` +
      `  --skip-preflight    skip the ffmpeg/TTS host check\n` +
      `  --strict            craft warnings block the render\n` +
      `  --refresh-media     re-resolve B-roll/screenshots, ignoring media-lock.json\n` +
      `  --no-transitions    hard cuts everywhere; skips the re-encode xfade forces\n` +
      `  --backend <id>      html (default) | api | remotion — see --list-backends\n` +
      `  --profile <name>    a profile in profiles/ (personal, business), or a path\n` +
      `  --cost-ceiling <n>  refuse an api render estimated above this many USD\n` +
      `  --list-backends     what each backend costs and needs, then stop\n` +
      `env: VIDEO_BACKEND, VIDEO_PROFILE, TTS_PROVIDER, TTS_VOICE_ID, TTS_SPEED,\n` +
      `     TTS_CONCURRENCY, VIDEO_TEMPLATES_DIR, VIDEO_SFX_DIR, PEXELS_API_KEY,\n` +
      `     PIXABAY_API_KEY, GEMINI_API_KEY (api backend, + the TTS provider's key)`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}

const flagValue = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const numberFlag = (name) => (flagValue(name) === undefined ? undefined : Number(flagValue(name)));

if (argv.includes("--list-backends")) {
  console.log(`render.mjs — available backends (VIDEO_BACKEND, or --backend)\n`);
  console.log(describeBackends());
  console.log(`\nDefault: html. Method: docs/20-video-backends.md`);
  process.exit(0);
}

const scriptPath = argv.find((a) => a.endsWith(".json") && !a.startsWith("--"));
if (!scriptPath) throw new Error("Pass a script.json path.");
if (!fs.existsSync(scriptPath)) throw new Error(`Script not found: ${scriptPath}`);

const TOTAL_STEPS = 9;
const SCENE_GAP_SEC = 0.3;
const OUTRO_HOLD_SEC = 3;
const RENDER_FPS = 30;
/** Scene type → the SFX role key. */
const TYPE_TO_ROLE = { hook: "hook", body: "callout", outro: "outro" };

const step = (n, msg) => console.log(`[video] [${n}/${TOTAL_STEPS}] ${msg}`);
const info = (msg) => console.log(`[video]   ${msg}`);
const t0 = Date.now();

try {
  const outputDir = path.dirname(path.resolve(scriptPath));
  const script = JSON.parse(await readFile(scriptPath, "utf8"));

  // ── backend selection ──────────────────────────────────────────────────────
  // `html` is this file's own body, and everything below this block is exactly the code
  // that has always run. The other backends are modules and return before reaching it.
  //
  // Extracting the html pipeline into a module for symmetry would mean moving ~250 lines
  // of the one path that definitely works, for no behaviour change. Adding a branch above
  // it is the smaller, verifiable option: with VIDEO_BACKEND unset, nothing changed.
  const settings = resolveSettings({
    script,
    profile: loadProfile(flagValue("--profile")),
    flags: { backend: flagValue("--backend"), costCeilingUsd: numberFlag("--cost-ceiling") },
  });
  assertBackend(settings.backend);
  if (settings.profileName) info(`profile: ${settings.profileName}`);

  if (settings.backend !== "html") {
    const mod = await loadBackend(settings.backend);
    await mod.render({ script, scriptPath, outputDir, argv, settings });
    process.exit(0);
  }

  // The script's own voice block wins over env, so one .env can serve many scripts.
  const cfg = ttsConfig({
    provider: script.voice?.provider,
    voiceId: script.voice?.voiceId,
    speed: script.voice?.speed,
  });

  // --estimate: cloud TTS bills per character, so show what a run would actually
  // send before sending it. Cache hits cost nothing.
  if (argv.includes("--estimate")) {
    console.log(`[video] estimate — ${cfg.provider}${cfg.voiceId ? ` / ${cfg.voiceId}` : ""}`);
    let billable = 0;
    let calls = 0;
    for (const scene of script.scenes) {
      const mp3 = path.join(outputDir, "voice", `scene-${scene.id}.mp3`);
      const { reuse, reason } = checkCache(mp3, fingerprint(scene, cfg));
      const chars = scene.voiceText.length;
      if (!reuse) {
        billable += chars;
        calls++;
      }
      console.log(
        `[video]   ${String(scene.id).padEnd(10)} ${String(chars).padStart(5)} chars   ` +
          (reuse ? "reuse" : `CALL  (${reason})`),
      );
    }
    console.log(
      `[video]   ${calls} of ${script.scenes.length} scenes would call TTS — ` +
        `${billable} chars billable`,
    );
    process.exit(0);
  }

  // STEP 1 — validate script + host
  step(1, "Validate script");
  if (!argv.includes("--skip-validate")) {
    const { errors, warnings, stats } = validateScript(script);
    for (const w of warnings) console.warn(`[video] ! ${w}`);
    for (const e of errors) console.error(`[video] ✗ ${e}`);
    if (errors.length || (argv.includes("--strict") && warnings.length)) {
      console.error(`[video] ✗ script rejected — fix the above, or pass --skip-validate.`);
      process.exit(1);
    }
    info(`${stats.scenes} scenes, ${stats.totalWords} words (≈${stats.estSec}s), ${stats.aspect}`);
  }
  if (!argv.includes("--skip-preflight")) {
    const ok = reportPreflight(
      await preflight({
        ttsOverrides: {
          provider: script.voice?.provider,
          voiceId: script.voice?.voiceId,
          speed: script.voice?.speed,
        },
      }),
    );
    if (!ok) process.exit(1);
  }
  info(`output: ${outputDir}`);

  const scenes = script.scenes;
  const aspect = script.aspect ?? "9:16";

  // STEP 2 — script.txt (CapCut auto-caption feed)
  step(2, "Write script.txt");
  await writeFile(path.join(outputDir, "script.txt"), scenes.map((s) => s.voiceText).join("\n\n"), "utf8");

  // STEP 3 — TTS per scene (idempotent, fingerprinted)
  step(3, `TTS each scene — ${cfg.provider}${cfg.voiceId ? ` / ${cfg.voiceId}` : ""}`);
  const tts = createTtsClient(cfg);
  const limit = pLimit(cfg.concurrency);
  const voiceDir = path.join(outputDir, "voice");
  await mkdir(voiceDir, { recursive: true });

  const sceneAudio = await Promise.all(
    scenes.map((scene) =>
      limit(async () => {
        const out = path.join(voiceDir, `scene-${scene.id}.mp3`);
        const want = fingerprint(scene, cfg);
        const cached = checkCache(out, want);

        if (cached.reuse) {
          // The sidecar already knows the duration, so skip an ffprobe.
          const dur = cached.durationSec ?? (await getDurationSec(out));
          info(`scene ${scene.id}: reuse mp3 (${dur.toFixed(2)}s)`);
          return { id: scene.id, path: out, durationSec: dur };
        }

        info(`scene ${scene.id}: TTS — ${cached.reason}`);
        await tts.generate(scene.voiceText, out);
        // Providers that take a speed parameter already applied it; the rest get it here,
        // so `voice.speed` means the same thing whichever provider was used.
        if (!cfg.nativeSpeed) await applySpeed(out, cfg.speed);
        const dur = await getDurationSec(out);
        writeCache(out, want, dur);
        info(`scene ${scene.id}: ${dur.toFixed(2)}s`);
        return { id: scene.id, path: out, durationSec: dur };
      }),
    ),
  );

  // STEP 4 — concat narration + compute each scene's start time
  step(4, "Concat voice + compute timings");
  const voiceRawMp3 = path.join(outputDir, "voice-raw.mp3");
  const voiceMp3 = path.join(outputDir, "voice.mp3");
  await concatWithSilence(sceneAudio.map((a) => a.path), SCENE_GAP_SEC, voiceRawMp3);

  const sceneStarts = {};
  let cursor = 0;
  for (const a of sceneAudio) {
    sceneStarts[a.id] = cursor;
    cursor += a.durationSec + SCENE_GAP_SEC;
  }

  // STEP 5 — pick + mix SFX (degrades gracefully when the library is absent)
  step(5, "Pick + mix SFX");
  const SFX_DIR = sfxDir();
  const sfxIndex = fs.existsSync(SFX_DIR) ? indexSfxLibrary(SFX_DIR) : {};
  const sfxList = [];
  for (const scene of scenes) {
    const startSec = sceneStarts[scene.id];
    if (scene.sfx) {
      if (scene.sfx.name === "none") continue; // explicit mute
      const p = path.join(SFX_DIR, `${scene.sfx.name}.mp3`);
      if (fs.existsSync(p)) {
        sfxList.push({
          path: p,
          startSec: startSec + (scene.sfx.startOffsetSec ?? 0),
          volume: scene.sfx.volume ?? 0.4,
        });
      } else {
        console.warn(`[video] ! scene ${scene.id}: sfx "${scene.sfx.name}" not found in ${SFX_DIR}`);
      }
      continue;
    }
    if (Object.keys(sfxIndex).length === 0) continue;
    const picked = pickSfxForScene({
      voiceText: scene.voiceText,
      role: TYPE_TO_ROLE[scene.type] ?? "callout",
      sceneId: scene.id,
      index: sfxIndex,
    });
    if (!picked) continue;
    const pb = defaultPlayback(picked);
    sfxList.push({
      path: path.join(SFX_DIR, picked.relPath),
      startSec: startSec + pb.offsetSec,
      volume: pb.volume,
    });
  }
  await mixSfxOntoVoice(voiceRawMp3, sfxList, voiceMp3);
  const totalAudioSec = await getDurationSec(voiceMp3);
  info(`voice.mp3: ${totalAudioSec.toFixed(2)}s, ${sfxList.length} SFX`);

  // STEP 6 — resolve B-roll / screenshots (idempotent via media-lock.json)
  step(6, "Resolve media");
  const lastIdx = scenes.length - 1;

  // --- transitions ----------------------------------------------------------
  // A scene's `transition` describes how it ENTERS, so the joint between clip i
  // and i+1 is owned by scene i+1. The 0.3s of inter-scene silence the audio
  // already carries is what a transition plays over; keep T under it.
  const baseDur = scenes.map((s, i) => {
    const d = sceneAudio.find((a) => a.id === s.id).durationSec;
    return d + (i < lastIdx ? SCENE_GAP_SEC : OUTRO_HOLD_SEC);
  });
  const transitionSec = Number(script.transitionSec ?? DEFAULT_TRANSITION_SEC);
  const noTransitions = argv.includes("--no-transitions");
  const kinds = scenes.slice(1).map((s) => {
    const k = s.transition ?? script.transition ?? "none";
    if (!(k in TRANSITIONS)) {
      console.error(
        `[video] ✗ scene ${s.id}: unknown transition "${k}" — one of ${Object.keys(TRANSITIONS).join(", ")}`,
      );
      process.exit(1);
    }
    return noTransitions ? "none" : k;
  });
  const secs = kinds.map((k) => (k === "none" ? 0 : transitionSec));
  const anyTransition = secs.some((s) => s > 0);
  // Padding each clip by the transition that follows it is what keeps the total
  // unchanged — see transitionPlan(). With no transitions, padded === baseDur.
  const plan = scenes.length > 1 ? transitionPlan(baseDur, secs) : { padded: baseDur, offsets: [] };
  if (anyTransition) {
    const used = [...new Set(kinds.filter((k) => k !== "none"))].join(", ");
    info(`transitions: ${used} @ ${transitionSec}s — re-encodes the concat (slower than a stream copy)`);
  } else if (noTransitions) {
    info("transitions: off (--no-transitions)");
  }

  const sceneMedia = {};
  const withMedia = scenes.filter((s) => s.media);
  if (withMedia.length === 0) {
    info("no scenes need media");
  } else {
    for (const scene of withMedia) {
      const visualDur = plan.padded[scenes.indexOf(scene)];
      const got = await resolveSceneMedia(scene, outputDir, {
        durationSec: visualDur,
        refresh: argv.includes("--refresh-media"),
        log: info,
      });
      if (got) sceneMedia[scene.id] = got;
    }
  }

  // STEP 7 — render each template clip, fit it to that scene's narration
  step(7, "Render template clips + fit to narration");
  const clipsDir = path.join(outputDir, "clips");
  await mkdir(clipsDir, { recursive: true });
  const fittedClips = [];

  // Cached clips are keyed by the palette they were rendered with. Without this, editing
  // `theme` and re-running silently returns the previous colours — the reuse rule that
  // makes re-renders cheap would quietly make them wrong.
  const theme = resolveTheme(script.theme);
  const keyFile = path.join(clipsDir, ".theme-key");
  const wantKey = themeKey(theme);
  const haveKey = fs.existsSync(keyFile) ? fs.readFileSync(keyFile, "utf8").trim() : null;
  const themeChanged = haveKey !== null && haveKey !== wantKey;
  if (themeChanged) info(`theme changed (${haveKey} → ${wantKey}) — re-rendering every clip`);
  await writeFile(keyFile, `${wantKey}\n`, "utf8");
  if (theme) info(`theme: ${theme.id} — canvas ${theme.bg}, ink ${theme.ink}`);

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    // Every scene but the last also covers the 0.3s inter-scene silence; the
    // outro holds 3s past the last word. Plus, if a transition follows this
    // scene, exactly enough extra for the overlap to eat back.
    const visualDur = plan.padded[i];

    const rawClip = path.join(clipsDir, `scene-${scene.id}.mp4`);
    const fitClip = path.join(clipsDir, `scene-${scene.id}-fit.mp4`);

    if (fs.existsSync(rawClip) && !themeChanged) {
      info(`scene ${scene.id}: reuse clip — delete it to force a re-render`);
    } else {
      const media = sceneMedia[scene.id];
      await composeTemplate({
        templateId: scene.templateId,
        inputs: {
          ...(scene.inputs ?? {}),
          // Templates switch between <video> and <img> on this, so it has to reflect
          // what was actually resolved, not what the author guessed.
          ...(media ? { media_kind: media.kind === "video" ? "video" : "image" } : {}),
        },
        aspect,
        outputPath: rawClip,
        fps: RENDER_FPS,
        mediaFile: media?.file,
        theme,
        log: (m) => console.warn(`[video] ! ${m}`),
      });
    }
    await fitClipToDuration(rawClip, visualDur, fitClip, RENDER_FPS);
    info(`scene ${scene.id}: ${scene.templateId} → ${visualDur.toFixed(2)}s`);
    fittedClips.push(fitClip);
  }

  // STEP 8 — concat clips + mux narration
  step(8, "Concat clips + mux audio");
  const silentVideo = path.join(outputDir, "video-silent.mp4");
  const videoPath = path.join(outputDir, "video.mp4");
  if (anyTransition) {
    await concatWithTransitions(fittedClips, silentVideo, {
      offsets: plan.offsets,
      kinds,
      secs,
      fps: RENDER_FPS,
    });
  } else {
    await concatVideos(fittedClips, silentVideo);
  }
  await muxAudioOntoVideo(silentVideo, voiceMp3, videoPath);

  // STEP 9 — report
  step(9, "Done");
  const { width, height } = await getVideoSize(videoPath);
  const videoSec = await getDurationSec(videoPath);
  console.log(
    `[video] ✓ ${width}×${height}, ${videoSec.toFixed(2)}s ` +
      `(rendered in ${((Date.now() - t0) / 1000).toFixed(0)}s)`,
  );
  console.log(`[video]   voice:  ${voiceMp3}   (drop into CapCut)`);
  console.log(`[video]   script: ${path.join(outputDir, "script.txt")}   (CapCut auto-caption)`);
  console.log(`VIDEO=${videoPath}`);
} catch (e) {
  console.error(`[video] ✗ ${e.message}`);
  process.exit(1);
}
