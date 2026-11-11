#!/usr/bin/env node
// beat-grid.mjs — the tempo and beat times of a music track, to cut on.
//
//   node scripts/video/beat-grid.mjs bed.mp3                  # BPM, confidence, first beats
//   node scripts/video/beat-grid.mjs bed.mp3 --out beats.json # every beat + bar starts
//
// What to do with it: put cuts, card entrances and punch-ins ON beats (bars for big changes,
// every beat only for a fast montage), and let talking-head.mjs snap card entrances to the
// grid: `--music bed.mp3 --snap-beats`. Read `confidence` first — below ~0.3 the track has no
// steady pulse and cutting to "its beat" will look random.
//
// No dependencies: ffmpeg decodes, lib/beats.mjs does the rest. For the craft of cutting on
// music (J/L-cuts, speed ramps, when NOT to cut on the beat): the `beat-sync-editing` skill
// in skills/registry.json (iart.ai, MIT). ENV: none. Needs ffmpeg.
import fs from "node:fs";
import { spawn } from "node:child_process";
import { HOP, onsetEnvelope, estimateTempo, beatTimes } from "./lib/beats.mjs";

const SR = 22050;

/** Decode any audio/video file to mono float32 at 22.05 kHz. */
export function decodeMono(file, { from = 0, seconds = null } = {}) {
  return new Promise((resolve, reject) => {
    const args = ["-hide_banner", "-v", "error", ...(from ? ["-ss", String(from)] : []), "-i", file,
      ...(seconds ? ["-t", String(seconds)] : []), "-vn", "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"];
    const p = spawn("ffmpeg", args);
    const chunks = [];
    let err = "";
    p.stdout.on("data", (d) => chunks.push(d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (c) => {
      if (c !== 0) return reject(new Error(err.slice(-300) || `ffmpeg exited ${c}`));
      const b = Buffer.concat(chunks);
      resolve(new Float32Array(b.buffer, b.byteOffset, Math.floor(b.length / 4)));
    });
  });
}

/** → { bpm, confidence, beats: [s], bars: [s] } for a file. */
export async function beatGrid(file, { beatsPerBar = 4 } = {}) {
  const pcm = await decodeMono(file);
  const fps = SR / HOP;
  const env = onsetEnvelope(pcm);
  const { bpm: coarse, confidence } = estimateTempo(env, fps);
  const { beats, bpm } = beatTimes(env, fps, coarse, { duration: pcm.length / SR });
  return { bpm, confidence: +confidence.toFixed(2), duration: +(pcm.length / SR).toFixed(2), beats, bars: beats.filter((_, i) => i % beatsPerBar === 0) };
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes("--help")) {
    console.log(
      `beat-grid.mjs — tempo + beat times of a music track\n` +
        `  <audio>          any file ffmpeg reads\n` +
        `  --bar <n>        beats per bar (default 4)\n` +
        `  --out <file>     write {bpm, confidence, beats, bars} as JSON`,
    );
    process.exit(argv.length ? 0 : 1);
  }
  const VALUE = new Set(["--bar", "--out"]);
  const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  const input = argv.find((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
  if (!input || !fs.existsSync(input)) {
    console.error(`[beats] ✗ input not found: ${input}`);
    process.exit(1);
  }
  try {
    const g = await beatGrid(input, { beatsPerBar: Number(flag("--bar", "4")) });
    console.log(`[beats] ${g.bpm} BPM · confidence ${g.confidence}${g.confidence < 0.3 ? " — no steady pulse: do not cut to this track's beat" : ""} · ${g.beats.length} beats in ${g.duration}s`);
    console.log(`[beats] first beats: ${g.beats.slice(0, 8).join(", ")} …  bars: ${g.bars.slice(0, 4).join(", ")} …`);
    if (flag("--out")) {
      fs.writeFileSync(flag("--out"), JSON.stringify(g, null, 2) + "\n");
      console.log(`[beats] ✓ ${flag("--out")}`);
    }
  } catch (e) {
    console.error(`[beats] ✗ ${e.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  await main();
}
