// validate.mjs — schema + craft rules for a video script.json.
//
// Replaces upstream's Zod schema (zero deps here) AND adds the craft rules that
// upstream only documented in prose. This is the gate that keeps an AI-written
// script.json renderable and on-brand: structure errors and craft errors are
// caught BEFORE 3–5 minutes of rendering are spent.
//
// Every issue quotes the offending text — same rule as skills/review-gate.
import { listTemplateIds } from "./paths.mjs";
import { PROVIDERS, PROVIDER_SPECS } from "./tts.mjs";
import { SOURCE_IDS } from "../../media/lib/sources/index.mjs";
// Read from the source itself so the accepted values cannot drift between the gate that
// enforces them and the module that documents them.
import { RIGHTS as SOCIAL_RIGHTS, RIGHTS_NEEDING_NOTE as SOCIAL_RIGHTS_NEEDING_NOTE } from "../../media/lib/sources/social.mjs";
import { ALLOWED_LICENCES as MUSIC_LICENCES } from "./music.mjs";
import { resolveTheme, loadThemeMap, THEME_IDS, contrastRatio, hexToRgb } from "./theme.mjs";
import { defaultInputs, declaredSlots, nearestSlot } from "./slots.mjs";
import { TRANSITIONS } from "./ffmpeg-video.mjs";

// ── tunables (all overridable by the caller) ────────────────────────────────
export const CRAFT_DEFAULTS = {
  minScenes: 8, // below this the pacing drags (schema floor is 3)
  // Upstream capped this at 12 because it targeted a 90–120s short. A 2–3 minute video is
  // a legitimate format and needs more scenes at the same 25–40 words each, so the hard
  // ceiling is now about render cost (~15–20s per scene) rather than a fixed runtime.
  maxScenes: 20,
  totalWordsMin: 270, // ~90s of Vietnamese narration
  // ~200s. Past this you are over the Shorts/Reels ceiling on most platforms.
  totalWordsMax: 600,
  bodyWordsMin: 25, // one idea per scene, 6–10s on screen
  bodyWordsMax: 40,
  maxSameTemplate: 2, // variety: don't reuse one template for every body beat
  // Openers designed for hooks across genres: liquid hero, b-roll, map, poster, glitch news, kinetic type, vox collage, geo answer
  hookTemplates: [
    "frame-liquid-bg-hero",
    "frame-broll",
    "frame-geo-markers",
    "frame-bold-poster",
    "frame-glitch-title",
    "frame-kinetic-type",
    "frame-vox-collage",
    "frame-vox-split-screen",
    "frame-vox-investigation-board",
    "frame-geo-faq-direct",
    "frame-ui-glass-dashboard",
    "frame-3d-spotlight",
  ],
  outroTemplates: ["frame-logo-outro", "frame-statement-outro"],
};

/** Fields animated character-by-character — emoji there shatters the animation. */
const CHAR_ANIMATED_FIELDS = { "frame-build-minimal": ["hero"] };

/** Templates that actually show a resolved clip/still. Anything else silently ignores it. */
const MEDIA_TEMPLATES = ["frame-broll", "frame-media-inset", "frame-screenshot", "frame-meme", "frame-vox-photo-grid", "frame-logo-outro", "frame-vox-split-screen"];

/**
 * Templates that draw MORE than the first picture. Everything else takes `assets/media.*`
 * and ignores the rest — which renders happily and silently drops three of your four
 * images, so passing an array to one of those is an error rather than a warning.
 */
const MULTI_MEDIA_TEMPLATES = ["frame-vox-photo-grid"];

/** Four cells is what a 9:16 frame can show before each is too small to read. */
const MAX_MEDIA_PER_SCENE = 4;

/**
 * Templates that can actually PLAY a clip. This is a much shorter list than the ones that
 * accept media, and the difference is not cosmetic.
 *
 * hyperframes calls a composition's seek() synchronously and never awaits it — there is no
 * `await` before any `.seek(` in its bundle. Chrome's `video.currentTime = t` is async, so
 * the screenshot is taken before the new frame has decoded. Whether that race is won comes
 * down to how much decode work the frame is asking for, which was measured, not guessed:
 *
 *   frame-broll           one full-frame clip, declared in markup  -> plays correctly
 *   frame-vox-split-screen  one pane clip + scrim + paper texture  -> pane BLANKS mid-scene
 *   frame-vox-photo-grid    four cell clips                        -> black, then frozen
 *
 * So a clip is allowed only where it is the whole background. Anywhere else the resolver
 * takes a still frame from it instead — see stillFrom() in scripts/media/lib/normalize.mjs.
 * A frozen clip is worse than a still: it looks like the render broke.
 */
const VIDEO_SAFE_TEMPLATES = ["frame-broll"];

/** One clip per frame. Two is the grid case above, which froze both. */
const MAX_VIDEO_PER_SCENE = 1;

const ASPECTS = ["9:16", "16:9"]; // 1:1 maps to a composition no template ships
const SCENE_TYPES = ["hook", "body", "outro"];

// Emoji / pictographs / dingbats / arrows. Kept explicit rather than \p{Emoji},
// which also matches plain digits and '#'.
const EMOJI =
  /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2600}-\u{26FF}]/u;
const URL_RE = /(https?:\/\/|www\.)\S+/i;
const BANNED_SYMBOLS = /[→&%$#+=]/;
const DIGITS = /\d/;

const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
const quote = (s, n = 80) => {
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
};
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/**
 * Contrast for the theme's bg/ink pair, from theme.mjs rather than a second copy.
 * This file used to carry its own WCAG implementation; theme-from-url.mjs would have
 * made three. Three copies of a rule is three places for it to drift.
 */
const contrast = (a, b) => contrastRatio(hexToRgb(a), hexToRgb(b));

/**
 * Validate a parsed script object.
 * @returns {{ errors: string[], warnings: string[], stats: object }}
 */
export function validateScript(script, opts = {}) {
  const cfg = { ...CRAFT_DEFAULTS, ...opts };
  const errors = [];
  const warnings = [];
  const E = (m) => errors.push(m);
  const W = (m) => warnings.push(m);

  const known = opts.templateIds ?? listTemplateIds();

  if (!isObj(script)) {
    return { errors: ["script.json must be a JSON object"], warnings, stats: {} };
  }

  // ── envelope ─────────────────────────────────────────────────────────────
  if (script.version !== "1.0") E(`version must be "1.0", got ${JSON.stringify(script.version)}`);
  if (script.renderer !== "hyperframes")
    E(`renderer must be "hyperframes", got ${JSON.stringify(script.renderer)}`);

  const aspect = script.aspect ?? "9:16";
  if (!ASPECTS.includes(aspect))
    E(`aspect must be one of ${ASPECTS.join(" | ")}, got ${JSON.stringify(script.aspect)}`);

  // ── transitions (optional) ───────────────────────────────────────────────
  // A misspelt transition name is worth catching here rather than after the
  // render has already paid for TTS.
  if (script.transition != null && !(script.transition in TRANSITIONS))
    E(`transition must be one of ${Object.keys(TRANSITIONS).join(" | ")}, got ${JSON.stringify(script.transition)}`);
  if (script.transitionSec != null) {
    const t = Number(script.transitionSec);
    if (!(t > 0)) E(`transitionSec must be a positive number, got ${JSON.stringify(script.transitionSec)}`);
    // Longer than the inter-scene silence and the transition runs over narration.
    else if (t > 0.3) W(`transitionSec ${t}s overruns the 0.3s gap between scenes — the blend will cover speech`);
  }

  // ── theme (optional) ─────────────────────────────────────────────────────
  // A bad palette is only visible after a full render, so the cheap checks happen here.
  let theme = null;
  if (script.theme != null) {
    try {
      theme = resolveTheme(script.theme);
    } catch (err) {
      E(`theme: ${err.message} (presets: ${THEME_IDS.join(", ")})`);
    }
  }
  if (theme) {
    // Themed text on themed canvas has to stay readable — this is the one contrast
    // failure the eye forgives on a still and hates in motion.
    const ratio = contrast(theme.bg, theme.ink);
    if (ratio < 4.5) {
      E(
        `theme: bg ${theme.bg} on ink ${theme.ink} is contrast ${ratio.toFixed(1)}:1 — ` +
          `below the 4.5:1 floor, the narration text will be hard to read`,
      );
    } else if (ratio < 7) {
      W(`theme: contrast ${ratio.toFixed(1)}:1 is legible but not comfortable at phone size`);
    }
  }

  // ── music bed (optional) ─────────────────────────────────────────────────
  if (script.music !== undefined) {
    const m = script.music;
    if (!isObj(m)) {
      E(`music must be an object — {query} or {file}, plus an optional negative gainDb`);
    } else {
      if (!m.query && !m.file) E(`music needs a "query" (searched) or a "file" (one you supply)`);
      if (m.query && m.file) E(`music has both "query" and "file" — pick one`);

      // A bed louder than the narration is not a taste someone might have, it is a mistake,
      // and it is one you only notice after a full render with headphones on.
      if (m.gainDb !== undefined) {
        if (typeof m.gainDb !== "number" || Number.isNaN(m.gainDb))
          E(`music.gainDb must be a number in dB, got ${JSON.stringify(m.gainDb)}`);
        else if (m.gainDb >= 0)
          E(`music.gainDb is ${m.gainDb} — a bed sits UNDER the voice, so this must be negative (try -20).`);
        else if (m.gainDb > -8)
          W(`music.gainDb ${m.gainDb} is loud for a bed; -16 to -24 is the usual range for narration.`);
      }

      if (m.license !== undefined && !MUSIC_LICENCES.includes(String(m.license))) {
        E(`music.license "${m.license}" is not one of: ${MUSIC_LICENCES.join(" | ")}. ` +
          `Anything else cannot be cleared for a published video.`);
      }
      if (String(m.license ?? "cc0") === "by") {
        W(`music.license "by" requires crediting the author wherever you publish — the render ` +
          `prints the exact attribution and writes it to media-lock.json. Use "cc0" to avoid the obligation.`);
      }
    }
  }

  // ── metadata ─────────────────────────────────────────────────────────────
  const md = script.metadata;
  if (!isObj(md)) {
    E("metadata is required (title, source{url,domain,image}, channel)");
  } else {
    if (!md.title?.trim()) E("metadata.title is required");
    if (!md.channel?.trim()) E("metadata.channel is required");
    if (!isObj(md.source)) {
      E("metadata.source is required — {url, domain, image}");
    } else {
      if (typeof md.source.url !== "string") E("metadata.source.url must be a string");
      if (typeof md.source.domain !== "string") E("metadata.source.domain must be a string");
      if (md.source.image !== null && typeof md.source.image !== "string")
        E("metadata.source.image must be a URL string or null");
    }
  }

  // ── voice ────────────────────────────────────────────────────────────────
  const voice = script.voice;
  if (!isObj(voice)) {
    E('voice is required — {"provider":"omnivoice","speed":1.0}');
  } else {
    const provider = voice.provider ?? "omnivoice";
    const spec = PROVIDER_SPECS[provider];
    if (!spec) {
      E(
        `voice.provider ${JSON.stringify(provider)} is not a known provider. ` +
          `Known: ${PROVIDERS.join(" | ")}. For anything else use "http" and describe ` +
          `it with TTS_HTTP_* env vars (see docs/14-video-generation.md).`,
      );
    } else if (spec.needsVoiceId && !voice.voiceId && !opts.allowEnvVoiceId) {
      const hint = spec.knownVoices ? ` Known voices: ${spec.knownVoices.join(", ")}.` : "";
      E(
        `voice.voiceId is required for provider "${provider}" — otherwise the render ` +
          `depends on whatever TTS_VOICE_ID happens to be set, which is not reproducible.${hint}`,
      );
    }
    if (spec?.experimental)
      W(
        `voice.provider "${provider}" is experimental — its request format is a best guess ` +
          `from thin public docs. Verify with: node scripts/video/tts-check.mjs`,
      );

    const sp = voice.speed ?? 1.0;
    if (typeof sp !== "number" || sp < 0.5 || sp > 2.0)
      E(`voice.speed must be a number in 0.5–2.0, got ${JSON.stringify(voice.speed)}`);
  }

  // ── scenes ───────────────────────────────────────────────────────────────
  const scenes = script.scenes;
  if (!Array.isArray(scenes) || scenes.length === 0) {
    return { errors: [...errors, "scenes must be a non-empty array"], warnings, stats: {} };
  }
  if (scenes.length < 3) E(`scenes must have at least 3 entries, got ${scenes.length}`);
  if (scenes.length > cfg.maxScenes)
    E(`scenes must have at most ${cfg.maxScenes} entries, got ${scenes.length}`);
  if (scenes[0]?.type !== "hook") E(`scenes[0].type must be "hook", got ${JSON.stringify(scenes[0]?.type)}`);
  if (scenes.at(-1)?.type !== "outro")
    E(`last scene .type must be "outro", got ${JSON.stringify(scenes.at(-1)?.type)}`);

  const seenIds = new Set();
  const templateUse = new Map();
  let totalWords = 0;
  const providerMaxChars = PROVIDER_SPECS[script.voice?.provider ?? "omnivoice"]?.maxChars ?? 0;

  scenes.forEach((scene, i) => {
    const at = `scenes[${i}]`;
    if (!isObj(scene)) {
      E(`${at} must be an object`);
      return;
    }
    const id = scene.id;
    const label = id ? `scene "${id}"` : at;

    if (!id || typeof id !== "string") E(`${at}.id is required (a short string)`);
    else if (seenIds.has(id)) E(`${at}.id "${id}" is duplicated — scene ids must be unique`);
    else seenIds.add(id);

    if (!SCENE_TYPES.includes(scene.type))
      E(`${label}.type must be one of ${SCENE_TYPES.join(" | ")}, got ${JSON.stringify(scene.type)}`);

    if (!scene.templateId || typeof scene.templateId !== "string") {
      E(`${label}.templateId is required`);
    } else if (known.length && !known.includes(scene.templateId)) {
      E(
        `${label}.templateId "${scene.templateId}" does not exist. ` +
          `Available: ${known.join(", ")}`,
      );
    }
    if (scene.templateId)
      templateUse.set(scene.templateId, (templateUse.get(scene.templateId) ?? 0) + 1);

    if (scene.inputs !== undefined && !isObj(scene.inputs))
      E(`${label}.inputs must be an object of text slots`);

    // ── inputs keys vs the template's actual slots ───────────────────────
    // A key the template does not read is not a harmless extra: hyperframes REPLACES the
    // template's defaults with whatever `inputs` contains, so every slot the template does read
    // arrives `undefined`, "empty slot removes its element" fires, and the scene renders BLANK.
    // No error anywhere — ffprobe reports a valid clip and the pipeline reports success.
    //
    // Two published episodes shipped with five blank scenes each before a human noticed. The
    // giveaway was byte-identical clips across two unrelated videos: an empty frame is
    // deterministic. This check is what turns that ten-minute silent failure into a two-second
    // error, so it is worth an error rather than a warning.
    if (isObj(scene.inputs) && scene.templateId && (!known.length || known.includes(scene.templateId))) {
      const asp = script.aspect === "16:9" ? "16:9" : "9:16";
      const defaults = defaultInputs(scene.templateId, asp);
      const slots = declaredSlots(scene.templateId, asp);
      const passed = Object.keys(scene.inputs);
      if (slots.length && passed.length) {
        const unknown = passed.filter((k) => !slots.includes(k));
        for (const k of unknown) {
          const near = nearestSlot(k, slots);
          E(
            `${label}.inputs has no slot "${k}" on "${scene.templateId}"` +
              (near ? `. Did you mean "${near}"?` : ".") +
              ` Slots: ${slots.join(", ")}`,
          );
        }
        // Every key wrong means nothing the template draws was supplied — a guaranteed blank
        // frame. Said separately because a list of five near-miss names does not make it
        // obvious that the outcome is an empty scene.
        if (unknown.length === passed.length) {
          E(
            `${label} supplies no slot "${scene.templateId}" reads — it will render BLANK. ` +
              `Look them up: node scripts/video/template-sheet.mjs --slots ${scene.templateId}`,
          );
        }
        // A template whose default is an array reads it with Array.isArray and drops anything
        // else on the floor. frame-bold-poster.headline is the live example: a string there
        // renders an empty poster, silently.
        for (const [k, v] of Object.entries(scene.inputs)) {
          if (!(k in defaults)) continue;
          const wantArray = Array.isArray(defaults[k]);
          if (wantArray !== Array.isArray(v)) {
            E(
              `${label}.inputs.${k} must be ${wantArray ? "an array of lines" : "a string"} ` +
                `for "${scene.templateId}" — the template reads it with Array.isArray and ` +
                `ignores the other shape, which renders empty.`,
            );
          }
        }
      }
    }

    // ── media (B-roll / screenshot / meme / social / photo grid) ──────────
    // `media` is one object, or an array for a frame that shows several pictures at once.
    // Every entry then goes through exactly the same rules — the array form must not become
    // a way to skip the rights or fit checks below.
    if (scene.media !== undefined) {
      const entries = Array.isArray(scene.media) ? scene.media : [scene.media];

      if (Array.isArray(scene.media)) {
        if (scene.media.length === 0) {
          E(`${label}.media is an empty array — remove it, or give it at least one entry`);
        } else if (scene.media.length > MAX_MEDIA_PER_SCENE) {
          E(`${label}.media has ${scene.media.length} entries; at most ${MAX_MEDIA_PER_SCENE} fit a frame`);
        }
        if (scene.media.length > 1 && !MULTI_MEDIA_TEMPLATES.includes(scene.templateId)) {
          E(`${label} passes ${scene.media.length} media but "${scene.templateId}" draws only the first. ` +
            `Use one of: ${MULTI_MEDIA_TEMPLATES.join(", ")}.`);
        }
      }

      const clips = entries.filter((m) => isObj(m) && (m.kind ?? "video") === "video");
      if (clips.length > MAX_VIDEO_PER_SCENE) {
        E(`${label} asks for ${clips.length} clips in one frame; at most ${MAX_VIDEO_PER_SCENE} ` +
          `decodes in time. The rest render frozen — make them kind:"image".`);
      }

      const sceneLabel = label;
      entries.forEach((m, mi) => {
      // Name the slot when there are several, so "which of the four pictures" is answerable
      // from the message alone.
      const label = entries.length > 1 ? `${sceneLabel}[${mi + 1}]` : sceneLabel;
      if (!isObj(m)) {
        E(`${label}.media must be an object — {kind, source, query|id|url}`);
      } else {
        const kind = m.kind ?? "video";
        if (!["video", "image", "screenshot"].includes(kind))
          E(`${label}.media.kind must be video | image | screenshot, got ${JSON.stringify(m.kind)}`);
        // A clip anywhere but a full-frame background renders black, frozen, or flickering.
        // See VIDEO_SAFE_TEMPLATES for the measurements behind this.
        if (kind === "video" && !VIDEO_SAFE_TEMPLATES.includes(scene.templateId))
          E(`${label}.media.kind is "video" but ${scene.templateId} cannot play a clip — ` +
            `it renders black or frozen. Use kind:"image" (a still is taken from the clip ` +
            `automatically), or move this beat to: ${VIDEO_SAFE_TEMPLATES.join(", ")}.`);
        if (kind === "screenshot") {
          if (!m.url) E(`${label}.media needs a "url" when kind is "screenshot"`);
          else if (!/^https?:\/\//i.test(m.url)) E(`${label}.media.url must be http(s), got "${m.url}"`);
        } else if (!m.id && !m.query && !m.ref && !m.url) {
          E(`${label}.media needs one of id / query / ref / url`);
        }
        if (m.source && !SOURCE_IDS.includes(m.source))
          E(`${label}.media.source "${m.source}" is unknown. Known: ${SOURCE_IDS.join(" | ")}. ` +
            `Sites without an API go through "manual" — see docs/15-media-sources.md.`);

        // A meme's text runs to its own edges, and `fit` defaults to "cover" — which crops
        // it to fill the frame and takes the punchline with it. The damage is done in
        // normalizeImage, before the template can do anything about it, and the render
        // succeeds with a full frame so nothing downstream notices. Hence: say it out loud.
        if (m.source === "meme" && (m.fit ?? "cover") !== "contain") {
          E(`${label}.media is a meme, so it needs "fit": "contain". ` +
            `The default "cover" crops it to fill the frame and cuts the text off.`);
        }

        // Third-party footage has to say on what basis it is being used. Checked HERE, in
        // the step that costs seconds, rather than after a 3–5 minute render — and checked
        // at all because a clip whose provenance is nowhere is the one you cannot answer
        // for when a takedown arrives. See docs/15 and NOTICE.md §2f.
        if (m.source === "social") {
          if (!m.rights) {
            E(`${label}.media is a third-party clip and declares no "rights". ` +
              `Add one of: ${SOCIAL_RIGHTS.join(" | ")}. It is recorded in media-lock.json.`);
          } else if (!SOCIAL_RIGHTS.includes(m.rights)) {
            E(`${label}.media.rights "${m.rights}" is not one of: ${SOCIAL_RIGHTS.join(" | ")}.`);
          } else if (SOCIAL_RIGHTS_NEEDING_NOTE.includes(m.rights) && !String(m.rights_note ?? "").trim()) {
            E(`${label}.media.rights is "${m.rights}", which is a claim about someone else's ` +
              `permission — add "rights_note" naming who granted it and when.`);
          }
        }
        if (m.query && !m.id)
          W(`${label}.media uses a search query, so the first render picks the clip and pins it ` +
            `in media-lock.json. Commit that file, or the video is not reproducible elsewhere.`);
        if (kind !== "screenshot" && !MEDIA_TEMPLATES.includes(scene.templateId))
          W(`${label} has media but "${scene.templateId}" does not display it. ` +
            `Use one of: ${MEDIA_TEMPLATES.join(", ")}.`);
      }
      });
    }

    // A scene's transition describes how it ENTERS, so the first scene has
    // nothing to transition from — silently ignoring it would hide a mistake.
    if (scene.transition !== undefined) {
      if (!(scene.transition in TRANSITIONS))
        E(`${label}.transition must be one of ${Object.keys(TRANSITIONS).join(" | ")}, got ${JSON.stringify(scene.transition)}`);
      else if (i === 0) W(`${label}.transition has no effect — the first scene has nothing to transition from`);
    }

    if (scene.sfx !== undefined) {
      if (!isObj(scene.sfx) || !scene.sfx.name) E(`${label}.sfx must be {name, volume?, startOffsetSec?}`);
      else if (scene.sfx.volume !== undefined && (scene.sfx.volume < 0 || scene.sfx.volume > 1))
        E(`${label}.sfx.volume must be 0–1, got ${scene.sfx.volume}`);
    }

    // ── voiceText: the Vietnamese-TTS rules ────────────────────────────────
    const vt = scene.voiceText;
    if (!vt || typeof vt !== "string" || !vt.trim()) {
      E(`${label}.voiceText is required`);
      return;
    }
    const n = words(vt);
    totalWords += n;

    if (DIGITS.test(vt)) {
      const m = vt.match(/\S*\d\S*/g) ?? [];
      E(
        `${label}.voiceText contains digits — OmniVoice misreads them ` +
          `("GPT 5.5" → "năm rưỡi"). Spell them out in Vietnamese. Found: ${m.slice(0, 4).join(", ")} ` +
          `— in: "${quote(vt)}"`,
      );
    }
    if (EMOJI.test(vt))
      E(`${label}.voiceText contains an emoji/arrow — narration must be clean text. In: "${quote(vt)}"`);
    if (URL_RE.test(vt))
      E(`${label}.voiceText contains a URL — it would be read aloud. In: "${quote(vt)}"`);
    if (BANNED_SYMBOLS.test(vt)) {
      const m = vt.match(BANNED_SYMBOLS);
      E(`${label}.voiceText contains "${m[0]}" — write it as a Vietnamese word. In: "${quote(vt)}"`);
    }
    if (!/[.?!]\s*$/.test(vt.trim()))
      W(`${label}.voiceText should end with . or ? so TTS pauses naturally — "${quote(vt, 50)}"`);

    // Some providers cap a single request (Vbee: 300 chars). Catch it here rather than
    // three scenes into a render.
    if (providerMaxChars && vt.length > providerMaxChars) {
      E(
        `${label}.voiceText is ${vt.length} characters — provider "${script.voice?.provider}" ` +
          `accepts at most ${providerMaxChars} per request. Split this scene in two. In: "${quote(vt)}"`,
      );
    }

    if (scene.type === "body" && (n < cfg.bodyWordsMin || n > cfg.bodyWordsMax))
      W(
        `${label}.voiceText is ${n} words (target ${cfg.bodyWordsMin}–${cfg.bodyWordsMax}: one idea per ` +
          `scene, 6–10s on screen). Split it rather than cramming.`,
      );

    // ── inputs: emoji allowed, EXCEPT in char-by-char animated fields ──────
    const risky = CHAR_ANIMATED_FIELDS[scene.templateId] ?? [];
    for (const field of risky) {
      const v = scene.inputs?.[field];
      if (typeof v === "string" && EMOJI.test(v))
        E(
          `${label}.inputs.${field} contains an emoji. "${scene.templateId}" animates this field ` +
            `character-by-character — an emoji breaks the animation. Got: "${quote(v, 40)}"`,
        );
    }
  });

  // ── whole-script craft ───────────────────────────────────────────────────
  if (scenes.length < cfg.minScenes)
    W(
      `${scenes.length} scenes — aim for at least ${cfg.minScenes}. Keep total duration the same ` +
        `and cut it into more scenes; long scenes read as slow.`,
    );

  const estSec = Math.round(totalWords / 3);
  if (totalWords < cfg.totalWordsMin)
    W(`total narration is ${totalWords} words ≈ ${estSec}s — under ${cfg.totalWordsMin} words the piece ends before it lands.`);
  else if (totalWords > cfg.totalWordsMax)
    W(
      `total narration is ${totalWords} words ≈ ${estSec}s — that is past the ${Math.round(cfg.totalWordsMax / 3)}s ` +
        `mark where vertical feeds stop retaining. Split it into two videos.`,
    );
  else if (estSec > 180)
    W(`≈${estSec}s — over 3 minutes, YouTube will not treat this as a Short.`);

  const hook = scenes[0];
  if (hook?.templateId && !cfg.hookTemplates.includes(hook.templateId))
    W(`hook uses "${hook.templateId}"; designed openers are ${cfg.hookTemplates.join(" or ")}.`);

  const last = scenes.at(-1);
  if (last?.templateId && !cfg.outroTemplates.includes(last.templateId))
    W(`outro uses "${last.templateId}"; expected one of ${cfg.outroTemplates.join(" | ")}.`);

  for (const [tpl, count] of templateUse) {
    if (count > cfg.maxSameTemplate)
      W(`"${tpl}" is used ${count}× — vary body templates so the video doesn't look repetitive.`);
  }

  // A themed template that was never probed gets flipped on a guess. That renders — wrongly
  // and silently — so it is worth a warning while it still costs nothing to fix.
  if (theme) {
    const entry = aspect === "16:9" ? "index.html" : "compositions/portrait.html";
    const map = loadThemeMap();
    const unmeasured = [...templateUse.keys()].filter((t) => !map[`${t}/${entry}`]);
    if (unmeasured.length)
      W(
        `theme is set but ${unmeasured.join(", ")} ${unmeasured.length > 1 ? "are" : "is"} ` +
          `not in theme-map.json — the light/dark flip will be guessed. ` +
          `Fix: node scripts/video/theme-probe.mjs`,
      );
  }

  return {
    errors,
    warnings,
    stats: {
      scenes: scenes.length,
      totalWords,
      estSec: Math.round(totalWords / 3),
      templates: Object.fromEntries(templateUse),
      aspect,
      theme: theme?.id ?? null,
    },
  };
}
