---
name: bootstrap-content-agent
description: Scaffold a new autonomous content agent from this kit. Use when the user says "build me an agent that <does X>", "set up a content/social/news agent", or "bootstrap an agent from content-agent-kit". Interviews the user, then generates their project-specific playbook, knowledge doc, scripts, state, schedule, and (on Claude Code) runtime skills.
---

# Bootstrap a content agent

You are turning this kit into a working, project-specific content agent. Work in
phases. Do not skip the interview — the answers drive everything you generate.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Đọc phương pháp | Đọc `docs/01-architecture.md`, `docs/03-conventions.md` và các tài liệu liên quan | — |
| 2. Phỏng vấn | Hỏi theo nhóm: chủ đề, loại bài, nơi đăng, lịch chạy, giọng văn, có làm video/ads không — kèm gợi ý sẵn | Trả lời câu hỏi; chưa chắc thì nhận gợi ý mặc định |
| 3. Dựng dự án | Tạo `PLAYBOOK.md`, `KNOWLEDGE.md`, `WRITING_CRAFT.md`, `.env.example`, file trạng thái, script, lịch | Cho biết thư mục dự án đích |
| 4. Kiểm tra | Chạy `--help` từng script, soát một caption bằng `validate-post.mjs --strict`, quét lộ khoá bí mật | — |
| 5. Bàn giao | Đưa cây thư mục đã tạo, cách điền `.env`, cách chạy lần đầu | Điền khoá vào `.env` (không dán khoá vào chat) |

**Hay vướng:**
- Trả lời quá chung ("làm nội dung về AI") → cho agent một ví dụ bài thật bạn muốn có.
- Dán API key vào chat → chỉ điền trong file `.env` trên máy.
- Không biết chọn lịch chạy nào → chọn "chạy tay" trước, bật lịch tự động sau khi đã ưng ý.

## Phase 1 — Read the method
Read `docs/01-architecture.md` and `docs/03-conventions.md` in full. Then skim
`docs/02-playbook-spec.md`, `docs/05-publishing.md`, `docs/06-scheduling.md`,
`docs/07-review-gate.md`, `docs/08-audit-maintain.md`, `docs/10-crawl-discovery.md` and
`docs/11-social-posting.md`.
If the agent will make video, also read `docs/20-video-backends.md`; if it will use skills or
connectors from elsewhere, `docs/17-skills-registry.md` and `docs/18-ads-and-marketing.md`.
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
6. **Social** — post to Make.com/n8n/Zapier? Which platforms (tiktok / youtube_shorts /
   facebook_reels / instagram_reels / plain page posts)? Media host (Cloudinary/Catbox)?
6b. **Video** — does this agent make **short videos** as well as (or instead of) text+image?
   If yes: how many per week; channel name + brand URL for the outro; **which TTS provider**
   (a cloud key is enough — only `omnivoice` needs a local server); **whether scenes should
   use real footage** (needs a Pexels or Pixabay key) and **screenshots** (needs nothing extra
   — Chrome is already required); and **where finished video is hosted** (`r2` is the default;
   never `catbox` for anything published). Confirm the render machine has **FFmpeg and
   Chrome** — GitHub Actions cannot do this step at all (`docs/06-scheduling.md`).
6c. **Personal or business?** This picks a profile (`VIDEO_BACKEND` plus `profiles/personal.json` or
   `profiles/business.json`): backend, voice, palette, brand slots and a **spend ceiling**.
   Both default to the free `html` backend — only move to `api` for a deliberate hero video,
   never for a daily queue (Veo bills $0.40/s, so a 60-second video is $24).
7. **Scheduling** — GitHub Actions cron / Windows schtasks / manual?
8. **Access tiers** — free/login/paid split; anything forbidden.
8b. **Measurement (optional)** — do they run ads for this content? If yes, `.mcp.json` has
   Pipeboard servers for Meta/Google/TikTok/Snap/Reddit and the `ads-report` skill turns
   what they report into next week's queue. Warn them those connections are **read AND
   write** on live accounts.
8b2. **Facebook / Meta ads (optional)** — do they run paid social themselves (shop, fashion,
   e-commerce)? If yes, `docs/28-facebook-ads.md` maps the work to eight skills that all run
   offline on Ads Manager exports, with `scripts/ads/*.mjs` doing the counting and
   `templates/VN_RETAIL_CALENDAR.template.json` holding the Vietnamese sale calendar. Ask for
   the brand voice for comment replies and whether they have customer consent before any
   order file is touched (Nghị định 13/2023).
8c. **Images (optional)** — do they need campaign visuals rather than stock photos? Canva's
   MCP is declared in `.mcp.json`, and the `design-campaign` skill exports a **file**, not a
   Canva link. Ask which plan they are on: resize needs Pro, autofill needs Enterprise, so
   the canvas size has to be decided before designing.
9. **Voice & craft (do not skip — this is what makes output not read like AI):**
   - Publication language + tone; who is the implied author?
   - **One register per content type** — how should each *sound*, and how do they differ?
   - Which clichés/phrases are overused in this language & genre? (get 5–10 concrete ones)
   - Any hard genre contract? (e.g. mystery fair-play, journalism sourcing, brand rules)
   - Ask for **1–2 samples they consider good** — you'll mine them for the before/after pairs.

## Phase 3 — Scaffold (generate into the user's project)
From `templates/` + `scripts/`, produce:
- **`PLAYBOOK.md`** — fill `templates/PLAYBOOK.template.md` with the interview answers.
- **`WRITING_CRAFT.md`** — fill `templates/WRITING_CRAFT.template.md` (see `docs/12-writing-craft.md`).
  **Start from `templates/INDUSTRIES.template.json`.** Its `theme` field is the vertical's
  palette preset — write it into the agent's `VIDEO_CRAFT.md` and every `script.json`
  (`docs/25-palettes.md`). Find the user's vertical, and use its
  `post.types` to fill the register sections, `post.proof` to define what evidence looks like
  here, and `post.avoid` for the banned list. If the entry has a `legal` block — healthcare,
  finance and property all do — copy those rules in **with their source links**. They are the
  difference between a post that is merely weak and one that costs a fine.
  **Write it in the publication language**, one register section per content type, a concrete
  banned-cliché list, and **2–3 BEFORE/AFTER pairs you author yourself** (never copy copyrighted
  prose). End with the §7 rubric using **countable fail thresholds**. This file is what stops
  the output from reading like AI — do not skip or stub it.
- **`KNOWLEDGE.md`** — fill `templates/KNOWLEDGE.template.md` with the real API contracts.
- **`.env.example`** — only the env keys this agent needs (copy from kit `.env.example`, trim).
- **State**: `history.json`, `ledger.json` (if serialized), `queue.json` — start from the
  examples in `templates/state/`.
- **Scripts**: copy the needed ones from `scripts/` (publish/append/update/queue-client/
  social/scheduler/crawl). Adjust default endpoint paths (`--path` / `QUEUE_PATH`) to the
  user's API. Do NOT hardcode secrets — env-only.
- **Video** (if chosen in 6b):
  - **`VIDEO_CRAFT.md`** — fill `templates/VIDEO_CRAFT.template.md`, written in the
    publication language. §5 (voice + banned narration clichés) is the part only the user can
    answer; §2's number table stays as-is for Vietnamese, and must be rewritten for any other
    TTS language.
  - Copy **`scripts/video/`** AND **`scripts/media/`** (whole folders, including their
    `lib/`), plus **`video-templates/`** (all templates **and every `NOTICE.md`** —
    attribution is a licence condition — and the root `NOTICE.md` too).
    Without `scripts/media/` the render cannot resolve B-roll or screenshots and cannot
    upload anything.
  - Copy `templates/VIDEO_SCRIPT.template.json` as the writer's starting point,
    **`templates/VIDEO_GENRES.template.json`** (scene sequences for review / tutorial / news /
    listicle / testimonial — it answers "which frames, in what order", which the catalogue
    does not), and `templates/stock-sources.yaml.template` if they want clips from sites with
    no API.
  - Copy the chosen **profile** from `profiles/` and set its `brand` fields from the
    interview. Leave a brand field EMPTY rather than guessing — an empty slot is dropped,
    a guessed one is published.
  - Add to the generated `.env.example`: `TTS_PROVIDER` + that provider's key **copied
    verbatim from the kit's `.env.example`** (vbee's is `VBEE_TOKEN`, not `VBEE_API_KEY` —
    this exact mismatch shipped once and made vbee unusable for anyone following the docs),
    `MEDIA_HOST` (default `r2`) + its keys, `PEXELS_API_KEY` / `PIXABAY_API_KEY` if using
    B-roll, and `SOCIAL_PLATFORMS`.
  - Tell them to run `node scripts/media/host-check.mjs` and
    `node scripts/video/tts-check.mjs` **before** the first real render — both fail loudly
    on a misconfigured key, which is much cheaper than finding out mid-render.
- **Discovery** (if chosen): `sources.yaml` from the template + `crawl.py` + the cron
  workflow from `templates/workflows/crawl.yml.template`.
- **`schedule-prompt.md`** — from the template, wired to this agent's phases.
- **On Claude Code**: copy the runtime skills into `.claude/skills/`: `daily-run`,
  `review-gate`, `crawl-and-queue` (if crawling), `audit-and-fix`, plus `create-video` and
  `video-and-post` and `research-and-capture` if the agent makes videos, `topic-radar` +
  `daily-topic-video` if the agent works from a topic the user names each morning rather
  than from a crawled queue (they need no keys — every source is keyless — and
  `daily-topic-video` is the whole radar→video→publish chain in one ask),
  `competitor-analysis` when the user names rival channels or sites (keyless: YouTube feeds
  and any RSS site; it writes the topic gaps against this agent's own `history.json`),
  `ads-report` (it works with no ad spend too — pasted numbers), `repurpose` if they publish
  to more than one channel, `geo-optimize` if anything they publish is meant to be found —
  it carries `scripts/geo-audit.mjs`, which gates a draft on whether a passage still means
  anything once an answer engine quotes it alone — and
  `design-campaign` if Canva is connected, `talking-head-edit` if the user films themselves (cuts fillers and retakes by the transcript,
  cards landed on the spoken word, a ducked music bed), `story-video` whenever the agent makes videos (brand,
  customer and history stories on the `frame-story-*` set — fetch its sounds once with
  `node scripts/video/sfx-cc0.mjs`), and for an agent that runs Meta ads the ads set:
  `ads-creative-lab`, `ads-fatigue-watch`, `ads-comment-triage`, `ads-policy-check` (wire it
  into the review gate for ad copy — `policy-lint.mjs` exits 2 on a block), `catalog-feed-audit`
  if they run catalog/Advantage+ ads, `audience-plan`, `ugc-koc-brief` if they work with KOCs,
  and `promo-calendar`.
  `new-template` and `motion-craft` belong in a kit checkout rather than a generated agent:
  they edit `video-templates/` and the gates around it, which a downstream agent does not own.
- **Skills from elsewhere** (optional): `node scripts/install-skills.mjs --list` shows an SEO
  auditor, design skills, Opus 5.5 code-video & media skills (`opus-55-videos`,
  `opus-video-skills`, `opus-video-styles`, `motion-video-kit`, `explainroo`, `video-lens`),
  and marketing skills, fetched on demand rather than vendored. Suggest `seo` and
  `mkt-context` (plus `opus-55-videos` and `opus-video-styles` for video agents) as the ones
  with the broadest payoff. On Antigravity, tell the user the scheduled task
  should say "Read PLAYBOOK.md and execute today's phase".

## Phase 4 — Wire & verify
- `node -c` each generated `.mjs`; `python -m py_compile crawl.py` if present.
- Run each script with `--help` to confirm it loads (env-only; missing env → clear error).
- **Check one real caption** through `node scripts/social/validate-post.mjs <file> --strict`.
  Captions render no Markdown, so a `##` heading or a `Meta:`/`Slug:` block reaches the reader
  verbatim. `make-post.mjs` refuses to send text that fails, so a writer who does not know
  this will hit the wall at publish time rather than at write time.
- Grep the generated project for accidental secrets (see `docs/09-security.md`).
- Show the user: the file tree created, how to fill `.env`, and how to trigger the first run.

## Guardrails
- **Never hardcode a secret.** If the API needs a token, reference an env var and add it to
  `.env.example`.
- **Always include the review gate** in the generated PLAYBOOK §2b.
- **Copyright**: if crawling, excerpt-only + original writing; prefer public-domain.
- **Never leave someone else's brand in a slot default.** Templates ship with empty brand
  fields on purpose: an empty slot is removed, a leftover one is published on the user's
  video. This has been fixed twice; do not reintroduce it.
- **Look at the output.** After the first render, run `contact-sheet.mjs` and actually look.
  Two templates once rendered landscape inside a 9:16 video with the render succeeding and
  the validator passing — only the contact sheet caught it.
- Keep it "little but high quality" — a tight cadence beats volume.

> Antigravity note: this file is also a plain instruction doc. Follow the phases directly;
> "copy skills into `.claude/skills/`" becomes "keep the `SKILL.md` files as reference docs
> the scheduled agent reads."
