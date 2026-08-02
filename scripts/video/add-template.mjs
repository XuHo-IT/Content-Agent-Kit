// add-template.mjs — pull a template, block or component from the HyperFrames registry.
//   node scripts/video/add-template.mjs --list
//   node scripts/video/add-template.mjs --list --type component --grep caption
//   node scripts/video/add-template.mjs transitions-blur caption-kinetic-slam
//   node scripts/video/add-template.mjs --preset news
//
// The registry (github.com/heygen-com/hyperframes, Apache-2.0) publishes 146 items as
// self-contained folders whose `registry-item.json` maps files -> targets. Those targets
// line up with the `paths` this kit's hyperframes.json already declares, so an item drops
// straight into video-templates/ with no rewriting.
//
// Reality check before you reach for the 8 full "examples": SEVEN OF THEM ARE 1920x1080.
// This pipeline renders 9:16, so a landscape example needs a portrait composition written
// by hand before it is useful. The blocks and components are mostly overlays and effects,
// which do not care about aspect — that is where the easy wins are.
//
// ENV: none (public raw.githubusercontent.com).
import fs from "node:fs";
import path from "node:path";
import { templatesDir } from "./lib/paths.mjs";

const REGISTRY = "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry";
const HOMEPAGE = "https://github.com/heygen-com/hyperframes";
const TYPE_DIR = {
  "hyperframes:example": "examples",
  "hyperframes:block": "blocks",
  "hyperframes:component": "components",
};

/** Aspect-independent picks that earn their keep on a 9:16 tech-news channel. */
const PRESETS = {
  news: [
    // scene-to-scene motion — the single biggest lift over hard cuts
    "transitions-blur", "transitions-dissolve", "transitions-push", "transitions-radial", "transitions-light",
    // moving type
    "caption-kinetic-slam", "caption-gradient-fill", "caption-glitch-rgb", "caption-neon-glow", "caption-highlight",
    // polish over footage
    "grain-overlay", "vignette", "motion-blur", "parallax-zoom", "light-leak",
    // broadcast furniture
    "news-ticker", "lt-clean-bar", "lt-kicker-name", "yt-lower-third",
    // show the numbers instead of reading them
    "data-chart", "flowchart-vertical", "world-map",
    // quote the original post
    "x-post", "reddit-post",
  ],
  code: ["code-snippet-dark-modern", "code-typing", "code-highlight", "code-diff", "code-scroll"],
};

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `add-template.mjs — vendor items from the HyperFrames registry\n` +
      `  <name> [<name>…]   items to add (see --list)\n` +
      `  --list             list everything available\n` +
      `  --type <t>         filter --list: example | block | component\n` +
      `  --grep <text>      filter --list by name\n` +
      `  --preset <p>       add a curated set: ${Object.keys(PRESETS).join(" | ")}\n` +
      `  --force            overwrite an item already present\n` +
      `note: 7 of the 8 "examples" are 1920x1080 — a 9:16 render needs a portrait\n` +
      `      composition written by hand. Blocks/components are aspect-independent.\n` +
      `env: none`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

async function getBuffer(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

try {
  const index = await getJson(`${REGISTRY}/registry.json`);
  const items = index.items ?? [];

  if (argv.includes("--list")) {
    const type = flag("--type");
    const grep = (flag("--grep") ?? "").toLowerCase();
    const filtered = items.filter(
      (i) =>
        (!type || i.type === `hyperframes:${type}` || i.type === type) &&
        (!grep || i.name.toLowerCase().includes(grep)),
    );
    const byType = {};
    for (const i of filtered) (byType[i.type] ??= []).push(i.name);
    for (const t of Object.keys(byType).sort()) {
      console.log(`\n[video] ${t}  (${byType[t].length})`);
      const names = byType[t].sort();
      for (let k = 0; k < names.length; k += 3) {
        console.log("  " + names.slice(k, k + 3).map((n) => n.padEnd(30)).join(""));
      }
    }
    console.log(`\n[video] ${filtered.length} of ${items.length} item(s). Add one with:`);
    console.log(`  node scripts/video/add-template.mjs <name>`);
    process.exit(0);
  }

  const preset = flag("--preset");
  const names = preset
    ? PRESETS[preset] ?? (() => { throw new Error(`Unknown preset "${preset}". Known: ${Object.keys(PRESETS).join(", ")}`); })()
    : argv.filter((a) => !a.startsWith("--") && a !== preset && a !== flag("--type") && a !== flag("--grep"));

  if (names.length === 0) throw new Error("Name at least one item, or pass --preset.");

  const dest = templatesDir();
  fs.mkdirSync(dest, { recursive: true });
  let added = 0;
  let skipped = 0;

  for (const name of names) {
    const meta = items.find((i) => i.name === name);
    if (!meta) {
      console.error(`[video] ✗ "${name}" is not in the registry — try --list --grep ${name.split("-")[0]}`);
      continue;
    }
    const dir = TYPE_DIR[meta.type];
    const target = path.join(dest, name);
    if (fs.existsSync(target) && !argv.includes("--force")) {
      console.log(`[video]   ${name}: already present (--force to overwrite)`);
      skipped++;
      continue;
    }

    const item = await getJson(`${REGISTRY}/${dir}/${name}/registry-item.json`);
    fs.mkdirSync(target, { recursive: true });

    for (const f of item.files ?? []) {
      const buf = await getBuffer(`${REGISTRY}/${dir}/${name}/${f.path}`);
      const out = path.join(target, f.target ?? f.path);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, buf);
    }

    // The kit's own per-template metadata, generated from the manifest rather than typed.
    fs.writeFileSync(
      path.join(target, "meta.json"),
      JSON.stringify({ id: name, name: item.title ?? name, type: meta.type }, null, 2) + "\n",
      "utf8",
    );
    fs.writeFileSync(
      path.join(target, "hyperframes.json"),
      JSON.stringify(
        {
          $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
          registry: REGISTRY,
          paths: { blocks: "compositions", components: "compositions/components", assets: "assets" },
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );

    // Apache-2.0 requires the notice to travel with the work and changes to be stated.
    const dims = item.dimensions ? `${item.dimensions.width}x${item.dimensions.height}` : "unspecified";
    fs.writeFileSync(
      path.join(target, "NOTICE.md"),
      `# Attribution — ${name}\n\n` +
        `**Source:** [heygen-com/hyperframes](${HOMEPAGE}) — \`registry/${dir}/${name}\`\n` +
        `**License:** Apache-2.0 (attribution required, commercial use allowed)\n` +
        `**Type:** ${meta.type}${item.stability ? ` · stability: ${item.stability}` : ""}\n` +
        `**Native size:** ${dims}${item.duration ? ` · ${item.duration}s` : ""}\n\n` +
        `## Description\n\n${item.description ?? "(none provided)"}\n\n` +
        (item.tags?.length ? `**Tags:** ${item.tags.join(", ")}\n\n` : "") +
        `## Changes in content-agent-kit\n\n` +
        `Vendored unmodified by \`scripts/video/add-template.mjs\`; only \`meta.json\` and\n` +
        `\`hyperframes.json\` were generated to match this kit's layout.\n` +
        (item.dimensions && item.dimensions.width > item.dimensions.height
          ? `\n> ⚠️ Native size is LANDSCAPE. This kit renders 9:16, so a portrait composition\n` +
            `> at \`compositions/portrait.html\` has to be written before this is usable there.\n`
          : "") +
        `\nDo not delete this file — see the root \`NOTICE.md\`.\n`,
      "utf8",
    );

    const warn =
      item.dimensions && item.dimensions.width > item.dimensions.height ? "  ⚠ landscape" : "";
    console.log(`[video] ✓ ${name.padEnd(28)} ${meta.type.replace("hyperframes:", "").padEnd(10)} ${dims}${warn}`);
    added++;
  }

  console.log(`\n[video] ${added} added, ${skipped} already present → ${dest}`);
  if (added) {
    console.log(`[video]   they are picked up automatically — the validator reads the folder.`);
    console.log(`[video]   render one before trusting it; not every item suits a 9:16 news video.`);
  }
} catch (e) {
  console.error(`[video] ✗ ${e.message}`);
  process.exit(1);
}
