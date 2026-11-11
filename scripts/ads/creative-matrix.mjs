#!/usr/bin/env node
// creative-matrix.mjs — turn a list of hooks, angles and formats into a creative test plan
// with deterministic ad names, so results can be read back by name a week later.
//
//   node scripts/ads/creative-matrix.mjs plan.json                # print the matrix
//   node scripts/ads/creative-matrix.mjs plan.json --csv > matrix.csv
//   node scripts/ads/creative-matrix.mjs plan.json --max 12       # cap cells (variety-first)
//
// plan.json:
//   { "campaign": "AW26", "product": {"code":"VL01","name":"Váy linen dáng A"},
//     "date": "2026-11-11",
//     "hooks":   [{"code":"H1","text":"Mặc gì đi làm mà vẫn mát?"}, ...],
//     "angles":  [{"code":"A1","text":"Vải linen thoáng cả ngày","proof":"…"}, ...],
//     "formats": [{"code":"V9","text":"Video 9:16 try-on 15s"}, {"code":"C1","text":"Carousel 5 ảnh"}] }
//
// NAMING. `<campaign>_<product>_<hook>-<angle>-<format>_<yymmdd>` — e.g.
// AW26_VL01_H1-A2-V9_261111. One variable per position, so a pivot on the name splits results
// by hook, angle or format without a lookup table. Ads Manager allows long names, but the
// pivot only works if nobody hand-edits them: the skill pastes these names verbatim.
//
// WHY --max PICKS VARIETY. A full 4×4×3 grid is 48 ads — more than any test budget can read.
// When capped, cells are chosen so every hook, angle and format appears as evenly as possible
// (a Latin-square-style walk), rather than the first N rows, which would test one hook only.
import { readText, args, isMain, toCsv } from "./lib/common.mjs";

const clean = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").replace(/[^A-Za-z0-9]+/g, "").toUpperCase();

export function adName({ campaign, product, hook, angle, format, date }) {
  const d = String(date ?? "").replace(/-/g, "").slice(2, 8);
  return `${clean(campaign)}_${clean(product)}_${clean(hook)}-${clean(angle)}-${clean(format)}${d ? "_" + d : ""}`;
}

/** Parse a name made by adName back into its parts (for reading results). */
export function parseAdName(name) {
  const m = String(name).match(/^([A-Z0-9]+)_([A-Z0-9]+)_([A-Z0-9]+)-([A-Z0-9]+)-([A-Z0-9]+)(?:_(\d{6}))?/);
  return m ? { campaign: m[1], product: m[2], hook: m[3], angle: m[4], format: m[5], date: m[6] ?? null } : null;
}

/** All combinations, or `max` of them spread evenly across every hook/angle/format. */
export function cells(plan, max = Infinity) {
  const H = plan.hooks ?? [], A = plan.angles ?? [], F = plan.formats ?? [];
  if (!H.length || !A.length || !F.length) throw new Error("plan needs at least one hook, one angle and one format");
  const all = [];
  for (const h of H) for (const a of A) for (const f of F) all.push({ h, a, f });
  if (all.length <= max) return all;
  // Diagonal walk: cell k uses hook k%|H|, angle (k + floor(k/|H|))%|A|, format (k + floor(k/|A|))%|F| —
  // skipping repeats — so the first n cells cover every level before any repeats.
  const out = [];
  const seen = new Set();
  for (let k = 0; out.length < max && k < all.length * 4; k++) {
    const h = H[k % H.length];
    const a = A[(k + Math.floor(k / H.length)) % A.length];
    const f = F[(k + Math.floor(k / A.length)) % F.length];
    const key = `${h.code}|${a.code}|${f.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ h, a, f });
  }
  // The walk can cycle before reaching `max` for some grid shapes; top up in order.
  for (const c of all) {
    if (out.length >= max) break;
    const key = `${c.h.code}|${c.a.code}|${c.f.code}`;
    if (!seen.has(key)) { seen.add(key); out.push(c); }
  }
  return out;
}

export function buildMatrix(plan, { max = Infinity } = {}) {
  const product = plan.product ?? {};
  return cells(plan, max).map(({ h, a, f }) => ({
    ad_name: adName({ campaign: plan.campaign, product: product.code, hook: h.code, angle: a.code, format: f.code, date: plan.date }),
    hook: h.text,
    angle: a.text,
    format: f.text,
    proof: a.proof ?? "",
    brief: `${f.text}. 0–3s: "${h.text}". Thân: ${a.text}${a.proof ? ` (bằng chứng: ${a.proof})` : ""}. Kết: ${plan.cta ?? "CTA + giá/ưu đãi thật"}. Sản phẩm: ${product.name ?? product.code ?? ""}.`,
  }));
}

if (await isMain(import.meta.url)) {
  const a = args(process.argv.slice(2));
  if (a.help || !a._[0]) {
    console.log(`creative-matrix.mjs — hook × angle × format test matrix with parseable ad names
usage: node scripts/ads/creative-matrix.mjs <plan.json> [--max N] [--csv|--json]
name format: <CAMPAIGN>_<PRODUCT>_<HOOK>-<ANGLE>-<FORMAT>_<yymmdd>
env: none. Creates no ads; prints a plan for review.`);
    process.exit(a.help ? 0 : 1);
  }
  try {
    const plan = JSON.parse(readText(a._[0]));
    const rows = buildMatrix(plan, { max: a.max ? Number(a.max) : Infinity });
    if (a.csv) process.stdout.write(toCsv(rows));
    else if (a.json) console.log(JSON.stringify(rows, null, 2));
    else {
      const total = (plan.hooks?.length ?? 0) * (plan.angles?.length ?? 0) * (plan.formats?.length ?? 0);
      console.log(`# Creative matrix — ${rows.length} of ${total} possible cells\n`);
      for (const r of rows) console.log(`${r.ad_name}\n   ${r.brief}`);
    }
  } catch (e) {
    console.error(`[matrix] ✗ ${e.message}`);
    process.exit(1);
  }
}
