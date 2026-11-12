#!/usr/bin/env node
// providers-check.mjs — which paid providers are set up, and do their keys actually work?
//
//   node scripts/providers-check.mjs           # offline: which keys are present, what each enables
//   node scripts/providers-check.mjs --live    # + one FREE call per configured provider
//
// The paid adapters are written from each provider's docs and tested offline, but a key typo,
// a wrong region or an unpaid plan only shows up against the real API — usually in the middle
// of a render. `--live` asks each configured provider something that costs nothing: list the
// voices (Google, Azure, ElevenLabs), quote one clip (Higgsfield's estimate endpoint), read the
// account (Ayrshare, fal). Providers without a free endpoint (Vbee, FPT AI, Viettel) are
// pointed at tts-check.mjs, which speaks one short sentence — a few characters of your quota.
//
// ENV: reads the same keys as the providers; writes nothing.
import { loadEnv } from "./lib/env.mjs";
loadEnv(); // keys from .env, like every other script
const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log(
    `providers-check.mjs — paid providers: configured? keys working?\n` +
      `  --live     one free request per configured provider (no generation, no charge)\n` +
      `  --json     machine-readable`,
  );
  process.exit(0);
}
const env = process.env;
const has = (...k) => k.every((x) => env[x]);

/** Every optional paid provider: what it is for, the keys, a free probe where one exists. */
export const PROVIDERS = [
  { id: "vbee", job: "voice (Vietnamese)", keys: ["VBEE_TOKEN", "VBEE_APP_ID"], pay: "VND" },
  { id: "fptai", job: "voice (Vietnamese)", keys: ["FPTAI_API_KEY"], pay: "VND" },
  { id: "viettel", job: "voice (Vietnamese)", keys: ["VIETTEL_TOKEN"], pay: "VND" },
  { id: "elevenlabs", job: "voice (multilingual)", keys: ["ELEVENLABS_API_KEY"], pay: "card",
    probe: () => fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": env.ELEVENLABS_API_KEY } }) },
  { id: "google", job: "voice (50+ languages)", keys: ["GOOGLE_TTS_API_KEY"], pay: "card, free tier",
    probe: () => fetch(`https://texttospeech.googleapis.com/v1/voices?languageCode=vi-VN&key=${env.GOOGLE_TTS_API_KEY}`) },
  { id: "azure", job: "voice (140+ languages)", keys: ["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"], pay: "card, free tier",
    probe: () => fetch(`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/voices/list`, { headers: { "Ocp-Apim-Subscription-Key": env.AZURE_SPEECH_KEY } }) },
  { id: "google-veo", job: "AI video (Veo)", keys: ["GEMINI_API_KEY"], pay: "card",
    probe: () => fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`) },
  // No documented free endpoint found for fal: the first real check is one cheap clip.
  { id: "fal", job: "AI video (Kling, Hailuo, Seedance…)", keys: ["FAL_KEY"], pay: "card",
    noProbe: "no free check — one 6 s hailuo-02 clip is ~$0.27: render.mjs --backend fal on a 1-scene script" },
  { id: "higgsfield", job: "AI video (Kling 3.0, Seedance 2.0…)", keys: ["HIGGSFIELD_KEY_ID", "HIGGSFIELD_KEY_SECRET"], pay: "card",
    probe: () => fetch("https://api.higgsfield.ai/estimate/minimax/hailuo-2.3/standard/text-to-video", {
      method: "POST",
      headers: { Authorization: `Key ${env.HIGGSFIELD_KEY_ID}:${env.HIGGSFIELD_KEY_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "a quiet street at dawn", duration: 6 }),
    }) },
  { id: "ayrshare", job: "posting (TikTok, FB, IG, YouTube…)", keys: ["AYRSHARE_API_KEY"], pay: "card",
    probe: () => fetch("https://api.ayrshare.com/api/user", { headers: { Authorization: `Bearer ${env.AYRSHARE_API_KEY}` } }) },
  { id: "apify", job: "social data (TikTok, IG, FB)", keys: ["APIFY_TOKEN"], pay: "card",
    probe: () => fetch(`https://api.apify.com/v2/users/me?token=${env.APIFY_TOKEN}`) },
];

async function main() {
  const live = argv.includes("--live");
  const rows = [];
  for (const p of PROVIDERS) {
    const configured = has(...p.keys);
    const row = { id: p.id, job: p.job, pay: p.pay, configured, missing: p.keys.filter((k) => !env[k]) };
    if (live && configured) {
      if (!p.probe) row.live = p.noProbe ?? "no free check — run: node scripts/video/tts-check.mjs (speaks one short line)";
      else {
        try {
          const res = await p.probe();
          row.status = res.status;
          row.live = res.ok ? "✓ key works" : res.status === 401 || res.status === 403 ? "✗ key rejected" : `? HTTP ${res.status}`;
          if (p.id === "higgsfield" && res.ok) {
            const j = await res.json().catch(() => ({}));
            if (j.usd) row.live += ` — a 6 s Hailuo 2.3 clip quotes $${j.usd}`;
          }
        } catch (e) {
          row.live = `✗ ${e.message}`;
        }
      }
    }
    rows.push(row);
  }
  if (argv.includes("--json")) return console.log(JSON.stringify(rows, null, 2));
  console.log(`Optional paid providers${live ? " — live check (free requests only)" : ""}\n`);
  for (const r of rows) {
    const mark = r.configured ? "●" : "○";
    console.log(`  ${mark} ${r.id.padEnd(11)} ${r.job.padEnd(36)} ${r.pay.padEnd(16)} ${r.configured ? (r.live ?? "key set") : `needs ${r.missing.join(" + ")}`}`);
  }
  const n = rows.filter((r) => r.configured).length;
  console.log(`\n  ${n} of ${rows.length} configured. None is required — the free pipeline renders without any.`);
  if (!live && n) console.log(`  Check the keys really work (free): node scripts/providers-check.mjs --live`);
  console.log(`  Spend so far this month: node scripts/analytics/spend.mjs`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) await main();
