// validate-post.mjs — check post text is plain text before it reaches a social platform.
//   node scripts/social/validate-post.mjs <post.json>
//   node scripts/social/validate-post.mjs <post.json> --strict   # warnings fail too
//   node scripts/social/validate-post.mjs <post.json> --json     # machine-readable report
//   node scripts/social/validate-post.mjs <post.json> --fix      # write a cleaned copy
//   node scripts/social/validate-post.mjs --text caption.txt     # check a bare .txt file
//
// Captions render no Markdown. A heading arrives as "### Heading", bold keeps its
// asterisks, and a metadata block meant for the CMS becomes the first thing anyone reads.
// Every issue quotes the offending text.
//
// ENV: none.
// Exit 0 = publishable. Exit 1 = errors (or, with --strict, any warning).
import fs from "node:fs";
import { validatePost, stripLeaks, READER_FIELDS } from "./lib/clean-text.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `validate-post.mjs — check post text is plain text before publishing\n` +
      `  <post.json>         payload with {title, post, comment}\n` +
      `  --text <file.txt>   check a bare caption file instead\n` +
      `  --strict            ambiguous warnings fail the run too (default: errors only)\n` +
      `  --json              print a JSON report instead of text\n` +
      `  --fix               write <file>.clean.<ext> with the markup stripped\n` +
      `env: none`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}

const flag = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const strict = argv.includes("--strict");
const asJson = argv.includes("--json");
const fix = argv.includes("--fix");

const textFile = flag("--text");
const jsonFile = argv.find((a) => a.endsWith(".json") && !a.startsWith("--"));
const file = textFile || jsonFile;

if (!file) throw new Error("Pass a post .json path, or --text <file.txt>.");
if (!fs.existsSync(file)) throw new Error(`Not found: ${file}`);

let payload;
if (textFile) {
  payload = { post: fs.readFileSync(textFile, "utf8") };
} else {
  try {
    payload = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`[social] ✗ ${file} is not valid JSON: ${e.message}`);
    process.exit(1);
  }
}

const { errors, warnings, stats } = validatePost(payload);

if (asJson) {
  console.log(JSON.stringify({ file, ok: errors.length === 0, errors, warnings, stats }, null, 2));
} else {
  for (const w of warnings) console.warn(`[social] ! ${w}`);
  for (const e of errors) console.error(`[social] ✗ ${e}`);
  if (errors.length === 0) {
    console.log(
      `[social] ✓ ${file} is plain text — ${stats.words} words, ${stats.chars} chars` +
        (warnings.length ? `, ${warnings.length} warning(s)` : ""),
    );
  } else {
    console.error(`[social] ✗ ${errors.length} error(s), ${warnings.length} warning(s) — do not publish as is.`);
  }
}

if (fix) {
  // Never overwrite the original. The stripper is best-effort and the writer has to be
  // able to see exactly what it changed before trusting it.
  const dot = file.lastIndexOf(".");
  const out = `${file.slice(0, dot)}.clean${file.slice(dot)}`;
  if (textFile) {
    fs.writeFileSync(out, stripLeaks(payload.post), "utf8");
  } else {
    const cleaned = { ...payload };
    for (const f of READER_FIELDS) if (typeof cleaned[f] === "string") cleaned[f] = stripLeaks(cleaned[f]);
    fs.writeFileSync(out, JSON.stringify(cleaned, null, 2) + "\n", "utf8");
  }
  console.log(`[social] ✓ cleaned copy → ${out}  (diff it before using — nothing was overwritten)`);
}

process.exit(errors.length > 0 || (strict && warnings.length > 0) ? 1 : 0);
