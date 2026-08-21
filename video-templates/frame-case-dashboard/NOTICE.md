# Attribution — frame-case-dashboard

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to design mock-ups supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

Nothing in the library could show a case as a WHOLE — several lines of enquiry visible at
once, none of them concluded. Every other frame presents one fact at a time. It reuses the
same instrument library as `frame-forensic-instrument`, so an instrument is written once and
works in both.

## Slots

- `cells`
- `status_line`
- `status_right`
- `cell_1_label`
- `cell_2_label`
- `cell_3_label`
- `cell_4_label`
- `value_1`
- `value_2`
- `value_3`
- `label_1`
- `label_2`
- `label_3`
- `ticker`

## Cells (`cells`, comma-separated, 2–4)

- `toxicology`
- `xray`
- `dental`
- `algor-curve`
- `microscope`
- `evidence-bag`
- `web-history`
- `ip-trace`
- `gps-dashcam`
- `spectrogram`
- `lidar-mesh`
- `terrain-contour`
- `sewer-cutaway`
- `flight-radar`
- `bts-triangulate`
- `smuggle-route`
- `ais-vessel`
- `money-chain`
- `doppler-storm`

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-instrument-templates.mjs`. Edit that file, not the HTML.
