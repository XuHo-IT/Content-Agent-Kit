---
name: daily-run
description: Execute today's content run for an agent built with content-agent-kit. Use when the user says "run today", "tạo nội dung hôm nay", "do the daily run", or a scheduler fires the daily prompt. Reads the project PLAYBOOK.md, does today's phase, passes every item through the review gate, publishes, schedules, and reports.
---

# Daily run

1. **Open `PLAYBOOK.md`** in the project (the source of truth). Re-read it fully — do not
   rely on memory.
2. **Determine today's phase** = (day-of-year mod N) per §1, and do exactly that phase.
3. **(If crawling)** pull fresh ideas first: `node scripts/queue-client.mjs pull` → work
   from `queue_raw.json`.
4. **Fan out** one subagent per item (§2). Each produces content + images + metadata per
   the §4 schema. Check `history.json` — skip duplicates.
5. **Review gate (mandatory, §2b)** — invoke the `review-gate` skill / an independent
   review subagent on every item. Pass → continue. Fail → fix (2–3 rounds) → drop + log.
   Reject any forbidden output on sight.
6. **Publish**: content → `node scripts/publish.mjs <file>.json`; chapters →
   `node scripts/append.mjs <file>.json`. Treat `409` as already-done. Record ids in
   `ledger.json` / titles in `history.json`.
7. **Schedule social** (if any): `node scripts/scheduler/build-queue.mjs items.json` →
   register/run per `docs/06`. Never post restricted types (see PLAYBOOK).
8. **Access tiers, author, language** per §3b/§3c/§0b. Never brand as "(AI)".
9. **Clean up** per-run scratch files (§7).
10. **Report** → `brain/<id>/report.md` (§7b): made / reviewed / published / dropped.
