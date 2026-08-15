// wiring.test.mjs — things that exist have to be reachable from where people look.
//
// A kit can be entirely correct and still useless if its parts do not point at each other.
// Every gap below was real at the time this file was written:
//
//   · bootstrap-content-agent — the skill that scaffolds every new agent — mentioned NONE of
//     validate-post, install-skills, the registry, ads-report, design-campaign,
//     VIDEO_BACKEND, profiles, VIDEO_GENRES or .mcp.json. Everything added in a whole round
//     of work was invisible to the front door.
//   · ads-report and design-campaign shipped without appearing in either README.
//
// Neither breaks a test that only checks the code runs. Both make a feature that exists
// indistinguishable from one that does not.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(KIT, p), "utf8");

/**
 * Width and height out of a JPEG's SOF segment. Written by hand because the CI runner has
 * no ffmpeg, so ffprobe is not available to a test.
 *
 * The trap: most markers carry a 2-byte length, but SOI/EOI (D8/D9), the restart markers
 * (D0–D7) and TEM (01) carry none. Advancing past those by a "length" read from image data
 * walks the pointer into nonsense — the first version of this returned 0x0 and the test it
 * backed reported a passing image as broken.
 */
function jpegSize(buf, name) {
  if (buf.readUInt16BE(0) !== 0xffd8) throw new Error(`${name} is not a JPEG`);
  let i = 2;
  while (i < buf.length - 1) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xff) { i++; continue; } // fill byte
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) { i += 2; continue; }
    // SOF0/1/2/3/5/6/7/9/10/11/13/14/15 — every frame header but DHT(c4), JPG(c8), DAC(cc)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error(`${name}: no SOF segment found`);
}

const skillDirs = fs
  .readdirSync(path.join(KIT, "skills"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const bootstrap = read("skills/bootstrap-content-agent/SKILL.md");
const readmes = read("README.md") + read("README.vi.md") + read("AGENTS.md");

test("every skill has a SKILL.md with frontmatter", () => {
  for (const n of skillDirs) {
    const f = path.join(KIT, "skills", n, "SKILL.md");
    assert.ok(fs.existsSync(f), `skills/${n} has no SKILL.md`);
    const t = fs.readFileSync(f, "utf8");
    assert.match(t, /^---\r?\nname:/, `skills/${n}/SKILL.md has no frontmatter`);
    assert.match(t, /\ndescription:/, `skills/${n}/SKILL.md has no description — nothing will trigger it`);
  }
});

test("a skill's frontmatter name matches its folder", () => {
  for (const n of skillDirs) {
    const t = read(`skills/${n}/SKILL.md`);
    const declared = t.match(/^---\r?\nname:\s*(\S+)/)?.[1];
    assert.equal(declared, n, `skills/${n} declares name: ${declared}`);
  }
});

test("the meta-skill knows about every runtime skill", () => {
  // bootstrap-content-agent decides which skills get copied into a generated agent. One it
  // does not name is one no generated agent will ever have.
  const missing = skillDirs
    .filter((n) => n !== "bootstrap-content-agent")
    .filter((n) => !bootstrap.includes(n));
  assert.deepEqual(missing, [], `bootstrap-content-agent never mentions: ${missing.join(", ")}`);
});

test("the meta-skill knows about the gates and the knobs", () => {
  // Not every file — just the ones a generated agent is wrong without.
  const MUST_MENTION = [
    "validate-post", // captions render no Markdown; make-post refuses text that fails
    "contact-sheet", // the only thing that caught two templates rendering at the wrong size
    "profiles/", // backend, voice, palette and the spend ceiling
    "VIDEO_GENRES", // which frames a review needs, in what order
    "install-skills", // how to get the SEO and marketing skills at all
  ];
  const missing = MUST_MENTION.filter((s) => !bootstrap.includes(s));
  assert.deepEqual(missing, [], `bootstrap-content-agent never mentions: ${missing.join(", ")}`);
});

test("the skill that writes script.json knows transitions exist", () => {
  // The kit shipped SFX tagged `transition` — whoosh, swoosh, page-flip — for two
  // releases before it could actually make one. Every video it produced had a sound
  // describing a movement the picture never made, because the skill authoring the
  // script had no way to ask for one. Naming the knob is what closes that.
  const skill = read("skills/create-video/SKILL.md");
  const source = read("scripts/video/lib/ffmpeg-video.mjs");
  // Read the names out of the source rather than restating them here, so adding a
  // transition and forgetting to document it fails instead of passing quietly.
  const block = source.match(/export const TRANSITIONS = \{([^}]*)\}/)?.[1] ?? "";
  const names = [...block.matchAll(/^\s*(\w+):/gmu)].map((m) => m[1]);
  assert.ok(names.length >= 5, `could not read TRANSITIONS from the source: ${names.join(", ")}`);
  const missing = names.filter((k) => !skill.includes(k));
  assert.deepEqual(missing, [], `create-video never mentions: ${missing.join(", ")}`);
  assert.ok(
    /whoosh|swoosh|page-flip/.test(skill),
    "create-video should tie the transition-tagged SFX to an actual transition",
  );
});

test("the remotion backend discloses that Remotion is not open source", () => {
  // The backend table said "free" with no qualification, in both languages. True for most
  // people reading it and NOT true for everyone, which is the worst way for a cost line to
  // be wrong: Remotion is source-available, with a paid company licence above a size
  // threshold. Someone picking this backend at a company has to learn that before they
  // build a workflow on it, so it is said at the point of use as well as in the doc.
  const backend = read("scripts/video/lib/backends/remotion.mjs");
  const doc = read("docs/20-video-backends.md");
  for (const [where, text] of [["backends/remotion.mjs", backend], ["docs/20", doc]]) {
    assert.ok(/source-available/i.test(text), `${where} never says Remotion is source-available`);
    assert.ok(/compan(y|ies)/i.test(text), `${where} never mentions the company licence`);
  }
  // And the free-with-no-caveat claim must not come back.
  assert.ok(
    !/\|\s*`remotion`\s*\|\s*(free|miễn phí)\s*\|/.test(doc),
    "docs/20 lists remotion as flatly free again",
  );
});

test("every committed image is referenced from something a reader opens", () => {
  // `examples/gallery/burned-captions.jpg` shipped in a release referenced by nothing: it
  // was made for a pull-request description, which lives on GitHub and not in the tree.
  // An image nobody links to is weight in the clone for no reader.
  const walk = (d, a = []) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      const p = path.join(d, e.name);
      e.isDirectory() ? walk(p, a) : a.push(p);
    }
    return a;
  };
  const all = walk(KIT);
  const prose = all
    .filter((f) => /\.(md|mjs|json|yml)$/i.test(f))
    .map((f) => fs.readFileSync(f, "utf8"))
    .join("\n");
  const orphans = all
    .filter((f) => /\.(jpg|png)$/i.test(f))
    .filter((f) => !prose.includes(path.basename(f)))
    .map((f) => path.relative(KIT, f).replace(/\\/g, "/"));
  assert.deepEqual(orphans, [], `committed but linked from nowhere: ${orphans.join(", ")}`);
});

test("an image's bytes agree with its extension", () => {
  // `grid()` used to copy its single intermediate PNG row straight to the output path, so
  // `templates-2026.jpg` was a PNG wearing a .jpg name — three times the size it needed to
  // be. Browsers sniff the content and render it anyway, which is precisely why nobody
  // noticed: nothing looked wrong.
  const MAGIC = { jpg: "ffd8ff", jpeg: "ffd8ff", png: "89504e" };
  const walk = (d, a = []) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      const p = path.join(d, e.name);
      e.isDirectory() ? walk(p, a) : a.push(p);
    }
    return a;
  };
  for (const f of walk(KIT).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
    const ext = path.extname(f).slice(1).toLowerCase();
    const head = fs.readFileSync(f).subarray(0, 3).toString("hex");
    assert.equal(head, MAGIC[ext], `${path.relative(KIT, f)} is not really a ${ext}`);
  }
});

test("no gallery image is a wall the reader has to scroll past", () => {
  // GitHub scales an image to the column width, so a 1080x1920 gallery renders as a wall.
  //
  // The bound is a RATIO, not "wider than tall": the catalogue is 27 tiles in a grid and
  // comes out slightly taller than wide, which is fine. What is not fine is 9:16 — that
  // is 1.78 and it is the shape this test exists to keep out.
  const MAX = 1.5;
  const dir = path.join(KIT, "examples", "gallery");
  const images = fs.readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f));
  assert.ok(images.length, "no gallery images at all — did they move?");
  for (const f of images) {
    const { width, height } = jpegSize(fs.readFileSync(path.join(dir, f)), f);
    assert.ok(
      height / width <= MAX,
      `${f} is ${width}x${height} — ${(height / width).toFixed(2)}x taller than wide, over the ${MAX} bound`,
    );
  }
});

test("every skill is named in a README", () => {
  // Word boundaries, not a substring. `new-templates.jpg` contains "new-template", so a
  // plain `.includes()` reported the `new-template` skill as documented when the only match
  // in either README was an image filename. A test that passes for the wrong reason is
  // worse than no test: nobody goes back to re-examine a green one.
  const named = (n) => new RegExp(`\\b${n.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`).test(readmes);
  const missing = skillDirs.filter((n) => !named(n));
  assert.deepEqual(missing, [], `these skills exist but no README names them: ${missing.join(", ")}`);
});

test("the two READMEs name the same tools", () => {
  // README.en.md fell five features and 22 templates behind README.md, and every guard around
  // it stayed green. Two reasons, both structural: the count check lists three sentences from
  // README.md and one from README.en.md, and several other checks — this file's `readmes`
  // included — CONCATENATE the two before searching, so a feature documented in Vietnamese
  // alone satisfies them. English is the version most visitors to this repo read first.
  //
  // Tool names, not prose: two languages will never match sentence for sentence, and a test
  // demanding that would be deleted within a month. A CLI or a fill-in template named in one
  // README and absent from the other is a feature one set of readers cannot find.
  const named = (f) => new Set(read(f).match(/[a-z0-9-]+\.mjs|[A-Z_]+\.template\.json|crawl\.py/g) ?? []);
  const vi = named("README.vi.md");
  const en = named("README.md");
  const noEn = [...vi].filter((n) => !en.has(n)).sort();
  const noVi = [...en].filter((n) => !vi.has(n)).sort();
  assert.deepEqual(noEn, [], `README.vi.md names these and README.md does not: ${noEn.join(", ")}`);
  assert.deepEqual(noVi, [], `README.md names these and README.vi.md does not: ${noVi.join(", ")}`);
});

test("every doc is linked from somewhere", () => {
  // A numbered doc nobody links to is one nobody reads.
  const everything =
    readmes + bootstrap + skillDirs.map((n) => read(`skills/${n}/SKILL.md`)).join("\n") +
    fs.readdirSync(path.join(KIT, "docs")).map((f) => read(`docs/${f}`)).join("\n");
  const orphans = fs
    .readdirSync(path.join(KIT, "docs"))
    .filter((f) => f.endsWith(".md"))
    .filter((f) => !everything.includes(f));
  assert.deepEqual(orphans, [], `no skill, doc or README links to: ${orphans.join(", ")}`);
});

test("the .mcp.json servers are explained in a doc", () => {
  const mcp = JSON.parse(read(".mcp.json")).mcpServers;
  const docs = fs.readdirSync(path.join(KIT, "docs")).map((f) => read(`docs/${f}`)).join("\n");
  for (const name of Object.keys(mcp).filter((k) => !k.startsWith("_"))) {
    const url = mcp[name].url ?? "";
    const host = url.replace(/^https?:\/\//, "").split("/")[0].split(".").slice(-2).join(".");
    assert.ok(
      docs.includes(name) || docs.includes(host),
      `.mcp.json declares "${name}" but no doc explains what it is or what it costs`,
    );
  }
});
