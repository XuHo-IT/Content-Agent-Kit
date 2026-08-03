---
name: design-campaign
description: Produce campaign visuals in Canva through the Canva MCP server and hand the exported files to this kit's posting and video pipelines, for an agent built with content-agent-kit. Use when the user asks for a post image, a carousel, a thumbnail, a cover, or "make the visuals for this campaign". Exports a real file path, not a Canva link.
---

# Campaign visuals via Canva

The kit can already put an image on a post and inside a video frame. What it could not do
is *make* one — stock search finds photographs, screenshots capture a page, and neither
produces a branded campaign visual.

This does that in Canva and hands back **a file on disk**, because everything downstream —
`make-post.mjs`, `video/render.mjs` — takes a path or a URL, not a Canva design link.

## Before you start

The `canva` server in `.mcp.json` must be connected (`/mcp` in Claude Code). If it is not,
say so and stop — do not silently fall back to a stock photo and call it a campaign visual.

**Know the plan limits before designing around them:**

| Capability | Plan |
|---|---|
| Generate, edit, search, upload, comment, export | any, including free |
| Resize a design to another aspect | Pro and above |
| Autofill a template from data | Enterprise |

Autofill is an accelerator, never a required step. If it is unavailable, generate and edit
directly — the output is the same, it just takes more turns. **Design the workflow for the
free plan** and use the rest when it is there.

## 1. Decide the sizes before opening Canva

Resizing is a paid feature, so producing the wrong canvas costs a redo. Ask what the asset
is for, then create at the final size:

| Use | Canvas | Where it goes |
|---|---|---|
| Post image | 1080 × 1080 | `make-post.mjs --image` |
| Story / Reel cover | 1080 × 1920 | `make-post.mjs --thumbnail` |
| Video frame asset | 1080 × 1920 (9:16) or 1920 × 1080 (16:9) | a `scene.inputs` image slot |
| Carousel | 1080 × 1080 × N | one call per slide |

Match the aspect of the video the asset is going into. A 16:9 image dropped into a 9:16
frame is either letterboxed or cropped through the subject, and neither is decided by you.

## 2. Use the brand that already exists

Check, in this order, and stop at the first that answers:

1. the project's `PLAYBOOK.md` — brand colours and voice usually live there
2. `video-templates/theme-map.json` — if the video side already has a theme, the image must
   match it or the two will not sit together in one post
3. the `brandkit` skill, if installed (`node scripts/install-skills.mjs brandkit`)
4. the Canva brand kit on the account

Never invent a palette when one of these has an answer. A post whose image and video
disagree about the accent colour reads as two different accounts.

## 3. Export to the working directory

Export into `brain/<slug>/` beside that item's other artifacts, matching where
`create-video` and `research-and-capture` already put things:

```
brain/<slug>/
├── script.json
├── shots/
└── design/
    ├── post-1080.png
    └── cover-1080x1920.png
```

PNG for anything with text — JPEG artefacts around type are visible at the sizes social
platforms re-encode to. JPEG only for a photographic background with no overlaid text.

## 4. Hand off

```bash
# post image
node scripts/social/make-post.mjs --post caption.txt --image brain/<slug>/design/post-1080.png

# video cover
node scripts/social/make-post.mjs --video brain/<slug>/video.mp4 \
  --thumbnail brain/<slug>/design/cover-1080x1920.png --post caption.txt
```

For an asset used *inside* a video, put the exported path in the scene's image input and
re-run `validate-script.mjs` before rendering — a missing file fails five minutes into a
render otherwise.

## 5. Report what you made

Append to `brain/<slug>/report.md`: what was designed, the canvas size, where it was
exported, and the Canva design id. The id is what makes the asset editable later; without
it a revision means starting over.

## What not to do

- **Do not put a Canva share link where a file path belongs.** Downstream scripts upload a
  file or fetch a URL; a design link is neither, and it fails at the webhook rather than here.
- **Do not design at one size and resize later** unless the account has Pro. Plan the canvas.
- **Do not put the whole caption in the image.** Text in an image is not searchable, not
  translatable and not readable to a screen reader. The caption field exists.
- **Do not use someone else's brand assets** because they were in the template. That is the
  same mistake the vendored video templates shipped with — a default that quietly published
  another project's URL on your video.
