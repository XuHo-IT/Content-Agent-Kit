// music.test.mjs — the music bed's licence and level rules, offline.
//
// Two things here can only be wrong expensively: publishing a track you had no right to, and
// a bed that sits over the narration instead of under it. Neither shows up in a render log.
// So the licence filter and the gain rule get tests; the network does not.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isUsable, rank, credit, ALLOWED_LICENCES, LICENCES_NEEDING_CREDIT } from "../scripts/video/lib/music.mjs";
import { validateScript } from "../scripts/video/lib/validate.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const track = (over = {}) => ({
  title: "A bed",
  url: "https://cdn.example/a.mp3",
  license: "cc0",
  license_version: "1.0",
  duration: 90_000,
  creator: "somebody",
  ...over,
});

// ── licence ─────────────────────────────────────────────────────────────────

test("only licences that clear a monetised video are accepted", () => {
  for (const ok of ALLOWED_LICENCES) assert.equal(isUsable(track({ license: ok })), true, `${ok} should pass`);
  // The ones that would make a monetised, edited video a problem.
  for (const bad of ["nc", "by-nc", "nd", "by-nd", "by-nc-sa", "sampling+"]) {
    assert.equal(isUsable(track({ license: bad })), false, `"${bad}" must not be usable`);
  }
});

test("a track with no audio url is never usable", () => {
  assert.equal(isUsable(track({ url: null })), false);
  assert.equal(isUsable({ license: "cc0", duration: 90_000 }), false);
});

test("a clip too short to loop invisibly is rejected", () => {
  // Under about fifteen seconds the loop is audible AS a loop, which is worse than silence.
  assert.equal(isUsable(track({ duration: 4_000 })), false);
  assert.equal(isUsable(track({ duration: 30_000 })), true);
  assert.equal(isUsable(track({ duration: 30_000 }), { minSec: 60 }), false);
});

test("only CC-BY demands a credit line", () => {
  assert.deepEqual(LICENCES_NEEDING_CREDIT, ["by"]);
  assert.equal(credit(track({ license: "by" })).creditRequired, true);
  assert.equal(credit(track({ license: "cc0" })).creditRequired, false);
  assert.equal(credit(track({ license: "pdm" })).creditRequired, false);
});

test("credit() carries everything a takedown or a claim would ask for", () => {
  const c = credit(
    track({ license: "by", license_url: "https://creativecommons.org/licenses/by/4.0/",
            foreign_landing_url: "https://freesound.org/x", attribution: "\"A bed\" by somebody…", provider: "freesound" }),
  );
  for (const f of ["title", "creator", "license", "licenseUrl", "source", "attribution"]) {
    assert.ok(String(c[f]).trim(), `credit() lost "${f}"`);
  }
});

test("ranking prefers longer, and CC0 over CC-BY at equal length", () => {
  // Longer means fewer audible loop seams; CC0 means no obligation to discharge.
  const ordered = rank([
    track({ title: "short-cc0", duration: 20_000 }),
    track({ title: "long-by", duration: 240_000, license: "by" }),
    track({ title: "long-cc0", duration: 240_000 }),
  ]);
  assert.equal(ordered[0].title, "long-cc0");
  assert.equal(ordered.at(-1).title, "short-cc0");
});

// ── level ───────────────────────────────────────────────────────────────────

const SCRIPT = JSON.parse(fs.readFileSync(path.join(KIT, "templates", "VIDEO_SCRIPT.template.json"), "utf8"));
const errorsFor = (music) => validateScript({ ...SCRIPT, music }).errors.join("\n");

test("a bed louder than the voice is an ERROR, not a preference", () => {
  // You would only notice this after a full render, with headphones on, having already paid
  // for the TTS. So it is caught in the step that costs seconds.
  assert.match(errorsFor({ query: "x", gainDb: 0 }), /must be negative/);
  assert.match(errorsFor({ query: "x", gainDb: 3 }), /must be negative/);
  assert.equal(errorsFor({ query: "x", gainDb: -20 }), "");
});

test("music needs exactly one of query or file", () => {
  assert.match(errorsFor({}), /needs a "query".*or a "file"/s);
  assert.match(errorsFor({ query: "x", file: "m.mp3" }), /pick one/);
  assert.equal(errorsFor({ file: "m.mp3" }), "");
});

test("an un-clearable licence is refused in the script too", () => {
  assert.match(errorsFor({ query: "x", license: "nc" }), /not one of/);
  assert.equal(errorsFor({ query: "x", license: "cc0" }), "");
});

test("no music block means nothing changes", () => {
  // The whole feature has to be inert for every script written before it existed.
  assert.equal(validateScript(SCRIPT).errors.length, 0);
});

test("the mixer refuses a non-negative gain at the call site as well", async () => {
  // Belt and braces: validate.mjs guards the script, this guards every other caller.
  const { mixMusicBed } = await import("../scripts/video/lib/ffmpeg-audio.mjs");
  await assert.rejects(() => mixMusicBed("a.mp3", "b.mp3", "c.mp3", { gainDb: 0 }), /must be negative/);
});
