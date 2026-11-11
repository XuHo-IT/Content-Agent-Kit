// The kit's expiring facts: each has a date, a max age, the searches that renew it, and
// somewhere to write the result. Pure; no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ITEMS, ageDays, fillQuery, freshness, markChecked } from "../scripts/maintenance/lib/freshness.mjs";
import { licenceDrift } from "../scripts/maintenance/licence-watch.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => { try { return fs.readFileSync(path.join(KIT, p), "utf8"); } catch { return null; } };

test("every item says what it is, how old it may get, and how to renew it", () => {
  const ids = new Set();
  for (const it of ITEMS) {
    assert.ok(!ids.has(it.id), `duplicate id ${it.id}`);
    ids.add(it.id);
    assert.ok(["code", "auto", "research"].includes(it.kind), `${it.id}: bad kind`);
    assert.ok(it.what && it.update && it.maxAgeDays > 0, `${it.id}: needs what, update, maxAgeDays`);
    if (it.kind === "auto") assert.match(it.command, /^node scripts\//, `${it.id}: auto needs a command`);
    else assert.ok(it.queries?.length && it.official?.length, `${it.id}: needs queries and official sources`);
  }
});

test("every code item's date is really in its file — the regex and the file have not drifted apart", () => {
  for (const it of ITEMS.filter((i) => i.kind === "code")) {
    const text = read(it.file);
    assert.ok(text, `${it.id}: ${it.file} is missing`);
    const m = text.match(it.dateRe);
    assert.ok(m, `${it.id}: ${it.dateRe} does not match ${it.file}`);
    assert.ok(Date.parse(m[1]) <= Date.now() + 86400000, `${it.id}: checked date ${m[1]} is in the future`);
  }
  for (const it of ITEMS.filter((i) => i.kind === "auto")) {
    const script = it.command.split(" ")[1];
    assert.ok(fs.existsSync(path.join(KIT, script)), `${it.id}: ${script} does not exist`);
  }
});

test("ages, stale flags and the later of file vs state", () => {
  assert.equal(ageDays("2026-11-01", "2026-11-11"), 10);
  assert.equal(ageDays(null, "2026-11-11"), null);
  const items = [
    { id: "a", kind: "code", file: "x", dateRe: /D="(\d{4}-\d{2}-\d{2})"/, maxAgeDays: 30, what: "", update: "" },
    { id: "b", kind: "research", maxAgeDays: 7, queries: ["news {month} {year}"], what: "", update: "" },
  ];
  const rows = freshness({ today: "2026-11-11", items, readFile: () => 'D="2026-09-01"', state: { a: { checkedAt: "2026-11-05" } } });
  const a = rows.find((r) => r.id === "a"), b = rows.find((r) => r.id === "b");
  assert.equal(a.checkedAt, "2026-11-05"); // "checked, unchanged" recorded in state wins over the older file date
  assert.equal(a.stale, false);
  assert.equal(b.stale, true); // never checked
  assert.deepEqual(b.queries, ["news November 2026"]);
  assert.equal(rows[0].id, "b"); // stale first
});

test("queries are filled with the current month and year", () => {
  assert.equal(fillQuery("TikTok policy {month} {year}", "2027-03-02"), "TikTok policy March 2027");
});

test("markChecked records today and refuses unknown ids", () => {
  const s = markChecked({}, "platform-policy-news", "2026-11-11", "nothing new for VN");
  assert.deepEqual(s["platform-policy-news"], { checkedAt: "2026-11-11", note: "nothing new for VN" });
  assert.throws(() => markChecked({}, "nope", "2026-11-11"), /unknown item/);
});

test("licence drift: the four 2026-11 cases are caught, a pinned licence stays quiet until it changes", () => {
  const e = (o) => ({ repo: "a/b", ref: "main", license: "MIT", licenseFile: "LICENSE", ...o });
  const gh = (spdx, o = {}) => ({ status: 200, spdx, archived: false, ...o });
  assert.deepEqual(licenceDrift(e(), gh("MIT"), true), []);
  assert.match(licenceDrift(e(), gh("Apache-2.0"), true).join(), /detects Apache-2.0/);
  assert.match(licenceDrift(e(), gh("NOASSERTION"), true).join(), /cannot classify/); // how CC BY-NC hid
  assert.match(licenceDrift(e({ licenseFile: "LICENSE" }), gh("MIT"), false).join(), /missing/); // renamed to LICENSE.md
  assert.match(licenceDrift(e(), gh("MIT", { archived: true }), true).join(), /archived/);
  assert.deepEqual(licenceDrift(e(), { status: 404 }, false), ["repo is gone (404)"]);
  // read and pinned: quiet while the file is the same, loud when it changes
  assert.deepEqual(licenceDrift(e({ license: "CC-BY-NC-4.0", licenseSha: "abc" }), gh("NOASSERTION"), true, "abc"), []);
  assert.match(licenceDrift(e({ licenseSha: "abc" }), gh("NOASSERTION"), true, "def").join(), /changed since it was read/);
  assert.match(licenceDrift({ ...e(), unlicensed: true, license: "NONE" }, gh("MIT"), true).join(), /now has a licence/);
});
