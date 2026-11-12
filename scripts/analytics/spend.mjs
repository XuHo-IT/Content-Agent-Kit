#!/usr/bin/env node
// spend.mjs — what the paid providers cost this month, from the ledger every paid call writes.
//
//   node scripts/analytics/spend.mjs                  # this month
//   node scripts/analytics/spend.mjs --month 2026-10
//   node scripts/analytics/spend.mjs --json
//
// Video providers (Veo, fal, Higgsfield) are priced per clip from their own quotes. Cloud
// voices and Ayrshare are counted in units (characters, posts) — their price depends on your
// plan, so reconcile those against the provider's invoice. Ledger: scripts/lib/spend.mjs.
//
// ENV: SPEND_LEDGER, SPEND_MONTHLY_CEILING_USD.
import { loadEnv } from "../lib/env.mjs";
import { readLedger, summarize, thisMonth, ledgerPath, monthlyCeiling } from "../lib/spend.mjs";

loadEnv();
const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log(
    `spend.mjs — paid-provider spend for a month\n` +
      `  --month YYYY-MM   which month (default this one)\n` +
      `  --json            machine-readable\n` +
      `env: SPEND_LEDGER (default brain/spend.jsonl), SPEND_MONTHLY_CEILING_USD`,
  );
  process.exit(0);
}
const month = argv.includes("--month") ? argv[argv.indexOf("--month") + 1] : thisMonth();
const s = summarize(readLedger(), month);
if (argv.includes("--json")) {
  console.log(JSON.stringify(s, null, 2));
  process.exit(0);
}
console.log(`Paid spend — ${month}   (ledger: ${ledgerPath()})`);
if (!s.calls) {
  console.log("  nothing recorded. Free pipeline only, or the ledger lives elsewhere (SPEND_LEDGER).");
  process.exit(0);
}
for (const p of s.providers) {
  const units = Object.entries(p.units).map(([u, n]) => `${Math.round(n).toLocaleString("en-US")} ${u}`).join(", ");
  const money = p.unpriced === p.calls ? "plan-priced" : `$${p.usd.toFixed(2)}`;
  console.log(`  ${p.provider.padEnd(14)} ${String(p.calls).padStart(4)} calls  ${money.padStart(12)}   ${units}`);
}
console.log(`  ${"total".padEnd(14)} ${String(s.calls).padStart(4)} calls  ${("$" + s.usd.toFixed(2)).padStart(12)}   (priced calls only)`);
const ceiling = monthlyCeiling();
if (ceiling != null) {
  const pct = Math.round((s.usd / ceiling) * 100);
  console.log(`  monthly ceiling $${ceiling.toFixed(2)} — ${pct}% used${pct >= 80 ? "  ⚠ close to the limit" : ""}`);
}
