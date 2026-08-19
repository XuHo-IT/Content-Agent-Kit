# Attribution — frame-papercut-diorama

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Why it exists

Every paper-textured frame in the library was FLAT: a document lying on a surface, shot from
above. None had depth. This one is cut paper with planes that drift at different rates, which is
the only reason it reads as three-dimensional. Fills `dimensional`, 3 of 107.

## Slots

- `kicker`
- `title`
- `subtitle`
- `caption`
- `footer_left`
- `footer_right`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-vox-templates.mjs`. Edit that file, not the HTML.
