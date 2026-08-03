// api.mjs — render scenes with Google's hosted generative models.
//
// Veo generates footage, Imagen generates stills. This buys photoreal output that an HTML
// template cannot draw, and costs money per second of video.
//
//     Veo 3.1          $0.40/s at 720p or 1080p · $0.60/s at 4K
//     Veo 3.1 Fast     $0.15/s · $0.35/s at 4K
//     Veo 3.1 Lite     from $0.03/s (no audio)
//     Imagen 4         $0.02 (fast) · $0.04 (standard) · $0.06 (ultra) per image
//     Nano Banana Pro  ~$0.13–$0.24 per image depending on resolution
//
// A 60-second video on Veo 3.1 is $24. A daily queue of those is $168 a week. That is why
// nothing here starts before the estimate is printed and the ceiling is checked — a bill
// discovered afterwards is not a bill anyone agreed to.
//
// ── VERIFIED / NOT VERIFIED ─────────────────────────────────────────────────
// The cost arithmetic, the ceiling check and the dry-run path are covered by tests and run
// without a key. The wire format — endpoint paths, request bodies, the shape of the
// long-running operation — is written from Google's published docs and has NOT been run
// against a live account from this repo. `--dry-run` prints every request it would send so
// you can check them before spending anything. Same honesty as `media-hosts/r2.mjs`, which
// says the same thing about its S3 wiring.
//
// ENV: GEMINI_API_KEY (required), VIDEO_API_MODEL, VIDEO_API_IMAGE_MODEL,
//      VIDEO_API_RESOLUTION (720p | 1080p | 4k), VIDEO_COST_CEILING_USD.
import fs from "node:fs";
import path from "node:path";

const API = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Price per second of generated video, USD. From Google's published pricing at the time of
 * writing — pricing moves, so `--estimate` prints the model and rate it used rather than
 * just a total, and you can check the number against the current page.
 */
export const VIDEO_RATES = {
  "veo-3.1": { "720p": 0.4, "1080p": 0.4, "4k": 0.6 },
  "veo-3.1-fast": { "720p": 0.15, "1080p": 0.15, "4k": 0.35 },
  "veo-3.1-lite": { "720p": 0.03, "1080p": 0.03, "4k": 0.1 },
};

export const IMAGE_RATES = {
  "imagen-4-fast": 0.02,
  "imagen-4": 0.04,
  "imagen-4-ultra": 0.06,
  "nano-banana-pro": 0.18,
};

const DEFAULT_MODEL = "veo-3.1-fast";
const DEFAULT_IMAGE_MODEL = "imagen-4";
const DEFAULT_RESOLUTION = "1080p";

/** Veo bills whole seconds and has a floor; a 0.4-second scene is not free. */
const MIN_CLIP_SEC = 4;

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * What a render would cost, per scene and in total. Pure — no network, no key needed — so
 * `--estimate` works before anyone has signed up for anything, and so it is testable.
 *
 * @returns {{model, resolution, ratePerSec, scenes: Array, totalSec, totalUsd}}
 */
export function estimate(script, { model = DEFAULT_MODEL, resolution = DEFAULT_RESOLUTION } = {}) {
  const table = VIDEO_RATES[model];
  if (!table) {
    throw new Error(`Unknown video model "${model}". Known: ${Object.keys(VIDEO_RATES).join(" | ")}`);
  }
  const ratePerSec = table[resolution];
  if (ratePerSec === undefined) {
    throw new Error(
      `Model ${model} has no rate for "${resolution}". Known: ${Object.keys(table).join(" | ")}`,
    );
  }

  const scenes = (script.scenes ?? []).map((scene) => {
    // Words to seconds at ~2.5 words/second, the same rough read speed validate.mjs uses
    // for its duration estimate. Billed at the clip floor when the scene is shorter.
    const words = String(scene.voiceText ?? "").split(/\s+/).filter(Boolean).length;
    const spoken = scene.durationSec ?? Math.max(words / 2.5, 0);
    const billedSec = Math.max(Math.ceil(spoken), MIN_CLIP_SEC);
    return { id: scene.id, words, spokenSec: round2(spoken), billedSec, usd: round2(billedSec * ratePerSec) };
  });

  const totalSec = scenes.reduce((n, s) => n + s.billedSec, 0);
  return { model, resolution, ratePerSec, scenes, totalSec, totalUsd: round2(totalSec * ratePerSec) };
}

/** @returns {{ok: boolean, reason?: string}} */
export function checkCeiling(totalUsd, ceilingUsd) {
  if (ceilingUsd === null || ceilingUsd === undefined) return { ok: true };
  if (totalUsd <= ceilingUsd) return { ok: true };
  return {
    ok: false,
    reason:
      `estimated $${totalUsd.toFixed(2)} exceeds the ceiling of $${Number(ceilingUsd).toFixed(2)}. ` +
      `Raise costCeilingUsd in your profile, set VIDEO_COST_CEILING_USD, or use a cheaper ` +
      `model (VIDEO_API_MODEL=veo-3.1-lite) or the html backend.`,
  };
}

function apiKey() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) {
    throw new Error(
      `GEMINI_API_KEY is not set. The api backend calls Google's hosted models; ` +
        `without a key there is nothing to call. See .env.example.`,
    );
  }
  return k;
}

/**
 * Veo returns a long-running operation rather than a video. Submit, then poll until done.
 * Generation takes minutes, so the interval is deliberately unhurried — polling every
 * second would just burn quota against an operation that has not moved.
 */
async function generateVideo({ prompt, model, resolution, durationSec, outFile, log }) {
  const key = apiKey();

  const submit = await fetch(`${API}/models/${model}:predictLongRunning?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { durationSeconds: durationSec, resolution, aspectRatio: "9:16" },
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!submit.ok) {
    throw new Error(`Veo submit ${submit.status}: ${(await submit.text()).slice(0, 300)}`);
  }
  const op = await submit.json();
  if (!op.name) throw new Error(`Veo returned no operation name: ${JSON.stringify(op).slice(0, 200)}`);

  const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 10000));
    const res = await fetch(`${API}/${op.name}?key=${key}`, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(`Veo poll ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const state = await res.json();
    if (state.error) throw new Error(`Veo failed: ${state.error.message ?? JSON.stringify(state.error)}`);
    if (!state.done) {
      log?.(`still generating…`);
      continue;
    }

    const uri = state.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
      ?? state.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) throw new Error(`Veo finished with no video URI: ${JSON.stringify(state.response).slice(0, 300)}`);

    const bytes = await fetch(`${uri}&key=${key}`, { signal: AbortSignal.timeout(300000) });
    if (!bytes.ok) throw new Error(`Veo download ${bytes.status}`);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, Buffer.from(await bytes.arrayBuffer()));
    return outFile;
  }
  throw new Error(`Veo did not finish within 20 minutes — operation ${op.name}`);
}

/**
 * Entry point render.mjs calls. Prints the bill, checks the ceiling, then generates.
 *
 * @param {{script, scriptPath, outputDir, argv, settings}} ctx
 */
export async function render({ script, outputDir, argv = [], settings = {} }) {
  const model = process.env.VIDEO_API_MODEL || DEFAULT_MODEL;
  const resolution = process.env.VIDEO_API_RESOLUTION || DEFAULT_RESOLUTION;
  const dryRun = argv.includes("--dry-run");

  const est = estimate(script, { model, resolution });

  console.log(`[video] backend: api — ${est.model} @ ${est.resolution}, $${est.ratePerSec}/s`);
  for (const s of est.scenes) {
    console.log(
      `[video]   ${String(s.id).padEnd(10)} ${String(s.billedSec).padStart(3)}s billed  $${s.usd.toFixed(2)}` +
        (s.billedSec > s.spokenSec ? `   (${s.spokenSec}s spoken — billed at the ${MIN_CLIP_SEC}s floor)` : ""),
    );
  }
  console.log(`[video]   ── ${est.scenes.length} scenes, ${est.totalSec}s → $${est.totalUsd.toFixed(2)}`);

  const gate = checkCeiling(est.totalUsd, settings.costCeilingUsd);
  if (!gate.ok) {
    console.error(`[video] ✗ ${gate.reason}`);
    process.exit(1);
  }

  if (argv.includes("--estimate")) {
    console.log(`[video] estimate only — nothing generated, nothing billed.`);
    return { estimated: true, ...est };
  }

  // A bill this size is not something to discover afterwards. Anything above a dollar
  // asks, unless the caller has already said yes with an explicit ceiling.
  if (est.totalUsd > 1 && settings.costCeilingUsd === null && !argv.includes("--yes") && !dryRun) {
    console.error(
      `[video] ✗ this would bill $${est.totalUsd.toFixed(2)} and no cost ceiling is set.\n` +
        `[video]   Re-run with --yes, or set costCeilingUsd in your profile so the limit is written down.`,
    );
    process.exit(1);
  }

  const clipDir = path.join(outputDir, "clips");
  const made = [];
  for (const scene of script.scenes ?? []) {
    const outFile = path.join(clipDir, `scene-${scene.id}.mp4`);
    const billed = est.scenes.find((s) => s.id === scene.id);

    // The visual prompt, not the narration. voiceText is what is *said*; a generator given
    // narration produces a video of someone talking about the subject instead of the subject.
    const prompt = scene.videoPrompt ?? scene.visual ?? scene.inputs?.prompt;
    if (!prompt) {
      throw new Error(
        `Scene "${scene.id}" has no videoPrompt. The api backend generates footage from a ` +
          `visual description; voiceText is narration and describes the wrong thing.`,
      );
    }

    if (dryRun) {
      console.log(`[video]   DRY  POST ${API}/models/${model}:predictLongRunning`);
      console.log(`[video]        ${JSON.stringify({ prompt, durationSeconds: billed.billedSec, resolution })}`);
      console.log(`[video]        → ${outFile}`);
      continue;
    }

    if (fs.existsSync(outFile)) {
      console.log(`[video]   reuse ${path.basename(outFile)} (delete it to regenerate — it cost money once)`);
      made.push(outFile);
      continue;
    }

    console.log(`[video]   generating scene ${scene.id} (${billed.billedSec}s, $${billed.usd.toFixed(2)})…`);
    made.push(
      await generateVideo({
        prompt,
        model,
        resolution,
        durationSec: billed.billedSec,
        outFile,
        log: (m) => console.log(`[video]     ${m}`),
      }),
    );
  }

  if (dryRun) {
    console.log(`[video] ✓ dry run — ${est.scenes.length} request(s) shown, nothing sent, $0 billed.`);
    return { dryRun: true, ...est };
  }

  console.log(`[video] ✓ ${made.length} clip(s) in ${clipDir}`);
  console.log(`[video]   Clips are kept and reused — each one was paid for. Delete to regenerate.`);
  console.log(`[video]   Stitch and add narration with the html backend's later steps, or with ffmpeg.`);
  return { clips: made, ...est };
}

export { DEFAULT_MODEL, DEFAULT_IMAGE_MODEL, DEFAULT_RESOLUTION, MIN_CLIP_SEC };
