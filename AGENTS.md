# AGENTS.md — entry point for the IDE agent

> Read this first. It tells you (the AI) how to use this kit. Works for **Claude
> Code** (real skills in `.claude/skills/`) and **Antigravity / Gemini** (read the
> `.md` docs directly — treat each `SKILL.md` as a plain instruction doc).

## When the user says "build me an agent that does X"
1. **Read** `docs/01-architecture.md`, `docs/03-conventions.md`, and skim the rest of `docs/`.
2. **Run the bootstrap flow** in `skills/bootstrap-content-agent/SKILL.md`:
   interview the user, then scaffold their agent from `templates/` + `scripts/`.
3. Produce, in the user's target project: `PLAYBOOK.md`, `KNOWLEDGE.md`,
   `.env.example`, state JSON, (optional) `sources.yaml` + crawl workflow, wired
   scripts, a `schedule-prompt.md`, and — on Claude Code — the runtime skills
   (`daily-run`, `review-gate`, `crawl-and-queue`, `audit-and-fix`).

## When the user says "run today" / "tạo nội dung hôm nay"
Follow `skills/daily-run/SKILL.md` (or the generated project's `PLAYBOOK.md`):
determine today's phase, fan out, **review-gate before publish**, schedule, report.

## Non-negotiable conventions (see `docs/03-conventions.md`)
- **Env-only secrets** — never hardcode a token, webhook, or key. If env is missing, stop with a clear message.
- **Review gate** — nothing publishes without passing an independent review subagent.
- **Idempotent** — treat `409 Conflict` as "already done", mark it done, move on.
- **Clean up** — delete per-run scratch files at the end; keep only state files.
- **Copyright** — crawl = excerpts + link only; write original text.
- **Scoped auto-accept** — a scheduled run uses `acceptEdits` + a tight allow-list (never
  `bypassPermissions`); no destructive/out-of-scope commands. See `docs/13-permissions.md`.
- **No internal-id leak** — logic ids never appear in reader-visible text. See `docs/03`.

## Map of the kit
- `docs/` — methodology (bilingual). Start at `01-architecture.md`.
- `templates/` — fill-in scaffolds.
- `scripts/` — generic working CLIs (env-only).
- `skills/` — Claude Code skills; also readable as plain instructions.
- `examples/ai-news-social/` — a complete reference agent to copy from.
