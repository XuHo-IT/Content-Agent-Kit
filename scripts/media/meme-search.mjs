// meme-search.mjs — find a meme template, then render one and LOOK at it.
//   node scripts/media/meme-search.mjs --query drake
//   node scripts/media/meme-search.mjs --render "drake|Viết tay|Dùng agent" --out /tmp/m.png
//   node scripts/media/meme-search.mjs --query cat --json
//
// Free, keyless (memegen.link, MIT, ~400 templates).
//
// `--render` exists because the one thing that goes wrong here is invisible to every test:
// memegen fits text to ONE line inside the template's box, and a line that wraps has its
// second half clipped away. How much fits depends on that template's box width — `drake`
// splits into two half-width panels and wraps at about 15 Vietnamese characters, while
// `afraid` takes 23 on one line. So there is no number to look up. Render it and look.
//
// ENV: MEME_API_BASE (default https://api.memegen.link), MEME_FONT (default notosans)
import fs from "node:fs";
import path from "node:path";
import { templates, renderUrl, parseSpec } from "./lib/sources/meme.mjs";
import { optionalEnv } from "../lib/env.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `meme-search.mjs — browse memegen.link templates and preview one\n` +
      `  --query "<text>"     match a name, keyword or example\n` +
      `  --limit <n>          how many to show (default 12)\n` +
      `  --render "<spec>"    "<template>|<line one>|<line two>" — build it\n` +
      `  --out <file.png>     where --render writes (default ./meme-preview.png)\n` +
      `  --gif                render animated (.gif) — pair with "kind":"video"\n` +
      `  --font <id>          impact | notosans | titilliumweb | kalam | segoe …\n` +
      `  --json               machine-readable output\n` +
      `env: MEME_API_BASE, MEME_FONT (default notosans)\n` +
      `\n` +
      `  ⚠️ The default font is notosans, NOT the site's impact: Impact has no Vietnamese\n` +
      `     diacritics, so "Viết bước đầu" renders as "VI T B C Đ U" and still returns 200.`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

try {
  const spec = flag("--render");

  if (spec) {
    const { template, text } = parseSpec(spec);
    const ext = argv.includes("--gif") ? "gif" : "png";
    const out = path.resolve(flag("--out", `meme-preview.${ext}`));
    const url = await renderUrl(spec, { extension: ext, fontId: flag("--font") });

    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`render failed: HTTP ${res.status} for ${url}`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));

    console.log(`[meme] template : ${template}`);
    text.forEach((t, i) => console.log(`[meme] line ${i + 1}   : ${t}  (${t.length} chars)`));
    console.log(`[meme] font     : ${flag("--font", optionalEnv("MEME_FONT", "notosans"))}`);
    console.log(`[meme] url      : ${url}`);
    console.log(`[meme] ✓ ${out}`);
    console.log(
      `\n  OPEN IT. Check every line sits on ONE line — a wrapped line gets its second half\n` +
        `  clipped by the template's text box, and check the diacritics actually rendered.\n\n` +
        // `fit` is part of the snippet because the validator requires it and the default
        // (cover) crops the punchline off. A copy-paste line that fails validation is worse
        // than no line at all.
        `  "media": { "kind":"${ext === "gif" ? "video" : "image"}", "source":"meme", ` +
        `"id":"${spec}", "fit":"contain" }`,
    );
    console.log(`MEME=${out}`);
    process.exit(0);
  }

  const query = flag("--query", "");
  const limit = Number(flag("--limit", "12"));
  const found = await templates(query);

  if (argv.includes("--json")) {
    console.log(JSON.stringify(found.slice(0, limit), null, 2));
    process.exit(0);
  }

  if (found.length === 0) {
    console.log(`[meme] no template matches "${query}". Try a broader word, or --query "" for all.`);
    process.exit(0);
  }

  console.log(`[meme] ${found.length} template(s)${query ? ` matching "${query}"` : ""}:\n`);
  for (const t of found.slice(0, limit)) {
    console.log(
      `  ${String(t.id).padEnd(22)} ${String(t.lines + " line" + (t.lines === 1 ? "" : "s")).padEnd(8)} ${t.name}`,
    );
    if (t.keywords?.length) console.log(`  ${" ".repeat(22)} ${t.keywords.join(", ")}`);
  }
  if (found.length > limit) console.log(`  … and ${found.length - limit} more`);

  const first = found[0];
  console.log(
    `\n  Preview one before committing to it:\n` +
      `    node scripts/media/meme-search.mjs --render "${first.id}|dòng một|dòng hai" --out /tmp/m.png`,
  );
} catch (e) {
  console.error(`[meme] ✗ ${e.message}`);
  process.exit(1);
}
