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
import { validatePost } from "./lib/clean-text.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `make-post.mjs — send one social post (image or video) to a webhook\n` +
      `  --post <file|text> --comment <file|text>\n` +
      `  --image <file|url>       image post (one picture)\n` +
      `  --images a,b,c           image post with several pictures, in order\n` +
      `  --video <file|url>       video post (9:16 for Reels/Shorts/TikTok)\n` +
      `  --thumbnail <file|url>   cover image for the video\n` +
      `  --title <text>           title for platforms that need one (YouTube)\n` +
      `  --hashtags <text>        e.g. "#ai #coding"\n` +
      `  --platforms a,b,c        tiktok | youtube_shorts | facebook_reels | instagram_reels\n` +
      `  --duration <sec>         video length, if you already know it\n` +
      `  --json <file>            {post, comment, image|video|mediaUrl, title, …}\n` +
      `  --queue <file> --id <n>  send one queued item (sets status posted|failed)\n` +
      `  --dry-run                print the payload instead of sending it\n` +
      `  --no-validate            skip the plain-text check (captions render no Markdown)\n` +
      `  --webhook-env <NAME>     read the webhook from this env var instead of the default\n` +
      `env: MAKE_WEBHOOK_URL, MAKE_WEBHOOK_VIDEO (video posts), SOCIAL_PLATFORMS, MEDIA_HOST`,
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

const queueFile = flag("--queue");
const id = flag("--id");

// A photo post can carry several pictures. `images` is the list; `image` stays the single
// one, and the two are reconciled below so that every existing caller — and every Make
// scenario reading `mediaUrl`/`image_url` — keeps working untouched.
const parseList = (v) =>
  Array.isArray(v)
    ? v.filter(Boolean)
    : String(v || "").split(",").map((s) => s.trim()).filter(Boolean);

let post, comment, image, images, video, thumbnail, title, hashtags, platforms, durationSec;
let onDone = () => {};

if (queueFile && id != null) {
  const arr = JSON.parse(fs.readFileSync(queueFile, "utf8"));
  const item = arr.find((x) => String(x.id) === String(id));
  if (!item) throw new Error(`Queue item id=${id} not found in ${queueFile}`);
  post = item.post;
  comment = item.comment;
  video = item.videoPath || item.videoUrl;
  image = item.mediaUrl || item.image;
  images = parseList(item.images);
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
  images = parseList(j.images);
  thumbnail = j.thumbnail;
  title = j.title;
  hashtags = j.hashtags;
  platforms = j.platforms;
  durationSec = j.durationSec;
} else {
  post = readMaybeFile(flag("--post"));
  comment = readMaybeFile(flag("--comment"));
  image = flag("--image");
  images = parseList(flag("--images"));
  video = flag("--video");
  thumbnail = flag("--thumbnail");
  title = flag("--title");
  hashtags = flag("--hashtags");
  platforms = flag("--platforms");
  durationSec = flag("--duration");
}

if (!post) throw new Error("Missing post text.");

// Captions render no Markdown, so whatever is in `post` is what a human sees — heading
// hashes, bold asterisks and all. This used to go out unchecked, which is how the repo's
// own reference sample shipped with a "Meta:" / "Slug:" block as its opening two lines.
// Errors block the send; ambiguous cases are warnings, because "- Chào anh." is dialogue
// in Vietnamese prose, not a bullet.
if (!argv.includes("--no-validate")) {
  const { errors, warnings } = validatePost({ title, post, comment });
  for (const w of warnings) console.warn(`[social] ! ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`[social] ✗ ${e}`);
    console.error(
      `[social] ✗ not sending. Fix the text, or:\n` +
        `[social]     node scripts/social/validate-post.mjs <file> --fix   # writes a cleaned copy\n` +
        `[social]     ...or pass --no-validate if you really mean to publish it as is.`,
    );
    process.exit(1);
  }
}

if (!Array.isArray(platforms)) platforms = parsePlatforms(platforms);
if (platforms.length === 0) platforms = parsePlatforms(optionalEnv("SOCIAL_PLATFORMS"));

// A Make scenario that uploads a video is a different scenario from one that posts a photo —
// different modules, different webhook. Sending a video payload to the image hook is a silent
// failure: the webhook answers 200 and the Page stays empty. So pick the hook from the payload
// rather than making every caller remember to set the right variable first. This also has to
// be logic inside the script, because `register-tasks.mjs` builds a bare `schtasks /tr`
// command line that carries no environment of its own.
//
// Resolved AFTER the args are parsed so a missing variable stops the run before an upload,
// not after — but late enough to know whether this is a video.
const webhookEnv =
  flag("--webhook-env") || (video && optionalEnv("MAKE_WEBHOOK_VIDEO") ? "MAKE_WEBHOOK_VIDEO" : "MAKE_WEBHOOK_URL");
const webhook = dryRun ? "(dry-run)" : requireEnv(webhookEnv);

// A Make webhook can be locked with an API key ("API key restriction" in its settings). When
// it is, EVERY request without the key comes back 401 — an empty POST too, which is the quick
// way to tell this apart from a detached scenario (410) or a bad payload (200 and silence).
// Make wants it in the X-Make-ApiKey header. Read it from <WEBHOOK_VAR>_KEY so the image hook
// and the video hook can carry different keys, with MAKE_WEBHOOK_KEY as a shared fallback.
// Spelled out rather than built as `${webhookEnv}_KEY` so the names are greppable — both by a
// human and by the test that checks .env.example against what the code actually reads.
const KEY_ENV = {
  MAKE_WEBHOOK_URL: "MAKE_WEBHOOK_URL_KEY",
  MAKE_WEBHOOK_VIDEO: "MAKE_WEBHOOK_VIDEO_KEY",
};
const webhookKey =
  optionalEnv(KEY_ENV[webhookEnv] ?? `${webhookEnv}_KEY`) || optionalEnv("MAKE_WEBHOOK_KEY");
const webhookHeaders = webhookKey ? { "X-Make-ApiKey": webhookKey } : {};

try {
  // A video post carries the video in mediaUrl; the thumbnail (if any) goes to
  // image_url. An image post keeps the exact shape it has always had, so existing
  // Make scenarios reading {mediaUrl, image_url, post, comment} keep working.
  const kind = video ? "video" : "image";
  const videoUrl = video ? await uploadMedia(video, { kind: "video" }) : "";

  // A photo post may carry several pictures. They upload in order and the FIRST one stays in
  // `mediaUrl`/`image_url`, which is what every scenario built before this read — so a
  // multi-image payload sent to a single-photo scenario still publishes, just with one photo
  // instead of five. Degrading is the right failure here; refusing to send would mean a
  // scenario upgrade had to land in the same breath as a caller change.
  const photoList = [...new Set([...(images || []), ...(image ? [image] : [])])];
  const photoUrls = [];
  for (const p of photoList) photoUrls.push(await uploadMedia(p, { kind: "image" }));

  const imageUrl = thumbnail
    ? await uploadMedia(thumbnail, { kind: "image" })
    : photoUrls[0] || "";
  const mediaUrl = videoUrl || imageUrl;

  const body = {
    kind,
    mediaUrl,
    image_url: imageUrl,
    post,
    comment: comment || "",
  };
  if (kind === "image" && photoUrls.length) {
    // Two shapes of the same list, on purpose.
    //
    // `images` is the plain one — an array of URL strings, readable by anything.
    //
    // `photos` is pre-shaped for the field it has to land in. Make's Facebook Pages
    // "Create a Post with Photos" module takes a Photos array whose elements are collections
    // of {type, url}, not bare strings, so mapping an array of strings into it does not work:
    // the field silently keeps whatever single hardcoded item it was built with and the post
    // goes out with one photo. Building the collections here means the scenario needs nothing
    // but `{{1.photos}}` in that field — no Iterator, no Array aggregator, and none of the
    // "N separate posts instead of one post with N photos" failure that shape is prone to.
    body.images = photoUrls;
    body.imageCount = photoUrls.length;
    body.photos = photoUrls.map((url) => ({ type: "url", url }));
  }
  if (kind === "video") {
    body.video_url = videoUrl;
    body.thumbnailUrl = imageUrl;
    body.aspect = "9:16";
    if (durationSec) body.durationSec = Number(durationSec);
  }
  if (title) body.title = title;
  if (hashtags) body.hashtags = hashtags;
  if (platforms.length) body.platforms = platforms;

  // Fall off the end instead of process.exit(0). A dry run that uploaded a local file has
  // just left an armed AbortSignal.timeout behind it (the media hosts give uploads a 5-minute
  // ceiling), and forcing the process down while that handle is live aborts on Windows —
  // libuv's `!(handle->flags & UV_HANDLE_CLOSING)` assertion, exit code 127, AFTER the upload
  // and the payload print both succeeded. Which is the worst shape a bug can have here: the
  // obvious wrapper, `make-post.mjs --dry-run && make-post.mjs ...`, never runs its second
  // half, so checking the payload first appears to make posting fail.
  //
  // Nothing keeps the loop alive once the fetch settles, so a natural exit is immediate and
  // returns 0. Keep it that way — do not "tidy" this back into an explicit exit.
  if (dryRun) {
    console.log(JSON.stringify(body, null, 2));
    console.log(
      `[social] ✓ dry-run — nothing sent (would use $${webhookEnv}` +
        `${webhookKey ? " + X-Make-ApiKey" : ""})`,
    );
  } else {
    const { ok, status, text } = await postJson(webhook, body, { headers: webhookHeaders });
    if (!ok) throw new Error(`webhook ${status}: ${text.slice(0, 200)}`);
    onDone(true);
    const to = platforms.length ? ` → ${platforms.join(", ")}` : "";
    const n = photoUrls.length > 1 ? ` (${photoUrls.length} photos)` : mediaUrl ? " (with media)" : "";
    console.log(`[social] ✓ posted ${kind}${n}${to}`);
  }
} catch (e) {
  onDone(false, e.message);
  console.error(`[social] ✗ ${e.message}`);
  process.exit(1);
}
