import { run } from "./lib/proc.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: node scripts/video/render-all-galleries.mjs\n\nBatch renders all 9 gallery contact sheets for the documentation.");
  process.exit(0);
}

const SHEETS = [
  { name: "hooks", args: ["--preset", "hooks", "--per-row", "8", "--width", "220", "--out", "examples/gallery/gallery-hooks.jpg"] },
  { name: "vox", args: ["--preset", "vox", "--per-row", "9", "--width", "200", "--out", "examples/gallery/gallery-vox.jpg"] },
  { name: "data", args: ["--preset", "data", "--per-row", "7", "--width", "220", "--out", "examples/gallery/gallery-data.jpg"] },
  { name: "diagrams", args: ["--preset", "diagrams", "--per-row", "8", "--width", "220", "--out", "examples/gallery/gallery-diagrams.jpg"] },
  { name: "ui", args: ["--preset", "ui", "--per-row", "5", "--width", "220", "--out", "examples/gallery/gallery-ui.jpg"] },
  { name: "geo", args: ["--preset", "geo", "--per-row", "5", "--width", "220", "--out", "examples/gallery/gallery-geo.jpg"] },
  { name: "sequences", args: ["--preset", "sequences", "--per-row", "7", "--width", "220", "--out", "examples/gallery/gallery-sequences.jpg"] },
  { name: "hybrid", args: ["--preset", "hybrid", "--per-row", "2", "--width", "260", "--out", "examples/gallery/gallery-hybrid.jpg"] },
  { name: "all", args: ["--preset", "all", "--per-row", "11", "--width", "180", "--out", "examples/gallery/templates.jpg"] },
];

for (const s of SHEETS) {
  console.log(`\n========================================`);
  console.log(`>>> Rendering Sheet: ${s.name}`);
  console.log(`========================================`);
  await run("node", ["scripts/video/template-sheet.mjs", ...s.args]);
  console.log(`✓ ${s.name} done!`);
}
console.log("\n✓ All 9 gallery sheets successfully generated!");
