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
