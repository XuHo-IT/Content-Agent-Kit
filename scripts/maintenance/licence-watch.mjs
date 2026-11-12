#!/usr/bin/env node
// licence-watch.mjs — has any skill in skills/registry.json changed or lost its licence?
//
//   node scripts/maintenance/licence-watch.mjs           # report; exit 1 on drift, 2 if unreachable
//   node scripts/maintenance/licence-watch.mjs --json
//
// WHY. In 2026-11 four registry entries still said "MIT" while their upstreams had moved — one
// to CC BY-NC (non-commercial: exactly the creators who monetise), one to MIT + Commons Clause
// with a renamed licence file that made the install fail. Nobody noticed, because nothing
// looked. This looks: per entry, GitHub's licence detection, the licence file at the ref, and
// whether the repo still exists or was archived. The monthly workflow runs it.
// ENV: GITHUB_TOKEN (optional — raises the 60/hour anonymous limit).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { optionalEnv } from "../lib/env.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * One entry vs what GitHub says. `gh` = { status, spdx, archived } of the repo (spdx from
 * GitHub's detector: "NOASSERTION" when it cannot tell); `fileOk` = licence file present.
 * → [] or the problems.
 */
export function licenceDrift(entry, gh, fileOk, fileSha = null) {
  const p = [];
  if (gh.status === 404) return ["repo is gone (404)"];
  if (gh.archived) p.push("repo is archived — no more fixes upstream");
  if (entry.unlicensed) {
    if (gh.spdx && gh.spdx !== "NOASSERTION") p.push(`now has a licence (${gh.spdx}) — drop "unlicensed" and record it`);
    return p;
  }
  if (!fileOk) p.push(`${entry.licenseFile} is missing at ${entry.ref} — install will fail`);
  // a licence someone READ and pinned: any edit to the file is the signal, whatever GitHub detects
  if (entry.licenseSha) {
    if (fileOk && fileSha && fileSha !== entry.licenseSha) p.push(`${entry.licenseFile} changed since it was read (sha ${entry.licenseSha.slice(0, 7)} → ${fileSha.slice(0, 7)}) — read it again`);
    return p;
  }
  const known = gh.spdx && gh.spdx !== "NOASSERTION" && gh.spdx !== "NONE";
  const plain = !/[+]|LicenseRef|Commons/i.test(entry.license);
  // a registry licence that is plain SPDX must match what GitHub detects
  if (known && plain && gh.spdx.toUpperCase() !== entry.license.toUpperCase()) p.push(`GitHub detects ${gh.spdx}, registry says ${entry.license}`);
  // GitHub could not classify a file the registry calls plain MIT/Apache — read it; this is how the NC switch hid
  if (gh.spdx === "NOASSERTION") p.push(`GitHub cannot classify ${entry.licenseFile} (registry says ${entry.license}) — read it, then --pin ${entry.installAs ?? ""}`.trim());
  return p;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help")) {
    console.log(`licence-watch.mjs — check every skills/registry.json entry's licence upstream\n  --json   machine-readable\n  --pin <id…>  after READING a licence GitHub cannot classify: record its sha; any later edit is flagged\nexit 0 clean · 1 drift · 2 unreachable. env: GITHUB_TOKEN (optional)`);
    process.exit(0);
  }
  const reg = JSON.parse(fs.readFileSync(path.join(KIT, "skills", "registry.json"), "utf8")).skills;
  const token = optionalEnv("GITHUB_TOKEN");
  const headers = { "User-Agent": "content-agent-kit-licence-watch", Accept: "application/vnd.github+json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const repoCache = new Map();
  const report = [];
  let unreachable = 0;
  for (const [id, e] of Object.entries(reg)) {
    try {
      if (!repoCache.has(e.repo)) {
        const r = await fetch(`https://api.github.com/repos/${e.repo}`, { headers });
        if (r.status === 403 || r.status === 429) throw new Error(`rate limited (${r.status}) — set GITHUB_TOKEN`);
        const j = r.status === 404 ? {} : await r.json();
        repoCache.set(e.repo, { status: r.status, spdx: j.license?.spdx_id ?? null, archived: Boolean(j.archived) });
      }
      const gh = repoCache.get(e.repo);
      let fileOk = true, fileSha = null;
      if (!e.unlicensed && gh.status !== 404) {
        const f = await fetch(`https://api.github.com/repos/${e.repo}/contents/${e.licenseFile}?ref=${e.ref}`, { headers });
        fileOk = f.ok;
        if (f.ok) fileSha = (await f.json()).sha ?? null;
      }
      const problems = licenceDrift(e, gh, fileOk, fileSha);
      report.push({ id, repo: e.repo, license: e.license, detected: gh.spdx, fileSha, problems });
    } catch (err) {
      unreachable++;
      report.push({ id, repo: e.repo, license: e.license, error: err.message });
    }
  }
  const pin = argv.includes("--pin") ? argv.slice(argv.indexOf("--pin") + 1).filter((a) => !a.startsWith("--")) : [];
  if (pin.length) {
    const file = path.join(KIT, "skills", "registry.json");
    const all = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const id of pin) {
      const r = report.find((x) => x.id === id);
      if (!r?.fileSha) { console.error(`[licence] ✗ cannot pin ${id}: no licence file sha`); process.exitCode = 1; continue; }
      all.skills[id].licenseSha = r.fileSha;
      r.problems = licenceDrift(all.skills[id], repoCache.get(r.repo), true, r.fileSha);
      console.log(`[licence] ✓ pinned ${id} at ${r.fileSha.slice(0, 7)} — you read it and the registry's "${all.skills[id].license}" is right`);
    }
    fs.writeFileSync(file, JSON.stringify(all, null, 2) + "\n");
  }
  const drift = report.filter((r) => r.problems?.length);
  if (argv.includes("--json")) console.log(JSON.stringify({ drift, unreachable, checked: report.length }, null, 2));
  else {
    for (const r of drift) console.log(`[licence] ✗ ${r.id} (${r.repo}): ${r.problems.join("; ")}`);
    for (const r of report.filter((x) => x.error)) console.log(`[licence] ? ${r.id}: ${r.error}`);
    console.log(`[licence] ${report.length} entries · ${drift.length} drifted · ${unreachable} unreachable`);
  }
  process.exitCode = unreachable && !drift.length ? 2 : drift.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  await main();
}
