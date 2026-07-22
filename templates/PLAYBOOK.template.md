# {{AGENT_NAME}} — PLAYBOOK

> The agent reads this file EVERY run. It is the single source of truth — never rely
> on chat memory. Fill every {{PLACEHOLDER}} and delete this quote block.

## 0. One-line summary
{{AGENT_NAME}} {{does WHAT, for WHOM, published WHERE}}.

## 0b. Voice & language
- Language: **{{LANGUAGE}}** with correct diacritics. Tone: {{TONE}}.
- Never brand content as "(AI)". No mixed scripts / machine-translation artifacts.

## 1. Cadence  (phase = day-of-year mod {{N}})
- Phase `1` → **Day A**: {{produce A — count + type}}.
- Phase `0` → **Day B**: {{produce B — count + type}}.
- {{Optional: extra daily task, e.g. 1 crawl-sourced item}}.
- Little but high quality.

## 2. Fan-out
One subagent per item, run in parallel. Item types: {{list}}.

## 2b. REVIEW gate (mandatory — see docs/07)
Each item passes an INDEPENDENT review subagent (quality / images correct-unique-complete
/ logic / SEO). Pass → publish. Fail → fix (2–3 rounds) → drop + log. Forbidden output
({{removed features}}) → reject immediately.

## 3. Images
{{How images are generated}}. One distinct image per entity; never reuse.

## 3b. Author
Random human pen-name. Never "(AI)".

## 3c. Access tiers
{{FREE ~X% / LOGIN default / PAID ~Y%}}. {{Rules per type}}.

## 4. Per-type schema
### {{type A}} → `POST {{endpoint}}`
```json
{{minimal valid JSON example}}
```
### {{type B}} → `POST {{endpoint}}`
```json
{{minimal valid JSON example}}
```
Every referenced id must exist; every answer must be derivable (no guessing).

## 5. Publish + schedule
- Create → `node scripts/publish.mjs <file>.json`
- Append → `node scripts/append.mjs <chapters>.json`
- Social → `node scripts/social/make-post.mjs …`
- Spread posting times randomly across the day (`scripts/scheduler/build-queue.mjs`).

## 6. Dedup
Check `history.json` before creating. `409` = already exists = mark done, skip.

## 7. Cleanup
Delete per-run scratch files (payloads, temp images). Keep state + reports.

## 7b. Report
Write `brain/<id>/report.md`: what was made, review results, what published, what dropped.

## 8. Required env
`SITE_URL`, `INGEST_API_TOKEN`{{, MAKE_WEBHOOK_URL, image-host keys, …}}.

## ⚠️ Removed / never do
{{List anything the agent must NOT create — old features, wrong types. Reject on sight.}}
