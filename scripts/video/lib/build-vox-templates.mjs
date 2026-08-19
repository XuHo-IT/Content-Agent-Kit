// build-vox-templates.mjs — emit the three vox / paper-cut frames for horror-investigation.
//
// WHY A GENERATOR. Both aspects have to expose the SAME slot names — a test enforces it —
// and writing the same file twice is exactly how that parity breaks, and how a fix lands in
// one aspect only. Shared markup + shared JS + per-aspect layout CSS, emitted from here.
//
// WHICH GAPS THESE FILL (measured with motion-index.mjs, not guessed):
//
//   frame-vox-torchlight        Thirteen document frames already exist and every one reveals
//                               by opacity, pin, tear or redaction. None reveals by LIGHT.
//                               `mask-sweep` is the thinnest motion row in the library — 2 of
//                               107 templates.
//   frame-papercut-diorama      Every paper-textured frame is FLAT: a document lying on a
//                               surface. None has depth. `dimensional` is 3 of 107.
//   frame-vox-silhouette-file   Nothing presents a PERSON without a face. The horror/true-crime
//                               rules forbid showing the face of anyone not convicted, so a
//                               portrait is often unusable and there was no frame to fall back
//                               on — this cost two real images in production.
//
//   node scripts/video/lib/build-vox-templates.mjs [--dry-run]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = path.join(ROOT, "video-templates");
const dryRun = process.argv.includes("--dry-run");

const FONTS =
  "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;900" +
  "&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=JetBrains+Mono:wght@400;700&display=swap";

/* ── shared base ─────────────────────────────────────────────────────────── */
const BASE = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;overflow:hidden;background:#0b0908}
#root{width:100%;height:100%;position:relative;overflow:hidden;
  font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#e8dcca;
  display:flex;flex-direction:column;justify-content:center}
.kicker{font-size:var(--kick);letter-spacing:.34em;text-transform:uppercase;
  font-weight:700;color:#c9a86b;opacity:0;animation:fadeUp .6s ease .1s both}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
/* Grain sits over everything so the paper never reads as flat digital colour. */
.grain{position:absolute;inset:0;pointer-events:none;opacity:.16;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")}
.vignette{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse at 50% 45%,transparent 30%,rgba(0,0,0,.72) 100%)}
`;

/* ── 1. torchlight ───────────────────────────────────────────────────────── */
const torchlight = {
  id: "frame-vox-torchlight",
  name: "Torchlight Document",
  slots: {
    kicker: "Hồ sơ chưa công bố",
    doc_title: "Biên bản khám nghiệm",
    body_text:
      "Bản ghi dài bốn trang, viết tay, không có chữ ký người lập. Ba đoạn ở giữa đã bị gạch bỏ bằng mực khác màu, và không ai giải thích được vì sao.",
    highlight: "Ba đoạn giữa bị gạch bỏ bằng mực khác màu",
    stamp: "LƯU TRỮ",
    footer: "Không rõ người lập",
  },
  markup: `
  <div class="sheet">
    <div class="stamp" data-slot="stamp"></div>
    <div class="kicker" data-slot="kicker"></div>
    <h1 class="doc-title" data-slot="doc_title"></h1>
    <div class="rule"></div>
    <div class="body-wrap">
      <p class="dim" data-slot="body_text"></p>
      <p class="lit" data-slot="body_text"></p>
    </div>
    <div class="hl" data-slot="highlight"></div>
    <div class="foot" data-slot="footer"></div>
  </div>
  <div class="pool"></div>
  <div class="beam"></div>`,
  css: (portrait) => `
:root{--kick:${portrait ? "26px" : "22px"}}
#root{background:
  radial-gradient(ellipse at 50% 40%,#1a1512 0%,#0b0908 70%)}
.sheet{position:relative;margin:0 auto;width:${portrait ? "86%" : "62%"};
  padding:${portrait ? "72px 60px" : "56px 64px"};
  background:linear-gradient(160deg,#171310,#100d0b);
  border:1px solid rgba(201,168,107,.22);
  box-shadow:0 40px 90px rgba(0,0,0,.7)}
.stamp{position:absolute;top:${portrait ? "34px" : "26px"};right:${portrait ? "40px" : "44px"};
  font-family:'JetBrains Mono',monospace;font-size:${portrait ? "20px" : "17px"};
  letter-spacing:.2em;color:#8a6f45;border:1px solid #6b563a;padding:6px 12px;
  transform:rotate(-6deg);opacity:0;animation:fadeIn .5s ease 1.9s both}
.doc-title{font-family:'Playfair Display',serif;font-weight:900;
  font-size:${portrait ? "64px" : "52px"};line-height:1.08;margin-top:18px;color:#efe3d0;
  opacity:0;animation:fadeUp .7s ease .3s both}
.rule{height:2px;background:linear-gradient(90deg,#c9a86b,transparent);margin:26px 0 30px;
  transform-origin:left;transform:scaleX(0);animation:grow .8s ease .55s both}
@keyframes grow{to{transform:scaleX(1)}}
.body-wrap{position:relative}
.body-wrap p{font-size:${portrait ? "34px" : "27px"};line-height:1.62;font-weight:400}
/* The dim copy is what the room shows. The lit copy is the same text, brighter, masked to a
   moving pool of light — so the beam does not "highlight" text, it is the only reason any of
   it is legible. */
/* The gap between these two colours IS the effect. Too close and the sweep reads as a faint
   sheen instead of as the only light in the room. */
.dim{color:#2b2620}
.lit{position:absolute;inset:0;color:#fdf6e8;text-shadow:0 0 30px rgba(233,201,140,.75);
  -webkit-mask-image:radial-gradient(circle,#000 0%,#000 40%,transparent 72%);
  mask-image:radial-gradient(circle,#000 0%,#000 40%,transparent 72%);
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;
  -webkit-mask-size:${portrait ? "1000px 1000px" : "820px 820px"};
  mask-size:${portrait ? "1000px 1000px" : "820px 820px"};
  animation:sweep 4.6s cubic-bezier(.45,0,.4,1) .35s both}
/* Ends parked over the closing line rather than travelling off — the last thing the beam
   leaves lit is the thing the narration is on by then. */
@keyframes sweep{
  0%{-webkit-mask-position:-70% 24%;mask-position:-70% 24%}
  45%{-webkit-mask-position:38% 52%;mask-position:38% 52%}
  100%{-webkit-mask-position:88% 78%;mask-position:88% 78%}}
/* A pool you can actually see, travelling with the mask. Without it the text brightens for no
   visible reason, which reads as a flicker rather than as a torch. */
.pool{position:absolute;inset:-10%;pointer-events:none;mix-blend-mode:screen;
  background-image:radial-gradient(circle,rgba(240,214,160,.34) 0%,rgba(233,201,140,.14) 34%,transparent 68%);
  background-repeat:no-repeat;
  background-size:${portrait ? "1000px 1000px" : "820px 820px"};
  animation:poolMove 4.6s cubic-bezier(.45,0,.4,1) .35s both}
/* Same curve and same delay as the mask — the pool and the legibility must travel together,
   or it reads as two animations that happen to finish at the same time. */
@keyframes poolMove{
  0%{background-position:-70% 24%}
  45%{background-position:38% 52%}
  100%{background-position:88% 78%}}
.hl{margin-top:${portrait ? "40px" : "30px"};padding-left:22px;
  border-left:4px solid #c9a86b;font-size:${portrait ? "32px" : "25px"};
  font-weight:600;color:#e9c98c;line-height:1.42;
  opacity:0;animation:fadeUp .7s ease 3.5s both}
.foot{margin-top:${portrait ? "44px" : "32px"};font-family:'JetBrains Mono',monospace;
  font-size:${portrait ? "22px" : "18px"};letter-spacing:.12em;color:#7d6a4e;
  opacity:0;animation:fadeIn .6s ease 4s both}
/* A slow bloom that keeps travelling after the text has settled, so the frame never dies. */
.beam{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;opacity:.5;
  background:radial-gradient(circle at 20% 40%,rgba(233,201,140,.20),transparent 42%);
  animation:drift 9s ease-in-out infinite alternate}
@keyframes drift{to{background-position:60% 20%}}`,
};

/* ── 2. papercut diorama ─────────────────────────────────────────────────── */
const papercut = {
  id: "frame-papercut-diorama",
  name: "Paper-cut Diorama",
  slots: {
    kicker: "Toạ độ có thật",
    title: "Ngôi nhà trên đồi",
    subtitle: "Bốn mươi năm không ai thấy cửa trước mở ra lần nào.",
    caption: "Dựng lại theo mô tả trong hồ sơ",
    footer_left: "Tập 03",
    footer_right: "Hồ sơ mở",
  },
  markup: `
  <div class="stage">
    <div class="layer l4"></div>
    <div class="layer l3"></div>
    <div class="layer l2"></div>
    <div class="layer l1"></div>
    <div class="moon"></div>
  </div>
  <div class="copy">
    <div class="kicker" data-slot="kicker"></div>
    <h1 class="title" data-slot="title"></h1>
    <p class="sub" data-slot="subtitle"></p>
    <div class="cap" data-slot="caption"></div>
  </div>
  <div class="foot"><span data-slot="footer_left"></span><span data-slot="footer_right"></span></div>`,
  css: (portrait) => `
:root{--kick:${portrait ? "26px" : "22px"}}
#root{justify-content:flex-end;perspective:1400px;
  background:linear-gradient(180deg,#151a22 0%,#0d0b0a 62%)}
/* A slow camera yaw across the whole stage. Parallax alone gives separation but not
   dimension — the planes slide past each other like a flat pan. One degree of rotateY is
   enough for the eye to read them as standing in space rather than stacked on glass. */
.stage{position:absolute;inset:0;transform-style:preserve-3d;
  animation:yaw 18s ease-in-out infinite alternate}
@keyframes yaw{
  from{transform:perspective(1400px) rotateY(-1.1deg) rotateX(.5deg)}
  to{transform:perspective(1400px) rotateY(1.1deg) rotateX(-.3deg)}}
/* Each plane is a cut sheet: its own silhouette, its own shadow, its own drift rate. Depth
   comes from the rates disagreeing — a single speed reads as one flat picture panning. */
.layer{position:absolute;left:-12%;width:124%;background-repeat:no-repeat;
  filter:drop-shadow(0 -14px 22px rgba(0,0,0,.55))}
.l4{bottom:${portrait ? "46%" : "40%"};height:26%;background:#232a33;
  clip-path:polygon(0 78%,12% 52%,24% 70%,38% 38%,52% 62%,66% 34%,80% 58%,92% 44%,100% 66%,100% 100%,0 100%);
  animation:drift4 26s ease-in-out infinite alternate,fadeIn 1.1s ease 0s both}
.l3{bottom:${portrait ? "36%" : "30%"};height:26%;background:#1b222a;
  clip-path:polygon(0 66%,14% 44%,30% 62%,46% 30%,62% 56%,78% 36%,94% 58%,100% 48%,100% 100%,0 100%);
  animation:drift3 20s ease-in-out infinite alternate,fadeIn 1.1s ease .18s both}
.l2{bottom:${portrait ? "26%" : "20%"};height:28%;background:#141a20;
  clip-path:polygon(0 58%,10% 40%,22% 56%,34% 22%,40% 40%,52% 18%,58% 44%,72% 30%,88% 52%,100% 40%,100% 100%,0 100%);
  animation:drift2 15s ease-in-out infinite alternate,fadeIn 1.1s ease .34s both}
.l1{bottom:0;height:34%;background:#0a0908;
  clip-path:polygon(0 62%,18% 62%,18% 30%,26% 30%,26% 10%,34% 10%,34% 30%,44% 30%,44% 62%,72% 62%,72% 40%,84% 40%,84% 62%,100% 62%,100% 100%,0 100%);
  animation:drift1 11s ease-in-out infinite alternate,fadeIn 1.1s ease .5s both}
@keyframes drift4{to{transform:translate3d(-2.5%,0,0)}}
@keyframes drift3{to{transform:translate3d(-4.5%,0,0)}}
@keyframes drift2{to{transform:translate3d(-7%,0,0)}}
@keyframes drift1{to{transform:translate3d(-10%,0,0)}}
.moon{position:absolute;top:${portrait ? "12%" : "10%"};left:${portrait ? "62%" : "68%"};
  width:${portrait ? "230px" : "180px"};aspect-ratio:1;border-radius:50%;
  background:radial-gradient(circle at 38% 34%,#f3e6cd,#c9a86b 62%,#8a7245);
  box-shadow:0 0 130px rgba(233,201,140,.4);opacity:0;
  animation:fadeIn 1.6s ease .2s both,breathe 7s ease-in-out infinite alternate 1.8s}
@keyframes breathe{to{box-shadow:0 0 180px rgba(233,201,140,.62)}}
.copy{position:relative;padding:${portrait ? "0 62px 240px" : "0 92px 130px"};max-width:${portrait ? "100%" : "60%"}}
.title{font-family:'Playfair Display',serif;font-weight:900;
  font-size:${portrait ? "82px" : "66px"};line-height:1.04;margin:16px 0 18px;color:#f2e7d5;
  opacity:0;animation:fadeUp .8s ease .7s both}
.sub{font-size:${portrait ? "34px" : "27px"};line-height:1.5;color:#bfae95;
  opacity:0;animation:fadeUp .8s ease .95s both}
.cap{margin-top:${portrait ? "30px" : "22px"};font-family:'JetBrains Mono',monospace;
  font-size:${portrait ? "22px" : "18px"};letter-spacing:.1em;color:#8a7758;
  opacity:0;animation:fadeIn .7s ease 1.35s both}
.foot{position:absolute;left:0;right:0;bottom:${portrait ? "56px" : "44px"};
  padding:0 ${portrait ? "62px" : "92px"};display:flex;justify-content:space-between;
  font-family:'JetBrains Mono',monospace;font-size:${portrait ? "22px" : "18px"};
  letter-spacing:.18em;text-transform:uppercase;color:#6f6047;
  opacity:0;animation:fadeIn .7s ease 1.6s both}`,
};

/* ── 3. silhouette file ──────────────────────────────────────────────────── */
const silhouette = {
  id: "frame-vox-silhouette-file",
  name: "Silhouette File",
  slots: {
    kicker: "Nghi phạm · chưa bị truy tố",
    band_text: "KHÔNG CÔNG BỐ DANH TÍNH",
    subject_label: "Người đàn ông ở căn hộ tầng ba",
    fact_1: "Từng làm bảo vệ cho toà nhà tới năm hai nghìn lẻ hai",
    fact_2: "Có mặt trong khu vực đêm xảy ra vụ việc",
    fact_3: "Từ chối trả lời cảnh sát ba lần",
    status: "Chưa từng bị kết tội trong vụ án này",
    footer: "Danh tính không được công bố",
  },
  markup: `
  <div class="kicker" data-slot="kicker"></div>
  <div class="card">
    <div class="figure">
      <div class="bust"></div>
      <div class="band" data-slot="band_text"></div>
    </div>
    <div class="info">
      <h2 class="who" data-slot="subject_label"></h2>
      <ul class="facts">
        <li data-slot="fact_1"></li>
        <li data-slot="fact_2"></li>
        <li data-slot="fact_3"></li>
      </ul>
      <div class="status" data-slot="status"></div>
    </div>
  </div>
  <div class="foot" data-slot="footer"></div>`,
  css: (portrait) => `
:root{--kick:${portrait ? "26px" : "22px"}}
#root{background:linear-gradient(155deg,#141110,#0a0908 62%);
  padding:${portrait ? "0 58px" : "0 100px"}}
.card{display:flex;${portrait ? "flex-direction:column;align-items:center;" : "align-items:center;"}
  gap:${portrait ? "48px" : "70px"};margin-top:${portrait ? "44px" : "34px"}}
/* The bust is drawn, not photographed — there is no face to redact because none was ever
   rendered. That is the point: the rules forbid showing the face of anyone not convicted. */
.figure{position:relative;flex:none;
  width:${portrait ? "330px" : "290px"};height:${portrait ? "360px" : "320px"};
  opacity:0;animation:fadeUp .9s ease .35s both}
.bust{position:absolute;inset:0;
  background:radial-gradient(circle at 50% 22%,#3a332c 0%,#241f1b 46%,#161311 100%);
  clip-path:polygon(50% 2%,63% 7%,70% 20%,68% 33%,60% 41%,74% 47%,88% 58%,95% 74%,98% 100%,2% 100%,5% 74%,12% 58%,26% 47%,40% 41%,32% 33%,30% 20%,37% 7%);
  filter:drop-shadow(0 18px 40px rgba(0,0,0,.7))}
.band{position:absolute;top:${portrait ? "20%" : "19%"};left:-6%;width:112%;
  background:#c9a86b;color:#120f0d;text-align:center;
  font-family:'JetBrains Mono',monospace;font-weight:700;
  font-size:${portrait ? "19px" : "17px"};letter-spacing:.16em;padding:9px 0;
  transform:rotate(-4deg) scaleX(0);transform-origin:left;
  animation:band .55s cubic-bezier(.2,.7,.3,1) 1s both}
@keyframes band{to{transform:rotate(-4deg) scaleX(1)}}
.info{flex:1;${portrait ? "width:100%;" : ""}}
.who{font-family:'Playfair Display',serif;font-weight:700;font-style:italic;
  font-size:${portrait ? "46px" : "40px"};line-height:1.18;color:#efe3d0;
  ${portrait ? "text-align:center;" : ""}
  opacity:0;animation:fadeUp .7s ease .6s both}
.facts{list-style:none;margin-top:${portrait ? "34px" : "28px"};
  display:flex;flex-direction:column;gap:${portrait ? "20px" : "16px"}}
.facts li{position:relative;padding-left:${portrait ? "40px" : "34px"};
  font-size:${portrait ? "31px" : "25px"};line-height:1.45;color:#cfc0a8;
  opacity:0;animation:fadeUp .6s ease both}
.facts li:nth-child(1){animation-delay:1.25s}
.facts li:nth-child(2){animation-delay:1.45s}
.facts li:nth-child(3){animation-delay:1.65s}
.facts li::before{content:"";position:absolute;left:0;top:${portrait ? ".62em" : ".6em"};
  width:${portrait ? "22px" : "18px"};height:2px;background:#c9a86b}
.status{margin-top:${portrait ? "40px" : "32px"};padding:${portrait ? "20px 26px" : "16px 22px"};
  border:1px solid rgba(201,168,107,.4);background:rgba(201,168,107,.07);
  font-size:${portrait ? "28px" : "23px"};font-weight:600;color:#e9c98c;line-height:1.4;
  opacity:0;animation:fadeUp .7s ease 2s both}
.foot{position:absolute;left:0;right:0;bottom:${portrait ? "54px" : "44px"};
  text-align:center;font-family:'JetBrains Mono',monospace;
  font-size:${portrait ? "22px" : "18px"};letter-spacing:.18em;text-transform:uppercase;
  color:#6f6047;opacity:0;animation:fadeIn .7s ease 2.4s both}`,
};

/* ── emit ────────────────────────────────────────────────────────────────── */
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
  <div class="grain"></div>
  <div class="vignette"></div>
</div>
<script>
(function () {
  // getVariables() is the renderer's channel; the attribute is only the editor's preview
  // default. Read the first, fall back to the second, so the file previews AND renders.
  var v = {};
  try {
    v = window.__hyperframes && typeof window.__hyperframes.getVariables === "function"
      ? window.__hyperframes.getVariables() : {};
  } catch (e) {}
  if (!v || !Object.keys(v).length) {
    try { v = JSON.parse(document.getElementById("root").getAttribute("data-composition-variables") || "{}"); }
    catch (e2) { v = {}; }
  }
  document.querySelectorAll("[data-slot]").forEach(function (el) {
    var k = el.getAttribute("data-slot");
    var val = v[k];
    // An empty slot removes its element rather than leaving a gap. An empty line reads as
    // missing data; an absent one reads as a deliberate omission.
    if (val == null || !String(val).trim()) { el.remove(); return; }
    el.textContent = String(val);
  });
  var facts = document.querySelector(".facts");
  if (facts && !facts.children.length) facts.remove();
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
Not vendored from anywhere.

## Why it exists

${why}

## Slots

${Object.keys(t.slots).map((k) => `- \`${k}\``).join("\n")}

Both compositions expose the same slot names; they are emitted together by
\`scripts/video/lib/build-vox-templates.mjs\`. Edit that file, not the HTML.
`;

const WHY = {
  "frame-vox-torchlight":
    "Thirteen document frames already existed and every one revealed its content by opacity, pin,\ntear or redaction. None revealed by LIGHT. `mask-sweep` was also the thinnest motion row in the\nlibrary — 2 of 107 templates — so this fills a gap in what the kit can say and in how it moves.",
  "frame-papercut-diorama":
    "Every paper-textured frame in the library was FLAT: a document lying on a surface, shot from\nabove. None had depth. This one is cut paper with planes that drift at different rates, which is\nthe only reason it reads as three-dimensional. Fills `dimensional`, 3 of 107.",
  "frame-vox-silhouette-file":
    "Nothing in the library could present a PERSON without a face. The horror and true-crime rules\nforbid showing the face of anyone a court has not convicted, so a portrait is frequently\nunusable — this cost two real images in production before the frame existed. The bust is drawn\nrather than photographed, so there is no face to redact.",
};

const ALL = [torchlight, papercut, silhouette];
for (const t of ALL) {
  const dir = path.join(OUT, t.id);
  const comp = path.join(dir, "compositions");
  if (dryRun) {
    console.log(`[tpl] would write ${t.id} (${Object.keys(t.slots).length} slots)`);
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
if (!dryRun) console.log(`[tpl] next: theme-probe, template-sheet, CATALOG.md, counts`);
