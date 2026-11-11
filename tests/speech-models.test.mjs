// Speech-to-text you can trust: score a model against a checked transcript, and notice when it
// silently skipped speech. Plus the "native" theme opt-out. Pure; no model, no ffmpeg.
import { test } from "node:test";
import assert from "node:assert/strict";
import { alignWords, compareTranscripts } from "../scripts/video/lib/transcript-eval.mjs";
import { uncoveredSpeech } from "../scripts/video/transcribe.mjs";
import { resolveTheme } from "../scripts/video/lib/theme.mjs";
import { validateScript } from "../scripts/video/lib/validate.mjs";

const W = (s, t0 = 0, step = 0.4) => s.split(" ").map((w, i) => ({ w, start: +(t0 + i * step).toFixed(2), end: +(t0 + i * step + 0.3).toFixed(2) }));

test("alignment counts substitutions, insertions and deletions", () => {
  const ops = alignWords(["a", "b", "c", "d"], ["a", "x", "c", "d", "e"]);
  assert.deepEqual(ops.map((o) => o.op).join(""), "=S==I");
  assert.deepEqual(alignWords(["a", "b"], []).map((o) => o.op), ["D", "D"]);
});

test("WER counts tone marks as errors; the folded WER does not", () => {
  const ref = W("đổi bằng lái ở bưu điện");
  const hyp = W("đổi bằng lai ở mưu điện");
  const r = compareTranscripts(ref, hyp);
  assert.equal(r.wer, +(2 / 6).toFixed(4)); // "lai" and "mưu"
  assert.equal(r.werFolded, +(1 / 6).toFixed(4)); // only "mưu" is a different word
  assert.deepEqual(r.worst.map((x) => x.hyp), ["lai", "mưu"]);
});

test("timing is measured on matched words only", () => {
  const ref = W("một hai ba bốn");
  const hyp = W("một hai ba bốn").map((w, i) => ({ ...w, start: w.start + (i === 3 ? 0.4 : 0.05) }));
  const r = compareTranscripts(ref, hyp);
  assert.equal(r.timing.matched, 4);
  assert.equal(r.timing.within150ms, 0.75);
});

test("speech with no words is reported — the 14 s a prompted Whisper skipped on the demo", () => {
  const speech = [{ start: 0, end: 20 }, { start: 22, end: 30 }];
  const words = W("đây là đoạn được nghe ra", 14.3, 0.5).concat(W("và đoạn này nữa", 22.2, 0.5));
  const gaps = uncoveredSpeech(speech, words);
  assert.deepEqual(gaps[0], { start: 0, end: 14.3 });
  assert.ok(gaps.some((g) => g.start >= 23 && g.end === 30), "the untranscribed tail of the second span");
  assert.deepEqual(uncoveredSpeech([{ start: 0, end: 3 }], W("một hai ba bốn năm sáu bảy", 0.1, 0.4)), []); // fully covered
});

test('"native" theme: each template keeps its palette on purpose, and --strict accepts it', () => {
  assert.equal(resolveTheme("native"), null);
  const scene = (id, type) => ({ id, type, templateId: "frame-bold-poster", voiceText: "Một câu đủ dài để đọc thành tiếng cho cảnh này nhé các bạn ơi.", inputs: {} });
  const base = { scenes: [scene("a", "hook"), scene("b", "outro")] };
  const warns = (s) => validateScript(s).warnings.join(" | ");
  assert.match(warns(base), /no "theme"/);
  assert.doesNotMatch(warns({ ...base, theme: "native" }), /no "theme"/);
});
