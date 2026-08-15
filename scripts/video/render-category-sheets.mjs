import { run } from "./lib/proc.mjs";

const PRESETS_CONFIG = [
  { preset: "hooks", perRow: 8, width: 220, out: "examples/gallery/gallery-hooks.jpg" },
  { preset: "vox", perRow: 9, width: 200, out: "examples/gallery/gallery-vox.jpg" },
  { preset: "data", perRow: 7, width: 220, out: "examples/gallery/gallery-data.jpg" },
  { preset: "diagrams", perRow: 8, width: 220, out: "examples/gallery/gallery-diagrams.jpg" },
  { preset: "ui", perRow: 5, width: 220, out: "examples/gallery/gallery-ui.jpg" },
  { preset: "geo", perRow: 5, width: 220, out: "examples/gallery/gallery-geo.jpg" },
  { preset: "sequences", perRow: 7, width: 220, out: "examples/gallery/gallery-sequences.jpg" },
  { preset: "hybrid", perRow: 2, width: 260, out: "examples/gallery/gallery-hybrid.jpg" },
];

for (const cfg of PRESETS_CONFIG) {
  console.log(`\n=== Rendering ${cfg.preset} -> ${cfg.out} ===`);
  await run("node", [
    "scripts/video/template-sheet.mjs",
    "--preset", cfg.preset,
    "--per-row", String(cfg.perRow),
    "--width", String(cfg.width),
    "--out", cfg.out,
  ]);
}
console.log("\n✓ All category sheets rendered successfully!");
