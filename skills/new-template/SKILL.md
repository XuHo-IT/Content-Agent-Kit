---
name: new-template
description: Find what kind of frame this kit cannot draw yet, then build it — for an agent working inside content-agent-kit. Use when the user says "template mới cho hôm nay", "thêm template", "add a template", "we need a frame for X", or asks what is missing from video-templates/. Also covers pulling one from the upstream HyperFrames registry when that is the cheaper answer.
---

# Add a template

Two different jobs share this name, and picking the wrong one wastes an hour.

| the user wants | do this |
|---|---|
| an effect, overlay, transition or caption style | **pull it** — one command, §1 |
| a kind of frame the kit cannot draw | **build it** — §2 onward |

## 0. Never start from "what would be cool"

A template with no gap behind it is a twenty-third way to show a headline. Find the gap
first, and be able to say it in one sentence before writing any CSS.

```bash
# what exists, and what each one is FOR
node -e "import('./scripts/video/lib/paths.mjs').then(m=>console.log(m.listTemplateIds().join('\n')))"
grep -n '^\*\*Role:\*\*' video-templates/CATALOG.md
```

Then read `templates/VIDEO_GENRES.template.json` and ask which beat has no good frame.

A real gap sounds like: *"`frame-chart-bars` compares magnitudes and `frame-split-compare`
compares states — nothing can strike a claim down."* A fake one sounds like *"we could use
another dark statement frame."*

**Say the gap out loud to the user before building.** They know what they publish; you are
guessing from a folder listing.

### If the user just says "a new template for today"

Do the survey, bring back **two or three candidates with the gap each one fills**, and let
them pick. Do not build five because "new templates" was plural — five templates nobody
needed is worse than one they will use.

## 1. Pulling from upstream is often the right answer

176 items live in the HyperFrames registry, and `registry-watch.mjs` reports what arrived
since the last check.

```bash
node scripts/video/registry-watch.mjs                       # anything new upstream?
node scripts/video/add-template.mjs --list --grep caption   # search
node scripts/video/add-template.mjs <name> <name>           # pull
```

**What you get is building material, not a scene template.** The command says so itself:
blocks and components ship `compositions/` with no `index.html`, so `listTemplateIds()`
skips them and no `script.json` can name them. They are overlays and effects to compose
with. Turning one into a scene template still means writing both compositions by hand — at
which point you are in §2 anyway, just with a head start on the design.

Licence and attribution are handled: the installer writes a `NOTICE.md` with the source URL
and the pinned commit sha. Do not delete it.

## 2. Building one — the five files

Copy the shape of a recent template rather than inventing one. `frame-checklist` and
`frame-timeline` are the plainest.

```
video-templates/<id>/
├── index.html                    16:9 — data-width="1920" data-height="1080"
├── compositions/portrait.html    9:16 — data-width="1080" data-height="1920"
├── meta.json                     { "id": "<id>", "name": "Human Name" }
├── hyperframes.json              copy verbatim from any existing template
└── NOTICE.md                     who wrote it, why it exists, which slots
```

`id` is `frame-<kebab>`. The two compositions must expose the **same slot names** — a test
checks it, because two files drift the moment they are edited separately.

**Generate both from one source.** Every template added since v0.5.0 was emitted by a small
script that takes shared markup, shared JS and per-aspect layout CSS. Writing the same file
twice is how slot parity gets broken, and it is also how a fix lands in one aspect only.

### The rules, all enforced by `tests/templates.test.mjs`

- **Draw from data, never from a hardcoded value.** If a bar length and its printed number
  can disagree, one day they will.
- **No caller-facing text in the markup.** Every visible string arrives through a slot and is
  set in JS. Text sitting in the body renders on *every* video regardless of what the caller
  passed — found three times here, twice after it reached a finished render. Decorative
  punctuation (a quote mark, a tick) may be CSS `content`; a *word* may not.
- **An empty slot removes its element**, it does not render a placeholder. An empty heading
  reads as missing data; an absent one reads as a deliberate omission.
- **No default is someone else's brand.** No real URLs, no channel names in
  `data-composition-variables`.
- **Vietnamese-capable fonts.** Be Vietnam Pro, Lora, Alfa Slab One are known-good. Test with
  `ữ ệ ợ ằ` — a font missing diacritics renders `bước` as `bc`.

### Two traps that pass every test and still look wrong

**Read `motion-craft` first** — it carries the full vocabulary and all four traps. The two
that bite hardest:

**A delayed animation with no start state shows its ending first.**

```css
.thing { animation: rise 0.5s ease 0.45s forwards; }             /* wrong */
.thing { opacity: 0; animation: rise 0.5s ease 0.45s forwards; } /* base = the start */
.thing { animation: rise 0.5s ease 0.45s both; }                 /* or backwards fill */
```

`forwards` does nothing during the delay — the element renders with its normal style, which
for a `forwards` animation is where it *finishes*. Half a second of the finished state, then
a snap back. Use `both` when the start state differs between aspects.

**An animation must travel the same way as the thing it reveals.** A divider sweeping in from
the left while a `clip-path` uncovers from the right reads as two animations that happen to
end together. Both real bugs, both in shipped-looking code, neither catchable by a test.

## 3. Measure, document, wire up

```bash
node scripts/video/theme-probe.mjs --template <id>   # writes theme-map.json
```

Themes flip lightness only on dark canvases. An unmeasured template is flipped on a guess,
which renders — wrongly, in exactly the way the theme system exists to prevent.

Then:

- a `## <id>` section in `video-templates/CATALOG.md`: role, best-for, and a **slot table with
  real character limits** you found by rendering long text, not by estimating
- raise the count in `.github/workflows/ci.yml` (`listTemplateIds().length < N`)
- add it to `NOTICE.md`'s list of templates original to this repo
- add it to a genre in `templates/VIDEO_GENRES.template.json` **only if it earns a beat there**
  — a template in no genre is fine; a genre with a frame that does not fit is not
- update the counts in README, README.en, `docs/16` and `.github/repo-about.json` — a test
  checks all seven against the folder

## 4. Look at it. The tests cannot.

```bash
node scripts/video/template-sheet.mjs <id> --out /tmp/check.jpg
node scripts/video/template-sheet.mjs <id> --aspect 16:9 --out /tmp/check-l.jpg
```

**Sample the animation, not just the settled frame** — tile three moments and open the image.
Everything visual ever caught in this repo was caught this way: two templates rendering
1920×1080 inside a 9:16 video with correct CSS and a correct viewport; a strike-through that
crossed only the first line of a two-line claim; an eleven-character name wrapping so a
shutter wiped two lines instead of one.

Render with **real content at realistic length**, and check the awkward cases: the longest
string a caller might pass, an empty optional slot, one item in a list that expects four.

> `data-composition-variables` does **not** reach the renderer. Those are the editor's preview
> defaults; `composeTemplate({ inputs: {} })` comes back blank. Pass inputs explicitly, or
> read the defaults out of the HTML and pass those.

## 5. Ship it

```bash
node --test tests/*.test.mjs
```

One PR per template batch, with the strip image in the description so a reviewer sees the
frames without checking out the branch. Say which gap each one fills — if that sentence is
hard to write, the template probably should not exist.
