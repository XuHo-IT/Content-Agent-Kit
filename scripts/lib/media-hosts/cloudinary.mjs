// cloudinary.mjs — Cloudinary unsigned upload.
//
// Durable and account-managed, with transformations and a CDN thrown in. The free tier caps
// an unsigned video around 100 MB, which a 2-minute 1080×1920 render (15–25 MB) clears
// comfortably.
//
// The resource type is part of the URL PATH — posting a video to /image/upload fails, which
// is why `kind` is threaded all the way down from uploadMedia().
//
// ENV: CLOUDINARY_CLOUD_NAME, CLOUDINARY_UNSIGNED_PRESET, CLOUDINARY_FOLDER (optional)
import { optionalEnv, requireEnv } from "../env.mjs";

export const id = "cloudinary";
export const label = "Cloudinary";
export const needs = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_UNSIGNED_PRESET"];
export const durable = true;
/** Only the catbox path has been exercised for real so far — see docs/15. */
export const verified = false;

export function missing() {
  return needs.filter((k) => !optionalEnv(k));
}
export function ready() {
  return missing().length === 0;
}

/** Free-tier unsigned ceilings, so an oversized file fails before the upload, not during. */
export const limitMb = { image: 10, video: 100 };

export async function upload(bytes, name, kind = "image") {
  const cloud = requireEnv("CLOUDINARY_CLOUD_NAME");
  const preset = requireEnv("CLOUDINARY_UNSIGNED_PRESET");
  const resource = kind === "video" ? "video" : "image";

  const form = new FormData();
  form.append("file", new Blob([bytes]), name);
  form.append("upload_preset", preset);
  const folder = optionalEnv("CLOUDINARY_FOLDER");
  if (folder) form.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${resource}/upload`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(300000),
  });
  const j = await res.json().catch(() => ({}));
  if (!j.secure_url) {
    const msg = j?.error?.message ?? JSON.stringify(j).slice(0, 300);
    throw new Error(
      `Cloudinary upload failed: ${msg}\n` +
        (/preset/i.test(msg)
          ? `  The preset must exist AND be set to "Unsigned" in Settings → Upload.`
          : /resource|video/i.test(msg)
            ? `  An unsigned preset also has to allow the "${resource}" resource type.`
            : ""),
    );
  }
  return j.secure_url;
}
