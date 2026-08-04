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
    { file: "README.md", re: /dùng 14 trong số (\d+) template/ },
    { file: "README.md", re: /\| (\d+) template video HTML một-file/ },
    { file: "README.md", re: /\| \*\*(\d+) template, \d+ thể loại\*\* \|/ },
    { file: "README.en.md", re: /\| (\d+) single-file HTML video templates/ },
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
