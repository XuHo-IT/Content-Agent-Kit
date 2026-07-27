# {{AGENT_NAME}} — KNOWLEDGE (API & schema reference)

> Technical contracts the scripts + agent rely on. Keep this accurate; the PLAYBOOK
> points here for exact shapes.

## Ingest API
Base: `{{SITE_URL}}` · Auth: `Authorization: Bearer $INGEST_API_TOKEN` on all writes.

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `{{/api/ingest}}` | full item JSON | `201 { id }` · `409` duplicate · `400` invalid |
| POST | `{{/api/ingest/append}}` | `{ id, parts:[{title,content[]}], targetParts }` | `200` |
| POST | `{{/api/ingest/update}}` | `{ id, ...fields }` | `200` |

Semantics: **201** created (store the id in ledger/history) · **409** already exists
(treat as done) · **400** validation error (fix, don't blind-retry).

## Queue API (if crawling — see docs/10)
`GET ?known=1` → `{ urls }` · `GET ?status=new&limit=N` → `{ items }` ·
`POST { items:[…] }` → upsert unique `source_url` · `PATCH { source_url, status }`.

## Social webhook
`POST $MAKE_WEBHOOK_URL` body `{ mediaUrl, image_url, post, comment }`.

## Item schemas (canonical)
### {{type A}}
```json
{{full field list with types}}
```
### {{type B}}
```json
{{full field list with types}}
```

## Structured / interactive content — split reader-visible vs hidden answers
Applies to ANY item that has a correct answer the reader shouldn't see up front — a quiz, a
poll with a "reveal", a puzzle, a branching story, a mystery/case file, a graded exercise.
**Separate what the reader sees from the answer the server must hide.** Two blocks:

- **Public block** (`{{PUBLIC_FIELD — e.g. quizData / caseData / steps}}`): everything the reader
  interacts with — the body, the options/choices, any per-entity cards, branching nodes. Safe to
  store as-is and ship to the browser.
- **Answer block** (`{{ANSWER_FIELD — e.g. answerKey / caseConfig}}`): the solution — the correct
  answer id(s) (`{{answerId / …}}`), the post-solve reveal text (`{{revealText}}`), and any other
  answer-only fields your domain needs. The ingest API **splits this out and stores it
  server-only** so it never ships to the browser.

Rules that keep this working:
- **Locks/ciphers are authored inline + encoded server-side.** Write the plaintext answer in the
  item (`{{lock:{ answer, method }}}`); the server encodes/hashes it and hides the real payload
  until the reader solves it. ⚠️ **Landmine:** if you later re-`update` the item and resend that
  entity WITHOUT the plaintext `answer`, the server has nothing to re-encode and **silently drops
  the lock** — always resend `{ answer, method }` (+ the real payload) when updating a locked entity.
- **Gating** (`{{e.g. revealsIds, requireFound, actionBudget}}`): reaching a node reveals data and
  may cost a turn; set any budget below the node count so choices matter.
- **Fair-play / derivability contract:** every fact needed to reach the answer must be obtainable
  from the **public** block — no answer-only facts, no dead ends.
- 🔴 **Never leak the logic ids** (`{{e.g. q1 / o2 / n3}}`) into reader-visible text — see
  `docs/03-conventions.md`. Ids belong in the logic fields (`{{answerId, revealsIds, …}}`)
  ONLY. `scripts/audit-quality.mjs` (`id-leak` rule) flags any that slip through.

## Gotchas
- If the host project is `"type":"module"`, name CommonJS helper scripts `*.cjs`.
- **Array vs JSON columns:** if a body field is a SQL array (e.g. Postgres `text[]`), pass a
  real array (not a JSON string) or you get "malformed array literal". After editing body text
  that feeds a dedup/content hash, **recompute that hash** or dedup drifts.
- Image host: {{Cloudinary unsigned preset `{{PRESET}}` / Catbox}}; local file → upload → URL;
  the ingest API re-hosts it to your storage bucket (see `docs/05-publishing.md`).
- {{Any per-project quirks}}.

## Required env
`SITE_URL`, `INGEST_API_TOKEN`{{, MAKE_WEBHOOK_URL, CLOUDINARY_*, SUPABASE_* …}}.
