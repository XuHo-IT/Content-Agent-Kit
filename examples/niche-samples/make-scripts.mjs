#!/usr/bin/env node
// make-scripts.mjs — writes the eight niche sample scripts (examples/niche-samples/<niche>/script.json).
//
//   node examples/niche-samples/make-scripts.mjs
//   node scripts/video/render.mjs examples/niche-samples/<niche>/script.json --captions burn --caption-style active
//
// One short video per vertical, each on its industry palette (templates/INDUSTRIES.template.json)
// and built from the frames that vertical leans on. Content is evergreen advice, not news, so it
// does not go stale and states nothing that needs a source it does not cite. The single number
// (the compound-interest scene) is arithmetic shown with its assumptions, labelled illustrative.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CH = "Kênh Mẫu";

const base = (title, theme) => ({
  version: "1.0",
  renderer: "hyperframes",
  aspect: "9:16",
  theme,
  metadata: { title, source: { url: "https://example.com", domain: "example.com", image: null }, channel: CH },
  voice: { provider: "omnivoice", speed: 1 },
});
const outro = (voiceText, cta) => ({
  id: "outro",
  type: "outro",
  voiceText,
  templateId: "frame-statement-outro",
  inputs: { cta, channel: CH, source: "" },
});

export const NICHES = {
  "cong-nghe-ai": {
    label: "AI & Công nghệ",
    ...base("Dựng video ngắn bằng AI agent", "graphite-signal"),
    scenes: [
      { id: "hook", type: "hook", templateId: "frame-trend-word-pop",
        voiceText: "Bạn đang mất ba tiếng để dựng một video ngắn? Có một cách nhanh hơn rất nhiều, và bạn không cần biết dựng phim.",
        inputs: { tag: "MẸO AI", line: "Bạn đang mất 3 tiếng để dựng một video ngắn?", accent: "3 tiếng", sub: "Có cách nhanh hơn nhiều" } },
      { id: "compare", type: "body", templateId: "frame-trend-compare-wipe",
        voiceText: "Cách cũ là cắt ghép tay, gõ phụ đề từng dòng, mỗi video một kiểu. Cách mới là viết kịch bản, để agent dựng khung hình, giọng đọc và phụ đề cùng lúc.",
        inputs: { title: "Dựng tay vs dùng agent", left_label: "TRƯỚC", left_1: "Cắt ghép thủ công", left_2: "Gõ phụ đề từng dòng", left_3: "Mỗi video một kiểu", right_label: "SAU", right_1: "Viết kịch bản là xong", right_2: "Phụ đề tự khớp từng từ", right_3: "Một bảng màu cho cả kênh", verdict: "Bạn chỉ còn việc duyệt" } },
      { id: "layers", type: "body", templateId: "frame-trend-exploded-layers",
        voiceText: "Bên trong một agent có bốn lớp. Giao diện để bạn ra lệnh, công cụ để chạy lệnh, bộ nhớ để nhớ bối cảnh, và mô hình để suy luận. Thiếu một lớp là nó thành chatbot.",
        inputs: { title: "Bên trong một AI agent", layer_1: "Giao diện — nơi bạn ra lệnh", layer_2: "Công cụ — đọc file, chạy lệnh", layer_3: "Bộ nhớ — nhớ bối cảnh", layer_4: "Mô hình — bộ não suy luận", caption: "Thiếu một lớp, agent thành chatbot" } },
      outro("Theo dõi kênh để xem từng bước dựng một video bằng agent.", "Theo dõi để xem từng bước"),
    ],
  },

  "tai-chinh": {
    label: "Tài chính cá nhân",
    ...base("Lãi kép: bắt đầu sớm quan trọng hơn bắt đầu nhiều", "ledger-green"),
    scenes: [
      { id: "hook", type: "hook", templateId: "frame-trend-search-morph",
        voiceText: "Câu hỏi người trẻ tìm nhiều nhất về tiền: mỗi tháng nên để dành bao nhiêu? Câu trả lời ngắn là: ít cũng được, nhưng phải đều và phải sớm.",
        inputs: { kicker: "Người trẻ hay hỏi", query: "mỗi tháng nên tiết kiệm bao nhiêu", result_1: "Ít cũng được, miễn là đều", result_2: "Bắt đầu càng sớm càng lợi", result_3: "Tự động trích ngay khi có lương", footer: "" } },
      { id: "number", type: "body", templateId: "frame-trend-stat-odometer",
        voiceText: "Ví dụ minh hoạ: gửi một triệu mỗi tháng, lãi giả định sáu phần trăm một năm. Sau mười năm bạn có khoảng một trăm sáu mươi tư triệu, trong đó gần bốn mươi tư triệu là tiền lãi.",
        inputs: { kicker: "SAU 10 NĂM", value: "163.880.000", unit: "đồng", label: "Gửi 1 triệu/tháng, lãi giả định 6%/năm, ghép lãi hằng tháng", delta: "≈ 43,9 triệu là tiền lãi", source: "Tính minh hoạ — không phải lời khuyên đầu tư" } },
      { id: "myth", type: "body", templateId: "frame-myth-fact",
        voiceText: "Nhiều người nghĩ phải có thật nhiều tiền mới bắt đầu. Thực tế, với lãi kép, thời gian quan trọng hơn số vốn ban đầu. Năm năm chậm trễ có thể bằng cả một khoản lớn.",
        inputs: { mythLabel: "Ai cũng nghĩ", myth: "Phải có nhiều tiền mới bắt đầu", factLabel: "Thực tế", fact: "Với lãi kép, thời gian quan trọng hơn số vốn", source: "" } },
      outro("Lưu video này lại, và bắt đầu ngay tháng này, dù chỉ một khoản nhỏ.", "Lưu lại và bắt đầu tháng này"),
    ],
  },

  "thuong-mai-dien-tu": {
    label: "Bán hàng & TMĐT",
    ...base("Flash sale bình giữ nhiệt", "tomato-cream"),
    scenes: [
      { id: "hook", type: "hook", templateId: "frame-trend-phone-notifs",
        voiceText: "Đây là điện thoại của shop sau đúng một buổi sáng mở bán. Đơn về liên tục, và lý do nằm ở một món đồ rất nhỏ.",
        inputs: { time: "09:41", date: "Thứ Hai", app_1: "Shopee", msg_1: "Bạn có đơn hàng mới cần xác nhận", app_2: "Zalo", msg_2: "Chị ơi còn màu xanh rêu không ạ?", app_3: "TikTok Shop", msg_3: "Sản phẩm của bạn đang được xem nhiều", app_4: "Ngân hàng", msg_4: "Bạn vừa nhận thanh toán đơn hàng", headline: "Một buổi sáng mở bán" } },
      { id: "product", type: "body", templateId: "frame-product-reveal",
        voiceText: "Bình giữ nhiệt năm trăm mi li lít, giữ đá lạnh cả ngày, nhẹ, vừa ngăn bên của balo. Món đồ nhỏ nhưng ai dùng rồi cũng mang theo mỗi ngày.",
        inputs: { badge: "MỚI VỀ", name: "Bình giữ nhiệt 500ml", tagline: "Giữ lạnh cả ngày · vừa ngăn balo", teaser: "Sản phẩm minh hoạ" } },
      { id: "price", type: "outro", templateId: "frame-trend-price-drop",
        voiceText: "Hôm nay giảm còn một trăm bốn mươi chín nghìn, chỉ trong bốn mươi tám giờ. Link ở phần mô tả.",
        inputs: { kicker: "FLASH SALE · HÔM NAY", product: "Bình giữ nhiệt 500ml", old_price: "299.000đ", new_price: "149.000đ", badge: "-50%", note: "Chỉ trong 48 giờ · sản phẩm minh hoạ", cta: "Link ở bio 👆" } },
    ],
  },

  "giao-duc": {
    label: "Giáo dục",
    ...base("Nhớ từ vựng lâu hơn với lặp lại ngắt quãng", "chalk-marigold"),
    scenes: [
      { id: "hook", type: "hook", templateId: "frame-trend-comment-reply",
        voiceText: "Một bạn hỏi: học từ vựng tiếng Anh hôm trước, hôm sau quên sạch, làm sao để nhớ lâu hơn? Có ba bước rất đơn giản.",
        inputs: { reply_label: "Trả lời bình luận của", username: "@lan.hoc.anh", comment: "Học từ vựng hôm trước, hôm sau quên sạch. Làm sao nhớ lâu?", answer_title: "3 bước nhớ lâu", point_1: "", point_2: "", point_3: "" } },
      { id: "steps", type: "body", templateId: "frame-step-list",
        voiceText: "Bước một, ôn lại sau một ngày. Bước hai, ôn tiếp sau ba ngày, rồi một tuần. Bước ba, tự đặt câu với từ đó thay vì chỉ đọc lại. Đây là cách lặp lại ngắt quãng.",
        inputs: { kicker: "LẶP LẠI NGẮT QUÃNG", title: "Ôn đúng lúc sắp quên", steps: "Ôn lại sau 1 ngày|Rồi sau 3 ngày, 1 tuần|Tự đặt câu thay vì đọc lại" } },
      { id: "checklist", type: "body", templateId: "frame-checklist",
        voiceText: "Nên học ít từ mỗi ngày nhưng đều, và đặt từ vào câu. Không nên học một trăm từ trong một tối rồi bỏ cả tuần, cũng không nên chỉ chép đi chép lại.",
        inputs: { kicker: "MẸO NHỎ", title: "Nên và không nên", doLabel: "Nên", dontLabel: "Không nên", dos: "Ít từ mỗi ngày|Đặt từ vào câu|Ôn đúng lịch", donts: "Học dồn một tối|Chỉ chép lại|Bỏ cả tuần" } },
      outro("Bạn muốn hỏi gì tiếp theo? Bình luận để được trả lời trong video sau.", "Bình luận câu hỏi tiếp theo"),
    ],
  },

  "tin-tuc": {
    label: "Tin tức",
    ...base("Nhận ra tin giả trong vài giây", "newsprint-red"),
    scenes: [
      { id: "hook", type: "hook", templateId: "frame-trend-word-pop",
        voiceText: "Trước khi chia sẻ một tin gây sốc, hãy dành đúng mười giây. Chừng đó đủ để nhận ra phần lớn tin giả.",
        inputs: { tag: "KỸ NĂNG", line: "Dành 10 giây trước khi bấm chia sẻ", accent: "10 giây", sub: "Đủ để nhận ra phần lớn tin giả" } },
      { id: "checklist", type: "body", templateId: "frame-checklist",
        voiceText: "Hãy xem nguồn là trang nào, ngày đăng là khi nào, và có báo chính thống nào đưa cùng tin không. Cẩn thận với tiêu đề viết hoa, giục chia sẻ gấp, và ảnh không rõ xuất xứ.",
        inputs: { kicker: "10 GIÂY KIỂM TRA", title: "Trước khi chia sẻ", doLabel: "Kiểm tra", dontLabel: "Cảnh giác", dos: "Nguồn là trang nào|Ngày đăng|Báo khác có đưa không", donts: "Tiêu đề VIẾT HOA|Giục chia sẻ gấp|Ảnh không rõ nguồn" } },
      { id: "myth", type: "body", templateId: "frame-myth-fact",
        voiceText: "Nhiều người nghĩ tin được chia sẻ nhiều thì chắc là thật. Thực tế, tin giả thường lan nhanh hơn chính vì nó gây cảm xúc mạnh hơn.",
        inputs: { mythLabel: "Ai cũng nghĩ", myth: "Chia sẻ nhiều thì chắc là thật", factLabel: "Thực tế", fact: "Tin giả lan nhanh vì nó gây cảm xúc mạnh", source: "" } },
      outro("Gửi video này cho người hay chia sẻ tin trong nhóm gia đình bạn.", "Gửi cho nhóm gia đình bạn"),
    ],
  },

  "du-lich": {
    label: "Du lịch",
    ...base("Một ngày ở Hội An", "terracotta-sand"),
    scenes: [
      { id: "hook", type: "hook", templateId: "frame-trend-search-morph",
        voiceText: "Chỉ có một ngày ở Hội An thì đi đâu? Đây là lịch trình gọn, đi bộ được hết, không cần thuê xe.",
        inputs: { kicker: "Đi đâu khi chỉ có 1 ngày", query: "hội an 1 ngày đi đâu", result_1: "Phố cổ lúc sáng sớm", result_2: "Chùa Cầu và các nhà cổ", result_3: "Thả đèn hoa đăng buổi tối", footer: "" } },
      { id: "timeline", type: "body", templateId: "frame-trend-timeline-flight",
        voiceText: "Sáng sớm dạo phố cổ khi còn vắng. Trưa ăn một tô cao lầu. Chiều ghé Chùa Cầu và vài nhà cổ. Tối ra sông Hoài thả đèn hoa đăng.",
        inputs: { title: "Một ngày ở Hội An", year_1: "06:30", label_1: "Dạo phố cổ khi còn vắng", year_2: "11:30", label_2: "Ăn trưa một tô cao lầu", year_3: "15:00", label_3: "Chùa Cầu và nhà cổ", year_4: "19:00", label_4: "Thả đèn trên sông Hoài" } },
      outro("Lưu lại cho chuyến đi tới, và theo dõi để xem lịch trình các thành phố khác.", "Lưu lại cho chuyến đi tới"),
    ],
  },

  "y-te": {
    label: "Sức khoẻ",
    ...base("Mỏi mắt vì màn hình: quy tắc 20-20-20", "clinic-sage"),
    scenes: [
      { id: "hook", type: "hook", templateId: "frame-trend-comment-reply",
        voiceText: "Một bạn hỏi: ngồi máy tính cả ngày, chiều nào mắt cũng mỏi và khô, phải làm sao? Có một quy tắc rất dễ nhớ.",
        inputs: { reply_label: "Trả lời bình luận của", username: "@minh.vanphong", comment: "Ngồi máy tính cả ngày, chiều nào mắt cũng mỏi. Làm sao?", answer_title: "Quy tắc 20-20-20", point_1: "", point_2: "", point_3: "" } },
      { id: "steps", type: "body", templateId: "frame-step-list",
        voiceText: "Cứ hai mươi phút, nhìn một vật cách xa khoảng sáu mét, trong hai mươi giây. Thêm vào đó, nhớ chớp mắt chủ động và đặt màn hình thấp hơn tầm mắt một chút.",
        inputs: { kicker: "QUY TẮC 20-20-20", title: "Cho mắt nghỉ đúng cách", steps: "Mỗi 20 phút|Nhìn xa khoảng 6 mét|Trong 20 giây|Chớp mắt chủ động" } },
      { id: "myth", type: "body", templateId: "frame-myth-fact",
        voiceText: "Nhiều người nghĩ cứ mỏi mắt là phải nhỏ thuốc. Thực tế, nghỉ mắt đều đặn là bước đầu tiên. Nếu mỏi kéo dài hoặc nhìn mờ, hãy đi khám bác sĩ mắt.",
        inputs: { mythLabel: "Ai cũng nghĩ", myth: "Mỏi mắt là phải nhỏ thuốc ngay", factLabel: "Thực tế", fact: "Nghỉ mắt đều đặn trước; kéo dài thì đi khám", source: "Thông tin tham khảo, không thay thế bác sĩ" } },
      outro("Thông tin chỉ để tham khảo. Mắt có vấn đề kéo dài, hãy gặp bác sĩ chuyên khoa.", "Tham khảo — không thay thế bác sĩ"),
    ],
  },

  "bat-dong-san": {
    label: "Bất động sản",
    ...base("Thuê hay mua nhà: hỏi mình ba câu trước", "limestone-clay"),
    scenes: [
      { id: "hook", type: "hook", templateId: "frame-trend-word-pop",
        voiceText: "Thuê hay mua nhà? Trước khi tính bất cứ con số nào, hãy tự hỏi mình ba câu này.",
        inputs: { tag: "TRƯỚC KHI XUỐNG TIỀN", line: "Thuê hay mua? Hỏi mình 3 câu trước", accent: "3 câu", sub: "Trước khi tính bất cứ con số nào" } },
      { id: "steps", type: "body", templateId: "frame-step-list",
        voiceText: "Một, bạn có ở nơi này ít nhất năm năm không. Hai, khoản trả góp mỗi tháng có dưới một phần ba thu nhập không. Ba, bạn còn quỹ dự phòng sau khi trả trước không.",
        inputs: { kicker: "3 CÂU HỎI", title: "Tự hỏi trước khi mua", steps: "Ở đây ít nhất 5 năm?|Trả góp dưới 1/3 thu nhập?|Còn quỹ dự phòng sau khi trả trước?" } },
      { id: "poll", type: "body", templateId: "frame-trend-live-poll",
        voiceText: "Nếu cả ba câu đều là có, mua có thể hợp lý. Nếu chưa, thuê không phải là thua. Còn bạn đang nghiêng về bên nào?",
        inputs: { question: "Bạn đang nghiêng về bên nào?", option_a: "Mua nhà", option_b: "Thuê nhà", pct_a: "50", vs: "VS", cta: "Bình luận lựa chọn của bạn 👇", comment_1: "Thuê thêm vài năm đã", comment_2: "Mua sớm cho yên tâm", comment_3: "" } },
      outro("Đây là cách suy nghĩ, không phải lời khuyên tài chính. Bình luận hoàn cảnh của bạn nhé.", "Bình luận hoàn cảnh của bạn"),
    ],
  },
};

if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  for (const [id, n] of Object.entries(NICHES)) {
    const { label, ...script } = n;
    const dir = path.join(HERE, id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "script.json"), JSON.stringify({ _niche: label, ...script }, null, 2) + "\n");
    console.log(`✓ ${id}/script.json  (${script.scenes.length} scenes, theme ${script.theme})`);
  }
}
