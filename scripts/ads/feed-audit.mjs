#!/usr/bin/env node
// feed-audit.mjs — check a Meta (Facebook/Instagram) product catalog feed before it runs
// Advantage+ catalog / dynamic product ads.
//
//   node scripts/ads/feed-audit.mjs catalog.csv
//   node scripts/ads/feed-audit.mjs catalog.tsv --json
//
// WHY THIS MATTERS FOR FASHION. A catalog ad is assembled from the feed, so every feed error
// is an ad error: a variant without item_group_id shows the same shirt five times in one
// carousel; a sale_price above price is rejected; a title in ALL CAPS with the shop name
// first is what gets truncated on mobile. Commerce Manager reports some of these after
// upload — this catches them before, on the file, offline.
//
// Field names follow Meta's catalog spec (id, title, description, availability, condition,
// price, link, image_link, brand required; sale_price, item_group_id, size, color, gender,
// age_group, google_product_category, additional_image_link recommended for apparel).
import { parseCsv, fold, readText, args, isMain } from "./lib/common.mjs";

export const REQUIRED = ["id", "title", "description", "availability", "condition", "price", "link", "image_link", "brand"];
export const APPAREL_RECOMMENDED = ["item_group_id", "size", "color", "gender", "age_group"];
const AVAILABILITY = ["in stock", "out of stock", "available for order", "discontinued", "preorder"];
const CONDITION = ["new", "refurbished", "used", "used_like_new", "used_good", "used_fair"];
const GENDER = ["female", "male", "unisex"];
const AGE = ["adult", "all ages", "teen", "kids", "toddler", "infant", "newborn"];

/** "199000 VND" / "199,000.00 VND" → {amount, currency} or null. Meta wants number + ISO code. */
export function parsePrice(s) {
  const m = String(s ?? "").trim().match(/^(\d+(?:[.,]\d{1,2})?)\s+([A-Z]{3})$/);
  if (!m) return null;
  return { amount: Number(m[1].replace(",", ".")), currency: m[2] };
}

/** Audit rows → {issues: [{id, row, field, severity, msg}], stats}. */
export function audit(rows) {
  const issues = [];
  const add = (row, id, field, severity, msg) => issues.push({ row, id, field, severity, msg });
  if (!rows.length) return { issues: [{ row: 0, id: "", field: "", severity: "error", msg: "empty feed" }], stats: { rows: 0 } };
  const head = Object.keys(rows[0]).map((h) => h.trim().toLowerCase());
  for (const f of REQUIRED) if (!head.includes(f)) add(0, "", f, "error", `column "${f}" missing from the header`);
  const seen = new Map();
  const groups = new Map();
  rows.forEach((r0, i) => {
    const r = Object.fromEntries(Object.entries(r0).map(([k, v]) => [k.trim().toLowerCase(), String(v ?? "").trim()]));
    const row = i + 2; // header is row 1
    const id = r.id ?? "";
    for (const f of REQUIRED) if (head.includes(f) && !r[f]) add(row, id, f, "error", `${f} is empty`);
    if (id) {
      if (seen.has(id)) add(row, id, "id", "error", `duplicate id (also row ${seen.get(id)})`);
      else seen.set(id, row);
      if (id.length > 100) add(row, id, "id", "error", "id longer than 100 characters");
    }
    if (r.availability && !AVAILABILITY.includes(r.availability.toLowerCase())) add(row, id, "availability", "error", `"${r.availability}" — use one of: ${AVAILABILITY.join(", ")}`);
    if (r.condition && !CONDITION.includes(r.condition.toLowerCase())) add(row, id, "condition", "error", `"${r.condition}" — use: new`);
    const price = r.price ? parsePrice(r.price) : null;
    if (r.price && !price) add(row, id, "price", "error", `"${r.price}" — write "199000 VND" (number, space, ISO currency; no "đ", no thousands dots)`);
    if (r.sale_price) {
      const sp = parsePrice(r.sale_price);
      if (!sp) add(row, id, "sale_price", "error", `"${r.sale_price}" — same format as price`);
      else if (price && sp.currency !== price.currency) add(row, id, "sale_price", "error", "sale_price currency differs from price");
      else if (price && sp.amount >= price.amount) add(row, id, "sale_price", "error", `sale_price ${sp.amount} is not below price ${price.amount}`);
      else if (price && sp.amount < price.amount * 0.5) add(row, id, "sale_price", "warn", "discount over 50% — check the VN promotion cap (Nghị định 81/2018) and that price is the real pre-sale price");
    }
    if (r.title) {
      if (r.title.length > 150) add(row, id, "title", "error", `title ${r.title.length} chars (max 150)`);
      else if (r.title.length > 65) add(row, id, "title", "warn", `title ${r.title.length} chars — mobile shows ~65; put the product type first`);
      const letters = r.title.replace(/[^\p{L}]/gu, "");
      if (letters.length >= 8 && letters === letters.toUpperCase()) add(row, id, "title", "warn", "title in ALL CAPS");
      if (/(sale|giảm|freeship|free ship|hot|%)/i.test(r.title)) add(row, id, "title", "warn", "promo words in the title — put offers in sale_price, not the title");
    }
    if (r.description && r.description.length > 9999) add(row, id, "description", "error", "description over 9999 chars");
    if (r.description && r.title && fold(r.description) === fold(r.title)) add(row, id, "description", "warn", "description just repeats the title");
    for (const f of ["link", "image_link"]) {
      if (r[f] && !/^https:\/\//i.test(r[f])) add(row, id, f, /^http:\/\//i.test(r[f]) ? "warn" : "error", `${f} is not an https URL`);
    }
    if (r.image_link && /placeholder|no[-_]?image|default\.(jpg|png)/i.test(r.image_link)) add(row, id, "image_link", "error", "looks like a placeholder image");
    // item_group_id is checked across rows below (only variants need it).
    for (const f of APPAREL_RECOMMENDED) if (f !== "item_group_id" && head.includes(f) && !r[f]) {
      add(row, id, f, "warn", `${f} empty — apparel ads filter and group by it`);
    }
    if (r.gender && !GENDER.includes(r.gender.toLowerCase())) add(row, id, "gender", "error", `"${r.gender}" — use female, male or unisex`);
    if (r.age_group && !AGE.includes(r.age_group.toLowerCase())) add(row, id, "age_group", "error", `"${r.age_group}" — use: ${AGE.join(", ")}`);
    if (r.item_group_id) {
      if (!groups.has(r.item_group_id)) groups.set(r.item_group_id, []);
      groups.get(r.item_group_id).push({ row, id, title: r.title, size: r.size ?? "", color: r.color ?? "" });
    }
  });
  // Variants: rows sharing a base title but no item_group_id get shown as separate products.
  const byTitle = new Map();
  rows.forEach((r0, i) => {
    const r = Object.fromEntries(Object.entries(r0).map(([k, v]) => [k.trim().toLowerCase(), String(v ?? "").trim()]));
    if (r.item_group_id || !r.title) return;
    const base = fold(r.title).replace(/\b(size|sz)\s*\w+|\b(xs|s|m|l|xl|xxl|\d{2})\b|[-–|/,]+/g, " ").replace(/\s+/g, " ").trim();
    if (!byTitle.has(base)) byTitle.set(base, []);
    byTitle.get(base).push({ row: i + 2, id: r.id });
  });
  for (const [, list] of byTitle) {
    if (list.length > 1) for (const x of list) add(x.row, x.id, "item_group_id", "error", `looks like a variant of rows ${list.map((y) => y.row).join(", ")} but has no item_group_id`);
  }
  for (const [g, list] of groups) {
    const byKey = new Map();
    for (const x of list) {
      const k = `${fold(x.size)}|${fold(x.color)}`;
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(x);
    }
    for (const same of byKey.values()) if (same.length > 1) for (const x of same) {
      add(x.row, x.id, "item_group_id", "warn", `group ${g}: rows ${same.map((y) => y.row).join(", ")} share size+color — shoppers cannot tell them apart`);
    }
  }
  const sev = { error: 0, warn: 1, info: 2 };
  issues.sort((a, b) => sev[a.severity] - sev[b.severity] || a.row - b.row);
  const count = (s) => issues.filter((x) => x.severity === s).length;
  return { issues, stats: { rows: rows.length, errors: count("error"), warnings: count("warn"), info: count("info"), groups: groups.size } };
}

if (await isMain(import.meta.url)) {
  const a = args(process.argv.slice(2));
  if (a.help || !a._[0]) {
    console.log(`feed-audit.mjs — audit a Meta product catalog feed (CSV/TSV) before catalog ads run
usage: node scripts/ads/feed-audit.mjs <catalog.csv|.tsv> [--json] [--max 200]
env: none. Reads the file only; does not upload anything.`);
    process.exit(a.help ? 0 : 1);
  }
  try {
    const res = audit(parseCsv(readText(a._[0])));
    if (a.json) console.log(JSON.stringify(res, null, 2));
    else {
      const s = res.stats;
      console.log(`# Feed audit — ${s.rows} rows · ${s.errors} errors · ${s.warnings} warnings · ${s.info} info · ${s.groups} variant groups\n`);
      const max = Number(a.max ?? 200);
      for (const x of res.issues.slice(0, max)) console.log(`[${x.severity}] row ${x.row}${x.id ? ` (${x.id})` : ""} ${x.field}: ${x.msg}`);
      if (res.issues.length > max) console.log(`… ${res.issues.length - max} more (--max, or --json)`);
    }
    process.exit(res.stats.errors ? 2 : 0);
  } catch (e) {
    console.error(`[feed] ✗ ${e.message}`);
    process.exit(1);
  }
}
