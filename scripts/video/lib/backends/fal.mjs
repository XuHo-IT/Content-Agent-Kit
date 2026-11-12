// fal.mjs — generate scene footage through fal.ai: one key, many video models.
//
// The `api` backend reaches Google's Veo only. fal.ai hosts most of the video models creators
// actually compare — Kling, MiniMax Hailuo, ByteDance Seedance, Wan, Luma — behind ONE queue
// API and ONE bill, usually cheaper per second than Veo. For a Vietnamese creator that is one
// international card instead of four sign-ups; for anyone it is a way to A/B two models on the
// same scene by changing one variable.
//
//     preset             model id on fal                                         rate (USD/s)
//     kling-v3           fal-ai/kling-video/v3/standard/text-to-video                ~0.14
//     kling-2.5-turbo    fal-ai/kling-video/v2.5-turbo/pro/text-to-video             ~0.07
//     hailuo-02          fal-ai/minimax/hailuo-02/standard/text-to-video             ~0.045
//
// Rates are STARTING ASSUMPTIONS read from fal's model pages in November 2026 — fal changes
// prices and adds versions often. `--estimate` prints the rate it used; override with
// FAL_RATE_PER_SEC, and point at any other fal video model with FAL_MODEL_ID (+ its rate).
//
// ── VERIFIED / NOT VERIFIED ─────────────────────────────────────────────────
// Estimate, duration snapping, ceiling and dry-run are covered by tests and need no key. The
// wire format (queue submit → status_url → response_url, `Authorization: Key …`) follows fal's
// published queue docs and has NOT been run against a live account from this repo. Run with
// `--dry-run` first; it prints every request it would send. Same honesty as api.mjs.
//
// ENV: FAL_KEY (required), FAL_MODEL (preset), FAL_MODEL_ID, FAL_RATE_PER_SEC,
//      VIDEO_COST_CEILING_USD (via the profile).
import fs from "node:fs";
import path from "node:path";
import { checkCeiling } from "./api.mjs";
import { renderFinished, clipsOnDisk } from "./finish.mjs";
import { recordSpend, checkMonthly, monthlyCeiling } from "../../../lib/spend.mjs";

const QUEUE = "https://queue.fal.run";

/**
 * Presets: the model id, the clip lengths the model accepts (a request for 7 s is refused, so
 * every scene is snapped UP to the next allowed length — and billed for it), the rate, and how
 * that model spells its parameters.
 */
export const FAL_MODELS = {
  "kling-v3": {
    id: "fal-ai/kling-video/v3/standard/text-to-video",
    durations: [5, 10],
    ratePerSec: 0.14,
    body: (prompt, sec) => ({ prompt, duration: String(sec), aspect_ratio: "9:16" }),
  },
  "kling-2.5-turbo": {
    id: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
    durations: [5, 10],
    ratePerSec: 0.07,
    body: (prompt, sec) => ({ prompt, duration: String(sec), aspect_ratio: "9:16" }),
  },
  "hailuo-02": {
    id: "fal-ai/minimax/hailuo-02/standard/text-to-video",
    durations: [6, 10],
    ratePerSec: 0.045,
    body: (prompt, sec) => ({ prompt, duration: String(sec), prompt_optimizer: true }),
  },
};
export const DEFAULT_FAL_MODEL = "hailuo-02";

const round2 = (n) => Math.round(n * 100) / 100;

/** Smallest allowed clip length that covers `sec`; the longest one when nothing does. */
export function snapDuration(sec, durations) {
  const sorted = [...durations].sort((a, b) => a - b);
  return sorted.find((d) => d >= sec) ?? sorted[sorted.length - 1];
}

/** Resolve the preset plus env overrides into {model, id, ratePerSec, durations, body}. */
export function falModel(env = process.env) {
  const name = env.FAL_MODEL || DEFAULT_FAL_MODEL;
  const preset = FAL_MODELS[name];
  if (!preset && !env.FAL_MODEL_ID) {
    throw new Error(`Unknown FAL_MODEL "${name}". Known: ${Object.keys(FAL_MODELS).join(" | ")} — or set FAL_MODEL_ID + FAL_RATE_PER_SEC for any other fal video model.`);
  }
  const base = preset ?? FAL_MODELS[DEFAULT_FAL_MODEL];
  const rate = env.FAL_RATE_PER_SEC !== undefined && env.FAL_RATE_PER_SEC !== "" ? Number(env.FAL_RATE_PER_SEC) : base.ratePerSec;
  if (!(rate >= 0)) throw new Error(`FAL_RATE_PER_SEC must be a number, got "${env.FAL_RATE_PER_SEC}"`);
  if (env.FAL_MODEL_ID && !preset && env.FAL_RATE_PER_SEC === undefined) {
    throw new Error(`FAL_MODEL_ID without FAL_RATE_PER_SEC: the estimate would be a guess. Read the rate off the model's page on fal.ai and set it.`);
  }
  return { model: preset ? name : "custom", id: env.FAL_MODEL_ID || base.id, ratePerSec: rate, durations: base.durations, body: base.body };
}

/** What a render would cost. Pure — no network, no key. */
export function estimateFal(script, m = falModel()) {
  const scenes = (script.scenes ?? []).map((scene) => {
    const words = String(scene.voiceText ?? "").split(/\s+/).filter(Boolean).length;
    const spoken = scene.durationSec ?? words / 2.5;
    const billedSec = snapDuration(Math.ceil(spoken), m.durations);
    return { id: scene.id, words, spokenSec: round2(spoken), billedSec, usd: round2(billedSec * m.ratePerSec) };
  });
  const totalSec = scenes.reduce((n, s) => n + s.billedSec, 0);
  return { model: m.model, id: m.id, ratePerSec: m.ratePerSec, scenes, totalSec, totalUsd: round2(totalSec * m.ratePerSec) };
}

function falKey() {
  const k = process.env.FAL_KEY;
  if (!k) throw new Error(`FAL_KEY is not set. The fal backend calls fal.ai's hosted models; create a key at fal.ai/dashboard/keys. See .env.example.`);
  return k;
}

/** Submit to fal's queue, poll the status URL, download the video the result points at. */
async function generateClip({ id, body, outFile, log }) {
  const headers = { Authorization: `Key ${falKey()}`, "Content-Type": "application/json" };
  const submit = await fetch(`${QUEUE}/${id}`, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(120000) });
  if (!submit.ok) throw new Error(`fal submit ${submit.status}: ${(await submit.text()).slice(0, 300)}`);
  const job = await submit.json();
  const statusUrl = job.status_url ?? `${QUEUE}/${id}/requests/${job.request_id}/status`;
  const responseUrl = job.response_url ?? `${QUEUE}/${id}/requests/${job.request_id}`;

  const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 8000));
    const st = await fetch(statusUrl, { headers, signal: AbortSignal.timeout(60000) });
    if (!st.ok) throw new Error(`fal status ${st.status}: ${(await st.text()).slice(0, 200)}`);
    const s = await st.json();
    if (s.status === "COMPLETED") {
      const res = await fetch(responseUrl, { headers, signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`fal result ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const out = await res.json();
      const url = out.video?.url ?? out.videos?.[0]?.url;
      if (!url) throw new Error(`fal finished with no video URL: ${JSON.stringify(out).slice(0, 300)}`);
      const bytes = await fetch(url, { signal: AbortSignal.timeout(300000) });
      if (!bytes.ok) throw new Error(`fal download ${bytes.status}`);
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, Buffer.from(await bytes.arrayBuffer()));
      return outFile;
    }
    if (s.status && !["IN_QUEUE", "IN_PROGRESS"].includes(s.status)) throw new Error(`fal job ended as ${s.status}: ${JSON.stringify(s).slice(0, 200)}`);
    log?.(`${s.status === "IN_QUEUE" ? "queued" : "generating"}…`);
  }
  throw new Error(`fal did not finish within 20 minutes — request ${job.request_id}`);
}

/** Entry point render.mjs calls. Prints the bill, checks the ceiling, then generates. */
export async function render({ script, scriptPath, outputDir, argv = [], settings = {} }) {
  const dryRun = argv.includes("--dry-run");
  const m = falModel();
  const est = estimateFal(script, m);

  console.log(`[video] backend: fal — ${est.model} (${est.id}), $${est.ratePerSec}/s`);
  for (const s of est.scenes) {
    console.log(`[video]   ${String(s.id).padEnd(10)} ${String(s.billedSec).padStart(3)}s billed  $${s.usd.toFixed(2)}` +
      (s.billedSec > Math.ceil(s.spokenSec) ? `   (${s.spokenSec}s spoken — the model only makes ${m.durations.join("/")} s clips)` : ""));
  }
  console.log(`[video]   ── ${est.scenes.length} scenes, ${est.totalSec}s → $${est.totalUsd.toFixed(2)}`);

  const gate = checkCeiling(est.totalUsd, settings.costCeilingUsd);
  if (!gate.ok) {
    console.error(`[video] ✗ ${gate.reason.replace("VIDEO_API_MODEL=veo-3.1-lite", "FAL_MODEL=hailuo-02")}`);
    process.exit(1);
  }
  if (argv.includes("--estimate")) {
    console.log(`[video] estimate only — nothing generated, nothing billed. Check the rate on the model's page at fal.ai.`);
    return { estimated: true, ...est };
  }
  if (est.totalUsd > 1 && settings.costCeilingUsd === null && !argv.includes("--yes") && !dryRun) {
    console.error(`[video] ✗ this would bill $${est.totalUsd.toFixed(2)} and no cost ceiling is set.\n` +
      `[video]   Re-run with --yes, or set costCeilingUsd in your profile so the limit is written down.`);
    process.exit(1);
  }

  // The month, not just this render: thirty cheap renders are one large bill.
  const month = checkMonthly(est.totalUsd, { ceiling: monthlyCeiling(settings) });
  if (!month.ok && !dryRun) {
    console.error(`[video] ✗ ${month.reason}`);
    process.exit(1);
  }
  const clipDir = path.join(outputDir, "clips");
  const made = [];
  for (const scene of script.scenes ?? []) {
    const outFile = path.join(clipDir, `scene-${scene.id}.mp4`);
    const billed = est.scenes.find((s) => s.id === scene.id);
    // The visual prompt, never the narration — see api.mjs for why.
    const prompt = scene.videoPrompt ?? scene.visual ?? scene.inputs?.prompt;
    if (!prompt) throw new Error(`Scene "${scene.id}" has no videoPrompt. The fal backend generates footage from a visual description; voiceText is narration.`);
    const body = m.body(prompt, billed.billedSec);
    if (dryRun) {
      console.log(`[video]   DRY  POST ${QUEUE}/${m.id}`);
      console.log(`[video]        ${JSON.stringify(body)}`);
      console.log(`[video]        → ${outFile}`);
      continue;
    }
    if (fs.existsSync(outFile)) {
      console.log(`[video]   reuse ${path.basename(outFile)} (delete it to regenerate — it cost money once)`);
      made.push(outFile);
      continue;
    }
    console.log(`[video]   generating scene ${scene.id} (${billed.billedSec}s, $${billed.usd.toFixed(2)})…`);
    made.push(await generateClip({ id: m.id, body, outFile, log: (x) => console.log(`[video]     ${x}`) }));
    recordSpend({ provider: "fal", kind: "video", units: billed.billedSec, unit: "s", usd: billed.usd, note: `${m.id} scene ${scene.id}` });
  }
  if (dryRun) {
    console.log(`[video] ✓ dry run — ${est.scenes.length} request(s) shown, nothing sent, $0 billed.`);
    return { dryRun: true, ...est };
  }
  console.log(`[video] ✓ ${made.length} clip(s) in ${clipDir} — kept and reused, each one was paid for.`);
  const finished = renderFinished({ script, scriptPath, outputDir, clips: clipsOnDisk(script, outputDir), argv });
  return { clips: made, finished, ...est };
}
