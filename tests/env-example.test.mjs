// env-example.test.mjs — .env.example has to name the variables the code actually reads.
//
// It did not. The code reads VBEE_TOKEN; .env.example declared VBEE_API_KEY. So anyone
// following the documented setup for Vbee — the Vietnamese TTS provider, in a
// Vietnamese-first kit — hit a wall, and the error message sent them back to the very file
// that had given them the wrong name:
//
//     [tts] ✗ Provider "vbee" needs VBEE_TOKEN in your .env (see .env.example).
//
// This is env-only software. .env.example is not documentation *about* the setup, it IS the
// setup, and nothing checked that it matched the code.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const walk = (d, out = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (p.endsWith(".mjs")) out.push(p);
  }
  return out;
};

const sources = walk(path.join(KIT, "scripts")).map((f) => fs.readFileSync(f, "utf8"));
const allSource = sources.join("\n") + fs.readFileSync(path.join(KIT, "scripts/crawl/crawl.py"), "utf8");
const envExample = fs.readFileSync(path.join(KIT, ".env.example"), "utf8");

const declared = new Set([...envExample.matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]));
const word = (name) => new RegExp(`\\b${name}\\b`);

/**
 * A name mentioned only in a comment still counts as documented: the goal is that a reader
 * can discover the variable exists, not that every one gets a blank line to fill in.
 */
const mentioned = (name) => declared.has(name) || word(name).test(envExample);

const collect = (re) => {
  const found = new Set();
  for (const src of sources) for (const m of src.matchAll(re)) found.add(m[1]);
  return found;
};

// requireEnv() throws when the variable is absent, so these are the ones a user MUST set.
// A missing entry here is a setup that cannot be completed by following the instructions.
const required = collect(/requireEnv\(\s*["']([A-Z0-9_]+)["']/g);
const optional = collect(/optionalEnv\(\s*["']([A-Z0-9_]+)["']/g);

test("every required env var appears in .env.example", () => {
  const missing = [...required].filter((v) => !declared.has(v)).sort();
  assert.deepEqual(
    missing, [],
    `requireEnv() reads these but .env.example never names them, so following the documented ` +
      `setup cannot work: ${missing.join(", ")}`,
  );
});

test("every optional env var is at least mentioned in .env.example", () => {
  // Optional variables are how the kit is tuned. One that exists but is written down
  // nowhere is a feature only the author knows about.
  const missing = [...optional].filter((v) => !mentioned(v)).sort();
  assert.deepEqual(missing, [], `optionalEnv() reads these, .env.example never names them: ${missing.join(", ")}`);
});

test(".env.example declares nothing the code has stopped reading", () => {
  // The direction that produced the Vbee bug: a name in .env.example that nothing reads is
  // a name someone will set and then wonder why nothing happened.
  //
  // Deliberately crude — does the name appear ANYWHERE in the scripts? Variables reach the
  // code through several shapes: requireEnv, optionalEnv, csv("NAME", …), env.NAME, keyEnv
  // arrays, ${NAME} substitution in the http TTS adapter. A matcher that enumerated them
  // would grow a false positive with every new shape; a substring search cannot miss one.
  const stale = [...declared].filter((v) => !word(v).test(allSource)).sort();
  assert.deepEqual(
    stale, [],
    `.env.example names these but no script reads them — set one and nothing happens: ${stale.join(", ")}`,
  );
});

test("every TTS provider's declared keys are in .env.example", () => {
  // tts.mjs carries the authoritative key list per provider. Cross-checking it directly
  // catches a rename on either side — exactly how VBEE_API_KEY and VBEE_TOKEN drifted apart.
  const tts = fs.readFileSync(path.join(KIT, "scripts/video/lib/tts.mjs"), "utf8");
  const keys = [...tts.matchAll(/keys:\s*\[([^\]]*)\]/g)].flatMap((m) =>
    [...m[1].matchAll(/["']([A-Z0-9_]+)["']/g)].map((k) => k[1]),
  );
  assert.ok(keys.length > 0, "found no provider key lists in tts.mjs — has its shape changed?");
  const missing = [...new Set(keys)].filter((k) => !mentioned(k)).sort();
  assert.deepEqual(missing, [], `tts.mjs requires these provider keys, .env.example omits them: ${missing.join(", ")}`);
});

test("every media host's declared keys are in .env.example", () => {
  // Same cross-check for the upload hosts, which declare `needs` the same way.
  const hosts = walk(path.join(KIT, "scripts/lib/media-hosts")).map((f) => fs.readFileSync(f, "utf8")).join("\n");
  const keys = [...hosts.matchAll(/needs\s*=\s*\[([^\]]*)\]/g)].flatMap((m) =>
    [...m[1].matchAll(/["']([A-Z0-9_]+)["']/g)].map((k) => k[1]),
  );
  const missing = [...new Set(keys)].filter((k) => !mentioned(k)).sort();
  assert.deepEqual(missing, [], `a media host requires these, .env.example omits them: ${missing.join(", ")}`);
});
