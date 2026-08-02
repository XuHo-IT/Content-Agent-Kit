// tts-check.mjs — prove a TTS provider + voice works before spending a render on it.
//   node scripts/video/tts-check.mjs
//   node scripts/video/tts-check.mjs --provider fptai --voice banmai --out sample.mp3
//   node scripts/video/tts-check.mjs --text "Xin chào, đây là giọng thử."
//   node scripts/video/tts-check.mjs --list-voices          # where the provider exposes them
//   node scripts/video/tts-check.mjs --providers            # what's built in (no network)
//
// Reads one short sentence aloud, saves it, and reports latency + duration so you can
// actually listen before committing. A render takes 3–5 minutes; this takes seconds.
//
// ENV: TTS_PROVIDER, TTS_VOICE_ID, TTS_SPEED (+ the provider's API key — see docs/14).
import fs from "node:fs";
import path from "node:path";
import { ttsConfig, createTtsClient, listVoices, missingKeys, PROVIDERS, describeProvider } from "./lib/tts.mjs";
import { getDurationSec } from "./lib/ffmpeg-audio.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log(
    `tts-check.mjs — read one sentence aloud with the configured provider\n` +
      `  --provider <id>   override TTS_PROVIDER (${PROVIDERS.join(" | ")})\n` +
      `  --voice <id>      override TTS_VOICE_ID\n` +
      `  --speed <n>       override TTS_SPEED (0.5–2.0)\n` +
      `  --text "<...>"    what to say (default: a Vietnamese sample)\n` +
      `  --out <file>      where to save it (default: tts-sample-<provider>.mp3)\n` +
      `  --list-voices     list the provider's voices\n` +
      `  --providers       show the built-in provider table and exit (no network)\n` +
      `env: TTS_PROVIDER, TTS_VOICE_ID, TTS_SPEED + the provider's API key`,
  );
  process.exit(0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

// --providers works with no config at all — useful when deciding what to sign up for.
if (argv.includes("--providers")) {
  console.log(`[tts] built-in providers:\n`);
  for (const p of PROVIDERS) {
    const d = describeProvider(p);
    const tags = [
      d.local ? "local" : "cloud",
      d.experimental ? "EXPERIMENTAL" : null,
      d.needsVoiceId ? "needs voiceId" : null,
    ].filter(Boolean);
    console.log(`  ${p.padEnd(11)} ${String(d.shape).padEnd(22)} ${tags.join(" · ")}`);
    if (d.keys.length) console.log(`  ${" ".repeat(11)} env: ${d.keys.join(", ")}`);
    if (d.knownVoices) console.log(`  ${" ".repeat(11)} voices: ${d.knownVoices.join(", ")}`);
    console.log(`  ${" ".repeat(11)} ${d.note}\n`);
  }
  process.exit(0);
}

const SAMPLE =
  "Xin chào, đây là giọng đọc thử của kênh. " +
  "Camera hai trăm megapixel, sắc nét hơn hẳn thế hệ trước.";

try {
  const cfg = ttsConfig({
    provider: flag("--provider") ?? undefined,
    voiceId: flag("--voice") ?? undefined,
    speed: flag("--speed") ? Number(flag("--speed")) : undefined,
  });

  const missing = missingKeys(cfg.provider);
  if (missing.length) {
    throw new Error(
      `Provider "${cfg.provider}" needs ${missing.join(", ")} in your .env (see .env.example).`,
    );
  }

  console.log(
    `[tts] provider: ${cfg.provider}${cfg.spec.experimental ? " (EXPERIMENTAL)" : ""}` +
      `\n[tts] voice:    ${cfg.voiceId ?? "(provider default)"}` +
      `\n[tts] shape:    ${cfg.shape}   speed: ${cfg.speed}` +
      (cfg.endpoint ? `\n[tts] endpoint: ${cfg.endpoint}` : "") +
      (cfg.model ? `\n[tts] model:    ${cfg.model}` : ""),
  );

  if (argv.includes("--list-voices")) {
    const voices = await listVoices(cfg);
    if (!voices) {
      console.log(`[tts] ! ${cfg.provider} has no voice-listing endpoint — see its own docs.`);
      process.exit(0);
    }
    console.log(`[tts] ${voices.length} voice(s):`);
    for (const v of voices) {
      console.log(`  ${String(v.id).padEnd(26)} ${v.name ?? ""}${v.labels ? `  (${v.labels})` : ""}`);
    }
    process.exit(0);
  }

  const text = flag("--text") ?? SAMPLE;
  const out = path.resolve(flag("--out") ?? `tts-sample-${cfg.provider}.mp3`);

  console.log(`[tts] speaking ${text.length} chars…`);
  const t0 = Date.now();
  await createTtsClient(cfg).generate(text, out);
  const ms = Date.now() - t0;

  const bytes = fs.statSync(out).size;
  let dur = null;
  try {
    dur = await getDurationSec(out);
  } catch {
    /* ffprobe missing — not fatal for this check */
  }

  console.log(
    `[tts] ✓ ${(bytes / 1024).toFixed(0)} KB` +
      (dur ? `, ${dur.toFixed(2)}s audio` : "") +
      `, ${ms} ms round-trip`,
  );
  console.log(`[tts]   listen: ${out}`);
} catch (e) {
  console.error(`[tts] ✗ ${e.message}`);
  process.exit(1);
}
