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
   (`daily-run`, `review-gate`, `crawl-and-queue`, `audit-and-fix`, plus
   `create-video` + `video-and-post` if the agent makes videos).

## When the user says "run today" / "tạo nội dung hôm nay"
Follow `skills/daily-run/SKILL.md` (or the generated project's `PLAYBOOK.md`):
determine today's phase, fan out, **review-gate before publish**, schedule, report.

## When the user says "tạo video" / "make a video" / "làm short/reel"
Follow `skills/create-video/SKILL.md` — read `templates/VIDEO_CRAFT.template.md` **and**
`video-templates/CATALOG.md` first, write `script.json`, then:
```bash
node scripts/video/validate-script.mjs <dir>/script.json --strict   # seconds — never skip
node scripts/video/render.mjs          <dir>/script.json            # ~3–5 min
```
To also publish it, use `skills/video-and-post/SKILL.md`. Method: `docs/14-video-generation.md`.

## When the user wants footage, screenshots or more visual variety
Follow `skills/research-and-capture/SKILL.md` — research the topic, capture the pages worth
showing, pick B-roll, and write `media` blocks into the scenes:
```bash
node scripts/media/stock-search.mjs --query "data center servers"   # read WHAT EACH CLIP IS
node scripts/media/screenshot.mjs --url "https://…" --out shot.png
node scripts/video/add-template.mjs --preset news                   # transitions, captions, charts
```
Method: `docs/15-media-sources.md` and `docs/16-template-registry.md`.

## Non-negotiable conventions (see `docs/03-conventions.md`)
- **Env-only secrets** — never hardcode a token, webhook, or key. If env is missing, stop with a clear message.
- **Review gate** — nothing publishes without passing an independent review subagent.
- **Idempotent** — treat `409 Conflict` as "already done", mark it done, move on.
- **Clean up** — delete per-run scratch files at the end; keep only state files.
- **Copyright** — crawl = excerpts + link only; write original text.
- **Scoped auto-accept** — a scheduled run uses `acceptEdits` + a tight allow-list (never
  `bypassPermissions`); no destructive/out-of-scope commands. See `docs/13-permissions.md`.
- **No internal-id leak** — logic ids never appear in reader-visible text. See `docs/03`.
- **Validate video scripts before rendering** — `validate-script.mjs` costs seconds, a render
  costs 3–5 minutes. Never pass `--skip-validate` to save time.
- **Keep the attribution** — `NOTICE.md` at the root and every `video-templates/*/NOTICE.md`
  are licence conditions of the vendored code. Never delete or "tidy" them.

## Map of the kit
- `docs/` — methodology (bilingual). Start at `01-architecture.md`.
- `templates/` — fill-in scaffolds.
- `scripts/` — generic working CLIs (env-only), incl. `scripts/video/`.
- `video-templates/` — the 74 scene templates + `CATALOG.md` (slots + character limits).
  A folder only counts as a template when it has `index.html`; two vendored folders
  (`caption-kinetic-slam`, `transitions-blur`) do not, so 76 folders means 74 usable.
- `templates/VIDEO_GENRES.template.json` — scene sequences for 12 genres (review, tutorial, news,
  listicle, launch, testimonial, local, vox-explainer, geo-answer, technical-deepdive, growth-strategy, geo-itinerary). Answers 'which frames, in what order'
  rather than 'what shape is a script'. Method: `docs/21-video-genres.md`.
- `skills/` — Claude Code skills; also readable as plain instructions. `registry.json`
  lists skills from other projects, fetched on demand by `scripts/install-skills.mjs` —
  none of them are vendored. Method: `docs/17-skills-registry.md`.
- `.mcp.json` — optional ad-platform servers (OAuth in your client, no credentials in the
  repo). They are READ-AND-WRITE on live accounts. Method: `docs/18-ads-and-marketing.md`.
  Canva is there too, for campaign visuals: `docs/19-design-canva.md`.
- `skills/repurpose/` — one published item → several more, each from a DIFFERENT angle the
  source already contains. Tracks used angles in `brain/repurposed.json`, because
  `history.json` dedups by title and cannot answer that. Method: `docs/22-repurposing.md`.
- `profiles/` — backend, voice, palette and spend ceiling per context (personal,
  business). `script.json` always wins over a profile. Method: `docs/20-video-backends.md`.
- `examples/ai-news-social/` — a complete reference agent to copy from.
- `examples/ai-video-social/` — the video version of the same.
- `NOTICE.md` — third-party attribution for the vendored video pipeline and templates.
