#!/usr/bin/env node
// brand-lesson.mjs — eight marketing lessons, each learnt from a brand known for doing that one
// thing well, turned into a worksheet for the USER's brand.
//
//   node scripts/marketing/brand-lesson.mjs --list
//   node scripts/marketing/brand-lesson.mjs --goal "khách mua một lần rồi không quay lại"
//   node scripts/marketing/brand-lesson.mjs --brand grab --brand highlands --business "Tiệm bánh Mây" --out brief.md
//   node scripts/marketing/brand-lesson.mjs --brand pnj --json
//
// The lessons live in templates/BRAND_LESSONS.template.json. What it prints is a METHOD with
// blanks for the user's own answers — never copy for the user's channel. Each lesson's case
// notes are what is commonly said about that brand, printed under a "cần kiểm chứng" heading:
// before a sentence about Grab or PNJ goes into a post, it needs a source (docs/03 — no
// invented facts). Method: docs/32-bai-hoc-thuong-hieu.md. Skill: skills/brand-lessons.
//
// ENV: none. Offline.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const LESSONS_FILE = path.join(KIT, "templates", "BRAND_LESSONS.template.json");

export function loadLessons(file = LESSONS_FILE) {
  return JSON.parse(fs.readFileSync(file, "utf8")).lessons;
}

/** Lower-case, strip Vietnamese diacritics, so "giữ chân" matches "giu chan" and vice versa. */
export function fold(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

/** Find a lesson by id or brand name, forgiving case, accents, spaces and apostrophes. */
export function findLesson(lessons, q) {
  const k = fold(q).replace(/[^a-z0-9]/g, "");
  return lessons.find((l) => fold(l.id).replace(/[^a-z0-9]/g, "") === k || fold(l.brand).replace(/[^a-z0-9]/g, "") === k) ?? null;
}

/**
 * Rank lessons for a goal written in plain words. A keyword counts once, longer keywords
 * weigh more (a phrase is a stronger signal than one word). Ties keep the file's order.
 */
export function suggest(lessons, goal, top = 3) {
  const g = ` ${fold(goal).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ")} `;
  const scored = lessons.map((l, i) => {
    let score = 0;
    const hits = [];
    for (const kw of [...l.keywords, l.topic]) {
      const k = fold(kw).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
      if (k && g.includes(` ${k} `)) {
        score += k.split(" ").length;
        hits.push(kw);
      }
    }
    return { lesson: l, score, hits, i };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, top);
}

/** A Markdown worksheet: the method with blanks for the user's brand. */
export function worksheet(lesson, { business = "thương hiệu của bạn" } = {}) {
  const L = lesson;
  const r = L.kit_route;
  const lines = [
    `## ${L.topic} — học từ ${L.brand}`,
    "",
    `> ${L.one_line}`,
    "",
    `### Áp vào ${business}: các bước`,
    "",
    ...L.method.map((m, i) => `${i + 1}. ${m}`),
    "",
    "### Câu hỏi cần trả lời trước (mỗi câu một dòng trả lời)",
    "",
    ...L.questions.map((q) => `- ${q}\n  - Trả lời: …`),
    "",
    "### Làm bằng kit",
    "",
    `- Skill: ${r.skills.map((s) => `\`${s}\``).join(", ")}`,
    `- Lệnh: ${r.scripts.map((s) => `\`node ${s}\``).join(", ")}`,
    `- Thể loại video (VIDEO_GENRES): ${r.genres.map((s) => `\`${s}\``).join(", ")}`,
    `- Khung hình gợi ý: ${r.frames.map((s) => `\`${s}\``).join(", ")}`,
    "",
    "### Đo bằng",
    "",
    ...L.metrics.map((m) => `- ${m}`),
    "",
    "### Hay sai",
    "",
    ...L.pitfalls.map((p) => `- ${p}`),
    "",
    `### Về ${L.brand} — cần kiểm chứng trước khi trích`,
    "",
    ...L.case_notes.map((c) => `- ${c}`),
    "",
    `_Đây là điều thường được kể, không phải nguồn. Muốn nhắc tới ${L.brand} trong nội dung: tìm trang chính thức hoặc báo uy tín, ghi nguồn; không có thì bỏ. Không dùng tên, logo, nhạc, khẩu hiệu của ${L.brand} như của mình._`,
    "",
  ];
  return lines.join("\n");
}

function help() {
  console.log(
    `brand-lesson.mjs — 8 bài học marketing từ 8 thương hiệu, thành phiếu bài tập cho thương hiệu của bạn\n` +
      `  --list               liệt kê 8 bài học\n` +
      `  --goal "<mục tiêu>"  gợi ý bài học hợp với mục tiêu (viết bằng lời thường)\n` +
      `  --brand <id|tên>     in phiếu bài tập (lặp lại để ghép nhiều bài)\n` +
      `  --business "<tên>"   tên thương hiệu của bạn, điền vào phiếu\n` +
      `  --out <file.md>      ghi phiếu ra file thay vì in\n` +
      `  --json               in dữ liệu thô của bài đã chọn`,
  );
}

async function main(argv) {
  if (!argv.length || argv.includes("--help")) {
    help();
    return argv.length ? 0 : 1;
  }
  const lessons = loadLessons();
  const val = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : undefined);
  const all = (n) => argv.flatMap((a, i) => (a === n && argv[i + 1] ? [argv[i + 1]] : []));

  if (argv.includes("--list")) {
    for (const l of lessons) console.log(`${l.id.padEnd(13)} ${l.brand.padEnd(17)} ${l.topic}`);
    return 0;
  }
  const goal = val("--goal");
  if (goal) {
    const hits = suggest(lessons, goal);
    if (!hits.length) {
      console.log("Không khớp bài nào. Xem cả 8 bài: --list");
      return 0;
    }
    for (const h of hits) console.log(`${h.lesson.id.padEnd(13)} ${h.lesson.topic}  (khớp: ${h.hits.join(", ")})`);
    console.log(`\nIn phiếu: --brand ${hits[0].lesson.id}`);
    return 0;
  }
  const wanted = all("--brand");
  if (!wanted.length) {
    help();
    return 1;
  }
  const picked = [];
  for (const q of wanted) {
    const l = findLesson(lessons, q);
    if (!l) {
      console.error(`[brand-lesson] ✗ không có bài "${q}". Có: ${lessons.map((x) => x.id).join(", ")}`);
      return 1;
    }
    picked.push(l);
  }
  if (argv.includes("--json")) {
    console.log(JSON.stringify(picked, null, 2));
    return 0;
  }
  const business = val("--business") ?? "thương hiệu của bạn";
  const md = [`# Phiếu bài tập — ${business}`, "", ...picked.map((l) => worksheet(l, { business }))].join("\n");
  const out = val("--out");
  if (out) {
    fs.writeFileSync(out, md);
    console.log(`[brand-lesson] ✓ ${out}`);
  } else console.log(md);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
