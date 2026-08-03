// clean-text.mjs — reader-visible post text must be PLAIN TEXT.
//
// Facebook, Instagram, TikTok and YouTube captions render no Markdown. Whatever is in
// `post` or `comment` is what a human sees, character for character. So a heading arrives
// as a literal "### Nó làm được gì", **bold** arrives with the asterisks attached, and a
// metadata block the writer meant for the CMS arrives as the first thing anyone reads:
//
//     Meta: Claude Fable 5 đạt điểm cao nhất ở gần như mọi bài kiểm tra…
//     Slug: claude-fable-5-ra-mat-roi-bi-go-sau-ba-ngay
//
// That is not hypothetical — it is what this repo's own reference output shipped with.
// Nothing in the kit ever asked a writer for those two lines; they are a habit models
// carry over from writing blog posts, and no gate existed to catch them.
//
// This is the same class of bug `audit-quality.mjs` already guards against with its
// `id-leak` rule: text meant for the machine reaching the reader.
//
// ENV: none. Pure functions, no I/O — so they are testable and reusable.

/**
 * Metadata labels a writer might leave at the top of a draft.
 *
 * Only matched inside the LEADING BLOCK — the lines before the first blank line. That
 * restriction is the whole reason this does not false-positive: this kit writes about the
 * AI industry, so a sentence like "Meta: hãng vừa công bố mô hình mới" is completely
 * legitimate *in the body*. Metadata, by contrast, is always a run of `Label: value`
 * lines sitting above the article.
 */
const META_LABELS = [
  "meta", "meta description", "metadescription", "seo", "seo description",
  "slug", "url", "permalink", "excerpt", "summary", "description",
  "title", "headline", "tags", "keywords", "category", "author", "date",
  // Vietnamese equivalents — a Vietnamese writer labels them in Vietnamese.
  "mô tả", "mô tả ngắn", "tóm tắt", "đường dẫn", "tiêu đề", "thẻ", "từ khoá",
  "từ khóa", "chuyên mục", "tác giả", "ngày",
];

const META_LINE = new RegExp(`^\\s*(${META_LABELS.map((l) => l.replace(/ /g, "\\s+")).join("|")})\\s*:\\s*\\S`, "iu");

/**
 * Markdown that shows up as punctuation when nothing renders it.
 *
 * `severity: "error"` = the reader definitely sees stray characters.
 * `severity: "warning"` = ambiguous, because the same characters occur in ordinary
 * Vietnamese prose. A leading "- " is a bullet in Markdown and a dialogue dash in a
 * story; failing on it by default would make the gate something people switch off.
 */
const MARKUP_RULES = [
  {
    id: "heading",
    severity: "error",
    // `#` then whitespace. "#AI" (a hashtag, which every caption ends with) has no space
    // after the hash, so it is untouched — that discriminator is the entire rule.
    re: /^[ \t]*#{1,6}[ \t]+\S/gmu,
    hint: "Markdown heading — write it as its own short line, or drop it.",
  },
  {
    id: "code-fence",
    severity: "error",
    re: /^[ \t]*(```|~~~)/gmu,
    hint: "Code fence — no caption renders code blocks.",
  },
  {
    id: "bold",
    severity: "error",
    // Paired on one line, no space just inside the markers, so "2 * 3 * 4" is safe.
    re: /\*\*(?=\S)[^*\n]+(?<=\S)\*\*/gu,
    hint: "**bold** — the asterisks are shown literally. Use plain words.",
  },
  {
    id: "italic",
    severity: "error",
    re: /(?<![*\w])\*(?=\S)[^*\n]+(?<=\S)\*(?![*\w])/gu,
    hint: "*italic* — the asterisks are shown literally.",
  },
  {
    id: "link",
    severity: "error",
    re: /\[[^\]\n]*\]\((?:https?:|\/|#)[^)\n]*\)/gu,
    hint: "[text](url) — captions show both halves. Paste the bare URL instead.",
  },
  {
    id: "inline-code",
    severity: "warning",
    re: /`(?=\S)[^`\n]+(?<=\S)`/gu,
    hint: "`code` — backticks are shown literally.",
  },
  {
    id: "list-marker",
    severity: "warning",
    // Deliberately a warning: "- Chào anh." is dialogue in Vietnamese prose, not a bullet.
    re: /^[ \t]*(?:[-*+][ \t]+|\d+\.[ \t]+)\S/gmu,
    hint: "List marker — fine if you meant a bullet, wrong if it is dialogue.",
  },
  {
    id: "blockquote",
    severity: "warning",
    re: /^[ \t]*>[ \t]+\S/gmu,
    hint: "> blockquote — shown as a stray angle bracket.",
  },
  {
    id: "rule",
    severity: "warning",
    re: /^[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*$/gmu,
    hint: "Horizontal rule — shown as a row of dashes.",
  },
];

const shorten = (s, n = 60) => {
  const one = String(s).replace(/\s+/g, " ").trim();
  return one.length > n ? one.slice(0, n) + "…" : one;
};

/** Index of the line the leading metadata block ends at (exclusive). */
function leadingBlockEnd(lines) {
  const i = lines.findIndex((l) => l.trim() === "");
  return i === -1 ? lines.length : i;
}

/**
 * Find everything a reader would see as leftover markup.
 *
 * @param {string} text
 * @param {string} field  name used in the message, e.g. "post" or "comment"
 * @returns {{errors: string[], warnings: string[]}}
 */
export function findLeaks(text, field = "post") {
  const errors = [];
  const warnings = [];
  if (typeof text !== "string" || text.trim() === "") return { errors, warnings };

  const lines = text.split(/\r?\n/);
  const end = leadingBlockEnd(lines);
  for (let i = 0; i < end; i++) {
    if (META_LINE.test(lines[i])) {
      errors.push(
        `🔴 \`${field}\` line ${i + 1} is a metadata label, not prose: "${shorten(lines[i])}" — ` +
          `move it to its own field (metaDescription, slug, title…), out of the body.`,
      );
    }
  }

  for (const rule of MARKUP_RULES) {
    rule.re.lastIndex = 0;
    const hits = [...new Set([...text.matchAll(rule.re)].map((m) => shorten(m[0], 40)))];
    if (!hits.length) continue;
    const msg =
      `\`${field}\` contains ${rule.id} markup (${hits.length}×): ${hits.slice(0, 3).join(" · ")}` +
      `${hits.length > 3 ? " …" : ""} — ${rule.hint}`;
    (rule.severity === "error" ? errors : warnings).push(`${rule.severity === "error" ? "🔴 " : ""}${msg}`);
  }

  return { errors, warnings };
}

/**
 * Best-effort plain-text version. Used by `validate-post.mjs --fix`, never automatically:
 * silently rewriting someone's copy is worse than refusing to post it, because they would
 * not know which words changed.
 */
export function stripLeaks(text) {
  if (typeof text !== "string") return text;

  const lines = text.split(/\r?\n/);
  const end = leadingBlockEnd(lines);
  let start = 0;
  while (start < end && META_LINE.test(lines[start])) start++;
  // Drop the blank separator too, otherwise the post opens on an empty line.
  if (start > 0 && start < lines.length && lines[start]?.trim() === "") start++;

  return lines
    .slice(start)
    .map((line) =>
      line
        .replace(/^([ \t]*)#{1,6}[ \t]+/u, "$1")
        .replace(/^[ \t]*(?:```|~~~).*$/u, "")
        .replace(/^([ \t]*)>[ \t]+/u, "$1")
        .replace(/^[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*$/u, "")
        .replace(/\*\*(?=\S)([^*\n]+)(?<=\S)\*\*/gu, "$1")
        .replace(/(?<![*\w])\*(?=\S)([^*\n]+)(?<=\S)\*(?![*\w])/gu, "$1")
        .replace(/`(?=\S)([^`\n]+)(?<=\S)`/gu, "$1")
        // [text](url) → "text (url)", so a link the writer meant to share survives.
        .replace(/\[([^\]\n]*)\]\(((?:https?:|\/|#)[^)\n]*)\)/gu, (_m, t, u) => (t.trim() ? `${t} (${u})` : u)),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Reader-visible fields on a post payload, in the order a human meets them. */
export const READER_FIELDS = ["title", "post", "comment"];

/**
 * Validate a whole post payload. Same contract as `video/lib/validate.mjs`:
 * `{errors, warnings, stats}` with plain-string messages.
 */
export function validatePost(payload) {
  const errors = [];
  const warnings = [];

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { errors: ["payload must be a JSON object"], warnings, stats: {} };
  }
  if (!payload.post || !String(payload.post).trim()) {
    errors.push("`post` is empty — there is nothing to publish.");
  }

  for (const field of READER_FIELDS) {
    const found = findLeaks(payload[field], field);
    errors.push(...found.errors);
    warnings.push(...found.warnings);
  }

  const chars = String(payload.post ?? "").length;
  return {
    errors,
    warnings,
    stats: {
      chars,
      words: String(payload.post ?? "").split(/\s+/).filter(Boolean).length,
      fields: READER_FIELDS.filter((f) => payload[f]),
    },
  };
}
