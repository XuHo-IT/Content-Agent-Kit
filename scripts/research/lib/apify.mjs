// apify.mjs — platform trends and competitor profiles through Apify actors (OPTIONAL, PAID).
//
// The kit's research is keyless by design. TikTok, Instagram and Facebook are the exception
// the keyless sources cannot cover: none has an anonymous endpoint that survives a week, and
// Reddit's anonymous search started answering with a login wall in November 2026. Apify runs
// maintained scrapers ("actors") for those platforms behind one token.
//
//   APIFY_TOKEN          required to enable anything in this file (console.apify.com → Integrations)
//   APIFY_PLATFORMS      which platforms topic-radar asks (default "tiktok,youtube")
//   APIFY_MAX_ITEMS      results per platform per run (default 20) — this is the cost knob
//   APIFY_ACTOR_<NAME>   override an actor id, e.g. APIFY_ACTOR_TIKTOK=someone/other-tiktok-actor
//
// COST. Apify bills per run (compute units) and many actors per result. 20 results from the
// TikTok actor is cents, not dollars — but a scheduled radar runs daily. APIFY_MAX_ITEMS is
// deliberately small, and nothing here runs unless the token is set.
//
// VERIFIED / NOT VERIFIED. The normalisers below are pure and tested against the field names
// each actor documents. The live calls have NOT been run against an account from this repo —
// actor output drifts, which is why every field read has a fallback and why actor ids are
// overridable by env. If a platform returns items with empty titles, the actor changed shape:
// run once with `--json`, look at one raw item, and adjust the normaliser.
//
// Terms: scraping is governed by each platform's terms and by Apify's. Use it for research
// (what topics and formats are rising), not to re-publish anyone's content — that is also
// what the review gate and the copyright convention in docs/03 require.
import { optionalEnv } from "../../lib/env.mjs";

const API = "https://api.apify.com/v2";

/** Default actors — widely used, maintained at the time of writing (November 2026). */
export const ACTORS = {
  tiktok: "clockworks/tiktok-scraper",
  instagram: "apify/instagram-hashtag-scraper",
  instagramProfile: "apify/instagram-profile-scraper",
  youtube: "streamers/youtube-scraper",
  facebook: "apify/facebook-posts-scraper",
};

export const hasApify = () => Boolean(process.env.APIFY_TOKEN);

const actorId = (name) => optionalEnv(`APIFY_ACTOR_${name.toUpperCase()}`, ACTORS[name]);

/**
 * Run an actor synchronously and return its dataset items. `run-sync-get-dataset-items`
 * waits up to `timeoutSec` for the run, so a radar call is one request, not a poll loop.
 */
export async function runActor(name, input, { timeoutSec = 120 } = {}) {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN is not set — Apify sources are optional and paid; see .env.example");
  const id = actorId(name).replace("/", "~"); // the API spells owner/name as owner~name
  const res = await fetch(`${API}/acts/${id}/run-sync-get-dataset-items?timeout=${timeoutSec}&clean=true`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout((timeoutSec + 30) * 1000),
  });
  if (!res.ok) throw new Error(`Apify ${actorId(name)} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const items = await res.json();
  if (!Array.isArray(items)) throw new Error(`Apify ${actorId(name)} returned no item list`);
  return items;
}

// ── inputs (what each actor expects) ─────────────────────────────────────────

const max = () => Math.max(1, Math.min(200, Number(optionalEnv("APIFY_MAX_ITEMS", "20")) || 20));
const hashtag = (topic) => String(topic).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").replace(/[^\w]+/g, "").toLowerCase();

export const INPUTS = {
  tiktok: (topic) => ({ searchQueries: [topic], resultsPerPage: max(), shouldDownloadVideos: false, shouldDownloadCovers: false }),
  instagram: (topic) => ({ hashtags: [hashtag(topic)], resultsLimit: max() }),
  youtube: (topic) => ({ searchQueries: [topic], maxResults: max(), maxResultsShorts: max(), maxResultStreams: 0 }),
  facebook: (topic) => ({ startUrls: [{ url: `https://www.facebook.com/hashtag/${hashtag(topic)}` }], resultsLimit: max() }),
  // competitor profiles
  tiktokProfile: (handle) => ({ profiles: [handle.replace(/^@/, "")], resultsPerPage: max(), shouldDownloadVideos: false }),
  instagramProfile: (handle) => ({ usernames: [handle.replace(/^@/, "")] }),
};

// ── normalisers (pure) → the kit's common item shape ─────────────────────────

const num = (...xs) => {
  for (const x of xs) if (Number.isFinite(Number(x)) && x !== null && x !== "") return Number(x);
  return NaN;
};
const iso = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const d = typeof v === "number" ? new Date(v < 1e12 ? v * 1000 : v) : new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
};
const firstLine = (s, n = 140) => String(s ?? "").split(/\n/)[0].replace(/\s+/g, " ").trim().slice(0, n);

export const NORMALISE = {
  tiktok: (r) => ({
    id: `tiktok:${r.id ?? r.webVideoUrl}`,
    title: firstLine(r.text ?? r.desc ?? r.title),
    url: r.webVideoUrl ?? r.url ?? (r.id ? `https://www.tiktok.com/video/${r.id}` : null),
    publishedAt: iso(r.createTimeISO ?? r.createTime),
    views: num(r.playCount, r.stats?.playCount),
    likes: num(r.diggCount, r.stats?.diggCount),
    comments: num(r.commentCount, r.stats?.commentCount),
    shares: num(r.shareCount, r.stats?.shareCount),
    author: r.authorMeta?.name ?? r.author?.uniqueId ?? "",
    tags: (r.hashtags ?? []).map((h) => (typeof h === "string" ? h : h?.name)).filter(Boolean),
  }),
  instagram: (r) => ({
    id: `instagram:${r.id ?? r.shortCode ?? r.url}`,
    title: firstLine(r.caption ?? r.alt),
    url: r.url ?? (r.shortCode ? `https://www.instagram.com/p/${r.shortCode}/` : null),
    publishedAt: iso(r.timestamp ?? r.takenAtTimestamp),
    views: num(r.videoPlayCount, r.videoViewCount),
    likes: num(r.likesCount),
    comments: num(r.commentsCount),
    shares: NaN,
    author: r.ownerUsername ?? "",
    tags: r.hashtags ?? [],
  }),
  youtube: (r) => ({
    id: `youtube:${r.id ?? r.url}`,
    title: firstLine(r.title, 160),
    url: r.url ?? (r.id ? `https://www.youtube.com/watch?v=${r.id}` : null),
    publishedAt: iso(r.date ?? r.uploadDate),
    views: num(r.viewCount, r.views),
    likes: num(r.likes, r.likeCount),
    comments: num(r.commentsCount, r.commentCount),
    shares: NaN,
    author: r.channelName ?? r.channel?.name ?? "",
    tags: r.hashtags ?? [],
  }),
  facebook: (r) => ({
    id: `facebook:${r.postId ?? r.url}`,
    title: firstLine(r.text ?? r.message),
    url: r.url ?? r.postUrl ?? null,
    publishedAt: iso(r.time ?? r.timestamp),
    views: num(r.viewsCount),
    likes: num(r.likes, r.reactionsCount),
    comments: num(r.comments, r.commentsCount),
    shares: num(r.shares, r.sharesCount),
    author: r.user?.name ?? r.pageName ?? "",
    tags: [],
  }),
};
NORMALISE.tiktokProfile = NORMALISE.tiktok;

/** Normalised platform item → topic-radar item. */
export function toRadarItem(n, platform) {
  return {
    id: n.id,
    title: n.title || `(${platform} post)`,
    url: n.url,
    source: platform,
    publishedAt: n.publishedAt,
    // Views dominate social engagement; likes stand in when a platform hides views.
    engagement: { votes: Number.isFinite(n.views) ? n.views : Number.isFinite(n.likes) ? n.likes : 0, comments: Number.isFinite(n.comments) ? n.comments : 0 },
    snippet: n.tags?.length ? n.tags.slice(0, 8).map((t) => `#${t}`).join(" ") : "",
    author: n.author,
    context: platform,
  };
}

export const PLATFORM_IDS = ["tiktok", "instagram", "youtube", "facebook"];

/** One radar source per platform, all sharing the token. */
export function platformSource(platform) {
  return {
    id: platform,
    label: `${platform[0].toUpperCase()}${platform.slice(1)} (via Apify — paid, needs APIFY_TOKEN)`,
    keyEnv: ["APIFY_TOKEN"],
    hasKey: hasApify,
    async search(topic, { limit = 20 } = {}) {
      const raw = await runActor(platform, INPUTS[platform](topic));
      return raw.map(NORMALISE[platform]).filter((n) => n.url).slice(0, limit).map((n) => toRadarItem(n, platform));
    },
  };
}

/** Which platforms topic-radar should ask by default when a token is present. */
export function defaultPlatforms() {
  return optionalEnv("APIFY_PLATFORMS", "tiktok,youtube")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => PLATFORM_IDS.includes(s));
}
