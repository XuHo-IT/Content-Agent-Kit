// validate-script.test.mjs — the gate has to REJECT, not just accept.
//
// CI already proved validate-script accepts a good script: it runs the reference
// VIDEO_SCRIPT.template.json in strict mode on every push. Nothing proved it catches a bad
// one. A gate tested only in the passing direction is not a gate — it is a formality that
// will keep saying "valid" long after it has stopped looking.
//
// AGENTS.md calls this the safety gate before a five-minute render. These tests are what
// make that claim checkable.
//
// `templateIds` is passed explicitly throughout so the suite does not depend on which
// templates happen to be installed — renaming a folder should not turn these red.
import test from "node:test";
import assert from "node:assert/strict";
import { validateScript } from "../scripts/video/lib/validate.mjs";

const IDS = ["frame-liquid-bg-hero", "frame-broll", "frame-vignelli", "frame-statement-outro", "frame-logo-outro"];

/** A script that passes, so each test can break exactly one thing. */
const good = (over = {}) => ({
  version: "1.0",
  renderer: "hyperframes",
  aspect: "9:16",
  metadata: {
    title: "Tiêu đề bài",
    source: { url: "https://example.com/bai-viet", domain: "example.com", image: null },
    channel: "XuHo-IT",
  },
  voice: { provider: "vbee", voiceId: "hn_female_ngochuyen_full_48k-fhg", speed: 1 },
  scenes: [
    { id: "hook", type: "hook", templateId: "frame-liquid-bg-hero", voiceText: "Câu mở đầu để người xem dừng lại và nghe tiếp câu chuyện này." },
    { id: "body-1", type: "body", templateId: "frame-broll", voiceText: "Đoạn thân bài thứ nhất, nói vừa đủ một ý và không nhồi thêm gì nữa." },
    { id: "body-2", type: "body", templateId: "frame-vignelli", voiceText: "Đoạn thân bài thứ hai, tiếp tục mạch trên và dẫn sang phần kết luận." },
    { id: "outro", type: "outro", templateId: "frame-statement-outro", voiceText: "Câu kết mời người xem làm một việc cụ thể chứ không phải ba việc." },
  ],
  ...over,
});

const run = (s) => validateScript(s, { templateIds: IDS });
const errs = (s) => run(s).errors;
const hasErr = (s, re) => errs(s).some((e) => re.test(e));

// ── the control ──────────────────────────────────────────────────────────────

test("the good script passes with no errors", () => {
  const { errors } = run(good());
  assert.deepEqual(errors, [], `fixture should be clean, got: ${errors.join(" | ")}`);
});

// ── schema ───────────────────────────────────────────────────────────────────

test("rejects a wrong version — and the number 1 is not the string 1.0", () => {
  assert.ok(hasErr(good({ version: 1 }), /version must be/), "1 (number) must be rejected");
  assert.ok(hasErr(good({ version: "2.0" }), /version must be/));
});

test("rejects an unknown renderer", () => {
  assert.ok(hasErr(good({ renderer: "remotion" }), /renderer must be/));
});

test("rejects an aspect the pipeline cannot render", () => {
  // 1:1 is the trap: upstream mapped it to a square composition no template ships, so it
  // silently rendered 16:9. Only 9:16 and 16:9 are real.
  assert.ok(hasErr(good({ aspect: "1:1" }), /aspect must be/));
  assert.ok(hasErr(good({ aspect: "4:5" }), /aspect must be/));
});

test("rejects a non-object payload", () => {
  assert.ok(run(null).errors.length > 0);
  assert.ok(run([]).errors.length > 0);
  assert.ok(run("script").errors.length > 0);
});

// ── structure ────────────────────────────────────────────────────────────────

test("rejects a script that does not open on a hook or close on an outro", () => {
  const s = good();
  s.scenes[0].type = "body";
  assert.ok(hasErr(s, /scenes\[0\]\.type must be "hook"/));

  const t = good();
  t.scenes.at(-1).type = "body";
  assert.ok(hasErr(t, /last scene .type must be "outro"/));
});

test("rejects too few scenes", () => {
  const s = good();
  s.scenes = s.scenes.slice(0, 2);
  assert.ok(hasErr(s, /at least 3 entries/));
});

test("rejects duplicate scene ids", () => {
  // Duplicates are quietly destructive: narration and clips are written to
  // voice/scene-<id>.mp3 and clips/scene-<id>.mp4, so the second scene overwrites the first.
  const s = good();
  s.scenes[2].id = "body-1";
  assert.ok(hasErr(s, /is duplicated/));
});

test("rejects a scene missing an id, a type, a templateId or voiceText", () => {
  for (const [field, re] of [
    ["id", /\.id is required/],
    ["type", /\.type must be one of/],
    ["templateId", /\.templateId is required/],
    ["voiceText", /\.voiceText is required/],
  ]) {
    const s = good();
    delete s.scenes[1][field];
    assert.ok(hasErr(s, re), `deleting ${field} should be rejected`);
  }
});

test("rejects a templateId that does not exist", () => {
  const s = good();
  s.scenes[1].templateId = "frame-does-not-exist";
  assert.ok(errs(s).length > 0, "an unknown template must fail before the render starts");
});

// ── narration, the rules that exist because TTS reads them aloud ─────────────

test("rejects an emoji in narration", () => {
  const s = good();
  s.scenes[1].voiceText = "Đây là một đoạn 🔥 mà máy đọc sẽ phải đọc thành cái gì đó rất lạ.";
  assert.ok(hasErr(s, /emoji|arrow/i));
});

test("rejects a URL in narration — it would be read out character by character", () => {
  const s = good();
  s.scenes[1].voiceText = "Chi tiết ở https://example.com nhé, mời các bạn ghé xem thử ngay.";
  assert.ok(hasErr(s, /URL/));
});

test("rejects digits that TTS would mispronounce in Vietnamese", () => {
  const s = good();
  s.scenes[1].voiceText = "Con số là 1689 token, giảm gần 68% so với cấu hình không rerank.";
  assert.ok(errs(s).length > 0, "raw digits must be spelled out for Vietnamese TTS");
});

test("accepts the same narration once the numbers are written as words", () => {
  const s = good();
  s.scenes[1].voiceText =
    "Con số là một nghìn sáu trăm tám mươi chín token, giảm gần bảy mươi phần trăm.";
  assert.deepEqual(errs(s), []);
});

// ── media ────────────────────────────────────────────────────────────────────

test("rejects a media block with no way to find the media", () => {
  const s = good();
  s.scenes[1].media = { kind: "video", source: "pexels" };
  assert.ok(hasErr(s, /needs one of id \/ query \/ ref \/ url/));
});

test("rejects an unknown media source and an unknown media kind", () => {
  const a = good();
  a.scenes[1].media = { kind: "video", source: "shutterstock", query: "x" };
  assert.ok(hasErr(a, /is unknown/));

  const b = good();
  b.scenes[1].media = { kind: "audio", source: "pexels", query: "x" };
  assert.ok(hasErr(b, /must be video \| image \| screenshot/));
});

test("rejects a screenshot with no url, and a non-http url", () => {
  const a = good();
  a.scenes[1].media = { kind: "screenshot", source: "screenshot" };
  assert.ok(hasErr(a, /needs a "url"/));

  const b = good();
  b.scenes[1].media = { kind: "screenshot", source: "screenshot", url: "file:///etc/passwd" };
  assert.ok(hasErr(b, /must be http/));
});

// ── voice ────────────────────────────────────────────────────────────────────

test("rejects a speed outside the range a provider will accept", () => {
  for (const speed of [0, 0.2, 2.5, "fast"]) {
    assert.ok(hasErr(good({ voice: { provider: "vbee", voiceId: "v", speed } }), /speed must be/),
      `speed ${JSON.stringify(speed)} must be rejected`);
  }
});

test("an unset speed means 1.0 rather than an error", () => {
  // `voice.speed ?? 1.0` — null and undefined are "not specified", which is a normal thing
  // for a script to be. Only a value outside the range is wrong.
  for (const speed of [null, undefined]) {
    assert.deepEqual(errs(good({ voice: { provider: "vbee", voiceId: "v", speed } })), []);
  }
});

test("rejects metadata the publish step needs", () => {
  assert.ok(hasErr(good({ metadata: undefined }), /metadata is required/));
  const s = good();
  delete s.metadata.channel;
  assert.ok(hasErr(s, /metadata.channel is required/));
});

// ── warnings are warnings, not errors ────────────────────────────────────────

test("craft problems warn rather than block", () => {
  // The distinction matters: an error stops a render, a warning is a judgement call the
  // writer gets to make. Collapsing the two would make --strict meaningless.
  const s = good();
  s.scenes[1].templateId = "frame-broll";
  s.scenes[2].templateId = "frame-broll"; // repeated body template
  const { errors, warnings } = run(s);
  assert.deepEqual(errors, [], "repetition is a craft issue, not a schema error");
  assert.ok(warnings.length > 0, "…but it must still be reported");
});

test("a query-based media block warns about reproducibility", () => {
  const s = good();
  s.scenes[1].media = { kind: "video", source: "pexels", query: "server room" };
  const { errors, warnings } = run(s);
  assert.deepEqual(errors, []);
  assert.ok(warnings.some((w) => /media-lock/.test(w)), "must say the clip gets pinned on first render");
});

// ── stats ────────────────────────────────────────────────────────────────────

test("reports stats a human can sanity-check against the finished video", () => {
  const { stats } = run(good());
  assert.equal(stats.scenes, 4);
  assert.equal(stats.aspect, "9:16");
  assert.ok(stats.totalWords > 0 && stats.estSec > 0);
});
