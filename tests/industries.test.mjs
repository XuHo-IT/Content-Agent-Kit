// industries.test.mjs — the industry layer has to point at things that exist.
//
// The same failure the genre presets already guard against: a vertical names a frame,
// someone renames the folder, and nothing breaks until a render five minutes in throws
// "template not found". The industry layer is a second place that names frames, so it needs
// the same check — and a few of its own, because it also makes claims about the law.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listTemplateIds } from "../scripts/video/lib/paths.mjs";
import { resolveTheme, knownThemeIds } from "../scripts/video/lib/theme.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(KIT, p), "utf8");

const pack = JSON.parse(read("templates/INDUSTRIES.template.json"));
const industries = Object.entries(pack.industries);
const genres = JSON.parse(read("templates/VIDEO_GENRES.template.json")).genres;
const templates = listTemplateIds();

test("there are industries at all", () => {
  assert.ok(industries.length >= 10, `only ${industries.length} industries`);
});

test("every frame an industry names exists on disk", () => {
  for (const [id, v] of industries) {
    for (const f of v.video.frames) {
      assert.ok(templates.includes(f), `${id} names "${f}", which is not a template`);
    }
  }
});

test("every genre an industry names exists", () => {
  for (const [id, v] of industries) {
    assert.ok(genres[v.video.genre], `${id} names genre "${v.video.genre}", which does not exist`);
  }
});

test("every theme an industry names resolves", () => {
  const known = new Set([...knownThemeIds(), "none"]);
  for (const [id, v] of industries) {
    assert.ok(known.has(v.theme), `${id} names theme "${v.theme}" — known: ${[...known].join(", ")}`);
    if (v.theme !== "none") assert.doesNotThrow(() => resolveTheme(v.theme), `${id}: theme ${v.theme} fails to resolve`);
  }
});

test("`missing` names frames that genuinely do not exist", () => {
  // The build queue. If something on it quietly got built, the queue is lying about the
  // state of the repo — which is how a backlog turns into a work of fiction.
  for (const [id, v] of industries) {
    for (const want of v.video.missing ?? []) {
      assert.ok(
        !templates.includes(want),
        `${id} lists "${want}" as missing, but a template by that name exists`,
      );
    }
  }
});

test("every industry carries both halves — post and video", () => {
  // The whole point of this layer is that an industry changes how you WRITE as well as what
  // you draw. An entry with only a video block is a genre preset with extra steps.
  for (const [id, v] of industries) {
    assert.ok(v.label?.trim(), `${id} has no label`);
    assert.ok(v.whenToUse?.trim(), `${id} has no whenToUse`);
    assert.ok(Array.isArray(v.post?.types) && v.post.types.length >= 3, `${id}.post.types is thin`);
    assert.ok(v.post?.proof?.trim(), `${id} says nothing about what counts as proof`);
    assert.ok(Array.isArray(v.post?.avoid) && v.post.avoid.length, `${id}.post.avoid is empty`);
    assert.ok(Array.isArray(v.video?.frames) && v.video.frames.length >= 4, `${id}.video.frames is thin`);
    assert.ok(v.backend?.trim(), `${id} does not say which backend it leans on`);
  }
});

test("a legal claim carries a source; craft advice does not pretend to be law", () => {
  // The distinction this file is built on. `legal` can cost someone a fine, so every entry
  // is a link — none was written from memory. `avoid` is judgement and says so by having no
  // source, which also means nothing in it may be phrased as a legal requirement.
  const LAWY = /(cấm|nghiêm cấm|theo luật|nghị định|luật quảng cáo|phạt|xử phạt)/i;
  for (const [id, v] of industries) {
    for (const l of v.post.legal ?? []) {
      assert.ok(l.rule?.trim(), `${id}: a legal entry with no rule`);
      assert.match(l.source ?? "", /^https?:\/\//, `${id}: legal rule with no source — "${l.rule.slice(0, 50)}…"`);
    }
    for (const a of v.post.avoid) {
      assert.ok(
        !LAWY.test(a),
        `${id}.avoid reads as law but carries no source — move it to \`legal\` with a link: "${a.slice(0, 60)}…"`,
      );
    }
  }
});

test("the regulated verticals actually carry their legal constraints", () => {
  // These three are where getting it wrong costs a fine or a licence rather than an
  // eyebrow. An entry for one of them with no `legal` block is the file failing at the one
  // job it took on.
  for (const id of ["y-te", "tai-chinh", "bat-dong-san"]) {
    const v = pack.industries[id];
    assert.ok(v, `${id} is missing from the pack entirely`);
    assert.ok(v.post.legal?.length, `${id} is a regulated vertical with no legal constraints recorded`);
  }
});

test("the two new palettes clear the contrast floor validate-script enforces", () => {
  // Shipping a preset the validator would reject is shipping a trap.
  for (const id of ["corporate", "luxury"]) {
    const t = resolveTheme(id);
    const lum = (hex) => {
      const c = [1, 3, 5].map((i) => {
        const x = parseInt(hex.slice(i, i + 2), 16) / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const [hi, lo] = [lum(t.bg), lum(t.ink)].sort((a, b) => b - a);
    const ratio = (hi + 0.05) / (lo + 0.05);
    assert.ok(ratio >= 4.5, `${id} is ${ratio.toFixed(1)}:1, below the 4.5 floor`);
  }
});

test("the industry pack is reachable from somewhere a reader looks", () => {
  const prose = read("README.md") + read("README.vi.md") +
    fs.readdirSync(path.join(KIT, "docs")).map((f) => read(`docs/${f}`)).join("\n") +
    fs.readdirSync(path.join(KIT, "skills")).map((d) => {
      const p = path.join(KIT, "skills", d, "SKILL.md");
      return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
    }).join("\n");
  assert.ok(prose.includes("INDUSTRIES.template.json"), "nothing links to the industry pack");
});
