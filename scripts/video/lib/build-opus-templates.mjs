// build-opus-templates.mjs — emit the 6 Claude Opus 5.5 style-recipe scene templates.
//
//   node scripts/video/lib/build-opus-templates.mjs
//
// Distills the visual style recipes from yihui-dev/awesome-opus5-5-videos,
// HiAPIAI/awesome-opus-5-5-video-styles, and tuzhechen2005/opus-video-skills into
// deterministic, zero-dependency HTML/CSS/SVG HyperFrames templates in both 16:9 and 9:16:
//   1. frame-opus-cursor-flow     (productui — 3D SaaS card + spring cursor click + clip-path drawer)
//   2. frame-opus-handdrawn       (handdrawn — parchment + SVG stroke-dashoffset sketch + 12fps boil)
//   3. frame-opus-collage-stopmo  (collage — halftone paper + polygon cutout + steps() stop-motion)
//   4. frame-opus-shader-orb      (generative — coprime conic shader rings + mask-image light sweep)
//   5. frame-opus-pixel-arcade    (pixel — 8-bit grid + stepped HUD bars + clip-path reveal)
//   6. frame-opus-kinetic-reel    (kinetic — split-mask shutter typography + live gradient fill)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const VT = path.join(KIT, "video-templates");

const HYPERFRAMES_JSON = JSON.stringify(
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
  '  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400&family=Roboto+Mono:wght@400;500;700&family=Lora:ital,wght@0,600;0,700;1,500&display=swap" rel="stylesheet">';

const SPRING_VARS = `
  :root {
    --spring-soft: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
    --spring-snappy: linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%, 0.937 38.1%, 0.968 41.8%, 0.991 45.7%, 1.006 50.1%, 1.015 55%, 1.017 63.9%, 1.001);
  }
`;

function renderHtml({ id, name, w, h, compId, vars, cssShared, cssAspect, bodyMarkup, extraJs = "" }) {
  const varsAttr = JSON.stringify(vars).replace(/'/g, "&#39;");
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${w}, height=${h}">
  <title>${name}</title>
  ${FONTS_LINK}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${w}px; height: ${h}px; overflow: hidden; font-family: 'Be Vietnam Pro', sans-serif; }
    ${SPRING_VARS}
    ${cssShared}
    ${cssAspect}
  </style>
</head>
<body>
  <div id="root" data-composition-id="${compId}" data-width="${w}" data-height="${h}" data-start="0" data-duration="5" data-composition-variables='${varsAttr}'>
    ${bodyMarkup}
  </div>
  <script>
    // The caller's values come from window.__hyperframes.getVariables(). This used to read
    // a "composition variables" global hyperframes never defines — so every Opus
    // template rendered its demo copy no matter what script.json passed. The attribute is
    // only the fallback that keeps the file previewable on its own.
    function getVariables() {
      let defaults = {};
      try {
        defaults = JSON.parse(document.getElementById("root").getAttribute("data-composition-variables") || "{}");
      } catch (e) {}
      const hf = window.__hyperframes;
      const passed = hf && typeof hf.getVariables === "function" ? hf.getVariables() || {} : {};
      return Object.assign({}, defaults, passed);
    }
    function applySlots() {
      const v = getVariables();
      document.querySelectorAll("[data-slot]").forEach((el) => {
        const key = el.getAttribute("data-slot");
        const val = v[key];
        if (val === undefined || val === null || String(val).trim() === "") {
          el.remove();
        } else {
          el.textContent = String(val);
        }
      });
      ${extraJs}
    }
    applySlots();
    const timeline = {
      duration: 5,
      seek(t) {
        document.getAnimations().forEach((a) => {
          a.pause();
          a.currentTime = t * 1000;
        });
      }
    };
    window.__timelines = window.__timelines || {};
    window.__timelines["main"] = window.__timelines["portrait"] = timeline;
  </script>
</body>
</html>
`;
}

export const OPUS_TEMPLATES = [
  // 1. frame-opus-cursor-flow
  {
    id: "frame-opus-cursor-flow",
    name: "Opus 5.5 Cursor UI Flow",
    why: "No template in the library choreographs a SaaS product UI interaction — a 3D perspective window where an animated cursor glides in, clicks an action CTA with a ripple ring, and reveals the live result drawer.",
    vars: {
      kicker: "PRODUCT UI FLOW",
      window_title: "agent-deploy.config — v2.4",
      headline: "Triển khai chỉ với 1 cú nhấp",
      subtext: "Từ mã nguồn sang môi trường thực tế trong 180ms mà không cần cấu hình thủ công.",
      action_label: "Chạy tác vụ tự động",
      status_badge: "ĐÃ KÍCH HOẠT",
      result_metric: "180ms",
      result_caption: "Độ trễ phản hồi trung bình trên toàn cụm máy chủ",
      footer: "",
    },
    cssShared: `
      #root {
        position: relative; width: 100%; height: 100%;
        background: radial-gradient(circle at 22% 18%, #162447 0%, #0a0f1d 55%, #060913 100%);
        color: #f8fafc; perspective: 1400px; overflow: hidden;
      }
      #root::after {
        content: ""; position: absolute; inset: -12%; pointer-events: none;
        background: radial-gradient(circle at 75% 28%, rgba(56, 189, 248, 0.14), transparent 48%),
                    radial-gradient(circle at 25% 78%, rgba(129, 140, 248, 0.12), transparent 52%);
        animation: ambDrift 11s ease-in-out infinite alternate;
      }
      @keyframes ambDrift {
        0% { transform: translate3d(-2%, -1.5%, 0) scale(1); }
        100% { transform: translate3d(2.5%, 2%, 0) scale(1.03); }
      }
      .stage {
        position: relative; z-index: 2; width: 100%; height: 100%;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
      }
      .kicker {
        font-family: 'Roboto Mono', monospace; font-weight: 700; letter-spacing: 0.18em;
        text-transform: uppercase; color: #38bdf8;
        background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.32);
        border-radius: 999px; padding: 8px 20px;
        opacity: 0; animation: fadeRise 0.45s var(--spring-soft) 0.1s forwards;
      }
      .headline {
        font-weight: 900; line-height: 1.12; text-align: center;
        background: linear-gradient(90deg, #ffffff 0%, #bae6fd 45%, #818cf8 100%);
        background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
        opacity: 0; animation: fadeRise 0.55s var(--spring-soft) 0.2s forwards, gradShift 2.4s ease-out 0.2s forwards;
      }
      .ui-window {
        background: rgba(15, 23, 42, 0.88);
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 24px;
        box-shadow: 0 36px 80px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(56, 189, 248, 0.14);
        transform-style: preserve-3d;
        opacity: 0;
        animation: cardTilt 0.7s var(--spring-soft) 0.28s forwards;
        position: relative;
        overflow: hidden;
      }
      @keyframes cardTilt {
        0% { opacity: 0; transform: rotateX(16deg) rotateY(-10deg) translateY(48px) scale(0.94); }
        100% { opacity: 1; transform: rotateX(4deg) rotateY(-3deg) translateY(0) scale(1); }
      }
      .win-bar {
        display: flex; align-items: center; gap: 12px;
        padding: 18px 26px; background: rgba(30, 41, 59, 0.75);
        border-bottom: 1px solid rgba(148, 163, 184, 0.16);
      }
      .dots { display: flex; gap: 8px; }
      .dot { width: 12px; height: 12px; border-radius: 50%; background: #475569; }
      .dot.r { background: #fb7185; } .dot.y { background: #fbbf24; } .dot.g { background: #34d399; }
      .win-title { font-family: 'Roboto Mono', monospace; color: #94a3b8; font-size: 18px; margin-left: 8px; }
      .win-body { padding: 32px; display: flex; flex-direction: column; gap: 24px; }
      .subtext { color: #cbd5e1; line-height: 1.48; }
      .cta-row { display: flex; align-items: center; gap: 20px; position: relative; }
      .cta-btn {
        position: relative; display: inline-flex; align-items: center; gap: 14px;
        background: linear-gradient(135deg, #0284c7, #4f46e5);
        color: #ffffff; font-weight: 800; border-radius: 16px; padding: 18px 30px;
        box-shadow: 0 12px 30px rgba(56, 189, 248, 0.35);
        animation: btnPress 0.35s var(--spring-snappy) 0.95s both;
      }
      @keyframes btnPress {
        0%, 100% { transform: scale(1); }
        45% { transform: scale(0.93); box-shadow: 0 4px 16px rgba(56, 189, 248, 0.75); }
      }
      .status-badge {
        font-family: 'Roboto Mono', monospace; font-weight: 700;
        color: #34d399; background: rgba(16, 185, 129, 0.14);
        border: 1px solid rgba(52, 211, 153, 0.4); border-radius: 10px; padding: 10px 18px;
        opacity: 0; animation: fadeRise 0.4s var(--spring-soft) 1.1s forwards;
      }
      .result-drawer {
        background: rgba(2, 132, 199, 0.12);
        border: 1px solid rgba(56, 189, 248, 0.32);
        border-radius: 18px; padding: 24px 28px;
        display: flex; align-items: baseline; gap: 22px;
        clip-path: inset(0 100% 0 0 round 18px);
        animation: drawerReveal 0.65s cubic-bezier(0.16, 1, 0.3, 1) 1.15s forwards;
      }
      @keyframes drawerReveal {
        0% { clip-path: inset(0 100% 0 0 round 18px); }
        100% { clip-path: inset(0 0% 0 0 round 18px); }
      }
      .result-metric { font-family: 'Roboto Mono', monospace; font-weight: 800; color: #38bdf8; }
      .result-caption { color: #e2e8f0; font-weight: 500; }
      .cursor-wrap {
        position: absolute; left: 160px; top: 150px; pointer-events: none; z-index: 10;
        opacity: 0; animation: cursorGlide 0.75s var(--spring-snappy) 0.35s forwards;
      }
      @keyframes cursorGlide {
        0% { opacity: 0; transform: translate3d(280px, 140px, 40px) scale(1.25); }
        100% { opacity: 1; transform: translate3d(0px, 0px, 20px) scale(1); }
      }
      .click-ripple {
        position: absolute; left: -18px; top: -18px; width: 52px; height: 52px;
        border-radius: 50%; border: 3px solid #38bdf8; opacity: 0;
        animation: ripplePop 0.55s ease-out 0.96s forwards;
      }
      @keyframes ripplePop {
        0% { opacity: 0.95; transform: scale(0.3); }
        100% { opacity: 0; transform: scale(2.2); }
      }
      .footer {
        position: absolute; bottom: 42px; font-family: 'Roboto Mono', monospace;
        color: #64748b; letter-spacing: 0.08em;
      }
      @keyframes fadeRise {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes gradShift {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
    `,
    cssLandscape: `
      .stage { padding: 64px 120px; gap: 26px; }
      .kicker { font-size: 16px; }
      .headline { font-size: 62px; max-width: 1400px; }
      .ui-window { width: 1240px; }
      .subtext { font-size: 26px; }
      .cta-btn { font-size: 24px; }
      .status-badge { font-size: 18px; }
      .result-metric { font-size: 56px; }
      .result-caption { font-size: 24px; }
      .footer { font-size: 16px; }
    `,
    cssPortrait: `
      .stage { padding: 110px 68px; gap: 34px; }
      .kicker { font-size: 18px; }
      .headline { font-size: 58px; max-width: 920px; }
      .ui-window { width: 940px; }
      .subtext { font-size: 28px; }
      .cta-btn { font-size: 26px; }
      .status-badge { font-size: 20px; }
      .result-drawer { flex-direction: column; gap: 10px; }
      .result-metric { font-size: 64px; }
      .result-caption { font-size: 26px; }
      .footer { font-size: 18px; bottom: 64px; }
    `,
    bodyMarkup: `
      <div class="stage">
        <div class="kicker" data-slot="kicker"></div>
        <h1 class="headline" data-slot="headline"></h1>
        <div class="ui-window">
          <div class="win-bar">
            <div class="dots"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
            <span class="win-title" data-slot="window_title"></span>
          </div>
          <div class="win-body">
            <p class="subtext" data-slot="subtext"></p>
            <div class="cta-row">
              <div class="cta-btn">
                <span data-slot="action_label"></span>
              </div>
              <span class="status-badge" data-slot="status_badge"></span>
              <div class="cursor-wrap">
                <div class="click-ripple"></div>
                <svg width="42" height="42" viewBox="0 0 36 36" fill="none">
                  <path d="M7 4L29 16.5L18.5 19.5L14 30L7 4Z" fill="#ffffff" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <div class="result-drawer">
              <span class="result-metric" data-slot="result_metric"></span>
              <span class="result-caption" data-slot="result_caption"></span>
            </div>
          </div>
        </div>
        <div class="footer" data-slot="footer"></div>
      </div>
    `,
  },

  // 2. frame-opus-handdrawn
  {
    id: "frame-opus-handdrawn",
    name: "Opus 5.5 Hand-Drawn Sketch Explainer",
    why: "Implements the Opus 5.5 handdrawn explainer recipe: warm drafting paper, self-drawing SVG ink strokes (stroke-dashoffset), sketched callout arrows, and a 12fps steps(3, end) cel line-boil.",
    vars: {
      kicker: "GHI CHÚ PHÁC THẢO",
      headline: "Vì sao mô hình nhỏ lại thắng ở bước suy luận?",
      sketch_left: "Mô hình khổng lồ: tốn băng thông bộ nhớ",
      sketch_right: "Mô hình tinh gọn: lặp kiểm chứng 4 bước",
      callout_note: "Điểm bùng nổ hiệu suất nằm ở vòng tự kiểm tra!",
      verdict: "Chi phí giảm 74% · Độ chính xác tăng 18%",
      footer: "",
    },
    cssShared: `
      #root {
        position: relative; width: 100%; height: 100%;
        background: #14120e;
        background-image:
          radial-gradient(rgba(245, 158, 11, 0.08) 1px, transparent 1px),
          linear-gradient(180deg, #181510 0%, #100e0b 100%);
        background-size: 32px 32px, 100% 100%;
        color: #fef3c7; overflow: hidden;
      }
      #root::after {
        content: ""; position: absolute; inset: -10%; pointer-events: none;
        background: radial-gradient(circle at 50% 40%, rgba(251, 191, 36, 0.11), transparent 60%);
        animation: paperBreath 9s ease-in-out infinite alternate;
      }
      @keyframes paperBreath {
        0% { transform: scale(1) rotate(-0.4deg); opacity: 0.75; }
        100% { transform: scale(1.03) rotate(0.4deg); opacity: 1; }
      }
      .canvas {
        position: relative; z-index: 2; width: 100%; height: 100%;
        display: flex; flex-direction: column; justify-content: center;
        animation: lineBoil 0.45s steps(3, end) infinite;
      }
      @keyframes lineBoil {
        0% { transform: translate(0px, 0px); }
        33% { transform: translate(0.8px, -0.6px); }
        66% { transform: translate(-0.7px, 0.7px); }
        100% { transform: translate(0px, 0px); }
      }
      .kicker {
        font-family: 'Roboto Mono', monospace; font-weight: 700; color: #fbbf24;
        letter-spacing: 0.16em; text-transform: uppercase;
        opacity: 0; animation: inkIn 0.45s ease-out 0.1s forwards;
      }
      .headline {
        font-family: 'Lora', serif; font-weight: 700; color: #fffbeb; line-height: 1.18;
        opacity: 0; animation: inkIn 0.55s ease-out 0.2s forwards;
      }
      .sketch-board {
        display: grid; gap: 36px; position: relative; align-items: stretch;
      }
      .sketch-card {
        position: relative; background: rgba(254, 243, 199, 0.05);
        border: 2.5px dashed rgba(251, 191, 36, 0.48);
        border-radius: 20px; padding: 32px;
        opacity: 0; animation: inkIn 0.55s var(--spring-soft) 0.35s forwards;
      }
      .sketch-card.right {
        border-style: solid; border-color: #34d399;
        background: rgba(16, 185, 129, 0.08);
        animation-delay: 0.52s;
      }
      .sketch-text { font-family: 'Lora', serif; font-weight: 600; line-height: 1.4; color: #fef3c7; }
      .ink-svg { width: 100%; height: 110px; overflow: visible; }
      .ink-path {
        fill: none; stroke: #fbbf24; stroke-width: 4.5; stroke-linecap: round;
        stroke-dasharray: 900; stroke-dashoffset: 900;
        animation: drawStroke 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.55s forwards;
      }
      .ink-circle {
        fill: none; stroke: #34d399; stroke-width: 4; stroke-linecap: round;
        stroke-dasharray: 640; stroke-dashoffset: 640;
        animation: drawStroke 0.95s cubic-bezier(0.16, 1, 0.3, 1) 0.85s forwards;
      }
      @keyframes drawStroke {
        to { stroke-dashoffset: 0; }
      }
      .callout-box {
        display: flex; align-items: center; justify-content: space-between; gap: 24px;
        padding: 24px 32px; border-radius: 18px;
        background: rgba(251, 191, 36, 0.12); border-left: 6px solid #fbbf24;
        opacity: 0; animation: inkIn 0.5s var(--spring-soft) 0.95s forwards;
      }
      .callout-note { font-family: 'Lora', serif; font-style: italic; color: #fde68a; }
      .verdict { font-family: 'Roboto Mono', monospace; font-weight: 800; color: #34d399; }
      .footer { font-family: 'Roboto Mono', monospace; color: #a8a29e; }
      @keyframes inkIn {
        0% { opacity: 0; transform: translateY(18px) rotate(-0.8deg); }
        100% { opacity: 1; transform: translateY(0) rotate(0deg); }
      }
    `,
    cssLandscape: `
      .canvas { padding: 72px 130px; gap: 28px; }
      .kicker { font-size: 17px; }
      .headline { font-size: 58px; max-width: 1480px; }
      .sketch-board { grid-template-columns: 1fr 1fr; }
      .sketch-text { font-size: 32px; }
      .callout-note { font-size: 28px; }
      .verdict { font-size: 28px; }
      .footer { font-size: 16px; }
    `,
    cssPortrait: `
      .canvas { padding: 110px 72px; gap: 32px; }
      .kicker { font-size: 19px; }
      .headline { font-size: 54px; }
      .sketch-board { grid-template-columns: 1fr; }
      .sketch-text { font-size: 32px; }
      .callout-box { flex-direction: column; align-items: flex-start; }
      .callout-note { font-size: 28px; }
      .verdict { font-size: 30px; }
      .footer { font-size: 18px; }
    `,
    bodyMarkup: `
      <div class="canvas">
        <div class="kicker" data-slot="kicker"></div>
        <h1 class="headline" data-slot="headline"></h1>
        <div class="sketch-board">
          <div class="sketch-card">
            <p class="sketch-text" data-slot="sketch_left"></p>
          </div>
          <div class="sketch-card right">
            <p class="sketch-text" data-slot="sketch_right"></p>
          </div>
        </div>
        <svg class="ink-svg" viewBox="0 0 1000 110" preserveAspectRatio="none">
          <path class="ink-path" d="M 40 78 Q 260 12, 510 64 T 940 38" />
          <ellipse class="ink-circle" cx="760" cy="54" rx="170" ry="38" />
        </svg>
        <div class="callout-box">
          <span class="callout-note" data-slot="callout_note"></span>
          <span class="verdict" data-slot="verdict"></span>
        </div>
        <div class="footer" data-slot="footer"></div>
      </div>
    `,
  },

  // 3. frame-opus-collage-stopmo
  {
    id: "frame-opus-collage-stopmo",
    name: "Opus 5.5 Torn-Paper Collage Stop-Motion",
    why: "Brings the Opus 5.5 mixed-media collage & stop-motion style recipe into the kit: halftone newsprint texture, jagged polygon paper cutouts, tilted zine typography, and 12fps steps(4, end) frame snaps.",
    vars: {
      sticker_tag: "CẮT DÁN · ZINE #09",
      headline: "Thuật toán không thưởng cho sự an toàn",
      cutout_stat: "4.7×",
      cutout_label: "Tỷ lệ giữ chân khi mở đầu bằng xung đột thị giác",
      tape_quote: "Khán giả lướt qua sự hoàn hảo, nhưng dừng lại trước vết cắt thô.",
      stamp_text: "KIỂM CHỨNG 2026",
      footer: "",
    },
    cssShared: `
      #root {
        position: relative; width: 100%; height: 100%;
        background-color: #16131d;
        background-image: radial-gradient(rgba(244, 63, 94, 0.16) 1.5px, transparent 1.5px),
                          radial-gradient(rgba(250, 204, 21, 0.1) 1.5px, #16131d 1.5px);
        background-size: 28px 28px;
        background-position: 0 0, 14px 14px;
        color: #f8fafc; overflow: hidden;
      }
      #root::after {
        content: ""; position: absolute; inset: -10%; pointer-events: none;
        background: conic-gradient(from 45deg at 70% 30%, rgba(244, 63, 94, 0.1), rgba(250, 204, 21, 0.08), transparent 60%);
        animation: collageSpin 13s steps(6, end) infinite;
      }
      @keyframes collageSpin {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(4deg) scale(1.03); }
        100% { transform: rotate(0deg) scale(1); }
      }
      .zine-wrap {
        position: relative; z-index: 2; width: 100%; height: 100%;
        display: flex; flex-direction: column; justify-content: center;
      }
      .sticker {
        align-self: flex-start;
        background: #facc15; color: #0f172a;
        font-family: 'Roboto Mono', monospace; font-weight: 800;
        padding: 10px 24px;
        clip-path: polygon(0% 8%, 96% 0%, 100% 88%, 4% 100%);
        transform: rotate(-2.5deg);
        opacity: 0; animation: stopmoSnap 0.45s steps(4, end) 0.12s forwards;
      }
      .headline {
        font-weight: 900; line-height: 1.08; color: #ffffff;
        text-shadow: 5px 5px 0px #e11d48;
        transform: rotate(1deg);
        opacity: 0; animation: stopmoSnap 0.5s steps(4, end) 0.25s forwards;
      }
      .collage-row {
        display: grid; gap: 34px; align-items: center;
      }
      .paper-cutout {
        background: #f43f5e; color: #ffffff;
        padding: 34px 40px;
        clip-path: polygon(2% 0%, 98% 4%, 100% 94%, 92% 100%, 0% 96%);
        box-shadow: 12px 14px 0px #0f172a;
        opacity: 0; animation: cutoutReveal 0.6s steps(5, end) 0.42s forwards;
      }
      @keyframes cutoutReveal {
        0% { opacity: 0; clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%); transform: rotate(-8deg) scale(0.8); }
        100% { opacity: 1; clip-path: polygon(2% 0%, 98% 4%, 100% 94%, 92% 100%, 0% 96%); transform: rotate(-2deg) scale(1); }
      }
      .cutout-stat { font-family: 'Roboto Mono', monospace; font-weight: 900; line-height: 1; display: block; }
      .cutout-label { font-weight: 700; margin-top: 10px; display: block; color: #ffe4e6; }
      .tape-box {
        background: #fef08a; color: #1e293b;
        padding: 32px 36px;
        clip-path: polygon(0% 4%, 99% 0%, 97% 98%, 2% 95%);
        transform: rotate(1.8deg);
        opacity: 0; animation: stopmoSnap 0.55s steps(4, end) 0.62s forwards;
      }
      .tape-quote { font-family: 'Lora', serif; font-weight: 700; line-height: 1.38; }
      .stamp {
        align-self: flex-end;
        font-family: 'Roboto Mono', monospace; font-weight: 800;
        color: #38bdf8; border: 3px solid #38bdf8; padding: 8px 20px;
        transform: rotate(-4deg);
        opacity: 0; animation: stopmoSnap 0.4s steps(3, end) 0.85s forwards;
      }
      .footer { font-family: 'Roboto Mono', monospace; color: #94a3b8; }
      @keyframes stopmoSnap {
        0% { opacity: 0; transform: translateY(32px) rotate(-6deg) scale(0.88); }
        100% { opacity: 1; transform: translateY(0) rotate(-1.5deg) scale(1); }
      }
    `,
    cssLandscape: `
      .zine-wrap { padding: 72px 130px; gap: 30px; }
      .sticker { font-size: 18px; }
      .headline { font-size: 68px; max-width: 1450px; }
      .collage-row { grid-template-columns: 0.9fr 1.1fr; }
      .cutout-stat { font-size: 88px; }
      .cutout-label { font-size: 24px; }
      .tape-quote { font-size: 32px; }
      .stamp { font-size: 20px; }
      .footer { font-size: 16px; }
    `,
    cssPortrait: `
      .zine-wrap { padding: 110px 70px; gap: 36px; }
      .sticker { font-size: 20px; }
      .headline { font-size: 60px; }
      .collage-row { grid-template-columns: 1fr; }
      .cutout-stat { font-size: 92px; }
      .cutout-label { font-size: 26px; }
      .tape-quote { font-size: 32px; }
      .stamp { font-size: 22px; }
      .footer { font-size: 18px; }
    `,
    bodyMarkup: `
      <div class="zine-wrap">
        <div class="sticker" data-slot="sticker_tag"></div>
        <h1 class="headline" data-slot="headline"></h1>
        <div class="collage-row">
          <div class="paper-cutout">
            <span class="cutout-stat" data-slot="cutout_stat"></span>
            <span class="cutout-label" data-slot="cutout_label"></span>
          </div>
          <div class="tape-box">
            <p class="tape-quote" data-slot="tape_quote"></p>
          </div>
        </div>
        <div class="stamp" data-slot="stamp_text"></div>
        <div class="footer" data-slot="footer"></div>
      </div>
    `,
  },

  // 4. frame-opus-shader-orb
  {
    id: "frame-opus-shader-orb",
    name: "Opus 5.5 Generative Shader Orb Hero",
    why: "Implements the Opus 5.5 generative shader style recipe in pure seek-safe CSS: coprime conic-gradient plasma rings, a mask-image light sweep across the hero statement, and a live gradient-text fill.",
    vars: {
      kicker: "TRÍ TUỆ NHÂN TẠO ĐA TÁC VỤ",
      hero_stat: "10.4 TFLOPS",
      headline: "Năng lượng suy luận thời gian thực ngay trên thiết bị",
      subtext: "Không phụ thuộc đám mây · Bảo mật tuyệt đối · Độ trễ bằng không",
      pill_left: "LƯỢNG TỬ HÓA 4-BIT",
      pill_right: "TỰ ĐỘNG ĐIỀU PHỐI",
      footer: "",
    },
    cssShared: `
      #root {
        position: relative; width: 100%; height: 100%;
        background: radial-gradient(circle at 50% 50%, #0d1326 0%, #05070f 75%);
        color: #f8fafc; overflow: hidden;
      }
      #root::after {
        content: ""; position: absolute; inset: -15%; pointer-events: none;
        background: conic-gradient(from 0deg at 50% 50%, rgba(56, 189, 248, 0.14), rgba(168, 85, 247, 0.14), rgba(16, 185, 129, 0.1), rgba(56, 189, 248, 0.14));
        filter: blur(48px);
        animation: orbRotate 13s linear infinite;
      }
      .orb-ring {
        position: absolute; left: 50%; top: 50%; width: 760px; height: 760px;
        margin-left: -380px; margin-top: -380px; border-radius: 50%; pointer-events: none;
        background: conic-gradient(from 90deg, transparent 0deg, rgba(56, 189, 248, 0.35) 90deg, transparent 180deg, rgba(236, 72, 153, 0.32) 270deg, transparent 360deg);
        -webkit-mask-image: radial-gradient(circle, transparent 58%, #000 62%, #000 66%, transparent 70%);
        mask-image: radial-gradient(circle, transparent 58%, #000 62%, #000 66%, transparent 70%);
        animation: orbRotate 17s linear infinite reverse;
      }
      @keyframes orbRotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .center-stage {
        position: relative; z-index: 2; width: 100%; height: 100%;
        display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;
      }
      .kicker {
        font-family: 'Roboto Mono', monospace; font-weight: 700; letter-spacing: 0.2em;
        color: #38bdf8; text-transform: uppercase;
        opacity: 0; animation: riseIn 0.45s var(--spring-soft) 0.1s forwards;
      }
      .hero-stat {
        font-family: 'Roboto Mono', monospace; font-weight: 900; line-height: 1;
        background: linear-gradient(90deg, #38bdf8 0%, #f472b6 50%, #34d399 100%);
        background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
        -webkit-mask-image: linear-gradient(110deg, #000 35%, rgba(0,0,0,0.3) 50%, #000 65%);
        mask-image: linear-gradient(110deg, #000 35%, rgba(0,0,0,0.3) 50%, #000 65%);
        -webkit-mask-size: 240% 100%; mask-size: 240% 100%;
        opacity: 0;
        animation: riseIn 0.55s var(--spring-soft) 0.22s forwards, maskSweep 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.22s forwards, textShimmer 9s linear infinite;
      }
      @keyframes maskSweep {
        0% { -webkit-mask-position: 100% 0; mask-position: 100% 0; }
        100% { -webkit-mask-position: 0% 0; mask-position: 0% 0; }
      }
      @keyframes textShimmer {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
      .headline {
        font-weight: 800; line-height: 1.16; color: #ffffff;
        opacity: 0; animation: riseIn 0.55s var(--spring-soft) 0.38s forwards;
      }
      .subtext {
        color: #94a3b8; font-weight: 500;
        opacity: 0; animation: riseIn 0.5s var(--spring-soft) 0.52s forwards;
      }
      .pills {
        display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;
        opacity: 0; animation: riseIn 0.5s var(--spring-soft) 0.68s forwards;
      }
      .pill {
        font-family: 'Roboto Mono', monospace; font-weight: 700;
        padding: 12px 26px; border-radius: 999px;
        background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(148, 163, 184, 0.25);
        color: #e2e8f0;
      }
      .footer { font-family: 'Roboto Mono', monospace; color: #64748b; }
      @keyframes riseIn {
        0% { opacity: 0; transform: translateY(24px) scale(0.95); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
    `,
    cssLandscape: `
      .center-stage { padding: 72px 140px; gap: 24px; }
      .kicker { font-size: 17px; }
      .hero-stat { font-size: 112px; }
      .headline { font-size: 56px; max-width: 1320px; }
      .subtext { font-size: 26px; max-width: 1100px; }
      .pill { font-size: 18px; }
      .footer { font-size: 16px; }
    `,
    cssPortrait: `
      .center-stage { padding: 110px 72px; gap: 32px; }
      .kicker { font-size: 19px; }
      .hero-stat { font-size: 92px; }
      .headline { font-size: 54px; }
      .subtext { font-size: 28px; }
      .pill { font-size: 20px; }
      .footer { font-size: 18px; }
    `,
    bodyMarkup: `
      <div class="orb-ring"></div>
      <div class="center-stage">
        <div class="kicker" data-slot="kicker"></div>
        <div class="hero-stat" data-slot="hero_stat"></div>
        <h1 class="headline" data-slot="headline"></h1>
        <p class="subtext" data-slot="subtext"></p>
        <div class="pills">
          <span class="pill" data-slot="pill_left"></span>
          <span class="pill" data-slot="pill_right"></span>
        </div>
        <div class="footer" data-slot="footer"></div>
      </div>
    `,
  },

  // 5. frame-opus-pixel-arcade
  {
    id: "frame-opus-pixel-arcade",
    name: "Opus 5.5 Pixel Arcade HUD",
    why: "Implements the Opus 5.5 pixel style recipe: crisp 8-bit grid scanlines, stepped progress bars with steps(8, end), retro arcade brackets, and a mechanical score readout.",
    vars: {
      stage_label: "STAGE 04 // BOSS BENCHMARK",
      headline: "Độ chính xác lập trình tự động",
      player_1_name: "AGENT V2",
      player_1_score: "94%",
      player_2_name: "BASELINE",
      player_2_score: "61%",
      arcade_prompt: "NHẤN START ĐỂ XEM PHÂN TÍCH CHI TIẾT",
      footer: "",
    },
    cssShared: `
      #root {
        position: relative; width: 100%; height: 100%;
        background-color: #090d16;
        background-image:
          linear-gradient(rgba(16, 185, 129, 0.07) 2px, transparent 2px),
          linear-gradient(90deg, rgba(16, 185, 129, 0.07) 2px, transparent 2px);
        background-size: 24px 24px;
        color: #ecfdf5; overflow: hidden;
      }
      #root::after {
        content: ""; position: absolute; inset: -10%; pointer-events: none;
        background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.22) 0px, rgba(0, 0, 0, 0.22) 2px, transparent 2px, transparent 6px);
        animation: scanShift 7s steps(12, end) infinite;
      }
      @keyframes scanShift {
        0% { transform: translateY(0px); }
        100% { transform: translateY(24px); }
      }
      .hud-wrap {
        position: relative; z-index: 2; width: 100%; height: 100%;
        display: flex; flex-direction: column; justify-content: center;
      }
      .stage-label {
        font-family: 'Roboto Mono', monospace; font-weight: 800;
        color: #facc15; letter-spacing: 0.16em;
        opacity: 0; animation: pixPop 0.35s steps(4, end) 0.1s forwards;
      }
      .headline {
        font-weight: 900; color: #ffffff; text-transform: uppercase;
        text-shadow: 4px 4px 0px #059669;
        opacity: 0; animation: pixPop 0.45s steps(5, end) 0.22s forwards;
      }
      .hud-box {
        background: rgba(6, 78, 59, 0.28);
        border: 4px solid #10b981;
        padding: 36px; display: flex; flex-direction: column; gap: 28px;
        box-shadow: 8px 8px 0px rgba(16, 185, 129, 0.3);
        clip-path: inset(0 100% 0 0);
        animation: hudWipe 0.6s steps(8, end) 0.35s forwards;
      }
      @keyframes hudWipe {
        0% { clip-path: inset(0 100% 0 0); }
        100% { clip-path: inset(0 0% 0 0); }
      }
      .p-row { display: flex; flex-direction: column; gap: 12px; }
      .p-meta { display: flex; justify-content: space-between; font-family: 'Roboto Mono', monospace; font-weight: 800; }
      .p-name { color: #a7f3d0; }
      .p-score { color: #facc15; }
      .bar-track { height: 28px; background: rgba(15, 23, 42, 0.9); border: 2px solid #34d399; padding: 3px; }
      .bar-fill {
        height: 100%; background: repeating-linear-gradient(90deg, #10b981 0px, #10b981 18px, #059669 18px, #059669 24px);
        transform-origin: left center; transform: scaleX(0);
        animation: barStep 0.8s steps(8, end) 0.55s forwards;
      }
      .bar-fill.secondary {
        background: repeating-linear-gradient(90deg, #38bdf8 0px, #38bdf8 18px, #0284c7 18px, #0284c7 24px);
        width: 64%; animation-delay: 0.7s;
      }
      @keyframes barStep {
        0% { transform: scaleX(0); }
        100% { transform: scaleX(1); }
      }
      .arcade-prompt {
        font-family: 'Roboto Mono', monospace; font-weight: 800; color: #facc15;
        opacity: 0; animation: pixPop 0.4s steps(3, end) 0.95s forwards;
      }
      .footer { font-family: 'Roboto Mono', monospace; color: #6ee7b7; }
      @keyframes pixPop {
        0% { opacity: 0; transform: translateY(16px); }
        100% { opacity: 1; transform: translateY(0); }
      }
    `,
    cssLandscape: `
      .hud-wrap { padding: 72px 140px; gap: 28px; }
      .stage-label { font-size: 20px; }
      .headline { font-size: 62px; }
      .p-meta { font-size: 28px; }
      .arcade-prompt { font-size: 22px; }
      .footer { font-size: 16px; }
    `,
    cssPortrait: `
      .hud-wrap { padding: 110px 70px; gap: 34px; }
      .stage-label { font-size: 22px; }
      .headline { font-size: 54px; }
      .p-meta { font-size: 30px; }
      .arcade-prompt { font-size: 24px; }
      .footer { font-size: 18px; }
    `,
    bodyMarkup: `
      <div class="hud-wrap">
        <div class="stage-label" data-slot="stage_label"></div>
        <h1 class="headline" data-slot="headline"></h1>
        <div class="hud-box">
          <div class="p-row">
            <div class="p-meta">
              <span class="p-name" data-slot="player_1_name"></span>
              <span class="p-score" data-slot="player_1_score"></span>
            </div>
            <div class="bar-track"><div class="bar-fill"></div></div>
          </div>
          <div class="p-row">
            <div class="p-meta">
              <span class="p-name" data-slot="player_2_name"></span>
              <span class="p-score" data-slot="player_2_score"></span>
            </div>
            <div class="bar-track"><div class="bar-fill secondary"></div></div>
          </div>
        </div>
        <div class="arcade-prompt" data-slot="arcade_prompt"></div>
        <div class="footer" data-slot="footer"></div>
      </div>
    `,
  },

  // 6. frame-opus-kinetic-reel
  {
    id: "frame-opus-kinetic-reel",
    name: "Opus 5.5 Split-Mask Kinetic Reel",
    why: "Implements the tuzhechen2005/opus-video-skills kinetic typography reel style: high-impact stacked shutter lines revealed by mask-image + clip-path sweeps with a live gradient punchline.",
    vars: {
      top_tag: "NHỊP ĐIỆU THỊ GIÁC // OPUS 5.5",
      line_1: "ĐỪNG CHỈ ĐỌC KỊCH BẢN",
      line_2: "HÃY ĐỂ TỪNG CON CHỮ",
      line_3: "DẪN DẮT ÁNH NHÌN",
      punchline: "Tốc độ 7 từ/giây · Dừng đúng nhịp nhấn",
      counter_badge: "01 / 06",
      footer: "",
    },
    cssShared: `
      #root {
        position: relative; width: 100%; height: 100%;
        background: #08090e; color: #ffffff; overflow: hidden;
      }
      #root::after {
        content: ""; position: absolute; inset: -12%; pointer-events: none;
        background: radial-gradient(circle at 80% 20%, rgba(244, 63, 94, 0.14), transparent 50%),
                    radial-gradient(circle at 20% 80%, rgba(56, 189, 248, 0.14), transparent 50%);
        animation: reelPulse 10s ease-in-out infinite alternate;
      }
      @keyframes reelPulse {
        0% { transform: translate3d(-2%, 1%, 0) scale(1); }
        100% { transform: translate3d(2%, -1.5%, 0) scale(1.04); }
      }
      .reel-stage {
        position: relative; z-index: 2; width: 100%; height: 100%;
        display: flex; flex-direction: column; justify-content: center;
      }
      .header-row {
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 2px solid rgba(255, 255, 255, 0.14); padding-bottom: 20px;
      }
      .top-tag {
        font-family: 'Roboto Mono', monospace; font-weight: 700;
        color: #f43f5e; letter-spacing: 0.18em;
      }
      .counter-badge {
        font-family: 'Roboto Mono', monospace; font-weight: 800;
        color: #38bdf8; background: rgba(56, 189, 248, 0.12);
        padding: 8px 18px; border-radius: 999px;
      }
      .stack { display: flex; flex-direction: column; gap: 12px; }
      .k-line {
        font-weight: 900; line-height: 1.04; letter-spacing: -0.02em;
        clip-path: inset(0 0 100% 0);
        -webkit-mask-image: linear-gradient(90deg, #000 60%, rgba(0,0,0,0.4) 80%, #000 100%);
        mask-image: linear-gradient(90deg, #000 60%, rgba(0,0,0,0.4) 80%, #000 100%);
        animation: shutterUp 0.52s var(--spring-soft) 0.15s forwards;
      }
      .k-line.l2 {
        color: #e2e8f0; animation-delay: 0.32s;
      }
      .k-line.l3 {
        background: linear-gradient(90deg, #f43f5e 0%, #fbbf24 50%, #38bdf8 100%);
        background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
        animation: shutterUp 0.58s var(--spring-soft) 0.5s forwards, gradSweep 7s linear infinite;
      }
      @keyframes shutterUp {
        0% { clip-path: inset(0 0 100% 0); transform: translateY(28px); }
        100% { clip-path: inset(0 0 0% 0); transform: translateY(0); }
      }
      @keyframes gradSweep {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
      .punchline {
        font-family: 'Roboto Mono', monospace; font-weight: 700; color: #94a3b8;
        border-left: 4px solid #f43f5e; padding-left: 20px;
        opacity: 0; animation: fadeIn 0.5s ease-out 0.8s forwards;
      }
      .footer { font-family: 'Roboto Mono', monospace; color: #64748b; }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-16px); }
        to { opacity: 1; transform: translateX(0); }
      }
    `,
    cssLandscape: `
      .reel-stage { padding: 72px 140px; gap: 34px; }
      .top-tag, .counter-badge { font-size: 18px; }
      .k-line { font-size: 86px; }
      .punchline { font-size: 26px; }
      .footer { font-size: 16px; }
    `,
    cssPortrait: `
      .reel-stage { padding: 110px 70px; gap: 40px; }
      .top-tag, .counter-badge { font-size: 20px; }
      .k-line { font-size: 72px; }
      .punchline { font-size: 28px; }
      .footer { font-size: 18px; }
    `,
    bodyMarkup: `
      <div class="reel-stage">
        <div class="header-row">
          <span class="top-tag" data-slot="top_tag"></span>
          <span class="counter-badge" data-slot="counter_badge"></span>
        </div>
        <div class="stack">
          <div class="k-line l1" data-slot="line_1"></div>
          <div class="k-line l2" data-slot="line_2"></div>
          <div class="k-line l3" data-slot="line_3"></div>
        </div>
        <div class="punchline" data-slot="punchline"></div>
        <div class="footer" data-slot="footer"></div>
      </div>
    `,
  },
];

export function buildAll() {
  for (const t of OPUS_TEMPLATES) {
    const dir = path.join(VT, t.id);
    const compDir = path.join(dir, "compositions");
    fs.mkdirSync(compDir, { recursive: true });

    const landscapeHtml = renderHtml({
      id: t.id,
      name: t.name,
      w: 1920,
      h: 1080,
      compId: "main",
      vars: t.vars,
      cssShared: t.cssShared,
      cssAspect: t.cssLandscape,
      bodyMarkup: t.bodyMarkup,
    });
    const portraitHtml = renderHtml({
      id: t.id,
      name: t.name,
      w: 1080,
      h: 1920,
      compId: "portrait",
      vars: t.vars,
      cssShared: t.cssShared,
      cssAspect: t.cssPortrait,
      bodyMarkup: t.bodyMarkup,
    });

    fs.writeFileSync(path.join(dir, "index.html"), landscapeHtml, "utf8");
    fs.writeFileSync(path.join(compDir, "portrait.html"), portraitHtml, "utf8");
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ id: t.id, name: t.name }, null, 2) + "\n", "utf8");
    fs.writeFileSync(path.join(dir, "hyperframes.json"), HYPERFRAMES_JSON, "utf8");

    const slotList = Object.keys(t.vars).map((k) => `- \`${k}\``).join("\n");
    const notice = `# Attribution — ${t.id}

**Original template** authored for content-agent-kit (MIT, same as this repo).
Distilled from the Claude Opus 5.5 code-video style recipes (\`yihui-dev/awesome-opus5-5-videos\` and \`HiAPIAI/awesome-opus-5-5-video-styles\`); no third-party code, markup, fonts or imagery is vendored here.

## Why it exists

${t.why}

## Slots

${slotList}

Both compositions expose the same slot names; they are emitted together by
\`scripts/video/lib/build-opus-templates.mjs\`. Edit that file, not the HTML.
`;
    fs.writeFileSync(path.join(dir, "NOTICE.md"), notice, "utf8");
    console.log(`[opus] ✓ wrote ${t.id}`);
  }
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  buildAll();
}
