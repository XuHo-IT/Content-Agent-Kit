---
name: audit-and-fix
description: Audit ALREADY-published content and fix low-quality items, for an agent built with content-agent-kit. Use when the user says "audit the published content", "review old posts and fix them", or "clean up the backlog". Rule-audit first, then subagent grading, then STOP for confirmation before mutating live content.
---

# Audit & fix (published content)

This is separate from daily creation and it mutates LIVE content — so it stops for human
confirmation before changing anything.

1. **Rule-based audit first (cheap).** Run the project's rule audit (e.g.
   `node scripts/audit-quality.mjs`) → `audit_report.md`. Hard rules only: length, missing
   fields, broken id references, duplicate/missing images. No AI needed.
2. **List** recent published items: `node scripts/list-published.mjs --limit 40` →
   `audit_input.json`.
3. **Subagent audit (fan-out)** — one reviewer per item grades cover/images/content/logic
   → `{ id, ok, issues[] }`.
4. **STOP and present.** Write `audit_report.md` (failing items + proposed fixes) and show
   the user. Do NOT change anything until they choose which items to fix.
5. **Fix confirmed items** — regenerate the bad part / new images, keep the `id` stable,
   apply with `node scripts/update.mjs <fix>.json`. Re-audit to confirm clean.
6. **Report** → `brain/<id>/audit_fix_report.md`: fixed / skipped / dropped.

**Priority**: items visible to logged-out / free users first, then paid, then the long
tail. Work in batches of 20–30 (not >100 per run).
