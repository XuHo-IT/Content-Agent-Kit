#!/usr/bin/env node
// font-check.mjs — does every Google Font a template loads actually carry Vietnamese glyphs?
//
//   node scripts/video/font-check.mjs            # live check against fonts.googleapis.com
//   node scripts/video/font-check.mjs --offline  # denylist only, no network (what CI runs)
//
// WHY THIS EXISTS. A font without the `vietnamese` subset does not fail — the browser quietly
// draws "Ạ", "ữ", "ộ" from a fallback face, so a headline in Cinzel comes out as a patchwork of
// two typefaces with the diacritics sitting at the wrong height. Nothing errors, the render
// "works", and the frame looks broken to every Vietnamese viewer. Four families did exactly
// that across 12 templates before this check existed (Cinzel, Caveat, Fira Code, and Cabinet
// Grotesk — which is not on Google Fonts at all, so its <link> silently loaded nothing).
//
// A second, nastier trap: css2 answers 400 for the WHOLE request if one family is asked for a
// weight it does not have. One bad `wght@900` and every font in that <link> is gone.
// The live mode reports the HTTP status per <link> for that reason.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const VT = path.join(KIT, "video-templates");

/** Families verified to have no `vietnamese` subset (or not to exist on Google Fonts). */
export const NO_VIETNAMESE = new Map([
  ["Cinzel", "Cormorant SC"],
  ["Cinzel Decorative", "Cormorant SC"],
  ["Caveat", "Patrick Hand"],
  ["Fira Code", "Roboto Mono"],
  // Google lists a "vietnamese" subset for both, but neither draws the horn (ư ơ) or ặ/ợ — a
  // render shows those letters in a fallback serif mid-word. Rendered and compared 2026-11-10.
  ["JetBrains Mono", "Roboto Mono"],
  ["IBM Plex Mono", "Roboto Mono"],
  ["Cabinet Grotesk", "Bricolage Grotesque"], // Fontshare, not Google — the <link> loads nothing
  ["Syne", "Unbounded"],
  ["Bebas Neue", "Anton"],
  ["Impact", "Anton"], // a system font: no Vietnamese on most machines, none on Linux CI
  ["Bodoni Moda", "Playfair Display"],
]);

/** Every Google Fonts css2 URL in one HTML string, entity-decoded. */
export function fontUrls(html) {
  return [...String(html).matchAll(/https:\/\/fonts\.googleapis\.com\/css2\?[^"'\s>]+/g)].map((m) =>
    m[0].replace(/&amp;/g, "&"),
  );
}

/** "family=Plus+Jakarta+Sans:wght@700&family=Inter" → ["Plus Jakarta Sans", "Inter"] */
export function familiesIn(url) {
  return [...String(url).matchAll(/family=([^:&]+)/g)].map((m) => decodeURIComponent(m[1].replace(/\+/g, " ")));
}

/** Families named in CSS `font-family:` declarations (quoted names only — generics are fine). */
export function cssFamilies(html) {
  const out = new Set();
  for (const m of String(html).matchAll(/font-family\s*:\s*([^;}"]*(?:"[^"]*"[^;}"]*)*)/g)) {
    for (const q of m[1].matchAll(/["']([^"']+)["']/g)) out.add(q[1].trim());
  }
  return [...out];
}

/** Offline check — returns [{file, family, use}] for every denylisted family a template uses. */
export function offlineProblems(dir = VT) {
  const problems = [];
  for (const id of fs.readdirSync(dir)) {
    for (const rel of ["index.html", "compositions/portrait.html"]) {
      const f = path.join(dir, id, rel);
      if (!fs.existsSync(f)) continue;
      const html = fs.readFileSync(f, "utf8");
      const used = new Set([...fontUrls(html).flatMap(familiesIn), ...cssFamilies(html)]);
      for (const fam of used) {
        if (NO_VIETNAMESE.has(fam)) problems.push({ file: `${id}/${rel}`, family: fam, use: NO_VIETNAMESE.get(fam) });
      }
    }
  }
  return problems;
}

async function live() {
  // A desktop Chrome UA is required: without it css2 serves one TTF per family and drops the
  // `/* vietnamese */` subset comments this check reads.
  const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
  const urls = new Map(); // url → [files]
  for (const id of fs.readdirSync(VT)) {
    for (const rel of ["index.html", "compositions/portrait.html"]) {
      const f = path.join(VT, id, rel);
      if (!fs.existsSync(f)) continue;
      for (const u of fontUrls(fs.readFileSync(f, "utf8"))) urls.set(u, [...(urls.get(u) ?? []), `${id}/${rel}`]);
    }
  }
  const famCache = new Map();
  let bad = 0;
  for (const [u, files] of urls) {
    const r = await fetch(u, { headers: { "user-agent": UA } }).catch((e) => ({ ok: false, status: e.message }));
    if (!r.ok) {
      bad++;
      console.log(`✗ HTTP ${r.status} — the whole <link> loads nothing:\n    ${u}\n    used by ${files.join(", ")}`);
      continue;
    }
    for (const fam of familiesIn(u)) {
      if (famCache.has(fam)) continue;
      const one = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam).replace(/%20/g, "+")}`, {
        headers: { "user-agent": UA },
      });
      const css = one.ok ? await one.text() : "";
      famCache.set(fam, /vietnamese/.test(css));
      if (!famCache.get(fam)) {
        bad++;
        console.log(`✗ ${fam} has no vietnamese subset — used by ${files.join(", ")}`);
      }
    }
  }
  console.log(`[font-check] ${urls.size} font links, ${famCache.size} families, ${bad} problem(s)`);
  return bad;
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  const problems = offlineProblems();
  for (const p of problems) console.log(`✗ ${p.file}: "${p.family}" draws no Vietnamese diacritics — use "${p.use}"`);
  if (process.argv.includes("--offline")) {
    console.log(`[font-check] offline: ${problems.length} problem(s)`);
    process.exit(problems.length ? 1 : 0);
  }
  const bad = await live();
  process.exit(problems.length + bad ? 1 : 0);
}
