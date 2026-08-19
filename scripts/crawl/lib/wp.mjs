// wp.mjs — pure helpers for turning a WordPress REST post into a usable source record.
//
// Split out from wp-fetch.mjs so the fiddly bits — where an article actually ends, which of
// six responsive copies of an image is the real one — are testable without a network call.
// Every function here takes a string and returns a value. No fetch, no fs, no env.

// ── entities ────────────────────────────────────────────────────────────────
// `content.rendered` is HTML, so a plain-text extraction has to undo the encoding. Only the
// handful WordPress actually emits, plus the numeric forms.
const NAMED = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", mdash: "—", ndash: "–", lsquo: "‘", rsquo: "’",
  ldquo: "“", rdquo: "”", bull: "•", deg: "°", eacute: "é", uuml: "ü",
};

export function decodeEntities(s) {
  if (typeof s !== "string") return "";
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeChar(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => {
      const v = NAMED[name.toLowerCase()];
      return v === undefined ? m : v;
    });
}

function safeChar(code) {
  return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
}

// ── body boundary ───────────────────────────────────────────────────────────
// A WordPress single-post template appends widgets after the article: share bars, "related
// posts", "you may also like". Those widgets carry OTHER posts' images and OTHER posts'
// titles, so anything downstream that reads the whole `content.rendered` will happily pick a
// cover image belonging to a different case. The article's own byline is the last thing the
// author wrote, which makes it the boundary.
//
// No marker found → return the html untouched. Guessing a cut point would be worse than
// keeping too much: too much is visible to a human reviewer, a silent truncation is not.
export const DEFAULT_BYLINE = /<h[1-6][^>]*>\s*(?:written|posted|researched)\s+by\b/i;

export function cutAtByline(html, marker = DEFAULT_BYLINE) {
  if (typeof html !== "string") return "";
  const m = html.match(marker);
  return m && m.index > 0 ? html.slice(0, m.index) : html;
}

// ── paywall ─────────────────────────────────────────────────────────────────
// A membership plugin replaces the body with its upsell before the REST API ever sees it, so
// a gated post comes back looking like a very short article rather than an error. On the site
// this was built against, a category literally named "Free Cases" contains gated posts, so
// the category is not the answer — the body is. Detect the gate and refuse the post.
//
// Covers Paid Memberships Pro, MemberPress, Restrict Content and the wording they share.
export const GATE_MARKERS = [
  /pmpro[_-]content[_-]message/i,
  /mepr[_-]unauthorized/i,
  /\brcp[_-](?:restricted|paywall)\b/i,
  /this\s+content\s+is\s+for\s[^<]{0,120}?\bmembers\s+only\b/i,
  /(?:members|subscribers|premium\s+members)\s+only\b[\s\S]{0,80}?(?:log\s?in|sign\s?in|free\s+trial|subscribe)/i,
];

export function isGated(html, markers = GATE_MARKERS) {
  if (typeof html !== "string" || !html) return false;
  return markers.some((re) => re.test(html));
}

// ── html → text ─────────────────────────────────────────────────────────────
const BLOCK = /<\/(?:p|div|section|h[1-6]|li|tr|blockquote|figcaption)\s*>/gi;

export function htmlToText(html) {
  if (typeof html !== "string") return "";
  return decodeEntities(
    html
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(BLOCK, "\n\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t ]+/g, " ")
    // An inline tag becomes a space, so `<em>word</em>.` comes out as `word .`. Left in, that
    // stray space rides through the agent's rewrite and into a published caption.
    .replace(/ +([,.;:!?%)\]}»”’])/g, "$1")
    .replace(/([(\[{«“‘]) +/g, "$1")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function wordCount(text) {
  const t = String(text || "").trim();
  return t ? t.split(/\s+/).length : 0;
}

// ── images ──────────────────────────────────────────────────────────────────
// WordPress writes one upload out at half a dozen widths and offers them all in `srcset`:
//   photo-300x200.webp  photo-768x512.webp  photo-1024x683.webp  photo.webp
// Left alone that is four "different" images of the same thing. Stripping the `-WxH` suffix
// collapses them onto the original, which is also the largest — exactly what a cover wants.
const SIZED = /-(\d{2,5})x(\d{2,5})(?=\.[a-z0-9]+(?:$|\?))/i;

export function canonicalImageUrl(url) {
  if (typeof url !== "string") return "";
  const clean = url.trim().split("#")[0];
  return clean.replace(SIZED, "");
}

// Chrome, theme furniture and tracking pixels. These are never the picture of the case.
const JUNK = /(?:logo|favicon|icon[-_]|avatar|gravatar|spacer|placeholder|1x1|pixel|sprite|badge|banner-ad|wp-includes\/|\/plugins\/|\/themes\/)/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)(?:$|\?)/i;

/**
 * Every distinct image referenced by a chunk of post HTML, in document order.
 *
 * Reads `src`, the lazy-loading attributes, and `srcset` — a lazy-loaded page serves a base64
 * SVG placeholder as `src` and hides the real file in `data-src`, so reading `src` alone comes
 * back with nothing usable. data: URIs are dropped for the same reason.
 */
export function extractImages(html) {
  if (typeof html !== "string") return [];
  const out = new Map(); // canonical url → { url, alt }
  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const alt = decodeEntities(attr(tag, "alt") || "").trim();
    for (const raw of candidateUrls(tag)) {
      const url = raw.trim();
      if (!url || /^data:/i.test(url) || !IMAGE_EXT.test(url) || JUNK.test(url)) continue;
      const key = canonicalImageUrl(url);
      const prev = out.get(key);
      if (!prev) out.set(key, { url: key, alt });
      else if (alt && !prev.alt) prev.alt = alt;
    }
  }
  return [...out.values()];
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return m ? (m[2] ?? m[3] ?? "") : "";
}

function candidateUrls(tag) {
  const urls = [];
  for (const a of ["src", "data-src", "data-lazy-src", "data-original"]) {
    const v = attr(tag, a);
    if (v) urls.push(v);
  }
  for (const a of ["srcset", "data-srcset", "data-lazy-srcset"]) {
    const v = attr(tag, a);
    if (!v) continue;
    for (const part of v.split(",")) {
      const u = part.trim().split(/\s+/)[0];
      if (u) urls.push(u);
    }
  }
  return urls;
}

/**
 * The images worth offering a human, best first.
 *
 * `featured` (the post's own featured-media URL) always leads when present — it is the one
 * image an editor deliberately chose for this post. The rest keep document order, which puts
 * the opening illustration ahead of a mid-article photo.
 */
export function pickImages(html, { featured = "", max = 6 } = {}) {
  const body = extractImages(html);
  const seen = new Set();
  const out = [];
  const push = (img) => {
    const key = canonicalImageUrl(img.url);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ url: key, alt: img.alt || "" });
  };
  if (featured) push({ url: featured, alt: "" });
  for (const img of body) push(img);
  return out.slice(0, max);
}

// ── misc ────────────────────────────────────────────────────────────────────

/**
 * A tagline, if the template puts one right under the title.
 *
 * Heuristic on purpose: the first short heading near the top of the body. A wrong guess costs
 * one optional field, so this stays cheap rather than becoming a per-site selector config.
 */
export function firstSubtitle(html, { window = 1500, maxChars = 90 } = {}) {
  if (typeof html !== "string") return "";
  for (const m of html.slice(0, window).matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)) {
    const text = htmlToText(m[1]);
    // Two words minimum, and at least one letter. Templates put a catalogue number ("#0597")
    // or a date in a heading right above the tagline, and either would win a length-only test.
    if (text && text.length <= maxChars && /\p{L}/u.test(text) && text.split(/\s+/).length >= 2) {
      return text;
    }
  }
  return "";
}

/** Filesystem-safe slug, for the output directory name. */
export function safeSlug(s, fallback = "post") {
  const out = String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return out || fallback;
}
