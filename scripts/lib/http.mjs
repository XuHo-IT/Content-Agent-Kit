// http.mjs — tiny fetch helpers with Bearer auth + a timeout. Node 18+ (global fetch).
import { optionalEnv } from "./env.mjs";

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
export async function getJson(url, { token, timeoutMs = 60000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
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

/** Upload a local image to an image host, return a public URL. */
export async function uploadImage(localPathOrUrl) {
  const fs = await import("node:fs");
  if (/^https?:\/\//i.test(localPathOrUrl)) return localPathOrUrl; // already a URL
  const host = (optionalEnv("IMAGE_HOST", "cloudinary") || "").toLowerCase();
  const bytes = fs.readFileSync(localPathOrUrl);
  const name = localPathOrUrl.split(/[\\/]/).pop() || "image.png";

  if (host === "catbox") {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", new Blob([bytes]), name);
    const res = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: form });
    const url = (await res.text()).trim();
    if (!/^https?:\/\//.test(url)) throw new Error(`Catbox upload failed: ${url}`);
    return url;
  }

  // Cloudinary unsigned upload (client-safe preset).
  const cloud = optionalEnv("CLOUDINARY_CLOUD_NAME");
  const preset = optionalEnv("CLOUDINARY_UNSIGNED_PRESET");
  if (!cloud || !preset) {
    throw new Error("Cloudinary needs CLOUDINARY_CLOUD_NAME + CLOUDINARY_UNSIGNED_PRESET (or set IMAGE_HOST=catbox).");
  }
  const form = new FormData();
  form.append("file", new Blob([bytes]), name);
  form.append("upload_preset", preset);
  const folder = optionalEnv("CLOUDINARY_FOLDER");
  if (folder) form.append("folder", folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  const j = await res.json();
  if (!j.secure_url) throw new Error(`Cloudinary upload failed: ${JSON.stringify(j).slice(0, 200)}`);
  return j.secure_url;
}
