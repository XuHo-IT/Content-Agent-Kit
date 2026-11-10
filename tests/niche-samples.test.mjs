// The README is now a page of sample videos. If a sample's script stops validating, or a link
// in the README points at a file that is not there, the first thing a new user sees is broken.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { validateScript } from "../scripts/video/lib/validate.mjs";
import { NICHES } from "../examples/niche-samples/make-scripts.mjs";

const pack = JSON.parse(fs.readFileSync("templates/INDUSTRIES.template.json", "utf8")).industries;

test("every niche sample is a valid script on its industry's own palette", () => {
  for (const [id, n] of Object.entries(NICHES)) {
    const { label, ...script } = n;
    const { errors } = validateScript(script);
    assert.deepEqual(errors, [], `${id}: ${errors.join("; ")}`);
    assert.ok(pack[id], `${id} is not an industry in INDUSTRIES.template.json`);
    assert.equal(script.theme, pack[id].theme, `${id} should use its industry palette ${pack[id].theme}`);
  }
});

test("the committed script.json files match the generator", () => {
  for (const [id, n] of Object.entries(NICHES)) {
    const f = path.join("examples/niche-samples", id, "script.json");
    if (!fs.existsSync(f)) continue; // generated, then rendered — absence is caught by the README test
    const { label, ...script } = n;
    assert.deepEqual(JSON.parse(fs.readFileSync(f, "utf8")), { _niche: label, ...script }, `${f} drifted — re-run make-scripts.mjs`);
  }
});

test("every relative link and image in README.md exists", () => {
  const md = fs.readFileSync("README.md", "utf8");
  const missing = [...md.matchAll(/\]\((?!https?:|#|mailto:)([^)\s#]+)/g)]
    .map((m) => decodeURIComponent(m[1]))
    .filter((p) => !fs.existsSync(p));
  assert.deepEqual(missing, []);
});
