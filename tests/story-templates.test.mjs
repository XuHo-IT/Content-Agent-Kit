// The storytelling set (build-story-templates.mjs) and the CC0 sound pack that scores it.
// Same guards as tests/trend-templates.test.mjs, plus the two rules a story adds.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { STORY_TEMPLATES } from "../scripts/video/lib/build-story-templates.mjs";
import { CC0_PACK, sourcesMarkdown } from "../scripts/video/sfx-cc0.mjs";
import { pickSfxForScene, NEVER_AUTO } from "../scripts/video/lib/sfx.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VT = path.join(KIT, "video-templates");
const read = (id, f) => fs.readFileSync(path.join(VT, id, f), "utf8");
const FILES = ["index.html", "compositions/portrait.html"];
const genres = JSON.parse(fs.readFileSync(path.join(KIT, "templates", "VIDEO_GENRES.template.json"), "utf8")).genres;

test("fifteen story templates, all built and on disk", () => {
  assert.equal(STORY_TEMPLATES.length, 15);
  assert.equal(new Set(STORY_TEMPLATES.map((t) => t.id)).size, 15, "duplicate id");
  for (const t of STORY_TEMPLATES) {
    assert.match(t.id, /^frame-story-[a-z-]+$/);
    for (const f of FILES) assert.ok(fs.existsSync(path.join(VT, t.id, f)), `${t.id}/${f}`);
  }
});

test("the built HTML matches the builder (nobody hand-edited it)", () => {
  for (const t of STORY_TEMPLATES) {
    for (const f of FILES) {
      const vars = JSON.parse(read(t.id, f).match(/data-composition-variables='([^']*)'/)[1].replace(/&#39;/g, "'"));
      assert.deepEqual(vars, t.vars, `${t.id}/${f} defaults drifted — rebuild with build-story-templates.mjs`);
    }
  }
});

test("every declared slot is documented, and every documented slot exists", () => {
  for (const t of STORY_TEMPLATES) {
    assert.deepEqual(t.slots.map((s) => s[0]).sort(), Object.keys(t.vars).sort(), t.id);
  }
});

test("story templates carry none of the AI-slop palette tells", () => {
  const VIOLET_CYAN = /#(a78bfa|8b5cf6|7c3aed|6d28d9|22d3ee|06b6d4|38bdf8|c084fc|e879f9|7c5cff)\b/i;
  for (const t of STORY_TEMPLATES) {
    for (const f of FILES) {
      const html = read(t.id, f);
      assert.ok(!/background-clip:\s*text/.test(html), `${t.id}/${f}: gradient-filled text`);
      assert.ok(!VIOLET_CYAN.test(html), `${t.id}/${f}: violet/cyan neon`);
      assert.ok(!/drop-shadow\(0 0 \d+px/.test(html), `${t.id}/${f}: neon glow filter`);
    }
  }
});

test("headline type is sized for a phone", () => {
  for (const t of STORY_TEMPLATES) {
    const sizes = [...read(t.id, "compositions/portrait.html").matchAll(/font-size:\s*(\d+)px/g)].map((m) => Number(m[1]));
    assert.ok(Math.max(...sizes) >= 88, `${t.id}: largest 9:16 type is ${Math.max(...sizes)}px`);
  }
});

test("every story template is used by at least one genre", () => {
  // A frame no genre reaches for is a frame an agent will not find on its own.
  const used = new Set(Object.values(genres).flatMap((g) => g.beats.map((b) => b.templateId)));
  const unused = STORY_TEMPLATES.map((t) => t.id).filter((id) => !used.has(id));
  assert.deepEqual(unused, [], `no genre uses: ${unused.join(", ")}`);
});

test("demo numbers say they are illustrative", () => {
  // The data-story rule: a chart with no verified number says so on screen.
  for (const id of ["frame-story-pencil-chart", "frame-story-halftone-case", "frame-story-telestrator"]) {
    const t = STORY_TEMPLATES.find((x) => x.id === id);
    assert.ok(/minh hoạ|minh hoa|illustrative/i.test(JSON.stringify(t.vars)), `${id} ships a number without saying it is illustrative`);
  }
});

test("the CC0 pack never lets a reaction sound be picked automatically", () => {
  assert.ok(NEVER_AUTO.has("meme"));
  const index = { meme: ["cc0-oof-voice.mp3"], fail: [] };
  // "thất bại" matches the fail rule; fail is empty, role has nothing, fallback must skip meme
  const picked = pickSfxForScene({ voiceText: "Chiến dịch thất bại", role: "callout", sceneId: "s1", index });
  assert.equal(picked, null);
  // …but the voice and comedy sounds really are filed under meme
  for (const id of ["oof-voice", "huh-voice", "air-horn", "bike-honk"]) {
    assert.equal(CC0_PACK.find((p) => p[0] === id)[1], "meme", id);
  }
});

test("the CC0 pack records where every sound came from", () => {
  const md = sourcesMarkdown();
  assert.equal(new Set(CC0_PACK.map((p) => p[0])).size, CC0_PACK.length, "duplicate id");
  for (const [id, , fid] of CC0_PACK) {
    assert.ok(md.includes(`cc0-${id}.mp3`) && md.includes(`freesound.org/s/${fid}/`), id);
  }
});
