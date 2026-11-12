// upload-pack.mjs — the platforms with no posting API, made a two-minute manual job.
//
// Zalo, Shopee Video, a Shopee product page and TikTok Shop are where Vietnamese shops sell,
// and none of them offers a public API for posting a video (Ayrshare and Make cover TikTok,
// Facebook, Instagram, YouTube — not these). Pretending otherwise would mean scraping a
// seller centre. What actually costs a creator time is the fiddly part: re-encoding to each
// platform's limits, trimming the caption, finding the cover, remembering the steps. A pack
// does that part: one folder per platform, the right file in it, and a checklist.
//
// Specs (size, length, codec) come from scripts/video/lib/delivery-specs.mjs, each with its
// source and check date. Caption limits only where a source states one; elsewhere the pack
// says "keep it short" rather than inventing a number.

/** id → { spec (delivery-specs id), label, captionMax|null, tags (hashtags shown?), steps } */
export const PACK_PLATFORMS = {
  zalo: {
    spec: "zalo",
    label: "Zalo (nhật ký / Zalo Video)",
    captionMax: null,
    steps: [
      "Chép video.mp4 sang điện thoại (Zalo PC cũng đăng được).",
      "Mở Zalo → Nhật ký → đăng video, chọn video.mp4.",
      "Dán nội dung từ caption.txt.",
      "Đăng. Zalo không công bố giới hạn cho video thường — gói này đã nén theo hướng dẫn phổ biến (~100 MB, 9:16).",
    ],
  },
  "shopee-video": {
    spec: "shopee-video",
    label: "Shopee Video",
    captionMax: null,
    steps: [
      "Mở ứng dụng Shopee (tài khoản người bán) → Shopee Video → đăng video.",
      "Chọn video.mp4; nếu có thể, gắn sản phẩm đang bán vào video.",
      "Dán caption.txt (ngắn gọn — Shopee không công bố giới hạn chung).",
      "Giữ video ≤ 60 giây cho chắc: các nguồn chưa thống nhất 1 hay 3 phút.",
    ],
  },
  "shopee-product": {
    spec: "shopee-product",
    label: "Shopee — video trên trang sản phẩm",
    captionMax: null,
    noCaption: true,
    steps: [
      "Kênh Người Bán → Sản phẩm → sửa sản phẩm → mục Video.",
      "Tải video.mp4 lên. Giới hạn theo trang của Shopee: ≤ 30 MB, 10–60 giây, tối đa 1280×1280.",
      "Lưu sản phẩm.",
    ],
  },
  "tiktok-shop": {
    spec: "tiktok",
    label: "TikTok Shop (video gắn sản phẩm)",
    captionMax: 2200,
    steps: [
      "Mở TikTok (tài khoản đã liên kết TikTok Shop) → đăng video → chọn video.mp4.",
      "Gắn sản phẩm (Thêm liên kết / Sản phẩm) trước khi đăng.",
      "Dán caption.txt (≤ 2.200 ký tự).",
      "Nội dung bán hàng tuân theo quy định quảng cáo — đã chạy ads-policy-check chưa?",
    ],
  },
};

const graphemes = (s) => [...String(s ?? "")];

/** Caption for one platform: text + hashtags, cut at the platform's limit on a line or word. */
export function packCaption(post, hashtags, max) {
  const full = [String(post ?? "").trim(), String(hashtags ?? "").trim()].filter(Boolean).join("\n\n");
  if (!max || graphemes(full).length <= max) return { text: full, cut: false };
  // Keep the hashtags if they fit; shorten the body.
  const tags = String(hashtags ?? "").trim();
  const room = max - (tags ? graphemes(tags).length + 2 : 0);
  let body = graphemes(post).slice(0, Math.max(0, room)).join("");
  const at = Math.max(body.lastIndexOf("\n"), body.lastIndexOf(". "), body.lastIndexOf(" "));
  if (at > room * 0.6) body = body.slice(0, at + 1);
  return { text: [body.trim(), tags].filter(Boolean).join("\n\n"), cut: true };
}

/** The checklist file for one platform. */
export function checklist(p, { videoNote = "", captionCut = false } = {}) {
  return [
    `# Đăng lên ${p.label}`,
    "",
    ...p.steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    videoNote ? `**Video:** ${videoNote}` : "",
    captionCut ? "**Caption:** đã rút gọn cho vừa giới hạn — đọc lại trước khi đăng." : "",
    "",
    "Không nền tảng nào ở đây có API đăng bài công khai, nên bước đăng là thủ công. Mọi thứ còn lại đã chuẩn bị sẵn.",
    "",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
}
