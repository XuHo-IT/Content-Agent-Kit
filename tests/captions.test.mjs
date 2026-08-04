// captions.test.mjs — cue timing, ASS output, and the path escaping that only breaks on Windows.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkText, buildCues, assTime, assColour, toAss, escapeSubtitlePath } from "../scripts/video/lib/captions.mjs";

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} !== ${b}`);

test("a scene's cues start and end exactly where its narration does", () => {
  // The one timing this file can claim to be exact about. Everything inside the scene is
  // an estimate; the boundaries are not, because render.mjs built the audio track itself.
  const cues = buildCues([
    { text: "Câu thứ nhất ở đây. Câu thứ hai dài hơn một chút. Câu thứ ba.", startSec: 12.5, durSec: 6.4 },
  ]);
  assert.ok(cues.length > 1, "should have split");
  near(cues[0].startSec, 12.5, "first cue start");
  near(cues[cues.length - 1].endSec, 18.9, "last cue end");
});

test("cues never overlap and never leave a hole", () => {
  const cues = buildCues([
    { text: "Một câu mở đầu. Rồi một câu nữa. Và một câu thứ ba khá dài để chia ra.", startSec: 0, durSec: 8 },
    { text: "Cảnh sau bắt đầu ở đây. Thêm một câu nữa cho đủ dài.", startSec: 8.3, durSec: 5 },
  ]);
  for (let i = 1; i < cues.length; i++) {
    if (cues[i].startSec < cues[i - 1].endSec - 1e-9) assert.fail(`cue ${i} overlaps the one before`);
  }
});

test("the scene gap is left uncaptioned", () => {
  // durSec is the SPOKEN length. A caption hanging over the 0.3s silence would still be on
  // screen as the next scene's picture arrives.
  const cues = buildCues([
    { text: "Một câu ngắn gọn ở đây thôi.", startSec: 0, durSec: 4 },
    { text: "Cảnh tiếp theo nói tiếp.", startSec: 4.3, durSec: 4 },
  ]);
  const lastOfFirst = cues.filter((c) => c.startSec < 4.3).pop();
  near(lastOfFirst.endSec, 4, "the first scene's captions stop when its narration does");
});

test("time on screen is proportional to how much there is to say", () => {
  // The rule checked as a rule, rather than against a hand-picked number: a cue's share of
  // the scene equals its share of the scene's characters. That is the entire timing model,
  // and stating it this way is also an admission of what it is not — an alignment.
  const text =
    "Một câu vừa đủ dài để đứng riêng. " +
    "Một câu thứ hai dài hơn hẳn so với câu đầu tiên, có thêm mệnh đề phụ ở cuối.";
  const cues = buildCues([{ text, startSec: 0, durSec: 12 }]);
  assert.ok(cues.length >= 2, `expected a split, got ${cues.length}`);

  const dense = (s) => s.replace(/\s+/g, "").length;
  const totalChars = cues.reduce((a, c) => a + dense(c.text), 0);
  for (const c of cues) {
    near((c.endSec - c.startSec) / 12, dense(c.text) / totalChars, `"${c.text.slice(0, 24)}…" is off its share`);
  }
});

test("chunks break at sentence ends, not mid-thought", () => {
  const parts = chunkText("Câu một kết thúc ở đây. Câu hai bắt đầu ở đây.");
  assert.equal(parts.length, 2);
  assert.ok(parts[0].endsWith("."), `"${parts[0]}" should end on the full stop`);
});

test("no chunk exceeds the width a phone can read", () => {
  const long =
    "Rerank không làm cho RAG chạy nhanh hơn nhưng nó làm cho RAG trả lời đúng hơn " +
    "và rẻ hơn khá nhiều trên tài liệu tiếng Việt mà tôi đã thử nghiệm.";
  for (const c of chunkText(long, { max: 46 })) {
    assert.ok(c.length <= 46 * 1.4, `chunk too long (${c.length}): "${c}"`);
  }
});

test("a runt tail is merged rather than flashed", () => {
  // Two words on screen for a third of a second reads as a glitch, not as a caption.
  const parts = chunkText("Một câu đủ dài để đứng riêng một mình. Ừ.", { min: 16 });
  assert.ok(!parts.some((p) => p.length < 16), `runt survived: ${JSON.stringify(parts)}`);
});

test("empty narration produces no cues rather than an empty caption", () => {
  assert.deepEqual(chunkText(""), []);
  assert.deepEqual(chunkText("   "), []);
  assert.deepEqual(buildCues([{ text: "", startSec: 0, durSec: 5 }]), []);
});

test("ASS timestamps are h:mm:ss.cc", () => {
  assert.equal(assTime(0), "0:00:00.00");
  assert.equal(assTime(9.456), "0:00:09.46");
  assert.equal(assTime(61.5), "0:01:01.50");
  assert.equal(assTime(3661.25), "1:01:01.25");
  assert.equal(assTime(-3), "0:00:00.00", "a negative time must not produce a negative field");
});

test("ASS colours are &HAABBGGRR — reversed bytes AND inverted alpha", () => {
  // Getting either wrong silently produces the wrong colour, or invisible text.
  assert.equal(assColour("#ff0000"), "&H000000FF", "red");
  assert.equal(assColour("#0000ff"), "&H00FF0000", "blue");
  assert.equal(assColour("#123456"), "&H00563412");
  assert.equal(assColour("#000000", 1), "&HFF000000", "alpha 1 = fully transparent in ASS");
});

test("braces are replaced, not passed through — they open an ASS override block", () => {
  const ass = toAss([{ startSec: 0, endSec: 2, text: "một {vài} thứ" }], { width: 1080, height: 1920 });
  const line = ass.split("\n").find((l) => l.startsWith("Dialogue:"));
  assert.ok(!/[{}]/.test(line), `unescaped brace would swallow the caption: ${line}`);
  assert.ok(line.includes("(vài)"), line);
});

test("newlines inside a cue do not break the Dialogue line", () => {
  // One Dialogue per line is the format. A raw newline truncates the caption and corrupts
  // every cue after it.
  const ass = toAss([{ startSec: 0, endSec: 2, text: "dòng một\ndòng hai" }], { width: 1080, height: 1920 });
  assert.equal(ass.split("\n").filter((l) => l.startsWith("Dialogue:")).length, 1);
});

test("the canvas declared matches the video it will be burned onto", () => {
  // PlayResX/Y wrong means libass scales everything: correct-looking text at half size.
  const p = toAss([], { width: 1080, height: 1920 });
  assert.ok(p.includes("PlayResX: 1080") && p.includes("PlayResY: 1920"));
  const l = toAss([], { width: 1920, height: 1080 });
  assert.ok(l.includes("PlayResX: 1920") && l.includes("PlayResY: 1080"));
});

test("a theme recolours the captions instead of leaving them white on black", () => {
  const themed = toAss([{ startSec: 0, endSec: 1, text: "x" }], {
    width: 1080, height: 1920, theme: { bg: "#ffffff", ink: "#0a4a7a" },
  });
  assert.ok(themed.includes(assColour("#0a4a7a")), "ink not used as the primary colour");
});

test("the Style line has exactly the 23 fields the Format declares", () => {
  // One field out and libass reads the size as the colour. It does not error; it renders
  // something that looks nearly right.
  const ass = toAss([], { width: 1080, height: 1920 });
  const fmt = ass.split("\n").find((l) => l.startsWith("Format: Name,"));
  const style = ass.split("\n").find((l) => l.startsWith("Style:"));
  assert.equal(
    style.slice("Style:".length).split(",").length,
    fmt.slice("Format:".length).split(",").length,
  );
});

test("a Windows path is escaped for the subtitles filter", () => {
  // THE classic failure: ffmpeg's filtergraph parser reads `:` as an option separator, so
  // C:\out\captions.ass becomes a filter option named "C". Works on Linux, fails on Windows.
  assert.equal(escapeSubtitlePath("C:\\out\\captions.ass"), "C\\:/out/captions.ass");
  assert.equal(escapeSubtitlePath("/home/u/captions.ass"), "/home/u/captions.ass");
  assert.equal(escapeSubtitlePath("C:\\a b\\it's.ass"), "C\\:/a b/it\\'s.ass");
});
