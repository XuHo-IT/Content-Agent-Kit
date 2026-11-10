// competitors.mjs — fetch what a competitor published, then say what is working for them.
//
// KEYLESS by design, like sources.mjs. Two kinds of target:
//
//   · YouTube channel — @handle, channel URL, or a bare UC… id. The public Atom feed
//     (feeds/videos.xml) lists the 15 newest uploads WITH view and like counts, no API key,
//     no quota. 15 is a real limit: this is "what are they doing lately", not a history.
//   · Any site with a feed — blog, news site, Substack, WordPress, Ghost. Autodiscovered from
//     <link rel="alternate">, then the usual paths. No engagement numbers, only cadence and
//     topics — and the report says so instead of pretending.
//
// TikTok and Instagram have no keyless endpoint that survives a week. With APIFY_TOKEN set
// (optional, paid — scripts/research/lib/apify.mjs) they work too: `tiktok:@handle`,
// `instagram:@handle`, or a tiktok.com / instagram.com profile URL.
//
// Everything below `── analysis ──` is pure and unit-tested; the network half is thin.
import { optionalEnv } from "../../lib/env.mjs";
import { runActor, INPUTS, NORMALISE, hasApify } from "./apify.mjs";

const UA = () =>
  optionalEnv(
    "RESEARCH_USER_AGENT",
    "Mozilla/5.0 (compatible; content-agent-kit/1.0; +https://github.com/XuHo-IT/Content-Agent-Kit)",
  );

/** YouTube's feed endpoint answers 500 on a fair share of first requests. Retry, briefly. */
async function getText(url, { tries = 3, timeoutMs = 20000, headers = {} } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA(), "accept-language": "en", cookie: "CONSENT=YES+1", ...headers },
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "follow",
      });
      if (res.ok) return { text: await res.text(), url: res.url };
      last = new Error(`HTTP ${res.status} ${url}`);
      if (res.status < 500 && res.status !== 429) break; // a 404 will not improve
    } catch (e) {
      last = e;
    }
    await new Promise((r) => setTimeout(r, 600 * (i + 1)));
  }
  throw last;
}

const decode = (s) =>
  String(s ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .trim();

const tag = (xml, name) => {
  const m = String(xml).match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : null;
};
const attr = (xml, name, a) => {
  const m = String(xml).match(new RegExp(`<${name}\\s[^>]*?${a}="([^"]*)"`));
  return m ? decode(m[1]) : null;
};

// ── target parsing ───────────────────────────────────────────────────────────

/** "@handle" | youtube URL | "UC…" | site URL → { kind, ref, label } */
export function parseTarget(raw) {
  const s = String(raw ?? "").trim();
  if (!s) throw new Error("empty competitor target");
  if (/^UC[\w-]{22}$/.test(s)) return { kind: "youtube", ref: s, label: s };
  const plat = s.match(/^(tiktok|tt|instagram|ig):\s*@?([\w.-]+)$/i);
  if (plat) {
    const kind = /^t/i.test(plat[1]) ? "tiktok" : "instagram";
    return { kind, ref: `@${plat[2]}`, label: `${kind}:@${plat[2]}` };
  }
  if (/^@[\w.-]+$/.test(s)) return { kind: "youtube", ref: s, label: s };
  const u = (() => {
    try {
      return new URL(/^https?:\/\//.test(s) ? s : `https://${s}`);
    } catch {
      return null;
    }
  })();
  if (!u) throw new Error(`not a channel or URL: ${s}`);
  if (/(^|\.)tiktok\.com$/.test(u.hostname) || /(^|\.)instagram\.com$/.test(u.hostname)) {
    const kind = /tiktok/.test(u.hostname) ? "tiktok" : "instagram";
    const h = u.pathname.match(/^\/@?([\w.-]+)/);
    if (!h) throw new Error(`${kind} URL without a profile: ${s}`);
    return { kind, ref: `@${h[1]}`, label: `${kind}:@${h[1]}` };
  }
  if (/(^|\.)youtube\.com$/.test(u.hostname)) {
    const ch = u.pathname.match(/\/channel\/(UC[\w-]{22})/);
    if (ch) return { kind: "youtube", ref: ch[1], label: ch[1] };
    const h = u.pathname.match(/\/(@[\w.-]+)/);
    if (h) return { kind: "youtube", ref: h[1], label: h[1] };
    throw new Error(`YouTube URL without a channel or @handle: ${s}`);
  }
  return { kind: "feed", ref: u.href, label: u.hostname.replace(/^www\./, "") };
}

// ── YouTube ──────────────────────────────────────────────────────────────────

/** The channel page states its own id three ways; any one is enough. */
export function channelIdFromHtml(html) {
  const m =
    String(html).match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/) ||
    String(html).match(/"externalId":"(UC[\w-]{22})"/) ||
    String(html).match(/itemprop="identifier" content="(UC[\w-]{22})"/);
  return m ? m[1] : null;
}

/** Parse YouTube's Atom feed into the kit's common item shape. */
export function parseYoutubeFeed(xml) {
  const channel = tag(String(xml).split("<entry>")[0], "title");
  const items = String(xml)
    .split("<entry>")
    .slice(1)
    .map((e) => {
      const id = tag(e, "yt:videoId");
      return {
        id,
        title: tag(e, "title"),
        url: `https://www.youtube.com/watch?v=${id}`,
        publishedAt: tag(e, "published"),
        views: Number(attr(e, "media:statistics", "views") ?? NaN),
        likes: Number(attr(e, "media:starRating", "count") ?? NaN),
        description: (tag(e, "media:description") ?? "").slice(0, 600),
      };
    })
    .filter((x) => x.id && x.title);
  return { channel, items };
}

async function fetchYoutube(t) {
  let id = t.ref;
  if (!/^UC/.test(id)) {
    const { text } = await getText(`https://www.youtube.com/${t.ref}`);
    id = channelIdFromHtml(text);
    if (!id) throw new Error(`could not resolve ${t.ref} to a channel id (consent wall or wrong handle)`);
  }
  const { text } = await getText(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
  const { channel, items } = parseYoutubeFeed(text);
  return { name: channel ?? t.label, url: `https://www.youtube.com/channel/${id}`, platform: "youtube", items };
}

// ── generic feed (RSS 2.0 / Atom) ────────────────────────────────────────────

/** <link rel="alternate" type="application/rss+xml" href="…"> → absolute URLs, in page order. */
export function discoverFeeds(html, base) {
  const out = [];
  for (const m of String(html).matchAll(/<link\b[^>]*>/gi)) {
    const l = m[0];
    if (!/rel=["']?alternate/i.test(l) || !/(rss|atom)\+xml/i.test(l)) continue;
    const href = l.match(/href=["']([^"']+)["']/i)?.[1];
    if (href) {
      try {
        out.push(new URL(decode(href), base).href);
      } catch {
        /* skip */
      }
    }
  }
  return [...new Set(out)];
}

export function parseFeed(xml) {
  const s = String(xml);
  const isAtom = /<feed[\s>]/.test(s) && !/<rss[\s>]/.test(s);
  const head = s.split(isAtom ? "<entry" : "<item")[0];
  const channel = tag(head, "title");
  const blocks = s.split(isAtom ? /<entry[\s>]/ : /<item[\s>]/).slice(1);
  const items = blocks
    .map((b) => {
      const link = isAtom ? attr(b, "link", "href") : tag(b, "link");
      const comments = Number(tag(b, "slash:comments") ?? NaN);
      const cats = [...b.matchAll(/<category(?:\s[^>]*?term="([^"]*)")?[^>]*?(?:\/>|>([\s\S]*?)<\/category>)/g)]
        .map((m) => decode(m[1] ?? m[2] ?? ""))
        .filter(Boolean);
      return {
        id: tag(b, "guid") ?? tag(b, "id") ?? link,
        title: tag(b, "title"),
        url: link,
        publishedAt: tag(b, "pubDate") ?? tag(b, "published") ?? tag(b, "updated") ?? tag(b, "dc:date"),
        views: NaN,
        likes: NaN,
        comments,
        categories: cats,
        description: (tag(b, "description") ?? tag(b, "summary") ?? "").replace(/<[^>]+>/g, " ").slice(0, 600),
      };
    })
    .filter((x) => x.title);
  return { channel, items };
}

async function fetchFeed(t) {
  const tryUrls = [];
  let page;
  try {
    page = await getText(t.ref);
    if (/<(rss|feed)[\s>]/.test(page.text.slice(0, 2000))) {
      const { channel, items } = parseFeed(page.text);
      return { name: channel ?? t.label, url: t.ref, platform: "feed", items };
    }
    tryUrls.push(...discoverFeeds(page.text, page.url));
  } catch {
    /* the homepage may block bots while the feed does not — fall through to the guesses */
  }
  const u0 = new URL(t.ref);
  const root = u0.origin;
  // Vietnamese news sites (VnExpress, Tuổi Trẻ, Thanh Niên…) publish one feed per section at
  // /rss/<section>.rss and link none of them from the section page itself.
  const section = u0.pathname.split("/").filter(Boolean).pop();
  if (section) tryUrls.push(`${root}/rss/${section}.rss`);
  tryUrls.push(`${root}/feed`, `${root}/rss.xml`, `${root}/feed.xml`, `${root}/atom.xml`, `${root}/rss`, `${root}/index.xml`);
  for (const u of [...new Set(tryUrls)]) {
    try {
      const { text } = await getText(u, { tries: 1 });
      if (!/<(rss|feed)[\s>]/.test(text.slice(0, 2000))) continue;
      const { channel, items } = parseFeed(text);
      if (items.length) return { name: channel ?? t.label, url: u, platform: "feed", items };
    } catch {
      /* next */
    }
  }
  throw new Error(`no RSS/Atom feed found for ${t.ref}`);
}

/** TikTok / Instagram profile through Apify. Same item shape as the YouTube feed. */
export async function fetchSocial(t) {
  if (!hasApify()) {
    throw new Error(`${t.kind} needs APIFY_TOKEN (optional, paid) — see .env.example. YouTube and RSS targets need nothing.`);
  }
  if (t.kind === "tiktok") {
    const items = (await runActor("tiktok", INPUTS.tiktokProfile(t.ref))).map(NORMALISE.tiktok);
    return { name: t.label, url: `https://www.tiktok.com/${t.ref}`, platform: "tiktok", items: items.filter((i) => i.url && i.title) };
  }
  // The Instagram profile actor returns ONE profile record with its latest posts nested.
  const prof = (await runActor("instagramProfile", INPUTS.instagramProfile(t.ref)))[0] ?? {};
  const items = (prof.latestPosts ?? []).map(NORMALISE.instagram);
  return { name: prof.fullName || t.label, url: `https://www.instagram.com/${t.ref.slice(1)}/`, platform: "instagram", items: items.filter((i) => i.url) };
}

export async function fetchCompetitor(raw) {
  const t = parseTarget(raw);
  if (t.kind === "tiktok" || t.kind === "instagram") return fetchSocial(t);
  return t.kind === "youtube" ? fetchYoutube(t) : fetchFeed(t);
}

// ── analysis (pure) ──────────────────────────────────────────────────────────

const VI_STOP = new Set(
  ("và của là có cho với các những được một này đó khi thì mà để không trong ra vào từ theo về như " +
    "đã sẽ đang rất cũng nhiều người làm bạn mình tôi chúng ta họ nó gì sao nào đây kia lại nên hay hơn " +
    // "ai" (who) is deliberately absent: in this kit's titles it is far more often "AI".
    "nhất bị vì nếu tại bằng trên dưới sau trước còn chỉ mới cùng thế vậy rồi đi lên xuống ở " +
    "the a an and or of to in on for with is are was were be by at as it this that from how why what " +
    "you your i we my our they he she not no do does can will just about into new vs " +
    "most more much very really thing things been being have has had get got its it's than then there " +
    "their them what's here now one all any some every out up off over so too only even still ever " +
    "could would should may might must did done make made way week day year time first last next").split(/\s+/),
);

/** Lowercase, keep Vietnamese letters, split into words. */
export function words(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFC")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !/^\d+$/.test(w));
}

/**
 * Keyword phrases. Vietnamese writes words as space-separated SYLLABLES — "trí tuệ nhân tạo"
 * is one idea in four tokens — so single tokens are mostly noise ("trí", "tuệ"). Bigrams
 * carry the meaning; unigrams are kept only when they look like a name or a term (latin, ≥4).
 */
export function phrases(title) {
  const w = words(title);
  const out = [];
  for (let i = 0; i < w.length - 1; i++) {
    if (VI_STOP.has(w[i]) || VI_STOP.has(w[i + 1])) continue;
    out.push(`${w[i]} ${w[i + 1]}`);
  }
  // A lone token is kept only when it looks like a NAME (written with a capital or a digit
  // somewhere other than sentence start: OpenAI, iPhone, GPT5) or is long enough not to be a
  // Vietnamese syllable that happens to be plain ASCII ("sinh", "trong", "thanh").
  const raw = String(title ?? "").normalize("NFC").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  raw.forEach((tok, i) => {
    const x = tok.toLowerCase();
    if (VI_STOP.has(x) || !/^[a-z0-9]{3,}$/.test(x) || /^\d+$/.test(x)) return;
    const named = /\d/.test(tok) || /[A-Z]/.test(tok.slice(1)) || (i > 0 && /^[A-Z]/.test(tok) && x.length >= 4);
    if (named || x.length >= 7) out.push(x);
  });
  return [...new Set(out)];
}

/**
 * Whole-word, case-insensitive, Unicode-aware. JavaScript's `\b` only knows ASCII letters, so
 * `\bđừng\b` never matches and `\bĐỪNG\b` splits at Ừ — every Vietnamese pattern needs this.
 */
const wordRe = (alts) => new RegExp(String.raw`(?<![\p{L}\p{N}])(?:${alts})(?![\p{L}\p{N}])`, "iu");
const RE = {
  question: wordRe(String.raw`tại sao|vì sao|làm sao|có nên|liệu|why|how|what|should`),
  howto: wordRe(String.raw`cách|hướng dẫn|how to|tutorial|guide|mẹo|bí quyết`),
  list: wordRe(String.raw`top\s*\d+|\d+\s*(?:cách|mẹo|lý do|điều|công cụ|tools?|ways|things|reasons|tips)`),
  curiosity: wordRe(
    String.raw`bí mật|sự thật|không ai|đừng|sai lầm|cảnh báo|sốc|không ngờ|thật ra|secret|truth|nobody|stop|mistake|never|actually|insane|finally`,
  ),
  versus: wordRe(String.raw`vs\.?|so sánh|đấu|versus`),
};
const ACRONYMS = wordRe("AI|API|GPT|CEO|USA|VN|SEO|GEO|UI|UX|AWS|GPU|CPU|LLM|MCP|NASA|OLED|iOS");

/** Title-pattern flags. Each one is a hook device worth counting, in either language. */
export function titleFlags(title) {
  const t = String(title ?? "").normalize("NFC");
  const noAcr = t.replace(new RegExp(ACRONYMS.source, "gu"), " ");
  return {
    number: /\d/.test(t),
    question: /\?/.test(t) || RE.question.test(t),
    howto: RE.howto.test(t),
    list: RE.list.test(t),
    brackets: /[[(【].+[\])】]/.test(t),
    // Four+ uppercase letters in a row, Vietnamese capitals included.
    caps: /(?<![\p{L}])\p{Lu}{4,}(?![\p{L}])/u.test(noAcr),
    emoji: /\p{Extended_Pictographic}/u.test(t),
    curiosity: RE.curiosity.test(t),
    versus: RE.versus.test(t),
    ellipsis: /\.\.\.|…/.test(t),
  };
}

const median = (xs) => {
  const a = xs.filter(Number.isFinite).sort((x, y) => x - y);
  if (!a.length) return NaN;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};

/**
 * Views per day since publish. Raw views reward old videos; velocity is what compares a
 * two-day-old upload with a two-week-old one. The first day is floored at 1 so a video an hour
 * old does not read as a million views a day.
 */
export function velocity(item, now = Date.now()) {
  const t = new Date(item.publishedAt).getTime();
  if (!Number.isFinite(item.views) || !Number.isFinite(t)) return NaN;
  return item.views / Math.max(1, (now - t) / 86_400_000);
}

/** One competitor → cadence, engagement, breakouts, hook patterns, best slots. */
export function analyzeChannel(c, { now = Date.now(), tzOffset = 7, breakoutX = 2 } = {}) {
  const items = c.items
    .filter((i) => Number.isFinite(new Date(i.publishedAt).getTime()))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  const times = items.map((i) => new Date(i.publishedAt).getTime());
  const spanDays = times.length > 1 ? (times[0] - times[times.length - 1]) / 86_400_000 : NaN;
  const gaps = times.slice(1).map((t, i) => (times[i] - t) / 86_400_000);

  for (const i of items) {
    i.velocity = velocity(i, now);
    i.engagement = Number.isFinite(i.likes) && i.views > 0 ? i.likes / i.views : NaN;
  }
  const medVel = median(items.map((i) => i.velocity));
  const medViews = median(items.map((i) => i.views));
  const hasViews = Number.isFinite(medViews);
  // Two different signals, kept apart on purpose:
  //   outlier — total views ≥ breakoutX × the channel's median. The standard "outlier score":
  //             it compares a video with its own channel, so a small channel's hit counts.
  //   rising  — under 7 days old and gaining views/day ≥ breakoutX × the median velocity.
  //             Velocity alone flatters every fresh upload (views decay with age), so it is
  //             only trusted while a video is young, and reported as "rising", not "hit".
  const ageDays = (i) => (now - new Date(i.publishedAt).getTime()) / 86_400_000;
  for (const i of items) {
    i.outlier = hasViews && i.views >= breakoutX * medViews;
    i.rising = hasViews && !i.outlier && ageDays(i) < 7 && i.velocity >= breakoutX * medVel;
  }
  const breakouts = items
    .filter((i) => i.outlier || i.rising)
    .sort((a, b) => b.views / medViews - a.views / medViews);

  const flagCounts = {};
  const breakoutFlags = {};
  for (const i of items) {
    const f = titleFlags(i.title);
    for (const [k, v] of Object.entries(f)) if (v) flagCounts[k] = (flagCounts[k] ?? 0) + 1;
    if (breakouts.includes(i)) for (const [k, v] of Object.entries(f)) if (v) breakoutFlags[k] = (breakoutFlags[k] ?? 0) + 1;
  }

  const slot = (t) => new Date(t + tzOffset * 3_600_000);
  const weekday = {};
  const hour = {};
  for (const t of times) {
    const d = slot(t);
    weekday[d.getUTCDay()] = (weekday[d.getUTCDay()] ?? 0) + 1;
    hour[d.getUTCHours()] = (hour[d.getUTCHours()] ?? 0) + 1;
  }

  return {
    name: c.name,
    url: c.url,
    platform: c.platform,
    count: items.length,
    spanDays,
    perWeek: spanDays > 0 ? ((items.length - 1) / spanDays) * 7 : NaN,
    medianGapDays: median(gaps),
    medianViews: medViews,
    medianVelocity: medVel,
    medianEngagement: median(items.map((i) => i.engagement)),
    medianTitleLen: median(items.map((i) => [...String(i.title)].length)),
    flagShare: Object.fromEntries(Object.entries(flagCounts).map(([k, v]) => [k, v / (items.length || 1)])),
    breakoutFlags,
    breakouts: breakouts.map(({ title, url, views, velocity: v, publishedAt, outlier }) => ({
      title,
      url,
      views,
      velocity: v,
      publishedAt,
      kind: outlier ? "outlier" : "rising",
      ratio: views / medViews,
    })),
    weekday,
    hour,
    items,
  };
}

/**
 * Across all competitors: which phrases recur, which recur IN BREAKOUTS, and which of those
 * the caller has never covered (their own history.json titles). That last list is the point.
 */
export function topicGaps(analyses, ownTitles = [], { top = 15 } = {}) {
  const own = new Set(ownTitles.flatMap(phrases));
  const all = new Map(); // phrase → {count, channels:Set, breakout}
  for (const a of analyses) {
    const bset = new Set(a.breakouts.map((b) => b.url));
    for (const i of a.items) {
      for (const p of phrases(i.title)) {
        const e = all.get(p) ?? { phrase: p, count: 0, channels: new Set(), breakout: 0 };
        e.count++;
        e.channels.add(a.name);
        if (bset.has(i.url)) e.breakout++;
        all.set(p, e);
      }
    }
  }
  const scored = [...all.values()]
    .filter((e) => e.count >= 2 || e.breakout >= 1)
    .map((e) => ({
      phrase: e.phrase,
      count: e.count,
      channels: e.channels.size,
      breakout: e.breakout,
      covered: own.has(e.phrase),
      // A phrase two channels both use beats one channel repeating itself; a breakout is
      // worth three ordinary uses because it is evidence the AUDIENCE wanted it.
      score: e.count + 2 * (e.channels.size - 1) + 3 * e.breakout,
    }))
    .sort((a, b) => b.score - a.score || a.phrase.localeCompare(b.phrase));
  return {
    trending: scored.slice(0, top),
    gaps: scored.filter((e) => !e.covered).slice(0, top),
  };
}

const DOW = {
  vi: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};
const FLAG_LABEL = {
  vi: {
    number: "có con số",
    question: "câu hỏi",
    howto: "hướng dẫn / mẹo",
    list: "dạng list (top N)",
    brackets: "ngoặc [..]",
    caps: "VIẾT HOA nhấn mạnh",
    emoji: "emoji",
    curiosity: "gây tò mò (bí mật, sự thật…)",
    versus: "so sánh / vs",
    ellipsis: "dấu … bỏ lửng",
  },
  en: {
    number: "number",
    question: "question",
    howto: "how-to / tips",
    list: "listicle (top N)",
    brackets: "[brackets]",
    caps: "ALL-CAPS emphasis",
    emoji: "emoji",
    curiosity: "curiosity (secret, truth…)",
    versus: "versus / comparison",
    ellipsis: "trailing …",
  },
};

const fmt = (n) =>
  !Number.isFinite(n) ? "—" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${Math.round(n)}`;
const pct = (x) => (Number.isFinite(x) ? `${Math.round(x * 100)}%` : "—");
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|");

/** Markdown report — Vietnamese by default, because that is who this kit is tuned for. */
export function reportMd({ analyses, gaps, failures = [], lang = "vi", date = new Date().toISOString().slice(0, 10) }) {
  const L = lang === "en";
  const T = (vi, en) => (L ? en : vi);
  const out = [
    `# ${T("Phân tích đối thủ", "Competitor scan")} — ${date}`,
    "",
    `| ${T("kênh", "channel")} | ${T("nền tảng", "platform")} | ${T("bài/tuần", "posts/wk")} | ${T("view trung vị", "median views")} | ${T("view/ngày", "views/day")} | ${T("like/view", "like/view")} | ${T("bứt phá", "breakouts")} |`,
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...analyses.map(
      (a) =>
        `| [${esc(a.name)}](${a.url}) | ${a.platform} | ${Number.isFinite(a.perWeek) ? a.perWeek.toFixed(1) : "—"} | ${fmt(a.medianViews)} | ${fmt(a.medianVelocity)} | ${pct(a.medianEngagement)} | ${a.breakouts.length} |`,
    ),
    "",
  ];
  if (failures.length) {
    out.push(`> ${T("Không lấy được", "Could not fetch")}: ${failures.map((f) => `\`${f.target}\` (${f.error})`).join(", ")}`, "");
  }
  if (analyses.some((a) => a.platform === "feed")) {
    out.push(
      `> ${T(
        "Nguồn RSS/blog không công bố lượt xem — chỉ so được tần suất đăng và chủ đề, không so được hiệu quả.",
        "RSS/blog sources publish no view counts — cadence and topics only, not performance.",
      )}`,
      "",
    );
  }

  out.push(`## ${T("Video bứt phá — so với chính kênh đó", "Breakouts — against the channel's own baseline")}`, "");
  const bo = analyses.flatMap((a) => a.breakouts.map((b) => ({ ...b, ch: a.name }))).sort((x, y) => y.ratio - x.ratio);
  if (!bo.length) out.push(T("_Không có — hoặc nguồn không có số view._", "_None — or the sources carry no view counts._"), "");
  else {
    out.push(
      T(
        "_**outlier** = tổng view ≥2× trung vị của kênh · **đang lên** = đăng <7 ngày, view/ngày ≥2× trung vị_",
        "_**outlier** = total views ≥2× the channel median · **rising** = <7 days old, views/day ≥2× median_",
      ),
      "",
      `| ${T("kênh", "channel")} | ${T("loại", "kind")} | ${T("tiêu đề", "title")} | views | ${T("× trung vị", "× median")} |`,
      "| --- | --- | --- | --- | --- |",
    );
    for (const b of bo.slice(0, 12))
      out.push(
        `| ${esc(b.ch)} | ${b.kind === "outlier" ? "outlier" : T("đang lên", "rising")} | [${esc(b.title)}](${b.url}) | ${fmt(b.views)} | ${Number.isFinite(b.ratio) ? b.ratio.toFixed(1) : "—"}× |`,
      );
    out.push("");
  }

  out.push(`## ${T("Công thức tiêu đề", "Title patterns")}`, "");
  out.push(`| ${T("kênh", "channel")} | ${T("độ dài TB", "median len")} | ${T("mẫu hay dùng nhất", "most-used devices")} | ${T("mẫu xuất hiện ở bài bứt phá", "devices in breakouts")} |`, "| --- | --- | --- | --- |");
  for (const a of analyses) {
    const top = Object.entries(a.flagShare)
      .sort((x, y) => y[1] - x[1])
      .slice(0, 3)
      .map(([k, v]) => `${FLAG_LABEL[lang][k]} ${pct(v)}`)
      .join(", ");
    const bf = Object.entries(a.breakoutFlags)
      .sort((x, y) => y[1] - x[1])
      .slice(0, 3)
      .map(([k, v]) => `${FLAG_LABEL[lang][k]} ×${v}`)
      .join(", ");
    out.push(`| ${esc(a.name)} | ${Number.isFinite(a.medianTitleLen) ? a.medianTitleLen : "—"} | ${top || "—"} | ${bf || "—"} |`);
  }
  out.push("");

  out.push(`## ${T("Lịch đăng", "Posting schedule")} (UTC${L ? "" : ""}+${analyses._tz ?? 7})`, "");
  for (const a of analyses) {
    const d = Object.entries(a.weekday).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, v]) => `${DOW[lang][k]}×${v}`).join(" ");
    const h = Object.entries(a.hour).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, v]) => `${k}h×${v}`).join(" ");
    out.push(`- **${a.name}** — ${d || "—"} · ${h || "—"} · ${T("cách nhau trung vị", "median gap")} ${Number.isFinite(a.medianGapDays) ? a.medianGapDays.toFixed(1) : "—"} ${T("ngày", "days")}`);
  }
  out.push("");

  out.push(`## ${T("Khoảng trống chủ đề — đối thủ đang làm, bạn chưa làm", "Topic gaps — they cover it, you have not")}`, "");
  if (!gaps.gaps.length) out.push(T("_Không có cụm từ nào lặp đủ để kết luận._", "_No phrase recurs enough to call._"), "");
  else {
    out.push(`| ${T("cụm từ", "phrase")} | ${T("số lần", "uses")} | ${T("số kênh", "channels")} | ${T("ở bài bứt phá", "in breakouts")} |`, "| --- | --- | --- | --- |");
    for (const g of gaps.gaps) out.push(`| ${esc(g.phrase)} | ${g.count} | ${g.channels} | ${g.breakout} |`);
    out.push("");
  }
  out.push(
    `---`,
    T(
      "_Số liệu là tín hiệu, không phải kết luận. Mở 2–3 video bứt phá, xem 5 giây đầu, rồi mới quyết định góc. Không sao chép tiêu đề — lấy CÔNG THỨC, viết nội dung của bạn._",
      "_Signals, not verdicts. Watch the first 5 seconds of 2–3 breakouts before choosing an angle. Do not copy titles — take the device, write your own._",
    ),
  );
  return out.join("\n") + "\n";
}
