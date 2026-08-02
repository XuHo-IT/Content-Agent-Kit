// voice-cache.mjs — decide whether a scene's narration mp3 can be reused.
//
// Reusing `voice/scene-<id>.mp3` purely because the file exists has two silent
// failure modes: switch provider/voice and you keep the OLD voice; edit voiceText
// and you keep the OLD words. Both render a wrong video that looks successful.
//
// So each mp3 is written with a sidecar `voice/scene-<id>.json` fingerprint, and
// the mp3 is reused only when every field still matches.
import fs from "node:fs";
import { createHash } from "node:crypto";

/** Fields that, if changed, invalidate the audio. */
export function fingerprint(scene, cfg) {
  return {
    provider: cfg.provider,
    voiceId: cfg.voiceId ?? null,
    speed: cfg.speed,
    model: cfg.model ?? null,
    textHash: "sha256:" + createHash("sha256").update(scene.voiceText, "utf8").digest("hex").slice(0, 32),
  };
}

const sidecarPath = (mp3Path) => mp3Path.replace(/\.mp3$/i, ".json");

/**
 * @returns {{reuse: true, durationSec?: number} | {reuse: false, reason: string}}
 */
export function checkCache(mp3Path, want) {
  if (!fs.existsSync(mp3Path)) return { reuse: false, reason: "no audio yet" };

  const side = sidecarPath(mp3Path);
  if (!fs.existsSync(side)) {
    // Rendered by an older version of the kit — no fingerprint to trust.
    return { reuse: false, reason: "no fingerprint (rendered before voice tracking)" };
  }

  let have;
  try {
    have = JSON.parse(fs.readFileSync(side, "utf8"));
  } catch {
    return { reuse: false, reason: "unreadable fingerprint" };
  }

  if (have.textHash !== want.textHash) return { reuse: false, reason: "voiceText changed" };
  if (have.provider !== want.provider)
    return { reuse: false, reason: `provider changed: ${have.provider} → ${want.provider}` };
  if ((have.voiceId ?? null) !== (want.voiceId ?? null))
    return { reuse: false, reason: `voice changed: ${have.voiceId ?? "—"} → ${want.voiceId ?? "—"}` };
  if (Number(have.speed) !== Number(want.speed))
    return { reuse: false, reason: `speed changed: ${have.speed} → ${want.speed}` };
  if ((have.model ?? null) !== (want.model ?? null))
    return { reuse: false, reason: `model changed: ${have.model ?? "—"} → ${want.model ?? "—"}` };

  return { reuse: true, durationSec: typeof have.durationSec === "number" ? have.durationSec : undefined };
}

/** Record the fingerprint next to a freshly generated mp3. */
export function writeCache(mp3Path, want, durationSec) {
  const data = { ...want, durationSec, createdAt: new Date().toISOString() };
  fs.writeFileSync(sidecarPath(mp3Path), JSON.stringify(data, null, 2) + "\n", "utf8");
}
