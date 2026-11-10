// Google Trends + Apify platform sources. Pure parts only — no network, no token.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTraffic, parseTrendsRss, trendMatches, defaultSourceIds, SOURCE_IDS } from "../scripts/research/lib/sources.mjs";
import { NORMALISE, toRadarItem, INPUTS, ACTORS } from "../scripts/research/lib/apify.mjs";

const TRENDS = `<rss><channel><item><title>iphone 18</title><ht:approx_traffic>20K+</ht:approx_traffic>
<pubDate>Mon, 9 Nov 2026 20:00:00 -0800</pubDate>
<ht:news_item><ht:news_item_title>Giá iPhone 18 tại Việt Nam</ht:news_item_title><ht:news_item_url>https://x.vn/a</ht:news_item_url><ht:news_item_source>X</ht:news_item_source></ht:news_item>
</item><item><title>bão số 9</title><ht:approx_traffic>200+</ht:approx_traffic><pubDate>Mon, 9 Nov 2026 19:00:00 -0800</pubDate></item></channel></rss>`;

test("trend traffic strings become numbers", () => {
  assert.equal(parseTraffic("20K+"), 20000);
  assert.equal(parseTraffic("1M+"), 1e6);
  assert.equal(parseTraffic("200+"), 200);
  assert.equal(parseTraffic(""), 0);
});

test("the trends feed parses with its news items", () => {
  const t = parseTrendsRss(TRENDS);
  assert.equal(t.length, 2);
  assert.equal(t[0].traffic, 20000);
  assert.equal(t[0].news[0].url, "https://x.vn/a");
});

test("a trend matches its topic by whole Vietnamese words, headlines included", () => {
  const [ip, bao] = parseTrendsRss(TRENDS);
  assert.ok(trendMatches(ip, "iPhone"));
  assert.ok(trendMatches(ip, "giá điện thoại")); // "giá" is in the headline
  assert.ok(trendMatches(bao, "bão"));
  assert.ok(!trendMatches(bao, "bảo hiểm"), "bão ≠ bảo — diacritics are meaning");
});

test("a fresh clone with no token runs only keyless sources", () => {
  const prev = process.env.APIFY_TOKEN;
  delete process.env.APIFY_TOKEN;
  assert.deepEqual(defaultSourceIds(), ["reddit", "hn", "github", "news", "trends"]);
  process.env.APIFY_TOKEN = "x";
  assert.ok(defaultSourceIds().includes("tiktok"));
  if (prev === undefined) delete process.env.APIFY_TOKEN; else process.env.APIFY_TOKEN = prev;
  for (const p of ["tiktok", "instagram", "youtube", "facebook"]) assert.ok(SOURCE_IDS.includes(p));
});

test("TikTok actor output normalises to the common shape", () => {
  const n = NORMALISE.tiktok({ id: "7", text: "Mẹo AI #ai #video\nline 2", webVideoUrl: "https://www.tiktok.com/@a/video/7",
    createTimeISO: "2026-11-09T01:00:00.000Z", playCount: 120000, diggCount: 9000, commentCount: 300, authorMeta: { name: "a" },
    hashtags: [{ name: "ai" }, { name: "video" }] });
  assert.equal(n.title, "Mẹo AI #ai #video");
  assert.equal(n.views, 120000);
  assert.deepEqual(n.tags, ["ai", "video"]);
  const r = toRadarItem(n, "tiktok");
  assert.equal(r.engagement.votes, 120000);
  assert.equal(r.source, "tiktok");
});

test("Instagram and YouTube normalisers read their own field names", () => {
  const ig = NORMALISE.instagram({ shortCode: "Abc", caption: "Hello", timestamp: "2026-11-01T00:00:00Z", likesCount: 50, commentsCount: 2 });
  assert.equal(ig.url, "https://www.instagram.com/p/Abc/");
  assert.ok(Number.isNaN(ig.views));
  assert.equal(toRadarItem(ig, "instagram").engagement.votes, 50, "likes stand in when views are hidden");
  const yt = NORMALISE.youtube({ id: "q", title: "T", date: "2026-11-02", viewCount: "1000" });
  assert.equal(yt.views, 1000);
});

test("hashtag input drops Vietnamese diacritics (platform hashtags are ASCII)", () => {
  assert.deepEqual(INPUTS.instagram("Đồ ăn đường phố").hashtags, ["doanduongpho"]);
  assert.ok(ACTORS.tiktok.includes("/"));
});
