// ads.test.mjs — the Facebook-ads scripts in scripts/ads/. Every case below is a way real
// exports and real comments break naive code: Vietnamese number formats, unaccented
// teencode, "chân váy" folding to "chán", phones written five ways.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseNumber, parseCsv, fold, findColumn, parseDate, sha256 } from "../scripts/ads/lib/common.mjs";
import { analyse, evaluateAd } from "../scripts/ads/fatigue-check.mjs";
import { classify, loadComments } from "../scripts/ads/comment-triage.mjs";
import { lint, verdict, hasReferencePrice } from "../scripts/ads/policy-lint.mjs";
import { audit, parsePrice } from "../scripts/ads/feed-audit.mjs";
import { normPhoneVN, normEmail, hashPhone, buildCustomers, audienceRows, quintiles } from "../scripts/ads/rfm-segments.mjs";
import { adName, parseAdName, buildMatrix, cells } from "../scripts/ads/creative-matrix.mjs";
import { plan, quarterRange, budgetByDay } from "../scripts/ads/promo-plan.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SAMPLES = path.join(KIT, "examples", "ads-samples");
const sample = (f) => fs.readFileSync(path.join(SAMPLES, f), "utf8");

// ── common ───────────────────────────────────────────────────────────────────
test("numbers parse in Vietnamese and English export formats", () => {
  assert.equal(parseNumber("1.234.567"), 1234567);
  assert.equal(parseNumber("1.234.567,89"), 1234567.89);
  assert.equal(parseNumber("1,234,567.89"), 1234567.89);
  assert.equal(parseNumber("12,5"), 12.5);
  assert.equal(parseNumber("0.85"), 0.85);
  assert.equal(parseNumber("1.200"), 1200); // thousands, not 1.2
  assert.equal(parseNumber("₫1.200.000"), 1200000);
  assert.equal(parseNumber("1,200,000 VND"), 1200000);
  assert.equal(parseNumber("2,5%"), 2.5);
  assert.equal(parseNumber("-"), null); // no data is not zero
  assert.equal(parseNumber(""), null);
});

test("CSV handles BOM, quoted commas, CRLF and a ; delimiter", () => {
  const rows = parseCsv('﻿a,b\r\n"x, y",2\r\n');
  assert.deepEqual(rows, [{ a: "x, y", b: "2" }]);
  assert.deepEqual(parseCsv("a;b\n1,5;2\n"), [{ a: "1,5", b: "2" }]);
});

test("headers match with or without diacritics", () => {
  assert.equal(fold("Số tiền đã chi tiêu (VND)"), "so tien da chi tieu (vnd)");
  assert.equal(findColumn(["Ngày", "Số tiền đã chi tiêu (VND)"], ["so tien da chi tieu"]), "Số tiền đã chi tiêu (VND)");
  assert.equal(parseDate("07/11/2026"), "2026-11-07"); // d/m/y, the Vietnamese default
  assert.equal(parseDate("2026-11-07"), "2026-11-07");
});

// ── fatigue ──────────────────────────────────────────────────────────────────
test("the sample export: one fatigued, one healthy, one too thin to judge", () => {
  const { results } = analyse(sample("ads-daily-export.csv"));
  const by = Object.fromEntries(results.map((r) => [r.ad, r.status]));
  assert.equal(by["AW26_VL01_H1-A1-V9_261101"], "FATIGUED");
  assert.equal(by["AW26_VL01_H2-A1-C1_261101"], "HEALTHY");
  assert.equal(by["AW26_VL01_H3-A2-V9_261106"], "NOT_ENOUGH_DATA");
});

test("a dramatic CTR drop on a tiny sample is NOT called fatigue", () => {
  const days = Array.from({ length: 6 }, (_, i) => ({ day: `2026-11-0${i + 1}`, impressions: 200, clicks: i < 3 ? 10 : 1, spend: 10000, results: 0, reach: 190, frequency: 1 }));
  assert.equal(evaluateAd("x", days).status, "NOT_ENOUGH_DATA");
});

test("fewer than two windows of days is not enough data", () => {
  const days = Array.from({ length: 4 }, (_, i) => ({ day: `2026-11-0${i + 1}`, impressions: 9000, clicks: 100, spend: 1, results: 0, reach: 1, frequency: 5 }));
  assert.equal(evaluateAd("x", days).status, "NOT_ENOUGH_DATA");
});

test("a missing required column is reported, not guessed", () => {
  assert.match(analyse("Ngày,Tên quảng cáo\n01/11/2026,a\n").error, /impressions/);
});

// ── comments ─────────────────────────────────────────────────────────────────
test("teencode and unaccented questions are recognised", () => {
  const p = (s) => classify(s).primary;
  assert.equal(p("sz m con k shop"), "ask_stock"); // "is size M still in stock?"
  assert.equal(p("giá bn vậy"), "ask_price");
  assert.equal(p("gia bn"), "ask_price");
  assert.equal(p("ib e"), "want_buy");
  assert.equal(p("ship hn bao lâu"), "ask_ship");
  assert.equal(p("1m58 52kg mặc size gì"), "ask_size");
  assert.equal(p("còn màu be không"), "ask_stock");
});

test("fashion words that fold into complaint words are not complaints", () => {
  // chân váy → "chan vay" (≠ chán); chất lượng → "chat luong" (≠ chật); tham khảo (≠ thảm)
  assert.notEqual(classify("Chân váy này đẹp quá").primary, "complaint");
  assert.notEqual(classify("chất lượng ổn nha").primary, "ask_size");
  assert.notEqual(classify("cho mình tham khảo mẫu này").primary, "complaint");
  assert.equal(classify("chán thật, hàng không giống hình").primary, "complaint");
});

test("a complaint outranks a question in the same comment, and links are spam", () => {
  const c = classify("hàng lỗi chỉ, giá bn để đổi?");
  assert.equal(c.primary, "complaint");
  assert.ok(c.intents.includes("ask_price"));
  assert.equal(classify("Nhận quà tri ân tại bit.ly/abc").primary, "spam_scam");
});

test("comments CSV with a Vietnamese header loads", () => {
  const rows = loadComments(sample("comments.csv"), "comments.csv");
  assert.equal(rows.length, 11);
  assert.ok(rows.some((r) => r.message.includes("vải mỏng"))); // the quoted comma survived
});

// ── policy ───────────────────────────────────────────────────────────────────
test("personal-attribute questions and body promises block", () => {
  const f = lint("Bạn béo bụng? Mặc gen này giảm 5cm eo ngay!");
  assert.equal(verdict(f), "BLOCK");
  assert.ok(f.some((x) => x.rule === "personal-attribute"));
  assert.ok(f.some((x) => x.rule === "body-outcome-claim"));
});

test("superlatives and urgency need review; a dated offer with both prices is clean", () => {
  assert.equal(verdict(lint("Áo thun rẻ nhất Sài Gòn")), "REVIEW");
  assert.equal(verdict(lint("Giảm 30% chỉ hôm nay")), "REVIEW");
  assert.equal(verdict(lint("Váy linen 459.000đ → 299.000đ, giảm 35% đến 23:59 ngày 11/11")), "CLEAN");
  assert.ok(hasReferencePrice("459.000đ → 299.000đ"));
});

test("a discount over 50% is flagged for a check, not blocked", () => {
  // Nghị định 239/2026 changed the promotion rules and sources disagree on whether a fixed 50%
  // ceiling survives — so this is a WARN that sends someone to the current text.
  const hit = lint("SALE OFF 70% toàn bộ").find((x) => x.rule === "discount-over-cap");
  assert.ok(hit);
  assert.equal(hit.severity, "warn");
  assert.ok(!lint("giảm 30%").some((x) => x.rule === "discount-over-cap"));
});

test("ordinary words do not trip the health rule", () => {
  // "chưa" and "vị trí" fold to "chua" / "tri" — they are not medical claims.
  assert.equal(verdict(lint("Cửa hàng vẫn ở vị trí cũ, chưa đổi địa chỉ")), "CLEAN");
});

// ── feed ─────────────────────────────────────────────────────────────────────
test("price must be number + ISO currency", () => {
  assert.deepEqual(parsePrice("199000 VND"), { amount: 199000, currency: "VND" });
  assert.equal(parsePrice("199.000đ"), null);
  assert.equal(parsePrice("199,000 VND"), null);
});

test("the sample feed's planted errors are all found", () => {
  const { issues, stats } = audit(parseCsv(sample("catalog.csv")));
  const has = (id, field, re) => issues.some((x) => x.id === id && x.field === field && re.test(x.msg));
  assert.ok(has("VL01-S-BE", "id", /duplicate/));
  assert.ok(has("AT02-S", "price", /199000 VND/));
  assert.ok(has("AT02-S", "availability", /instock/));
  assert.ok(has("AT02-S", "gender", /women/));
  assert.ok(has("AT02-M", "sale_price", /not below/));
  assert.ok(has("AT02-M", "item_group_id", /variant/));
  assert.ok(has("AT02-M", "brand", /empty/));
  assert.ok(has("VL01-M-BE2", "item_group_id", /share size\+color/));
  assert.ok(!has("VL01-S-BE", "item_group_id", /share size\+color/), "S/Be is not a duplicate of M/Be");
  assert.ok(stats.errors >= 8);
});

// ── audiences ────────────────────────────────────────────────────────────────
test("Vietnamese phones normalise to 84… however they are written", () => {
  for (const p of ["0912 345 678", "0912.345.678", "+84912345678", "84912345678", "0084 912 345 678", "(+84) 912-345-678"]) {
    assert.equal(normPhoneVN(p), "84912345678", p);
  }
  assert.equal(normPhoneVN("12345"), "");
  assert.equal(normEmail("  Lan@Example.COM "), "lan@example.com");
  assert.equal(hashPhone("0912 345 678"), sha256("84912345678"));
});

test("audience files hold hashes only — no raw phone or email anywhere", () => {
  const { customers } = buildCustomers(parseCsv(sample("orders.csv")), "2026-11-11");
  assert.equal(customers.length, 40);
  const segs = new Set(customers.map((c) => c.segment));
  assert.ok(segs.has("vip") && segs.has("ngu-dong"));
  for (const s of segs) {
    const text = JSON.stringify(audienceRows(customers, s));
    assert.ok(!/@|849000/.test(text), `segment ${s} leaks PII`);
    for (const r of audienceRows(customers, s)) for (const v of Object.values(r)) assert.ok(v === "" || /^[0-9a-f]{64}$/.test(v));
  }
});

test("one-order customers are not scored as frequent just because most people ordered once", () => {
  const score = quintiles([1, 1, 1, 1, 1, 1, 1, 2, 3, 6]);
  assert.ok(score(1) <= 2, `F for 1 order = ${score(1)}`);
  assert.equal(score(6), 5);
});

// ── creative matrix ──────────────────────────────────────────────────────────
test("ad names are deterministic and parse back", () => {
  const n = adName({ campaign: "AW26", product: "VL-01", hook: "H1", angle: "A2", format: "V9", date: "2026-11-11" });
  assert.equal(n, "AW26_VL01_H1-A2-V9_261111");
  assert.deepEqual(parseAdName(n), { campaign: "AW26", product: "VL01", hook: "H1", angle: "A2", format: "V9", date: "261111" });
});

test("a capped matrix still covers every hook, angle and format", () => {
  const p = JSON.parse(sample("creative-plan.json"));
  const rows = buildMatrix(p, { max: 12 });
  assert.equal(rows.length, 12);
  assert.equal(new Set(rows.map((r) => r.ad_name)).size, 12);
  const parts = rows.map((r) => parseAdName(r.ad_name));
  for (const [k, list] of [["hook", p.hooks], ["angle", p.angles], ["format", p.formats]]) {
    assert.equal(new Set(parts.map((x) => x[k])).size, list.length, `${k} not fully covered`);
  }
  assert.equal(cells(p).length, 36);
});

// ── calendar ─────────────────────────────────────────────────────────────────
test("the calendar resolves Tết's peak to the weeks BEFORE Tết", () => {
  const cal = JSON.parse(fs.readFileSync(path.join(KIT, "templates", "VN_RETAIL_CALENDAR.template.json"), "utf8"));
  const { from, to } = quarterRange("2027-Q1");
  assert.deepEqual([from, to], ["2027-01-01", "2027-03-31"]);
  const { events } = plan(cal, from, to);
  const tet = events.find((e) => e.id === "tet");
  assert.equal(tet.date, "2027-02-06");
  assert.ok(tet.peak[1] < tet.date, "Tết peak must end before Tết");
  const budget = budgetByDay(events, from, to, 90_000_000);
  const sum = budget.reduce((s, d) => s + d.budget, 0);
  assert.ok(Math.abs(sum - 90_000_000) < budget.length, "budget split must add up");
});

test("every ads script answers --help without touching anything", async () => {
  const { spawnSync } = await import("node:child_process");
  for (const f of fs.readdirSync(path.join(KIT, "scripts", "ads")).filter((x) => x.endsWith(".mjs"))) {
    const r = spawnSync(process.execPath, [path.join(KIT, "scripts", "ads", f), "--help"], { encoding: "utf8" });
    assert.equal(r.status, 0, `${f} --help exited ${r.status}: ${r.stderr}`);
    assert.match(r.stdout, /usage:/, f);
  }
});

test("asking whether a size is still in stock is a stock question", () => {
  assert.equal(classify("sz m con k shop").primary, "ask_stock");
  assert.equal(classify("size L còn hàng không ạ").primary, "ask_stock");
  // a fit question with no "còn" is still a size question
  assert.equal(classify("cao 1m58 nặng 50kg mặc size nào vừa").primary, "ask_size");
});
