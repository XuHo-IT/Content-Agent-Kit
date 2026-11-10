# Attribution — frame-trend-phone-notifs

**Original template** authored for content-agent-kit (MIT, same as this repo).
Style direction from the 2026 code-video trend survey (`yihui-dev/awesome-opus5-5-videos`) and the
caption/punch-in grammar of `kurbaitaev/ghost-editor` (MIT); no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

A real phone on a lock screen: notifications drop in with a spring and push each other down while the phone buzzes, then a headline lands. Phone-UI hooks are the most relatable opener for a Vietnamese audience, and the old stack was a strip of 14px rows.

## Slots

- `time`
- `date`
- `app_1`
- `msg_1`
- `app_2`
- `msg_2`
- `app_3`
- `msg_3`
- `app_4`
- `msg_4`
- `headline`

Both compositions are emitted together by `scripts/video/lib/build-trend-templates.mjs`.
Edit that file, not the HTML.
