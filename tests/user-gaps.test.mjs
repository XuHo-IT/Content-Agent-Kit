// user-gaps.test.mjs — the fixes for where a real user got stuck (docs/30, items 23–29):
// AI clips → finished video, localisation, the spend ledger, upload packs.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { finishScript, fitWords } from "../scripts/video/lib/backends/finish.mjs";
import { extractStrings, applyStrings, checkStrings, catalogLimits } from "../scripts/video/lib/localize.mjs";
import { summarize, checkMonthly, recordSpend, readLedger, monthlyCeiling } from "../scripts/lib/spend.mjs";
import { packCaption, PACK_PLATFORMS, checklist } from "../scripts/social/lib/upload-pack.mjs";
import { PLATFORMS } from "../scripts/video/lib/delivery-specs.mjs";
import { SOURCE_IDS } from "../scripts/media/lib/sources/index.mjs";
import { validateScript } from "../scripts/video/lib/validate.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ── 23: AI clips → finished video ─────────────────────────────────────────────

const aiScript = {
  backend: "higgsfield",
  scenes: [
    { id: "hook", type: "hook", templateId: "frame-pentagram-stat", voiceText: "Một câu mở đầu dài để thử", inputs: { headline: "200MP", subtitle: "Cảm biến lớn nhất", kicker: "Camera" }, videoPrompt: "x" },
    { id: "b1", type: "body", templateId: "frame-broll", voiceText: "Đoạn thân", inputs: { headline: "Đã là broll" }, videoPrompt: "y" },
    { id: "b2", type: "body", templateId: "frame-vignelli", voiceText: "Không có clip cho cảnh này", inputs: { number: "3" } },
    { id: "out", type: "outro", templateId: "frame-statement-outro", voiceText: "Theo dõi", inputs: { cta: "Theo dõi" }, videoPrompt: "z" },
  ],
};

test("finished script: clip scenes become frame-broll with their own words, the rest untouched", () => {
  const f = finishScript(aiScript, { hook: "/c/hook.mp4", b1: "/c/b1.mp4", out: "/c/out.mp4" });
  assert.equal(f.backend, "html");
  const [hook, b1, b2, out] = f.scenes;
  assert.equal(hook.templateId, "frame-broll");
  assert.deepEqual(hook.media, { kind: "video", source: "file", id: "/c/hook.mp4", fit: "cover" });
  assert.equal(hook.inputs.headline, "200MP");
  assert.equal(hook.inputs.subheadline, "Cảm biến lớn nhất");
  assert.equal(hook.inputs.kicker, "Camera");
  assert.equal(hook.voiceText, aiScript.scenes[0].voiceText, "narration is never touched");
  assert.equal(b1.inputs.headline, "Đã là broll", "a broll scene only gains its media");
  assert.deepEqual(b2, aiScript.scenes[2], "no clip → unchanged");
  assert.equal(out.templateId, "frame-statement-outro", "the outro keeps its designed card");
  assert.equal(aiScript.scenes[0].templateId, "frame-pentagram-stat", "the input script is not mutated");
});

test("headline falls back to the start of the narration, cut on a word", () => {
  assert.equal(fitWords("Người xem quyết định ở lại hay lướt đi chỉ trong vài giây đầu", 42), "Người xem quyết định ở lại hay lướt đi chỉ");
  assert.equal(fitWords("ngắn", 42), "ngắn");
  const f = finishScript({ scenes: [{ id: "a", type: "body", templateId: "frame-checklist", voiceText: "Ba mẹo chọn size áo khi mua hàng online cho người mới", inputs: {} }] }, { a: "/a.mp4" });
  assert.ok(f.scenes[0].inputs.headline.length <= 42);
});

test("local files are a media source the validator accepts", () => {
  assert.ok(SOURCE_IDS.includes("file"));
});

// ── 24: localisation ─────────────────────────────────────────────────────────

test("catalog limits are read from CATALOG.md", () => {
  const lim = catalogLimits();
  assert.equal(lim["frame-broll"].headline, 42);
  assert.equal(lim["frame-broll"].subheadline, 90);
});

test("extract lists spoken + on-screen text with limits, skips data slots", () => {
  const s = { metadata: { title: "Tiêu đề" }, scenes: [{ id: "a", templateId: "frame-broll", voiceText: "Xin chào", inputs: { headline: "Tin nóng", media_kind: "video", anchor: "200" } }] };
  const keys = extractStrings(s).map((x) => `${x.key}:${x.max}`);
  assert.deepEqual(keys, ["metadata.title:100", "scenes.0.voiceText:null", "scenes.0.inputs.headline:42"]);
});

test("apply refuses untranslated and over-long lines, then writes the voice for the language", () => {
  const strings = [
    { key: "scenes.0.voiceText", text: "Xin chào", max: null, translation: "Hello" },
    { key: "scenes.0.inputs.headline", text: "Tin nóng", max: 10, translation: "Breaking news today" },
    { key: "metadata.title", text: "T", max: 100, translation: "" },
  ];
  const { errors } = checkStrings(strings);
  assert.ok(errors.some((e) => /not translated/.test(e)));
  assert.ok(errors.some((e) => /slot allows 10/.test(e)));
  strings[1].translation = "Breaking";
  strings[2].translation = "Title";
  assert.deepEqual(checkStrings(strings).errors, []);
  const out = applyStrings({ voice: { provider: "omnivoice" }, metadata: { title: "T" }, scenes: [{ voiceText: "Xin chào", inputs: { headline: "Tin nóng" } }] }, strings, { lang: "en" });
  assert.equal(out.scenes[0].voiceText, "Hello");
  assert.equal(out.scenes[0].inputs.headline, "Breaking");
  assert.deepEqual(out.voice, { provider: "google", voiceId: "en-US-Neural2-F" });
  assert.equal(applyStrings({ scenes: [] }, [], { lang: "ja", provider: "azure" }).voice.voiceId, "ja-JP-NanamiNeural");
});

test("the shipped English sample validates strictly", () => {
  const s = JSON.parse(fs.readFileSync(path.join(KIT, "examples/niche-samples/marketing/en/script.json"), "utf8"));
  const { errors } = validateScript(s, { strict: true });
  assert.deepEqual(errors, []);
  assert.equal(s.voice.provider, "google");
});

// ── 27: spend ledger ─────────────────────────────────────────────────────────

test("the month is summed per provider; unpriced units are counted, not invented", () => {
  const e = [
    { at: "2026-11-02T00:00:00Z", provider: "higgsfield", usd: 0.42, units: 6, unit: "s" },
    { at: "2026-11-03T00:00:00Z", provider: "higgsfield", usd: 0.3, units: 5, unit: "s" },
    { at: "2026-11-03T00:00:00Z", provider: "google", usd: null, units: 1200, unit: "chars" },
    { at: "2026-10-30T00:00:00Z", provider: "fal", usd: 9, units: 10, unit: "s" },
  ];
  const s = summarize(e, "2026-11");
  assert.equal(s.usd, 0.72);
  assert.equal(s.calls, 3);
  assert.deepEqual(s.providers.find((p) => p.provider === "google").units, { chars: 1200 });
  assert.equal(checkMonthly(0.5, { ceiling: 1, entries: e, month: "2026-11" }).ok, false);
  assert.equal(checkMonthly(0.2, { ceiling: 1, entries: e, month: "2026-11" }).ok, true);
  assert.equal(checkMonthly(99, { ceiling: null, entries: e }).ok, true);
  assert.match(checkMonthly(5, { ceiling: 1, entries: e, month: "2026-11" }).reason, /monthlyCeilingUsd/);
});

test("the ledger appends and reads back; a profile's monthly ceiling wins over env", () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "spend-")), "s.jsonl");
  recordSpend({ provider: "fal", usd: 0.27 }, { SPEND_LEDGER: f });
  recordSpend({ provider: "fal", usd: 0.27 }, { SPEND_LEDGER: f });
  assert.equal(readLedger(f).length, 2);
  assert.equal(monthlyCeiling({ monthlyCeilingUsd: 20 }, { SPEND_MONTHLY_CEILING_USD: "50" }), 20);
  assert.equal(monthlyCeiling({}, { SPEND_MONTHLY_CEILING_USD: "50" }), 50);
  assert.equal(monthlyCeiling({}, {}), null);
});

// ── 26: upload packs ─────────────────────────────────────────────────────────

test("every pack platform maps to a delivery spec", () => {
  for (const [id, p] of Object.entries(PACK_PLATFORMS)) assert.ok(PLATFORMS[p.spec], `${id} → ${p.spec}`);
});

test("captions are trimmed only where a limit is published, hashtags kept", () => {
  assert.equal(packCaption("Ngắn", "#a", null).text, "Ngắn\n\n#a");
  const long = "Câu dài. ".repeat(400);
  const c = packCaption(long, "#tag", 2200);
  assert.ok(c.cut && [...c.text].length <= 2200);
  assert.ok(c.text.endsWith("#tag"));
  assert.match(checklist(PACK_PLATFORMS.zalo, { videoNote: "ok" }), /Zalo/);
});
