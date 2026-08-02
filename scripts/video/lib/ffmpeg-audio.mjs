// ffmpeg-audio.mjs — duration probing, gap-aware concat, SFX mixing.
// Ported from AI-auto-generate-video/src/assets/audio-tools.ts (MIT — see NOTICE.md).
// The non-obvious bits below are load-bearing; the comments explain why.
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { run } from "./proc.mjs";

/**
 * Duration in seconds.
 *
 * For MP3, ffprobe's `format=duration` estimates from bitrate×filesize and is
 * badly wrong for TTS output (OmniVoice emits 24 kHz MPEG-2 L3, which can be off
 * by 30%+ — enough to desync every scene). Count encoded packets instead: one
 * MP3 frame is 1152 samples (MPEG-1, sr≥32 kHz) or 576 (MPEG-2/2.5, sr<32 kHz).
 */
export async function getDurationSec(path) {
  if (path.toLowerCase().endsWith(".mp3")) {
    try {
      const raw = await run("ffprobe", [
        "-v", "error",
        "-count_packets",
        "-select_streams", "a:0",
        "-show_entries", "stream=nb_read_packets,sample_rate",
        "-of", "json",
        path,
      ]);
      const stream = JSON.parse(raw)?.streams?.[0];
      const packets = parseInt(stream?.nb_read_packets ?? "", 10);
      const sampleRate = parseInt(stream?.sample_rate ?? "", 10);
      if (packets > 0 && sampleRate > 0) {
        const samplesPerFrame = sampleRate >= 32000 ? 1152 : 576;
        return (packets * samplesPerFrame) / sampleRate;
      }
    } catch {
      /* fall through to format=duration */
    }
  }

  const out = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    path,
  ]);
  const d = parseFloat(out.trim());
  if (Number.isNaN(d)) throw new Error(`ffprobe returned a non-numeric duration for ${path}: ${out}`);
  return d;
}

const MP3_OUT = ["-c:a", "libmp3lame", "-b:a", "192k", "-ar", "44100"];
const FADE_SEC = 0.008; // 8 ms — inaudible, but kills boundary clicks

/**
 * Change playback speed without changing pitch, in place.
 *
 * For TTS providers that take a speed parameter we pass it through and never call
 * this. It exists for the ones that don't (OmniVoice), so `voice.speed` in a
 * script.json means the same thing whichever provider rendered it.
 *
 * ffmpeg's atempo only accepts 0.5–2.0 per filter instance, which happens to be
 * exactly the schema's range, so one instance is always enough.
 */
export async function applySpeed(path, speed) {
  if (!speed || Math.abs(speed - 1) < 0.01) return; // no-op
  if (speed < 0.5 || speed > 2.0) throw new Error(`speed must be 0.5–2.0, got ${speed}`);
  const tmp = `${path}.speed.mp3`;
  await run("ffmpeg", ["-y", "-i", path, "-filter:a", `atempo=${speed}`, ...MP3_OUT, tmp]);
  const { rename } = await import("node:fs/promises");
  await rename(tmp, path);
}

/**
 * Concatenate audio files with `gapSec` of silence between each.
 *
 * Uses the concat FILTER (not the demuxer) with explicit sample-rate/channel
 * normalization, because mismatched inputs joined by the demuxer pop audibly.
 * Each segment also gets an 8 ms fade in and out to smooth any DC-offset
 * discontinuity at the seam.
 */
export async function concatWithSilence(inputPaths, gapSec, outPath) {
  if (inputPaths.length === 0) throw new Error("concatWithSilence: empty inputPaths");
  if (inputPaths.length === 1) {
    await run("ffmpeg", ["-y", "-i", inputPaths[0], "-ar", "44100", "-ac", "1", ...MP3_OUT, outPath]);
    return;
  }

  const tmp = await mkdtemp(join(tmpdir(), "cak-aconcat-"));
  try {
    // WAV silence: lossless, so no encoder priming pops at the joins.
    const silencePath = join(tmp, "silence.wav");
    await run("ffmpeg", [
      "-y", "-f", "lavfi",
      "-i", "anullsrc=r=44100:cl=mono",
      "-t", String(gapSec),
      "-ac", "1", "-ar", "44100",
      silencePath,
    ]);

    const ffArgs = ["-y"];
    const filterParts = [];
    const labels = [];
    let idx = 0;

    const addInput = (p) => {
      ffArgs.push("-i", p);
      const out = `a${idx}`;
      // The fade-OUT is done as areverse → fade-in → areverse: afade's `t=out`
      // needs a start time relative to the end, which we can't know without
      // probing every input first.
      filterParts.push(
        `[${idx}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=mono,` +
          `afade=t=in:st=0:d=${FADE_SEC},` +
          `areverse,afade=t=in:st=0:d=${FADE_SEC},areverse[${out}]`,
      );
      labels.push(`[${out}]`);
      idx++;
    };

    inputPaths.forEach((p, i) => {
      addInput(p);
      if (i < inputPaths.length - 1) addInput(silencePath);
    });

    const graph =
      `${filterParts.join(";")};${labels.join("")}concat=n=${labels.length}:v=0:a=1[out]`;
    ffArgs.push("-filter_complex", graph, "-map", "[out]", ...MP3_OUT, outPath);
    await run("ffmpeg", ffArgs);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

/**
 * Layer SFX onto the narration track.
 * Voice stays at full volume; each SFX is delayed to its start time and scaled.
 * `normalize=0` on both amix stages — otherwise ffmpeg quietly halves the voice.
 * Empty list → straight re-encode.
 *
 * @param {{path:string,startSec:number,volume:number}[]} sfxList
 */
export async function mixSfxOntoVoice(voicePath, sfxList, outPath) {
  if (sfxList.length === 0) {
    await run("ffmpeg", ["-y", "-i", voicePath, ...MP3_OUT, outPath]);
    return;
  }

  const ffArgs = ["-y", "-i", voicePath];
  const filterParts = [];
  const sfxLabels = [];

  sfxList.forEach((s, i) => {
    ffArgs.push("-i", s.path);
    const inputIdx = i + 1; // voice occupies index 0
    const out = `s${i}`;
    const delayMs = Math.max(0, Math.round(s.startSec * 1000));
    filterParts.push(
      `[${inputIdx}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=mono,` +
        `adelay=${delayMs}|${delayMs},volume=${s.volume}[${out}]`,
    );
    sfxLabels.push(`[${out}]`);
  });

  let mixedSfx = sfxLabels[0];
  if (sfxLabels.length > 1) {
    filterParts.push(
      `${sfxLabels.join("")}amix=inputs=${sfxLabels.length}:dropout_transition=0:normalize=0[sfxall]`,
    );
    mixedSfx = "[sfxall]";
  }

  filterParts.push(`[0:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=mono[voice]`);
  filterParts.push(
    `[voice]${mixedSfx}amix=inputs=2:duration=first:dropout_transition=0:normalize=0[out]`,
  );

  ffArgs.push("-filter_complex", filterParts.join(";"), "-map", "[out]", ...MP3_OUT, outPath);
  await run("ffmpeg", ffArgs);
}
