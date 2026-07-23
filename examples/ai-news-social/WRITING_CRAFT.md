# AI News Social Agent — WRITING CRAFT

> Viết bằng **tiếng Việt** (ngôn ngữ xuất bản). **BẮT BUỘC đọc trước khi viết.**
> Subagent VIẾT đọc §1 + §2 (bài) hoặc §3 (comment) + §4 + §6. Subagent REVIEW chấm theo **§7**.

---

## §1. NGUYÊN TẮC CHUNG

**1.1 Cụ thể thắng chung chung.** Con số, tên sản phẩm, mốc thời gian, so sánh đo được.
> ✗ "Mô hình mới cải thiện đáng kể hiệu năng." → ✓ "Rẻ hơn ~40% mỗi triệu token so với bản tháng 3, và chạy được trên card 16GB."

**1.2 Câu đầu phải ăn tiền.** Không "mở bài" vòng vo. Đưa thẳng cái mới / cái bất ngờ vào 1–2 câu đầu — người đọc lướt mạng xã hội chỉ cho bạn 3 giây.

**1.3 Giải thích cho người không chuyên.** Thuật ngữ dùng lần đầu → giải thích bằng 1 mệnh đề đời thường. Không giả định người đọc biết "RAG", "quantization", "inference".

**1.4 Nhịp đoạn ngắn.** 2–4 câu mỗi đoạn. Câu dài xen câu ngắn. Không đoạn nào quá 5 dòng trên điện thoại.

**1.5 Nói thẳng, chủ động.** Câu chủ động, động từ mạnh; bỏ "có thể nói rằng", "trong bối cảnh hiện nay", "việc này giúp cho".

**1.6 Trung thực về nguồn & độ chắc chắn.** Phân biệt rõ **đã công bố** / **đang thử nghiệm** / **tin đồn**. Không biến dự đoán thành sự thật.

---

## §2. REGISTER: BÀI VIẾT (`post`)

- **Giọng:** người trong ngành kể lại cho bạn mình — tỉnh táo, hào hứng vừa phải, KHÔNG giật gân, KHÔNG "sáo ngữ marketing".
- **Cấu trúc:** móc câu (cái mới) → nó là gì → **vì sao quan trọng với người đọc Việt** → giới hạn/rủi ro → kết bằng câu hỏi mở.
- **Độ dài:** 800–1500 từ. Ẩn `Meta:` (150–160 ký tự) + `Slug:` ở 2 dòng đầu.
- **Bắt buộc có:** ít nhất 1 con số/dẫn chứng cụ thể · 1 đoạn nói về **giới hạn hoặc mặt trái** (bài chỉ khen = mất uy tín) · kết bằng `Thế bạn nghĩ sao về: …?`.
- **Không** dùng `##` heading trong thân bài; link để ở comment.

## §3. REGISTER: COMMENT TƯƠNG TÁC (`comment`)

- **Giọng:** thân mật, ngắn, như nhắn tin — khác hẳn giọng bài viết.
- 2–4 câu. Mở bằng một ý kiến/quan sát riêng, kết bằng câu hỏi mời bàn luận.
- ≤5 hashtag, đặt cuối. Link (GitHub/sản phẩm) **chỉ đặt ở đây**.
- Không lặp lại nguyên câu đã có trong bài.

> ⚠️ §2 và §3 là **hai giọng khác nhau**. Comment không được viết như đoạn kết của bài.

---

## §4. CẤM — sáo rỗng & "mùi AI"

**4.1 Cụm sáo:** "trong bối cảnh công nghệ phát triển như vũ bão" · "không thể phủ nhận rằng" · "mở ra một kỷ nguyên mới" · "thay đổi cuộc chơi" · "bước tiến vượt bậc" · "đáng chú ý là" · "có thể nói rằng" · "hứa hẹn sẽ" · "sự bùng nổ của AI" · "tương lai đang đến gần".

**4.2 Tính từ rỗng** thay cho dữ kiện: *đột phá / vượt trội / ấn tượng / mạnh mẽ / tuyệt vời* — dùng được, nhưng phải kèm con số.

**4.3 Lỗi cấu trúc:**
- Mở bài bằng định nghĩa ("AI là trí tuệ nhân tạo, một lĩnh vực…").
- Mọi đoạn dài đều nhau, nhịp phẳng.
- Nhiều đoạn liên tiếp mở cùng cấu trúc ("Với việc…", "Điều này…").
- Liệt kê tính năng không kèm ý nghĩa với người dùng.
- Kết bài bằng đoạn "tổng kết lại" nhắc lại y nguyên phần trên.
- Rao giảng đạo lý về công nghệ.

---

## §5. VÍ DỤ TRƯỚC / SAU

### Cặp 1 — Mở bài
**✗ TRƯỚC:** "Trong bối cảnh công nghệ phát triển như vũ bão, không thể phủ nhận rằng AI đang thay đổi cuộc chơi. Mới đây, một mô hình mới đã được ra mắt, hứa hẹn sẽ mở ra một kỷ nguyên mới đầy ấn tượng."
**✓ SAU:** "Mô hình mới chạy được trên một card 16GB — thứ mà nửa năm trước còn cần cụm GPU thuê theo giờ. Giá mỗi triệu token rơi xuống còn khoảng 40% so với bản tháng 3."
*Sửa gì:* xoá 4 cụm sáo §4.1; thay bằng **2 dữ kiện đo được**; câu đầu đã có thông tin thay vì dạo đầu.

### Cặp 2 — Đoạn "vì sao quan trọng"
**✗ TRƯỚC:** "Đây là một bước tiến vượt bậc với hiệu năng mạnh mẽ và nhiều tính năng ấn tượng, chắc chắn sẽ rất hữu ích cho người dùng."
**✓ SAU:** "Với người làm nội dung ở Việt Nam, điều này nghĩa là: bạn chạy được model trên máy cá nhân, không phải gửi dữ liệu khách hàng lên server nước ngoài. Đổi lại, tốc độ chậm hơn khoảng ba lần so với gọi API."
*Sửa gì:* bỏ tính từ rỗng; nói **cụ thể ai được lợi và lợi thế nào**; thêm **mặt đánh đổi** (bắt buộc theo §2).

### Cặp 3 — Comment
**✗ TRƯỚC:** "Tóm lại, đây là một bước tiến đáng chú ý của AI, hứa hẹn mang lại nhiều giá trị cho người dùng. Các bạn nghĩ sao? #AI #congnghe #tuonglai #machinelearning #deeplearning"
**✓ SAU:** "Mình thử cắm vào máy cũ 16GB, chạy được thật nhưng quạt kêu như máy sấy 😅 Ai đang xài con này cho việc thật rồi cho mình xin review với. Link repo ở dưới nhé. #AI #LLM #NBOXAI"
*Sửa gì:* đổi sang **giọng nhắn tin** (khác hẳn bài); có **trải nghiệm cá nhân cụ thể**; câu hỏi thật để mời bàn; hashtag gọn, đúng chủ đề.

---

## §6. CHECKLIST TỰ KIỂM

- [ ] Đã đọc §1 + §2/§3 + §4.
- [ ] Không còn cụm nào ở §4.1; tính từ §4.2 luôn kèm con số.
- [ ] Câu đầu có thông tin (không dạo đầu, không định nghĩa).
- [ ] ≥1 con số/dẫn chứng cụ thể; ≥1 đoạn nói về **giới hạn/mặt trái**.
- [ ] Thuật ngữ lần đầu đều được giải thích bằng lời thường.
- [ ] Đoạn 2–4 câu, độ dài có biến thiên; không >2 đoạn liên tiếp mở cùng cấu trúc.
- [ ] Bài 800–1500 từ, có `Meta:` + `Slug:`, kết bằng `Thế bạn nghĩ sao về: …?`.
- [ ] Comment **khác giọng** bài, ≤5 hashtag, link chỉ ở comment.

---

## §7. RUBRIC REVIEW

Trả `{ "pass": bool, "issues": [...], "fixes": [...] }` — mỗi issue **trích đúng câu sai**, mỗi fix là gợi ý viết lại cụ thể.

| # | Tiêu chí (đo được) | Ngưỡng FAIL |
|---|---|---|
| 1 | Cụm sáo §4.1 | > 1 / 1000 từ |
| 2 | Đoạn liên tiếp mở cùng cấu trúc | > 2 |
| 3 | Con số/dẫn chứng cụ thể trong bài | < 2 |
| 4 | Đoạn nói về giới hạn/mặt trái | không có |
| 5 | Câu mở bài | là định nghĩa hoặc dạo đầu vòng vo |
| 6 | Thuật ngữ chuyên ngành | dùng mà không giải thích |
| 7 | Tính từ rỗng §4.2 không kèm số | > 2 lần |
| 8 | Comment vs bài | cùng giọng / lặp câu trong bài |
| 9 | Hashtag | > 5 hoặc lạc chủ đề |
| 10 | Độ dài + Meta/Slug + câu kết | thiếu bất kỳ mục nào |

**FAIL NGAY:** #4 (chỉ khen, không nêu mặt trái) · #3 (bài không có dữ kiện) · #1 vượt gấp đôi ngưỡng · sai sự thật / biến tin đồn thành khẳng định.
