// backends.test.mjs — profile precedence, cost arithmetic and the spend guards.
//
// No network and no API key: everything here is pure. The api backend's wire format is
// explicitly NOT covered — it has not been run against a live account, and a test that
// mocked fetch would only assert that the code matches itself. `--dry-run` prints the
// requests so a human can check them; that is the honest level of confidence.
//
// What IS covered is the part that decides whether money gets spent.
import test from "node:test";
import assert from "node:assert/strict";
import { resolveSettings, pick, listProfiles, loadProfile } from "../scripts/video/lib/profile.mjs";
import { estimate, checkCeiling, MIN_CLIP_SEC } from "../scripts/video/lib/backends/api.mjs";
import { BACKENDS, BACKEND_IDS, assertBackend } from "../scripts/video/lib/backends/index.mjs";
import { sceneFrames, ident } from "../scripts/video/lib/backends/remotion.mjs";

const script = (scenes) => ({ scenes });
const scene = (id, words) => ({ id, voiceText: Array(words).fill("từ").join(" ") });

// ── precedence ───────────────────────────────────────────────────────────────

test("pick treats 0, empty string and false as answers", () => {
  assert.equal(pick(undefined, 0, 5), 0);
  assert.equal(pick(undefined, "", "x"), "");
  assert.equal(pick(undefined, false, true), false);
  assert.equal(pick(undefined, null, "x"), "x");
});

test("script.json beats every other source", () => {
  const s = resolveSettings({
    script: { backend: "api", theme: "paper-blue" },
    profile: { backend: "remotion", theme: "dark" },
    flags: { backend: "html" },
    env: { VIDEO_BACKEND: "remotion" },
  });
  assert.equal(s.backend, "api");
  assert.equal(s.theme, "paper-blue");
});

test("flags beat the profile, the profile beats env", () => {
  assert.equal(
    resolveSettings({ profile: { backend: "remotion" }, flags: { backend: "api" }, env: {} }).backend,
    "api",
  );
  assert.equal(
    resolveSettings({ profile: { backend: "remotion" }, env: { VIDEO_BACKEND: "api" } }).backend,
    "remotion",
  );
});

test("backend falls back to html when nothing says otherwise", () => {
  assert.equal(resolveSettings({ env: {} }).backend, "html");
});

test("voice fields fall through independently", () => {
  // A script naming only a voiceId must keep the profile's provider, not lose it.
  const s = resolveSettings({
    script: { voice: { voiceId: "abc" } },
    profile: { voice: { provider: "elevenlabs", speed: 1.2 } },
    env: {},
  });
  assert.equal(s.voice.provider, "elevenlabs");
  assert.equal(s.voice.voiceId, "abc");
  assert.equal(s.voice.speed, 1.2);
});

test("costCeilingUsd is null when unset, never undefined", () => {
  // Regression. pick() drops a trailing null, so this used to come back undefined, and the
  // api backend's "would bill $X and no ceiling is set" guard compared against null and
  // never fired — a render could start spending with no confirmation at all.
  const s = resolveSettings({ env: {} });
  assert.equal(s.costCeilingUsd, null);
  assert.notEqual(s.costCeilingUsd, undefined);
});

test("a ceiling of 0 survives — it means refuse anything billable", () => {
  assert.equal(resolveSettings({ profile: { costCeilingUsd: 0 }, env: {} }).costCeilingUsd, 0);
});

test("both shipped profiles load and default to the free backend", () => {
  const names = listProfiles();
  assert.ok(names.includes("personal"));
  assert.ok(names.includes("business"));
  for (const n of names) {
    const p = loadProfile(n);
    assert.equal(p.backend, "html", `${n} must not default to a backend that bills`);
  }
});

test("an unknown profile names the ones that exist", () => {
  assert.throws(() => loadProfile("nope"), /Available: business, personal/);
});

// ── cost ─────────────────────────────────────────────────────────────────────

test("estimate bills whole seconds at the clip floor", () => {
  const est = estimate(script([scene("a", 2)]), { model: "veo-3.1", resolution: "1080p" });
  assert.equal(est.scenes[0].billedSec, MIN_CLIP_SEC);
  assert.equal(est.totalUsd, MIN_CLIP_SEC * 0.4);
});

test("estimate matches the published rate — a minute of Veo 3.1 is $24", () => {
  const est = estimate(script([{ id: "x", voiceText: "", durationSec: 60 }]), {
    model: "veo-3.1",
    resolution: "1080p",
  });
  assert.equal(est.totalSec, 60);
  assert.equal(est.totalUsd, 24);
});

test("lite is an order of magnitude cheaper than the flagship", () => {
  const s = script([{ id: "x", voiceText: "", durationSec: 60 }]);
  assert.equal(estimate(s, { model: "veo-3.1-lite", resolution: "1080p" }).totalUsd, 1.8);
  assert.equal(estimate(s, { model: "veo-3.1-fast", resolution: "1080p" }).totalUsd, 9);
});

test("an unknown model or resolution fails before anything is sent", () => {
  assert.throws(() => estimate(script([]), { model: "veo-9" }), /Unknown video model/);
  assert.throws(() => estimate(script([]), { model: "veo-3.1", resolution: "8k" }), /no rate for/);
});

test("checkCeiling: null means no ceiling, 0 means refuse everything billable", () => {
  assert.deepEqual(checkCeiling(18.6, null), { ok: true });
  assert.deepEqual(checkCeiling(18.6, undefined), { ok: true });
  assert.equal(checkCeiling(18.6, 0).ok, false);
  assert.equal(checkCeiling(18.6, 25).ok, true);
  assert.equal(checkCeiling(25, 25).ok, true, "exactly at the ceiling is allowed");
  assert.equal(checkCeiling(25.01, 25).ok, false);
});

test("a refusal says how to proceed, not just that it stopped", () => {
  const { reason } = checkCeiling(50, 25);
  assert.match(reason, /costCeilingUsd/);
  assert.match(reason, /veo-3.1-lite/);
  assert.match(reason, /html backend/);
});

// ── registry ─────────────────────────────────────────────────────────────────

test("every backend declares cost and requirements", () => {
  for (const id of BACKEND_IDS) {
    const b = BACKENDS[id];
    assert.ok(b.costPerVideo, `${id} must say what it costs`);
    assert.ok(b.needs, `${id} must say what it needs`);
    assert.ok(b.summary, `${id} must have a summary`);
    assert.ok(b.builtIn || b.module, `${id} must be built in or have a module`);
  }
});

test("html is built in and free — it is the default for both reasons", () => {
  assert.equal(BACKENDS.html.builtIn, true);
  assert.equal(BACKENDS.html.costPerVideo, "free");
});

test("an unknown backend points at the way to list them", () => {
  assert.throws(() => assertBackend("veo"), /Known: html \| api \| remotion/);
  assert.throws(() => assertBackend("veo"), /--list-backends/);
});

// ── remotion ─────────────────────────────────────────────────────────────────

test("scene ids become valid React identifiers", () => {
  assert.equal(ident("body-1"), "Scenebody_1");
  assert.equal(ident("hook"), "Scenehook");
  assert.equal(ident("a.b c"), "Scenea_b_c");
});

test("no scene is shorter than a second, however short its narration", () => {
  assert.equal(sceneFrames({ id: "x", voiceText: "" }, 30), 30);
  assert.equal(sceneFrames({ id: "x", durationSec: 4 }, 30), 120);
});
