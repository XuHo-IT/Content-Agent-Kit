// theme-inputs.test.mjs — a theme has to reach scene.inputs, not just the HTML.
//
// applyTheme rewrites the template file. `scene.inputs` never passes through it: those go
// out through variables.json and hyperframes injects them at render time, AFTER theming has
// already run. So a caller who wrote "accent": "#f59e0b" got amber on a paper-blue video.
//
// The evidence was sitting in the repo the whole time — the paper-blue sample had to
// hand-edit that exact hex to teal, because there was no other way to make it match.
//
// Worse, the self-test looked like it covered this: it checks hex values inside
// `data-composition-variables`, which ARE themed because they live in the HTML. The one
// place that was not themed is the one place it never looked.
import test from "node:test";
import assert from "node:assert/strict";
import { resolveTheme, mapColor, mapInputColors } from "../scripts/video/lib/theme.mjs";

const T = resolveTheme("paper-blue");

test("a hex in inputs comes back recoloured", () => {
  const { mapped } = mapInputColors({ accent: "#f59e0b" }, T, true);
  assert.notEqual(mapped.accent, "#f59e0b", "amber must not survive a paper-blue render");
  assert.match(mapped.accent, /^#[0-9a-f]{6}$/);
});

test("it agrees with mapColor — the HTML and the inputs cannot drift apart", () => {
  // This is the property that matters. Both halves must produce the same colour for the
  // same input, or a themed video ends up with two palettes in one frame.
  for (const invert of [true, false]) {
    const { mapped } = mapInputColors({ c: "#f59e0b" }, T, invert);
    assert.equal(mapped.c, mapColor({ r: 0xf5, g: 0x9e, b: 0x0b }, T, invert));
  }
});

test("nested objects and arrays are walked", () => {
  const { mapped } = mapInputColors(
    { a: { b: { c: "#ff0000" } }, list: ["#00ff00", "not a colour"] },
    T, true,
  );
  assert.match(mapped.a.b.c, /^#[0-9a-f]{6}$/);
  assert.match(mapped.list[0], /^#[0-9a-f]{6}$/);
  assert.equal(mapped.list[1], "not a colour");
});

test("3-digit and 8-digit hex are handled", () => {
  const { mapped } = mapInputColors({ short: "#fff", alpha: "#ff0000ff" }, T, true);
  assert.match(mapped.short, /^#[0-9a-f]{6}$/);
  assert.match(mapped.alpha, /^#[0-9a-f]{6}$/);
});

test("hashtags are NOT colours", () => {
  // Captions in this kit end in hashtags far more often than inputs contain colours.
  // Recolouring "#AI" into "#0a4a7a" would be a much worse bug than the one being fixed.
  const inputs = { tags: "#AI #Claude #CongNghe", channel: "#XuHoIT", headline: "Giá #1 thị trường" };
  const { mapped, changed } = mapInputColors(inputs, T, true);
  assert.deepEqual(mapped, inputs);
  assert.deepEqual(changed, []);
});

test("a hex embedded in a sentence is left alone", () => {
  // Only a whole-string hex is a colour. "Mã màu là #f59e0b nhé" is prose about a colour,
  // and silently rewriting the number inside it would corrupt the sentence.
  const inputs = { note: "Mã màu là #f59e0b nhé" };
  const { mapped } = mapInputColors(inputs, T, true);
  assert.deepEqual(mapped, inputs);
});

test("non-string values pass through untouched", () => {
  const inputs = { n: 42, b: true, nil: null, u: undefined };
  const { mapped } = mapInputColors(inputs, T, true);
  assert.deepEqual(mapped, inputs);
});

test("changed[] names the path, so a surprising recolour is traceable", () => {
  const { changed } = mapInputColors({ theme: { accent: "#f59e0b" } }, T, true);
  assert.equal(changed.length, 1);
  assert.match(changed[0], /^theme\.accent: #f59e0b → #[0-9a-f]{6}$/);
});

test("a colour that already matches the theme is not reported as changed", () => {
  const target = mapColor({ r: 0xf5, g: 0x9e, b: 0x0b }, T, true);
  const { changed } = mapInputColors({ accent: target }, T, true);
  assert.deepEqual(changed, [], "re-running a themed script must be a no-op");
});

test("compose passes the same invert flag to both halves", async () => {
  // Guards the wiring rather than the maths: if compose ever computes `invert` twice, or
  // themes the HTML before deciding it, the two halves can disagree silently.
  const src = await import("node:fs").then((fs) =>
    fs.readFileSync(new URL("../scripts/video/lib/compose.mjs", import.meta.url), "utf8"),
  );
  assert.match(src, /const invert = canvasOf\(/, "invert must be computed once");
  assert.match(src, /applyTheme\([\s\S]*?\{ invert, templateId \}\)/, "the HTML must use that invert");
  assert.match(src, /mapInputColors\(inputs, theme, invert\)/, "the inputs must use the same one");
});
