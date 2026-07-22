# Schedule prompt — {{AGENT_NAME}}

> Paste this into your scheduler (Antigravity scheduled task, GitHub Actions step, or
> a `/daily-run` invocation). It is the short instruction the run fires with.

---

Read and execute **{{PATH}}/PLAYBOOK.md** for today.

- Determine today's phase = (day-of-year mod {{N}}) and do exactly that phase.
- {{Optional: pull the idea queue first — `node scripts/queue-client.mjs pull`.}}
- Fan out one subagent per item.
- **REVIEW gate is mandatory**: every item passes an independent review subagent before
  publishing. Fail → fix (max 2–3 rounds) → drop + log. Reject forbidden output on sight.
- Access tiers per §3c. Author = random pen-name, never "(AI)". Language = {{LANGUAGE}},
  correct diacritics, no translation. No duplicates (check history.json).
- Publish: content → `publish.mjs` / chapters → `append.mjs`; spread posting times
  randomly. {{Social highlights → make-post.mjs; never post {{restricted type}}.}}
- Clean up per-run scratch files at the end.
- Write the report to `brain/<id>/report.md`.

⚠️ Never create: {{removed features / forbidden types}}.
