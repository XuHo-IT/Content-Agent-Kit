# NOTICE — third-party attribution

`content-agent-kit` is MIT (see `LICENSE`). The **video generation** capability
(`scripts/video/`, `video-templates/`) is derived from third-party open-source
work. This file records that lineage as those licenses require.

> Bản kit là MIT. Riêng phần **tạo video** được kế thừa từ mã nguồn mở của bên
> thứ ba — file này ghi công theo đúng yêu cầu giấy phép. **Đừng xoá** file này
> hay các `NOTICE.md` trong từng thư mục template.

### Full license texts

| File | Applies to |
|---|---|
| [`LICENSE`](LICENSE) — MIT | the kit itself |
| [`LICENSES/Apache-2.0.txt`](LICENSES/Apache-2.0.txt) | the vendored templates in §2 and §2b |

Apache-2.0 §4(a) requires a copy of the license to travel with the work, so
`LICENSES/Apache-2.0.txt` must ship with any redistribution of this repository.
`LICENSE` is left as unmodified MIT so licence scanners still identify the kit
correctly — the scope split is recorded here instead.

> Bản đầy đủ của các giấy phép nằm trong [`LICENSES/`](LICENSES/). `LICENSE` (MIT)
> áp cho phần kit, `LICENSES/Apache-2.0.txt` áp cho các template vendor ở §2 và §2b.
> Apache-2.0 §4(a) bắt buộc file này đi kèm khi phát hành lại repo.

---

## 1. Video pipeline — `scripts/video/`

**Source:** [huytranvan2010/AI-auto-generate-video](https://github.com/huytranvan2010/AI-auto-generate-video)
**License:** MIT — © 2026 AI Coding, © 2026 Ho Quang Hai
**Itself derived from:** [hoquanghai/Auto-Create-Video](https://github.com/hoquanghai/Auto-Create-Video)

The 8-step pipeline (TTS per scene → concatenate with gaps → mix SFX → render
each template to MP4 → fit each clip to its narration → concatenate → mux) and
the `script.json` contract come from that project.

**Changes made in this kit** (the port is a rewrite, not a copy):

- Rewritten from TypeScript (`src/**/*.ts`, run via `tsx`) to dependency-free
  ESM `.mjs`, so the kit keeps needing **no `package.json` and no `npm install`**.
  `zod` → a hand-written validator, `axios` → global `fetch`, `p-limit` → a small
  inline semaphore, `dotenv` → the kit's existing `scripts/lib/env.mjs`.
- The SFX directory is no longer resolved as `outputDir/../../assets/sfx`
  (upstream `src/render/template-pipeline.ts:85`, which assumed a fixed output
  depth). It now resolves from the module location, overridable via `VIDEO_SFX_DIR`.
- The templates directory is no longer `<src>/../../templates`
  (upstream `src/render/template-composer.ts:10`). It resolves to
  `<kit>/video-templates`, overridable via `VIDEO_TEMPLATES_DIR`.
- Added `scripts/video/validate-script.mjs` — a pre-render gate enforcing both the
  schema and the Vietnamese-TTS / pacing craft rules that upstream documented in
  prose only.
- Dropped upstream dead code (`src/assets/image-fetcher.ts`, and the unused
  `src/utils/slug.ts` wiring).
- Added social publishing, which upstream deliberately does not do.

The upstream MIT license text is reproduced in full at the bottom of this file.

## 1b. Model-leakage catalogue — `scripts/social/lib/clean-text.mjs`

The FORENSIC_RULES catalogue (tool markers, knowledge-cutoff disclaimers, assistant
preambles, unfilled placeholders) is **adapted** from the "forensic tier" of
[sergebulaev/facebook-skills](https://github.com/sergebulaev/facebook-skills), MIT
© 2026 Sergey Bulaev. No code was copied — the patterns were rewritten as JavaScript
regexes against this kit's own `findLeaks` contract — but the idea and the catalogue of
what to look for came from there, and that is worth saying.

Its *strict* tier is deliberately not adopted: it bans em dashes and swaps English
vocabulary, and this kit publishes Vietnamese prose where both rules would fail good
writing. `skills/registry.json` lists the upstream skills for anyone who wants the full
English-language version.

## 2. Video templates — `video-templates/frame-*/`

Eight templates are vendored from
[nexu-io/html-video](https://github.com/nexu-io/html-video) under **Apache-2.0**
(attribution required, commercial use allowed):

`frame-bold-poster` · `frame-build-minimal` · `frame-creative-voltage` ·
`frame-glitch-title` · `frame-liquid-bg-hero` · `frame-logo-outro` ·
`frame-pentagram-stat` · `frame-vignelli`

Three are original to AI-auto-generate-video (MIT, same copyright as §1):

`frame-aicoding-list` · `frame-aicoding-comparison` · `frame-statement-outro`

**Per-template `NOTICE.md` files record each template's own design lineage and
the exact modifications made** (e.g. replacing the Tailwind CDN runtime with
plain CSS for deterministic offline rendering, dropping CJK fonts, adding the
9:16 portrait composition). Apache-2.0 §4 requires those notices to travel with
the work — keep them.

Two more folders are vendored from
[heygen-com/hyperframes](https://github.com/heygen-com/hyperframes), also **Apache-2.0**:

`caption-kinetic-slam` · `transitions-blur`

Neither is usable as a scene template — upstream ships them as a *component* and a *block*
respectively, so `listTemplateIds()` skips them and `validate.mjs` rejects them by name. The
attribution obligation does not depend on whether the code uses them, so their `NOTICE.md`
files stay; each says plainly that deleting the folder is a reasonable call.

Sixty-three are original to content-agent-kit (MIT, same as this repo):

`frame-broll` · `frame-media-inset` · `frame-screenshot` · `frame-review-verdict` ·
`frame-quote-testimonial` · `frame-chart-bars` · `frame-step-list` ·
`frame-kinetic-type` · `frame-product-reveal` · `frame-analog-grain` · `frame-split-compare` ·
`frame-terminal` · `frame-timeline` · `frame-myth-fact` · `frame-checklist` · `frame-chat-bubbles` ·
`frame-node-graph` · `frame-trend-line` · `frame-dashboard` · `frame-hud` ·
`frame-geo-markers` · `frame-geo-route` · `frame-funnel` · `frame-progress` · `frame-draw-on` ·
`frame-3d-device` · `frame-3d-flip` · `frame-3d-stack` · `frame-3d-spotlight` ·
`frame-vox-highlighter` · `frame-vox-collage` · `frame-vox-data-callout` ·
`frame-vox-split-screen` · `frame-vox-investigation-board` · `frame-vox-pull-quote` ·
`frame-diagram-flywheel` · `frame-diagram-quadrant` · `frame-diagram-radar` · `frame-diagram-architecture` ·
`frame-geo-local-card` · `frame-geo-region-stat` · `frame-geo-faq-direct` ·
`frame-geo-itinerary` · `frame-geo-versus-city` · `frame-geo-pin-detail` ·
`frame-ui-glass-dashboard` · `frame-ui-terminal-ide` ·
`frame-math-manim` · `frame-diagram-flowchart` · `frame-whiteboard-doodle` · `frame-fitness-workout` ·
`frame-canvas-gauge-dial` · `frame-3d-perspective-card` · `frame-presentation-slide` · `frame-2d-sprite-mascot` ·
`frame-vox-declassified` · `frame-vox-newspaper-tear` · `frame-geo-heatmap` · `frame-geo-sonar-radar` ·
`frame-math-graph-plot` · `frame-math-matrix-calc` · `frame-hybrid-vox-geo` · `frame-hybrid-math-diagram`

`frame-3d-spotlight` was written after reading how vibe-motion's `light-spotlight-render`
describes the effect. No code was taken: that repository publishes no licence, and this kit
does not carry unlicensed work even where `scripts/install-skills.mjs` may fetch it to a
user's own machine — the distinction §3 draws between invoking and bundling.

Some templates further credit MIT-licensed design lineage:
[zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides)
(© Zara Zhang) and huashu-design (© alchaincyf). See the individual `NOTICE.md`.

## 2b. Templates pulled from the HyperFrames registry

`scripts/video/add-template.mjs` fetches items from
[heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) — **Apache-2.0**. Each
fetch writes a `NOTICE.md` into the item's folder recording its source, licence, description
and native size. Apache-2.0 §4 requires those notices to travel with the work and
modifications to be stated, so **keep them**. See `docs/16-template-registry.md`.

## 2c. Stock footage in rendered videos

Clips come from Pexels and/or Pixabay, whose licences allow commercial use and modification
and **do not require attribution** — which is why nothing appears on screen. Source, author,
page and licence for every clip used are recorded in the `media-lock.json` beside each
script, so any clip stays traceable. See `docs/15-media-sources.md`.

Downloaded clips are **not committed** — `.gitignore` keeps every `media/` directory out, and
the lock file is what makes a render reproducible. One frame is the exception:

| file | what it is | licence |
|---|---|---|
| `examples/gallery/media-still.jpg` | a single frame of [*A person busy working on his laptop*](https://www.pexels.com/video/a-person-busy-working-on-his-laptop-5495899/) by [Pavel Danilyuk](https://www.pexels.com/@pavel-danilyuk) — the same clip `sample-output` uses for `body-11` | Pexels License |
| `examples/gallery/screenshot-still.jpg` | a capture of [github.com/XuHo-IT/RAG-EVAL-VN](https://github.com/XuHo-IT/RAG-EVAL-VN), a repository of this project's own | MIT, same owner |

Both exist for one job: standing in for the media slot of the four footage-led templates in
`examples/gallery/templates.jpg`, so the catalogue does not show four holes. Attribution is
not required by the Pexels License; it is here because a committed frame of someone's work
should be traceable to them without opening a lock file.

## 3. Runtime tools (not redistributed)

These are invoked, not bundled — no license obligation for this repo, listed so
you know what the render step reaches for:

| Tool | Role | License |
|---|---|---|
| [hyperframes](https://www.npmjs.com/package/hyperframes) `0.6.94` | HTML → MP4 via headless Chromium; fetched by `npx -y` at render time | see package |
| FFmpeg / ffprobe | all audio & video processing; must be on `PATH` | LGPL/GPL depending on build |
| [OmniVoice](https://github.com/k2-fsa/OmniVoice) | Vietnamese TTS; **runs locally**, no API key, no third-party service | see project |
| Google Fonts | `<link>`-ed by the templates at render time | SIL OFL |
| [myinstants.com](https://www.myinstants.com/) | optional SFX source for `scripts/video/sfx-download.mjs` | see site terms |

---

## Upstream MIT license (AI-auto-generate-video)

```
MIT License

Copyright (c) 2026 AI Coding
Copyright (c) 2026 Ho Quang Hai

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
