#!/usr/bin/env node
// perf.mjs — how the posted videos did, and what that says about the next one.
//
//   node scripts/analytics/perf.mjs import tiktok-export.csv --platform tiktok
//   node scripts/analytics/perf.mjs import meta.csv --platform facebook
//   node scripts/analytics/perf.mjs youtube --channel UCxxxx --max 50        # needs YOUTUBE_API_KEY
//   node scripts/analytics/perf.mjs learn                                    # → brain/insights.md
//   node scripts/analytics/perf.mjs learn --metric completion
//
// IMPORT takes the CSV a creator can export without any API: TikTok Studio → Analytics →
// Export, Meta Business Suite → Insights → Export, YouTube Studio → Analytics → Export. Column
// names are matched by meaning, in English or Vietnamese (lib/perf.mjs#COLUMNS), so a renamed
// column still lands. Posts are stored in state/performance.json (this project's own record,
// gitignored); a re-import of the same post updates its numbers.
//
// LEARN joins every post to the video the kit made (brain/**/script.json, *.cuts.json — by
// title) and writes brain/insights.md + .json: which genre / length / hook shape / posting hour
// did better than this channel's own median — only where each side has ≥ 3 posts. The
// create-video, topic-radar and review-gate skills read it before planning.
//
// ENV: YOUTUBE_API_KEY (youtube only — a plain API key; public numbers, no OAuth).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { optionalEnv } from "../lib/env.mjs";
import { parseCsv, normaliseRows, mergePosts, matchPosts, featuresOf, insights, insightsMarkdown } from "./lib/perf.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STORE = path.join(KIT, "state", "performance.json");
const PLATFORMS = ["tiktok", "facebook", "youtube", "instagram", "shopee", "zalo"];

const argv = process.argv.slice(2);
const cmd = argv[0];
if (!cmd || argv.includes("--help")) {
  console.log(
    `perf.mjs — post performance in, lessons out\n` +
      `  import <file.csv…> --platform <${PLATFORMS.join("|")}>   add a platform's analytics export\n` +
      `  youtube --channel <UC…> [--max 50] | youtube <videoId…>      public YouTube numbers (YOUTUBE_API_KEY)\n` +
      `  learn [--metric views|completion|shares|avgWatch] [--brain <dir>] [--min-n 3]\n` +
      `                                                            → brain/insights.md + insights.json\n` +
      `  show                                                      what is stored\n` +
      `store: state/performance.json (gitignored)`,
  );
  process.exit(cmd ? 0 : 1);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const today = new Date().toISOString().slice(0, 10);
const die = (m) => { console.error(`[perf] ✗ ${m}`); process.exit(1); };
const load = () => { try { return JSON.parse(fs.readFileSync(STORE, "utf8")); } catch { return []; } };
const save = (posts) => { fs.mkdirSync(path.dirname(STORE), { recursive: true }); fs.writeFileSync(STORE, JSON.stringify(posts, null, 2) + "\n"); };

/** Every video the kit made under `dir`: script.json folders and talking-head .cuts.json files. */
function madeItems(dir) {
  const out = [];
  const walk = (d, depth = 0) => {
    if (depth > 4 || !fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (e.name === "script.json") {
        try {
          const script = JSON.parse(fs.readFileSync(p, "utf8"));
          const first = String(script.scenes?.[0]?.voiceText ?? "");
          out.push(featuresOf({ slug: path.basename(path.dirname(p)), title: script.metadata?.title ?? script.title ?? first.slice(0, 120), script }));
        } catch {}
      } else if (e.name.endsWith(".cuts.json")) {
        try {
          const cuts = JSON.parse(fs.readFileSync(p, "utf8"));
          const keep = cuts.keep ?? [];
          out.push(featuresOf({ slug: e.name.replace(/\.cuts\.json$/, ""), title: cuts.hook ?? e.name, cuts,
            durationSec: keep.length ? Math.round(keep.reduce((a, k) => a + (k.end - k.start), 0)) : null }));
        } catch {}
      }
    }
  };
  walk(dir);
  return out;
}

const isoDur = (s) => { const m = String(s).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : null; };

try {
  if (cmd === "import") {
    const platform = flag("--platform");
    if (!PLATFORMS.includes(platform)) die(`--platform must be one of ${PLATFORMS.join(", ")}`);
    const files = argv.slice(1).filter((a, i, all) => !a.startsWith("--") && all[i - 1] !== "--platform");
    if (!files.length) die("give the CSV file(s) exported from the platform's analytics");
    let rows = [];
    for (const f of files) {
      if (!fs.existsSync(f)) die(`not found: ${f}`);
      const got = normaliseRows(parseCsv(fs.readFileSync(f, "utf8")), platform);
      if (!got.length) die(`${f}: no row with a views number — is this the analytics export? (columns seen: ${Object.keys(parseCsv(fs.readFileSync(f, "utf8"))[0] ?? {}).join(", ")})`);
      console.log(`[perf] ${path.basename(f)}: ${got.length} post(s) · fields: ${[...new Set(got.flatMap(Object.keys))].filter((k) => k !== "platform").join(", ")}`);
      rows = rows.concat(got);
    }
    const merged = mergePosts(load(), rows, today);
    save(merged);
    console.log(`[perf] ✓ ${merged.length} post(s) stored → ${path.relative(process.cwd(), STORE)}`);
  } else if (cmd === "youtube") {
    const key = optionalEnv("YOUTUBE_API_KEY");
    if (!key) die("YOUTUBE_API_KEY is not set — create an API key with YouTube Data API v3 enabled, put it in .env");
    const api = async (p) => {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/${p}&key=${encodeURIComponent(key)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(`YouTube API ${r.status}: ${j.error?.message ?? "error"}`);
      return j;
    };
    let ids = argv.slice(1).filter((a, i, all) => !a.startsWith("--") && !["--channel", "--max"].includes(all[i - 1]));
    if (flag("--channel")) {
      const ch = await api(`channels?part=contentDetails&id=${encodeURIComponent(flag("--channel"))}`);
      const uploads = ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploads) die("channel not found");
      const max = Number(flag("--max", "50"));
      let page = "";
      while (ids.length < max) {
        const pl = await api(`playlistItems?part=contentDetails&maxResults=50&playlistId=${uploads}${page ? `&pageToken=${page}` : ""}`);
        ids.push(...pl.items.map((x) => x.contentDetails.videoId));
        if (!pl.nextPageToken) break;
        page = pl.nextPageToken;
      }
      ids = ids.slice(0, max);
    }
    if (!ids.length) die("give video ids, or --channel <UC…>");
    const rows = [];
    for (let i = 0; i < ids.length; i += 50) {
      const v = await api(`videos?part=statistics,snippet,contentDetails&id=${ids.slice(i, i + 50).join(",")}`);
      for (const x of v.items) rows.push({
        platform: "youtube", id: x.id, url: `https://www.youtube.com/watch?v=${x.id}`, title: x.snippet.title, postedAt: x.snippet.publishedAt,
        views: Number(x.statistics.viewCount ?? 0), likes: Number(x.statistics.likeCount ?? 0) || null, comments: Number(x.statistics.commentCount ?? 0) || null,
        duration: isoDur(x.contentDetails.duration),
      });
    }
    const merged = mergePosts(load(), rows, today);
    save(merged);
    console.log(`[perf] ✓ ${rows.length} YouTube video(s) · ${merged.length} post(s) stored`);
  } else if (cmd === "learn") {
    const posts = load();
    if (!posts.length) die("nothing stored yet — `perf.mjs import <csv> --platform …` first");
    const brain = path.resolve(flag("--brain", path.join(KIT, "brain")));
    const items = madeItems(brain);
    const joined = matchPosts(posts, items);
    const r = insights(joined, { metric: flag("--metric", "views"), minN: Number(flag("--min-n", "3")) });
    fs.mkdirSync(brain, { recursive: true });
    fs.writeFileSync(path.join(brain, "insights.json"), JSON.stringify({ at: today, ...r }, null, 2) + "\n");
    fs.writeFileSync(path.join(brain, "insights.md"), insightsMarkdown(r, { today }));
    console.log(`[perf] ${r.posts} post(s), ${r.matched} matched to ${items.length} video(s) the kit made · ${r.findings.length} finding(s)`);
    for (const f of r.findings) console.log(`  · ${f.feature}: "${f.best.value}" ×${f.best.lift} (n=${f.best.n}) vs "${f.worst.value}" ×${f.worst.lift} (n=${f.worst.n})`);
    if (!r.findings.length) console.log(`  · not enough posts per group yet (need ${flag("--min-n", "3")}+ each) — no conclusions, on purpose`);
    console.log(`[perf] ✓ ${path.relative(process.cwd(), path.join(brain, "insights.md"))}`);
  } else if (cmd === "show") {
    const posts = load();
    const by = posts.reduce((a, p) => ({ ...a, [p.platform]: (a[p.platform] ?? 0) + 1 }), {});
    console.log(`[perf] ${posts.length} post(s): ${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(", ") || "none"}`);
  } else die(`unknown command "${cmd}" — import | youtube | learn | show`);
} catch (e) {
  die(e.message);
}
