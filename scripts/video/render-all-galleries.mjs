import fs from "node:fs";
import path from "node:path";
import { run } from "./lib/proc.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log(
    "Usage: node scripts/video/render-all-galleries.mjs [options]\n\n" +
      "Renders category gallery contact sheets for the documentation.\n" +
      "By default, only renders sheets that are missing (skip if already exists).\n\n" +
      "Options:\n" +
      "  --force        Re-render all sheets even if they already exist\n" +
      "  --only <name>  Render only the specified category (e.g. --only fintech)\n"
  );
  process.exit(0);
}

const force = argv.includes("--force");
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;

const SHEETS = [
  { name: "hooks", out: "examples/gallery/gallery-hooks.jpg", args: ["--preset", "hooks", "--per-row", "8", "--width", "220", "--out", "examples/gallery/gallery-hooks.jpg"] },
  { name: "vox", out: "examples/gallery/gallery-vox.jpg", args: ["--preset", "vox", "--per-row", "9", "--width", "200", "--out", "examples/gallery/gallery-vox.jpg"] },
  { name: "data", out: "examples/gallery/gallery-data.jpg", args: ["--preset", "data", "--per-row", "7", "--width", "220", "--out", "examples/gallery/gallery-data.jpg"] },
  { name: "diagrams", out: "examples/gallery/gallery-diagrams.jpg", args: ["--preset", "diagrams", "--per-row", "8", "--width", "220", "--out", "examples/gallery/gallery-diagrams.jpg"] },
  { name: "ui", out: "examples/gallery/gallery-ui.jpg", args: ["--preset", "ui", "--per-row", "5", "--width", "220", "--out", "examples/gallery/gallery-ui.jpg"] },
  { name: "geo", out: "examples/gallery/gallery-geo.jpg", args: ["--preset", "geo", "--per-row", "5", "--width", "220", "--out", "examples/gallery/gallery-geo.jpg"] },
  { name: "sequences", out: "examples/gallery/gallery-sequences.jpg", args: ["--preset", "sequences", "--per-row", "7", "--width", "220", "--out", "examples/gallery/gallery-sequences.jpg"] },
  { name: "hybrid", out: "examples/gallery/gallery-hybrid.jpg", args: ["--preset", "hybrid", "--per-row", "2", "--width", "260", "--out", "examples/gallery/gallery-hybrid.jpg"] },
  { name: "fintech", out: "examples/gallery/gallery-fintech.jpg", args: ["--preset", "fintech", "--per-row", "5", "--width", "220", "--out", "examples/gallery/gallery-fintech.jpg"] },
  { name: "science", out: "examples/gallery/gallery-science.jpg", args: ["--preset", "science", "--per-row", "5", "--width", "220", "--out", "examples/gallery/gallery-science.jpg"] },
  { name: "documentary", out: "examples/gallery/gallery-documentary.jpg", args: ["--preset", "documentary", "--per-row", "5", "--width", "220", "--out", "examples/gallery/gallery-documentary.jpg"] },
  { name: "viral", out: "examples/gallery/gallery-viral.jpg", args: ["--preset", "viral", "--per-row", "5", "--width", "220", "--out", "examples/gallery/gallery-viral.jpg"] },
  { name: "saas", out: "examples/gallery/gallery-saas.jpg", args: ["--preset", "saas", "--per-row", "5", "--width", "220", "--out", "examples/gallery/gallery-saas.jpg"] },
  { name: "ecommerce", out: "examples/gallery/gallery-ecommerce.jpg", args: ["--preset", "ecommerce", "--per-row", "5", "--width", "220", "--out", "examples/gallery/gallery-ecommerce.jpg"] },
];

let renderedCount = 0;
for (const s of SHEETS) {
  if (only && s.name !== only) continue;
  if (!force && fs.existsSync(s.out)) {
    console.log(`- Skipping ${s.name} (${s.out} exists)`);
    continue;
  }
  console.log(`\n========================================`);
  console.log(`>>> Rendering Sheet: ${s.name}`);
  console.log(`========================================`);
  await run("node", ["scripts/video/template-sheet.mjs", ...s.args]);
  console.log(`✓ ${s.name} done!`);
  renderedCount++;
}

console.log(`\n✓ Done! Rendered ${renderedCount} gallery sheets.`);
