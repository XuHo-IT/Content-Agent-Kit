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

  const repo = run(
    ["repo", "view", "--json", "nameWithOwner,description,homepageUrl,hasDiscussionsEnabled,repositoryTopics"],
    { json: true },
  );
  const slug = repo.nameWithOwner;
  // Features are read through the REST endpoint: `gh repo view --json` has no field for
  // has_wiki or has_projects, so the GraphQL-backed call above cannot see them.
  const rest = run(["api", `repos/${repo.nameWithOwner}`], { json: true });

  const wanted_features = cfg.features ?? {};
  const current = {
    description: repo.description ?? "",
    homepage: repo.homepageUrl ?? "",
    discussions: !!repo.hasDiscussionsEnabled,
    topics: (repo.repositoryTopics ?? []).map((t) => t.name ?? t).sort(),
    features: Object.fromEntries(Object.keys(wanted_features).map((k) => [k, !!rest[`has_${k}`]])),
  };
  const wanted = {
    description: cfg.description,
    homepage: cfg.homepage ?? "",
    discussions: true,
    topics: [...cfg.topics].sort(),
    features: wanted_features,
  };

  const changes = [];
  if (current.description !== wanted.description) changes.push("description");
  if (current.homepage !== wanted.homepage) changes.push("homepage");
  if (current.discussions !== wanted.discussions) changes.push("discussions");
  if (current.topics.join(",") !== wanted.topics.join(",")) changes.push("topics");
  if (JSON.stringify(current.features) !== JSON.stringify(wanted.features)) changes.push("features");

  console.log(`[about] ${slug}`);
  console.log(`[about]   description : ${current.description ? current.description.slice(0, 60) + "…" : "(none)"}`);
  console.log(`[about]   homepage    : ${current.homepage || "(none)"}`);
  console.log(`[about]   discussions : ${current.discussions}`);
  console.log(`[about]   topics      : ${current.topics.length ? current.topics.join(", ") : "(none)"}`);
  if (Object.keys(wanted_features).length) {
    console.log(`[about]   features    : ${Object.entries(current.features).map(([k, v]) => `${k}=${v}`).join(" ")}`);
  }

  if (changes.length === 0) {
    console.log(`[about] ✓ already matches repo-about.json`);
    process.exit(0);
  }

  console.log(`[about] would change: ${changes.join(", ")}`);
  if (!apply) {
    console.log(`[about] dry run — pass --apply to write it`);
    process.exit(0);
  }

  if (["description", "homepage", "discussions"].some((k) => changes.includes(k))) {
    // homepage is sent even when empty: that is how the link is cleared, and skipping it
    // would make an intentional "" in repo-about.json silently unenforceable.
    run([
      "api", "-X", "PATCH", `repos/${slug}`,
      "-f", `description=${wanted.description}`,
      "-f", `homepage=${wanted.homepage}`,
      "-F", "has_discussions=true",
    ]);
    console.log(`[about] ✓ description + homepage + discussions`);
  }

  if (changes.includes("features")) {
    // -F sends a real boolean; -f would send the string "false", which is truthy to the API.
    const args = ["api", "-X", "PATCH", `repos/${slug}`];
    for (const [k, v] of Object.entries(wanted_features)) args.push("-F", `has_${k}=${v}`);
    run(args);
    console.log(`[about] ✓ features: ${Object.entries(wanted_features).map(([k, v]) => `${k}=${v}`).join(" ")}`);
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
