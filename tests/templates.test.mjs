// templates.test.mjs — the template library and the genre presets have to agree with
// what is actually on disk.
//
// The failure this prevents is quiet: a genre preset names `frame-review-verdict`, someone
// renames the folder, and nothing breaks until a render five minutes in throws "template
// not found". Cross-checking the two here turns that into a failed test.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listTemplateIds, templatesDir } from "../scripts/video/lib/paths.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ids = listTemplateIds();
const genres = JSON.parse(fs.readFileSync(path.join(KIT, "templates", "VIDEO_GENRES.template.json"), "utf8")).genres;
const themeMap = JSON.parse(fs.readFileSync(path.join(templatesDir(), "theme-map.json"), "utf8")).canvases;
const catalog = fs.readFileSync(path.join(templatesDir(), "CATALOG.md"), "utf8");

const compositions = (id) =>
  ["index.html", "compositions/portrait.html"].filter((f) => fs.existsSync(path.join(templatesDir(), id, f)));

// ── the library ──────────────────────────────────────────────────────────────

test("every template has both a 16:9 and a 9:16 composition", () => {
  // A template with only index.html renders 16:9 into a 9:16 video: letterboxed, or
  // cropped through the subject. Neither is a decision anyone made.
  for (const id of ids) {
    assert.equal(compositions(id).length, 2, `${id} is missing one of its two compositions`);
  }
});

test("each composition declares the canvas its aspect needs", () => {
  // `data-width` / `data-height` on #root is what the renderer sizes the canvas from —
  // NOT the CSS and NOT the viewport meta. Two templates shipped with correct CSS, a
  // correct viewport, and stale 1920x1080 data-* attributes, so they rendered landscape
  // inside a 9:16 video. Nothing caught it: a screenshot harness that forces the window
  // size looks right, and the render succeeds.
  const EXPECT = {
    "index.html": { w: 1920, h: 1080 },
    "compositions/portrait.html": { w: 1080, h: 1920 },
  };
  for (const id of ids) {
    for (const f of compositions(id)) {
      const html = fs.readFileSync(path.join(templatesDir(), id, f), "utf8");
      const w = Number(html.match(/data-width="(\d+)"/)?.[1]);
      const h = Number(html.match(/data-height="(\d+)"/)?.[1]);
      assert.equal(w, EXPECT[f].w, `${id}/${f}: data-width is ${w}, expected ${EXPECT[f].w}`);
      assert.equal(h, EXPECT[f].h, `${id}/${f}: data-height is ${h}, expected ${EXPECT[f].h}`);
    }
  }
});

test("the viewport meta agrees with the canvas attributes", () => {
  // When these disagree, the browser lays out at one size and the renderer captures at
  // another — which is how the bug above stayed invisible in a preview.
  for (const id of ids) {
    for (const f of compositions(id)) {
      const html = fs.readFileSync(path.join(templatesDir(), id, f), "utf8");
      const vp = html.match(/content="width=(\d+),\s*height=(\d+)"/);
      if (!vp) continue; // not every composition declares one
      assert.equal(vp[1], html.match(/data-width="(\d+)"/)?.[1], `${id}/${f}: viewport width ≠ data-width`);
      assert.equal(vp[2], html.match(/data-height="(\d+)"/)?.[1], `${id}/${f}: viewport height ≠ data-height`);
    }
  }
});

test("every composition has a measured canvas", () => {
  // Without one, theming flips the wrong way — light text recoloured as if the canvas
  // were dark. Re-run: node scripts/video/theme-probe.mjs --template <id>
  for (const id of ids) {
    for (const f of compositions(id)) {
      assert.ok(themeMap[`${id}/${f}`], `${id}/${f} not in theme-map.json — run theme-probe.mjs`);
    }
  }
});

test("every template keeps a NOTICE, vendored or not", () => {
  for (const id of ids) {
    assert.ok(fs.existsSync(path.join(templatesDir(), id, "NOTICE.md")), `${id} has no NOTICE.md`);
  }
});

test("every composition's default variables parse as JSON", () => {
  // A malformed block means the frame renders with no text at all, and the render
  // succeeds — an empty video, no error.
  for (const id of ids) {
    for (const f of compositions(id)) {
      const html = fs.readFileSync(path.join(templatesDir(), id, f), "utf8");
      const m = html.match(/data-composition-variables='([^']*)'/);
      assert.ok(m, `${id}/${f} has no data-composition-variables`);
      assert.doesNotThrow(() => JSON.parse(m[1]), `${id}/${f} variables are not valid JSON`);
    }
  }
});

test("both compositions of a template expose the same slots", () => {
  // Divergent slots mean a script that renders in 16:9 silently drops text in 9:16.
  for (const id of ids) {
    const files = compositions(id);
    if (files.length !== 2) continue;
    const slots = files.map((f) => {
      const html = fs.readFileSync(path.join(templatesDir(), id, f), "utf8");
      return Object.keys(JSON.parse(html.match(/data-composition-variables='([^']*)'/)[1])).sort();
    });
    assert.deepEqual(slots[0], slots[1], `${id}: 16:9 and 9:16 expose different slots`);
  }
});

test("no template defaults to a brand that is not the caller's", () => {
  // Defaults are what render when a slot is left empty. Shipping someone else's URL there
  // publishes it on a stranger's video — fixed once already, so it stays checked.
  for (const id of ids) {
    for (const f of compositions(id)) {
      const html = fs.readFileSync(path.join(templatesDir(), id, f), "utf8");
      const vars = JSON.parse(html.match(/data-composition-variables='([^']*)'/)[1]);
      for (const [k, v] of Object.entries(vars)) {
        assert.ok(!/aicodingvn|\.vercel\.app|https?:\/\/(?!example)/i.test(String(v)),
          `${id}/${f}: slot "${k}" defaults to a real URL — ${v}`);
        // A bare channel name leaks just as effectively as a URL, and reads as deliberate
        // rather than as a leftover — three templates still carried "AI Coding" after the
        // URL sweep, because that sweep only looked for links.
        assert.ok(!/AI\s*Coding/i.test(String(v)),
          `${id}/${f}: slot "${k}" defaults to someone else's channel name — ${v}`);
      }
    }
  }
});

test("no template burns caller-facing text into the markup", () => {
  // Text sitting in the markup with no slot behind it renders on EVERY video regardless of
  // what the caller passes. Found three times now: two corner labels in frame-logo-outro,
  // then an aspect-ratio label and a "Bản tin" category chip in frame-liquid-bg-hero, both
  // of which reached a finished render before anyone noticed.
  //
  // Decorative chrome that IS the design — the broadcast furniture in frame-glitch-title —
  // is exempt by name. Naming the exceptions is the point: a new one has to be argued for
  // rather than added quietly.
  const DECORATIVE = new Set(["frame-glitch-title"]);

  for (const id of ids) {
    if (DECORATIVE.has(id)) continue;
    for (const f of compositions(id)) {
      const html = fs.readFileSync(path.join(templatesDir(), id, f), "utf8");
      const body = html.slice(html.indexOf("<body>")).replace(/<script[\s\S]*?<\/script>/g, "");
      const literals = [...body.matchAll(/>([^<>{}]*[\p{L}][^<>{}]*)</gu)]
        .map((m) => m[1].trim())
        .filter((s) => s && !/^&[a-z]+;$/.test(s));
      assert.deepEqual(
        literals, [],
        `${id}/${f} has literal text no slot can reach: ${JSON.stringify(literals)}`,
      );
    }
  }
});

test("no template ships with every text slot empty", () => {
  // `frame-broll`, `frame-media-inset` and `frame-screenshot` did, for months. They render
  // as a blank box in the catalogue image, in the HyperFrames editor, and anywhere else
  // someone opens one to find out what it does — which is the one job a default has.
  //
  // Nothing caught it: the composition parses, the slots match across aspects, and no rule
  // said a default had to say anything. It was found by looking at the catalogue.
  for (const id of ids) {
    for (const f of compositions(id)) {
      const html = fs.readFileSync(path.join(templatesDir(), id, f), "utf8");
      const vars = JSON.parse(html.match(/data-composition-variables='([^']*)'/)[1]);
      // `media_kind` is a switch, not copy — it says <video> or <img>, so it never counts.
      const copy = Object.entries(vars).filter(([k]) => k !== "media_kind");
      const filled = copy.filter(([, v]) => String(v).trim().length);
      assert.ok(
        filled.length > 0,
        `${id}/${f} has ${copy.length} slots and every one is empty — it renders as a blank frame`,
      );
    }
  }
});

test("every template that draws supplied media gets a still in the catalogue image", () => {
  // `frame-3d-device` reads `assets/media.png` exactly as `frame-screenshot` does, but was
  // missing from template-sheet's media list — so its tile in the README's catalogue image
  // was a dark empty screen and stayed one across two releases. Nothing tied the list to the
  // templates, so the moment a fourth media template arrived the two drifted apart.
  //
  // Read as text rather than imported: template-sheet.mjs is a CLI that parses argv and
  // calls process.exit at module scope, so importing it would end the test run.
  const sheet = fs.readFileSync(path.join(KIT, "scripts", "video", "template-sheet.mjs"), "utf8");
  const from = sheet.indexOf("const STILL_FOR");
  assert.ok(from >= 0, "template-sheet.mjs no longer has a STILL_FOR table");
  const table = sheet.slice(from, sheet.indexOf("};", from));

  const draws = ids.filter((id) =>
    compositions(id).some((f) =>
      // `media.` OR `media-`: multi-media templates build "assets/media-" + i + ".png",
      // which the original substring missed — so a grid template was silently exempt from
      // the very check that exists to stop a media frame shipping with an empty tile.
      /assets\/media[.-]/.test(fs.readFileSync(path.join(templatesDir(), id, f), "utf8")),
    ),
  );
  const missing = draws.filter((id) => !table.includes(`"${id}"`));
  assert.deepEqual(missing, [], `draws supplied media but the catalogue gives it none: ${missing.join(", ")}`);

  // And the other way — a still kept for a template that no longer draws media is dead weight.
  const named = [...table.matchAll(/"(frame-[a-z0-9-]+)"\s*:/g)].map((m) => m[1]);
  const stale = named.filter((id) => !draws.includes(id));
  assert.deepEqual(stale, [], `listed in STILL_FOR but draws no supplied media: ${stale.join(", ")}`);

  // The stills are committed, so `--preset all` still builds with the network unplugged.
  for (const file of new Set([...table.matchAll(/"([\w-]+\.jpe?g)"/g)].map((m) => m[1]))) {
    const p = path.join(KIT, "examples", "gallery", file);
    assert.ok(fs.existsSync(p), `STILL_FOR names ${file} but examples/gallery/${file} is not committed`);
  }
});

test("every composition that draws supplied media has a stand-in behind it", () => {
  // The catalogue image hands these four templates a committed still, which is exactly why
  // this needs a test: the picture everyone looks at can no longer show the fault. In a real
  // render with the media missing, `frame-broll` and `frame-screenshot` produced a black
  // frame and dead browser chrome respectively — output that reads as a broken renderer
  // rather than as missing input, and that nobody would think to file against a template.
  //
  // The marker is an attribute, not a class name, because the two that already had one had
  // named it differently (`.ph` and `.skeleton`) and no test can be written against a list
  // of names that grows every time someone picks a third.
  for (const id of ids) {
    for (const f of compositions(id)) {
      const html = fs.readFileSync(path.join(templatesDir(), id, f), "utf8");
      // `media[.-]` and any `<var>.src`: a multi-media template builds
      // `el.src = "assets/media-" + i + ".png"`, which the original pattern — hard-coded to
      // `img.src` and a literal dot — missed entirely, exempting a grid frame from the
      // stand-in check it most needs.
      const media = html.search(/(?:src=["']|\w+\.src\s*=\s*["'])assets\/media[.-]/);
      if (media < 0) continue;

      const ph = html.indexOf("data-media-fallback");
      assert.ok(ph >= 0, `${id}/${f} draws assets/media.* with nothing behind it`);
      // Paint order, not just presence: both boxes are positioned, so the later one in the
      // markup wins. A stand-in after the media would cover the media instead of backing it.
      assert.ok(ph < media, `${id}/${f}: the stand-in comes after the media, so it covers it`);

      // Chrome draws its own 16px broken-image mark on a sized <img> that fails to load —
      // empty alt does not suppress it, which is what the comments here used to claim. It
      // landed in the corner of the stand-in on every one of these until it was rendered
      // and looked at. <video> needs no such guard: a broken one paints nothing.
      if (/<img[^>]+assets\/media[.-]|\w+\.src\s*=\s*["']assets\/media[.-]/.test(html)) {
        assert.match(html, /onerror/, `${id}/${f}: an <img> can fail here with no onerror to hide it`);
      }
    }
  }
});

test("every template is documented in CATALOG.md", () => {
  for (const id of ids) {
    assert.ok(catalog.includes(`## ${id}`), `${id} has no CATALOG.md entry`);
  }
});

test("the documented template count matches the folder", () => {
  // The upstream registry count went stale in six places before anything checked it, and
  // the kit's OWN count is hand-written in just as many. This one needs no network, so it
  // belongs in a test that fails in CI rather than in a job that notices tomorrow.
  const SITES = [
    { file: "README.vi.md", re: /dùng 14 trong số (\d+) template/ },
    { file: "README.vi.md", re: /\| (\d+) template video HTML một-file/ },
    { file: "README.vi.md", re: /\| \*\*(\d+) template, \d+ thể loại\*\* \|/ },
    { file: "README.md", re: /\| (\d+) single-file HTML video templates/ },
    // The English twin of the Vietnamese row two lines up. It was NOT in this list, so it
    // sat at 18 through 22 new templates while its counterpart was updated each time. Every
    // sentence carrying this number needs its own entry; one per file is not enough.
    { file: "README.md", re: /\| \*\*(\d+) templates, \d+ genres\*\* \|/ },
    { file: "docs/16-template-registry.md", re: /The kit ships (\d+) scene templates\./ },
    { file: "docs/16-template-registry.md", re: /Kit có sẵn (\d+) template cho scene\./ },
    { file: ".github/repo-about.json", re: /9:16 với (\d+) template/ },
  ];
  for (const s of SITES) {
    const text = fs.readFileSync(path.join(KIT, s.file), "utf8");
    const m = text.match(s.re);
    // A pattern that no longer matches is a failure, not a pass: it means the wording
    // changed and the number behind it quietly stopped being checked.
    assert.ok(m, `${s.file}: the count sentence changed — ${s.re}`);
    assert.equal(Number(m[1]), ids.length, `${s.file} says ${m[1]}, there are ${ids.length}`);
  }
});

// ── genre presets ────────────────────────────────────────────────────────────

test("the documented genre count matches the presets", () => {
  // The same hand-written-number problem as the templates above, one column to the right:
  // the English README said five genres while seven were shipping. Nothing checked it,
  // because the check next door only ever read the templates half of that sentence.
  const n = Object.keys(genres).length;
  const SITES = [
    { file: "README.vi.md", re: /\| \*\*\d+ template, (\d+) thể loại\*\* \|/ },
    { file: "README.md", re: /\| \*\*\d+ templates, (\d+) genres\*\* \|/ },
  ];
  for (const s of SITES) {
    const m = fs.readFileSync(path.join(KIT, s.file), "utf8").match(s.re);
    assert.ok(m, `${s.file}: the genre-count sentence changed — ${s.re}`);
    assert.equal(Number(m[1]), n, `${s.file} says ${m[1]} genres, there are ${n}`);
  }
});

test("every genre names templates that exist", () => {
  for (const [name, g] of Object.entries(genres)) {
    for (const beat of g.beats) {
      assert.ok(ids.includes(beat.templateId), `genre "${name}" names missing template ${beat.templateId}`);
    }
  }
});

test("every genre opens on a hook and closes on an outro", () => {
  for (const [name, g] of Object.entries(genres)) {
    assert.equal(g.beats[0].type, "hook", `genre "${name}" does not open on a hook`);
    assert.equal(g.beats.at(-1).type, "outro", `genre "${name}" does not close on an outro`);
  }
});

test("no genre repeats a template back to back", () => {
  // validate-script.mjs warns about this at render time; a preset should not ship with
  // the warning already baked in. Two identical frames read as a stall.
  for (const [name, g] of Object.entries(genres)) {
    for (let i = 1; i < g.beats.length; i++) {
      assert.notEqual(g.beats[i].templateId, g.beats[i - 1].templateId,
        `genre "${name}" uses ${g.beats[i].templateId} twice in a row`);
    }
  }
});

test("every beat explains what it is for", () => {
  // A preset without reasoning is a list of template names, which is what CATALOG.md
  // already is. The `beat` line is the part that makes it a starting point.
  for (const [name, g] of Object.entries(genres)) {
    assert.ok(g.label && g.whenToUse, `genre "${name}" needs a label and whenToUse`);
    for (const beat of g.beats) {
      assert.ok(beat.beat && beat.beat.length > 20, `genre "${name}" has a beat with no reasoning`);
    }
  }
});
