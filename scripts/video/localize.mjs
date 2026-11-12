#!/usr/bin/env node
// localize.mjs — make another-language version of a video script, safely.
//
//   node scripts/video/localize.mjs script.json --to en                 # 1. strings to translate
//   (fill "translation" in script.en.strings.json — the agent does this)
//   node scripts/video/localize.mjs script.json --to en --apply         # 2. check + write en/script.json
//   node scripts/video/validate-script.mjs en/script.json --strict      # 3. as always
//   node scripts/video/render.mjs en/script.json                        #    renders into en/, original untouched
//
// Step 1 lists every spoken and on-screen string with the character limit of the slot it goes
// in (from CATALOG.md). Step 2 refuses while a string is untranslated or over its limit — a
// clipped headline is found here in a second, not in a 4-minute render — and switches the
// voice to the language: Google (default) or Azure pick a default voice per language;
// --voice-id chooses one; ElevenLabs keeps its multilingual voice.
//
// ENV: none. The render needs the chosen provider's key (GOOGLE_TTS_API_KEY / AZURE_SPEECH_*).
import fs from "node:fs";
import path from "node:path";
import { extractStrings, applyStrings, checkStrings, VOICES } from "./lib/localize.mjs";

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("--help")) {
  console.log(
    `localize.mjs — another-language version of a script.json\n` +
      `  <script.json> --to <lang>      lang code: en, ja, ko, th, zh, id, fr, es, de…\n` +
      `  (no --apply)                   write <script>.<lang>.strings.json to translate\n` +
      `  --apply                        check translations, write <dir>/<lang>/script.json\n` +
      `  --provider google|azure|elevenlabs   voice for the new language (default google)\n` +
      `  --voice-id <id>                a specific voice instead of the default\n` +
      `  --strings <file>               strings file, if not the default name\n` +
      `default voices: google ${Object.keys(VOICES.google).join(",")} · azure ${Object.keys(VOICES.azure).join(",")}`,
  );
  process.exit(argv.length ? 0 : 1);
}
const VALUE = new Set(["--to", "--provider", "--voice-id", "--strings"]);
const flag = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const src = argv.find((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
const lang = flag("--to");
if (!src || !fs.existsSync(src) || !lang) {
  console.error(`[localize] ✗ need <script.json> and --to <lang>`);
  process.exit(1);
}
const base = src.replace(/\.json$/i, "");
const stringsFile = flag("--strings", `${base}.${lang}.strings.json`);
const script = JSON.parse(fs.readFileSync(src, "utf8"));

if (!argv.includes("--apply")) {
  const fresh = extractStrings(script);
  // Keep translations already written, so re-running after a script edit does not wipe work.
  const prev = fs.existsSync(stringsFile) ? JSON.parse(fs.readFileSync(stringsFile, "utf8")).strings ?? [] : [];
  const done = new Map(prev.filter((p) => p.translation).map((p) => [`${p.key}\u0000${p.text}`, p.translation]));
  for (const s of fresh) s.translation = done.get(`${s.key}\u0000${s.text}`) ?? "";
  fs.writeFileSync(stringsFile, JSON.stringify({
    _how: `Fill every "translation" in ${lang}. Respect "max" (characters on screen). Keep numbers, prices and names exact; spoken text in voiceText, no emoji. Then: node scripts/video/localize.mjs ${src} --to ${lang} --apply`,
    lang, strings: fresh,
  }, null, 2));
  const todo = fresh.filter((s) => !s.translation).length;
  console.log(`[localize] ✓ ${stringsFile} — ${fresh.length} strings, ${todo} to translate`);
  process.exit(0);
}

if (!fs.existsSync(stringsFile)) {
  console.error(`[localize] ✗ ${stringsFile} not found — run without --apply first`);
  process.exit(1);
}
const strings = JSON.parse(fs.readFileSync(stringsFile, "utf8")).strings ?? [];
const { errors, warnings } = checkStrings(strings);
for (const w of warnings) console.warn(`[localize] ! ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`[localize] ✗ ${e}`);
  console.error(`[localize] ✗ ${errors.length} problem(s) — fix them in ${stringsFile}; nothing written.`);
  process.exit(1);
}
const provider = flag("--provider", "google");
const out = applyStrings(script, strings, { lang, provider, voiceId: flag("--voice-id") });
// Its own folder: render.mjs writes video.mp4 beside the script, so a sibling file would
// overwrite the original video.
const outDir = path.join(path.dirname(path.resolve(src)), lang);
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "script.json");
fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
console.log(`[localize] ✓ ${outFile} — voice ${out.voice.provider}${out.voice.voiceId ? ` / ${out.voice.voiceId}` : ""}`);
console.log(`[localize]   next: node scripts/video/validate-script.mjs ${outFile} --strict && node scripts/video/render.mjs ${outFile}`);
