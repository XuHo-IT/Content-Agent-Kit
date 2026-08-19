// env.mjs — ENV-ONLY config loader. NO hardcoded secret fallbacks (by design).
// Reads process.env first, then a local .env / .env.local (walking up a few dirs).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

/**
 * Load .env / .env.local, first found wins per key.
 *
 * Searched from TWO roots: the working directory, and the directory this file lives in.
 * The second is not redundant — it is the only one that works when nothing chose the working
 * directory. Windows Task Scheduler starts a task in C:\Windows\System32 unless a "Start in"
 * is set, and `schtasks /create` has no flag for it; cron and systemd have the same shape of
 * default. From System32 the walk up finds Windows, then C:\, then stops, so every var came
 * back missing and every scheduled post failed with exit 1 while the same command run by hand
 * worked perfectly.
 *
 * This is the same fault the SFX and template directories already had (see NOTICE §1):
 * resolving from the caller's cwd instead of from the code's own location.
 */
export function loadEnv() {
  if (loaded) return;
  loaded = true;
  const here = path.dirname(fileURLToPath(import.meta.url));
  for (const start of [process.cwd(), here]) {
    let dir = start;
    for (let up = 0; up < 5; up++) {
      for (const name of [".env.local", ".env"]) parseInto(path.join(dir, name));
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
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
