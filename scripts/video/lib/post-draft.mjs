// post-draft.mjs — the brief an agent writes a short's post captions from.
//
// Not captions: a script cannot write a good caption, and a caption pasted from a transcript
// reads like one. This hands the writer what it needs in one file — what was actually SAID
// (after the cut, so nothing cut from the video sneaks into the post), the title, the credit
// a licence requires, and each platform's real limit — and leaves the writing to the agent
// (skills/video-and-post §3, WRITING_CRAFT.md). Pure; tests in tests/cover.test.mjs.

/** Words [{w, start, end}] → sentences: closed at . ? ! … or a pause over `gap` seconds. */
export function sentencesOf(words, { gap = 0.6 } = {}) {
  const out = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(w.w);
    const next = words[i + 1];
    if (/[.!?…]$/.test(w.w) || !next || next.start - w.end > gap) {
      out.push(cur.join(" ").replace(/\s+([,.!?…])/g, "$1"));
      cur = [];
    }
  });
  return out.filter(Boolean);
}

/** The platform limits the brief states, so they are written down in one place. */
export const POST_LIMITS = {
  title: 60, // cover title — the grid cuts the rest
  facebookFold: 125, // characters Facebook shows before "Xem thêm"
  tiktokSweet: 150, // a TikTok caption that is read whole; the hard limit is 2200
  tiktokMax: 2200,
  youtubeTitle: 100,
};

export function postDraft({ title, words, duration, credit = null }) {
  const sents = sentencesOf(words);
  const n = [...String(title ?? "")].length;
  return [
    "# Bản nháp đăng bài — viết lại, đừng đăng nguyên văn",
    "",
    "> Đây là **chất liệu**, không phải caption. Viết caption bằng lời của kênh (WRITING_CRAFT.md),",
    "> chỉ dùng số liệu và tên **có trong lời nói** bên dưới. Xong thì xoá file này.",
    "",
    `**Tiêu đề / ảnh bìa:** ${title ?? "(chưa có)"} — ${n}/${POST_LIMITS.title} ký tự`,
    "",
    `## Lời nói trong video (sau khi cắt, ${Math.round(duration)} giây)`,
    "",
    ...sents.map((s) => `- ${s}`),
    "",
    "## Viết từ phần trên",
    "",
    "| Nơi | Giới hạn | Ghi chú |",
    "| --- | --- | --- |",
    `| Facebook | ${POST_LIMITS.facebookFold} ký tự đầu hiện trước "Xem thêm" | câu đầu phải tự đứng được — đó là tất cả những gì người lướt thấy |`,
    `| TikTok | ≤ ${POST_LIMITS.tiktokSweet} ký tự là đọc hết (tối đa ${POST_LIMITS.tiktokMax}) | một câu + 3–5 hashtag; đừng nhắc lại tiêu đề trên ảnh bìa |`,
    `| YouTube Shorts | tiêu đề ≤ ${POST_LIMITS.youtubeTitle} ký tự | tiêu đề là thứ người ta tìm kiếm — dùng từ họ sẽ gõ |`,
    "",
    `**Câu mở trong video:** "${sents[0] ?? ""}" — caption nên nói điều khác, không chép lại nó.`,
    ...(credit ? ["", `**Ghi nguồn bắt buộc** (giấy phép của footage): ${credit} — để trong caption hoặc bình luận đầu tiên.`] : []),
    "",
  ].join("\n");
}
