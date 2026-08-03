// registry.test.mjs — the skill catalogue has to be well-formed offline.
//
// No network here on purpose: CI must not depend on four third-party repositories still
// existing and still being reachable. What is checked is everything a typo could break —
// a missing licence field, a path that would install two skills into the same folder, a
// `ref` nobody set. Whether the upstream is up is the installer's problem at runtime, and
// it already reports that clearly.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(fs.readFileSync(path.join(KIT, "skills", "registry.json"), "utf8"));
const entries = Object.entries(registry.skills);

test("registry has entries", () => {
  assert.ok(entries.length > 0);
});

test("every entry carries the fields the installer reads", () => {
  for (const [id, s] of entries) {
    for (const field of ["repo", "ref", "path", "installAs", "license", "licenseFile", "summary", "why"]) {
      assert.ok(s[field], `${id} is missing \`${field}\``);
      assert.equal(typeof s[field], "string", `${id}.${field} must be a string`);
    }
    assert.match(s.repo, /^[\w.-]+\/[\w.-]+$/, `${id}.repo must be owner/name`);
  }
});

test("a licence file is declared for every entry", () => {
  // The installer refuses to install without one. A skill with no licence is a skill
  // nobody may legally reuse — the same gap RAG-EVAL-VN had.
  for (const [id, s] of entries) {
    assert.ok(s.licenseFile.trim(), `${id} declares no licence file`);
    assert.ok(s.license.trim(), `${id} declares no licence`);
  }
});

test("no two skills install into the same folder", () => {
  const seen = new Map();
  for (const [id, s] of entries) {
    assert.ok(!seen.has(s.installAs), `${id} and ${seen.get(s.installAs)} both install as "${s.installAs}"`);
    seen.set(s.installAs, id);
  }
});

test("installAs is a plain folder name — it is joined onto a user's skills directory", () => {
  for (const [id, s] of entries) {
    assert.match(s.installAs, /^[a-z0-9][a-z0-9-]*$/, `${id}.installAs must be lowercase-kebab`);
    assert.ok(!s.installAs.includes(".."), `${id}.installAs must not escape the destination`);
  }
});

test("path does not escape the upstream repo", () => {
  for (const [id, s] of entries) {
    assert.ok(!s.path.startsWith("/"), `${id}.path must be relative`);
    assert.ok(!s.path.includes(".."), `${id}.path must not contain ..`);
  }
});

test("the kit's own skills are not listed — those ship in the repo", () => {
  const own = fs
    .readdirSync(path.join(KIT, "skills"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  for (const [id, s] of entries) {
    assert.ok(!own.includes(s.installAs), `${id} collides with the kit's own skills/${s.installAs}`);
  }
});
