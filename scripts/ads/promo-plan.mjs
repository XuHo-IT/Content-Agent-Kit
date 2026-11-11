#!/usr/bin/env node
// promo-plan.mjs — resolve templates/VN_RETAIL_CALENDAR.template.json into concrete dates for
// a period: when to start warming up, the peak window, and the relative budget weight.
//
//   node scripts/ads/promo-plan.mjs --from 2026-11-11 --days 90
//   node scripts/ads/promo-plan.mjs --quarter 2027-Q1 --budget 60000000   # split a total budget
//   node scripts/ads/promo-plan.mjs --quarter 2027-Q1 --json
//
// The budget split is arithmetic on the calendar's weights, which are STARTING ASSUMPTIONS:
// every non-event day weighs 1.0, a peak day weighs the event's budgetWeight. Replace the
// weights with the shop's own numbers after one cycle — the skill says so in its report.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { args, isMain } from "./lib/common.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CALENDAR = path.join(KIT, "templates", "VN_RETAIL_CALENDAR.template.json");

const iso = (t) => new Date(t).toISOString().slice(0, 10);
const day = (s) => Date.parse(s + "T00:00:00Z");
const DAY = 86400000;

/** Concrete date of an event in a given year, or null when the calendar has none for it. */
export function eventDate(ev, year, cal) {
  if (ev.lunar) return cal.lunarDates?.[ev.lunar]?.[String(year)] ?? null;
  if (ev.dates) return ev.dates[String(year)] ?? null;
  if (/^\d{2}-\d{2}$/.test(ev.date)) return `${year}-${ev.date}`;
  return null;
}

export function quarterRange(q) {
  const m = String(q).match(/^(\d{4})-?Q([1-4])$/i);
  if (!m) throw new Error(`--quarter wants e.g. 2027-Q1, got ${q}`);
  const y = Number(m[1]), n = Number(m[2]);
  const from = `${y}-${String((n - 1) * 3 + 1).padStart(2, "0")}-01`;
  const to = iso(Date.UTC(n === 4 ? y + 1 : y, n === 4 ? 0 : n * 3, 1) - DAY);
  return { from, to };
}

/** Events whose warm-up or peak overlaps [from, to], with resolved windows. */
export function plan(cal, from, to) {
  const a = day(from), b = day(to);
  const out = [];
  const missing = [];
  for (let y = new Date(a).getUTCFullYear() - 1; y <= new Date(b).getUTCFullYear() + 1; y++) {
    for (const ev of cal.events) {
      const d = eventDate(ev, y, cal);
      if (!d) { if (y >= new Date(a).getUTCFullYear() && y <= new Date(b).getUTCFullYear()) missing.push(`${ev.id} ${y}`); continue; }
      const t = day(d);
      const warm = t - ev.leadDays * DAY;
      // "before": people buy ahead (gifts, Tết) — the peak ends the day before the date.
      const peakStart = ev.peakAlign === "before" ? t - ev.peakDays * DAY : t;
      const peakEnd = peakStart + (ev.peakDays - 1) * DAY;
      if (peakEnd < a || warm > b) continue;
      out.push({ id: ev.id, name: ev.name, date: d, warmUpFrom: iso(Math.min(warm, peakStart)), peak: [iso(peakStart), iso(peakEnd)], budgetWeight: ev.budgetWeight, angle: ev.fashionAngle, notes: ev.notes ?? "" });
    }
  }
  out.sort((x, y) => x.date.localeCompare(y.date));
  return { events: out, missing };
}

/** Split `total` across days in [from,to]: peak days weigh budgetWeight, others 1.0. */
export function budgetByDay(events, from, to, total) {
  const days = [];
  for (let t = day(from); t <= day(to); t += DAY) {
    const d = iso(t);
    const w = Math.max(1, ...events.filter((e) => d >= e.peak[0] && d <= e.peak[1]).map((e) => e.budgetWeight));
    days.push({ date: d, weight: w });
  }
  const sum = days.reduce((s, x) => s + x.weight, 0);
  return days.map((x) => ({ ...x, budget: Math.round((total * x.weight) / sum) }));
}

if (await isMain(import.meta.url)) {
  const a = args(process.argv.slice(2));
  if (a.help || (!a.quarter && !a.from)) {
    console.log(`promo-plan.mjs — Vietnamese retail calendar → dated ad plan
usage: node scripts/ads/promo-plan.mjs --quarter 2027-Q1 [--budget 60000000] [--json]
       node scripts/ads/promo-plan.mjs --from 2026-11-11 --days 90
reads templates/VN_RETAIL_CALENDAR.template.json (or --calendar <file>). env: none.`);
    process.exit(a.help ? 0 : 1);
  }
  try {
    const cal = JSON.parse(fs.readFileSync(typeof a.calendar === "string" ? a.calendar : CALENDAR, "utf8"));
    const { from, to } = a.quarter ? quarterRange(a.quarter) : { from: a.from, to: iso(day(a.from) + (Number(a.days ?? 90) - 1) * DAY) };
    const p = plan(cal, from, to);
    const budget = a.budget ? budgetByDay(p.events, from, to, Number(a.budget)) : null;
    if (a.json) console.log(JSON.stringify({ from, to, ...p, budget }, null, 2));
    else {
      console.log(`# Lịch khuyến mại ${from} → ${to}\n`);
      console.log("| Sự kiện | Bắt đầu warm-up | Cao điểm | Hệ số NS | Góc nội dung |\n|---|---|---|---|---|");
      for (const e of p.events) console.log(`| ${e.name} | ${e.warmUpFrom} | ${e.peak[0]}${e.peak[1] !== e.peak[0] ? " → " + e.peak[1] : ""} | ×${e.budgetWeight} | ${e.angle} |`);
      if (p.missing.length) console.log(`\n! Không có ngày cho: ${p.missing.join(", ")} — bổ sung vào lịch trước khi lên kế hoạch.`);
      if (budget) {
        const byMonth = {};
        for (const d of budget) byMonth[d.date.slice(0, 7)] = (byMonth[d.date.slice(0, 7)] ?? 0) + d.budget;
        console.log(`\nNgân sách ${Number(a.budget).toLocaleString("vi-VN")} chia theo tháng: ${Object.entries(byMonth).map(([m, v]) => `${m}: ${v.toLocaleString("vi-VN")}`).join(" · ")}`);
      }
      console.log("\nHệ số ngân sách là giả định khởi đầu, không phải số đo — thay bằng số của shop sau một chu kỳ.");
    }
  } catch (e) {
    console.error(`[promo] ✗ ${e.message}`);
    process.exit(1);
  }
}
