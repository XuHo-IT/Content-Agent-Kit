// slot-limits.mjs — measure how many characters each text slot actually holds.
//
//   node scripts/video/slot-limits.mjs --template frame-morgue-tag
//   node scripts/video/slot-limits.mjs --template a,b,c --md      # CATALOG.md table rows
//   node scripts/video/slot-limits.mjs                            # every template (slow)
//
// WHY. Every `limit` column in video-templates/CATALOG.md was written by eye. An eyeballed
// limit is wrong in the direction that hurts: too generous, and the caller writes a headline
// that silently clips or shoves the footer off the canvas — and clipping is invisible in the
// render log, so it ships. The numbers this prints are measured against the real composition,
// with the real fonts loaded, at the real canvas size.
//
// HOW. Headless Chrome opens the composition, waits for webfonts (a limit measured against a
// fallback font is a different number), then for each slot binary-searches the longest
// Vietnamese filler that still FITS. Two rules decide that, and the limit is whichever binds
// first:
//
//   clip   — the element scrolls inside itself, leaves a clipping ancestor, or pushes the
//            canvas past its own height.
//   lines  — the element takes more line boxes than the composition was designed around,
//            plus one of slack.
//
// The second rule exists because the first one alone is far too generous. Measured on
// frame-morgue-tag, a 400-character STAMP "fits": the card simply grows and the canvas has
// the room. Nobody would ship it. The shipped sample copy is the statement of intent about
// how many lines each element gets, so that is what the measurement holds it to.
//
// Reported per slot is the SMALLER of the two aspects: one number that is safe in both.
//
// ENV: CHROME_PATH (optional), VIDEO_TEMPLATES_DIR (optional). Needs Chrome. No ffmpeg.
import fs from "node:fs";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { run, pLimit } from "./lib/proc.mjs";
import { templatesDir, listTemplateIds } from "./lib/paths.mjs";
import { findChrome } from "../media/lib/chrome.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log(
    `slot-limits.mjs — measure the character capacity of every text slot\n` +
      `  --template <id[,id]>  measure these instead of all templates\n` +
      `  --aspect <a>          9:16 or 16:9 only (default: both, report the smaller)\n` +
      `  --md                  print CATALOG.md table rows instead of a plain list\n` +
      `  --max <n>             upper bound of the search (default 400)\n` +
      `env: CHROME_PATH, VIDEO_TEMPLATES_DIR. Needs Chrome.`,
  );
  process.exit(0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const asMd = argv.includes("--md");
const MAX = Number(flag("--max", 400));

const ENTRIES = [
  { file: "compositions/portrait.html", w: 1080, h: 1920, aspect: "9:16" },
  { file: "index.html", w: 1920, h: 1080, aspect: "16:9" },
];

/**
 * Measured with Vietnamese, on purpose. Diacritics are what decide whether a line wraps: they
 * add no width but they do add line-height pressure, and a limit measured with ASCII lets a
 * headline through that stacks an extra row once the tone marks arrive.
 */
const FILLER =
  "Người đàn ông ấy rời khỏi căn nhà lúc nửa đêm và không ai còn trông thấy anh ta thêm lần nào nữa " +
  "trong suốt bốn mươi năm sau đó dù cảnh sát đã lục soát khắp khu rừng phía bắc thị trấn nhiều lần ";

const PROBE = (maxLen) => `<script>
(function () {
  var FILLER = ${JSON.stringify(FILLER)};
  var MAX = ${maxLen};
  var root = document.getElementById("root") || document.body;

  function text(n) {
    var s = "";
    while (s.length < n) s += FILLER;
    return s.slice(0, n);
  }
  // Line boxes, however the element is displayed. An inline span reports its own line count
  // through getClientRects(); a block has to be derived from its height.
  function lines(el) {
    var cs = getComputedStyle(el);
    if (cs.display.indexOf("inline") === 0 && cs.display !== "inline-block") {
      return Math.max(1, el.getClientRects().length);
    }
    var lh = parseFloat(cs.lineHeight);
    if (!isFinite(lh) || lh <= 0) lh = parseFloat(cs.fontSize) * 1.2;
    if (!isFinite(lh) || lh <= 0) return 1;
    return Math.max(1, Math.round(el.scrollHeight / lh));
  }

  // A box fits when it does not scroll inside itself, stays within every ancestor that clips,
  // does not push the canvas past its own height, and has not outgrown its line budget.
  // Checking only the page misses the common case: a caption clipped by its own
  // overflow:hidden panel while the page itself never scrolls.
  function fits(el, budget, base) {
    // clientHeight/clientWidth are 0 on a non-replaced INLINE element, so comparing them to
    // scrollHeight reports overflow for every inline slot at every length — four slots
    // measured as 0 before this guard. The line budget covers those instead.
    // Only an element that CLIPS can hide its own content. With overflow:visible the text
    // spills but stays readable, and scrollHeight there just reports decorations — an
    // absolutely-positioned ::after bar, a rotated stamp — as if they were lost text. Four
    // slots measured as 0 on that alone.
    var cs0 = getComputedStyle(el);
    if (cs0.overflow !== "visible") {
      // 3px, not 1: sub-pixel line-height rounding leaves a composition sitting ~2px over its
      // own canvas at rest, and a 1px tolerance turns that into "nothing fits anywhere".
      if (el.scrollHeight > el.clientHeight + 3) return "self-scroll";
      if (el.scrollWidth > el.clientWidth + 3) return "self-scroll";
    }
    if (root.scrollHeight > base.h + 3) return "canvas-grew";
    // Horizontal too. A flex item with flex:none grows past the canvas without ever making
    // the page taller, so the vertical check alone let it run to the search ceiling.
    if (root.scrollWidth > base.w + 3) return "canvas-wide";
    if (lines(el) > budget) return "lines";
    // A rotated element's bounding box sticks out past its parent BY DESIGN — a stamp pressed
    // at -7° is supposed to overhang. Containment is meaningless there, so it is skipped and
    // the line budget carries the slot instead. Without this, every stamp measured as ≤0.
    var turned = false;
    for (var q = el; q && q !== root; q = q.parentElement) {
      if (getComputedStyle(q).transform !== "none") { turned = true; break; }
    }
    if (turned) return "";
    // An element already sitting outside its box with the SHIPPED copy cannot be judged by
    // containment — it fails at one character just as it fails at four hundred, which reports
    // a layout quirk as a limit of zero. Deterioration is caught by the canvas rules instead.
    if (el.__preOut) return "";
    var r = el.getBoundingClientRect();
    var p = el.parentElement;
    while (p) {
      var cs = getComputedStyle(p);
      if (cs.overflow !== "visible" || p === root) {
        var pr = p.getBoundingClientRect();
        if (r.bottom > pr.bottom + 3 || r.top < pr.top - 3) return "clip-v";
        if (r.right > pr.right + 3 || r.left < pr.left - 3) return "clip-h";
      }
      if (p === root) break;
      p = p.parentElement;
    }
    return "";
  }

  function measure() {
    var out = {};
    var names = {};
    var els = document.querySelectorAll("[data-slot]");
    for (var i = 0; i < els.length; i++) names[els[i].getAttribute("data-slot")] = 1;

    // Read the design's own intent BEFORE touching anything: the shipped sample copy is what
    // says how many lines each element was drawn to hold.
    var budget = {}, original = {};
    Object.keys(names).forEach(function (slot) {
      var t = document.querySelectorAll('[data-slot="' + slot + '"]');
      var most = 1;
      for (var i2 = 0; i2 < t.length; i2++) {
        original[slot] = t[i2].textContent;
        most = Math.max(most, lines(t[i2]));
      }
      budget[slot] = most + 1; // one line of slack over what shipped
    });
    // Record who is already out of bounds before anything is touched.
    for (var z = 0; z < els.length; z++) {
      var e0 = els[z], r0 = e0.getBoundingClientRect(), out0 = false;
      for (var p0 = e0.parentElement; p0; p0 = p0.parentElement) {
        var c0 = getComputedStyle(p0);
        if (c0.overflow !== "visible" || p0 === root) {
          var q0 = p0.getBoundingClientRect();
          if (r0.bottom > q0.bottom + 3 || r0.top < q0.top - 3 ||
              r0.right > q0.right + 3 || r0.left < q0.left - 3) { out0 = true; break; }
        }
        if (p0 === root) break;
      }
      e0.__preOut = out0;
    }
    var base = { h: root.scrollHeight, w: root.scrollWidth };

    Object.keys(names).forEach(function (slot) {
      var targets = document.querySelectorAll('[data-slot="' + slot + '"]');
      // Binary search the largest length where EVERY element bound to this slot still fits.
      // Several elements can share one slot; the tightest of them is the real limit.
      var lo = 1, hi = MAX, best = 0, why = "";
      while (lo <= hi) {
        var mid = (lo + hi) >> 1;
        var t = text(mid), bound = "";
        for (var j = 0; j < targets.length; j++) targets[j].textContent = t;
        // Force layout once per probe rather than per element.
        void root.offsetHeight;
        for (var k = 0; k < targets.length; k++) {
          bound = fits(targets[k], budget[slot], base);
          if (bound) break;
        }
        if (!bound) { best = mid; lo = mid + 1; } else { why = bound; hi = mid - 1; }
      }
      // Which rule stopped it. A slot reported as 0 is almost always a layout fault rather
      // than a tight limit, and the rule name is what tells the two apart.
      out[slot] = { n: best, why: best >= MAX ? "unbounded" : why };
      // Restore the shipped copy: measuring one slot must not change the layout the next slot
      // is measured in.
      for (var m = 0; m < targets.length; m++) targets[m].textContent = original[slot];
      void root.offsetHeight;
    });

    var pre = document.createElement("pre");
    pre.id = "__limits";
    pre.textContent = JSON.stringify(out);
    document.documentElement.appendChild(pre);
  }

  // Webfonts change every one of these numbers. Measuring before they land reports the
  // fallback font's capacity, which is a different — and usually larger — answer.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  else measure();
})();
</script>`;

/** The renderer's variable channel does not exist in a plain browser; serve the samples. */
const SHIM = `<script>
window.__hyperframes = { getVariables: function () {
  var el = document.querySelector("[data-composition-variables]");
  try { return el ? JSON.parse(el.getAttribute("data-composition-variables")) : {}; }
  catch (e) { return {}; }
} };
</script>`;

async function measureOne(chrome, tplDir, id, entry, scratch) {
  const src = fs.readFileSync(path.join(tplDir, id, entry.file), "utf8");
  const tag = `${id}-${entry.aspect.replace(":", "x")}`;
  const copy = path.join(scratch, tag);
  fs.cpSync(path.join(tplDir, id), copy, { recursive: true });

  // SHIM before the template's own script so slots are populated the way a render sees them;
  // PROBE at the very end so it runs after that script has removed empty elements.
  let html = src.includes("<head>") ? src.replace("<head>", `<head>${SHIM}`) : SHIM + src;
  html = html.includes("</body>") ? html.replace("</body>", `${PROBE(MAX)}</body>`) : html + PROBE(MAX);
  const file = path.join(copy, entry.file.replace(/\.html$/, ".limits.html"));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html, "utf8");

  const profile = await mkdtemp(path.join(scratch, "prof-"));
  const dom = await run(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--force-device-scale-factor=1",
    `--user-data-dir=${profile}`,
    `--window-size=${entry.w},${entry.h}`,
    "--virtual-time-budget=9000",
    "--dump-dom",
    `file:///${path.resolve(file).replace(/\\/g, "/")}`,
  ]);
  const m = dom.match(/<pre id="__limits">([\s\S]*?)<\/pre>/);
  if (!m) throw new Error(`${tag}: probe produced no result (fonts never settled?)`);
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
}

try {
  const chrome = findChrome();
  const tplDir = templatesDir();
  const wantAspect = flag("--aspect");
  const only = flag("--template");
  let ids = listTemplateIds();
  if (only) {
    const want = only.split(",").filter(Boolean);
    const bad = want.filter((w) => !ids.includes(w));
    if (bad.length) throw new Error(`Unknown template(s): ${bad.join(", ")}`);
    ids = want;
  }

  const scratch = await mkdtemp(path.join(tmpdir(), "cak-limits-"));
  const limit = pLimit(3);
  const results = {};
  try {
    await Promise.all(
      ids.flatMap((id) =>
        ENTRIES.filter((e) => !wantAspect || e.aspect === wantAspect)
          .filter((e) => fs.existsSync(path.join(tplDir, id, e.file)))
          .map((e) =>
            limit(async () => {
              const got = await measureOne(chrome, tplDir, id, e, scratch);
              results[id] = results[id] || {};
              for (const [k, v] of Object.entries(got)) {
                // Smaller of the two aspects: one number the caller can trust either way.
                const prev = results[id][k];
                results[id][k] = prev == null || v.n < prev.n ? v : prev;
              }
            }),
          ),
      ),
    );
  } finally {
    await rm(scratch, { recursive: true, force: true }).catch(() => {});
  }

  for (const id of ids) {
    const r = results[id];
    if (!r) continue;
    console.log(asMd ? `\n### ${id}\n` : `\n${id}`);
    if (asMd) console.log("| slot | type | limit | notes |\n| --- | --- | --- | --- |");
    for (const k of Object.keys(r).sort()) {
      const { n, why } = r[k];
      // A slot that cannot hold a usable phrase is a layout bug, not a tight limit, and one
      // that never binds means the search never found an edge — both need the rule name.
      const warn = n < 6 ? `  ← ${why}: layout fault, not a limit` : why === "unbounded" ? "  ← never bound" : ` (${why})`;
      console.log(asMd ? `| \`${k}\` | string | ≤${n} | |` : `  ${k.padEnd(22)} ≤${n}${warn}`);
    }
  }
  console.log(`\n[limits] measured ${Object.keys(results).length} template(s) with real fonts`);
} catch (e) {
  console.error(`[limits] ✗ ${e.message}`);
  process.exit(1);
}
