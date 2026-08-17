---
name: motion-craft
description: How things should move in a video-templates frame — easing, entrances, stagger, how long a thing stays on screen, and the four mistakes that pass every test and still look wrong. Use when writing or reviewing a template's CSS animation, when motion "feels off" but nothing is broken, or when picking a duration or delay. Read it before `new-template`, not after.
---

# How things move here

Every animation bug this repo has shipped passed the full test suite. Geometry is checkable;
motion is not. So this is the vocabulary, and the four traps that have actually caught us.

## The four traps, in the order they bit

Not hypotheticals. Each one reached a finished render before anyone noticed.

### 1. A delayed animation with no start state shows its ending first

```css
.thing { animation: rise 0.5s ease 0.45s forwards; }              /* wrong */
```

`forwards` does nothing *during* the delay. The element renders with its normal style — which
for a `forwards` animation is where it **finishes**. Half a second of the finished state, then
a snap back to the start, then the animation.

```css
.thing { opacity: 0; animation: rise 0.5s ease 0.45s forwards; }  /* base IS the start */
.thing { animation: rise 0.5s ease 0.45s both; }                  /* or fill backwards */
```

Use the base-rule form when the start state is the same in both aspects; use `both` when it is
not. `frame-split-compare`'s divider enters from the right at 16:9 and from the bottom at 9:16,
so its start state cannot live in the shared rule.

### 2. An animation travelling against the thing it reveals

A divider sweeping in from the left while a `clip-path` uncovers from the right reads as **two
animations that happen to finish together**. Whatever leads the reveal must travel the same
way the reveal does.

Ask: *what is the moving edge, and is my mover on it?*

### 3. A decoration positioned once, on content that wraps

`frame-myth-fact`'s strike-through was a bar at `top: 52%`. Correct on a one-line claim; on a
two-line one it lands *between* the lines and reads as an underline of the first.

Anything drawn across text must repeat per line — a `repeating-linear-gradient` whose period
is the line height, with `box-decoration-break: clone` so it hugs each line rather than running
past a short last line into empty space.

### 4. Geometry anchored outside the frame

The HUD's radar sweep was a 150% wedge anchored at the centre. It clipped at the edges into
corner shards that read as a rendering fault. Anything that rotates must be **square, centred,
and sized past the diagonal** — or it will show you its own bounding box.

## Easing: three curves, and when each is right

Do not reach past these without a reason.

| | for | why |
|---|---|---|
| `cubic-bezier(0.16, 1, 0.3, 1)` | **arrivals** — a card, a number, a node | Fast out, long settle. Reads as something coming to rest rather than stopping. |
| `cubic-bezier(0.7, 0, 0.2, 1)` | **travel** — a wipe, a divider, a sweep | Slow-fast-slow. A thing crossing distance should accelerate. |
| `ease-out` | **fades and small rises** | Cheap, correct, and nobody notices it. Most of the frames here are this. |
| `linear` | **loops only** — a rotation, a scan line | A looping ease has a visible stutter at the seam. |

`steps()` belongs to typing and blinking, nowhere else.

## Duration and delay

The narration sets the pace. A scene is `voiceDur + 0.3s`, and everything below fits inside it.

| | |
|---|---|
| entrance | **0.4–0.6s**. Under 0.3 reads as a pop-in; over 0.8 and the viewer is waiting. |
| travel across the frame | **0.6–0.9s** |
| stagger between siblings | **0.10–0.18s** for list items · **~0.45s** for anything read as a reply |
| first thing on screen | **0.1–0.25s**. Not zero — a frame that is fully drawn on frame one has no entrance. |
| **content** settled by | **~2.0s**. A 6-second scene whose *headline* is still moving at 4s is a scene the viewer is watching instead of listening to. This is about the content layer only — see "Two layers" below, which is the half this table used to leave out. |

**Stagger is pacing, not decoration.** `frame-chat-bubbles` lands a bubble every ~0.45s because
that reads as someone replying; faster reads as a paste. `frame-timeline` was 0.22s and went to
0.3s because the gap between dates *is* the content.

## Words arrive at reading speed

`frame-kinetic-type` lands about seven words a second — fast enough to feel spoken, slow enough
to read. An emphasised word waits an extra beat: that pause *is* the emphasis.

Never animate per character with a JS timer. One `clip-path` sweep cannot drift out of step
with the narration; forty `setTimeout`s can, and do, under render load.

## Two layers: the content settles, the canvas does not

Everything above is about **one** of the two layers, and reading it as the whole story is what
produced nine templates that render a still image for most of every scene.

| layer | what is in it | rule |
|---|---|---|
| **Content** | headlines, numbers, list items, entrances, stagger | settles by ~2s — it has to be **read** |
| **Ambient** | grain, drift, a sweep, a pulse, a glow | **never stops** — it is the canvas being alive |

The three frames in this repo that people call good all had the second layer and never said
so: `frame-analog-grain` runs film grain and a scanline roll, `frame-geo-sonar-radar` sweeps
and pulses, `frame-bold-poster` drifts four shapes on 9–17s loops. The nine that felt cheap had
only the first, and were measurably identical from ~2s to the end of the scene.

**"If everything moves, nothing did" is about the content layer.** An ambient layer is not a
fourth moving thing competing for attention; it is the reason the frame does not read as a
screenshot.

### Keeping ambient ambient

| | |
|---|---|
| period | **6–19s**. Under about 5s it stops being background and starts being an event |
| opacity delta | **≤0.15** |
| scale delta | **≤0.04** — at that size it reads as depth, not as movement |
| direction | `alternate` for a drift; `linear` for anything that loops seam-to-seam |
| never | **text, numbers, or anything the viewer is reading.** A looping headline is unreadable at phone size |

It goes in as `#root::after` — a pseudo-element, so no markup changes and no class collides —
with `pointer-events: none` and `inset: -10%`. The inset matters: a gradient that drifts inside
its own box eventually shows you the edge of that box.

`tests/motion.test.mjs` holds the set that has been through this pass, checks **both** aspects,
and prints how much of the library still has no ambient layer rather than letting the gap sit
unstated. It caught a real one on its first run — `frame-bold-poster` had four loops in 9:16
and none at all in 16:9.

## What hyperframes can actually drive — seven adapters, not one

The kit uses CSS and nothing else, which is a fraction of what the renderer supports. Read
out of `hyperframes/dist/cli.js`, its seek layer ships **seven** adapters:

| adapter | how it is driven | needs a library? |
|---|---|---|
| `css` | `element.getAnimations()` → `currentTime`, then pause | no |
| `waapi` | `document.getAnimations()` → same, document-wide | no |
| `gsap` | the registered timeline's `totalTime(t, false)` | GSAP |
| `animejs` | every instance in `anime.running` → `.seek(ms)` | anime.js |
| `lottie` | `window.lottie` registered animations → `.seek(%)` | lottie-web |
| `three` | sets `window.__hfThreeTime = t` | Three.js |
| `typegpu` | sets `window.__hfTypegpuTime = t` | TypeGPU |

**The important consequence: `waapi` seeks EVERY animation in the document.** You do not have
to register anything, and you are not limited to the fade-up vocabulary this kit grew up on.
Any `@keyframes` you write is already frame-accurate.

### What does NOT survive a seek

**A raw `requestAnimationFrame` loop.** There is no rAF shim in the bundle — nothing rewrites
the clock for it. A canvas particle system driven by `rAF` advances by wall-clock time while
the renderer screenshots, so it captures whatever happened to be on screen. That is the same
class of bug as the `<video>` race in `VIDEO_SAFE_TEMPLATES`, and it fails the same way:
plausible in preview, wrong in the render.

If you want canvas, drive it from `window.__hfThreeTime` and redraw on demand — never from
`rAF` deltas.

### Seek-safe techniques worth more than another fade-up

All pure CSS, all handled by `waapi`, no dependency added.

**Open the sample before you write the CSS.** Every technique below already exists somewhere in
this library, and copying a working one beats writing a new one from the description. The kit
was never short of advanced motion — it was short of a path to it, which is what the last
column is. The list is generated, so it does not drift from the templates:

```bash
node scripts/video/motion-index.mjs                      # the whole table
node scripts/video/motion-index.mjs --technique draw-on  # just the ids
```

| technique | what it buys you | copy from |
|---|---|---|
| **SVG `stroke-dashoffset`** — a line, route or underline *drawing itself*. The single biggest upgrade available for diagram, map and timeline frames. | attention follows the tip of the line | `frame-geo-route` (a route drawn on a map — the genre case), `frame-draw-on`, `frame-math-manim`, `frame-vox-investigation-board` · **13 total** |
| **`clip-path` reveals** — wipe, iris, polygon morph. A shape opening reads as a camera move. | reveal without a fade | `frame-split-compare` and `frame-terminal` (both `inset()`) · **only 2** — `frame-3d-spotlight`'s `polygon` is a static light cone, not a reveal, so it is not a sample |
| **`mask-image` sweeps** — a gradient mask travelling across text or an image, so content is revealed by light rather than by opacity. | the richest-looking reveal here | `frame-aicoding-comparison`, `frame-aicoding-list` · **only 2, both AI-coding themed** — thin cover for documentary work |
| **`background-clip: text` + moving gradient** — the fill of a headline moves while the letters stay put. Costs nothing, never shifts layout. | a live headline | `frame-liquid-bg-hero`, `frame-bold-poster`, `frame-pentagram-stat` · **8 total** |
| **3D transforms with `perspective`** — a card turning, a page lifting. | a flat frame reads as an object | `frame-3d-flip`, `frame-3d-perspective-card`, `frame-3d-device` · **3** |
| **`conic-gradient` rotation** — sweeping radar or ring light, no image needed. | motion with zero assets | `frame-geo-sonar-radar`, `frame-hud`, `frame-pentagram-stat` · **3** |
| **`steps()` easing** — mechanical judder. Film grain and ticking counters need it; smoothed they turn to fog. Deliberate, not a mistake. | anything that should feel like a machine | `frame-analog-grain`, `frame-terminal`, `frame-timeline-war-era` · **3** |

- **Two loops at coprime periods** (13s and 19s, not 12s and 24s) — they never resync, so the
  frame never settles into a pattern a viewer can predict. `frame-bold-poster` runs four.

**The two thin rows are the gap.** `clip-reveal` and `mask-sweep` have two samples each, and
both `mask-image` ones are AI-coding frames. If you are building a new template and either
would fit, building it there is worth more than a seventh `draw-on`.

### If you reach for GSAP

It is genuinely supported, and its timeline is the only one that gives real orchestration
(overlapping tweens, labels, stagger with easing per item). The cost: a CDN `<script>` at
render time. Templates already fetch Google Fonts, so this is not a new *kind* of dependency —
but it is one more thing that can be slow or down while a render is running. Use it when the
motion genuinely needs orchestration, not to do what four `@keyframes` already do.

## What not to animate

- **Nothing after the last word.** The outro holds ~3s past the narration; movement there
  competes with the caption and the call to action.
- **Not the whole frame.** If everything moves, nothing did. One subject per beat.
- **Not the emoji.** They carry their own colour and their own weight; scaling one enlarges
  someone else's artwork.
- **Not more than three things at once.** Beyond that a viewer picks one and misses the rest,
  and you no longer control which.

## Before you call it done

```bash
node scripts/video/template-sheet.mjs <id> --out /tmp/check.jpg
```

**Sample three moments, not the settled frame.** Every bug above is invisible in a still taken
at 4 seconds. Look at frame 0 especially — trap 1 lives there and nowhere else.

Then look at 16:9 as well. Trap 2 is aspect-specific, and it shipped because only one aspect
was checked.
