// http.mjs — tiny fetch helpers with Bearer auth + a timeout. Node 18+ (global fetch).

/** POST JSON with optional Bearer token. Returns { status, ok, json, text }. */
export async function postJson(url, body, { token, timeoutMs = 60000, headers = {} } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not json */
    }
    return { status: res.status, ok: res.ok, json, text };
  } finally {
    clearTimeout(timer);
  }
}

/** GET JSON with optional Bearer token. */
export async function getJson(url, { token, timeoutMs = 60000, headers = {} } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      signal: ctrl.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not json */
    }
    return { status: res.status, ok: res.ok, json, text };
  } finally {
    clearTimeout(timer);
  }
}

/** PATCH JSON with optional Bearer token. */
export async function patchJson(url, body, { token, timeoutMs = 60000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    return { status: res.status, ok: res.ok, text };
  } finally {
    clearTimeout(timer);
  }
}

const VIDEO_EXT = /\.(mp4|mov|webm|m4v|avi|mkv)$/i;

/** What the bytes actually are, regardless of what the filename claims. */
function sniffImage(b) {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.slice(0, 3).toString("latin1") === "GIF") return "gif";
  if (b.slice(0, 4).toString("latin1") === "RIFF" && b.slice(8, 12).toString("latin1") === "WEBP")
    return "webp";
  if (b.slice(4, 8).toString("latin1") === "ftyp") {
    const brand = b.slice(8, 12).toString("latin1");
    if (brand.startsWith("avif") || brand.startsWith("avis")) return "avif";
    if (brand.startsWith("heic") || brand.startsWith("heix") || brand.startsWith("mif1"))
      return "heic";
  }
  return null;
}

/**
 * Formats Facebook's photo-by-URL endpoint refuses. It fetches the URL itself and decodes the
 * bytes, so the file EXTENSION is irrelevant — a WebP saved as `.jpg` is rejected exactly the
 * same, with `Missing or invalid image file (324)` and nothing naming the real problem.
 *
 * This bit real posts: a crawler saved five article images as image_1..5.jpg, three of which
 * were WebP on the source site. The three-JPEG post published; the five-image one returned 324
 * with no clue which picture was at fault.
 */
const UNPUBLISHABLE = new Set(["webp", "avif", "heic"]);

/**
 * Re-encode to JPEG when the bytes are a format the destination cannot read.
 * Returns the (possibly new) bytes and a filename whose extension tells the truth.
 */
async function normaliseImage(bytes, name) {
  const real = sniffImage(bytes);
  if (!real) return { bytes, name }; // unknown — send as-is rather than guess

  if (!UNPUBLISHABLE.has(real)) {
    // Correct a lying extension. Harmless for the upload, but a `.jpg` that is really a PNG
    // makes every later diagnosis start from a false premise.
    const fixed = name.replace(/\.[^.]*$/, "") + "." + real;
    return { bytes, name: fixed };
  }

  const { spawnSync } = await import("node:child_process");
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cak-img-"));
  const src = path.join(dir, "in." + real);
  const dst = path.join(dir, "out.jpg");
  try {
    fs.writeFileSync(src, bytes);
    const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-q:v", "3", dst], {
      encoding: "utf8",
    });
    if (r.error || r.status !== 0 || !fs.existsSync(dst)) {
      throw new Error(
        `${name} is ${real.toUpperCase()}, which Facebook rejects as "Missing or invalid image ` +
          `file (324)" no matter what the file is called — and converting it needs ffmpeg, ` +
          `which is not runnable here${r.error ? ` (${r.error.message})` : ""}. ` +
          `Install ffmpeg, or re-save the image as JPEG/PNG before posting.`,
      );
    }
    const out = fs.readFileSync(dst);
    console.log(`[media] ${name} was ${real.toUpperCase()} → converted to JPEG before upload`);
    return { bytes: out, name: name.replace(/\.[^.]*$/, "") + ".jpg" };
  } finally {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {}
  }
}

/**
 * Upload a local image OR video to the configured media host, return a public URL.
 * Already a URL → returned untouched.
 *
 * `kind` is inferred from the file extension; pass it explicitly to override.
 * Which host is used comes from MEDIA_HOST — see scripts/lib/media-hosts/.
 */
export async function uploadMedia(localPathOrUrl, { kind, host: hostName } = {}) {
  const fs = await import("node:fs");
  if (/^https?:\/\//i.test(localPathOrUrl)) return localPathOrUrl; // already a URL
  if (!fs.existsSync(localPathOrUrl)) throw new Error(`Media file not found: ${localPathOrUrl}`);

  const { getHost } = await import("./media-hosts/index.mjs");
  const host = getHost(hostName);

  const mediaKind = kind ?? (VIDEO_EXT.test(localPathOrUrl) ? "video" : "image");
  let bytes = fs.readFileSync(localPathOrUrl);
  let name = localPathOrUrl.split(/[\\/]/).pop() || (mediaKind === "video" ? "video.mp4" : "image.png");

  // Before anything else looks at the size or the extension: make sure the BYTES are something
  // the destination can actually decode. This is the choke point every published picture goes
  // through, which is the only place a format guarantee can be made once instead of per caller.
  if (mediaKind === "image") ({ bytes, name } = await normaliseImage(bytes, name));

  const miss = host.missing();
  if (miss.length) {
    throw new Error(
      `Media host "${host.id}" needs ${miss.join(", ")} in your .env (see .env.example). ` +
        `This kit is env-only — there are no hardcoded fallbacks.`,
    );
  }

  // Fail before a doomed upload rather than during one.
  const cap = host.limitMb?.[mediaKind];
  const sizeMb = bytes.length / (1024 * 1024);
  if (cap && sizeMb > cap) {
    throw new Error(
      `${name} is ${sizeMb.toFixed(1)} MB — over the ${cap} MB limit for ${host.id} ${mediaKind}. ` +
        `Shorten the video, lower the bitrate, switch to MEDIA_HOST=r2 (no such cap), ` +
        `or upload it yourself and pass the URL instead.`,
    );
  }

  return host.upload(bytes, name, mediaKind);
}

/** Upload a local image, return a public URL. Thin wrapper over uploadMedia. */
export async function uploadImage(localPathOrUrl) {
  return uploadMedia(localPathOrUrl, { kind: "image" });
}
