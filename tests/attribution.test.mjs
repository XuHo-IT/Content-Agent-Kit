// attribution.test.mjs — every template's NOTICE has to say who owns it, on its own.
//
// The root NOTICE.md is correct and complete. But it is not what travels: the per-template
// NOTICE.md is, because that is what someone gets when they copy one folder out — which the
// root NOTICE explicitly tells them to keep, since Apache-2.0 §4 requires it.
//
// Two of them read "**Original template** authored for this repo (AI Coding)". Three OTHER
// templates, genuinely owned by this kit, read "authored for content-agent-kit". So a reader
// with only the folder in front of them would take "this repo" to mean content-agent-kit and
// conclude the copyright sits here. It does not: those two are MIT © AI Coding /
// Ho Quang Hai, exactly as the root NOTICE says.
//
// Nothing in the licence chain was broken — the root file was always right — but the notice
// that actually travels named the wrong owner by implication.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { templatesDir } from "../scripts/video/lib/paths.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const folders = fs
  .readdirSync(templatesDir(), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const notice = (id) => fs.readFileSync(path.join(templatesDir(), id, "NOTICE.md"), "utf8");

test("every template folder carries a NOTICE.md", () => {
  // Including the two that are not usable as scene templates: they are still vendored
  // Apache-2.0 work, and the obligation does not depend on whether the code uses them.
  for (const id of folders) {
    assert.ok(fs.existsSync(path.join(templatesDir(), id, "NOTICE.md")), `${id} has no NOTICE.md`);
  }
});

test("every NOTICE names an owner without needing the root NOTICE beside it", () => {
  // Exactly one of: an upstream Source, a copyright line, or an explicit statement that
  // this kit owns it. "Original template authored for this repo" satisfies none of them —
  // "this repo" is only unambiguous to someone who already knows the answer.
  for (const id of folders) {
    const t = notice(id);
    const hasSource = /\*\*Source:\*\*|Vendored and adapted from/.test(t);
    const hasCopyright = /©/.test(t);
    const isOurs = /authored for content-agent-kit/.test(t);
    assert.ok(
      hasSource || hasCopyright || isOurs,
      `${id}/NOTICE.md names no owner — add a Source, a © line, or "authored for content-agent-kit"`,
    );
    assert.ok(!/authored for this repo/i.test(t), `${id}/NOTICE.md says "this repo", which reads as the wrong owner`);
  }
});

test("third-party templates name their licence", () => {
  for (const id of folders) {
    const t = notice(id);
    if (/authored for content-agent-kit/.test(t)) continue; // ours, covered by the root LICENSE
    assert.match(t, /Apache-2\.0|MIT/, `${id}/NOTICE.md is third-party but names no licence`);
  }
});

test("Apache-2.0 templates point at the full licence text, which ships", () => {
  // §4(a): "give any other recipients of the Work a copy of this License". A link to a
  // licence that is not in the repo does not satisfy that.
  const apacheText = path.join(KIT, "LICENSES", "Apache-2.0.txt");
  assert.ok(fs.existsSync(apacheText), "LICENSES/Apache-2.0.txt is missing — Apache-2.0 §4(a) requires it");
  assert.match(fs.readFileSync(apacheText, "utf8"), /TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION/);

  const root = fs.readFileSync(path.join(KIT, "NOTICE.md"), "utf8");
  assert.match(root, /LICENSES\/Apache-2\.0\.txt/, "the root NOTICE must point at the licence text");
});

test("the root NOTICE accounts for every template folder", () => {
  // A template listed nowhere is one whose provenance nobody stated.
  const root = fs.readFileSync(path.join(KIT, "NOTICE.md"), "utf8");
  const missing = folders.filter((id) => !root.includes(id));
  assert.deepEqual(missing, [], `NOTICE.md never mentions: ${missing.join(", ")}`);
});

test("LICENSE is plain MIT with nothing appended", () => {
  // Appending prose to a LICENSE file makes GitHub's detector report NOASSERTION and drop
  // the licence badge — proved on a sibling repo. Disclaimers belong in NOTICE.md.
  const license = fs.readFileSync(path.join(KIT, "LICENSE"), "utf8");
  assert.match(license, /^MIT License/m);
  assert.match(license, /THE SOFTWARE IS PROVIDED "AS IS"/);
  const after = license.split(/SOFTWARE\.\s*$/m)[1] ?? "";
  assert.equal(after.trim(), "", "LICENSE has text after the MIT body — move it to NOTICE.md");
});
