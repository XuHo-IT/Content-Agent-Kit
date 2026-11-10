// The trend set replaced 27 templates. These are the reasons they were replaced, as rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TREND_TEMPLATES } from "../scripts/video/lib/build-trend-templates.mjs";
import { THEME_PRESETS } from "../scripts/video/lib/theme.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VT = path.join(KIT, "video-templates");
const read = (id, f) => fs.readFileSync(path.join(VT, id, f), "utf8");
const FILES = ["index.html", "compositions/portrait.html"];

test("every trend template is built and on disk", () => {
  for (const t of TREND_TEMPLATES) for (const f of FILES) assert.ok(fs.existsSync(path.join(VT, t.id, f)), `${t.id}/${f}`);
});

test("the built HTML matches the builder (nobody hand-edited it)", async () => {
  // Rebuild into memory is not exposed, so compare the declared defaults instead — the part
  // most likely to be edited by hand and then lost on the next build.
  for (const t of TREND_TEMPLATES) {
    for (const f of FILES) {
      const vars = JSON.parse(read(t.id, f).match(/data-composition-variables='([^']*)'/)[1].replace(/&#39;/g, "'"));
      assert.deepEqual(vars, t.vars, `${t.id}/${f} defaults drifted from build-trend-templates.mjs`);
    }
  }
});

test("no template reads the variables global hyperframes never defines", () => {
  // window.__compositionVariables does not exist; reading it silently renders demo copy.
  for (const id of fs.readdirSync(VT).filter((d) => d.startsWith("frame-"))) {
    for (const f of FILES) {
      if (!fs.existsSync(path.join(VT, id, f))) continue;
      assert.ok(!read(id, f).includes("__compositionVariables"), `${id}/${f} reads window.__compositionVariables`);
    }
  }
});

test("trend templates carry none of the AI-slop palette tells", () => {
  // Gradient-filled headlines, violet/cyan neon, glow halos. See docs/25-palettes.md.
  const VIOLET_CYAN = /#(a78bfa|8b5cf6|7c3aed|6d28d9|22d3ee|06b6d4|38bdf8|c084fc|e879f9)\b/i;
  for (const t of TREND_TEMPLATES) {
    for (const f of FILES) {
      const html = read(t.id, f);
      assert.ok(!/background-clip:\s*text/.test(html), `${t.id}/${f}: gradient-filled text`);
      assert.ok(!VIOLET_CYAN.test(html), `${t.id}/${f}: violet/cyan neon — ${html.match(VIOLET_CYAN)?.[0]}`);
      assert.ok(!/drop-shadow\(0 0 \d+px/.test(html), `${t.id}/${f}: neon glow filter`);
    }
  }
});

test("headline type is sized for a phone, not a desktop", () => {
  // The old set shipped 14px text on a 1080px-wide frame. The biggest font-size in a 9:16
  // composition must be at least 88px.
  for (const t of TREND_TEMPLATES) {
    const sizes = [...read(t.id, "compositions/portrait.html").matchAll(/font-size:\s*(\d+)px/g)].map((m) => Number(m[1]));
    assert.ok(Math.max(...sizes) >= 88, `${t.id}: largest 9:16 type is ${Math.max(...sizes)}px`);
  }
});

test("every industry palette is a single accent family", () => {
  // The anti-slop rule for presets: a narrow band. A wide spread is a rainbow.
  const industry = Object.entries(THEME_PRESETS).filter(([, v]) => / — /.test(v.label));
  assert.ok(industry.length >= 15, `only ${industry.length} industry palettes`);
  for (const [id, v] of industry) assert.ok(v.spread <= 18, `${id}: spread ${v.spread}° is not one accent family`);
});
