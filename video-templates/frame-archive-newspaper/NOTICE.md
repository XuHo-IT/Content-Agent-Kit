# Attribution — frame-archive-newspaper

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to a design mock-up supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

`frame-vox-newspaper-tear` is a torn CLIPPING — two columns, a pull quote, no picture. This is a whole page: masthead, date line, and the photograph that ran with it. The two make different claims about where the source came from, so both exist.

## Slots

- `kicker`
- `paper_name`
- `issue_date`
- `headline`
- `standfirst`
- `column_text`
- `photo_caption`
- `footer`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-detective-templates.mjs`. Edit that file, not the HTML.
