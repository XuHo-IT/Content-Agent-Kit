// Talking-head edit styles and edit decision lists (scripts/video/talking-head.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { EDIT_STYLES, STYLE_IDS, resolveStyle, hookStyle, hexToAss } from "../scripts/video/lib/edit-styles.mjs";
import { validateEdl, sourceToJoined } from "../scripts/video/lib/edl.mjs";
import { toAssActiveWords } from "../scripts/video/lib/captions.mjs";

test("five named styles, each a complete bundle", () => {
  assert.deepEqual(STYLE_IDS, ["clean", "pop", "editorial", "cinematic", "kinetic-doc"]);
  for (const [id, s] of Object.entries(EDIT_STYLES)) {
    assert.match(s.accent, /^#[0-9a-f]{6}$/i, id);
    assert.ok(s.punch >= 0 && s.punch <= 0.3, id);
    assert.ok(s.caption.font && s.hook.font, id);
    // Impact has no Vietnamese diacritics (docs/25) — a style must never pick it
    assert.notEqual(s.caption.font.toLowerCase(), "impact", id);
  }
  assert.throws(() => resolveStyle("tiktok"), /one of: clean/);
});

test("hexToAss swaps to BGR", () => {
  assert.equal(hexToAss("#ff5a36"), "&H00365AFF");
});

test("hook card: uppercase in vi locale, accent box only where the style asks", () => {
  const pop = hookStyle(EDIT_STYLES.pop, { width: 1080, height: 1920, accent: "#ff5a36" });
  assert.equal(pop.text("đổi bằng lái"), "ĐỔI BẰNG LÁI");
  assert.match(pop.style, /&H00365AFF/);
  const ed = hookStyle(EDIT_STYLES.editorial, { width: 1080, height: 1920, accent: "#9fd3c7" });
  assert.equal(ed.text("Đổi Bằng"), "đổi bằng");
});

test("style caption knobs reach the ASS: dimmed rest words, one-word kinetic cards", () => {
  const words = [
    { w: "đổi", start: 0, end: 0.3 },
    { w: "bằng", start: 0.3, end: 0.6 },
    { w: "lái", start: 0.6, end: 0.9 },
  ];
  const ed = toAssActiveWords(words, { width: 1080, height: 1920, accent: "#9fd3c7", ...EDIT_STYLES.editorial.caption });
  assert.match(ed, /\{\\alpha&H6E&\}/);
  const kin = toAssActiveWords(words, { width: 1080, height: 1920, accent: "#e63b2e", ...EDIT_STYLES["kinetic-doc"].caption });
  const lines = kin.split("\n").filter((l) => l.startsWith("Dialogue:"));
  assert.equal(lines.length, 3);
  assert.ok(lines.every((l) => !l.includes(" ") || l.split(",,")[1].trim().split(" ").length === 1));
  assert.match(kin, /ĐỔI/);
});

test("validateEdl catches bad ranges, stray B-roll and B-roll that swamps the speaker", () => {
  assert.deepEqual(validateEdl({ segments: [{ from: 0, to: 10, crop: "315:560:0:0" }] }), []);
  assert.match(validateEdl({ segments: [] })[0], /non-empty/);
  assert.match(validateEdl({ segments: [{ from: 5, to: 2 }] })[0], /from < to/);
  assert.match(validateEdl({ segments: [{ from: 0, to: 10, crop: "9:16" }] })[0], /w:h:x:y/);
  assert.match(validateEdl({ segments: [{ from: 0, to: 10 }], broll: [{ at: 20, src: 0, dur: 2 }] })[0], /not inside/);
  assert.match(validateEdl({ segments: [{ from: 0, to: 10 }], broll: [{ at: 1, src: 30, dur: 5 }] })[0], /under ~35%/);
});

test("sourceToJoined maps words across segments and drops the ones between them", () => {
  const words = [
    { w: "a", start: 10.2, end: 10.5 }, // seg 0
    { w: "gap", start: 15, end: 15.4 }, // between segments — dropped
    { w: "b", start: 30.1, end: 30.4 }, // seg 1
  ];
  const segs = [{ from: 10, to: 12, dur: 2.0 }, { from: 30, to: 33, dur: 3.0 }];
  const out = sourceToJoined(words, segs);
  assert.deepEqual(out.map((w) => w.w), ["a", "b"]);
  assert.deepEqual([out[0].start, out[0].end], [0.2, 0.5]);
  assert.deepEqual([out[1].start, out[1].end], [2.1, 2.4]);
});

test("the demo EDL is valid and its B-roll stays a minority of the runtime", () => {
  const edl = JSON.parse(fs.readFileSync("examples/talking-head-demo/edl.json", "utf8"));
  assert.deepEqual(validateEdl(edl), []);
  // every crop stops above the station's lower-third (y = 570 in the 1280x720 source)
  for (const c of [...edl.segments, ...edl.broll].map((s) => s.crop)) {
    const [, h, , y] = c.split(":").map(Number);
    assert.ok(y + h <= 565, c);
  }
});
