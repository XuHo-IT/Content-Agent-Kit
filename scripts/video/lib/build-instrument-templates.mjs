// build-instrument-templates.mjs — the forensic instrument panel, and the case dashboard.
//
//   node scripts/video/lib/build-instrument-templates.mjs [--dry-run]
//
// WHY TWO TEMPLATES AND NOT THIRTY-EIGHT.
//
// The source for this file was two gallery pages with 38 designs in them. Read side by side,
// all 38 are the SAME frame:
//
//     .screen-pad
//       .mono-sub     "TOXICOLOGY // BLOOD PANEL ASSAY"
//       <widget>      ← the only thing that differs
//       .zinc-card    the caption
//
// Thirty-eight directories for one layout would have pushed the library from 127 to 165, and
// roughly sixteen of them duplicated frames that already existed — a sonar sweep next to
// `frame-geo-sonar-radar`, a heatmap next to `frame-geo-heatmap`, a polygraph next to
// `frame-polygraph`. A bigger library is not a richer one; it is a harder one to choose from,
// and choosing badly is exactly what put a laptop spec sheet in a horror episode.
//
// So: ONE instrument frame whose dial is picked by a slot, plus ONE dashboard that shows four
// of those dials at once. A new instrument is ~25 lines in the WIDGETS table below, not a new
// directory, and it works in both frames the moment it is added.
//
// DRAWN FROM DATA, NOT DECORATED. The mock-ups drew one thing and labelled it another: a
// stress bar pinned at 88% under keyframes running 45%→94%, a trajectory at `rotate(28deg)`
// beneath a caption reading 28.4°. Here `value_1..3` ARE the geometry — the bar height, the
// fluid level, the needle angle — so the number on screen and the shape on screen cannot
// disagree.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = path.join(ROOT, "video-templates");
const dryRun = process.argv.includes("--dry-run");

const FONTS =
  "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;900" +
  "&family=JetBrains+Mono:wght@400;700&display=swap";

/* ── shared base ───────────────────────────────────────────────────────────── */
const BASE = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;overflow:hidden;background:#09090c}
#root{width:100%;height:100%;position:relative;overflow:hidden;
  font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#fafafa;
  --red:#e11d48;--dim:#71717a;--line:#27272a;--panel:#121215;
  display:flex;flex-direction:column}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes growY{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes growX{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes drawIn{to{stroke-dashoffset:0}}
.crt{position:absolute;inset:0;pointer-events:none;z-index:30;opacity:.45;
  background:linear-gradient(rgba(18,16,16,0) 50%,rgba(0,0,0,.3) 50%);background-size:100% 4px}
.vignette{position:absolute;inset:0;pointer-events:none;z-index:29;
  background:radial-gradient(ellipse at 50% 45%,transparent 36%,rgba(0,0,0,.68) 100%)}
/* Ambient — the one layer that never finishes. Entrances land inside four seconds but a
   narrated scene runs eight to ten, and without this the back half is a photograph. */
.amb{position:absolute;inset:-15%;pointer-events:none;z-index:28;mix-blend-mode:screen;
  background:radial-gradient(circle at 26% 30%,rgba(225,29,72,.12),transparent 46%),
             radial-gradient(circle at 76% 70%,rgba(148,163,184,.09),transparent 52%);
  animation:ambDrift 19s ease-in-out infinite alternate}
@keyframes ambDrift{from{transform:translate3d(-2.5%,-1.5%,0) scale(1)}
  to{transform:translate3d(2.5%,1.5%,0) scale(1.06)}}
`;

/* ── the instrument well: layout shared by every widget ────────────────────── */
const WELL = (p) => `
.kicker{font-family:'JetBrains Mono',ui-monospace,monospace;
  font-size:${p ? "24px" : "20px"};letter-spacing:.2em;text-transform:uppercase;
  color:var(--dim);opacity:0;animation:fadeIn .5s ease .1s both}
.well{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  margin:${p ? "44px 0" : "26px 0"};min-height:0}
.readouts{display:flex;flex-direction:column;gap:${p ? "10px" : "7px"};
  background:var(--panel);border:1px solid var(--line);border-radius:8px;
  padding:${p ? "22px 24px" : "16px 18px"};
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:${p ? "24px" : "19px"};
  opacity:0;animation:fadeUp .55s ease 1.8s both}
.readouts .hot{color:var(--red);font-weight:700}
.cap{background:var(--panel);border:1px solid var(--line);border-radius:8px;
  padding:${p ? "24px 26px" : "17px 19px"};font-size:${p ? "30px" : "24px"};line-height:1.45;
  color:#d4d4d8;margin-top:${p ? "22px" : "15px"};
  opacity:0;animation:fadeUp .55s ease 2.2s both}
`;

/**
 * WIDGETS — the whole point of the file.
 *
 * Each entry gets the same contract so the dashboard can drop any of them into a cell:
 *   css(p)   layout for one aspect; class names MUST be prefixed with the widget id
 *   markup   uses value_1..3 / label_1..3, never its own slot names
 *   note     one line for CATALOG.md — what this instrument SAYS, not what it looks like
 *
 * `value_*` are percentages 0–100 unless the note says otherwise, and they drive the drawing.
 */
const WIDGETS = {
  /* ── forensic biology ─────────────────────────────────────────────────── */
  toxicology: {
    note: "Ba ống nghiệm, mực chất lỏng lấy từ value_1..3 — ống nào vượt ngưỡng thì đỏ.",
    css: (p) => `
.tox{display:flex;gap:${p ? "34px" : "18px"};align-items:flex-end}
.tox-v{width:${p ? "96px" : "42px"};height:${p ? "360px" : "150px"};border:4px solid #3f3f46;
  border-radius:0 0 40px 40px;position:relative;overflow:hidden;background:#0d0d11}
.tox-f{position:absolute;bottom:0;left:0;right:0;background:#52525b;
  transform-origin:bottom;animation:growY .9s cubic-bezier(.3,.9,.4,1) both}
.tox-v:nth-child(1) .tox-f{animation-delay:.5s}
.tox-v:nth-child(2) .tox-f{animation-delay:.7s}
.tox-v:nth-child(3) .tox-f{animation-delay:.9s}
/* Only the vial that is actually over the line goes red. Colouring all three would make the
   frame look alarming without saying which reading is the alarming one. */
.tox-f.over{background:var(--red);box-shadow:0 0 26px rgba(225,29,72,.5)}
.tox-l{text-align:center;font-family:'JetBrains Mono',monospace;font-size:${p ? "24px" : "15px"};
  color:var(--dim);margin-top:${p ? "18px" : "9px"};width:${p ? "130px" : "56px"};
  line-height:1.3;word-break:break-word}`,
    markup: `<div class="tox">
      <div><div class="tox-v"><div class="tox-f" data-fill="1"></div></div><div class="tox-l" data-slot="label_1"></div></div>
      <div><div class="tox-v"><div class="tox-f" data-fill="2"></div></div><div class="tox-l" data-slot="label_2"></div></div>
      <div><div class="tox-v"><div class="tox-f" data-fill="3"></div></div><div class="tox-l" data-slot="label_3"></div></div>
    </div>`,
  },

  xray: {
    note: "Ảnh chụp X-quang đảo màu với một vòng khoanh vùng tổn thương — vị trí theo value_1/value_2 (%).",
    css: (p) => `
.xr{position:relative;width:${p ? "92%" : "44%"};aspect-ratio:3/4;border:1px solid #2a2f3a;
  background:radial-gradient(ellipse at 50% 42%,#1d2531,#0a0d12 72%);overflow:hidden;
  opacity:0;animation:fadeIn .8s ease .3s both}
/* Drawn, not photographed. A stock X-ray is someone's actual medical record. */
.xr-b{position:absolute;left:50%;top:8%;transform:translateX(-50%);
  width:${p ? "46%" : "44%"};height:84%;border-radius:48% 48% 42% 42%;
  background:linear-gradient(180deg,rgba(190,208,230,.30),rgba(140,160,190,.12) 62%,transparent);
  box-shadow:inset 0 0 40px rgba(200,220,255,.16)}
.xr-r{position:absolute;left:12%;right:12%;height:${p ? "10px" : "8px"};border-radius:6px;
  background:linear-gradient(90deg,transparent,rgba(200,220,255,.34),transparent)}
.xr-r:nth-of-type(2){top:34%}.xr-r:nth-of-type(3){top:46%}.xr-r:nth-of-type(4){top:58%}
.xr-m{position:absolute;width:${p ? "74px" : "56px"};aspect-ratio:1;border:3px solid var(--red);
  border-radius:50%;transform:translate(-50%,-50%);
  box-shadow:0 0 22px rgba(225,29,72,.55);opacity:0;
  animation:fadeIn .4s ease 1.5s both,xrPing 2.6s ease-out 1.9s infinite}
@keyframes xrPing{0%{box-shadow:0 0 0 0 rgba(225,29,72,.5)}100%{box-shadow:0 0 0 26px rgba(225,29,72,0)}}
.xr-scan{position:absolute;left:0;right:0;height:2px;background:rgba(190,220,255,.75);
  box-shadow:0 0 16px rgba(190,220,255,.8);animation:xrSweep 3.4s ease-in-out .6s 2 both}
@keyframes xrSweep{0%{top:2%}100%{top:96%}}`,
    markup: `<div class="xr">
      <div class="xr-b"></div><div class="xr-r"></div><div class="xr-r"></div><div class="xr-r"></div>
      <div class="xr-m" data-pos="1"></div><div class="xr-scan"></div>
    </div>`,
  },

  dental: {
    note: "Cung răng 16 vị trí; value_1 là phần trăm trùng khớp, số răng sáng lên tính từ đó.",
    css: (p) => `
.dt{width:100%;display:grid;grid-template-columns:repeat(8,1fr);gap:${p ? "8px" : "6px"};
  padding:${p ? "20px" : "14px"};background:var(--panel);border:1px solid var(--line);border-radius:8px}
.dt-t{height:${p ? "70px" : "32px"};background:#27272a;border-radius:4px;
  opacity:0;animation:fadeIn .3s ease both}
.dt-t.m{background:#fafafa;box-shadow:0 0 14px rgba(255,255,255,.55)}
.dt-pct{margin-top:${p ? "24px" : "16px"};font-family:'JetBrains Mono',monospace;
  font-size:${p ? "56px" : "42px"};font-weight:700;color:#fafafa;
  opacity:0;animation:fadeUp .6s ease 1.6s both}`,
    markup: `<div><div class="dt" data-teeth="16"></div><div class="dt-pct" data-pct="1"></div></div>`,
  },

  "algor-curve": {
    note: "Đường thân nhiệt tụt sau khi chết, vẽ dần; value_1 là điểm đo hiện tại trên trục thời gian (%).",
    css: (p) => `
.ag{width:100%;height:${p ? "420px" : "200px"};position:relative;
  border-left:2px solid #3f3f46;border-bottom:2px solid #3f3f46}
.ag svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.ag path{fill:none;stroke:var(--red);stroke-width:3;stroke-linecap:round;
  stroke-dasharray:1000;stroke-dashoffset:1000;animation:drawIn 2.4s ease-out .5s both}
.ag-dot{position:absolute;width:${p ? "18px" : "14px"};aspect-ratio:1;background:#fafafa;
  border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 16px rgba(255,255,255,.7);
  opacity:0;animation:fadeIn .3s ease 2.6s both}
.ag-g{position:absolute;left:0;right:0;height:1px;background:#1e1e24}
.ag-g:nth-of-type(1){top:25%}.ag-g:nth-of-type(2){top:50%}.ag-g:nth-of-type(3){top:75%}`,
    markup: `<div class="ag">
      <div class="ag-g"></div><div class="ag-g"></div><div class="ag-g"></div>
      <svg viewBox="0 0 300 100" preserveAspectRatio="none"><path d="M0,8 Q110,34 300,88"/></svg>
      <div class="ag-dot" data-curve="1"></div>
    </div>`,
  },

  microscope: {
    note: "Vòng kính hiển vi soi một nét mực; dùng khi nói về chữ ký giả hay nét bút.",
    css: (p) => `
.ms{width:${p ? "520px" : "230px"};aspect-ratio:1;border-radius:50%;overflow:hidden;
  position:relative;background:radial-gradient(circle,#efeadd 0%,#cfc7b6 62%,#8d8778 100%);
  box-shadow:0 0 0 ${p ? "10px" : "8px"} #18181b,0 0 46px rgba(0,0,0,.8);
  display:flex;align-items:center;justify-content:center;
  animation:msIn .7s cubic-bezier(.2,.9,.3,1) .3s both}
@keyframes msIn{from{opacity:0;transform:scale(1.25)}to{opacity:1;transform:scale(1)}}
.ms-w{font-family:'Be Vietnam Pro',cursive;font-style:italic;font-weight:700;color:#14110d;
  font-size:${p ? "92px" : "44px"};transform:rotate(-7deg)}
/* Crosshair and a slow focus breathe — a lens someone is still adjusting. */
.ms::before,.ms::after{content:"";position:absolute;background:rgba(20,17,13,.35)}
.ms::before{left:0;right:0;height:1px;top:50%}
.ms::after{top:0;bottom:0;width:1px;left:50%}
.ms-r{position:absolute;inset:${p ? "26px" : "20px"};border:1px dashed rgba(20,17,13,.3);
  border-radius:50%;animation:msSpin 24s linear infinite}
@keyframes msSpin{to{transform:rotate(360deg)}}`,
    markup: `<div class="ms"><div class="ms-r"></div><div class="ms-w" data-slot="label_1"></div></div>`,
  },

  "evidence-bag": {
    note: "Túi niêm phong vật chứng có mã vạch — dùng cho chuỗi bảo quản vật chứng.",
    css: (p) => `
.eb{width:${p ? "88%" : "42%"};background:rgba(226,232,240,.09);
  border:2px dashed #52525b;border-radius:10px;padding:${p ? "30px 26px" : "22px 20px"};
  position:relative;animation:fadeUp .7s ease .35s both}
.eb-z{position:absolute;top:${p ? "14px" : "10px"};left:6%;right:6%;height:${p ? "12px" : "9px"};
  background:repeating-linear-gradient(90deg,#52525b,#52525b 4px,transparent 4px,transparent 8px)}
.eb-t{font-family:'JetBrains Mono',monospace;font-size:${p ? "24px" : "19px"};color:var(--red);
  font-weight:700;letter-spacing:.1em;margin-top:${p ? "18px" : "13px"}}
.eb-b{margin-top:${p ? "22px" : "16px"};height:${p ? "56px" : "42px"};
  background:repeating-linear-gradient(90deg,#e4e4e7 0 3px,transparent 3px 6px,#e4e4e7 6px 8px,transparent 8px 13px);
  transform-origin:left;animation:growX .6s ease .9s both}
.eb-c{font-family:'JetBrains Mono',monospace;font-size:${p ? "20px" : "16px"};color:#a1a1aa;
  margin-top:${p ? "12px" : "9px"};letter-spacing:.14em}`,
    markup: `<div class="eb"><div class="eb-z"></div>
      <div class="eb-t" data-slot="label_1"></div>
      <div class="eb-b"></div>
      <div class="eb-c" data-slot="label_2"></div>
    </div>`,
  },

  /* ── digital trace ────────────────────────────────────────────────────── */
  "web-history": {
    note: "Ba dòng lịch sử tìm kiếm với dấu thời gian; dòng nào đáng ngại thì đỏ (label bắt đầu bằng !).",
    css: (p) => `
.wh{width:100%}
.wh-r{display:flex;justify-content:space-between;gap:${p ? "24px" : "14px"};
  border-bottom:1px dashed var(--line);padding:${p ? "28px 0" : "12px 0"};
  font-family:'JetBrains Mono',monospace;font-size:${p ? "30px" : "17px"};
  opacity:0;animation:fadeUp .5s ease both}
.wh-r:nth-child(1){animation-delay:.5s}
.wh-r:nth-child(2){animation-delay:1s}
.wh-r:nth-child(3){animation-delay:1.5s}
.wh-t{color:var(--dim);flex:none}
.wh-q{text-align:right;color:#e4e4e7}
.wh-r.alert .wh-q{color:var(--red);font-weight:700}`,
    markup: `<div class="wh">
      <div class="wh-r grp"><span class="wh-t" data-slot="value_1"></span><span class="wh-q req" data-slot="label_1"></span></div>
      <div class="wh-r grp"><span class="wh-t" data-slot="value_2"></span><span class="wh-q req" data-slot="label_2"></span></div>
      <div class="wh-r grp"><span class="wh-t" data-slot="value_3"></span><span class="wh-q req" data-slot="label_3"></span></div>
    </div>`,
    rawValues: true, // value_* here are timestamps, not percentages
  },

  "ip-trace": {
    note: "Chuỗi máy chủ trung chuyển, chặng cuối sáng đỏ — dùng khi lần ra nguồn thật của một tài khoản.",
    css: (p) => `
.ipt{width:100%;display:flex;flex-direction:column;gap:${p ? "44px" : "18px"}}
.ipt-h{display:flex;align-items:center;gap:${p ? "26px" : "13px"};
  font-family:'JetBrains Mono',monospace;font-size:${p ? "34px" : "18px"};color:#a1a1aa;
  position:relative;opacity:0;animation:fadeUp .5s ease both}
.ipt-h:nth-child(1){animation-delay:.5s}
.ipt-h:nth-child(2){animation-delay:1.1s}
.ipt-h:nth-child(3){animation-delay:1.7s}
.ipt-d{width:${p ? "22px" : "12px"};aspect-ratio:1;border-radius:50%;background:#52525b;flex:none}
/* The line between hops is drawn by the dot's own ::after, so a removed hop takes its
   connector with it instead of leaving a stub hanging in the air. */
.ipt-h:not(:last-child) .ipt-d::after{content:"";position:absolute;left:${p ? "10px" : "5px"};
  top:${p ? "22px" : "12px"};width:2px;height:${p ? "44px" : "18px"};background:#3f3f46}
.ipt-h.last{color:var(--red);font-weight:700}
.ipt-h.last .ipt-d{background:var(--red);box-shadow:0 0 16px var(--red)}`,
    markup: `<div class="ipt">
      <div class="ipt-h grp"><span class="ipt-d"></span><span class="req" data-slot="label_1"></span></div>
      <div class="ipt-h grp"><span class="ipt-d"></span><span class="req" data-slot="label_2"></span></div>
      <div class="ipt-h last grp"><span class="ipt-d"></span><span class="req" data-slot="label_3"></span></div>
    </div>`,
  },

  "gps-dashcam": {
    note: "Đồng hồ tốc độ; value_1 là phần trăm kim quay, label_1 là con số đọc ra.",
    css: (p) => `
.gp{width:${p ? "480px" : "230px"};aspect-ratio:1;border-radius:50%;position:relative;
  border:${p ? "4px" : "3px"} dashed #27272a;display:flex;flex-direction:column;
  align-items:center;justify-content:center;animation:fadeIn .6s ease .3s both}
/* The arc IS the number: one conic stop, driven by value_1. */
.gp-a{position:absolute;inset:${p ? "-4px" : "-3px"};border-radius:50%;
  background:conic-gradient(var(--red) calc(var(--pct) * 1%),transparent 0);
  -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - ${p ? "8px" : "6px"}),#000 0);
  mask:radial-gradient(farthest-side,transparent calc(100% - ${p ? "8px" : "6px"}),#000 0);
  animation:gpSweep 1.5s cubic-bezier(.25,.9,.3,1) .5s both}
@keyframes gpSweep{from{--pct:0}}
@property --pct{syntax:'<number>';inherits:true;initial-value:0}
.gp-n{font-family:'JetBrains Mono',monospace;font-size:${p ? "120px" : "58px"};font-weight:700}
.gp-u{font-family:'JetBrains Mono',monospace;font-size:${p ? "20px" : "16px"};color:var(--dim);
  letter-spacing:.2em}`,
    markup: `<div class="gp" data-arc="1"><div class="gp-a"></div>
      <div class="gp-n" data-slot="label_1"></div><div class="gp-u" data-slot="label_2"></div>
    </div>`,
  },

  spectrogram: {
    note: "Phổ âm thanh với một dải sáng nổi lên giữa nhiễu — dùng khi bóc tách được tiếng nói trong tạp âm.",
    css: (p) => `
.sp{width:100%;height:${p ? "400px" : "190px"};background:#07080a;border:1px solid var(--line);
  border-radius:8px;position:relative;overflow:hidden;display:flex;align-items:flex-end;
  gap:${p ? "3px" : "2px"};padding:${p ? "12px" : "9px"}}
.sp-c{flex:1;background:linear-gradient(180deg,rgba(225,29,72,.9),rgba(148,163,184,.28));
  border-radius:2px 2px 0 0;transform-origin:bottom;
  animation:growY .5s cubic-bezier(.3,.9,.4,1) both}
.sp-b{position:absolute;left:0;right:0;height:${p ? "40px" : "30px"};
  background:linear-gradient(90deg,transparent,rgba(250,250,250,.18),transparent);
  animation:spBand 5s ease-in-out 1.2s infinite alternate}
@keyframes spBand{from{top:64%}to{top:26%}}`,
    markup: `<div class="sp" data-bars="26"><div class="sp-b"></div></div>`,
  },

  /* ── space and terrain ────────────────────────────────────────────────── */
  "lidar-mesh": {
    note: "Khối lưới LiDAR xoay chậm — dùng khi nói về mô hình 3D của một không gian.",
    css: (p) => `
.lm{width:${p ? "440px" : "200px"};aspect-ratio:1;perspective:900px;
  display:flex;align-items:center;justify-content:center;
  opacity:0;animation:fadeIn .7s ease .3s both}
.lm-c{width:70%;height:70%;position:relative;transform-style:preserve-3d;
  animation:lmSpin 26s linear infinite}
@keyframes lmSpin{to{transform:rotateX(-18deg) rotateY(360deg)}}
.lm-f{position:absolute;inset:0;border:2px solid rgba(148,197,255,.5);
  background:repeating-linear-gradient(0deg,rgba(148,197,255,.10) 0 1px,transparent 1px 14px),
             repeating-linear-gradient(90deg,rgba(148,197,255,.10) 0 1px,transparent 1px 14px)}
.lm-f:nth-child(1){transform:translateZ(${p ? "154px" : "70px"})}
.lm-f:nth-child(2){transform:rotateY(180deg) translateZ(${p ? "154px" : "70px"})}
.lm-f:nth-child(3){transform:rotateY(90deg) translateZ(${p ? "154px" : "70px"})}
.lm-f:nth-child(4){transform:rotateY(-90deg) translateZ(${p ? "154px" : "70px"})}
.lm-f:nth-child(5){transform:rotateX(90deg) translateZ(${p ? "154px" : "70px"})}
.lm-f:nth-child(6){transform:rotateX(-90deg) translateZ(${p ? "154px" : "70px"});
  border-color:rgba(225,29,72,.6)}`,
    markup: `<div class="lm"><div class="lm-c">
      <div class="lm-f"></div><div class="lm-f"></div><div class="lm-f"></div>
      <div class="lm-f"></div><div class="lm-f"></div><div class="lm-f"></div>
    </div></div>`,
  },

  "terrain-contour": {
    note: "Đường bình độ địa hình với một điểm đánh dấu — dùng cho địa hình hiểm trở hay ranh giới.",
    css: (p) => `
.tc{width:100%;height:${p ? "430px" : "205px"};position:relative;background:#0a0b0f;
  border:1px solid var(--line);border-radius:8px;overflow:hidden;
  opacity:0;animation:fadeIn .7s ease .3s both}
.tc svg{position:absolute;inset:0;width:100%;height:100%}
.tc path{fill:none;stroke:rgba(148,163,184,.34);stroke-width:1.5;
  stroke-dasharray:900;stroke-dashoffset:900;animation:drawIn 2.6s ease-out both}
.tc path:nth-child(1){animation-delay:.4s}
.tc path:nth-child(2){animation-delay:.6s}
.tc path:nth-child(3){animation-delay:.8s;stroke:rgba(148,163,184,.5)}
.tc path:nth-child(4){animation-delay:1s;stroke:var(--red);stroke-width:2.5}
.tc-p{position:absolute;width:${p ? "20px" : "15px"};aspect-ratio:1;background:var(--red);
  border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 20px var(--red);
  opacity:0;animation:fadeIn .4s ease 2.4s both}`,
    markup: `<div class="tc">
      <svg viewBox="0 0 300 200" preserveAspectRatio="none">
        <path d="M-10,168 Q60,140 118,156 T310,132"/>
        <path d="M-10,136 Q66,104 126,122 T310,98"/>
        <path d="M-10,104 Q72,70 132,88 T310,66"/>
        <path d="M-10,72 Q78,38 138,56 T310,36"/>
      </svg>
      <div class="tc-p" data-pos="1"></div>
    </div>`,
  },

  "sewer-cutaway": {
    note: "Mặt cắt đường hầm ngầm — dùng cho lối thoát, cống, hầm.",
    css: (p) => `
.sw{width:100%;height:${p ? "430px" : "205px"};position:relative;overflow:hidden;
  background:linear-gradient(180deg,#16181d 0%,#0b0c10 46%,#07080a 100%);
  border:1px solid var(--line);border-radius:8px;
  opacity:0;animation:fadeIn .7s ease .3s both}
/* Soil strata above, then the pipe cut through it. */
.sw-s{position:absolute;left:0;right:0;height:${p ? "9px" : "7px"};background:rgba(120,113,108,.22)}
.sw-s:nth-of-type(1){top:9%}.sw-s:nth-of-type(2){top:17%}.sw-s:nth-of-type(3){top:26%}
.sw-p{position:absolute;left:-6%;right:-6%;top:44%;height:${p ? "120px" : "88px"};
  border-top:3px solid #52525b;border-bottom:3px solid #52525b;
  background:radial-gradient(ellipse at 50% 50%,rgba(148,163,184,.14),transparent 72%)}
.sw-l{position:absolute;left:0;right:0;top:50%;height:2px;
  background:linear-gradient(90deg,transparent,rgba(225,29,72,.85),transparent);
  animation:swRun 4.2s ease-in-out 1s 2 both}
@keyframes swRun{from{transform:translateX(-58%)}to{transform:translateX(58%)}}`,
    markup: `<div class="sw">
      <div class="sw-s"></div><div class="sw-s"></div><div class="sw-s"></div>
      <div class="sw-p"></div><div class="sw-l"></div>
    </div>`,
  },

  /* ── tracking a moving thing ──────────────────────────────────────────── */
  "flight-radar": {
    note: "Vệt bay cắt ngang màn radar rồi mất tín hiệu ở value_1% quãng đường.",
    css: (p) => `
.fr{width:100%;height:${p ? "420px" : "198px"};position:relative;border:1px solid var(--line);
  border-radius:8px;overflow:hidden;background:
    repeating-linear-gradient(0deg,rgba(148,163,184,.06) 0 1px,transparent 1px 30px),
    repeating-linear-gradient(90deg,rgba(148,163,184,.06) 0 1px,transparent 1px 30px),#07090c;
  opacity:0;animation:fadeIn .6s ease .3s both}
.fr-t{position:absolute;top:44%;left:4%;height:2px;background:
  linear-gradient(90deg,rgba(250,250,250,.7),rgba(250,250,250,.15));
  transform-origin:left;animation:growX 2s ease-out .6s both}
.fr-p{position:absolute;top:44%;font-size:${p ? "30px" : "23px"};color:#fafafa;
  transform:translate(-50%,-58%);opacity:0;animation:fadeIn .3s ease 2.4s both}
.fr-x{position:absolute;top:44%;font-family:'JetBrains Mono',monospace;
  font-size:${p ? "20px" : "16px"};color:var(--red);font-weight:700;
  transform:translate(-50%,-190%);opacity:0;animation:fadeIn .4s ease 2.7s both}`,
    markup: `<div class="fr">
      <div class="fr-t" data-width="1"></div>
      <div class="fr-p" data-pos-x="1">✈</div>
      <div class="fr-x" data-pos-x="1" data-slot="label_1"></div>
    </div>`,
  },

  "bts-triangulate": {
    note: "Ba vòng phủ sóng giao nhau; điểm giao là vị trí máy — dùng cho định vị điện thoại.",
    css: (p) => `
.bt{width:100%;height:${p ? "450px" : "212px"};position:relative;border:1px solid var(--line);
  border-radius:8px;background:#08090c;overflow:hidden;
  opacity:0;animation:fadeIn .6s ease .3s both}
.bt-c{position:absolute;border:2px solid rgba(148,163,184,.45);border-radius:50%;
  transform:translate(-50%,-50%) scale(0);animation:btGrow .8s cubic-bezier(.2,.9,.3,1) both}
@keyframes btGrow{to{transform:translate(-50%,-50%) scale(1)}}
.bt-c:nth-of-type(1){left:30%;top:34%;width:${p ? "200px" : "150px"};aspect-ratio:1;animation-delay:.5s}
.bt-c:nth-of-type(2){left:66%;top:44%;width:${p ? "190px" : "142px"};aspect-ratio:1;animation-delay:.8s}
.bt-c:nth-of-type(3){left:46%;top:70%;width:${p ? "210px" : "156px"};aspect-ratio:1;animation-delay:1.1s}
.bt-x{position:absolute;left:47%;top:48%;width:${p ? "20px" : "15px"};aspect-ratio:1;
  background:var(--red);border-radius:50%;transform:translate(-50%,-50%);
  box-shadow:0 0 24px var(--red);opacity:0;animation:fadeIn .4s ease 1.9s both}`,
    markup: `<div class="bt">
      <div class="bt-c"></div><div class="bt-c"></div><div class="bt-c"></div><div class="bt-x"></div>
    </div>`,
  },

  "smuggle-route": {
    note: "Cung đường vượt biên vẽ dần qua các trạm — dùng cho buôn lậu, di chuyển xuyên biên giới.",
    css: (p) => `
.sm{width:100%;height:${p ? "400px" : "184px"};position:relative;border:1px solid var(--line);
  border-radius:8px;background:#08090c;overflow:hidden;
  opacity:0;animation:fadeIn .6s ease .3s both}
.sm svg{position:absolute;inset:0;width:100%;height:100%}
.sm path{fill:none;stroke:var(--red);stroke-width:3;stroke-linecap:round;
  stroke-dasharray:600;stroke-dashoffset:600;animation:drawIn 2.6s ease-out .5s both}
.sm-s{position:absolute;width:${p ? "14px" : "11px"};aspect-ratio:1;border:2px solid #a1a1aa;
  border-radius:50%;transform:translate(-50%,-50%);background:#08090c;
  opacity:0;animation:fadeIn .3s ease both}
.sm-s:nth-of-type(1){left:12%;top:74%;animation-delay:.9s}
.sm-s:nth-of-type(2){left:50%;top:26%;animation-delay:1.7s}
.sm-s:nth-of-type(3){left:88%;top:66%;animation-delay:2.5s;border-color:var(--red)}`,
    markup: `<div class="sm">
      <svg viewBox="0 0 300 180" preserveAspectRatio="none"><path d="M36,133 Q150,14 264,119"/></svg>
      <div class="sm-s"></div><div class="sm-s"></div><div class="sm-s"></div>
    </div>`,
  },

  "ais-vessel": {
    note: "Bảng thông số tàu neo ngoài khơi — ba dòng label_1..3, kiểu bản tin hàng hải.",
    css: (p) => `
.av{width:100%;background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--red);
  border-radius:8px;padding:${p ? "28px 26px" : "20px 19px"};
  font-family:'JetBrains Mono',monospace;font-size:${p ? "30px" : "20px"};line-height:1.85;
  animation:fadeUp .6s ease .4s both}
.av-r{display:flex;justify-content:space-between;gap:${p ? "18px" : "13px"};
  border-bottom:1px dashed var(--line);padding-bottom:${p ? "10px" : "7px"};
  margin-bottom:${p ? "10px" : "7px"};opacity:0;animation:fadeIn .4s ease both}
.av-r:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.av-r:nth-child(1){animation-delay:.8s}
.av-r:nth-child(2){animation-delay:1.1s}
.av-r:nth-child(3){animation-delay:1.4s}
.av-r span:first-child{color:var(--dim)}
.av-r span:last-child{color:#fafafa;font-weight:700;text-align:right}`,
    markup: `<div class="av">
      <div class="av-r grp"><span data-slot="value_1"></span><span class="req" data-slot="label_1"></span></div>
      <div class="av-r grp"><span data-slot="value_2"></span><span class="req" data-slot="label_2"></span></div>
      <div class="av-r grp"><span data-slot="value_3"></span><span class="req" data-slot="label_3"></span></div>
    </div>`,
    rawValues: true,
  },

  /* ── money ────────────────────────────────────────────────────────────── */
  "money-chain": {
    note: "Chuỗi tài khoản tiền đi qua, mỗi chặng một dòng; chặng cuối đỏ. Dùng cho rửa tiền, thiên đường thuế.",
    css: (p) => `
.mc{width:100%;display:flex;flex-direction:column;gap:${p ? "10px" : "7px"}}
.mc-n{display:flex;justify-content:space-between;gap:${p ? "16px" : "12px"};
  padding:${p ? "18px 20px" : "13px 15px"};background:var(--panel);border:1px solid var(--line);
  border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:${p ? "28px" : "17px"};
  opacity:0;animation:fadeUp .5s ease both}
.mc-n:nth-of-type(1){animation-delay:.5s}
.mc-n:nth-of-type(3){animation-delay:1.2s}
.mc-n:nth-of-type(5){animation-delay:1.9s}
.mc-n:last-of-type{border-color:rgba(225,29,72,.5)}
.mc-n:last-of-type span:last-child{color:var(--red);font-weight:700}
.mc-a{text-align:center;color:var(--red);font-size:${p ? "24px" : "19px"};
  opacity:0;animation:fadeIn .3s ease both}
.mc-a:nth-of-type(2){animation-delay:.95s}
.mc-a:nth-of-type(4){animation-delay:1.65s}`,
    markup: `<div class="mc">
      <div class="mc-n grp"><span class="req" data-slot="label_1"></span><span data-slot="value_1"></span></div>
      <div class="mc-a">▼</div>
      <div class="mc-n grp"><span class="req" data-slot="label_2"></span><span data-slot="value_2"></span></div>
      <div class="mc-a">▼</div>
      <div class="mc-n grp"><span class="req" data-slot="label_3"></span><span data-slot="value_3"></span></div>
    </div>`,
    rawValues: true,
  },

  "doppler-storm": {
    note: "Radar thời tiết với tâm bão xoáy — dùng khi thời tiết đã xoá dấu vết hiện trường.",
    css: (p) => `
.dp{width:${p ? "520px" : "228px"};aspect-ratio:1;border-radius:50%;position:relative;
  overflow:hidden;border:2px solid var(--line);background:#07090c;
  opacity:0;animation:fadeIn .6s ease .3s both}
.dp-s{position:absolute;inset:0;border-radius:50%;
  background:conic-gradient(from 0deg,rgba(34,197,94,.42),rgba(234,179,8,.5) 40%,
    rgba(225,29,72,.66) 55%,rgba(234,179,8,.5) 70%,rgba(34,197,94,.42));
  -webkit-mask:radial-gradient(circle,#000 8%,rgba(0,0,0,.85) 38%,transparent 74%);
  mask:radial-gradient(circle,#000 8%,rgba(0,0,0,.85) 38%,transparent 74%);
  animation:dpSpin 22s linear infinite}
@keyframes dpSpin{to{transform:rotate(360deg)}}
.dp-e{position:absolute;left:50%;top:50%;width:${p ? "34px" : "26px"};aspect-ratio:1;
  border-radius:50%;background:#07090c;transform:translate(-50%,-50%);
  box-shadow:0 0 0 2px rgba(250,250,250,.35)}
.dp-r{position:absolute;inset:0;border-radius:50%;
  border:1px solid rgba(148,163,184,.18)}
.dp-r:nth-of-type(2){inset:22%}.dp-r:nth-of-type(3){inset:44%}`,
    markup: `<div class="dp"><div class="dp-s"></div><div class="dp-r"></div><div class="dp-r"></div>
      <div class="dp-r"></div><div class="dp-e"></div></div>`,
  },
};

const WIDGET_IDS = Object.keys(WIDGETS);

/* ── the runtime that turns numbers into geometry ─────────────────────────── */
const WIDGET_JS = `
  // The drawing reads the SAME slot the caption prints. That is the whole contract: a bar at
  // 88% under a label saying 45% is the class of bug this file exists to make impossible.
  function num(x, dflt) { var n = parseFloat(x); return isFinite(n) ? n : dflt; }
  function clamp(n) { return Math.max(0, Math.min(100, n)); }

  document.querySelectorAll("[data-fill]").forEach(function (el) {
    var i = el.getAttribute("data-fill");
    var pct = clamp(num(v["value_" + i], 50));
    el.style.height = pct + "%";
    // "Over the line" is a property of the reading, not a colour someone picked.
    if (pct >= num(v.threshold, 70)) el.classList.add("over");
  });

  document.querySelectorAll("[data-teeth]").forEach(function (el) {
    var total = num(el.getAttribute("data-teeth"), 16);
    var pct = clamp(num(v.value_1, 90));
    var lit = Math.round((pct / 100) * total);
    for (var i = 0; i < total; i++) {
      var t = document.createElement("div");
      t.className = "dt-t" + (i < lit ? " m" : "");
      t.style.animationDelay = (0.5 + i * 0.055).toFixed(2) + "s";
      el.appendChild(t);
    }
  });
  document.querySelectorAll("[data-pct]").forEach(function (el) {
    el.textContent = clamp(num(v.value_1, 90)).toFixed(1).replace(".", ",") + "%";
  });

  document.querySelectorAll("[data-pos]").forEach(function (el) {
    el.style.left = clamp(num(v.value_1, 55)) + "%";
    el.style.top = clamp(num(v.value_2, 45)) + "%";
  });
  document.querySelectorAll("[data-pos-x]").forEach(function (el) {
    el.style.left = clamp(num(v.value_1, 62)) + "%";
  });
  document.querySelectorAll("[data-width]").forEach(function (el) {
    el.style.width = clamp(num(v.value_1, 62)) + "%";
  });
  document.querySelectorAll("[data-arc]").forEach(function (el) {
    el.style.setProperty("--pct", clamp(num(v.value_1, 72)));
  });
  // The dot sits ON the curve, not near it: same quadratic the path uses, evaluated at value_1.
  document.querySelectorAll("[data-curve]").forEach(function (el) {
    var t = clamp(num(v.value_1, 62)) / 100;
    var x = 2 * (1 - t) * t * 110 + t * t * 300;
    var y = (1 - t) * (1 - t) * 8 + 2 * (1 - t) * t * 34 + t * t * 88;
    el.style.left = (x / 300 * 100) + "%";
    el.style.top = (y / 100 * 100) + "%";
  });
  document.querySelectorAll("[data-bars]").forEach(function (el) {
    var n = num(el.getAttribute("data-bars"), 26);
    var peak = clamp(num(v.value_1, 70));
    for (var i = 0; i < n; i++) {
      var c = document.createElement("div");
      c.className = "sp-c";
      // Deterministic, not random: a render seeks to a timestamp and Math.random() would
      // draw a different spectrum on every pass of the same frame.
      var wave = Math.abs(Math.sin(i * 1.7)) * 0.55 + Math.abs(Math.cos(i * 0.9)) * 0.3;
      var h = 12 + wave * (peak - 12) + (i > n / 2 - 3 && i < n / 2 + 3 ? 22 : 0);
      c.style.height = Math.min(100, h) + "%";
      c.style.animationDelay = (0.4 + i * 0.03).toFixed(2) + "s";
      el.insertBefore(c, el.firstChild);
    }
  });
  // A search line marked with "!" is the one that matters; strip the marker, keep the alarm.
  document.querySelectorAll(".wh-r").forEach(function (row) {
    var q = row.querySelector(".wh-q");
    if (q && /^\\s*!/.test(q.textContent)) {
      q.textContent = q.textContent.replace(/^\\s*!\\s*/, "");
      row.classList.add("alert");
    }
  });
`;

/* ── template 1: the instrument panel ─────────────────────────────────────── */
const instrument = {
  id: "frame-forensic-instrument",
  name: "Forensic Instrument",
  slots: {
    panel: "toxicology",
    kicker: "PHÁP Y // XÉT NGHIỆM MÁU",
    value_1: "84",
    value_2: "22",
    value_3: "61",
    label_1: "Mẫu A",
    label_2: "Mẫu B",
    label_3: "Đối chứng",
    threshold: "70",
    readout_1: "CHẤT ĐỘC: XYANUA KALI",
    readout_2: "4,8 mg/L — TRÊN NGƯỠNG GÂY CHẾT",
    caption: "Nồng độ trong mẫu A gấp sáu lần ngưỡng gây chết ở người trưởng thành.",
  },
  markup: `
  <div class="kicker" data-slot="kicker"></div>
  <div class="well" id="well"></div>
  <div class="readouts grp">
    <div class="req" data-slot="readout_1"></div>
    <div class="hot" data-slot="readout_2"></div>
  </div>
  <div class="cap" data-slot="caption"></div>`,
  css: (p) => `
#root{padding:${p ? "80px 58px" : "60px 118px"};justify-content:space-between;
  background:linear-gradient(168deg,#0b0b0f,#08090c 62%)}
${WELL(p)}
${WIDGET_IDS.map((k) => WIDGETS[k].css(p)).join("\n")}`,
};

/* ── template 2: the case dashboard ───────────────────────────────────────── */
const dashboard = {
  id: "frame-case-dashboard",
  name: "Case Dashboard",
  slots: {
    cells: "toxicology,ip-trace,bts-triangulate,money-chain",
    status_line: "HỒ SƠ #RO-1968 // ĐANG MỞ",
    status_right: "04 LUỒNG",
    cell_1_label: "Độc chất",
    cell_2_label: "Dấu vết số",
    cell_3_label: "Định vị",
    cell_4_label: "Dòng tiền",
    value_1: "84",
    value_2: "22",
    value_3: "61",
    label_1: "Frankfurt",
    label_2: "Panama",
    label_3: "Đà Nẵng",
    ticker: "Bốn luồng điều tra, không luồng nào chỉ về cùng một người.",
  },
  markup: `
  <div class="bar top mono grp">
    <span class="req" data-slot="status_line"></span><span data-slot="status_right"></span>
  </div>
  <div class="grid" id="grid"></div>
  <div class="bar tick grp"><span class="req" data-slot="ticker"></span></div>`,
  css: (p) => `
#root{padding:${p ? "62px 40px" : "48px 84px"};justify-content:space-between;
  background:linear-gradient(168deg,#0b0b0f,#08090c 62%)}
.bar{display:flex;justify-content:space-between;gap:18px;align-items:center;
  font-size:${p ? "22px" : "18px"};letter-spacing:.16em;color:var(--dim);
  border:1px solid var(--line);background:var(--panel);border-radius:6px;
  padding:${p ? "16px 20px" : "12px 16px"};opacity:0;animation:fadeIn .5s ease .1s both}
.tick{font-family:'Be Vietnam Pro',sans-serif;letter-spacing:normal;color:#d4d4d8;
  font-size:${p ? "26px" : "21px"};line-height:1.4;animation-delay:2.6s}
/* Two columns always. Cells are square-ish so a widget drawn for a full frame still reads
   when it is a quarter of one; anything taller would push the ticker off the canvas. */
.grid{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:${p ? "16px" : "12px"};
  margin:${p ? "22px 0" : "14px 0"};min-height:0}
.cell{background:#0a0b0e;border:1px solid var(--line);border-radius:8px;
  padding:${p ? "16px" : "12px"};display:flex;flex-direction:column;overflow:hidden;
  opacity:0;animation:fadeUp .6s ease both}
.cell:nth-child(1){animation-delay:.5s}
.cell:nth-child(2){animation-delay:.75s}
.cell:nth-child(3){animation-delay:1s}
.cell:nth-child(4){animation-delay:1.25s}
.cell-l{font-family:'JetBrains Mono',monospace;font-size:${p ? "18px" : "15px"};
  letter-spacing:.14em;text-transform:uppercase;color:var(--dim);flex:none;
  margin-bottom:${p ? "10px" : "8px"}}
/* Scale the instrument down rather than reflow it — a widget has one layout, and a second
   layout for small cells would be a second thing to keep correct. */
.cell-b{flex:1;display:flex;align-items:center;justify-content:center;min-height:0;
  transform:scale(.74);transform-origin:center}
/* A widget authored for a full frame is wider than a quarter-frame cell. Scaling is the whole
   trick — but a fixed-width instrument would still overflow its cell horizontally, so cap it. */
.cell-b > *{max-width:100%;max-height:100%}
${WIDGET_IDS.map((k) => WIDGETS[k].css(p)).join("\n")}`,
};

/* ── emit ──────────────────────────────────────────────────────────────────── */
const buildJs = (t) => {
  const table = WIDGET_IDS.map((k) => `${JSON.stringify(k)}:${JSON.stringify(WIDGETS[k].markup)}`).join(",");
  const isDash = t.id === "frame-case-dashboard";
  return `
  var W = {${table}};
  ${isDash
      ? `
  // A dashboard names its instruments in one comma-separated slot. Two to four; asking for
  // more than four makes each one too small to read, which is worse than showing fewer.
  var grid = document.getElementById("grid");
  var want = String(v.cells || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  var bad = want.filter(function (n) { return !W[n]; });
  if (bad.length) console.warn("[frame-case-dashboard] không có widget: " + bad.join(", ") +
    " — có: " + Object.keys(W).join(", "));
  want = want.filter(function (n) { return W[n]; }).slice(0, 4);
  if (!want.length) want = ["toxicology", "ip-trace"];
  want.forEach(function (name, i) {
    var cell = document.createElement("div");
    cell.className = "cell";
    var lab = v["cell_" + (i + 1) + "_label"];
    if (lab != null && String(lab).trim()) {
      var l = document.createElement("div");
      l.className = "cell-l";
      l.textContent = String(lab);
      cell.appendChild(l);
    }
    var body = document.createElement("div");
    body.className = "cell-b";
    body.innerHTML = W[name];
    cell.appendChild(body);
    grid.appendChild(cell);
  });
  // An odd number of cells leaves a hole in a two-column grid; stretch the last one across.
  if (want.length % 2 === 1 && grid.lastChild) grid.lastChild.style.gridColumn = "1 / -1";`
      : `
  var well = document.getElementById("well");
  var name = String(v.panel || "").trim();
  if (!W[name]) {
    console.warn("[frame-forensic-instrument] panel \\"" + name + "\\" không có. Chọn một trong: " +
      Object.keys(W).join(", "));
    name = "toxicology";
  }
  well.innerHTML = W[name];`}
`;
};

const html = (t, aspect) => {
  const portrait = aspect === "9:16";
  const w = portrait ? 1080 : 1920;
  const h = portrait ? 1920 : 1080;
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${w}, height=${h}" />
<title>${t.name} · ${portrait ? "Portrait 9:16" : "Landscape 16:9"}</title>
<link href="${FONTS}" rel="stylesheet" />
<style>${BASE}${t.css(portrait)}</style>
</head>
<body>
<div
  id="root"
  data-composition-id="${portrait ? "portrait" : "main"}"
  data-start="0"
  data-duration="6"
  data-width="${w}"
  data-height="${h}"
  data-composition-variables='${JSON.stringify(t.slots).replace(/'/g, "&#39;")}'
>
${t.markup}
  <div class="amb"></div>
  <div class="vignette"></div>
  <div class="crt"></div>
</div>
<script>
(function () {
  // getVariables() is the renderer's channel; the attribute is only the editor's preview
  // default. Reading only the attribute is how thirty templates ended up publishing their
  // stock demo copy no matter what the caller passed.
  var v = {};
  try {
    v = window.__hyperframes && typeof window.__hyperframes.getVariables === "function"
      ? (window.__hyperframes.getVariables() || {}) : {};
  } catch (e) {}
  if (!v || !Object.keys(v).length) {
    try { v = JSON.parse(document.getElementById("root").getAttribute("data-composition-variables") || "{}"); }
    catch (e2) { v = {}; }
  }
${buildJs(t)}
  // Widgets are injected above, so slots are filled AFTER — otherwise the markup a widget
  // brings with it never gets its text.
  var groups = [];
  document.querySelectorAll(".grp").forEach(function (g) {
    groups.push({ el: g, hadReq: !!g.querySelector(".req") });
  });
  document.querySelectorAll("[data-slot]").forEach(function (el) {
    var val = v[el.getAttribute("data-slot")];
    if (val == null || !String(val).trim()) { el.remove(); return; }
    el.textContent = String(val);
  });
  groups.forEach(function (o) {
    var dead = o.hadReq ? !o.el.querySelector(".req") : !o.el.querySelector("[data-slot]");
    if (dead) o.el.remove();
  });
${WIDGET_JS}
})();
// Both keys, always. A composition that registers only "main" makes Puppeteer wait 45s for a
// ready signal that never comes — a 10x render slowdown that looks like a slow machine.
window.__timelines = window.__timelines || {};
window.__timelines["main"] = window.__timelines["portrait"] = {
  pause: function () {},
  seek: function () {},
  paused: function () { return true; },
  duration: function () { return 6; }
};
</script>
</body>
</html>`;
};

const notice = (t, why) => `# Attribution — ${t.id}

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to design mock-ups supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

${why}

## Slots

${Object.keys(t.slots).map((k) => `- \`${k}\``).join("\n")}

${t.id === "frame-forensic-instrument"
    ? `## Instruments (\`panel\`)\n\n${WIDGET_IDS.map((k) => `- \`${k}\` — ${WIDGETS[k].note}`).join("\n")}`
    : `## Cells (\`cells\`, comma-separated, 2–4)\n\n${WIDGET_IDS.map((k) => `- \`${k}\``).join("\n")}`}

Both compositions expose the same slot names; they are emitted together by
\`scripts/video/lib/build-instrument-templates.mjs\`. Edit that file, not the HTML.
`;

const WHY = {
  "frame-forensic-instrument":
    "Two gallery pages held 38 forensic designs and every one of them was the same frame with a\ndifferent dial in the middle. Thirty-eight directories would have grown the library by 30%\nwhile adding one layout, and roughly sixteen of them duplicated frames that already existed.\nThis is that layout once, with the dial chosen by a slot — and `value_1..3` drive the drawing,\nso the printed number and the drawn shape cannot disagree.",
  "frame-case-dashboard":
    "Nothing in the library could show a case as a WHOLE — several lines of enquiry visible at\nonce, none of them concluded. Every other frame presents one fact at a time. It reuses the\nsame instrument library as `frame-forensic-instrument`, so an instrument is written once and\nworks in both.",
};

const ALL = [instrument, dashboard];
for (const t of ALL) {
  const dir = path.join(OUT, t.id);
  const comp = path.join(dir, "compositions");
  if (dryRun) {
    console.log(`[tpl] would write ${t.id} (${Object.keys(t.slots).length} slots, ${WIDGET_IDS.length} widgets)`);
    continue;
  }
  fs.mkdirSync(comp, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html(t, "16:9"), "utf8");
  fs.writeFileSync(path.join(comp, "portrait.html"), html(t, "9:16"), "utf8");
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ id: t.id, name: t.name }, null, 2) + "\n", "utf8");
  fs.writeFileSync(
    path.join(dir, "hyperframes.json"),
    JSON.stringify(
      {
        $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
        registry: "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
        paths: { blocks: "compositions", components: "compositions/components", assets: "assets" },
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  fs.writeFileSync(path.join(dir, "NOTICE.md"), notice(t, WHY[t.id]), "utf8");
  console.log(`[tpl] ✓ ${t.id} — ${Object.keys(t.slots).length} slots, both aspects`);
}
if (!dryRun) {
  console.log(`[tpl] ${WIDGET_IDS.length} instruments: ${WIDGET_IDS.join(", ")}`);
  console.log(`[tpl] next: theme-probe, template-sheet, CATALOG.md, counts`);
}
