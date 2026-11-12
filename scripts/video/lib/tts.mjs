// tts.mjs — text-to-speech provider registry.
//
// Every TTS service this kit talks to falls into one of FOUR response shapes:
//
//   "bytes"      POST -> the response body IS the audio            (omnivoice, elevenlabs, azure)
//   "jsonBase64" POST -> JSON holding the audio as base64          (google)
//   "asyncUrl"   POST -> JSON holding a URL you download after     (fptai, viettel)
//   "asyncJob"   POST -> a job id you poll until it yields a URL   (vbee)
//
// So a provider is just DATA: which shape, which env vars, how to build the request.
// Four shared executors do the work, which means adding a provider is one table entry.
//
// ENV: TTS_PROVIDER (default omnivoice), TTS_VOICE_ID, TTS_SPEED, TTS_CONCURRENCY
//      + the per-provider keys listed in `PROVIDER_SPECS` below.
import { writeFile } from "node:fs/promises";
import { optionalEnv, requireEnv } from "../../lib/env.mjs";
import { recordSpend } from "../../lib/spend.mjs";

// eleven_multilingual_v2 was the default here, and it does not cover Vietnamese (29 languages,
// Vietnamese not among them) — a Vietnamese script came back in an anglicised accent or
// failed. eleven_flash_v2_5 covers Vietnamese, accepts the `speed` voice setting this file
// sends, and is the cheaper, faster tier. eleven_v3 (70+ languages) is the higher-quality
// option — set ELEVENLABS_MODEL=eleven_v3 and check one scene with tts-check first.
export const ELEVEN_DEFAULT_MODEL = "eleven_flash_v2_5";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RETRY_DELAYS = [1000, 2000, 4000];
/** How long to wait for an async provider to finish writing its file.
 *  FPT.AI documents "5 seconds to 2 minutes" — this ladder sums to ~2 minutes. */
const POLL_DELAYS = [3000, 5000, 8000, 12000, 20000, 30000, 40000];

/** Escape text for an SSML body — a stray "&" or "<" in a caption would break the XML. */
export const xmlEscape = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** "vi-VN-HoaiMyNeural" → "vi-VN"; the locale is the first two parts of every Azure/Google voice name. */
export const localeOf = (voice, fallback = "vi-VN") => {
  const m = String(voice || "").match(/^([a-z]{2,3}-[A-Z]{2})-/);
  return m ? m[1] : fallback;
};

/** Clamp the schema's 0.5–2.0 speed onto a provider's own scale. */
const toFptSpeed = (s) => Math.max(-3, Math.min(3, Math.round((s - 1) * 3)));

// ── the registry ────────────────────────────────────────────────────────────
export const PROVIDER_SPECS = {
  omnivoice: {
    shape: "bytes",
    local: true,
    needsVoiceId: false,
    keys: [],
    nativeSpeed: false, // handled with ffmpeg atempo downstream
    endpointEnv: "OMNIVOICE_ENDPOINT",
    defaultEndpoint: "http://127.0.0.1:8123",
    note: "Local server, no API key. Must accept POST /tts {text} -> audio/mpeg.",
    build(text, cfg) {
      return {
        url: `${cfg.endpoint}/tts`,
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text }),
      };
    },
  },

  // Any server speaking OpenAI's speech API: POST /v1/audio/speech -> audio bytes. One adapter
  // covers a whole class of LOCAL engines (speech.cpp, LocalAI, Kokoro-FastAPI, speaches…) and
  // hosted ones, so a new local Vietnamese voice is a config change, not a code change. Before
  // this, OmniVoice — behind a custom POST /tts — was the only local option.
  "openai-speech": {
    shape: "bytes",
    local: true,
    needsVoiceId: false,
    keys: [], // OPENAI_SPEECH_API_KEY is optional — a local server usually needs none
    nativeSpeed: true,
    endpointEnv: "OPENAI_SPEECH_ENDPOINT",
    defaultEndpoint: "http://127.0.0.1:8880",
    note: "Any OpenAI-compatible server: POST {endpoint}/v1/audio/speech {model, input, voice}. Model via OPENAI_SPEECH_MODEL.",
    build(text, cfg) {
      const key = optionalEnv("OPENAI_SPEECH_API_KEY");
      return {
        url: `${cfg.endpoint}/v1/audio/speech`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
          ...(key ? { Authorization: `Bearer ${key}` } : {}),
        },
        body: JSON.stringify({
          model: optionalEnv("OPENAI_SPEECH_MODEL", "tts-1"),
          input: text,
          voice: cfg.voiceId || optionalEnv("OPENAI_SPEECH_VOICE", "default"),
          response_format: "mp3",
          speed: cfg.speed,
        }),
      };
    },
  },

  elevenlabs: {
    shape: "bytes",
    needsVoiceId: true,
    keys: ["ELEVENLABS_API_KEY"],
    nativeSpeed: true,
    note: "Highest quality. Default model eleven_flash_v2_5 (eleven_v3 for top quality) — eleven_multilingual_v2 does not speak Vietnamese.",
    voicesUrl: "https://api.elevenlabs.io/v1/voices",
    voicesHeaders: () => ({ "xi-api-key": requireEnv("ELEVENLABS_API_KEY") }),
    build(text, cfg) {
      const model = optionalEnv("ELEVENLABS_MODEL", ELEVEN_DEFAULT_MODEL);
      return {
        url: `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(cfg.voiceId)}`,
        method: "POST",
        headers: {
          "xi-api-key": requireEnv("ELEVENLABS_API_KEY"),
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: cfg.speed },
        }),
        model,
      };
    },
  },

  vbee: {
    // Vbee's sync ("realtime") mode is a paid add-on — accounts without it get
    // 400 "This feature is not supported in user package". The async job flow works
    // on every package, so that's what this adapter uses:
    //   POST /v1/tts {mode:"async", webhookUrl}     -> 201 {requestId, status:"PROCESSING"}
    //   GET  /v1/tts/requests/<requestId>           -> {status:"COMPLETED", audioLink}
    //   GET  <audioLink>                            -> mp3 bytes
    // webhookUrl is required by the API but unused here — we poll instead, so a
    // local render needs no publicly reachable URL.
    shape: "asyncJob",
    needsVoiceId: true,
    keys: ["VBEE_TOKEN", "VBEE_APP_ID"],
    nativeSpeed: true,
    // Hard API cap. Scenes written to the kit's 25–40 word rule land around 150–250
    // characters, but one long scene would 400 — so it's enforced before the request.
    maxChars: 300,
    note: "Vietnamese specialist. Async job + polling (works on every package). Max 300 chars/request, speed 0.25–1.9.",
    build(text, cfg) {
      return {
        url: optionalEnv("VBEE_ENDPOINT", "https://api.vbee.vn/v1/tts"),
        method: "POST",
        headers: {
          Authorization: `Bearer ${requireEnv("VBEE_TOKEN")}`,
          "App-Id": requireEnv("VBEE_APP_ID"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          mode: "async",
          // Required by the API even though we poll for the result instead.
          webhookUrl: optionalEnv("VBEE_WEBHOOK_URL", "https://example.com/unused"),
          voiceCode: cfg.voiceId,
          outputFormat: "mp3",
          bitrate: Number(optionalEnv("VBEE_BITRATE", "128")),
          speed: Math.max(0.25, Math.min(1.9, cfg.speed)),
        }),
      };
    },
    pickJobId: (json) => json?.requestId,
    jobStatus(jobId) {
      const base = optionalEnv("VBEE_ENDPOINT", "https://api.vbee.vn/v1/tts");
      return {
        url: `${base}/requests/${jobId}`,
        headers: {
          Authorization: `Bearer ${requireEnv("VBEE_TOKEN")}`,
          "App-Id": requireEnv("VBEE_APP_ID"),
        },
      };
    },
    // null = still working, string = done, throw = failed for good
    pickJobResult(json) {
      const status = String(json?.status ?? "").toUpperCase();
      if (status === "COMPLETED" || status === "SUCCESS") return json.audioLink ?? json.audio_link;
      if (status === "FAILED" || status === "ERROR") {
        throw Object.assign(new Error(`Vbee job failed: ${JSON.stringify(json).slice(0, 200)}`), {
          fatal: true,
        });
      }
      return null;
    },
  },

  fptai: {
    shape: "asyncUrl",
    needsVoiceId: true,
    keys: ["FPTAI_API_KEY"],
    nativeSpeed: true,
    knownVoices: ["banmai", "lannhi", "leminh", "myan", "thuminh", "giahuy", "linhsan"],
    note: "Params go in HEADERS and the body is RAW TEXT (3–5000 chars), not JSON.",
    build(text, cfg) {
      return {
        url: optionalEnv("FPTAI_ENDPOINT", "https://api.fpt.ai/hmi/tts/v5"),
        method: "POST",
        headers: {
          api_key: requireEnv("FPTAI_API_KEY"),
          voice: cfg.voiceId,
          speed: String(toFptSpeed(cfg.speed)),
          format: "mp3",
          "Cache-Control": "no-cache",
          "Content-Type": "text/plain; charset=utf-8",
        },
        body: text,
      };
    },
    // { error: 0, async: "https://s3.../file.mp3", request_id, message }
    pickUrl(json) {
      if (json?.error !== 0 && json?.error !== undefined && json?.error !== "0") {
        throw Object.assign(new Error(`FPT.AI error ${json.error}: ${json.message ?? ""}`), {
          fatal: true,
        });
      }
      return json?.async;
    },
  },

  viettel: {
    shape: "asyncUrl",
    experimental: true,
    needsVoiceId: true,
    keys: ["VIETTEL_TOKEN"],
    nativeSpeed: true,
    note:
      "EXPERIMENTAL — Viettel's public docs are thin, so these field names are a best guess. " +
      "If it fails, use TTS_PROVIDER=http to describe the real contract via env (no code change).",
    build(text, cfg) {
      return {
        url: optionalEnv("VIETTEL_ENDPOINT", "https://viettelai.vn/tts/speech_synthesis"),
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          text,
          voice: cfg.voiceId,
          speed: cfg.speed,
          token: requireEnv("VIETTEL_TOKEN"),
          tts_return_option: 3,
          without_filter: false,
        }),
      };
    },
    pickUrl(json) {
      return json?.async ?? json?.url ?? json?.data?.url ?? json?.result?.url;
    },
  },

  // Google Cloud Text-to-Speech. Vietnamese voices (vi-VN Standard/WaveNet/Neural2/Chirp 3 HD)
  // and 50+ other languages, so the same script can be voiced for an international channel.
  // Free monthly tier, then billed per character (WaveNet ≈ $4 / 1M, Chirp 3 HD ≈ $30 / 1M at
  // the time of writing — check cloud.google.com/text-to-speech/pricing). An API key restricted
  // to the Text-to-Speech API is enough; no service account needed.
  google: {
    shape: "jsonBase64",
    needsVoiceId: false,
    keys: ["GOOGLE_TTS_API_KEY"],
    nativeSpeed: true,
    maxChars: 5000,
    defaultVoice: "vi-VN-Neural2-A",
    note:
      "Google Cloud TTS. TTS_VOICE_ID like vi-VN-Neural2-A, vi-VN-Wavenet-B, en-US-Chirp3-HD-Charon — " +
      "the language is read from the voice name. List: node scripts/video/tts-check.mjs --voices",
    voicesUrl: () =>
      `https://texttospeech.googleapis.com/v1/voices?key=${requireEnv("GOOGLE_TTS_API_KEY")}` +
      (optionalEnv("GOOGLE_TTS_LANGUAGE") ? `&languageCode=${optionalEnv("GOOGLE_TTS_LANGUAGE")}` : ""),
    voicesHeaders: () => ({}),
    mapVoice: (v) => ({ id: v.name, name: v.name, labels: [v.ssmlGender, ...(v.languageCodes ?? [])].join(", ") }),
    build(text, cfg) {
      const name = cfg.voiceId || optionalEnv("GOOGLE_TTS_VOICE", "vi-VN-Neural2-A");
      return {
        url: `https://texttospeech.googleapis.com/v1/text:synthesize?key=${requireEnv("GOOGLE_TTS_API_KEY")}`,
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: localeOf(name), name },
          audioConfig: { audioEncoding: "MP3", speakingRate: cfg.speed },
        }),
      };
    },
    // { audioContent: "<base64 mp3>" }
    pickBase64: (json) => json?.audioContent,
  },

  // Azure AI Speech. vi-VN-HoaiMyNeural (female) and vi-VN-NamMinhNeural (male), plus 140+
  // languages. Free tier (F0), then billed per character. Body is SSML, so the text is escaped.
  azure: {
    shape: "bytes",
    needsVoiceId: false,
    keys: ["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"],
    nativeSpeed: true,
    knownVoices: ["vi-VN-HoaiMyNeural", "vi-VN-NamMinhNeural"],
    note:
      "Azure AI Speech. TTS_VOICE_ID like vi-VN-HoaiMyNeural, en-US-AvaMultilingualNeural, ja-JP-NanamiNeural. " +
      "AZURE_SPEECH_REGION is the resource's region, e.g. southeastasia.",
    build(text, cfg) {
      const voice = cfg.voiceId || optionalEnv("AZURE_SPEECH_VOICE", "vi-VN-HoaiMyNeural");
      const rate = `${cfg.speed >= 1 ? "+" : ""}${Math.round((cfg.speed - 1) * 100)}%`;
      const ssml =
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${localeOf(voice)}">` +
        `<voice name="${xmlEscape(voice)}"><prosody rate="${rate}">${xmlEscape(text)}</prosody></voice></speak>`;
      return {
        url: `https://${requireEnv("AZURE_SPEECH_REGION")}.tts.speech.microsoft.com/cognitiveservices/v1`,
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": requireEnv("AZURE_SPEECH_KEY"),
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
          "User-Agent": "content-agent-kit",
        },
        body: ssml,
      };
    },
  },

  // Fully env-driven escape hatch. Covers any provider without a built-in adapter —
  // e.g. Vivibe, which ships no public API (/api, /docs, /developer all 404), so if you
  // obtain private access you can wire it here rather than patching this file.
  http: {
    shape: null, // from TTS_HTTP_SHAPE
    needsVoiceId: false,
    keys: [],
    nativeSpeed: true,
    note: "Generic adapter — describe any HTTP TTS API entirely through env vars.",
    build(text, cfg) {
      const url = requireEnv("TTS_HTTP_URL");
      const method = optionalEnv("TTS_HTTP_METHOD", "POST");
      const headers = interpolateJson(optionalEnv("TTS_HTTP_HEADERS", "{}"), text, cfg, true);
      const rawBody = optionalEnv("TTS_HTTP_BODY");
      const body = rawBody ? interpolate(rawBody, text, cfg) : JSON.stringify({ text });
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
      return { url, method, headers, body };
    },
    pickUrl(json) {
      const path = optionalEnv("TTS_HTTP_AUDIO_FIELD", "url");
      return path.split(".").reduce((o, k) => (o == null ? o : o[k]), json);
    },
  },
};

export const PROVIDERS = Object.keys(PROVIDER_SPECS);

// ── env interpolation for the generic adapter ───────────────────────────────
/** Replace ${text} / ${voiceId} / ${speed} / ${ANY_ENV_VAR} inside a template string.
 *  ${text} is JSON-escaped so Vietnamese diacritics and quotes can't break the JSON. */
function interpolate(tpl, text, cfg) {
  return tpl.replace(/\$\{(\w+)\}/g, (_, key) => {
    if (key === "text") return JSON.stringify(text).slice(1, -1);
    if (key === "voiceId") return cfg.voiceId ?? "";
    if (key === "speed") return String(cfg.speed);
    return optionalEnv(key, "");
  });
}

function interpolateJson(tpl, text, cfg, isHeaders = false) {
  const filled = interpolate(tpl, text, cfg);
  try {
    const o = JSON.parse(filled);
    if (isHeaders) for (const k of Object.keys(o)) o[k] = String(o[k]);
    return o;
  } catch (e) {
    throw new Error(
      `Could not parse the env template as JSON: ${e.message}\n  after interpolation: ${filled}`,
    );
  }
}

// ── config ──────────────────────────────────────────────────────────────────
export function ttsConfig(overrides = {}) {
  const provider = (overrides.provider ?? optionalEnv("TTS_PROVIDER", "omnivoice")).toLowerCase();
  const spec = PROVIDER_SPECS[provider];
  if (!spec) {
    throw new Error(
      `Unknown TTS_PROVIDER "${provider}". Known: ${PROVIDERS.join(" | ")}. ` +
        `For a provider without a built-in adapter, use TTS_PROVIDER=http (see docs/14).`,
    );
  }

  const voiceId = overrides.voiceId ?? optionalEnv("TTS_VOICE_ID");
  if (spec.needsVoiceId && !voiceId) {
    const hint = spec.knownVoices ? ` Known voices: ${spec.knownVoices.join(", ")}.` : "";
    throw new Error(
      `Provider "${provider}" needs a voice id. Set TTS_VOICE_ID, or put ` +
        `"voiceId" in the script's voice block.${hint}`,
    );
  }

  const speed = Number(overrides.speed ?? optionalEnv("TTS_SPEED", "1.0"));
  if (Number.isNaN(speed) || speed < 0.5 || speed > 2.0) {
    throw new Error(`TTS speed must be a number in 0.5–2.0, got "${speed}"`);
  }

  const concurrency = parseInt(optionalEnv("TTS_CONCURRENCY", "1"), 10);
  if (Number.isNaN(concurrency) || concurrency < 1) {
    throw new Error(`TTS_CONCURRENCY must be a positive integer`);
  }

  const shape = spec.shape ?? optionalEnv("TTS_HTTP_SHAPE", "bytes");
  if (!["bytes", "asyncUrl", "asyncJob", "jsonBase64"].includes(shape)) {
    throw new Error(`TTS_HTTP_SHAPE must be "bytes" or "asyncUrl", got "${shape}"`);
  }

  const endpoint = spec.endpointEnv
    ? (optionalEnv(spec.endpointEnv, spec.defaultEndpoint) || "").replace(/\/+$/, "")
    : null;

  return {
    provider,
    spec,
    shape,
    voiceId: voiceId ?? null,
    speed,
    concurrency,
    endpoint,
    model: provider === "elevenlabs" ? optionalEnv("ELEVENLABS_MODEL", ELEVEN_DEFAULT_MODEL) : null,
    /** Speed the provider itself applies. If false, the pipeline does it with ffmpeg. */
    nativeSpeed: !!spec.nativeSpeed,
  };
}

/** Which env vars a provider needs but doesn't have. Used by preflight (no network). */
export function missingKeys(provider) {
  const spec = PROVIDER_SPECS[provider];
  if (!spec) return [];
  const missing = spec.keys.filter((k) => !optionalEnv(k));
  if (provider === "http" && !optionalEnv("TTS_HTTP_URL")) missing.push("TTS_HTTP_URL");
  return missing;
}

/** One-line summary — for `--help`-style output and offline registry checks. */
export function describeProvider(provider) {
  const s = PROVIDER_SPECS[provider];
  if (!s) return null;
  return {
    shape: s.shape ?? "(from TTS_HTTP_SHAPE)",
    local: !!s.local,
    experimental: !!s.experimental,
    needsVoiceId: !!s.needsVoiceId,
    keys: s.keys,
    nativeSpeed: !!s.nativeSpeed,
    knownVoices: s.knownVoices ?? null,
    note: s.note,
  };
}

// ── the two executors ───────────────────────────────────────────────────────
async function request(cfg, text) {
  // Fail on the provider's own limit before spending the round-trip, and say what to do.
  const cap = cfg.spec.maxChars;
  if (cap && text.length > cap) {
    throw Object.assign(
      new Error(
        `${cfg.provider} accepts at most ${cap} characters per request, got ${text.length}. ` +
          `Split this scene in two — the craft rule is 25–40 words per scene anyway ` +
          `(see templates/VIDEO_CRAFT.template.md §3).`,
      ),
      { fatal: true },
    );
  }
  const req = cfg.spec.build(text, cfg);
  const res = await fetch(req.url, {
    method: req.method ?? "POST",
    headers: req.headers,
    body: req.body,
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const err = new Error(
      `${cfg.provider} TTS failed (status ${res.status})` +
        (res.status === 401 || res.status === 403 ? ` — check the API key` : ""),
    );
    // 4xx other than 429 is a bad request; retrying just repeats it.
    err.fatal = res.status < 500 && res.status !== 429;
    throw err;
  }
  return res;
}

/** Shape A — the response body is the audio. */
async function runBytes(cfg, text, outPath) {
  const res = await request(cfg, text);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error(`${cfg.provider} returned 0 bytes`);
  // A provider that answers 200 + JSON here is misconfigured (usually the wrong shape).
  if (buf.subarray(0, 1).toString() === "{") {
    throw Object.assign(
      new Error(
        `${cfg.provider} returned JSON, not audio: ${buf.subarray(0, 200).toString()}\n` +
          `  This provider is probably shape "asyncUrl" — check TTS_HTTP_SHAPE.`,
      ),
      { fatal: true },
    );
  }
  await writeFile(outPath, buf);
}

/** Shape D — the response is JSON with the audio inside it as base64. */
async function runJsonBase64(cfg, text, outPath) {
  const res = await request(cfg, text);
  const json = await res.json();
  const b64 = cfg.spec.pickBase64(json);
  if (!b64) {
    throw Object.assign(new Error(`${cfg.provider}: no audio in the response: ${JSON.stringify(json).slice(0, 300)}`), {
      fatal: true,
    });
  }
  const buf = Buffer.from(b64, "base64");
  if (buf.length === 0) throw new Error(`${cfg.provider} returned empty audio`);
  await writeFile(outPath, buf);
}

/** Download a URL, retrying while it is still being written. */
async function downloadWhenReady(cfg, url, outPath) {
  for (let i = 0; i <= POLL_DELAYS.length; i++) {
    const dl = await fetch(url, { signal: AbortSignal.timeout(60000) }).catch(() => null);
    if (dl?.ok) {
      const buf = Buffer.from(await dl.arrayBuffer());
      if (buf.length > 0) {
        await writeFile(outPath, buf);
        return;
      }
    }
    if (i < POLL_DELAYS.length) await sleep(POLL_DELAYS[i]);
  }
  throw new Error(`${cfg.provider}: audio at ${url} never became available (waited ~2 minutes).`);
}

/** Shape B — the response holds a URL that becomes downloadable a bit later. */
async function runAsyncUrl(cfg, text, outPath) {
  const res = await request(cfg, text);
  const json = await res.json();
  const url = cfg.spec.pickUrl(json);
  if (!url) {
    throw Object.assign(
      new Error(
        `${cfg.provider}: no audio URL in the response: ${JSON.stringify(json).slice(0, 300)}`,
      ),
      { fatal: true },
    );
  }
  await downloadWhenReady(cfg, url, outPath);
}

/** Shape C — the response is a job id; poll it until it yields a URL, then download. */
async function runAsyncJob(cfg, text, outPath) {
  const res = await request(cfg, text);
  const json = await res.json();
  const jobId = cfg.spec.pickJobId(json);
  if (!jobId) {
    throw Object.assign(
      new Error(`${cfg.provider}: no job id in the response: ${JSON.stringify(json).slice(0, 300)}`),
      { fatal: true },
    );
  }

  const { url, headers } = cfg.spec.jobStatus(jobId);
  for (let i = 0; i <= POLL_DELAYS.length; i++) {
    // Short jobs are usually done on the first check; give it a beat first.
    await sleep(i === 0 ? 1500 : POLL_DELAYS[i - 1]);
    const s = await fetch(url, { headers, signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (!s?.ok) continue;
    const audioUrl = cfg.spec.pickJobResult(await s.json()); // throws if the job failed
    if (audioUrl) {
      await downloadWhenReady(cfg, audioUrl, outPath);
      return;
    }
  }
  throw new Error(`${cfg.provider}: job ${jobId} did not finish (waited ~2 minutes).`);
}

// ── client ──────────────────────────────────────────────────────────────────
class TtsClient {
  constructor(cfg) {
    this.cfg = cfg;
  }

  async generate(text, outPath) {
    const run =
      { bytes: runBytes, asyncUrl: runAsyncUrl, asyncJob: runAsyncJob, jsonBase64: runJsonBase64 }[this.cfg.shape] ?? runBytes;
    let lastErr;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await run(this.cfg, text, outPath);
        // Cloud voices bill per character on your plan; the kit cannot price that exactly,
        // so it counts what was sent (usd null) for the monthly report.
        if (!this.cfg.spec.local) recordSpend({ provider: this.cfg.provider, kind: "tts", units: [...text].length, unit: "chars" });
        return;
      } catch (e) {
        if (e?.fatal) throw e;
        lastErr = e;
        if (attempt < RETRY_DELAYS.length) await sleep(RETRY_DELAYS[attempt]);
      }
    }
    const where = this.cfg.endpoint ? ` at ${this.cfg.endpoint}` : "";
    throw new Error(
      `${this.cfg.provider} TTS failed after 4 attempts${where} — ${lastErr?.message ?? lastErr}` +
        (this.cfg.spec.local ? `. Is the local TTS server running?` : ""),
    );
  }
}

export function createTtsClient(cfg = ttsConfig()) {
  return new TtsClient(cfg);
}

/** Cheap liveness probe for a LOCAL provider. Cloud providers are checked by key presence. */
export async function ttsReachable(endpoint, timeoutMs = 3000) {
  try {
    await fetch(endpoint, { signal: AbortSignal.timeout(timeoutMs) });
    return true; // any HTTP answer means something is listening
  } catch {
    return false;
  }
}

/** List a provider's voices, where it exposes an endpoint for that. */
export async function listVoices(cfg) {
  if (!cfg.spec.voicesUrl) {
    return cfg.spec.knownVoices
      ? cfg.spec.knownVoices.map((name) => ({ id: name, name }))
      : null;
  }
  const voicesUrl = typeof cfg.spec.voicesUrl === "function" ? cfg.spec.voicesUrl() : cfg.spec.voicesUrl;
  const res = await fetch(voicesUrl, {
    headers: cfg.spec.voicesHeaders(),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Could not list voices (status ${res.status})`);
  const j = await res.json();
  if (cfg.spec.mapVoice) return (j.voices ?? []).map(cfg.spec.mapVoice);
  return (j.voices ?? []).map((v) => ({
    id: v.voice_id,
    name: v.name,
    labels: v.labels ? Object.values(v.labels).join(", ") : "",
  }));
}
