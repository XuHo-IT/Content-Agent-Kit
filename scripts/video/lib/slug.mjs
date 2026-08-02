// slug.mjs — Vietnamese-safe slug for output directory names.
// Strips diacritics (đ→d), ASCII-only, ≤40 chars, never ends mid-word.
export function toSlug(input) {
  if (!input || !input.trim()) return "untitled";

  const noDiacritics = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

  let slug = noDiacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length > 40) {
    slug = slug.slice(0, 40).replace(/-+[^-]*$/, "");
    if (!slug) slug = noDiacritics.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    slug = slug.replace(/^-+|-+$/g, "");
  }

  return slug || "untitled";
}

/** `YYYYMMDD-HHmm` in local time — the suffix for output/<slug>-<stamp>/. */
export function timestamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `-${p(d.getHours())}${p(d.getMinutes())}`
  );
}
