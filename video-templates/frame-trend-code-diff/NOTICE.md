# Attribution — frame-trend-code-diff

**Original template** authored for content-agent-kit (MIT, same as this repo).
Style direction from the 2026 code-video trend survey (`yihui-dev/awesome-opus5-5-videos`) and the
caption/punch-in grammar of `kurbaitaev/ghost-editor` (MIT); no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

An editor where the old line turns red, strikes through and collapses, the new line types itself in green, and a passing-tests toast slides in. Code is the third most-asked subject in Opus video prompts, and the old diff card was two 15px lines.

## Slots

- `file_name`
- `ctx_1`
- `line_del`
- `line_add`
- `ctx_2`
- `status`
- `caption`

Both compositions are emitted together by `scripts/video/lib/build-trend-templates.mjs`.
Edit that file, not the HTML.
