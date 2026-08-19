// wp-fetch.mjs — pull NEW posts from a WordPress REST API into per-post source folders.
//
// For sites that expose /wp-json/. That covers most of the WordPress web, and it costs one
// GET per post instead of a headless browser: no crawl4ai, no Chromium, no Python, no queue
// API. Use crawl.py instead when the site has no REST API or you need the shared idea queue.
//
//   node scripts/crawl/wp-fetch.mjs --base https://example.com --category 93 --limit 2 \
//        --state truecrime_state.json --out brain/truecrime
//   node scripts/crawl/wp-fetch.mjs --base https://example.com --category 93 --limit 2 --dry-run
//   node scripts/crawl/wp-fetch.mjs --base https://example.com --categories        # list ids
//
// COPYRIGHT: what lands on disk is SOURCE MATERIAL for an agent to write from, not something
// to publish. `source.json` stays in a scratch/gitignored folder; the published piece is
// original text plus a credit and a link. See docs/10-crawl-discovery.md.
//
// Writes SOURCE=<dir> per picked post on stdout, the way render.mjs writes VIDEO= — so a
// caller can read the paths without parsing prose.
import fs from "node:fs";
import path from "node:path";
import { getJson } from "../lib/http.mjs";
import { readJson, writeJson } from "../lib/state.mjs";
import {
  canonicalImageUrl, cutAtByline, decodeEntities, firstSubtitle, htmlToText, isGated,
  pickImages, safeSlug, wordCount,
} from "./lib/wp.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `wp-fetch.mjs — pull new posts from a WordPress REST API\n` +
      `  --base <url>        site root, e.g. https://example.com   (required)\n` +
      `  --category <id|id,id>  only posts in these category ids\n` +
      `  --categories        list the site's category ids + names, then exit\n` +
      `  --slug <a,b>        take these exact posts by slug, ignoring --limit/--order\n` +
      `  --limit <n>         how many NEW posts to take            (default 2)\n` +
      `  --state <file>      dedup memory, {"fetchedIds":[…]}      (default wp-state.json)\n` +
      `  --out <dir>         parent dir for <slug>/source.json     (default ./sources)\n` +
      `  --order <asc|desc>  by date; asc = oldest first           (default desc)\n` +
      `  --min-words <n>     skip stubs shorter than this          (default 150)\n` +
      `  --max-images <n>    images recorded per post              (default 6)\n` +
      `  --dry-run           print what it would take; write nothing`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const dryRun = argv.includes("--dry-run");

const base = String(flag("--base", "")).replace(/\/+$/, "");
if (!/^https?:\/\//i.test(base)) {
  console.error(`[wp] ✗ --base must be a full site URL, e.g. --base https://example.com`);
  process.exit(1);
}
const api = `${base}/wp-json/wp/v2`;
const category = flag("--category", "");
// Naming the posts you want is the difference between "give me two articles" and "give me the
// article about X". Picking by hand matters when the last one had to be dropped on review:
// without this the only way back to a specific piece is to page through the list burning
// state ids on articles nobody asked for.
const slugs = String(flag("--slug", "")).split(",").map((s) => s.trim()).filter(Boolean);
const limit = slugs.length || Number(flag("--limit", "2"));
const stateFile = flag("--state", "wp-state.json");
const outDir = flag("--out", "sources");
const order = flag("--order", "desc") === "asc" ? "asc" : "desc";
const minWords = Number(flag("--min-words", "150"));
const maxImages = Number(flag("--max-images", "6"));

// Politeness, not rate-limit avoidance: nothing here is time-critical, and a daily run takes
// a handful of requests. One per second keeps a small WordPress host comfortable.
const PAUSE_MS = 1000;
const UA = "content-agent-kit/wp-fetch (+https://github.com/; daily content agent)";
const PAGE_SIZE = 20;
const MAX_PAGES = 20;
const FIELDS = "id,slug,link,date,title,excerpt,content,featured_media,categories";

const pause = () => new Promise((r) => setTimeout(r, PAUSE_MS));

async function api_(pathAndQuery) {
  const url = `${api}${pathAndQuery}`;
  const { ok, status, json, text } = await getJson(url, { headers: { "User-Agent": UA } });
  if (!ok) throw new Error(`GET ${url} → ${status}: ${text.slice(0, 200)}`);
  if (json == null) throw new Error(`GET ${url} → not JSON (is /wp-json/ enabled?)`);
  return json;
}

// ── --categories: the discovery step you run once ───────────────────────────
// Category ids are what --category takes, and they are not guessable from the site. Printing
// them beats reading somebody's HTML for a number.
async function listCategories() {
  const cats = await api_(
    `/categories?per_page=100&orderby=count&order=desc&_fields=id,name,slug,count`,
  );
  for (const c of cats) {
    console.log(`${String(c.id).padStart(5)}  ${String(c.count).padStart(5)}  ${c.name}  (${c.slug})`);
  }
  console.log(`\n[wp] ${cats.length} categories on ${base}`);
}

async function fetchPosts() {
  // ── state: dedup by post id ───────────────────────────────────────────────
  // By ID, never by title. This kit has a history file that dedups by title and it has
  // already let a duplicate through when the same piece was published under a second name —
  // see docs/04-state-and-dedup.md. A WordPress post id is stable and unique; use it.
  const state = readJson(stateFile, {});
  if (!Array.isArray(state.fetchedIds)) state.fetchedIds = [];
  const known = new Set(state.fetchedIds.map(Number));

  const picked = [];
  let page = 1;
  let scanned = 0;
  let gated = 0;
  let short = 0;

  while (picked.length < limit && page <= MAX_PAGES) {
    const q =
      `/posts?per_page=${PAGE_SIZE}&page=${page}&orderby=date&order=${order}&_fields=${FIELDS}` +
      (category ? `&categories=${encodeURIComponent(category)}` : "") +
      (slugs.length ? `&slug=${encodeURIComponent(slugs.join(","))}` : "");
    let batch;
    try {
      batch = await api_(q);
    } catch (e) {
      // Asking for a page past the end is a 400, not an empty array. That is the end of the
      // list, not a failure worth exiting on.
      if (/→ 400/.test(e.message) && page > 1) break;
      throw e;
    }
    if (!Array.isArray(batch) || batch.length === 0) break;
    scanned += batch.length;

    for (const post of batch) {
      if (picked.length >= limit) break;
      if (known.has(Number(post.id))) continue;

      const title = decodeEntities(htmlToText(post?.title?.rendered));
      const body = cutAtByline(post?.content?.rendered || "");

      // Paywalled posts are not "free articles", whatever category they sit in. Skipping
      // them is the point of this filter, not a side effect: a gated body is the plugin's
      // upsell, and republishing somebody's paid content is the one outcome nobody wants.
      //
      // Check the CUT body, never the raw HTML. The related-posts widget lists gated cases
      // and renders their gate message inline, so a raw-HTML check marks every readable
      // article as paywalled — it reads as "the source is empty" while the source is fine.
      if (isGated(body)) {
        gated += 1;
        console.warn(`[wp] ! skip ${post.id} "${title}" — behind a membership gate`);
        continue;
      }

      const text = htmlToText(body);
      const words = wordCount(text);
      if (words < minWords) {
        short += 1;
        console.warn(`[wp] ! skip ${post.id} "${title}" — only ${words} words`);
        continue;
      }

      picked.push({
        post,
        record: {
          id: post.id,
          slug: post.slug || safeSlug(title, `post-${post.id}`),
          link: post.link,
          date: post.date,
          title,
          subtitle: firstSubtitle(body),
          excerpt: htmlToText(post?.excerpt?.rendered),
          words,
          text,
          images: pickImages(body, { max: maxImages }),
          categories: post.categories || [],
          fetchedAt: new Date().toISOString(),
          source: base,
        },
      });
    }
    if (batch.length < PAGE_SIZE) break;
    page += 1;
    await pause();
  }

  // Say out loud what was dropped. "no new posts" after silently discarding forty gated ones
  // reads as "the source is exhausted", which is a different problem with a different fix.
  const dropped = `${gated} gated, ${short} too short`;

  if (picked.length === 0) {
    console.log(
      `[wp] no usable new posts — scanned ${scanned}, ${known.size} already known, ${dropped}.`,
    );
    return;
  }

  // The featured image is the one an editor deliberately chose for the post, so it leads the
  // list. It is a separate request, so it only happens for posts that survived the filters.
  for (const { post, record } of picked) {
    if (!post.featured_media) continue;
    try {
      await pause();
      const m = await api_(`/media/${post.featured_media}?_fields=source_url,alt_text`);
      if (m?.source_url) {
        const featured = {
          url: canonicalImageUrl(m.source_url),
          alt: decodeEntities(m.alt_text || ""),
        };
        record.images = [featured, ...record.images.filter((i) => i.url !== featured.url)]
          .slice(0, maxImages);
      }
    } catch (e) {
      console.warn(`[wp] ! featured image for ${post.id}: ${e.message}`);
    }
  }

  if (dryRun) {
    for (const { record } of picked) {
      console.log(
        `  [${record.id}] ${record.title} — ${record.words} words, ${record.images.length} image(s)\n` +
          `        ${record.link}`,
      );
    }
    console.log(
      `[wp] ✓ dry-run — ${picked.length} new post(s) from ${scanned} scanned (${dropped});` +
        ` nothing written, state untouched`,
    );
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });
  for (const { record } of picked) {
    const dir = path.join(outDir, safeSlug(record.slug, `post-${record.id}`));
    fs.mkdirSync(dir, { recursive: true });
    writeJson(path.join(dir, "source.json"), record);
    state.fetchedIds.push(record.id);
    console.log(`SOURCE=${path.resolve(dir)}`);
    console.log(`[wp] ✓ ${record.title} — ${record.words} words, ${record.images.length} image(s)`);
  }
  writeJson(stateFile, state);
  console.log(
    `[wp] ✓ ${picked.length} new post(s) → ${outDir}; state → ${stateFile}` +
      ` (${scanned} scanned, ${dropped})`,
  );
}

// A finished run FALLS OFF THE END rather than calling process.exit(0). An explicit exit
// while a fetch's AbortSignal is still live aborts on Windows — libuv's
// `!(handle->flags & UV_HANDLE_CLOSING)` assertion, exit code 127, printed AFTER the output
// the caller wanted, so the command looks like it both worked and crashed. `make-post.mjs`
// carries the same note and the same shape. This is not a style choice; tidying it back into
// a top-level `exit` brings the crash back.
if (argv.includes("--categories")) await listCategories();
else await fetchPosts();
