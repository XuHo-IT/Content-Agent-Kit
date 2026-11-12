// spend.mjs — one ledger for every paid call, so "how much did this cost me this month?" has
// an answer.
//
// Each paid provider already quotes before it runs and stops at a per-render ceiling. What no
// single render can see is the MONTH: thirty cheap renders are one large bill. So every paid
// call appends one line here, and a monthly ceiling can refuse the render that would cross it.
//
//   { "at": "2026-11-12T08:00:00Z", "provider": "higgsfield", "kind": "video", "units": 6,
//     "unit": "s", "usd": 0.42, "note": "scene hook" }
//
// `usd` is null where the provider bills in a way the kit cannot price exactly (TTS characters
// on your plan) — the units are still counted, which is what you reconcile against the bill.
//
// ENV: SPEND_LEDGER (default brain/spend.jsonl, relative to where you run),
//      SPEND_MONTHLY_CEILING_USD (optional; the profile's monthlyCeilingUsd wins).
import fs from "node:fs";
import path from "node:path";

export const ledgerPath = (env = process.env) => path.resolve(env.SPEND_LEDGER || path.join("brain", "spend.jsonl"));

/** Append one entry. Never throws — a ledger problem must not fail a render that was paid for. */
export function recordSpend(entry, env = process.env) {
  try {
    const file = ledgerPath(env);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const line = { at: new Date().toISOString(), usd: null, ...entry };
    fs.appendFileSync(file, JSON.stringify(line) + "\n");
  } catch (e) {
    console.warn(`[spend] ! could not write the spend ledger: ${e.message}`);
  }
}

export function readLedger(file = ledgerPath()) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).flatMap((l) => {
    try { return [JSON.parse(l)]; } catch { return []; }
  });
}

const monthOf = (iso) => String(iso).slice(0, 7);
export const thisMonth = (d = new Date()) => d.toISOString().slice(0, 7);

/** Totals for one month: by provider, priced USD, and unpriced units. Pure. */
export function summarize(entries, month = thisMonth()) {
  const rows = entries.filter((e) => monthOf(e.at) === month);
  const by = {};
  let usd = 0;
  for (const e of rows) {
    const k = e.provider ?? "unknown";
    const b = (by[k] ??= { provider: k, calls: 0, usd: 0, units: {}, unpriced: 0 });
    b.calls++;
    if (typeof e.usd === "number") { b.usd += e.usd; usd += e.usd; } else b.unpriced++;
    if (e.units != null) b.units[e.unit ?? "units"] = (b.units[e.unit ?? "units"] ?? 0) + Number(e.units);
  }
  for (const b of Object.values(by)) b.usd = Math.round(b.usd * 100) / 100;
  return { month, calls: rows.length, usd: Math.round(usd * 100) / 100, providers: Object.values(by).sort((a, b) => b.usd - a.usd) };
}

/**
 * Would `addUsd` push this month over the ceiling?
 * @returns {{ok:boolean, spent:number, ceiling:number|null, reason?:string}}
 */
export function checkMonthly(addUsd, { ceiling, entries = readLedger(), month = thisMonth() } = {}) {
  const spent = summarize(entries, month).usd;
  if (ceiling === null || ceiling === undefined || ceiling === "" || Number.isNaN(Number(ceiling))) return { ok: true, spent, ceiling: null };
  const c = Number(ceiling);
  if (spent + addUsd <= c) return { ok: true, spent, ceiling: c };
  return {
    ok: false, spent, ceiling: c,
    reason: `this month's paid spend is $${spent.toFixed(2)}; adding $${addUsd.toFixed(2)} would pass the monthly ceiling of $${c.toFixed(2)}. ` +
      `See: node scripts/analytics/spend.mjs — raise monthlyCeilingUsd in your profile (or SPEND_MONTHLY_CEILING_USD) if you mean to.`,
  };
}

/** The ceiling in force: the profile's monthlyCeilingUsd, else the env var, else none. */
export function monthlyCeiling(settings = {}, env = process.env) {
  if (settings.monthlyCeilingUsd != null) return Number(settings.monthlyCeilingUsd);
  return env.SPEND_MONTHLY_CEILING_USD ? Number(env.SPEND_MONTHLY_CEILING_USD) : null;
}
