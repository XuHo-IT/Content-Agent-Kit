// common.mjs — shared helpers for scripts/ads/*. Dependency-free.
//
// Ads Manager exports are messy in predictable ways, and every one of them broke a naive
// parser while these scripts were written:
//   · Vietnamese locale exports use "1.234.567,89" — period for thousands, comma for decimals.
//     English exports use "1,234,567.89". "12,5" and "12.5" are both 12.5; "1.234" is 1234.
//   · Currency marks ride along: "₫1.200.000", "1,200,000 VND", "$3.50", "đ".
//   · Headers arrive in Vietnamese or English, with or without diacritics, sometimes with a
//     BOM on the first column.
//   · Excel saves CSV with ";" when the OS decimal mark is a comma, so the delimiter is sniffed.
import crypto from "node:crypto";
import fs from "node:fs";

/** Lower-case, strip Vietnamese diacritics (đ → d), collapse whitespace. */
export function fold(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Pick the delimiter that splits the header line into the most columns. */
export function sniffDelimiter(firstLine) {
  const cands = [",", ";", "\t", "|"];
  let best = ",";
  let bestN = 0;
  for (const d of cands) {
    const n = splitLine(firstLine, d).length;
    if (n > bestN) { best = d; bestN = n; }
  }
  return best;
}

function splitLine(line, d) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === d) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

/**
 * RFC-4180-ish CSV → array of objects keyed by the raw header. Handles quoted fields that
 * contain the delimiter or newlines, "" escapes, CRLF and a leading BOM.
 */
export function parseCsv(text, { delimiter } = {}) {
  text = String(text).replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const d = delimiter ?? sniffDelimiter(firstLine);
  const rows = [];
  let row = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
      continue;
    }
    if (c === '"') q = true;
    else if (c === d) { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x !== "")) rows.push(row);
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

/** Quote a value for CSV output. */
export function csvCell(v) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows, cols = rows.length ? Object.keys(rows[0]) : []) {
  return [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n") + "\n";
}

/**
 * Parse a number the way a Vietnamese OR English export writes it.
 * Returns null for blanks and dashes ("—", "-", "N/A") — "no data", which is not zero.
 *
 * Rule for a single separator: if exactly three digits follow the LAST separator and the
 * string has no other kind of separator, it is a thousands mark ("1.234" = 1234,
 * "12,000" = 12000). Otherwise it is the decimal mark ("12,5" = 12.5, "0.85" = 0.85).
 * Two kinds present: whichever comes last is the decimal mark.
 */
export function parseNumber(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  let s = String(raw).trim();
  if (!s || /^(-|—|–|n\/a|na|null|none|không có)$/i.test(s)) return null;
  const neg = /^\(.*\)$/.test(s) || /^-/.test(s.replace(/[^\d\-().,]/g, ""));
  const pct = s.includes("%");
  s = s.replace(/[^\d.,]/g, "");
  if (!s || !/\d/.test(s)) return null;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  let n;
  if (lastDot > -1 && lastComma > -1) {
    const dec = lastDot > lastComma ? "." : ",";
    const thou = dec === "." ? "," : ".";
    n = Number(s.split(thou).join("").replace(dec, "."));
  } else if (lastDot > -1 || lastComma > -1) {
    const sep = lastDot > -1 ? "." : ",";
    const parts = s.split(sep);
    const tail = parts[parts.length - 1];
    if (parts.length > 2 || (tail.length === 3 && parts[0].length >= 1 && parts[0] !== "0")) n = Number(parts.join(""));
    else n = Number(parts.join("."));
  } else n = Number(s);
  if (!Number.isFinite(n)) return null;
  void pct; // a percentage stays in percent units: "2,5%" → 2.5
  return neg ? -n : n;
}

/**
 * Find the column for a concept among the headers of an export. `aliases` are folded
 * (no diacritics, lower case); a header matches if its folded form equals an alias or
 * starts with it followed by a space or "(" — "Số tiền đã chi tiêu (VND)" → "so tien da chi tieu".
 */
export function findColumn(headers, aliases) {
  const F = headers.map((h) => [h, fold(h).replace(/﻿/g, "")]);
  for (const a of aliases) {
    const hit = F.find(([, f]) => f === a);
    if (hit) return hit[0];
  }
  for (const a of aliases) {
    const hit = F.find(([, f]) => f.startsWith(a + " ") || f.startsWith(a + "("));
    if (hit) return hit[0];
  }
  return null;
}

/** Parse a date in ISO, d/m/y (the Vietnamese default) or y/m/d form → "YYYY-MM-DD" or null. */
export function parseDate(raw) {
  const s = String(raw ?? "").trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

export const sha256 = (s) => crypto.createHash("sha256").update(String(s), "utf8").digest("hex");

export function readText(file) {
  if (!file) throw new Error("no input file given (see --help)");
  if (!fs.existsSync(file)) throw new Error(`file not found: ${file}`);
  return fs.readFileSync(file, "utf8");
}

/** Tiny argv reader: --key value, --flag. */
export function args(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const nx = argv[i + 1];
      if (nx !== undefined && !nx.startsWith("--")) { o[k] = nx; i++; } else o[k] = true;
    } else o._.push(a);
  }
  return o;
}

export async function isMain(metaUrl) {
  if (!process.argv[1]) return false;
  const { pathToFileURL } = await import("node:url");
  return metaUrl === pathToFileURL(process.argv[1]).href;
}
