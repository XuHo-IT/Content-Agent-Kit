// audit-quality.mjs — RULE-BASED quality audit of published items (no AI needed).
// Grades each item against pluggable hard-rules → writes `audit_report.md` for the
// AUDIT agent to fix (via update.mjs). Fast, cheap, objective.
//
// Usage:
//   node scripts/list-published.mjs --out audit_input.json   # 1) fetch items
//   node scripts/audit-quality.mjs                            # 2) grade them
//   node scripts/audit-quality.mjs --in audit_input.json --out audit_report.md
//   node scripts/audit-quality.mjs --kind case --limit 50
//   node scripts/audit-quality.mjs --help
//
// ENV (all optional — rules self-disable when their config is absent):
//   AUDIT_MIN_WORDS         min word count of the body (0/unset = off)
//   AUDIT_BODY_FIELDS       csv of body fields to word-count (default: content,body,text)
//   AUDIT_REQUIRED_FIELDS   csv of fields that must be non-empty (default: title)
//   AUDIT_IMAGE_FIELDS      csv of cover/image fields, first present must be non-empty
//                           (default: coverUrl,cover_url,image) — set empty to disable
//   AUDIT_TEXT_FIELDS       csv of READER-VISIBLE text fields scanned for id-leak
//                           (default: content,body,text,revealText,reveal_text)
//   AUDIT_MARKUP_FIELDS     csv of fields that must be PLAIN TEXT — no Markdown, no
//                           CMS metadata block (default: title,post,comment,caption)
//                           set empty to disable
//   AUDIT_KIND_FIELD        item field holding the kind/type (default: kind)
//   AUDIT_RULES_PATH        path to a .mjs exporting `export const rules = [...]` to
//                           ADD/OVERRIDE rules (see "Pluggable rules" below)
//
// This kit is ENV-ONLY: no hardcoded secrets, no domain schema baked in. Every rule
// reads generic field names you can remap via env, or plug your own via AUDIT_RULES_PATH.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { optionalEnv } from "./lib/env.mjs";
import { findLeaks } from "./social/lib/clean-text.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log(
    `audit-quality.mjs — rule-based quality audit → audit_report.md\n` +
      `  node scripts/audit-quality.mjs [--in audit_input.json] [--out audit_report.md]\n` +
      `                                 [--kind <type>] [--limit N]\n` +
      `Feed it with:  node scripts/list-published.mjs --out audit_input.json\n` +
      `Configure/extend via AUDIT_* env vars + AUDIT_RULES_PATH (see file header).`,
  );
  process.exit(0);
}
const flag = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const IN = flag("--in", "audit_input.json");
const OUT = flag("--out", "audit_report.md");
const ONLY_KIND = flag("--kind", null);
const LIMIT = Number(flag("--limit", "0")) || 0;

const csv = (name, dflt) =>
  (optionalEnv(name, dflt) || "").split(",").map((s) => s.trim()).filter(Boolean);
const KIND_FIELD = optionalEnv("AUDIT_KIND_FIELD", "kind");

// ── helpers ──────────────────────────────────────────────────────────────────
/** Flatten a field value (string | string[] | nested) into one string. */
function asText(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(asText).join("\n");
  if (typeof v === "object") return Object.values(v).map(asText).join("\n");
  return String(v);
}
const words = (s) => asText(s).split(/\s+/).filter(Boolean).length;
const firstField = (item, fields) => fields.find((f) => item[f] != null && item[f] !== "");

// Internal machine-id token in READER-VISIBLE text — 3 forms:
//   wrapped "(c3)" / "(`c1`)" / "[s2]" · backtick "`c2`" · BARE " c1" (space-led).
// A leaked id both reads as broken AND can spoil a hidden answer step-by-step.
const ID_LEAK =
  /(?:[(\[]\s*`?\s*[a-z]\d{1,2}\s*`?\s*[)\]])|(?:`\s*[a-z]\d{1,2}\s*`)|(?: [a-z]\d{1,2}(?![\p{L}\p{N}]))/giu;

/** Collect every image URL sitting in obvious image slots (recursive). */
function collectImages(node, acc = []) {
  if (!node || typeof node !== "object") return acc;
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === "string" && /^https?:\/\//.test(v) && /image|img|cover|photo|url/i.test(k)) {
      acc.push(v);
    } else if (v && typeof v === "object") collectImages(v, acc);
  }
  return acc;
}

// ── DEFAULT RULES ────────────────────────────────────────────────────────────
// A rule = { id, when?(item)->bool, check(item)->string[] issues }. Add your own
// via AUDIT_RULES_PATH (they run AFTER these; same-id replaces a default).
const MIN_WORDS = Number(optionalEnv("AUDIT_MIN_WORDS", "0")) || 0;
const BODY_FIELDS = csv("AUDIT_BODY_FIELDS", "content,body,text");
const REQUIRED_FIELDS = csv("AUDIT_REQUIRED_FIELDS", "title");
const IMAGE_FIELDS = csv("AUDIT_IMAGE_FIELDS", "coverUrl,cover_url,image");
const TEXT_FIELDS = csv("AUDIT_TEXT_FIELDS", "content,body,text,revealText,reveal_text");
const MARKUP_FIELDS = csv("AUDIT_MARKUP_FIELDS", "title,post,comment,caption");

const defaultRules = [
  {
    id: "min-words",
    when: () => MIN_WORDS > 0,
    check: (it) => {
      const n = BODY_FIELDS.reduce((s, f) => s + words(it[f]), 0);
      return n < MIN_WORDS ? [`Body ${n} words (min ${MIN_WORDS})`] : [];
    },
  },
  {
    id: "required-fields",
    check: (it) =>
      REQUIRED_FIELDS.filter((f) => !it[f] || !String(asText(it[f])).trim()).map(
        (f) => `Missing required field \`${f}\``,
      ),
  },
  {
    id: "image-present",
    when: () => IMAGE_FIELDS.length > 0,
    check: (it) => (firstField(it, IMAGE_FIELDS) ? [] : [`Missing cover image (${IMAGE_FIELDS.join("/")})`]),
  },
  {
    id: "duplicate-images",
    check: (it) => {
      const imgs = collectImages(it);
      const dup = [...new Set(imgs.filter((u, i) => imgs.indexOf(u) !== i))];
      return dup.map((u) => `Image reused across slots: ${u}`);
    },
  },
  {
    // 🔴 The big one: internal ids leaking into reader-visible prose.
    id: "id-leak",
    check: (it) => {
      const out = [];
      for (const f of TEXT_FIELDS) {
        if (it[f] == null) continue;
        const hits = [...new Set((asText(it[f]).match(ID_LEAK) || []).map((s) => s.trim()))];
        if (hits.length) out.push(`🔴 Internal id leaked into \`${f}\`: ${hits.join(" ")}`);
      }
      return out;
    },
  },
  {
    // The same class of leak as `id-leak`, one step earlier in the pipeline: text meant
    // for a machine reaching a human. A social caption renders no Markdown, so a heading
    // arrives as "### Heading" and a CMS metadata block becomes the opening two lines.
    //
    // `social/validate-post.mjs` blocks this before publishing; this rule finds what
    // already went out. Only the shared checker's ERRORS are reported — its warnings
    // cover cases like a leading "- ", which is dialogue as often as it is a bullet, and
    // an audit report full of maybes stops being read.
    id: "markup-leak",
    when: () => MARKUP_FIELDS.length > 0,
    check: (it) => {
      const out = [];
      for (const f of MARKUP_FIELDS) {
        if (it[f] == null) continue;
        out.push(...findLeaks(asText(it[f]), f).errors);
      }
      return out;
    },
  },
];

// ── load pluggable rules ─────────────────────────────────────────────────────
async function loadRules() {
  const rules = [...defaultRules];
  const p = optionalEnv("AUDIT_RULES_PATH");
  if (!p) return rules;
  const mod = await import(pathToFileURL(path.resolve(p)).href);
  for (const r of mod.rules || []) {
    const i = rules.findIndex((x) => x.id === r.id);
    if (i >= 0) rules[i] = r; // same id overrides a default
    else rules.push(r);
  }
  return rules;
}

// ── run ──────────────────────────────────────────────────────────────────────
let items;
try {
  items = JSON.parse(fs.readFileSync(IN, "utf8"));
} catch {
  console.error(
    `✗ Cannot read ${IN}. Generate it first:\n  node scripts/list-published.mjs --out ${IN}`,
  );
  process.exit(1);
}
if (!Array.isArray(items)) items = items.items || [];
if (ONLY_KIND) items = items.filter((it) => String(it[KIND_FIELD] ?? "") === ONLY_KIND);
if (LIMIT) items = items.slice(0, LIMIT);

const rules = await loadRules();
const failing = [];
for (const it of items) {
  const issues = [];
  for (const r of rules) {
    if (r.when && !r.when(it)) continue;
    try {
      issues.push(...(r.check(it) || []));
    } catch (e) {
      issues.push(`(rule ${r.id} errored: ${e.message})`);
    }
  }
  if (issues.length) failing.push({ item: it, issues });
}

// ── cross-item image reuse (global) ──────────────────────────────────────────
// The per-item `duplicate-images` rule can't see reuse ACROSS items — a common bug
// when a writer borrows an older item's image instead of generating a fresh one.
const imgOwners = new Map(); // url -> [itemId...]
for (const it of items) {
  const id = it.id ?? it.slug ?? "(no id)";
  for (const u of new Set(collectImages(it))) {
    if (!imgOwners.has(u)) imgOwners.set(u, []);
    imgOwners.get(u).push(id);
  }
}
const findingFor = (id) =>
  failing.find((f) => (f.item.id ?? f.item.slug ?? "(no id)") === id) ||
  (() => {
    const f = { item: items.find((x) => (x.id ?? x.slug ?? "(no id)") === id), issues: [] };
    failing.push(f);
    return f;
  })();
for (const [url, owners] of imgOwners) {
  const uniq = [...new Set(owners)];
  if (uniq.length > 1) {
    for (const id of uniq) {
      findingFor(id).issues.push(`Image shared across items (${uniq.join(", ")}): ${url}`);
    }
  }
}

// ── report ───────────────────────────────────────────────────────────────────
const total = items.length;
const bad = failing.length;
let md = `# Quality audit report\n\nRule-based audit (no AI). Fix via \`node scripts/update.mjs\`.\n\n`;
md += `| Total | Pass | **Fail** |\n|---|---|---|\n| ${total} | ${total - bad} | **${bad}** |\n\n---\n\n`;
if (!bad) {
  md += `✅ All ${total} item(s) pass.\n`;
} else {
  md += `## Items to fix (${bad})\n\n`;
  for (const { item, issues } of failing) {
    const id = item.id ?? item.slug ?? "(no id)";
    const title = item.title ?? item.name ?? "";
    md += `#### \`${id}\` — ${title}\n\n`;
    for (const i of issues) md += `- ${i}\n`;
    md += `\n`;
  }
}
fs.writeFileSync(OUT, md, "utf8");
console.log(`[audit] ${total} item(s) — ${bad} failing → ${OUT}`);
