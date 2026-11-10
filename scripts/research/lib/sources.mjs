// sources.mjs — the research-source registry. Same shape as the stock-source registry in
// scripts/media/lib/sources/: a source is data plus one function, so adding one is a block
// here and a line in SOURCES. Every source returns the SAME item object, which is why
// nothing downstream branches on where a story came from:
//
//   { id, title, url, source, publishedAt, engagement: {votes, comments}, snippet, author,
//     discussionUrl? }
//
// All four are KEYLESS by design. GITHUB_TOKEN is read if present but only to raise a rate
// limit, never to unlock a source — the point of this file is that `topic-radar` works on a
// fresh clone with an empty .env. Anything needing an account belongs in registry.json.
//
// A source that fails does NOT fail the run: `search` rejects, the CLI records the reason
// and reports which sources answered. That is deliberately the opposite contract from
// scripts/lib/http.mjs, whose callers publish and must stop on error.
//
// `search` resolves to an array, or to `{ items, note }` when the source answered but in a
// weaker way than usual. The note is printed in the report — a ranking that quietly got
// worse is harder to debug than one that says why.
//
// ENV: GITHUB_TOKEN (optional), NEWS_RSS_LOCALE, RESEARCH_USER_AGENT
import { optionalEnv } from "../../lib/env.mjs";
import { platformSource, PLATFORM_IDS, hasApify, defaultPlatforms } from "./apify.mjs";

const UA = () =>
  optionalEnv(
    "RESEARCH_USER_AGENT",
    "content-agent-kit/1.0 (+https://github.com/XuHo-IT/Content-Agent-Kit)",
  );

/** Reddit 429s anything with a default or absent User-Agent, so every call carries one. */
async function getJson(url, { headers = {}, timeoutMs = 20000 } = {}) {
  const res = await fetch(url, {
    headers: { "user-agent": UA(), accept: "application/json", ...headers },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

async function getText(url, { headers = {}, timeoutMs = 20000 } = {}) {
  const res = await fetch(url, {
    headers: { "user-agent": UA(), ...headers },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.text();
}

const iso = (v) => {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
};

const clip = (s, n = 400) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n);

// ── reddit ───────────────────────────────────────────────────────────────────
// `t` is a fixed vocabulary, not a day count — the closest bucket that still COVERS the
// window is picked, because a narrower one would silently drop days the caller asked for.
function redditWindow(days) {
  if (days <= 1) return "day";
  if (days <= 7) return "week";
  if (days <= 31) return "month";
  if (days <= 366) return "year";
  return "all";
}

/**
 * Reddit's Atom search feed. Carries the posts but NO score or comment count, so items
 * from it land on the neutral heat in rank.mjs and compete on freshness and cross-source.
 *
 * Entries mix subreddits (`t5_`) and posts (`t3_`); only the latter are stories.
 */
function parseRedditAtom(xml, limit) {
  const out = [];
  for (const m of String(xml).matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const id = e.match(/<id>([^<]+)<\/id>/)?.[1] ?? "";
    if (!id.startsWith("t3_")) continue;
    const title = decodeEntities(e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").trim();
    const href = e.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? "";
    if (!title || !href) continue;
    out.push({
      id: `reddit:${id.slice(3)}`,
      title,
      url: href,
      discussionUrl: href,
      source: "reddit",
      publishedAt: iso(e.match(/<updated>([^<]+)<\/updated>/)?.[1] ?? ""),
      engagement: { votes: 0, comments: 0 },
      snippet: clip(decodeEntities(e.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? "").replace(/<[^>]+>/g, " ")),
      author: e.match(/<name>([^<]+)<\/name>/)?.[1] ?? "",
      context: e.match(/<category[^>]*label="([^"]+)"/)?.[1] ?? "",
    });
    if (out.length >= limit) break;
  }
  return out;
}

export const reddit = {
  id: "reddit",
  label: "Reddit",
  keyEnv: [],
  hasKey: () => true,
  async search(topic, { days = 30, limit = 50 } = {}) {
    const window = redditWindow(days);
    const json = new URL("https://www.reddit.com/search.json");
    json.searchParams.set("q", topic);
    json.searchParams.set("sort", "top");
    json.searchParams.set("t", window);
    json.searchParams.set("limit", String(Math.min(limit, 100)));
    json.searchParams.set("raw_json", "1");

    try {
      const data = await getJson(json.href);
      const items = (data?.data?.children ?? [])
        .map((c) => c.data)
        .filter((d) => d && d.title)
        .map((d) => {
          const permalink = `https://www.reddit.com${d.permalink}`;
          // A link post's real subject is the page it points at, and that is the URL the
          // dedup has to see — otherwise the same article submitted to Reddit and to HN
          // stays two stories. Self posts have no such page, so they key on the thread.
          const external = d.is_self ? null : d.url_overridden_by_dest || d.url;
          return {
            id: `reddit:${d.id}`,
            title: d.title,
            url: external && !/^https?:\/\/(www\.)?reddit\.com/.test(external) ? external : permalink,
            discussionUrl: permalink,
            source: "reddit",
            publishedAt: iso(d.created_utc * 1000),
            engagement: { votes: d.ups ?? 0, comments: d.num_comments ?? 0 },
            snippet: clip(d.selftext),
            author: d.author ? `u/${d.author}` : "",
            context: d.subreddit ? `r/${d.subreddit}` : "",
          };
        });
      return { items };
    } catch (jsonErr) {
      // Reddit 403s the JSON API for unauthenticated clients from most networks — it wants
      // OAuth now. The Atom feed is still open and still answers the same query, so losing
      // vote counts beats losing the source. The note makes the downgrade visible in the
      // report rather than leaving a quietly weaker ranking to explain itself.
      const rss = new URL("https://www.reddit.com/search.rss");
      rss.searchParams.set("q", topic);
      rss.searchParams.set("sort", "top");
      rss.searchParams.set("t", window);
      rss.searchParams.set("limit", String(Math.min(limit, 100)));

      const xml = await getText(rss.href, { headers: { accept: "application/atom+xml, application/xml" } }).catch(
        () => {
          throw new Error(`JSON API: ${jsonErr.message}; RSS fallback also failed`);
        },
      );
      return {
        items: parseRedditAtom(xml, limit),
        note: `RSS fallback (JSON API: ${jsonErr.message}) — no vote counts`,
      };
    }
  },
};

// ── hacker news ──────────────────────────────────────────────────────────────
export const hn = {
  id: "hn",
  label: "Hacker News",
  keyEnv: [],
  hasKey: () => true,
  async search(topic, { days = 30, limit = 50 } = {}) {
    const since = Math.floor((Date.now() - days * 86_400_000) / 1000);
    const u = new URL("https://hn.algolia.com/api/v1/search");
    // `search` ranks by Algolia's popularity blend; `search_by_date` ranks by recency and
    // would hand back the newest 50 submissions regardless of whether anyone read them.
    // Freshness is already a factor in the scorer — what this endpoint is asked for is heat.
    u.searchParams.set("query", topic);
    u.searchParams.set("tags", "story");
    u.searchParams.set("numericFilters", `created_at_i>=${since}`);
    u.searchParams.set("hitsPerPage", String(Math.min(limit, 100)));

    const data = await getJson(u.href);
    return (data?.hits ?? [])
      .filter((h) => h && h.title)
      .map((h) => ({
        id: `hn:${h.objectID}`,
        title: h.title,
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        discussionUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
        source: "hn",
        publishedAt: iso(h.created_at),
        engagement: { votes: h.points ?? 0, comments: h.num_comments ?? 0 },
        snippet: clip(h.story_text),
        author: h.author ? `@${h.author}` : "",
        context: "news.ycombinator.com",
      }));
  },
};

// ── github ───────────────────────────────────────────────────────────────────
export const github = {
  id: "github",
  label: "GitHub",
  keyEnv: ["GITHUB_TOKEN"],
  hasKey: () => true, // keyless works; the token only raises 10/min to 30/min
  async search(topic, { days = 30, limit = 30 } = {}) {
    const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const u = new URL("https://api.github.com/search/repositories");
    // `created:` not `pushed:` — a six-year-old repo pushed this morning is maintenance,
    // not news. What belongs in a "what is new and hot" list is a project that did not
    // exist last month and already has stars.
    u.searchParams.set("q", `${topic} created:>=${since}`);
    u.searchParams.set("sort", "stars");
    u.searchParams.set("order", "desc");
    u.searchParams.set("per_page", String(Math.min(limit, 100)));

    const token = optionalEnv("GITHUB_TOKEN");
    const data = await getJson(u.href, {
      headers: {
        accept: "application/vnd.github+json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    return (data?.items ?? []).map((r) => ({
      id: `github:${r.id}`,
      title: `${r.full_name} — ${clip(r.description, 120) || "no description"}`,
      url: r.html_url,
      source: "github",
      publishedAt: iso(r.created_at),
      engagement: { votes: r.stargazers_count ?? 0, comments: r.open_issues_count ?? 0 },
      snippet: clip(r.description),
      author: r.owner?.login ? `@${r.owner.login}` : "",
      context: r.language || "",
    }));
  },
};

// ── google news rss ──────────────────────────────────────────────────────────
/** Named + numeric XML entities. Titles arrive with `&#39;` and `&amp;` routinely. */
function decodeEntities(text) {
  return String(text ?? "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&"); // last: otherwise `&amp;lt;` decodes twice
}

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  if (!m) return "";
  return decodeEntities(m[1].replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1")).trim();
};

/**
 * Deliberately a ~30-line regex reader rather than an XML dependency, for the same reason
 * scripts/media/lib/sources/manual.mjs hand-rolls its YAML: this kit ships no node_modules.
 * It handles exactly the flat RSS 2.0 shape Google News emits and nothing else.
 */
export function parseRss(xml) {
  const items = [];
  for (const m of String(xml).matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = m[1];
    const title = tag(block, "title");
    const link = tag(block, "link");
    if (!title || !link) continue;
    items.push({
      title,
      link,
      pubDate: tag(block, "pubDate"),
      description: tag(block, "description"),
      // Google News puts the publisher in <source url="https://…">Name</source>.
      sourceName: tag(block, "source"),
      sourceUrl: block.match(/<source[^>]*url="([^"]+)"/i)?.[1] ?? "",
      guid: tag(block, "guid"),
    });
  }
  return items;
}

export const news = {
  id: "news",
  label: "Google News",
  keyEnv: [],
  hasKey: () => true,
  async search(topic, { days = 30, limit = 40 } = {}) {
    // hl = interface language, gl = country, ceid = country:language. Vietnamese by
    // default because that is what this kit narrates in; override for another market.
    const locale = optionalEnv("NEWS_RSS_LOCALE", "vi|VN|VN:vi").split("|");
    const [hl, gl, ceid] = [locale[0] || "vi", locale[1] || "VN", locale[2] || "VN:vi"];

    const u = new URL("https://news.google.com/rss/search");
    u.searchParams.set("q", `${topic} when:${Math.max(1, Math.min(days, 365))}d`);
    u.searchParams.set("hl", hl);
    u.searchParams.set("gl", gl);
    u.searchParams.set("ceid", ceid);

    const xml = await getText(u.href, { headers: { accept: "application/rss+xml, application/xml" } });
    return parseRss(xml)
      .slice(0, limit)
      .map((r, i) => ({
        id: `news:${r.guid || i}`,
        // Google appends " - Publisher" to every headline; it is noise in a title key.
        title: r.title.replace(/\s+-\s+[^-]{2,40}$/, "").trim() || r.title,
        url: r.link,
        source: "news",
        publishedAt: iso(r.pubDate),
        // RSS carries no engagement at all. heatByPercentile() detects the flat set and
        // gives the whole source a neutral heat rather than sinking it to the floor.
        engagement: { votes: 0, comments: 0 },
        snippet: clip(r.description.replace(/<[^>]+>/g, " ")),
        author: "",
        context: r.sourceName || (r.sourceUrl ? new URL(r.sourceUrl).hostname : ""),
      }));
  },
};

// ── google trends (daily trending searches) ─────────────────────────────────
// What a COUNTRY is searching for today, keyless: trends.google.com/trending/rss?geo=VN.
// Added November 2026 when Reddit's anonymous search started answering with a login wall
// (`/login/?reason=lor2`) — it is the most local signal this kit has: Vietnamese searches,
// from Vietnam, with an approximate traffic number and the news stories behind each one.
//
// It is not topic-scoped upstream (the feed is the whole country's top ~10–20), so items are
// kept only when the topic's words appear in the trend or its news headlines. A day with no
// match returns nothing and says so, rather than padding the radar with unrelated trends.

/** "2000+" / "20K+" / "1M+" → a number for the heat model. */
export function parseTraffic(s) {
  const m = String(s ?? "").replace(/[,.\s]/g, "").match(/^(\d+)([KM])?/i);
  if (!m) return 0;
  return Number(m[1]) * (m[2]?.toUpperCase() === "M" ? 1e6 : m[2]?.toUpperCase() === "K" ? 1e3 : 1);
}

export function parseTrendsRss(xml) {
  return String(xml)
    .split(/<item>/)
    .slice(1)
    .map((block) => {
      const news = [...block.matchAll(/<ht:news_item>([\s\S]*?)<\/ht:news_item>/g)].map((m) => ({
        title: tag(m[1], "ht:news_item_title"),
        url: tag(m[1], "ht:news_item_url"),
        source: tag(m[1], "ht:news_item_source"),
      }));
      return {
        title: tag(block, "title"),
        traffic: parseTraffic(tag(block, "ht:approx_traffic")),
        pubDate: tag(block, "pubDate"),
        news,
      };
    })
    .filter((t) => t.title);
}

/** Does a trend belong to the topic? Unicode-aware: Vietnamese words never match `\b`. */
export function trendMatches(trend, topic) {
  const norm = (s) => String(s ?? "").toLowerCase().normalize("NFC");
  const words = norm(topic).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3);
  if (!words.length) return false;
  const hay = norm([trend.title, ...trend.news.map((n) => n.title)].join(" "));
  return words.some((w) => new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "u").test(hay));
}

export const trends = {
  id: "trends",
  label: "Google Trends (daily, by country)",
  keyEnv: [],
  hasKey: () => true,
  async search(topic, { limit = 20 } = {}) {
    const geo = optionalEnv("TRENDS_GEO", "VN");
    const xml = await getText(`https://trends.google.com/trending/rss?geo=${encodeURIComponent(geo)}`, {
      headers: { accept: "application/rss+xml, application/xml" },
    });
    const all = parseTrendsRss(xml);
    const hit = all.filter((t) => trendMatches(t, topic)).slice(0, limit);
    const items = hit.map((t, i) => ({
      id: `trends:${geo}:${t.title}`,
      title: t.news[0]?.title ? `${t.title} — ${t.news[0].title}` : t.title,
      url: t.news[0]?.url || `https://trends.google.com/trends/explore?geo=${geo}&q=${encodeURIComponent(t.title)}`,
      source: "trends",
      publishedAt: iso(t.pubDate),
      // Approximate searches stand in for votes; the heat model ranks within a source.
      engagement: { votes: t.traffic, comments: 0 },
      snippet: clip(t.news.map((n) => n.title).join(" · ")),
      author: "",
      context: `${geo} · ~${t.traffic}+ searches`,
      _rank: i,
    }));
    return items.length
      ? items
      : { items: [], note: `${all.length} trending searches in ${geo} today, none about "${topic}"` };
  },
};

// The keyless five, then the paid platform sources (TikTok, Instagram, YouTube, Facebook via
// Apify — scripts/research/lib/apify.mjs). Those exist in the registry always, so
// `--sources tiktok` gives a clear "APIFY_TOKEN is not set" instead of "unknown source".
export const SOURCES = {
  reddit,
  hn,
  github,
  news,
  trends,
  ...Object.fromEntries(PLATFORM_IDS.map((p) => [p, platformSource(p)])),
};
export const SOURCE_IDS = Object.keys(SOURCES);
export const KEYLESS_IDS = ["reddit", "hn", "github", "news", "trends"];

/**
 * What runs when the caller names no sources: every keyless source, plus the Apify platforms
 * in APIFY_PLATFORMS when — and only when — APIFY_TOKEN is set. A fresh clone with an empty
 * .env therefore behaves exactly as before; adding a token adds TikTok/YouTube on its own.
 */
export function defaultSourceIds() {
  return [...KEYLESS_IDS, ...(hasApify() ? defaultPlatforms() : [])];
}

export function getSource(id) {
  const s = SOURCES[String(id || "").toLowerCase()];
  if (!s) throw new Error(`Unknown research source "${id}". Known: ${SOURCE_IDS.join(" | ")}.`);
  return s;
}

/**
 * Query several sources at once. Never rejects: a source that throws comes back as an
 * error entry, because "Reddit was rate-limited" is a thing the report should say out
 * loud rather than a reason to produce no report.
 */
export async function searchAll(topic, { sources = SOURCE_IDS, days = 30, limit = 50 } = {}) {
  const settled = await Promise.all(
    sources.map(async (id) => {
      try {
        // A source returns an array, or `{ items, note }` when it answered in a degraded
        // way it wants the report to mention (see reddit's RSS fallback).
        const r = await getSource(id).search(topic, { days, limit });
        const items = Array.isArray(r) ? r : (r?.items ?? []);
        return { id, ok: true, items, note: Array.isArray(r) ? null : (r?.note ?? null), error: null };
      } catch (e) {
        return { id, ok: false, items: [], note: null, error: e.message };
      }
    }),
  );
  return {
    items: settled.flatMap((r) => r.items),
    status: Object.fromEntries(
      settled.map((r) => [
        r.id,
        r.ok ? `${r.items.length} items${r.note ? ` — ${r.note}` : ""}` : `FAILED: ${r.error}`,
      ]),
    ),
  };
}
