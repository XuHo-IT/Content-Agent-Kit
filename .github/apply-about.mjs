// apply-about.mjs — push the About box (description + topics) and repo features to GitHub.
//   node .github/apply-about.mjs            # show what would change
//   node .github/apply-about.mjs --apply    # actually change it
//
// The About box, Discussions and topics are repo SETTINGS, not files, so they cannot be
// version-controlled directly. This keeps the intended values in .github/repo-about.json
// and applies them, so a fresh fork or a reset repo can be brought back in one command.
//
// Needs the GitHub CLI, authenticated with the `repo` scope:  gh auth login
// ENV: none.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(here, "repo-about.json"), "utf8"));
const apply = process.argv.includes("--apply");

/** gh is installed per-user on Windows and is not always on PATH in a fresh shell. */
function ghPath() {
  const candidates = [
    "gh",
    "C:/Program Files/GitHub CLI/gh.exe",
    "C:/Program Files (x86)/GitHub CLI/gh.exe",
  ];
  for (const c of candidates) {
    const r = spawnSync(c, ["--version"], { encoding: "utf8" });
    if (r.status === 0) return c;
  }
  throw new Error("GitHub CLI not found. Install it, then run: gh auth login");
}

const gh = ghPath();

const run = (args, { json = false } = {}) => {
  const r = spawnSync(gh, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`gh ${args[0]} failed: ${(r.stderr || r.stdout || "").trim().slice(0, 300)}`);
  return json ? JSON.parse(r.stdout) : r.stdout.trim();
};

try {
  if (spawnSync(gh, ["auth", "status"], { encoding: "utf8" }).status !== 0) {
    throw new Error("Not logged in. Run: gh auth login   (scopes: repo)");
  }

  const repo = run(["repo", "view", "--json", "nameWithOwner,description,hasDiscussionsEnabled,repositoryTopics"], { json: true });
  const slug = repo.nameWithOwner;
  const current = {
    description: repo.description ?? "",
    discussions: !!repo.hasDiscussionsEnabled,
    topics: (repo.repositoryTopics ?? []).map((t) => t.name ?? t).sort(),
  };
  const wanted = { description: cfg.description, discussions: true, topics: [...cfg.topics].sort() };

  const changes = [];
  if (current.description !== wanted.description) changes.push("description");
  if (current.discussions !== wanted.discussions) changes.push("discussions");
  if (current.topics.join(",") !== wanted.topics.join(",")) changes.push("topics");

  console.log(`[about] ${slug}`);
  console.log(`[about]   description : ${current.description ? current.description.slice(0, 60) + "…" : "(none)"}`);
  console.log(`[about]   discussions : ${current.discussions}`);
  console.log(`[about]   topics      : ${current.topics.length ? current.topics.join(", ") : "(none)"}`);

  if (changes.length === 0) {
    console.log(`[about] ✓ already matches repo-about.json`);
    process.exit(0);
  }

  console.log(`[about] would change: ${changes.join(", ")}`);
  if (!apply) {
    console.log(`[about] dry run — pass --apply to write it`);
    process.exit(0);
  }

  if (changes.includes("description") || changes.includes("discussions")) {
    const args = ["api", "-X", "PATCH", `repos/${slug}`, "-f", `description=${cfg.description}`, "-F", "has_discussions=true"];
    if (cfg.homepage) args.push("-f", `homepage=${cfg.homepage}`);
    run(args);
    console.log(`[about] ✓ description + discussions`);
  }

  if (changes.includes("topics")) {
    // The topics endpoint replaces the whole list, so send the full set.
    const args = ["api", "-X", "PUT", `repos/${slug}/topics`, "-H", "Accept: application/vnd.github+json"];
    for (const t of cfg.topics) args.push("-f", `names[]=${t}`);
    run(args);
    console.log(`[about] ✓ ${cfg.topics.length} topics`);
  }

  console.log(`[about] done — https://github.com/${slug}`);
} catch (e) {
  console.error(`[about] ✗ ${e.message}`);
  process.exit(1);
}
