// meme-social.test.mjs — the two newest media sources, offline.
//
// No network: what is checked is the part a typo breaks silently. The meme source's whole
// job is to hand memegen a request; if the font default slips back to the site's own
// `impact`, every Vietnamese meme renders with its diacritics missing — the API still
// returns 200, the image is still a meme, and nothing downstream can tell.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { imageRequest, parseSpec } from "../scripts/media/lib/sources/meme.mjs";
import { RIGHTS, RIGHTS_NEEDING_NOTE } from "../scripts/media/lib/sources/social.mjs";
import { SOURCE_IDS } from "../scripts/media/lib/sources/index.mjs";
import { validateScript } from "../scripts/video/lib/validate.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ── meme ────────────────────────────────────────────────────────────────────

test("the meme font defaults to notosans, not the site's impact", () => {
  // Impact has no Vietnamese diacritics. Rendered and compared: "Viết script bằng tay" comes
  // back as "VI T SCRIPT BẰNG TAY" and "Để agent viết bước đầu" as "Đ AGENT VI T B C Đ U".
  // The glyphs are dropped silently and the response is still a 200 PNG.
  assert.equal(imageRequest("drake|a|b").font, "notosans");
});

test("meme text is passed through untouched — memegen does the escaping", () => {
  // The path encoding is a minefield (`_` space, `__` underscore, `--` dash, `~q` `~s` `~a`
  // `~p` `~h`, `''` quote) and Vietnamese punctuation walks straight into it. POST takes a
  // plain array, so anything this function does to the text is a bug, not a feature.
  const tricky = "Cái gì? 50% / 50% — thật_sự đấy";
  const req = imageRequest(`drake|${tricky}|dòng hai`);
  assert.deepEqual(req.text, [tricky, "dòng hai"]);
  assert.equal(req.template_id, "drake");
});

test("a spec parses into a template and its lines", () => {
  assert.deepEqual(parseSpec("drake|một|hai"), { template: "drake", text: ["một", "hai"] });
  // A blank template is legitimate — some memes carry no text at all.
  assert.deepEqual(parseSpec("drake"), { template: "drake", text: [] });
  // Empty segments are dropped rather than sent as empty lines.
  assert.deepEqual(parseSpec("drake|một||"), { template: "drake", text: ["một"] });
  assert.throws(() => parseSpec(""), /needs "<template>/);
});

test("kind decides the format — an animated meme must not arrive as a still", () => {
  // A `kind:"video"` scene handed a .png renders a frozen "animation": the render succeeds,
  // the frame is full, and the only symptom is that nothing moves.
  assert.equal(imageRequest("drake|a|b", { extension: "png" }).extension, "png");
  assert.equal(imageRequest("drake|a|b", { extension: "gif" }).extension, "gif");
});

// ── social: the rights gate ─────────────────────────────────────────────────

const SCRIPT = JSON.parse(
  fs.readFileSync(path.join(KIT, "templates", "VIDEO_SCRIPT.template.json"), "utf8"),
);

/** The reference script with one scene's media replaced. */
function withMedia(media, templateId = "frame-broll") {
  const s = structuredClone(SCRIPT);
  const i = s.scenes.findIndex((x) => x.type === "body");
  s.scenes[i] = { ...s.scenes[i], templateId, media };
  return s;
}

const errorsOf = (script) =>
  (validateScript(script).errors ?? []).join("\n");

test("a third-party clip with no rights declaration is refused", () => {
  const out = errorsOf(withMedia({ kind: "video", source: "social", url: "https://www.douyin.com/video/7" }));
  assert.match(out, /declares no "rights"/);
  // And it names the way out rather than just saying no.
  for (const r of RIGHTS) assert.ok(out.includes(r), `the error should list "${r}"`);
});

test("an invented rights value is refused", () => {
  const out = errorsOf(
    withMedia({ kind: "video", source: "social", url: "https://x.com/1", rights: "probably fine" }),
  );
  assert.match(out, /not one of/);
});

test("claiming someone else's permission requires naming it", () => {
  for (const r of RIGHTS_NEEDING_NOTE) {
    const out = errorsOf(withMedia({ kind: "video", source: "social", url: "https://x.com/1", rights: r }));
    assert.match(out, /rights_note/, `"${r}" should demand a note`);
  }
  // Owning it does not — there is nobody else's permission to record.
  const own = errorsOf(withMedia({ kind: "video", source: "social", url: "https://x.com/1", rights: "own" }));
  assert.doesNotMatch(own, /rights_note/);
});

test("a declared clip with its note passes", () => {
  const out = errorsOf(
    withMedia({
      kind: "video",
      source: "social",
      url: "https://www.douyin.com/video/7",
      rights: "permitted",
      rights_note: "author @abc agreed by DM, 2026-08-14",
    }),
  );
  assert.doesNotMatch(out, /rights/);
});

test("the rights vocabulary has no escape hatch", () => {
  // "probably fine", "fair use" and "unknown" are exactly the values that make the field
  // decorative. If one appears, the gate has stopped meaning anything.
  for (const bad of ["fair-use", "unknown", "probably-fine", "other"]) {
    assert.ok(!RIGHTS.includes(bad), `"${bad}" must not be an accepted declaration`);
  }
  assert.ok(RIGHTS_NEEDING_NOTE.every((r) => RIGHTS.includes(r)));
});

// ── the meme fit gate ───────────────────────────────────────────────────────

test("a meme without fit:contain is refused", () => {
  // `fit` defaults to cover, which crops the image to fill the frame — and a meme's text
  // runs to its own edges, so cover takes the punchline. It happens in normalizeImage,
  // before the template sees the file, and the render then succeeds with a full frame.
  const out = errorsOf(withMedia({ kind: "image", source: "meme", id: "drake|a|b" }, "frame-meme"));
  assert.match(out, /"fit": "contain"/);

  const cover = errorsOf(
    withMedia({ kind: "image", source: "meme", id: "drake|a|b", fit: "cover" }, "frame-meme"),
  );
  assert.match(cover, /"fit": "contain"/);

  const ok = errorsOf(
    withMedia({ kind: "image", source: "meme", id: "drake|a|b", fit: "contain" }, "frame-meme"),
  );
  assert.doesNotMatch(ok, /fit/);
});

// ── registry wiring ─────────────────────────────────────────────────────────

test("both sources are registered and frame-meme can display media", () => {
  for (const id of ["meme", "social"]) {
    assert.ok(SOURCE_IDS.includes(id), `source "${id}" is not in the registry`);
  }
  // A media template the validator does not know about earns a warning on every scene that
  // uses it, which trains people to ignore the warnings.
  const validate = fs.readFileSync(path.join(KIT, "scripts", "video", "lib", "validate.mjs"), "utf8");
  assert.match(validate, /MEDIA_TEMPLATES = \[[^\]]*"frame-meme"/);
});

test("frame-meme never filters the meme", () => {
  // The one property that makes this template different from frame-media-inset, which tints
  // its media into the palette on purpose. A CSS filter on .meme would undo the whole point.
  for (const f of ["index.html", "compositions/portrait.html"]) {
    const html = fs.readFileSync(path.join(KIT, "video-templates", "frame-meme", f), "utf8");
    const block = html.slice(html.indexOf(".meme, video.meme"), html.indexOf("}", html.indexOf(".meme, video.meme")));
    assert.doesNotMatch(block, /filter|mix-blend-mode|saturate|hue-rotate/, `${f} filters the meme`);
    assert.match(block, /object-fit:\s*contain/, `${f} must contain, not cover — cover crops the joke`);
  }
});
