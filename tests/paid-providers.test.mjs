// paid-providers.test.mjs — the optional paid providers, checked offline: what each would
// send and what it would bill. No key, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PROVIDER_SPECS, ttsConfig, xmlEscape, localeOf, describeProvider } from "../scripts/video/lib/tts.mjs";
import { FAL_MODELS, falModel, estimateFal, snapDuration } from "../scripts/video/lib/backends/fal.mjs";
import { fitDuration, planScenes, higgsfieldModel, authHeader, HIGGSFIELD_MODELS } from "../scripts/video/lib/backends/higgsfield.mjs";
import { BACKENDS } from "../scripts/video/lib/backends/index.mjs";
import { ayrshareBody } from "../scripts/social/lib/ayrshare.mjs";

const withEnv = (vars, fn) => {
  const old = {};
  for (const k of Object.keys(vars)) { old[k] = process.env[k]; if (vars[k] === undefined) delete process.env[k]; else process.env[k] = vars[k]; }
  try { return fn(); } finally { for (const k of Object.keys(old)) { if (old[k] === undefined) delete process.env[k]; else process.env[k] = old[k]; } }
};

// ── TTS ───────────────────────────────────────────────────────────────────────

test("voice names carry their language", () => {
  assert.equal(localeOf("vi-VN-HoaiMyNeural"), "vi-VN");
  assert.equal(localeOf("en-US-Chirp3-HD-Charon"), "en-US");
  assert.equal(localeOf("fil-PH-BlessicaNeural"), "fil-PH");
  assert.equal(localeOf(""), "vi-VN");
});

test("google sends the voice's language and reads base64 audio back", () => {
  withEnv({ GOOGLE_TTS_API_KEY: "k", TTS_VOICE_ID: undefined }, () => {
    const cfg = ttsConfig({ provider: "google", voiceId: "en-US-Neural2-F", speed: 1.1 });
    assert.equal(cfg.shape, "jsonBase64");
    const req = PROVIDER_SPECS.google.build("Hello", cfg);
    const body = JSON.parse(req.body);
    assert.match(req.url, /text:synthesize\?key=k$/);
    assert.deepEqual(body.voice, { languageCode: "en-US", name: "en-US-Neural2-F" });
    assert.equal(body.audioConfig.speakingRate, 1.1);
    assert.equal(PROVIDER_SPECS.google.pickBase64({ audioContent: "QUJD" }), "QUJD");
  });
});

test("google works without a voice id — Vietnamese by default", () => {
  withEnv({ GOOGLE_TTS_API_KEY: "k", TTS_VOICE_ID: undefined, GOOGLE_TTS_VOICE: undefined }, () => {
    const cfg = ttsConfig({ provider: "google" });
    const body = JSON.parse(PROVIDER_SPECS.google.build("Xin chào", cfg).body);
    assert.equal(body.voice.languageCode, "vi-VN");
  });
});

test("azure escapes the text into SSML and maps speed to a percentage", () => {
  withEnv({ AZURE_SPEECH_KEY: "k", AZURE_SPEECH_REGION: "southeastasia", TTS_VOICE_ID: undefined }, () => {
    const cfg = ttsConfig({ provider: "azure", speed: 1.2 });
    const req = PROVIDER_SPECS.azure.build(`Giá <50k> & "rẻ"`, cfg);
    assert.equal(req.url, "https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1");
    assert.equal(req.headers["Ocp-Apim-Subscription-Key"], "k");
    assert.match(req.body, /xml:lang="vi-VN"/);
    assert.match(req.body, /<voice name="vi-VN-HoaiMyNeural">/);
    assert.match(req.body, /rate="\+20%"/);
    assert.match(req.body, /Giá &lt;50k&gt; &amp; &quot;rẻ&quot;/);
  });
  assert.equal(xmlEscape("a<b"), "a&lt;b");
});

test("the new voices declare their keys", () => {
  assert.deepEqual(describeProvider("google").keys, ["GOOGLE_TTS_API_KEY"]);
  assert.deepEqual(describeProvider("azure").keys, ["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"]);
});

// ── fal ───────────────────────────────────────────────────────────────────────

const script = { scenes: [
  { id: "a", voiceText: "một hai ba bốn năm sáu bảy tám", videoPrompt: "a city at dawn" }, // 8 words ≈ 3.2 s
  { id: "b", durationSec: 7, videoPrompt: "a market" },
  { id: "c", durationSec: 14, videoPrompt: "a river" },
] };

test("a clip is snapped UP to a length the model makes, and billed for it", () => {
  assert.equal(snapDuration(4, [5, 10]), 5);
  assert.equal(snapDuration(7, [6, 10]), 10);
  assert.equal(snapDuration(14, [5, 10]), 10);
  const est = estimateFal(script, { ...FAL_MODELS["hailuo-02"], model: "hailuo-02" });
  assert.deepEqual(est.scenes.map((s) => s.billedSec), [6, 10, 10]);
  assert.equal(est.totalUsd, Math.round(26 * 0.045 * 100) / 100);
});

test("fal: a custom model without a rate refuses rather than guessing a bill", () => {
  assert.throws(() => falModel({ FAL_MODEL: "nope" }), /Known: kling-v3/);
  assert.throws(() => falModel({ FAL_MODEL: "x", FAL_MODEL_ID: "fal-ai/something" }), /FAL_RATE_PER_SEC/);
  const m = falModel({ FAL_MODEL: "x", FAL_MODEL_ID: "fal-ai/something", FAL_RATE_PER_SEC: "0.2" });
  assert.equal(m.id, "fal-ai/something");
  assert.equal(m.ratePerSec, 0.2);
  assert.equal(falModel({}).model, "hailuo-02");
});

test("fal kling asks for a vertical clip, as a string duration", () => {
  assert.deepEqual(FAL_MODELS["kling-v3"].body("p", 5), { prompt: "p", duration: "5", aspect_ratio: "9:16" });
});

// ── higgsfield ────────────────────────────────────────────────────────────────

test("higgsfield fits each model's documented clip lengths", () => {
  assert.equal(fitDuration(1, { min: 3, max: 15 }), 3);
  assert.equal(fitDuration(7.2, { min: 3, max: 15 }), 8);
  assert.equal(fitDuration(40, { min: 4, max: 15 }), 15);
  assert.equal(fitDuration(7, [6, 10]), 10);
});

test("higgsfield bodies: vertical, model audio off, the kit lays its own sound", () => {
  const k = HIGGSFIELD_MODELS["kling-3"].body("p", 5);
  assert.deepEqual(k, { prompt: "p", duration: 5, aspect_ratio: "9:16", sound: "off" });
  const s = HIGGSFIELD_MODELS["seedance-2"].body("p", 5);
  assert.equal(s.generate_audio, false);
  assert.equal(s.aspect_ratio, "9:16");
  const plan = planScenes(script, higgsfieldModel({ HIGGSFIELD_MODEL: "seedance-2" }));
  assert.deepEqual(plan.map((p) => p.sec), [4, 7, 14]);
});

test("higgsfield auth is the documented key pair, and missing keys say where to get them", () => {
  assert.deepEqual(authHeader({ HIGGSFIELD_KEY_ID: "id", HIGGSFIELD_KEY_SECRET: "sec" }).Authorization, "Key id:sec");
  assert.throws(() => authHeader({}), /console\.higgsfield\.ai/);
  assert.throws(() => higgsfieldModel({ HIGGSFIELD_MODEL: "sora" }), /HIGGSFIELD_MODEL_PATH/);
});

test("both new backends are registered with cost and needs", () => {
  for (const id of ["fal", "higgsfield"]) {
    assert.ok(BACKENDS[id].module && BACKENDS[id].needs && BACKENDS[id].costPerVideo);
  }
});

// ── ayrshare ──────────────────────────────────────────────────────────────────

test("ayrshare: platform names mapped, video options set, comment not silently dropped", () => {
  const { body, warnings } = ayrshareBody({
    kind: "video", post: "Caption", hashtags: "#a #b", video_url: "https://cdn.x/v.mp4",
    title: "Tiêu đề", platforms: ["tiktok", "youtube_shorts", "facebook_reels", "instagram_reels"], comment: "hi",
  });
  assert.deepEqual(body.platforms, ["tiktok", "youtube", "facebook", "instagram"]);
  assert.equal(body.post, "Caption\n\n#a #b");
  assert.deepEqual(body.mediaUrls, ["https://cdn.x/v.mp4"]);
  assert.deepEqual(body.youTubeOptions, { title: "Tiêu đề", shorts: true });
  assert.equal(body.instagramOptions.reels, true);
  assert.equal(body.faceBookOptions.reels, true);
  assert.ok(warnings.some((w) => /comment/.test(w)));
});

test("ayrshare warns on what it would refuse: no title for YouTube, non-HTTPS media, no platform", () => {
  const { warnings } = ayrshareBody({ kind: "video", post: "x", video_url: "http://x/v.mp4", platforms: ["youtube_shorts"] });
  assert.ok(warnings.some((w) => /title/.test(w)));
  assert.ok(warnings.some((w) => /HTTPS/.test(w)));
  assert.throws(() => ayrshareBody({ kind: "image", post: "x", platforms: [] }), /platform/);
  const img = ayrshareBody({ kind: "image", post: "x", images: ["https://a/1.jpg", "https://a/2.jpg"], platforms: ["facebook"] });
  assert.deepEqual(img.body.mediaUrls, ["https://a/1.jpg", "https://a/2.jpg"]);
  assert.equal(img.body.isVideo, undefined);
});
