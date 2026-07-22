# {{AGENT_NAME}} — AUDIT PLAYBOOK (fix ALREADY-published content)

> Separate from daily creation. **Stop for human confirmation before mutating live content.**

## Goal
Find published items that are low quality / have wrong-or-duplicate images / broken
logic, and fix them.

## Process
### Step 0 — Rule-based audit first (cheap, no AI)
Run `{{node scripts/audit-quality.mjs}}` (project-specific rules: length, missing fields,
broken id refs, duplicate/missing images) → `audit_report.md`.

### Step 1 — List
`node scripts/list-published.mjs --limit {{40}}` → `audit_input.json`.

### Step 2 — Subagent audit (fan-out)
One subagent per item grades cover + images + content + logic → `{ id, ok, issues[] }`.

### Step 3 — LIST & WAIT for confirmation (mandatory stop)
Write `audit_report.md` (failing items + proposed fixes). **Present to the user and stop.**
Do NOT change anything until they choose which to fix.

### Step 4 — Fix (only confirmed)
Regenerate the bad part / new images → `node scripts/update.mjs <fix>.json`. Keep the
`id` stable. Re-audit to confirm clean.

### Step 5 — Report
`brain/<id>/audit_fix_report.md`: fixed, skipped, dropped.

## Priority
{{Free/visible items first → paid → long tail. Batch 20–30, not >100 per run.}}
