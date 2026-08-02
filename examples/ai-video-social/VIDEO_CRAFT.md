# AI Video Social Agent — VIDEO CRAFT

> **BẮT BUỘC đọc trước khi viết `script.json`.** Người viết đọc §1–§5, tự kiểm §6.
> Review chấm theo **§7**. Phần máy kiểm được nằm ở `node scripts/video/validate-script.mjs`.
> Slot + giới hạn ký tự từng template: `video-templates/CATALOG.md`.

Nguyên tắc gốc: **bạn chỉ viết chữ.** Template lo toàn bộ thiết kế, bố cục, chuyển động.
Đừng cố "chỉ đạo nghệ thuật" bằng chữ.

---

## §1. HAI KÊNH CHỮ — không bao giờ trộn

| | `voiceText` (đọc lên) | `inputs` (hiện trên màn hình) |
|---|---|---|
| Ai đọc | máy TTS, đọc thành tiếng | không ai — nó được render ra hình |
| Số | **viết ra chữ** — xem §2 | giữ định dạng đẹp: `5.5`, `82%`, `200MP` |
| Emoji | **cấm** | được, 0–1 cái mỗi field |
| URL | **cấm** | được |
| `→ & % $ # + =` | **cấm** | được |
| Kết thúc bằng | `.` hoặc `?` (để TTS ngắt nghỉ tự nhiên) | không cần dấu câu cuối |

Cùng một dữ kiện xuất hiện ở cả hai kênh với hai định dạng khác nhau — đó là chủ ý:

```
voiceText:       "Camera hai trăm megapixel, sắc nét hơn hẳn thế hệ trước."
inputs.headline: "200MP"
```

> ⚠️ Emoji nằm trong field animate **từng ký tự** sẽ làm vỡ animation. Hiện tại là
> `hero` của `frame-build-minimal`. Validator báo lỗi chuyện này.

---

## §2. LUẬT ĐỌC SỐ TIẾNG VIỆT — viết ra chữ hết

OmniVoice đọc chữ số theo nghĩa đen và đọc sai. `GPT 5.5` ra thành *"năm rưỡi"* — sai hoàn
toàn với một số phiên bản. Nên trong `voiceText`, **không bao giờ có chữ số**.

| Dạng | ✗ TTS đọc sai | ✓ viết thế này |
|---|---|---|
| Phiên bản thập phân | `GPT 5.5` → "năm rưỡi" | `GPT năm chấm năm` |
| Số liệu thập phân | `82.7%` | `tám mươi hai phẩy bảy phần trăm` |
| Phiên bản số nguyên | `iPhone 17` | `iPhone mười bảy` |
| Phiên bản có chấm | `iOS 18.2` | `iOS mười tám chấm hai` |
| Thông số kỹ thuật | `200MP` | `hai trăm megapixel` |
| Pin | `5000mAh` | `năm nghìn miliampe giờ` |
| Token | `1M tokens` | `một triệu token` |
| Giá VND | `21 triệu đồng` | `hai mươi mốt triệu đồng` |
| Giá USD | `$5` | `năm đô la` (hoặc `năm đô`) |
| Bội số | `2x` | `gấp đôi` (tự nhiên hơn "hai lần") |
| Phần trăm | `30%` | `ba mươi phần trăm` |
| Thời gian | `60 giây` | `sáu mươi giây` |
| Tỉ lệ | `3:1` | `ba trên một` / `ba so với một` |

- Dấu thập phân: dùng `chấm` (nói tự nhiên) hoặc `phẩy` (trang trọng) — chọn một và nhất quán.
- Acronym tiếng Anh: `AI` / `GPT` thường đọc ổn. Nếu sai thì phiên âm: `API` → `ây pi ai`.
- Tên thương hiệu (Apple, OpenAI, TikTok) giữ nguyên.

---

## §3. NHỊP — thứ quyết định video có bị chán không

| Luật | Mục tiêu |
|---|---|
| Số scene | **8–12** (1 hook + 6–10 body + 1 outro) |
| Tổng lời đọc | **270–360 từ ≈ 90–120 giây** |
| Mỗi scene body | **25–40 từ**, đúng một ý |
| Thời gian trên màn hình | ~6–10 giây mỗi scene |

**Giữ nguyên tổng thời lượng, chia nhỏ ra nhiều scene hơn.** Một video 100 giây chia 6 scene
thì chán; cùng 100 giây chia 10 scene thì có nhịp. Đoạn nào có hai ý thì **tách thành hai
scene**, đừng nhồi vào một.

**Hook sở hữu ba giây đầu.** Mở bằng thứ khiến người ta dừng lướt — con số, mâu thuẫn, bất ngờ.
Không bao giờ mở bằng bối cảnh hay lời chào.

---

## §4. CHỌN TEMPLATE CHO TỪNG SCENE

Đọc `video-templates/CATALOG.md` để biết slot chính xác. **Chỉ dùng `templateId` có trong đó** —
validator đối chiếu với thư mục thật.

| Scene là… | Dùng |
|---|---|
| hook mở đầu | `frame-liquid-bg-hero` — **luôn luôn** |
| một con số cần nhấn | `frame-pentagram-stat` (tối neon) hoặc `frame-vignelli` (than + đỏ) |
| tuyên bố mạnh nhiều dòng + số lớn | `frame-bold-poster` |
| câu chốt xoay quanh một từ khoá | `frame-build-minimal` (1 từ lớn) |
| khẩu hiệu / câu sáng tạo | `frame-creative-voltage` |
| tin sốc / breaking / công nghệ | `frame-glitch-title` |
| **danh sách** 2–5 mục | `frame-aicoding-list` |
| so sánh **đúng 2** thứ | `frame-aicoding-comparison` |
| card kết | `frame-logo-outro` (mặc định) hoặc `frame-statement-outro` |

**Phải đa dạng.** Dùng một template cho mọi scene body thì video trông như slideshow.
Validator cảnh báo khi một template lặp quá **2 lần**. Nếu nhiều scene đều là số, xen kẽ
`frame-vignelli` và `frame-pentagram-stat`, chèn `frame-build-minimal` vào giữa.

**Màu và icon do bạn chọn.** `accent_from`/`accent_to`, `from`/`to` từng vế, và emoji `icon`
trong item của list/comparison — chọn theo tông của câu chuyện. `level`
(`danger`/`warn`/`good`/`info`) quyết định màu icon, tag và thanh của item.

---

## §5. GIỌNG KÊNH

- Nói với **một người**, không phải đám đông. Dùng "bạn", không dùng "các bạn".
- Câu ngắn. Mỗi câu một mệnh đề. Không chồng mệnh đề phụ.
- Cụ thể thắng chung chung: mọi tính từ mạnh phải kèm con số hoặc dẫn chứng.
- **Mỗi video phải có ít nhất một scene nói về mặt trái / giới hạn.** Video chỉ khen = mất uy tín.
- Không giả vờ hào hứng. Nếu tin đó bình thường, nói nó bình thường.
- Không bao giờ mở bằng "Xin chào" hay "Hôm nay chúng ta sẽ".

### Cấm trong lời đọc

- "trong bối cảnh công nghệ phát triển như vũ bão"
- "mở ra một kỷ nguyên mới"
- "hãy cùng nhau tìm hiểu"
- "không thể phủ nhận rằng"
- "đây chính là điều mà ai cũng đang mong chờ"
- "thay đổi cuộc chơi" / "game changer"
- "bùng nổ" (trừ khi có số đi kèm)
- "đột phá" dùng cho một bản cập nhật nhỏ

### Trước / Sau

**Cặp 1 — hook**
> ✗ "Trong bối cảnh công nghệ phát triển như vũ bão, Apple vừa cho ra mắt một sản phẩm mới
> đầy hứa hẹn mà chắc chắn sẽ khiến bạn phải bất ngờ."
>
> ✓ "Apple vừa ra mắt iPhone mười bảy với camera hai trăm megapixel. Đây là cảm biến lớn nhất
> họ từng đưa lên một chiếc điện thoại."
>
> **Đổi gì:** bỏ sáo rỗng mở bài, đưa con số lên câu đầu. Người xem biết ngay đây là chuyện gì.

**Cặp 2 — scene mặt trái**
> ✗ "Tuy nhiên sản phẩm cũng còn một vài hạn chế nhất định mà người dùng cần cân nhắc."
>
> ✓ "Nhưng có một điểm đáng lo mà ít ai nhắc tới. Dung lượng mỗi tấm ảnh tăng gấp ba, nên bộ
> nhớ máy sẽ đầy nhanh hơn nhiều so với những gì bạn quen."
>
> **Đổi gì:** "một vài hạn chế nhất định" là không nói gì cả. Nêu đúng cái hạn chế đó, kèm số.

**Cặp 3 — câu chốt**
> ✗ "Nhìn chung đây là một sản phẩm đáng để trải nghiệm."
>
> ✓ "Tóm lại, đây là bản nâng cấp đáng giá nếu bạn thực sự chụp ảnh nhiều mỗi ngày. Còn nếu
> không, chiếc máy đang dùng vẫn đủ tốt để chờ thêm một thế hệ nữa."
>
> **Đổi gì:** đưa ra khuyến nghị thật, có điều kiện rõ ràng, thay vì câu trung tính vô nghĩa.

---

## §6. TỰ KIỂM (chạy trước khi nộp)

1. `node scripts/video/validate-script.mjs <script.json> --strict` — **không lỗi, không cảnh báo**.
2. Không có chữ số nào trong bất kỳ `voiceText` nào. Đọc to từng câu — nghe có giống người nói không?
3. Hook đưa bất ngờ ra ngay câu đầu.
4. Có ít nhất một scene về mặt trái / giới hạn.
5. Mọi field `inputs` nằm trong giới hạn ký tự ở `CATALOG.md` — chữ dài sẽ tràn khung.
6. Template body đa dạng; không cái nào dùng quá 2 lần.
7. Scene cuối là outro, đúng tên thương hiệu và URL.

Sửa thầm tối đa hai vòng. Vẫn không đạt thì nói rõ sai chỗ nào, đừng nộp bừa.

---

## §7. RUBRIC REVIEW

| # | Tiêu chí | Trượt khi |
|---|---|---|
| 1 | Validator sạch | có bất kỳ error nào, hoặc có warning ở `--strict` |
| 2 | Sức mạnh hook | câu đầu là bối cảnh/lời chào thay vì bất ngờ |
| 3 | Nhịp | scene body nào đó ngoài 25–40 từ |
| 4 | Tổng độ dài | ngoài 270–360 từ (≈90–120s) |
| 5 | Lời đọc sạch | có chữ số, emoji, URL hoặc ký hiệu cấm trong `voiceText` |
| 6 | Đọc số đúng | đọc to lên mà con số nào ra sai |
| 7 | Đa dạng template | một template dùng > 2 lần |
| 8 | Hợp template | scene list mà không dùng template list; so sánh 2 thứ mà không dùng comparison |
| 9 | Chữ không tràn | field `inputs` nào vượt giới hạn trong CATALOG |
| 10 | Có mặt trái | không scene nào nói về giới hạn / rủi ro |
| 11 | Sáo rỗng | quá một cụm trong danh sách cấm §5 |
| 12 | Outro đúng | sai brand, sai URL, hoặc không phải scene cuối |

**FAIL NGAY:** #1 (có error) · #5 · #10 · #12.

> Không đạt → trả về `fixes` cụ thể, **trích đúng câu sai**; người viết sửa và nộp lại.
> Tối đa 2–3 vòng, sau đó bỏ item và ghi log lý do (xem `PLAYBOOK.md` §2b).
