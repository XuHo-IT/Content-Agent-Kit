# Attribution — frame-trend-price-drop

**Original template** authored for content-agent-kit (MIT, same as this repo).
Style direction from the 2026 code-video trend survey (`yihui-dev/awesome-opus5-5-videos`) and the
caption/punch-in grammar of `kurbaitaev/ghost-editor` (MIT); no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

The old price sits big, a red slash cuts through it, the new price slams in with a camera shake and a discount stamp rotates on. Shopee/TikTok Shop live-sale grammar, made for the last scene of a selling video.

## Slots

- `kicker`
- `product`
- `old_price`
- `new_price`
- `badge`
- `note`
- `cta`

Both compositions are emitted together by `scripts/video/lib/build-trend-templates.mjs`.
Edit that file, not the HTML.
