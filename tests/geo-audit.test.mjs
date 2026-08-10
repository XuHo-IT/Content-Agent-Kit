// geo-audit.test.mjs — the rules have to bite on the thing they name and stay quiet on the
// thing they do not.
//
// A rule that fires on everything gets muted by whoever reads the report, which is the same
// as not having it. Every false positive below was real: the first version of `numericClaims`
// flagged section numbers (`§4.1`), years with a comma attached (`2026,`) and "2 mô hình" as
// two million, on the kit's own sample article. Those cases are pinned here so the noise
// cannot come back quietly.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  audit, blocks, firstSentence, hasDate, hasSourceMark, isDefinition,
  isPreamble, isQuestionHeading, numericClaims, opensDangling, stripNonProse,
} from "../scripts/geo-audit.mjs";

const vals = (t) => numericClaims(t).map((n) => n.value);

test("code and frontmatter are not prose an engine would quote", () => {
  const md = "---\ntitle: x\n---\n\nThật.\n\n```js\nconst n = 900000;\n```\n\nCòn `90%` inline.";
  const s = stripNonProse(md);
  assert.ok(!s.includes("title: x"));
  assert.ok(!s.includes("900000"));
  assert.ok(!s.includes("90%"));
  assert.ok(s.includes("Thật."));
});

test("a question heading is recognised with or without a question mark", () => {
  assert.ok(isQuestionHeading("Rerank là gì"));
  assert.ok(isQuestionHeading("Tại sao RAG chậm"));
  assert.ok(isQuestionHeading("Có nên bật rerank"));
  assert.ok(isQuestionHeading("How much does it cost"));
  assert.ok(isQuestionHeading("Bao nhiêu là đủ?"));
  assert.ok(!isQuestionHeading("Kết quả đo"));
  assert.ok(!isQuestionHeading("Benchmark"));
});

test("a first sentence that announces an answer is not an answer", () => {
  assert.ok(isPreamble("Trong bài này chúng ta sẽ tìm hiểu về rerank."));
  assert.ok(isPreamble("Let's dive into the numbers."));
  assert.ok(isPreamble("Trước tiên, cần hiểu RAG là gì."));
  assert.ok(!isPreamble("Rerank rẻ hơn 68% trên 500 câu hỏi tiếng Việt."));
});

test("a paragraph opening on a dangling reference cannot travel alone", () => {
  assert.ok(opensDangling("Nó rẻ hơn nhiều."));
  assert.ok(opensDangling("Điều này khiến chi phí giảm."));
  assert.ok(opensDangling("However, the cost fell."));
  assert.ok(!opensDangling("Rerank rẻ hơn 68%."));
  // "Nóng" starts with "Nó" as a substring — the rule is on words, not prefixes.
  assert.ok(!opensDangling("Nóng nhất là chi phí token."));
  // "chúng" is a pronoun; "chúng tôi" is a subject. Without this the rule fired on the
  // opening line of most Vietnamese posts, which is how a rule gets ignored.
  assert.ok(!opensDangling("Chúng tôi vừa mở thị trường thứ ba."));
  assert.ok(!opensDangling("Chúng ta đo lại từ đầu."));
  assert.ok(opensDangling("Chúng đắt hơn nhiều."));
});

test("numericClaims skips what is not a claim", () => {
  assert.deepEqual(vals("Xem §4.1 để biết thêm."), []);
  assert.deepEqual(vals("Ra mắt năm 2026, sau đó."), []);
  assert.deepEqual(vals("Chỉ 2 mô hình đạt mức này."), []);
  assert.deepEqual(vals("Bốn bước, top 5, phiên bản v3."), []);
  // A date is not a claim. "31/05/2026" was reported as an unsourced 31 on a post that had
  // in fact cited everything it said.
  assert.deepEqual(vals("Tính đến 31/05/2026 thì chưa."), []);
  assert.deepEqual(vals("Từ 01/03/2026 đến 31/05/2026."), []);
});

test("numericClaims keeps what is", () => {
  assert.deepEqual(vals("Rẻ hơn 68%."), ["68 %"]);
  assert.deepEqual(vals("Tiết kiệm 50 triệu mỗi tháng."), ["50 triệu"]);
  assert.deepEqual(vals("Đo trên 500 câu hỏi."), ["500"]);
  assert.deepEqual(vals("Chạy 950 lần."), ["950 lần"]);
});

test("a source has to be in the same breath as the number", () => {
  assert.ok(hasSourceMark("Theo báo cáo của Anthropic, 68%."));
  assert.ok(hasSourceMark("Đo trên 500 câu hỏi tiếng Việt."));
  assert.ok(hasSourceMark("68% — [nguồn](https://example.com)"));
  assert.ok(hasSourceMark("According to Gartner, 40%."));
  assert.ok(!hasSourceMark("Rerank rẻ hơn 68% so với trước."));
  // How an operations number actually gets cited in Vietnamese. The first version demanded a
  // capitalised name or one of six research words and rejected both of these.
  assert.ok(hasSourceMark("94%, theo log điều phối nội bộ quý I."));
  assert.ok(hasSourceMark("Giảm 120.000 đồng, theo bảng chi phí vận hành."));
});

test("a date is a date, not the word recently", () => {
  assert.ok(hasDate("Công bố ngày 09/06/2026."));
  assert.ok(hasDate("tháng 6 năm 2026"));
  assert.ok(hasDate("Jun 9, 2026"));
  assert.ok(!hasDate("Gần đây, chi phí đã giảm."));
  assert.ok(!hasDate("Trong 2026 sẽ khác.")); // a bare year is not a publication date
});

test("blocks keep tables and list items apart from paragraphs, and a table is one block", () => {
  const b = blocks("# T\n\nĐoạn văn.\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n- một mục\n");
  assert.deepEqual(b.map((x) => x.kind), ["heading", "para", "table", "item"]);
  // Row by row, each of a table's numbers looked unsourced even when the table cited itself.
  assert.match(b[2].text, /\| 1 \| 2 \|/);
});

test("firstSentence stops at the first terminator", () => {
  assert.equal(firstSentence("Rẻ hơn 68%. Đo trên 500 câu."), "Rẻ hơn 68%.");
  assert.equal(firstSentence("Không có dấu chấm nào"), "Không có dấu chấm nào");
});

test("isDefinition needs a copula and enough words to be a definition", () => {
  assert.ok(isDefinition("Rerank là bước xếp lại kết quả sau khi truy hồi."));
  assert.ok(!isDefinition("Nó là vậy.")); // a copula with nothing after it
  assert.ok(!isDefinition("Rerank giảm chi phí token đáng kể trong mọi trường hợp."));
});

test("a piece written for an engine passes; the same piece rewritten badly does not", () => {
  const good = [
    "# Rerank là gì",
    "",
    "Rerank là bước xếp lại kết quả sau khi truy hồi, đặt câu đúng nhất lên đầu.",
    "",
    "## Rerank có đắt không",
    "",
    "Rẻ hơn 68%. Đo trên 500 câu hỏi tiếng Việt, ngày 09/06/2026.",
    "",
    "| cấu hình | chi phí |",
    "| --- | --- |",
    "| có rerank | 950 đ |",
  ].join("\n");
  const res = audit(good);
  assert.equal(res.verdict, "quotable", JSON.stringify(res.results.filter((r) => !r.ok), null, 1));

  const bad = [
    "# Rerank",
    "",
    "## Chi phí",
    "",
    "Trong bài này chúng ta sẽ cùng tìm hiểu xem rerank tốn kém tới đâu và vì sao.",
    "",
    "Nó rẻ hơn 68% so với trước.",
  ].join("\n");
  const r2 = audit(bad);
  assert.equal(r2.verdict, "not-quotable");
  const failed = r2.results.filter((r) => !r.ok).map((r) => r.id);
  assert.ok(failed.includes("self-contained"), failed.join(","));
  assert.ok(failed.includes("sourced-numbers"), failed.join(","));
});

test("--place fails when the locality only turns up late", () => {
  const md = "# Thị trường mới\n\nChúng tôi mở rộng ra ba tỉnh.\n\n## Chi tiết\n\nĐà Nẵng là tỉnh thứ ba.";
  assert.equal(audit(md, { place: "Đà Nẵng" }).verdict, "not-quotable");

  const fixed = "# Đà Nẵng là thị trường thứ ba\n\nChúng tôi mở rộng ra Đà Nẵng từ tháng 6 năm 2026.";
  const r = audit(fixed, { place: "Đà Nẵng" });
  assert.ok(r.results.find((x) => x.id === "place-first").ok);
});
