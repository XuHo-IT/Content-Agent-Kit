// music.mjs — find a background bed you are actually allowed to publish.
//
// Openverse (the WordPress Foundation's CC search) aggregates Freesound, Jamendo and others
// behind one API that needs NO KEY — same reason the research sources in scripts/research are
// keyless: a step that needs an account is a step most people never switch on.
//
// LICENSING IS THE POINT OF THIS FILE, not an afterthought:
//
//   · `license_type=commercial,modification` is sent on EVERY request and is not optional.
//     It is the difference between "a track I found" and "a track I may put in a monetised
//     video and edit to length".
//   · CC0 is preferred by default because it carries no attribution obligation at all.
//     CC-BY is allowed but then the attribution string is REQUIRED downstream — the caller
//     gets it in `attribution` and validate/post must carry it.
//   · Everything the licence requires is written into media-lock.json, which docs/15 already
//     calls the credits ledger.
//
// ⚠️ CC0 MEANS "NOT COPYRIGHT-ENCUMBERED". IT DOES NOT MEAN "WILL NOT BE CONTENT-ID CLAIMED".
// Widely-used CC0 audio is regularly registered into YouTube's Content ID by a distributor
// who has no right to it. The claim is disputable — the licence and source URL are in the
// lock file — but it can still happen, and being surprised by it is worse than expecting it.
//
// ENV: MUSIC_API_BASE (default https://api.openverse.org), RESEARCH_USER_AGENT
import { optionalEnv } from "../../lib/env.mjs";

const base = () => optionalEnv("MUSIC_API_BASE", "https://api.openverse.org").replace(/\/+$/, "");

const UA = () =>
  optionalEnv("RESEARCH_USER_AGENT", "content-agent-kit/1.0 (+https://github.com/XuHo-IT/Content-Agent-Kit)");

/** Licences this kit will put in a published video, in order of how little they ask of you. */
export const ALLOWED_LICENCES = ["cc0", "pdm", "by"];
/** The ones that oblige you to credit the author on screen or in the description. */
export const LICENCES_NEEDING_CREDIT = ["by"];

/**
 * Is this track usable as a bed, and for how long?
 *
 * Short clips are fine — the mixer loops them — but under ~15s a loop is audible as a loop,
 * and that is worse than no music.
 */
export function isUsable(track, { minSec = 15 } = {}) {
  if (!track?.url) return false;
  if (!ALLOWED_LICENCES.includes(String(track.license ?? "").toLowerCase())) return false;
  const sec = (track.duration ?? 0) / 1000;
  return sec >= minSec;
}

/** Rank: longer is better (fewer loop seams), and CC0 above CC-BY for the same length. */
export function rank(tracks) {
  const score = (t) => {
    const sec = (t.duration ?? 0) / 1000;
    const free = String(t.license).toLowerCase() === "cc0" || String(t.license).toLowerCase() === "pdm";
    return Math.min(sec, 300) + (free ? 60 : 0);
  };
  return [...tracks].sort((a, b) => score(b) - score(a));
}

/** Everything a published video has to be able to answer about a track. */
export function credit(track) {
  return {
    title: track.title ?? "",
    creator: track.creator ?? "",
    license: `${track.license ?? ""} ${track.license_version ?? ""}`.trim(),
    licenseUrl: track.license_url ?? "",
    source: track.foreign_landing_url ?? track.url ?? "",
    provider: track.provider ?? "",
    // Openverse builds this for us; using theirs avoids a second, subtly different wording.
    attribution: track.attribution ?? "",
    creditRequired: LICENCES_NEEDING_CREDIT.includes(String(track.license ?? "").toLowerCase()),
  };
}

/**
 * Search for a bed. Never returns something you may not publish: the licence filter is in
 * the request, and `isUsable` re-checks what came back.
 */
export async function search(query, { licence = "cc0", perPage = 20, minSec = 15 } = {}) {
  const u = new URL(`${base()}/v1/audio/`);
  u.searchParams.set("q", query);
  // Not optional, and not overridable by the caller — anything else is not publishable here.
  u.searchParams.set("license_type", "commercial,modification");
  if (licence && licence !== "any") u.searchParams.set("license", licence);
  u.searchParams.set("page_size", String(Math.min(perPage, 50)));

  // Anonymous access is rate-limited to 20/min and 200/day, and it answers **401** — not 429
  // — when you exceed the burst. For an API that takes no credentials that reads as "your key
  // is wrong", which sends you looking for a key that does not exist.
  //
  // The burst window is a MINUTE, so a fast retry ladder cannot help: it just spends more of
  // the same budget. One patient retry, then a message with the real numbers in it.
  let last = null;
  for (const waitMs of [0, 8000]) {
    if (waitMs) await new Promise((r) => setTimeout(r, waitMs));
    const r = await fetch(u.href, {
      headers: { "user-agent": UA(), accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
    if (r.ok) {
      const j = await r.json();
      const left = r.headers.get("x-ratelimit-available-anon_burst");
      if (left !== null && Number(left) < 5) {
        console.error(`[music] ! Openverse burst quota down to ${left}/20 this minute — pause before searching again.`);
      }
      return rank((j?.results ?? []).filter((t) => isUsable(t, { minSec })));
    }
    last = r.status;
    if (r.status !== 401 && r.status !== 429) break;
  }
  throw new Error(
    last === 401 || last === 429
      ? `Openverse rate-limited this client (HTTP ${last}). It takes NO API KEY — this is the ` +
        `anonymous quota (20/min, 200/day), not a credential problem. Wait a minute and retry. ` +
        `Already have a track? Use "music": { "file": "…" } and no search happens at all.`
      : `Openverse HTTP ${last} for "${query}"`,
  );
}
