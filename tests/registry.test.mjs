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
    for (const field of ["repo", "ref", "path", "installAs", "license", "summary", "why"]) {
      assert.ok(s[field], `${id} is missing \`${field}\``);
      assert.equal(typeof s[field], "string", `${id}.${field} must be a string`);
    }
    assert.match(s.repo, /^[\w.-]+\/[\w.-]+$/, `${id}.repo must be owner/name`);
  }
});

test("an entry either declares a licence file or admits it has none", () => {
  // The rule moved, and this is the shape it moved to. The installer no longer refuses an
  // upstream with no licence file: nothing is vendored, the files land on the user's own
  // disk, and these upstreams publish install commands inviting exactly that. What it
  // refuses now is being VAGUE — an entry must either name a licence file, or say
  // `unlicensed: true` so the installer prints what the user may and may not then do.
  for (const [id, s] of entries) {
    if (s.unlicensed === true) {
      assert.equal(s.license, "NONE", `${id} is marked unlicensed but claims license "${s.license}"`);
      assert.ok(!s.licenseFile, `${id} is marked unlicensed but still names a licenseFile`);
      continue;
    }
    assert.ok(s.licenseFile?.trim(), `${id} declares no licence file and is not marked unlicensed`);
    assert.notEqual(s.license, "NONE", `${id} says license NONE without \`unlicensed: true\``);
  }
});

test("the unlicensed escape hatch stays rare and deliberate", () => {
  // Not a default. If most of the catalogue drifts into it, the bar has gone soft and the
  // warning stops being read.
  const loose = entries.filter(([, s]) => s.unlicensed === true);
  assert.ok(
    loose.length <= Math.ceil(entries.length / 4),
    `${loose.length} of ${entries.length} entries are unlicensed: ${loose.map(([i]) => i).join(", ")}`,
  );
});

test("a `via` entry names an installer the script actually knows", () => {
  // A typo here fails at install time with a shell error instead of a readable message.
  for (const [id, s] of entries) {
    if (!s.via) continue;
    assert.equal(s.via, "skills", `${id}.via = "${s.via}" — the installer only delegates to "skills"`);
    assert.equal(s.path, ".", `${id} delegates to \`skills add\`, which takes a whole repo, so path must be "."`);
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
