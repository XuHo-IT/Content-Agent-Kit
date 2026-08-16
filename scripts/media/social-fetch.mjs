// social-fetch.mjs — pull one Douyin / TikTok / Bilibili / Kuaishou post.
//   node scripts/media/social-fetch.mjs --url "https://www.douyin.com/video/7…"
//   node scripts/media/social-fetch.mjs --url "…" --analyze          # study it, do not ship it
//   node scripts/media/social-fetch.mjs --url "…" --out clip.mp4 --rights own
//
// Talks to a service YOU run — the kit ships no downloader and vendors nothing:
//   https://github.com/Evil0ctal/Douyin_TikTok_Download_API   (Apache-2.0)
//   docker compose up -d   →   SOCIAL_API_BASE=http://127.0.0.1:80
// Cookies live in that service's own config.yaml, never here.
//
// ⚠️ THE CLIP IS SOMEBODY ELSE'S WORK. Removing a watermark does not remove a copyright.
// `--analyze` is the mode with no legal question attached: it downloads a post so you can
// study its hook, its cut rhythm and its captions, and then you write your own. If you are
// putting the actual footage into something you publish, declare the basis with --rights and
// keep the note — that is what makes the claim auditable later instead of unprovable.
//
// ENV: SOCIAL_API_BASE (required), SOCIAL_WATERMARK, RESEARCH_USER_AGENT
import fs from "node:fs";
import path from "node:path";
import { byId, RIGHTS, RIGHTS_NEEDING_NOTE } from "./lib/sources/social.mjs";
import { download } from "./lib/normalize.mjs";
import { optionalEnv } from "../lib/env.mjs";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log(
    `social-fetch.mjs — fetch one social post through a self-hosted download API\n` +
      `  --url "<post url>"   Douyin / TikTok / Bilibili / Kuaishou (share links work)\n` +
      `  --out <file.mp4>     where to write (default ./social-<id>.mp4)\n` +
      `  --analyze            download for study only — prints the research checklist\n` +
      `  --rights <basis>     ${RIGHTS.join(" | ")}   (needed if you will publish it)\n` +
      `  --rights-note "<t>"  who granted it and when — required for ${RIGHTS_NEEDING_NOTE.join(" / ")}\n` +
      `  --meta-only          print metadata, download nothing\n` +
      `  --json               machine-readable output\n` +
      `env: SOCIAL_API_BASE (required — see the header of this file), SOCIAL_WATERMARK`,
  );
  process.exit(argv.length === 0 ? 1 : 0);
}
const flag = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const has = (n) => argv.includes(n);

try {
  const url = flag("--url");
  if (!url) throw new Error(`Pass --url "<post url>".`);

  const analyze = has("--analyze");
  const rights = flag("--rights");

  // Checked here as well as in validate-script.mjs, because this CLI is a second door into
  // the same act. `--analyze` is exempt: nothing is being published.
  if (!analyze && rights) {
    if (!RIGHTS.includes(rights)) {
      throw new Error(`--rights "${rights}" is not one of: ${RIGHTS.join(" | ")}.`);
    }
    if (RIGHTS_NEEDING_NOTE.includes(rights) && !String(flag("--rights-note") ?? "").trim()) {
      throw new Error(`--rights ${rights} is a claim about someone else's permission — add --rights-note.`);
    }
  }

  const c = await byId(url);

  const meta = {
    url: c.pageUrl,
    author: c.author || "(unknown)",
    title: c.tags || "",
    size: c.width && c.height ? `${c.width}x${c.height}` : "(unknown)",
    duration: c.duration ? `${c.duration}s` : "(unknown)",
    ...(rights ? { rights } : {}),
    ...(flag("--rights-note") ? { rightsNote: flag("--rights-note") } : {}),
  };

  if (has("--meta-only")) {
    console.log(has("--json") ? JSON.stringify(meta, null, 2) : Object.entries(meta).map(([k, v]) => `  ${k.padEnd(10)} ${v}`).join("\n"));
    process.exit(0);
  }

  const out = path.resolve(flag("--out", `social-${Date.now()}.mp4`));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  console.error(`[media] fetching via ${optionalEnv("SOCIAL_API_BASE")}`);
  const bytes = await download(c.fileUrl, out);

  if (has("--json")) {
    console.log(JSON.stringify({ ...meta, file: out, bytes }, null, 2));
  } else {
    for (const [k, v] of Object.entries(meta)) console.log(`  ${k.padEnd(10)} ${v}`);
    console.log(`  ${"file".padEnd(10)} ${out}  (${(bytes / 1024 / 1024).toFixed(2)}MB)`);
  }

  if (analyze) {
    console.log(
      `\n[media] --analyze: this copy is for study, not for shipping.\n` +
        `  Watch the first 3 seconds frame by frame. What is on screen before the first word?\n` +
        `  Where is the first cut? How long does any one shot hold?\n` +
        `  What does the caption do that the audio does not?\n` +
        `  Then write your own, and get the footage from Pexels or shoot it.\n` +
        `  Hook patterns in depth: node scripts/install-skills.mjs fb-hook-extractor`,
    );
  } else if (!rights) {
    // Not fatal — you may be deciding, or archiving your own. But it does not get to be
    // silent, because the moment this file is dropped into a script.json the question is
    // already live and the answer is already harder to reconstruct.
    console.log(
      `\n[media] ⚠ no --rights declared. If this goes into something you publish, the scene\n` +
        `  must carry "rights": ${RIGHTS.join(" | ")} — validate-script.mjs refuses without it.\n` +
        `  Studying it rather than shipping it? Use --analyze.`,
    );
  }

  console.log(`SOCIAL=${out}`);
} catch (e) {
  console.error(`[media] ✗ ${e.message}`);
  process.exit(1);
}
