// ci-local.mjs runs .github/workflows/ci.yml's steps by reading the file. If its little parser
// stops finding a step, local runs go green while CI goes red — the exact failure it exists for.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseSteps } from "../scripts/maintenance/ci-local.mjs";

const steps = parseSteps(fs.readFileSync(".github/workflows/ci.yml", "utf8"));

test("every named CI step with a run block is found", () => {
  const yml = fs.readFileSync(".github/workflows/ci.yml", "utf8");
  const runs = (yml.match(/^        run:/gm) ?? []).length;
  assert.equal(steps.length, runs, "a run: block in ci.yml was not picked up");
});

test("the step that went red unseen is among them, with its exact command", () => {
  const s = steps.find((x) => /strict mode/.test(x.name) && /VIDEO_SCRIPT/.test(x.run));
  assert.ok(s, "the reference-script strict step is missing");
  assert.match(s.run, /--strict/);
});

test("multi-line run blocks keep their body and lose only the YAML indent", () => {
  const s = steps.find((x) => x.name === "Every script parses");
  assert.match(s.run, /^fail=0\n/);
  assert.match(s.run, /exit \$fail/);
});

test("pull-request-only steps are skipped, not run", () => {
  assert.ok(steps.filter((s) => s.job === "author-gate").every((s) => s.skip));
  assert.ok(steps.filter((s) => s.job === "check").every((s) => !s.skip));
});
