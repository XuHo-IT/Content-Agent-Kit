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
