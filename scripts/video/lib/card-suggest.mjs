// card-suggest.mjs — which illustration card fits which sentence of a talking-head take.
//
// A card is earned by what the speaker SAYS: a number gets a counter, "so với" gets a
// comparison, "bước một" gets a step. This scores every sentence against a small rule table
// and drafts the `cards` block of a talking-head EDL — templateId, an `at` anchored to the
// spoken word that triggered it, a layout, and empty `inputs` for the agent to fill FROM THE
// SENTENCE (never an invented number).
//
// Pacing rules, from editing real reels (and MRT Keyword's planning rules, re-derived):
//   · no card in the hook (first `hookSec`) — the face sells the first seconds
//   · at most `perMin` cards a minute, at least `minGap` seconds apart
//   · never the same template twice in a row; full and pip alternate, never 3 of one in a row
//   · the speaker stays on screen ≥ 45% of the time (edl.mjs refuses past 55% hidden)
//
// Pure; tests in tests/speech-edit.test.mjs. CLI: scripts/video/suggest-cards.mjs.
import { fold, sentenceIds } from "./speech-edit.mjs";

// Each rule: the template, words that trigger it (matched without diacritics, as whole
// words or phrases), a regex over the raw sentence, and what the agent fills.
export const CARD_RULES = [
  { id: "frame-trend-stat-odometer", why: "a number is said", re: /\d[\d.,]*\s*(%|phần trăm|lần|triệu|tỷ|tỉ|nghìn|ngàn|k|người|khách|đơn|hồ sơ)(?=$|[^\p{L}])/iu, words: ["gap doi", "gap ba", "phan tram"], anyDigit: 1, fill: "the number exactly as said + its unit + what it counts" },
  { id: "frame-chart-bars", why: "a trend over time", words: ["tang truong", "doanh thu", "bieu do", "tang len", "giam xuong", "moi thang", "moi nam", "growth"], fill: "only figures the speaker gives; else skip the card" },
  { id: "frame-trend-compare-wipe", why: "before vs after / A vs B", words: ["so voi", "thay vi", "truoc day", "con bay gio", "khac voi", "versus", "vs", "before", "after"], fill: "the two sides in the speaker's words" },
  { id: "frame-story-step-numeral", why: "a numbered step", re: /\b(bước|cách)\s*(\d+|một|hai|ba|bốn|năm)\b/i, words: ["dau tien la", "tiep theo la", "buoc tiep theo", "cuoi cung la", "step"], fill: "the step number + the step in ≤ 8 words" },
  { id: "frame-checklist", why: "a list of things", words: ["can chuan bi", "danh sach", "gom co", "bao gom", "checklist", "nhung thu", "cac buoc"], fill: "the items the speaker lists, in order" },
  { id: "frame-trend-price-drop", why: "a price", re: /\d[\d.,]*\s*(k|nghìn|ngàn|triệu|đồng|đ|vnđ|usd|\$)(?=$|[^\p{L}])/iu, words: ["gia chi", "chi con", "giam gia", "sale", "khuyen mai"], fill: "old and new price as said — never a price the speaker did not say" },
  { id: "frame-trend-search-morph", why: "searching for something", words: ["tim kiem", "google", "search", "go vao", "tra cuu"], fill: "the query the speaker types or says" },
  { id: "frame-chat-bubbles", why: "a message / conversation", words: ["tin nhan", "nhan tin", "inbox", "chat", "zalo", "messenger", "hoi minh"], fill: "a real exchange (with permission) or the one the speaker quotes" },
  { id: "frame-trend-phone-notifs", why: "a notification", words: ["thong bao", "notification", "tien ve", "ting ting", "bao tien ve"], fill: "the notifications the speaker describes" },
  { id: "frame-trend-comment-reply", why: "a viewer's comment or question", words: ["binh luan", "comment", "ban hoi", "nhieu ban hoi", "co ban hoi"], fill: "the real comment being answered" },
  { id: "frame-timeline", why: "dates / a sequence in time", re: /\b(năm|tháng)\s*\d{1,4}\b/i, words: ["lich trinh", "moc thoi gian", "timeline"], fill: "the dates and events as said" },
  { id: "frame-terminal", why: "a command / code", words: ["cau lenh", "terminal", "go lenh", "dong code", "command", "chay lenh"], fill: "the exact command" },
  { id: "frame-trend-live-poll", why: "asking the viewer to choose", words: ["ban chon", "binh chon", "ban se chon", "a hay b", "ban thich cai nao"], fill: "the options offered" },
  { id: "frame-quote-testimonial", why: "a quote", words: ["tung noi", "co cau", "noi rang", "chia se rang", "khach noi"], fill: "the quote verbatim, with who said it (permission required)" },
];

/** Score one sentence against every rule → [{rule, score, word}], best first; `word` is the anchor. */
export function scoreSentence(text, words) {
  const f = ` ${words.map((w) => fold(w.w)).join(" ")} `;
  return CARD_RULES.map((rule) => {
    let score = 0, word = null;
    for (const p of rule.words ?? []) {
      if (f.includes(` ${p} `)) {
        score += 2;
        word ??= words.find((w) => fold(w.w) === p.split(" ")[0])?.w ?? null;
      }
    }
    // any figure at all is a weak vote for a counter ("2 đến 3 cán bộ"); list numbering ("Số 3.") is not
    if (rule.anyDigit && /\d/.test(text.replace(/^\W*(s[oố]\s*)?\d+[.):]\s/iu, ""))) {
      score += rule.anyDigit;
      word ??= words.find((w) => /\d/.test(w.w))?.w ?? null;
    }
    const m = rule.re ? text.match(rule.re) : null;
    if (m) {
      score += 3;
      const first = fold(m[0].split(/\s+/)[0]);
      word ??= words.find((w) => fold(w.w) === first)?.w ?? null;
    }
    return { rule, score, word };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Draft cards for a take. → { cards, table } — `cards` go straight into an EDL (`at` is the
 * spoken word + `near` in source seconds, which talking-head resolves), `table` is the
 * human-readable reasoning the agent shows before filling inputs.
 */
export function suggestCards(words, { hookSec = 3, perMin = 6, minGap = 4, cardSec = 3.5, maxHidden = 0.45, avoid = [], fits = () => true } = {}) {
  if (!words.length) return { cards: [], table: [] };
  const sid = sentenceIds(words);
  const sentences = [];
  sid.forEach((s, i) => {
    const last = sentences[sentences.length - 1];
    if (last && last.id === s) last.words.push(words[i]);
    else sentences.push({ id: s, words: [words[i]] });
  });
  const total = words[words.length - 1].end - words[0].start;
  const budget = Math.max(1, Math.floor((total / 60) * perMin));

  // every sentence, scored; the strongest claims its slot first — a weak "any number" vote
  // must not take the slot a "30 đến 50 hồ sơ" right after it deserves
  const rows = sentences.map((s) => {
    const text = s.words.map((w) => w.w).join(" ");
    const start = s.words[0].start;
    const ranked = scoreSentence(text, s.words);
    return { s, text, start, ranked, row: { at: +start.toFixed(2), text, options: ranked.slice(0, 3).map((x) => `${x.rule.id}(${x.score})`), pick: null, note: "" } };
  });
  const picked = [];
  let hidden = 0;
  for (const r of [...rows].filter((r) => r.ranked.length).sort((a, b) => b.ranked[0].score - a.ranked[0].score || a.start - b.start)) {
    const { s, ranked, row, start, text } = r;
    if (start - words[0].start < hookSec) { row.note = "hook — face only"; continue; }
    if (picked.length >= budget) { row.note = `budget ${budget} reached`; continue; }
    const dur = Math.max(1.5, Math.min(cardSec, s.words[s.words.length - 1].end - start + 0.6));
    // neighbours in TIME, whatever order they were picked in
    const before = picked.filter((c) => c.near <= start).sort((a, b) => b.near - a.near)[0];
    const after = picked.filter((c) => c.near > start).sort((a, b) => a.near - b.near)[0];
    // the same card twice in a row reads as a loop — unless they are far enough apart to be forgotten
    const close = (c) => c && Math.abs(c.near - start) < 12;
    const choice = ranked.find((x) => !(close(before) && x.rule.id === before.templateId) && !(close(after) && x.rule.id === after.templateId));
    if (!choice) { row.note = "same template as the card next to it"; continue; }
    const anchor = choice.word ?? s.words[0].w;
    const at = s.words.find((w) => w.w === anchor)?.start ?? start;
    if ((before && at < before.near + before.dur + minGap) || (after && after.near < at + dur + minGap)) { row.note = `< ${minGap}s from another card`; continue; }
    if (avoid.some((b) => at < b.at + b.dur && b.at < at + dur)) { row.note = "a B-roll is already there"; continue; }
    if (!fits(at, dur)) { row.note = "would straddle a segment cut"; continue; }
    if ((hidden + dur * 0.75) / total > maxHidden) { row.note = "would hide the speaker too long"; continue; }
    picked.push({ at: anchor, near: +at.toFixed(2), dur: +dur.toFixed(1), layout: "full", templateId: choice.rule.id, inputs: {}, _said: text, _fill: choice.rule.fill });
    row.pick = choice.rule.id;
    hidden += dur * 0.75; // layouts are set below; budget for the average of full (1) and pip (0.5)
  }
  picked.sort((a, b) => a.near - b.near);
  // full, pip, full, pip… — the speaker comes back between two cut-aways
  picked.forEach((c, i) => (c.layout = i % 2 ? "pip" : "full"));
  return { cards: picked, table: rows.map((r) => r.row) };
}
