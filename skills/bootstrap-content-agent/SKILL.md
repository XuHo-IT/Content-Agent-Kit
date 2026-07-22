---
name: bootstrap-content-agent
description: Scaffold a new autonomous content agent from this kit. Use when the user says "build me an agent that <does X>", "set up a content/social/news agent", or "bootstrap an agent from content-agent-kit". Interviews the user, then generates their project-specific playbook, knowledge doc, scripts, state, schedule, and (on Claude Code) runtime skills.
---

# Bootstrap a content agent

You are turning this kit into a working, project-specific content agent. Work in
phases. Do not skip the interview — the answers drive everything you generate.

## Phase 1 — Read the method
Read `docs/01-architecture.md`, `docs/03-conventions.md`, and skim `docs/02,05,06,07,10,11`.
Internalize the six parts (playbook / knowledge / state / scripts / discovery / schedule)
and the non-negotiable conventions (env-only, review-gate, idempotent, cleanup).

## Phase 2 — Interview the user
Ask (batch related questions; propose sensible defaults):
1. **Domain & goal** — what content, for whom, published where?
2. **Item types & schema** — what kinds of items (article / long serialized / case / …),
   and the exact fields each needs. Get one concrete example per type.
3. **Cadence** — how many per day; rotate phases? (phase = day mod N).
4. **Publish target** — is there an ingest API? Base URL + endpoint paths + auth. If none,
   is it social-only?
5. **Discovery** — should it crawl sources for ideas (crawl4ai)? If yes, list a few
   source index pages + the article-link pattern. (Copyright: excerpt+link only.)
6. **Social** — post to Make.com/n8n/Zapier? Which platforms? Image host (Cloudinary/Catbox)?
7. **Scheduling** — GitHub Actions cron / Windows schtasks / manual?
8. **Access tiers & voice** — free/login/paid split; language; tone; anything forbidden.

## Phase 3 — Scaffold (generate into the user's project)
From `templates/` + `scripts/`, produce:
- **`PLAYBOOK.md`** — fill `templates/PLAYBOOK.template.md` with the interview answers.
- **`KNOWLEDGE.md`** — fill `templates/KNOWLEDGE.template.md` with the real API contracts.
- **`.env.example`** — only the env keys this agent needs (copy from kit `.env.example`, trim).
- **State**: `history.json`, `ledger.json` (if serialized), `queue.json` — start from the
  examples in `templates/state/`.
- **Scripts**: copy the needed ones from `scripts/` (publish/append/update/queue-client/
  social/scheduler/crawl). Adjust default endpoint paths (`--path` / `QUEUE_PATH`) to the
  user's API. Do NOT hardcode secrets — env-only.
- **Discovery** (if chosen): `sources.yaml` from the template + `crawl.py` + the cron
  workflow from `templates/workflows/crawl.yml.template`.
- **`schedule-prompt.md`** — from the template, wired to this agent's phases.
- **On Claude Code**: copy the runtime skills into `.claude/skills/`: `daily-run`,
  `review-gate`, `crawl-and-queue` (if crawling), `audit-and-fix`. On Antigravity, tell
  the user the scheduled task should say "Read PLAYBOOK.md and execute today's phase".

## Phase 4 — Wire & verify
- `node -c` each generated `.mjs`; `python -m py_compile crawl.py` if present.
- Run each script with `--help` to confirm it loads (env-only; missing env → clear error).
- Grep the generated project for accidental secrets (see `docs/09-security.md`).
- Show the user: the file tree created, how to fill `.env`, and how to trigger the first run.

## Guardrails
- **Never hardcode a secret.** If the API needs a token, reference an env var and add it to
  `.env.example`.
- **Always include the review gate** in the generated PLAYBOOK §2b.
- **Copyright**: if crawling, excerpt-only + original writing; prefer public-domain.
- Keep it "little but high quality" — a tight cadence beats volume.

> Antigravity note: this file is also a plain instruction doc. Follow the phases directly;
> "copy skills into `.claude/skills/`" becomes "keep the `SKILL.md` files as reference docs
> the scheduled agent reads."
