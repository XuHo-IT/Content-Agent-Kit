// brand-bar.mjs — reserve a strip along the top of a finished video and put the channel's
// mark in it: logo at the left, wordmark at the right.
//
//   node scripts/video/brand-bar.mjs brain/<slug>/video.mp4 --logo brand/logo.png --text "The UnTolds"
//   node scripts/video/brand-bar.mjs <in.mp4> --text "The UnTolds" --band 130 --out branded.mp4
//
// WHY IT RESERVES INSTEAD OF OVERLAYS. Every template in this kit already uses its top-left
// corner — that is where the kicker and the chip live, starting around y=140 in a 1920-tall
// frame. Painting a bar on top of the finished render would cover them. So the picture is
// scaled down and pushed below the strip: nothing is cropped, nothing is hidden, and the
// aspect ratio is preserved (the sides get a thin matte rather than the picture being
// squeezed, because a 7% vertical squash is visible on faces and on anything round).
//
// The strip is drawn ONCE over the concatenated video rather than per template, so it
// cannot drift between scenes and costs one encode instead of seventeen.
//
// ENV: BRAND_BAR_FONT (a .ttf drawtext can open). Needs ffmpeg + ffprobe.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `brand-bar.mjs — logo left, wordmark right, in a reserved strip along the top\n` +
      `  <video.mp4>      the finished video\n` +
      `  --logo <png>     logo image (optional; text-only bar if omitted)\n` +
      `  --text <str>     wordmark drawn at the right (e.g. "The UnTolds")\n` +
      `  --band <n>       strip height in px (default 130)\n` +
      `  --bg <#rrggbb>   strip colour (default #0c0b0a)\n` +
      `  --color <#rrggbb>  wordmark colour (default #c9a86b)\n` +
      `  --size <n>       wordmark size in px (default 40)\n` +
      `  --font <file>    .ttf for the wordmark (env: BRAND_BAR_FONT)\n` +
      `  --out <file>     output (default <video>-branded.mp4, then swapped in)\n` +
      `  --keep           write --out and leave the original alone\n` +
      `env: BRAND_BAR_FONT (needs ffmpeg + ffprobe)`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}

const flag = (name, fallback = null) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const input = argv.find((a) => !a.startsWith("--") && argv[argv.indexOf(a) - 1]?.startsWith("--") === false) ?? argv[0];
if (!fs.existsSync(input)) {
  console.error(`brand-bar: no such video — ${input}`);
  process.exit(1);
}

const logo = flag("--logo");
if (logo && !fs.existsSync(logo)) {
  console.error(`brand-bar: no such logo — ${logo}`);
  process.exit(1);
}
const text = flag("--text", "");
const band = Number(flag("--band", "130"));
const bg = flag("--bg", "#0c0b0a");
const color = flag("--color", "#c9a86b");
const size = Number(flag("--size", "40"));
const keep = argv.includes("--keep");
const out = flag("--out", input.replace(/\.mp4$/i, "") + "-branded.mp4");

if (!Number.isFinite(band) || band < 40 || band > 400) {
  console.error(`brand-bar: --band ${band} is out of range (40–400)`);
  process.exit(1);
}
if (!logo && !text) {
  console.error(`brand-bar: give at least one of --logo or --text, or the strip is empty`);
  process.exit(1);
}

/** A .ttf ffmpeg can actually open. drawtext does NOT fall back to a system font. */
function findFont() {
  const explicit = flag("--font", process.env.BRAND_BAR_FONT || null);
  if (explicit) return fs.existsSync(explicit) ? explicit : null;
  const candidates = [
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

const escFilterPath = (p) => p.replace(/\\/g, "/").replace(/:/g, "\\:");
// A straight apostrophe terminates the filter string; the typographic one renders and does
// not. Same trick geo-flythrough.mjs uses for map credits.
const escText = (t) => String(t).replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\u2019");

function probe(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", file], { encoding: "utf8" });
  const m = String(r.stdout).trim().match(/(\d+)x(\d+)/);
  if (!m) { console.error(`brand-bar: ffprobe could not read ${file}`); process.exit(1); }
  return { w: +m[1], h: +m[2] };
}

// Running this twice stacks a second strip on a video that already has one, and the result
// looks deliberate enough that nobody notices until it is published. The backup beside the
// input is the tell.
const backupPath = input.replace(/\.mp4$/i, "") + "-nobar.mp4";
if (!keep && fs.existsSync(backupPath) && !argv.includes("--force")) {
  console.error(
    `brand-bar: ${path.basename(backupPath)} already exists, so ${path.basename(input)} very\n` +
    `  likely has a strip already — branding it again would stack a second one.\n` +
    `  Re-run against the clean cut instead:\n` +
    `    node ${path.relative(process.cwd(), process.argv[1]).replace(/\\/g, "/")} ${backupPath} --out ${input} --keep\n` +
    `  Or pass --force if you are certain this input is unbranded.`,
  );
  process.exit(1);
}

const { w: W, h: H } = probe(input);

// Scale to fit the remaining height, keep the aspect, matte the sides. Both dimensions are
// forced even — x264 rejects odd ones and the error names the pixel format, not the size.
const even = (n) => (n % 2 ? n - 1 : n);
const innerH = even(H - band);
const innerW = even(Math.round(W * (innerH / H)));
const padX = Math.round((W - innerW) / 2);

const font = text ? findFont() : null;
if (text && !font) {
  console.error(
    `brand-bar: NO FONT FOUND — drawtext cannot fall back to a system font, so the wordmark\n` +
    `  would fail the whole filter. Pass --font <file.ttf> or set BRAND_BAR_FONT.`,
  );
  process.exit(1);
}

const LOGO_PAD = 44;           // from the frame edge
const logoH = even(Math.round(band * 0.56));

const inputs = ["-i", input];
if (logo) inputs.push("-i", logo);

const chain = [];
// The picture: shrunk, matted, and pushed down below the strip.
chain.push(`[0:v]scale=${innerW}:${innerH},pad=${W}:${H}:${padX}:${band}:color=${bg}[base]`);

let last = "base";
if (logo) {
  chain.push(`[1:v]scale=-1:${logoH}[lg]`);
  chain.push(`[${last}][lg]overlay=${LOGO_PAD}:${Math.round((band - logoH) / 2)}[withlogo]`);
  last = "withlogo";
}
if (text) {
  // y centres on the strip using drawtext's own text_h — `ih` is crop/drawbox vocabulary
  // and silently is not available here.
  chain.push(
    `[${last}]drawtext=fontfile='${escFilterPath(font)}':text='${escText(text)}':` +
    `fontcolor=${color}:fontsize=${size}:x=w-tw-${LOGO_PAD}:y=(${band}-th)/2[out]`,
  );
  last = "out";
}
// A hairline so the strip reads as a deliberate edge rather than a letterbox accident.
chain.push(`[${last}]drawbox=x=0:y=${band - 2}:w=${W}:h=2:color=${color}@0.35:t=fill[final]`);

const args = [
  "-y", "-loglevel", "error", "-stats",
  ...inputs,
  "-filter_complex", chain.join(";"),
  "-map", "[final]", "-map", "0:a?",
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
  "-c:a", "copy", "-movflags", "+faststart",
  out,
];

console.log(`[brand] ${W}×${H} → strip ${band}px, picture ${innerW}×${innerH} at y=${band}`);
if (logo) console.log(`[brand]   logo:     ${logo} (${logoH}px tall, left)`);
if (text) console.log(`[brand]   wordmark: "${text}" (${size}px, right, ${color})`);

const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (r.status !== 0) {
  console.error(`brand-bar: ffmpeg exited ${r.status}`);
  process.exit(1);
}

if (!keep) {
  // Swap in place so the rest of the pipeline (post.md, publish.json, contact-sheet) keeps
  // pointing at the same filename. The pre-strip cut is kept beside it, once.
  const backup = input.replace(/\.mp4$/i, "") + "-nobar.mp4";
  if (!fs.existsSync(backup)) fs.renameSync(input, backup);
  else fs.rmSync(input);
  fs.renameSync(out, input);
  console.log(`[brand] ✓ ${input}   (bản chưa có thanh: ${path.basename(backup)})`);
} else {
  console.log(`[brand] ✓ ${out}`);
}
