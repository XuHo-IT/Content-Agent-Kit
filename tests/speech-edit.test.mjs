import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findSpeechCuts, dropSpans, subtractSpans, reviewText, parseRanges, findPhrase, resolveAnchors, sfxDensity, applyWordFixes, norm, fold,
} from "../scripts/video/lib/speech-edit.mjs";
import { suggestCards, scoreSentence, CARD_RULES } from "../scripts/video/lib/card-suggest.mjs";
import { wordsFromTranscript } from "../scripts/video/lib/captions.mjs";
import fs from "node:fs";

// words at 0.4 s each, 0.05 s apart; `seg` = sentence
const W = (text, seg = 0, t0 = 0) =>
  text.split(" ").map((w, i) => ({ w, start: +(t0 + i * 0.45).toFixed(2), end: +(t0 + i * 0.45 + 0.4).toFixed(2), seg }));

test("normalising keeps Vietnamese tones apart; folding drops them", () => {
  assert.notEqual(norm("ma"), norm("mà"));
  assert.equal(norm("Tăng,"), "tăng");
  assert.equal(fold("Tăng"), "tang");
  assert.equal(fold("Đường"), "duong");
});

test("fillers go, and only when they are a whole word", () => {
  const w = W("ờ hôm nay ừm mình nói về ờm AI");
  const d = findSpeechCuts(w);
  assert.deepEqual([...d.keys()].sort((a, b) => a - b), [0, 3, 7]);
  assert.equal(d.get(0), "filler");
});

test("a repeated phrase loses its FIRST copy — the second is the one the speaker meant", () => {
  const w = W("mình sẽ mình sẽ nói về cái này");
  const d = findSpeechCuts(w);
  assert.deepEqual([...d.keys()], [0, 1]);
  assert.equal(d.get(0), "repeat×2");
});

test("Vietnamese words said twice on purpose are kept ('từ từ', 'rất rất')", () => {
  assert.equal(findSpeechCuts(W("đi từ từ thôi")).size, 0);
  assert.equal(findSpeechCuts(W("nó rất rất nhanh")).size, 0);
  // …but not when the speaker stopped between them: that is a stumble
  const w = W("nó rất rất nhanh");
  w[2].start += 0.5; w[2].end += 0.5;
  assert.equal(findSpeechCuts(w).size, 1);
});

test("a sentence started and then said again: the earlier take goes", () => {
  const w = [...W("hôm nay mình sẽ", 0, 0), ...W("hôm nay mình sẽ nói về giá vàng", 1, 3)];
  const d = findSpeechCuts(w);
  assert.deepEqual([...d.keys()].sort((a, b) => a - b), [0, 1, 2, 3]);
  assert.ok([...d.values()].every((r) => r === "retake"));
});

test("two different sentences are not a retake", () => {
  const w = [...W("giá vàng tăng mạnh", 0, 0), ...W("hôm nay mình phân tích lý do", 1, 3)];
  assert.equal(findSpeechCuts(w).size, 0);
});

test("--remove-words and --keep-words override, by index", () => {
  const w = W("ờ một hai ba bốn");
  const d = findSpeechCuts(w, { removeWords: "3-4", keepWords: "0" });
  assert.deepEqual([...d.keys()].sort(), [3, 4]);
  assert.equal(d.get(3), "manual");
  assert.throws(() => parseRanges("a-b"), /bad word range/);
});

test("dropped words become spans that keep a breath either side", () => {
  const w = W("một ờ hai");
  const spans = dropSpans(w, new Map([[1, "filler"]]), { pad: 0.06 });
  assert.equal(spans.length, 1);
  assert.ok(spans[0].start >= w[0].end && spans[0].end <= w[2].start, JSON.stringify(spans));
});

test("subtracting spans from the pause-cut keep list", () => {
  const keep = [{ start: 0, end: 5 }, { start: 6, end: 10 }];
  assert.deepEqual(subtractSpans(keep, [{ start: 2, end: 3 }, { start: 9.95, end: 12 }]), [
    { start: 0, end: 2 }, { start: 3, end: 5 }, { start: 6, end: 9.95 },
  ]);
  // a sliver shorter than minKeep is a click, not speech
  assert.deepEqual(subtractSpans([{ start: 0, end: 1 }], [{ start: 0.05, end: 1 }]), []);
});

test("the review marks every cut with its index and reason", () => {
  const w = W("ờ xin chào");
  const t = reviewText(w, findSpeechCuts(w));
  assert.match(t, /~~ờ~~\(0,filler\)/);
  assert.match(t, /1 of 3 words dropped/);
});

test("anchors: a card's `at` can be the word that is spoken", () => {
  const w = [...W("doanh thu tăng gấp ba", 0, 10), ...W("rồi lại tăng nữa", 1, 40)];
  assert.equal(findPhrase(w, "tăng"), w[2].start);
  assert.equal(findPhrase(w, "tang"), w[2].start, "typed without accents still matches");
  assert.equal(findPhrase(w, "tăng", { near: 41 }), w[7].start, "near picks the second time it is said");
  assert.equal(findPhrase(w, "gấp ba"), w[3].start, "phrases match word by word");
  const { edl, problems } = resolveAnchors({ segments: [], cards: [{ at: "tăng", dur: 3 }, { at: 12.5, dur: 3 }, { at: "không có" }] }, w);
  assert.equal(edl.cards[0].at, +(w[2].start - 0.15).toFixed(3), "lands just before the word");
  assert.equal(edl.cards[0].word, "tăng");
  assert.equal(edl.cards[1].at, 12.5);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /cards\[2\]/);
});

test("sfx density: ≤ 2 sounds in 3 s, ≤ 0.7 per second", () => {
  assert.deepEqual(sfxDensity([{ t: 1 }, { t: 5 }, { t: 9 }], { duration: 30 }), []);
  assert.match(sfxDensity([{ t: 1 }, { t: 1.5 }, { t: 2 }], { duration: 30 })[0], /3 sounds within 3 s/);
  assert.ok(sfxDensity(Array.from({ length: 10 }, (_, i) => ({ t: i * 1.4 })), { duration: 12 }).some((x) => /\/s/.test(x)));
});

test("caption fixes rewrite what speech-to-text misheard", () => {
  const w = applyWordFixes([{ w: "cờ-lốt", start: 0, end: 1 }, { w: "code", start: 1, end: 2 }], [["^cờ-lốt$", "Claude"]]);
  assert.deepEqual(w.map((x) => x.w), ["Claude", "code"]);
});

test("transcripts with segments carry the sentence index the retake rule needs", () => {
  const w = wordsFromTranscript({ segments: [{ words: [{ word: "a", start: 0, end: 1 }] }, { words: [{ word: "b", start: 1, end: 2 }] }] });
  assert.deepEqual(w.map((x) => x.seg), [0, 1]);
});

// ── card suggestions ──────────────────────────────────────────────────────────
test("every suggested template exists in the kit", () => {
  for (const r of CARD_RULES) assert.ok(fs.existsSync(`video-templates/${r.id}`), `${r.id} is not a template`);
});

test("numbers with a unit want a counter; '2 đến' is not a price", () => {
  const s = (t) => scoreSentence(t, t.split(" ").map((w) => ({ w })));
  assert.equal(s("mỗi ngày 30 đến 50 hồ sơ")[0].rule.id, "frame-trend-stat-odometer");
  assert.ok(!s("bố trí từ 2 đến 3 cán bộ").some((x) => x.rule.id === "frame-trend-price-drop"));
  assert.equal(s("giá chỉ còn 199k thôi")[0].rule.id, "frame-trend-price-drop");
  assert.equal(s("so với năm ngoái thì khác hẳn")[0].rule.id, "frame-trend-compare-wipe");
});

test("suggestions respect the hook, the spacing and the B-roll already there", () => {
  const words = [
    ...W("doanh thu tăng 30 phần trăm", 0, 0.5), // in the hook: never a card
    ...W("giá chỉ còn 199k thôi", 1, 6),
    ...W("so với năm ngoái thì khác hẳn", 2, 8), // too close to the one before
    ...W("bạn chọn cái nào comment nhé", 3, 20),
    ...W("tìm kiếm trên google là ra", 4, 30),
  ];
  const { cards, table } = suggestCards(words, { avoid: [{ at: 29.5, dur: 3 }] });
  assert.ok(!cards.some((c) => c.near < 3), "no card in the hook");
  assert.equal(table[0].note, "hook — face only");
  for (let i = 1; i < cards.length; i++) assert.ok(cards[i].near >= cards[i - 1].near + cards[i - 1].dur + 4, "4 s apart");
  assert.ok(!cards.some((c) => c.templateId === "frame-trend-search-morph"), "the B-roll at 29.5 s keeps that slot");
  assert.deepEqual(cards.map((c) => c.layout), cards.map((_, i) => (i % 2 ? "pip" : "full")));
  assert.ok(cards.every((c) => typeof c.at === "string" && c._said && Object.keys(c.inputs).length === 0), "inputs are left for the agent");
});
