// Post performance: platform CSV exports in, findings out — only with enough posts behind them.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCsv, mapColumns, num, normaliseRows, mergePosts, postKey, titleSimilarity, featuresOf, matchPosts, insights, insightsMarkdown, hourBucket, lengthBucket,
} from "../scripts/analytics/lib/perf.mjs";

test("CSV: BOM, quotes, doubled quotes, CRLF, and ; as separator", () => {
  const rows = parseCsv('﻿"Tiêu đề";"Lượt xem"\r\n"Nói ""có"" mà";"1.234"\r\n"Hai; ba";"12,5K"\r\n');
  assert.deepEqual(rows, [{ "Tiêu đề": 'Nói "có" mà', "Lượt xem": "1.234" }, { "Tiêu đề": "Hai; ba", "Lượt xem": "12,5K" }]);
});

test("columns are matched by meaning, English or Vietnamese", () => {
  assert.deepEqual(mapColumns(["Video title", "Post time", "Total views", "Total likes", "Comments", "Shares", "Average watch time", "Watched full video"]), {
    "Video title": "title", "Post time": "postedAt", "Total views": "views", "Total likes": "likes", Comments: "comments", Shares: "shares",
    "Average watch time": "avgWatch", "Watched full video": "completion",
  });
  const vi = mapColumns(["Tiêu đề video", "Thời gian đăng", "Lượt xem", "Lượt thích", "Bình luận", "Chia sẻ", "Tỷ lệ xem hết"]);
  assert.equal(vi["Lượt xem"], "views");
  assert.equal(vi["Tỷ lệ xem hết"], "completion");
  assert.equal(vi["Tiêu đề video"], "title");
});

test("numbers the way the studios print them", () => {
  assert.equal(num("1.234.567"), 1234567);
  assert.equal(num("1,234"), 1234);
  assert.equal(num("12,5K"), 12500);
  assert.equal(num("1.2M"), 1200000);
  assert.equal(num("3Tr"), 3000000);
  assert.equal(num("12,5%"), 0.125);
  assert.equal(num("0:42"), 42);
  assert.equal(num("1:02:03"), 3723);
  assert.equal(num("42s"), 42);
  assert.equal(num("--"), null);
});

test("rows normalise; dd/mm/yyyy dates become ISO; re-imports update rather than duplicate", () => {
  const rows = normaliseRows([{ "Tiêu đề": "A", "Ngày đăng": "10/11/2026 19:30", "Lượt xem": "1,2K" }, { "Tiêu đề": "B", "Lượt xem": "" }], "tiktok");
  assert.equal(rows.length, 1); // a row without views is not a post row
  assert.equal(rows[0].views, 1200);
  assert.match(rows[0].postedAt, /^2026-11-10T/);
  const merged = mergePosts([{ ...rows[0], views: 900 }], rows, "2026-11-11");
  assert.equal(merged.length, 1);
  assert.equal(merged[0].views, 1200);
  assert.equal(postKey({ platform: "youtube", id: "abc" }), "youtube:abc");
});

test("matching a post to the video the kit made ignores accents and punctuation", () => {
  assert.ok(titleSimilarity("Review tai nghe giá rẻ: có đáng mua?", "review tai nghe gia re co dang mua") > 0.9);
  assert.ok(titleSimilarity("Giá xăng tăng", "Hướng dẫn viết prompt") < 0.2);
  const items = [featuresOf({ slug: "a", title: "Review tai nghe giá rẻ", script: { genre: "review", scenes: [{ voiceText: "Tai nghe này có đáng mua không? Thêm." }] } })];
  const [m] = matchPosts([{ platform: "tiktok", title: "Review tai nghe giá rẻ #review", views: 10 }], items);
  assert.equal(m.item.slug, "a");
  assert.equal(m.item.hookIsQuestion, true);
});

test("features come from what the files say, never guessed", () => {
  const f = featuresOf({ slug: "x", script: { metadata: { title: "T" }, scenes: [{ voiceText: "Giá xăng tăng." }] } });
  assert.equal(f.title, "T");
  assert.equal(f.genre, null); // no "genre" in the script → not grouped, not invented
  assert.equal(f.hookIsQuestion, false);
  assert.equal(lengthBucket(45), "30–59s");
  assert.equal(hourBucket("2026-11-10T12:30:00Z"), "18–21h"); // 19:30 in Vietnam
});

test("findings need enough posts on each side; tiny channels get none", () => {
  const mk = (genre, views, i) => ({ post: { platform: "tiktok", title: `${genre}${i}`, views }, item: { genre, hookIsQuestion: null } });
  const big = [...[9000, 8000, 10000].map((v, i) => mk("review", v, i)), ...[1000, 1200, 900].map((v, i) => mk("news", v, i))];
  const r = insights(big);
  assert.equal(r.findings[0].feature, "genre");
  assert.equal(r.findings[0].best.value, "review");
  assert.equal(r.findings[0].worst.n, 3);
  const small = insights(big.slice(0, 2).concat(big.slice(3, 5))); // 2 per side
  assert.deepEqual(small.findings, []);
  assert.match(insightsMarkdown(small, { today: "2026-11-11" }), /Chưa đủ dữ liệu/);
  // platforms are never compared with each other: each is measured against its own median
  const mixed = insights([...big, { post: { platform: "youtube", title: "y", views: 50 }, item: null }]);
  assert.equal(mixed.baseline.youtube, 50);
});

// ── is the brand in the AI's answer? ─────────────────────────────────────────
import { countMentions, citedDomains, shareOfVoice } from "../scripts/research/lib/mentions.mjs";
import { askOnce, report } from "../scripts/research/ai-mentions.mjs";
import http from "node:http";

test("mentions: whole words, accents and case ignored, aliases counted", () => {
  const ents = [{ name: "Phúc Long", aliases: ["phuclong"] }, { name: "Highlands", aliases: [] }];
  assert.deepEqual(countMentions("Highlands Coffee và PHUC LONG; phuclong.vn cũng vậy. Phúc Lộc thì không.", ents), { "Phúc Long": 2, Highlands: 1 });
  assert.deepEqual(citedDomains("xem https://www.vnexpress.net/a và https://vnexpress.net/b, (http://foody.vn)."), [{ domain: "vnexpress.net", n: 2 }, { domain: "foody.vn", n: 1 }]);
});

test("share of voice counts answers, not repetitions, and who comes first", () => {
  const ents = [{ name: "A" }, { name: "B" }];
  const r = shareOfVoice([
    { question: "q1", answer: "B rồi A A A A" },
    { question: "q2", answer: "A thôi" },
    { question: "q3", answer: "không ai cả" },
  ], ents);
  const a = r.table.find((x) => x.name === "A"), b = r.table.find((x) => x.name === "B");
  assert.equal(a.mentionRate, 0.67);
  assert.equal(b.mentionRate, 0.33);
  assert.equal(b.firstPlace, 1);
  assert.equal(a.firstPlace, 1);
  assert.match(report(r, { brand: { name: "A" }, model: "m", samples: 1, today: "2026-11-11" }), /- q3/);
});

test("askOnce speaks the OpenAI chat format to any compatible endpoint", async () => {
  let got;
  const srv = http.createServer((req, res) => {
    let b = "";
    req.on("data", (d) => (b += d)).on("end", () => {
      got = { url: req.url, auth: req.headers.authorization, body: JSON.parse(b) };
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ choices: [{ message: { content: "Nên thử Phúc Long." } }] }));
    });
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  try {
    const ans = await askOnce({ endpoint: `http://127.0.0.1:${srv.address().port}/v1/`, model: "qwen", key: "k", question: "Cà phê nào ngon?" });
    assert.equal(ans, "Nên thử Phúc Long.");
    assert.equal(got.url, "/v1/chat/completions");
    assert.equal(got.auth, "Bearer k");
    assert.equal(got.body.model, "qwen");
    assert.equal(got.body.messages.at(-1).content, "Cà phê nào ngon?");
  } finally {
    srv.close();
  }
});
