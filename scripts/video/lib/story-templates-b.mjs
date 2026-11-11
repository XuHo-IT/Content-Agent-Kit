// story-templates-b.mjs — storytelling scene templates, part B (emitted by build-story-templates.mjs).
// Same rules as part A; see the header there.

export const STORY_TEMPLATES_B = [
  // 9 ── sand animation ──────────────────────────────────────────────────────
  {
    id: "frame-story-sand",
    name: "Story · Sand Animation",
    role: "story / memory or history",
    bestFor: "history and memory — 'back in 1998…', a heritage brand, a craft passed down; anything told as a remembered past",
    why: "Sand on a lit glass table: a finger sweep brushes the sand away to reveal the words as light, a landscape draws itself in the glow, grains drift. Sand animation telling a long history is a standout storytelling prompt in the 2026 Opus 5.5 survey (awesome-opus5-5-videos: '250 years of history in sand').",
    bg: "#2b1d10",
    vars: {
      era: "Năm 1998",
      line: "Bà tôi may chiếc áo dài đầu tiên dưới ánh đèn dầu",
      sub: "Từ một chiếc máy khâu cũ, ở phố Hàng Gai",
    },
    slots: [
      ["era", "≤16", "the year or era — brushed in first"],
      ["line", "≤56", "the memory — revealed by a finger sweep"],
      ["sub", "≤48", "one line of detail"],
    ],
    css: `
      #root { background: radial-gradient(ellipse 78% 60% at 50% 48%, #f3cb8a 0, #e0a95a 40%, #a8692e 70%, #3a2715 100%); color: #fff3d6; }
      #root::after { background-image: radial-gradient(rgba(43,29,16,.55) 1px, transparent 1.6px), radial-gradient(rgba(43,29,16,.35) 1.4px, transparent 2px); background-size: 6px 6px, 11px 13px; opacity: .9; animation: grains 3s steps(6) infinite; }
      @keyframes grains { 0% { transform: translate(0,0); } 33% { transform: translate(2px,-3px); } 66% { transform: translate(-3px,1px); } 100% { transform: translate(0,0); } }
      .sand { position: absolute; inset: 0; background: #3a2715; -webkit-mask-image: radial-gradient(ellipse 80% 62% at 50% 48%, transparent 0, transparent 70%, #000 100%); mask-image: radial-gradient(ellipse 80% 62% at 50% 48%, transparent 0, transparent 70%, #000 100%); opacity: .9; z-index: 0; }
      .stage { justify-content: center; align-items: center; text-align: center; }
      .brush { -webkit-mask-image: linear-gradient(90deg, #000 0, #000 40%, transparent 60%); mask-image: linear-gradient(90deg, #000 0, #000 40%, transparent 60%); -webkit-mask-size: 300% 100%; mask-size: 300% 100%; -webkit-mask-position: 100% 0; mask-position: 100% 0; animation: sweep 1.6s cubic-bezier(.4,0,.2,1) forwards; }
      @keyframes sweep { to { -webkit-mask-position: 0 0; mask-position: 0 0; } }
      .era { font-family: 'Roboto Mono', monospace; font-weight: 700; letter-spacing: .14em; color: #2b1d10; animation-delay: .3s; }
      .line { font-family: 'Playfair Display', serif; font-weight: 900; line-height: 1.06; color: #2b1d10; animation-delay: 1.1s; }
      .sub { font-weight: 700; color: #2b1d10; animation-delay: 3.4s; }
      .scape { overflow: visible; }
      .scape path { fill: none; stroke: #2b1d10; stroke-width: 6; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 2s var(--out) 2.4s forwards; }
      .scape circle { fill: none; stroke: #2b1d10; stroke-width: 6; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 1.2s var(--out) 2.2s forwards; }
      @keyframes draw { to { stroke-dashoffset: 0; } }
      .finger { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(255,243,214,.55), transparent 70%); opacity: 0; animation: fingerMove 1.6s cubic-bezier(.4,0,.2,1) 1.1s; }
      @keyframes fingerMove { 0% { opacity: .9; transform: translateX(-60vw); } 100% { opacity: 0; transform: translateX(40vw); } }
    `,
    cssPortrait: `
      .stage { padding: 0 80px; gap: 50px; }
      .era { font-size: 44px; }
      .line { font-size: 108px; }
      .scape { width: 900px; height: 300px; }
      .sub { font-size: 44px; }
      .finger { width: 260px; height: 260px; left: 50%; top: 820px; }
    `,
    cssLandscape: `
      .stage { padding: 0 200px; gap: 30px; }
      .era { font-size: 36px; }
      .line { font-size: 92px; }
      .scape { width: 1100px; height: 200px; }
      .sub { font-size: 36px; }
      .finger { width: 220px; height: 220px; left: 50%; top: 360px; }
    `,
    markup: `
      <div class="sand"></div>
      <div class="finger"></div>
      <div class="stage">
        <div class="era brush" data-slot="era"></div>
        <div class="line brush" data-slot="line"></div>
        <svg class="scape" viewBox="0 0 900 300" preserveAspectRatio="none" aria-hidden="true">
          <circle pathLength="1" cx="700" cy="90" r="56"/>
          <path pathLength="1" vector-effect="non-scaling-stroke" d="M 0 250 C 120 160 220 160 320 220 C 400 120 520 110 620 210 C 700 170 800 180 900 240"/>
          <path pathLength="1" vector-effect="non-scaling-stroke" d="M 60 290 C 260 260 640 260 860 290"/>
        </svg>
        <div class="sub brush" data-slot="sub"></div>
      </div>`,
  },

  // 10 ── telestrator ────────────────────────────────────────────────────────
  {
    id: "frame-story-telestrator",
    name: "Story · Telestrator Breakdown",
    role: "analysis / replay",
    bestFor: "breaking down the decisive moment — 'look at what happened here'; a competitor's move, the line that sold out a drop, the mistake in a campaign",
    why: "A TV sports-analysis segment: a yellow slanted wipe onto a dark tactics board, the bug flips from LIVE to ANALYSIS on a white freeze flash, a marker ring draws around the key words, an arrow pulls in a label card, and a matchup bar names the two sides. From ghost-editor's telestrator recipe, after LemoLab's MIT 'Sports Telestrator' (lemo-opuscar). The bug's words are slots — set them in your language.",
    bg: "#0c1411",
    vars: {
      bug: "TRỰC TIẾP",
      bug_2: "PHÂN TÍCH",
      side_a: "Shop A",
      side_b: "Shop B",
      clock: "00:17",
      statement: "Cùng một chiếc váy, cùng một giá. Chỉ khác",
      key: "ảnh mặc thử thật",
      label: "CTR gấp 3 lần (minh hoạ)",
    },
    slots: [
      ["bug", "≤12", "corner bug before the freeze"],
      ["bug_2", "≤12", "corner bug after the freeze"],
      ["side_a", "≤14", "matchup bar, left side"],
      ["side_b", "≤14", "matchup bar, right side"],
      ["clock", "≤8", "source clock, top right"],
      ["statement", "≤56", "the play being analysed"],
      ["key", "≤28", "the words the marker rings"],
      ["label", "≤32", "the finding on the label card — label demo numbers as such"],
    ],
    css: `
      #root { background: #0c1411; color: #f2f4ee; }
      #root::after { inset: 0; background-image: linear-gradient(rgba(242,244,238,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(242,244,238,.06) 2px, transparent 2px); background-size: 60px 60px; opacity: 1; animation: pan 12s linear infinite; }
      @keyframes pan { from { background-position: 0 0; } to { background-position: 60px 60px; } }
      .wipe { position: absolute; top: -20%; bottom: -20%; width: 60%; background: #ffd400; transform: translateX(-140%) skewX(-18deg); animation: swipe .7s cubic-bezier(.7,0,.3,1) forwards; z-index: 5; }
      @keyframes swipe { to { transform: translateX(260%) skewX(-18deg); } }
      .flash { position: absolute; inset: 0; background: #fff; opacity: 0; animation: flash .35s ease-out 2.2s; z-index: 4; pointer-events: none; }
      @keyframes flash { 0% { opacity: .85; } 100% { opacity: 0; } }
      .top { display: flex; justify-content: space-between; align-items: center; font-family: 'Roboto Mono', monospace; font-weight: 700; }
      .bug { position: relative; display: inline-grid; background: #e8384f; color: #fff; letter-spacing: .08em; }
      .bug span { grid-area: 1 / 1; }
      .bug .b1 { animation: out .01s 2.2s forwards; }
      .bug .b2 { opacity: 0; animation: fade .01s 2.2s forwards; }
      .bug.has2 { animation: bugBg .01s 2.2s forwards; }
      @keyframes bugBg { to { background: #ffd400; color: #0c1411; } }
      @keyframes out { to { opacity: 0; } }
      .clock { color: #9fb2a8; }
      .match { display: flex; align-items: stretch; font-weight: 800; text-transform: uppercase; opacity: 0; animation: rise .5s var(--out) .6s forwards; }
      .match .a { background: #f2f4ee; color: #0c1411; } .match .b { background: #2e55d6; color: #fff; }
      .match .vs { background: #ffd400; color: #0c1411; font-family: 'Roboto Mono', monospace; display: grid; place-items: center; }
      .statement { font-weight: 900; line-height: 1.04; letter-spacing: -.02em; opacity: 0; animation: rise .6s var(--out) .9s forwards; }
      .keyw { position: relative; display: inline-block; white-space: nowrap; font-weight: 900; color: #ffd400; opacity: 0; animation: fade .3s 1.4s forwards; }
      .ring { position: absolute; left: -8%; top: -22%; width: 116%; height: 144%; overflow: visible; }
      .ring ellipse { fill: none; stroke: #ffd400; stroke-width: 7; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw .7s var(--out) 2.5s forwards; }
      .arr { overflow: visible; }
      .arr path { fill: none; stroke: #f2f4ee; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw .5s var(--out) 3.2s forwards; }
      @keyframes draw { to { stroke-dashoffset: 0; } }
      .card { display: inline-block; background: #ffd400; color: #0c1411; font-weight: 900; transform: scale(0) rotate(-4deg); animation: cardIn .45s var(--spring) 3.6s forwards; }
      @keyframes cardIn { to { transform: scale(1) rotate(-2deg); } }
      .zone { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(232,56,79,.35), transparent 70%); animation: pulse 2.4s ease-in-out infinite; z-index: 0; }
      @keyframes pulse { 0%, 100% { transform: scale(1); opacity: .6; } 50% { transform: scale(1.15); opacity: 1; } }
    `,
    cssPortrait: `
      .stage { padding: 90px 64px 0; gap: 40px; }
      .top { font-size: 30px; }
      .bug { padding: 10px 22px; }
      .match { font-size: 34px; height: 76px; }
      .match .a, .match .b { flex: 1; display: grid; place-items: center; }
      .match .vs { width: 90px; font-size: 28px; }
      .statement { font-size: 98px; margin-top: 160px; }
      .keyw { font-size: 92px; margin: 30px 0 0 30px; }
      .arr { width: 300px; height: 200px; margin: 40px 0 0 300px; }
      .card { font-size: 52px; padding: 26px 36px; }
      .zone { width: 900px; height: 900px; left: 90px; top: 700px; }
    `,
    cssLandscape: `
      .stage { padding: 56px 110px 0; gap: 26px; }
      .top { font-size: 24px; }
      .bug { padding: 8px 18px; }
      .match { font-size: 28px; height: 60px; width: 900px; }
      .match .a, .match .b { flex: 1; display: grid; place-items: center; }
      .match .vs { width: 76px; font-size: 22px; }
      .statement { font-size: 84px; margin-top: 30px; max-width: 1500px; }
      .keyw { font-size: 96px; }
      .arr { position: absolute; width: 240px; height: 160px; left: 860px; top: 650px; }
      .card { position: absolute; left: 1120px; top: 780px; font-size: 46px; padding: 22px 32px; }
      .zone { width: 800px; height: 800px; left: 0; top: 300px; }
    `,
    markup: `
      <div class="zone"></div>
      <div class="stage">
        <div class="top"><span class="bug" id="bug"><span class="b1" data-slot="bug"></span><span class="b2" data-slot="bug_2"></span></span><span class="clock" data-slot="clock"></span></div>
        <div class="match" data-slot-box><span class="a" data-slot="side_a"></span><span class="vs" id="vs"></span><span class="b" data-slot="side_b"></span></div>
        <div class="statement" data-slot="statement"></div>
        <div data-slot-box><span class="keyw"><span data-slot="key"></span><svg class="ring" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><ellipse pathLength="1" vector-effect="non-scaling-stroke" cx="50" cy="50" rx="48" ry="44"/></svg></span></div>
        <svg class="arr" viewBox="0 0 300 200" aria-hidden="true"><path pathLength="1" d="M 280 190 C 240 80 160 30 30 20 M 30 20 L 80 0 M 30 20 L 70 60"/></svg>
        <div data-slot-box><span class="card" data-slot="label"></span></div>
      </div>
      <div class="flash"></div>
      <div class="wipe"></div>`,
    js: `
      (function () {
        const vs = document.getElementById("vs");
        if (vs) vs.textContent = "vs";
        const bug = document.getElementById("bug");
        if (bug && has("bug_2")) bug.classList.add("has2");
      })();
    `,
  },

  // 11 ── pencil chart ───────────────────────────────────────────────────────
  {
    id: "frame-story-pencil-chart",
    name: "Story · Pencil-Drawn Chart",
    role: "data / proof inside a story",
    bestFor: "the one number that carries the story, drawn rather than displayed — growth over four periods, before/after, four options compared",
    why: "A chart draws itself on cream paper under a red-blue pencil: axes first, then each bar outlined and hatched, then a handwritten note pinned to the tallest mark, with a figure caption that names the source. Bar heights are computed from the numbers. From ghost-editor's data-story recipe, after LemoLab's MIT 'Data Storytelling' (lemo-opuscar) — including its rule that a chart with no verified number says so.",
    bg: "#f5efe2",
    vars: {
      title: "Doanh thu tăng khi chúng tôi ngừng giảm giá",
      label_1: "Q1", value_1: "120",
      label_2: "Q2", value_2: "135",
      label_3: "Q3", value_3: "210",
      label_4: "Q4", value_4: "290",
      unit: "tr",
      note: "bỏ flash sale từ đây",
      figure: "HÌNH 1 · SỐ MINH HOẠ — THAY BẰNG SỐ LIỆU THẬT",
    },
    slots: [
      ["title", "≤52", "what the chart proves, as a sentence"],
      ["label_1", "≤8", "bar 1 label"], ["value_1", "number", "bar 1 value (digits; drawn to scale)"],
      ["label_2", "≤8", "bar 2 label"], ["value_2", "number", "bar 2 value"],
      ["label_3", "≤8", "bar 3 label (optional)"], ["value_3", "number", "bar 3 value (optional)"],
      ["label_4", "≤8", "bar 4 label (optional)"], ["value_4", "number", "bar 4 value (optional)"],
      ["unit", "≤6", "unit shown after each value"],
      ["note", "≤28", "handwritten note pinned to the tallest bar"],
      ["figure", "≤64", "figure caption with the source — say if the numbers are illustrative"],
    ],
    css: `
      #root { background: #f5efe2; color: #22201c; }
      #root::after { background-image: repeating-linear-gradient(0deg, rgba(47,95,179,.07) 0 2px, transparent 2px 46px); opacity: 1; animation: paper 20s linear infinite; }
      @keyframes paper { from { transform: translateY(0); } to { transform: translateY(46px); } }
      .title { font-family: 'Playfair Display', serif; font-weight: 900; line-height: 1.05; opacity: 0; animation: rise .6s var(--out) .2s forwards; }
      .chart { position: relative; flex: none; }
      .axis { position: absolute; background: #2f5fb3; border-radius: 3px; }
      .ax-y { left: 0; bottom: 0; width: 6px; height: 100%; transform-origin: bottom; transform: scaleY(0); animation: gy .6s var(--out) .7s forwards; }
      .ax-x { left: 0; bottom: 0; height: 6px; width: 100%; transform-origin: left; transform: scaleX(0); animation: gx .6s var(--out) 1s forwards; }
      @keyframes gy { to { transform: scaleY(1); } } @keyframes gx { to { transform: scaleX(1); } }
      .bars { position: absolute; left: 40px; right: 20px; bottom: 6px; top: 0; display: flex; align-items: flex-end; gap: 6%; }
      .b { position: relative; flex: 1; height: 0; }
      .b svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .b rect { fill: none; stroke: #c8372d; stroke-width: 5; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw .7s var(--out) forwards; }
      @keyframes draw { to { stroke-dashoffset: 0; } }
      .hatch { position: absolute; inset: 6px; background: repeating-linear-gradient(-45deg, rgba(47,95,179,.55) 0 4px, transparent 4px 16px); clip-path: inset(100% 0 0 0); animation: fill .6s var(--out) forwards; }
      @keyframes fill { to { clip-path: inset(0 0 0 0); } }
      .val { position: absolute; left: 50%; bottom: 100%; transform: translateX(-50%); margin-bottom: 10px; font-family: 'Patrick Hand', cursive; color: #c8372d; white-space: nowrap; opacity: 0; animation: fade .3s forwards; }
      .lb { position: absolute; left: 50%; top: 100%; transform: translateX(-50%); margin-top: 16px; font-family: 'Roboto Mono', monospace; font-weight: 700; color: #2f5fb3; white-space: nowrap; }
      .note { position: absolute; font-family: 'Patrick Hand', cursive; color: #c8372d; white-space: nowrap; opacity: 0; transform: rotate(-4deg); animation: fade .5s 3.6s forwards; }
      .noteArr { position: absolute; overflow: visible; }
      .noteArr path { fill: none; stroke: #c8372d; stroke-width: 5; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw .5s var(--out) 3.4s forwards; }
      .fig { border-top: 2px solid #22201c; opacity: 0; animation: fade .5s 1.2s forwards; }
      .fig .k { font-family: 'Roboto Mono', monospace; font-weight: 700; letter-spacing: .06em; color: #6b655b; }
    `,
    cssPortrait: `
      .stage { padding: 140px 70px 0; gap: 60px; }
      .title { font-size: 92px; }
      .chart { width: 940px; height: 860px; margin-top: 70px; }
      .val { font-size: 56px; }
      .lb { font-size: 34px; }
      .note { font-size: 56px; }
      .noteArr { width: 150px; height: 110px; }
      .fig { margin-top: 70px; padding-top: 22px; }
      .fig .k { font-size: 26px; }
    `,
    cssLandscape: `
      .stage { padding: 70px 120px 0; display: grid; grid-template-columns: 640px 1fr; grid-template-rows: 1fr auto; column-gap: 90px; }
      .title { grid-column: 1; align-self: center; font-size: 80px; }
      .chart { grid-column: 2; width: 1000px; height: 700px; margin-top: 60px; }
      .val { font-size: 46px; }
      .lb { font-size: 28px; }
      .note { font-size: 46px; }
      .noteArr { width: 130px; height: 90px; }
      .fig { grid-column: 1 / span 2; margin-top: 70px; padding-top: 16px; }
      .fig .k { font-size: 22px; }
    `,
    markup: `
      <div class="stage">
        <div class="title" data-slot="title"></div>
        <div class="chart" id="chart">
          <div class="axis ax-y"></div><div class="axis ax-x"></div>
          <div class="bars" id="bars"></div>
        </div>
        <div class="fig"><div class="k" data-slot="figure"></div></div>
      </div>`,
    js: `
      (function () {
        const bars = document.getElementById("bars");
        const items = [];
        for (let i = 1; i <= 4; i++) {
          const n = parseFloat(String(v["value_" + i] ?? "").replace(/[^0-9.\\-]/g, ""));
          if (!Number.isFinite(n)) continue;
          items.push({ n, raw: String(v["value_" + i]), label: has("label_" + i) ? String(v["label_" + i]) : "" });
        }
        const max = Math.max(1, ...items.map((x) => x.n));
        let top = null;
        items.forEach((it, k) => {
          const b = document.createElement("div"); b.className = "b";
          b.style.height = Math.max(4, (it.n / max) * 82) + "%";
          const d = 1.3 + k * 0.45;
          b.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><rect pathLength="1" vector-effect="non-scaling-stroke" x="0" y="0" width="100" height="100"/></svg><div class="hatch"></div><div class="val"></div><div class="lb"></div>';
          b.querySelector("rect").style.animationDelay = d.toFixed(2) + "s";
          b.querySelector(".hatch").style.animationDelay = (d + 0.45).toFixed(2) + "s";
          const val = b.querySelector(".val"); val.textContent = it.raw + (has("unit") ? " " + v.unit : ""); val.style.animationDelay = (d + 0.6).toFixed(2) + "s";
          b.querySelector(".lb").textContent = it.label;
          bars.appendChild(b);
          if (!top || it.n >= top.n) top = { n: it.n, el: b };
        });
        if (top && has("note")) {
          const chart = document.getElementById("chart");
          const P = document.getElementById("root").classList.contains("P");
          const note = document.createElement("div"); note.className = "note"; note.textContent = v.note;
          const arr = document.createElementNS("http://www.w3.org/2000/svg", "svg"); arr.setAttribute("class", "noteArr"); arr.setAttribute("viewBox", "0 0 150 110");
          arr.innerHTML = '<path pathLength="1" d="M 10 10 C 60 10 110 40 140 100 M 140 100 L 110 90 M 140 100 L 142 70"/>';
          chart.appendChild(note); chart.appendChild(arr);
          // Pinned above-left of the tallest bar; the bar is the last child when values rise.
          const idx = [...bars.children].indexOf(top.el), n = bars.children.length;
          const leftPct = ((idx + 0.5) / n) * 100;
          note.style.left = "calc(" + leftPct + "% - " + (P ? 470 : 420) + "px)";
          note.style.top = (P ? -10 : -40) + "px";
          arr.style.left = "calc(" + leftPct + "% - " + (P ? 160 : 140) + "px)";
          arr.style.top = (P ? 60 : 20) + "px";
        }
      })();
    `,
  },

  // 12 ── story around a vase ────────────────────────────────────────────────
  {
    id: "frame-story-frieze",
    name: "Story · Painted Frieze",
    role: "story / four-part saga",
    bestFor: "a story in four chapters told like a legend — the founding myth of a brand, the history of a product, a fable with a moral",
    why: "The story is painted around a terracotta vase that turns: four panels pass across the front one at a time, each holding still long enough to read, between meander borders, with cylinder shading selling the turn. From the 2026 Opus 5.5 survey (awesome-opus5-5-videos: 'tell the Trojan Horse story painted around an ancient Greek vase') — a frame that makes any four-beat story feel like a legend.",
    bg: "#15110e",
    vars: {
      title: "Huyền thoại chiếc túi cói",
      chapter_1: "Một làng nghề sắp mất",
      chapter_2: "Hai chị em mang túi lên phố",
      chapter_3: "Một bức ảnh lan khắp mạng",
      chapter_4: "Làng nghề có đơn đến tận năm sau",
    },
    slots: [
      ["title", "≤36", "the legend's title, above the vase"],
      ["chapter_1", "≤36", "panel I"],
      ["chapter_2", "≤36", "panel II"],
      ["chapter_3", "≤36", "panel III"],
      ["chapter_4", "≤36", "panel IV — the ending"],
    ],
    css: `
      #root { background: #15110e; color: #f1e6d2; }
      #root::after { background: radial-gradient(ellipse at 50% 60%, rgba(200,100,60,.18), transparent 60%); opacity: 1; animation: breathe 5s ease-in-out infinite; }
      @keyframes breathe { 0%, 100% { transform: scale(1); opacity: .7; } 50% { transform: scale(1.08); opacity: 1; } }
      .stage { align-items: center; }
      .title { font-family: 'Playfair Display', serif; font-weight: 900; font-style: italic; text-align: center; line-height: 1.04; opacity: 0; animation: rise .7s var(--out) .2s forwards; }
      .vase { position: relative; flex: none; background: #c8643c; clip-path: polygon(38% 0, 62% 0, 60% 6%, 66% 12%, 86% 24%, 96% 40%, 96% 62%, 86% 80%, 66% 92%, 64% 96%, 70% 100%, 30% 100%, 36% 96%, 34% 92%, 14% 80%, 4% 62%, 4% 40%, 14% 24%, 34% 12%, 40% 6%); opacity: 0; animation: fade .6s .1s forwards; }
      .band { position: absolute; left: 0; right: 0; overflow: hidden; }
      .key { position: absolute; left: 0; right: 0; height: 26px; background: repeating-linear-gradient(90deg, #15110e 0 26px, transparent 26px 34px, #15110e 34px 44px, transparent 44px 52px); }
      .key.t { top: 0; } .key.b { bottom: 0; }
      .strip { position: absolute; top: 26px; bottom: 26px; left: 0; display: flex; animation: turn 6.4s cubic-bezier(.65,0,.35,1) .4s both; }
      .panel { flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #15110e; }
      .panel b { font-family: 'Playfair Display', serif; font-weight: 900; line-height: 1; }
      .panel span { font-weight: 800; line-height: 1.12; }
      .shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(21,17,14,.85) 0, rgba(21,17,14,.25) 18%, rgba(255,230,200,.12) 46%, rgba(21,17,14,.25) 80%, rgba(21,17,14,.85) 100%); pointer-events: none; }
    `,
    cssPortrait: `
      .stage { padding: 150px 60px 0; gap: 50px; }
      .title { font-size: 100px; }
      .vase { width: 960px; height: 1300px; }
      .band { top: 440px; height: 520px; }
      .panel { width: 960px; padding: 0 160px; gap: 20px; }
      .panel b { font-size: 120px; }
      .panel span { font-size: 62px; }
      @keyframes turn { 0%, 14% { transform: translateX(0); } 24%, 38% { transform: translateX(-960px); } 48%, 62% { transform: translateX(-1920px); } 72%, 100% { transform: translateX(-2880px); } }
    `,
    cssLandscape: `
      .stage { padding: 40px 100px 0; display: grid; grid-template-columns: 1fr 760px; align-items: center; column-gap: 60px; }
      .title { font-size: 96px; text-align: left; }
      .vase { width: 660px; height: 900px; margin-top: 40px; }
      .band { top: 300px; height: 360px; }
      .panel { width: 660px; padding: 0 110px; gap: 14px; }
      .panel b { font-size: 96px; }
      .panel span { font-size: 50px; }
      @keyframes turn { 0%, 14% { transform: translateX(0); } 24%, 38% { transform: translateX(-660px); } 48%, 62% { transform: translateX(-1320px); } 72%, 100% { transform: translateX(-1980px); } }
    `,
    markup: `
      <div class="stage">
        <div class="title" data-slot="title"></div>
        <div class="vase">
          <div class="band"><div class="key t"></div><div class="strip" id="strip"></div><div class="key b"></div></div>
          <div class="shade"></div>
        </div>
      </div>`,
    js: `
      (function () {
        const strip = document.getElementById("strip");
        const ROMAN = ["I", "II", "III", "IV"];
        let k = 0;
        for (let i = 1; i <= 4; i++) {
          if (!has("chapter_" + i)) continue;
          const p = document.createElement("div"); p.className = "panel";
          const b = document.createElement("b"); b.textContent = ROMAN[k++];
          const s = document.createElement("span"); s.textContent = v["chapter_" + i];
          p.appendChild(b); p.appendChild(s); strip.appendChild(p);
        }
      })();
    `,
  },

  // 13 ── silent film intertitle ─────────────────────────────────────────────
  {
    id: "frame-story-silent-film",
    name: "Story · Silent Film Intertitle",
    role: "story / chapter or dialogue card",
    bestFor: "a dramatic or comic turn read as a silent-film intertitle — 'Meanwhile, in the warehouse…'; nostalgia, 'how it used to be' beats, a pause before the twist",
    why: "An iris opens onto an ornate intertitle card: sepia, flicker, gate weave on the border, film scratches running down. The silent short where 'sound tells half the story' is a recurring storytelling prompt in the 2026 Opus 5.5 survey (awesome-opus5-5-videos), and the intertitle is its most reusable device — pair it with a sting SFX.",
    bg: "#0d0b09",
    vars: {
      chapter: "Chương II",
      title: "Trong khi đó, ở kho hàng…",
      sub: "ba nghìn đơn đang chờ được gói",
    },
    slots: [
      ["chapter", "≤16", "small line above"],
      ["title", "≤40", "the intertitle"],
      ["sub", "≤40", "smaller line below"],
    ],
    css: `
      #root { background: #0d0b09; color: #ebe1c8; }
      #root::after { inset: 0; background-image: linear-gradient(90deg, transparent 0 31%, rgba(235,225,200,.18) 31.1%, transparent 31.3%, transparent 72%, rgba(235,225,200,.12) 72.1%, transparent 72.2%), radial-gradient(rgba(235,225,200,.08) 1px, transparent 1.5px); background-size: 100% 100%, 5px 5px; opacity: .9; z-index: 4; animation: scratch .4s steps(3) infinite; }
      @keyframes scratch { 0% { transform: translateX(0); } 33% { transform: translateX(-120px); } 66% { transform: translateX(80px); } 100% { transform: translateX(0); } }
      .stage { justify-content: center; align-items: center; clip-path: circle(0% at 50% 50%); animation: iris 1s cubic-bezier(.6,0,.3,1) .1s forwards; filter: sepia(.35); }
      @keyframes iris { to { clip-path: circle(80% at 50% 50%); } }
      .frame { position: absolute; border: 6px solid #ebe1c8; border-radius: 10px; animation: weave .5s steps(2) infinite; }
      .frame::before { content: ""; position: absolute; inset: 14px; border: 2px solid #ebe1c8; border-radius: 6px; }
      .frame::after { content: ""; position: absolute; inset: -22px; background: radial-gradient(circle at 0 0, #ebe1c8 9px, transparent 10px), radial-gradient(circle at 100% 0, #ebe1c8 9px, transparent 10px), radial-gradient(circle at 0 100%, #ebe1c8 9px, transparent 10px), radial-gradient(circle at 100% 100%, #ebe1c8 9px, transparent 10px); }
      @keyframes weave { 0% { transform: translate(0,0); } 50% { transform: translate(1px,-2px); } 100% { transform: translate(0,0); } }
      .flick { position: absolute; inset: 0; background: #000; pointer-events: none; z-index: 3; animation: flicker .9s steps(1) infinite; opacity: 0; }
      @keyframes flicker { 0% { opacity: .0; } 20% { opacity: .12; } 40% { opacity: .03; } 60% { opacity: .16; } 80% { opacity: .05; } }
      .chapter { font-family: 'Playfair Display', serif; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; opacity: 0; animation: fade .5s 1s forwards; }
      .title { font-family: 'Playfair Display', serif; font-style: italic; font-weight: 700; line-height: 1.12; text-align: center; opacity: 0; animation: fade .7s 1.3s forwards; }
      .rule { height: 2px; background: #ebe1c8; transform: scaleX(0); animation: grow .7s var(--out) 1.6s forwards; }
      @keyframes grow { to { transform: scaleX(1); } }
      .sub { font-family: 'Playfair Display', serif; font-weight: 400; font-style: italic; opacity: 0; animation: fade .6s 2.2s forwards; }
      .vig { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,.75) 100%); pointer-events: none; z-index: 2; }
    `,
    cssPortrait: `
      .frame { left: 70px; right: 70px; top: 420px; bottom: 420px; }
      .stage { padding: 0 150px; gap: 50px; }
      .chapter { font-size: 40px; }
      .title { font-size: 108px; }
      .rule { width: 420px; }
      .sub { font-size: 50px; text-align: center; }
    `,
    cssLandscape: `
      .frame { left: 260px; right: 260px; top: 90px; bottom: 90px; }
      .stage { padding: 0 360px; gap: 36px; }
      .chapter { font-size: 34px; }
      .title { font-size: 96px; }
      .rule { width: 380px; }
      .sub { font-size: 42px; }
    `,
    markup: `
      <div class="stage">
        <div class="frame"></div>
        <div class="chapter" data-slot="chapter"></div>
        <div class="title" data-slot="title"></div>
        <div class="rule"></div>
        <div class="sub" data-slot="sub"></div>
      </div>
      <div class="vig"></div>
      <div class="flick"></div>`,
  },

  // 14 ── kinetic spoken word: build the floor ───────────────────────────────
  {
    id: "frame-story-kinetic-floor",
    name: "Story · Kinetic Floor",
    role: "climax / manifesto",
    bestFor: "the climax line of a story — the declaration everything before it was building to; brand manifestos, the last beat before the CTA",
    why: "Each line drops in as a slab and becomes a floor; the stack squashes as it lands; the final word falls last and stands on everything said before it. After the 'BUILD THE FLOOR' kinetic spoken-word prompts in the 2026 Opus 5.5 survey (awesome-opus5-5-videos: 'the final declaration must stand on something the earlier lines built').",
    bg: "#f1eee6",
    vars: {
      line_1: "Mỗi đường may",
      line_2: "mỗi lần đổi trả miễn phí",
      line_3: "mỗi tin nhắn trả lời lúc nửa đêm",
      line_4: "",
      final: "Niềm tin.",
    },
    slots: [
      ["line_1", "≤28", "bottom slab — the first thing said"],
      ["line_2", "≤32", "second slab"],
      ["line_3", "≤36", "third slab (optional)"],
      ["line_4", "≤36", "fourth slab (optional)"],
      ["final", "≤14", "the word that lands on top"],
    ],
    css: `
      #root { background: #f1eee6; color: #141414; }
      #root::after { background-image: radial-gradient(rgba(20,20,20,.18) 1.5px, transparent 2px); background-size: 90px 110px; opacity: .45; animation: dust 11s linear infinite; }
      @keyframes dust { from { transform: translateY(0); } to { transform: translateY(110px); } }
      .stage { justify-content: flex-end; align-items: center; }
      .stack { display: flex; flex-direction: column-reverse; align-items: center; }
      .slab { background: #141414; color: #f1eee6; font-weight: 900; text-transform: uppercase; letter-spacing: -.01em; line-height: 1.04; text-align: center; max-width: 100%; opacity: 0; transform-origin: bottom; animation: drop .62s var(--spring) forwards; }
      .slab:nth-child(even) { background: #e5322d; }
      @keyframes drop { 0% { opacity: 1; transform: translateY(-1600px); } 100% { opacity: 1; transform: none; } }
      .final { font-weight: 900; color: #e5322d; letter-spacing: -.04em; line-height: .9; opacity: 0; transform-origin: bottom; animation: drop .7s var(--spring) forwards, settle .5s ease-out forwards; }
      @keyframes settle { 0% { scale: 1 1; } 30% { scale: 1.12 .82; } 100% { scale: 1 1; } }
      .ground { width: 100%; background: #141414; }
    `,
    cssPortrait: `
      .stage { padding: 0 40px; }
      .slab { font-size: 70px; padding: 26px 40px; }
      .final { font-size: 200px; margin-bottom: 4px; }
      .ground { height: 220px; }
    `,
    cssLandscape: `
      .stage { padding: 0 80px; }
      .slab { font-size: 60px; padding: 18px 40px; }
      .final { font-size: 170px; margin-bottom: 2px; }
      .ground { height: 90px; }
    `,
    markup: `
      <div class="stage">
        <div class="stack" id="stack"></div>
        <div class="ground"></div>
      </div>`,
    js: `
      (function () {
        const stack = document.getElementById("stack");
        let k = 0;
        for (let i = 1; i <= 4; i++) {
          if (!has("line_" + i)) continue;
          const s = document.createElement("div"); s.className = "slab"; s.textContent = v["line_" + i];
          s.style.animationDelay = (0.3 + k * 0.75).toFixed(2) + "s";
          // narrow the slabs as they rise, so the stack reads as a structure
          s.style.marginTop = "6px";
          stack.appendChild(s); k++;
        }
        if (has("final")) {
          const f = document.createElement("div"); f.className = "final"; f.textContent = v.final;
          const d = 0.5 + k * 0.75;
          f.style.animationDelay = d.toFixed(2) + "s, " + (d + 0.5).toFixed(2) + "s";
          stack.appendChild(f);
        }
      })();
    `,
  },

  // 15 ── news rundown ───────────────────────────────────────────────────────
  {
    id: "frame-story-rundown",
    name: "Story · News Rundown",
    role: "map of the story / progress",
    bestFor: "telling the viewer where the story is — the rundown at the start, then again mid-video with the covered points ticked off; series, multi-part explainers, weekly recaps",
    why: "A one-story news segment's rundown: a split-flap title flips into place, the points are listed, the ones already covered strike through and tick, and the current one lights up with a lemon bar. From ghost-editor's news-package recipe, after LemoLab's MIT 'Broadcast News Package' (lemo-opuscar). Reuse it twice in a video — once to promise, once to show progress.",
    bg: "#121417",
    vars: {
      tag: "BẢN TIN THỜI TRANG",
      title: "HÔM NAY",
      item_1: "Vì sao áo linen cháy hàng",
      item_2: "Ba lỗi khi chụp ảnh sản phẩm",
      item_3: "Mẫu nào sẽ hot mùa thu",
      item_4: "",
      current: "2",
    },
    slots: [
      ["tag", "≤24", "lemon category tab"],
      ["title", "≤12", "split-flap title (each letter flips)"],
      ["item_1", "≤36", "rundown point 1"],
      ["item_2", "≤36", "rundown point 2"],
      ["item_3", "≤36", "rundown point 3 (optional)"],
      ["item_4", "≤36", "rundown point 4 (optional)"],
      ["current", "1–4", "the point being covered now; earlier ones are ticked off"],
    ],
    css: `
      #root { background: #121417; color: #f3f1ea; }
      #root::after { background: repeating-linear-gradient(180deg, rgba(243,241,234,.035) 0 2px, transparent 2px 6px); opacity: 1; animation: lines 4s linear infinite; }
      @keyframes lines { from { transform: translateY(0); } to { transform: translateY(60px); } }
      .tag { display: inline-block; background: #f4e04d; color: #121417; font-weight: 900; letter-spacing: .06em; clip-path: inset(0 100% 0 0); animation: wipeIn .4s var(--snap) .1s forwards; }
      .flap { display: flex; gap: 10px; }
      .tile { position: relative; display: grid; place-items: center; background: #23272d; color: #f3f1ea; font-family: 'Roboto Mono', monospace; font-weight: 700; border-radius: 8px; overflow: hidden; perspective: 400px; }
      .tile::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 3px; background: #121417; }
      .tile span { display: block; transform-origin: 50% 50%; animation: flip .5s steps(5) forwards; transform: rotateX(90deg); }
      @keyframes flip { 0% { transform: rotateX(90deg); } 100% { transform: rotateX(0deg); } }
      .list { display: flex; flex-direction: column; }
      .it { position: relative; display: flex; align-items: center; font-weight: 800; border-bottom: 2px solid #2c3036; opacity: 0; animation: rise .45s var(--out) forwards; }
      .it .n { flex: none; font-family: 'Roboto Mono', monospace; color: #8a9099; }
      .it .tx { position: relative; }
      .it.done .tx { color: #8a9099; }
      .it.done .tx::after { content: ""; position: absolute; left: 0; right: 0; top: 52%; height: 6px; background: #f4e04d; transform-origin: left; transform: scaleX(0); animation: strike .4s var(--out) forwards; animation-delay: inherit; }
      @keyframes strike { to { transform: scaleX(1); } }
      .it .ck { flex: none; margin-left: auto; border-radius: 50%; background: #f4e04d; color: #121417; display: grid; place-items: center; font-weight: 900; transform: scale(0); animation: pop .4s var(--spring) forwards; }
      .it.now { color: #121417; }
      .it.now::before { content: ""; position: absolute; inset: 0; background: #f4e04d; z-index: -1; transform-origin: left; transform: scaleX(0); animation: strike .5s var(--snap) forwards; animation-delay: inherit; }
      .it.now .n { color: #121417; }
    `,
    cssPortrait: `
      .stage { padding: 200px 70px 0; gap: 56px; }
      .tag { font-size: 34px; padding: 14px 26px; align-self: flex-start; }
      .tile { width: 118px; height: 160px; font-size: 104px; }
      .list { gap: 0; margin-top: 50px; }
      .it { font-size: 56px; padding: 40px 30px; gap: 34px; }
      .it .n { font-size: 40px; }
      .it .ck { width: 64px; height: 64px; font-size: 38px; }
    `,
    cssLandscape: `
      .stage { padding: 80px 140px 0; gap: 34px; }
      .tag { font-size: 28px; padding: 12px 22px; align-self: flex-start; }
      .tile { width: 100px; height: 136px; font-size: 90px; }
      .list { gap: 0; margin-top: 20px; max-width: 1400px; }
      .it { font-size: 46px; padding: 24px 26px; gap: 30px; }
      .it .n { font-size: 32px; }
      .it .ck { width: 54px; height: 54px; font-size: 32px; }
    `,
    markup: `
      <div class="stage">
        <div data-slot-box><span class="tag" data-slot="tag"></span></div>
        <div class="flap" id="flap"></div>
        <div class="list" id="list"></div>
      </div>`,
    js: `
      (function () {
        const flap = document.getElementById("flap");
        [...String(v.title || "")].forEach((ch, i) => {
          const t = document.createElement("div"); t.className = "tile";
          const s = document.createElement("span"); s.textContent = ch === " " ? "\\u00a0" : ch;
          s.style.animationDelay = (0.3 + i * 0.09).toFixed(2) + "s";
          t.appendChild(s); flap.appendChild(t);
        });
        const list = document.getElementById("list");
        const cur = parseInt(String(v.current || "0"), 10) || 0;
        let k = 0;
        for (let i = 1; i <= 4; i++) {
          if (!has("item_" + i)) continue;
          k++;
          const it = document.createElement("div");
          it.className = "it" + (k < cur ? " done" : k === cur ? " now" : "");
          const d = 1.0 + k * 0.25;
          it.style.animationDelay = d.toFixed(2) + "s";
          it.innerHTML = '<span class="n"></span><span class="tx"></span>';
          it.querySelector(".n").textContent = String(k).padStart(2, "0");
          it.querySelector(".tx").textContent = v["item_" + i];
          it.querySelector(".tx").style.animationDelay = (d + 1.2).toFixed(2) + "s";
          if (k < cur) {
            const ck = document.createElement("span"); ck.className = "ck"; ck.textContent = "✓";
            ck.style.animationDelay = (d + 1.5).toFixed(2) + "s";
            it.appendChild(ck);
          }
          if (k === cur) it.style.animationDelay = d.toFixed(2) + "s";
          list.appendChild(it);
        }
        // the lemon bar for "now" waits until the earlier items are struck
        const now = list.querySelector(".now");
        if (now) now.style.animationDelay = (1.0 + cur * 0.25) + "s";
      })();
    `,
  },
];
