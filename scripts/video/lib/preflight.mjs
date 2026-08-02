// preflight.mjs — check the render host BEFORE spending minutes on a render.
// Every failure message says exactly how to fix it (kit convention: no silent
// fallbacks, no cryptic errors).
import fs from "node:fs";
import { commandExists } from "./proc.mjs";
import { ttsConfig, ttsReachable, missingKeys } from "./tts.mjs";
import { templatesDir, sfxDir } from "./paths.mjs";

const INSTALL_FFMPEG =
  "Windows: winget install Gyan.FFmpeg · macOS: brew install ffmpeg · Linux: sudo apt install ffmpeg";

/**
 * @param {object} opts
 * @param {boolean} [opts.checkTts]
 * @param {object}  [opts.ttsOverrides] provider/voiceId/speed from the script's voice block
 * @returns {Promise<{errors:string[], warnings:string[], info:string[]}>}
 */
export async function preflight({ checkTts = true, ttsOverrides = {} } = {}) {
  const errors = [];
  const warnings = [];
  const info = [];

  if (!(await commandExists("ffmpeg"))) errors.push(`ffmpeg not found on PATH. ${INSTALL_FFMPEG}`);
  if (!(await commandExists("ffprobe"))) errors.push(`ffprobe not found on PATH. ${INSTALL_FFMPEG}`);

  const tdir = templatesDir();
  if (!fs.existsSync(tdir)) {
    errors.push(`Templates directory not found: ${tdir}. Set VIDEO_TEMPLATES_DIR or restore video-templates/.`);
  } else {
    const n = fs.readdirSync(tdir).filter((d) => fs.existsSync(`${tdir}/${d}/index.html`)).length;
    if (n === 0) errors.push(`No templates in ${tdir} — each needs an index.html.`);
    else info.push(`templates: ${n} in ${tdir}`);
  }

  if (checkTts) {
    // Only the CONFIGURED provider is checked — picking a cloud provider means you no
    // longer need any local TTS server, which is the whole point of the registry.
    let cfg;
    try {
      cfg = ttsConfig(ttsOverrides);
    } catch (e) {
      errors.push(e.message);
      cfg = null;
    }

    if (cfg) {
      const label = `${cfg.provider}${cfg.voiceId ? ` / ${cfg.voiceId}` : ""}`;
      if (cfg.spec.local) {
        if (!(await ttsReachable(cfg.endpoint))) {
          errors.push(
            `TTS provider "${cfg.provider}" is not reachable at ${cfg.endpoint}. Start the ` +
              `local server, point ${cfg.spec.endpointEnv} at a running one, or switch to a ` +
              `cloud provider that needs only an API key (TTS_PROVIDER=elevenlabs|vbee|fptai). ` +
              `See docs/14-video-generation.md.`,
          );
        } else {
          info.push(`tts: ${label} @ ${cfg.endpoint} (concurrency ${cfg.concurrency})`);
        }
      } else {
        // Key presence only — calling a paid API just to preflight would cost money.
        const missing = missingKeys(cfg.provider);
        if (missing.length) {
          errors.push(
            `TTS provider "${cfg.provider}" needs ${missing.join(", ")} in your .env ` +
              `(see .env.example). This kit is env-only — no hardcoded fallbacks.`,
          );
        } else {
          info.push(`tts: ${label} (cloud, key present — verify with tts-check.mjs)`);
        }
        if (cfg.spec.experimental) {
          warnings.push(
            `TTS provider "${cfg.provider}" is experimental — verify it once with ` +
              `node scripts/video/tts-check.mjs before relying on it.`,
          );
        }
      }
    }
  }

  const sdir = sfxDir();
  if (!fs.existsSync(sdir)) {
    warnings.push(`No SFX library at ${sdir} — rendering without sound effects. ` +
      `Run: node scripts/video/sfx-download.mjs && node scripts/video/sfx-filter.mjs`);
  } else {
    info.push(`sfx: ${sdir}`);
  }

  // hyperframes arrives via `npx -y` at render time; we can't cheaply verify it
  // without a network round-trip, so just flag the requirement.
  info.push("render: npx hyperframes (needs network on first use) + Chrome/Chromium");

  return { errors, warnings, info };
}

/** Print a preflight result the same way the rest of the kit prints things. */
export function reportPreflight({ errors, warnings, info }, tag = "video") {
  for (const i of info) console.log(`[${tag}]   ${i}`);
  for (const w of warnings) console.warn(`[${tag}] ! ${w}`);
  for (const e of errors) console.error(`[${tag}] ✗ ${e}`);
  return errors.length === 0;
}
