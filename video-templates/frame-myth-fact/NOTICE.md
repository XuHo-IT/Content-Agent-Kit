# Attribution — frame-myth-fact

**Original template** authored for content-agent-kit (MIT, same as this repo).
Not vendored from anywhere.

## Design

Two comparison frames existed and neither does this. `frame-aicoding-comparison`
puts two products side by side; `frame-split-compare` puts two states of one
thing. Neither can strike a claim down, which is the shape of most content worth
watching: everyone thinks X, here is why that is wrong.

The strike-through is drawn — a rule that sweeps across the myth — rather than
CSS `line-through`, because the sweep is the moment the frame exists for and
`line-through` would simply be there from the first frame.

It is a REPEATING GRADIENT, not an absolutely-positioned bar. The first version
was a bar at `top: 52%`, which strikes a one-line myth correctly and, on the
two-line myth this template ships by default, lands between the lines and reads
as an underline of the first one. A gradient whose period is the line height
crosses every line, and animating `background-size` sweeps all of them at once.

Once the strike lands the myth dims and the correction rises underneath, so the
two claims are never equally loud.

`source` is optional and worth filling: a correction without a source is just a
different assertion.

## Use

Slots: `mythLabel`, `myth`, `factLabel`, `fact`, `source` — see `../CATALOG.md`.

Both compositions are generated from one source, so the 16:9 and 9:16 layouts cannot drift
apart on slot names or on behaviour; only the layout CSS differs between them.

## Changes in content-agent-kit

None — written here.
