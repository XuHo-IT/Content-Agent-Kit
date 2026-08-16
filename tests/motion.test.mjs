// motion.test.mjs — the frames that must not go dead.
//
// A template whose animation is all entrance renders an identical picture from ~2s to the end
// of the scene. On a 6–10 second scene that is a still image for most of its duration, and
// nothing catches it: the render succeeds, the frame is full, the contact sheet is sampled at
// 4s and looks correct. It was measured, not guessed — nine of the templates this kit reaches
// for had zero continuous animation, while the three that felt alive (analog-grain,
// geo-sonar-radar, bold-poster) all ran loops.
//
// See skills/motion-craft, "Two layers": the CONTENT settles so it can be read, the CANVAS
// does not stop.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { templatesDir, listTemplateIds } from "../scripts/video/lib/paths.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Templates that have been through the ambient pass. This is a contract, not a wish list:
 * adding a name here without giving it a loop fails the suite.
 *
 * It is NOT the whole library — see the debt test at the bottom, which prints what is left
 * rather than letting the gap sit unstated.
 */
const AMBIENT_REQUIRED = [
  "frame-analog-grain",
  "frame-geo-sonar-radar",
  "frame-bold-poster",
  "frame-hybrid-vox-geo",
  "frame-vox-investigation-board",
  "frame-vox-declassified",
  "frame-vox-newspaper-tear",
  "frame-vox-data-callout",
  "frame-vox-photo-grid",
  "frame-myth-fact",
  "frame-split-compare",
  "frame-broll",
  "frame-media-inset",
  "frame-logo-outro",
];

const compositions = (id) =>
  ["index.html", "compositions/portrait.html"].filter((f) => fs.existsSync(path.join(templatesDir(), id, f)));

const read = (id, f) => fs.readFileSync(path.join(templatesDir(), id, f), "utf8");
const loops = (html) => (html.match(/infinite/g) ?? []).length;

test("every template in the ambient set keeps moving, in BOTH aspects", () => {
  for (const id of AMBIENT_REQUIRED) {
    const files = compositions(id);
    assert.ok(files.length === 2, `${id} does not have both compositions`);
    for (const f of files) {
      assert.ok(
        loops(read(id, f)) > 0,
        `${id}/${f} has no continuous animation — it renders a still image after its entrance`,
      );
    }
  }
});

test("neither aspect was left behind", () => {
  // A fix applied to one composition and not the other is the most common way this
  // regresses, and it is invisible unless you render both — which nobody does by default.
  // This caught a REAL one on its first run: frame-bold-poster floated four bubbles in 9:16
  // and had nothing at all in 16:9, so half its renders were a still image.
  //
  // It deliberately does NOT demand the same COUNT. The two aspects are different designs
  // on purpose (see frame-broll/NOTICE.md); a portrait frame with room for four drifting
  // shapes and a landscape one with room for a single field are both correct.
  for (const id of AMBIENT_REQUIRED) {
    const a = loops(read(id, "index.html"));
    const b = loops(read(id, "compositions/portrait.html"));
    assert.ok(a > 0 && b > 0, `${id}: landscape has ${a} loop(s), portrait has ${b} — one aspect was missed`);
  }
});

test("an ambient layer never animates text", () => {
  // The rule that keeps this from becoming "everything wobbles". A loop on a text element
  // makes it unreadable at phone size, and motion-craft's "not more than three things at
  // once" is about attention, not about how many keyframes exist.
  const TEXT_SELECTORS = /(^|\s|,)(h1|h2|h3|p|\.headline|\.caption|\.kicker|\.takeaway|\.quote)\b[^{]*\{[^}]*infinite/;
  for (const id of AMBIENT_REQUIRED) {
    for (const f of compositions(id)) {
      const style = read(id, f).match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
      assert.doesNotMatch(style, TEXT_SELECTORS, `${id}/${f} loops an animation on a text element`);
    }
  }
});

test("the ambient layer stays a backdrop, not a participant", () => {
  // Injected as #root::after over the whole frame. Without pointer-events:none it would sit
  // on top of everything as far as anything interactive is concerned, and without a bounded
  // opacity it stops being ambient and starts being the picture.
  for (const id of AMBIENT_REQUIRED) {
    for (const f of compositions(id)) {
      const html = read(id, f);
      if (!html.includes("#root::after")) continue; // hand-authored loops (analog-grain etc.)
      const block = html.slice(html.indexOf("#root::after"), html.indexOf("}", html.indexOf("#root::after")));
      assert.match(block, /pointer-events:\s*none/, `${id}/${f}: ambient layer is not pointer-events:none`);
    }
  }
});

test("how much of the library still goes dead", () => {
  // Not a failure — a counter. This kit's rule is that a bounded pass says what it left
  // undone rather than reading as "everything is covered". The number should fall over time;
  // it must never quietly become the whole library while this file claims otherwise.
  const dead = listTemplateIds().filter((id) => compositions(id).every((f) => loops(read(id, f)) === 0));
  const total = listTemplateIds().length;
  console.log(
    `      [motion] ${total - dead.length}/${total} templates have a continuous layer; ` +
      `${dead.length} still render a still image after their entrance.`,
  );
  // The ones already done must not regress back into that list.
  for (const id of AMBIENT_REQUIRED) {
    assert.ok(!dead.includes(id), `${id} lost its ambient layer`);
  }
});
