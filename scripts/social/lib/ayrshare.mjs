// ayrshare.mjs — turn make-post's payload into an Ayrshare /post request.
//
// make-post.mjs normally hands a payload to a Make.com / n8n webhook, and the scenario owns
// the platform APIs. That is free and flexible, but someone has to BUILD the scenario — the
// step most non-technical users stop at. Ayrshare (paid, ayrshare.com) is one HTTPS call that
// posts to TikTok, Facebook, Instagram, YouTube, Threads, LinkedIn, X, Pinterest, Bluesky…
// with the accounts linked once in its dashboard. SOCIAL_PUBLISHER=ayrshare switches to it.
//
// From Ayrshare's docs (read November 2026): POST https://api.ayrshare.com/api/post,
// `Authorization: Bearer <API key>`, body {post, platforms, mediaUrls}; media URLs must be
// HTTPS; video posting needs a paid plan; YouTube needs a title in youTubeOptions.
// The per-platform option names below (reels, shorts) follow the same docs and have NOT been
// run against a live account from this repo — `--dry-run` prints the exact body first.
//
// ENV: AYRSHARE_API_KEY, AYRSHARE_PROFILE_KEY (optional — Business plan, one brand of many).

export const AYRSHARE_URL = "https://api.ayrshare.com/api/post";

/** The kit's platform names → Ayrshare's. Anything else passes through unchanged. */
export const PLATFORM_MAP = {
  tiktok: "tiktok",
  youtube_shorts: "youtube",
  youtube: "youtube",
  facebook_reels: "facebook",
  facebook: "facebook",
  instagram_reels: "instagram",
  instagram: "instagram",
  threads: "threads",
  linkedin: "linkedin",
  x: "twitter",
  twitter: "twitter",
  pinterest: "pinterest",
  bluesky: "bluesky",
};

/**
 * @param {object} p make-post's normalised payload: {kind, post, mediaUrl, images, video_url,
 *   title, hashtags, platforms}
 * @returns {{body: object, warnings: string[]}}
 */
export function ayrshareBody(p) {
  const warnings = [];
  const platforms = [...new Set((p.platforms ?? []).map((x) => PLATFORM_MAP[x] ?? x))];
  if (!platforms.length) throw new Error("Ayrshare needs at least one platform — pass --platforms or set SOCIAL_PLATFORMS.");

  const text = [p.post, p.hashtags].filter(Boolean).join("\n\n");
  const body = { post: text, platforms };

  const media = p.kind === "video" ? [p.video_url || p.mediaUrl] : p.images?.length ? p.images : p.mediaUrl ? [p.mediaUrl] : [];
  const urls = media.filter(Boolean);
  for (const u of urls) if (!/^https:\/\//i.test(u)) warnings.push(`Ayrshare only fetches HTTPS media; this is not: ${u}`);
  if (urls.length) body.mediaUrls = urls;

  if (p.kind === "video") {
    body.isVideo = true;
    if (platforms.includes("youtube")) {
      if (!p.title) warnings.push("YouTube needs a title (--title); Ayrshare will refuse the post without one.");
      body.youTubeOptions = { title: p.title || "", shorts: true };
    }
    if (platforms.includes("instagram")) body.instagramOptions = { reels: true, shareReelsFeed: true };
    if (platforms.includes("facebook")) body.faceBookOptions = { reels: true, ...(p.title ? { title: p.title } : {}) };
  }
  if (p.comment) warnings.push("Ayrshare posts the caption only; the first comment is not sent (add it from the app, or use the Make webhook).");
  if (platforms.includes("tiktok") && text.length > 2200) warnings.push(`TikTok caps the caption at 2200 characters; this one is ${text.length}.`);
  return { body, warnings };
}
