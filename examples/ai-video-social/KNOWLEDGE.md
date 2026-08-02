# AI Video Social Agent — KNOWLEDGE

> Contracts and gotchas for this agent. Env-only — no secret ever appears here.

## 1. Make.com webhook (`MAKE_WEBHOOK_URL`)

`scripts/social/make-post.mjs` POSTs one JSON body. For a video item:

```json
{
  "kind": "video",
  "mediaUrl": "https://res.cloudinary.com/…/video.mp4",
  "video_url": "https://res.cloudinary.com/…/video.mp4",
  "image_url": "",
  "thumbnailUrl": "",
  "post": "caption",
  "comment": "first comment",
  "title": "title for YouTube",
  "hashtags": "#ai #congnghe",
  "aspect": "9:16",
  "durationSec": 96,
  "platforms": ["tiktok", "youtube_shorts", "facebook_reels", "instagram_reels"]
}
```

**Scenario shape:** Webhook (custom) → **Router**, one route per platform, each filtered on
`platforms[] contains "<value>"`:

| Route filter | Module | Maps |
|---|---|---|
| `tiktok` | TikTok → Upload video | `video_url` → video, `post` → caption |
| `youtube_shorts` | YouTube → Upload a video | `video_url`, `title` (**required**), `post` → description |
| `facebook_reels` | Facebook Pages → Create a video post | `video_url`, `post` |
| `instagram_reels` | Instagram for Business → Create a Reel | `video_url` (**must be publicly reachable**), `post` |

**Gotchas**
- The webhook URL *is* the secret — there is no auth header. Never commit it.
- Instagram and TikTok fetch the file from the URL themselves. A signed/expiring URL breaks
  them. Cloudinary and Catbox URLs are both fine.
- YouTube rejects a title over 100 characters. The kit does not truncate it for you.
- Verify the body without spending an operation: add `--dry-run`.

## 2. Media host

`uploadMedia()` in `scripts/lib/http.mjs`, selected by `MEDIA_HOST`:

| Host | Env | Limits |
|---|---|---|
| `cloudinary` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UNSIGNED_PRESET`, `CLOUDINARY_FOLDER` | free tier ≈10 MB image / ≈100 MB video |
| `catbox` | none | 200 MB, no account |

The resource type is part of the Cloudinary path — video goes to `/video/upload`, not
`/image/upload`. `uploadMedia` picks it from the file extension. A file over the limit fails
before the request with a message naming the size and the ceiling.

A 90–120s 1080×1920 h264 CRF-18 video is typically **8–25 MB**, so both hosts work.

## 3. Voice / TTS

Pick with `TTS_PROVIDER`, or per script with the `voice` block in `script.json` (which wins).
Full table: `docs/14-video-generation.md`. Check one before rendering:

```bash
node scripts/video/tts-check.mjs --providers    # what's available, no network
node scripts/video/tts-check.mjs                # speak a sample with your config
```

| Provider | Needs | Shape |
|---|---|---|
| `omnivoice` | a local server at `OMNIVOICE_ENDPOINT` — `POST /tts {text}` → `audio/mpeg` | bytes |
| `elevenlabs` | `ELEVENLABS_API_KEY` + voice_id, `ELEVENLABS_MODEL=eleven_multilingual_v2` | bytes |
| `vbee` | `VBEE_API_KEY` + voice_code | bytes |
| `fptai` | `FPTAI_API_KEY` + one of `banmai lannhi leminh myan thuminh giahuy linhsan` | asyncUrl |
| `viettel` | `VIETTEL_TOKEN` — **experimental**, verify first | asyncUrl |
| `http` | `TTS_HTTP_*` — generic adapter for anything else | either |

**Only `omnivoice` needs a server.** Everything else is an API key, which is the easiest way to
get rendering on a machine you don't want to install a TTS stack on.

**Gotchas**
- The client retries 4× with `[1s, 2s, 4s]` backoff but **never retries a 4xx other than 429** —
  a bad request just repeats. A 401/403 says so explicitly in the error.
- `asyncUrl` providers hand back a link that isn't ready yet. FPT.AI documents 5 seconds to
  2 minutes; the download is polled for about that long before giving up.
- **The duration bug worth keeping:** TTS output is often 24 kHz MPEG-2 Layer III, and
  `ffprobe`'s `format=duration` estimates that from bitrate × filesize — it can be **30%+
  wrong**, which desyncs every scene. `getDurationSec()` counts packets instead.
  Do not "simplify" that.
- **Cloud TTS bills per character.** `render.mjs --estimate` shows what a run would actually
  send. Narration is fingerprinted (provider, voice, speed, model, text hash), so re-running
  costs nothing unless something really changed.

## 4. Video pipeline

Full reference: `docs/14-video-generation.md`. What bites in practice:

- **`voiceText` may not contain a digit.** OmniVoice reads `GPT 5.5` as "năm rưỡi". The
  validator makes this an error, not a warning.
- **Emoji in a character-animated field breaks the animation** — today that is
  `frame-build-minimal`'s `hero`. Also an error.
- **Changing voice does NOT need a manual cache clear.** The fingerprint sidecar
  `voice/scene-<id>.json` catches it and re-generates only the affected scenes.
- Templates are authored at a fixed **5 seconds**; each clip is stretched to its narration by
  freezing the last frame. Very long narration on one scene therefore shows a still frame —
  another reason for the 25–40 word rule.
- Rendering is **idempotent per scene**. Changing `inputs` does *not* re-render on its own —
  delete `clips/scene-<id>.mp4` first. Changing `voiceText` also needs
  `voice/scene-<id>.mp3` deleted.
- `hyperframes` is fetched by `npx` at render time, and templates `<link>` Google Fonts, so the
  first render on a machine needs network.
- `voice.speed` (0.5–2.0) is applied by the provider where it supports one, and with ffmpeg
  where it doesn't — same result either way.

## 5. Idea queue

Same as the article agent: `SITE_URL` + `INGEST_API_TOKEN` against `/api/queue`.
`queue-client.mjs pull | posted <url> | known`. The server is the dedup memory.

## 6. Required env

```
MAKE_WEBHOOK_URL=
MEDIA_HOST=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_UNSIGNED_PRESET=
SOCIAL_PLATFORMS=tiktok,youtube_shorts,facebook_reels,instagram_reels

# voice — pick ONE (see §3). Cloud = just a key; omnivoice = a local server.
TTS_PROVIDER=elevenlabs
TTS_VOICE_ID=
ELEVENLABS_API_KEY=
# ...or: TTS_PROVIDER=omnivoice + OMNIVOICE_ENDPOINT=http://127.0.0.1:8123

SITE_URL=                 # only if crawling
INGEST_API_TOKEN=         # only if crawling
```
