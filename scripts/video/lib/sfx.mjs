// sfx.mjs — pick a sound effect per scene, deterministically.
// Ported from AI-auto-generate-video/src/assets/sfx-selector.ts (MIT — see NOTICE.md).
//
// Three tiers, first hit wins:
//   1. explicit `scene.sfx` in script.json  (handled by the caller; "none" = mute)
//   2. semantic keyword match on voiceText  (cảnh báo→alert, kỷ lục→success, …)
//   3. scene-type default                   (hook→hook, body→callout, outro→outro)
// Within a category the file is chosen by hashing the scene id, so the same
// script always yields the same SFX while different scenes still differ.
import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

/** Walk sfxDir/<category>/*.mp3 → { category: [filename, …] }. Empty if missing. */
export function indexSfxLibrary(sfxDir) {
  const index = {};
  if (!existsSync(sfxDir)) return index;

  for (const cat of readdirSync(sfxDir)) {
    const catDir = join(sfxDir, cat);
    try {
      if (!statSync(catDir).isDirectory()) continue;
      const files = readdirSync(catDir).filter((f) => f.toLowerCase().endsWith(".mp3"));
      if (files.length > 0) index[cat] = files.sort(); // sorted → deterministic
    } catch {
      /* skip unreadable entries */
    }
  }
  return index;
}

/** Scene role → preferred categories, in fallback order. */
export const ROLE_TO_CATEGORY = {
  hook: ["transition", "cinematic"],
  callout: ["alert", "drumroll"],
  outro: ["outro", "success"],
};

/** Semantic rules (Vietnamese + English). Order matters — first match wins. */
export const KEYWORD_RULES = [
  {
    pattern: /(cảnh báo|rủi ro|nguy hiểm|đáng lo|đe dọa|cảnh giác|tiêu cực|lo ngại|warning|danger|alert|risk|threat)/i,
    category: "alert",
  },
  {
    pattern: /(thất bại|sai lầm|sụp đổ|lỗi nghiêm trọng|không đạt|trượt|fail|error|wrong|mistake|crash|broken)/i,
    category: "fail",
  },
  {
    pattern: /(kỷ lục|kỉ lục|vượt xa|xuất sắc|đạt mốc|thành công|tăng mạnh|đột phá|hàng đầu|breakthrough|achievement|success|record|win|outperform)/i,
    category: "success",
  },
  {
    pattern: /(tiết lộ|khám phá|lần đầu|công bố|ra mắt|trình làng|hé lộ|phát hành|reveal|launch|unveil|debut|announce|introduce)/i,
    category: "reveal",
  },
  {
    pattern: /(đếm ngược|tích tắc|đồng hồ|thời hạn|deadline|countdown|tick|hurry)/i,
    category: "countdown",
  },
  {
    pattern: /(hùng vĩ|hoành tráng|vĩ đại|chấn động|khổng lồ|cinematic|epic|massive|huge|colossal)/i,
    category: "cinematic",
  },
  {
    pattern: /(hồi hộp|chờ đợi|sắp tới|và đây|và bây giờ|drumroll|suspense|anticipation)/i,
    category: "drumroll",
  },
];

/** Stable string hash → non-negative int. */
function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickFromCategory(category, sceneId, index) {
  const pool = index[category];
  if (!pool || pool.length === 0) return null;
  return pool[hashCode(sceneId) % pool.length];
}

/**
 * @returns {{relPath:string, source:"semantic"|"role"|"fallback"}|null}
 */
export function pickSfxForScene({ voiceText, role, sceneId, index }) {
  for (const rule of KEYWORD_RULES) {
    if (!rule.pattern.test(voiceText)) continue;
    const file = pickFromCategory(rule.category, sceneId, index);
    if (file) return { relPath: `${rule.category}/${file}`, source: "semantic" };
  }

  for (const cat of ROLE_TO_CATEGORY[role] ?? []) {
    const file = pickFromCategory(cat, sceneId, index);
    if (file) return { relPath: `${cat}/${file}`, source: "role" };
  }

  for (const cat of Object.keys(index)) {
    const file = pickFromCategory(cat, sceneId, index);
    if (file) return { relPath: `${cat}/${file}`, source: "fallback" };
  }

  return null;
}

/** Recommended volume + start offset per category. */
export function defaultPlayback(picked) {
  const cat = picked.relPath.split("/")[0];
  switch (cat) {
    case "transition": return { volume: 0.4, offsetSec: 0.0 };
    case "emphasis":   return { volume: 0.35, offsetSec: 0.2 };
    case "alert":      return { volume: 0.4, offsetSec: 0.1 };
    case "success":    return { volume: 0.35, offsetSec: 0.3 };
    case "fail":       return { volume: 0.35, offsetSec: 0.1 };
    case "reveal":     return { volume: 0.3, offsetSec: 0.2 };
    case "countdown":  return { volume: 0.3, offsetSec: 0.0 };
    case "cinematic":  return { volume: 0.35, offsetSec: 0.0 };
    case "drumroll":   return { volume: 0.4, offsetSec: 0.0 };
    case "outro":      return { volume: 0.35, offsetSec: 0.5 };
    default:           return { volume: 0.35, offsetSec: 0.1 };
  }
}
