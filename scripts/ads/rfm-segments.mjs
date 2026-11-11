#!/usr/bin/env node
// rfm-segments.mjs — orders → customer segments → hashed Meta custom-audience files.
//
//   node scripts/ads/rfm-segments.mjs orders.csv                       # print the segment table
//   node scripts/ads/rfm-segments.mjs orders.csv --out out/audiences   # + one upload CSV per segment
//   node scripts/ads/rfm-segments.mjs orders.csv --today 2026-11-11
//
// INPUT. One row per order (export from Haravan, Sapo, KiotViet, Shopify, Pancake, a sheet…):
// a customer key (phone and/or email), order date, order value. Vietnamese or English headers.
//
// SEGMENTS (R = days since last order, F = orders, M = total spent; scored 1–5 by quintile
// across THIS shop's customers, so the cut points fit the shop rather than a textbook):
//   VIP           R≥4 F≥4 M≥4   — retain: early access, no discount needed
//   Trung thành   R≥3 F≥3       — upsell the new collection
//   Mới           R≥4 F=1       — second-purchase nudge within 30 days
//   Tiềm năng     R≥3 F≤2       — cross-sell the look (top → matching bottom)
//   Sắp rời       R=2 F≥2       — win-back before they go: new arrivals, not deep discount
//   Ngủ đông      R=1           — exclude from prospecting; a lookalike seed they are not
//   Khác          the rest
//
// PRIVACY — non-negotiable:
//   · Upload files contain ONLY SHA-256 hashes of normalised email / phone, the format Meta's
//     customer-list upload expects. No raw PII is written anywhere; the terminal shows counts.
//   · Phones are normalised to E.164 without "+": 0912 345 678 / +84912345678 → 84912345678.
//   · You may only upload customers who consented to this use. Vietnam's Nghị định 13/2023/NĐ-CP
//     on personal data protection applies; the script warns, it cannot check consent for you.
import fs from "node:fs";
import path from "node:path";
import { parseCsv, findColumn, parseNumber, parseDate, sha256, readText, args, isMain, toCsv } from "./lib/common.mjs";

/** Meta normalisation for email: trim + lower case. Returns "" when not an email. */
export function normEmail(s) {
  const e = String(s ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : "";
}

/**
 * Vietnamese phone → digits with country code, no "+", no leading zero (Meta's format).
 * Accepts 0xxxxxxxxx, +84…, 84…, 0084…, with spaces/dots/dashes. Returns "" if not a VN mobile/
 * landline length after normalising (9 digits after 84).
 */
export function normPhoneVN(s) {
  let d = String(s ?? "").replace(/[^\d+]/g, "");
  if (!d) return "";
  d = d.replace(/^\+/, "").replace(/^00/, "");
  if (d.startsWith("84")) d = d.slice(2);
  d = d.replace(/^0/, "");
  if (!/^\d{9,10}$/.test(d)) return "";
  return "84" + d;
}

export const hashEmail = (s) => { const e = normEmail(s); return e ? sha256(e) : ""; };
export const hashPhone = (s) => { const p = normPhoneVN(s); return p ? sha256(p) : ""; };

/** Quintile score 1..5 for each value; `higherIsBetter` false flips it (recency in days). */
export function quintiles(values, higherIsBetter = true) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  return (x) => {
    if (n === 0) return 3;
    // Mid-rank: customers below x plus half of those tied with it. Plain "at or below" puts a
    // one-order customer at F=4 in a shop where 70% of people ordered once — ties dominate F.
    const below = sorted.filter((y) => y < x).length;
    const equal = sorted.filter((y) => y === x).length;
    const p = (below + equal / 2) / n;
    const s = Math.min(5, Math.max(1, Math.ceil(p * 5)));
    return higherIsBetter ? s : 6 - s;
  };
}

export function segmentOf({ R, F, M, orders }) {
  if (R >= 4 && F >= 4 && M >= 4) return "vip";
  if (R >= 4 && orders === 1) return "moi";
  if (R >= 3 && F >= 3) return "trung-thanh";
  if (R >= 3) return "tiem-nang";
  if (R === 2 && orders >= 2) return "sap-roi";
  if (R === 1) return "ngu-dong";
  return "khac";
}

export const SEGMENT_LABEL = {
  vip: "VIP", "trung-thanh": "Trung thành", moi: "Mới", "tiem-nang": "Tiềm năng",
  "sap-roi": "Sắp rời", "ngu-dong": "Ngủ đông", khac: "Khác",
};
export const SEGMENT_PLAY = {
  vip: "Giữ chân: mở bán sớm BST mới, quà tặng, không cần giảm giá. Làm seed lookalike 1%.",
  "trung-thanh": "Upsell BST mới, combo phối đồ. Seed lookalike.",
  moi: "Đơn thứ hai trong 30 ngày: gợi ý món phối cùng món đã mua.",
  "tiem-nang": "Cross-sell theo set đồ; nội dung UGC/review.",
  "sap-roi": "Win-back: hàng mới về + lý do quay lại; giảm giá nhẹ, có hạn.",
  "ngu-dong": "Loại trừ khỏi chiến dịch tìm khách mới; thử 1 lần win-back rồi thôi.",
  khac: "Theo dõi.",
};

/** Orders rows → customers with RFM + segment. `today` = "YYYY-MM-DD". */
export function buildCustomers(rows, today) {
  if (!rows.length) return { customers: [], skipped: 0, columns: {} };
  const h = Object.keys(rows[0]);
  const columns = {
    phone: findColumn(h, ["so dien thoai", "dien thoai", "sdt", "phone", "phone number", "so dt"]),
    email: findColumn(h, ["email", "e-mail", "thu dien tu"]),
    date: findColumn(h, ["ngay dat", "ngay dat hang", "ngay tao", "ngay", "order date", "created at", "date"]),
    value: findColumn(h, ["tong tien", "thanh tien", "gia tri don", "tong cong", "total", "order total", "amount", "doanh thu"]),
  };
  if (!columns.date || !columns.value || (!columns.phone && !columns.email)) {
    throw new Error(`need an order date, an order value and a phone or email column; found ${JSON.stringify(columns)}`);
  }
  const t = Date.parse(today + "T00:00:00Z");
  const by = new Map();
  let skipped = 0;
  for (const r of rows) {
    const phone = columns.phone ? normPhoneVN(r[columns.phone]) : "";
    const email = columns.email ? normEmail(r[columns.email]) : "";
    const date = parseDate(r[columns.date]);
    const value = parseNumber(r[columns.value]);
    const key = phone || email;
    if (!key || !date || value === null) { skipped++; continue; }
    if (!by.has(key)) by.set(key, { phone, email, orders: 0, total: 0, last: date });
    const c = by.get(key);
    c.orders++;
    c.total += value;
    if (date > c.last) c.last = date;
    if (!c.email && email) c.email = email;
    if (!c.phone && phone) c.phone = phone;
  }
  const list = [...by.values()].map((c) => ({ ...c, days: Math.max(0, Math.round((t - Date.parse(c.last + "T00:00:00Z")) / 86400000)) }));
  const rS = quintiles(list.map((c) => c.days), false);
  const fS = quintiles(list.map((c) => c.orders));
  const mS = quintiles(list.map((c) => c.total));
  const customers = list.map((c) => {
    const s = { R: rS(c.days), F: fS(c.orders), M: mS(c.total), orders: c.orders };
    return { ...c, ...s, segment: segmentOf(s) };
  });
  return { customers, skipped, columns };
}

/** One Meta upload file per segment: header email,phone — both SHA-256, never raw. */
export function audienceRows(customers, segment) {
  return customers
    .filter((c) => c.segment === segment)
    .map((c) => ({ email: c.email ? sha256(c.email) : "", phone: c.phone ? sha256(c.phone) : "" }))
    .filter((r) => r.email || r.phone);
}

if (await isMain(import.meta.url)) {
  const a = args(process.argv.slice(2));
  if (a.help || !a._[0]) {
    console.log(`rfm-segments.mjs — RFM customer segments + SHA-256 hashed Meta custom-audience CSVs
usage: node scripts/ads/rfm-segments.mjs <orders.csv> [--out <dir>] [--today YYYY-MM-DD] [--json]
input: one row per order with phone and/or email, order date, order value.
output: a segment summary; with --out, <dir>/audience-<segment>.csv holding ONLY hashed email/phone.
env: none. Upload only customers who consented (Nghị định 13/2023/NĐ-CP). Nothing is uploaded by this script.`);
    process.exit(a.help ? 0 : 1);
  }
  try {
    const today = typeof a.today === "string" ? a.today : new Date().toISOString().slice(0, 10);
    const { customers, skipped } = buildCustomers(parseCsv(readText(a._[0])), today);
    const seg = {};
    for (const c of customers) {
      seg[c.segment] ??= { n: 0, revenue: 0, orders: 0 };
      seg[c.segment].n++; seg[c.segment].revenue += c.total; seg[c.segment].orders += c.orders;
    }
    if (a.json) {
      console.log(JSON.stringify({ today, customers: customers.length, skipped, segments: seg }, null, 2));
    } else {
      console.log(`# RFM — ${customers.length} khách (tính đến ${today})${skipped ? ` · bỏ qua ${skipped} dòng thiếu dữ liệu` : ""}\n`);
      console.log("| Nhóm | Khách | Doanh thu | Đơn TB/khách | Nên làm |\n|---|---|---|---|---|");
      for (const k of Object.keys(SEGMENT_LABEL)) if (seg[k]) {
        const s = seg[k];
        console.log(`| ${SEGMENT_LABEL[k]} | ${s.n} | ${Math.round(s.revenue).toLocaleString("vi-VN")} | ${(s.orders / s.n).toFixed(1)} | ${SEGMENT_PLAY[k]} |`);
      }
    }
    if (typeof a.out === "string") {
      fs.mkdirSync(a.out, { recursive: true });
      for (const k of Object.keys(seg)) {
        const rows = audienceRows(customers, k);
        if (!rows.length) continue;
        const f = path.join(a.out, `audience-${k}.csv`);
        fs.writeFileSync(f, toCsv(rows, ["email", "phone"]), "utf8");
        console.error(`[rfm] ✓ ${f} — ${rows.length} rows, hashed`);
      }
      if (Object.values(seg).some((s) => s.n < 100)) {
        console.error("[rfm] ! Some segments are under 100 people — Meta will not deliver to an audience that small; use them for exclusion, or merge them.");
      }
      console.error("[rfm] ! Chỉ tải lên khách đã đồng ý cho phép dùng dữ liệu cho quảng cáo (Nghị định 13/2023/NĐ-CP). Xoá file sau khi tải lên.");
    }
  } catch (e) {
    console.error(`[rfm] ✗ ${e.message}`);
    process.exit(1);
  }
}
