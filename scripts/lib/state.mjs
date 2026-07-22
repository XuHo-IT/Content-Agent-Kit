// state.mjs — flat-file state helpers (queue / ledger / history). All JSON.
import fs from "node:fs";

export function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

export function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

// ── history (dedup by title) ────────────────────────────────────────────────
export function loadHistory(file) {
  return new Set(readJson(file, []));
}
export function isDuplicate(file, title) {
  return loadHistory(file).has(title);
}
export function recordPosted(file, title) {
  const arr = readJson(file, []);
  if (!arr.includes(title)) {
    arr.push(title);
    writeJson(file, arr);
  }
}

// ── ledger (in-progress serialized items) ───────────────────────────────────
// Entry shape: { id, title, targetParts, partsWritten, ... }
export function ledgerUpsert(file, entry) {
  const arr = readJson(file, []);
  const i = arr.findIndex((e) => e.id === entry.id);
  if (i === -1) arr.push(entry);
  else arr[i] = { ...arr[i], ...entry };
  writeJson(file, arr);
  return arr;
}
export function ledgerRemove(file, id) {
  writeJson(file, readJson(file, []).filter((e) => e.id !== id));
}

// ── queue (scheduled dispatch items) ────────────────────────────────────────
export function queueSetStatus(file, id, status, extra = {}) {
  const arr = readJson(file, []);
  const item = arr.find((x) => x.id === id);
  if (item) {
    item.status = status;
    Object.assign(item, extra);
    writeJson(file, arr);
  }
  return item;
}
