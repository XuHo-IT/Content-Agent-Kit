# content-agent-kit

[![CI](https://github.com/XuHo-IT/Content-Agent-Kit/actions/workflows/ci.yml/badge.svg)](https://github.com/XuHo-IT/Content-Agent-Kit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg?style=flat-square)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-zero-0ea5e9?style=flat-square)](#)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](#)
[![Discussions](https://img.shields.io/badge/Discussions-join-a855f7?style=flat-square&logo=github)](https://github.com/XuHo-IT/Content-Agent-Kit/discussions)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-f59e0b?style=flat-square)](CONTRIBUTING.md)

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

 (optional) a VIDEO item takes one extra hop before the gate:
     script.json → validate-script.mjs → render.mjs → video.mp4 → TikTok · Shorts · Reels
     (AI writes)   schema + craft rules   TTS · SFX · HTML templates · ffmpeg
```

**Core ideas** (extracted from real running agents):
1. **Playbook = single source of truth.** The agent re-reads `PLAYBOOK.md` every run — never relies on chat memory.
2. **Flat-file state.** `queue.json` (schedule), `ledger.json` (in-progress work), `history.json` (dedup). Operations are **idempotent** (a `409 = already done`).
3. **Review gate.** Every item passes an **independent review subagent** before publishing; fail → fix (2–3 rounds) → drop + report.
4. **Craft is enforced.** A `WRITING_CRAFT.md` (per-genre voice, banned clichés, before/after examples) is read *before* writing, and its **measurable rubric** is scored *before* publishing — that's what keeps output from reading like AI.
5. **Discovery (optional).** A `crawl4ai` crawler feeds an **idea queue**; the server is the dedup memory (CI runners are ephemeral).
6. **Scheduling.** `cron` (GitHub Actions) is the default; Windows `schtasks` / in-process are alternatives.
7. **Env-only secrets.** No token/webhook/URL is ever hardcoded. `.env` is git-ignored.
8. **Video (optional).** The AI writes *content* (`script.json` — narration + template choices);
   deterministic code renders *pixels*. A pre-render validator turns the authoring rules
   (Vietnamese TTS number spelling, scene pacing, template variety) into machine-checked errors,
   so a bad script fails in seconds instead of after a 5-minute render.

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
| `docs/` | The methodology (bilingual EN + VI), 16 short docs — incl. **`12-writing-craft.md`**, `14-video-generation.md`, **`15-media-sources.md`** (B-roll + screenshots), **`16-template-registry.md`**. |
| `templates/` | Fill-in scaffolds: `PLAYBOOK`, **`WRITING_CRAFT`**, **`VIDEO_CRAFT`**, `KNOWLEDGE`, **`VIDEO_SCRIPT.json`**, `sources.yaml`, state, cron workflow. |
| `scripts/` | Generic **working** CLI: publish/append/update, queue client, `social/make-post` (image **or video**, multi-platform), `crawl/crawl.py`, `audit-quality`, scheduler, and **`video/`** (validate + render + `tts-check` + `add-template`) and **`media/`** (stock B-roll + web screenshots). All env-only. |
| `video-templates/` | 14 self-contained HTML video templates + **`CATALOG.md`** (every slot and character limit) — incl. B-roll, framed-media and web-screenshot frames. 146 more are one command away (`add-template.mjs`). |
| `skills/` | Claude Code skills: **`bootstrap-content-agent`** (the meta-skill), `daily-run`, `review-gate`, `audit-and-fix`, `crawl-and-queue`, **`create-video`**, **`video-and-post`**, **`research-and-capture`**. |
| `examples/ai-news-social/` | A complete worked example: an AI-news social agent (crawl → write → image → web + Make.com → cron). |
| `examples/ai-video-social/` | The video counterpart: crawl → `script.json` → render 9:16 → TikTok / Shorts / Reels. |

## Video / Tạo video

Optional, and **entirely inside this repo** — no external service, no sibling project.

```bash
node scripts/video/tts-check.mjs                                          # hear the voice first
node scripts/video/validate-script.mjs brain/<slug>/script.json --strict  # seconds
node scripts/video/render.mjs          brain/<slug>/script.json           # ~3–5 min
node scripts/social/make-post.mjs --video brain/<slug>/video.mp4 \
     --post caption.txt --platforms tiktok,youtube_shorts --dry-run
```

**Still zero dependencies** — there is no `package.json` and nothing to install. The one piece
that cannot be reimplemented (the HTML→MP4 renderer) runs via `npx` at render time.

**Voices:** `omnivoice` (local, free) · `elevenlabs` · `vbee` · `fptai` · `viettel` · `http`
(a generic adapter that describes any other HTTP TTS API purely in env vars). Only the local
one needs a server — **the rest need just an API key**. `node scripts/video/tts-check.mjs
--providers` lists them offline. Narration is fingerprinted by provider/voice/speed/text, so
changing voice re-generates exactly what it should and nothing more; `--estimate` on
`render.mjs` shows billable characters before you spend them.

**Real footage and real screenshots**, so a video isn't text slides read aloud. A scene can
carry a `media` block — a stock clip from Pexels/Pixabay, or a captured web page as evidence:

```bash
node scripts/media/stock-search.mjs --query "data center servers"   # shows what each clip IS
node scripts/media/screenshot.mjs --url "https://…" --out shot.png  # headless Chrome, no deps
```

A search is resolved once and pinned in `media-lock.json` next to the script, so the same
`script.json` keeps producing the same video — and that file doubles as the record of where
every clip came from. Guide: **`docs/15-media-sources.md`**.

**More visual variety:** `node scripts/video/add-template.mjs --preset news` pulls transitions,
animated captions, lower-thirds and charts from the upstream
[HyperFrames registry](https://github.com/heygen-com/hyperframes) (146 items, Apache-2.0).
Guide: **`docs/16-template-registry.md`**.

Needs on the render machine: **FFmpeg + ffprobe**, **Chrome/Chromium**, and a voice.
GitHub Actions cannot do this step — see `docs/06-scheduling.md`.
Full guide: **`docs/14-video-generation.md`**.

## Safety / An toàn
- **Never commit `.env`.** Scripts read env only; missing env → a clear error, no silent fallback.
- **The Make.com webhook URL *is* the secret** — it carries no auth header. Treat it like a password.
- **Copyright:** the crawler stores **excerpts only** (≤1500 chars) + a source link — never full text. Adapt/summarize in your own words.

Full model, and how to report a vulnerability: **[`SECURITY.md`](SECURITY.md)**.

## Contributing / Đóng góp

Đóng góp có giá trị nhất thường đến từ người đã thực sự chạy nó — một nhà cung cấp giọng ở nước
bạn, một template mới, hay một luật craft mà bạn thấy AI hay vi phạm. **Không có bước cài đặt**:
clone rồi chạy, CI cũng chạy offline không cần key.

- 🐛 Lỗi hoặc đề xuất → [Issues](https://github.com/XuHo-IT/Content-Agent-Kit/issues)
- 💬 Hỏi đáp, khoe agent bạn dựng, bàn ý tưởng → [Discussions](https://github.com/XuHo-IT/Content-Agent-Kit/discussions)
- 📋 Quy ước và lệnh kiểm chứng → [`CONTRIBUTING.md`](CONTRIBUTING.md)
- 🔐 Lỗi bảo mật → **đừng mở issue**, xem [`SECURITY.md`](SECURITY.md)

**Adapter chưa kiểm chứng:** Cloudflare R2, Cloudinary và Viettel AI được viết theo tài liệu
chính thức nhưng chưa từng chạy với credential thật — chúng tự khai `UNVERIFIED` trong
`host-check.mjs --hosts` và `tts-check.mjs --providers`. Bạn có tài khoản và xác nhận được thì
PR đổi cờ đó là đóng góp rất được việc.

## License
MIT — see [`LICENSE`](LICENSE).

The video pipeline and templates derive from MIT / Apache-2.0 open source
([AI-auto-generate-video](https://github.com/huytranvan2010/AI-auto-generate-video),
[nexu-io/html-video](https://github.com/nexu-io/html-video)). Attribution is in **`NOTICE.md`**
and in each `video-templates/*/NOTICE.md` — keep those files; they are a licence condition.
