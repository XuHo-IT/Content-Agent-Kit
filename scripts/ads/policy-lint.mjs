#!/usr/bin/env node
// policy-lint.mjs — pre-flight an ad's copy against the rules that most often get fashion
// ads rejected on Meta, or put a brand on the wrong side of Vietnamese advertising law.
//
//   node scripts/ads/policy-lint.mjs ad.txt
//   node scripts/ads/policy-lint.mjs --text "Bạn béo bụng? Mặc gen này giảm 5cm eo ngay!"
//   node scripts/ads/policy-lint.mjs ads.json --json     # [{id, text}] or {"ads":[...]}
//
// WHAT IT IS. A linter, not a lawyer and not Meta's reviewer. It catches the PATTERNS that
// recur — the "bạn có…?" personal-attribute question, before/after bodies, unprovable
// superlatives, invented urgency, a discount with no reference price — and says why and how to
// rewrite. A clean result means none of these patterns, not "approved". NOT LEGAL ADVICE.
//
// SOURCES, stated conservatively:
//   · Meta Advertising Standards — "Personal attributes" (ads must not assert or imply a
//     person's attributes, incl. physical/mental health), "Unrealistic outcomes / negative
//     self-perception" (no before/after, no idealised-body shaming for weight-loss-type
//     products), "Misleading or false content".
//   · Luật Quảng cáo 2012 (16/2012/QH13), Điều 8 — banned acts, including using
//     "nhất", "duy nhất", "tốt nhất", "số một" or similar words without lawful supporting
//     documents (khoản 11), and misleading content about price, quality, origin (khoản 9).
//     AMENDED by Luật 75/2025/QH15, in force 01/01/2026, which changes several khoản of Điều 8
//     and adds rules for influencers (Điều 15a). Article numbers below are the 2012 text —
//     LEGAL_CHECKED says when they were last compared; re-check against the consolidated text.
//   · Sales promotion (Luật Thương mại; Nghị định 81/2018/NĐ-CP as amended by 128/2024/NĐ-CP and
//     239/2026/NĐ-CP of 26/06/2026): a discount is measured against the real pre-promotion price.
//     Whether a fixed 50% ceiling still applies after Nghị định 239/2026 is reported differently
//     by different sources, so a big discount is a WARN to check, not a block.
// Every finding carries `ref` so a reviewer can go to the source, not trust the linter.
import { fold, readText, args, isMain } from "./lib/common.mjs";

// severity: "block" = very likely rejected / unlawful as written; "warn" = needs proof or a
// rewrite; "info" = worth a second look.
/** When the legal references below were last compared with the official texts. */
export const LEGAL_CHECKED = "2026-11-11";

export const RULES = [
  {
    id: "personal-attribute",
    severity: "block",
    ref: "Meta Advertising Standards — Personal attributes",
    // "Bạn [có] béo/mập/thấp/lùn/…?" — addressing the reader AS having the trait.
    re: /\b(ban|chi|em|nang|co ay|anh)\s+(co\s+|dang\s+|bi\s+|qua\s+)?(beo|map|thua can|bung mo|bung bia|mo bung|thap|lun|gay|xau|da den|ngam den|mun|ran|chay xe|vong 1 lep|nguc lep|hong to|dui to|bap tay to|u buon|tram cam|tu ti)\b/,
    why: "Nói thẳng người xem có đặc điểm cơ thể/sức khoẻ ('Bạn béo bụng?') — Meta từ chối kiểu này.",
    fix: "Nói về sản phẩm hoặc tình huống, không gán đặc điểm cho người xem: 'Dáng váy che khéo vòng eo' thay vì 'Bạn béo bụng?'.",
  },
  {
    id: "before-after",
    severity: "block",
    ref: "Meta Advertising Standards — Unrealistic outcomes / negative self-perception",
    re: /\b(truoc va sau|truoc\s*\/\s*sau|truoc khi mac|sau khi mac\s.*(gay|thon|nho|giam)|before\s*\/?\s*after|before and after)\b/,
    why: "So sánh trước/sau về cơ thể — bị cấm khi gợi ý thay đổi vóc dáng.",
    fix: "So sánh trang phục (outfit A vs outfit B) trên cùng một người, không phải cơ thể trước/sau.",
  },
  {
    id: "body-outcome-claim",
    severity: "block",
    ref: "Meta — Unrealistic outcomes; Luật Quảng cáo Đ.8 k.9 (misleading)",
    re: /\b(giam|bot|thon|nho)\s*(ngay\s*)?\d+\s*(cm|kg|size|so)\b|\b(giam can|dot mo|tan mo|dao thai|chua dau lung|tri cong vec|chinh cot song)\b/,
    why: "Hứa kết quả cơ thể/sức khoẻ ('giảm 5cm eo', 'đốt mỡ'). Đồ gen/nịt bụng hay vướng nhất.",
    fix: "Mô tả cảm giác khi mặc ('ôm gọn khi mặc', 'tạo dáng gọn gàng') — không hứa giảm số đo hay tác dụng sức khoẻ.",
  },
  {
    id: "superlative",
    severity: "warn",
    ref: "Luật Quảng cáo 2012 Đ.8 k.11",
    re: /\b(re nhat|tot nhat|dep nhat|duy nhat|so 1|so mot|number one|no\.? ?1|hang dau|dinh nhat|chat nhat|xin nhat|ban chay nhat|best seller so 1)\b/,
    why: "Từ 'nhất / số 1 / duy nhất' chỉ được dùng khi có tài liệu chứng minh hợp pháp.",
    fix: "Thay bằng điều kiểm chứng được: 'đã bán 12.000 chiếc (T1–T6/2026, số liệu nội bộ)' — hoặc bỏ.",
  },
  {
    id: "fake-urgency",
    severity: "warn",
    ref: "Meta — Misleading content; Luật Quảng cáo Đ.8 k.9",
    re: /\b(chi con \d+ (phut|gio|chiec|suat)|cuoi cung|last chance|sap het|het hang ngay|gia chi hom nay|duy nhat hom nay|chi hom nay|dem nguoc|countdown)\b/,
    why: "Khẩn cấp phải có thật. Nếu 'chỉ còn 3 chiếc' hay 'chỉ hôm nay' không đúng, đó là quảng cáo sai sự thật.",
    fix: "Ghi mốc thật: 'Ưu đãi đến 23:59 ngày 11/11' và đảm bảo nó kết thúc đúng lúc đó.",
  },
  {
    id: "discount-no-reference",
    severity: "warn",
    ref: "Nghị định 81/2018/NĐ-CP (khuyến mại) — mức giảm tính trên giá trước khuyến mại",
    // Flagged below in code: a % off with no visible original price.
    re: /\b(giam|sale|off|sale off|giam gia)\s*(den\s*|toi\s*|upto\s*|up to\s*)?\d{1,3}\s*%/,
    why: "Có % giảm nhưng không thấy giá gốc. Mức giảm phải tính trên giá bán thật trước khuyến mại; mức giảm tối đa có giới hạn theo luật.",
    fix: "Ghi cả giá gốc và giá sau giảm ('~~459.000đ~~ → 299.000đ'), và giữ bằng chứng giá gốc đã bán thật.",
  },
  {
    id: "discount-over-cap",
    severity: "warn",
    ref: "Nghị định 81/2018/NĐ-CP (sửa đổi bởi 128/2024 và 239/2026) — kiểm tra hạn mức giảm giá hiện hành của Bộ Công Thương",
    re: /\b(giam|sale|off|giam gia)\s*(den\s*|toi\s*|upto\s*|up to\s*)?([5-9]\d|100)\s*%/,
    why: "Giảm từ 50% trở lên từng bị giới hạn bởi Nghị định 81/2018; quy định đã sửa năm 2024 và 2026, nên phải kiểm tra hạn mức đang áp dụng trước khi chạy.",
    fix: "Hỏi người phụ trách pháp lý/kế toán hạn mức hiện hành (hoặc tra vbpl.vn), giữ giá gốc thật làm mốc; nếu chưa chắc, đổi sang ưu đãi khác (tặng kèm, freeship).",
  },
  {
    id: "health-claim",
    severity: "block",
    ref: "Luật Quảng cáo — quảng cáo sức khoẻ cần xác nhận; Meta — Health claims",
    re: /\b(chua benh|chua khoi|tri benh|tri mun|tri nam|tri hoi chan|dieu tri|chong ung thu|khang khuan 100|diet khuan 100|tang chieu cao|an toan tuyet doi|bac si khuyen dung|duoc bo y te)\b/,
    why: "Tuyên bố chữa bệnh/công dụng y tế cho quần áo — cần giấy tờ chứng minh, thường bị từ chối.",
    fix: "Chỉ nêu đặc tính vải có kiểm định kèm nguồn ('vải kháng khuẩn — kiểm định [đơn vị], 2026'), hoặc bỏ.",
  },
  {
    id: "fake-brand",
    severity: "block",
    ref: "Meta — Intellectual property; Luật SHTT",
    re: /\b(rep 1:1|replica|super fake|sf|hang fake|like auth|nhu auth|y hang hieu|dupe (gucci|chanel|dior|lv|louis vuitton|prada|zara))\b/,
    why: "Gợi ý hàng nhái thương hiệu — vi phạm sở hữu trí tuệ, tài khoản quảng cáo có thể bị khoá.",
    fix: "Nói về kiểu dáng/chất liệu của chính sản phẩm, không nhắc thương hiệu người khác.",
  },
  {
    id: "shouting",
    severity: "info",
    ref: "Meta — ad quality (low-quality / engagement-bait signals)",
    test: (raw) => {
      const words = raw.split(/\s+/).filter((w) => /\p{L}{3,}/u.test(w));
      const caps = words.filter((w) => w === w.toUpperCase() && w !== w.toLowerCase());
      return words.length >= 6 && caps.length / words.length > 0.4;
    },
    why: "Viết hoa gần hết câu — trông như spam, hạ chất lượng quảng cáo.",
    fix: "Viết hoa tối đa 1–2 từ khoá.",
  },
  {
    id: "engagement-bait",
    severity: "warn",
    ref: "Meta — engagement bait",
    re: /\b(tha tim|like va share|share de nhan|comment \d+ de|binh luan \d+ de|tag \d+ (nguoi|ban) de|tag ban be de nhan)\b/,
    why: "Kêu gọi like/share/tag để nhận quà bị Meta hạ phân phối.",
    fix: "Kêu gọi hành động thật: 'Nhắn tin để được tư vấn size'.",
  },
];

/** Lint one ad copy. Returns findings sorted block → warn → info. */
export function lint(text) {
  const raw = String(text ?? "");
  const f = fold(raw);
  const findings = [];
  for (const r of RULES) {
    let hit = null;
    if (r.test) hit = r.test(raw) ? raw.slice(0, 40) : null;
    else {
      const m = f.match(r.re);
      hit = m ? m[0] : null;
    }
    if (!hit) continue;
    if (r.id === "discount-no-reference" && hasReferencePrice(raw)) continue;
    findings.push({ rule: r.id, severity: r.severity, match: hit, why: r.why, fix: r.fix, ref: r.ref });
  }
  const order = { block: 0, warn: 1, info: 2 };
  return findings.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Two distinct prices in the copy (e.g. "459.000đ → 299.000đ") count as a reference price. */
export function hasReferencePrice(raw) {
  const prices = String(raw).match(/\d{1,3}(?:[.,]\d{3})+\s*(?:đ|d|vnd|₫)|\d{2,4}\s*k\b/gi) ?? [];
  return new Set(prices.map((p) => p.replace(/\s/g, "").toLowerCase())).size >= 2 || /gia goc|giá gốc|was\s*\d/i.test(raw);
}

export function verdict(findings) {
  if (findings.some((x) => x.severity === "block")) return "BLOCK";
  if (findings.some((x) => x.severity === "warn")) return "REVIEW";
  return "CLEAN";
}

function loadAds(file, text) {
  if (/\.json$/i.test(file)) {
    const j = JSON.parse(text);
    const arr = Array.isArray(j) ? j : j.ads ?? [];
    return arr.map((a, i) => ({ id: a.id ?? a.name ?? `ad-${i + 1}`, text: [a.headline, a.primary_text ?? a.text, a.description].filter(Boolean).join("\n") }));
  }
  // Plain text: ads separated by a line of --- (one ad if none).
  return text.split(/^\s*-{3,}\s*$/m).map((t, i) => ({ id: `ad-${i + 1}`, text: t.trim() })).filter((a) => a.text);
}

if (await isMain(import.meta.url)) {
  const a = args(process.argv.slice(2));
  if (a.help || (!a._[0] && typeof a.text !== "string")) {
    console.log(`policy-lint.mjs — pre-flight ad copy against Meta policy patterns and VN advertising rules
usage: node scripts/ads/policy-lint.mjs <ad.txt|ads.json> [--json]
       node scripts/ads/policy-lint.mjs --text "copy here"
ads.txt: several ads separated by a line of ---. ads.json: [{id, headline, primary_text, description}].
exit code 2 when any ad is BLOCK. env: none. A linter, not legal advice and not Meta's review.`);
    process.exit(a.help ? 0 : 1);
  }
  try {
    const ads = typeof a.text === "string" ? [{ id: "text", text: a.text }] : loadAds(a._[0], readText(a._[0]));
    const res = ads.map((ad) => { const f = lint(ad.text); return { id: ad.id, verdict: verdict(f), findings: f }; });
    if (a.json) console.log(JSON.stringify(res, null, 2));
    else {
      for (const r of res) {
        console.log(`\n## ${r.id} — ${r.verdict}`);
        for (const x of r.findings) console.log(`  [${x.severity}] ${x.rule}: "${x.match}"\n     ${x.why}\n     → ${x.fix}\n     (${x.ref})`);
      }
      console.log("\nKhông phải tư vấn pháp lý. CLEAN = không khớp mẫu nào, không có nghĩa là chắc chắn được duyệt.");
    }
    process.exit(res.some((r) => r.verdict === "BLOCK") ? 2 : 0);
  } catch (e) {
    console.error(`[policy] ✗ ${e.message}`);
    process.exit(1);
  }
}
