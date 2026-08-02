// r2.mjs — Cloudflare R2 via its S3-compatible API, signed with AWS SigV4.
//
// R2 is the durable default: you own the bucket, files don't vanish, egress is free, and a
// custom domain can front it. Catbox is anonymous with no storage guarantee — fine for a
// throwaway test, wrong for a URL a social platform will fetch later.
//
// Signed by hand with node:crypto so the kit stays dependency-free (no aws-sdk). The
// algorithm is fiddly but fixed; a mistake shows up loudly as 403 SignatureDoesNotMatch,
// never silently.
//
// ENV: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE
//      R2_PREFIX (optional, default "agent-media")
import { createHash, createHmac } from "node:crypto";
import { optionalEnv, requireEnv } from "../env.mjs";

export const id = "r2";
export const label = "Cloudflare R2";
export const needs = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_BASE"];
export const durable = true;
/**
 * The SIGNER is verified: `host-check.mjs --selftest` reproduces AWS's own published
 * worked example signature exactly. What is NOT yet verified is the R2-specific wiring —
 * endpoint host, `auto` region, bucket path, public URL — because no bucket was available
 * while writing this. `host-check.mjs` settles that in one command. See docs/15.
 */
export const verified = false;

export function missing() {
  return needs.filter((k) => !optionalEnv(k));
}
export function ready() {
  return missing().length === 0;
}

const sha256hex = (b) => createHash("sha256").update(b).digest("hex");
const hmac = (key, data) => createHmac("sha256", key).update(data, "utf8").digest();

/** S3 canonical URI: percent-encode each segment, but keep the separators. */
function encodePath(path) {
  return path
    .split("/")
    .map((seg) => encodeURIComponent(seg).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()))
    .join("/");
}

/**
 * Sign one request with AWS SigV4.
 *
 * Region defaults to "auto", which is what R2 requires — Cloudflare's docs are explicit,
 * and "us-east-1"/"" only work because they alias to it. `region`/`service`/`query`/
 * `amzDate` are parameters purely so this can be checked against AWS's own published
 * worked example; nothing in this file passes anything but the R2 defaults.
 *
 * @returns {{headers: object, signature: string}}
 */
export function sign({
  method,
  host,
  canonicalPath,
  payloadHash,
  contentType,
  accessKeyId,
  secretAccessKey,
  region = "auto",
  service = "s3",
  query = "",
  amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, ""), // 20260802T051200Z
  includePayloadHeader = true,
}) {
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;

  // Header names must be lowercase and sorted; values trimmed.
  const headers = {
    "content-type": contentType,
    host,
    ...(includePayloadHeader ? { "x-amz-content-sha256": payloadHash } : {}),
    "x-amz-date": amzDate,
  };
  const names = Object.keys(headers).sort();
  const canonicalHeaders = names.map((n) => `${n}:${String(headers[n]).trim()}\n`).join("");
  const signedHeaders = names.join(";");

  const canonicalRequest = [method, canonicalPath, query, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256hex(canonicalRequest)].join("\n");

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  return {
    signature,
    headers: {
      ...headers,
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, ` +
        `SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  };
}

const MIME = {
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm", ".m4v": "video/x-m4v",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".gif": "image/gif", ".mp3": "audio/mpeg", ".txt": "text/plain; charset=utf-8",
};

function config() {
  return {
    accountId: requireEnv("R2_ACCOUNT_ID"),
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    bucket: requireEnv("R2_BUCKET"),
    publicBase: requireEnv("R2_PUBLIC_BASE").replace(/\/+$/, ""),
    prefix: (optionalEnv("R2_PREFIX", "agent-media") || "").replace(/^\/+|\/+$/g, ""),
  };
}

/**
 * Object key derived from the CONTENT hash, so re-uploading the same file lands on the same
 * key: no duplicates, and a retry after a network failure is harmless rather than creating
 * a second copy.
 */
export function keyFor(name, bytes, prefix) {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : "";
  const stem = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "file";
  const hash = sha256hex(bytes).slice(0, 8);
  const d = new Date();
  const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return [prefix, month, `${stem}-${hash}${ext}`].filter(Boolean).join("/");
}

/** @returns {Promise<string>} the public URL */
export async function upload(bytes, name) {
  const cfg = config();
  const key = keyFor(name, bytes, cfg.prefix);
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const dot = name.lastIndexOf(".");
  const contentType = MIME[dot > 0 ? name.slice(dot).toLowerCase() : ""] || "application/octet-stream";

  const canonicalPath = encodePath(`/${cfg.bucket}/${key}`);
  const { headers } = sign({
    method: "PUT",
    host,
    canonicalPath,
    payloadHash: sha256hex(bytes),
    contentType,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
  });

  const res = await fetch(`https://${host}${canonicalPath}`, {
    method: "PUT",
    headers,
    body: bytes,
    signal: AbortSignal.timeout(300000),
  });

  if (!res.ok) {
    const body = (await res.text().catch(() => "")).slice(0, 400);
    throw new Error(
      `R2 upload failed (${res.status}) for ${key}: ${body}\n` +
        (res.status === 403
          ? `  403 usually means the access key is wrong, or it lacks write permission on "${cfg.bucket}".`
          : res.status === 404
            ? `  404 means bucket "${cfg.bucket}" does not exist under account ${cfg.accountId}.`
            : ""),
    );
  }

  return `${cfg.publicBase}/${key}`;
}

/** Used by host-check to clean up its probe object. */
export async function remove(publicUrl) {
  const cfg = config();
  const key = publicUrl.replace(`${cfg.publicBase}/`, "");
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const canonicalPath = encodePath(`/${cfg.bucket}/${key}`);
  const { headers } = sign({
    method: "DELETE",
    host,
    canonicalPath,
    payloadHash: sha256hex(""),
    contentType: "application/octet-stream",
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
  });
  const res = await fetch(`https://${host}${canonicalPath}`, { method: "DELETE", headers, signal: AbortSignal.timeout(60000) });
  if (!res.ok && res.status !== 404) throw new Error(`R2 delete failed (${res.status}) for ${key}`);
}
