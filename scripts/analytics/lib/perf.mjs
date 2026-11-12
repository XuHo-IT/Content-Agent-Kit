// perf.mjs — what happened after posting, and what it says about the next video.
// Pure functions; tests in tests/analytics.test.mjs. CLI: scripts/analytics/perf.mjs.
//
// WHY. Until now the kit stopped at "posted". Nothing looked at which hooks held people, which
// genre travelled, whether 40 s beat 90 s for THIS channel — so every video was planned on
// general advice. This reads the numbers the platforms already give a creator (a CSV export
// from TikTok Studio, Meta Business Suite or YouTube Studio; or YouTube's public API), joins
// them to what the kit knows about each video it made (genre, hook, length, templates, posting
// hour), and reports only differences that have enough videos behind them to mean something.

// ── CSV ──────────────────────────────────────────────────────────────────────

/** RFC 4180-ish: quotes, doubled quotes, CRLF, a BOM, and ; or , or tab as separator. */
export function parseCsv(text) {
  const t = String(text).replace(/^﻿/, "");
  const first = t.split(/\r?\n/, 1)[0] ?? "";
  const sep = [",", ";", "\t"].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"' && t[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const clean = rows.filter((r) => r.some((x) => x.trim()));
  const [head = [], ...body] = clean;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

/**
 * Column → field, by header text in English or Vietnamese. Platforms rename export columns
 * every few months; matching on meaning survives that, matching on exact names does not.
 * Order matters: the first rule that matches a header claims it.
 */
export const COLUMNS = [
  ["completion", /(watched full|full video|completion|xem hết|tỷ lệ xem hết|retention)/i],
  ["avgWatch", /(average watch|avg\.? watch|thời gian xem trung bình|watch time.*avg|average view duration)/i],
  ["views", /(^|\s)(total )?(video )?views?\b|lượt xem|số lượt xem|plays|impressions$/i],
  ["likes", /\blikes?\b|lượt thích|thích|reactions?|cảm xúc/i],
  ["comments", /comments?|bình luận/i],
  ["shares", /shares?|chia sẻ/i],
  ["saves", /saves?|favorites?|lưu/i],
  ["duration", /\bduration\b|thời lượng|length|độ dài/i],
  ["postedAt", /(post(ed)? (time|date)|publish(ed)?( time| date)?|date|ngày đăng|thời gian đăng|created)/i],
  ["url", /\b(link|url|permalink)\b|đường dẫn/i],
  ["id", /\b(video|post|content) ?id\b|^id$/i],
  ["title", /title|caption|tiêu đề|mô tả|description|nội dung/i],
];

export function mapColumns(headers) {
  const out = {};
  for (const h of headers) {
    const hit = COLUMNS.find(([f, re]) => !Object.values(out).includes(f) && re.test(h));
    if (hit) out[h] = hit[0];
  }
  return out;
}

/** "1,2K" / "1.234" / "12.5%" / "0:42" / "42s" → a number (seconds for times, 0–1 for %). */
export function num(v) {
  const s = String(v ?? "").trim().replace(/\s/g, "");
  if (!s || s === "-" || s === "--") return null;
  const mmss = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (mmss) return mmss[3] !== undefined ? Number(mmss[1]) * 3600 + Number(mmss[2]) * 60 + Number(mmss[3]) : Number(mmss[1]) * 60 + Number(mmss[2]);
  const pct = s.match(/^(-?[\d.,]+)%$/);
  if (pct) return Number(pct[1].replace(",", ".")) / 100;
  const k = s.match(/^([\d.,]+)\s*([kKmM]|N|Tr)$/);
  if (k) return Number(k[1].replace(",", ".")) * ({ k: 1e3, K: 1e3, N: 1e3, m: 1e6, M: 1e6, Tr: 1e6 })[k[2]];
  const sec = s.match(/^([\d.,]+)s$/);
  if (sec) return Number(sec[1].replace(",", "."));
  // 1.234.567 or 1,234,567 (thousands) vs 12,5 or 12.5 (decimal)
  const plain = /^\d{1,3}([.,]\d{3})+$/.test(s) ? s.replace(/[.,]/g, "") : s.replace(",", ".");
  const n = Number(plain);
  return Number.isFinite(n) ? n : null;
}

/** CSV rows of one platform export → normalised posts. */
export function normaliseRows(rows, platform) {
  if (!rows.length) return [];
  const map = mapColumns(Object.keys(rows[0]));
  return rows
    .map((r) => {
      const o = { platform };
      for (const [h, f] of Object.entries(map)) o[f] = ["title", "url", "id", "postedAt"].includes(f) ? r[h] : num(r[h]);
      if (o.postedAt) {
        const d = new Date(o.postedAt.replace(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/, "$3-$2-$1")); // dd/mm/yyyy → ISO
        o.postedAt = Number.isNaN(d.getTime()) ? o.postedAt : d.toISOString();
      }
      return o;
    })
    .filter((o) => Number.isFinite(o.views));
}

/** A stable key for de-duplicating re-imports of the same post. */
export const postKey = (p) => `${p.platform}:${p.id || p.url || `${(p.title ?? "").slice(0, 60)}@${String(p.postedAt ?? "").slice(0, 10)}`}`;

/** Merge new rows into the store; a re-import of the same post replaces it (numbers grow). */
export function mergePosts(store, rows, today) {
  const by = new Map((store ?? []).map((p) => [postKey(p), p]));
  for (const r of rows) by.set(postKey(r), { ...by.get(postKey(r)), ...r, importedAt: today });
  return [...by.values()];
}

// ── joining posts to what the kit made ───────────────────────────────────────

const fold = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/\p{M}+/gu, "").replace(/đ/g, "d").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const grams = (s) => new Set(fold(s).split(" ").filter((w) => w.length > 1));

/** Word-overlap similarity of two titles, 0..1 (Dice on word sets, accents ignored). */
export function titleSimilarity(a, b) {
  const A = grams(a), B = grams(b);
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return (2 * n) / (A.size + B.size);
}

/**
 * Features of one video the kit made, from its script.json (create-video) or cuts.json
 * (talking-head). Only what can be read, never guessed.
 */
export function featuresOf(item) {
  const s = item.script ?? {};
  const scenes = Array.isArray(s.scenes) ? s.scenes : [];
  const words = scenes.reduce((a, x) => a + String(x.voiceText ?? "").split(/\s+/).filter(Boolean).length, 0);
  const hook = String(scenes[0]?.voiceText ?? item.hook ?? "").split(/(?<=[.!?…])\s/)[0] ?? "";
  return {
    slug: item.slug,
    title: item.title ?? s.metadata?.title ?? s.title ?? null,
    genre: s.genre ?? item.genre ?? null,
    format: item.cuts ? "talking-head" : scenes.length ? "script" : null,
    durationSec: item.durationSec ?? (words ? Math.round(words / 2.6) : null),
    scenes: scenes.length || null,
    hook: hook || null,
    hookIsQuestion: hook ? /\?\s*$/.test(hook) : null,
    hookHasNumber: hook ? /\d|một|hai|ba|bốn|năm|mười|trăm|nghìn|triệu/i.test(hook) : null,
    theme: typeof s.theme === "string" ? s.theme : s.theme ? "custom" : null,
    style: item.cuts?.style ?? null,
    cards: item.cuts?.edl?.cards?.length ?? null,
  };
}

/** Each post → the made item it most likely is (title similarity ≥ `min`), or none. */
export function matchPosts(posts, items, { min = 0.5 } = {}) {
  return posts.map((p) => {
    let best = null, score = 0;
    for (const it of items) {
      const sc = Math.max(titleSimilarity(p.title, it.title), titleSimilarity(p.title, it.hook));
      if (sc > score) { score = sc; best = it; }
    }
    return { post: p, item: score >= min ? best : null, match: +score.toFixed(2) };
  });
}

// ── what the numbers say ─────────────────────────────────────────────────────

const median = (xs) => {
  const v = xs.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

export const lengthBucket = (s) => (s == null ? null : s < 30 ? "<30s" : s < 60 ? "30–59s" : s < 90 ? "60–89s" : "90s+");
export const hourBucket = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const h = (d.getUTCHours() + 7) % 24; // Vietnam time
  return h < 6 ? "0–6h" : h < 11 ? "6–11h" : h < 14 ? "11–14h" : h < 18 ? "14–18h" : h < 21 ? "18–21h" : "21–24h";
};

/**
 * Per platform, each post's `metric` divided by that platform's median → "lift" (1 = typical
 * for this channel; 2 = twice its usual). Platforms are never compared with each other.
 * Then, per feature, the median lift of each value — reported only when every value compared
 * has at least `minN` posts, and the best is ≥ `minGap`× the worst. Small channels get few
 * findings; that is the point — three videos are an anecdote, not a pattern.
 */
export function insights(joined, { metric = "views", minN = 3, minGap = 1.3 } = {}) {
  const rows = joined.filter((j) => Number.isFinite(j.post[metric]));
  const byPlat = new Map();
  for (const j of rows) byPlat.set(j.post.platform, [...(byPlat.get(j.post.platform) ?? []), j.post[metric]]);
  const base = Object.fromEntries([...byPlat].map(([p, v]) => [p, median(v)]));
  const withLift = rows.map((j) => ({ ...j, lift: base[j.post.platform] ? j.post[metric] / base[j.post.platform] : null }));
  const features = {
    genre: (j) => j.item?.genre,
    format: (j) => j.item?.format,
    length: (j) => lengthBucket(j.item?.durationSec ?? j.post.duration),
    postingHour: (j) => hourBucket(j.post.postedAt),
    hookQuestion: (j) => (j.item?.hookIsQuestion == null ? null : j.item.hookIsQuestion ? "câu hỏi" : "không hỏi"),
    hookNumber: (j) => (j.item?.hookHasNumber == null ? null : j.item.hookHasNumber ? "có con số" : "không số"),
    style: (j) => j.item?.style,
  };
  const findings = [];
  for (const [name, f] of Object.entries(features)) {
    const groups = new Map();
    for (const j of withLift) {
      const v = f(j);
      if (v == null || !Number.isFinite(j.lift)) continue;
      groups.set(v, [...(groups.get(v) ?? []), j.lift]);
    }
    const ok = [...groups].filter(([, l]) => l.length >= minN);
    if (ok.length < 2) continue;
    const ranked = ok.map(([v, l]) => ({ value: v, n: l.length, lift: +median(l).toFixed(2) })).sort((a, b) => b.lift - a.lift);
    const gap = ranked[0].lift / Math.max(0.01, ranked.at(-1).lift);
    if (gap >= minGap) findings.push({ feature: name, best: ranked[0], worst: ranked.at(-1), gap: +gap.toFixed(2), values: ranked });
  }
  const sorted = withLift.filter((j) => Number.isFinite(j.lift)).sort((a, b) => b.lift - a.lift);
  const pick = (j) => ({ title: j.post.title, platform: j.post.platform, [metric]: j.post[metric], lift: +j.lift.toFixed(2), hook: j.item?.hook ?? null, slug: j.item?.slug ?? null });
  return {
    metric,
    posts: rows.length,
    matched: rows.filter((j) => j.item).length,
    baseline: base,
    findings: findings.sort((a, b) => b.gap - a.gap),
    top: sorted.slice(0, 5).map(pick),
    bottom: sorted.slice(-5).reverse().map(pick),
  };
}

/** The markdown the other skills read before planning the next video. */
export function insightsMarkdown(r, { today }) {
  const L = [];
  L.push(`# Hiệu quả video — ${today}`, "");
  L.push(`Thước đo: **${r.metric}**, so với trung vị của chính kênh trên từng nền tảng (1,0 = bình thường). ${r.posts} bài, ${r.matched} khớp với video kit đã làm.`, "");
  if (!r.findings.length) L.push("**Chưa đủ dữ liệu để kết luận** — cần ít nhất 3 bài cho mỗi nhóm so sánh. Đừng đổi cách làm vì vài bài lẻ.", "");
  else {
    L.push("## Điều số liệu nói", "");
    for (const f of r.findings)
      L.push(`- **${f.feature}:** \`${f.best.value}\` đạt ×${f.best.lift} (n=${f.best.n}) so với \`${f.worst.value}\` ×${f.worst.lift} (n=${f.worst.n}) — chênh ${f.gap} lần.`);
    L.push("", "> Tương quan, không phải nhân quả: một chủ đề hot có thể làm cả nhóm đẹp. Thử lại có chủ đích trước khi đổi hẳn.", "");
  }
  const row = (x) => `- ×${x.lift} · ${x.platform} · ${String(x.title ?? "").slice(0, 70)}${x.hook ? ` — hook: "${x.hook.slice(0, 80)}"` : ""}`;
  if (r.top.length) L.push("## Tốt nhất", "", ...r.top.map(row), "");
  if (r.bottom.length) L.push("## Kém nhất", "", ...r.bottom.map(row), "");
  return L.join("\n") + "\n";
}
