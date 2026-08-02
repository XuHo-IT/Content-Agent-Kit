# Example — AI Video Social Agent

A complete worked agent: **AI/tech news → 9:16 short with Vietnamese narration → TikTok /
YouTube Shorts / Facebook Reels / Instagram Reels via Make.com.**

The video counterpart of [`../ai-news-social/`](../ai-news-social/). That one writes articles
and posts an image; this one writes a narration script and posts a video.

```
[cron on GitHub Actions]           [your machine — FFmpeg + Chrome + OmniVoice]
        │                                        │
  crawl.py ──► idea queue ──────────────────────►│
   sources.yaml   (server = dedup memory)        │
                                                 ▼
                              read VIDEO_CRAFT.md + video-templates/CATALOG.md
                                                 ▼
                                          brain/<slug>/script.json
                                                 ▼
                                validate-script.mjs --strict   ← seconds; blocks bad scripts
                                                 ▼
                                render.mjs   TTS → SFX → templates → ffmpeg   (~3–5 min)
                                                 ▼
                                        brain/<slug>/video.mp4
                                                 ▼
                                      REVIEW gate (VIDEO_CRAFT §7)
                                                 ▼
                          queue.json  type:"video" + videoPath ──► schtasks
                                                 ▼
                    make-post.mjs ──► MAKE_WEBHOOK_URL ──► Make Router ──► 4 platforms
```

## Files

| File | What it is |
|---|---|
| `PLAYBOOK.md` | The SOP the agent re-reads every run — cadence, review gate, schema, cleanup |
| `VIDEO_CRAFT.md` | Written in Vietnamese: the two text channels, the number table, pacing, template choice, the channel's voice, banned clichés, before/after pairs, §7 rubric |
| `KNOWLEDGE.md` | The Make.com payload + Router shape, media-host limits, the OmniVoice contract, and the gotchas that actually bite |
| `schedule-prompt.md` | The daily trigger to paste into your scheduled task |
| `sources.yaml` | Crawl sources (placeholders — point at real listing pages) |
| `.github/workflows/daily.yml` | Cron **crawl only**; rendering cannot run on a hosted runner |

## Setup

1. **Prerequisites on the render machine**
   - FFmpeg + ffprobe on `PATH` (`winget install Gyan.FFmpeg` / `brew install ffmpeg`)
   - Chrome or Chromium
   - **A voice** — either an API key for a cloud provider (ElevenLabs / Vbee / FPT.AI), or an
     **OmniVoice** server at `http://127.0.0.1:8123` accepting `POST /tts {text}` → `audio/mpeg`.
     A key is the quicker route: nothing to install. `node scripts/video/tts-check.mjs
     --providers` lists the options.
   - Node ≥ 18. There is nothing to `npm install` — the kit has no dependencies.

2. **Copy into your project**
   ```
   scripts/            # incl. scripts/video/ and its lib/
   video-templates/    # all 11 templates AND every NOTICE.md  ← licence condition
   NOTICE.md           # root attribution   ← licence condition
   examples/ai-video-social/{PLAYBOOK,VIDEO_CRAFT,KNOWLEDGE}.md
   templates/VIDEO_SCRIPT.template.json
   ```
   On Claude Code also copy `skills/create-video`, `skills/video-and-post`,
   `skills/review-gate`, `skills/daily-run` into `.claude/skills/`.

3. **Fill `.env`** (never commit it)
   ```env
   MAKE_WEBHOOK_URL=
   MEDIA_HOST=cloudinary
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_UNSIGNED_PRESET=
   SOCIAL_PLATFORMS=tiktok,youtube_shorts,facebook_reels,instagram_reels

   # voice — pick ONE
   TTS_PROVIDER=elevenlabs
   TTS_VOICE_ID=
   ELEVENLABS_API_KEY=
   # ...or the free local route:
   # TTS_PROVIDER=omnivoice
   # OMNIVOICE_ENDPOINT=http://127.0.0.1:8123

   SITE_URL=                 # only if crawling
   INGEST_API_TOKEN=         # only if crawling
   ```

4. **Build the Make scenario** — Webhook (custom) → Router with one route per platform,
   filtered on `platforms[] contains "<value>"`. Field mapping table in `KNOWLEDGE.md` §1.

5. **Optional — sound effects**
   ```bash
   node scripts/video/sfx-download.mjs
   node scripts/video/sfx-filter.mjs
   ```
   Skip it and the pipeline renders without SFX.

## First run

Prove the pipeline works before wiring any schedule:

```bash
# 1. confirm the voice works (seconds — do this before any render)
node scripts/video/tts-check.mjs

# 2. render the reference script (should give ~100s of video)
mkdir -p brain/demo && cp templates/VIDEO_SCRIPT.template.json brain/demo/script.json
node scripts/video/validate-script.mjs brain/demo/script.json --strict
node scripts/video/render.mjs brain/demo/script.json --estimate   # what TTS would cost
node scripts/video/render.mjs brain/demo/script.json

# 3. check the payload without spending a Make operation
node scripts/social/make-post.mjs --video brain/demo/video.mp4 \
  --post "test caption" --title "test" --platforms tiktok --dry-run
```

Then run the daily loop: `/daily-run`, or paste `schedule-prompt.md` into your scheduled task.

## Why the crawl is on Actions but the render is not

Rendering needs FFmpeg and a Chromium instance, and costs 3–5 minutes per video. Hosted runners
have neither. So Actions does discovery on a cron, and your own machine does scripting,
rendering and posting — the render happening during the daily run, not at the posting slot, so
the post itself lands on time. See `docs/06-scheduling.md`.

(Using a cloud voice removes the *TTS* server from that list, but not ffmpeg or Chromium — so
the render still belongs on your machine or a self-hosted runner.)

## Attribution

The pipeline and templates derive from MIT / Apache-2.0 open source. Keep `NOTICE.md` at the
root and every `video-templates/*/NOTICE.md` — that is a licence condition, not a courtesy.
