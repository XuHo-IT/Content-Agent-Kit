import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseTarget,
  channelIdFromHtml,
  parseYoutubeFeed,
  parseFeed,
  discoverFeeds,
  titleFlags,
  phrases,
  analyzeChannel,
  topicGaps,
  reportMd,
} from "../scripts/research/lib/competitors.mjs";

const DAY = 86_400_000;
const NOW = Date.parse("2026-11-10T00:00:00Z");

const ytEntry = (id, title, daysAgo, views, likes) => `
 <entry>
  <yt:videoId>${id}</yt:videoId>
  <title>${title}</title>
  <published>${new Date(NOW - daysAgo * DAY).toISOString()}</published>
  <media:group><media:description>d</media:description>
   <media:community><media:starRating count="${likes}" average="5.00"/>
   <media:statistics views="${views}"/></media:community></media:group>
 </entry>`;

const YT = `<?xml version="1.0"?><feed><title>Kênh Đối Thủ</title>
${ytEntry("a1", "Top 5 công cụ AI miễn phí cho sinh viên", 30, 100000, 3000)}
${ytEntry("a2", "Cách dùng Claude Code để viết web", 25, 90000, 2000)}
${ytEntry("a3", "Sự thật về AI agent mà không ai nói", 20, 400000, 12000)}
${ytEntry("a4", "Có nên học lập trình năm 2026?", 15, 80000, 1500)}
${ytEntry("a5", "AI agent làm thay việc văn phòng", 2, 60000, 2000)}
</feed>`;

test("targets: handles, channel URLs, ids and sites are told apart", () => {
  assert.deepEqual(parseTarget("@fireship").kind, "youtube");
  assert.equal(parseTarget("https://www.youtube.com/@mkbhd/videos").ref, "@mkbhd");
  assert.equal(parseTarget("https://youtube.com/channel/UCsBjURrPoezykLs9EqgamOA").ref, "UCsBjURrPoezykLs9EqgamOA");
  assert.equal(parseTarget("UCsBjURrPoezykLs9EqgamOA").kind, "youtube");
  const site = parseTarget("vnexpress.net/so-hoa");
  assert.equal(site.kind, "feed");
  assert.equal(site.label, "vnexpress.net");
  assert.throws(() => parseTarget("https://youtube.com/watch?v=x"));
});

test("channel id is read from any of the three places the page states it", () => {
  const id = "UCsBjURrPoezykLs9EqgamOA";
  assert.equal(channelIdFromHtml(`<link rel="canonical" href="https://www.youtube.com/channel/${id}">`), id);
  assert.equal(channelIdFromHtml(`{"externalId":"${id}"}`), id);
  assert.equal(channelIdFromHtml("<html>consent</html>"), null);
});

test("YouTube feed: views and likes are parsed as numbers", () => {
  const { channel, items } = parseYoutubeFeed(YT);
  assert.equal(channel, "Kênh Đối Thủ");
  assert.equal(items.length, 5);
  assert.equal(items[2].views, 400000);
  assert.equal(items[2].likes, 12000);
  assert.match(items[0].url, /watch\?v=a1$/);
});

test("RSS and Atom both parse, CDATA and entities decoded", () => {
  const rss = `<rss><channel><title>Báo</title><item><title><![CDATA[AI &amp; việc làm]]></title><link>https://x.vn/1</link><pubDate>Mon, 09 Nov 2026 08:00:00 +0700</pubDate><category>AI</category></item></channel></rss>`;
  const r = parseFeed(rss);
  assert.equal(r.channel, "Báo");
  assert.equal(r.items[0].title, "AI & việc làm");
  assert.deepEqual(r.items[0].categories, ["AI"]);
  const atom = `<feed><title>Blog</title><entry><title>Hello</title><link href="https://b/1"/><published>2026-11-01T00:00:00Z</published></entry></feed>`;
  assert.equal(parseFeed(atom).items[0].url, "https://b/1");
});

test("feed autodiscovery resolves relative hrefs", () => {
  const html = `<link rel="alternate" type="application/rss+xml" href="/rss/so-hoa.rss"><link rel="stylesheet" href="/a.css">`;
  assert.deepEqual(discoverFeeds(html, "https://vnexpress.net/so-hoa"), ["https://vnexpress.net/rss/so-hoa.rss"]);
});

test("title flags recognise Vietnamese hook devices", () => {
  assert.ok(titleFlags("Top 5 công cụ AI").list);
  assert.ok(titleFlags("Cách dùng Claude").howto);
  assert.ok(titleFlags("Sự thật về AI mà không ai nói").curiosity);
  assert.ok(titleFlags("Có nên học lập trình?").question);
  assert.ok(!titleFlags("AI và API cho CEO").caps, "acronyms are not shouting");
  assert.ok(titleFlags("ĐỪNG làm điều này").caps);
});

test("phrases keep Vietnamese bigrams and names, drop bare syllables", () => {
  const p = phrases("Sinh viên Việt Nam dùng OpenAI");
  assert.ok(p.includes("sinh viên"));
  assert.ok(p.includes("openai"));
  assert.ok(!p.includes("sinh"));
});

test("an outlier is measured against the channel's own median, not raw views", () => {
  const { items } = parseYoutubeFeed(YT);
  const a = analyzeChannel({ name: "c", url: "u", platform: "youtube", items }, { now: NOW });
  assert.equal(a.medianViews, 90000);
  const kinds = Object.fromEntries(a.breakouts.map((b) => [b.title.slice(0, 8), b.kind]));
  assert.equal(kinds["Sự thật "], "outlier"); // 400k ≥ 2 × 90k
  assert.equal(kinds["AI agent"], "rising"); // 2 days old, 30k/day vs median ~4k/day
  assert.ok(a.perWeek > 0);
});

test("a feed with no view counts produces no breakouts rather than fake ones", () => {
  const a = analyzeChannel({
    name: "blog",
    url: "u",
    platform: "feed",
    items: [
      { title: "A b", publishedAt: new Date(NOW - DAY).toISOString(), views: NaN, likes: NaN },
      { title: "C d", publishedAt: new Date(NOW - 3 * DAY).toISOString(), views: NaN, likes: NaN },
    ],
  }, { now: NOW });
  assert.equal(a.breakouts.length, 0);
});

test("topic gaps exclude what the caller already covered", () => {
  const { items } = parseYoutubeFeed(YT);
  const a = analyzeChannel({ name: "c", url: "u", platform: "youtube", items }, { now: NOW });
  const g = topicGaps([a], ["Hướng dẫn AI agent cho người mới"]);
  assert.ok(g.trending.some((x) => x.phrase === "ai agent"));
  assert.ok(!g.gaps.some((x) => x.phrase === "ai agent"), "already covered — not a gap");
  const md = reportMd({ analyses: [a], gaps: g, date: "2026-11-10" });
  assert.match(md, /Phân tích đối thủ/);
  assert.match(md, /outlier/);
});

test("tiktok and instagram targets parse, and need a token rather than failing silently", async () => {
  assert.equal(parseTarget("tiktok:@vtv24news").kind, "tiktok");
  assert.equal(parseTarget("https://www.instagram.com/hoaminzy/").ref, "@hoaminzy");
  const { fetchCompetitor } = await import("../scripts/research/lib/competitors.mjs");
  const prev = process.env.APIFY_TOKEN;
  delete process.env.APIFY_TOKEN;
  await assert.rejects(() => fetchCompetitor("tiktok:@x"), /APIFY_TOKEN/);
  if (prev !== undefined) process.env.APIFY_TOKEN = prev;
});
