// A still image on a template whose markup ships <video src="assets/media.mp4"> used to abort the
// render: hyperframes' preflight reads the static markup, finds no media.mp4 and refuses
// (VIDEO_SOURCE_UNRENDERABLE). compose.mjs now writes the <img> into the throwaway copy.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { stillMediaHtml } from "../scripts/video/lib/compose.mjs";

test("stillMediaHtml swaps the fixed media <video> for an <img>, keeping its class", () => {
  const out = stillMediaHtml('<div><video class="meme" src="assets/media.mp4" muted playsinline preload="auto"></video></div>');
  assert.equal(out, '<div><img class="meme" src="assets/media.png" alt=""></div>');
  // other videos (a numbered grid cell, a decorative loop) are left alone
  const other = '<video class="x" src="assets/media-2.mp4"></video>';
  assert.equal(stillMediaHtml(other), other);
});

test("every template with a static media <video> is rewritten, in both aspects", () => {
  const ids = fs.readdirSync("video-templates").filter((d) => d.startsWith("frame-"));
  for (const id of ids) {
    for (const f of ["index.html", "compositions/portrait.html"]) {
      const p = `video-templates/${id}/${f}`;
      if (!fs.existsSync(p)) continue;
      const html = fs.readFileSync(p, "utf8");
      if (!html.includes('src="assets/media.mp4"')) continue;
      assert.ok(!stillMediaHtml(html).includes('src="assets/media.mp4"'), `${p} still references media.mp4`);
    }
  }
});
