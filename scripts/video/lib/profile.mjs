// profile.mjs — load a render profile and settle precedence between the four places a
// setting can come from.
//
// A profile holds the answers you would otherwise retype into every script.json: which
// backend renders, which voice reads, which palette, how much you are willing to spend.
//
// Precedence, narrowest wins:
//
//     script.json  >  --flags  >  profile  >  .env  >  built-in default
//
// A profile never overrides something the script states explicitly. The script is about one
// video and knows more than a profile covering all of them — the alternative, a profile
// silently repainting a video whose script asked for a specific theme, is the kind of
// surprise that makes people stop using profiles.
//
// ENV: VIDEO_PROFILE (a name in profiles/, or a path to a .json).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const PROFILES_DIR = path.join(KIT, "profiles");

/** Profile names that ship with the kit. */
export function listProfiles() {
  if (!fs.existsSync(PROFILES_DIR)) return [];
  return fs
    .readdirSync(PROFILES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

/**
 * @param {string|null} nameOrPath  profile name, a path to a .json, or null for none
 * @returns {object|null}
 */
export function loadProfile(nameOrPath) {
  const raw = nameOrPath ?? process.env.VIDEO_PROFILE ?? null;
  if (!raw) return null;

  const file = raw.endsWith(".json") ? path.resolve(raw) : path.join(PROFILES_DIR, `${raw}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Profile not found: ${raw}. Available: ${listProfiles().join(", ") || "(none)"}`);
  }
  const profile = JSON.parse(fs.readFileSync(file, "utf8"));
  profile._file = file;
  return profile;
}

/** `undefined` and `null` do not count as an answer; `0`, `""` and `false` do. */
const answered = (v) => v !== undefined && v !== null;

/**
 * First answer wins, in the order given. Written out rather than inlined at each call site
 * so the precedence rule lives in exactly one place and can be tested.
 */
export const pick = (...candidates) => candidates.find(answered);

/**
 * Everything render.mjs needs from the profile layer, already resolved.
 *
 * @param {object}  o
 * @param {object}  o.script    the parsed script.json
 * @param {object=} o.profile   from loadProfile()
 * @param {object=} o.flags     values parsed off argv (undefined when the flag is absent)
 * @param {object=} o.env       defaults to process.env
 */
export function resolveSettings({ script = {}, profile = null, flags = {}, env = process.env } = {}) {
  const p = profile ?? {};
  return {
    profileName: p.name ?? null,
    backend: pick(script.backend, flags.backend, p.backend, env.VIDEO_BACKEND, "html"),
    aspect: pick(script.aspect, flags.aspect, p.aspect, "9:16"),
    theme: pick(script.theme, flags.theme, p.theme, null),
    brand: { ...(p.brand ?? {}), ...(script.brand ?? {}) },
    voice: {
      // Each field falls through independently: a script that names a voiceId but no
      // provider should keep the profile's provider, not lose it.
      provider: pick(script.voice?.provider, p.voice?.provider, env.TTS_PROVIDER),
      voiceId: pick(script.voice?.voiceId, p.voice?.voiceId, env.TTS_VOICE_ID),
      speed: pick(script.voice?.speed, p.voice?.speed, env.TTS_SPEED ? Number(env.TTS_SPEED) : undefined),
    },
    // 0 is a real ceiling — "refuse anything billable" — so it must not be treated as
    // unset. `?? null` is load-bearing: pick() returns undefined when nothing answered,
    // and callers distinguish "no ceiling set" (null) from "not a number" by identity.
    // Without it the api backend's "this would bill $X and no ceiling is set" guard never
    // fired, because it compared against null and got undefined.
    costCeilingUsd:
      pick(
        flags.costCeilingUsd,
        p.costCeilingUsd,
        env.VIDEO_COST_CEILING_USD ? Number(env.VIDEO_COST_CEILING_USD) : undefined,
      ) ?? null,
  };
}
