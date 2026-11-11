#!/usr/bin/env node
// delivery-check.mjs — will this file upload, and look and sound right, where it is going?
//
//   node scripts/video/delivery-check.mjs video.mp4                                 # all platforms
//   node scripts/video/delivery-check.mjs video.mp4 --platform tiktok,shopee-product
//   node scripts/video/delivery-check.mjs video.mp4 --platform shopee-product --fix video.shopee.mp4
//
// Reads the real file (ffprobe + one loudness pass) and checks it against each platform's
// limits in lib/delivery-specs.mjs — every number there has a source and a check date.
// Errors = the upload will fail (an official limit). Warnings = sources disagree, or advice.
// --fix writes a copy that meets the tightest HARD limits of the platforms named: scaled down
// to the max resolution, re-encoded H.264/AAC at a bitrate that fits the size cap, loudness
// to -14 LUFS, faststart. It never trims — a video over the length limit needs an edit, not
// an encode, and the check says so.
//
// Run it last, on the exact file you upload (make-post.mjs, scheduler). ENV: none. Needs ffmpeg.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { run } from "./lib/proc.mjs";
import { PLATFORMS, SPECS_CHECKED, LOUDNESS, checkDelivery, tightest, fitBitrate } from "./lib/delivery-specs.mjs";

const stderrOf = (args) =>
  new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", args);
    let e = "";
    p.stderr.on("data", (d) => (e += d));
    p.on("close", (c) => (c === 0 ? resolve(e) : reject(new Error(e.slice(-400)))));
    p.on("error", reject);
  });

/** The facts checkDelivery needs, from the file itself. */
export async function probeFile(file) {
  const j = JSON.parse(await run("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file]));
  const v = j.streams.find((s) => s.codec_type === "video");
  const a = j.streams.find((s) => s.codec_type === "audio");
  if (!v) throw new Error("no video stream");
  const [n, d] = String(v.avg_frame_rate || v.r_frame_rate || "0/1").split("/").map(Number);
  // rotation metadata turns a 1920×1080 phone recording into the 1080×1920 the viewer sees
  const rot = Math.abs(Number(v.tags?.rotate ?? v.side_data_list?.find((x) => x.rotation !== undefined)?.rotation ?? 0)) % 180 === 90;
  const ext = path.extname(file).slice(1).toLowerCase();
  const out = {
    width: rot ? v.height : v.width, height: rot ? v.width : v.height,
    duration: Number(j.format.duration), bytes: Number(j.format.size) || fs.statSync(file).size,
    fps: d ? n / d : null, vcodec: v.codec_name, acodec: a?.codec_name ?? null,
    container: ext === "m4v" ? "mp4" : ext, bitrate: Number(j.format.bit_rate) || null,
  };
  if (a) {
    const log = await stderrOf(["-hide_banner", "-nostats", "-i", file, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-"]);
    const I = log.match(/I:\s+(-?[\d.]+) LUFS/g)?.at(-1)?.match(/-?[\d.]+/)?.[0];
    const P = log.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.at(-1)?.match(/-?[\d.]+/)?.[0];
    if (I !== undefined) out.lufs = Number(I);
    if (P !== undefined) out.truePeak = Number(P);
  }
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes("--help")) {
    console.log(
      `delivery-check.mjs — check a video file against each platform's upload limits\n` +
        `  <video>              the exact file you will upload\n` +
        `  --platform <a,b>     ${Object.keys(PLATFORMS).join(", ")} (default: all)\n` +
        `  --fix <out.mp4>      write a copy that meets the tightest hard limits of those platforms\n` +
        `  --json               print the result as JSON\n` +
        `Limits checked ${SPECS_CHECKED}; sources in scripts/video/lib/delivery-specs.mjs. Exit 1 on any error.`,
    );
    process.exit(argv.length ? 0 : 1);
  }
  const VALUE = new Set(["--platform", "--fix"]);
  const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  const input = argv.find((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
  if (!input || !fs.existsSync(input)) {
    console.error(`[delivery] ✗ input not found: ${input}`);
    process.exit(1);
  }
  const ids = (flag("--platform") ?? Object.keys(PLATFORMS).join(",")).split(",").map((s) => s.trim()).filter(Boolean);
  const bad = ids.filter((i) => !PLATFORMS[i]);
  if (bad.length) {
    console.error(`[delivery] ✗ unknown platform(s): ${bad.join(", ")} — one of ${Object.keys(PLATFORMS).join(", ")}`);
    process.exit(1);
  }
  try {
    const probe = await probeFile(input);
    const results = Object.fromEntries(ids.map((id) => [id, checkDelivery(probe, id)]));
    if (argv.includes("--json")) console.log(JSON.stringify({ file: input, probe, results, checked: SPECS_CHECKED }, null, 2));
    else {
      console.log(`[delivery] ${path.basename(input)} · ${probe.width}×${probe.height} · ${probe.duration.toFixed(1)} s · ${(probe.bytes / 1024 ** 2).toFixed(1)} MB · ` +
        `${probe.vcodec}/${probe.acodec ?? "no audio"} · ${probe.fps?.toFixed(2) ?? "?"} fps` +
        (Number.isFinite(probe.lufs) ? ` · ${probe.lufs.toFixed(1)} LUFS, peak ${probe.truePeak?.toFixed(1)} dBTP` : ""));
      for (const id of ids) {
        const r = results[id];
        const mark = r.errors.length ? "✗" : r.warnings.length ? "!" : "✓";
        console.log(`  ${mark} ${PLATFORMS[id].label}`);
        for (const e of r.errors) console.log(`      ✗ ${e}`);
        for (const w of r.warnings) console.log(`      ! ${w}`);
        if ((r.errors.length || r.warnings.length) && PLATFORMS[id].note) console.log(`      · ${PLATFORMS[id].note}`);
      }
      console.log(`[delivery] limits checked ${SPECS_CHECKED} — platforms change them; sources in lib/delivery-specs.mjs`);
    }
    const failing = ids.filter((id) => results[id].errors.length);

    if (flag("--fix")) {
      const t = tightest(ids);
      if (probe.duration > t.maxDur + 0.05) throw new Error(`--fix does not trim: ${probe.duration.toFixed(1)} s is over the ${t.maxDur} s limit — cut the video first`);
      const vk = fitBitrate(probe.duration, t.maxBytes);
      if (vk === null) throw new Error(`no bitrate fits ${(t.maxBytes / 1024 ** 2).toFixed(0)} MB in ${probe.duration.toFixed(0)} s — shorten it`);
      const long = Math.max(probe.width, probe.height);
      const k = Number.isFinite(t.maxLong) && long > t.maxLong ? t.maxLong / long : 1;
      const w = Math.round((probe.width * k) / 2) * 2, h = Math.round((probe.height * k) / 2) * 2;
      const out = flag("--fix");
      console.log(`[delivery] fixing → ${out}: ${w}×${h}, H.264 ${vk} kbit/s, AAC 128k, ${LOUDNESS.target} LUFS`);
      await run("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-i", input,
        "-vf", `scale=${w}:${h}:flags=lanczos,format=yuv420p`, "-r", String(Math.min(60, Math.round(probe.fps || 30))),
        "-c:v", "libx264", "-preset", "medium", "-b:v", `${vk}k`, "-maxrate", `${Math.round(vk * 1.2)}k`, "-bufsize", `${vk * 2}k`,
        ...(probe.acodec ? ["-af", `loudnorm=I=${LOUDNESS.target}:TP=${LOUDNESS.truePeak - 0.5}:LRA=11`, "-c:a", "aac", "-b:a", "128k", "-ar", "48000"] : ["-an"]),
        "-movflags", "+faststart", out], { trimErr: 800 });
      const again = await probeFile(out);
      const still = ids.filter((id) => checkDelivery(again, id).errors.length);
      console.log(`[delivery] ${still.length ? `✗ still failing: ${still.join(", ")}` : "✓ fixed copy passes every hard limit"} (${(again.bytes / 1024 ** 2).toFixed(1)} MB)`);
      if (still.length) process.exitCode = 1;
    } else if (failing.length) process.exitCode = 1;
  } catch (e) {
    console.error(`[delivery] ✗ ${e.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  await main();
}
