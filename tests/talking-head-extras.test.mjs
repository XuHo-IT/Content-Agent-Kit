// The talking-head additions from the docs/30 backlog: split cards, voice-only takes, text
// behind the speaker, automatic card sounds, card slot checks, face-aware text placement,
// covers + post briefs, and batch rendering. Pure functions only — no ffmpeg, no Python.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import {
  validateEdl, CARD_LAYOUTS, autoCardSfx, withAutoSfx, DEFAULT_CARD_SFX, splitCardFit, cardSlotProblems,
} from "../scripts/video/lib/edl.mjs";
import { resolveAnchors } from "../scripts/video/lib/speech-edit.mjs";
import { suggestCards, FALLBACK_RULES } from "../scripts/video/lib/card-suggest.mjs";
import { headBox, textSlot, splitSpeakerY, moveAssEvents } from "../scripts/video/lib/faces.mjs";
import { sentencesOf, postDraft, POST_LIMITS } from "../scripts/video/lib/post-draft.mjs";
import { titleProblems, pickCoverTime } from "../scripts/video/cover.mjs";
import { parseList, isDone, failureLines } from "../scripts/video/render-batch.mjs";
import { sampleTimes } from "../scripts/video/face-boxes.mjs";
import { MODELS } from "../scripts/video/lib/vision.mjs";

const seg = { segments: [{ from: 0, to: 30 }] };
const card = (o) => ({ at: 5, dur: 3, templateId: "frame-checklist", ...o });

test("split is a card layout, and it costs half like pip", () => {
  assert.ok(CARD_LAYOUTS.includes("split"));
  // 3 full cards of 6 s in 30 s = 60% hidden → refused; as split they count 30% → fine
  const cards = [0, 1, 2].map((i) => card({ at: 2 + i * 9, dur: 6 }));
  assert.match(validateEdl({ ...seg, cards }).join(), /hide the speaker/);
  assert.deepEqual(validateEdl({ ...seg, cards: cards.map((c) => ({ ...c, layout: "split" })) }), []);
  assert.match(validateEdl({ ...seg, cards: [card({ layout: "split", speakerY: 2000 })] }).join(), /speakerY/);
});

test("voice-only refuses what needs a picture and lifts the hide-the-speaker ceiling", () => {
  const cards = [0, 1, 2].map((i) => card({ at: 2 + i * 9, dur: 6 }));
  assert.deepEqual(validateEdl({ ...seg, cards }, { audioOnly: true }), []);
  assert.match(validateEdl({ ...seg, cards: [card({ layout: "pip" })] }, { audioOnly: true }).join(), /voice-only/);
  assert.match(validateEdl({ ...seg, broll: [{ at: 2, src: 40, dur: 2 }] }, { audioOnly: true }).join(), /broll/);
  assert.match(validateEdl({ ...seg, behind: [{ at: 2, dur: 2, text: "GẤP 3" }] }, { audioOnly: true }).join(), /needs a speaker/);
});

test("behind: text 1–24 chars, 1–6 s, inside a segment, never under a full card", () => {
  assert.deepEqual(validateEdl({ ...seg, behind: [{ at: 2, dur: 2.5, text: "GẤP 3" }] }), []);
  assert.match(validateEdl({ ...seg, behind: [{ at: 2, dur: 2.5, text: "" }] }).join(), /1–24/);
  assert.match(validateEdl({ ...seg, behind: [{ at: 2, dur: 2.5, text: "x".repeat(25) }] }).join(), /1–24/);
  assert.match(validateEdl({ ...seg, behind: [{ at: 2, dur: 9, text: "A" }] }).join(), /1–6/);
  assert.match(validateEdl({ ...seg, behind: [{ at: 29, dur: 3, text: "A" }] }).join(), /inside one segment/);
  assert.match(validateEdl({ ...seg, cards: [card({ at: 4 })], behind: [{ at: 5, dur: 2, text: "A" }] }).join(), /full card/);
  assert.deepEqual(validateEdl({ ...seg, cards: [card({ at: 4, layout: "pip" })], behind: [{ at: 5, dur: 2, text: "A" }] }), []);
});

test("behind anchors to a spoken word like cards do", () => {
  const words = [{ w: "tăng", start: 3, end: 3.4 }, { w: "gấp", start: 3.5, end: 3.8 }];
  const r = resolveAnchors({ ...seg, behind: [{ at: "gấp", dur: 2, text: "GẤP 3" }] }, words);
  assert.deepEqual(r.problems, []);
  assert.equal(r.edl.behind[0].at, 3.35);
  // an EDL without behind keeps not having one
  assert.equal("behind" in resolveAnchors(seg, words).edl, false);
});

test("automatic card sounds: whole-word template meaning, opt-out, and never crowding", () => {
  assert.equal(autoCardSfx("frame-checklist"), DEFAULT_CARD_SFX); // "check" inside "checklist" is not a success
  assert.equal(autoCardSfx("frame-myth-buster"), "fail/cc0-error-beep");
  assert.equal(autoCardSfx("frame-verdict"), "success/cc0-tada");
  const out = withAutoSfx([
    { start: 1, templateId: "frame-a" },
    { start: 2.5, templateId: "frame-b" }, // < 3 s after the last sound → none
    { start: 6, templateId: "frame-c", sfx: false }, // opted out
    { start: 7, templateId: "frame-d", sfx: "reveal/cc0-deep-boom" }, // its own sound is kept
    { start: 9, templateId: "frame-e" }, // only 2 s after d → none
    { start: 12, templateId: "frame-f" },
  ]);
  assert.deepEqual(out.map((c) => c.sfx ?? null), [DEFAULT_CARD_SFX, null, null, "reveal/cc0-deep-boom", null, DEFAULT_CARD_SFX]);
  assert.equal(out[0].sfxAuto, true);
  assert.equal(out[3].sfxAuto, undefined);
});

test("split card framing: the content band at full size, scaled only when taller than the half", () => {
  assert.deepEqual(splitCardFit({ y1: 698, y2: 1192 }), { mode: "crop", y: 465 });
  assert.deepEqual(splitCardFit(null), { mode: "crop", y: 480 });
  assert.deepEqual(splitCardFit({ y1: 0, y2: 1919 }), { mode: "crop", y: 480 }); // nothing found
  assert.deepEqual(splitCardFit({ y1: 300, y2: 1500 }), { mode: "fit", y: 260, h: 1280 });
  assert.equal(splitCardFit({ y1: 1700, y2: 1900 }).y, 960); // clamped inside the frame
});

test("card inputs are checked against the slots the template reads", () => {
  const slots = { "frame-trend-word-pop": ["accent", "line", "sub", "tag"] };
  const of = (id) => slots[id] ?? null;
  assert.deepEqual(cardSlotProblems([card({ templateId: "frame-trend-word-pop", inputs: { line: "x", _said: "note" } })], of), []);
  const p = cardSlotProblems([card({ templateId: "frame-trend-word-pop", inputs: { sentence: "x", payoff: "y" } })], of, (k) => (k === "sentence" ? "line" : null));
  assert.match(p[0], /no slot "sentence".*did you mean "line"/);
  assert.match(p.at(-1), /sample text/);
  assert.match(cardSlotProblems([card({ templateId: "frame-nope" })], of)[0], /not a template/);
});

test("voice-only suggestions: every sentence can get a card, all full, alternating fallbacks", () => {
  const words = [];
  let t = 0;
  for (const s of ["Hôm nay trời đẹp quá.", "Mình đi dạo một vòng.", "Công viên rất đông người.", "Ai cũng vui vẻ cả."]) {
    for (const w of s.split(" ")) { words.push({ w, start: t, end: t + 0.35 }); t += 0.4; }
    t += 0.8;
  }
  const plain = suggestCards(words);
  assert.equal(plain.cards.length, 0); // no rule matches small talk
  const voice = suggestCards(words, { maxHidden: 1, layouts: ["full"], hookSec: 0, minGap: 0.5, perMin: 30, fallback: true });
  // back-to-back sentences cannot both be carded (a card outlasts its sentence) — every other one is
  assert.ok(voice.cards.length >= 2, `only ${voice.cards.length} cards`);
  assert.ok(voice.cards.every((c) => c.layout === "full"));
  const ids = voice.cards.map((c) => c.templateId);
  assert.ok(ids.every((id) => FALLBACK_RULES.some((r) => r.id === id)));
  for (let i = 1; i < ids.length; i++) assert.notEqual(ids[i], ids[i - 1], "the same fallback twice in a row");
});

test("headBox grows the face over hair and chin, unions frames, refuses a rare face", () => {
  const f = (x, y, w, h, score = 0.9) => ({ faces: [{ x, y, w, h, score }] });
  const b = headBox([f(400, 500, 200, 260), f(420, 520, 200, 260), f(410, 510, 200, 260)], { W: 1080, H: 1920 });
  assert.equal(b.y, Math.round(500 - 260 * 0.45));
  assert.equal(b.y + b.h, Math.round(520 + 260 * 1.2));
  assert.equal(b.hits, 3);
  // seen in 1 of 4 frames → no box
  assert.equal(headBox([f(400, 500, 200, 260), { faces: [] }, { faces: [] }, { faces: [] }], { W: 1080, H: 1920 }), null);
  // low-confidence detections do not count; the biggest face wins
  const two = headBox([{ faces: [{ x: 0, y: 0, w: 50, h: 50, score: 0.95 }, { x: 500, y: 600, w: 300, h: 380, score: 0.9 }] }], { W: 1080, H: 1920, minHit: 1 });
  assert.equal(two.x, Math.round(500 - 300 * 0.18));
  assert.equal(headBox([f(1, 1, 100, 100, 0.3)], { W: 1080, H: 1920, minHit: 1 }), null);
});

test("textSlot keeps the style's spot when clear, moves below or above the head, never off-screen", () => {
  const H = 1920, boxH = 150, pref = { an: 2, marginV: 499 }; // caption band ≈ 1271–1421
  assert.equal(textSlot(null, { H, boxH, pref }), null);
  assert.equal(textSlot({ x: 0, y: 200, w: 500, h: 600 }, { H, boxH, pref }), null); // head above the band
  // head over the band, room below it
  assert.deepEqual(textSlot({ x: 0, y: 900, w: 500, h: 450 }, { H, boxH, pref }), { an: 2, marginV: H - (900 + 450 + 24) - boxH });
  // no room below → above the head
  assert.deepEqual(textSlot({ x: 0, y: 700, w: 500, h: 1000 }, { H, boxH, pref }), { an: 8, marginV: 700 - 24 - boxH });
  // a close-up filling the frame → nowhere fits, stay put
  assert.equal(textSlot({ x: 0, y: 0, w: 1080, h: 1800 }, { H, boxH, pref }), null);
  // safeTop keeps split-card captions in the bottom half even when "above" would fit
  assert.equal(textSlot({ x: 0, y: 1150, w: 500, h: 600 }, { H, boxH, pref, safeTop: 0.52 }), null);
});

test("splitSpeakerY frames the head in the speaker's half", () => {
  assert.equal(splitSpeakerY(null), 200);
  assert.equal(splitSpeakerY({ x: 0, y: 300, w: 400, h: 500 }), Math.round(550 - 960 * 0.38));
  assert.equal(splitSpeakerY({ x: 0, y: 0, w: 400, h: 100 }), 0);
  assert.equal(splitSpeakerY({ x: 0, y: 1700, w: 400, h: 200 }), 960);
});

test("moveAssEvents moves only the named style, inside its window, keeping commas in the text", () => {
  const ass = [
    "Dialogue: 0,0:00:01.00,0:00:01.50,Word,,0,0,0,,xin, chào",
    "Dialogue: 0,0:00:05.00,0:00:05.50,Word,,0,0,0,,ngoài cửa sổ",
    "Dialogue: 2,0:00:01.00,0:00:02.00,Hook,,0,0,0,,HOOK",
  ].join("\n");
  const r = moveAssEvents(ass, [{ start: 0, end: 3, slot: { an: 8, marginV: 300 } }], { style: "Word" });
  assert.equal(r.moved, 1);
  const lines = r.ass.split("\n");
  assert.equal(lines[0], "Dialogue: 0,0:00:01.00,0:00:01.50,Word,,0,0,300,,{\\an8}xin, chào");
  assert.equal(lines[1], "Dialogue: 0,0:00:05.00,0:00:05.50,Word,,0,0,0,,ngoài cửa sổ");
  assert.equal(lines[2], "Dialogue: 2,0:00:01.00,0:00:02.00,Hook,,0,0,0,,HOOK");
});

test("face sampling stays inside its window and models are pinned by sha256", () => {
  const t = sampleTimes(10, 12, 4);
  assert.deepEqual(t, [10.25, 10.75, 11.25, 11.75]);
  for (const m of Object.values(MODELS)) {
    assert.match(m.sha256, /^[0-9a-f]{64}$/);
    assert.ok(!/latest/.test(m.url), `${m.file} is fetched from a moving "latest" URL`);
  }
});

test("cover: title ≤ 60, the biggest early face, never under a card", () => {
  assert.deepEqual(titleProblems("Đổi bằng lái không cần xếp hàng"), []);
  assert.match(titleProblems("x".repeat(61))[0], /61 characters/);
  assert.match(titleProblems("")[0], /required/);
  const h = (w) => ({ x: 0, y: 0, w, h: w });
  const wins = [{ t: 1, head: h(100) }, { t: 3, head: h(300) }, { t: 5, head: null }, { t: 30, head: h(900) }];
  assert.equal(pickCoverTime(wins, { duration: 40 }), 3); // 30 s is past the first 40%
  assert.equal(pickCoverTime(wins, { duration: 40, avoid: [{ start: 2, end: 4 }] }), 1);
  assert.equal(pickCoverTime([{ t: 30, head: h(900) }], { duration: 40 }), 30); // nothing early → any
  assert.equal(pickCoverTime([{ t: 1, head: null }], { duration: 40 }), null);
});

test("post brief: what was said, by sentence, with the limits and the credit", () => {
  const words = [
    { w: "Rất", start: 0, end: 0.3 }, { w: "tiện.", start: 0.3, end: 0.6 },
    { w: "Không", start: 2, end: 2.3 }, { w: "phải", start: 2.3, end: 2.6 }, { w: "đi", start: 2.6, end: 2.8 }, { w: "lại", start: 2.8, end: 3 },
  ];
  assert.deepEqual(sentencesOf(words), ["Rất tiện.", "Không phải đi lại"]);
  const md = postDraft({ title: "Đổi bằng lái", words, duration: 30.2, credit: "CC BY 3.0" });
  assert.match(md, /12\/60 ký tự/);
  assert.match(md, /- Không phải đi lại/);
  assert.match(md, new RegExp(`${POST_LIMITS.facebookFold} ký tự`));
  assert.match(md, /CC BY 3\.0/);
  assert.doesNotMatch(postDraft({ title: "a", words, duration: 3 }), /Ghi nguồn/);
});

test("render-batch: list parsing, the done check, and what a failure shows", () => {
  const base = path.resolve("/tmp/batch");
  const list = parseList("# week 46\nmon/script.json\n\n  tue/script.json   # redo\nmon/script.json\n", base);
  assert.deepEqual(list, [path.join(base, "mon/script.json"), path.join(base, "tue/script.json")]);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cak-batch-test-"));
  try {
    const script = path.join(dir, "script.json");
    fs.writeFileSync(script, "{}");
    assert.equal(isDone(script), false);
    const video = path.join(dir, "video.mp4");
    fs.writeFileSync(video, "");
    const now = Date.now() / 1000;
    fs.utimesSync(script, now - 60, now - 60);
    fs.utimesSync(video, now, now);
    assert.equal(isDone(script), true);
    fs.utimesSync(script, now + 60, now + 60); // the script was edited after the render
    assert.equal(isDone(script), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const tail = "loading\n[video] ! no \"theme\"\n[video] ✗ renderable, but --strict fails\n";
  assert.deepEqual(failureLines(tail), ['[video] ! no "theme"', "[video] ✗ renderable, but --strict fails"]);
  assert.deepEqual(failureLines("a\nb\nc\nd\ne\n"), ["b", "c", "d", "e"]);
});
