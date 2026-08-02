// make-post.mjs — push ONE social post (image OR video) to a Make.com / n8n / Zapier webhook.
// The webhook scenario owns the platform APIs; this script only sends a normalized payload.
//   node scripts/social/make-post.mjs --post post.txt --comment comment.txt --image img.png
//   node scripts/social/make-post.mjs --video out/video.mp4 --post cap.txt --title "..." \
//        --hashtags "#ai #coding" --platforms tiktok,youtube_shorts
//   node scripts/social/make-post.mjs --json post.json          // {post,comment,image|video|mediaUrl,…}
//   node scripts/social/make-post.mjs --queue queue.json --id 3 // send item from a queue file
//   ... --dry-run                                               // print the payload, send nothing
// ENV: MAKE_WEBHOOK_URL, SOCIAL_PLATFORMS (default), MEDIA_HOST (+ host vars for local files).
import fs from "node:fs";
import { requireEnv, optionalEnv } from "../lib/env.mjs";
import { postJson, uploadMedia } from "../lib/http.mjs";
import { queueSetStatus } from "../lib/state.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `make-post.mjs — send one social post (image or video) to a webhook\n` +
      `  --post <file|text> --comment <file|text>\n` +
      `  --image <file|url>       image post\n` +
      `  --video <file|url>       video post (9:16 for Reels/Shorts/TikTok)\n` +
      `  --thumbnail <file|url>   cover image for the video\n` +
      `  --title <text>           title for platforms that need one (YouTube)\n` +
      `  --hashtags <text>        e.g. "#ai #coding"\n` +
      `  --platforms a,b,c        tiktok | youtube_shorts | facebook_reels | instagram_reels\n` +
      `  --duration <sec>         video length, if you already know it\n` +
      `  --json <file>            {post, comment, image|video|mediaUrl, title, …}\n` +
      `  --queue <file> --id <n>  send one queued item (sets status posted|failed)\n` +
      `  --dry-run                print the payload instead of sending it\n` +
      `env: MAKE_WEBHOOK_URL, SOCIAL_PLATFORMS, MEDIA_HOST`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const readMaybeFile = (v) => (v && fs.existsSync(v) ? fs.readFileSync(v, "utf8") : v || "");
const dryRun = argv.includes("--dry-run");

const parsePlatforms = (v) =>
  String(v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const webhook = dryRun ? "(dry-run)" : requireEnv("MAKE_WEBHOOK_URL");
const queueFile = flag("--queue");
const id = flag("--id");

let post, comment, image, video, thumbnail, title, hashtags, platforms, durationSec;
let onDone = () => {};

if (queueFile && id != null) {
  const arr = JSON.parse(fs.readFileSync(queueFile, "utf8"));
  const item = arr.find((x) => String(x.id) === String(id));
  if (!item) throw new Error(`Queue item id=${id} not found in ${queueFile}`);
  post = item.post;
  comment = item.comment;
  video = item.videoPath || item.videoUrl;
  image = item.mediaUrl || item.image;
  thumbnail = item.thumbnail;
  title = item.title;
  hashtags = item.hashtags;
  platforms = item.platforms;
  durationSec = item.durationSec;
  onDone = (ok, err) =>
    queueSetStatus(queueFile, item.id, ok ? "posted" : "failed",
      ok ? { postedAt: new Date().toISOString() } : { error: err });
} else if (flag("--json")) {
  const j = JSON.parse(fs.readFileSync(flag("--json"), "utf8"));
  post = j.post;
  comment = j.comment;
  video = j.video || j.videoUrl;
  image = j.mediaUrl || j.image;
  thumbnail = j.thumbnail;
  title = j.title;
  hashtags = j.hashtags;
  platforms = j.platforms;
  durationSec = j.durationSec;
} else {
  post = readMaybeFile(flag("--post"));
  comment = readMaybeFile(flag("--comment"));
  image = flag("--image");
  video = flag("--video");
  thumbnail = flag("--thumbnail");
  title = flag("--title");
  hashtags = flag("--hashtags");
  platforms = flag("--platforms");
  durationSec = flag("--duration");
}

if (!post) throw new Error("Missing post text.");

if (!Array.isArray(platforms)) platforms = parsePlatforms(platforms);
if (platforms.length === 0) platforms = parsePlatforms(optionalEnv("SOCIAL_PLATFORMS"));

try {
  // A video post carries the video in mediaUrl; the thumbnail (if any) goes to
  // image_url. An image post keeps the exact shape it has always had, so existing
  // Make scenarios reading {mediaUrl, image_url, post, comment} keep working.
  const kind = video ? "video" : "image";
  const videoUrl = video ? await uploadMedia(video, { kind: "video" }) : "";
  const imageUrl = (thumbnail || image)
    ? await uploadMedia(thumbnail || image, { kind: "image" })
    : "";
  const mediaUrl = videoUrl || imageUrl;

  const body = {
    kind,
    mediaUrl,
    image_url: imageUrl,
    post,
    comment: comment || "",
  };
  if (kind === "video") {
    body.video_url = videoUrl;
    body.thumbnailUrl = imageUrl;
    body.aspect = "9:16";
    if (durationSec) body.durationSec = Number(durationSec);
  }
  if (title) body.title = title;
  if (hashtags) body.hashtags = hashtags;
  if (platforms.length) body.platforms = platforms;

  if (dryRun) {
    console.log(JSON.stringify(body, null, 2));
    console.log(`[social] ✓ dry-run — nothing sent`);
    process.exit(0);
  }

  const { ok, status, text } = await postJson(webhook, body);
  if (!ok) throw new Error(`webhook ${status}: ${text.slice(0, 200)}`);
  onDone(true);
  const to = platforms.length ? ` → ${platforms.join(", ")}` : "";
  console.log(`[social] ✓ posted ${kind}${mediaUrl ? " (with media)" : ""}${to}`);
} catch (e) {
  onDone(false, e.message);
  console.error(`[social] ✗ ${e.message}`);
  process.exit(1);
}
