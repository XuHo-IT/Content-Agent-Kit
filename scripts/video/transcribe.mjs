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
// ENV: TRANSCRIBE_ENDPOINT, TRANSCRIBE_MODEL, TRANSCRIBE_API_KEY (all optional). Needs ffmpeg.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { run } from "./lib/proc.mjs";
import { optionalEnv } from "../lib/env.mjs";

/**
 * Any OpenAI-style verbose_json (segments without words + a top-level words[]), or a
 * faster-whisper dump (segments with words), → the kit's transcript. Words are put back into
 * the segment whose span holds their midpoint; `offset` shifts everything (for --from).
 */
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

const FW_PY = `
import json, sys
from faster_whisper import WhisperModel
audio, model, lang = sys.argv[1], sys.argv[2], sys.argv[3]
m = WhisperModel(model, device="auto", compute_type="auto")
segs, info = m.transcribe(audio, language=lang, word_timestamps=True, vad_filter=True)
out = {"segments": [{"start": s.start, "end": s.end, "text": s.text,
        "words": [{"word": w.word, "start": w.start, "end": w.end, "probability": w.probability} for w in (s.words or [])]}
       for s in segs]}
sys.stdout.write(json.dumps(out, ensure_ascii=False))
`;

async function viaHttp(audio, { endpoint, model, lang }) {
  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(audio)], { type: "audio/wav" }), path.basename(audio));
  form.append("model", model);
  form.append("language", lang);
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

function viaFasterWhisper(audio, { model, lang }) {
  const py = process.platform === "win32" ? "python" : "python3";
  const r = spawnSync(py, ["-I", "-c", FW_PY, audio, model, lang], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
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
        `  --from <s> --to <s>  only this part of the input (times in the output stay in the input's seconds)\n` +
        `  --out <file>         default <input>.transcript.json\n` +
        `env: TRANSCRIBE_ENDPOINT, TRANSCRIBE_MODEL, TRANSCRIBE_API_KEY (optional). Needs ffmpeg.`,
    );
    process.exit(argv.length ? 0 : 1);
  }
  const VALUE = new Set(["--engine", "--model", "--lang", "--from", "--to", "--out"]);
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
    const raw = engine === "http" ? await viaHttp(wav, { endpoint, model, lang }) : viaFasterWhisper(wav, { model, lang });
    const t = normalizeTranscription(raw, { offset: from, model });
    const n = t.segments.reduce((a, s) => a + s.words.length, 0);
    if (!n) throw new Error(`no word timings came back — the ${engine} engine/model may not support word timestamps`);
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
