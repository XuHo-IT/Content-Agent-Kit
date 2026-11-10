// render.mjs used to reuse clips/scene-<id>.mp4 whenever it existed, so editing a scene's
// inputs or template re-used the stale picture. The key now covers what the clip is made from.
import { test } from "node:test";
import assert from "node:assert/strict";
import { sceneClipKey } from "../scripts/video/lib/clip-key.mjs";

const scene = { id: "s1", templateId: "frame-checklist", inputs: { title: "A" } };

test("same scene, same length → same key (TTS jitter under 50 ms ignored)", () => {
  assert.equal(sceneClipKey(scene, [], 8.01, "9:16"), sceneClipKey(scene, [], 8.03, "9:16"));
});

test("template, inputs, length or aspect change → new key", () => {
  const k = sceneClipKey(scene, [], 8, "9:16");
  assert.notEqual(k, sceneClipKey({ ...scene, templateId: "frame-step-list" }, [], 8, "9:16"));
  assert.notEqual(k, sceneClipKey({ ...scene, inputs: { title: "B" } }, [], 8, "9:16"));
  assert.notEqual(k, sceneClipKey(scene, [], 9, "9:16"));
  assert.notEqual(k, sceneClipKey(scene, [], 8, "16:9"));
  assert.notEqual(k, sceneClipKey(scene, [{ kind: "image", file: "nope.png" }], 8, "9:16"));
});

test("editing the template file itself also invalidates the clip", () => {
  const a = sceneClipKey(scene, [], 8, "9:16", "aaaa");
  assert.notEqual(a, sceneClipKey(scene, [], 8, "9:16", "bbbb"));
});

test("templateHash reads the portrait entry of a real template", async () => {
  const { templateHash } = await import("../scripts/video/lib/clip-key.mjs");
  assert.match(templateHash("frame-checklist", "9:16"), /^[0-9a-f]{12}$/);
  assert.equal(templateHash("frame-does-not-exist", "9:16"), "missing");
});
