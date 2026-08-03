// clean-text.test.mjs — run with: node --test tests/
//
// Uses node:test and node:assert, both built in, so the repo stays zero-dependency.
//
// Half of these tests are about what must NOT be flagged. A gate that cries wolf on
// ordinary Vietnamese prose gets switched off within a week, and then it protects nothing
// — so the false-positive cases matter more than the true-positive ones.
import test from "node:test";
import assert from "node:assert/strict";
import { findLeaks, stripLeaks, validatePost } from "../scripts/social/lib/clean-text.mjs";

const errs = (text) => findLeaks(text).errors;
const warns = (text) => findLeaks(text).warnings;

// ── metadata block ───────────────────────────────────────────────────────────

test("catches the Meta/Slug block this repo actually shipped", () => {
  const text = [
    "Meta: Claude Fable 5 đạt điểm cao nhất ở gần như mọi bài kiểm tra.",
    "Slug: claude-fable-5-ra-mat-roi-bi-go-sau-ba-ngay",
    "",
    "Stripe đưa cho nó một kho mã Ruby năm mươi triệu dòng.",
  ].join("\n");
  const found = errs(text);
  assert.equal(found.length, 2);
  assert.match(found[0], /line 1 is a metadata label/);
  assert.match(found[1], /line 2 is a metadata label/);
});

test("catches Vietnamese metadata labels too", () => {
  assert.equal(errs("Mô tả: một dòng tóm tắt\n\nThân bài bắt đầu ở đây.").length, 1);
  assert.equal(errs("Tiêu đề: Bản tin sáng\nTừ khoá: ai, claude\n\nNội dung.").length, 2);
});

test("does NOT flag 'Meta:' inside the body — Meta is a company this kit writes about", () => {
  const text = [
    "Anthropic công bố mô hình mới hôm qua.",
    "",
    "Meta: hãng mẹ của Facebook cũng vừa ra bản cập nhật của riêng mình.",
  ].join("\n");
  assert.deepEqual(errs(text), []);
});

test("does NOT flag a label-shaped line after the leading block ends", () => {
  const text = "Mở bài.\n\nTóm tắt: đây là một câu trong thân bài, không phải metadata.";
  assert.deepEqual(errs(text), []);
});

// ── markdown ─────────────────────────────────────────────────────────────────

test("catches headings", () => {
  assert.match(errs("## Phần một\n\nNội dung.")[0], /heading markup/);
  assert.match(errs("Mở bài.\n\n###### Sâu nhất")[0], /heading markup/);
});

test("does NOT treat a hashtag as a heading — every caption ends with a row of them", () => {
  assert.deepEqual(errs("Bài viết hay.\n\n#AI #Claude #CongNghe #LapTrinh"), []);
  assert.deepEqual(errs("#AI"), []);
});

test("catches bold and italic", () => {
  assert.match(errs("Đây là **quan trọng** lắm.")[0], /bold markup/);
  assert.match(errs("Các tác vụ *agent* kéo dài nhiều ngày.")[0], /italic markup/);
});

test("does NOT flag asterisks that are not paired emphasis", () => {
  assert.deepEqual(errs("Giá là 2 * 3 = 6 đồng."), []);
  assert.deepEqual(errs("* Vì lý do riêng tư, tên đã được đổi.").filter((e) => /italic|bold/.test(e)), []);
});

test("catches markdown links but leaves bare URLs alone", () => {
  assert.match(errs("Xem [công bố gốc](https://anthropic.com/news) để rõ hơn.")[0], /link markup/);
  assert.deepEqual(errs("Nguồn: https://anthropic.com/news"), []);
});

test("catches code fences", () => {
  assert.match(errs("Ví dụ:\n```js\nconst a = 1;\n```")[0], /code-fence markup/);
});

test("list markers and blockquotes are warnings, not errors", () => {
  // "- Chào anh." is dialogue in Vietnamese prose. Failing on it by default would make
  // this gate the first thing anyone turns off.
  assert.deepEqual(errs("- Chào anh, anh tìm ai?"), []);
  assert.match(warns("- Chào anh, anh tìm ai?")[0], /list-marker/);
  assert.match(warns("> Một câu trích dẫn.")[0], /blockquote/);
});

test("clean Vietnamese prose produces nothing at all", () => {
  const text = [
    "Anthropic công bố Claude Fable 5 ngày 9 tháng 6 năm 2026.",
    "",
    "Ba ngày sau, một chỉ thị kiểm soát xuất khẩu buộc mô hình tạm ngừng hoạt động.",
    "Đến cuối tháng, lệnh được dỡ bỏ.",
    "",
    "Nguồn: https://www.anthropic.com/news",
    "",
    "#AI #Claude #Anthropic",
  ].join("\n");
  assert.deepEqual(findLeaks(text), { errors: [], warnings: [] });
});

test("empty and non-string input is not an error here", () => {
  assert.deepEqual(findLeaks(""), { errors: [], warnings: [] });
  assert.deepEqual(findLeaks(null), { errors: [], warnings: [] });
  assert.deepEqual(findLeaks(undefined), { errors: [], warnings: [] });
});

// ── stripLeaks ───────────────────────────────────────────────────────────────

test("stripLeaks removes the metadata block and its blank separator", () => {
  const out = stripLeaks("Meta: tóm tắt\nSlug: bai-viet\n\nThân bài bắt đầu.");
  assert.equal(out, "Thân bài bắt đầu.");
});

test("stripLeaks unwraps emphasis without eating the words", () => {
  assert.equal(stripLeaks("Đây là **quan trọng** và *đáng chú ý*."), "Đây là quan trọng và đáng chú ý.");
  assert.equal(stripLeaks("## Phần một"), "Phần một");
});

test("stripLeaks keeps the URL out of a markdown link", () => {
  assert.equal(
    stripLeaks("Xem [công bố gốc](https://anthropic.com/news) nhé."),
    "Xem công bố gốc (https://anthropic.com/news) nhé.",
  );
  assert.equal(stripLeaks("[](https://example.com)"), "https://example.com");
});

test("stripLeaks output passes findLeaks — the fix actually fixes", () => {
  const dirty = [
    "Meta: tóm tắt cho CMS",
    "Slug: bai-viet-mau",
    "",
    "### Mở đầu",
    "",
    "Đây là **quan trọng**, và các tác vụ *agent* kéo dài nhiều ngày.",
    "",
    "Xem [nguồn](https://anthropic.com/news).",
  ].join("\n");
  assert.ok(errs(dirty).length >= 4);
  assert.deepEqual(errs(stripLeaks(dirty)), []);
});

test("stripLeaks leaves already-clean text byte-identical", () => {
  const clean = "Anthropic công bố mô hình mới.\n\nBa ngày sau nó bị gỡ.\n\n#AI #Claude";
  assert.equal(stripLeaks(clean), clean);
});

// ── validatePost ─────────────────────────────────────────────────────────────

test("validatePost checks every reader-visible field", () => {
  const { errors } = validatePost({
    title: "## Tiêu đề",
    post: "Thân bài sạch.",
    comment: "Bình luận có **đậm**.",
  });
  assert.equal(errors.length, 2);
  assert.ok(errors.some((e) => e.includes("`title`")));
  assert.ok(errors.some((e) => e.includes("`comment`")));
});

test("validatePost rejects an empty post", () => {
  assert.match(validatePost({ post: "   " }).errors[0], /`post` is empty/);
  assert.match(validatePost({}).errors[0], /`post` is empty/);
});

test("validatePost rejects a non-object payload", () => {
  assert.match(validatePost(null).errors[0], /must be a JSON object/);
  assert.match(validatePost([1, 2]).errors[0], /must be a JSON object/);
});

test("validatePost reports stats a human can sanity-check", () => {
  const { stats } = validatePost({ post: "Một hai ba bốn năm.", comment: "Sáu." });
  assert.equal(stats.words, 5);
  assert.deepEqual(stats.fields, ["post", "comment"]);
});
