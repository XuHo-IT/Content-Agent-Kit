// geo-audit.mjs — how QUOTABLE a piece is to an answer engine. Rule-based, no AI needed.
//
//   node scripts/geo-audit.mjs --in brain/<slug>/post.md
//   node scripts/geo-audit.mjs --in post.md --out geo_report.md
//   node scripts/geo-audit.mjs --in post.md --json
//   node scripts/geo-audit.mjs --in post.md --place "Đà Nẵng"
//   node scripts/geo-audit.mjs --help
//
// GEO — Generative Engine Optimization — is writing so that ChatGPT, Perplexity, Google's AI
// Overviews and Claude can lift an answer out of your page and cite it. That is a different
// job from SEO. SEO gets a human to click a ranked link; GEO gets a machine to quote a
// paragraph, and the reader may never arrive at all. The unit of success is a passage that
// survives being cut out of its page.
//
// WHY RULES AND NOT AN LLM. Everything here is decidable by reading the text: does the
// paragraph under a question actually answer it, can a paragraph be understood alone, does a
// number say where it came from. Asking a model to grade this costs a key, a network round
// trip and a different answer every run — and the kit's other audit (`audit-quality.mjs`)
// already established that objective rules beat a graded opinion for anything mechanical.
//
// WHAT IT DOES NOT DO. It does not tell you whether the writing is any good, whether the
// claim is true, or whether an engine will in fact cite you. It measures one property:
// whether a passage still means something once it is quoted on its own.
//
// TWO THINGS ARE CALLED GEO. This file is the *generative engine* one. The *geography* one
// — local and market-led video — is the `local` genre in `templates/VIDEO_GENRES.template.json`
// and the `frame-geo-markers` / `frame-geo-route` templates. `--place` is where they meet:
// a locality that shows up only in paragraph nine is not what the piece is about, and both
// kinds of engine treat it that way.
//
// ENV: none. Bilingual VI + EN throughout, because this kit writes Vietnamese.
import fs from "node:fs";
import path from "node:path";

// ─── text ───────────────────────────────────────────────────────────────────

/** Strip frontmatter, fenced code and inline code — none of it is prose to be quoted. */
export function stripNonProse(md) {
  let s = String(md ?? "");
  s = s.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  s = s.replace(/```[\s\S]*?```/g, "");
  s = s.replace(/`[^`\n]*`/g, "");
  return s;
}

/** Headings as { level, text, line }. */
export function headings(md) {
  const out = [];
  stripNonProse(md).split(/\r?\n/).forEach((line, i) => {
    const m = /^(#{1,6})\s+(.*\S)\s*$/.exec(line);
    if (m) out.push({ level: m[1].length, text: m[2].trim(), line: i + 1 });
  });
  return out;
}

/**
 * Blocks in document order: headings and the paragraphs under them. Tables, lists and quotes
 * are kept as their own kind so a rule can ask for one without re-parsing.
 */
export function blocks(md) {
  const lines = stripNonProse(md).split(/\r?\n/);
  const out = [];
  let buf = [];
  let start = 0;
  const flush = () => {
    const text = buf.join(" ").replace(/\s+/g, " ").trim();
    if (text) out.push({ kind: "para", text, line: start + 1 });
    buf = [];
  };
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return flush();
    const h = /^(#{1,6})\s+(.*\S)\s*$/.exec(line);
    if (h) { flush(); out.push({ kind: "heading", level: h[1].length, text: h[2].trim(), line: i + 1 }); return; }
    // A run of table rows is ONE block. Row by row, a table's numbers each looked unsourced
    // even when the table cited itself in its first row or in the sentence above it.
    if (/^\|.*\|$/.test(line)) {
      flush();
      const prev = out[out.length - 1];
      if (prev?.kind === "table" && prev.endLine === i) { prev.text += ` ${line}`; prev.endLine = i + 1; }
      else out.push({ kind: "table", text: line, line: i + 1, endLine: i + 1 });
      return;
    }
    if (/^[-*+]\s+|^\d+[.)]\s+/.test(line)) { flush(); out.push({ kind: "item", text: line.replace(/^[-*+]\s+|^\d+[.)]\s+/, ""), line: i + 1 }); return; }
    if (!buf.length) start = i;
    buf.push(line);
  });
  flush();
  return out;
}

/** First sentence of a paragraph. Vietnamese uses the same terminators as English. */
export function firstSentence(text) {
  const m = /^(.*?[.!?…])(\s|$)/s.exec(String(text ?? "").trim());
  return (m ? m[1] : String(text ?? "").trim()).trim();
}

export const wordCount = (s) => (String(s ?? "").trim().match(/\S+/g) ?? []).length;

// ─── what an engine is looking at ───────────────────────────────────────────

// `\b` DOES NOT WORK HERE. JavaScript's word boundary is defined on [A-Za-z0-9_], so in "nó"
// the final "ó" is not a word character and `/^nó\b/` never matches — the rules below silently
// passed everything written in Vietnamese with diacritics, which is most of what this kit
// writes. Every boundary in this file is therefore a Unicode lookaround under the `u` flag.
const NOT_LETTER = "(?![\\p{L}\\p{N}])";
const AFTER_BOUNDARY = "(?<![\\p{L}\\p{N}])";

// A heading an engine can match to a query. Vietnamese question words carry no "?" of their
// own in a heading, which is why this is a word list and not a test for punctuation.
const QUESTION_WORDS = new RegExp(
  `^(?:là gì|tại sao|vì sao|thế nào|như thế nào|làm sao|làm thế nào|khi nào|bao nhiêu|có nên|nên|cách|hướng dẫn|so sánh|what|why|how|when|where|which|who|should|can|does|is|are|do)${NOT_LETTER}`,
  "iu",
);
const QUESTION_TAIL = new RegExp(`${AFTER_BOUNDARY}(?:là gì|ra sao|được không|có nên|hay không|không)\\s*\\??\\s*$`, "iu");

export function isQuestionHeading(text) {
  const t = String(text ?? "").trim();
  if (/\?\s*$/.test(t)) return true;
  if (QUESTION_WORDS.test(t)) return true;
  // "X là gì", "X có đắt không" — the question word lands at the end in Vietnamese.
  return QUESTION_TAIL.test(t);
}

// Openers that spend the first sentence announcing that an answer is coming. An engine
// quoting this quotes the announcement.
const PREAMBLE = new RegExp(
  `^(?:trong bài (?:này|viết này)|bài viết này|trước (?:tiên|hết)|đầu tiên|chúng ta (?:hãy|sẽ|cùng)|hãy cùng|cùng (?:tìm hiểu|khám phá)|như (?:bạn|các bạn) (?:đã )?biết|có thể nói|nói đến|khi nói (?:đến|về)|in this (?:article|post|guide)|this (?:article|post|guide)|first(?:ly)?,|let'?s|before we|as you (?:may )?know|when it comes to|in today'?s)${NOT_LETTER}`,
  "iu",
);

export const isPreamble = (s) => PREAMBLE.test(String(s ?? "").trim());

// A paragraph opening with one of these refers to something that will not travel with it.
const DANGLING = new RegExp(
  // "chúng" on its own is a pronoun; "chúng tôi" / "chúng ta" are subjects and perfectly
  // quotable. Without the exclusion this fired on the opening line of most Vietnamese posts,
  // which is how a rule gets ignored.
  `^(?:nó|họ|chúng(?! (?:tôi|ta|mình|em))|điều (?:này|đó)|việc (?:này|đó)|cái (?:này|đó)|đây|đó|vậy nên|do đó|vì vậy|ngoài ra|tuy nhiên|thế nhưng|nhưng|và|còn|it|they|them|this|that|these|those|such|however|therefore|thus|moreover|furthermore|also|but|and|so)${NOT_LETTER}`,
  "iu",
);

export const opensDangling = (s) => DANGLING.test(String(s ?? "").trim());

// A number worth sourcing. The first version of this flagged section numbers ("§4.1"), years
// with a comma stuck to them ("2026,") and every list position on the page, which buried the
// handful of numbers that were actually claims. Three guards, in order of how much noise they
// removed: the match must END on a digit, a `§`/`#`/`v` prefix disqualifies it, and a bare
// number under 20 with no unit is a count, not a measurement.
// The unit may not run into the next word: "2 mô hình" is two models, not two million, and
// the single-letter units are what made that misread possible.
// The trailing `(?![/\-.]\d)` and its mirror keep dates out: "31/05/2026" is a date, and the
// 31 in it was being reported as an unsourced claim on a post that had cited everything.
const NUMBER =
  /(?<![\w.,§#])(?<!\bv)(?<![\d][/\-.])(\d(?:[\d.,]*\d)?)(?![/\-.]\d)\s*(?:(%|phần trăm|tỷ|triệu|nghìn|ngàn|k|m|bn|billion|million|thousand|lần|đ|vnd|usd|\$)(?!\p{L}))?/giu;

export function numericClaims(text) {
  const out = [];
  for (const m of String(text ?? "").matchAll(NUMBER)) {
    const raw = m[1], unit = m[2] ?? "";
    const n = Number(raw.replace(/[.,](?=\d{3}\b)/g, "").replace(",", "."));
    if (!Number.isFinite(n)) continue;
    if (!unit && /^(19|20)\d\d$/.test(raw)) continue; // a year on its own
    if (!unit && n < 20) continue; // "ba bước", "top 5", "§4.1"
    out.push({ value: raw + (unit ? ` ${unit}` : ""), index: m.index ?? 0 });
  }
  return out;
}

// Where a number came from, said in the same breath: a link, a citation, or a naming verb.
//
// The case classes are written out rather than using the `i` flag, because `\p{Lu}` is what
// distinguishes "theo Anthropic" (a named source) from "theo cách này" (not one), and `i`
// would make that class match anything.
// The noun list is long on purpose. "theo log điều phối nội bộ" and "theo bảng chi phí" are
// exactly how an operations number gets cited in Vietnamese, and the first version accepted
// neither — it demanded either a capitalised name or one of six research words, so a
// correctly sourced post still failed.
const SOURCE_NOUNS = "báo cáo|nghiên cứu|khảo sát|số liệu|thống kê|dữ liệu|log|nhật ký|bảng|sổ|hồ sơ|biên bản|hoá đơn|hóa đơn|kết quả đo";
const SOURCE_MARK = new RegExp(
  `(https?://|\\]\\(|[Tt]heo\\s+\\p{Lu}|[Tt]heo\\s+(?:${SOURCE_NOUNS})|[Nn]guồn\\s*[::]|[ĐđDd]o\\s+(?:trên|bằng|được)|tự đo|[Bb]enchmark|[Aa]ccording to|[Pp]er\\s+\\p{Lu}|[Ss]ource\\s*:|[Mm]easured\\s+(?:on|over|across))`,
  "u",
);

export const hasSourceMark = (text) => SOURCE_MARK.test(String(text ?? ""));

// "X là Y" / "X is Y" — the shape an engine lifts for "what is X".
const COPULA = new RegExp(`${AFTER_BOUNDARY}(?:là|nghĩa là|được (?:gọi|hiểu) là|is|are|means|refers to|stands for)${NOT_LETTER}`, "iu");

export const isDefinition = (s) => COPULA.test(String(s ?? "")) && wordCount(s) >= 6;

export const hasDate = (md) =>
  /\b(?:0?[1-9]|[12]\d|3[01])[/\-.](?:0?[1-9]|1[0-2])[/\-.](?:19|20)\d\d\b/.test(md) ||
  /\b(?:19|20)\d\d[/\-.](?:0?[1-9]|1[0-2])[/\-.](?:0?[1-9]|[12]\d|3[01])\b/.test(md) ||
  /\b(?:tháng\s*(?:0?[1-9]|1[0-2])[/\-\s]*(?:năm\s*)?(?:19|20)\d\d)\b/i.test(md) ||
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+(?:19|20)\d\d\b/i.test(md);

// ─── rules ──────────────────────────────────────────────────────────────────

/**
 * Each rule returns { id, level, ok, detail, hits }. `level` is "must" or "should":
 * a failing "must" means a passage cannot survive being quoted; a failing "should" means it
 * survives but an engine has less reason to pick it.
 */
export const RULES = [
  {
    id: "answer-first",
    level: "must",
    title: "Mỗi tiêu đề dạng câu hỏi được trả lời ngay câu đầu tiên",
    run(doc) {
      const hits = [];
      doc.blocks.forEach((b, i) => {
        if (b.kind !== "heading" || !isQuestionHeading(b.text)) return;
        const next = doc.blocks.slice(i + 1).find((x) => x.kind === "para" || x.kind === "item");
        if (!next) return hits.push({ line: b.line, why: `"${b.text}" — không có đoạn nào theo sau` });
        const s = firstSentence(next.text);
        if (isPreamble(s)) hits.push({ line: next.line, why: `"${b.text}" → mở bằng lời dẫn: "${s.slice(0, 60)}…"` });
        else if (wordCount(s) > 30) hits.push({ line: next.line, why: `"${b.text}" → câu trả lời dài ${wordCount(s)} từ (>30)` });
      });
      return { hits, detail: "Câu đầu sau một tiêu đề câu hỏi CHÍNH LÀ đoạn máy trích. Dẫn nhập là thứ bị trích thay cho câu trả lời." };
    },
  },
  {
    id: "question-headings",
    level: "should",
    title: "Có tiêu đề khớp được với câu người ta hỏi",
    run(doc) {
      const hs = doc.blocks.filter((b) => b.kind === "heading" && b.level >= 2);
      if (!hs.length) return { hits: [{ line: 1, why: "không có tiêu đề cấp 2 nào" }], detail: "" };
      const q = hs.filter((h) => isQuestionHeading(h.text));
      const need = Math.ceil(hs.length / 3);
      const hits = q.length >= need ? [] : [{ line: hs[0].line, why: `${q.length}/${hs.length} tiêu đề là câu hỏi, cần ít nhất ${need}` }];
      return { hits, detail: "Máy so tiêu đề với câu truy vấn. Tiêu đề danh từ trống không khớp với câu nào." };
    },
  },
  {
    id: "self-contained",
    level: "must",
    title: "Đoạn nào cũng hiểu được khi đứng một mình",
    run(doc) {
      const hits = doc.blocks
        .filter((b) => b.kind === "para" && opensDangling(b.text))
        .map((b) => ({ line: b.line, why: `mở bằng tham chiếu treo: "${b.text.slice(0, 50)}…"` }));
      return { hits, detail: "Đoạn mở bằng “Nó”, “Điều này”, “However” chỉ đúng khi còn đoạn trước. Bị trích ra là mất nghĩa." };
    },
  },
  {
    id: "sourced-numbers",
    level: "must",
    title: "Số nào cũng nói được lấy ở đâu, ngay trong đoạn đó",
    run(doc) {
      const hits = [];
      doc.blocks.forEach((b, i) => {
        if (b.kind === "heading") return;
        const nums = numericClaims(b.text);
        if (!nums.length) return;
        // A table cites once, inside itself or in the sentence above it — not in every cell.
        // Anything else carries its own source, because a paragraph is what gets quoted alone.
        const scope = b.kind === "table" ? [doc.blocks[i - 1], b].filter(Boolean) : [b];
        if (scope.some((x) => hasSourceMark(x.text))) return;
        hits.push({ line: b.line, why: `${nums.map((n) => n.value).join(", ")} — không có nguồn trong đoạn` });
      });
      return { hits, detail: "Nguồn nằm ở đoạn khác thì không đi cùng câu được trích. Con số không nguồn là con số máy bỏ qua." };
    },
  },
  {
    id: "definition",
    level: "should",
    title: "Có một câu định nghĩa trong màn hình đầu",
    run(doc) {
      const early = doc.blocks.filter((b) => b.kind === "para").slice(0, 3);
      const ok = early.some((b) => isDefinition(firstSentence(b.text)));
      return {
        hits: ok ? [] : [{ line: early[0]?.line ?? 1, why: "ba đoạn đầu không có câu dạng “X là Y”" }],
        detail: "“X là Y” là hình dạng máy lấy khi có người hỏi “X là gì”.",
      };
    },
  },
  {
    id: "dated",
    level: "should",
    title: "Có mốc thời gian rõ ràng",
    run(doc) {
      return {
        hits: hasDate(doc.raw) ? [] : [{ line: 1, why: "không tìm thấy ngày tháng nào" }],
        detail: "Máy trả lời ưu tiên thứ nói rõ mình cũ tới đâu. “Gần đây” không phải một mốc.",
      };
    },
  },
  {
    id: "table",
    level: "should",
    title: "Có ít nhất một bảng",
    run(doc) {
      return {
        hits: doc.blocks.some((b) => b.kind === "table") ? [] : [{ line: 1, why: "không có bảng nào" }],
        detail: "Bảng so sánh là thứ bị trích nhiều nhất, vì nó đã ở sẵn dạng máy trả lời cần.",
      };
    },
  },
];

/** `--place` turns this one on: a locality mentioned late is not what the piece is about. */
export function placeRule(place) {
  const needle = String(place ?? "").trim().toLowerCase();
  return {
    id: "place-first",
    level: "must",
    title: `Địa danh “${place}” xuất hiện ở tiêu đề hoặc đoạn đầu`,
    run(doc) {
      const h1 = doc.blocks.find((b) => b.kind === "heading" && b.level === 1);
      const p1 = doc.blocks.find((b) => b.kind === "para");
      const where = `${h1?.text ?? ""} ${p1?.text ?? ""}`.toLowerCase();
      const anywhere = doc.raw.toLowerCase().includes(needle);
      if (where.includes(needle)) return { hits: [], detail: "" };
      return {
        hits: [{ line: p1?.line ?? 1, why: anywhere ? `“${place}” chỉ xuất hiện ở phần sau` : `“${place}” không xuất hiện ở đâu cả` }],
        detail: "Cả máy tìm kiếm địa phương lẫn máy trả lời đều đọc phần mở đầu để biết bài này nói về đâu.",
      };
    },
  };
}

// ─── run ────────────────────────────────────────────────────────────────────

export function audit(md, { place = null } = {}) {
  const doc = { raw: stripNonProse(md), blocks: blocks(md) };
  const rules = place ? [...RULES, placeRule(place)] : RULES;
  const results = rules.map((r) => {
    const { hits, detail } = r.run(doc);
    return { id: r.id, level: r.level, title: r.title, detail, hits, ok: hits.length === 0 };
  });
  const musts = results.filter((r) => r.level === "must");
  const shoulds = results.filter((r) => r.level === "should");
  return {
    results,
    failedMust: musts.filter((r) => !r.ok).length,
    failedShould: shoulds.filter((r) => !r.ok).length,
    // Deliberately not a score out of 100. A number invites tuning the number; the list of
    // failing passages is the thing you act on.
    verdict: musts.every((r) => r.ok) ? (shoulds.every((r) => r.ok) ? "quotable" : "quotable-with-gaps") : "not-quotable",
  };
}

export function report(res, file) {
  const L = [`# GEO audit — ${file}`, "", `**Kết luận:** \`${res.verdict}\``, ""];
  for (const r of res.results) {
    L.push(`## ${r.ok ? "✅" : "❌"} ${r.title} \`${r.id}\` · ${r.level}`);
    if (r.detail) L.push("", `> ${r.detail}`);
    if (!r.ok) {
      L.push("");
      for (const h of r.hits) L.push(`- dòng ${h.line} — ${h.why}`);
    }
    L.push("");
  }
  return L.join("\n");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).endsWith("geo-audit.mjs");
if (isMain) {
  const argv = process.argv.slice(2);
  const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  if (argv.includes("--help") || !argv.length) {
    console.log(
      `geo-audit.mjs — how quotable a piece is to an answer engine (rule-based, no AI)\n` +
        `  --in <file>      markdown to audit (required)\n` +
        `  --out <file>     write the report; default is stdout\n` +
        `  --json           machine-readable instead of markdown\n` +
        `  --place <name>   also require the locality up front (the geography half of "GEO")\n` +
        `exit 1 when a "must" rule fails, so it works as a gate.`,
    );
    process.exit(argv.length ? 0 : 1);
  }
  const inFile = flag("--in");
  if (!inFile) { console.error("geo-audit: --in <file> is required"); process.exit(2); }
  if (!fs.existsSync(inFile)) { console.error(`geo-audit: no such file: ${inFile}`); process.exit(2); }

  const res = audit(fs.readFileSync(inFile, "utf8"), { place: flag("--place") });
  const out = argv.includes("--json") ? JSON.stringify(res, null, 2) : report(res, path.basename(inFile));
  const outFile = flag("--out");
  if (outFile) { fs.writeFileSync(outFile, out); console.log(`geo-audit: ${res.verdict} → ${outFile}`); }
  else console.log(out);
  // A gate, not a linter: a failing "must" is a passage that loses its meaning when quoted.
  process.exitCode = res.failedMust ? 1 : 0;
}
