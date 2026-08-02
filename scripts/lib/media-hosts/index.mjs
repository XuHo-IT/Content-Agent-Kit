// index.mjs — where uploaded images and videos go.
//
// Same registry shape as the TTS providers and stock sources: a host is data plus one
// upload function, so adding one is a file and a line here.
//
// ENV: MEDIA_HOST (r2 | cloudinary | catbox). IMAGE_HOST is still read as a legacy alias.
import * as r2 from "./r2.mjs";
import * as cloudinary from "./cloudinary.mjs";
import * as catbox from "./catbox.mjs";
import { optionalEnv } from "../env.mjs";

export const HOSTS = { r2, cloudinary, catbox };
export const HOST_IDS = Object.keys(HOSTS);

export function getHost(name) {
  const key = String(name || optionalEnv("MEDIA_HOST") || optionalEnv("IMAGE_HOST", "r2") || "r2").toLowerCase();
  const h = HOSTS[key];
  if (!h) {
    throw new Error(`Unknown MEDIA_HOST "${key}". Known: ${HOST_IDS.join(" | ")}. See docs/15-media-sources.md.`);
  }
  return h;
}

/** For host-check --hosts and preflight: what is configured, what is missing. */
export function hostStatus() {
  return HOST_IDS.map((k) => {
    const h = HOSTS[k];
    return {
      id: k,
      label: h.label,
      ready: h.ready(),
      missing: h.missing(),
      durable: h.durable,
      verified: h.verified,
    };
  });
}
