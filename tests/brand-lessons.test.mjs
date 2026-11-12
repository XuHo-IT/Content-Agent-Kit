// brand-lessons.test.mjs — the eight brand lessons, and the highlight picker behind README previews.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadLessons, findLesson, suggest, worksheet, fold } from "../scripts/marketing/brand-lesson.mjs";
import { parseMotion, findCuts, pickWindows, withDetail } from "../scripts/video/lib/highlights.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lessons = loadLessons();

test("the eight lessons are there, each with a full method", () => {
  assert.deepEqual(lessons.map((l) => l.id), ["grab", "bitis-hunter", "pnj", "cocoon", "vinamilk", "momo", "highlands", "coca-cola"]);
  for (const l of lessons) {
    assert.ok(l.method.length >= 4, `${l.id}: method too short`);
    assert.ok(l.questions.length >= 3, `${l.id}: needs interview questions`);
    assert.ok(l.case_notes.length >= 1 && l.pitfalls.length >= 1 && l.metrics.length >= 1, `${l.id}: incomplete`);
  }
});

test("every route a lesson names exists in the kit", () => {
  // A lesson pointing at a skill, script, genre or frame that is not there sends the agent
  // looking for something it will never find.
  const skills = new Set(fs.readdirSync(path.join(KIT, "skills")));
  const frames = new Set(fs.readdirSync(path.join(KIT, "video-templates")));
  const g = JSON.parse(fs.readFileSync(path.join(KIT, "templates/VIDEO_GENRES.template.json"), "utf8"));
  const genres = g.genres ?? g;
  for (const l of lessons) {
    const r = l.kit_route;
    for (const s of r.skills) assert.ok(skills.has(s), `${l.id}: no skill ${s}`);
    for (const s of r.scripts) assert.ok(fs.existsSync(path.join(KIT, s)), `${l.id}: no script ${s}`);
    for (const s of r.frames) assert.ok(frames.has(s), `${l.id}: no frame ${s}`);
    for (const s of r.genres) assert.ok(genres[s], `${l.id}: no genre ${s}`);
  }
});

test("case notes never carry a figure — numbers about these brands need their own report", () => {
  // 2017 as a year is fine; a revenue, a user count or a percentage is not.
  for (const l of lessons) {
    for (const c of l.case_notes) {
      assert.ok(!/\d+\s*(%|triệu|tỷ|nghìn|ngàn|million|billion|k\b)/i.test(c), `${l.id}: a figure in a case note: ${c}`);
    }
  }
});

test("lessons are found by id or brand name, accents and apostrophes aside", () => {
  assert.equal(findLesson(lessons, "Biti's Hunter").id, "bitis-hunter");
  assert.equal(findLesson(lessons, "highlands coffee").id, "highlands");
  assert.equal(findLesson(lessons, "COCA-COLA").id, "coca-cola");
  assert.equal(findLesson(lessons, "shopee"), null);
  assert.equal(fold("Giữ chân Đông"), "giu chan dong");
});

test("a goal in plain words lands on the right lesson, with or without accents", () => {
  assert.equal(suggest(lessons, "khách mua một lần rồi không quay lại, muốn giữ chân khách cũ")[0].lesson.id, "highlands");
  assert.equal(suggest(lessons, "muon lam viral, tang truong nguoi dung moi")[0].lesson.id, "momo");
  assert.equal(suggest(lessons, "đổi logo, làm mới thương hiệu")[0].lesson.id, "vinamilk");
  assert.equal(suggest(lessons, "tìm insight khách hàng")[0].lesson.id, "grab");
  assert.deepEqual(suggest(lessons, "xyz"), []);
});

test("the worksheet puts the user's brand in and keeps the verification warning", () => {
  const md = worksheet(findLesson(lessons, "pnj"), { business: "Tiệm bánh Mây" });
  assert.match(md, /Áp vào Tiệm bánh Mây/);
  assert.match(md, /cần kiểm chứng/);
  assert.match(md, /Trả lời: …/);
  assert.match(md, /`promo-calendar`/);
});

// --- highlights ---------------------------------------------------------------------------

const series = (fn, dur = 30, fps = 8) => Array.from({ length: dur * fps }, (_, i) => ({ t: i / fps, ...fn(i / fps) }));

test("parseMotion reads ffmpeg metadata=print output", () => {
  const txt = "frame:0    pts:0       pts_time:0\nlavfi.signalstats.YAVG=1.5\nframe:1    pts:1  pts_time:0.125\nlavfi.signalstats.YAVG=3\n";
  assert.deepEqual(parseMotion(txt), [{ t: 0, v: 1.5 }, { t: 0.125, v: 3 }]);
});

test("one window per zone, so the preview covers the start, middle and end", () => {
  const s = series(() => ({ v: 2 }));
  const w = pickWindows(s, { duration: 30, count: 3, len: 1.5 });
  assert.equal(w.length, 3);
  assert.ok(w[0].start < 10 && w[1].start > w[0].start + 5 && w[2].start > 18, w.map((x) => x.start).join(" "));
});

test("inside a zone the busiest stretch wins", () => {
  const s = series((t) => ({ v: t >= 4 && t < 6 ? 8 : 1 }));
  const [first] = pickWindows(s, { duration: 30, count: 3, len: 1.5 });
  // The grid steps 0.25s from 0.4s, so 3.9 already holds only busy samples.
  assert.ok(first.start >= 3.75 && first.start <= 4.5, `picked ${first.start}`);
});

test("a hard cut is never the reason a window wins, and windows avoid straddling one", () => {
  // A cut at 7s is a single huge spike; real motion at 2–3.5s is modest but sustained.
  const s = series((t) => ({ v: Math.abs(t - 7) < 0.01 ? 120 : t >= 2 && t < 3.5 ? 5 : 1 }));
  assert.deepEqual(findCuts(s), [7]);
  const [first] = pickWindows(s, { duration: 30, count: 3, len: 1.5 });
  assert.ok(first.clean && first.start >= 1.75 && first.start <= 2.25, `picked ${first.start}`);
});

test("a transition (motion over an empty frame) loses to content building on screen", () => {
  // 3–4.5s: a blur-out — lots of motion, almost no detail. 6–7.5s: a chart drawing — less
  // motion, full detail. Motion alone would pick the transition.
  const s = series((t) => ({
    v: t >= 3 && t < 4.5 ? 9 : t >= 6 && t < 7.5 ? 5 : 1,
    d: t >= 3 && t < 4.5 ? 1 : 10,
  }));
  const [first] = pickWindows(s, { duration: 30, count: 3, len: 1.5 });
  assert.ok(first.start >= 5.75 && first.start <= 6.25, `picked ${first.start}`);
});

test("withDetail joins the edge pass by nearest time", () => {
  const out = withDetail([{ t: 0, v: 1 }, { t: 0.5, v: 2 }], [{ t: 0, v: 7 }, { t: 0.49, v: 9 }]);
  assert.deepEqual(out.map((s) => s.d), [7, 9]);
});
