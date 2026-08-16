// transitions.test.mjs — the arithmetic behind scene transitions.
//
// xfade OVERLAPS its inputs. Get the compensation wrong and every video the kit
// renders drifts out of sync with its own narration — silently, because the file
// still plays. That failure is invisible to a green build and expensive to find
// by eye, so it is checked here, in arithmetic, with no ffmpeg required.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  transitionPlan,
  transitionGraph,
  TRANSITIONS,
  DEFAULT_TRANSITION_SEC,
} from "../scripts/video/lib/ffmpeg-video.mjs";

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} !== ${b}`);

test("total duration is unchanged by transitions — the whole point", () => {
  const base = [6.2, 4.8, 7.1, 5.4, 8.0];
  const T = 0.25;
  const secs = Array(base.length - 1).fill(T);
  const { totalSec } = transitionPlan(base, secs);
  near(totalSec, base.reduce((a, b) => a + b, 0), "total drifted");
});

test("the same holds for every transition length, not just the default", () => {
  const base = [5, 3.5, 9.25, 2.75];
  for (const T of [0.05, 0.1, DEFAULT_TRANSITION_SEC, 0.3, 1.2, 2.4]) {
    const { totalSec } = transitionPlan(base, Array(3).fill(T));
    near(totalSec, 20.5, `total drifted at T=${T}`);
  }
});

test("padding goes on every clip but the last", () => {
  const base = [10, 5, 8];
  const { padded } = transitionPlan(base, [0.25, 0.25]);
  assert.deepEqual(padded, [10.25, 5.25, 8]);
});

test("offsets place each blend at the end of what came before", () => {
  // Two clips, 10s and 5s, blending for 0.25s: the blend starts at 10.0 —
  // i.e. 0.25s before the padded 10.25s first clip ends.
  const { offsets, totalSec } = transitionPlan([10, 5], [0.25]);
  near(offsets[0], 10.0, "first offset");
  near(totalSec, 15, "total");
});

test("offsets accumulate correctly across a long chain", () => {
  const base = [4, 4, 4, 4, 4];
  const T = 0.5;
  const { offsets } = transitionPlan(base, Array(4).fill(T));
  // Each join lands 4s later than the last: the padding and the overlap cancel.
  assert.deepEqual(
    offsets.map((o) => Number(o.toFixed(6))),
    [4, 8, 12, 16],
  );
});

test("a scene's picture starts where its narration starts", () => {
  // The property that actually matters. The narration track is built separately
  // from the voice durations and never shrinks, so scene k's picture must still
  // begin at sum(base[0..k-1]) — the offset IS that timestamp.
  //
  // The blend therefore runs over the first T of the incoming scene rather than
  // finishing before it. That is the deliberate trade: it keeps each scene's
  // picture and its words locked together, at the cost of the new scene arriving
  // at partial opacity for a quarter of a second.
  const base = [6.2, 4.8, 7.1, 5.4];
  const { offsets } = transitionPlan(base, Array(3).fill(0.25));
  let expected = 0;
  for (let k = 0; k < offsets.length; k++) {
    expected += base[k];
    near(offsets[k], expected, `scene ${k + 1} picture start`);
  }
});

test('"none" joints are hard cuts — no padding, no offset', () => {
  const { padded, offsets, totalSec } = transitionPlan([10, 5, 8], [0, 0]);
  assert.deepEqual(padded, [10, 5, 8], "nothing padded");
  assert.deepEqual(offsets, [null, null], "null means concat, not xfade");
  near(totalSec, 23, "total");
});

test("mixing transitions and hard cuts keeps the total exact", () => {
  const base = [6, 4, 7, 5, 3];
  const secs = [0.25, 0, 0.4, 0]; // blend, cut, blend, cut
  const { padded, offsets, totalSec } = transitionPlan(base, secs);
  assert.deepEqual(padded, [6.25, 4, 7.4, 5, 3]);
  near(totalSec, 25, "total");
  assert.equal(offsets[1], null, "the cut has no offset");
  assert.equal(offsets[3], null, "the cut has no offset");
  // A hard cut earlier in the chain must not shift a later blend.
  near(offsets[0], 6, "first blend");
  near(offsets[2], 17, "second blend — 6+4+7");
});

test("a single scene needs no plan and is left alone", () => {
  const { padded, offsets, totalSec } = transitionPlan([9.5], []);
  assert.deepEqual(padded, [9.5]);
  assert.deepEqual(offsets, []);
  near(totalSec, 9.5, "total");
});

test("a transition longer than its neighbouring scene is rejected", () => {
  // Silently clamping would produce a video where one scene is entirely blend.
  assert.throws(() => transitionPlan([10, 0.2, 8], [0.25, 0.25]), /shorter neighbouring scene is only 0\.2s/);
});

test("a transition exactly as long as a scene is rejected too", () => {
  assert.throws(() => transitionPlan([3, 3], [3]), /shorter neighbouring scene/);
});

test("nonsense durations are rejected rather than producing NaN offsets", () => {
  assert.throws(() => transitionPlan([5, 5], [NaN]), /not a duration/);
  assert.throws(() => transitionPlan([5, 5], [-1]), /not a duration/);
  assert.throws(() => transitionPlan([], []), /empty durations/);
});

test("a transitions array of the wrong length is rejected", () => {
  // Off-by-one here would shift every scene after the mistake.
  assert.throws(() => transitionPlan([5, 5, 5], [0.25]), /expected 2 transitions for 3 clips/);
  assert.throws(() => transitionPlan([5, 5], [0.25, 0.25]), /expected 1 transitions for 2 clips/);
});

test("the default transition fits inside the inter-scene silence", () => {
  // render.mjs leaves SCENE_GAP_SEC = 0.3s of silence between scenes. A default
  // longer than that would blend over speech on every video the kit makes.
  assert.ok(DEFAULT_TRANSITION_SEC < 0.3, `${DEFAULT_TRANSITION_SEC}s overruns the 0.3s gap`);
});

test("every transition name maps to a real ffmpeg xfade transition", () => {
  // These are ffmpeg's own names. A typo here fails at concat time, an hour
  // into a render, after TTS has already been paid for.
  //
  // A curated SUBSET, not the whole vocabulary — ffmpeg ships ~57 and this lists the ones the
  // kit has had a use for. The list is hand-maintained because the CI runner has no ffmpeg to
  // ask (same reason tests/wiring.test.mjs decodes a JPEG header by hand), so adding a
  // transition means adding it here too. Verify against the real thing before you do:
  //   ffmpeg -h filter=xfade
  const FFMPEG_XFADE = [
    "fade", "wipeleft", "wiperight", "wipeup", "wipedown",
    "slideleft", "slideright", "slideup", "slidedown",
    "circleopen", "circleclose", "pixelize", "dissolve",
    "smoothleft", "smoothright", "fadeblack", "fadewhite",
    "zoomin",
  ];
  for (const [name, kind] of Object.entries(TRANSITIONS)) {
    if (name === "none") {
      assert.equal(kind, null, '"none" must map to null, not an ffmpeg name');
      continue;
    }
    assert.ok(FFMPEG_XFADE.includes(kind), `TRANSITIONS.${name} = "${kind}" is not an ffmpeg xfade transition`);
  }
});

test("settb comes AFTER fps on every input — the bug that only shows with a hard cut", () => {
  // `fps` resets the timebase to 1/fps. Put `settb=AVTB` before it and the setting
  // is thrown away; every input then carries 1/fps, which is fine right up until a
  // `concat` joint emits AVTB and the next xfade refuses to configure:
  //   "First input link main timebase (1/1000000) do not match ... (1/30)"
  // Pure-crossfade chains never hit it. This is the regression.
  const plan = transitionPlan([6, 4, 7, 5], [0.25, 0, 0.4]);
  const graph = transitionGraph({ n: 4, offsets: plan.offsets, kinds: ["swipe", "none", "iris"], secs: [0.25, 0, 0.4], fps: 30 });
  for (let i = 0; i < 4; i++) {
    assert.ok(graph.includes(`[${i}:v]fps=30,settb=AVTB[c${i}]`), `input ${i} normalised in the wrong order:\n${graph}`);
  }
  assert.ok(!/settb=AVTB,fps=/.test(graph), "settb before fps — fps will overwrite the timebase");
});

test("the graph chains xfade and concat with no dangling pads", () => {
  const plan = transitionPlan([6, 4, 7, 5, 3], [0.25, 0, 0.4, 0]);
  const graph = transitionGraph({
    n: 5,
    offsets: plan.offsets,
    kinds: ["swipe", "none", "iris", "none"],
    secs: [0.25, 0, 0.4, 0],
    fps: 30,
  });
  // Every label produced must be consumed exactly once, and only [v] left over.
  const produced = [...graph.matchAll(/\[(\w+)\](?=;|$)/g)].map((m) => m[1]);
  const consumed = [...graph.matchAll(/(?:^|;)((?:\[\w+\])+)/g)].flatMap((m) =>
    [...m[1].matchAll(/\[(\w+)\]/g)].map((x) => x[1]),
  );
  for (const label of produced) {
    if (label === "v") continue;
    assert.equal(consumed.filter((c) => c === label).length, 1, `[${label}] is not consumed exactly once:\n${graph}`);
  }
  assert.ok(graph.endsWith("[v]"), "the graph must end on the mapped output");
  assert.equal((graph.match(/xfade=/g) ?? []).length, 2, "two blends");
  assert.equal((graph.match(/concat=/g) ?? []).length, 2, "two hard cuts");
});

test('a "none" kind never reaches ffmpeg as an xfade name', () => {
  // TRANSITIONS.none is null; if a null ever got formatted into the graph,
  // ffmpeg would fail with an unhelpful parse error an hour into a render.
  const plan = transitionPlan([5, 5], [0]);
  const graph = transitionGraph({ n: 2, offsets: plan.offsets, kinds: ["none"], secs: [0], fps: 30 });
  assert.ok(!graph.includes("xfade"), "a hard cut must not produce an xfade");
  assert.ok(!/null|undefined|NaN/.test(graph), `graph carries a placeholder value:\n${graph}`);
});

test("an unknown transition throws before ffmpeg is invoked", () => {
  assert.throws(
    () => transitionGraph({ n: 2, offsets: [4.0], kinds: ["glitch"], secs: [0.25], fps: 30 }),
    /unknown transition "glitch"/,
  );
});

test("validate.mjs rejects a misspelt transition before anything is rendered", async () => {
  const { validateScript } = await import("../scripts/video/lib/validate.mjs");
  const script = {
    version: "1.0",
    renderer: "hyperframes",
    metadata: { title: "t", topic: "t" },
    transition: "swoosh", // the SFX is called that; the transition is not
    scenes: [
      { id: "s1", type: "hook", templateId: "frame-title-card", voiceText: "Một câu mở đầu ngắn gọn ở đây." },
      { id: "s2", type: "outro", templateId: "frame-logo-outro", voiceText: "Một câu kết thúc ngắn gọn ở đây." },
    ],
  };
  const { errors } = validateScript(script);
  assert.ok(
    errors.some((e) => /transition must be one of/.test(e)),
    `expected a transition error, got: ${JSON.stringify(errors)}`,
  );
});

test("validate.mjs accepts a real transition name", async () => {
  const { validateScript } = await import("../scripts/video/lib/validate.mjs");
  const script = {
    version: "1.0",
    renderer: "hyperframes",
    metadata: { title: "t", topic: "t" },
    transition: "swipe",
    scenes: [
      { id: "s1", type: "hook", templateId: "frame-title-card", voiceText: "Một câu mở đầu ngắn gọn ở đây." },
      { id: "s2", type: "outro", templateId: "frame-logo-outro", voiceText: "Một câu kết thúc ngắn gọn ở đây.", transition: "iris" },
    ],
  };
  const { errors } = validateScript(script);
  assert.ok(
    !errors.some((e) => /transition/.test(e)),
    `unexpected transition error: ${JSON.stringify(errors.filter((e) => /transition/.test(e)))}`,
  );
});
