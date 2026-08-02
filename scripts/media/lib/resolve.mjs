// resolve.mjs — turn a scene's `media` block into a file on disk.
//
// The kit's contract is "same script.json -> same video". A bare `query` breaks that:
// today it finds clip A, next week clip B. So a query is resolved ONCE and the choice is
// written to media-lock.json next to the script — same idea as a package lockfile.
//
// That file doubles as the credits ledger (source, author, page, licence per clip), which
// is what makes the media auditable later without putting attribution on screen.
import fs from "node:fs";
import path from "node:path";
import { getSource } from "./sources/index.mjs";
import { download, normalizeVideo, normalizeImage } from "./normalize.mjs";
import { optionalEnv } from "../../lib/env.mjs";

export const LOCK_NAME = "media-lock.json";

export function readLock(dir) {
  const f = path.join(dir, LOCK_NAME);
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return {};
  }
}

export function writeLock(dir, lock) {
  fs.writeFileSync(path.join(dir, LOCK_NAME), JSON.stringify(lock, null, 2) + "\n", "utf8");
}

/** Everything that, if changed, means the cached file is the wrong one. */
function wanted(media) {
  return {
    kind: media.kind ?? "video",
    source: media.source ?? optionalEnv("STOCK_SOURCE", "pexels"),
    id: media.id ?? null,
    query: media.query ?? null,
    url: media.url ?? null,
    ref: media.ref ?? null,
    fit: media.fit ?? "cover",
  };
}

function sameRequest(a, b) {
  if (!a) return false;
  return ["kind", "source", "id", "query", "url", "ref", "fit"].every((k) => (a[k] ?? null) === (b[k] ?? null));
}

/**
 * @param {object} scene            the scene, with `.media`
 * @param {string} outputDir        where script.json lives
 * @param {object} opts             { durationSec, refresh, log }
 * @returns {Promise<{file:string, kind:string, entry:object}|null>}
 */
export async function resolveSceneMedia(scene, outputDir, { durationSec = null, refresh = false, log = () => {} } = {}) {
  const media = scene.media;
  if (!media) return null;

  const want = wanted(media);
  const lock = readLock(outputDir);
  const prev = lock[scene.id];
  const mediaDir = path.join(outputDir, "media");
  fs.mkdirSync(mediaDir, { recursive: true });

  const ext = want.kind === "screenshot" || want.kind === "image" ? ".png" : ".mp4";
  const finalPath = path.join(mediaDir, `${scene.id}${ext}`);

  if (!refresh && prev && sameRequest(prev.request, want) && fs.existsSync(finalPath)) {
    log(`scene ${scene.id}: reuse media (${prev.source}${prev.id ? " " + prev.id : ""})`);
    return { file: finalPath, kind: want.kind, entry: prev };
  }

  let entry;

  if (want.kind === "screenshot") {
    if (!want.url) throw new Error(`scene ${scene.id}: media.kind="screenshot" needs a url`);
    // Spawned rather than imported so the CLI stays the single definition of how a
    // screenshot is taken (one place to fix flags, one place to document).
    const { spawnSync } = await import("node:child_process");
    const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
    const shot = path.join(mediaDir, `${scene.id}-raw.png`);
    log(`scene ${scene.id}: capturing ${want.url}`);
    const r = spawnSync(
      process.execPath,
      [path.join(here, "..", "screenshot.mjs"), "--url", want.url,
       "--out", shot, "--width", String(media.width ?? 1280), "--height", String(media.height ?? 860),
       "--wait", String(media.wait ?? 8000)],
      { stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" },
    );
    if (r.status !== 0 || !fs.existsSync(shot)) throw new Error(`scene ${scene.id}: screenshot failed`);
    fs.renameSync(shot, finalPath);
    entry = { source: "screenshot", id: null, url: want.url, author: "", pageUrl: want.url, license: "screenshot of a public page" };
  } else {
    const src = getSource(want.source);
    let candidate;
    if (want.id) {
      candidate = await src.byId(want.id);
    } else if (want.ref) {
      candidate = await src.byId(want.ref);
    } else if (want.query) {
      const minDuration = Number(optionalEnv("STOCK_MIN_DURATION", "4"));
      const results = await src.search(want.query, {
        orientation: media.orientation ?? "portrait",
        perPage: 10,
        minDuration,
      });
      if (results.length === 0) {
        throw new Error(
          `scene ${scene.id}: no ${src.id} results for "${want.query}". ` +
            `Describe the PICTURE, not the concept — "data center servers" beats "artificial intelligence".`,
        );
      }
      // Prefer a clip that already fills the frame without upscaling, then the longest
      // (so short scenes never have to loop).
      candidate = results.sort((a, b) => {
        const ok = (c) => (Math.min(c.width, c.height) >= 1080 ? 1 : 0);
        return ok(b) - ok(a) || (b.duration ?? 0) - (a.duration ?? 0);
      })[0];
      log(`scene ${scene.id}: picked ${src.id} ${candidate.id} (${candidate.width}x${candidate.height}, ${candidate.duration}s)`);
    } else {
      throw new Error(`scene ${scene.id}: media needs one of id / ref / query / url`);
    }

    const raw = path.join(mediaDir, `${scene.id}-raw${ext}`);
    log(`scene ${scene.id}: downloading ${candidate.id}`);
    await download(candidate.fileUrl, raw);
    if (ext === ".png") {
      await normalizeImage(raw, finalPath, { fit: want.fit });
    } else {
      await normalizeVideo(raw, finalPath, { durationSec, fit: want.fit });
    }
    fs.rmSync(raw, { force: true });

    entry = {
      source: candidate.source,
      id: candidate.id,
      url: candidate.fileUrl,
      author: candidate.author,
      authorUrl: candidate.authorUrl,
      pageUrl: candidate.pageUrl,
      license: candidate.license,
    };
  }

  lock[scene.id] = { ...entry, request: want, file: path.relative(outputDir, finalPath).replace(/\\/g, "/"), resolvedAt: new Date().toISOString() };
  writeLock(outputDir, lock);
  return { file: finalPath, kind: want.kind, entry: lock[scene.id] };
}
