// manual.mjs — clips you picked by hand, listed in stock-sources.yaml.
//
// This exists because most free-stock sites have NO public API. Probed 2026-08:
//   Videvo 403 · Mixkit 404 · Videezy 404 · Lifecoach (none found)
//   Coverr 401 and Unsplash 401 — API exists but needs a key (and Unsplash is photos)
// Scraping them would break their terms and their HTML, so instead: download the clip
// from the site yourself, paste its direct URL (or a local path) here, and the rest of
// the pipeline treats it exactly like an API source.
//
// ENV: STOCK_SOURCES_FILE (default <kit>/stock-sources.yaml)
import fs from "node:fs";
import path from "node:path";
import { optionalEnv } from "../../../lib/env.mjs";
import { KIT_ROOT } from "../../../video/lib/paths.mjs";

export const id = "manual";
export const label = "Manual list";
export const license = "see entry";
export const keyEnv = [];
export const hasKey = () => true;

function sourcesFile() {
  return path.resolve(optionalEnv("STOCK_SOURCES_FILE") || path.join(KIT_ROOT, "stock-sources.yaml"));
}

/**
 * Deliberately a tiny hand-rolled parser rather than a YAML dependency — this kit ships
 * no node_modules. Supports exactly the flat list shape documented in the template:
 *
 *   clips:
 *     - ref: mixkit-abstract-network
 *       url: https://.../clip.mp4
 *       site: Mixkit
 *       license: Mixkit Free License
 *       tags: abstract, network
 */
function parseClips(text) {
  const clips = [];
  let cur = null;
  let inClips = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\t/g, "  ");
    if (/^\s*#/.test(line) || !line.trim()) continue;
    if (/^clips:\s*$/.test(line)) {
      inClips = true;
      continue;
    }
    if (!inClips) continue;
    const item = line.match(/^\s*-\s*(\w+)\s*:\s*(.*)$/);
    if (item) {
      if (cur) clips.push(cur);
      cur = { [item[1]]: item[2].trim().replace(/^["']|["']$/g, "") };
      continue;
    }
    const kv = line.match(/^\s+(\w+)\s*:\s*(.*)$/);
    if (kv && cur) cur[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  if (cur) clips.push(cur);
  return clips.filter((c) => c.ref && c.url);
}

function load() {
  const file = sourcesFile();
  if (!fs.existsSync(file)) {
    throw new Error(
      `No manual clip list at ${file}. Copy templates/stock-sources.yaml.template there ` +
        `and paste the clips you downloaded from Mixkit / Videezy / Videvo / Coverr.`,
    );
  }
  return parseClips(fs.readFileSync(file, "utf8"));
}

const toCandidate = (c) => ({
  id: c.ref,
  width: Number(c.width) || 0,
  height: Number(c.height) || 0,
  duration: Number(c.duration) || 0,
  author: c.author ?? "",
  authorUrl: c.authorUrl ?? "",
  pageUrl: c.page ?? c.url,
  fileUrl: c.url,
  tags: c.tags ?? "",
  source: id,
  license: c.license ?? `${c.site ?? "manual"} — see entry`,
  site: c.site ?? "",
});

/** Matches ref/tags/site — there is no remote index to query. */
export async function search(query, { perPage = 10 } = {}) {
  const q = String(query || "").toLowerCase();
  return load()
    .filter((c) => !q || `${c.ref} ${c.tags ?? ""} ${c.site ?? ""}`.toLowerCase().includes(q))
    .slice(0, perPage)
    .map(toCandidate);
}

export async function byId(ref) {
  const c = load().find((x) => x.ref === ref);
  if (!c) {
    throw new Error(`No clip with ref "${ref}" in ${sourcesFile()}`);
  }
  return toCandidate(c);
}
