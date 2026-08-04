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

const skillDirs = fs
  .readdirSync(path.join(KIT, "skills"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const bootstrap = read("skills/bootstrap-content-agent/SKILL.md");
const readmes = read("README.md") + read("README.en.md") + read("AGENTS.md");

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

test("every skill is named in a README", () => {
  const missing = skillDirs.filter((n) => !readmes.includes(n));
  assert.deepEqual(missing, [], `these skills exist but no README names them: ${missing.join(", ")}`);
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
