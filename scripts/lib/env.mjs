// env.mjs — ENV-ONLY config loader. NO hardcoded secret fallbacks (by design).
// Reads process.env first, then a local .env / .env.local (walking up a few dirs).
import fs from "node:fs";
import path from "node:path";

let loaded = false;

/** Parse a .env file into process.env (does NOT overwrite already-set vars). */
function parseInto(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

/** Load .env / .env.local from cwd and up to 4 parent dirs (first found wins per key). */
export function loadEnv() {
  if (loaded) return;
  loaded = true;
  let dir = process.cwd();
  for (let up = 0; up < 5; up++) {
    for (const name of [".env.local", ".env"]) parseInto(path.join(dir, name));
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}

/** Get a required env var or throw a clear, actionable error. */
export function requireEnv(name) {
  loadEnv();
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(
      `Missing required env var ${name}. Set it in .env (see .env.example). ` +
        `This kit is env-only — there are no hardcoded fallbacks.`,
    );
  }
  return String(v).trim();
}

/** Get an optional env var (or the given default / undefined). */
export function optionalEnv(name, fallback = undefined) {
  loadEnv();
  const v = process.env[name];
  return v && String(v).trim() ? String(v).trim() : fallback;
}

/** SITE_URL without a trailing slash. */
export function siteUrl() {
  return requireEnv("SITE_URL").replace(/\/+$/, "");
}
