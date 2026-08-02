// validate-script.mjs — check a video script.json before rendering it.
//   node scripts/video/validate-script.mjs <script.json>
//   node scripts/video/validate-script.mjs <script.json> --strict   # warnings fail too
//   node scripts/video/validate-script.mjs <script.json> --json     # machine-readable report
//
// Checks the schema (renderer, scene shape, template existence) AND the craft
// rules: Vietnamese TTS number spelling, clean narration, scene pacing, template
// variety. Every issue quotes the offending text.
//
// ENV: VIDEO_TEMPLATES_DIR (optional).
// Exit 0 = renderable. Exit 1 = errors (or, with --strict, any warning).
import fs from "node:fs";
import { validateScript } from "./lib/validate.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `validate-script.mjs — check a video script.json before rendering\n` +
      `  <script.json>       the script to check\n` +
      `  --strict            craft warnings fail the run too (default: errors only)\n` +
      `  --json              print a JSON report instead of text\n` +
      `env: VIDEO_TEMPLATES_DIR (optional — defaults to <kit>/video-templates)`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}

const file = argv.find((a) => a.endsWith(".json") && !a.startsWith("--"));
if (!file) throw new Error("Pass a script.json path.");
if (!fs.existsSync(file)) throw new Error(`Script not found: ${file}`);

const strict = argv.includes("--strict");
const asJson = argv.includes("--json");

let parsed;
try {
  parsed = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (e) {
  console.error(`[video] ✗ ${file} is not valid JSON: ${e.message}`);
  process.exit(1);
}

const { errors, warnings, stats } = validateScript(parsed);

if (asJson) {
  console.log(JSON.stringify({ file, ok: errors.length === 0, errors, warnings, stats }, null, 2));
} else {
  for (const w of warnings) console.warn(`[video] ! ${w}`);
  for (const e of errors) console.error(`[video] ✗ ${e}`);
  if (errors.length === 0) {
    console.log(
      `[video] ✓ ${file} valid — ${stats.scenes} scenes, ${stats.totalWords} words ` +
        `(≈${stats.estSec}s), ${stats.aspect}` +
        (warnings.length ? `, ${warnings.length} warning(s)` : ""),
    );
  } else {
    console.error(`[video] ✗ ${errors.length} error(s), ${warnings.length} warning(s) — not renderable.`);
  }
}

process.exit(errors.length > 0 || (strict && warnings.length > 0) ? 1 : 0);
