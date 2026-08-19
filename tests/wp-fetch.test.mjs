// wp-fetch.test.mjs — run with: node --test tests/
//
// The two things that actually go wrong when reading a WordPress post are both here:
// picking up the "related posts" widget as if it were the article, and treating six
// responsive copies of one photo as six photos. Everything else is decoration.
import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalImageUrl, cutAtByline, decodeEntities, extractImages, firstSubtitle,
  htmlToText, isGated, pickImages, safeSlug, wordCount,
} from "../scripts/crawl/lib/wp.mjs";

// ── paywall ──────────────────────────────────────────────────────────────────

test("catches the Paid Memberships Pro gate this fetcher was built against", () => {
  // Verbatim from thetruecrimedatabase.com post 2251 — which sits in a category named
  // "Free Cases" and is not free. The category cannot be trusted; the body can.
  const html =
    `<p>Antoine Leger, known as the Cannibal of Cerny, committed one of the most grotesque` +
    ` murders in 1800's France.</p>` +
    `<div class="pmpro"><div class="pmpro_card pmpro_content_message"><div class="pmpro_card_content"><br />` +
    `This content is for Gold, Gold Annual (Discounted), Life Time Membership, and Gold Annual` +
    ` (Free Trial) members only.<br /><br />` +
    `<a href="/login-2/">Login</a> <a href="/membership-plans/">Free Trial</a></div></div></div>`;
  assert.equal(isGated(html), true);
});

test("catches the other common membership plugins", () => {
  assert.equal(isGated(`<div class="mepr-unauthorized">Buy now</div>`), true);
  assert.equal(isGated(`<div class="rcp-restricted">…</div>`), true);
  assert.equal(isGated(`<p>Subscribers only — please sign in to continue.</p>`), true);
});

test("an ordinary article about a members-only club is not gated", () => {
  // The discriminator is the upsell that follows, not the phrase on its own. A gate detector
  // that fires on prose would quietly drop good articles and look like an empty source.
  const html =
    `<p>The Carlton was a members only club in Belfast, and the victim had been seen there` +
    ` on the evening of the ninth.</p><p>Police interviewed every member.</p>`;
  assert.equal(isGated(html), false);
});

test("empty and non-string input is not gated", () => {
  assert.equal(isGated(""), false);
  assert.equal(isGated(null), false);
});

// ── body boundary ────────────────────────────────────────────────────────────

test("cuts the article at its byline, dropping the related-posts widget", () => {
  const html =
    `<p>The body of the case.</p><h5>Written by Nucleus</h5>` +
    `<h2>Related Case files</h2><img src="https://x.test/wp-content/uploads/2026/07/other-case.webp">`;
  const body = cutAtByline(html);
  assert.equal(body, "<p>The body of the case.</p>");
  assert.deepEqual(extractImages(body), []);
});

test("matches the byline whatever heading level or verb the theme uses", () => {
  for (const h of [
    "<h3>Written by Nucleus</h3>",
    "<h5 class='elementor-heading-title'>Posted by Someone</h5>",
    "<h4>Researched By A Team</h4>",
  ]) {
    assert.equal(cutAtByline(`<p>Body.</p>${h}<p>Tail.</p>`), "<p>Body.</p>", h);
  }
});

test("no byline → keeps everything, rather than guessing a cut point", () => {
  // Silently truncating an article is worse than keeping a widget: a human reviewer can see
  // the widget, but cannot see the paragraphs that were dropped.
  const html = "<p>One.</p><p>Two.</p>";
  assert.equal(cutAtByline(html), html);
  assert.equal(cutAtByline(""), "");
  assert.equal(cutAtByline(null), "");
});

test("a byline at position zero is not a cut point", () => {
  const html = "<h5>Written by Nucleus</h5><p>Body.</p>";
  assert.equal(cutAtByline(html), html);
});

// ── html → text ──────────────────────────────────────────────────────────────

test("block tags become paragraph breaks, inline tags vanish", () => {
  const html = "<p>First line.</p><div><p>Second <em>line</em>.</p></div>";
  assert.equal(htmlToText(html), "First line.\n\nSecond line.");
});

test("script and style content never reaches the text", () => {
  const html = "<p>Body.</p><script>var v = {a:1};</script><style>.x{color:red}</style>";
  assert.equal(htmlToText(html), "Body.");
});

test("br is a single newline, not a paragraph break", () => {
  assert.equal(htmlToText("<p>One<br>Two</p>"), "One\nTwo");
});

test("entities are decoded — named, decimal and hex", () => {
  assert.equal(decodeEntities("Tom &amp; Jerry &#8212; &#x2019;s case"), "Tom & Jerry — ’s case");
  assert.equal(decodeEntities("&nbsp;gap&nbsp;"), " gap ");
});

test("an unknown entity is left alone rather than eaten", () => {
  assert.equal(decodeEntities("&zzz; stays"), "&zzz; stays");
});

test("wordCount ignores whitespace-only input", () => {
  assert.equal(wordCount("một hai ba"), 3);
  assert.equal(wordCount("   "), 0);
  assert.equal(wordCount(null), 0);
});

// ── images ───────────────────────────────────────────────────────────────────

test("responsive variants of one upload collapse onto the original", () => {
  const u = "https://x.test/wp-content/uploads/2026/08/case-48586.webp";
  for (const w of ["-300x200", "-768x512", "-1024x683", "-1320x880"]) {
    assert.equal(canonicalImageUrl(u.replace(".webp", `${w}.webp`)), u);
  }
  assert.equal(canonicalImageUrl(u), u);
});

test("a -WxH that is not a size suffix is left alone", () => {
  // Only a suffix immediately before the extension is a WordPress size.
  const u = "https://x.test/uploads/map-12x12-tiles/photo.png";
  assert.equal(canonicalImageUrl(u), u);
});

test("srcset and the lazy-loading attributes are read, the placeholder is not", () => {
  // A lazy-loaded page serves a base64 SVG as `src` and hides the real file in `data-src`.
  // Reading `src` alone comes back with nothing usable — that is the whole bug.
  const html =
    `<img src="data:image/svg+xml;base64,AAAA" ` +
    `data-src="https://x.test/wp-content/uploads/2026/08/case-1024x683.webp" ` +
    `srcset="https://x.test/wp-content/uploads/2026/08/case-300x200.webp 300w, ` +
    `https://x.test/wp-content/uploads/2026/08/case.webp 1320w" alt="The scene">`;
  assert.deepEqual(extractImages(html), [
    { url: "https://x.test/wp-content/uploads/2026/08/case.webp", alt: "The scene" },
  ]);
});

test("theme furniture and tracking pixels are not article images", () => {
  const html = [
    `<img src="https://x.test/wp-content/themes/astra/logo.png">`,
    `<img src="https://x.test/wp-includes/images/spacer.gif">`,
    `<img src="https://x.test/avatar/nucleus.jpg">`,
    `<img src="https://x.test/wp-content/uploads/2026/08/real-photo.jpg">`,
  ].join("");
  assert.deepEqual(extractImages(html).map((i) => i.url), [
    "https://x.test/wp-content/uploads/2026/08/real-photo.jpg",
  ]);
});

test("non-image hrefs are ignored", () => {
  assert.deepEqual(extractImages(`<img src="https://x.test/tracker?id=1"><img src="/a.pdf">`), []);
});

test("document order is preserved and alt text survives deduplication", () => {
  const html =
    `<img src="https://x.test/uploads/a-300x200.jpg">` +
    `<img src="https://x.test/uploads/b.jpg" alt="Bee">` +
    `<img src="https://x.test/uploads/a.jpg" alt="Ay">`;
  assert.deepEqual(extractImages(html), [
    { url: "https://x.test/uploads/a.jpg", alt: "Ay" },
    { url: "https://x.test/uploads/b.jpg", alt: "Bee" },
  ]);
});

test("pickImages puts the featured image first and never repeats it", () => {
  const html = `<img src="https://x.test/uploads/a.jpg"><img src="https://x.test/uploads/b.jpg">`;
  const picked = pickImages(html, { featured: "https://x.test/uploads/b-1024x683.jpg" });
  assert.deepEqual(picked.map((i) => i.url), [
    "https://x.test/uploads/b.jpg",
    "https://x.test/uploads/a.jpg",
  ]);
});

test("pickImages honours max", () => {
  const html = ["a", "b", "c", "d"].map((n) => `<img src="https://x.test/uploads/${n}.jpg">`).join("");
  assert.equal(pickImages(html, { max: 2 }).length, 2);
});

// ── misc ─────────────────────────────────────────────────────────────────────

test("firstSubtitle takes a short heading near the top and skips a long one", () => {
  assert.equal(firstSubtitle(`<h1>Title</h1><h2>The Belfast Murder</h2><p>Body.</p>`), "The Belfast Murder");
  const longHeading = `<h2>${"x".repeat(200)}</h2>`;
  assert.equal(firstSubtitle(longHeading), "");
  assert.equal(firstSubtitle(`<p>${"x".repeat(2000)}</p><h2>Too late</h2>`), "");
});

test("firstSubtitle skips the catalogue number the template puts above the tagline", () => {
  // Real shape from thetruecrimedatabase: <h2>#0597</h2> sits above the actual tagline, and
  // a length-only test picks the number every time.
  const html = `<h2>#0597</h2><h1>Scissor Sisters</h1><h2>The Murder of Farah Swaleh Noor</h2>`;
  assert.equal(firstSubtitle(html), "The Murder of Farah Swaleh Noor");
});

test("safeSlug keeps directory names boring", () => {
  assert.equal(safeSlug("Glen Ward – Mr Flashy"), "glen-ward-mr-flashy");
  assert.equal(safeSlug("../../etc/passwd"), "etc-passwd");
  assert.equal(safeSlug("Vụ án Hoả Lò"), "v-n-ho-l");
  assert.equal(safeSlug("!!!", "post-1"), "post-1");
});
