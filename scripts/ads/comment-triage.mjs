#!/usr/bin/env node
// comment-triage.mjs — sort ad/post comments by what the commenter wants, draft replies.
//
//   node scripts/ads/comment-triage.mjs comments.csv              # CSV with a message column
//   node scripts/ads/comment-triage.mjs comments.txt --brand "Mây"  # one comment per line
//   node scripts/ads/comment-triage.mjs comments.csv --json
//
// WHY RULES, NOT A MODEL. This runs on every comment, offline, in milliseconds, and its
// mistakes are inspectable: a rule that misfires is one line to fix. The agent reads the
// output and rewrites the drafts in the brand's voice — the script only sorts and suggests.
//
// THE TRAP IS SPELLING. Fashion-page comments are short, unaccented and abbreviated:
// "sz m con k", "gia bn shop", "ib e", "ship hn bao lau". Every rule runs on the FOLDED text
// (no diacritics, lower case) and lists the teencode forms explicitly.
//
// NEVER POSTS. Output is a review list. Replying publicly with a price or a size chart is
// a brand decision; hiding a comment is a moderation decision. Both go through review-gate.
import { parseCsv, findColumn, fold, readText, args, isMain, toCsv } from "./lib/common.mjs";

// Order matters only for the primary label; every matching intent is reported.
// priority: 1 = answer within the hour (money or reputation at stake) … 4 = optional.
export const INTENTS = [
  {
    id: "spam_scam",
    label: "Spam / lừa đảo",
    priority: 1,
    action: "hide",
    // Links to unknown domains, "click link nhận quà", fake prize, recruiting, crypto.
    re: /(https?:\/\/|www\.|bit\.ly|tinyurl|t\.me\/|zalo\.me\/)|\b(trung thuong|nhan qua|tri an khach hang|viec lam tai nha|thu nhap \d+|kiem tien online|dau tu|crypto|usdt|vay tien|giai ngan)\b/,
  },
  {
    id: "complaint",
    label: "Khiếu nại",
    priority: 1,
    action: "reply_private",
    re: /\b(lua dao|lua dau|tham(?! khao)|that vong|chan(?! vay| dai| ngan)|te qua|kem chat luong|hang loi|loi chi|bung chi|phai mau|ra mau|giao sai|giao nham|thieu hang|khong giong hinh|k giong hinh|ko giong hinh|ko nhu hinh|k nhu hinh|khong nhu hinh|doi tra|hoan tien|boom hang|chua nhan duoc|chua nhan dc|cham giao)\b/,
  },
  {
    id: "ask_price",
    label: "Hỏi giá",
    priority: 2,
    action: "reply_public",
    re: /\b(gia|bao nhieu|bn|bnh|bao nhiu|bnhieu|nhiu tien|may k|mayk|price|how much)\b|\bgia\s*(sao|ntn|nhieu)/,
  },
  {
    // Before ask_size: "sz m con k" asks whether size M is still IN STOCK — answering it with
    // a size chart misses the question.
    id: "ask_stock",
    label: "Hỏi còn hàng / màu",
    priority: 2,
    action: "reply_public",
    re: /\b(con hang|con k|con ko|con khong|het hang|con mau|mau nao|co mau|mau (den|trang|be|kem|xanh|do|hong|nau|xam)|con size|restock|ve hang)\b/,
  },
  {
    id: "ask_size",
    label: "Hỏi size / tư vấn",
    priority: 2,
    action: "reply_public",
    re: /\b(size|sz|co (s|m|l|xl|xxl)|mac vua|vua khong|vua ko|vua k|\d{2}\s?kg|\d{2,3}\s?cm|cao \d|nang \d|1m\d|tu van|form|rong|chat(?! luong)|bi chat)\b/,
  },
  {
    id: "ask_ship",
    label: "Hỏi ship / thanh toán",
    priority: 2,
    action: "reply_public",
    re: /\b(ship|giao hang|giao toi|phi ship|freeship|free ship|cod|bao lau|may ngay|thanh toan|chuyen khoan|ck|tra gop|o dau|dia chi|shop o|cua hang)\b/,
  },
  {
    id: "want_buy",
    label: "Muốn mua / xin inbox",
    priority: 2,
    action: "reply_private",
    re: /\b(ib|inbox|in box|check ib|check inbox|rep ib|chot|lay \d|lay cai|mua|dat hang|order|oder|xin link|link mua|tu van giup|cho minh xin)\b/,
  },
  {
    id: "competitor",
    label: "Nhắc đối thủ / so sánh",
    priority: 3,
    action: "review",
    re: /\b(ben kia|shop kia|shop khac|ben khac|re hon|shopee re|lazada re|tiktok shop re|o ngoai cho|hang cho|hang qc|hang quang chau|fake|rep 1:1|replica)\b/,
  },
  {
    id: "praise",
    label: "Khen / tag bạn",
    priority: 4,
    action: "like_and_thank",
    re: /\b(dep|xinh|xin|xink|ung|iu|yeu|thich|tuyet|xuat sac|chat luong|uy tin|10 diem|hay qua|cute|xin xo)\b|@\w+|❤|😍|🥰|👍|🔥/,
  },
];

/** Classify one comment. Returns {intents[], primary, priority, action}. */
export function classify(message) {
  const raw = String(message ?? "");
  const f = fold(raw);
  if (!f) return { intents: [], primary: null, priority: 5, action: "none" };
  // A tag-only comment ("@Lan @Mai") is praise/sharing, not a question.
  const hits = INTENTS.filter((i) => i.re.test(i.id === "praise" ? raw.toLowerCase() + " " + f : f));
  // A complaint that also asks a price is still a complaint first; INTENTS order encodes that.
  const primary = hits[0] ?? null;
  return {
    intents: hits.map((h) => h.id),
    primary: primary?.id ?? "other",
    priority: primary?.priority ?? 4,
    action: primary?.action ?? "review",
  };
}

/** A starting draft for the agent to rewrite in brand voice. Never a final reply. */
export function draftReply(primary, { brand = "shop" } = {}) {
  const D = {
    spam_scam: "(Ẩn bình luận — không trả lời công khai. Nếu mạo danh shop: ghim cảnh báo chính thức.)",
    complaint: `${brand} rất tiếc về trải nghiệm này ạ. Bạn nhắn tin cho ${brand} mã đơn + ảnh sản phẩm, bên mình xử lý ngay trong hôm nay nhé.`,
    ask_price: `Dạ mẫu này giá [GIÁ] ạ — ${brand} đã nhắn tin chi tiết bảng size và ưu đãi cho bạn rồi nhé 💌`,
    ask_size: `Bạn cho ${brand} xin chiều cao + cân nặng, bên mình tư vấn size vừa nhất nhé. Bảng size: [LINK/ẢNH].`,
    ask_stock: `Dạ mẫu này hiện còn [MÀU/SIZE] ạ, ${brand} giữ hàng cho bạn trong [X] giờ nếu bạn nhắn tin nhé.`,
    ask_ship: `Dạ ${brand} ship toàn quốc, COD kiểm tra hàng, [THỜI GIAN] ngày tuỳ khu vực ạ. Phí ship: [PHÍ].`,
    want_buy: `${brand} đã nhắn tin cho bạn rồi ạ, bạn check tin nhắn giúp mình nhé 💌`,
    competitor: "(Không tranh luận công khai, không nói xấu đối thủ. Nếu cần: nêu điểm khác biệt có thật — chất liệu, đổi trả, bảo hành.)",
    praise: `Cảm ơn bạn nhiều ạ 🥰`,
    other: "(Đọc lại — không khớp quy tắc nào.)",
  };
  return D[primary] ?? D.other;
}

export function triage(messages, opt = {}) {
  return messages
    .map((m, i) => {
      const c = classify(m.message);
      return { n: i + 1, author: m.author ?? "", message: m.message, ...c, draft: draftReply(c.primary, opt) };
    })
    .sort((a, b) => a.priority - b.priority || a.n - b.n);
}

export function loadComments(text, file = "") {
  if (/\.csv$|\.tsv$/i.test(file) || /^[^\n]*[,;\t][^\n]*\n/.test(text) && /message|binh luan|noi dung|comment/i.test(fold(text.split(/\r?\n/)[0]))) {
    const rows = parseCsv(text);
    if (!rows.length) return [];
    const h = Object.keys(rows[0]);
    const mc = findColumn(h, ["message", "comment", "binh luan", "noi dung", "noi dung binh luan", "text"]);
    const ac = findColumn(h, ["author", "name", "ten", "nguoi binh luan", "from"]);
    if (!mc) throw new Error("no message/comment/bình luận column in the CSV");
    return rows.map((r) => ({ message: r[mc], author: ac ? r[ac] : "" })).filter((r) => r.message);
  }
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((message) => ({ message }));
}

if (await isMain(import.meta.url)) {
  const a = args(process.argv.slice(2));
  if (a.help || !a._[0]) {
    console.log(`comment-triage.mjs — classify Vietnamese comments and draft replies for review
usage: node scripts/ads/comment-triage.mjs <comments.csv|.txt> [--brand "Tên shop"] [--json|--csv]
input: CSV with a message/bình luận column (author optional), or plain text one comment per line.
env: none. NEVER posts or hides anything — the output is a review list.`);
    process.exit(a.help ? 0 : 1);
  }
  try {
    const rows = triage(loadComments(readText(a._[0]), a._[0]), { brand: typeof a.brand === "string" ? a.brand : "shop" });
    if (a.json) console.log(JSON.stringify(rows, null, 2));
    else if (a.csv) process.stdout.write(toCsv(rows.map((r) => ({ ...r, intents: r.intents.join("|") })), ["priority", "primary", "intents", "action", "author", "message", "draft"]));
    else {
      const count = {};
      rows.forEach((r) => (count[r.primary] = (count[r.primary] ?? 0) + 1));
      console.log(`# Comment triage — ${rows.length} bình luận\n${Object.entries(count).map(([k, n]) => `${k}: ${n}`).join(" · ")}\n`);
      for (const r of rows) console.log(`[P${r.priority}] ${r.primary} → ${r.action}\n   "${r.message}"\n   ✎ ${r.draft}`);
      console.log("\nBản nháp — chưa đăng gì. Sửa theo giọng thương hiệu rồi qua review-gate.");
    }
  } catch (e) {
    console.error(`[triage] ✗ ${e.message}`);
    process.exit(1);
  }
}
