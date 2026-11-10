import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCues, activeWordGroups, toAssActive } from "../scripts/video/lib/captions.mjs";

const cues = buildCues([{ text: "Một agent vừa dựng xong video. Chỉ trong bảy phút!", startSec: 10, durSec: 4 }]);

test("groups hold at most three words and never span a sentence end", () => {
  const g = activeWordGroups(cues, { maxWords: 3 });
  assert.ok(g.every((x) => x.words.length <= 3));
  assert.ok(!g.some((x) => x.words.slice(0, -1).some((w) => /[.!?]$/.test(w.w))), "a sentence ended mid-group");
});

test("word times tile the cue exactly — no gap, no overlap", () => {
  const words = activeWordGroups(cues).flatMap((g) => g.words);
  assert.equal(words[0].start, 10);
  for (let i = 1; i < words.length; i++) assert.ok(Math.abs(words[i].start - words[i - 1].end) < 1e-9);
  assert.ok(Math.abs(words.at(-1).end - 14) < 1e-9);
});

test("one Dialogue per word, the current word recoloured in the accent", () => {
  const ass = toAssActive(cues, { width: 1080, height: 1920, accent: "#ff5b1f" });
  const lines = ass.split("\n").filter((l) => l.startsWith("Dialogue:"));
  const nWords = "Một agent vừa dựng xong video. Chỉ trong bảy phút!".split(" ").length;
  assert.equal(lines.length, nWords);
  // #ff5b1f → ASS &H00BBGGRR
  assert.ok(lines.every((l) => l.includes("\\c&H001F5BFF&")));
  assert.match(ass, /BorderStyle|,1,\d+,\d+,2,/); // outline style, no opaque box
});

test("uppercase mode keeps Vietnamese diacritics", () => {
  const ass = toAssActive(buildCues([{ text: "đừng bỏ lỡ", startSec: 0, durSec: 1 }]), { width: 1080, height: 1920, upper: true });
  assert.match(ass, /ĐỪNG/);
  assert.match(ass, /LỠ/);
});

// ── real word timings (talking-head.mjs) ─────────────────────────────────────
import { wordsFromTranscript, groupTimedWords, toAssActiveWords } from "../scripts/video/lib/captions.mjs";

test("transcripts from faster-whisper, bare arrays and whisper.cpp all flatten", () => {
  const fw = { segments: [{ words: [{ word: " Xin", start: 0.1, end: 0.3 }, { word: " chào", start: 0.3, end: 0.6 }] }] };
  assert.deepEqual(wordsFromTranscript(fw).map((w) => w.w), ["Xin", "chào"]);
  assert.equal(wordsFromTranscript([{ w: "a", start: 1, end: 2 }]).length, 1);
  const cpp = { transcription: [{ text: "bạn", offsets: { from: 500, to: 900 } }] };
  assert.deepEqual(wordsFromTranscript(cpp)[0], { w: "bạn", start: 0.5, end: 0.9 });
});

test("a card never spans a long pause, and the highlight bridges short gaps", () => {
  const words = [
    { w: "Một", start: 0, end: 0.2 }, { w: "hai", start: 0.25, end: 0.5 },
    { w: "ba", start: 2.0, end: 2.3 }, // 1.5 s pause before it
  ];
  const g = groupTimedWords(words, { maxGap: 0.6 });
  assert.equal(g.length, 2);
  assert.equal(g[0].words[0].end, 0.25, "short gap bridged to the next word's start");
  assert.equal(g[0].words[1].end, 0.5, "long gap NOT bridged");
});

test("real-timed ASS has one line per word at the transcript's own times", () => {
  const ass = toAssActiveWords([{ w: "Đổi", start: 1, end: 1.4 }, { w: "bằng", start: 1.4, end: 1.8 }], { width: 1080, height: 1920 });
  const lines = ass.split("\n").filter((l) => l.startsWith("Dialogue:"));
  assert.equal(lines.length, 2);
  assert.match(lines[0], /0:00:01\.00,0:00:01\.40/);
});
