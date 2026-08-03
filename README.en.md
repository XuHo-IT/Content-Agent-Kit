<div align="center">

# content-agent-kit

**Tell an agentic IDE what you want to publish. It reads this repo and builds the agent.**

[![CI](https://github.com/XuHo-IT/Content-Agent-Kit/actions/workflows/ci.yml/badge.svg)](https://github.com/XuHo-IT/Content-Agent-Kit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg?style=flat-square)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-zero-0ea5e9?style=flat-square)](#zero-dependencies-on-purpose)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](#requirements)
[![Discussions](https://img.shields.io/badge/Discussions-join-a855f7?style=flat-square&logo=github)](https://github.com/XuHo-IT/Content-Agent-Kit/discussions)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-f59e0b?style=flat-square)](CONTRIBUTING.md)

[Tiếng Việt](README.md) · **🌐 English**

</div>

---

A reusable kit for bootstrapping **autonomous content agents** in agentic IDEs
(**Claude Code** and **Antigravity / Gemini**). Clone it, tell the AI what you want to build,
and it reads this repo to scaffold a project-specific agent: a *playbook* (the source of
truth), state files, publish scripts, an optional crawl-discovery pipeline, social posting,
scheduling, a pre-publish review gate — and, if you want them, **9:16 videos with real
narration, stock footage and web screenshots**.

## See the output first

Before deciding whether to build an agent, look at what one produces. **One source** —
Anthropic's Claude Fable 5 announcement — became **two formats**:

| | |
|---|---|
| 📄 **[Sample article](examples/ai-news-social/sample-output/)** | 990 Vietnamese words with SEO Meta/Slug and an engagement comment, plus how it scores against all 10 rubric criteria |
| 🎬 **[Sample video](examples/ai-video-social/sample-output/)** | 2 min 12 s · 1080×1920 · real Vbee narration · Pexels B-roll · live screenshot of the source page |

[![All 15 scenes of the sample video](examples/ai-video-social/sample-output/contact-sheet.jpg)](examples/ai-video-social/sample-output/)

**[▶️ Download the mp4 (15.5 MB)](https://github.com/XuHo-IT/Content-Agent-Kit/releases/tag/v0.1.0)**
· or regenerate it yourself: `node scripts/video/render.mjs examples/ai-video-social/sample-output/script.json`

The same story also exists as a **[white-canvas, ocean-blue cut](examples/ai-video-social/sample-output-paper-blue/)**
— 16 scenes across all 14 templates, repainted entirely by `"theme": "paper-blue"`:
**no forked template, and not one line of CSS edited in `video-templates/`.**

## The operating model

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

 (optional) a VIDEO item takes two extra hops before the gate:
     script.json → validate-script.mjs → resolve media ──► render.mjs → video.mp4
     (AI writes)   schema + craft rules   Pexels/Pixabay    TTS · SFX · templates
                                          + screenshots     · ffmpeg
```

**Core ideas**, extracted from real running agents:

1. **Playbook = single source of truth.** The agent re-reads `PLAYBOOK.md` every run — it never relies on chat memory.
2. **Flat-file state.** `queue.json` (schedule), `ledger.json` (in-progress work), `history.json` (dedup). Every operation is **idempotent** — a `409` means "already done".
3. **Review gate.** Every item passes an **independent review subagent** before publishing; fail → fix (2–3 rounds) → drop and report.
4. **Craft is enforced, not hoped for.** A `WRITING_CRAFT.md` (per-genre voice, banned clichés, before/after pairs) is read *before* writing, and its **measurable rubric** is scored *before* publishing. That is what keeps output from reading like AI.
5. **Discovery (optional).** A `crawl4ai` crawler feeds an **idea queue**; the server is the dedup memory, because CI runners are ephemeral.
6. **Scheduling.** GitHub Actions `cron` is the default; Windows `schtasks` and an in-process scheduler are alternatives.
7. **Env-only secrets.** No token, webhook or URL is ever hardcoded. `.env` is git-ignored, and a missing variable fails loudly instead of falling back.
8. **Video (optional).** The AI writes *content* (`script.json` — narration plus template choices); deterministic code renders *pixels*. A pre-render validator turns the authoring rules into machine-checked errors, so a bad script fails in seconds instead of after a five-minute render.

## Quickstart

**Claude Code**

1. Clone this repo next to (or into) your project.
2. Copy the skills: `cp -r skills/* .claude/skills/` (or point Claude Code at them).
3. Run the meta-skill **`/bootstrap-content-agent`** — the AI interviews you and scaffolds a new agent.

**Antigravity / Gemini**

1. Clone this repo into your workspace.
2. Tell the agent: *"Read `AGENTS.md` and `docs/`, then build me an agent that does X."*
3. It follows `skills/bootstrap-content-agent/SKILL.md` as a plain instruction document.

Day to day, run **`/daily-run`** — or your generated `schedule-prompt.md` on a cron.

## What's inside

| Path | Purpose |
|---|---|
| `docs/` | The methodology, bilingual EN + VI, 19 short documents — including **`12-writing-craft.md`**, `14-video-generation.md`, **`15-media-sources.md`** (B-roll and screenshots), **`16-template-registry.md`**, **`17-skills-registry.md`**, **`18-ads-and-marketing.md`** and **`19-design-canva.md`**. |
| `templates/` | Fill-in scaffolds: `PLAYBOOK`, **`WRITING_CRAFT`**, **`VIDEO_CRAFT`**, `KNOWLEDGE`, **`VIDEO_SCRIPT.json`**, `sources.yaml`, state files, cron workflow. |
| `scripts/` | Generic **working** CLIs: publish/append/update, queue client, `social/make-post` (image **or video**, multi-platform), `crawl/crawl.py`, `audit-quality`, the scheduler, **`video/`** (validate, render, `tts-check`, `contact-sheet`, `add-template`) and **`media/`** (stock B-roll, web screenshots, upload hosts). All env-only. |
| `video-templates/` | 14 single-file HTML video templates plus **`CATALOG.md`** — every slot and character limit. Each carries its own CSS and animation, but still `<link>`s its fonts from Google Fonts, so rendering needs network. 146 more are one command away. |
| `skills/` | Claude Code skills: **`bootstrap-content-agent`** (the meta-skill), `daily-run`, `review-gate`, `audit-and-fix`, `crawl-and-queue`, **`create-video`**, **`video-and-post`**, **`research-and-capture`**. |
| `examples/ai-news-social/` | A complete worked example: an AI-news social agent (crawl → write → image → web + Make.com → cron). |
| `examples/ai-video-social/` | The video counterpart: crawl → `script.json` → render 9:16 → TikTok / Shorts / Reels. |

## Video

Optional, and **entirely inside this repo** — no external service, no sibling project.

```bash
node scripts/video/tts-check.mjs                                          # hear the voice first
node scripts/video/validate-script.mjs brain/<slug>/script.json --strict  # seconds
node scripts/video/render.mjs          brain/<slug>/script.json           # ~3–5 min
node scripts/video/contact-sheet.mjs   brain/<slug>/video.mp4             # then look at it
node scripts/social/make-post.mjs --video brain/<slug>/video.mp4 \
     --post caption.txt --platforms tiktok,youtube_shorts --dry-run
```

**Voices.** `omnivoice` (local, free) · `elevenlabs` · `vbee` · `fptai` · `viettel` · `http`
(a generic adapter that describes any other HTTP TTS API purely through env vars). Only the
local one needs a server — **the rest need just an API key**. `tts-check.mjs --providers`
lists them offline. Narration is fingerprinted by provider, voice, speed and text, so changing
voice regenerates exactly what it should and nothing more; `render.mjs --estimate` shows
billable characters before you spend them.

**Real footage and real screenshots**, so a video is not text slides read aloud. A scene can
carry a `media` block — a stock clip from Pexels or Pixabay, or a captured web page as evidence:

```bash
node scripts/media/stock-search.mjs --query "data center servers"   # shows what each clip IS
node scripts/media/screenshot.mjs --url "https://…" --out shot.png  # headless Chrome, no deps
```

A search resolves once and is pinned in `media-lock.json` beside the script, so the same
`script.json` keeps producing the same video — and that file doubles as the record of where
every clip came from. Guide: **[`docs/15-media-sources.md`](docs/15-media-sources.md)**.

**Look at what came out.** `contact-sheet.mjs` puts one labelled frame per scene in a single
image. Four defects reached a finished video that no rule could catch — off-topic B-roll, a
doubled headline, a repeated comparison label, a word broken mid-syllable — and all four were
obvious in one glance.

**One palette for the whole video.** Almost every template ships dark. Adding
`"theme": "paper-blue"` recolours all of them to a white canvas with ocean-blue ink — in a
**throwaway copy**, leaving the vendored templates untouched. Accents are darkened until they
clear 3:1 against the canvas, and `mix-blend-mode: screen` flips to `multiply` (screen over
white paints white, so the effect would vanish without an error). Which way to flip is
**measured with Chrome**, not guessed from CSS:

```bash
node scripts/video/theme-probe.mjs --preview paper-blue   # 14 before/after stills, ~40s
```

**More visual variety.** `node scripts/video/add-template.mjs --preset news` pulls transitions,
animated captions, lower-thirds and charts from the upstream
[HyperFrames registry](https://github.com/heygen-com/hyperframes) (146 items, Apache-2.0).
Guide: **[`docs/16-template-registry.md`](docs/16-template-registry.md)**.

Full guide: **[`docs/14-video-generation.md`](docs/14-video-generation.md)**.

## Requirements

| | When |
|---|---|
| **Node ≥ 18** | always |
| Python 3.12 + `scripts/crawl/requirements.txt` | only if you crawl for ideas |
| **FFmpeg + ffprobe** and **Chrome/Chromium** | only for the video pipeline |
| A TTS API key *or* a local OmniVoice server | only to render a real video |

Rendering needs a real machine — **GitHub Actions cannot do it**. See
[`docs/06-scheduling.md`](docs/06-scheduling.md).

### Zero dependencies, on purpose

There is **no `package.json` and no `node_modules`**. Everything runs on a bare Node install,
which is what lets the kit be copied into any project and read by any agentic IDE without a
setup step. The one piece that cannot reasonably be reimplemented — the HTML→MP4 renderer —
is fetched by `npx` at render time and pinned to a version.

That constraint is load-bearing, not decorative: AWS SigV4 signing for Cloudflare R2, for
instance, is written against `node:crypto` and verified against AWS's own published test
vector (`node scripts/media/host-check.mjs --selftest`).

## Safety

- **Never commit `.env`.** Scripts read env only; a missing variable gives a clear error, never a silent fallback.
- **The Make.com webhook URL *is* the secret** — it carries no auth header. Treat it like a password.
- **Copyright:** the crawler stores **excerpts only** (≤1500 characters) plus a source link, never full text. Adapt and summarise in your own words.

Full model, and how to report a vulnerability: **[`SECURITY.md`](SECURITY.md)**.

## Contributing

The most useful contributions come from people who have actually run it — a voice provider in
your country, a new template, or a craft rule you keep seeing the AI break. **There is no setup
step**: clone and run. CI runs offline with no keys.

- 🐛 Bugs and proposals → [Issues](https://github.com/XuHo-IT/Content-Agent-Kit/issues)
- 💬 Questions, show off the agent you built, half-formed ideas → [Discussions](https://github.com/XuHo-IT/Content-Agent-Kit/discussions)
- 📋 Conventions and the verification commands → [`CONTRIBUTING.md`](CONTRIBUTING.md)
- 🔐 Security issues → **do not open an issue**, see [`SECURITY.md`](SECURITY.md)

**Unverified adapters.** Cloudflare R2, Cloudinary and Viettel AI were written from official
documentation but have **never been run against real credentials**. They say so themselves in
`host-check.mjs --hosts` and `tts-check.mjs --providers`. If you have an account and can confirm
one works, a PR flipping that flag is a genuinely valuable contribution.

## License

MIT — see [`LICENSE`](LICENSE).

The video pipeline and templates derive from MIT / Apache-2.0 open source
([AI-auto-generate-video](https://github.com/huytranvan2010/AI-auto-generate-video),
[nexu-io/html-video](https://github.com/nexu-io/html-video),
[heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)). Attribution lives in
**[`NOTICE.md`](NOTICE.md)** and in each `video-templates/*/NOTICE.md`, and the full Apache-2.0
text is at [`LICENSES/Apache-2.0.txt`](LICENSES/Apache-2.0.txt) — keep those files, they are a
licence condition rather than a courtesy.
