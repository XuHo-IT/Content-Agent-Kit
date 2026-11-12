// localize.mjs — the mechanical half of putting a video into another language.
//
// Translating is the agent's job (or a human's). What goes wrong is everything around it:
// a translated headline 30% longer than the slot allows and clipped on screen, a slot that
// was never translated, a Vietnamese voice reading English. This module does those parts:
//
//   extractStrings(script)        → every reader-visible / spoken string, with its char limit
//   applyStrings(script, strings) → the translated script, voice switched to the language
//   checkStrings(strings)         → over-limit, untranslated, emoji-free — before any render
//
// Char limits come from video-templates/CATALOG.md (the `≤N` column), the same numbers the
// skill that writes script.json obeys.
import fs from "node:fs";
import path from "node:path";
import { KIT_ROOT } from "./paths.mjs";

/** Slots that are data, not words: ids, numbers, colours, flags, URLs, rows of `a:b`. */
const NON_TEXT = /^(media_kind|media_count|media_kinds|anchor|focus|step|steps|highlight|platform|theme|color|accent|value|number|percent|from|to|data|rows|layers|sources|url|image|logo|icon)$/;

let catalogCache = null;
/** template id → { slot → max chars } from CATALOG.md. */
export function catalogLimits(file = path.join(KIT_ROOT, "video-templates", "CATALOG.md")) {
  if (catalogCache && catalogCache.file === file) return catalogCache.map;
  const map = {};
  let cur = null;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const h = line.match(/^## (frame-[a-z0-9-]+)\s*$/);
    if (h) { cur = map[h[1]] = {}; continue; }
    if (!cur) continue;
    const row = line.match(/^\|\s*`([a-z0-9_]+)`\s*\|[^|]*\|\s*≤\s*(\d+)/);
    if (row) cur[row[1]] = Number(row[2]);
  }
  catalogCache = { file, map };
  return map;
}

const isText = (v) => typeof v === "string" && /\p{L}/u.test(v) && !/^(https?:|\.{0,2}\/|[A-Za-z]:\\)/.test(v);

/**
 * @returns {{key:string, text:string, max:number|null, translation:string}[]}
 * `key` is a path into the script ("scenes.2.inputs.headline"); `translation` starts empty.
 */
export function extractStrings(script, limits = catalogLimits()) {
  const out = [];
  const add = (key, text, max = null) => { if (isText(text)) out.push({ key, text, max, translation: "" }); };
  add("metadata.title", script.metadata?.title, 100);
  add("metadata.description", script.metadata?.description);
  (script.scenes ?? []).forEach((s, i) => {
    add(`scenes.${i}.voiceText`, s.voiceText);
    const lim = limits[s.templateId ?? s.template] ?? {};
    for (const [k, v] of Object.entries(s.inputs ?? {})) {
      if (NON_TEXT.test(k)) continue;
      add(`scenes.${i}.inputs.${k}`, v, lim[k] ?? null);
    }
  });
  return out;
}

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

/** Problems to fix before rendering: missing translations and text over the slot limit. */
export function checkStrings(strings) {
  const errors = [];
  const warnings = [];
  for (const s of strings) {
    const t = String(s.translation ?? "").trim();
    if (!t) { errors.push(`${s.key}: not translated`); continue; }
    if (s.max && [...t].length > s.max) errors.push(`${s.key}: ${[...t].length} chars, slot allows ${s.max} — "${t}"`);
    if (t === s.text.trim() && /\s/.test(t)) warnings.push(`${s.key}: identical to the source — translated, or left as is?`);
    if (s.key.endsWith("voiceText") && EMOJI.test(t)) errors.push(`${s.key}: emoji in narration — the voice reads it out`);
  }
  return { errors, warnings };
}

/** Default voice per language, for the providers that speak many languages. */
export const VOICES = {
  google: { en: "en-US-Neural2-F", ja: "ja-JP-Neural2-B", ko: "ko-KR-Neural2-A", th: "th-TH-Neural2-C", zh: "cmn-CN-Wavenet-A", id: "id-ID-Wavenet-A", fr: "fr-FR-Neural2-A", es: "es-ES-Neural2-A", de: "de-DE-Neural2-A", vi: "vi-VN-Neural2-A" },
  azure: { en: "en-US-AvaMultilingualNeural", ja: "ja-JP-NanamiNeural", ko: "ko-KR-SunHiNeural", th: "th-TH-PremwadeeNeural", zh: "zh-CN-XiaoxiaoNeural", id: "id-ID-GadisNeural", fr: "fr-FR-DeniseNeural", es: "es-ES-ElviraNeural", de: "de-DE-KatjaNeural", vi: "vi-VN-HoaiMyNeural" },
};

function setPath(obj, key, value) {
  const parts = key.split(".");
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) o = o[/^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i]];
  o[parts[parts.length - 1]] = value;
}

/**
 * The translated script. Voice: `provider` + that language's default voice, unless `voiceId`
 * is given. ElevenLabs keeps the script's voice id (its voices are multilingual).
 */
export function applyStrings(script, strings, { lang, provider = "google", voiceId } = {}) {
  const out = JSON.parse(JSON.stringify(script));
  for (const s of strings) if (String(s.translation ?? "").trim()) setPath(out, s.key, s.translation.trim());
  const base = String(lang).toLowerCase().split("-")[0];
  const voice = { ...(out.voice ?? {}), provider };
  if (voiceId) voice.voiceId = voiceId;
  else if (VOICES[provider]?.[base]) voice.voiceId = VOICES[provider][base];
  else if (provider !== "elevenlabs") delete voice.voiceId;
  out.voice = voice;
  out.language = lang;
  return out;
}
