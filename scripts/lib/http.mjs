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
  const bytes = fs.readFileSync(localPathOrUrl);
  const name = localPathOrUrl.split(/[\\/]/).pop() || (mediaKind === "video" ? "video.mp4" : "image.png");

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
