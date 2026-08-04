// registry-watch.test.mjs — the drift detection, without touching the network.
//
// CI must never go red because someone else's repository is having a bad day, so every
// assertion here runs against maps built in memory. The one exception is the count patterns:
// those are checked against the REAL files, because a pattern that no longer matches its file
// is the exact failure this whole script exists to prevent.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { diffRegistry, missingPresetItems, checkCounts, readSnapshot } from "../scripts/video/registry-watch.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(KIT, f), "utf8");

test("an item that appeared upstream is reported as added", () => {
  const d = diffRegistry({ a: "block" }, { a: "block", b: "component" });
  assert.deepEqual(d.added, [{ name: "b", type: "component" }]);
  assert.deepEqual(d.removed, []);
  assert.deepEqual(d.changed, []);
});

test("an item that vanished upstream is reported as removed", () => {
  // This is the one that matters most for anything already vendored: the folder still
  // works, but there is no upstream to re-fetch or update it from.
  const d = diffRegistry({ a: "block", gone: "block" }, { a: "block" });
  assert.deepEqual(d.removed, [{ name: "gone", type: "block" }]);
  assert.deepEqual(d.added, []);
});

test("an item that changed type is neither added nor removed", () => {
  // A block becoming an example means the files it ships changed shape, so a vendored copy
  // is stale rather than merely old. Reporting it as unchanged would hide that.
  const d = diffRegistry({ x: "block" }, { x: "example" });
  assert.deepEqual(d.changed, [{ name: "x", from: "block", to: "example" }]);
  assert.deepEqual(d.added, []);
  assert.deepEqual(d.removed, []);
});

test("nothing moving reports nothing", () => {
  const same = { a: "block", b: "component", c: "example" };
  const d = diffRegistry(same, { ...same });
  assert.deepEqual([d.added, d.removed, d.changed], [[], [], []]);
});

test("results are sorted, so a diff of the report is readable", () => {
  const d = diffRegistry({}, { zeta: "block", alpha: "block", mid: "block" });
  assert.deepEqual(d.added.map((a) => a.name), ["alpha", "mid", "zeta"]);
});

test("a preset naming an item upstream dropped is caught", () => {
  // `--preset news` currently names 29 upstream items. A rename there fails halfway through
  // a fetch, after some files have already been written.
  const src = 'const PRESETS = {\n  news: ["alive", "dead-name"],\n};';
  assert.deepEqual(missingPresetItems(src, ["alive", "other"]), ["dead-name"]);
  assert.deepEqual(missingPresetItems(src, ["alive", "dead-name"]), []);
});

test("the preset check reads the real PRESETS block, not a guess at it", () => {
  // If add-template.mjs is restructured and the block stops matching, this returns nothing
  // and the check silently passes forever. Assert it actually found the names.
  const src = read("scripts/video/add-template.mjs");
  const everything = missingPresetItems(src, []); // upstream has nothing → all are "missing"
  assert.ok(everything.length >= 20, `only found ${everything.length} preset names — has PRESETS moved?`);
  assert.ok(everything.includes("transitions-blur"), `did not find a known preset item: ${everything.slice(0, 5)}`);
});

/** `{block: n, component: n, example: n}` straight from the committed snapshot. */
function snapshotByType() {
  const s = JSON.parse(read("video-templates/registry-snapshot.json"));
  const byType = {};
  for (const t of Object.values(s.items)) byType[t] = (byType[t] ?? 0) + 1;
  return { total: s.total, byType };
}

test("every documented count is found by its pattern, in the real files", () => {
  // The original bug in one assertion. Nine places state a number and none derived it from
  // anything: six said 146 against 176, and the per-type table said 113/25 against 132/36.
  // A pattern that stops matching is reported as a failure rather than quietly as "ok".
  const { total, byType } = snapshotByType();
  const counts = checkCounts(read, total, byType);
  for (const c of counts) {
    assert.equal(c.reason, null, `${c.file}: ${c.reason}`);
    assert.equal(c.found, c.want, `${c.file} (${c.of}) says ${c.found}, the snapshot says ${c.want}`);
  }
  assert.ok(counts.length >= 9, `only ${counts.length} count sites — one was dropped`);
});

test("both the total and the per-type counts are covered", () => {
  // Checking only the total would have left the 113/25 table wrong indefinitely.
  const { total, byType } = snapshotByType();
  const kinds = new Set(checkCounts(read, total, byType).map((c) => c.of));
  for (const k of ["total", "block", "component", "example"]) {
    assert.ok(kinds.has(k), `nothing checks the "${k}" count`);
  }
});

test("a wrong count is reported, not rounded away", () => {
  const counts = checkCounts(read, 999, { block: 999, component: 999, example: 999 });
  assert.ok(counts.every((c) => !c.ok), "checkCounts approved a count that is plainly wrong");
});

test("the snapshot on disk is complete and matches its own total", () => {
  const s = JSON.parse(read("video-templates/registry-snapshot.json"));
  assert.equal(Object.keys(s.items).length, s.total, "the item map and the total disagree");
  assert.ok(s.total > 100, `snapshot has only ${s.total} items — was it truncated?`);
  for (const [name, type] of Object.entries(s.items)) {
    assert.match(name, /^[a-z0-9][a-z0-9-]*$/, `odd item name: ${name}`);
    assert.ok(["block", "component", "example"].includes(type), `${name} has type "${type}"`);
  }
});

test("a missing snapshot reads as a baseline rather than as 176 additions", () => {
  // Without this, a first run reports every item as new — noise that teaches whoever reads
  // the report to stop reading it.
  const s = readSnapshot(path.join(KIT, "video-templates", "no-such-snapshot.json"));
  assert.equal(s.exists, false);
  assert.deepEqual(s.items, {});
});

test("the snapshot is sorted, so its diffs stay small", () => {
  // Re-serialising an unsorted map turns a two-item change into a whole-file diff, and a
  // whole-file diff is one nobody reads.
  const s = JSON.parse(read("video-templates/registry-snapshot.json"));
  const names = Object.keys(s.items);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)), "snapshot items are not sorted");
});
