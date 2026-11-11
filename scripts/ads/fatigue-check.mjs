#!/usr/bin/env node
// fatigue-check.mjs — find ads that are wearing out, from an Ads Manager CSV export.
//
//   node scripts/ads/fatigue-check.mjs export.csv
//   node scripts/ads/fatigue-check.mjs export.csv --json            # machine-readable
//   node scripts/ads/fatigue-check.mjs export.csv --min-impressions 3000 --freq 3
//
// INPUT. Ads Manager → Reports → breakdown by Day, one row per ad per day. Vietnamese or
// English column headers both work, as do "1.234,5" and "1,234.5" and "₫"/"VND" marks.
// Needed: day, ad name, impressions, and either link clicks or CTR. Spend, reach, frequency
// and results/purchases are used when present.
//
// WHAT "FATIGUE" MEANS HERE — each signal compares the ad's RECENT window (last 3 days with
// data) with its OWN baseline (first 3 days), never with another ad:
//   · frequency at or above --freq (default 3.0 for prospecting) — the same people again
//   · CTR down ≥ 25% from baseline — the hook has stopped stopping them
//   · CPM up ≥ 30% — the auction charges more to reach the same pool
//   · cost per result up ≥ 30% — only when results exist in both windows
// Two or more signals = FATIGUED (refresh now); one = WATCH. An ad below the sample floor in
// either window is NOT_ENOUGH_DATA, whatever its numbers — that is the point of a floor.
//
// No network, no env, no writes: it reads one file and prints.
import { parseCsv, findColumn, parseNumber, parseDate, readText, args, isMain } from "./lib/common.mjs";

export const DEFAULTS = {
  window: 3, // days in baseline and in recent window
  minImpressions: 2000, // per window — below this a CTR difference is noise
  minClicks: 20, // per window, for CTR comparisons
  freq: 3.0,
  ctrDrop: 0.25,
  cpmRise: 0.3,
  cprRise: 0.3,
};

const COLS = {
  day: ["ngay", "day", "date", "ngay bat dau bao cao", "reporting starts", "bat dau bao cao"],
  ad: ["ten quang cao", "ad name", "quang cao", "ad"],
  impressions: ["luot hien thi", "impressions", "so lan hien thi"],
  reach: ["nguoi tiep can", "luot tiep can", "reach"],
  frequency: ["tan suat", "frequency"],
  clicks: ["luot click vao lien ket", "link clicks", "luot nhap vao lien ket", "clicks (all)", "luot click (tat ca)", "clicks"],
  ctr: ["ctr (ty le click vao lien ket)", "ctr (link click-through rate)", "ctr (tat ca)", "ctr (all)", "ctr"],
  spend: ["so tien da chi tieu", "amount spent", "chi tieu", "spend", "so tien chi tieu"],
  results: ["ket qua", "results", "luot mua", "purchases", "mua hang"],
};

/** Map an export's rows onto {day, ad, impressions, reach, frequency, clicks, spend, results}. */
export function normaliseRows(rows) {
  if (!rows.length) return { rows: [], missing: ["(empty file)"], columns: {} };
  const headers = Object.keys(rows[0]);
  const columns = Object.fromEntries(Object.entries(COLS).map(([k, al]) => [k, findColumn(headers, al)]));
  const missing = ["day", "ad", "impressions"].filter((k) => !columns[k]);
  if (!columns.clicks && !columns.ctr) missing.push("clicks|ctr");
  const out = rows.map((r) => {
    const g = (k) => (columns[k] ? r[columns[k]] : undefined);
    const impressions = parseNumber(g("impressions"));
    let clicks = parseNumber(g("clicks"));
    if (clicks === null && columns.ctr && impressions) {
      const ctr = parseNumber(g("ctr"));
      if (ctr !== null) clicks = (ctr / 100) * impressions;
    }
    return {
      day: parseDate(g("day")),
      ad: String(g("ad") ?? "").trim(),
      impressions,
      reach: parseNumber(g("reach")),
      frequency: parseNumber(g("frequency")),
      clicks,
      spend: parseNumber(g("spend")),
      results: parseNumber(g("results")),
    };
  });
  return { rows: out.filter((r) => r.ad && r.day && r.impressions !== null), missing, columns };
}

function sumWindow(days) {
  const s = (k) => days.reduce((a, d) => a + (d[k] ?? 0), 0);
  const imp = s("impressions");
  const clicks = s("clicks");
  const spend = s("spend");
  const results = s("results");
  const reach = s("reach");
  const freqs = days.map((d) => d.frequency).filter((x) => x !== null);
  return {
    days: days.length,
    impressions: imp,
    clicks,
    spend,
    results,
    ctr: imp ? (clicks / imp) * 100 : null,
    cpm: imp && spend ? (spend / imp) * 1000 : null,
    cpr: results ? spend / results : null,
    // Daily frequency rows understate cumulative frequency; use the max reported, or imp/reach.
    frequency: freqs.length ? Math.max(...freqs) : reach ? imp / reach : null,
  };
}

const rel = (a, b) => (a !== null && b !== null && b !== 0 ? (a - b) / b : null);

/** Evaluate one ad's daily rows. Returns {ad, status, signals[], baseline, recent}. */
export function evaluateAd(ad, days, opt = {}) {
  const o = { ...DEFAULTS, ...opt };
  const sorted = [...days].sort((a, b) => a.day.localeCompare(b.day));
  if (sorted.length < o.window * 2) {
    return { ad, status: "NOT_ENOUGH_DATA", reason: `${sorted.length} day(s) — needs ${o.window * 2} to compare`, signals: [] };
  }
  const baseline = sumWindow(sorted.slice(0, o.window));
  const recent = sumWindow(sorted.slice(-o.window));
  const thin = [baseline, recent].some((w) => w.impressions < o.minImpressions);
  if (thin) {
    return {
      ad, status: "NOT_ENOUGH_DATA", baseline, recent, signals: [],
      reason: `under ${o.minImpressions} impressions in a ${o.window}-day window`,
    };
  }
  const signals = [];
  // Cumulative frequency proxy: the larger of recent frequency and lifetime imp/reach if given.
  if (recent.frequency !== null && recent.frequency >= o.freq) {
    signals.push({ kind: "frequency", detail: `frequency ${recent.frequency.toFixed(2)} ≥ ${o.freq}` });
  }
  const ctrOk = baseline.clicks >= o.minClicks && recent.impressions >= o.minImpressions;
  const dCtr = rel(recent.ctr, baseline.ctr);
  if (ctrOk && dCtr !== null && dCtr <= -o.ctrDrop) {
    signals.push({ kind: "ctr", detail: `CTR ${baseline.ctr.toFixed(2)}% → ${recent.ctr.toFixed(2)}% (${(dCtr * 100).toFixed(0)}%)` });
  }
  const dCpm = rel(recent.cpm, baseline.cpm);
  if (dCpm !== null && dCpm >= o.cpmRise) {
    signals.push({ kind: "cpm", detail: `CPM ${Math.round(baseline.cpm)} → ${Math.round(recent.cpm)} (+${(dCpm * 100).toFixed(0)}%)` });
  }
  const dCpr = rel(recent.cpr, baseline.cpr);
  if (baseline.results >= 3 && recent.results >= 3 && dCpr !== null && dCpr >= o.cprRise) {
    signals.push({ kind: "cpr", detail: `cost/result ${Math.round(baseline.cpr)} → ${Math.round(recent.cpr)} (+${(dCpr * 100).toFixed(0)}%)` });
  }
  const status = signals.length >= 2 ? "FATIGUED" : signals.length === 1 ? "WATCH" : "HEALTHY";
  return { ad, status, baseline, recent, signals };
}

/** What to make next, by which signal fired. Concrete, not "refresh the creative". */
export function refreshBrief(result) {
  const k = new Set(result.signals.map((s) => s.kind));
  const lines = [];
  if (k.has("ctr")) lines.push("Hook mới cho 3 giây đầu — giữ sản phẩm & offer, đổi khung mở (câu hỏi → POV → so sánh outfit A với outfit B).");
  if (k.has("frequency")) lines.push("Cùng ý, khác hình: đổi người mặc/bối cảnh/định dạng (ảnh → video 9:16 → carousel) để không chạm lại đúng tệp đã chán.");
  if (k.has("cpm")) lines.push("Tệp đang cạn: mở rộng đối tượng (broad/Advantage+) hoặc thêm vị trí; đừng chỉ thay ảnh.");
  if (k.has("cpr")) lines.push("Kiểm tra trang đích & offer trước khi đổ lỗi cho creative: giá, size còn hàng, phí ship có khớp quảng cáo không.");
  return lines;
}

export function analyse(text, opt = {}) {
  const { rows, missing, columns } = normaliseRows(parseCsv(text));
  if (missing.length) return { error: `missing column(s): ${missing.join(", ")}`, columns };
  const byAd = new Map();
  for (const r of rows) {
    if (!byAd.has(r.ad)) byAd.set(r.ad, new Map());
    const m = byAd.get(r.ad);
    // Several rows per ad per day (e.g. split by placement) are summed.
    const prev = m.get(r.day);
    if (!prev) m.set(r.day, { ...r });
    else for (const k of ["impressions", "reach", "clicks", "spend", "results"]) prev[k] = (prev[k] ?? 0) + (r[k] ?? 0);
  }
  const order = { FATIGUED: 0, WATCH: 1, HEALTHY: 2, NOT_ENOUGH_DATA: 3 };
  const results = [...byAd].map(([ad, m]) => {
    const r = evaluateAd(ad, [...m.values()], opt);
    return { ...r, brief: r.signals.length ? refreshBrief(r) : [] };
  });
  results.sort((a, b) => order[a.status] - order[b.status]);
  return { columns, results };
}

function report({ results }) {
  const icon = { FATIGUED: "🔴", WATCH: "🟡", HEALTHY: "🟢", NOT_ENOUGH_DATA: "⚪" };
  const out = ["# Fatigue check", ""];
  for (const r of results) {
    out.push(`${icon[r.status]} **${r.ad}** — ${r.status}${r.reason ? ` (${r.reason})` : ""}`);
    for (const s of r.signals) out.push(`   · ${s.detail}`);
    for (const b of r.brief) out.push(`   → ${b}`);
  }
  out.push("", "Ngưỡng: so 3 ngày gần nhất với 3 ngày đầu của CHÍNH quảng cáo đó. ⚪ = chưa đủ dữ liệu, đừng kết luận.");
  return out.join("\n");
}

if (await isMain(import.meta.url)) {
  const a = args(process.argv.slice(2));
  if (a.help || !a._[0]) {
    console.log(`fatigue-check.mjs — flag worn-out ads from an Ads Manager daily CSV export
usage: node scripts/ads/fatigue-check.mjs <export.csv> [--json] [--window 3]
       [--min-impressions 2000] [--freq 3] [--ctr-drop 0.25] [--cpm-rise 0.3]
env: none. Reads the file only; never touches an ad account.`);
    process.exit(a.help ? 0 : 1);
  }
  const opt = {};
  if (a.window) opt.window = Number(a.window);
  if (a["min-impressions"]) opt.minImpressions = Number(a["min-impressions"]);
  if (a.freq) opt.freq = Number(a.freq);
  if (a["ctr-drop"]) opt.ctrDrop = Number(a["ctr-drop"]);
  if (a["cpm-rise"]) opt.cpmRise = Number(a["cpm-rise"]);
  try {
    const res = analyse(readText(a._[0]), opt);
    if (res.error) { console.error(`[fatigue] ✗ ${res.error}`); process.exit(1); }
    console.log(a.json ? JSON.stringify(res, null, 2) : report(res));
  } catch (e) {
    console.error(`[fatigue] ✗ ${e.message}`);
    process.exit(1);
  }
}
