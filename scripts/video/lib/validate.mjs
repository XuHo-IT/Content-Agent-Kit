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
  // Either the designed opener, or footage with the hook line over it.
  hookTemplates: ["frame-liquid-bg-hero", "frame-broll"],
  outroTemplates: ["frame-logo-outro", "frame-statement-outro"],
};

/** Fields animated character-by-character — emoji there shatters the animation. */
const CHAR_ANIMATED_FIELDS = { "frame-build-minimal": ["hero"] };

/** Templates that actually show a resolved clip/still. Anything else silently ignores it. */
const MEDIA_TEMPLATES = ["frame-broll", "frame-media-inset", "frame-screenshot"];

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

    // ── media (B-roll / screenshot) ────────────────────────────────────────
    if (scene.media !== undefined) {
      const m = scene.media;
      if (!isObj(m)) {
        E(`${label}.media must be an object — {kind, source, query|id|url}`);
      } else {
        const kind = m.kind ?? "video";
        if (!["video", "image", "screenshot"].includes(kind))
          E(`${label}.media.kind must be video | image | screenshot, got ${JSON.stringify(m.kind)}`);
        if (kind === "screenshot") {
          if (!m.url) E(`${label}.media needs a "url" when kind is "screenshot"`);
          else if (!/^https?:\/\//i.test(m.url)) E(`${label}.media.url must be http(s), got "${m.url}"`);
        } else if (!m.id && !m.query && !m.ref && !m.url) {
          E(`${label}.media needs one of id / query / ref / url`);
        }
        if (m.source && !SOURCE_IDS.includes(m.source))
          E(`${label}.media.source "${m.source}" is unknown. Known: ${SOURCE_IDS.join(" | ")}. ` +
            `Sites without an API go through "manual" — see docs/15-media-sources.md.`);
        if (m.query && !m.id)
          W(`${label}.media uses a search query, so the first render picks the clip and pins it ` +
            `in media-lock.json. Commit that file, or the video is not reproducible elsewhere.`);
        if (kind !== "screenshot" && !MEDIA_TEMPLATES.includes(scene.templateId))
          W(`${label} has media but "${scene.templateId}" does not display it. ` +
            `Use one of: ${MEDIA_TEMPLATES.join(", ")}.`);
      }
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

  return {
    errors,
    warnings,
    stats: {
      scenes: scenes.length,
      totalWords,
      estSec: Math.round(totalWords / 3),
      templates: Object.fromEntries(templateUse),
      aspect,
    },
  };
}
