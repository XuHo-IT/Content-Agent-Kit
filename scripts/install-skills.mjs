// install-skills.mjs — fetch a skill from another project into your agent's skills folder.
//   node scripts/install-skills.mjs --list
//   node scripts/install-skills.mjs seo taste
//   node scripts/install-skills.mjs --all --global
//   node scripts/install-skills.mjs seo --dry-run
//
// Skills are NOT vendored into this repo. Copying them in would mean carrying someone
// else's licence obligations, re-merging by hand every time they ship a fix, and growing
// the repo for files most users never open. The catalogue lives in skills/registry.json
// and this fetches on demand.
//
// Every install writes a NOTICE.md recording the source, commit, licence and date, and
// copies the upstream licence file in beside it — the same discipline video-templates/
// already applies to its vendored templates.
//
// ENV: GITHUB_TOKEN (optional — only to raise the anonymous API rate limit).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.resolve(HERE, "..");
const REGISTRY = path.join(KIT, "skills", "registry.json");

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `install-skills.mjs — fetch a skill from another project\n` +
      `  <id> [<id>…]        install these (see --list)\n` +
      `  --list              show the catalogue and what is already installed\n` +
      `  --all               install everything in the catalogue\n` +
      `  --global            install to ~/.claude/skills/ (default: ./.claude/skills/)\n` +
      `  --dest <dir>        install somewhere else entirely\n` +
      `  --force             overwrite a skill that is already there\n` +
      `  --dry-run           print what would be written, write nothing\n` +
      `env: GITHUB_TOKEN (optional — raises the anonymous API rate limit)`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}

const has = (f) => argv.includes(f);
const flag = (f) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : null);
const dryRun = has("--dry-run");
const force = has("--force");

const destRoot = flag("--dest")
  ? path.resolve(flag("--dest"))
  : has("--global")
    ? path.join(os.homedir(), ".claude", "skills")
    : path.join(process.cwd(), ".claude", "skills");

const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8")).skills;

// ── GitHub contents API ──────────────────────────────────────────────────────
// Deliberately not `git clone` and not a tarball: cloning needs git on PATH and pulls a
// whole repo to copy one folder, and extracting a tarball with no dependencies means
// hand-writing a tar parser. Skills are a handful of markdown files — walking the API and
// fetching each one is smaller, needs nothing installed, and can take a subdirectory.
const gh = async (url) => {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "content-agent-kit" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
    throw new Error(
      `GitHub API rate limit reached (60/hour without a token). Set GITHUB_TOKEN and retry.`,
    );
  }
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${url}`);
  return res.json();
};

const contentsUrl = (repo, p, ref) =>
  `https://api.github.com/repos/${repo}/contents/${p === "." ? "" : p}?ref=${ref}`;

/** Every file under `dir`, recursively, as {relPath, downloadUrl, size}. */
async function listFiles(repo, dir, ref, base = dir, out = []) {
  const entries = await gh(contentsUrl(repo, dir, ref));
  for (const e of Array.isArray(entries) ? entries : [entries]) {
    if (e.type === "dir") await listFiles(repo, e.path, ref, base, out);
    else if (e.type === "file") {
      const rel = base === "." ? e.path : path.relative(base, e.path).split(path.sep).join("/");
      out.push({ rel, url: e.download_url, size: e.size });
    }
  }
  return out;
}

/**
 * Always bytes, never text.
 *
 * `res.text()` decodes as UTF-8, and a skill folder is not all markdown — the SEO skill
 * ships a PNG. Decoding it turned the leading 0x89 into the replacement character and the
 * file from 97 KB to 177 KB, i.e. a broken image written with no error. Writing a Buffer
 * is byte-exact for markdown too, so there is nothing to decide per file type.
 */
const fetchBytes = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`download ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
};

// ── --list ───────────────────────────────────────────────────────────────────
if (has("--list")) {
  console.log(`[skills] catalogue — skills/registry.json`);
  console.log(`[skills] install target: ${destRoot}\n`);
  for (const [id, s] of Object.entries(registry)) {
    const installed = fs.existsSync(path.join(destRoot, s.installAs, "SKILL.md"));
    console.log(`  ${installed ? "✓" : " "} ${id.padEnd(14)} ${s.license.padEnd(5)} ${s.summary}`);
    console.log(`    ${" ".repeat(14)}       ${s.repo}/${s.path === "." ? "" : s.path}`);
    console.log(`    ${" ".repeat(14)}       ${s.why}\n`);
  }
  console.log(`[skills] install: node scripts/install-skills.mjs <id> [--global]`);
  process.exit(0);
}

// ── install ──────────────────────────────────────────────────────────────────
const ids = has("--all") ? Object.keys(registry) : argv.filter((a) => !a.startsWith("--") && registry[a]);
const unknown = argv.filter((a) => !a.startsWith("--") && !registry[a] && a !== flag("--dest"));
if (unknown.length) {
  console.error(`[skills] ✗ unknown skill(s): ${unknown.join(", ")}. Try --list.`);
  process.exit(1);
}
if (!ids.length) {
  console.error(`[skills] ✗ nothing to install. Pass an id, or --all. Try --list.`);
  process.exit(1);
}

let failed = 0;
for (const id of ids) {
  const s = registry[id];
  const dest = path.join(destRoot, s.installAs);
  try {
    if (fs.existsSync(dest) && !force && !dryRun) {
      console.log(`[skills] – ${id}: already at ${dest} (pass --force to replace)`);
      continue;
    }

    // Pin to the commit the files actually came from. "main" moves; a sha does not, so
    // the NOTICE records something that can still be diffed a year from now.
    const branch = await gh(`https://api.github.com/repos/${s.repo}/commits/${s.ref}`);
    const sha = branch.sha;

    const files = await listFiles(s.repo, s.path, sha);
    if (!files.some((f) => f.rel.toLowerCase() === "skill.md")) {
      throw new Error(`no SKILL.md at ${s.repo}/${s.path} — the registry entry is wrong`);
    }

    // A skill with no licence is a skill nobody may legally reuse. Refuse rather than
    // install something the user cannot ship.
    const licenseUrl = `https://raw.githubusercontent.com/${s.repo}/${sha}/${s.licenseFile}`;
    let licenseBytes;
    try {
      licenseBytes = await fetchBytes(licenseUrl);
    } catch {
      throw new Error(`${s.repo} has no ${s.licenseFile} at ${sha.slice(0, 7)} — refusing to install`);
    }

    const total = files.reduce((n, f) => n + (f.size || 0), 0);
    console.log(`[skills] ${id} ← ${s.repo}@${sha.slice(0, 7)} — ${files.length} file(s), ${(total / 1024).toFixed(0)} KB`);

    if (dryRun) {
      for (const f of files) console.log(`[skills]     ${path.join(dest, f.rel)}`);
      console.log(`[skills]     ${path.join(dest, s.licenseFile)}`);
      console.log(`[skills]     ${path.join(dest, "NOTICE.md")}`);
      continue;
    }

    for (const f of files) {
      const out = path.join(dest, f.rel);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, await fetchBytes(f.url));
    }
    fs.writeFileSync(path.join(dest, s.licenseFile), licenseBytes);
    fs.writeFileSync(
      path.join(dest, "NOTICE.md"),
      `# ${s.installAs} — installed by content-agent-kit\n\n` +
        `**Source:** https://github.com/${s.repo}/tree/${sha}/${s.path === "." ? "" : s.path}\n` +
        `**Commit:** \`${sha}\`\n` +
        `**License:** ${s.license} — full text in \`${s.licenseFile}\` beside this file\n` +
        `**Installed:** ${new Date().toISOString().slice(0, 10)}\n\n` +
        `${s.summary}\n\n` +
        `Not written by this project and not modified on the way in. Re-fetch with:\n\n` +
        `    node scripts/install-skills.mjs ${id} --force\n\n` +
        `Delete this folder to uninstall.\n`,
      "utf8",
    );
    console.log(`[skills] ✓ ${id} → ${dest}`);
  } catch (e) {
    console.error(`[skills] ✗ ${id}: ${e.message}`);
    failed++;
  }
}

if (!dryRun && failed < ids.length) {
  console.log(`[skills] restart your agent so it picks up ${destRoot}`);
}
process.exit(failed ? 1 : 0);
