// topic-radar.test.mjs — the judgement half of the research layer, offline.
//
// No network on purpose, and no clock: `rank()` takes `now` as an argument precisely so this
// file can assert an ordering that is still true next year. A ranking test that called
// Date.now() would start failing three days after it was written, get deleted, and leave the
// most opinionated code in the layer as the only part with nothing checking it.
//
// What is checked here is everything a plausible-looking change could quietly break: the
// cross-source multiplier that decides what "hot" means, the percentile that keeps GitHub
// stars from drowning Reddit upvotes, the flat-set rule that stops a wire feed being
// permanently last, and the dedup that has to survive Vietnamese diacritics.
import test from "node:test";
import assert from "node:assert/strict";
import {
  deaccent,
  slugify,
  normalizeTitle,
  titleKey,
  urlKey,
  sameStory,
  dedupe,
  engagementValue,
  heatByPercentile,
  freshness,
  rank,
  seenKeys,
  dropSeen,
} from "../scripts/research/lib/rank.mjs";
import { parseRss } from "../scripts/research/lib/sources.mjs";

const NOW = Date.parse("2026-08-16T00:00:00Z");
const daysAgo = (n) => new Date(NOW - n * 86_400_000).toISOString();

const item = (over = {}) => ({
  id: "x",
  title: "A story",
  url: "https://example.com/a",
  source: "hn",
  publishedAt: daysAgo(0),
  engagement: { votes: 10, comments: 1 },
  ...over,
});

// ── text normalisation ───────────────────────────────────────────────────────

test("deaccent folds Vietnamese, including d-with-stroke", () => {
  // NFD decomposes the tone marks but NOT đ — it is a distinct letter, not a base plus a
  // combining mark, so it needs its own rule. Dropping that rule is invisible until a
  // Vietnamese title fails to dedup against its own rewrite.
  assert.equal(deaccent("Chuyện Chưa Kể đô thị"), "Chuyen Chua Ke do thi");
  assert.equal(deaccent("Đà Nẵng"), "Da Nang");
  assert.equal(deaccent("Truyền thuyết"), "Truyen thuyet");
});

test("slugify produces a safe, capped, ASCII filename stem", () => {
  assert.equal(slugify("Truyền thuyết Đô Thị"), "truyen-thuyet-do-thi");
  assert.equal(slugify("AI coding agents!!!"), "ai-coding-agents");
  assert.equal(slugify(""), "topic");
  assert.equal(slugify("!!!"), "topic");
  const long = slugify("a".repeat(80));
  assert.ok(long.length <= 40, `slug was ${long.length} chars`);
  assert.ok(!long.endsWith("-"), "slug must not end on a separator");
});

test("normalizeTitle drops stopwords in both languages", () => {
  assert.equal(normalizeTitle("The new model is here"), "model here");
  // "vừa", "ra" and "mới" go; "mắt" and "mô" are signal, not filler.
  assert.equal(normalizeTitle("OpenAI vừa ra mắt mô hình mới"), "openai mat mo hinh");
});

test("urlKey ignores scheme, www, trailing slash and query", () => {
  const a = urlKey("https://www.example.com/post/1?utm_source=reddit");
  assert.equal(a, urlKey("http://example.com/post/1/"));
  assert.equal(a, urlKey("https://example.com/POST/1"));
  assert.notEqual(a, urlKey("https://example.com/post/2"));
});

test("urlKey survives a value that is not a URL at all", () => {
  assert.doesNotThrow(() => urlKey("not a url"));
  assert.doesNotThrow(() => urlKey(undefined));
});

// ── dedup ────────────────────────────────────────────────────────────────────

test("the same link from two sources becomes one story carrying both", () => {
  const merged = dedupe([
    item({ id: "1", source: "reddit", url: "https://example.com/post?utm_source=x", engagement: { votes: 100, comments: 10 } }),
    item({ id: "2", source: "hn", url: "https://www.example.com/post/", engagement: { votes: 50, comments: 5 } }),
  ]);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].sources.sort(), ["hn", "reddit"]);
  assert.deepEqual(merged[0].engagement, { votes: 150, comments: 15 });
});

test("a trailing word does not split one announcement into two stories", () => {
  // This is exactly what a first-N-words key got wrong: a four-word key and a five-word key
  // never meet, and outlets pad headlines with precisely that kind of trailing word.
  const merged = dedupe([
    item({ id: "1", source: "news", url: "https://a.com/1", title: "OpenAI launches a new coding model today" }),
    item({ id: "2", source: "news", url: "https://b.com/2", title: "OpenAI launches a new coding model" }),
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].variants.length, 1);
});

test("two different launches by the same company stay two stories", () => {
  // The other side of the same threshold. Over-merging silently deletes a story, so this
  // pair is the one that pins the similarity cutoff where it is.
  const merged = dedupe([
    item({ id: "1", source: "news", url: "https://a.com/1", title: "OpenAI releases GPT model" }),
    item({ id: "2", source: "news", url: "https://b.com/2", title: "OpenAI releases Sora model" }),
  ]);
  assert.equal(merged.length, 2);
});

test("sameStory does not let a two-word headline match everything", () => {
  assert.equal(sameStory("Apple ships", "Apple ships iPhone and iPad and Watch today"), false);
  assert.equal(sameStory("", "anything at all"), false);
});

test("a merged story keeps the EARLIEST date, not the last one seen", () => {
  // When the story broke, not when the slowest aggregator noticed. Taking the later date
  // would make old news look fresh every time another outlet picked it up.
  const merged = dedupe([
    item({ id: "1", url: "https://e.com/x", publishedAt: daysAgo(1) }),
    item({ id: "2", url: "https://e.com/x", publishedAt: daysAgo(5), source: "reddit" }),
  ]);
  assert.equal(merged[0].publishedAt, daysAgo(5));
});

test("unrelated stories are left alone", () => {
  const merged = dedupe([
    item({ id: "1", url: "https://a.com/1", title: "Vietnam opens a new bridge" }),
    item({ id: "2", url: "https://b.com/2", title: "Rust ships a new borrow checker" }),
  ]);
  assert.equal(merged.length, 2);
});

// ── scoring ──────────────────────────────────────────────────────────────────

test("a comment is worth more than a vote", () => {
  assert.equal(engagementValue({ engagement: { votes: 10, comments: 0 } }), 10);
  assert.equal(engagementValue({ engagement: { votes: 0, comments: 10 } }), 20);
  assert.equal(engagementValue({}), 0);
});

test("heat is a percentile WITHIN a source, so scales never compete", () => {
  // GitHub numbers dwarf Hacker News numbers. If heat were global, every HN story would sit
  // at the floor forever regardless of how well it did on Hacker News.
  const items = [
    item({ id: "gh-lo", source: "github", engagement: { votes: 500, comments: 0 } }),
    item({ id: "gh-hi", source: "github", engagement: { votes: 9000, comments: 0 } }),
    item({ id: "hn-lo", source: "hn", engagement: { votes: 5, comments: 0 } }),
    item({ id: "hn-hi", source: "hn", engagement: { votes: 300, comments: 0 } }),
  ];
  const heat = heatByPercentile(items);
  const by = (id) => heat.get(items.find((i) => i.id === id));
  assert.equal(by("gh-hi"), by("hn-hi"), "top of each source should score alike");
  assert.equal(by("gh-lo"), by("hn-lo"), "bottom of each source should score alike");
  assert.ok(by("hn-hi") > by("gh-lo"), "a strong HN story must beat a weak GitHub one");
});

test("a source with no engagement numbers gets neutral heat, not the floor", () => {
  // An RSS wire reports no votes at all. Treating "no signal" as "the weakest signal" would
  // rank the news feed below every Reddit thread permanently, which is not what it means.
  const wire = [
    item({ id: "n1", source: "news", engagement: { votes: 0, comments: 0 } }),
    item({ id: "n2", source: "news", engagement: { votes: 0, comments: 0 } }),
  ];
  const heat = heatByPercentile(wire);
  for (const it of wire) {
    assert.equal(heat.get(it), 0.55);
    assert.ok(heat.get(it) > 0.1, "must sit above the percentile floor");
  }
});

test("freshness halves over the half-life and handles the awkward inputs", () => {
  assert.equal(freshness(daysAgo(0), NOW, 3), 1);
  assert.ok(Math.abs(freshness(daysAgo(3), NOW, 3) - 0.5) < 1e-9);
  assert.ok(Math.abs(freshness(daysAgo(6), NOW, 3) - 0.25) < 1e-9);
  assert.equal(freshness(null, NOW, 3), 0.35, "undated is neither fresh nor dismissed");
  assert.equal(freshness("not a date", NOW, 3), 0.35);
  assert.equal(freshness(new Date(NOW + 86_400_000).toISOString(), NOW, 3), 1, "clock skew must not exceed 1");
});

// A realistic-sized fixture: a percentile over two items is only ever 0.1 or 1.0, which
// makes a toy fixture assert something no real run would reproduce.
const spread = (source, values, titlePrefix) =>
  values.map((v, i) =>
    item({
      id: `${source}-${i}`,
      source,
      url: `https://${source}${i}.com/p`,
      title: `${titlePrefix} number ${i} distinct wording`,
      engagement: { votes: v, comments: 0 },
    }),
  );

test("a merged story is measured in the source where it did BEST, not an arbitrary one", () => {
  // Before this, dedup ran first and a cross-source story carried whichever `source` arrived
  // first, so its SUMMED engagement was percentile-ranked inside that one group — landing at
  // the bottom of Reddit while sitting mid-pack on Hacker News.
  const cross = [
    item({ id: "c-r", source: "reddit", url: "https://cross.com/x", title: "Carried in two places", engagement: { votes: 400, comments: 0 } }),
    item({ id: "c-h", source: "hn", url: "https://cross.com/x", title: "Carried in two places", engagement: { votes: 200, comments: 0 } }),
  ];
  const raw = [
    ...spread("reddit", [100, 200, 300, 500, 600, 700], "Reddit thing"),
    ...spread("hn", [100, 300], "HN thing"),
    ...cross,
  ];
  const ranked = rank(raw, { now: NOW });
  const merged = ranked.find((r) => r.title === "Carried in two places");

  assert.deepEqual(merged.sources.sort(), ["hn", "reddit"]);
  assert.equal(merged.crossSource, 1.5);
  // Mid-pack on Reddit (400 of 100–700) and mid-pack on HN — the best of the two, never the
  // floor its summed 600 would have earned it against Reddit's spread.
  assert.ok(merged.heat > 0.4, `heat collapsed to ${merged.heat}`);
});

test("at comparable heat, the cross-source story wins", () => {
  const raw = [
    ...spread("reddit", [100, 200, 300, 600, 700], "Reddit thing"),
    item({ id: "solo", source: "reddit", url: "https://solo.com/p", title: "Loud in one place only", engagement: { votes: 500, comments: 0 } }),
    item({ id: "c-r", source: "reddit", url: "https://cross.com/x", title: "Carried in two places", engagement: { votes: 400, comments: 0 } }),
    item({ id: "c-h", source: "hn", url: "https://cross.com/x", title: "Carried in two places", engagement: { votes: 200, comments: 0 } }),
    ...spread("hn", [100, 300], "HN thing"),
  ];
  const ranked = rank(raw, { now: NOW });
  const cross = ranked.find((r) => r.title === "Carried in two places");
  const solo = ranked.find((r) => r.title === "Loud in one place only");
  assert.ok(cross.score > solo.score, `cross ${cross.score} did not beat solo ${solo.score}`);
});

test("but crossSource is a multiplier, not an override — a far louder story still wins", () => {
  const raw = [
    ...spread("reddit", [100, 200, 300, 400, 500], "Reddit thing"),
    item({ id: "huge", source: "reddit", url: "https://huge.com/p", title: "Enormous single source story", engagement: { votes: 90000, comments: 9000 } }),
    item({ id: "c-r", source: "reddit", url: "https://cross.com/x", title: "Carried in two places", engagement: { votes: 150, comments: 0 } }),
    item({ id: "c-h", source: "hn", url: "https://cross.com/x", title: "Carried in two places", engagement: { votes: 100, comments: 0 } }),
    ...spread("hn", [50, 500], "HN thing"),
  ];
  const ranked = rank(raw, { now: NOW });
  assert.equal(ranked[0].title, "Enormous single source story");
});

test("rank drops its working state before returning", () => {
  // `parts` holds every original item; leaving it in would roughly double each radar file.
  const ranked = rank([item({ id: "a" })], { now: NOW });
  assert.equal(ranked[0].parts, undefined);
});

test("freshness outranks heat once a story is old enough", () => {
  const ranked = rank(
    [
      item({ id: "old", url: "https://a.com/old", title: "Old but big", engagement: { votes: 1000, comments: 100 }, publishedAt: daysAgo(21) }),
      item({ id: "new", url: "https://b.com/new", title: "New and small", engagement: { votes: 900, comments: 90 }, publishedAt: daysAgo(0) }),
    ],
    { now: NOW },
  );
  assert.equal(ranked[0].title, "New and small");
});

test("rank returns a stable, fully-populated, descending list", () => {
  const ranked = rank([item({ id: "a" }), item({ id: "b", url: "https://c.com/b" })], { now: NOW });
  for (let i = 1; i < ranked.length; i++) assert.ok(ranked[i - 1].score >= ranked[i].score);
  for (const r of ranked) {
    for (const f of ["score", "heat", "freshness", "crossSource"]) {
      assert.equal(typeof r[f], "number", `missing ${f}`);
      assert.ok(Number.isFinite(r[f]), `${f} is not finite`);
    }
  }
});

// ── the seen-ledger ──────────────────────────────────────────────────────────

test("a seen story is dropped by url OR by title", () => {
  const stories = [
    item({ id: "1", url: "https://a.com/1", title: "Story one here now" }),
    item({ id: "2", url: "https://b.com/2", title: "Story two here now" }),
  ];
  assert.equal(dropSeen(stories, seenKeys(stories[0])).length, 1);
  assert.equal(dropSeen(stories, [`t:${titleKey(stories[1].title)}`])[0].id, "1");
  assert.equal(dropSeen(stories, []).length, 2, "an empty ledger drops nothing");
  assert.equal(dropSeen(stories, undefined).length, 2, "a missing ledger drops nothing");
});

test("the ledger also remembers a merged story's other links", () => {
  // Otherwise the same story resurfaces tomorrow under whichever mirror ranked second today.
  const [merged] = dedupe([
    item({ id: "1", source: "reddit", url: "https://a.com/x", title: "Same thing said once" }),
    item({ id: "2", source: "hn", url: "https://b.com/x", title: "Same thing said once" }),
  ]);
  const keys = seenKeys(merged);
  assert.ok(keys.includes(`u:${urlKey("https://a.com/x")}`));
  assert.ok(keys.includes(`u:${urlKey("https://b.com/x")}`));
});

// ── the hand-rolled RSS reader ───────────────────────────────────────────────

test("parseRss reads the shape Google News actually emits", () => {
  // Hand-rolled because the kit ships no node_modules. CDATA, numeric entities and the
  // <source url> attribute are all things the real feed contains and a naive reader loses.
  const xml = `<?xml version="1.0"?><rss><channel>
    <item>
      <title><![CDATA[OpenAI &#39;ships&#39; a thing &amp; more]]></title>
      <link>https://news.google.com/rss/articles/abc</link>
      <pubDate>Fri, 14 Aug 2026 09:00:00 GMT</pubDate>
      <description>&lt;p&gt;Body text&lt;/p&gt;</description>
      <source url="https://vnexpress.net">VnExpress</source>
      <guid>g-1</guid>
    </item>
    <item><title>No link here</title></item>
  </channel></rss>`;
  const rows = parseRss(xml);
  assert.equal(rows.length, 1, "an item with no link is not a story");
  assert.equal(rows[0].title, "OpenAI 'ships' a thing & more");
  assert.equal(rows[0].sourceUrl, "https://vnexpress.net");
  assert.equal(rows[0].sourceName, "VnExpress");
  assert.equal(rows[0].description, "<p>Body text</p>");
});

test("parseRss decodes &amp;lt; exactly once", () => {
  // &amp; must be decoded LAST or `&amp;lt;` turns into `<` instead of `&lt;`, silently
  // corrupting any headline containing an escaped entity.
  const rows = parseRss(`<rss><item><title>a &amp;lt; b</title><link>https://x.com/1</link></item></rss>`);
  assert.equal(rows[0].title, "a &lt; b");
});
