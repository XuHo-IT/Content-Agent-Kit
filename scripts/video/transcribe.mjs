#!/usr/bin/env node
// transcribe.mjs — speech in a video → the word-timed transcript talking-head.mjs and autocut need.
//
//   node scripts/video/transcribe.mjs take.mp4                       # → take.transcript.json
//   node scripts/video/transcribe.mjs take.mp4 --engine faster-whisper --model large-v3-turbo
//   node scripts/video/transcribe.mjs take.mp4 --from 58 --to 134 --out t.json
//
// WHY. Active-word captions need the time each WORD was said. Until now the kit told the user
// to "run faster-whisper yourself" — the one step in the talking-head flow a newcomer could not
// do from a chat. This wraps the two common ways to get word timings, and writes the shape
// lib/captions.mjs#wordsFromTranscript reads: { segments: [ { start, end, text, words: [ {w, start, end} ] } ] }.
//
// ENGINES
//   http (default when TRANSCRIBE_ENDPOINT is set) — any server with OpenAI's
//        POST /v1/audio/transcriptions + timestamp_granularities[]=word: speaches /
//        faster-whisper-server, LocalAI, or a hosted API. Local servers need no key.
//   faster-whisper (MIT) — `pip install faster-whisper`; runs in Python on this machine. The kit
//        stays dependency-free: Python is only called if you pick this engine.
// Vietnamese: large-v3-turbo is a good default; PhoWhisper (VinAI, BSD-3) transcribes Vietnamese
// better but gives no word timings on its own — use it through a server that aligns words.
//
// ALWAYS read the transcript before publishing captions: models mishear names and rare words
// (the demo's "chuyển về" came back as "chuyển viện" from two models). Fix the JSON by hand.
//
// ENV: TRANSCRIBE_ENDPOINT, TRANSCRIBE_MODEL, TRANSCRIBE_API_KEY, TRANSCRIBE_PYTHON (all optional). Needs ffmpeg.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { run } from "./lib/proc.mjs";
import { spawn } from "node:child_process";
import { parseSilences } from "./lib/autocut.mjs";
import { optionalEnv } from "../lib/env.mjs";
import { findPython } from "./lib/vision.mjs";

/**
 * Any OpenAI-style verbose_json (segments without words + a top-level words[]), or a
 * faster-whisper dump (segments with words), → the kit's transcript. Words are put back into
 * the segment whose span holds their midpoint; `offset` shifts everything (for --from).
 */
/**
 * Speech the transcript has no words for. `speech` = [{start, end}] where the audio is not
 * silent (the complement of silencedetect); `words` = [{start, end}]. → the stretches longer
 * than `minGap` seconds that are speech yet hold no word.
 *
 * Why: on the demo, prompting faster-whisper with topic words fixed every misheard name and
 * silently DROPPED the first 14 s of speech — the transcript looked fine, it was just short.
 * A model that skips audio never says so; this does.
 */
export function uncoveredSpeech(speech, words, { minGap = 2 } = {}) {
  const out = [];
  for (const sp of speech) {
    let t = sp.start;
    const inside = words.filter((w) => w.end > sp.start && w.start < sp.end).sort((a, b) => a.start - b.start);
    for (const w of inside) {
      if (w.start - t >= minGap) out.push({ start: +t.toFixed(2), end: +w.start.toFixed(2) });
      t = Math.max(t, w.end);
    }
    if (sp.end - t >= minGap) out.push({ start: +t.toFixed(2), end: +sp.end.toFixed(2) });
  }
  return out;
}

export function normalizeTranscription(json, { offset = 0, model = null } = {}) {
  const r = (x) => +(Number(x) + offset).toFixed(3);
  const segs = (json?.segments ?? []).map((s) => ({ start: r(s.start), end: r(s.end), text: String(s.text ?? "").trim(), words: [] }));
  const raw = [
    ...(json?.words ?? []),
    ...(json?.segments ?? []).flatMap((s) => s.words ?? []),
  ];
  const words = raw
    .map((w) => ({ w: String(w.w ?? w.word ?? "").trim(), start: r(w.start), end: r(w.end), ...(w.probability != null ? { p: +Number(w.probability).toFixed(2) } : {}) }))
    .filter((w) => w.w && Number.isFinite(w.start) && Number.isFinite(w.end) && w.end >= w.start)
    .sort((a, b) => a.start - b.start);
  if (!segs.length && words.length) segs.push({ start: words[0].start, end: words.at(-1).end, text: words.map((w) => w.w).join(" "), words: [] });
  for (const w of words) {
    const mid = (w.start + w.end) / 2;
    const s = segs.find((x) => mid >= x.start && mid <= x.end) ?? segs.reduce((a, b) => (Math.abs((a.start + a.end) / 2 - mid) <= Math.abs((b.start + b.end) / 2 - mid) ? a : b));
    s.words.push(w);
  }
  return {
    _note: "Machine transcript — read it and fix names and misheard words before publishing captions.",
    model,
    segments: segs.filter((s) => s.text || s.words.length),
  };
}

// The WAV is read here with the standard library and handed over as samples: faster-whisper's
// own decoder goes through PyAV, and faster-whisper 1.2.1 + PyAV 16 fail on a removed keyword
// (`metadata_errors`) — the first real run hit exactly that. A GPU without its CUDA libraries
// (cuBLAS/cuDNN not installed) fails at the first decode, not at load, so the fallback to CPU
// wraps the transcription itself.
const FW_PY = `
import json, sys, wave
import numpy as np
from faster_whisper import WhisperModel
audio, model, lang = sys.argv[1], sys.argv[2], sys.argv[3]
prompt = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] else None
with wave.open(audio, "rb") as w:
    pcm = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
def run(device, compute):
    m = WhisperModel(model, device=device, compute_type=compute)
    segs, info = m.transcribe(pcm, language=lang, word_timestamps=True, vad_filter=True, hotwords=prompt)
    return [{"start": s.start, "end": s.end, "text": s.text,
             "words": [{"word": w.word, "start": w.start, "end": w.end, "probability": w.probability} for w in (s.words or [])]}
            for s in segs]
try:
    segments, used = run("auto", "auto"), "auto"
except Exception as e:
    sys.stderr.write("GPU path failed (%s) - retrying on CPU\\n" % str(e).splitlines()[0][:160])
    segments, used = run("cpu", "int8"), "cpu"
sys.stdout.write(json.dumps({"segments": segments, "device": used}))
`;

async function viaHttp(audio, { endpoint, model, lang, prompt = "" }) {
  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(audio)], { type: "audio/wav" }), path.basename(audio));
  form.append("model", model);
  form.append("language", lang);
  if (prompt) form.append("prompt", prompt);
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("timestamp_granularities[]", "segment");
  const key = optionalEnv("TRANSCRIBE_API_KEY");
  const res = await fetch(`${endpoint.replace(/\/+$/, "")}/v1/audio/transcriptions`, {
    method: "POST",
    body: form,
    headers: key ? { Authorization: `Bearer ${key}` } : {},
  });
  if (!res.ok) throw new Error(`transcription server ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

function viaFasterWhisper(audio, { model, lang, prompt = "" }) {
  // TRANSCRIBE_PYTHON, then the kit's own .venv-vision (pip install faster-whisper there), then PATH
  const py = findPython(["TRANSCRIBE_PYTHON", "VISION_PYTHON"]);
  if (!py) throw new Error(`no Python 3 found — install Python, then: pip install faster-whisper (or set TRANSCRIBE_PYTHON)`);
  // Windows Python writes cp1252 to a pipe by default; Vietnamese in an error message would crash it
  const r = spawnSync(py, ["-I", "-c", FW_PY, audio, model, lang, prompt], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
  if (r.error) throw new Error(`could not start ${py}: ${r.error.message}`);
  if (r.status !== 0) {
    const err = String(r.stderr || "");
    if (/No module named 'faster_whisper'/.test(err)) throw new Error(`faster-whisper is not installed — run: pip install faster-whisper`);
    throw new Error(err.trim().split("\n").slice(-4).join("\n"));
  }
  return JSON.parse(r.stdout);
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes("--help")) {
    console.log(
      `transcribe.mjs — video/audio → word-timed transcript JSON (for talking-head.mjs --transcript)\n` +
        `  <input>              video or audio file\n` +
        `  --engine <e>         http | faster-whisper (default: http if TRANSCRIBE_ENDPOINT is set)\n` +
        `  --model <name>       default large-v3-turbo (or TRANSCRIBE_MODEL)\n` +
        `  --lang <code>        default vi\n` +
        `  --prompt "<words>"   names and topic words the model should expect ("bưu điện, bưu cục, giấy phép lái xe")\n` +
        `  --from <s> --to <s>  only this part of the input (times in the output stay in the input's seconds)\n` +
        `  --out <file>         default <input>.transcript.json\n` +
        `env: TRANSCRIBE_ENDPOINT, TRANSCRIBE_MODEL, TRANSCRIBE_API_KEY (optional). Needs ffmpeg.`,
    );
    process.exit(argv.length ? 0 : 1);
  }
  const VALUE = new Set(["--engine", "--model", "--lang", "--from", "--to", "--out", "--prompt"]);
  const prompt = String(argv.includes("--prompt") ? argv[argv.indexOf("--prompt") + 1] ?? "" : "");
  const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  const input = argv.find((a, i) => !a.startsWith("--") && !VALUE.has(argv[i - 1]));
  if (!input || !fs.existsSync(input)) {
    console.error(`[transcribe] ✗ input not found: ${input}`);
    process.exit(1);
  }
  const endpoint = optionalEnv("TRANSCRIBE_ENDPOINT");
  const engine = flag("--engine", endpoint ? "http" : "faster-whisper");
  const model = flag("--model", optionalEnv("TRANSCRIBE_MODEL", "large-v3-turbo"));
  const lang = flag("--lang", "vi");
  const from = Number(flag("--from", "0"));
  const out = flag("--out", input.replace(/\.[^.]+$/, "") + ".transcript.json");
  if (engine === "http" && !endpoint) {
    console.error(`[transcribe] ✗ --engine http needs TRANSCRIBE_ENDPOINT (e.g. http://127.0.0.1:8000) in .env`);
    process.exit(1);
  }

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "cak-asr-"));
  try {
    // 16 kHz mono WAV: what every Whisper-family model resamples to anyway, and ~10x smaller to upload
    const wav = path.join(work, "audio.wav");
    await run("ffmpeg", ["-hide_banner", "-v", "error", "-y", ...(from ? ["-ss", String(from)] : []), "-i", input,
      ...(flag("--to") ? ["-t", String(Number(flag("--to")) - from)] : []), "-vn", "-ac", "1", "-ar", "16000", wav]);
    console.log(`[transcribe] ${engine} · ${model} · ${lang} …`);
    const raw = engine === "http" ? await viaHttp(wav, { endpoint, model, lang, prompt }) : viaFasterWhisper(wav, { model, lang, prompt });
    const t = normalizeTranscription(raw, { offset: from, model });
    const n = t.segments.reduce((a, s) => a + s.words.length, 0);
    if (!n) throw new Error(`no word timings came back — the ${engine} engine/model may not support word timestamps`);
    // did the model skip any speech? (silencedetect on the same WAV; times back in input seconds)
    const sd = await new Promise((resolve) => {
      const p = spawn("ffmpeg", ["-hide_banner", "-nostats", "-i", wav, "-af", "silencedetect=noise=-35dB:d=0.4", "-f", "null", "-"]);
      let e = ""; p.stderr.on("data", (d) => (e += d)); p.on("close", () => resolve(e)); p.on("error", () => resolve(""));
    });
    const wavDur = Number((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav])).trim()) || 0;
    const sil = parseSilences(sd).map((x) => ({ start: x.start + from, end: (Number.isFinite(x.end) ? x.end : wavDur) + from }));
    const speech = [];
    let t0 = from;
    for (const x of sil) { if (x.start > t0) speech.push({ start: t0, end: x.start }); t0 = x.end; }
    if (wavDur && from + wavDur > t0) speech.push({ start: t0, end: from + wavDur });
    const gaps = uncoveredSpeech(speech, t.segments.flatMap((sg) => sg.words));
    if (gaps.length) {
      const total = gaps.reduce((a, g) => a + g.end - g.start, 0);
      console.warn(`[transcribe] ⚠ ${total.toFixed(1)} s of speech has no words: ${gaps.map((g) => `${g.start}–${g.end}s`).join(", ")}` +
        (prompt ? " — --prompt is known to make Whisper skip audio; re-run without it and fix names with the EDL's \"fix\"" : " — listen there, the model may have skipped it"));
      t._uncovered = gaps;
    }
    fs.writeFileSync(out, JSON.stringify(t, null, 2) + "\n", "utf8");
    console.log(`[transcribe] ✓ ${t.segments.length} segments, ${n} words → ${out}`);
    console.log(`[transcribe]   read it before publishing: names and rare words are often misheard`);
  } catch (e) {
    console.error(`[transcribe] ✗ ${e.message}`);
    process.exitCode = 1;
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  await main();
}
