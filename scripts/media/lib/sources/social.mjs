// social.mjs — a clip from Douyin / TikTok / Bilibili / Kuaishou as a scene's media.
//
//   "media": {
//     "kind": "video", "source": "social",
//     "url": "https://www.douyin.com/video/7…",
//     "rights": "permitted",
//     "rights_note": "author @abc agreed by DM, 2026-08-14"
//   }
//
// ⚠️ THE CLIP IS SOMEBODY ELSE'S WORK. Removing a watermark does not remove a copyright, and
// republishing a creator's video inside a monetised short is a copyright and platform-ToS
// risk. This source does not make that judgement for you — it makes you WRITE IT DOWN.
// `rights` is required (enforced in validate-script.mjs, which runs in seconds) and lands in
// media-lock.json, which docs/15 already calls the credits ledger. When a takedown arrives,
// "where did this clip come from and on what basis" is then a file, not a memory.
//
// NOTHING IS VENDORED. This is a thin client for a service YOU run:
//   https://github.com/Evil0ctal/Douyin_TikTok_Download_API   (Apache-2.0, FastAPI)
// Same arrangement as the servers in .mcp.json — external, env-only, no credentials here.
// Cookies live in that service's own config.yaml, never in this kit. The public demo at
// douyin.wtf has its download endpoint disabled, so self-hosting is not optional.
//
// For bulk archiving of YOUR OWN account, https://github.com/jiji262/douyin-downloader
// (MIT, Python CLI, SQLite dedup) is the better tool — it is not wired in here because a
// batch archiver and a per-scene resolver are different jobs.
//
// ENV: SOCIAL_API_BASE (required), SOCIAL_WATERMARK
import { optionalEnv } from "../../../lib/env.mjs";

export const id = "social";
export const label = "Social video (self-hosted API)";
export const license = "Copyright remains with the original creator — see `rights` on the scene";
export const keyEnv = ["SOCIAL_API_BASE"];
export const hasKey = () => Boolean(optionalEnv("SOCIAL_API_BASE"));

/** The declarations the kit accepts. There is deliberately no "probably fine". */
export const RIGHTS = ["own", "licensed", "permitted", "public-domain"];
/** These two are claims about someone else's permission, so they have to name it. */
export const RIGHTS_NEEDING_NOTE = ["licensed", "permitted"];

const UA = () =>
  optionalEnv("RESEARCH_USER_AGENT", "content-agent-kit/1.0 (+https://github.com/XuHo-IT/Content-Agent-Kit)");

function apiBase() {
  const b = optionalEnv("SOCIAL_API_BASE");
  if (!b) {
    throw new Error(
      `source "social" needs SOCIAL_API_BASE — the kit ships no downloader, it talks to one you run.\n` +
        `  git clone https://github.com/Evil0ctal/Douyin_TikTok_Download_API\n` +
        `  cd Douyin_TikTok_Download_API && docker compose up -d\n` +
        `  SOCIAL_API_BASE=http://127.0.0.1:80\n` +
        `  Cookies go in that service's crawlers/*/web/config.yaml, never in this kit.`,
    );
  }
  return b.replace(/\/+$/, "");
}

/** Dig a value out of the response whatever nesting this version wrapped it in. */
function pick(obj, ...paths) {
  for (const p of paths) {
    let cur = obj;
    for (const key of p.split(".")) cur = cur?.[key];
    if (cur !== undefined && cur !== null && cur !== "") return cur;
  }
  return null;
}

/**
 * Metadata for one post. `minimal=true` because the full payload is enormous and everything
 * here needs is the author, the title and an id.
 *
 * ⚠️ Written from the project's documented API, not run against a live instance — this kit
 * cannot stand up a service with somebody's cookies in it. The shape-tolerant `pick()` above
 * is deliberate: if a field moved, the clip still resolves and the credit line degrades to
 * the URL rather than the whole render failing.
 */
async function videoData(url) {
  const u = new URL(`${apiBase()}/api/hybrid/video_data`);
  u.searchParams.set("url", url);
  u.searchParams.set("minimal", "true");
  const r = await fetch(u.href, {
    headers: { "user-agent": UA(), accept: "application/json" },
    signal: AbortSignal.timeout(60000),
  });
  if (!r.ok) {
    const detail = (await r.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 200);
    throw new Error(`social API ${r.status} for ${url.slice(0, 60)}: ${detail}`);
  }
  const j = await r.json().catch(() => ({}));
  return j?.data ?? j;
}

function downloadUrl(url) {
  const u = new URL(`${apiBase()}/api/download`);
  u.searchParams.set("url", url);
  u.searchParams.set("prefix", "false");
  u.searchParams.set("with_watermark", optionalEnv("SOCIAL_WATERMARK", "false"));
  return u.href;
}

/**
 * @param {string} ref  the post URL (a share link works — the service resolves it)
 */
export async function byId(ref) {
  const url = String(ref);
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(`source "social" needs a post URL, got "${url.slice(0, 60)}".`);
  }
  // Fail on a missing service BEFORE the metadata attempt. Letting it surface from inside
  // the try below printed the whole setup message twice — once truncated as a warning, once
  // as the real error — which reads like two different problems.
  apiBase();

  let meta = {};
  try {
    meta = await videoData(url);
  } catch (e) {
    // Metadata is for the credit line; losing it should cost the author's name, not the clip.
    console.error(`[media] social: metadata unavailable (${e.message.slice(0, 120)})`);
  }

  const author =
    pick(meta, "author.nickname", "author.unique_id", "author.uid", "nickname", "uploader") ?? "";
  const title = pick(meta, "desc", "title", "caption") ?? "";
  const postId = pick(meta, "aweme_id", "id", "video_id") ?? "";

  return {
    id: url,
    width: Number(pick(meta, "video.width", "width")) || 0,
    height: Number(pick(meta, "video.height", "height")) || 0,
    duration: Math.round((Number(pick(meta, "video.duration", "duration")) || 0) / 1000) || 0,
    author: author ? String(author) : "",
    authorUrl: "",
    pageUrl: url,
    fileUrl: downloadUrl(url),
    tags: [title, postId].filter(Boolean).join(" · ").slice(0, 200),
    source: id,
    license,
  };
}

/** No catalogue to search — the caller already has the post they mean. */
export async function search() {
  throw new Error(
    `source "social" has nothing to search: it resolves ONE post you name.\n` +
      `  Use "url" (not "query"), and declare "rights": ${RIGHTS.join(" | ")}.\n` +
      `  To find posts on a topic in the first place, use scripts/research/topic-radar.mjs.`,
  );
}
