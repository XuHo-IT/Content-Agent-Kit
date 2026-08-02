// host-check.mjs — prove a media host works BEFORE a real post depends on it.
//   node scripts/media/host-check.mjs --hosts        # what's configured (no network)
//   node scripts/media/host-check.mjs                # test the configured host
//   node scripts/media/host-check.mjs --host r2 --keep
//
// Uploads a tiny probe file, then FETCHES THE PUBLIC URL BACK. That second half is the
// point: an R2 bucket with public access still switched off accepts the upload happily and
// only fails when a social platform later tries to read the file — by which time the post
// is already broken. Checking the round trip is the only way to know.
//
// ENV: MEDIA_HOST + that host's own keys — see .env.example / docs/15.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { getHost, hostStatus, HOST_IDS } from "../lib/media-hosts/index.mjs";
import { uploadMedia } from "../lib/http.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log(
    `host-check.mjs — verify a media host end to end\n` +
      `  --hosts        list hosts, their env and status, then exit (no network)\n` +
      `  --selftest     check the R2 SigV4 signer against AWS's published vector (offline)\n` +
      `  --host <id>    override MEDIA_HOST (${HOST_IDS.join(" | ")})\n` +
      `  --file <path>  upload this instead of a generated probe\n` +
      `  --keep         do not delete the probe afterwards\n` +
      `env: MEDIA_HOST + the host's own keys`,
  );
  process.exit(0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

// The R2 signer is hand-written SigV4, which is exactly the kind of code that is either
// perfectly right or silently wrong. AWS publishes a worked example with the expected
// signature, so correctness is checkable offline, with no bucket and no credentials.
if (argv.includes("--selftest")) {
  const { createHash } = await import("node:crypto");
  const { sign } = await import("../lib/media-hosts/r2.mjs");
  const EXPECTED = "5d672d79c15b13162d9279b0855cfba6789a8edb4c82c400e06b5924a6f2b5d7";
  const { signature } = sign({
    method: "GET",
    host: "iam.amazonaws.com",
    canonicalPath: "/",
    query: "Action=ListUsers&Version=2010-05-08",
    payloadHash: createHash("sha256").update("").digest("hex"),
    contentType: "application/x-www-form-urlencoded; charset=utf-8",
    accessKeyId: "AKIDEXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
    region: "us-east-1",
    service: "iam",
    amzDate: "20150830T123600Z",
    includePayloadHeader: false,
  });
  const ok = signature === EXPECTED;
  console.log(`[media] SigV4 self-test (AWS published vector)`);
  console.log(`[media]   ours    ${signature}`);
  console.log(`[media]   expected ${EXPECTED}`);
  console.log(
    ok
      ? `[media] ✓ signer correct — canonical request, string-to-sign and key derivation all match.\n` +
        `[media]   The R2-specific wiring (endpoint, bucket, public URL) still needs a real\n` +
        `[media]   bucket: run this command without --selftest once credentials are set.`
      : `[media] ✗ signer is WRONG — do not trust the R2 host until this passes.`,
  );
  process.exit(ok ? 0 : 1);
}

if (argv.includes("--hosts")) {
  console.log(`[media] upload hosts:\n`);
  for (const h of hostStatus()) {
    console.log(
      `  ${h.id.padEnd(11)} ${(h.ready ? "ready" : "needs env").padEnd(10)} ` +
        `${(h.durable ? "durable" : "EPHEMERAL").padEnd(10)} ` +
        `${h.verified ? "verified" : "UNVERIFIED"}`,
    );
    if (h.missing.length) console.log(`  ${" ".repeat(11)} missing: ${h.missing.join(", ")}`);
  }
  console.log(
    `\n  "UNVERIFIED" means the adapter was written from the provider's docs but has never\n` +
      `  run against real credentials. Add yours and run this command without --hosts.\n` +
      `  "EPHEMERAL" means the host makes no storage guarantee — never point a published\n` +
      `  post at it. See docs/15-media-sources.md.`,
  );
  process.exit(0);
}

try {
  const host = getHost(flag("--host"));
  const miss = host.missing();
  if (miss.length) {
    throw new Error(
      `Host "${host.id}" needs ${miss.join(", ")} in your .env (see .env.example).`,
    );
  }

  console.log(`[media] host: ${host.label}${host.verified ? "" : "  (adapter UNVERIFIED until this passes)"}`);
  if (!host.durable) console.log(`[media] ! this host is ephemeral — testing only`);

  // A real 64×64 PNG, not a 1×1. Learned the hard way: catbox ACCEPTS a 68-byte 1×1 and
  // hands back a URL that then 404s forever — a false failure that makes a working host
  // look broken. 200-odd bytes of genuine image behaves like the files you actually upload.
  let probe = flag("--file");
  let temp = null;
  if (!probe) {
    temp = path.join(os.tmpdir(), `cak-host-probe-${Date.now()}.png`);
    fs.writeFileSync(
      temp,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAACXBIWXMAAAABAAAAAQBPJcTWAAAAfUlEQVR4nNXOQQkAMAzAwAzi" +
          "X3KZiD5KTsE9GMokTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIk" +
          "TuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuK8Dmx9AL4B/CSASMgAAAAASUVORK5CYII=",
        "base64",
      ),
    );
    probe = temp;
  }

  const t0 = Date.now();
  const url = await uploadMedia(probe, { kind: "image", host: host.id });
  const upMs = Date.now() - t0;
  console.log(`[media]   uploaded in ${upMs} ms`);
  console.log(`[media]   ${url}`);

  // The half that actually matters.
  const t1 = Date.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) }).catch((e) => ({ ok: false, status: e.message }));
  const getMs = Date.now() - t1;

  if (!res.ok) {
    throw new Error(
      `Uploaded fine, but the public URL is NOT readable (${res.status}) after ${getMs} ms.\n` +
        (host.id === "r2"
          ? `  For R2 this almost always means public access is off. In the dashboard:\n` +
            `  R2 → your bucket → Settings → Public Development URL → Enable, or attach a\n` +
            `  custom domain. Then make sure R2_PUBLIC_BASE matches that hostname exactly.`
          : `  Check that the file is served publicly and R2_PUBLIC_BASE / the account settings are right.`),
    );
  }

  const bytes = Number(res.headers.get("content-length") ?? 0);
  console.log(`[media]   public URL readable in ${getMs} ms (${bytes} bytes, ${res.headers.get("content-type")})`);

  if (!argv.includes("--keep") && typeof host.remove === "function") {
    await host.remove(url).then(
      () => console.log(`[media]   probe deleted`),
      (e) => console.warn(`[media] ! could not delete the probe: ${e.message}`),
    );
  } else if (!argv.includes("--keep")) {
    console.log(`[media]   (this host has no delete API — remove the probe by hand if you care)`);
  }

  if (temp) fs.rmSync(temp, { force: true });
  console.log(`[media] ✓ ${host.id} works: upload + public read both confirmed.`);
} catch (e) {
  console.error(`[media] ✗ ${e.message}`);
  process.exit(1);
}
