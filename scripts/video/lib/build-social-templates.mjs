// build-social-templates.mjs — emit the "AI & social" scene templates.
//
//   node scripts/video/lib/build-social-templates.mjs                 # write all
//   node scripts/video/lib/build-social-templates.mjs --only frame-follow-cta
//   node scripts/video/lib/build-social-templates.mjs --catalog       # CATALOG.md section to stdout
//
// WHY THESE THREE. Three beats the library could not draw:
//   · frame-ai-prompt-reveal — "N mẹo dùng AI" videos showed the prompt as a static quote. The
//     point of such a tip is the exchange: what you type, then what comes back. frame-chat-bubbles
//     is two people texting; nothing typed a prompt or streamed an answer.
//   · frame-follow-cta — every outro was a logo or a sentence. The ask most short videos end on
//     is "follow", and nothing could show the button being pressed.
//   · frame-ai-answer-rank — GEO videos could show the query (frame-geo-faq-direct) but not the
//     thing a brand actually cares about: which sources the AI answer cited, and where it ranks.
//
// SOURCES. The ideas — a typed prompt with a streamed reply, a follow card whose button is
// tapped, an AI answer with a ranked citation list — come from the HyperFrames registry blocks
// `typed-prompt`, `chatgpt-exchange`, `ai-chat-reveal`, `tiktok-follow`, `x-follow-card` and
// `ai-answer-rank` (heygen-com/hyperframes, Apache-2.0, read at commit ffb13c3). Only the
// ideas: every line below is written for this kit, in the shell the trend set uses, with no
// markup, script, image or font taken from those blocks. Platforms are drawn as colours and
// plain shapes — no logo artwork.
//
// The HTML shell, base CSS and helpers (typeInto, has, seek) are shared with the trend builder,
// so both sets obey the same renderer contract.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderHtml, catalogEntry, HYPERFRAMES_JSON } from "./build-trend-templates.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const VT = path.join(KIT, "video-templates");

// Shared by the two templates that stream text word by word.
const STREAM_JS = `
    /** Words of \`text\` into \`el\`, one span each, starting at \`start\`, \`step\` apart. */
    function streamWords(el, text, start, step) {
      const words = String(text).trim().split(/\\s+/).filter(Boolean);
      words.forEach((w, i) => {
        const s = document.createElement("span");
        s.className = "w";
        s.textContent = w;
        s.style.animationDelay = (start + i * step).toFixed(3) + "s";
        el.appendChild(s);
        if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      });
      return start + words.length * step;
    }
`;

export const SOCIAL_TEMPLATES = [
  // 1 ── prompt typed, answer streamed ────────────────────────────────────────
  {
    id: "frame-ai-prompt-reveal",
    name: "AI · Prompt Reveal",
    role: "tip / demo",
    bestFor: "'N mẹo dùng AI' videos, prompt tips, showing what a good prompt gets back; one scene per tip",
    why: "A chat card: the user's prompt types in character by character with a caret, it is sent, the assistant thinks for a beat, then its answer streams in word by word, one line per point. A prompt tip is an exchange, and nothing in the library could type a prompt or stream a reply.",
    adapted: "typed-prompt, chatgpt-exchange, ai-chat-reveal",
    bg: "#101114",
    vars: {
      tag: "MẸO 3 · GIAO VAI TRÒ",
      prompt: "Đóng vai biên tập viên khó tính. Sửa đoạn mở bài này cho ngắn hơn, giữ giọng thân mật và chỉ ra lỗi lặp từ.",
      answer: "Vai trò: biên tập viên khắt khe, ưu tiên câu ngắn|Mở bài mới: còn 2 câu, bỏ 14 từ thừa|Lỗi lặp: chữ “rất” xuất hiện 4 lần — thay bằng ví dụ cụ thể|Giọng: giữ “mình – bạn”, không đổi sang trang trọng",
      model: "Trợ lý AI",
      note: "Giao vai trò trước, yêu cầu sau — câu trả lời sắc hơn hẳn",
    },
    slots: [
      ["tag", "≤24", "headline above the card (optional)"],
      ["prompt", "≤140", "typed one character at a time — no emoji"],
      ["answer", "≤260", "lines split on the pipe character, 2–5 lines; text before a `:` in a line is bolded"],
      ["model", "≤24", "small assistant label, e.g. ChatGPT (optional)"],
      ["note", "≤60", "takeaway under the card; empty removes it"],
    ],
    css: `
      #root { background: #101114; color: #f2f2ef; }
      #root::after { background-image: radial-gradient(rgba(255,255,255,.07) 1.5px, transparent 2px); background-size: 30px 30px; opacity: 1; animation: drift 14s linear infinite; }
      @keyframes drift { from { transform: translate(0, 0); } to { transform: translate(30px, 90px); } }
      .stage { justify-content: center; }
      .tag { align-self: flex-start; font-weight: 900; letter-spacing: -.01em; line-height: 1.08; color: #ffb547; clip-path: inset(0 100% 0 0); animation: wipeIn .5s var(--snap) .1s forwards; }
      .card { display: flex; flex-direction: column; background: #1a1b1f; border: 2px solid #2b2d33; border-radius: 36px; box-shadow: 0 40px 90px rgba(0,0,0,.45); opacity: 0; animation: rise .55s var(--out) .15s forwards; }
      .me { align-self: flex-end; position: relative; text-wrap: pretty; background: #ffb547; color: #15161a; font-weight: 700; line-height: 1.32; border-radius: 30px 30px 8px 30px; transform-origin: 100% 100%; }
      .me .ch { opacity: 0; animation: chIn .01s linear forwards; }
      @keyframes chIn { to { opacity: 1; } }
      .caret { display: inline-block; width: .09em; height: 1.05em; margin-left: .05em; vertical-align: -.16em; background: #15161a; animation: blink .7s steps(1) infinite, gone .01s linear forwards; }
      @keyframes blink { 50% { opacity: 0; } }
      @keyframes gone { to { opacity: 0; } }
      @keyframes bump { 0% { transform: scale(1); } 35% { transform: scale(.95); } 100% { transform: scale(1); } }
      .bot { display: flex; align-items: center; opacity: 0; animation: fade .3s ease forwards; }
      .spark { flex: none; background: #ffb547; clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); animation: spin 5s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .mdl { font-weight: 800; color: #a3a5ac; letter-spacing: .01em; }
      .dots { display: flex; animation: gone .15s linear forwards; }
      .dots i { display: block; border-radius: 50%; background: #a3a5ac; animation: hop .8s ease-in-out infinite; }
      .dots i:nth-child(2) { animation-delay: .15s; } .dots i:nth-child(3) { animation-delay: .3s; }
      @keyframes hop { 0%, 100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-40%); opacity: 1; } }
      .ans { display: flex; flex-direction: column; }
      .ln { display: flex; align-items: flex-start; line-height: 1.36; font-weight: 500; color: #e7e7e3; }
      .ln::before { content: ""; flex: none; width: .34em; height: .34em; margin-top: .5em; border-radius: 50%; background: #ffb547; opacity: 0; animation: pop .3s var(--spring) forwards; animation-delay: inherit; }
      .ln .w { display: inline-block; opacity: 0; animation: wIn .35s var(--out) forwards; }
      .ln .w.b { font-weight: 800; color: #ffffff; }
      @keyframes wIn { from { opacity: 0; transform: translateY(.3em); } to { opacity: 1; transform: none; } }
      .note { align-self: flex-start; text-wrap: pretty; font-weight: 700; color: #f2f2ef; border-left: 8px solid #ffb547; line-height: 1.3; opacity: 0; animation: rise .5s var(--out) forwards; }
    `,
    cssPortrait: `
      .stage { padding: 0 60px; gap: 54px; }
      .tag { font-size: 84px; max-width: 960px; }
      .card { padding: 48px 44px; gap: 38px; }
      .me { max-width: 840px; font-size: 46px; padding: 32px 38px; }
      .bot { gap: 18px; } .spark { width: 46px; height: 46px; } .mdl { font-size: 32px; }
      .dots { gap: 10px; margin-left: 6px; } .dots i { width: 14px; height: 14px; }
      .ans { gap: 26px; } .ln { font-size: 44px; gap: 22px; }
      .note { font-size: 40px; padding: 6px 0 6px 28px; max-width: 960px; }
    `,
    cssLandscape: `
      .stage { padding: 0 200px; gap: 30px; }
      .tag { font-size: 60px; }
      .card { padding: 38px 48px; gap: 26px; }
      .me { max-width: 1180px; font-size: 36px; padding: 22px 30px; }
      .bot { gap: 14px; } .spark { width: 36px; height: 36px; } .mdl { font-size: 26px; }
      .dots { gap: 8px; margin-left: 4px; } .dots i { width: 11px; height: 11px; }
      .ans { gap: 12px; } .ln { font-size: 33px; gap: 18px; }
      .note { font-size: 30px; padding: 4px 0 4px 22px; }
    `,
    markup: `
      <div class="stage">
        <div class="tag" data-slot="tag"></div>
        <div class="card">
          <div class="me" id="me"></div>
          <div class="bot" id="bot"><span class="spark"></span><span data-slot-box><span class="mdl" data-slot="model"></span></span><span class="dots" id="dots"><i></i><i></i><i></i></span></div>
          <div class="ans" id="ans"></div>
        </div>
        <div class="note" data-slot="note" id="note"></div>
      </div>`,
    js:
      STREAM_JS +
      `
      (function () {
        const me = document.getElementById("me");
        const prompt = String(v.prompt || "").trim();
        if (!prompt) me.remove();
        const step = Math.min(0.045, Math.max(0.008, 1.2 / Math.max(1, [...prompt].length)));
        const tEnd = prompt ? typeInto(me, prompt, 0.6, step) : 0.6;
        if (prompt) {
          const caret = document.createElement("span");
          caret.className = "caret";
          caret.style.animationDelay = "0s, " + (tEnd + 0.15).toFixed(2) + "s";
          me.appendChild(caret);
          me.style.animation = "bump .35s var(--spring) " + (tEnd + 0.15).toFixed(2) + "s both";
        }
        const T = tEnd + 0.15;                       // sent
        document.getElementById("bot").style.animationDelay = (T + 0.15).toFixed(2) + "s";
        const A = T + 0.6;                           // first word of the answer
        document.getElementById("dots").style.animationDelay = (A - 0.1).toFixed(2) + "s";
        const lines = String(v.answer || "").split("|").map((s) => s.trim()).filter(Boolean).slice(0, 5);
        const nWords = lines.reduce((n, l) => n + l.split(/\\s+/).length, 0) || 1;
        const wStep = Math.min(0.08, Math.max(0.012, (4.3 - A - lines.length * 0.12) / nWords));
        const ans = document.getElementById("ans");
        let t = A;
        lines.forEach((line) => {
          const ln = document.createElement("div");
          ln.className = "ln";
          ln.style.animationDelay = t.toFixed(2) + "s";
          const body = document.createElement("span");
          t = streamWords(body, line, t, wStep) + 0.12;
          // "Label: rest" — bold the label so each line scans as a point.
          const colon = line.indexOf(":");
          if (colon > 0 && colon < 32) {
            const n = line.slice(0, colon + 1).trim().split(/\\s+/).length;
            [...body.querySelectorAll(".w")].slice(0, n).forEach((w) => w.classList.add("b"));
          }
          ln.appendChild(body);
          ans.appendChild(ln);
        });
        const note = document.getElementById("note");
        if (note) note.style.animationDelay = Math.min(t + 0.15, 4.4).toFixed(2) + "s";
      })();
    `,
  },

  // 2 ── follow card with a tapped button ─────────────────────────────────────
  {
    id: "frame-follow-cta",
    name: "Social · Follow CTA",
    role: "outro / call to action",
    bestFor: "the last scene of a short: ask for the follow with the channel's own card, on TikTok, Facebook or YouTube colours",
    why: "A channel card builds — avatar ring, name, handle, a stat line, the ask — then a fingertip comes in and taps the follow button: it presses, ripples, bursts and flips to its followed state. Every outro in the library was a logo or a sentence; none showed the button being pressed.",
    adapted: "tiktok-follow, x-follow-card",
    bg: "#0d0e11",
    vars: {
      platform: "tiktok",
      handle: "@ghichu.congnghe",
      name: "Ghi Chú Công Nghệ",
      stat: "12,4K người theo dõi · 86 video",
      cta: "Theo dõi để nhận mẹo AI mỗi ngày",
      button: "Theo dõi",
      button_done: "Đang theo dõi",
    },
    slots: [
      ["platform", "tiktok · facebook · youtube", "colour scheme and ring; drawn as plain shapes, no logo"],
      ["handle", "≤24", "@handle under the name"],
      ["name", "≤28", "channel name; the avatar is its first letter"],
      ["stat", "≤32", "one line of proof, e.g. followers · videos (optional)"],
      ["cta", "≤40", "the ask, above the button (optional)"],
      ["button", "≤14", "button label before the tap"],
      ["button_done", "≤16", "label after the tap; empty keeps `button`"],
    ],
    css: `
      #root { background: #0d0e11; color: #ffffff; }
      #root.pf-tiktok { --ac: #fe2c55; --ac2: #25f4ee; --acx: #ffffff; }
      #root.pf-facebook { --ac: #1877f2; --ac2: #1877f2; --acx: #ffffff; }
      #root.pf-youtube { --ac: #ff0033; --ac2: #ff0033; --acx: #ffffff; }
      #root::after { background: radial-gradient(closest-side at 30% 35%, rgba(255,255,255,.07), transparent 70%), radial-gradient(closest-side at 70% 70%, rgba(255,255,255,.05), transparent 70%); opacity: 1; }
      .stage { display: grid; }
      .chip { display: inline-flex; align-items: center; font-weight: 800; color: #c9cbd1; background: #1b1d22; border-radius: 999px; opacity: 0; animation: fade .4s ease .1s forwards; }
      .chip::before { content: ""; width: .55em; height: .55em; border-radius: 50%; background: var(--ac); }
      .avw { grid-area: av; position: relative; justify-self: center; }
      .ring, .ring2 { position: absolute; inset: -14px; border-radius: 50%; border: 8px solid var(--ac); clip-path: circle(0% at 50% 50%); animation: ringIn .6s var(--out) .45s forwards; }
      .ring2 { border-color: var(--ac2); transform: translate(-8px, -6px); animation-delay: .55s; }
      .pf-facebook .ring2, .pf-youtube .ring2 { display: none; }
      @keyframes ringIn { to { clip-path: circle(75% at 50% 50%); } }
      .av { position: relative; width: 100%; height: 100%; border-radius: 50%; display: grid; place-items: center; background: #23252b; color: #ffffff; font-weight: 900; line-height: 1; transform: scale(0); animation: pop .55s var(--spring) .25s forwards; }
      .badge { position: absolute; left: 50%; bottom: -10px; translate: -50% 0; border-radius: 50%; background: var(--ac); color: var(--acx); display: grid; place-items: center; font-weight: 900; border: 6px solid #0d0e11; transform: scale(0); animation: pop .4s var(--spring) .8s forwards, flipBg .01s linear 2.75s forwards; }
      .badge::before, .badge::after { grid-area: 1 / 1; line-height: 1; }
      .badge::before { content: "+"; animation: gone .1s linear 2.75s forwards; }
      .badge::after { content: "✓"; opacity: 0; animation: fade .2s ease 2.8s forwards; }
      @keyframes gone { to { opacity: 0; } }
      @keyframes flipBg { to { background: #3a3d45; } }
      .name { grid-area: name; text-wrap: balance; font-weight: 900; letter-spacing: -.02em; line-height: 1.08; opacity: 0; animation: rise .5s var(--out) .55s forwards; }
      .handle { grid-area: handle; font-family: 'Roboto Mono', monospace; font-weight: 500; color: #9a9ca4; opacity: 0; animation: rise .5s var(--out) .7s forwards; }
      .stat { grid-area: stat; font-weight: 700; color: #d8d9dd; opacity: 0; animation: rise .5s var(--out) .85s forwards; }
      .cta { grid-area: cta; text-wrap: balance; font-weight: 800; line-height: 1.2; opacity: 0; animation: rise .5s var(--out) 1.1s forwards; }
      .bw { grid-area: btn; position: relative; opacity: 0; animation: rise .5s var(--out) 1.3s forwards; }
      .btn { position: relative; display: grid; place-items: center; background: var(--ac); color: var(--acx); font-weight: 900; border-radius: 22px; animation: press .4s ease 2.6s both, flipBg .2s linear 2.72s forwards; }
      @keyframes press { 0% { transform: scale(1); } 35% { transform: scale(.92); } 100% { transform: scale(1); } }
      .btn span { grid-area: 1 / 1; white-space: nowrap; }
      .btn .b1 { animation: out .14s ease 2.7s forwards; }
      .btn .b2 { opacity: 0; animation: in .3s var(--out) 2.84s forwards; }
      .btn .b2::before { content: "✓ "; }
      @keyframes out { to { opacity: 0; transform: translateY(-40%); } }
      @keyframes in { from { opacity: 0; transform: translateY(40%); } to { opacity: 1; transform: none; } }
      .rip { position: absolute; left: 50%; top: 50%; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%; border: 6px solid #ffffff; opacity: 0; animation: rip .7s var(--out) 2.65s forwards; pointer-events: none; }
      @keyframes rip { 0% { opacity: .9; transform: scale(.3); } 100% { opacity: 0; transform: scale(4.2); } }
      .tap { position: absolute; left: 50%; top: 50%; width: 110px; height: 110px; margin: -55px 0 0 -55px; border-radius: 50%; background: rgba(255,255,255,.35); border: 5px solid #ffffff; opacity: 0; animation: tap 1.5s var(--out) 1.9s forwards; pointer-events: none; z-index: 2; }
      @keyframes tap { 0% { opacity: 0; transform: translate(260px, 300px) scale(1); } 20% { opacity: 1; } 50% { opacity: 1; transform: translate(40px, 30px) scale(1); } 60% { transform: translate(40px, 30px) scale(.78); } 72% { opacity: 1; transform: translate(40px, 30px) scale(1); } 100% { opacity: 0; transform: translate(120px, 170px) scale(1); } }
      .burst { position: absolute; left: 50%; top: 50%; width: 0; height: 0; pointer-events: none; }
      .burst i { position: absolute; left: -8px; top: -8px; width: 16px; height: 16px; border-radius: 50%; background: var(--ac2); opacity: 0; animation: burst .7s var(--out) 2.72s forwards; }
      .burst i:nth-child(even) { background: #ffffff; }
      @keyframes burst { 0% { opacity: 1; transform: rotate(var(--a)) translateX(40px) scale(1); } 100% { opacity: 0; transform: rotate(var(--a)) translateX(var(--r)) scale(.4); } }
    `,
    cssPortrait: `
      .stage { padding: 0 70px; align-content: center; justify-items: center; text-align: center; row-gap: 26px;
        grid-template-areas: "chip" "av" "name" "handle" "stat" "cta" "btn"; }
      .chip { grid-area: chip; font-size: 32px; gap: 14px; padding: 14px 28px; margin-bottom: 40px; }
      .avw { width: 340px; height: 340px; margin-bottom: 40px; }
      .av { font-size: 170px; }
      .badge { width: 84px; height: 84px; font-size: 50px; }
      .name { font-size: 88px; max-width: 940px; margin-top: 12px; }
      .handle { font-size: 40px; }
      .stat { font-size: 38px; }
      .cta { font-size: 54px; max-width: 900px; margin-top: 50px; }
      .bw { margin-top: 30px; }
      .btn { min-width: 560px; height: 140px; padding: 0 60px; font-size: 54px; }
      .burst i { --r: 260px; }
    `,
    cssLandscape: `
      .stage { padding: 0 220px; align-content: center; justify-content: center; column-gap: 90px; row-gap: 14px; text-align: left; justify-items: start;
        grid-template-columns: 380px auto;
        grid-template-areas: "av chip" "av name" "av handle" "av stat" "av cta" "av btn"; }
      .chip { grid-area: chip; font-size: 26px; gap: 12px; padding: 10px 22px; margin-bottom: 10px; }
      .avw { width: 340px; height: 340px; align-self: center; }
      .av { font-size: 170px; }
      .badge { width: 88px; height: 88px; font-size: 52px; }
      .name { font-size: 84px; max-width: 1100px; }
      .handle { font-size: 34px; }
      .stat { font-size: 32px; }
      .cta { font-size: 44px; max-width: 1100px; margin-top: 24px; }
      .bw { margin-top: 18px; }
      .btn { min-width: 420px; height: 110px; padding: 0 50px; font-size: 44px; }
      .burst i { --r: 200px; }
    `,
    markup: `
      <div class="stage">
        <div class="chip" id="chip"></div>
        <div class="avw"><span class="ring2"></span><span class="ring"></span><div class="av" id="av"></div><span class="badge"></span></div>
        <div class="name" data-slot="name"></div>
        <div class="handle" data-slot="handle"></div>
        <div class="stat" data-slot="stat"></div>
        <div class="cta" data-slot="cta"></div>
        <div class="bw" data-slot-box>
          <div class="btn"><span class="b1" data-slot="button"></span><span class="b2" id="b2"></span></div>
          <span class="rip"></span>
          <span class="burst" id="burst"></span>
          <span class="tap"></span>
        </div>
      </div>`,
    js: `
      (function () {
        const NAMES = { tiktok: "TikTok", facebook: "Facebook", youtube: "YouTube" };
        let pf = String(v.platform || "tiktok").trim().toLowerCase();
        if (!NAMES[pf]) pf = "tiktok";
        document.getElementById("root").classList.add("pf-" + pf);
        document.getElementById("chip").textContent = NAMES[pf];
        const src = String(v.name || "").trim() || String(v.handle || "").replace(/^@/, "").trim();
        document.getElementById("av").textContent = src ? [...src][0].toUpperCase() : "";
        const b2 = document.getElementById("b2");
        if (b2) b2.textContent = String(v.button_done || "").trim() || String(v.button || "");
        const burst = document.getElementById("burst");
        if (burst) for (let i = 0; i < 12; i++) {
          const d = document.createElement("i");
          d.style.setProperty("--a", (i * 30 + 8) + "deg");
          burst.appendChild(d);
        }
      })();
    `,
  },

  // 3 ── AI answer with ranked citations ──────────────────────────────────────
  {
    id: "frame-ai-answer-rank",
    name: "AI · Answer Rank",
    role: "GEO proof / visibility",
    bestFor: "GEO and AI-visibility videos: what an assistant answers to a buyer's question, which sources it cites, and where the brand ranks among them",
    why: "A question types into an ask bar, the assistant's answer streams in with citation markers, then the cited sources stack up as a ranked list and the user's brand row lights up and keeps pulsing. frame-geo-faq-direct shows the query; nothing showed the citations, which is the part a brand is actually measured on.",
    adapted: "ai-answer-rank",
    bg: "#0e1013",
    vars: {
      question: "Phần mềm bán hàng nào hợp với shop nhỏ ở Việt Nam?",
      answer: "Với shop dưới 5 nhân viên, nên chọn phần mềm có quản lý kho, bán đa kênh và báo lãi lỗ theo ngày. Các lựa chọn được nhắc nhiều nhất đều có bản dùng thử miễn phí.",
      sources_label: "Nguồn được AI trích dẫn",
      sources: "Tạp chí Bán Lẻ:tapchibanle.vn|Cộng đồng Chủ Shop:chushop.vn|Thương hiệu của bạn:thuonghieucuaban.vn|Blog Kinh Doanh:blogkinhdoanh.vn",
      highlight: "2",
      note: "Ví dụ minh hoạ, không phải câu trả lời thật",
    },
    slots: [
      ["question", "≤90", "typed into the ask bar — no emoji"],
      ["answer", "≤220", "the assistant's paragraph, streamed word by word"],
      ["sources_label", "≤28", "small heading over the list (optional)"],
      ["sources", "3–6 rows", "`name:domain` rows joined by the pipe character; name ≤28, domain ≤28"],
      ["highlight", "0–5", "0-based row of the user's brand; empty or out of range highlights none"],
      ["note", "≤60", "caption under the list; empty removes it"],
    ],
    css: `
      #root { background: #0e1013; color: #eef0f2; }
      #root::after { background: repeating-linear-gradient(90deg, rgba(255,255,255,.03) 0 1px, transparent 1px 90px), repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0 1px, transparent 1px 90px); opacity: 1; animation: grid 10s linear infinite; }
      @keyframes grid { to { transform: translate(90px, 90px); } }
      .stage { display: grid; }
      .ask { grid-area: ask; text-wrap: pretty; display: flex; align-items: flex-start; background: #1a1d22; border: 2px solid #2c3037; border-radius: 30px; font-weight: 800; line-height: 1.25; opacity: 0; animation: rise .5s var(--out) .1s forwards; }
      .ask::before { content: ""; flex: none; width: .7em; height: .7em; margin-top: .26em; border-radius: 50%; border: .13em solid #f5b83d; }
      .ask .ch { opacity: 0; animation: chIn .01s linear forwards; }
      @keyframes chIn { to { opacity: 1; } }
      .reply { grid-area: reply; display: flex; flex-direction: column; }
      .who { display: flex; align-items: center; opacity: 0; animation: fade .3s ease forwards; }
      .spark { flex: none; background: #f5b83d; clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); animation: spin 5s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .para { line-height: 1.42; color: #d5d8dd; font-weight: 500; }
      .para .w { display: inline-block; opacity: 0; animation: wIn .35s var(--out) forwards; }
      @keyframes wIn { from { opacity: 0; transform: translateY(.3em); } to { opacity: 1; transform: none; } }
      .cite { display: inline-grid; place-items: center; vertical-align: .35em; margin-left: .2em; width: 1.35em; height: 1.35em; border-radius: 50%; background: #2c3037; color: #eef0f2; font-family: 'Roboto Mono', monospace; font-weight: 700; font-size: .55em; transform: scale(0); animation: pop .35s var(--spring) forwards; }
      .cite.hl { background: #f5b83d; color: #14161a; }
      .src { grid-area: src; display: flex; flex-direction: column; }
      .lab { font-family: 'Roboto Mono', monospace; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #8d929b; opacity: 0; animation: fade .3s ease forwards; }
      .row { position: relative; display: flex; align-items: center; border-radius: 22px; background: #181b20; opacity: 0; animation: slide .45s var(--out) forwards; }
      @keyframes slide { from { opacity: 0; transform: translateX(80px); } to { opacity: 1; transform: none; } }
      .row .rk { flex: none; font-family: 'Roboto Mono', monospace; font-weight: 700; color: #8d929b; text-align: center; }
      .row .fv { flex: none; display: grid; place-items: center; border-radius: 14px; color: #ffffff; font-weight: 900; }
      .row .tx { display: flex; flex-direction: column; min-width: 0; }
      .row .nm { font-weight: 800; line-height: 1.15; }
      .row .dm { font-family: 'Roboto Mono', monospace; color: #8d929b; line-height: 1.2; }
      .row.hl::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: #f5b83d; transform-origin: left; transform: scaleX(0); animation: fill .5s var(--snap) forwards; animation-delay: inherit; z-index: 0; }
      .row.hl > * { position: relative; z-index: 1; }
      .row.hl .rk, .row.hl .nm, .row.hl .dm { animation: ink .3s linear forwards; animation-delay: inherit; }
      @keyframes ink { to { color: #14161a; } }
      .row.hl::after { content: ""; position: absolute; inset: -6px; border-radius: 28px; border: 5px solid #f5b83d; opacity: 0; animation: ring 1.2s ease-out infinite; animation-delay: inherit; }
      @keyframes fill { to { transform: scaleX(1); } }
      @keyframes ring { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.06, 1.35); } }
      .note { grid-area: note; color: #8d929b; font-weight: 600; opacity: 0; animation: fade .4s ease forwards; }
    `,
    cssPortrait: `
      .stage { padding: 0 60px; align-content: center; row-gap: 52px; grid-template-areas: "ask" "reply" "src" "note"; }
      .ask { font-size: 52px; padding: 32px 36px; gap: 24px; }
      .reply { gap: 18px; } .who { gap: 16px; } .spark { width: 46px; height: 46px; }
      .para { font-size: 42px; }
      .src { gap: 16px; } .lab { font-size: 30px; margin-bottom: 6px; }
      .row { padding: 22px 28px; gap: 24px; } .row .rk { width: 44px; font-size: 36px; }
      .row .fv { width: 80px; height: 80px; font-size: 42px; }
      .row .nm { font-size: 44px; } .row .dm { font-size: 29px; }
      .note { font-size: 32px; }
    `,
    cssLandscape: `
      .stage { padding: 0 140px; align-content: center; column-gap: 80px; row-gap: 34px;
        grid-template-columns: 1fr 1fr; grid-template-areas: "ask ask" "reply src" "note src"; }
      .ask { font-size: 44px; padding: 24px 32px; gap: 20px; }
      .reply { gap: 16px; align-self: start; } .who { gap: 14px; } .spark { width: 36px; height: 36px; }
      .para { font-size: 33px; }
      .src { gap: 12px; align-self: start; } .lab { font-size: 22px; margin-bottom: 4px; }
      .row { padding: 14px 22px; gap: 18px; } .row .rk { width: 36px; font-size: 28px; }
      .row .fv { width: 58px; height: 58px; font-size: 30px; }
      .row .nm { font-size: 32px; } .row .dm { font-size: 22px; }
      .note { font-size: 24px; align-self: start; }
    `,
    markup: `
      <div class="stage">
        <div class="ask" id="ask"><span id="q"></span></div>
        <div class="reply"><div class="who" id="who"><span class="spark"></span></div><div class="para" id="para"></div></div>
        <div class="src" id="src"><div class="lab" data-slot="sources_label" id="lab"></div></div>
        <div class="note" data-slot="note" id="note"></div>
      </div>`,
    js:
      STREAM_JS +
      `
      (function () {
        const q = String(v.question || "").trim();
        const tq = q ? typeInto(document.getElementById("q"), q, 0.4, Math.min(0.035, Math.max(0.01, 0.9 / [...q].length))) : 0.3;
        if (!q) document.getElementById("ask").remove();
        const A = tq + 0.3;
        document.getElementById("who").style.animationDelay = (A - 0.2).toFixed(2) + "s";
        const para = document.getElementById("para");
        const nW = String(v.answer || "").trim().split(/\\s+/).filter(Boolean).length || 1;
        const tA = streamWords(para, v.answer || "", A, Math.min(0.05, Math.max(0.012, 0.95 / nW)));
        const rows = String(v.sources || "").split("|").map((s) => s.trim()).filter(Boolean).slice(0, 6).map((s) => {
          const i = s.indexOf(":");
          return i > 0 ? [s.slice(0, i).trim(), s.slice(i + 1).trim()] : [s, ""];
        });
        const raw = String(v.highlight ?? "").trim();
        const hl = raw === "" ? -1 : parseInt(raw, 10);
        rows.forEach((r, i) => {
          const c = document.createElement("span");
          c.className = "cite" + (i === hl ? " hl" : "");
          c.textContent = String(i + 1);
          c.style.animationDelay = (tA + 0.05 + i * 0.06).toFixed(2) + "s";
          para.appendChild(c);
        });
        const tL = tA + 0.1 + rows.length * 0.06;
        const lab = document.getElementById("lab");
        if (lab) lab.style.animationDelay = tL.toFixed(2) + "s";
        const FV = ["#3b6ea8", "#3f8f6b", "#a8553b", "#7a6a3b", "#5b6170", "#8a4f6e"];
        const src = document.getElementById("src");
        rows.forEach(([nm, dm], i) => {
          const row = document.createElement("div");
          row.className = "row";
          row.style.animationDelay = (tL + 0.05 + i * 0.12).toFixed(2) + "s";
          row.innerHTML = '<span class="rk"></span><span class="fv"></span><span class="tx"><span class="nm"></span><span class="dm"></span></span>';
          row.querySelector(".rk").textContent = String(i + 1);
          row.querySelector(".fv").textContent = [...nm][0] ? [...nm][0].toUpperCase() : "";
          row.querySelector(".fv").style.background = FV[i % FV.length];
          row.querySelector(".nm").textContent = nm;
          if (dm) row.querySelector(".dm").textContent = dm; else row.querySelector(".dm").remove();
          src.appendChild(row);
        });
        const tEnd = tL + 0.05 + rows.length * 0.12 + 0.3;
        if (hl >= 0 && hl < rows.length) {
          const row = src.querySelectorAll(".row")[hl];
          row.classList.add("hl");
          // The row's own entrance keeps its delay; the highlight (::before, ::after, ink) waits
          // for the whole list, so the brand lights up after the viewer has seen the ranking.
          row.querySelectorAll(".rk, .nm, .dm").forEach((el) => (el.style.animationDelay = tEnd.toFixed(2) + "s"));
          const sheet = document.createElement("style");
          sheet.textContent = ".row.hl::before { animation-delay: " + tEnd.toFixed(2) + "s; } .row.hl::after { animation-delay: " + (tEnd + 0.4).toFixed(2) + "s; }";
          document.head.appendChild(sheet);
        }
        const note = document.getElementById("note");
        if (note) note.style.animationDelay = Math.min(tEnd + 0.4, 4.6).toFixed(2) + "s";
      })();
    `,
  },
];

function notice(t) {
  return `# Attribution — ${t.id}

**Original template** authored for content-agent-kit (MIT, same as this repo).

The idea — not the code — comes from the HyperFrames registry block(s) \`${t.adapted.split(", ").join("`, `")}\`
in [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) (Apache-2.0, © HeyGen and
contributors; read at commit \`ffb13c3\`). No markup, script, CSS, image, font or audio from those
blocks is included: this template was written from scratch in this kit's own shell
(\`scripts/video/lib/build-trend-templates.mjs\` → \`renderHtml\`), with its own layout, timing,
colours and slots. Platform identity, where shown, is drawn with plain shapes and colours — no
trademark or logo artwork is reproduced.

## Why it exists

${t.why}

## Slots

${Object.keys(t.vars).map((k) => `- \`${k}\``).join("\n")}

Both compositions are emitted together by \`scripts/video/lib/build-social-templates.mjs\`.
Edit that file, not the HTML.
`;
}

export function buildAll({ only = null } = {}) {
  for (const t of SOCIAL_TEMPLATES) {
    if (only && t.id !== only) continue;
    const dir = path.join(VT, t.id);
    fs.mkdirSync(path.join(dir, "compositions"), { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), renderHtml({ t, w: 1920, h: 1080, compId: "main", portrait: false }), "utf8");
    fs.writeFileSync(path.join(dir, "compositions", "portrait.html"), renderHtml({ t, w: 1080, h: 1920, compId: "portrait", portrait: true }), "utf8");
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ id: t.id, name: t.name }, null, 2) + "\n", "utf8");
    fs.writeFileSync(path.join(dir, "hyperframes.json"), HYPERFRAMES_JSON, "utf8");
    fs.writeFileSync(path.join(dir, "NOTICE.md"), notice(t), "utf8");
    console.log(`[social] ✓ wrote ${t.id}`);
  }
}

export function catalogSection() {
  return SOCIAL_TEMPLATES.map(catalogEntry).join("\n");
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf("--only");
  if (process.argv.includes("--catalog")) console.log(catalogSection());
  else buildAll({ only: i > -1 ? process.argv[i + 1] : null });
}
