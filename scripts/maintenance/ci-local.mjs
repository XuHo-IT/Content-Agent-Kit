#!/usr/bin/env node
// ci-local.mjs — run the CI workflow's own steps on this machine, before pushing.
//
//   node scripts/maintenance/ci-local.mjs            # every step of jobs check + crawler
//   node scripts/maintenance/ci-local.mjs --list     # what would run
//   node scripts/maintenance/ci-local.mjs --only "strict"   # steps whose name matches
//
// WHY. CI went red on every push from 7 Nov 2026 — and on Dependabot's PRs — because of one
// step (`Reference script.json is clean in strict mode`) that `node --test` never runs. Local
// test runs were green, so nobody saw it. A hand-written copy of the CI steps would drift the
// same way, so this file does not copy them: it READS .github/workflows/ci.yml and executes
// each `run:` block with bash, exactly as the runner does. Add a step to CI and it runs here.
//
// Install as a pre-push hook once per clone (the hook just calls this file):
//   git config core.hooksPath .githooks
//
// Needs bash (Git Bash on Windows). Steps whose `if:` mentions github.event are skipped —
// they are about who opened a pull request, not about the code.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log(
    `ci-local.mjs — run .github/workflows/ci.yml's steps locally\n` +
      `  --list            print the steps, run nothing\n` +
      `  --only <text>     only steps whose name contains <text>\n` +
      `  --keep-going      run every step even after a failure\n` +
      `env: none. Needs bash (Git Bash on Windows) and the tools CI uses (node, python, git).`,
  );
  process.exit(0);
}

/**
 * Minimal reader for this repo's workflow style (no YAML dependency — the kit has none):
 * jobs at 2 spaces, `- name:` / `- uses:` at 6, `run:` at 8, literal blocks (`run: |`) indented
 * deeper. Returns [{job, name, run, skip}].
 */
export function parseSteps(yml) {
  const lines = String(yml).split(/\r?\n/);
  const steps = [];
  let job = null;
  let jobIf = "";
  let cur = null;
  let inJobs = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^jobs:\s*$/.test(l)) { inJobs = true; continue; }
    if (!inJobs) continue;
    const j = l.match(/^  ([\w-]+):\s*$/);
    if (j) { job = j[1]; jobIf = ""; cur = null; continue; }
    const ji = l.match(/^    if:\s*(.+)$/);
    if (ji) { jobIf = ji[1]; continue; }
    const s = l.match(/^      - (name|uses):\s*(.+)$/);
    if (s) {
      cur = { job, name: s[1] === "name" ? s[2].trim() : `uses ${s[2].trim()}`, run: null, skip: /github\.event/.test(jobIf) };
      steps.push(cur);
      continue;
    }
    const si = l.match(/^        if:\s*(.+)$/);
    if (si && cur && /github\.event/.test(si[1])) { cur.skip = true; continue; }
    const r = l.match(/^        run:\s*(.*)$/);
    if (r && cur) {
      if (r[1].trim() === "|") {
        const body = [];
        while (i + 1 < lines.length && (/^\s*$/.test(lines[i + 1]) || /^ {10,}/.test(lines[i + 1]))) {
          body.push(lines[++i].replace(/^ {10}/, ""));
        }
        cur.run = body.join("\n").replace(/\s+$/, "") + "\n";
      } else {
        cur.run = r[1];
      }
    }
  }
  return steps.filter((s) => s.run);
}

function findBash() {
  const candidates = process.platform === "win32"
    ? ["C:/Program Files/Git/bin/bash.exe", "C:/Program Files/Git/usr/bin/bash.exe", "bash"]
    : ["bash"];
  for (const c of candidates) {
    const r = spawnSync(c, ["-c", "echo ok"], { encoding: "utf8" });
    if (r.status === 0) return c;
  }
  return null;
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  const steps = parseSteps(fs.readFileSync(path.join(KIT, ".github/workflows/ci.yml"), "utf8"));
  const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1].toLowerCase() : null;
  const todo = steps.filter((s) => !s.skip && (!only || s.name.toLowerCase().includes(only)));

  if (argv.includes("--list")) {
    for (const s of steps) console.log(`${s.skip ? "skip" : "run "}  [${s.job}] ${s.name}`);
    process.exit(0);
  }
  const bash = findBash();
  if (!bash) {
    console.error("[ci-local] ✗ bash not found — install Git for Windows, or run on Linux/macOS");
    process.exit(1);
  }

  const failed = [];
  for (const s of todo) {
    const t0 = Date.now();
    // python is "python3" on most Linux runners and "python" on Windows; the step says python.
    const r = spawnSync(bash, ["-c", `set -e\n${s.run}`], { cwd: KIT, encoding: "utf8", env: { ...process.env, CI: "true" } });
    const ok = r.status === 0;
    console.log(`${ok ? "✓" : "✗"} [${s.job}] ${s.name}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    if (!ok) {
      failed.push(s.name);
      console.log(String((r.stdout || "") + (r.stderr || "")).trim().split("\n").slice(-25).map((x) => `    ${x}`).join("\n"));
      if (!argv.includes("--keep-going")) break;
    }
  }
  console.log(failed.length ? `[ci-local] ✗ ${failed.length} step(s) failed — CI would go red` : `[ci-local] ✓ ${todo.length} step(s) passed — matches CI`);
  process.exit(failed.length ? 1 : 0);
}
