// story-templates-a.mjs — storytelling scene templates, part A (emitted by build-story-templates.mjs).
//
// Every entry follows the rules at the top of build-trend-templates.mjs (fill the frame, three
// layers of motion, all copy from slots, all motion CSS so seek() is deterministic) plus one
// more that is the point of this set: EACH TEMPLATE IS A STORY DEVICE, not a layout. It carries
// a beat of a narrative — a turn, a reveal, a before/after, a chapter — in the way it moves.
// Sources of the devices are named per template in `why` and in each NOTICE.md.

export const STORY_TEMPLATES_A = [
  // 1 ── one unbroken line ───────────────────────────────────────────────────
  {
    id: "frame-story-one-line",
    name: "Story · One Unbroken Line",
    role: "story arc / whole journey in one beat",
    bestFor: "the arc of a story told in a single beat — start, struggle, payoff — when there is no footage; origin stories, 'how we got here', a customer's journey",
    why: "One pen line never leaves the paper: it loops into a seed, climbs a mountain and ends in a heart, and each station is named as the pen reaches it. The 'one unbroken line draws the whole story' device is one of the most-shared storytelling prompts in the 2026 Opus 5.5 video survey (awesome-opus5-5-videos) — the continuity IS the narrative.",
    bg: "#f3ede1",
    vars: {
      kicker: "Câu chuyện của một cửa hàng nhỏ",
      headline: "Từ một ý tưởng đến 10.000 đơn hàng",
      label_1: "Ý tưởng",
      label_2: "Năm đầu khó khăn",
      label_3: "Khách quay lại",
      sub: "Ba năm, một nét vẽ không nhấc bút",
    },
    slots: [
      ["kicker", "≤40", "small line above the headline"],
      ["headline", "≤48", "the whole story in one sentence"],
      ["label_1", "≤18", "the start — named when the pen closes the first loop"],
      ["label_2", "≤22", "the struggle — named at the mountain peak"],
      ["label_3", "≤18", "the payoff — named when the heart is drawn"],
      ["sub", "≤48", "closing line under the drawing"],
    ],
    css: `
      #root { background: #f3ede1; color: #1d1a16; }
      #root::after { background-image: radial-gradient(rgba(60,40,20,.10) 1px, transparent 1.6px); background-size: 7px 7px; opacity: .6; animation: grain 1.2s steps(4) infinite; }
      @keyframes grain { 0% { transform: translate(0,0); } 25% { transform: translate(-3px,2px); } 50% { transform: translate(2px,-3px); } 75% { transform: translate(-2px,-1px); } 100% { transform: translate(0,0); } }
      .kicker { font-family: 'Roboto Mono', monospace; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; color: #d94f2b; opacity: 0; animation: fade .5s .1s forwards; }
      .headline { font-family: 'Playfair Display', serif; font-weight: 900; font-style: italic; line-height: 1.02; letter-spacing: -.01em; opacity: 0; animation: rise .7s var(--out) .2s forwards; }
      .art { position: relative; width: 1000px; height: 700px; flex: none; transform-origin: 0 0; }
      .art svg { position: absolute; inset: 0; overflow: visible; }
      .ln { fill: none; stroke: #1d1a16; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 4s linear .6s forwards; }
      @keyframes draw { to { stroke-dashoffset: 0; } }
      .heart { fill: #d94f2b; opacity: 0; animation: fade .6s 4.5s forwards; }
      .pen { position: absolute; left: 0; top: 0; width: 26px; height: 26px; margin: -13px 0 0 -13px; border-radius: 50%; background: #d94f2b; box-shadow: 0 0 0 8px rgba(217,79,43,.18);
             offset-path: path("M 40 560 C 120 560 140 420 220 420 C 330 420 340 190 220 190 C 100 190 110 420 220 420 C 300 420 330 560 400 560 L 520 300 L 580 400 L 650 180 L 760 560 C 800 600 840 610 880 600 C 760 500 800 380 880 440 C 960 380 1000 500 880 600 L 975 640");
             offset-rotate: 0deg; offset-distance: 0%; animation: travel 4s linear .6s forwards, fade .2s .5s both; }
      @keyframes travel { to { offset-distance: 100%; } }
      .lab { position: absolute; font-weight: 800; white-space: nowrap; background: #1d1a16; color: #f3ede1; padding: 8px 20px; border-radius: 10px; opacity: 0; transform: translate(-50%, 0); animation: labIn .5s var(--spring) forwards; }
      @keyframes labIn { from { opacity: 0; transform: translate(-50%, 20px) scale(.8); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
      .l1 { left: 220px; top: 70px; animation-delay: 1.8s; }
      .l2 { left: 650px; top: 80px; animation-delay: 3.1s; }
      .l3 { left: 800px; top: 650px; animation-delay: 4.4s; background: #d94f2b; }
      .sub { font-weight: 600; color: #6b6156; opacity: 0; animation: rise .6s var(--out) 4.5s forwards; }
    `,
    cssPortrait: `
      .stage { padding: 150px 60px 0; gap: 34px; }
      .kicker { font-size: 32px; }
      .headline { font-size: 100px; }
      .art { margin-top: 120px; margin-bottom: 120px; transform: scale(.96); }
      .lab { font-size: 42px; }
      .sub { font-size: 42px; margin-top: -10px; }
    `,
    cssLandscape: `
      .stage { padding: 110px 120px; display: grid; grid-template-columns: 640px 1fr; grid-template-rows: auto auto 1fr auto; column-gap: 60px; row-gap: 22px; }
      .kicker { grid-column: 1; font-size: 26px; }
      .headline { grid-column: 1; font-size: 86px; }
      .art { grid-column: 2; grid-row: 1 / span 4; transform: scale(.9); margin-top: 40px; }
      .sub { grid-column: 1; grid-row: 4; font-size: 34px; }
      .lab { font-size: 36px; }
    `,
    markup: `
      <div class="stage">
        <div class="kicker" data-slot="kicker"></div>
        <div class="headline" data-slot="headline"></div>
        <div class="art">
          <svg viewBox="0 0 1000 700" width="1000" height="700" aria-hidden="true">
            <path class="heart" d="M 880 600 C 760 500 800 380 880 440 C 960 380 1000 500 880 600 Z"/>
            <path class="ln" pathLength="1" d="M 40 560 C 120 560 140 420 220 420 C 330 420 340 190 220 190 C 100 190 110 420 220 420 C 300 420 330 560 400 560 L 520 300 L 580 400 L 650 180 L 760 560 C 800 600 840 610 880 600 C 760 500 800 380 880 440 C 960 380 1000 500 880 600 L 975 640"/>
          </svg>
          <div class="pen"></div>
          <div class="lab l1" data-slot="label_1"></div>
          <div class="lab l2" data-slot="label_2"></div>
          <div class="lab l3" data-slot="label_3"></div>
        </div>
        <div class="sub" data-slot="sub"></div>
      </div>`,
  },

  // 2 ── one world, one camera ────────────────────────────────────────────────
  {
    id: "frame-story-world-pan",
    name: "Story · One World, One Camera",
    role: "story / descent or rise",
    bestFor: "a story with a direction — going down into the hard part, coming up into the result; 'above the surface / below the surface', iceberg and roots metaphors",
    why: "Not a sequence of slides but one tall world — sky over soil — with a camera that dives through it: the headline in the sky, the turning point on the horizon, the truth in the roots, which draw themselves as the camera arrives. Ported as an idea from ghost-editor's explainer-vector recipe ('one world, one camera', MIT).",
    bg: "#1b1410",
    vars: {
      kicker: "Điều người ta không thấy",
      line_top: "Ai cũng thấy cái cây ra quả",
      line_mid: "Nhưng mọi thứ bắt đầu dưới mặt đất",
      line_bottom: "Ba năm đâm rễ trước khi có quả đầu tiên",
    },
    slots: [
      ["kicker", "≤32", "small label that stays at the top of the frame"],
      ["line_top", "≤40", "what everyone sees — set in the sky"],
      ["line_mid", "≤44", "the turn — set on the horizon line"],
      ["line_bottom", "≤52", "the hidden truth — set among the roots"],
    ],
    css: `
      #root { background: #1b1410; color: #1d1a16; }
      #root::after { background-image: radial-gradient(rgba(244,234,216,.18) 1.5px, transparent 2px); background-size: 120px 140px; opacity: .5; animation: motes 9s linear infinite; z-index: 2; }
      @keyframes motes { from { transform: translateY(0); } to { transform: translateY(-140px); } }
      .view { position: absolute; inset: 0; overflow: hidden; }
      .world { position: absolute; left: 0; top: 0; width: 100%; height: calc(var(--vh) * 3.3);
               background: linear-gradient(180deg, #f4ead8 0, #efe0c4 calc(var(--vh) * 1.5), #2a1f18 calc(var(--vh) * 1.5), #1b1410 100%);
               animation: cam 6s cubic-bezier(.65,0,.35,1) both; }
      @keyframes cam { 0%, 18% { transform: translateY(0); } 38%, 58% { transform: translateY(calc(var(--vh) * -1)); } 80%, 100% { transform: translateY(calc(var(--vh) * -2.25)); } }
      .sun { position: absolute; border-radius: 50%; background: #f2b544; }
      .ground { position: absolute; left: 0; right: 0; top: calc(var(--vh) * 1.5 - 4px); height: 8px; background: #1d1a16; }
      .sprout { position: absolute; top: calc(var(--vh) * 1.5); overflow: visible; }
      .sprout path { fill: none; stroke: #4f7a3a; stroke-width: 10; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1.2s var(--out) 1.4s forwards; }
      .roots { position: absolute; top: calc(var(--vh) * 1.5); overflow: visible; }
      .roots path { fill: none; stroke: #c9a15b; stroke-width: 5; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 2.2s var(--out) forwards; }
      @keyframes draw { to { stroke-dashoffset: 0; } }
      .panel { position: absolute; left: 50%; transform: translateX(-50%); font-family: 'Playfair Display', serif; font-weight: 700; line-height: 1.08; text-align: center; border-radius: 22px; opacity: 0; animation: panelIn .7s var(--out) forwards; }
      @keyframes panelIn { from { opacity: 0; transform: translate(-50%, 40px); } to { opacity: 1; transform: translate(-50%, 0); } }
      .p-top { background: #fffaf0; color: #1d1a16; animation-delay: .3s; }
      .p-mid { background: #1d1a16; color: #f4ead8; animation-delay: 2.4s; }
      .p-bot { background: #2a1f18; color: #f4ead8; box-shadow: inset 0 0 0 4px #c9a15b; animation-delay: 4.7s; }
      .kicker { position: absolute; z-index: 3; left: 50%; transform: translateX(-50%); white-space: nowrap; font-family: 'Roboto Mono', monospace; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; background: #c9a15b; color: #1b1410; border-radius: 999px; opacity: 0; animation: fade .4s .1s forwards; }
    `,
    cssPortrait: `
      #root { --vh: 1920px; }
      .kicker { top: 110px; font-size: 30px; padding: 12px 28px; }
      .sun { width: 300px; height: 300px; right: 90px; top: 260px; }
      .panel { width: 920px; padding: 44px 50px; font-size: 92px; }
      .p-top { top: 760px; }
      .p-mid { top: calc(1920px * 1.5 - 560px); font-size: 82px; }
      .p-bot { top: calc(1920px * 2.25 + 1180px); font-size: 74px; }
      .sprout { left: 490px; width: 100px; height: 240px; transform: translateY(-240px); }
      .roots { left: 240px; width: 600px; height: 2300px; }
      .roots path { animation-delay: 4.1s; }
    `,
    cssLandscape: `
      #root { --vh: 1080px; }
      .kicker { top: 60px; font-size: 24px; padding: 10px 24px; }
      .sun { width: 220px; height: 220px; right: 220px; top: 170px; }
      .panel { width: 1300px; padding: 34px 50px; font-size: 80px; }
      .p-top { top: 470px; }
      .p-mid { top: calc(1080px * 1.5 - 300px); font-size: 70px; }
      .p-bot { top: calc(1080px * 2.25 + 600px); font-size: 64px; }
      .sprout { left: 910px; width: 100px; height: 180px; transform: translateY(-180px); }
      .roots { left: 560px; width: 800px; height: 1250px; }
      .roots path { animation-delay: 4.1s; }
    `,
    markup: `
      <div class="view">
        <div class="world">
          <div class="sun"></div>
          <div class="ground"></div>
          <svg class="sprout" viewBox="0 0 100 240" preserveAspectRatio="none" aria-hidden="true">
            <path pathLength="1" vector-effect="non-scaling-stroke" d="M 50 240 C 50 170 52 120 50 60 M 50 120 C 20 100 10 80 12 60 M 50 90 C 80 70 92 50 88 30"/>
          </svg>
          <svg class="roots" viewBox="0 0 600 1000" preserveAspectRatio="none" aria-hidden="true">
            <path pathLength="1" vector-effect="non-scaling-stroke" d="M 300 0 C 300 200 290 420 300 640 C 305 780 300 900 300 1000"/>
            <path pathLength="1" vector-effect="non-scaling-stroke" d="M 300 120 C 220 220 140 300 60 460 C 30 520 20 600 30 700"/>
            <path pathLength="1" vector-effect="non-scaling-stroke" d="M 300 160 C 380 260 470 340 540 520 C 570 600 580 680 560 780"/>
            <path pathLength="1" vector-effect="non-scaling-stroke" d="M 300 380 C 240 460 200 560 180 760 C 170 840 160 900 150 980"/>
            <path pathLength="1" vector-effect="non-scaling-stroke" d="M 300 420 C 360 500 410 600 430 760 C 440 850 450 920 460 990"/>
            <path pathLength="1" vector-effect="non-scaling-stroke" d="M 300 640 C 260 700 230 760 220 860 M 300 700 C 340 760 360 820 370 900"/>
          </svg>
          <div class="panel p-top" data-slot="line_top"></div>
          <div class="panel p-mid" data-slot="line_mid"></div>
          <div class="panel p-bot" data-slot="line_bottom"></div>
        </div>
      </div>
      <div data-slot-box><div class="kicker" data-slot="kicker"></div></div>`,
  },

  // 3 ── tactile paper page turn ─────────────────────────────────────────────
  {
    id: "frame-story-page-turn",
    name: "Story · Tactile Paper Page Turn",
    role: "story / before → after",
    bestFor: "a turn in the story — 'then everything changed', a before/after, the page of the old way turning to reveal the new one",
    why: "Printed paper on maroon, a zoom-blur push in, and a page that turns on stepped 8 fps motion like stop-motion to reveal the payoff behind it. The page fold, stepped timing and 1–3-word black pill caption come from ghost-editor's tactile-paper recipe (MIT, after @chrismoran__'s After Effects page-turn) — rebuilt here as CSS.",
    bg: "#6e1f24",
    vars: {
      kicker: "Năm 2019",
      before: "Bán hàng là đăng ảnh và chờ",
      after: "Rồi khách hàng bắt đầu tự kể chuyện cho mình",
      note: "trang sau của câu chuyện",
      pill: "BƯỚC NGOẶT",
    },
    slots: [
      ["kicker", "≤20", "date or source line on the first page"],
      ["before", "≤40", "the old way — the page that turns away"],
      ["after", "≤56", "the new way — revealed behind it"],
      ["note", "≤32", "hand-written label on the second page"],
      ["pill", "≤16", "1–3 words in the black pill caption"],
    ],
    css: `
      #root { background: #6e1f24; color: #1a1513; perspective: 2600px; }
      #root::after { background-image: repeating-linear-gradient(17deg, rgba(255,255,255,.035) 0 2px, transparent 2px 9px), repeating-linear-gradient(-63deg, rgba(0,0,0,.05) 0 1px, transparent 1px 7px); opacity: .9; animation: boil .5s steps(2) infinite; }
      @keyframes boil { 0% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(-4px,3px) rotate(.4deg); } 100% { transform: translate(0,0) rotate(0deg); } }
      .stage { align-items: center; }
      .book { position: relative; transform-style: preserve-3d; animation: push .9s steps(7) both; }
      @keyframes push { from { transform: scale(1.3); filter: blur(16px); opacity: .2; } to { transform: scale(1); filter: blur(0); opacity: 1; } }
      .page { position: absolute; inset: 0; background: #efe6d2; border-radius: 6px; box-shadow: 0 40px 90px rgba(0,0,0,.35); overflow: hidden; }
      .page::before { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(26,21,19,.06) 0 2px, transparent 2px 64px); }
      .p1 { transform-origin: left center; backface-visibility: hidden; z-index: 2; animation: turn 1.05s steps(8) 3s forwards; }
      .p1::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.45)); opacity: 0; animation: shade 1.05s steps(8) 3s forwards; }
      @keyframes turn { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(-178deg); } }
      @keyframes shade { 0% { opacity: 0; } 60% { opacity: 1; } 100% { opacity: 0; } }
      .p2 { z-index: 1; }
      .kicker { font-family: 'Roboto Mono', monospace; font-weight: 700; color: #6e1f24; letter-spacing: .05em; }
      .before { font-family: 'Anton', sans-serif; text-transform: uppercase; line-height: .98; color: #1a1513; }
      .rule { height: 6px; background: #1a1513; transform-origin: left; animation: wipe .5s steps(5) .9s both; }
      @keyframes wipe { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      .after { font-family: 'Playfair Display', serif; font-style: italic; font-weight: 900; line-height: 1.04; color: #1a1513; }
      .note { font-family: 'Patrick Hand', cursive; color: #b3202c; clip-path: inset(100% 0 0 0); animation: maskUp .5s steps(5) 4.3s forwards; }
      @keyframes maskUp { to { clip-path: inset(0 0 0 0); } }
      .arrow { position: absolute; overflow: visible; }
      .arrow path { fill: none; stroke: #ffffff; stroke-width: 9; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw .6s steps(6) 4.6s forwards; }
      @keyframes draw { to { stroke-dashoffset: 0; } }
      .pill { position: absolute; left: 50%; font-family: 'Anton', sans-serif; text-transform: uppercase; background: #111; color: #fff; border-radius: 999px; white-space: nowrap; transform: translateX(-50%) scale(0); animation: pillIn .3s steps(3) 1.2s forwards; }
      @keyframes pillIn { to { transform: translateX(-50%) scale(1); } }
    `,
    cssPortrait: `
      .book { width: 1014px; height: 1500px; margin-top: 420px; transform-origin: center top; }
      .page { padding: 80px 70px; display: flex; flex-direction: column; gap: 40px; }
      .kicker { font-size: 34px; }
      .before { font-size: 150px; }
      .after { font-size: 110px; margin-top: 60px; }
      .note { font-size: 58px; }
      .arrow { width: 240px; height: 200px; right: 90px; top: 220px; }
      .pill { bottom: 150px; font-size: 64px; padding: 18px 46px; z-index: 3; }
    `,
    cssLandscape: `
      .stage { justify-content: center; }
      .book { width: 1500px; height: 860px; }
      .page { padding: 70px 90px; display: flex; flex-direction: column; gap: 28px; }
      .kicker { font-size: 28px; }
      .before { font-size: 132px; }
      .after { font-size: 96px; margin-top: 30px; max-width: 1200px; }
      .note { font-size: 48px; }
      .arrow { width: 200px; height: 160px; right: 120px; top: 140px; }
      .pill { bottom: 44px; font-size: 52px; padding: 14px 40px; z-index: 3; }
    `,
    markup: `
      <div class="stage">
        <div class="book">
          <div class="page p2">
            <div class="after" data-slot="after"></div>
            <div class="note" data-slot="note"></div>
          </div>
          <div class="page p1">
            <div class="kicker" data-slot="kicker"></div>
            <div class="rule"></div>
            <div class="before" data-slot="before"></div>
          </div>
        </div>
        <svg class="arrow" viewBox="0 0 240 200" aria-hidden="true"><path pathLength="1" d="M 220 20 C 150 30 90 80 60 170 M 60 170 L 30 120 M 60 170 L 110 140"/></svg>
      </div>
      <div class="pill" data-slot="pill"></div>`,
  },

  // 4 ── halftone case file ──────────────────────────────────────────────────
  {
    id: "frame-story-halftone-case",
    name: "Story · Halftone Case File",
    role: "story / evidence",
    bestFor: "a case-file beat: the claim, the exhibit that proves it and the stamp of the verdict; investigations, 'the real reason…', myth-busting a brand story",
    why: "A retro print case file: cream archive paper with overprinted halftone dots, a heavy serif headline popping glyph by glyph with a misregistered pink shadow, an exhibit card whose thick navy outline boils at 10 fps, and a rubber stamp that slams with a page shake. Ported as a look from ghost-editor's halftone-dossier recipe, itself after LemoLab's MIT 'Halftone Dossier' (lemo-opuscar).",
    bg: "#f4ecdd",
    vars: {
      case_id: "HỒ SƠ SỐ 07",
      label: "Vì sao chiếc áo này cháy hàng?",
      headline: "Không phải vì giá rẻ",
      exhibit_label: "TANG VẬT A",
      exhibit_text: "73% đánh giá nhắc đến cùng một chữ: vừa người",
      stamp: "ĐÃ XÁC MINH",
      caption: "Số minh hoạ — thay bằng dữ liệu đánh giá của bạn",
    },
    slots: [
      ["case_id", "≤20", "HUD label, top left"],
      ["label", "≤44", "the question the file answers"],
      ["headline", "≤28", "the claim — pops in glyph by glyph"],
      ["exhibit_label", "≤16", "yellow tag on the exhibit card"],
      ["exhibit_text", "≤64", "the evidence"],
      ["stamp", "≤14", "the verdict stamp"],
      ["caption", "≤64", "navy caption bar — say where the number came from"],
    ],
    css: `
      #root { background: #f4ecdd; color: #1d2340; }
      #root::after { background-image: radial-gradient(#ff5a87 34%, transparent 36%), radial-gradient(#2e55d6 30%, transparent 32%); background-size: 22px 22px, 22px 22px; background-position: 0 0, 11px 11px;
                     -webkit-mask-image: radial-gradient(circle at 85% 12%, #000 0, transparent 34%), radial-gradient(circle at 8% 80%, #000 0, transparent 30%); mask-image: radial-gradient(circle at 85% 12%, #000 0, transparent 34%), radial-gradient(circle at 8% 80%, #000 0, transparent 30%);
                     opacity: .35; animation: drift 14s linear infinite; }
      @keyframes drift { from { transform: translate(0,0); } to { transform: translate(-44px,44px); } }
      .stage { animation: shake .28s steps(4) 3.1s; }
      @keyframes shake { 0% { transform: translate(0,0); } 25% { transform: translate(-10px,6px); } 50% { transform: translate(8px,-6px); } 75% { transform: translate(-5px,3px); } 100% { transform: translate(0,0); } }
      .hud { display: flex; justify-content: space-between; align-items: center; font-family: 'Roboto Mono', monospace; font-weight: 700; letter-spacing: .08em; }
      .hud .id { background: #1d2340; color: #f4ecdd; padding: 8px 18px; }
      .hud .rec { width: 22px; height: 22px; border-radius: 50%; background: #e8384f; animation: blink 1s steps(1) infinite; }
      @keyframes blink { 50% { opacity: .15; } }
      .label { font-weight: 800; color: #2e55d6; opacity: 0; animation: rise .5s var(--out) .3s forwards; }
      .headline { font-family: 'Playfair Display', serif; font-weight: 900; line-height: 1; text-shadow: 7px 7px 0 #ff5a87; }
      .headline .ch { display: inline-block; opacity: 0; animation: glyph .22s var(--spring) forwards; }
      @keyframes glyph { from { opacity: 0; transform: scale(1.8) rotate(-6deg); } to { opacity: 1; transform: none; } }
      .ex { position: relative; background: #fff4e2; opacity: 0; animation: exIn .5s var(--spring) 1.9s forwards; }
      @keyframes exIn { from { opacity: 0; transform: translateY(80px) rotate(4deg); } to { opacity: 1; transform: rotate(-1.5deg); } }
      .ex::before { content: ""; position: absolute; inset: -8px; border: 9px solid #1d2340; border-radius: 6px; animation: boil .3s steps(3) infinite; }
      @keyframes boil { 0% { transform: rotate(0deg); } 33% { transform: rotate(.5deg) translate(1px,-1px); } 66% { transform: rotate(-.4deg) translate(-1px,1px); } 100% { transform: rotate(0deg); } }
      .ex .tag { display: inline-block; background: #ffc628; color: #1d2340; font-family: 'Roboto Mono', monospace; font-weight: 700; }
      .ex .txt { font-weight: 800; line-height: 1.15; }
      .stamp { position: absolute; font-family: 'Anton', sans-serif; text-transform: uppercase; color: #e8384f; border: 10px solid #e8384f; border-radius: 14px; letter-spacing: .04em; opacity: 0; transform: rotate(-12deg) scale(2.6); animation: slam .26s cubic-bezier(.5,0,.75,0) 3s forwards; mix-blend-mode: multiply; }
      @keyframes slam { to { opacity: .92; transform: rotate(-12deg) scale(1); } }
      .bar { position: absolute; left: 0; right: 0; bottom: 0; background: #1d2340; color: #f4ecdd; font-weight: 700; transform: translateY(100%); animation: barUp .45s var(--out) .6s forwards; }
      @keyframes barUp { to { transform: none; } }
    `,
    cssPortrait: `
      .stage { padding: 110px 70px 0; gap: 44px; }
      .hud { font-size: 30px; }
      .label { font-size: 48px; margin-top: 60px; }
      .headline { font-size: 150px; }
      .ex { margin-top: 40px; padding: 50px 50px 60px; }
      .ex .tag { font-size: 30px; padding: 8px 18px; margin-bottom: 26px; }
      .ex .txt { font-size: 62px; }
      .stamp { right: 60px; top: 1320px; font-size: 96px; padding: 10px 36px; }
      .bar { padding: 46px 70px 120px; font-size: 36px; }
    `,
    cssLandscape: `
      .stage { padding: 70px 110px 0; display: grid; grid-template-columns: 1fr 760px; grid-template-rows: auto auto 1fr; column-gap: 70px; row-gap: 26px; }
      .hud { grid-column: 1 / span 2; font-size: 24px; }
      .label { grid-column: 1; font-size: 40px; margin-top: 20px; }
      .headline { grid-column: 1; grid-row: 3; font-size: 130px; }
      .ex { grid-column: 2; grid-row: 2 / span 2; align-self: start; margin-top: 20px; padding: 40px 44px 50px; }
      .ex .tag { font-size: 24px; padding: 6px 16px; margin-bottom: 20px; }
      .ex .txt { font-size: 50px; }
      .stamp { left: 140px; bottom: 170px; font-size: 80px; padding: 8px 30px; }
      .bar { padding: 30px 110px; font-size: 30px; }
    `,
    markup: `
      <div class="stage">
        <div class="hud"><span class="id" data-slot="case_id"></span><span class="rec"></span></div>
        <div class="label" data-slot="label"></div>
        <div class="headline" id="hl"></div>
        <div class="ex" data-slot-box>
          <div class="tag" data-slot="exhibit_label"></div>
          <div class="txt" data-slot="exhibit_text"></div>
        </div>
      </div>
      <div class="stamp" data-slot="stamp"></div>
      <div class="bar" data-slot="caption"></div>`,
    js: `
      (function () {
        const el = document.getElementById("hl");
        const end = typeInto(el, v.headline || "", 0.6, 0.06);
        el.querySelectorAll(".ch").forEach((c) => { if (c.textContent === " ") c.style.width = ".28em"; });
        return end;
      })();
    `,
  },

  // 5 ── comic panels ────────────────────────────────────────────────────────
  {
    id: "frame-story-comic-panels",
    name: "Story · Comic Panels",
    role: "story / three-beat sequence",
    bestFor: "a three-beat mini story — setup, problem, punchline — told as a comic strip; customer stories, 'a day when…', a funny before/after",
    why: "Three panels slam in one at a time, each with a caption box and a speech balloon, and the last one breaks with an onomatopoeia burst over speed lines. Comic and manga panels are a recurring storytelling ask in the 2026 Opus 5.5 survey (awesome-opus5-5-videos: 'comic book style', 'trace manga'); this is the version a narrator can fill with words alone.",
    bg: "#ffc628",
    vars: {
      caption_1: "8 giờ sáng",
      bubble_1: "Hôm nay mặc gì đây?",
      caption_2: "8 giờ 40",
      bubble_2: "Tủ đầy đồ mà chẳng có gì để mặc!",
      caption_3: "Rồi cô ấy mở app",
      bubble_3: "Phối sẵn 3 bộ trong 10 giây",
      sfx: "BÙM!",
    },
    slots: [
      ["caption_1", "≤20", "caption box, panel 1"],
      ["bubble_1", "≤36", "speech balloon, panel 1"],
      ["caption_2", "≤20", "caption box, panel 2"],
      ["bubble_2", "≤40", "speech balloon, panel 2"],
      ["caption_3", "≤24", "caption box, panel 3"],
      ["bubble_3", "≤40", "speech balloon, panel 3 — the punchline"],
      ["sfx", "≤8", "onomatopoeia burst on panel 3"],
    ],
    css: `
      #root { background: #ffc628; color: #111; }
      #root::after { background-image: radial-gradient(#e8384f 30%, transparent 33%); background-size: 26px 26px; opacity: .22; animation: drift 10s linear infinite; }
      @keyframes drift { from { transform: translate(0,0); } to { transform: translate(52px,26px); } }
      .grid { display: grid; height: 100%; }
      .pn { position: relative; background: #fffdf6; border: 9px solid #111; overflow: hidden; opacity: 0; animation: slam .45s var(--spring) forwards; }
      @keyframes slam { from { opacity: 0; transform: scale(1.18) rotate(-2deg); } to { opacity: 1; transform: scale(1) rotate(0deg); } }
      .pn:nth-child(1) { animation-delay: .2s; background: #fffdf6 radial-gradient(#d8e4ff 28%, transparent 30%) 0 0 / 18px 18px; }
      .pn:nth-child(2) { animation-delay: 1.5s; background: #fffdf6 radial-gradient(#ffd3dc 28%, transparent 30%) 0 0 / 18px 18px; }
      .pn:nth-child(3) { animation-delay: 2.8s; background: #fff2b8; }
      .speed { position: absolute; inset: -40%; background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(17,17,17,.13) 0 3deg, transparent 3deg 11deg); animation: spin 8s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .cap { position: absolute; left: 0; top: 0; background: #ffc628; border: 0 solid #111; border-right-width: 7px; border-bottom-width: 7px; font-weight: 800; text-transform: uppercase; letter-spacing: .02em; }
      .bub { position: absolute; background: #fff; border: 7px solid #111; border-radius: 50% / 46%; font-weight: 800; font-style: italic; line-height: 1.1; text-align: center; opacity: 0; animation: pop .4s var(--spring) forwards; }
      .bub::after { content: ""; position: absolute; width: 60px; height: 60px; background: #fff; border-right: 7px solid #111; border-bottom: 7px solid #111; transform: skewX(30deg) rotate(30deg); bottom: -30px; left: 26%; }
      .pn:nth-child(1) .bub { animation-delay: .6s; } .pn:nth-child(2) .bub { animation-delay: 1.9s; } .pn:nth-child(3) .bub { animation-delay: 3.2s; }
      .sfx { position: absolute; display: grid; place-items: center; background: #e8384f; clip-path: polygon(50% 0, 60% 30%, 95% 12%, 72% 42%, 100% 55%, 70% 64%, 84% 98%, 52% 74%, 22% 100%, 30% 66%, 0 60%, 26% 44%, 6% 12%, 40% 30%); transform: scale(0) rotate(-20deg); animation: burst .5s var(--spring) 3.7s forwards; }
      .sfx span { font-family: 'Anton', sans-serif; color: #ffc628; -webkit-text-stroke: 5px #111; paint-order: stroke fill; transform: rotate(-8deg); }
      @keyframes burst { to { transform: scale(1) rotate(-6deg); } }
    `,
    cssPortrait: `
      .stage { padding: 60px 50px; }
      .grid { grid-template-rows: 1fr 1fr 1.25fr; gap: 26px; }
      .cap { font-size: 34px; padding: 14px 24px; }
      .bub { font-size: 52px; padding: 40px 50px; left: 70px; right: 130px; top: 120px; }
      .pn:nth-child(2) .bub { left: 150px; right: 60px; }
      .pn:nth-child(3) .bub { top: auto; bottom: 90px; left: 60px; right: 280px; font-size: 56px; }
      .sfx { width: 400px; height: 380px; right: 10px; top: 40px; }
      .sfx span { font-size: 130px; }
    `,
    cssLandscape: `
      .stage { padding: 50px 60px; }
      .grid { grid-template-columns: 1fr 1fr 1.2fr; gap: 26px; }
      .cap { font-size: 28px; padding: 12px 20px; }
      .bub { font-size: 44px; padding: 36px 40px; left: 40px; right: 40px; top: 180px; }
      .pn:nth-child(3) .bub { top: auto; bottom: 110px; }
      .sfx { width: 360px; height: 340px; right: 10px; top: 60px; }
      .sfx span { font-size: 110px; }
    `,
    markup: `
      <div class="stage">
        <div class="grid">
          <div class="pn"><div class="cap" data-slot="caption_1"></div><div class="bub" data-slot="bubble_1"></div></div>
          <div class="pn"><div class="cap" data-slot="caption_2"></div><div class="bub" data-slot="bubble_2"></div></div>
          <div class="pn"><div class="speed"></div><div class="cap" data-slot="caption_3"></div><div class="bub" data-slot="bubble_3"></div><div class="sfx" data-slot-box><span data-slot="sfx"></span></div></div>
        </div>
      </div>`,
  },

  // 6 ── swiss grid chapter card ─────────────────────────────────────────────
  {
    id: "frame-story-swiss-chapter",
    name: "Story · Swiss Grid Chapter",
    role: "chapter card",
    bestFor: "opening a chapter of a longer story — 'Part 3: the turning point' — in a calm, exact, editorial register",
    why: "International Typographic Style in motion: a six-column grid builds itself, a giant numeral wipes up, the chapter title rises word by word out of clip rects flush left, and one red square — the story's protagonist, the only inexact thing allowed — breaks out of the grid. One precise ease, no fades. From ghost-editor's swiss-grid recipe, after LemoLab's MIT 'Swiss Motion Graphics' (lemo-opuscar).",
    bg: "#f2f0eb",
    vars: {
      section: "Câu chuyện thương hiệu",
      counter: "03 / 05",
      numeral: "03",
      title: "Ngày chúng tôi suýt đóng cửa",
      note: "Tháng 3 năm 2021. Còn đúng hai tháng tiền thuê.",
    },
    slots: [
      ["section", "≤28", "header label, top left"],
      ["counter", "≤8", "chapter counter, top right"],
      ["numeral", "≤3", "the giant chapter number"],
      ["title", "≤40", "chapter title; each word rises from its own clip rect"],
      ["note", "≤60", "one line of context under the title"],
    ],
    css: `
      #root { background: #f2f0eb; color: #111111; --ease: cubic-bezier(.7,0,.2,1); }
      #root::after { inset: 0; background: linear-gradient(180deg, transparent 0, transparent 49.8%, rgba(227,38,43,.35) 50%, transparent 50.2%); background-size: 100% 200%; opacity: .7; animation: scan 7s linear infinite; }
      @keyframes scan { from { background-position: 0 100%; } to { background-position: 0 -100%; } }
      .cols { position: absolute; inset: 0; display: grid; z-index: 0; }
      .cols i { border-left: 2px solid rgba(17,17,17,.12); transform-origin: top; transform: scaleY(0); animation: col .6s var(--ease) forwards; }
      .cols i:nth-child(2) { animation-delay: .06s; } .cols i:nth-child(3) { animation-delay: .12s; } .cols i:nth-child(4) { animation-delay: .18s; } .cols i:nth-child(5) { animation-delay: .24s; } .cols i:nth-child(6) { animation-delay: .3s; }
      @keyframes col { to { transform: scaleY(1); } }
      .head { display: flex; justify-content: space-between; font-weight: 700; border-bottom: 3px solid #111; clip-path: inset(0 100% 0 0); animation: wipeIn .5s var(--ease) .2s forwards; }
      .head .ct { font-family: 'Roboto Mono', monospace; }
      .num { font-weight: 900; line-height: .8; letter-spacing: -.06em; clip-path: inset(100% 0 0 0); animation: up .8s var(--ease) .5s forwards; }
      @keyframes up { to { clip-path: inset(0 0 0 0); } }
      .title { font-weight: 900; line-height: 1.02; letter-spacing: -.02em; display: flex; flex-wrap: wrap; }
      .wb { display: inline-block; overflow: hidden; padding-bottom: .08em; margin-right: .26em; }
      .wb span { display: inline-block; transform: translateY(110%); animation: wordUp .55s var(--ease) forwards; }
      @keyframes wordUp { to { transform: none; } }
      .note { font-weight: 500; color: #4a4a4a; border-top: 3px solid #111; clip-path: inset(0 100% 0 0); animation: wipeIn .6s var(--ease) 2.6s forwards; }
      .sq { position: absolute; background: #e3262b; animation: escape 1.1s var(--ease) 3.4s forwards; }
      @keyframes escape { to { transform: translate(var(--ex), var(--ey)) rotate(14deg); } }
    `,
    cssPortrait: `
      .cols { left: 72px; right: 72px; grid-template-columns: repeat(6, 1fr); }
      .stage { padding: 110px 72px 0; gap: 40px; }
      .head { font-size: 32px; padding-bottom: 16px; }
      .num { font-size: 560px; margin-top: 30px; }
      .title { font-size: 112px; }
      .note { font-size: 40px; padding-top: 22px; }
      .sq { width: 154px; height: 154px; right: 72px; top: 520px; --ex: 120px; --ey: -260px; }
    `,
    cssLandscape: `
      .cols { left: 100px; right: 100px; grid-template-columns: repeat(6, 1fr); }
      .stage { padding: 70px 100px 0; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto 1fr auto; column-gap: 60px; row-gap: 26px; }
      .head { grid-column: 1 / span 2; font-size: 26px; padding-bottom: 12px; }
      .num { grid-column: 1; grid-row: 2 / span 2; font-size: 600px; align-self: end; }
      .title { grid-column: 2; grid-row: 2; align-self: end; font-size: 100px; }
      .note { grid-column: 2; grid-row: 3; font-size: 34px; padding-top: 18px; margin-bottom: 90px; }
      .sq { width: 140px; height: 140px; right: 100px; top: 150px; --ex: 160px; --ey: -200px; }
    `,
    markup: `
      <div class="cols"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="stage">
        <div class="head"><span data-slot="section"></span><span class="ct" data-slot="counter"></span></div>
        <div class="num" data-slot="numeral"></div>
        <div class="title" id="title"></div>
        <div class="note" data-slot="note"></div>
      </div>
      <div class="sq"></div>`,
    js: `
      (function () {
        const box = document.getElementById("title");
        String(v.title || "").split(/\\s+/).filter(Boolean).forEach((w, i) => {
          const b = document.createElement("span"); b.className = "wb";
          const s = document.createElement("span"); s.textContent = w; s.style.animationDelay = (1.2 + i * 0.12).toFixed(2) + "s";
          b.appendChild(s); box.appendChild(b);
        });
      })();
    `,
  },

  // 7 ── step deck numeral ───────────────────────────────────────────────────
  {
    id: "frame-story-step-numeral",
    name: "Story · Step Deck Numeral",
    role: "step / lesson",
    bestFor: "a numbered step or lesson inside a story — 'lesson 2 we learned the hard way'; tips reels with a narrative spine",
    why: "A giant italic numeral fills the frame, then shrinks into its corner while the step lands word by word — each word sized by its weight, the key words bigger and electric blue. From ghost-editor's step-deck recipe (MIT, after a reel by @ant.lon), rebuilt for a narrated scene.",
    bg: "#14213d",
    vars: {
      label: "Bài học",
      number: "2",
      title: "Đừng bán chiếc áo, hãy bán buổi hẹn đầu tiên",
      accent: "buổi hẹn đầu tiên",
      detail: "Khách mua cảm giác họ sẽ có, không mua đường may.",
    },
    slots: [
      ["label", "≤16", "small word before the number"],
      ["number", "≤2", "the step number"],
      ["title", "≤52", "the step, split into words"],
      ["accent", "≤24", "words inside `title` set big and blue — verbatim"],
      ["detail", "≤64", "one supporting line"],
    ],
    css: `
      #root { background: #14213d; color: #f5f1e8; }
      #root::after { background: repeating-radial-gradient(circle at 80% 20%, rgba(245,241,232,.06) 0 2px, transparent 2px 60px); opacity: .8; animation: ring 12s linear infinite; }
      @keyframes ring { from { transform: rotate(0deg) scale(1); } to { transform: rotate(360deg) scale(1); } }
      .num { position: absolute; font-family: 'Playfair Display', serif; font-style: italic; font-weight: 900; line-height: .8; color: #f5f1e8; transform-origin: 0 0; animation: shrink 1.1s var(--snap) .6s both; }
      @keyframes shrink { from { transform: translate(var(--fx), var(--fy)) scale(var(--fs)); } to { transform: none; color: #2f6bff; } }
      .lab { position: absolute; font-family: 'Roboto Mono', monospace; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #9fb3d9; opacity: 0; animation: fade .4s 1.6s forwards; }
      .title { display: flex; flex-wrap: wrap; align-items: baseline; font-weight: 800; line-height: 1.02; letter-spacing: -.02em; }
      .w { display: inline-block; margin-right: .24em; opacity: 0; animation: land .38s var(--spring) forwards; }
      .w.hot { color: #2f6bff; font-weight: 900; font-size: 1.45em; }
      @keyframes land { from { opacity: 0; transform: translateY(-.6em) scale(1.3); } to { opacity: 1; transform: none; } }
      .detail { color: #c9d3e8; font-weight: 500; border-left: 8px solid #2f6bff; opacity: 0; animation: rise .6s var(--out) forwards; }
    `,
    cssPortrait: `
      .num { left: 70px; top: 150px; font-size: 300px; --fx: 120px; --fy: 250px; --fs: 4.2; }
      .lab { left: 260px; top: 230px; font-size: 34px; }
      .stage { padding: 560px 70px 0; gap: 60px; }
      .title { font-size: 96px; }
      .detail { font-size: 44px; padding-left: 30px; }
    `,
    cssLandscape: `
      .num { left: 110px; top: 110px; font-size: 300px; --fx: 520px; --fy: -40px; --fs: 3.4; }
      .lab { left: 300px; top: 180px; font-size: 28px; }
      .stage { padding: 160px 110px 0 560px; gap: 44px; justify-content: center; }
      .title { font-size: 84px; }
      .detail { font-size: 36px; padding-left: 26px; }
    `,
    markup: `
      <div class="num" data-slot="number"></div>
      <div class="lab" data-slot="label"></div>
      <div class="stage">
        <div class="title" id="title"></div>
        <div class="detail" data-slot="detail"></div>
      </div>`,
    js: `
      (function () {
        const box = document.getElementById("title");
        const words = String(v.title || "").split(/\\s+/).filter(Boolean);
        const acc = String(v.accent || "").toLowerCase().split(/\\s+/).filter(Boolean);
        const low = words.map((x) => x.toLowerCase().replace(/[.,!?…:;]+$/, ""));
        const hot = new Set();
        for (let i = 0; acc.length && i <= low.length - acc.length; i++) {
          if (acc.every((a, j) => low[i + j] === a.replace(/[.,!?…:;]+$/, ""))) acc.forEach((_, j) => hot.add(i + j));
        }
        words.forEach((w, i) => {
          const s = document.createElement("span");
          s.className = "w" + (hot.has(i) ? " hot" : "");
          s.textContent = w;
          s.style.animationDelay = (1.5 + i * 0.16).toFixed(2) + "s";
          box.appendChild(s);
        });
        const d = document.querySelector(".detail");
        if (d) d.style.animationDelay = (1.9 + words.length * 0.16).toFixed(2) + "s";
      })();
    `,
  },

  // 8 ── the letter ──────────────────────────────────────────────────────────
  {
    id: "frame-story-letter",
    name: "Story · The Letter",
    role: "story / emotional beat",
    bestFor: "a personal, emotional beat — a customer's thank-you, a founder's note, a love note, a 'dear me ten years ago'; Valentine's, Mother's Day, anniversary campaigns",
    why: "An envelope opens, a ruled letter slides out and writes itself in a hand, signed, with a postage stamp and a wax seal. The love-note story is one of the most-remixed narrative prompts in the 2026 Opus 5.5 survey (awesome-opus5-5-videos) because a letter is the one format everyone reads to the end.",
    bg: "#d9d4c7",
    vars: {
      date: "Hà Nội, 20/10",
      greeting: "Gửi mẹ,",
      body: "Chiếc áo đầu tiên con tự mua bằng tiền lương là ở cửa hàng nhỏ này. Mười năm rồi, con vẫn mặc.",
      signoff: "Con gái của mẹ",
      stamp_label: "20·10",
    },
    slots: [
      ["date", "≤24", "place and date, top right of the letter"],
      ["greeting", "≤20", "salutation, written first"],
      ["body", "≤140", "the letter, written out character by character"],
      ["signoff", "≤28", "signature"],
      ["stamp_label", "≤8", "text on the postage stamp"],
    ],
    css: `
      #root { background: #d9d4c7; color: #2b2622; }
      #root::after { inset: 0; background: linear-gradient(105deg, transparent 30%, rgba(255,240,200,.45) 45%, transparent 60%); background-size: 300% 100%; opacity: .7; animation: leak 9s ease-in-out infinite; }
      @keyframes leak { 0% { background-position: 100% 0; } 50% { background-position: 0 0; } 100% { background-position: 100% 0; } }
      .stage { align-items: center; justify-content: flex-end; }
      .env { position: absolute; left: 50%; transform: translateX(-50%); background: #c9a36b; border-radius: 6px; z-index: 3; box-shadow: 0 30px 70px rgba(43,38,34,.3); animation: envDown .8s var(--out) 1.6s forwards; }
      .env::before { content: ""; position: absolute; inset: 0; background: linear-gradient(32deg, transparent 49.6%, #b48f58 50%, transparent 50.4%), linear-gradient(-32deg, transparent 49.6%, #b48f58 50%, transparent 50.4%); }
      @keyframes envDown { to { transform: translate(-50%, 260%); } }
      .flap { position: absolute; left: 0; right: 0; top: 0; height: 60%; background: #b8925a; clip-path: polygon(0 0, 100% 0, 50% 100%); transform-origin: top; animation: flap .6s var(--out) .4s forwards; }
      @keyframes flap { to { transform: rotateX(180deg); } }
      .letter { position: absolute; left: 50%; background: #fbf7ee repeating-linear-gradient(180deg, transparent 0 var(--lh), rgba(70,110,160,.22) var(--lh) calc(var(--lh) + 2px)); box-shadow: 0 30px 80px rgba(43,38,34,.25); border-radius: 4px; transform: translate(-50%, 70%) scale(.86); z-index: 2; animation: out 1s var(--out) 1s forwards; }
      @keyframes out { to { transform: translate(-50%, 0) scale(1) rotate(-1deg); } }
      .date { font-family: 'Roboto Mono', monospace; color: #7a6e62; }
      .hand { font-family: 'Patrick Hand', cursive; color: #1f3a66; line-height: var(--lh); }
      .hand .ch { opacity: 0; animation: fade .01s linear forwards; }
      .greet { font-size: 1.5em; }
      .sign { text-align: right; }
      .stampx { position: absolute; display: grid; place-items: center; background: #b3202c; color: #fbf7ee; font-family: 'Roboto Mono', monospace; font-weight: 700;
                -webkit-mask: radial-gradient(circle 7px at 7px 7px, transparent 98%, #000) -7px -7px / 22px 22px; mask: radial-gradient(circle 7px at 7px 7px, transparent 98%, #000) -7px -7px / 22px 22px;
                transform: rotate(6deg); opacity: 0; animation: fade .3s 1.9s forwards; }
      .seal { position: absolute; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #d2433f, #8f1c22 70%); box-shadow: 0 6px 0 #6d1418; transform: scale(0); animation: sealIn .45s var(--spring) forwards; }
      @keyframes sealIn { to { transform: scale(1) rotate(-14deg); } }
    `,
    cssPortrait: `
      .env { width: 900px; height: 560px; bottom: 260px; }
      .letter { --lh: 84px; width: 940px; top: 300px; min-height: 1240px; padding: 90px 70px 110px; font-size: 58px; }
      .date { font-size: 30px; margin-bottom: 50px; padding-right: 220px; }
      .greet { font-size: 100px; margin-bottom: 20px; }
      .stampx { width: 170px; height: 200px; right: 50px; top: 50px; font-size: 36px; }
      .seal { width: 150px; height: 150px; left: 70px; bottom: -40px; }
    `,
    cssLandscape: `
      .env { width: 1100px; height: 520px; bottom: 60px; }
      .letter { --lh: 70px; width: 1240px; top: 60px; min-height: 930px; padding: 60px 90px 80px; font-size: 50px; }
      .date { font-size: 24px; margin-bottom: 14px; padding-right: 200px; }
      .greet { font-size: 88px; margin-bottom: 10px; }
      .stampx { width: 150px; height: 176px; right: 70px; top: auto; bottom: 70px; font-size: 30px; }
      .seal { width: 130px; height: 130px; left: 60px; bottom: -30px; }
    `,
    markup: `
      <div class="stage">
        <div class="letter">
          <div class="stampx" data-slot-box><span data-slot="stamp_label"></span></div>
          <div class="date" data-slot="date"></div>
          <div class="hand greet" id="g"></div>
          <div class="hand" id="b"></div>
          <div class="hand sign" id="s"></div>
          <div class="seal" id="seal"></div>
        </div>
        <div class="env"><div class="flap"></div></div>
      </div>`,
    js: `
      (function () {
        // Finished by ~4.3s, so a 5–6 s scene holds the whole letter on screen before it cuts.
        let t = typeInto(document.getElementById("g"), v.greeting || "", 1.6, 0.04);
        const body = String(v.body || "");
        const step = Math.min(0.03, 1.8 / Math.max(1, body.length));
        t = typeInto(document.getElementById("b"), body, t + 0.15, step);
        t = typeInto(document.getElementById("s"), v.signoff || "", t + 0.2, 0.035);
        document.getElementById("seal").style.animationDelay = (t + 0.2).toFixed(2) + "s";
      })();
    `,
  },
];
