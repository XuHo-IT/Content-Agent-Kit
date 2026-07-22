// make-post.mjs — push ONE social post to a Make.com / n8n / Zapier webhook.
// Payload (matches a common Make scenario): { mediaUrl, image_url, post, comment }
//   node scripts/social/make-post.mjs --post post.txt --comment comment.txt --image img.png
//   node scripts/social/make-post.mjs --json post.json          // {post,comment,image|mediaUrl}
//   node scripts/social/make-post.mjs --queue queue.json --id 3 // send item from a queue file
// ENV: MAKE_WEBHOOK_URL (+ image-host vars if --image is a local file).
import fs from "node:fs";
import { requireEnv } from "../lib/env.mjs";
import { postJson, uploadImage } from "../lib/http.mjs";
import { queueSetStatus } from "../lib/state.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `make-post.mjs — send one social post to a webhook\n` +
      `  --post <file|text> --comment <file|text> --image <file|url>\n` +
      `  --json <file>            {post, comment, image|mediaUrl}\n` +
      `  --queue <file> --id <n>  send one queued item (sets status posted|failed)\n` +
      `env: MAKE_WEBHOOK_URL`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const readMaybeFile = (v) => (v && fs.existsSync(v) ? fs.readFileSync(v, "utf8") : v || "");

const webhook = requireEnv("MAKE_WEBHOOK_URL");
const queueFile = flag("--queue");
const id = flag("--id");

let post, comment, media, onDone = () => {};
if (queueFile && id != null) {
  const arr = JSON.parse(fs.readFileSync(queueFile, "utf8"));
  const item = arr.find((x) => String(x.id) === String(id));
  if (!item) throw new Error(`Queue item id=${id} not found in ${queueFile}`);
  post = item.post;
  comment = item.comment;
  media = item.mediaUrl || item.image;
  onDone = (ok, err) =>
    queueSetStatus(queueFile, item.id, ok ? "posted" : "failed",
      ok ? { postedAt: new Date().toISOString() } : { error: err });
} else if (flag("--json")) {
  const j = JSON.parse(fs.readFileSync(flag("--json"), "utf8"));
  post = j.post;
  comment = j.comment;
  media = j.mediaUrl || j.image;
} else {
  post = readMaybeFile(flag("--post"));
  comment = readMaybeFile(flag("--comment"));
  media = flag("--image");
}
if (!post) throw new Error("Missing post text.");

try {
  const mediaUrl = media ? await uploadImage(media) : "";
  const body = { mediaUrl, image_url: mediaUrl, post, comment: comment || "" };
  const { ok, status, text } = await postJson(webhook, body);
  if (!ok) throw new Error(`webhook ${status}: ${text.slice(0, 200)}`);
  onDone(true);
  console.log(`[social] ✓ posted${mediaUrl ? " (with image)" : ""}`);
} catch (e) {
  onDone(false, e.message);
  console.error(`[social] ✗ ${e.message}`);
  process.exit(1);
}
