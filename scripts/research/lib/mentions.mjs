// mentions.mjs — is the brand in the AI's answer? Pure; tests in tests/analytics.test.mjs.
//
// Idea from NiubiGEO (Apache-2.0): ask answer engines the questions customers ask, and count
// whether the brand — and which competitors — come up, and which sources get cited. Written
// fresh here. geo-audit.mjs checks whether a PAGE is quotable; this checks whether the brand
// IS quoted. They answer different questions.

const fold = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/\p{M}+/gu, "").replace(/đ/g, "d");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Entities: [{ name, aliases?: [] }]. Whole-word, accent- and case-insensitive: "Highlands"
 * matches "highlands coffee" but "Phúc Long" does not match "phúc lộc". → { name: count }.
 */
export function countMentions(text, entities) {
  const t = fold(text);
  const out = {};
  for (const e of entities) {
    let n = 0;
    for (const a of [e.name, ...(e.aliases ?? [])].filter(Boolean)) {
      const re = new RegExp(`(^|[^\\p{L}\\p{N}])${esc(fold(a))}(?=$|[^\\p{L}\\p{N}])`, "gu");
      n += (t.match(re) ?? []).length;
    }
    out[e.name] = n;
  }
  return out;
}

/** Domains of the URLs an answer cites (www. stripped), most-cited first. */
export function citedDomains(text) {
  const c = new Map();
  for (const m of String(text).matchAll(/https?:\/\/([^/\s)\]>"']+)/g)) {
    const d = m[1].toLowerCase().replace(/^www\./, "").replace(/[.,;:]+$/, "");
    c.set(d, (c.get(d) ?? 0) + 1);
  }
  return [...c].sort((a, b) => b[1] - a[1]).map(([domain, n]) => ({ domain, n }));
}

/**
 * runs: [{ question, answer }]. → per entity: how many ANSWERS mention it (presence, not
 * repetition — one answer naming a brand five times is still one answer), share of voice
 * among answers that mention anyone, first position; plus per-question detail and domains.
 */
export function shareOfVoice(runs, entities) {
  const per = Object.fromEntries(entities.map((e) => [e.name, { answers: 0, firstPlace: 0 }]));
  const questions = [];
  const domains = new Map();
  let anyMention = 0;
  for (const r of runs) {
    const counts = countMentions(r.answer, entities);
    const present = entities.filter((e) => counts[e.name] > 0);
    if (present.length) anyMention++;
    for (const e of present) per[e.name].answers++;
    // which entity the reader meets first
    const t = fold(r.answer);
    const firstAt = present
      .map((e) => ({ e, at: Math.min(...[e.name, ...(e.aliases ?? [])].map((a) => t.indexOf(fold(a))).filter((i) => i >= 0)) }))
      .sort((a, b) => a.at - b.at)[0];
    if (firstAt) per[firstAt.e.name].firstPlace++;
    for (const d of citedDomains(r.answer)) domains.set(d.domain, (domains.get(d.domain) ?? 0) + d.n);
    questions.push({ question: r.question, mentioned: present.map((e) => e.name), first: firstAt?.e.name ?? null });
  }
  const n = runs.length;
  const table = entities.map((e) => ({
    name: e.name,
    mentionRate: n ? +(per[e.name].answers / n).toFixed(2) : 0,
    shareOfVoice: anyMention ? +(per[e.name].answers / entities.reduce((a, x) => a + per[x.name].answers, 0)).toFixed(2) : 0,
    firstPlace: per[e.name].firstPlace,
  }));
  return { answers: n, table, questions, domains: [...domains].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([domain, count]) => ({ domain, count })) };
}
