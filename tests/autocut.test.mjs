import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSilences, keepSegments, summary, buildFilter, remapTime } from "../scripts/video/lib/autocut.mjs";

const LOG = `
[silencedetect @ 0x1] silence_start: 1.50
[silencedetect @ 0x1] silence_end: 2.60 | silence_duration: 1.10
[silencedetect @ 0x1] silence_start: 5.0
[silencedetect @ 0x1] silence_end: 6.5 | silence_duration: 1.5
[silencedetect @ 0x1] silence_start: 7.8
`;

test("silencedetect log parses, and an unterminated tail stays open", () => {
  const s = parseSilences(LOG);
  assert.deepEqual(s.slice(0, 2), [{ start: 1.5, end: 2.6 }, { start: 5, end: 6.5 }]);
  assert.equal(s[2].end, Infinity);
});

test("pauses shrink by the pad instead of vanishing", () => {
  const keep = keepSegments(parseSilences(LOG), 9, { pad: 0.1 });
  assert.deepEqual(keep, [
    { start: 0, end: 1.6 },
    { start: 2.5, end: 5.1 },
    { start: 6.4, end: 7.9 }, // the trailing pause runs to the end: padded inward only
  ]);
});

test("a leading pause is cut right from zero", () => {
  const keep = keepSegments([{ start: 0, end: 1.2 }], 5, { pad: 0.1 });
  assert.deepEqual(keep, [{ start: 1.1, end: 5 }]);
});

test("breaths shorter than minSilence are never cut", () => {
  const keep = keepSegments([{ start: 2, end: 2.2 }], 5, { minSilence: 0.28 });
  assert.deepEqual(keep, [{ start: 0, end: 5 }]);
});

test("speech islands shorter than minKeep are dropped as clicks", () => {
  const keep = keepSegments([{ start: 1, end: 2 }, { start: 2.25, end: 3 }], 4, { pad: 0.1, minKeep: 0.2 });
  // 1.9 → 2.35 is 0.45s and survives; with a bigger pad it would not
  assert.ok(keep.every((k) => k.end - k.start >= 0.2));
  const tight = keepSegments([{ start: 1, end: 2 }, { start: 2.1, end: 3 }], 4, { pad: 0.0, minKeep: 0.2, minSilence: 0.28 });
  assert.ok(!tight.some((k) => k.start === 2 && k.end === 2.1), "a 0.1s island is a click, not speech");
});

test("summary adds up", () => {
  const s = summary([{ start: 0, end: 1 }, { start: 2, end: 4 }], 5);
  assert.deepEqual(s, { duration: 5, kept: 3, removed: 2, cuts: 1, ratio: 0.6 });
});

test("filtergraph: fades every edge, punches every other cut to the exact frame size", () => {
  const f = buildFilter([{ start: 0, end: 1 }, { start: 2, end: 3 }, { start: 4, end: 5 }], { punch: 0.12, width: 1080, height: 1920 });
  assert.equal((f.match(/afade=t=in/g) ?? []).length, 3);
  assert.equal((f.match(/crop=1080:1920/g) ?? []).length, 1, "only the middle segment is punched");
  assert.match(f, /scale=1210:2150,crop=1080:1920/);
  assert.match(f, /concat=n=3:v=1:a=1\[vout\]\[acat\]/);
  assert.match(f, /loudnorm=I=-16/);
});

test("audio-only input builds an audio-only graph", () => {
  const f = buildFilter([{ start: 0, end: 1 }], { hasVideo: false, loudnorm: false });
  assert.ok(!f.includes("[0:v]"));
  assert.match(f, /concat=n=1:v=0:a=1\[aout\]$/);
});

test("source timestamps remap onto the cut timeline", () => {
  const keep = [{ start: 0, end: 1.6 }, { start: 2.5, end: 5.1 }];
  assert.equal(remapTime(1, keep), 1);
  assert.equal(remapTime(2, keep), 1.6); // inside a removed pause → the cut point
  assert.equal(remapTime(3, keep), 2.1);
});

test("a source crop runs before the vertical reframe", () => {
  const f = buildFilter([{ start: 0, end: 1 }], { vertical: true, crop: "405:600:438:0" });
  assert.ok(f.indexOf("crop=405:600:438:0") < f.indexOf("scale=1080:1920"));
});

// ── transcribe.mjs: whatever a speech-to-text engine returns → the shape captions read ──
import { normalizeTranscription } from "../scripts/video/transcribe.mjs";
import { wordsFromTranscript as _words } from "../scripts/video/lib/captions.mjs";

test("OpenAI-style verbose_json (top-level words) is regrouped into segments, offset by --from", () => {
  const t = normalizeTranscription({
    segments: [{ start: 0, end: 1.2, text: " Đổi bằng" }, { start: 1.3, end: 2.4, text: " lái xe" }],
    words: [{ word: " Đổi", start: 0.1, end: 0.5 }, { word: "bằng", start: 0.6, end: 1.1 }, { word: "lái", start: 1.4, end: 1.8 }, { word: "xe", start: 1.9, end: 2.3 }],
  }, { offset: 58 });
  assert.equal(t.segments.length, 2);
  assert.deepEqual(t.segments[1].words.map((w) => w.w), ["lái", "xe"]);
  assert.equal(t.segments[0].words[0].start, 58.1);
  // and the caption code can read it straight back
  assert.deepEqual(_words(t).map((w) => w.w), ["Đổi", "bằng", "lái", "xe"]);
});

test("a faster-whisper dump keeps its words and confidence; an empty one stays empty", () => {
  const t = normalizeTranscription({ segments: [{ start: 1, end: 2, text: "xin chào", words: [{ word: " xin", start: 1, end: 1.4, probability: 0.987 }, { word: " chào", start: 1.4, end: 1.9, probability: 0.5 }] }] });
  assert.deepEqual(t.segments[0].words, [{ w: "xin", start: 1, end: 1.4, p: 0.99 }, { w: "chào", start: 1.4, end: 1.9, p: 0.5 }]);
  assert.deepEqual(normalizeTranscription({}).segments, []);
});
