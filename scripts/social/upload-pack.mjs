#!/usr/bin/env node
// upload-pack.mjs — a ready-to-post folder for Zalo, Shopee Video, Shopee product pages and
// TikTok Shop: the platforms with no posting API.
//
//   node scripts/social/upload-pack.mjs video.mp4 --post caption.txt --hashtags "#ao #thoitrang" \
//        --cover cover.jpg --platforms zalo,shopee-video,tiktok-shop --out upload-pack/
//
// Per platform: video.mp4 checked against that platform's limits (delivery-check.mjs) and,
// when it would be refused, re-encoded to fit with --fix; caption.txt trimmed to the limit
// where one is published; cover.jpg copied; HUONG-DAN.md with the upload steps. Nothing is
// posted — these platforms have no public API for it. For TikTok, Facebook, Instagram,
// YouTube use make-post.mjs (Make webhook or Ayrshare) instead.
//
// ENV: none. Needs ffmpeg.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PACK_PLATFORMS, packCaption, checklist } from "./lib/upload-pack.mjs";

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("--help")) {
  console.log(
    `upload-pack.mjs — ready-to-post folders for platforms without a posting API\n` +
      `  <video.mp4>             the finished video\n` +
      `  --post <file|text>      caption\n` +
      `  --hashtags <text>       e.g. "#ao #thoitrang"\n` +
      `  --cover <image>         cover image (optional)\n` +
      `  --platforms a,b         ${Object.keys(PACK_PLATFORMS).join(" | ")} (default all)\n` +
      `  --out <dir>             default <video dir>/upload-pack`,
  );
  process.exit(argv.length ? 0 : 1);
}
const VALUE = new Set(["--post", "--hashtags", "--cover", "--platforms", "--out"]);
const flag = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const video = argv.find((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
if (!video || !fs.existsSync(video)) {
  console.error(`[pack] ✗ video not found: ${video}`);
  process.exit(1);
}
const postArg = flag("--post", "");
const post = postArg && fs.existsSync(postArg) ? fs.readFileSync(postArg, "utf8") : postArg;
const hashtags = flag("--hashtags", "");
const cover = flag("--cover");
const ids = flag("--platforms", Object.keys(PACK_PLATFORMS).join(",")).split(",").map((s) => s.trim()).filter(Boolean);
const unknown = ids.filter((i) => !PACK_PLATFORMS[i]);
if (unknown.length) {
  console.error(`[pack] ✗ unknown platform(s): ${unknown.join(", ")}. Known: ${Object.keys(PACK_PLATFORMS).join(", ")}`);
  process.exit(1);
}
const outRoot = flag("--out", path.join(path.dirname(path.resolve(video)), "upload-pack"));
const check = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "video", "delivery-check.mjs");

const index = [`# Gói đăng tay — ${path.basename(video)}`, ""];
for (const id of ids) {
  const p = PACK_PLATFORMS[id];
  const dir = path.join(outRoot, id);
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, "video.mp4");

  // Check first; re-encode only when the platform would refuse the file.
  const r = spawnSync(process.execPath, [check, video, "--platform", p.spec], { encoding: "utf8" });
  let videoNote;
  if (r.status === 0) {
    fs.copyFileSync(video, target);
    videoNote = "đạt thông số, dùng nguyên bản.";
  } else {
    const fix = spawnSync(process.execPath, [check, video, "--platform", p.spec, "--fix", target], { encoding: "utf8" });
    if (fix.status === 0 || fs.existsSync(target)) videoNote = "đã nén/chuyển định dạng cho vừa giới hạn của nền tảng.";
    else {
      videoNote = "KHÔNG tự sửa được — xem delivery-check.txt. Thường là video dài hơn giới hạn: cắt bớt (hoặc làm bản ngắn hơn) rồi chạy lại upload-pack, nén không giải quyết được độ dài.";
      fs.writeFileSync(path.join(dir, "delivery-check.txt"), (r.stdout || "") + (r.stderr || "") + (fix.stdout || "") + (fix.stderr || ""));
    }
  }

  let cut = false;
  if (!p.noCaption) {
    const c = packCaption(post, hashtags, p.captionMax);
    cut = c.cut;
    fs.writeFileSync(path.join(dir, "caption.txt"), c.text + "\n");
  }
  if (cover && fs.existsSync(cover)) fs.copyFileSync(cover, path.join(dir, "cover" + path.extname(cover)));
  fs.writeFileSync(path.join(dir, "HUONG-DAN.md"), checklist(p, { videoNote, captionCut: cut }));
  console.log(`[pack] ✓ ${id.padEnd(15)} ${videoNote}${cut ? " Caption rút gọn." : ""}`);
  index.push(`- **${p.label}** → \`${id}/\` (${videoNote})`);
}
fs.writeFileSync(path.join(outRoot, "README.md"), index.join("\n") + "\n");
console.log(`[pack] ✓ ${outRoot} — mở HUONG-DAN.md trong từng thư mục.`);
