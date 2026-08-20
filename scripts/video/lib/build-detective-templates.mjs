// build-detective-templates.mjs — emit the 17 detective / forensic frames.
//
// SOURCE. Ported from two gallery mock-ups the user wrote (`test.html`, 5 designs;
// `test2.html`, 12 designs). Those were 360x640 previews with the copy hardcoded in markup,
// no slot layer, no `__timelines` registration, and animations that loop forever. None of that
// survives contact with this renderer, so this file is a REBUILD to the mock-ups' design, not
// a copy of them. Four things had to change and none of them is negotiable:
//
//   1. FONTS. The mock-ups use VT323, Space Mono and Courier Prime. None of the three carries
//      Vietnamese diacritics, and every line of copy here is Vietnamese — "GÓC BẮN" renders as
//      "GC BN". Replaced with JetBrains Mono (machine voice), Be Vietnam Pro (body) and
//      Playfair Display (print), all of which ship a vietnamese subset.
//   2. ANIMATION. `infinite alternate` is wrong for a renderer that seeks to a timestamp: the
//      same frame renders differently on every pass. Every loop became a finite entrance with
//      `both` fill, inside `data-duration`.
//   3. IMAGES. Six Unsplash URLs (four buried in CSS `background:url()`) are other people's
//      photographs. They are gone; images arrive through slots, and every frame stays legible
//      with none supplied.
//   4. DRAWN FROM DATA. The mock-ups draw one thing and label it another — a stress bar pinned
//      at 88% whose keyframes run 45%->94%, a bullet at `rotate(28deg)` under a label reading
//      28.4°. Here the number IS the geometry: the bar reads its percent from a slot, the
//      trajectory reads its angle from a slot.
//
// WHY A GENERATOR. Both aspects must expose the SAME slot names — a test enforces it — and
// writing the file twice is exactly how that parity breaks. Shared markup + shared JS +
// per-aspect layout CSS, emitted from here. Edit this file, never the HTML.
//
//   node scripts/video/lib/build-detective-templates.mjs [--dry-run] [--only <id>,<id>]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = path.join(ROOT, "video-templates");
const dryRun = process.argv.includes("--dry-run");
const onlyArg = process.argv.indexOf("--only");
const ONLY = onlyArg > -1 ? String(process.argv[onlyArg + 1] || "").split(",").filter(Boolean) : null;

const FONTS =
  "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;900" +
  "&family=JetBrains+Mono:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@700;900&display=swap";

/* ── shared base ─────────────────────────────────────────────────────────────
   One palette across all seventeen so an episode can cut between them without the
   colour changing under the narration. Red is the only accent and it is spent only on the
   single thing the frame wants you to look at. */
const BASE = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;overflow:hidden;background:#09090c}
#root{width:100%;height:100%;position:relative;overflow:hidden;
  font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#fafafa;
  --red:#e11d48;--dim:#71717a;--line:#27272a;--panel:#121215;
  display:flex;flex-direction:column}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace}
.kicker{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:var(--kick);
  letter-spacing:.22em;text-transform:uppercase;color:var(--dim);
  opacity:0;animation:fadeUp .55s ease .1s both}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes growX{from{transform:scaleX(0)}to{transform:scaleX(1)}}
/* Scanlines. Static, not animated — an animated raster crawls at a different phase in every
   rendered frame and reads as compression noise. */
.crt{position:absolute;inset:0;pointer-events:none;z-index:30;opacity:.5;
  background:linear-gradient(rgba(18,16,16,0) 50%,rgba(0,0,0,.32) 50%);background-size:100% 4px}
.vignette{position:absolute;inset:0;pointer-events:none;z-index:29;
  background:radial-gradient(ellipse at 50% 45%,transparent 34%,rgba(0,0,0,.7) 100%)}
/**
 * Ambient. The one thing on screen that never finishes.
 *
 * Every entrance here lands inside the first four seconds, but a narrated scene runs eight to
 * ten. Without a layer that keeps moving, the back half of every scene is a photograph — and
 * eight of those in a row is a slideshow, which is exactly how the first two episodes using
 * these frames came out.
 *
 * Slow and faint on purpose: 19 and 23 seconds, so no two scenes in an episode ever show the
 * same phase of it, and low enough contrast that it reads as a room breathing rather than as
 * something animating. Alternating direction means it never jumps back to the start.
 */
/* KHÔNG mix-blend-mode ở đây. Blend mode đẩy hyperframes sang đường chụp HDR phân lớp,
   và đường đó đòi PNG 16-bit — ảnh thật là 8-bit, nên render ABORT giữa chừng với
   "decodePngToRgb48le: unsupported bit depth 8". Bảy trong số các frame này nhận ảnh,
   nên blend mode và ô ảnh không thể cùng tồn tại. Opacity thấp cho hiệu quả tương đương. */
.amb{position:absolute;inset:-15%;pointer-events:none;z-index:28;opacity:.85;
  background:radial-gradient(circle at 28% 32%,rgba(225,29,72,.13),transparent 46%),
             radial-gradient(circle at 74% 68%,rgba(148,163,184,.10),transparent 52%);
  animation:ambDrift 19s ease-in-out infinite alternate}
@keyframes ambDrift{from{transform:translate3d(-2.5%,-1.5%,0) scale(1)}
  to{transform:translate3d(2.5%,1.5%,0) scale(1.06)}}
/* A second, slower pass at a different rate. One moving gradient reads as a gradient moving;
   two at rates that never line up read as light in a room. */
.amb2{position:absolute;inset:-10%;pointer-events:none;z-index:28;
  background:radial-gradient(ellipse at 50% 12%,rgba(250,250,250,.06),transparent 58%);
  animation:ambBreathe 23s ease-in-out infinite alternate}
@keyframes ambBreathe{from{opacity:.55}to{opacity:1}}
`;

/* ═══ 1. interrogation log ════════════════════════════════════════════════════
   Two voices on paper and NO audio anywhere in the frame — that separation is deliberate.
   `frame-dispatch-waveform` is the one that says "you are hearing this"; this one says
   "someone wrote this down afterwards". Same material, opposite claim. */
const interrogation = {
  id: "frame-interrogation-log",
  name: "Interrogation Log",
  canvas: "dark",
  slots: {
    room_label: "PHÒNG 3B // BẢN GHI LỜI KHAI",
    officer_label: "ĐIỀU TRA VIÊN",
    suspect_label: "NGƯỜI ĐƯỢC HỎI",
    q_1: "Mười một giờ đêm hôm đó, anh ở đâu?",
    a_1: "Tôi chỉ đi ngang qua ngã tư ấy thôi.",
    q_2: "Camera hành trình cho thấy xe anh dừng lại bốn mươi phút.",
    a_2: "",
    pause_note: "[NGỪNG: TÁM GIÂY IM LẶNG]",
  },
  markup: `
  <div class="hdr mono" data-slot="room_label"></div>
  <div class="log">
    <div class="turn grp off"><span class="who mono" data-slot="officer_label"></span><p class="said req" data-slot="q_1"></p></div>
    <div class="turn grp sus"><span class="who mono" data-slot="suspect_label"></span><p class="said req" data-slot="a_1"></p></div>
    <div class="turn grp off"><span class="who mono" data-slot="officer_label"></span><p class="said req" data-slot="q_2"></p></div>
    <div class="turn grp sus"><span class="who mono" data-slot="suspect_label"></span><p class="said req" data-slot="a_2"></p></div>
  </div>
  <div class="pause mono" data-slot="pause_note"></div>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{padding:${p ? "80px 62px" : "62px 120px"};justify-content:space-between;
  background:linear-gradient(170deg,#0b0b0f,#09090c 60%)}
.hdr{font-size:${p ? "24px" : "20px"};letter-spacing:.2em;color:var(--dim);
  border-bottom:1px solid var(--line);padding-bottom:${p ? "18px" : "14px"};
  opacity:0;animation:fadeIn .5s ease .1s both}
.log{display:flex;flex-direction:column;gap:${p ? "38px" : "26px"};margin:auto 0}
.turn{opacity:0;animation:fadeUp .55s ease both}
/* Staggered so the eye reads them as turns taken in time, not as a block of text. */
.turn:nth-child(1){animation-delay:.5s}
.turn:nth-child(2){animation-delay:1.3s}
.turn:nth-child(3){animation-delay:2.1s}
.turn:nth-child(4){animation-delay:2.9s}
.who{display:block;font-size:${p ? "22px" : "18px"};font-weight:700;letter-spacing:.16em;
  margin-bottom:${p ? "12px" : "9px"}}
.off .who{color:var(--dim)}
/* The person being questioned is the only red thing on screen. */
.sus .who{color:var(--red)}
.said{font-size:${p ? "36px" : "29px"};line-height:1.5;color:#e4e4e7;
  padding-left:${p ? "22px" : "18px"};border-left:2px solid var(--line)}
.sus .said{border-left-color:rgba(225,29,72,.45);color:#fafafa}
.pause{font-size:${p ? "22px" : "18px"};letter-spacing:.16em;color:var(--red);
  opacity:0;animation:fadeIn .6s ease 3.7s both}`,
};

/* ═══ 2. morgue tag ═══════════════════════════════════════════════════════════
   The library's only LIGHT object floating in a dark room. Every other document frame is a
   dark panel with light text; this is a physical card the camera found. */
const morgue = {
  id: "frame-morgue-tag",
  name: "Morgue Tag",
  canvas: "dark",
  slots: {
    kicker: "Phòng pháp y",
    tag_title: "THẺ NHẬN DẠNG",
    row_1_label: "SỐ HỒ SƠ",
    row_1_value: "#NYC-8492-X",
    row_2_label: "PHÁT HIỆN LÚC",
    row_2_value: "03:15 — BẾN 54",
    row_3_label: "NGUYÊN NHÂN",
    row_3_value: "CHƯA XÁC ĐỊNH",
    stamp: "TẠM GIỮ",
    footer: "Hồ sơ chưa khép lại",
  },
  markup: `
  <div class="kicker" data-slot="kicker"></div>
  <div class="tag">
    <div class="hole"></div>
    <div class="tag-title mono" data-slot="tag_title"></div>
    <div class="row grp"><span class="mono" data-slot="row_1_label"></span><strong class="mono req" data-slot="row_1_value"></strong></div>
    <div class="row grp"><span class="mono" data-slot="row_2_label"></span><strong class="mono req" data-slot="row_2_value"></strong></div>
    <div class="row grp"><span class="mono" data-slot="row_3_label"></span><strong class="mono req" data-slot="row_3_value"></strong></div>
    <div class="stamp mono" data-slot="stamp"></div>
  </div>
  <div class="foot mono" data-slot="footer"></div>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{align-items:center;justify-content:center;padding:${p ? "0 62px" : "0 120px"};
  background:radial-gradient(ellipse at 50% 42%,#15161a 0%,#08090b 72%)}
.kicker{position:absolute;top:${p ? "88px" : "62px"};left:0;right:0;text-align:center}
/* Falls in and settles crooked. A tag hung by hand is never straight, and the crookedness is
   most of what makes it read as an object rather than a card component. */
.tag{width:${p ? "78%" : "42%"};background:#e4e4e7;color:#18181b;border-radius:5px;
  padding:${p ? "40px 38px 34px" : "32px 30px 26px"};
  box-shadow:0 30px 70px rgba(0,0,0,.85);position:relative;
  transform-origin:50% 0;animation:tagDrop .85s cubic-bezier(.2,.9,.3,1) .25s both}
@keyframes tagDrop{
  from{opacity:0;transform:translateY(-40px) rotate(4deg)}
  60%{opacity:1;transform:translateY(6px) rotate(-2.6deg)}
  to{opacity:1;transform:translateY(0) rotate(-1.4deg)}}
.hole{width:${p ? "26px" : "20px"};aspect-ratio:1;background:#08090b;border-radius:50%;
  margin:0 auto ${p ? "22px" : "16px"};border:3px solid #a1a1aa}
.tag-title{font-size:${p ? "26px" : "21px"};font-weight:700;text-align:center;letter-spacing:.14em;
  border-bottom:3px solid #18181b;padding-bottom:${p ? "14px" : "11px"}}
.row{display:flex;justify-content:space-between;gap:18px;
  font-size:${p ? "22px" : "18px"};margin-top:${p ? "18px" : "14px"};
  opacity:0;animation:fadeIn .45s ease both}
.row span{color:#52525b;letter-spacing:.1em}
.row strong{font-weight:700;text-align:right}
.row:nth-of-type(1){animation-delay:1.15s}
.row:nth-of-type(2){animation-delay:1.4s}
.row:nth-of-type(3){animation-delay:1.65s}
/* Lands hard and oversized, then settles to size — a stamp is pressed, not faded in. */
/* 82% wide, not full: rotating a full-width box makes its corners overhang the card, and a
   stamp printed past the edge of the card it is stamped on breaks the object. */
.stamp{width:82%;margin:${p ? "30px" : "24px"} auto 0;border:3px solid #dc2626;color:#dc2626;
  font-weight:700;text-align:center;font-size:${p ? "28px" : "23px"};
  padding:${p ? "10px" : "8px"};letter-spacing:.22em;
  animation:stampHit .4s cubic-bezier(.3,1.5,.5,1) 2.2s both}
@keyframes stampHit{
  from{opacity:0;transform:rotate(-8deg) scale(2.4)}
  to{opacity:1;transform:rotate(-7deg) scale(1)}}
.foot{position:absolute;left:0;right:0;bottom:${p ? "84px" : "58px"};text-align:center;
  font-size:${p ? "22px" : "18px"};letter-spacing:.18em;color:#6b6b73;
  opacity:0;animation:fadeIn .6s ease 2.9s both}`,
};

/* ═══ 3. cipher decrypt ═══════════════════════════════════════════════════════
   The hex matrix is NOT decorative filler typed by hand — it is derived from the translation
   text's own code points at render time. Change the sentence and the ciphertext changes with
   it. That is the difference between a frame that shows decryption and one that draws it. */
const cipher = {
  id: "frame-cipher-decrypt",
  name: "Cipher Decrypt",
  canvas: "dark",
  slots: {
    kicker: "BỘ GIẢI MÃ v2.4",
    out_label: "BẢN DỊCH",
    translation: "Chìa khoá nằm phía sau tấm gương. Đừng mở.",
    solved_1: "CHÌA KHOÁ",
    solved_2: "TẤM GƯƠNG",
    solved_3: "ĐỪNG MỞ",
    note: "Ba cụm được khớp trước, phần còn lại suy ra từ đó",
  },
  markup: `
  <div class="kicker" data-slot="kicker"></div>
  <div class="mid">
    <div class="matrix mono" id="matrix"></div>
    <div class="out grp">
      <div class="out-label mono" data-slot="out_label"></div>
      <p class="out-text req" data-slot="translation"></p>
    </div>
  </div>
  <div class="note mono" data-slot="note"></div>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{padding:${p ? "80px 58px" : "62px 120px"};justify-content:space-between;background:#07080a}
.mid{margin:auto 0}
.matrix{margin-bottom:${p ? "48px" : "30px"};font-size:${p ? "26px" : "21px"};line-height:2;
  color:#52525b;word-break:break-all;letter-spacing:.06em}
/* Each matched word swaps out of the noise on its own beat. The eye should catch three
   separate moments of recognition, not one wall lighting up. */
/* nowrap + inline-block: break-all is what lets the hex stream fill the column edge to edge,
   but a recovered word split across two lines is the one thing on screen that must stay whole. */
.hit{display:inline-block;white-space:nowrap;
  color:#fafafa;background:#18181b;border:1px solid #fafafa;padding:1px 7px;font-weight:700;
  animation:solve .35s ease both}
@keyframes solve{
  from{opacity:.25;background:transparent;border-color:transparent;color:#52525b;
    letter-spacing:.35em}
  to{opacity:1;letter-spacing:normal}}
.hit:nth-of-type(1){animation-delay:1.1s}
.hit:nth-of-type(2){animation-delay:1.9s}
.hit:nth-of-type(3){animation-delay:2.7s}
.out{border-left:3px solid #fafafa;background:var(--panel);
  padding:${p ? "26px 28px" : "20px 24px"};opacity:0;animation:fadeUp .6s ease 3.5s both}
.out-label{font-size:${p ? "20px" : "17px"};letter-spacing:.24em;color:var(--dim);
  margin-bottom:${p ? "12px" : "9px"}}
.out-text{font-size:${p ? "36px" : "29px"};line-height:1.45;font-weight:600}
.note{font-size:${p ? "21px" : "17px"};letter-spacing:.1em;color:#5b5b63;margin-top:${p ? "34px" : "22px"};
  opacity:0;animation:fadeIn .6s ease 4.1s both}`,
  // Build the ciphertext from the translation itself, then seat the solved words inside it.
  script: `
  var mx = document.getElementById("matrix");
  if (mx) {
    var src = String(v.translation || "");
    var bytes = [];
    for (var i = 0; i < src.length; i++) {
      var c = src.charCodeAt(i) & 0xff;
      bytes.push(("0" + c.toString(16).toUpperCase()).slice(-2));
    }
    // Too few bytes leaves the panel looking half-empty; repeat the stream rather than pad
    // with invented values, so every pair on screen traces back to a real character.
    while (bytes.length < 42) bytes = bytes.concat(bytes);
    var words = [v.solved_1, v.solved_2, v.solved_3]
      .map(function (w) { return w == null ? "" : String(w).trim(); })
      .filter(function (w) { return w.length; });
    var per = Math.max(4, Math.floor(bytes.length / (words.length + 1)));
    var html = "", wi = 0;
    for (var j = 0; j < bytes.length; j++) {
      if (wi < words.length && j > 0 && j % per === 0) {
        html += '<span class="hit"></span> ';
        // textContent, not innerHTML — copy is user data and must never be parsed as markup.
        wi++;
      }
      html += bytes[j] + " ";
    }
    mx.innerHTML = html;
    var hits = mx.querySelectorAll(".hit");
    for (var k = 0; k < hits.length; k++) hits[k].textContent = words[k];
  }`,
};

/* ═══ 4. VHS no-signal ════════════════════════════════════════════════════════
   The only frame in the library whose subject is the ABSENCE of footage. Reach for it when
   the tape ran out, the camera was already off, or the recording was taken. */
const vhs = {
  id: "frame-vhs-nosignal",
  name: "VHS No Signal",
  canvas: "dark",
  slots: {
    play_state: "PLAY ►  SP",
    timecode: "0:24:12",
    big_text: "MẤT TÍN HIỆU",
    cam_label: "CAM_04 [HÀNH LANG B]",
    note: "Bốn mươi phút cuối của cuốn băng không còn hình",
  },
  markup: `
  <div class="osd top mono"><span data-slot="play_state"></span><span data-slot="timecode"></span></div>
  <div class="big-wrap"><div class="big mono" data-slot="big_text"></div></div>
  <div class="osd bot grp">
    <span class="mono" data-slot="cam_label"></span>
    <p class="note" data-slot="note"></p>
  </div>
  <div class="tear t1"></div><div class="tear t2"></div>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{padding:${p ? "78px 58px" : "58px 110px"};justify-content:space-between;background:#000}
.osd{display:flex;justify-content:space-between;gap:20px;
  font-size:${p ? "28px" : "23px"};letter-spacing:.14em;color:#fafafa;
  text-shadow:0 0 12px rgba(255,255,255,.35);opacity:0;animation:fadeIn .4s ease .15s both}
.bot{flex-direction:column;align-items:flex-start;gap:${p ? "18px" : "14px"};animation-delay:2.4s}
.note{font-family:'Be Vietnam Pro',sans-serif;font-size:${p ? "30px" : "24px"};
  line-height:1.45;color:#a1a1aa;letter-spacing:normal;text-shadow:none}
.big-wrap{margin:auto 0;text-align:center}
/* Jitter on a steps() timing function: it lands on discrete offsets, so the sampled frame is
   always one of a few defined positions rather than a random point on a smooth curve. */
.big{font-size:${p ? "92px" : "78px"};font-weight:700;letter-spacing:${p ? "10px" : "8px"};
  animation:vhsIn .5s ease .5s both,jitter 1.6s steps(1,end) 1s 3 both}
@keyframes vhsIn{from{opacity:0;filter:blur(14px);letter-spacing:${p ? "40px" : "34px"}}
  to{opacity:1;filter:none}}
@keyframes jitter{
  0%,72%{transform:none;text-shadow:0 0 18px rgba(255,255,255,.3)}
  76%{transform:translate(-6px,2px);text-shadow:6px 0 0 rgba(225,29,72,.85),-6px 0 0 rgba(56,189,248,.7)}
  80%{transform:translate(5px,-2px);text-shadow:-5px 0 0 rgba(225,29,72,.85),5px 0 0 rgba(56,189,248,.7)}
  84%,100%{transform:none;text-shadow:0 0 18px rgba(255,255,255,.3)}}
/* Two head-switching tears sweeping the tape once each, not a permanent rolling band. */
.tear{position:absolute;left:0;right:0;height:${p ? "26px" : "20px"};z-index:25;pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),rgba(225,29,72,.3),transparent);
  mix-blend-mode:screen;opacity:0}
.t1{animation:tearRun 2.2s linear .9s 1 both}
.t2{animation:tearRun 1.7s linear 3.2s 1 both}
@keyframes tearRun{0%{opacity:.85;top:100%}90%{opacity:.5}100%{opacity:0;top:-4%}}`,
};

/* ═══ 5. suspect lineup ═══════════════════════════════════════════════════════
   Companion to `frame-vox-silhouette-file`, and the split matters: that one is a FILE about a
   person, this one is the moment of being looked at. The height marker is placed from the
   slot value, so the line and the number can never disagree. */
const lineup = {
  id: "frame-suspect-lineup",
  name: "Suspect Lineup",
  canvas: "dark",
  slots: {
    kicker: "NHẬN DẠNG // GÓC NHÌN NHÂN CHỨNG",
    subject_label: "NGƯỜI THỨ BA",
    height_label: "≈ 1m82",
    height_pct: "74",
    detail_1: "Áo khoác sẫm màu, mũ trùm kéo lên",
    detail_2: "Không ai trong ba nhân chứng chỉ cùng một người",
    footer: "Chưa ai bị truy tố",
  },
  markup: `
  <div class="kicker" data-slot="kicker"></div>
  <div class="stage">
    <div class="wall"></div>
    <div class="mark" id="mark"><span class="mark-label mono" data-slot="height_label"></span></div>
    <div class="body"></div>
  </div>
  <div class="ident">
    <div class="who mono" data-slot="subject_label"></div>
    <p class="d" data-slot="detail_1"></p>
    <p class="d" data-slot="detail_2"></p>
  </div>
  <div class="foot mono" data-slot="footer"></div>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{padding:${p ? "78px 58px 0" : "56px 110px 0"};background:#09090c}
.stage{position:relative;flex:1;margin-top:${p ? "34px" : "22px"};overflow:hidden}
/* Height rules on the wall, spaced evenly — the backdrop of every lineup room. */
.wall{position:absolute;inset:0;opacity:0;animation:fadeIn .6s ease .3s both;
  background:repeating-linear-gradient(0deg,#1b1b20,#1b1b20 2px,transparent 2px,transparent ${p ? "58px" : "44px"})}
.body{position:absolute;left:50%;bottom:0;transform:translateX(-50%);
  width:${p ? "300px" : "230px"};height:74%;background:#000;
  border-radius:${p ? "150px 150px 0 0" : "115px 115px 0 0"};
  box-shadow:0 0 60px rgba(255,255,255,.14);
  animation:step .9s cubic-bezier(.25,.9,.3,1) .8s both}
/* Steps forward out of the dark rather than fading in — it is a person walking into the room. */
@keyframes step{from{opacity:0;transform:translateX(-50%) scale(.9) translateY(40px)}
  to{opacity:1;transform:translateX(-50%) scale(1) translateY(0)}}
.mark{position:absolute;left:0;right:0;height:2px;background:var(--red);z-index:3;
  box-shadow:0 0 14px rgba(225,29,72,.7);
  transform-origin:left;animation:growX .7s cubic-bezier(.2,.8,.3,1) 2s both}
.mark-label{position:absolute;right:0;bottom:${p ? "12px" : "9px"};font-size:${p ? "26px" : "21px"};
  font-weight:700;letter-spacing:.1em;color:var(--red);
  opacity:0;animation:fadeIn .4s ease 2.6s both}
.ident{padding:${p ? "40px 0 0" : "26px 0 0"}}
.who{font-size:${p ? "34px" : "27px"};font-weight:700;letter-spacing:.18em;color:#fafafa;
  opacity:0;animation:fadeUp .55s ease 1.6s both}
.d{font-size:${p ? "31px" : "25px"};line-height:1.5;color:#a1a1aa;margin-top:${p ? "16px" : "12px"};
  opacity:0;animation:fadeUp .55s ease both}
.d:nth-of-type(1){animation-delay:2.9s}
.d:nth-of-type(2){animation-delay:3.3s}
.foot{padding:${p ? "34px 0 78px" : "22px 0 56px"};font-size:${p ? "21px" : "17px"};
  letter-spacing:.18em;color:#5b5b63;opacity:0;animation:fadeIn .6s ease 3.9s both}`,
  script: `
  var mark = document.getElementById("mark");
  var figure = document.querySelector(".body");
  if (mark) {
    // ONE number drives both the marker line and the height of the figure it measures. Left as
    // two independent values they drift apart on the first edit, and a ruler that does not
    // touch the head of the person it is measuring is a frame that lies about its own data.
    var pct = parseFloat(v.height_pct);
    if (!isFinite(pct)) pct = 74;
    pct = Math.max(20, Math.min(92, pct));
    mark.style.bottom = pct + "%";
    if (figure) figure.style.height = pct + "%";
  }`,
};

/* ═══ 6. polygraph ════════════════════════════════════════════════════════════
   The mock-up's stress bar was pinned at 88% in CSS while its keyframes ran 45%->94%, under a
   label that said something else again. Here one slot sets the bar's width AND prints the
   number, so there is nothing left to disagree about. */
const polygraph = {
  id: "frame-polygraph",
  name: "Polygraph",
  canvas: "dark",
  slots: {
    kicker: "MÁY GHI ĐA KÝ // BUỔI 2",
    subject_label: "ĐỐI TƯỢNG: KHÔNG RÕ",
    vitals: "NHỊP TIM 142 — NGƯỠNG CAO",
    trace_label: "BIÊN ĐỘ RUN CƠ",
    stress_pct: "88",
    verdict: "PHẢN ỨNG BẤT THƯỜNG",
    note: "Máy chỉ ghi lại phản ứng của cơ thể. Nó không nói được người ta đang nói dối.",
  },
  markup: `
  <div class="kicker" data-slot="kicker"></div>
  <div class="stats mono grp"><span data-slot="subject_label"></span><span class="req" data-slot="vitals"></span></div>
  <div class="trace">
    <svg class="pulse" viewBox="0 0 500 120" preserveAspectRatio="none">
      <path pathLength="100" d="M0,60 L60,60 L72,18 L84,104 L96,34 L110,82 L124,60 L210,60 L222,10 L234,110 L246,26 L260,88 L274,60 L360,60 L372,14 L384,106 L396,40 L410,78 L424,60 L500,60"/>
    </svg>
  </div>
  <div class="meter">
    <div class="meter-head mono"><span data-slot="trace_label"></span><span class="pct" id="pct"></span></div>
    <div class="bar"><div class="fill" id="fill"></div></div>
    <div class="verdict mono" data-slot="verdict"></div>
  </div>
  <p class="note" data-slot="note"></p>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{padding:${p ? "80px 58px" : "60px 118px"};justify-content:space-between;background:#090a0f}
.stats{display:flex;justify-content:space-between;gap:20px;font-size:${p ? "23px" : "19px"};
  color:#a1a1aa;border-bottom:1px solid var(--line);padding-bottom:${p ? "18px" : "14px"};
  margin-top:${p ? "26px" : "18px"};opacity:0;animation:fadeIn .5s ease .35s both}
.trace{position:relative;height:${p ? "260px" : "200px"};margin:auto 0;
  border-top:1px dashed var(--line);border-bottom:1px dashed var(--line);
  display:flex;align-items:center}
.pulse{width:100%;height:${p ? "180px" : "140px"};fill:none;stroke:var(--red);stroke-width:2.4;
  filter:drop-shadow(0 0 10px rgba(225,29,72,.55))}
/* Drawn on, not scrolled past. A trace that translates sideways forever gives a different
   frame on every render pass; a stroke drawn once from left to right gives the same one. */
.pulse path{stroke-dasharray:100;stroke-dashoffset:100;animation:draw 2.6s ease-out .6s both}
@keyframes draw{to{stroke-dashoffset:0}}
.meter{margin-bottom:${p ? "30px" : "20px"}}
.meter-head{display:flex;justify-content:space-between;font-size:${p ? "22px" : "18px"};
  letter-spacing:.12em;color:#a1a1aa;margin-bottom:${p ? "16px" : "12px"};
  opacity:0;animation:fadeIn .5s ease 2.9s both}
.pct{color:var(--red);font-weight:700}
.bar{height:${p ? "18px" : "14px"};background:#18181b;border:1px solid var(--line);border-radius:3px;
  overflow:hidden}
.fill{height:100%;width:0;background:var(--red);box-shadow:0 0 16px rgba(225,29,72,.8);
  animation:rise 1.1s cubic-bezier(.2,.8,.3,1) 3.1s both}
.verdict{margin-top:${p ? "18px" : "14px"};font-size:${p ? "26px" : "21px"};font-weight:700;
  letter-spacing:.16em;color:var(--red);opacity:0;animation:fadeIn .5s ease 4.1s both}
.note{font-size:${p ? "26px" : "21px"};line-height:1.5;color:#8b8b93;
  margin-top:${p ? "30px" : "20px"};opacity:0;animation:fadeUp .6s ease 4.5s both}`,
  script: `
  // ONE number: the bar's width and the printed percentage come from the same slot, so the
  // picture and the caption cannot say different things. The mock-up this replaces had three
  // different values for it.
  var pctEl = document.getElementById("pct"), fill = document.getElementById("fill");
  var n = parseFloat(v.stress_pct);
  if (!isFinite(n)) n = 0;
  n = Math.max(0, Math.min(100, n));
  if (fill) fill.style.setProperty("--w", n + "%");
  if (pctEl) pctEl.textContent = n + "%";`,
  extraCss: `@keyframes rise{to{width:var(--w,0%)}}`,
};

/* ═══ 7. thermal cam ══════════════════════════════════════════════════════════
   The only frame in the library that is GREEN. That is the point of it: cutting to this after
   six near-black frames reads as switching to a different instrument, not a different scene. */
const thermal = {
  id: "frame-thermal-cam",
  name: "Thermal Cam",
  canvas: "dark",
  slots: {
    system_label: "HỒNG NGOẠI // TRINH SÁT ĐÊM",
    gain_label: "ĐỘ KHUẾCH ĐẠI +24dB",
    heat_pct: "62",
    target_line: "MỘT NGUỒN NHIỆT",
    range_line: "CỰ LY 42.8 MÉT",
    caption: "Camera bắt được nguồn nhiệt này lúc 03:12, và mất dấu sau bốn phút.",
  },
  markup: `
  <div class="hud top mono"><span data-slot="system_label"></span><span data-slot="gain_label"></span></div>
  <div class="scope">
    <div class="blob" id="blob"></div>
    <div class="ring"></div>
    <div class="cross h"></div><div class="cross v"></div>
  </div>
  <div class="hud bot">
    <div class="read mono" data-slot="target_line"></div>
    <div class="read mono" data-slot="range_line"></div>
    <p class="cap" data-slot="caption"></p>
  </div>
  <div class="nightfall"></div>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{padding:${p ? "78px 58px" : "58px 112px"};justify-content:space-between;
  background:#041008;color:#22c55e}
.hud{display:flex;justify-content:space-between;gap:20px;z-index:3;
  font-size:${p ? "24px" : "20px"};letter-spacing:.14em;
  opacity:0;animation:fadeIn .5s ease .2s both}
.bot{flex-direction:column;align-items:flex-start;gap:${p ? "14px" : "10px"};animation-delay:2.6s}
.read{font-size:${p ? "34px" : "28px"};font-weight:700;letter-spacing:.1em;
  text-shadow:0 0 14px rgba(34,197,94,.6)}
.cap{font-family:'Be Vietnam Pro',sans-serif;font-size:${p ? "28px" : "23px"};line-height:1.5;
  color:#86efac;letter-spacing:normal;margin-top:${p ? "12px" : "8px"};max-width:${p ? "100%" : "62%"}}
.scope{position:absolute;inset:0;z-index:2;pointer-events:none}
/* The heat source itself, sized and lit from heat_pct — the readouts are describing something
   the frame actually draws, not a caption over an empty crosshair. */
.blob{position:absolute;top:44%;left:50%;transform:translate(-50%,-50%) scale(.2);
  width:${p ? "420px" : "300px"};aspect-ratio:1;border-radius:50%;
  background:radial-gradient(circle,rgba(190,255,190,var(--heat,.6)) 0%,rgba(34,197,94,.42) 34%,transparent 70%);
  animation:bloom 1.4s cubic-bezier(.2,.8,.3,1) .5s both}
@keyframes bloom{to{transform:translate(-50%,-50%) scale(1)}}
/* Sweeps once and STOPS on the source. An endlessly spinning reticle is a screensaver; one
   that arrives and locks is an instrument finding something. */
.ring{position:absolute;top:44%;left:50%;width:${p ? "300px" : "220px"};aspect-ratio:1;
  border:2px dashed #22c55e;border-radius:50%;
  animation:lock 2.2s cubic-bezier(.3,.9,.2,1) .8s both}
@keyframes lock{
  from{transform:translate(-50%,-50%) rotate(0deg) scale(1.9);opacity:0}
  60%{opacity:1}
  to{transform:translate(-50%,-50%) rotate(200deg) scale(1);opacity:1}}
.cross{position:absolute;background:rgba(34,197,94,.55);opacity:0;animation:fadeIn .4s ease 2.3s both}
.h{top:44%;left:0;right:0;height:1px}
.v{left:50%;top:0;bottom:0;width:1px}
.nightfall{position:absolute;inset:0;z-index:1;pointer-events:none;
  background:radial-gradient(circle at 50% 44%,transparent 34%,rgba(0,0,0,.86) 92%)}`,
  script: `
  var blob = document.getElementById("blob");
  if (blob) {
    var h = parseFloat(v.heat_pct);
    if (!isFinite(h)) h = 60;
    // 0-100 maps onto the visible intensity range. Below .18 the source disappears entirely
    // and the readouts end up describing an empty crosshair.
    blob.style.setProperty("--heat", (0.18 + Math.max(0, Math.min(100, h)) / 100 * 0.72).toFixed(3));
  }`,
};

/* ═══ 8. ballistics path ══════════════════════════════════════════════════════
   Same discipline as the polygraph: the mock-up drew rotate(28deg) under a label reading
   28.4°. One slot now sets the rotation and writes the label. */
const ballistics = {
  id: "frame-ballistics-path",
  name: "Ballistics Path",
  canvas: "dark",
  slots: {
    kicker: "ĐẠN ĐẠO // DỰNG LẠI ĐƯỜNG BAY",
    angle_deg: "28.4",
    angle_prefix: "GÓC BẮN",
    origin_label: "CỬA SỔ TẦNG 3",
    impact_label: "ĐIỂM CHẠM",
    distance_label: "140 MÉT",
    note: "Góc này chỉ khớp nếu người bắn đứng, không phải quỳ như lời khai ban đầu.",
  },
  markup: `
  <div class="kicker" data-slot="kicker"></div>
  <div class="canvas">
    <div class="grid"></div>
    <div class="path" id="path"><span class="tip"></span></div>
    <div class="src mono" data-slot="origin_label"></div>
    <div class="dst mono" data-slot="impact_label"></div>
    <div class="ang mono"><span data-slot="angle_prefix"></span> <b id="ang"></b></div>
  </div>
  <div class="bottom">
    <div class="dist mono grp"><span data-slot="distance_label"></span></div>
    <p class="note" data-slot="note"></p>
  </div>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{padding:${p ? "80px 58px" : "60px 118px"};justify-content:space-between;background:#07080b}
.bottom{margin-bottom:${p ? "10px" : "6px"}}
.canvas{position:relative;height:${p ? "540px" : "420px"};margin:auto 0;
  border:1px solid var(--line);background:#101015;overflow:hidden}
.grid{position:absolute;inset:0;opacity:.5;
  background:
    repeating-linear-gradient(0deg,#24242d,#24242d 1px,transparent 1px,transparent ${p ? "54px" : "42px"}),
    repeating-linear-gradient(90deg,#24242d,#24242d 1px,transparent 1px,transparent ${p ? "54px" : "42px"})}
/* Grows from the muzzle to the impact rather than appearing whole — the frame's claim is
   about a direction, and a direction has to be travelled to be read. */
.path{position:absolute;left:${p ? "8%" : "7%"};bottom:${p ? "22%" : "20%"};height:3px;
  width:${p ? "86%" : "88%"};background:linear-gradient(90deg,rgba(225,29,72,.25),var(--red));
  transform-origin:left center;box-shadow:0 0 16px rgba(225,29,72,.75);
  animation:fire 1.3s cubic-bezier(.25,.9,.3,1) .9s both}
@keyframes fire{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
.tip{position:absolute;right:-7px;top:-6px;width:15px;height:15px;border-radius:50%;
  background:#fff;box-shadow:0 0 22px rgba(255,255,255,.95);
  opacity:0;animation:fadeIn .25s ease 2.2s both}
.src,.dst,.ang{position:absolute;font-size:${p ? "22px" : "18px"};letter-spacing:.12em;
  color:#a1a1aa;opacity:0;animation:fadeIn .45s ease both}
.src{left:${p ? "6%" : "5%"};bottom:${p ? "10%" : "9%"};animation-delay:.6s}
.dst{right:${p ? "6%" : "5%"};top:${p ? "10%" : "9%"};animation-delay:2.4s}
.ang{right:${p ? "6%" : "5%"};bottom:${p ? "10%" : "9%"};color:var(--red);animation-delay:2.7s}
.ang b{font-weight:700}
.dist{font-size:${p ? "34px" : "27px"};font-weight:700;letter-spacing:.14em;color:#fafafa;
  opacity:0;animation:fadeUp .55s ease 3.1s both}
.note{font-size:${p ? "28px" : "23px"};line-height:1.5;color:#a1a1aa;margin-top:${p ? "22px" : "16px"};
  opacity:0;animation:fadeUp .6s ease 3.5s both}`,
  script: `
  // The drawn angle and the printed angle are one value. Two of them is how the mock-up ended
  // up drawing 28 degrees under a label that read 28.4.
  var pathEl = document.getElementById("path"), angEl = document.getElementById("ang");
  var deg = parseFloat(v.angle_deg);
  if (!isFinite(deg)) deg = 0;
  deg = Math.max(-80, Math.min(80, deg));
  // Screen y grows downward, so a positive firing angle has to rotate negative to read as up.
  if (pathEl) pathEl.style.transform = "rotate(" + (-deg) + "deg)";
  if (angEl) angEl.textContent = deg + "°";`,
};

/* ═══ 9. dispatch waveform ════════════════════════════════════════════════════
   Deliberately the twin of frame-interrogation-log, and deliberately opposite: this one is
   about the SOUND. Bar heights are derived from the transcript's own characters, so every
   episode's waveform is its own and nothing on screen is decorative. */
const dispatch = {
  id: "frame-dispatch-waveform",
  name: "Dispatch Waveform",
  canvas: "dark",
  slots: {
    rec_label: "ĐANG GHI — TỔNG ĐÀI KHẨN CẤP",
    timecode: "00:14",
    speaker_label: "TỔNG ĐÀI VIÊN",
    transcript: "Cứ bình tĩnh. Cho tôi biết có bao nhiêu người đang đứng ngoài cửa?",
    note: "Đoạn băng dừng ở đây. Không có câu trả lời nào được ghi lại.",
  },
  markup: `
  <div class="rec mono"><span class="dot"></span><span data-slot="rec_label"></span></div>
  <div class="wave" id="wave"></div>
  <div class="tc mono" data-slot="timecode"></div>
  <div class="quote grp">
    <div class="who mono" data-slot="speaker_label"></div>
    <p class="said req" data-slot="transcript"></p>
  </div>
  <p class="note" data-slot="note"></p>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{padding:${p ? "80px 58px" : "60px 118px"};justify-content:space-between;background:#08080a}
.rec{display:flex;align-items:center;gap:${p ? "16px" : "12px"};color:var(--red);
  font-size:${p ? "24px" : "20px"};font-weight:700;letter-spacing:.16em;
  opacity:0;animation:fadeIn .45s ease .15s both}
/* Three deliberate blinks, then it stays on. A dot blinking forever samples differently on
   every render; three and stop is the same every time. */
.dot{width:${p ? "18px" : "14px"};aspect-ratio:1;background:var(--red);border-radius:50%;
  box-shadow:0 0 14px var(--red);animation:blink .6s steps(1,end) .3s 3 both}
@keyframes blink{0%,49%{opacity:.15}50%,100%{opacity:1}}
.wave{display:flex;align-items:center;justify-content:center;gap:${p ? "6px" : "5px"};
  height:${p ? "300px" : "230px"};margin:auto 0}
.bar{flex:1 1 0;max-width:${p ? "17px" : "22px"};border-radius:3px;background:#3f3f46;
  transform:scaleY(0);transform-origin:center;
  animation:play .35s cubic-bezier(.2,.9,.3,1) both}
@keyframes play{to{transform:scaleY(1);background:#fafafa;box-shadow:0 0 10px rgba(255,255,255,.45)}}
.tc{text-align:center;font-size:${p ? "24px" : "20px"};letter-spacing:.2em;color:#52525b;
  margin-bottom:${p ? "34px" : "22px"};opacity:0;animation:fadeIn .5s ease 2.6s both}
.quote{border-left:3px solid var(--red);background:var(--panel);
  padding:${p ? "26px 28px" : "20px 24px"};opacity:0;animation:fadeUp .6s ease 2.9s both}
.who{font-size:${p ? "21px" : "17px"};letter-spacing:.2em;color:#71717a;
  margin-bottom:${p ? "12px" : "9px"}}
.said{font-size:${p ? "34px" : "27px"};line-height:1.45;color:#fafafa}
.note{font-size:${p ? "26px" : "21px"};line-height:1.5;color:#71717a;margin-top:${p ? "26px" : "18px"};
  opacity:0;animation:fadeUp .6s ease 3.6s both}`,
  script: `
  var wave = document.getElementById("wave");
  if (wave) {
    // Heights come from the transcript's own characters. A hand-typed set of bar heights is
    // the same picture in every episode, which is exactly the sameness this family exists to
    // break; derived heights make each recording look like itself.
    var src = String(v.transcript || "");
    var N = 34, frag = document.createDocumentFragment();
    for (var i = 0; i < N; i++) {
      var c = src.length ? src.charCodeAt(i % src.length) : 60;
      var d = src.length ? src.charCodeAt((i * 7 + 3) % src.length) : 90;
      var hpc = 12 + ((c * 31 + d * 17) % 78); // 12%-90% of the lane
      var b = document.createElement("div");
      b.className = "bar";
      b.style.height = hpc + "%";
      // Swept left to right across 1.6s so it reads as playback, not as a bar chart.
      b.style.animationDelay = (0.5 + i * 0.047).toFixed(3) + "s";
      frag.appendChild(b);
    }
    wave.appendChild(frag);
  }`,
};

/* ═══ 10. forensic chat ═══════════════════════════════════════════════════════
   frame-chat-bubbles already shows a conversation. What it cannot show is a message that was
   RECOVERED — one the sender deleted, and a reply that was still being typed when the record
   ends. Those two states are the whole reason this frame exists. */
const chat = {
  id: "frame-forensic-chat",
  name: "Forensic Chat",
  canvas: "dark",
  slots: {
    time_label: "03:14",
    sender_label: "SỐ KHÔNG XÁC ĐỊNH",
    msg_1: "Cậu về đến nhà chưa?",
    msg_2: "Tôi vừa về. Có chuyện gì vậy?",
    msg_deleted: "Tin nhắn đã bị người gửi thu hồi — khôi phục từ bộ nhớ máy",
    msg_3: "Đừng mở cửa sổ phía sau nhà.",
    typing_note: "Đang soạn tin…",
    footer: "Trích xuất từ điện thoại, không phải từ nhà mạng",
  },
  markup: `
  <div class="bar mono"><span data-slot="time_label"></span><span data-slot="sender_label"></span></div>
  <div class="thread">
    <div class="b in" data-slot="msg_1"></div>
    <div class="b out" data-slot="msg_2"></div>
    <div class="b gone" data-slot="msg_deleted"></div>
    <div class="b in last" data-slot="msg_3"></div>
  </div>
  <div class="typing mono" data-slot="typing_note"></div>
  <div class="foot mono" data-slot="footer"></div>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{padding:${p ? "78px 50px" : "58px 110px"};justify-content:space-between;background:#0b0b0e}
/* Softer than the family default: bubbles run to both edges here, and the standard vignette
   greys the white outgoing bubble into the incoming ones — losing the only thing that tells
   the two speakers apart. */
.vignette{background:radial-gradient(ellipse at 50% 45%,transparent 52%,rgba(0,0,0,.42) 100%)}
.bar{display:flex;justify-content:space-between;font-size:${p ? "22px" : "18px"};color:#71717a;
  letter-spacing:.14em;border-bottom:1px solid #1e1e24;padding-bottom:${p ? "18px" : "14px"};
  opacity:0;animation:fadeIn .45s ease .1s both}
.thread{display:flex;flex-direction:column;gap:${p ? "22px" : "16px"};margin:auto 0}
.b{max-width:82%;padding:${p ? "22px 26px" : "17px 21px"};border-radius:${p ? "22px" : "18px"};
  font-size:${p ? "31px" : "25px"};line-height:1.42;
  opacity:0;animation:pop .45s cubic-bezier(.2,.9,.3,1) both}
@keyframes pop{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}
.in{background:#18181b;border:1px solid var(--line);align-self:flex-start;border-bottom-left-radius:4px}
.out{background:#fafafa;color:#000;font-weight:600;align-self:flex-end;border-bottom-right-radius:4px}
/* Dashed, red, italic — a recovered message must never be mistakable for one that was simply
   sent. This is the state frame-chat-bubbles has no way to express. */
.gone{border:1px dashed var(--red);color:var(--red);font-style:italic;align-self:flex-start;
  font-size:${p ? "26px" : "21px"};background:rgba(225,29,72,.05)}
.b:nth-child(1){animation-delay:.5s}
.b:nth-child(2){animation-delay:1.2s}
.b:nth-child(3){animation-delay:1.9s}
.b:nth-child(4){animation-delay:2.7s}
.last{box-shadow:0 0 0 1px rgba(225,29,72,.35)}
/* Arrives last and resolves into nothing — the record ends here. */
.typing{font-size:${p ? "23px" : "19px"};color:#71717a;letter-spacing:.1em;
  margin-top:${p ? "24px" : "16px"};opacity:0;animation:fadeIn .5s ease 3.5s both}
.foot{font-size:${p ? "21px" : "17px"};letter-spacing:.16em;color:#4b4b52;
  margin-top:${p ? "26px" : "18px"};opacity:0;animation:fadeIn .5s ease 4s both}`,
};

/* ═══ 11. redacted dossier ════════════════════════════════════════════════════
   frame-document-redacted already blacks out a line of text. What it has no way to show is the
   PHOTOGRAPH the file was built around, or redaction lifting one bar at a time. Both are here,
   and both are the reason this is a separate frame rather than more slots on that one. */
const dossier = {
  id: "frame-redacted-dossier",
  name: "Redacted Dossier",
  canvas: "dark",
  slots: {
    case_no: "HỒ SƠ #1984-X",
    classification: "HẠN CHẾ",
    stamp: "CHƯA KHÉP",
    photo_caption: "Ảnh chụp tại hiện trường, tháng 3",
    field_1_label: "NGƯỜI LIÊN QUAN",
    field_1_value: "David Miller, 34 tuổi",
    field_2_label: "ĐỊA ĐIỂM",
    field_2_value: "Căn nhà bỏ hoang cuối đường",
    body_text: "Vật duy nhất thu được ở hiện trường là một cuốn sổ tay. Hai trang cuối đã bị xé, và trang còn lại chỉ có một cái tên.",
    revealed: "người đàn ông đeo mặt nạ",
    footer: "Bản sao lưu trữ — không phải bản gốc",
  },
  markup: `
  <div class="hdr mono"><span data-slot="case_no"></span><span data-slot="classification"></span></div>
  <div class="photo-wrap">
    <div class="ph" data-media-fallback></div>
    <img class="media" src="assets/media.png" alt="" onerror="this.style.display='none'">
    <div class="stamp mono" data-slot="stamp"></div>
  </div>
  <div class="cap mono" data-slot="photo_caption"></div>
  <div class="fields">
    <div class="f grp"><span class="fl mono" data-slot="field_1_label"></span><span class="fv req" data-slot="field_1_value"></span></div>
    <div class="f grp"><span class="fl mono" data-slot="field_2_label"></span><span class="fv req black b1" data-slot="field_2_value"></span></div>
  </div>
  <p class="body" data-slot="body_text"></p>
  <p class="reveal"><span class="black b2" data-slot="revealed"></span></p>
  <div class="foot mono" data-slot="footer"></div>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{padding:${p ? "72px 56px" : "54px 110px"};justify-content:space-between;
  background:#111116;
  background-image:radial-gradient(#20202a 1px,transparent 1px);background-size:${p ? "22px 22px" : "18px 18px"}}
.hdr{display:flex;justify-content:space-between;font-size:${p ? "22px" : "18px"};
  letter-spacing:.16em;color:#8a8a94;border-bottom:1px dashed #3f3f46;
  padding-bottom:${p ? "16px" : "12px"};opacity:0;animation:fadeIn .5s ease .1s both}
.photo-wrap{position:relative;margin:${p ? "34px auto 0" : "22px auto 0"};
  width:${p ? "58%" : "26%"};aspect-ratio:5/6;background:#1c1c22;border:3px solid #3f3f46;
  padding:${p ? "10px" : "8px"};box-shadow:0 18px 40px rgba(0,0,0,.7);
  transform:rotate(-1.6deg);opacity:0;animation:fadeUp .7s ease .45s both}
.ph{position:absolute;inset:${p ? "10px" : "8px"};background:
  repeating-linear-gradient(45deg,#26262e,#26262e 12px,#1e1e25 12px,#1e1e25 24px)}
.media{position:relative;width:100%;height:100%;object-fit:cover;
  filter:grayscale(100%) contrast(140%) brightness(.82)}
.stamp{position:absolute;bottom:${p ? "14px" : "10px"};right:${p ? "-16px" : "-12px"};
  border:2px solid var(--red);color:var(--red);font-size:${p ? "22px" : "18px"};font-weight:700;
  padding:${p ? "5px 12px" : "4px 9px"};letter-spacing:.14em;background:rgba(10,10,12,.85);
  animation:stampHit .35s cubic-bezier(.3,1.5,.5,1) 1.5s both}
@keyframes stampHit{from{opacity:0;transform:rotate(-16deg) scale(2.2)}
  to{opacity:1;transform:rotate(-11deg) scale(1)}}
.cap{text-align:center;font-size:${p ? "20px" : "16px"};color:#6b6b74;letter-spacing:.1em;
  margin-top:${p ? "22px" : "16px"};opacity:0;animation:fadeIn .5s ease 1s both}
.fields{margin-top:${p ? "34px" : "22px"};display:flex;flex-direction:column;gap:${p ? "16px" : "12px"}}
.f{display:flex;gap:${p ? "16px" : "12px"};align-items:baseline;flex-wrap:wrap;
  opacity:0;animation:fadeUp .5s ease both}
.f:nth-child(1){animation-delay:1.2s}
.f:nth-child(2){animation-delay:1.45s}
.fl{font-size:${p ? "20px" : "17px"};letter-spacing:.14em;color:#71717a;flex:none}
.fv{font-size:${p ? "30px" : "24px"};color:#e4e4e7;font-weight:600}
/* The bar slides off rather than fading. Redaction being LIFTED is an event; a crossfade
   reads as the frame loading slowly. */
.black{position:relative}
.black::after{content:"";position:absolute;inset:-2px -6px;background:#000;
  transform-origin:left;animation:unblack .5s cubic-bezier(.4,0,.2,1) both}
@keyframes unblack{from{transform:scaleX(1)}to{transform:scaleX(0);transform-origin:right}}
.b1::after{animation-delay:2.4s}
.b2::after{animation-delay:3.4s}
.body{font-size:${p ? "28px" : "23px"};line-height:1.55;color:#a8a8b2;
  margin-top:${p ? "30px" : "20px"};opacity:0;animation:fadeUp .6s ease 1.8s both}
.reveal{margin-top:${p ? "18px" : "12px"};font-size:${p ? "32px" : "26px"};font-weight:700;
  color:#fafafa;opacity:0;animation:fadeIn .4s ease 3.2s both}
.reveal .black{display:inline-block}
.foot{font-size:${p ? "20px" : "16px"};letter-spacing:.14em;color:#5b5b63;
  margin-top:${p ? "26px" : "18px"};opacity:0;animation:fadeIn .5s ease 4s both}`,
};

/* ═══ 12. archive newspaper ═══════════════════════════════════════════════════
   frame-vox-newspaper-tear is a torn CLIPPING — two columns, a pull quote, no picture. This is
   a whole page under glass: masthead, date line, and the photograph that ran with it. Different
   claim about the source, which is why both exist. */
const newspaper = {
  id: "frame-archive-newspaper",
  name: "Archive Newspaper",
  canvas: "dark",
  slots: {
    kicker: "Lưu trữ báo chí",
    paper_name: "NHẬT BÁO ĐỊA PHƯƠNG",
    issue_date: "SỐ RA NGÀY 14 THÁNG 3, 1984",
    headline: "MẤT TÍCH BÍ ẨN Ở TẦNG HẦM SỐ 4",
    standfirst: "Nhân chứng cuối cùng khai đã nghe một tiếng va đập trước khi toàn bộ đèn tắt.",
    column_text: "Cảnh sát phong toả khu nhà trong bốn ngày. Không có ai bị bắt giữ, và hồ sơ được xếp lại vào tháng sau đó.",
    photo_caption: "Ảnh tư liệu đăng kèm bài báo",
    footer: "Chụp lại từ bản vi phim của thư viện tỉnh",
  },
  markup: `
  <div class="kicker" data-slot="kicker"></div>
  <div class="sheet">
    <div class="masthead" data-slot="paper_name"></div>
    <div class="dateline mono" data-slot="issue_date"></div>
    <h1 class="head" data-slot="headline"></h1>
    <p class="stand" data-slot="standfirst"></p>
    <div class="cols">
      <div class="cut">
        <div class="ph" data-media-fallback></div>
        <img class="media" src="assets/media.png" alt="" onerror="this.style.display='none'">
      </div>
      <p class="col" data-slot="column_text"></p>
    </div>
    <div class="photocap" data-slot="photo_caption"></div>
  </div>
  <div class="foot mono" data-slot="footer"></div>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{padding:${p ? "70px 54px" : "52px 108px"};justify-content:space-between;background:#131316}
/* Softer than the family default. The sheet is the frame's one light surface, and the standard
   vignette drains it to grey — newsprint that reads grey reads as a rendering, not a scan. */
.vignette{background:radial-gradient(ellipse at 50% 45%,transparent 56%,rgba(0,0,0,.4) 100%)}
/* The sheet lands slightly turned, as a page photographed on a table does. Straight, it reads
   as a web layout with a beige background. */
.sheet{background:#e6e4dd;color:#18181b;padding:${p ? "40px 34px" : "30px 40px"};
  margin:${p ? "30px 0" : "18px 0"};box-shadow:0 26px 60px rgba(0,0,0,.75);
  transform:rotate(-.7deg);opacity:0;animation:fadeUp .8s ease .3s both}
.masthead{font-family:'Playfair Display',serif;font-weight:900;text-align:center;
  font-size:${p ? "40px" : "32px"};letter-spacing:.02em;border-bottom:3px double #18181b;
  padding-bottom:${p ? "12px" : "9px"}}
.dateline{text-align:center;font-size:${p ? "18px" : "15px"};letter-spacing:.14em;color:#57534e;
  margin-top:${p ? "12px" : "9px"}}
.head{font-family:'Playfair Display',serif;font-weight:900;text-transform:uppercase;
  font-size:${p ? "48px" : "40px"};line-height:1.06;margin:${p ? "22px 0 14px" : "16px 0 11px"};
  opacity:0;animation:fadeUp .6s ease .9s both}
.stand{font-size:${p ? "26px" : "21px"};line-height:1.45;color:#3f3f46;font-weight:600;
  border-bottom:1px solid #a8a29e;padding-bottom:${p ? "18px" : "14px"};
  opacity:0;animation:fadeUp .6s ease 1.2s both}
.cols{display:flex;gap:${p ? "20px" : "18px"};margin-top:${p ? "20px" : "16px"};align-items:flex-start}
.cut{position:relative;flex:none;width:${p ? "42%" : "34%"};aspect-ratio:4/5;background:#1c1c22;
  overflow:hidden;opacity:0;animation:fadeIn .7s ease 1.5s both}
.ph{position:absolute;inset:0;background:
  repeating-linear-gradient(45deg,#3f3f46,#3f3f46 10px,#33333a 10px,#33333a 20px)}
/* Halftone, not just greyscale: a full-tone photo on a newsprint page is the giveaway that the
   page is a rendering rather than a scan. */
.media{position:relative;width:100%;height:100%;object-fit:cover;
  filter:grayscale(100%) contrast(165%) brightness(.95)}
.col{font-size:${p ? "22px" : "18px"};line-height:1.5;color:#3f3f46;
  opacity:0;animation:fadeUp .6s ease 1.8s both}
.photocap{font-size:${p ? "18px" : "15px"};font-style:italic;color:#57534e;
  margin-top:${p ? "16px" : "12px"};opacity:0;animation:fadeIn .5s ease 2.2s both}
.foot{font-size:${p ? "20px" : "17px"};letter-spacing:.14em;color:#6b6b74;
  opacity:0;animation:fadeIn .5s ease 2.7s both}`,
};

/* ═══ 13. fingerprint match ═══════════════════════════════════════════════════
   A comparison being MADE, not reported. The scan crosses once, the percentage counts up to
   the value in the slot, and the same number sets the bar — nothing here can claim a match the
   drawing does not show. */
const fingerprint = {
  id: "frame-fingerprint-match",
  name: "Fingerprint Match",
  canvas: "dark",
  slots: {
    lab_label: "PHÒNG KỸ THUẬT HÌNH SỰ",
    sample_label: "MẪU THU TẠI HIỆN TRƯỜNG",
    match_pct: "99.87",
    verdict: "TRÙNG KHỚP",
    note: "Con số này nói hai mẫu giống nhau. Nó không nói ai đã để lại mẫu đó, hay khi nào.",
  },
  markup: `
  <div class="kicker" data-slot="lab_label"></div>
  <div class="scan">
    <div class="ph" data-media-fallback></div>
    <img class="media" src="assets/media.png" alt="" onerror="this.style.display='none'">
    <div class="laser"></div>
    <div class="corner tl"></div><div class="corner tr"></div>
    <div class="corner bl"></div><div class="corner br"></div>
  </div>
  <div class="sample mono" data-slot="sample_label"></div>
  <div class="result">
    <div class="pctline mono"><span class="big" id="pct"></span><span class="vd" data-slot="verdict"></span></div>
    <div class="bar"><div class="fill" id="fill"></div></div>
  </div>
  <p class="note" data-slot="note"></p>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{padding:${p ? "76px 56px" : "56px 112px"};justify-content:space-between;background:#08080c}
.scan{position:relative;margin:${p ? "38px auto 0" : "22px auto 0"};
  width:${p ? "62%" : "26%"};aspect-ratio:5/6;border:1px solid var(--line);overflow:hidden;
  background:#111116;opacity:0;animation:fadeIn .6s ease .3s both}
.ph{position:absolute;inset:0;background:
  radial-gradient(ellipse at 50% 50%,#2a2a33 0%,#15151b 70%),
  repeating-radial-gradient(circle at 50% 55%,transparent 0 7px,rgba(255,255,255,.05) 7px 8px)}
.media{position:relative;width:100%;height:100%;object-fit:cover;
  filter:grayscale(100%) brightness(.72) contrast(150%)}
/* One pass, top to bottom, and gone. A laser bouncing forever is a screensaver; a scan that
   completes is a measurement that produced the number underneath it. */
.laser{position:absolute;left:0;right:0;height:3px;background:var(--red);
  box-shadow:0 0 18px var(--red);animation:sweep 1.8s cubic-bezier(.4,0,.6,1) .7s both}
@keyframes sweep{from{top:-2%;opacity:1}90%{opacity:1}to{top:100%;opacity:0}}
.corner{position:absolute;width:${p ? "26px" : "20px"};height:${p ? "26px" : "20px"};
  border:2px solid var(--red);opacity:0;animation:fadeIn .3s ease 2.5s both}
.tl{top:8px;left:8px;border-right:0;border-bottom:0}
.tr{top:8px;right:8px;border-left:0;border-bottom:0}
.bl{bottom:8px;left:8px;border-right:0;border-top:0}
.br{bottom:8px;right:8px;border-left:0;border-top:0}
.sample{text-align:center;font-size:${p ? "21px" : "17px"};letter-spacing:.14em;color:#71717a;
  margin-top:${p ? "22px" : "16px"};opacity:0;animation:fadeIn .5s ease 2.7s both}
.result{margin-top:${p ? "34px" : "22px"}}
.pctline{display:flex;align-items:baseline;justify-content:space-between;gap:16px}
.big{font-size:${p ? "62px" : "50px"};font-weight:700;color:#fafafa;
  opacity:0;animation:fadeUp .5s ease 2.9s both}
.vd{font-size:${p ? "26px" : "21px"};font-weight:700;letter-spacing:.16em;color:var(--red);
  opacity:0;animation:fadeIn .4s ease 3.4s both}
.bar{height:${p ? "14px" : "11px"};background:#18181b;border:1px solid var(--line);
  border-radius:3px;overflow:hidden;margin-top:${p ? "16px" : "12px"}}
.fill{height:100%;width:0;background:var(--red);box-shadow:0 0 14px rgba(225,29,72,.75);
  animation:rise 1s cubic-bezier(.2,.8,.3,1) 3s both}
.note{font-size:${p ? "26px" : "21px"};line-height:1.5;color:#8b8b93;
  margin-top:${p ? "28px" : "18px"};opacity:0;animation:fadeUp .6s ease 3.9s both}`,
  extraCss: `@keyframes rise{to{width:var(--w,0%)}}`,
  script: `
  // The printed percentage and the bar are the same number, and the bar is drawn to it — a
  // match figure a viewer can read off the picture is the only kind worth showing.
  var pctEl = document.getElementById("pct"), fill = document.getElementById("fill");
  var n = parseFloat(v.match_pct);
  if (!isFinite(n)) n = 0;
  n = Math.max(0, Math.min(100, n));
  if (pctEl) pctEl.textContent = v.match_pct + "%";
  if (fill) fill.style.setProperty("--w", n + "%");`,
};

/* ═══ 14. witness polaroid ════════════════════════════════════════════════════
   frame-magnates-polaroid-desk is a DESK: two targets, a connection, a verdict. This is one
   picture and a doubt about it. The note slot is not decoration — a witness reconstruction
   presented without its uncertainty is the frame misleading the audience. */
const polaroid = {
  id: "frame-witness-polaroid",
  name: "Witness Polaroid",
  canvas: "dark",
  slots: {
    kicker: "Phác thảo theo lời nhân chứng",
    caption: "DỰNG LẠI THÁNG 2, 1984",
    date_label: "Ba nhân chứng, ba bản mô tả",
    note: "Bản phác thảo này được vẽ sáu tuần sau đêm đó, từ trí nhớ của một người duy nhất.",
    footer: "Không phải ảnh chụp",
  },
  markup: `
  <div class="kicker" data-slot="kicker"></div>
  <div class="card">
    <div class="win">
      <div class="ph" data-media-fallback></div>
      <img class="media" src="assets/media.png" alt="" onerror="this.style.display='none'">
      <div class="develop"></div>
    </div>
    <div class="cap" data-slot="caption"></div>
  </div>
  <div class="date mono" data-slot="date_label"></div>
  <p class="note" data-slot="note"></p>
  <div class="foot mono" data-slot="footer"></div>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{padding:${p ? "76px 56px" : "56px 112px"};justify-content:space-between;background:#0c0d10}
.kicker{text-align:center}
.card{width:${p ? "74%" : "30%"};margin:${p ? "40px auto 0" : "22px auto 0"};
  background:#eceaE4;padding:${p ? "16px 16px 44px" : "12px 12px 34px"};
  box-shadow:0 26px 60px rgba(0,0,0,.85);transform:rotate(1.8deg);
  animation:drop .8s cubic-bezier(.2,.9,.3,1) .3s both}
@keyframes drop{from{opacity:0;transform:rotate(6deg) translateY(-34px)}
  to{opacity:1;transform:rotate(1.8deg) translateY(0)}}
.win{position:relative;width:100%;aspect-ratio:1;background:#15151a;overflow:hidden}
.ph{position:absolute;inset:0;background:
  linear-gradient(160deg,#2a2a32,#17171d),
  repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 2px,transparent 2px 5px)}
.media{position:relative;width:100%;height:100%;object-fit:cover;
  filter:grayscale(100%) contrast(135%) brightness(.9)}
/* The emulsion clearing. It is the one thing that makes the object read as instant film rather
   than as a white-bordered picture, and it finishes — it does not pulse. */
.develop{position:absolute;inset:0;background:#d8d5cc;
  animation:develop 2.4s ease-out 1s both}
@keyframes develop{from{opacity:1}to{opacity:0}}
.cap{margin-top:${p ? "20px" : "15px"};text-align:center;color:#3f3f46;
  font-family:'JetBrains Mono',monospace;font-size:${p ? "21px" : "17px"};font-weight:700;
  letter-spacing:.1em;opacity:0;animation:fadeIn .5s ease 3s both}
.date{text-align:center;font-size:${p ? "22px" : "18px"};letter-spacing:.12em;color:#8b8b93;
  margin-top:${p ? "30px" : "20px"};opacity:0;animation:fadeIn .5s ease 3.4s both}
.note{font-size:${p ? "27px" : "22px"};line-height:1.5;color:#a1a1aa;text-align:center;
  margin-top:${p ? "20px" : "14px"};opacity:0;animation:fadeUp .6s ease 3.8s both}
.foot{text-align:center;font-size:${p ? "20px" : "17px"};letter-spacing:.18em;color:#5b5b63;
  opacity:0;animation:fadeIn .5s ease 4.3s both}`,
};

/* ═══ 15. crime scene map ═════════════════════════════════════════════════════
   WHERE IT HAPPENED. Everything about it is at rest: the pin lands and stays, one ring goes
   out and is gone. Its twin, frame-satellite-track, is the opposite — something still being
   followed. The mock-ups had these two as the same frame twice; the split is the whole point. */
const scenemap = {
  id: "frame-crime-scene-map",
  name: "Crime Scene Map",
  canvas: "dark",
  slots: {
    kicker: "HIỆN TRƯỜNG",
    coords: "45°24'12\"N 73°34'08\"W",
    time_label: "02:45",
    pin_x: "50",
    pin_y: "44",
    place_label: "Bãi đỗ xe sau nhà máy cũ",
    panel_text: "Đây là nơi chiếc xe được tìm thấy, ba ngày sau khi có người báo mất tích.",
    footer: "Nền bản đồ: ảnh tư liệu",
  },
  markup: `
  <div class="ph" data-media-fallback></div>
  <img class="media" src="assets/media.png" alt="" onerror="this.style.display='none'">
  <div class="dim"></div>
  <div class="hud">
    <div class="top mono"><span data-slot="coords"></span><span data-slot="time_label"></span></div>
    <div class="pin" id="pin"><span class="ring"></span><span class="dot"></span></div>
    <div class="bottom">
      <div class="panel grp">
        <div class="kicker" data-slot="kicker"></div>
        <div class="place req" data-slot="place_label"></div>
        <p class="ptext" data-slot="panel_text"></p>
      </div>
      <div class="foot mono" data-slot="footer"></div>
    </div>
  </div>`,
  css: (p) => `
:root{--kick:${p ? "22px" : "18px"}}
#root{background:#08090c}
.ph{position:absolute;inset:0;background:
  linear-gradient(150deg,#15161c,#0b0c10),
  repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px ${p ? "64px" : "50px"}),
  repeating-linear-gradient(90deg,rgba(255,255,255,.035) 0 1px,transparent 1px ${p ? "64px" : "50px"})}
.media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
  filter:grayscale(100%) contrast(115%) brightness(.6)}
.dim{position:absolute;inset:0;background:rgba(8,9,12,.72)}
.hud{position:relative;z-index:3;height:100%;display:flex;flex-direction:column;
  justify-content:space-between;padding:${p ? "78px 56px" : "56px 112px"}}
.top{display:flex;justify-content:space-between;gap:20px;font-size:${p ? "23px" : "19px"};
  letter-spacing:.14em;color:#a1a1aa;opacity:0;animation:fadeIn .5s ease .2s both}
/* Lands and stays. One ring leaves it and does not come back — a pin that pulses forever says
   "live signal", which is the other frame's job, not this one's. */
.pin{position:absolute;width:0;height:0}
.dot{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:${p ? "22px" : "17px"};aspect-ratio:1;background:var(--red);border-radius:50%;
  box-shadow:0 0 18px var(--red);animation:drop .5s cubic-bezier(.2,1.4,.4,1) .8s both}
@keyframes drop{from{opacity:0;transform:translate(-50%,-160%) scale(.4)}
  to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
.ring{position:absolute;left:50%;top:50%;width:${p ? "22px" : "17px"};aspect-ratio:1;
  border:2px solid var(--red);border-radius:50%;
  animation:out 1.5s ease-out 1.25s 1 both}
@keyframes out{from{opacity:.9;transform:translate(-50%,-50%) scale(1)}
  to{opacity:0;transform:translate(-50%,-50%) scale(7)}}
.panel{background:rgba(12,12,15,.9);border:1px solid var(--line);border-left:3px solid var(--red);
  padding:${p ? "26px 28px" : "20px 24px"};opacity:0;animation:fadeUp .6s ease 2s both}
.place{font-size:${p ? "34px" : "27px"};font-weight:700;margin-top:${p ? "12px" : "9px"}}
.ptext{font-size:${p ? "27px" : "22px"};line-height:1.5;color:#a1a1aa;margin-top:${p ? "14px" : "10px"}}
.foot{font-size:${p ? "20px" : "17px"};letter-spacing:.14em;color:#6b6b74;
  margin-top:${p ? "22px" : "16px"};opacity:0;animation:fadeIn .5s ease 2.8s both}`,
  script: `
  var pin = document.getElementById("pin");
  if (pin) {
    // The pin sits where the slots put it. Hard-coding 50%/44% in CSS meant every location in
    // every episode was marked at the same spot on its own map.
    var px = parseFloat(v.pin_x), py = parseFloat(v.pin_y);
    if (!isFinite(px)) px = 50;
    if (!isFinite(py)) py = 44;
    pin.style.left = Math.max(4, Math.min(96, px)) + "%";
    pin.style.top = Math.max(6, Math.min(88, py)) + "%";
  }`,
};

/* ═══ 16. satellite track ═════════════════════════════════════════════════════
   STILL BEING FOLLOWED. The reticle travels from one slot-given point to another and locks;
   the frame is about pursuit, not location. Deliberately the opposite of frame-crime-scene-map,
   which the source mock-ups drew as the same picture twice. */
const satellite = {
  id: "frame-satellite-track",
  name: "Satellite Track",
  canvas: "dark",
  slots: {
    sat_label: "VỆ TINH KH-11 // QUỸ ĐẠO THẤP",
    status_line: "ĐANG BÁM TÍN HIỆU",
    from_xy: "22,68",
    to_xy: "63,34",
    last_seen: "TÍN HIỆU CUỐI 03:40",
    place_label: "Rìa khu rừng phòng hộ phía bắc",
    note: "Sau mốc này thiết bị không phát thêm lần nào nữa.",
  },
  markup: `
  <div class="ph" data-media-fallback></div>
  <img class="media" src="assets/media.png" alt="" onerror="this.style.display='none'">
  <div class="dim"></div>
  <div class="hud">
    <div class="top mono"><span data-slot="sat_label"></span><span class="st" data-slot="status_line"></span></div>
    <svg class="track" id="track"></svg>
    <div class="box" id="box"></div>
    <div class="panel grp">
      <div class="seen mono" data-slot="last_seen"></div>
      <div class="place req" data-slot="place_label"></div>
      <p class="ptext" data-slot="note"></p>
    </div>
  </div>`,
  css: (p) => `
:root{--kick:${p ? "22px" : "18px"}}
#root{background:#050608}
.ph{position:absolute;inset:0;background:
  radial-gradient(ellipse at 38% 30%,#1a1c22,#08090c 70%),
  repeating-linear-gradient(112deg,rgba(255,255,255,.03) 0 2px,transparent 2px 26px)}
.media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
  filter:grayscale(100%) contrast(120%) brightness(.55)}
.dim{position:absolute;inset:0;background:rgba(5,6,8,.78)}
.hud{position:relative;z-index:3;height:100%;display:flex;flex-direction:column;
  justify-content:space-between;padding:${p ? "78px 56px" : "56px 112px"}}
.top{display:flex;justify-content:space-between;gap:20px;font-size:${p ? "22px" : "18px"};
  letter-spacing:.14em;color:#a1a1aa;opacity:0;animation:fadeIn .5s ease .2s both}
.st{color:var(--red);font-weight:700}
/* The path it took, drawn under the reticle so the movement leaves a record instead of just
   happening. */
.track{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}
.track line{stroke:rgba(225,29,72,.55);stroke-width:2;stroke-dasharray:8 8}
/* Travels, then tightens onto the target. Both endpoints come from slots — a reticle that
   always crosses the same diagonal is a decoration. */
.box{position:absolute;z-index:2;width:${p ? "150px" : "115px"};aspect-ratio:1;
  border:2px solid #fafafa;transform:translate(-50%,-50%);
  animation:travel 2.4s cubic-bezier(.35,0,.25,1) .7s both,
            lockred .01s linear 3.05s both}
@keyframes lockred{to{border-color:var(--red);box-shadow:0 0 24px rgba(225,29,72,.5)}}
@keyframes travel{
  from{left:var(--x1);top:var(--y1);opacity:0;transform:translate(-50%,-50%) scale(1.7)}
  12%{opacity:1}
  to{left:var(--x2);top:var(--y2);opacity:1;transform:translate(-50%,-50%) scale(1);
     border-color:var(--red)}}
.panel{background:rgba(8,9,12,.9);border:1px solid #2a2a32;
  padding:${p ? "26px 28px" : "20px 24px"};opacity:0;animation:fadeUp .6s ease 3.2s both}
.seen{font-size:${p ? "21px" : "17px"};letter-spacing:.18em;color:var(--red)}
.place{font-size:${p ? "34px" : "27px"};font-weight:700;margin-top:${p ? "12px" : "9px"}}
.ptext{font-size:${p ? "27px" : "22px"};line-height:1.5;color:#a1a1aa;margin-top:${p ? "14px" : "10px"}}`,
  script: `
  // Both ends of the track are slots, so a different pursuit draws a different path. The two
  // source mock-ups drew this and the scene map as the same fixed diagonal.
  function xy(s, dx, dy) {
    var parts = String(s || "").split(",");
    var a = parseFloat(parts[0]), b = parseFloat(parts[1]);
    return [isFinite(a) ? Math.max(6, Math.min(94, a)) : dx,
            isFinite(b) ? Math.max(8, Math.min(90, b)) : dy];
  }
  var from = xy(v.from_xy, 22, 68), to = xy(v.to_xy, 63, 34);
  var box = document.getElementById("box");
  if (box) {
    box.style.setProperty("--x1", from[0] + "%");
    box.style.setProperty("--y1", from[1] + "%");
    box.style.setProperty("--x2", to[0] + "%");
    box.style.setProperty("--y2", to[1] + "%");
  }
  var svg = document.getElementById("track");
  if (svg) {
    var ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
    ln.setAttribute("x1", from[0] + "%"); ln.setAttribute("y1", from[1] + "%");
    ln.setAttribute("x2", to[0] + "%"); ln.setAttribute("y2", to[1] + "%");
    svg.appendChild(ln);
  }`,
};

/* ═══ 17. corkboard threads ═══════════════════════════════════════════════════
   frame-vox-investigation-board presents a finished board. This one MAKES it: the cards go up,
   then the threads are drawn between them one at a time. The endpoints are measured from where
   the cards actually landed, which is what lets the same file work at 9:16 and 16:9 — the
   source mock-up hard-coded SVG pixel coordinates into a 360x640 box. */
const corkboard = {
  id: "frame-corkboard-threads",
  name: "Corkboard Threads",
  canvas: "dark",
  slots: {
    board_label: "BẢNG LIÊN KẾT",
    card_1_label: "NGƯỜI GỌI",
    card_2_label: "NGƯỜI NHẬN",
    card_3_label: "CUỘC GỌI 23:50",
    conclusion: "Ba người, một số máy, không ai thừa nhận đã bấm gọi.",
    stamp: "GIẢ THUYẾT",
    media_count: "2",
  },
  markup: `
  <div class="kicker" data-slot="board_label"></div>
  <div class="board" id="board">
    <svg class="threads" id="threads"></svg>
    <div class="card c1"><span class="pin"></span><div class="pic" data-media-cell="1"><div class="ph" data-media-fallback></div></div><div class="lbl mono" data-slot="card_1_label"></div></div>
    <div class="card c2"><span class="pin"></span><div class="pic" data-media-cell="2"><div class="ph" data-media-fallback></div></div><div class="lbl mono" data-slot="card_2_label"></div></div>
    <div class="card c3"><span class="pin"></span><div class="note-card mono" data-slot="card_3_label"></div></div>
  </div>
  <div class="stamp mono" data-slot="stamp"></div>
  <p class="concl" data-slot="conclusion"></p>`,
  css: (p) => `
:root{--kick:${p ? "24px" : "20px"}}
#root{padding:${p ? "76px 52px" : "54px 108px"};justify-content:space-between;background:#141419}
.board{position:relative;flex:1;margin:${p ? "34px 0" : "20px 0"}}
.threads{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;
  overflow:visible}
.threads line{stroke:var(--red);stroke-width:2.5;stroke-linecap:round;
  filter:drop-shadow(0 0 6px rgba(225,29,72,.55))}
/* NO opacity:0 on the element here. The tack keyframes declare only a "from", so the implicit
   "to" takes the element's OWN value — with opacity:0 in the rule, the cards animated in and
   then filled straight back to invisible, leaving three threads drawn between nothing. The
   "both" fill already hides them through their delay. */
.card{position:absolute;z-index:2;background:#1c1c22;border:1px solid #3f3f46;
  padding:${p ? "10px" : "8px"};box-shadow:0 14px 30px rgba(0,0,0,.85);
  animation:tack .5s cubic-bezier(.2,1.3,.4,1) both}
.c1{top:2%;left:2%;width:${p ? "40%" : "24%"};transform:rotate(-3deg);animation-delay:.4s}
.c2{top:2%;right:2%;width:${p ? "40%" : "24%"};transform:rotate(3.5deg);animation-delay:.7s}
.c3{bottom:6%;left:50%;width:${p ? "48%" : "28%"};margin-left:${p ? "-24%" : "-14%"};
  transform:rotate(-1deg);animation-delay:1s}
@keyframes tack{from{opacity:0;transform:scale(1.12) rotate(0deg)}}
.pin{position:absolute;top:${p ? "-7px" : "-6px"};left:50%;margin-left:-6px;
  width:12px;height:12px;background:var(--red);border-radius:50%;box-shadow:0 0 8px var(--red)}
.pic{position:relative;width:100%;aspect-ratio:4/3;background:#101014;overflow:hidden}
.ph{position:absolute;inset:0;background:
  repeating-linear-gradient(45deg,#2a2a32,#2a2a32 9px,#22222a 9px,#22222a 18px)}
.pic img{position:relative;width:100%;height:100%;object-fit:cover;
  filter:grayscale(100%) contrast(125%) brightness(.85)}
.lbl{margin-top:${p ? "10px" : "8px"};text-align:center;font-size:${p ? "20px" : "16px"};
  font-weight:700;letter-spacing:.1em;color:#fafafa}
.note-card{font-size:${p ? "22px" : "18px"};line-height:1.4;color:#e4e4e7;padding:${p ? "8px 4px" : "6px 3px"}}
.stamp{align-self:flex-end;border:2px solid var(--red);color:var(--red);font-weight:700;
  font-size:${p ? "22px" : "18px"};letter-spacing:.18em;padding:${p ? "6px 14px" : "5px 11px"};
  animation:stampHit .35s cubic-bezier(.3,1.5,.5,1) 3.4s both}
@keyframes stampHit{from{opacity:0;transform:rotate(-14deg) scale(2.2)}
  to{opacity:1;transform:rotate(-8deg) scale(1)}}
.concl{font-size:${p ? "30px" : "24px"};line-height:1.45;color:#d4d4d8;
  margin-top:${p ? "22px" : "14px"};opacity:0;animation:fadeUp .6s ease 3.8s both}`,
  script: `
  // Pictures first: the pipeline drops a scene's media array into assets/media-1..N.
  var count = Math.max(0, Math.min(2, parseInt(v.media_count, 10) || 0));
  for (var i = 1; i <= count; i++) {
    var cell = document.querySelector('[data-media-cell="' + i + '"]');
    if (!cell) continue;
    var im = document.createElement("img");
    im.alt = "";
    // Chrome paints its own broken-image mark on a sized <img>; hide the element so the
    // stand-in behind it is all a missing file leaves on screen.
    im.onerror = (function (el) { return function () { el.style.display = "none"; }; })(im);
    im.src = "assets/media-" + i + ".png";
    cell.appendChild(im);
  }

  // Threads are measured from where the cards LANDED, not typed in. The source mock-up wrote
  // SVG pixel coordinates against a 360x640 preview, so the same file could never draw a
  // correct line at 1080x1920, let alone at both aspects.
  var board = document.getElementById("board"), svg = document.getElementById("threads");
  var cards = [document.querySelector(".c1"), document.querySelector(".c2"), document.querySelector(".c3")]
    .filter(function (c) { return c && c.querySelector("[data-slot]"); });
  if (board && svg && cards.length > 1) {
    var b = board.getBoundingClientRect();
    var centre = function (el) {
      var r = el.getBoundingClientRect();
      return [r.left - b.left + r.width / 2, r.top - b.top + r.height / 2];
    };
    var pairs = [];
    for (var a = 0; a < cards.length; a++)
      for (var c = a + 1; c < cards.length; c++) pairs.push([cards[a], cards[c]]);
    pairs.forEach(function (pr, k) {
      var p1 = centre(pr[0]), p2 = centre(pr[1]);
      var len = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
      var ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ln.setAttribute("x1", p1[0]); ln.setAttribute("y1", p1[1]);
      ln.setAttribute("x2", p2[0]); ln.setAttribute("y2", p2[1]);
      // Drawn one after another: the frame's subject is a connection being made.
      ln.style.strokeDasharray = len;
      ln.style.strokeDashoffset = len;
      ln.style.animation = "thread .55s ease-out " + (1.5 + k * 0.5).toFixed(2) + "s both";
      svg.appendChild(ln);
    });
  }`,
  extraCss: `@keyframes thread{to{stroke-dashoffset:0}}`,
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
<style>${BASE}${t.css(portrait)}${t.extraCss || ""}</style>
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
  <div class="amb2"></div>
  <div class="vignette"></div>
  <div class="crt"></div>
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
  // Record group membership BEFORE filling — after the fill the evidence is gone.
  var groups = [];
  document.querySelectorAll(".grp").forEach(function (g) {
    groups.push({ el: g, hadReq: !!g.querySelector(".req") });
  });
  document.querySelectorAll("[data-slot]").forEach(function (el) {
    var k = el.getAttribute("data-slot");
    var val = v[k];
    // An empty slot removes its element rather than leaving a gap. An empty line reads as
    // missing data; an absent one reads as a deliberate omission.
    if (val == null || !String(val).trim()) { el.remove(); return; }
    el.textContent = String(val);
  });
  // A group that lost its substance leaves behind labels and rules — a speaker name with
  // nothing said, a row label with no value. Where a group marks one child "req", that child
  // IS the group's reason to exist and its absence removes the whole thing; otherwise the
  // group survives as long as any slot in it did.
  groups.forEach(function (o) {
    var dead = o.hadReq ? !o.el.querySelector(".req") : !o.el.querySelector("[data-slot]");
    if (dead) o.el.remove();
  });
${t.script || ""}
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

const notice = (t) => `# Attribution — ${t.id}

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

${t.why}

## Slots

${Object.keys(t.slots).map((k) => `- \`${k}\``).join("\n")}

Both compositions expose the same slot names; they are emitted together by
\`scripts/video/lib/build-detective-templates.mjs\`. Edit that file, not the HTML.
`;

interrogation.why =
  "Thirteen document frames existed and none of them held a CONVERSATION. `frame-chat-bubbles`\nis the nearest, and it is a phone screen — timestamps, read receipts, a UI. This is a typed\ntranscript: two named speakers, no audio, no device. Deliberately paired against\n`frame-dispatch-waveform`, which is the same material presented as something you are hearing.";
morgue.why =
  "Every document frame in the library is a dark panel with light text. This is the inverse — a\nphysical light-coloured card falling into a dark room and settling crooked. It is also the only\nframe built to carry a short fielded record (label/value rows) rather than prose.";
cipher.why =
  "`frame-terminal` shows a machine's OUTPUT. Nothing showed a machine still working on\nsomething. The ciphertext is derived from the translation's own code points at render time, so\nthe noise on screen is genuinely the message — change the sentence and the hex changes with it.";
vhs.why =
  "Nothing in the library could say THERE IS NO FOOTAGE. `frame-analog-grain` and\n`frame-glitch-title` degrade an image that exists; this frame's subject is the absence of one —\nthe tape that ran out, the camera already off, the recording that was taken.";
lineup.why =
  "Companion to `frame-vox-silhouette-file` and deliberately not a duplicate of it: that frame is\na FILE about a person, this is the moment of being looked at. The height marker is positioned\nfrom `height_pct`, so the drawn line and the printed number cannot disagree.";

polygraph.why =
  "The mock-up this replaces drew a stress bar pinned at 88% whose keyframes ran 45%-94%, under a\nlabel that said something else again. Here `stress_pct` sets the bar width AND prints the number,\nso the picture and the caption cannot disagree. Nothing else in the library reads a body.";
thermal.why =
  "The only GREEN frame in the library. That is its job: cutting to it after six near-black frames\nreads as switching instrument rather than switching scene. The heat source is drawn at an\nintensity taken from `heat_pct`, so the readouts describe something the frame actually renders.";
ballistics.why =
  "Nothing could show a RECONSTRUCTED path — where something came from and where it ended. The\nangle is a single slot that both rotates the trajectory and prints the label; the source mock-up\ndrew 28 degrees under a label reading 28.4.";
dispatch.why =
  "The deliberate twin of `frame-interrogation-log`, and its opposite: this one is about what you\nare HEARING. Bar heights are derived from the transcript's own characters, so every episode's\nwaveform is its own rather than the same hand-typed picture reused.";
chat.why =
  "`frame-chat-bubbles` already shows a conversation. What it cannot show is a RECOVERED message —\none the sender deleted — or a reply still being typed when the record ends. Those two states are\nthe entire reason this frame exists.";

dossier.why =
  "`frame-document-redacted` already blacks out a line of text. It has no way to show the PHOTOGRAPH the file was built around, or redaction lifting one bar at a time on separate beats. Both are the reason this is its own frame rather than more slots on that one.";
newspaper.why =
  "`frame-vox-newspaper-tear` is a torn CLIPPING — two columns, a pull quote, no picture. This is a whole page: masthead, date line, and the photograph that ran with it. The two make different claims about where the source came from, so both exist.";
fingerprint.why =
  "A comparison being MADE rather than reported. The scan crosses the sample once, and `match_pct` both prints the figure and draws the bar, so the frame cannot claim a match its own picture does not show. The note slot exists to keep the claim honest.";
polaroid.why =
  "`frame-magnates-polaroid-desk` is a desk: two targets, a connection, a verdict. This is one picture and a doubt about it — a witness reconstruction, developing, with the note that says how long after the night it was drawn.";

scenemap.why =
  "WHERE IT HAPPENED, at rest: the pin lands and stays, one ring goes out and is gone. Its position comes from `pin_x`/`pin_y`, so every episode marks its own place rather than the same spot on a different map. Deliberately split from `frame-satellite-track`.";
satellite.why =
  "STILL BEING FOLLOWED. The reticle travels between two slot-given points and locks, leaving the path behind it. The two source mock-ups drew this and the scene map as the same picture; separating pursuit from location is what makes both worth having.";
corkboard.why =
  "`frame-vox-investigation-board` presents a FINISHED board. This one makes it: cards go up, then threads are drawn between them one at a time, and the endpoints are measured from where the cards actually landed. The source mock-up hard-coded SVG pixel coordinates into a 360x640 preview, so it could not have drawn a correct line at any real canvas.";

const ALL = [interrogation, morgue, cipher, vhs, lineup,
             polygraph, thermal, ballistics, dispatch, chat,
             dossier, newspaper, fingerprint, polaroid,
             scenemap, satellite, corkboard];
const picked = ONLY ? ALL.filter((t) => ONLY.includes(t.id)) : ALL;
if (ONLY && picked.length !== ONLY.length) {
  console.error(`[tpl] unknown id in --only: ${ONLY.filter((i) => !ALL.some((t) => t.id === i)).join(", ")}`);
  process.exitCode = 1;
}
for (const t of picked) {
  const dir = path.join(OUT, t.id);
  const comp = path.join(dir, "compositions");
  if (dryRun) {
    console.log(`[tpl] would write ${t.id} (${Object.keys(t.slots).length} slots)`);
    continue;
  }
  fs.mkdirSync(comp, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html(t, "16:9"), "utf8");
  fs.writeFileSync(path.join(comp, "portrait.html"), html(t, "9:16"), "utf8");
  fs.writeFileSync(
    path.join(dir, "meta.json"),
    JSON.stringify({ id: t.id, name: t.name }, null, 2) + "\n",
    "utf8",
  );
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
  fs.writeFileSync(path.join(dir, "NOTICE.md"), notice(t), "utf8");
  console.log(`[tpl] ✓ ${t.id} — ${Object.keys(t.slots).length} slots, both aspects`);
}
if (!dryRun) console.log(`[tpl] next: theme-probe, template-sheet, CATALOG.md, counts`);
