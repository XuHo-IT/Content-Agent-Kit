# Make.com blueprints

Importable scenarios for the payload `scripts/social/make-post.mjs` sends. The full payload
contract — every field, both languages — is `docs/11-social-posting.md`. These files exist
because that document describes a shape and leaves you to build the scenario by hand.

**Nothing secret is in here.** Hook ids, connection ids and page ids are `null` or `""`; you
supply them on import. Keep it that way — a webhook URL in a committed file is a webhook anyone
who clones the repo can post to your Page with.

---

## `facebook-video-url.blueprint.json`

One Facebook Page, video + pinned-worthy first comment. Three modules:

```
Webhook  →  Facebook Pages: Upload a Video  →  Facebook Pages: Create a Comment
   1                    2                                    3
```

| module 1 receives | goes to |
|---|---|
| `mediaUrl` | module 2 → `url` (Type = **download a video from URL**) |
| `post` | module 2 → `description` |
| `comment` | module 3 → `message` |

`kind`, `title`, `hashtags`, `durationSec` and `platforms` also arrive and are simply unused
here — `make-post.mjs` always sends them. Leaving them unmapped costs nothing and means you can
add a Router later without changing the kit side.

### Setup

1. **Import** — Make → Scenarios → *Create a new scenario* → ⋯ → *Import Blueprint*.
2. **Module 1** — click the webhook, *Add*, name it, **copy the URL into `MAKE_WEBHOOK_URL` in
   your `.env`.** Never into a file you commit.
3. **Modules 2 and 3** — pick your Facebook connection, then pick the **same Page** in both.
   The blueprint deliberately ships these blank.
4. **Check the wiring.** After an import the trigger can land detached — Make shows *"This
   module is not connected to the flow. This module and everything after it will be skipped
   during execution."* If you see that, drag 1 → 2 → 3 back together. A detached scenario
   accepts your POST and silently does nothing, which looks exactly like success from the kit
   side.
5. **Teach Make the payload shape** — with the scenario listening, send a real one:
   ```bash
   node scripts/social/make-post.mjs --json brain/<slug>/post.json --dry-run   # read it first
   node scripts/social/make-post.mjs --json brain/<slug>/post.json             # then send
   ```
   Every field becomes mappable by name. Skip this and you hand-type field names.
6. **Run once, with a real video, and check the Page.**

### Two things that bite

**The comment is a separate module, and it needs a different id.** Module 2 returns a **video
id**; *Create a Comment* wants a **post id** (`<page>_<post>`). Mapping `{{2.id}}` straight in
is what the blueprint does because it is the common case, but if the comment never appears
while the video posts fine, this is why — the failure is silent and the symptom is a published
video with its sources missing. Fix by resolving the post id before module 3.

**`Type: url` means Facebook fetches the file itself,** so `mediaUrl` must be publicly
reachable. `make-post.mjs` handles that: pass a local path and it uploads to `MEDIA_HOST` first
and puts the resulting URL in the payload. The alternative — pulling the file through Make with
*HTTP → Get a file* and passing binary — costs an operation, and a 20 MB+ video through a Make
operation is the most fragile step in the chain. Prefer the URL form.

### There is no shared secret on this webhook

Anyone with the URL can post to your Page. If that matters, add a `key` field to the payload,
a **Filter** between modules 1 and 2 comparing it to a secret, and send it from your own
wrapper. Not wired here because the kit's payload has no `key` field — decide deliberately
rather than discovering it later.

---

## Adding more platforms

Keep this scenario and add a **Router** after module 1, filtering each route on `platforms[]`
*Array contains* `facebook_reels` / `tiktok` / `youtube_shorts` / `instagram_reels`. The kit
already sends `platforms`, so nothing changes on this side. Step-by-step:
`docs/11-social-posting.md` §"Building the Make scenario".
