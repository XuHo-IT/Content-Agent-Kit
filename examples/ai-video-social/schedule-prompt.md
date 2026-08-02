# Schedule prompt — AI Video Social Agent

> Paste into your scheduled task (Antigravity daily task / `/daily-run` / a local
> `schtasks` job). This is the daily trigger.
>
> ⚠️ Run this on a machine with **FFmpeg + Chrome + a running OmniVoice server**.
> GitHub Actions cannot render — it only does the crawl.

---

Read and execute **examples/ai-video-social/PLAYBOOK.md** for today.

- Pull ideas: `node scripts/queue-client.mjs pull` (empty → pick 1–2 hot AI/tech topics).
  Prefer stories with a hard number in them — most templates are built to land one figure.
- Fan out 1–2 subagents, one video each. Every writer **must read `VIDEO_CRAFT.md` first**
  (§2 bảng đọc số tiếng Việt, §3 nhịp, §4 chọn template) and `video-templates/CATALOG.md`,
  then write `brain/<slug>/script.json`: 8–12 scenes, 270–360 words total, 25–40 words per
  body scene, at least one scene on the downside/limitation.
- **Validate before rendering** — it costs seconds, a bad render costs 3–5 minutes:
  `node scripts/video/validate-script.mjs brain/<slug>/script.json --strict` → must be clean.
- **Render now, not at the posting slot**: `node scripts/video/render.mjs brain/<slug>/script.json`.
  Keep the `VIDEO=` path it prints.
- Write the caption separately from the narration: `post` (emoji + hashtags fine), `comment`
  (source + link), `title` (≤100 chars, for YouTube), `hashtags`.
- **REVIEW gate is mandatory**: independent review subagent per video, scoring `VIDEO_CRAFT.md`
  §7. Fail → fix (2–3 rounds) → drop + log.
- Check `history.json` for duplicates. Never brand as "(AI)".
- Check the payload free of charge, then schedule:
  `node scripts/social/make-post.mjs --video brain/<slug>/video.mp4 --post … --dry-run`
  → `node scripts/scheduler/build-queue.mjs items.json --windows 2 --gap 240 --out queue.json`
  → `register-tasks.mjs`. Queue items are `type:"video"` carrying `videoPath` + `platforms`,
  so the slot itself is just an upload + webhook call.
- Mark each used source: `node scripts/queue-client.mjs posted "<source_url>"`.
- Clean scratch (`items.json`, `video-silent.mp4`, `voice-raw.mp3`); **keep** `voice/` and
  `clips/` so a re-render stays incremental. Report → `brain/<slug>/report.md`.

⚠️ No digits in `voiceText`. No verbatim copy/translation of sources. Never hardcode secrets
(env-only). Never delete the `NOTICE.md` files under `video-templates/`.
