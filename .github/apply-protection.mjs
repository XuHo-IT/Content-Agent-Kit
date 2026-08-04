// apply-protection.mjs — branch protection for `main`, kept in the repo instead of only
// in the Settings UI.
//   node .github/apply-protection.mjs           # show current vs intended
//   node .github/apply-protection.mjs --apply
//
// Needs the GitHub CLI authenticated with the `repo` scope: gh auth login
// ENV: none.
import { spawnSync } from "node:child_process";

const apply = process.argv.includes("--apply");

/**
 * The rules, and why each one is set this way. A protection config nobody understands
 * gets switched off the first time it is inconvenient.
 */
const RULES = {
  // Every CI job must be green. These names come from `name:` in ci.yml — rename a job
  // there and it silently stops being required, so the two must be changed together.
  required_status_checks: {
    // strict:false = a PR does NOT have to be rebased onto the newest main before merging.
    // With several Dependabot PRs open at once, strict:true makes every merge invalidate
    // all the others and triggers an endless rebase storm for no real safety gain here.
    strict: false,
    contexts: [
      "Scripts (Node 18)",
      "Scripts (Node 20)",
      "Scripts (Node 22)",
      "Python crawler",
      // Red for a PR opened by anyone but the owner, github-actions[bot] or dependabot[bot],
      // until a maintainer adds the `reviewed` label. It gates MERGING, not contributing:
      // CONTRIBUTING.md invites small PRs outright and that stays true.
      "Author gate",
    ],
  },

  // A pull request is required. Zero approvals is deliberate: this is a solo-maintained
  // repo, and requiring an approval a solo maintainer cannot give themselves would mean
  // nothing could ever merge — including Dependabot's security bumps. The value here is
  // "changes arrive as reviewable PRs with CI green", not gatekeeping.
  required_pull_request_reviews: {
    required_approving_review_count: 0,
    dismiss_stale_reviews: true,
    require_code_owner_reviews: false,
  },

  // false = the owner can still push directly in an emergency. Honest trade-off: it
  // weakens the rule, but locking the only maintainer out of their own main branch when
  // CI is broken is worse. Flip to true if the project gains co-maintainers.
  enforce_admins: false,

  restrictions: null, // no push allowlist — the PR requirement already gates it
  required_linear_history: true, // squash/rebase only; keeps history readable
  required_conversation_resolution: true, // no merging over an unanswered review comment
  allow_force_pushes: false, // history on main is not rewritable
  allow_deletions: false, // main cannot be deleted
  block_creations: false,
  lock_branch: false,
  allow_fork_syncing: true,
};

function ghPath() {
  for (const c of ["gh", "C:/Program Files/GitHub CLI/gh.exe", "C:/Program Files (x86)/GitHub CLI/gh.exe"]) {
    if (spawnSync(c, ["--version"], { encoding: "utf8" }).status === 0) return c;
  }
  throw new Error("GitHub CLI not found. Install it, then run: gh auth login");
}

const gh = ghPath();
const run = (args, { json = false, input = null } = {}) => {
  const r = spawnSync(gh, args, { encoding: "utf8", input });
  if (r.status !== 0) throw new Error(`gh ${args.slice(0, 3).join(" ")} failed: ${(r.stderr || r.stdout || "").trim().slice(0, 400)}`);
  return json ? JSON.parse(r.stdout || "{}") : r.stdout.trim();
};

try {
  if (spawnSync(gh, ["auth", "status"], { encoding: "utf8" }).status !== 0) {
    throw new Error("Not logged in. Run: gh auth login   (scopes: repo)");
  }

  const slug = run(["repo", "view", "--json", "nameWithOwner"], { json: true }).nameWithOwner;

  let current = null;
  const probe = spawnSync(gh, ["api", `repos/${slug}/branches/main/protection`], { encoding: "utf8" });
  if (probe.status === 0) {
    try {
      current = JSON.parse(probe.stdout);
    } catch {
      /* ignore */
    }
  }

  console.log(`[protect] ${slug} — branch: main`);
  if (!current) {
    console.log(`[protect]   current: NO PROTECTION`);
  } else {
    console.log(`[protect]   current: PR required=${!!current.required_pull_request_reviews}` +
      ` · checks=${(current.required_status_checks?.contexts ?? []).length}` +
      ` · force-push=${current.allow_force_pushes?.enabled}` +
      ` · linear=${current.required_linear_history?.enabled}`);
  }
  console.log(`[protect]   intended:`);
  console.log(`[protect]     pull request required, 0 approvals (solo maintainer)`);
  console.log(`[protect]     status checks: ${RULES.required_status_checks.contexts.join(", ")}`);
  console.log(`[protect]     linear history, no force push, no deletion, resolve conversations`);
  console.log(`[protect]     admins exempt (emergency escape hatch)`);

  if (!apply) {
    console.log(`[protect] dry run — pass --apply to write it`);
    process.exit(0);
  }

  run(
    ["api", "-X", "PUT", `repos/${slug}/branches/main/protection`, "-H", "Accept: application/vnd.github+json", "--input", "-"],
    { input: JSON.stringify(RULES) },
  );
  console.log(`[protect] ✓ applied — https://github.com/${slug}/settings/branches`);
} catch (e) {
  console.error(`[protect] ✗ ${e.message}`);
  process.exit(1);
}
