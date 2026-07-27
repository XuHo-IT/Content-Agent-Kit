# content-agent-kit

A reusable kit for bootstrapping **autonomous content agents** in agentic IDEs
(**Claude Code** and **Antigravity / Gemini**). Download it, tell the AI what you
want to build, and it reads this repo to scaffold a project-specific agent:
a *playbook* (source of truth), state files, publish scripts, an optional
crawl-discovery pipeline, social posting, scheduling, and a pre-publish review gate.

> Bộ kit tái sử dụng để **bootstrap agent nội dung tự động** trong IDE agentic
> (**Claude Code** và **Antigravity / Gemini**). Tải về, ra lệnh cho AI muốn làm
> gì, AI đọc repo này rồi tự dựng agent riêng cho dự án của bạn.

---

## The operating model / Mô hình vận hành

```
                       ┌──────────── PLAYBOOK.md (single source of truth) ───────────┐
                       │  cadence · schemas · quality bar · access tiers · cleanup   │
                       └─────────────────────────────────────────────────────────────┘
 (optional)                                     │ AI reads every run
 [cron] → crawl.py (crawl4ai) → idea queue ─────┤
          sources.yaml, dedup via queue API     ▼
                              fan-out subagents → REVIEW gate → publish (web) + social (Make.com)
                                     │                              │
                              state: queue/ledger/history    report → brain/<id>/report.md
```

**Core ideas** (extracted from real running agents):
1. **Playbook = single source of truth.** The agent re-reads `PLAYBOOK.md` every run — never relies on chat memory.
2. **Flat-file state.** `queue.json` (schedule), `ledger.json` (in-progress work), `history.json` (dedup). Operations are **idempotent** (a `409 = already done`).
3. **Review gate.** Every item passes an **independent review subagent** before publishing; fail → fix (2–3 rounds) → drop + report.
4. **Craft is enforced.** A `WRITING_CRAFT.md` (per-genre voice, banned clichés, before/after examples) is read *before* writing, and its **measurable rubric** is scored *before* publishing — that's what keeps output from reading like AI.
5. **Discovery (optional).** A `crawl4ai` crawler feeds an **idea queue**; the server is the dedup memory (CI runners are ephemeral).
6. **Scheduling.** `cron` (GitHub Actions) is the default; Windows `schtasks` / in-process are alternatives.
7. **Env-only secrets.** No token/webhook/URL is ever hardcoded. `.env` is git-ignored.

---

## Quickstart / Bắt đầu nhanh

**Claude Code**
1. Clone this repo next to (or into) your project.
2. Copy the skills: `cp -r skills/* .claude/skills/` (or point Claude Code at them).
3. Run the meta-skill: **`/bootstrap-content-agent`** — the AI interviews you and scaffolds a new agent.

**Antigravity / Gemini**
1. Clone this repo into your workspace.
2. Tell the agent: *"Read `AGENTS.md` and `docs/`, then build me an agent that <does X>."*
3. It follows `skills/bootstrap-content-agent/SKILL.md` as a plain instruction doc and scaffolds the agent.

Then day-to-day: run **`/daily-run`** (or your generated `schedule-prompt.md` on a cron).

---

## What's inside / Bên trong

| Path | Purpose |
|---|---|
| `docs/` | The methodology (bilingual EN + VI), 13 short docs — incl. **`12-writing-craft.md`**, **`13-permissions.md`** (scoped auto-accept). |
| `templates/` | Fill-in scaffolds: `PLAYBOOK`, **`WRITING_CRAFT`**, `KNOWLEDGE`, `sources.yaml`, state, cron workflow. |
| `scripts/` | Generic **working** CLI: publish/append/update, queue client, `social/make-post`, `crawl/crawl.py`, **`audit-quality`** (rule-based audit), scheduler. All env-only. |
| `skills/` | Claude Code skills: **`bootstrap-content-agent`** (the meta-skill), `daily-run`, `review-gate`, `audit-and-fix`, `crawl-and-queue`. |
| `examples/ai-news-social/` | A complete worked example: an AI-news social agent (crawl → write → image → web + Make.com → cron). |

## Safety / An toàn
- **Never commit `.env`.** Scripts read env only; missing env → a clear error, no silent fallback.
- **Copyright:** the crawler stores **excerpts only** (≤1500 chars) + a source link — never full text. Adapt/summarize in your own words.

## License
MIT — see `LICENSE`.
