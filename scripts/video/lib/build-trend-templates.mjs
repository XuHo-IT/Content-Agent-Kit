// build-trend-templates.mjs — emit the "trend" scene templates (2026 short-form styles).
//
//   node scripts/video/lib/build-trend-templates.mjs            # write all
//   node scripts/video/lib/build-trend-templates.mjs --only frame-trend-bar-race
//
// WHY THESE THIRTEEN. They replace 27 older templates that rendered as a small card floating
// in an empty 9:16 frame — 14px text on a 1080px canvas, one entrance keyframe, then a still
// image — and whose demo copy had aged badly ("Claude 3.7 Sonnet", "GPT-4o"). The styles are
// drawn from what people actually ship with code-written video in late 2026, measured on the
// 703 prompts in yihui-dev/awesome-opus5-5-videos (motion 369 · 3D 117 · explainer 116;
// most-asked: graphs, product UI, code, launch, kinetic text, cursor, timelines), plus the
// active-word caption and punch-in grammar of talking-head editors like kurbaitaev/ghost-editor
// (MIT). Only ideas are borrowed — every line below is original.
//
// RULES EVERY TEMPLATE HERE FOLLOWS (the reasons the old ones were removed):
//   · Fill the frame. Type is sized for a phone held at arm's length: headlines ≥ 88px in 9:16.
//   · Three layers of motion: an entrance, a beat that happens mid-scene, and an ambient loop
//     on #root::after that never touches text — so a 9-second scene is not a still at second 4.
//   · All copy comes from slots, read through window.__hyperframes.getVariables().
//   · All motion is CSS, so hyperframes' seek() lands every frame deterministically. JS only
//     builds DOM once (split words, odometer columns) before the first seek.
//   · Demo numbers are labelled as illustrative in a `source` slot — a template must never
//     ship a statistic that looks real.
//   · Fonts: Be Vietnam Pro + Roboto Mono. Not JetBrains Mono: its Google Fonts build has no
//     horn or breve-dot glyphs (ư ơ ặ ợ fall back to a serif) — checked in a render 2026-11-10.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const VT = path.join(KIT, "video-templates");

export const HYPERFRAMES_JSON =
  JSON.stringify(
    {
      name: "template",
      version: "1.0.0",
      entry: "index.html",
      compositions: [{ id: "portrait", file: "compositions/portrait.html", label: "9:16 Portrait" }],
    },
    null,
    2,
  ) + "\n";

const FONTS_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,500;0,700;0,800;0,900;1,800&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">';

// Shared tokens. Colours are literals on purpose: theme.mjs recolours literals.
const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
    --snap: cubic-bezier(.2,.9,.1,1);
    --out: cubic-bezier(.16,1,.3,1);
  }
  #root { position: relative; overflow: hidden; width: 100%; height: 100%; font-family: 'Be Vietnam Pro', sans-serif; }
  #root::after {
    content: ""; position: absolute; inset: -30%; pointer-events: none; z-index: 0; opacity: .55;
    animation: ambient 16s linear infinite;
  }
  @keyframes ambient { from { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.08); } to { transform: rotate(360deg) scale(1); } }
  .stage { position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column; }
  .mono { font-family: 'Roboto Mono', monospace; }
  @keyframes rise { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: none; } }
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pop { 0% { opacity: 0; transform: scale(.4); } 60% { opacity: 1; } 100% { opacity: 1; transform: scale(1); } }
  @keyframes wipeIn { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
`;

export function renderHtml({ t, w, h, compId, portrait }) {
  const vars = JSON.stringify(t.vars).replace(/'/g, "&#39;");
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${w}, height=${h}">
  <title>${t.name}</title>
  ${t.fonts ?? FONTS_LINK}
  <style>
    html, body { width: ${w}px; height: ${h}px; overflow: hidden; background: ${t.bg}; }
    ${BASE_CSS}
    ${t.css}
    ${portrait ? t.cssPortrait : t.cssLandscape}
  </style>
</head>
<body>
  <div id="root" class="${portrait ? "P" : "L"}" data-composition-id="${compId}" data-width="${w}" data-height="${h}" data-start="0" data-duration="6" data-composition-variables='${vars}'>
    ${t.markup.trim()}
  </div>
  <script>
    // Caller values: window.__hyperframes.getVariables(), merged over the declared defaults
    // so the file still previews on its own. Built once, before the first seek.
    function getVariables() {
      let d = {};
      try { d = JSON.parse(document.getElementById("root").getAttribute("data-composition-variables") || "{}"); } catch (e) {}
      const hf = window.__hyperframes;
      const p = hf && typeof hf.getVariables === "function" ? hf.getVariables() || {} : {};
      return Object.assign({}, d, p);
    }
    const v = getVariables();
    const has = (k) => v[k] !== undefined && v[k] !== null && String(v[k]).trim() !== "";
    document.querySelectorAll("[data-slot]").forEach((el) => {
      const k = el.getAttribute("data-slot");
      if (!has(k)) { (el.closest("[data-slot-box]") || el).remove(); return; }
      el.textContent = String(v[k]);
    });
    /** One span per character, each starting \`step\` seconds after the last — a typewriter. */
    function typeInto(el, text, start, step) {
      el.textContent = "";
      [...String(text)].forEach((ch, i) => {
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = ch;
        s.style.animationDelay = (start + i * step).toFixed(3) + "s";
        el.appendChild(s);
      });
      return start + [...String(text)].length * step;
    }
    /** Odometer: every digit becomes a 0–9 column that rolls to its value. */
    function odometer(el, text, start) {
      el.textContent = "";
      let n = 0;
      [...String(text)].forEach((ch) => {
        if (/[0-9]/.test(ch)) {
          const col = document.createElement("span");
          col.className = "odo";
          const strip = document.createElement("span");
          strip.className = "odo-strip";
          for (let d = 0; d <= 9; d++) { const x = document.createElement("span"); x.textContent = d; strip.appendChild(x); }
          strip.style.setProperty("--d", ch);
          strip.style.animationDelay = (start + n++ * 0.07).toFixed(2) + "s";
          const size = document.createElement("span");
          size.className = "odo-size";
          size.textContent = ch;
          col.appendChild(size);
          col.appendChild(strip);
          el.appendChild(col);
        } else {
          const s = document.createElement("span");
          s.className = "odo-sep";
          s.textContent = ch;
          el.appendChild(s);
        }
      });
    }
    ${t.js ?? ""}
    window.__timelines = window.__timelines || {};
    window.__timelines["main"] = window.__timelines["portrait"] = {
      duration: 6,
      seek(t) { document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t * 1000; }); },
    };
  </script>
</body>
</html>
`;
}

// ─────────────────────────────────────────────────────────────────────────────
export const TREND_TEMPLATES = [
  // 1 ── active-word kinetic captions ─────────────────────────────────────────
  {
    id: "frame-trend-word-pop",
    name: "Trend · Active-Word Kinetic Captions",
    role: "hook / statement",
    bestFor: "the first 2 seconds; one sentence said out loud, word by word, with the payoff word lit",
    why: "The caption grammar of 2026 talking-head reels: words land one at a time in time with the voice, the word being spoken flashes, and the payoff phrase stays lit as a pill. No other template carries a whole sentence as the visual.",
    bg: "#0a0a0f",
    vars: {
      tag: "TIN NÓNG · AI",
      line: "Một agent vừa dựng xong video 60 giây chỉ trong 7 phút",
      accent: "7 phút",
      sub: "và không ai chạm vào phần mềm dựng phim",
    },
    slots: [
      ["tag", "≤24", "small pill above the sentence"],
      ["line", "≤64", "the sentence; split into words automatically, ~0.2s apart"],
      ["accent", "≤16", "words inside `line` to keep lit — must appear verbatim in `line`"],
      ["sub", "≤60", "smaller line after the sentence lands"],
    ],
    css: `
      #root { background: #0a0a0f; color: #ffffff; }
      #root::after { background-image: radial-gradient(rgba(255,255,255,.05) 1.5px, transparent 2px); background-size: 9px 9px; opacity: .8; }
      .stage { justify-content: center; align-items: center; text-align: center; }
      .tag { display: inline-block; background: #ff4d2e; color: #0a0a0f; font-weight: 800; letter-spacing: .08em; border-radius: 999px; animation: pop .5s var(--spring) both; }
      .words { display: flex; flex-wrap: wrap; justify-content: center; font-weight: 900; line-height: 1.04; letter-spacing: -.02em; }
      .w { display: inline-block; opacity: 0; border-radius: .18em; padding: 0 .12em; animation: wordIn .42s var(--spring) forwards, act .55s linear forwards; }
      .w.hot { animation: wordIn .42s var(--spring) forwards, hot .5s var(--snap) forwards; }
      @keyframes wordIn { from { opacity: 0; transform: translateY(.5em) scale(.7); } to { opacity: 1; transform: none; } }
      @keyframes act { 0% { color: #ffe14d; } 70% { color: #ffe14d; } 100% { color: #ffffff; } }
      @keyframes hot { from { background: transparent; color: #ffffff; } to { background: #ffe14d; color: #0a0a0f; } }
      .sub { color: #b8bcc8; font-weight: 600; opacity: 0; animation: rise .6s var(--out) forwards; }
      .bar { position: absolute; left: 0; bottom: 0; height: 10px; background: linear-gradient(90deg, #ff4d2e, #ffe14d); transform-origin: left; animation: grow 6s linear both; }
      @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    `,
    cssPortrait: `
      .stage { padding: 0 70px; gap: 56px; }
      .tag { font-size: 34px; padding: 14px 30px; }
      .words { font-size: 118px; gap: 6px 22px; }
      .sub { font-size: 44px; max-width: 900px; }
    `,
    cssLandscape: `
      .stage { padding: 0 160px; gap: 44px; }
      .tag { font-size: 28px; padding: 10px 26px; }
      .words { font-size: 104px; gap: 4px 26px; max-width: 1600px; }
      .sub { font-size: 38px; }
    `,
    markup: `
      <div class="stage">
        <div data-slot-box><span class="tag" data-slot="tag"></span></div>
        <div class="words" id="words"></div>
        <div class="sub" data-slot="sub"></div>
      </div>
      <div class="bar"></div>`,
    js: `
      (function () {
        const box = document.getElementById("words");
        const words = String(v.line || "").split(/\\s+/).filter(Boolean);
        const acc = String(v.accent || "").toLowerCase().split(/\\s+/).filter(Boolean);
        // Mark the run of words that spells \`accent\`, not every word that shares a token.
        const low = words.map((x) => x.toLowerCase().replace(/[.,!?…:;]+$/, ""));
        const hot = new Set();
        for (let i = 0; acc.length && i <= low.length - acc.length; i++) {
          if (acc.every((a, j) => low[i + j] === a.replace(/[.,!?…:;]+$/, ""))) acc.forEach((_, j) => hot.add(i + j));
        }
        const step = Math.min(0.26, 2.6 / Math.max(1, words.length));
        words.forEach((wd, i) => {
          const s = document.createElement("span");
          s.className = "w" + (hot.has(i) ? " hot" : "");
          s.textContent = wd;
          const d = (0.35 + i * step).toFixed(2) + "s";
          s.style.animationDelay = d + ", " + d;
          box.appendChild(s);
        });
        const sub = document.querySelector(".sub");
        if (sub) sub.style.animationDelay = (0.6 + words.length * step).toFixed(2) + "s";
      })();
    `,
  },

  // 2 ── search bar morph ─────────────────────────────────────────────────────
  {
    id: "frame-trend-search-morph",
    name: "Trend · Search Bar Morph",
    role: "hook / question",
    bestFor: "opening on what people are searching for; 'everyone is asking…' beats; a question the video answers",
    why: "A dot drops in, bounces, stretches into a search bar and types the query — then answers cascade under it. The most-remixed motion prompt pattern of 2026 and the most natural hook for a 'people are asking' video.",
    bg: "#f4f1ea",
    vars: {
      kicker: "Người Việt đang tìm nhiều nhất",
      query: "cách làm video ngắn bằng AI",
      result_1: "Kịch bản tự viết trong 30 giây",
      result_2: "Giọng đọc tiếng Việt tự nhiên",
      result_3: "Xuất 9:16 không cần mở CapCut",
      footer: "Nguồn: tự tổng hợp — thay bằng số liệu của bạn",
    },
    slots: [
      ["kicker", "≤36", "line above the bar"],
      ["query", "≤40", "typed into the bar, character by character"],
      ["result_1", "≤36", "first answer card"],
      ["result_2", "≤36", "second answer card"],
      ["result_3", "≤36", "third answer card (optional)"],
      ["footer", "≤56", "source line"],
    ],
    css: `
      #root { background: #f4f1ea; color: #14120f; }
      #root::after { background-image: radial-gradient(#d9d2c3 2px, transparent 2.5px); background-size: 46px 46px; opacity: .7; animation: dots 20s linear infinite; }
      @keyframes dots { from { transform: translate(0,0); } to { transform: translate(46px,46px); } }
      .stage { justify-content: center; align-items: center; }
      .kicker { font-weight: 900; color: #14120f; letter-spacing: -.02em; line-height: 1.05; opacity: 0; animation: rise .6s var(--out) 1.4s forwards; }
      .bar { position: relative; display: flex; align-items: center; background: #ffffff; border-radius: 999px; box-shadow: 0 30px 80px rgba(20,18,15,.18), 0 0 0 3px #14120f; overflow: hidden;
             animation: drop .7s cubic-bezier(.3,1.6,.5,1) both, stretch .55s var(--snap) .75s both; }
      @keyframes drop { 0% { transform: translateY(-900px); } 100% { transform: translateY(0); } }
      .glass { flex: none; border-radius: 50%; border: 6px solid #14120f; position: relative; opacity: 0; animation: fade .2s 1.2s forwards; }
      .glass::after { content: ""; position: absolute; width: 40%; height: 6px; background: #14120f; right: -30%; bottom: -10%; transform: rotate(45deg); border-radius: 3px; }
      .q { font-weight: 700; white-space: nowrap; overflow: hidden; }
      .q .ch { opacity: 0; animation: fade .01s linear forwards; }
      .caret { flex: none; width: 5px; background: #ff4d2e; animation: blink .9s steps(1) infinite; }
      @keyframes blink { 50% { opacity: 0; } }
      .results { display: flex; flex-direction: column; }
      .r { display: flex; align-items: center; background: #ffffff; border-radius: 28px; font-weight: 700; box-shadow: 0 12px 40px rgba(20,18,15,.10); opacity: 0; animation: rise .55s var(--spring) forwards; }
      .r i { flex: none; display: grid; place-items: center; border-radius: 18px; background: #ff4d2e; color: #ffffff; font-style: normal; font-family: 'Roboto Mono', monospace; font-weight: 800; }
      .r:nth-child(2) i { background: #2f6bff; } .r:nth-child(3) i { background: #14a36b; }
      .footer { color: #8a8273; font-weight: 600; opacity: 0; animation: fade .6s forwards; }
    `,
    cssPortrait: `
      .stage { padding: 0 64px; gap: 44px; }
      .kicker { font-size: 92px; align-self: flex-start; }
      .bar { width: 952px; height: 150px; padding: 0 44px; gap: 30px; }
      @keyframes stretch { from { width: 150px; padding: 0; } to { width: 952px; } }
      .glass { width: 54px; height: 54px; }
      .q { font-size: 50px; }
      .caret { height: 64px; }
      .results { width: 952px; gap: 26px; margin-top: 10px; }
      .r { padding: 30px 34px; gap: 28px; font-size: 44px; }
      .r i { width: 74px; height: 74px; font-size: 34px; }
      .footer { font-size: 30px; align-self: flex-start; }
    `,
    cssLandscape: `
      .stage { padding: 0 200px; gap: 34px; }
      .kicker { font-size: 72px; align-self: flex-start; }
      .bar { width: 1400px; height: 130px; padding: 0 40px; gap: 26px; }
      @keyframes stretch { from { width: 130px; padding: 0; } to { width: 1400px; } }
      .glass { width: 48px; height: 48px; }
      .q { font-size: 48px; }
      .caret { height: 58px; }
      .results { width: 1400px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
      .r { padding: 26px 26px; gap: 20px; font-size: 32px; }
      .r i { width: 60px; height: 60px; font-size: 28px; }
      .footer { font-size: 26px; align-self: flex-start; }
    `,
    markup: `
      <div class="stage">
        <div class="kicker" data-slot="kicker"></div>
        <div class="bar"><span class="glass"></span><span class="q" id="q"></span><span class="caret"></span></div>
        <div class="results">
          <div class="r" data-slot-box><i>1</i><span data-slot="result_1"></span></div>
          <div class="r" data-slot-box><i>2</i><span data-slot="result_2"></span></div>
          <div class="r" data-slot-box><i>3</i><span data-slot="result_3"></span></div>
        </div>
        <div class="footer" data-slot="footer"></div>
      </div>`,
    js: `
      (function () {
        const end = typeInto(document.getElementById("q"), v.query || "", 1.3, 0.045);
        document.querySelectorAll(".r").forEach((r, i) => { r.style.animationDelay = (end + 0.25 + i * 0.22).toFixed(2) + "s"; });
        const f = document.querySelector(".footer");
        if (f) f.style.animationDelay = (end + 1.1).toFixed(2) + "s";
      })();
    `,
  },

  // 3 ── bar race leaderboard ─────────────────────────────────────────────────
  {
    id: "frame-trend-bar-race",
    name: "Trend · Leaderboard Bar Race",
    role: "data / ranking",
    bestFor: "rankings, benchmarks, market share, 'top 5' with numbers; replaces tier lists and static leaderboards",
    why: "A ranking that is drawn from its numbers: bar lengths are computed from the values, bars race out in rank order with the leader crowned, and a light sweep keeps the board alive while the voice explains it.",
    bg: "#07090f",
    vars: {
      title: "Gen Z Việt dùng nền tảng nào nhiều nhất?",
      unit: "%",
      name_1: "TikTok",
      value_1: "78",
      name_2: "YouTube",
      value_2: "71",
      name_3: "Facebook",
      value_3: "64",
      name_4: "Instagram",
      value_4: "52",
      name_5: "Threads",
      value_5: "23",
      source: "Số liệu minh hoạ — thay bằng nguồn thật",
    },
    slots: [
      ["title", "≤60", "headline above the board"],
      ["unit", "≤6", "appended to every value (%, điểm, tr, …)"],
      ["name_1 … name_5", "≤18", "row labels, already in rank order"],
      ["value_1 … value_5", "number", "plain numbers (dot or comma decimals); bar length = value ÷ max"],
      ["source", "≤60", "where the numbers come from — required for anything real"],
    ],
    css: `
      #root { background: #121110; color: #ece8df; }
      #root::after { background-image: linear-gradient(90deg, rgba(236,232,223,.05) 2px, transparent 2px); background-size: 120px 100%; animation: gridMove 18s linear infinite; inset: 0 -120px 0 0; }
      @keyframes gridMove { to { transform: translateX(-120px); } }
      .stage { justify-content: center; }
      .title { font-weight: 900; letter-spacing: -.02em; line-height: 1.05; animation: rise .6s var(--out) both; }
      .rows { display: flex; flex-direction: column; }
      .row { display: grid; align-items: center; opacity: 0; animation: rise .5s var(--out) forwards; }
      .rank { font-family: 'Roboto Mono', monospace; font-weight: 800; color: #6f6a62; }
      .row:first-child .rank { color: #ff5b1f; }
      .name { font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .track { position: relative; height: 100%; }
      .fill { position: absolute; left: 0; top: 0; bottom: 0; width: var(--w); border-radius: 14px; background: #d9d3c7; transform-origin: left; animation: barGrow 1.1s var(--out) both; overflow: hidden; }
      .row:first-child .fill { background: #ff5b1f; }
      .fill::after { content: ""; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%); transform: translateX(-100%); animation: sweep 2.6s ease-in-out 2s infinite; }
      @keyframes sweep { to { transform: translateX(100%); } }
      @keyframes barGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      .val { position: absolute; top: 50%; left: calc(var(--w) + 18px); transform: translateY(-50%); font-family: 'Roboto Mono', monospace; font-weight: 800; opacity: 0; animation: fade .3s forwards; white-space: nowrap; }
      .row:first-child .val { color: #ff5b1f; }
      .crown { position: absolute; top: -.9em; left: calc(var(--w) - .9em); font-size: 1em; opacity: 0; animation: pop .5s var(--spring) forwards; }
      .source { color: #7d776d; font-weight: 600; opacity: 0; animation: fade .6s 2.6s forwards; }
    `,
    cssPortrait: `
      .stage { padding: 0 64px; gap: 64px; }
      .title { font-size: 92px; }
      .rows { gap: 34px; }
      .row { grid-template-columns: 70px 1fr; grid-template-rows: auto 96px; column-gap: 20px; row-gap: 10px; }
      .rank { font-size: 52px; grid-row: 1 / span 2; }
      .name { font-size: 46px; }
      .track { grid-column: 2; margin-right: 150px; }
      .val { font-size: 46px; }
      .crown { font-size: 52px; }
      .source { font-size: 30px; }
    `,
    cssLandscape: `
      .stage { padding: 0 160px; gap: 50px; }
      .title { font-size: 76px; max-width: 1500px; }
      .rows { gap: 24px; }
      .row { grid-template-columns: 70px 300px 1fr; height: 92px; column-gap: 24px; }
      .rank { font-size: 46px; }
      .name { font-size: 42px; }
      .track { margin-right: 180px; }
      .val { font-size: 44px; }
      .crown { font-size: 48px; }
      .source { font-size: 26px; }
    `,
    markup: `
      <div class="stage">
        <div class="title" data-slot="title"></div>
        <div class="rows" id="rows"></div>
        <div class="source" data-slot="source"></div>
      </div>`,
    js: `
      (function () {
        const num = (s) => Number(String(s ?? "").replace(/\\s/g, "").replace(/\\.(?=\\d{3}(\\D|$))/g, "").replace(",", "."));
        const rows = [];
        for (let i = 1; i <= 5; i++) if (has("name_" + i) && Number.isFinite(num(v["value_" + i]))) rows.push({ n: v["name_" + i], raw: String(v["value_" + i]), x: num(v["value_" + i]) });
        const max = Math.max(...rows.map((r) => r.x), 1);
        const box = document.getElementById("rows");
        rows.forEach((r, i) => {
          const row = document.createElement("div");
          row.className = "row";
          row.style.animationDelay = (0.4 + i * 0.16).toFixed(2) + "s";
          const w = Math.max(4, (r.x / max) * 100).toFixed(1) + "%";
          row.innerHTML = '<span class="rank">' + (i + 1) + '</span><span class="name"></span><div class="track" style="--w:' + w + '"><div class="fill"></div><span class="val"></span>' + (i === 0 ? '<span class="crown">👑</span>' : "") + "</div>";
          row.querySelector(".name").textContent = r.n;
          row.querySelector(".val").textContent = r.raw + (v.unit || "");
          const d = 0.6 + i * 0.16;
          row.querySelector(".fill").style.animationDelay = d.toFixed(2) + "s, " + (2.2 + i * 0.2).toFixed(2) + "s";
          row.querySelector(".val").style.animationDelay = (d + 0.9).toFixed(2) + "s";
          const c = row.querySelector(".crown"); if (c) c.style.animationDelay = (d + 1.1).toFixed(2) + "s";
          box.appendChild(row);
        });
      })();
    `,
  },

  // 4 ── odometer stat ────────────────────────────────────────────────────────
  {
    id: "frame-trend-stat-odometer",
    name: "Trend · Odometer Stat",
    role: "data / single number",
    bestFor: "one number that carries the scene — views, money, growth, a count; replaces compound-interest and inflation cards",
    why: "Every digit rolls on its own wheel to its value, then a sparkline draws itself under it. A single big number is the most-used data beat in short video, and none of the remaining templates make the number itself move.",
    bg: "#050b08",
    vars: {
      kicker: "CHỈ TRONG 24 GIỜ",
      value: "1.240.000",
      unit: "lượt xem",
      label: "cho một video 40 giây dựng hoàn toàn bằng code",
      delta: "▲ 312% so với tuần trước",
      source: "Số liệu minh hoạ",
    },
    slots: [
      ["kicker", "≤28", "mono line above the number"],
      ["value", "≤11", "digits roll; dots, commas, $, % pass through unchanged"],
      ["unit", "≤16", "word after the number"],
      ["label", "≤64", "what the number means"],
      ["delta", "≤32", "change pill (green)"],
      ["source", "≤48", "where it comes from"],
    ],
    css: `
      #root { background: #050b08; color: #eafff3; }
      #root::after { background: radial-gradient(45% 35% at 50% 45%, rgba(34,197,94,.30), transparent 70%); animation: breathe 5s ease-in-out infinite; inset: 0; }
      @keyframes breathe { 50% { opacity: .25; transform: scale(1.15); } }
      .stage { justify-content: center; }
      .kicker { font-family: 'Roboto Mono', monospace; font-weight: 800; color: #4ade80; letter-spacing: .14em; animation: fade .5s both; }
      .num { display: flex; align-items: flex-end; font-weight: 900; line-height: 1; letter-spacing: -.03em; }
      .odo { position: relative; display: inline-block; height: 1em; overflow: hidden; }
      .odo-size { visibility: hidden; }
      .odo-strip { position: absolute; left: 0; right: 0; top: 0; display: flex; flex-direction: column; align-items: center; transform: translateY(0); animation: roll 1.5s cubic-bezier(.2,.8,.2,1) forwards; }
      .odo-strip span { height: 1em; line-height: 1; }
      @keyframes roll { to { transform: translateY(calc(var(--d) * -1em)); } }
      .odo-sep { display: inline-block; }
      .unit { font-weight: 800; color: #86efac; opacity: 0; animation: rise .5s var(--out) 1.4s forwards; }
      .label { font-weight: 700; color: #c7d7cd; opacity: 0; animation: rise .6s var(--out) 1.7s forwards; }
      .delta { display: inline-block; background: #22c55e; color: #03140a; font-weight: 800; border-radius: 999px; opacity: 0; animation: pop .5s var(--spring) 2.1s forwards; }
      .spark { width: 100%; overflow: visible; }
      .spark path { fill: none; stroke: #4ade80; stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1600; stroke-dashoffset: 1600; animation: draw 1.6s var(--out) 1.2s forwards; }
      .spark circle { fill: #eafff3; opacity: 0; animation: pop .4s var(--spring) 2.7s forwards; transform-box: fill-box; transform-origin: center; }
      @keyframes draw { to { stroke-dashoffset: 0; } }
      .source { color: #5f7a6a; font-weight: 600; opacity: 0; animation: fade .6s 2.6s forwards; }
    `,
    cssPortrait: `
      .stage { padding: 0 70px; gap: 34px; }
      .kicker { font-size: 34px; }
      .num { font-size: 168px; }
      .unit { font-size: 64px; }
      .label { font-size: 50px; line-height: 1.25; }
      .delta { font-size: 38px; padding: 14px 30px; align-self: flex-start; }
      .spark { height: 260px; margin-top: 30px; }
      .source { font-size: 28px; }
    `,
    cssLandscape: `
      .stage { padding: 0 180px; gap: 26px; }
      .kicker { font-size: 30px; }
      .num { font-size: 200px; }
      .unit { font-size: 60px; }
      .label { font-size: 44px; max-width: 1300px; }
      .delta { font-size: 34px; padding: 12px 28px; align-self: flex-start; }
      .spark { height: 170px; }
      .source { font-size: 24px; }
    `,
    markup: `
      <div class="stage">
        <div class="kicker" data-slot="kicker"></div>
        <div class="num" id="num"></div>
        <div class="unit" data-slot="unit"></div>
        <div class="label" data-slot="label"></div>
        <div data-slot-box style="display:flex"><span class="delta" data-slot="delta"></span></div>
        <svg class="spark" viewBox="0 0 1000 200" preserveAspectRatio="none"><path d="M0 180 L120 165 L230 172 L340 140 L450 150 L560 110 L670 120 L780 70 L890 60 L1000 12"/><circle cx="1000" cy="12" r="14"/></svg>
        <div class="source" data-slot="source"></div>
      </div>`,
    js: `odometer(document.getElementById("num"), v.value || "", 0.3);`,
  },

  // 5 ── before / after wipe ──────────────────────────────────────────────────
  {
    id: "frame-trend-compare-wipe",
    name: "Trend · Before/After Wipe",
    role: "comparison",
    bestFor: "before vs after, old way vs new way, pros vs cons, product A vs B; replaces the pros-cons scale and diff cards",
    why: "The 'before' side fills the frame, then a glowing divider sweeps across and wipes the 'after' side in over it — the comparison is the motion, instead of two boxes sitting side by side.",
    bg: "#111114",
    vars: {
      title: "Làm video kiểu cũ vs dùng agent",
      left_label: "TRƯỚC",
      left_1: "3 tiếng cắt ghép thủ công",
      left_2: "Phụ đề gõ tay từng dòng",
      left_3: "Mỗi video một kiểu, không đồng bộ",
      right_label: "SAU",
      right_1: "7 phút từ ý tưởng tới file MP4",
      right_2: "Phụ đề tự khớp theo từng từ",
      right_3: "Một bộ nhận diện cho mọi video",
      verdict: "Tiết kiệm ~90% thời gian dựng",
    },
    slots: [
      ["title", "≤48", "question above both sides"],
      ["left_label / right_label", "≤12", "side labels"],
      ["left_1 … left_3", "≤40", "the 'before' points"],
      ["right_1 … right_3", "≤40", "the 'after' points"],
      ["verdict", "≤44", "badge after the wipe"],
    ],
    css: `
      #root { background: #111114; color: #f5f5f7; }
      #root::after { background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,.05) 50%, transparent 60%); animation: shine 6s linear infinite; inset: 0; }
      @keyframes shine { from { transform: translateX(-60%); } to { transform: translateX(60%); } }
      .stage { justify-content: center; }
      .title { font-weight: 900; line-height: 1.05; letter-spacing: -.02em; animation: rise .6s var(--out) both; position: relative; z-index: 3; }
      .panes { position: relative; }
      .pane { position: absolute; inset: 0; border-radius: 40px; display: flex; flex-direction: column; justify-content: center; }
      .before { background: #26262d; color: #a1a1aa; animation: fade .4s .2s both; }
      .after { background: #1f3dff; color: #ffffff; clip-path: inset(0 100% 0 0); animation: reveal 1.1s cubic-bezier(.7,0,.2,1) 2.1s forwards; }
      @keyframes reveal { to { clip-path: inset(0 0 0 0); } }
      .lbl { font-family: 'Roboto Mono', monospace; font-weight: 800; letter-spacing: .16em; }
      .before .lbl { color: #ef4444; } .after .lbl { color: #d6dcff; }
      .pt { display: flex; align-items: flex-start; font-weight: 800; line-height: 1.2; }
      .before .pt { opacity: 0; animation: rise .5s var(--out) forwards; }
      .pt b { flex: none; display: grid; place-items: center; border-radius: 50%; font-family: 'Roboto Mono', monospace; }
      .before .pt b { background: #3f3f46; color: #ef4444; } .after .pt b { background: #ffffff; color: #1f3dff; }
      .before .pt span { text-decoration: line-through; text-decoration-color: rgba(239,68,68,.0); animation: strike .4s forwards; }
      @keyframes strike { to { text-decoration-color: rgba(239,68,68,.9); } }
      .divider { position: absolute; top: -20px; bottom: -20px; width: 8px; left: 100%; background: #ffffff; box-shadow: 0 0 0 3px #111114; border-radius: 4px; z-index: 2; opacity: 0; animation: slide 1.1s cubic-bezier(.7,0,.2,1) 2.1s forwards; }
      .divider::after { content: ""; position: absolute; top: 50%; left: 50%; width: 64px; height: 64px; border-radius: 50%; background: #ffffff; transform: translate(-50%,-50%); box-shadow: 0 6px 30px rgba(0,0,0,.4); }
      @keyframes slide { 0% { left: 0%; opacity: 1; } 92% { opacity: 1; } 100% { left: 100%; opacity: 0; } }
      .verdict { align-self: center; background: #fde047; color: #111114; font-weight: 900; border-radius: 999px; opacity: 0; animation: pop .5s var(--spring) 3.4s forwards; position: relative; z-index: 3; text-align: center; }
    `,
    cssPortrait: `
      .stage { padding: 0 56px; gap: 50px; }
      .title { font-size: 92px; }
      .panes { height: 960px; }
      .pane { padding: 60px 56px; gap: 46px; }
      .lbl { font-size: 36px; }
      .pt { font-size: 50px; gap: 26px; }
      .pt b { width: 64px; height: 64px; font-size: 32px; }
      .verdict { font-size: 44px; padding: 22px 44px; }
    `,
    cssLandscape: `
      .stage { padding: 0 140px; gap: 40px; }
      .title { font-size: 72px; }
      .panes { height: 600px; }
      .pane { padding: 50px 80px; gap: 34px; }
      .lbl { font-size: 30px; }
      .pt { font-size: 46px; gap: 24px; }
      .pt b { width: 58px; height: 58px; font-size: 28px; }
      .verdict { font-size: 38px; padding: 18px 40px; }
    `,
    markup: `
      <div class="stage">
        <div class="title" data-slot="title"></div>
        <div class="panes">
          <div class="pane before">
            <div class="lbl" data-slot="left_label"></div>
            <div class="pt" data-slot-box><b>✕</b><span data-slot="left_1"></span></div>
            <div class="pt" data-slot-box><b>✕</b><span data-slot="left_2"></span></div>
            <div class="pt" data-slot-box><b>✕</b><span data-slot="left_3"></span></div>
          </div>
          <div class="pane after">
            <div class="lbl" data-slot="right_label"></div>
            <div class="pt" data-slot-box><b>✓</b><span data-slot="right_1"></span></div>
            <div class="pt" data-slot-box><b>✓</b><span data-slot="right_2"></span></div>
            <div class="pt" data-slot-box><b>✓</b><span data-slot="right_3"></span></div>
          </div>
          <div class="divider"></div>
        </div>
        <div class="verdict" data-slot="verdict"></div>
      </div>`,
    js: `
      document.querySelectorAll(".before .pt").forEach((p, i) => {
        p.style.animationDelay = (0.5 + i * 0.25).toFixed(2) + "s";
        p.querySelector("span").style.animationDelay = (1.3 + i * 0.2).toFixed(2) + "s";
      });
    `,
  },

  // 6 ── exploded layers (3D cutaway) ─────────────────────────────────────────
  {
    id: "frame-trend-exploded-layers",
    name: "Trend · Exploded Layer Cutaway",
    role: "explainer / anatomy",
    bestFor: "'what is inside X', how a system is built, the layers of a stack, anatomy of a product; replaces iceberg, DNA and brain cards",
    why: "Four isometric slabs sit stacked as one object, then pull apart into an exploded view with a label on each layer — the 2026 'cut it open so I can see inside' explainer, done in CSS 3D instead of WebGL so it renders offline.",
    bg: "#0b1020",
    vars: {
      title: "Bên trong một AI agent",
      layer_1: "Giao diện — nơi bạn ra lệnh",
      layer_2: "Công cụ — đọc file, chạy lệnh",
      layer_3: "Bộ nhớ — nhớ bối cảnh dự án",
      layer_4: "Mô hình — bộ não suy luận",
      caption: "Bỏ một lớp, agent thành chatbot",
    },
    slots: [
      ["title", "≤40", "headline"],
      ["layer_1 … layer_4", "≤34", "top to bottom; 'Name — what it does' reads best"],
      ["caption", "≤48", "closing line"],
    ],
    css: `
      #root { background: #161513; color: #efeae0; }
      #root::after { background-image: linear-gradient(rgba(239,234,224,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(239,234,224,.06) 2px, transparent 2px); background-size: 80px 80px; animation: gridMove 12s linear infinite; inset: -10%; }
      @keyframes gridMove { to { transform: translate(80px, 80px); } }
      .stage { align-items: center; }
      .title { font-weight: 900; text-align: center; letter-spacing: -.02em; line-height: 1.05; animation: rise .6s var(--out) both; }
      .scene { position: relative; perspective: 2400px; }
      .stack { position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; transform: translate(-50%,-50%) rotateX(58deg) rotateZ(-40deg); }
      .slabw { position: absolute; left: 0; top: 0; transform-style: preserve-3d; animation: explode 1.2s var(--spring) 1.2s both; }
      @keyframes explode { from { transform: translateZ(var(--z0)); } to { transform: translateZ(var(--z1)); } }
      .slab { width: var(--s); height: var(--s); margin: calc(var(--s) / -2) 0 0 calc(var(--s) / -2); border-radius: 36px; transform-style: preserve-3d; animation: float 4s ease-in-out infinite; }
      @keyframes float { 50% { transform: translateZ(14px); } }
      .slab::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: var(--c); box-shadow: 0 0 0 3px rgba(0,0,0,.25) inset, 0 40px 80px rgba(0,0,0,.45); }
      .slab::after { content: ""; position: absolute; inset: 14%; border-radius: 20px; border: 4px dashed rgba(0,0,0,.25); }
      .labels { position: absolute; inset: 0; }
      .lab { position: absolute; display: flex; align-items: center; font-weight: 800; opacity: 0; transform: translateY(-50%); animation: labIn .5s var(--out) forwards; }
      .lab i { flex: none; border-radius: 50%; background: var(--c); }
      @keyframes labIn { from { opacity: 0; transform: translate(-30px, -50%); } to { opacity: 1; transform: translateY(-50%); } }
      .caption { font-weight: 700; color: #ff8a5c; text-align: center; opacity: 0; animation: rise .6s var(--out) 3.4s forwards; }
    `,
    cssPortrait: `
      .stage { padding: 150px 60px 120px; gap: 20px; }
      .title { font-size: 92px; }
      .scene { width: 100%; flex: 1; }
      .stack { --s: 330px; left: 72%; }
      .lab { left: 0; font-size: 38px; gap: 18px; max-width: 440px; line-height: 1.2; }
      .lab i { width: 30px; height: 30px; }
      .caption { font-size: 44px; }
    `,
    cssLandscape: `
      .stage { padding: 80px 120px 70px; gap: 10px; }
      .title { font-size: 78px; }
      .scene { width: 100%; flex: 1; }
      .stack { --s: 330px; left: 30%; }
      .lab { left: 55%; font-size: 40px; gap: 18px; max-width: 760px; }
      .lab i { width: 28px; height: 28px; }
      .caption { font-size: 38px; }
    `,
    markup: `
      <div class="stage">
        <div class="title" data-slot="title"></div>
        <div class="scene">
          <div class="stack" id="stack"></div>
          <div class="labels" id="labels"></div>
        </div>
        <div class="caption" data-slot="caption"></div>
      </div>`,
    js: `
      (function () {
        const P = document.getElementById("root").classList.contains("P");
        // A tonal set — one accent, three neutrals — so the stack reads as one object.
        const colors = ["#ff5b1f", "#e9e2d4", "#b8ad9a", "#6e665a"];
        const keys = [1, 2, 3, 4].filter((i) => has("layer_" + i));
        const n = keys.length;
        const gap = P ? 190 : 120;
        const stack = document.getElementById("stack"), labels = document.getElementById("labels");
        keys.forEach((k, i) => {
          const z1 = ((n - 1) / 2 - i) * gap, z0 = ((n - 1) / 2 - i) * 34;
          const w = document.createElement("div");
          w.className = "slabw";
          w.style.setProperty("--z0", z0 + "px"); w.style.setProperty("--z1", z1 + "px");
          w.innerHTML = '<div class="slab" style="--c:' + colors[i] + ';animation-delay:' + (-i * 0.6) + 's"></div>';
          stack.appendChild(w);
          const lab = document.createElement("div");
          lab.className = "lab";
          lab.style.setProperty("--c", colors[i]);
          // Labels sit at the exploded height of their slab: after rotateX(58deg) a translateZ
          // of z lands about z·sin(58°) ≈ 0.85z higher on screen.
          lab.style.top = "calc(50% + " + Math.round(-z1 * 0.85) + "px)";
          lab.style.animationDelay = (2.0 + i * 0.22).toFixed(2) + "s";
          lab.innerHTML = "<i></i><span></span>";
          lab.querySelector("span").textContent = v["layer_" + k];
          labels.appendChild(lab);
        });
      })();
    `,
  },

  // 7 ── infinite zoom ────────────────────────────────────────────────────────
  {
    id: "frame-trend-infinite-zoom",
    name: "Trend · Infinite Zoom Tunnel",
    role: "hook / reveal",
    bestFor: "'go deeper' reveals, scale ('a video is 900 frames…'), the moment before the twist",
    why: "Nested frames fly toward the camera forever while three lines replace each other in the centre, ending on the reveal. The endless-zoom prompt is one of the most-shared code-video formats, and it is the only template here whose motion IS the metaphor for going deeper.",
    bg: "#000000",
    vars: {
      hook: "Phóng to thêm…",
      depth_1: "Một video ngắn",
      depth_2: "là 900 khung hình",
      depth_3: "mỗi khung là một trang web",
      reveal: "và AI viết từng trang một.",
    },
    slots: [
      ["hook", "≤24", "first line, small"],
      ["depth_1 … depth_3", "≤28", "each replaces the last, ~0.9s apart"],
      ["reveal", "≤36", "final line, stays"],
    ],
    css: `
      #root { background: #000000; color: #ffffff; }
      #root::after { background: radial-gradient(circle at 50% 50%, rgba(255,91,31,.14), transparent 45%); animation: breathe2 3s ease-in-out infinite; inset: 0; }
      @keyframes breathe2 { 50% { opacity: .2; } }
      .tunnel { position: absolute; inset: 0; z-index: 0; }
      .ring { position: absolute; left: 50%; top: 50%; border-radius: 40px; border: 4px solid; transform: translate(-50%,-50%) scale(.02); animation: zoom 4.8s cubic-bezier(.55,0,1,.45) infinite; opacity: 0; }
      @keyframes zoom { 0% { transform: translate(-50%,-50%) scale(.02) rotate(0deg); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate(-50%,-50%) scale(3.2) rotate(30deg); opacity: 1; } }
      .stage { justify-content: center; align-items: center; text-align: center; }
      .center { position: relative; display: grid; place-items: center; }
      .center > div { grid-area: 1 / 1; font-weight: 900; letter-spacing: -.02em; line-height: 1.05; opacity: 0; text-shadow: 0 0 40px #000, 0 0 80px #000; }
      .hook { font-family: 'Roboto Mono', monospace; font-weight: 700 !important; color: #ff5b1f; animation: through .9s var(--out) .2s both; }
      .d { animation: through 1s var(--out) both; }
      .reveal { color: #ff5b1f; animation: land .7s var(--spring) forwards; }
      @keyframes through { 0% { opacity: 0; transform: scale(.4); } 25% { opacity: 1; transform: scale(1); } 75% { opacity: 1; transform: scale(1.15); } 100% { opacity: 0; transform: scale(2.4); } }
      @keyframes land { from { opacity: 0; transform: scale(.3); } to { opacity: 1; transform: scale(1); } }
    `,
    cssPortrait: `
      .ring { width: 900px; height: 1500px; }
      .stage { padding: 0 60px; }
      .center > div { font-size: 112px; max-width: 960px; }
      .hook { font-size: 52px !important; }
    `,
    cssLandscape: `
      .ring { width: 1600px; height: 900px; }
      .stage { padding: 0 160px; }
      .center > div { font-size: 110px; max-width: 1500px; }
      .hook { font-size: 48px !important; }
    `,
    markup: `
      <div class="tunnel" id="tunnel"></div>
      <div class="stage">
        <div class="center">
          <div class="hook" data-slot="hook"></div>
          <div class="d" data-slot="depth_1"></div>
          <div class="d" data-slot="depth_2"></div>
          <div class="d" data-slot="depth_3"></div>
          <div class="reveal" data-slot="reveal"></div>
        </div>
      </div>`,
    js: `
      (function () {
        const t = document.getElementById("tunnel");
        const cols = ["#ece8df", "#ece8df", "#ff5b1f", "#ece8df", "#7d776d"];
        for (let i = 0; i < 12; i++) {
          const r = document.createElement("div");
          r.className = "ring";
          r.style.borderColor = cols[i % cols.length];
          r.style.animationDelay = (-i * 0.4).toFixed(2) + "s";
          t.appendChild(r);
        }
        let d = 1.0;
        document.querySelectorAll(".center .d").forEach((el) => { el.style.animationDelay = d.toFixed(2) + "s"; d += 0.9; });
        const rv = document.querySelector(".reveal");
        if (rv) rv.style.animationDelay = (d + 0.1).toFixed(2) + "s";
      })();
    `,
  },

  // 8 ── phone notification storm ─────────────────────────────────────────────
  {
    id: "frame-trend-phone-notifs",
    name: "Trend · Phone Notification Storm",
    role: "hook / social proof",
    bestFor: "'my phone after posting this', orders coming in, messages piling up, alerts; replaces the flat notification stack",
    why: "A real phone on a lock screen: notifications drop in with a spring and push each other down while the phone buzzes, then a headline lands. Phone-UI hooks are the most relatable opener for a Vietnamese audience, and the old stack was a strip of 14px rows.",
    bg: "#0e0f13",
    vars: {
      time: "09:41",
      date: "Thứ Hai, 10 tháng 11",
      app_1: "Zalo",
      msg_1: "Chị Lan: Video hôm qua lên xu hướng rồi kìa!",
      app_2: "TikTok",
      msg_2: "Video của bạn vừa vượt 100.000 lượt xem",
      app_3: "Shopee",
      msg_3: "Bạn có 37 đơn hàng mới cần xác nhận",
      app_4: "Ngân hàng",
      msg_4: "+12.500.000đ — Thanh toán đơn hàng",
      headline: "Một video làm bằng AI, và đây là sáng hôm sau",
    },
    slots: [
      ["time / date", "≤8 / ≤26", "lock-screen clock"],
      ["app_1 … app_4", "≤12", "app name on each notification"],
      ["msg_1 … msg_4", "≤52", "notification text"],
      ["headline", "≤56", "lands after the storm"],
    ],
    css: `
      #root { background: #0e0f13; color: #ffffff; }
      #root::after { background-image: radial-gradient(rgba(255,255,255,.04) 1.5px, transparent 2px); background-size: 10px 10px; }
      .stage { align-items: center; }
      .phone { position: relative; flex: none; border-radius: 90px; background: #000000; padding: 22px; box-shadow: 0 0 0 4px #3a3b42, 0 60px 120px rgba(0,0,0,.6); animation: rise .7s var(--out) both, buzz .35s 1.1s 4 both; }
      @keyframes buzz { 0%,100% { transform: none; } 25% { transform: translateX(-6px) rotate(-.6deg); } 75% { transform: translateX(6px) rotate(.6deg); } }
      .screen { position: relative; width: 100%; height: 100%; border-radius: 70px; overflow: hidden; background: linear-gradient(170deg, #b8472d, #e9a77c 60%, #f4dcc0); background-size: 100% 200%; animation: wall 8s ease-in-out infinite; }
      @keyframes wall { 50% { background-position: 0 100%; } }
      .island { position: absolute; top: 22px; left: 50%; width: 34%; height: 46px; transform: translateX(-50%); background: #000000; border-radius: 30px; }
      .clock { text-align: center; color: #ffffff; text-shadow: 0 2px 20px rgba(0,0,0,.25); }
      .clock .t { font-weight: 800; line-height: 1; letter-spacing: -.02em; }
      .clock .dt { font-weight: 600; opacity: .9; }
      .notifs { position: absolute; left: 0; right: 0; display: flex; flex-direction: column; }
      .n { display: flex; gap: 0; background: rgba(255,255,255,.82); color: #111111; backdrop-filter: blur(20px); border-radius: 34px; opacity: 0; animation: drop .6s var(--spring) forwards; }
      @keyframes drop { from { opacity: 0; transform: translateY(-120px) scale(.92); } to { opacity: 1; transform: none; } }
      .n .ic { flex: none; border-radius: 22%; display: grid; place-items: center; color: #ffffff; font-weight: 900; }
      .n .tx { min-width: 0; }
      .n .ap { font-weight: 800; }
      .n .ms { font-weight: 500; color: #333333; line-height: 1.25; }
      .headline { font-weight: 900; text-align: center; letter-spacing: -.02em; line-height: 1.08; opacity: 0; animation: rise .6s var(--out) forwards; }
    `,
    cssPortrait: `
      .stage { padding: 90px 60px 0; gap: 56px; }
      .phone { width: 760px; height: 1300px; }
      .clock { padding-top: 120px; } .clock .t { font-size: 170px; } .clock .dt { font-size: 36px; }
      .notifs { top: 470px; padding: 0 26px; gap: 18px; }
      .n { padding: 22px 24px; gap: 20px; }
      .n .ic { width: 76px; height: 76px; font-size: 34px; }
      .n .ap { font-size: 28px; } .n .ms { font-size: 31px; }
      .headline { font-size: 70px; }
    `,
    cssLandscape: `
      .stage { flex-direction: row; justify-content: center; padding: 50px 120px; gap: 90px; }
      .phone { width: 520px; height: 980px; padding: 16px; border-radius: 70px; }
      .screen { border-radius: 56px; }
      .clock { padding-top: 90px; } .clock .t { font-size: 120px; } .clock .dt { font-size: 26px; }
      .notifs { top: 330px; padding: 0 18px; gap: 14px; }
      .n { padding: 16px 18px; gap: 16px; border-radius: 26px; }
      .n .ic { width: 58px; height: 58px; font-size: 26px; }
      .n .ap { font-size: 21px; } .n .ms { font-size: 23px; }
      .headline { font-size: 84px; text-align: left; max-width: 900px; }
    `,
    markup: `
      <div class="stage">
        <div class="phone"><div class="screen">
          <div class="island"></div>
          <div class="clock"><div class="t" data-slot="time"></div><div class="dt" data-slot="date"></div></div>
          <div class="notifs" id="notifs"></div>
        </div></div>
        <div class="headline" data-slot="headline"></div>
      </div>`,
    js: `
      (function () {
        const box = document.getElementById("notifs");
        const cols = ["#0068ff", "#111111", "#ee4d2d", "#16a34a"];
        let k = 0;
        // Newest on top, the way a lock screen stacks them.
        for (let i = 4; i >= 1; i--) {
          if (!has("msg_" + i)) continue;
          const n = document.createElement("div");
          n.className = "n";
          n.style.animationDelay = (0.8 + (i - 1) * 0.42).toFixed(2) + "s";
          n.innerHTML = '<div class="ic"></div><div class="tx"><div class="ap"></div><div class="ms"></div></div>';
          const app = String(v["app_" + i] || "");
          n.querySelector(".ic").style.background = cols[(i - 1) % cols.length];
          n.querySelector(".ic").textContent = app.slice(0, 1).toUpperCase();
          n.querySelector(".ap").textContent = app;
          n.querySelector(".ms").textContent = v["msg_" + i];
          box.appendChild(n);
          k++;
        }
        const h = document.querySelector(".headline");
        if (h) h.style.animationDelay = (1.0 + k * 0.42 + 0.3).toFixed(2) + "s";
      })();
    `,
  },

  // 9 ── live poll ────────────────────────────────────────────────────────────
  {
    id: "frame-trend-live-poll",
    name: "Trend · Live Poll Battle",
    role: "engagement / question",
    bestFor: "'which side are you on', A vs B debates, ending on a comment prompt; replaces the static poll bar",
    why: "Two options fight: their bars race and overshoot before settling on the split, percentages land, and viewer comments float up the side. Built to end a video on a question that earns comments — the engagement beat Vietnamese short-form leans on hardest.",
    bg: "#140a1f",
    vars: {
      question: "Năm 2027, nên học gì trước?",
      option_a: "Học lập trình",
      option_b: "Học dùng AI",
      pct_a: "41",
      vs: "VS",
      cta: "Bạn chọn bên nào? Bình luận ngay 👇",
      comment_1: "Code là gốc, AI chỉ là công cụ",
      comment_2: "AI trước, code học dần sau",
      comment_3: "Học cả hai chứ sao 😅",
    },
    slots: [
      ["question", "≤44", "headline"],
      ["option_a / option_b", "≤20", "the two sides"],
      ["pct_a", "0–100", "share for A; B gets the rest"],
      ["vs", "≤4", "divider word between the options (empty hides it)"],
      ["cta", "≤44", "comment prompt"],
      ["comment_1 … comment_3", "≤36", "floating comment bubbles (optional)"],
    ],
    css: `
      #root { background: #171412; color: #f3eee6; }
      #root::after { background-image: radial-gradient(rgba(243,238,230,.05) 1.5px, transparent 2px); background-size: 10px 10px; }
      .stage { justify-content: center; }
      .q { font-weight: 900; letter-spacing: -.02em; line-height: 1.05; animation: rise .6s var(--out) both; }
      .opt { position: relative; border-radius: 32px; overflow: hidden; background: rgba(255,255,255,.06); box-shadow: 0 0 0 3px rgba(255,255,255,.1) inset; opacity: 0; animation: rise .5s var(--out) forwards; }
      .opt .fill { position: absolute; inset: 0; transform-origin: left; animation: fight 1.8s cubic-bezier(.3,1.4,.5,1) forwards; }
      .a .fill { background: #e5482b; --p: var(--pa); }
      .b .fill { background: #5c564d; --p: var(--pb); }
      @keyframes fight { 0% { transform: scaleX(0); } 40% { transform: scaleX(calc(1 - var(--p))); } 100% { transform: scaleX(var(--p)); } }
      .opt .row { position: relative; display: flex; justify-content: space-between; align-items: center; height: 100%; font-weight: 900; }
      .opt .pc { font-family: 'Roboto Mono', monospace; opacity: 0; animation: fade .3s 2.4s forwards; }
      .vs { align-self: center; font-weight: 900; font-style: italic; color: #e5482b; }
      .cta { font-weight: 800; text-align: center; color: #f3eee6; opacity: 0; animation: pop .5s var(--spring) 2.8s forwards; }
      .bubbles { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
      .bub { position: absolute; background: #f3eee6; color: #171412; font-weight: 700; border-radius: 26px; white-space: nowrap; opacity: 0; animation: floatUp 7s linear infinite; }
      @keyframes floatUp { 0% { opacity: 0; transform: translateY(0); } 10% { opacity: .95; } 80% { opacity: .95; } 100% { opacity: 0; transform: translateY(-900px); } }
    `,
    cssPortrait: `
      .stage { padding: 0 60px; gap: 34px; }
      .q { font-size: 96px; margin-bottom: 30px; }
      .opt { height: 170px; } .opt .row { padding: 0 44px; font-size: 54px; }
      .vs { font-size: 60px; }
      .cta { font-size: 48px; margin-top: 30px; }
      .bub { font-size: 30px; padding: 16px 26px; }
    `,
    cssLandscape: `
      .stage { padding: 0 260px; gap: 22px; }
      .q { font-size: 84px; margin-bottom: 16px; }
      .opt { height: 140px; } .opt .row { padding: 0 44px; font-size: 52px; }
      .vs { font-size: 48px; }
      .cta { font-size: 42px; margin-top: 16px; }
      .bub { font-size: 26px; padding: 12px 22px; }
    `,
    markup: `
      <div class="bubbles" id="bubbles"></div>
      <div class="stage">
        <div class="q" data-slot="question"></div>
        <div class="opt a" style="animation-delay:.4s"><div class="fill"></div><div class="row"><span data-slot="option_a"></span><span class="pc" id="pa"></span></div></div>
        <div class="vs mono" data-slot="vs"></div>
        <div class="opt b" style="animation-delay:.55s"><div class="fill"></div><div class="row"><span data-slot="option_b"></span><span class="pc" id="pb"></span></div></div>
        <div class="cta" data-slot="cta"></div>
      </div>`,
    js: `
      (function () {
        const a = Math.max(0, Math.min(100, Number(String(v.pct_a ?? "50").replace(",", ".")) || 0));
        const root = document.getElementById("root");
        root.style.setProperty("--pa", (a / 100).toFixed(3));
        root.style.setProperty("--pb", ((100 - a) / 100).toFixed(3));
        document.getElementById("pa").textContent = Math.round(a) + "%";
        document.getElementById("pb").textContent = Math.round(100 - a) + "%";
        document.querySelectorAll(".opt .fill").forEach((f, i) => { f.style.animationDelay = (0.7 + i * 0.1) + "s"; });
        const box = document.getElementById("bubbles");
        const P = root.classList.contains("P");
        [1, 2, 3].forEach((i, j) => {
          if (!has("comment_" + i)) return;
          const b = document.createElement("div");
          b.className = "bub";
          b.textContent = v["comment_" + i];
          b.style.left = (P ? [6, 40, 14][j] : [3, 70, 40][j]) + "%";
          b.style.top = (P ? 104 : 108) + "%";
          b.style.animationDelay = (1.4 + j * 2.1).toFixed(2) + "s";
          box.appendChild(b);
        });
      })();
    `,
  },

  // 10 ── price drop ─────────────────────────────────────────────────────────
  {
    id: "frame-trend-price-drop",
    name: "Trend · Price Drop Slam",
    role: "offer / CTA",
    bestFor: "deals, launches with a price, affiliate and e-commerce CTAs; replaces coupon, receipt and pricing-tier cards",
    why: "The old price sits big, a red slash cuts through it, the new price slams in with a camera shake and a discount stamp rotates on. Shopee/TikTok Shop live-sale grammar, made for the last scene of a selling video.",
    bg: "#fff7ed",
    vars: {
      kicker: "FLASH SALE · CHỈ HÔM NAY",
      product: "Khoá học làm video ngắn bằng AI",
      old_price: "1.990.000đ",
      new_price: "499.000đ",
      badge: "-75%",
      note: "Còn 48 giờ · tặng bộ 50 template",
      cta: "Link ở bio 👆",
    },
    slots: [
      ["kicker", "≤30", "top strip"],
      ["product", "≤44", "what is on sale"],
      ["old_price / new_price", "≤12", "struck and slammed prices"],
      ["badge", "≤6", "rotating stamp"],
      ["note", "≤44", "terms / urgency"],
      ["cta", "≤24", "button"],
    ],
    css: `
      #root { background: #fff7ed; color: #1c1917; }
      #root::after { background: repeating-linear-gradient(45deg, rgba(234,88,12,.07) 0 30px, transparent 30px 60px); animation: stripes 3s linear infinite; inset: -10%; }
      @keyframes stripes { to { transform: translateX(84.85px); } }
      .stage { justify-content: center; animation: shake .4s 1.75s both; }
      @keyframes shake { 20% { transform: translate(-10px, 6px); } 40% { transform: translate(8px, -8px); } 60% { transform: translate(-6px, 4px); } 80% { transform: translate(4px, -2px); } }
      .kicker { align-self: flex-start; background: #ea580c; color: #ffffff; font-weight: 900; letter-spacing: .06em; animation: wipeIn .5s var(--snap) both; }
      .product { font-weight: 900; letter-spacing: -.02em; line-height: 1.05; animation: rise .6s var(--out) .2s both; }
      .old { position: relative; align-self: flex-start; font-weight: 800; color: #78716c; animation: fade .4s .5s both; }
      .old::after { content: ""; position: absolute; left: -4%; right: -4%; top: 52%; height: .12em; background: #dc2626; transform: rotate(-8deg) scaleX(0); transform-origin: left; animation: slash .35s var(--snap) 1.1s forwards; border-radius: 6px; }
      @keyframes slash { to { transform: rotate(-8deg) scaleX(1); } }
      .newp { font-weight: 900; color: #dc2626; letter-spacing: -.03em; line-height: 1; animation: slam .45s cubic-bezier(.2,1.6,.4,1) 1.5s both; }
      @keyframes slam { from { opacity: 0; transform: scale(2.6); } to { opacity: 1; transform: scale(1); } }
      .prow { display: flex; align-items: center; justify-content: space-between; gap: 30px; }
      .badge { position: relative; flex: none; display: grid; place-items: center; border-radius: 50%; background: #facc15; color: #1c1917; font-weight: 900; box-shadow: 0 0 0 10px #fff7ed, 0 0 0 14px #1c1917; animation: stamp .5s cubic-bezier(.2,1.6,.4,1) 2.0s both; }
      .badge::before { content: ""; position: absolute; inset: -40px; border-radius: 50%; border: 6px dashed #ea580c; animation: spin 10s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes stamp { from { opacity: 0; transform: scale(3) rotate(-40deg); } to { opacity: 1; transform: scale(1) rotate(-12deg); } }
      .note { font-weight: 700; color: #57534e; opacity: 0; animation: rise .5s var(--out) 2.3s forwards; }
      .cta { align-self: flex-start; background: #1c1917; color: #ffffff; font-weight: 900; border-radius: 999px; opacity: 0; animation: pop .5s var(--spring) 2.6s forwards; }
    `,
    cssPortrait: `
      .stage { padding: 0 70px; gap: 40px; }
      .kicker { font-size: 36px; padding: 14px 26px; }
      .product { font-size: 88px; }
      .old { font-size: 84px; }
      .prow { margin-top: 40px; }
      .newp { font-size: 196px; }
      .badge { width: 220px; height: 220px; font-size: 70px; margin-right: 30px; }
      .note { font-size: 42px; }
      .cta { font-size: 46px; padding: 26px 54px; margin-top: 20px; }
    `,
    cssLandscape: `
      .stage { padding: 0 180px; gap: 26px; }
      .kicker { font-size: 30px; padding: 10px 22px; }
      .product { font-size: 76px; max-width: 1100px; }
      .old { font-size: 64px; }
      .newp { font-size: 170px; }
      .badge { width: 220px; height: 220px; font-size: 70px; margin-right: 200px; }
      .note { font-size: 36px; }
      .cta { font-size: 40px; padding: 22px 48px; }
    `,
    markup: `
      <div class="stage">
        <div class="kicker" data-slot="kicker"></div>
        <div class="product" data-slot="product"></div>
        <div class="prow"><div class="old" data-slot="old_price"></div><div class="badge" data-slot="badge"></div></div>
        <div class="newp" data-slot="new_price"></div>
        <div class="note" data-slot="note"></div>
        <div class="cta" data-slot="cta"></div>
      </div>`,
  },

  // 11 ── code diff ───────────────────────────────────────────────────────────
  {
    id: "frame-trend-code-diff",
    name: "Trend · Live Code Diff",
    role: "dev explainer",
    bestFor: "'one line changed everything', refactors, AI coding demos, API changes; replaces diff, API and git-graph cards",
    why: "An editor where the old line turns red, strikes through and collapses, the new line types itself in green, and a passing-tests toast slides in. Code is the third most-asked subject in Opus video prompts, and the old diff card was two 15px lines.",
    bg: "#0d1117",
    vars: {
      file_name: "agent.ts",
      ctx_1: "export async function run(task) {",
      line_del: "  return await callModel(task);",
      line_add: "  return await agent.plan(task).execute();",
      ctx_2: "}",
      status: "✓ 42 bài test đều chạy qua",
      caption: "Một dòng code, đổi cả kiến trúc",
    },
    slots: [
      ["file_name", "≤24", "editor tab"],
      ["ctx_1 / ctx_2", "≤44", "unchanged lines around the change"],
      ["line_del", "≤44", "removed line (keep leading spaces)"],
      ["line_add", "≤44", "added line, typed in"],
      ["status", "≤36", "toast"],
      ["caption", "≤44", "headline above the editor"],
    ],
    css: `
      #root { background: #0d1117; color: #e6edf3; }
      #root::after { background-image: linear-gradient(rgba(230,237,243,.04) 2px, transparent 2px); background-size: 100% 84px; animation: gridMove2 12s linear infinite; inset: -84px 0 0 0; }
      @keyframes gridMove2 { to { transform: translateY(84px); } }
      .stage { justify-content: center; }
      .caption { font-weight: 900; letter-spacing: -.02em; line-height: 1.05; animation: rise .6s var(--out) both; }
      .ed { background: #161b22; border-radius: 28px; box-shadow: 0 0 0 2px #30363d, 0 50px 100px rgba(0,0,0,.5); overflow: hidden; animation: rise .7s var(--out) .2s both; font-family: 'Roboto Mono', monospace; }
      .tabs { display: flex; align-items: center; background: #0d1117; border-bottom: 2px solid #30363d; }
      .dots { display: flex; } .dots i { border-radius: 50%; display: block; }
      .dots i:nth-child(1) { background: #ff5f57; } .dots i:nth-child(2) { background: #febc2e; } .dots i:nth-child(3) { background: #28c840; }
      .tab { color: #e6edf3; font-weight: 700; border-bottom: 4px solid #f78166; }
      .code { position: relative; }
      .ln { display: flex; white-space: pre; align-items: center; }
      .ln .no { flex: none; color: #6e7681; text-align: right; }
      .del { background: rgba(248,81,73,.0); animation: delOn .3s 1.0s forwards, collapse .45s var(--snap) 1.9s forwards; overflow: hidden; }
      @keyframes delOn { to { background: rgba(248,81,73,.22); } }
      .del .tx { text-decoration: line-through; text-decoration-color: transparent; animation: strike2 .3s 1.4s forwards; }
      @keyframes strike2 { to { text-decoration-color: #f85149; color: #ffa198; } }
      @keyframes collapse { to { height: 0; opacity: 0; } }
      .add { background: rgba(46,160,67,.22); height: 0; overflow: hidden; animation: open .35s var(--snap) 2.1s forwards; }
      @keyframes open { to { height: var(--lh); } }
      .add .tx { color: #7ee787; }
      .add .tx .ch { opacity: 0; animation: fade .01s linear forwards; }
      .sign { flex: none; text-align: center; font-weight: 800; }
      .del .sign { color: #f85149; } .add .sign { color: #3fb950; }
      .cur { display: inline-block; width: .55em; height: 1.1em; background: #58a6ff; vertical-align: middle; animation: blink .9s steps(1) infinite; }
      @keyframes blink { 50% { opacity: 0; } }
      .toast { align-self: flex-end; display: inline-flex; background: #238636; color: #ffffff; font-weight: 800; border-radius: 18px; box-shadow: 0 20px 50px rgba(35,134,54,.4); opacity: 0; animation: toast .5s var(--spring) forwards; }
      @keyframes toast { from { opacity: 0; transform: translateY(40px) scale(.9); } to { opacity: 1; transform: none; } }
    `,
    cssPortrait: `
      .stage { padding: 0 44px; gap: 50px; }
      .caption { font-size: 90px; }
      .tabs { height: 92px; padding: 0 30px; gap: 30px; } .dots { gap: 14px; } .dots i { width: 22px; height: 22px; }
      .tab { font-size: 30px; padding: 26px 10px; }
      .code { padding: 34px 0; font-size: 33px; --lh: 84px; }
      .ln { height: 84px; } .ln .no { width: 70px; padding-right: 22px; } .sign { width: 40px; }
      .toast { font-size: 38px; padding: 24px 34px; }
    `,
    cssLandscape: `
      .stage { padding: 0 200px; gap: 36px; }
      .caption { font-size: 72px; }
      .tabs { height: 76px; padding: 0 26px; gap: 26px; } .dots { gap: 12px; } .dots i { width: 18px; height: 18px; }
      .tab { font-size: 26px; padding: 20px 10px; }
      .code { padding: 24px 0; font-size: 36px; --lh: 72px; }
      .ln { height: 72px; } .ln .no { width: 80px; padding-right: 24px; } .sign { width: 44px; }
      .toast { font-size: 34px; padding: 20px 30px; }
    `,
    markup: `
      <div class="stage">
        <div class="caption" data-slot="caption"></div>
        <div class="ed">
          <div class="tabs"><span class="dots"><i></i><i></i><i></i></span><span class="tab" data-slot="file_name"></span></div>
          <div class="code">
            <div class="ln"><span class="no">41</span><span class="sign"></span><span class="tx" data-slot="ctx_1"></span></div>
            <div class="ln del"><span class="no">42</span><span class="sign">−</span><span class="tx" data-slot="line_del"></span></div>
            <div class="ln add"><span class="no">42</span><span class="sign">+</span><span class="tx" id="add"></span><span class="cur"></span></div>
            <div class="ln"><span class="no">43</span><span class="sign"></span><span class="tx" data-slot="ctx_2"></span></div>
          </div>
        </div>
        <div class="toast" data-slot="status"></div>
      </div>`,
    js: `
      (function () {
        const end = typeInto(document.getElementById("add"), v.line_add || "", 2.45, 0.035);
        const t = document.querySelector(".toast");
        if (t) t.style.animationDelay = (end + 0.3).toFixed(2) + "s";
      })();
    `,
  },

  // 12 ── reply to comment ────────────────────────────────────────────────────
  {
    id: "frame-trend-comment-reply",
    name: "Trend · Reply To Comment",
    role: "hook / Q&A",
    bestFor: "answering a viewer question, FAQ videos, series built from comments; the most common Vietnamese TikTok opener",
    why: "The 'Trả lời bình luận của @…' sticker pops on screen, then the answer title and three numbered points build under it. It is the native TikTok reply format, and no template could open on a viewer's own words.",
    bg: "#0b0b0d",
    vars: {
      reply_label: "Trả lời bình luận của",
      username: "@minh.dev",
      comment: "Làm sao để video AI không bị nhìn là biết AI làm?",
      answer_title: "3 mẹo thật sự hiệu quả",
      point_1: "Giọng đọc có ngắt nghỉ, không đều đều",
      point_2: "Cắt khoảng lặng, mỗi cảnh dưới 4 giây",
      point_3: "Một cú twist trước 10 giây đầu",
    },
    slots: [
      ["reply_label", "≤26", "sticker label"],
      ["username", "≤20", "commenter handle; the avatar uses its first letter"],
      ["comment", "≤70", "their question, verbatim"],
      ["answer_title", "≤32", "headline of the answer"],
      ["point_1 … point_3", "≤44", "numbered points (optional)"],
    ],
    css: `
      #root { background: #0b0b0d; color: #ffffff; }
      #root::after { background-image: radial-gradient(rgba(255,255,255,.05) 1.5px, transparent 2px); background-size: 10px 10px; }
      .stage { justify-content: center; }
      .sticker { position: relative; align-self: flex-start; background: #ffffff; color: #111111; border-radius: 28px; box-shadow: 0 30px 70px rgba(0,0,0,.5); transform-origin: 0 100%; animation: stick .6s cubic-bezier(.2,1.5,.4,1) .2s both; }
      @keyframes stick { from { opacity: 0; transform: scale(.3) rotate(-8deg); } to { opacity: 1; transform: rotate(-2deg); } }
      .sticker::after { content: ""; position: absolute; left: 60px; bottom: -22px; border: 24px solid transparent; border-top-color: #ffffff; border-bottom: 0; }
      .who { display: flex; align-items: center; font-weight: 600; color: #6b6b6b; }
      .av { flex: none; border-radius: 50%; display: grid; place-items: center; background: #fe2c55; color: #ffffff; font-weight: 900; }
      .who b { color: #111111; font-weight: 800; }
      .cm { font-weight: 800; line-height: 1.22; }
      .at { font-weight: 900; letter-spacing: -.02em; line-height: 1.05; opacity: 0; animation: rise .6s var(--out) 1.1s forwards; }
      .at::after { content: ""; display: block; height: .12em; width: 3.2em; margin-top: .25em; background: #fe2c55; border-radius: 6px; }
      .pts { display: flex; flex-direction: column; }
      .p { display: flex; align-items: center; font-weight: 700; line-height: 1.2; opacity: 0; animation: rise .5s var(--out) forwards; }
      .p b { flex: none; display: grid; place-items: center; border-radius: 22px; font-family: 'Roboto Mono', monospace; font-weight: 800; background: #fe2c55; color: #ffffff; }
      .p:nth-child(2) b { background: #25f4ee; color: #0b0b0d; } .p:nth-child(3) b { background: #ffffff; color: #0b0b0d; }
    `,
    cssPortrait: `
      .stage { padding: 0 60px; gap: 60px; }
      .sticker { padding: 34px 40px; max-width: 960px; }
      .who { gap: 18px; font-size: 30px; margin-bottom: 18px; } .av { width: 64px; height: 64px; font-size: 30px; }
      .cm { font-size: 50px; }
      .at { font-size: 100px; margin-top: 30px; }
      .pts { gap: 30px; } .p { font-size: 46px; gap: 26px; } .p b { width: 78px; height: 78px; font-size: 38px; }
    `,
    cssLandscape: `
      .stage { padding: 0 160px; gap: 40px; }
      .sticker { padding: 28px 36px; max-width: 1200px; }
      .who { gap: 16px; font-size: 26px; margin-bottom: 14px; } .av { width: 56px; height: 56px; font-size: 26px; }
      .cm { font-size: 44px; }
      .at { font-size: 80px; margin-top: 10px; }
      .pts { gap: 20px; } .p { font-size: 40px; gap: 22px; } .p b { width: 64px; height: 64px; font-size: 32px; }
    `,
    markup: `
      <div class="stage">
        <div class="sticker">
          <div class="who"><span class="av" id="av"></span><span><span data-slot="reply_label"></span> <b data-slot="username"></b></span></div>
          <div class="cm" data-slot="comment"></div>
        </div>
        <div class="at" data-slot="answer_title"></div>
        <div class="pts">
          <div class="p" data-slot-box><b>1</b><span data-slot="point_1"></span></div>
          <div class="p" data-slot-box><b>2</b><span data-slot="point_2"></span></div>
          <div class="p" data-slot-box><b>3</b><span data-slot="point_3"></span></div>
        </div>
      </div>`,
    js: `
      (function () {
        const u = String(v.username || "").replace(/^@/, "");
        const av = document.getElementById("av");
        if (u) av.textContent = u.slice(0, 1).toUpperCase(); else av.remove();
        document.querySelectorAll(".p").forEach((p, i) => { p.style.animationDelay = (1.6 + i * 0.3).toFixed(2) + "s"; });
      })();
    `,
  },

  // 13 ── timeline flight ─────────────────────────────────────────────────────
  {
    id: "frame-trend-timeline-flight",
    name: "Trend · Timeline Camera Flight",
    role: "timeline / history",
    bestFor: "'the next 30 years', a company's history, how a trend evolved, roadmap stops; replaces the war-era timeline",
    why: "One continuous camera move along a glowing track: each milestone stops in the centre, its year snaps to full size, then the camera travels on. The single-shot 'fly through the years' is a staple of 2026 code-video, and the old timeline was a static list.",
    bg: "#030712",
    vars: {
      title: "AI làm video: 4 năm thay đổi tất cả",
      year_1: "2023",
      label_1: "Video AI còn méo mó, 4 giây",
      year_2: "2024",
      label_2: "Clip 60 giây nhìn như thật",
      year_3: "2025",
      label_3: "Agent tự viết code dựng video",
      year_4: "2026",
      label_4: "Một câu lệnh ra video hoàn chỉnh",
    },
    slots: [
      ["title", "≤44", "stays on top"],
      ["year_1 … year_4", "≤6", "milestone labels (years, versions, steps)"],
      ["label_1 … label_4", "≤40", "what happened at each stop"],
    ],
    css: `
      #root { background: #11100f; color: #efeae0; }
      #root::after { background-image: radial-gradient(2px 2px at 20% 30%, #ffffff, transparent), radial-gradient(2px 2px at 70% 60%, #ffffff, transparent), radial-gradient(1.5px 1.5px at 40% 80%, #ffffff, transparent), radial-gradient(1.5px 1.5px at 85% 20%, #ffffff, transparent); background-size: 300px 300px; opacity: .45; animation: stars 30s linear infinite; inset: -50%; }
      @keyframes stars { to { transform: translate(-300px, -300px); } }
      .title { position: absolute; z-index: 3; left: 0; right: 0; text-align: center; font-weight: 900; letter-spacing: -.02em; line-height: 1.05; animation: rise .6s var(--out) both; }
      .view { position: absolute; inset: 0; z-index: 1; -webkit-mask-image: linear-gradient(var(--fade), transparent 0, transparent var(--f0), #000 var(--f1)); mask-image: linear-gradient(var(--fade), transparent 0, transparent var(--f0), #000 var(--f1)); }
      .track { position: absolute; animation: fly 6s cubic-bezier(.65,0,.35,1) forwards; }
      .rail { position: absolute; background: #4a463f; border-radius: 6px; }
      .stop { position: absolute; display: flex; align-items: center; }
      .dot { flex: none; border-radius: 50%; background: #11100f; border: 6px solid #ff5b1f; animation: ping 1.6s ease-out infinite; }
      @keyframes ping { 0% { box-shadow: 0 0 0 0 rgba(255,91,31,.55); } 100% { box-shadow: 0 0 0 40px rgba(255,91,31,0); } }
      .yr { font-weight: 900; line-height: 1; letter-spacing: -.03em; color: #efeae0; }
      .lb { font-weight: 700; color: #a8a196; line-height: 1.2; }
    `,
    cssPortrait: `
      .title { top: 130px; padding: 0 60px; font-size: 76px; }
      .view { --fade: 180deg; --f0: 330px; --f1: 520px; }
      .track { left: 0; top: 0; width: 100%; --step: 620px; }
      @keyframes fly { 0%, 8% { transform: translateY(1060px); } 26%, 33% { transform: translateY(1060px); } 50%, 58% { transform: translateY(calc(1060px - var(--step))); } 74%, 80% { transform: translateY(calc(1060px - 2 * var(--step))); } 96%, 100% { transform: translateY(calc(1060px - 3 * var(--step))); } }
      .rail { --dir: 180deg; left: 150px; top: -400px; width: 10px; height: 2700px; }
      .stop { left: 120px; gap: 50px; }
      .dot { width: 70px; height: 70px; }
      .yr { font-size: 150px; }
      .lb { font-size: 46px; max-width: 760px; margin-top: 10px; }
      .stop > div { display: flex; flex-direction: column; }
    `,
    cssLandscape: `
      .title { top: 80px; padding: 0 140px; font-size: 68px; }
      .view { --fade: 90deg; --f0: 0px; --f1: 160px; }
      .track { left: 0; top: 0; height: 100%; --step: 760px; }
      @keyframes fly { 0%, 8% { transform: translateX(760px); } 26%, 33% { transform: translateX(760px); } 50%, 58% { transform: translateX(calc(760px - var(--step))); } 74%, 80% { transform: translateX(calc(760px - 2 * var(--step))); } 96%, 100% { transform: translateX(calc(760px - 3 * var(--step))); } }
      .rail { --dir: 90deg; top: 560px; left: -800px; height: 10px; width: 4400px; }
      .stop { top: 525px; flex-direction: column; align-items: flex-start; gap: 30px; }
      .dot { width: 80px; height: 80px; }
      .yr { font-size: 130px; }
      .lb { font-size: 38px; width: 600px; }
      .stop > div { display: flex; flex-direction: column; }
    `,
    markup: `
      <div class="title" data-slot="title"></div>
      <div class="view"><div class="track" id="track"><div class="rail"></div></div></div>`,
    js: `
      (function () {
        const P = document.getElementById("root").classList.contains("P");
        const track = document.getElementById("track");
        const step = P ? 620 : 760;
        let k = 0;
        for (let i = 1; i <= 4; i++) {
          if (!has("year_" + i) && !has("label_" + i)) continue;
          const s = document.createElement("div");
          s.className = "stop";
          if (P) s.style.top = (k * step) + "px"; else s.style.left = (k * step + 40) + "px";
          s.innerHTML = '<span class="dot"></span><div><span class="yr"></span><span class="lb"></span></div>';
          s.querySelector(".yr").textContent = v["year_" + i] || "";
          s.querySelector(".lb").textContent = v["label_" + i] || "";
          track.appendChild(s);
          k++;
        }
      })();
    `,
  },
];

// ── emit ─────────────────────────────────────────────────────────────────────

export function catalogEntry(t) {
  const rows = t.slots.map(([k, lim, note]) => `| \`${k}\` | ${/^≤|^\d/.test(lim) ? "string" : lim} | ${/^≤|^\d/.test(lim) ? lim : "—"} | ${note} |`).join("\n");
  return `## ${t.id}

**Role:** ${t.role}. ${t.why.split(". ")[0].replace(/\.$/, "")}.
**Best for:** ${t.bestFor}.

| slot | type | limit | notes |
| --- | --- | --- | --- |
${rows}
`;
}

export function buildAll({ only = null } = {}) {
  for (const t of TREND_TEMPLATES) {
    if (only && t.id !== only) continue;
    const dir = path.join(VT, t.id);
    fs.mkdirSync(path.join(dir, "compositions"), { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), renderHtml({ t, w: 1920, h: 1080, compId: "main", portrait: false }), "utf8");
    fs.writeFileSync(path.join(dir, "compositions", "portrait.html"), renderHtml({ t, w: 1080, h: 1920, compId: "portrait", portrait: true }), "utf8");
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ id: t.id, name: t.name }, null, 2) + "\n", "utf8");
    fs.writeFileSync(path.join(dir, "hyperframes.json"), HYPERFRAMES_JSON, "utf8");
    fs.writeFileSync(
      path.join(dir, "NOTICE.md"),
      `# Attribution — ${t.id}

**Original template** authored for content-agent-kit (MIT, same as this repo).
Style direction from the 2026 code-video trend survey (\`yihui-dev/awesome-opus5-5-videos\`) and the
caption/punch-in grammar of \`kurbaitaev/ghost-editor\` (MIT); no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

${t.why}

## Slots

${Object.keys(t.vars).map((k) => `- \`${k}\``).join("\n")}

Both compositions are emitted together by \`scripts/video/lib/build-trend-templates.mjs\`.
Edit that file, not the HTML.
`,
      "utf8",
    );
    console.log(`[trend] ✓ wrote ${t.id}`);
  }
}

export function catalogSection() {
  return TREND_TEMPLATES.map(catalogEntry).join("\n");
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf("--only");
  if (process.argv.includes("--catalog")) console.log(catalogSection());
  else buildAll({ only: i > -1 ? process.argv[i + 1] : null });
}
