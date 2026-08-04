// sheet.test.mjs — the filter string behind every labelled thumbnail.
//
// Three ffmpeg traps live in lib/sheet.mjs, and each one fails the WHOLE chain rather than
// degrading. They are string-level, so they can be checked without ffmpeg.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tileFilter, escapeFontPath, SHEET_BG } from "../scripts/video/lib/sheet.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("a Windows font path gets exactly one backslash before the drive colon", () => {
  // ffmpeg's filter parser reads `:` as an option separator, so `C:/Windows/...` becomes a
  // filter option named "C". Two backslashes make the path invalid again — it is one, and
  // only in front of the drive letter.
  assert.equal(escapeFontPath("C:/Windows/Fonts/arial.ttf"), "C\\:/Windows/Fonts/arial.ttf");
  assert.equal(escapeFontPath("C:\\Windows\\Fonts\\arial.ttf"), "C\\:/Windows/Fonts/arial.ttf");
  assert.equal(escapeFontPath("/usr/share/fonts/TTF/DejaVuSans.ttf"), "/usr/share/fonts/TTF/DejaVuSans.ttf");
});

test("the label is positioned with drawtext's vocabulary, not scale's", () => {
  // `ih` is valid in scale and pad and UNDEFINED in drawtext, where the input height is `h`.
  // Using `ih` there fails the whole chain with a message about the expression, not the mix-up.
  const f = tileFilter({ width: 240, label: "frame-x", font: "/f.ttf" });
  const draw = f.slice(f.indexOf("drawtext="));
  assert.ok(!/\bih\b/.test(draw), `drawtext section uses ih:\n${draw}`);
  assert.ok(/y=h-\d+/.test(draw), `label is not anchored to the bottom:\n${draw}`);
});

test("the label strip is added by pad before the text is drawn into it", () => {
  // Drawing first would put the text over the image instead of under it.
  const f = tileFilter({ width: 240, label: "x", font: "/f.ttf" });
  assert.ok(f.indexOf("pad=") < f.indexOf("drawtext="), f);
  assert.ok(f.includes(`color=${SHEET_BG}`), f);
});

test("quotes, colons and backslashes are stripped from a label", () => {
  // A stray `'` closes drawtext's text argument early and the rest of the label becomes
  // filter options; `:` splits options; `\` starts an escape. Stripping is blunt, and
  // unlike escaping it cannot produce an invalid chain.
  const label = ["it", String.fromCharCode(39), "s", ":", " a", String.fromCharCode(92), "b"].join("");
  const f = tileFilter({ width: 240, label, font: "/f.ttf" });
  const text = f.match(/text='([^']*)'/)[1];
  assert.equal(text, "its ab");
});

test("no font means no drawtext at all — not an empty fontfile", () => {
  // `fontfile=''` is not "no font", it is an invalid font path, and drawtext errors.
  const f = tileFilter({ width: 240, label: "x", font: null });
  assert.ok(!f.includes("drawtext"), f);
  assert.ok(f.startsWith("scale=240:-2"), f);
});

test("contact-sheet and template-sheet share one implementation", () => {
  // The point of extracting lib/sheet.mjs. A second copy of the escaping is a second place
  // for it to be wrong.
  for (const f of ["scripts/video/contact-sheet.mjs", "scripts/video/template-sheet.mjs"]) {
    const src = fs.readFileSync(path.join(KIT, f), "utf8");
    assert.ok(/from "\.\/lib\/sheet\.mjs"/.test(src), `${f} does not use lib/sheet.mjs`);
    // The filter STRING, not the word — both files may mention drawtext in a comment.
    assert.ok(!/drawtext=/.test(src), `${f} builds its own drawtext filter`);
    assert.ok(!/FONT_CANDIDATES/.test(src), `${f} carries its own font list`);
    assert.ok(!/hstack=|vstack=/.test(src), `${f} does its own stacking`);
  }
});

test("the gallery inputs name slots the templates actually have", () => {
  // I wrote this file from memory first and three of the four "previous" templates had
  // invented slot names — they would have rendered as blank tiles that still looked fine
  // enough to commit.
  const inputs = JSON.parse(fs.readFileSync(path.join(KIT, "examples", "gallery", "gallery-inputs.json"), "utf8"));
  for (const [id, slots] of Object.entries(inputs)) {
    if (id.startsWith("_")) continue;
    const html = fs.readFileSync(path.join(KIT, "video-templates", id, "compositions", "portrait.html"), "utf8");
    const known = Object.keys(JSON.parse(html.match(/data-composition-variables='([^']*)'/)[1]));
    const unknown = Object.keys(slots).filter((k) => !known.includes(k));
    assert.deepEqual(unknown, [], `${id}: no such slot ${unknown.join(", ")} — known: ${known.join(", ")}`);
  }
});
