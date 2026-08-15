// registry-watch.mjs — notice when the upstream template registry moves.
//
//   node scripts/video/registry-watch.mjs           # report; exits 1 if anything drifted
//   node scripts/video/registry-watch.mjs --write   # update the snapshot and the counts
//   node scripts/video/registry-watch.mjs --json    # machine-readable, for the workflow
//
// WHY THIS EXISTS, with the evidence that made it worth writing: the docs said the upstream
// registry held **146** items, in five separate files. It held 176. Thirty items had appeared
// — including a 29-item theme-family commit — and nothing in the repo could notice, because
// the number was typed by hand five times and checked by nothing.
//
// The same blindness covers `PRESETS` in add-template.mjs: it names 29 upstream items, and if
// one is renamed there `--preset news` fails halfway through a fetch instead of at review time.
//
// WHAT IT DOES NOT DO: add templates. A scene template cannot be added by a robot here —
// `theme-probe.mjs` needs Chrome and the CI runner has none, the CATALOG.md entry with slots
// and character limits is written by someone who looked at the frame, and both aspects are
// required while seven of the eight upstream examples ship 16:9 only. Blocks and components
// *would* pass CI, since they have no `index.html` and the template tests skip them — but
// vendoring them wholesale contradicts the argument in docs/17 for `add-template.mjs`
// existing at all. This reports; a person decides.
//
// ENV: GITHUB_TOKEN (optional — only raises the anonymous rate limit).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const REGISTRY_URL = "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/registry.json";
const SNAPSHOT = path.join(KIT, "video-templates", "registry-snapshot.json");

/**
 * Every place the item count is written by hand, with the pattern that finds it.
 *
 * This list IS the fix for the original bug: five files said 146 and none of them was
 * derived from anything. A new mention that is not added here goes stale silently, so the
 * count check below also fails when a file matches the pattern and is not listed.
 */
const COUNT_SITES = [
  { file: "README.vi.md", re: /(\d+) template nữa chỉ cách một câu lệnh/ },
  { file: "README.md", re: /(\d+) more are one command away/ },
  { file: "docs/16-template-registry.md", re: /\*\*(\d+) more\*\* — pull any of them/ },
  { file: "docs/16-template-registry.md", re: /\*\*(\d+) mục\*\* — kéo về bằng lệnh/ },
  { file: "scripts/video/add-template.mjs", re: /Apache-2\.0\) publishes (\d+) items/ },
  { file: "video-templates/CATALOG.md", re: /upstream registry — (\d+) items/ },
  // The per-type table in docs/16 went stale the same way and by more: it said 113 blocks
  // and 25 components against an actual 132 and 36. A number nothing derives is a number
  // that drifts, however carefully it was typed the first time.
  { file: "docs/16-template-registry.md", re: /\| `example` \| (\d+) \|/, of: "example" },
  { file: "docs/16-template-registry.md", re: /\| `block` \| (\d+) \|/, of: "block" },
  { file: "docs/16-template-registry.md", re: /\| `component` \| (\d+) \|/, of: "component" },
];

const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log(
    `registry-watch.mjs — notice when the upstream template registry moves\n` +
      `  --write     update registry-snapshot.json and the documented counts\n` +
      `  --json      emit the report as JSON (the workflow reads this)\n` +
      `  --offline   compare the snapshot against itself; no network\n` +
      `exit 1 when anything drifted, so CI can use it as a gate\n` +
      `env: GITHUB_TOKEN (optional — raises the anonymous rate limit)`,
  );
  process.exit(0);
}
const has = (n) => argv.includes(n);

/** Short type name: "hyperframes:block" → "block". */
const shortType = (t) => String(t).replace(/^hyperframes:/, "");

export function readSnapshot(file = SNAPSHOT) {
  // `exists` matters: with no snapshot every item is technically "added", and reporting 176
  // additions on a first run is noise that teaches the reader to ignore the report.
  if (!fs.existsSync(file)) return { items: {}, exists: false };
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  return { items: raw.items ?? {}, exists: true };
}

/**
 * What changed between two `{name: type}` maps.
 *
 * `changed` matters as much as `added`: an item switching from block to example means the
 * files it ships changed shape, and a vendored copy of it is now stale rather than merely old.
 */
export function diffRegistry(before, after) {
  const added = [];
  const removed = [];
  const changed = [];
  for (const [name, type] of Object.entries(after)) {
    if (!(name in before)) added.push({ name, type });
    else if (before[name] !== type) changed.push({ name, from: before[name], to: type });
  }
  for (const name of Object.keys(before)) {
    if (!(name in after)) removed.push({ name, type: before[name] });
  }
  const by = (a, b) => a.name.localeCompare(b.name);
  return { added: added.sort(by), removed: removed.sort(by), changed: changed.sort(by) };
}

/** Preset names in add-template.mjs that upstream no longer has. */
export function missingPresetItems(source, upstreamNames) {
  const block = source.match(/const PRESETS = \{([\s\S]*?)\n\};/)?.[1] ?? "";
  const named = [...block.matchAll(/"([a-z0-9][a-z0-9-]*)"/g)].map((m) => m[1]);
  const have = new Set(upstreamNames);
  return [...new Set(named.filter((n) => !have.has(n)))];
}

/**
 * Each documented count, and whether it matches the registry.
 *
 * @param {(f: string) => string} readFile
 * @param {number} total          how many items upstream has
 * @param {object} [byType]       `{block: n, component: n, example: n}` for the per-type sites
 */
export function checkCounts(readFile, total, byType = {}, sites = COUNT_SITES) {
  return sites.map((s) => {
    const text = readFile(s.file);
    const m = text.match(s.re);
    const want = s.of ? (byType[s.of] ?? 0) : total;
    return {
      file: s.file,
      of: s.of ?? "total",
      want,
      found: m ? Number(m[1]) : null,
      ok: m ? Number(m[1]) === want : false,
      reason: m ? null : "pattern no longer matches — the wording changed",
    };
  });
}

// ── CLI ───────────────────────────────────────────────────────────────────────

// Run the CLI only when this file IS the entry point. Comparing the resolved file URLs is
// the reliable form; matching on the filename would also fire for any other file with the
// same name, and hand-built `file://` strings differ from pathToFileURL on Windows.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const snap = readSnapshot();
    const before = snap.items;

    let after;
    if (has("--offline")) {
      after = before;
    } else {
      const headers = { "user-agent": "content-agent-kit registry-watch" };
      if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      const res = await fetch(REGISTRY_URL, { headers, signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`registry.json → HTTP ${res.status}`);
      const index = await res.json();
      if (!Array.isArray(index.items)) throw new Error("registry.json has no items array");
      after = Object.fromEntries(index.items.map((i) => [i.name, shortType(i.type)]));
    }

    const total = Object.keys(after).length;
    // On a first run there is nothing to diff against, so the item lists are suppressed
    // entirely rather than presented as 176 new arrivals. The count check still runs — it
    // is the part that was already wrong when this was written.
    const baseline = !snap.exists;
    const { added, removed, changed } = baseline
      ? { added: [], removed: [], changed: [] }
      : diffRegistry(before, after);

    const readFile = (f) => fs.readFileSync(path.join(KIT, f), "utf8");
    const byType = {};
    for (const t of Object.values(after)) byType[t] = (byType[t] ?? 0) + 1;
    const counts = checkCounts(readFile, total, byType);
    const presetGone = missingPresetItems(readFile("scripts/video/add-template.mjs"), Object.keys(after));

    const drifted = added.length || removed.length || changed.length || presetGone.length || counts.some((c) => !c.ok);

    if (has("--json")) {
      console.log(JSON.stringify({ total, baseline, added, removed, changed, presetGone, counts, drifted: !!drifted }, null, 2));
    } else {
      console.log(`[registry] upstream has ${total} item(s)`);
      if (baseline) console.log(`[registry]   no snapshot yet — recording a baseline, nothing to compare against`);

      if (added.length) {
        // Split by what a person can actually do with each: blocks and components are
        // aspect-independent, which is where the easy wins are. An example is usually 16:9
        // only and needs a portrait composition written by hand before it is useful here.
        const easy = added.filter((a) => a.type !== "example");
        const hard = added.filter((a) => a.type === "example");
        console.log(`\n[registry] ${added.length} new:`);
        for (const a of easy) console.log(`  + ${a.name.padEnd(28)} ${a.type}`);
        for (const a of hard) console.log(`  + ${a.name.padEnd(28)} ${a.type}  (usually 16:9 only — needs a 9:16 composition by hand)`);
        if (easy.length) {
          console.log(`\n  Aspect-independent, so they drop straight in:`);
          console.log(`    node scripts/video/add-template.mjs ${easy.slice(0, 6).map((a) => a.name).join(" ")}`);
        }
      }
      for (const r of removed) console.log(`  - ${r.name.padEnd(28)} ${r.type}  GONE upstream`);
      for (const c of changed) console.log(`  ~ ${c.name.padEnd(28)} ${c.from} → ${c.to}`);

      if (presetGone.length) {
        console.log(`\n[registry] ✗ add-template.mjs presets name items upstream no longer has:`);
        console.log(`  ${presetGone.join(", ")}`);
        console.log(`  --preset would fail halfway through a fetch. Edit PRESETS.`);
      }

      const bad = counts.filter((c) => !c.ok);
      if (bad.length) {
        console.log(`\n[registry] ✗ documented count is wrong in ${bad.length} of ${counts.length} place(s):`);
        for (const c of bad)
          console.log(`  ${c.file} (${c.of}): ${c.reason ?? `says ${c.found}, upstream has ${c.want}`}`);
      }

      if (!drifted) console.log(`[registry] ✓ snapshot, presets and counts all agree`);
    }

    if (has("--write")) {
      fs.writeFileSync(
        SNAPSHOT,
        JSON.stringify(
          {
            _comment: [
              "What the upstream HyperFrames registry held when this was last checked.",
              "Written by scripts/video/registry-watch.mjs --write; do not hand-edit.",
              "",
              "It exists so the repo can tell 'upstream added something' from 'upstream has",
              "always had that'. Without it, a daily check can only ever report the total.",
            ],
            source: REGISTRY_URL,
            total: Object.keys(after).length,
            items: Object.fromEntries(Object.entries(after).sort(([a], [b]) => a.localeCompare(b))),
          },
          null,
          2,
        ) + "\n",
        "utf8",
      );

      let fixed = 0;
      for (const s of COUNT_SITES) {
        const p = path.join(KIT, s.file);
        const text = fs.readFileSync(p, "utf8");
        const m = text.match(s.re);
        const want = s.of ? (byType[s.of] ?? 0) : total;
        if (!m || Number(m[1]) === want) continue;
        // Replace the number INSIDE the matched phrase, not every occurrence of it in the
        // file — "146" could legitimately appear elsewhere.
        fs.writeFileSync(p, text.replace(m[0], m[0].replace(m[1], String(want))), "utf8");
        fixed++;
      }
      console.log(`[registry] ✓ snapshot written · ${fixed} count(s) corrected`);
      process.exitCode = 0;
    } else {
      process.exitCode = drifted ? 1 : 0;
    }

  } catch (e) {
    console.error(`[registry] ✗ ${e.message}`);
    process.exitCode = 2; // 2 = could not check, distinct from 1 = checked and drifted
  }
}
