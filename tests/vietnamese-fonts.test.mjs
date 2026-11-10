// A font without the Vietnamese subset renders diacritics from a fallback face — no error,
// just a broken-looking headline. See scripts/video/font-check.mjs for the history.
import { test } from "node:test";
import assert from "node:assert/strict";
import { offlineProblems, familiesIn, cssFamilies, fontUrls } from "../scripts/video/font-check.mjs";

test("no template loads a font that cannot draw Vietnamese", () => {
  const p = offlineProblems();
  assert.deepEqual(
    p.map((x) => `${x.file}: ${x.family} → ${x.use}`),
    [],
  );
});

test("font URL parsing reads every family in a css2 link", () => {
  const html = `<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&amp;family=Cormorant+SC:wght@600;700&display=swap">`;
  const urls = fontUrls(html);
  assert.equal(urls.length, 1);
  assert.deepEqual(familiesIn(urls[0]), ["Plus Jakarta Sans", "Cormorant SC"]);
});

test("CSS family parsing catches quoted names in both quote styles", () => {
  const html = `.a{font-family:'Cinzel', serif}.b{font-family: "Fira Code", monospace;}`;
  assert.deepEqual(cssFamilies(html).sort(), ["Cinzel", "Fira Code"]);
});
