#!/usr/bin/env node
// render-batch.mjs — render a list of script.json files, one after another; one failure never
// stops the batch, and the end of the run says exactly which videos are done and which are not.
//
//   node scripts/video/render-batch.mjs batch.txt                    # one script.json path per line
//   node scripts/video/render-batch.mjs brain/week-46/                # every */script.json one level down
//   node scripts/video/render-batch.mjs batch.txt --validate-only     # seconds: check all before rendering any
//   node scripts/video/render-batch.mjs batch.txt -- --strict         # anything after -- goes to render.mjs
//
// THE LIST: a text file, one script.json per line, relative to the list's own folder; blank
// lines and lines starting with # are ignored. Or a folder.
//
// IDEMPOTENT: a script whose video.mp4 is newer than the script.json is skipped as done
// (render.mjs itself also reuses voice and clips that did not change). --force re-renders.
// Each render's full output goes to <script dir>/render.log (gitignored); the summary keeps
// the last lines of a failure. The report lands next to the list: <list>.report.json.
// Idea from MoneyPrinterTurbo's batch mode (MIT) — the idea only, no code.
//
// ENV: whatever render.mjs needs (TTS_PROVIDER, …). Needs ffmpeg + Chrome, as render.mjs does.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
/** A path for humans: relative when it is under the working folder, absolute otherwise. */
const show = (p) => { const r = path.relative(process.cwd(), p); return r && !r.startsWith("..") && !path.isAbsolute(r) ? r : p; };

/** The list file's text → absolute script.json paths, in order, without duplicates. */
export function parseList(text, baseDir) {
  const seen = new Set();
  return String(text)
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+#.*$/, "").trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => path.resolve(baseDir, l))
    .filter((p) => (seen.has(p) ? false : (seen.add(p), true)));
}

/** Every <dir>/<child>/script.json one level down, sorted by folder name. */
export function scriptsInDir(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(dir, e.name, "script.json"))
    .filter((p) => fs.existsSync(p))
    .sort();
}

/** Done = a video.mp4 beside the script, written after the script last changed. */
export function isDone(script) {
  const video = path.join(path.dirname(script), "video.mp4");
  if (!fs.existsSync(video)) return false;
  return fs.statSync(video).mtimeMs >= fs.statSync(script).mtimeMs;
}

/** Run one child to completion; its output is teed into `logFile`. → { code, tail, video } */
function runLogged(args, logFile) {
  return new Promise((resolve) => {
    const log = fs.createWriteStream(logFile);
    const p = spawn(process.execPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let tail = "", video = null;
    const take = (d) => {
      const s = String(d);
      log.write(s);
      tail = (tail + s).slice(-4000);
      const m = s.match(/^VIDEO=(.+)$/m);
      if (m) video = m[1].trim();
    };
    p.stdout.on("data", take);
    p.stderr.on("data", take);
    p.on("error", (e) => { log.end(); resolve({ code: 1, tail: e.message, video }); });
    p.on("close", (code) => { log.end(); resolve({ code: code ?? 1, tail, video }); });
  });
}

/** The last few meaningful lines of a failed run — what goes in the summary. */
export function failureLines(tail, n = 4) {
  const lines = String(tail).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const marked = lines.filter((l) => /✗|⚠|^\[\w+\] !|error|failed/i.test(l));
  return (marked.length ? marked : lines).slice(-n);
}

async function main() {
  const all = process.argv.slice(2);
  const dash = all.indexOf("--");
  const argv = dash >= 0 ? all.slice(0, dash) : all;
  const pass = dash >= 0 ? all.slice(dash + 1) : [];
  if (!argv.length || argv.includes("--help")) {
    console.log(
      `render-batch.mjs — render many script.json files; a failure never stops the batch\n` +
        `  <list.txt | folder>   one script.json per line (relative to the list), or a folder of */script.json\n` +
        `  --validate-only       run validate-script.mjs --strict on each, render nothing\n` +
        `  --force               re-render even when video.mp4 is newer than script.json\n` +
        `  --dry-run             print what would run\n` +
        `  -- <flags>            passed to every render.mjs call (e.g. -- --strict)\n` +
        `Writes <list>.report.json; exit code 1 if any item failed.`,
    );
    process.exit(argv.length ? 0 : 1);
  }
  const src = argv.find((a) => !a.startsWith("--"));
  if (!src || !fs.existsSync(src)) {
    console.error(`[render-batch] ✗ list not found: ${src}`);
    process.exit(1);
  }
  const isDir = fs.statSync(src).isDirectory();
  const scripts = isDir ? scriptsInDir(src) : parseList(fs.readFileSync(src, "utf8"), path.dirname(path.resolve(src)));
  if (!scripts.length) {
    console.error(`[render-batch] ✗ no script.json in ${src}`);
    process.exit(1);
  }
  const validateOnly = argv.includes("--validate-only");
  const force = argv.includes("--force");
  const dry = argv.includes("--dry-run");
  const reportFile = isDir ? path.join(src, "render-batch.report.json") : path.resolve(src).replace(/\.[^.\\/]+$/, "") + ".report.json";

  const results = [];
  for (const [i, script] of scripts.entries()) {
    const label = `${String(i + 1).padStart(String(scripts.length).length)}/${scripts.length} ${show(script)}`;
    if (!fs.existsSync(script)) {
      console.log(`[render-batch] ✗ ${label} — file not found`);
      results.push({ script, status: "failed", error: ["file not found"] });
      continue;
    }
    if (!validateOnly && !force && isDone(script)) {
      console.log(`[render-batch] = ${label} — video.mp4 is newer than the script, skipped (--force to redo)`);
      results.push({ script, status: "skipped", video: path.join(path.dirname(script), "video.mp4") });
      continue;
    }
    const args = validateOnly
      ? [path.join(HERE, "validate-script.mjs"), script, "--strict"]
      : [path.join(HERE, "render.mjs"), script, ...pass];
    if (dry) {
      console.log(`[render-batch] · ${label}\n    node ${args.map(show).join(" ")}`);
      continue;
    }
    console.log(`[render-batch] ▶ ${label}`);
    const t0 = Date.now();
    const log = path.join(path.dirname(script), validateOnly ? "validate.log" : "render.log");
    const r = await runLogged(args, log);
    const seconds = Math.round((Date.now() - t0) / 1000);
    if (r.code === 0) {
      console.log(`[render-batch] ✓ ${label} (${seconds}s)${r.video ? ` → ${r.video}` : ""}`);
      results.push({ script, status: validateOnly ? "valid" : "done", seconds, ...(r.video ? { video: r.video } : {}) });
    } else {
      const err = failureLines(r.tail);
      console.log(`[render-batch] ✗ ${label} (${seconds}s) — full output: ${show(log)}`);
      for (const l of err) console.log(`      ${l}`);
      results.push({ script, status: "failed", seconds, error: err, log });
    }
  }
  if (dry) return;

  const count = (s) => results.filter((r) => r.status === s).length;
  const failed = count("failed");
  fs.writeFileSync(reportFile, JSON.stringify({ at: new Date().toISOString(), mode: validateOnly ? "validate" : "render", results }, null, 2) + "\n");
  console.log(
    `[render-batch] ${validateOnly ? `${count("valid")} valid` : `${count("done")} rendered, ${count("skipped")} already done`}, ${failed} failed → ${show(reportFile)}`,
  );
  if (failed) {
    console.log(`[render-batch] failed:`);
    for (const r of results.filter((r) => r.status === "failed")) console.log(`  - ${show(r.script)}: ${r.error.at(-1)}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  await main();
}
