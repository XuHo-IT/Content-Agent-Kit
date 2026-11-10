# Attribution — frame-trend-comment-reply

**Original template** authored for content-agent-kit (MIT, same as this repo).
Style direction from the 2026 code-video trend survey (`yihui-dev/awesome-opus5-5-videos`) and the
caption/punch-in grammar of `kurbaitaev/ghost-editor` (MIT); no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

The 'Trả lời bình luận của @…' sticker pops on screen, then the answer title and three numbered points build under it. It is the native TikTok reply format, and no template could open on a viewer's own words.

## Slots

- `reply_label`
- `username`
- `comment`
- `answer_title`
- `point_1`
- `point_2`
- `point_3`

Both compositions are emitted together by `scripts/video/lib/build-trend-templates.mjs`.
Edit that file, not the HTML.
