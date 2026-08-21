// tmp-sweep.mjs — remove this kit's leftover scratch directories from the system temp dir.
//
//   node scripts/maintenance/tmp-sweep.mjs [--dry-run] [--older-than <hours>]
//
// WHY THIS EXISTS. The kit writes per-scene scratch directories into %TEMP% — template copies
// (`cak-tpl-`), variables files (`cak-hf-vars-`), contact-sheet tiles (`cak-tsheet-`), image
// conversions (`cak-img-`). Every one of those is removed in a `finally` block now, but a
// `finally` does not run when the process is killed, and renders DO get killed: Ctrl-C, a
// closed terminal, a machine that sleeps mid-render.
//
// So the steady state is not zero. It is "a few, growing slowly", and nothing was ever
// clearing them — 919 `cak-hf-vars-` directories had accumulated before anyone thought to
// look. Individually a few hundred bytes; as a count, unbounded.
//
// Deliberately conservative: it only ever touches directories whose names start with the
// kit's own prefixes, and only ones older than the cutoff, so a sweep cannot delete the
// scratch dir of a render running right now.
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log(
    `tmp-sweep.mjs — clear this kit's leftover scratch dirs from %TEMP%\n` +
      `  --dry-run              list what would go, delete nothing\n` +
      `  --older-than <hours>   age cutoff (default: 24)\n` +
      `env: none`,
  );
  process.exit(0);
}

const dryRun = argv.includes("--dry-run");
const hIdx = argv.indexOf("--older-than");
const cutoffH = hIdx > -1 ? Number(argv[hIdx + 1]) : 24;
if (!(cutoffH >= 0)) {
  console.error(`tmp-sweep: --older-than must be a non-negative number of hours`);
  process.exit(1);
}

/** Only these. Anything else in %TEMP% belongs to someone else. */
const PREFIXES = ["cak-tpl-", "cak-hf-vars-", "cak-tsheet-", "cak-img-"];

const dirSize = (p) => {
  let total = 0;
  const walk = (d) => {
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else {
        try {
          total += fs.statSync(full).size;
        } catch { }
      }
    }
  };
  walk(p);
  return total;
};

const root = tmpdir();
const cutoffMs = Date.now() - cutoffH * 3.6e6;

let names;
try {
  names = fs.readdirSync(root);
} catch (err) {
  console.error(`tmp-sweep: cannot read ${root}: ${err.message}`);
  process.exit(1);
}

const found = [];
for (const name of names) {
  if (!PREFIXES.some((p) => name.startsWith(p))) continue;
  const full = path.join(root, name);
  let st;
  try {
    st = fs.statSync(full);
  } catch {
    continue;
  }
  if (!st.isDirectory()) continue;
  if (st.mtimeMs > cutoffMs) continue; // young enough that a render may still hold it
  found.push({ full, name, bytes: dirSize(full), age: (Date.now() - st.mtimeMs) / 3.6e6 });
}

if (!found.length) {
  console.log(`[tmp] nothing to sweep in ${root} (prefixes: ${PREFIXES.join(", ")}, older than ${cutoffH}h)`);
} else {
  const byPrefix = new Map();
  for (const f of found) {
    const p = PREFIXES.find((x) => f.name.startsWith(x));
    const cur = byPrefix.get(p) ?? { n: 0, bytes: 0 };
    cur.n += 1;
    cur.bytes += f.bytes;
    byPrefix.set(p, cur);
  }
  const mb = (b) => (b / 1048576).toFixed(1);
  console.log(`[tmp] ${root}`);
  for (const [p, v] of byPrefix) console.log(`[tmp]   ${p.padEnd(15)} ${String(v.n).padStart(5)} dirs · ${mb(v.bytes).padStart(8)} MB`);

  let removed = 0;
  let freed = 0;
  if (!dryRun) {
    for (const f of found) {
      try {
        fs.rmSync(f.full, { recursive: true, force: true });
        removed += 1;
        freed += f.bytes;
      } catch { /* held open by another process — leave it for the next sweep */ }
    }
  }
  const total = found.reduce((a, f) => a + f.bytes, 0);
  console.log(
    dryRun
      ? `[tmp] would remove ${found.length} dirs · ${mb(total)} MB (--dry-run, nothing deleted)`
      : `[tmp] ✓ removed ${removed}/${found.length} dirs · freed ${mb(freed)} MB`,
  );
  if (!dryRun && removed < found.length) {
    console.log(`[tmp]   ${found.length - removed} still held by a running process — run again later`);
  }
}
