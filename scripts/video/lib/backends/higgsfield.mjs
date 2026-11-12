// higgsfield.mjs — generate scene footage through Higgsfield AI's API.
//
// Higgsfield is where many short-form creators already make cinematic AI shots; its API
// (docs.higgsfield.ai) serves Kling 3.0, Seedance 2.0, Hailuo 2.3 and others from one
// account balance. What makes it pleasant to wire safely: an ESTIMATE endpoint that returns
// the USD price for your own account before anything runs, and failed or moderated requests
// are not charged. So this backend never guesses a rate — it asks, sums, checks the ceiling,
// and only then submits.
//
//     preset       endpoint (after https://api.higgsfield.ai/)        clip length
//     kling-3      kling-video/v3.0/std/text-to-video                 3–15 s, 9:16
//     seedance-2   bytedance/seedance-2.0/text-to-video                4–15 s, 9:16, 720p
//     hailuo-2.3   minimax/hailuo-2.3/standard/text-to-video           6 or 10 s, fixed 768p
//
// Model audio is switched OFF (Kling `sound`, Seedance `generate_audio`): the kit lays its own
// narration and music over the clips, and a model's invented soundtrack would fight it.
// Hailuo 2.3 Standard documents no aspect-ratio field — check its framing before relying on it
// for 9:16.
//
// ── VERIFIED / NOT VERIFIED ─────────────────────────────────────────────────
// Endpoints, body fields, auth header ("Authorization: Key <id>:<secret>"), the queue response
// (`status_url`) and the status values come from docs.higgsfield.ai (read November 2026). The
// request building, duration fitting and ceiling logic are covered by tests. Nothing here has
// been run against a live account from this repo: start with `--estimate` (free, real prices)
// and `--dry-run` (prints every request).
//
// ENV: HIGGSFIELD_KEY_ID, HIGGSFIELD_KEY_SECRET (required — Higgsfield Console → API keys),
//      HIGGSFIELD_MODEL (preset), HIGGSFIELD_MODEL_PATH (any other model's endpoint path).
import fs from "node:fs";
import path from "node:path";
import { renderFinished, clipsOnDisk } from "./finish.mjs";
import { recordSpend, checkMonthly, monthlyCeiling } from "../../../lib/spend.mjs";

export const HF_API = "https://api.higgsfield.ai";

export const HIGGSFIELD_MODELS = {
  "kling-3": {
    path: "kling-video/v3.0/std/text-to-video",
    durations: { min: 3, max: 15 },
    body: (prompt, sec) => ({ prompt, duration: sec, aspect_ratio: "9:16", sound: "off" }),
  },
  "seedance-2": {
    path: "bytedance/seedance-2.0/text-to-video",
    durations: { min: 4, max: 15 },
    body: (prompt, sec) => ({ prompt, duration: sec, aspect_ratio: "9:16", resolution: "720p", generate_audio: false }),
  },
  "hailuo-2.3": {
    path: "minimax/hailuo-2.3/standard/text-to-video",
    durations: [6, 10],
    body: (prompt, sec) => ({ prompt, duration: sec, prompt_optimizer: true }),
  },
};
export const DEFAULT_HIGGSFIELD_MODEL = "kling-3";

/** Fit a spoken length to what the model accepts: a range clamps, a list snaps up. */
export function fitDuration(sec, durations) {
  const s = Math.ceil(sec);
  if (Array.isArray(durations)) {
    const sorted = [...durations].sort((a, b) => a - b);
    return sorted.find((d) => d >= s) ?? sorted[sorted.length - 1];
  }
  return Math.min(durations.max, Math.max(durations.min, s));
}

export function higgsfieldModel(env = process.env) {
  const name = env.HIGGSFIELD_MODEL || DEFAULT_HIGGSFIELD_MODEL;
  const preset = HIGGSFIELD_MODELS[name];
  if (!preset && !env.HIGGSFIELD_MODEL_PATH) {
    throw new Error(`Unknown HIGGSFIELD_MODEL "${name}". Known: ${Object.keys(HIGGSFIELD_MODELS).join(" | ")} — or set HIGGSFIELD_MODEL_PATH to any endpoint path from docs.higgsfield.ai.`);
  }
  const base = preset ?? HIGGSFIELD_MODELS[DEFAULT_HIGGSFIELD_MODEL];
  return { model: preset ? name : "custom", path: env.HIGGSFIELD_MODEL_PATH || base.path, durations: base.durations, body: base.body };
}

/** One request per scene: the clip length it asks for and the body it sends. Pure. */
export function planScenes(script, m = higgsfieldModel()) {
  return (script.scenes ?? []).map((scene) => {
    const words = String(scene.voiceText ?? "").split(/\s+/).filter(Boolean).length;
    const spoken = scene.durationSec ?? words / 2.5;
    const sec = fitDuration(Math.max(spoken, 1), m.durations);
    const prompt = scene.videoPrompt ?? scene.visual ?? scene.inputs?.prompt ?? null;
    return { id: scene.id, spokenSec: Math.round(spoken * 100) / 100, sec, prompt, body: prompt ? m.body(prompt, sec) : null };
  });
}

export function authHeader(env = process.env) {
  const id = env.HIGGSFIELD_KEY_ID;
  const secret = env.HIGGSFIELD_KEY_SECRET;
  if (!id || !secret) {
    throw new Error(`HIGGSFIELD_KEY_ID and HIGGSFIELD_KEY_SECRET are not set. Create a key pair in the Higgsfield Console (console.higgsfield.ai). See .env.example.`);
  }
  return { Authorization: `Key ${id}:${secret}`, "Content-Type": "application/json" };
}

/** The price Higgsfield quotes for one request, in USD — free to ask, authoritative for the account. */
async function quote(m, body, headers) {
  const res = await fetch(`${HF_API}/estimate/${m.path}`, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`Higgsfield estimate ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  const usd = Number(j.usd);
  if (!Number.isFinite(usd)) throw new Error(`Higgsfield estimate returned no usd: ${JSON.stringify(j).slice(0, 200)}`);
  return usd;
}

const TERMINAL_BAD = new Set(["failed", "nsfw", "canceled"]);

async function generateClip({ m, body, headers, outFile, log }) {
  const submit = await fetch(`${HF_API}/${m.path}`, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(120000) });
  if (!submit.ok) throw new Error(`Higgsfield submit ${submit.status}: ${(await submit.text()).slice(0, 300)}`);
  const job = await submit.json();
  const statusUrl = job.status_url ?? `${HF_API}/requests/${job.request_id}/status`;
  // Docs: start at 2 s, grow to a 10 s cap.
  let wait = 2000;
  const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, wait + Math.random() * 500));
    wait = Math.min(wait * 1.5, 10000);
    const st = await fetch(statusUrl, { headers, signal: AbortSignal.timeout(60000) });
    if (st.status === 401 || st.status === 404) throw new Error(`Higgsfield status ${st.status} — stopping (bad key or unknown request)`);
    if (!st.ok) continue; // 5xx: retry with backoff
    const s = await st.json();
    if (s.status === "completed") {
      const url = s.video?.url;
      if (!url) throw new Error(`Higgsfield completed with no video URL: ${JSON.stringify(s).slice(0, 300)}`);
      const bytes = await fetch(url, { signal: AbortSignal.timeout(300000) });
      if (!bytes.ok) throw new Error(`Higgsfield download ${bytes.status}`);
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, Buffer.from(await bytes.arrayBuffer()));
      return outFile;
    }
    if (TERMINAL_BAD.has(s.status)) {
      throw new Error(`Higgsfield request ended as "${s.status}"${s.status === "nsfw" ? " (rejected by moderation — not charged; reword the prompt)" : ""}${s.error ? `: ${s.error}` : ""}`);
    }
    log?.(`${s.status ?? "waiting"}…`);
  }
  throw new Error(`Higgsfield did not finish within 20 minutes — request ${job.request_id}`);
}

export async function render({ script, scriptPath, outputDir, argv = [], settings = {} }) {
  const dryRun = argv.includes("--dry-run");
  const m = higgsfieldModel();
  const plan = planScenes(script, m);
  const missing = plan.filter((p) => !p.prompt).map((p) => p.id);
  if (missing.length) {
    throw new Error(`Scene(s) ${missing.join(", ")} have no videoPrompt. Higgsfield generates footage from a visual description; voiceText is narration.`);
  }

  console.log(`[video] backend: higgsfield — ${m.model} (${m.path})`);
  if (dryRun) {
    for (const p of plan) {
      console.log(`[video]   DRY  POST ${HF_API}/${m.path}   (${p.sec}s for ${p.spokenSec}s spoken)`);
      console.log(`[video]        ${JSON.stringify(p.body)}`);
    }
    console.log(`[video] ✓ dry run — ${plan.length} request(s) shown, nothing sent, $0 billed. Prices: run with --estimate (free, needs the key).`);
    return { dryRun: true, plan };
  }

  // Real prices first, for every scene, before a single generation is submitted.
  const headers = authHeader();
  let total = 0;
  for (const p of plan) {
    p.usd = await quote(m, p.body, headers);
    total += p.usd;
    console.log(`[video]   ${String(p.id).padEnd(10)} ${String(p.sec).padStart(3)}s  $${p.usd.toFixed(3)}  (Higgsfield's quote)`);
  }
  total = Math.round(total * 1000) / 1000;
  console.log(`[video]   ── ${plan.length} scenes → $${total.toFixed(2)}`);

  const ceiling = settings.costCeilingUsd;
  if (ceiling !== null && ceiling !== undefined && total > ceiling) {
    console.error(`[video] ✗ quoted $${total.toFixed(2)} exceeds the ceiling of $${Number(ceiling).toFixed(2)}. Raise costCeilingUsd in your profile, use a cheaper model (HIGGSFIELD_MODEL=hailuo-2.3), or the html backend.`);
    process.exit(1);
  }
  if (argv.includes("--estimate")) {
    console.log(`[video] estimate only — nothing generated, nothing billed.`);
    return { estimated: true, plan, totalUsd: total };
  }
  if (total > 1 && (ceiling === null || ceiling === undefined) && !argv.includes("--yes")) {
    console.error(`[video] ✗ this would bill $${total.toFixed(2)} and no cost ceiling is set.\n[video]   Re-run with --yes, or set costCeilingUsd in your profile.`);
    process.exit(1);
  }

  // The month, not just this render: thirty cheap renders are one large bill.
  const month = checkMonthly(total, { ceiling: monthlyCeiling(settings) });
  if (!month.ok && !dryRun) {
    console.error(`[video] ✗ ${month.reason}`);
    process.exit(1);
  }
  const clipDir = path.join(outputDir, "clips");
  const made = [];
  for (const p of plan) {
    const outFile = path.join(clipDir, `scene-${p.id}.mp4`);
    if (fs.existsSync(outFile)) {
      console.log(`[video]   reuse ${path.basename(outFile)} (delete it to regenerate — it cost money once)`);
      made.push(outFile);
      continue;
    }
    console.log(`[video]   generating scene ${p.id} (${p.sec}s, $${p.usd.toFixed(3)})…`);
    made.push(await generateClip({ m, body: p.body, headers, outFile, log: (x) => console.log(`[video]     ${x}`) }));
    recordSpend({ provider: "higgsfield", kind: "video", units: p.sec, unit: "s", usd: p.usd, note: `${m.path} scene ${p.id}` });
  }
  console.log(`[video] ✓ ${made.length} clip(s) in ${clipDir}. Higgsfield deletes its copy after 7 days — these files are yours.`);
  const finished = renderFinished({ script, scriptPath, outputDir, clips: clipsOnDisk(script, outputDir), argv });
  return { clips: made, finished, plan, totalUsd: total };
}
