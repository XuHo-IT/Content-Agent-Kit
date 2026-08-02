// stock-search.mjs — find candidate B-roll clips before committing one to a scene.
//   node scripts/media/stock-search.mjs --query "data center servers"
//   node scripts/media/stock-search.mjs --source pixabay --query "neural network" --json
//   node scripts/media/stock-search.mjs --sources          # which sources are configured
//
// Prints candidates so you (or the agent) can pick an id, then pin it in script.json:
//   "media": { "kind":"video", "source":"pexels", "id":"5377697" }
// A pinned id is reproducible; a bare `query` gets resolved once and written to media-lock.json.
//
// ENV: PEXELS_API_KEY, PIXABAY_API_KEY, STOCK_SOURCE, STOCK_MIN_DURATION
import { getSource, sourceStatus, SOURCE_IDS } from "./lib/sources/index.mjs";
import { optionalEnv } from "../lib/env.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `stock-search.mjs — list candidate stock clips\n` +
      `  --query "<text>"     what to look for (describe the PICTURE, not the concept)\n` +
      `  --source <id>        ${SOURCE_IDS.join(" | ")}   (default $STOCK_SOURCE or pexels)\n` +
      `  --orientation <o>    portrait | landscape | square   (Pexels only)\n` +
      `  --min-duration <n>   seconds (default $STOCK_MIN_DURATION or 4)\n` +
      `  --limit <n>          how many to show (default 8)\n` +
      `  --json               machine-readable output\n` +
      `  --sources            show which sources have keys, then exit\n` +
      `env: PEXELS_API_KEY, PIXABAY_API_KEY, STOCK_SOURCE, STOCK_MIN_DURATION`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

/**
 * What the clip actually shows. Pexels puts a human-written title in its page slug
 * ("/video/codes-on-computer-screen-5377697/"); Pixabay and the manual list carry tags.
 */
function describe(c) {
  if (c.tags) return String(c.tags).split(",").slice(0, 5).join(", ").trim();
  const m = String(c.pageUrl || "").match(/\/video\/([a-z0-9-]+?)-\d+\/?$/i);
  return m ? m[1].replace(/-/g, " ") : "";
}

if (argv.includes("--sources")) {
  console.log(`[media] stock sources:\n`);
  for (const s of sourceStatus()) {
    console.log(
      `  ${s.id.padEnd(9)} ${(s.ready ? "ready" : "NO KEY").padEnd(7)} ` +
        `${s.keyEnv.length ? s.keyEnv[0] : "(no key needed)"}   ${s.license}`,
    );
  }
  console.log(
    `\n  Sites with no public API (Mixkit, Videezy, Videvo, Coverr, Lifecoach) go through\n` +
      `  "manual": download the clip yourself and list it in stock-sources.yaml.\n` +
      `  See docs/15-media-sources.md.`,
  );
  process.exit(0);
}

try {
  const query = flag("--query");
  if (!query) throw new Error(`Pass --query "<what the picture shows>".`);

  const src = getSource(flag("--source"));
  const minDuration = Number(flag("--min-duration", optionalEnv("STOCK_MIN_DURATION", "4")));
  const limit = Number(flag("--limit", "8"));

  const results = await src.search(query, {
    orientation: flag("--orientation", "portrait"),
    perPage: limit,
    minDuration,
  });

  if (argv.includes("--json")) {
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  }

  if (results.length === 0) {
    console.log(`[media] no results for "${query}" on ${src.id}. Try a more literal phrase.`);
    process.exit(0);
  }

  console.log(`[media] ${results.length} candidate(s) on ${src.label} for "${query}":\n`);
  for (const c of results) {
    const short = Math.min(c.width, c.height);
    console.log(
      `  ${String(c.id).padEnd(12)} ${String(c.width + "x" + c.height).padEnd(11)} ` +
        `${String(c.duration + "s").padEnd(5)}${short < 1080 ? "⚠ upscale " : "          "}` +
        // WHAT IS ACTUALLY IN THE CLIP. Search relevance on stock sites is loose — a query
        // for "breaking news screen" happily returns a cup of coffee. Nobody can see the
        // footage from here, so the contributor's own description is the only signal, and
        // picking an id without reading it produces off-topic B-roll.
        `${describe(c) || "(no description)"}`,
    );
  }
  console.log(
    `\n  Pin one in script.json:  "media": { "kind":"video", "source":"${src.id}", "id":"${results[0].id}" }`,
  );
} catch (e) {
  console.error(`[media] ✗ ${e.message}`);
  process.exit(1);
}
