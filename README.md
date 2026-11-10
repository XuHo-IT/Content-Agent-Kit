<div align="center">

# content-agent-kit

**Nói với AI bằng tiếng Việt → nhận về bài viết và video ngắn 9:16 đăng TikTok, Reels, Shorts.**

Không cần biết lập trình. Không cần biết dựng phim. Hầu hết tính năng miễn phí.

[![CI](https://github.com/XuHo-IT/Content-Agent-Kit/actions/workflows/ci.yml/badge.svg)](https://github.com/XuHo-IT/Content-Agent-Kit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg?style=flat-square)](LICENSE)

**🇻🇳 Tiếng Việt** · [English](README.en.md) · [Hướng dẫn kỹ thuật chi tiết](docs/00-huong-dan-chi-tiet.md)

</div>

---

## 🎬 Video mẫu — 16 ngành, 16 phong cách

Mỗi video dài khoảng 1 phút 20 giây, gồm 9–10 cảnh, do bộ kit tự làm từ một đoạn kịch bản:
khung hình động, chữ chạy, giọng đọc tiếng Việt và nhạc nền. Mỗi ngành có **bảng màu riêng**
và một bộ khung hình riêng (sơ đồ, biểu đồ, bản đồ vệ tinh, tờ báo cũ, cửa sổ code, meme…);
16 video dùng tổng cộng 83 kiểu khung khác nhau. Bấm vào ảnh để xem video có tiếng.

| | | | |
|:---:|:---:|:---:|:---:|
| [![AI & Công nghệ](examples/niche-samples/cong-nghe-ai/preview.webp)](examples/niche-samples/cong-nghe-ai/video.mp4) | [![Lập trình](examples/niche-samples/lap-trinh/preview.webp)](examples/niche-samples/lap-trinh/video.mp4) | [![Tài chính cá nhân](examples/niche-samples/tai-chinh/preview.webp)](examples/niche-samples/tai-chinh/video.mp4) | [![Doanh nghiệp](examples/niche-samples/doanh-nghiep/preview.webp)](examples/niche-samples/doanh-nghiep/video.mp4) |
| **AI & Công nghệ** | **Lập trình** | **Tài chính cá nhân** | **Doanh nghiệp** |
| [![Marketing](examples/niche-samples/marketing/preview.webp)](examples/niche-samples/marketing/video.mp4) | [![Bán hàng & TMĐT](examples/niche-samples/thuong-mai-dien-tu/preview.webp)](examples/niche-samples/thuong-mai-dien-tu/video.mp4) | [![Logistics](examples/niche-samples/logistics/preview.webp)](examples/niche-samples/logistics/video.mp4) | [![Game](examples/niche-samples/game/preview.webp)](examples/niche-samples/game/video.mp4) |
| **Marketing** | **Bán hàng & TMĐT** | **Logistics** | **Game** |
| [![Giáo dục](examples/niche-samples/giao-duc/preview.webp)](examples/niche-samples/giao-duc/video.mp4) | [![Lịch sử](examples/niche-samples/lich-su/preview.webp)](examples/niche-samples/lich-su/video.mp4) | [![Tin tức](examples/niche-samples/tin-tuc/preview.webp)](examples/niche-samples/tin-tuc/video.mp4) | [![Pháp lý](examples/niche-samples/phap-ly/preview.webp)](examples/niche-samples/phap-ly/video.mp4) |
| **Giáo dục** | **Lịch sử** | **Tin tức** | **Pháp lý** |
| [![Sức khoẻ](examples/niche-samples/y-te/preview.webp)](examples/niche-samples/y-te/video.mp4) | [![Môi trường](examples/niche-samples/moi-truong/preview.webp)](examples/niche-samples/moi-truong/video.mp4) | [![Du lịch](examples/niche-samples/du-lich/preview.webp)](examples/niche-samples/du-lich/video.mp4) | [![Bất động sản](examples/niche-samples/bat-dong-san/preview.webp)](examples/niche-samples/bat-dong-san/video.mp4) |
| **Sức khoẻ** | **Môi trường** | **Du lịch** | **Bất động sản** |

### Có sẵn video quay người nói? Một đoạn quay, năm phong cách dựng

| Clean | Pop | Editorial | Cinematic | Kinetic doc |
|:---:|:---:|:---:|:---:|:---:|
| [![clean](examples/talking-head-demo/clean.webp)](examples/talking-head-demo/clean.mp4) | [![pop](examples/talking-head-demo/pop.webp)](examples/talking-head-demo/pop.mp4) | [![editorial](examples/talking-head-demo/editorial.webp)](examples/talking-head-demo/editorial.mp4) | [![cinematic](examples/talking-head-demo/cinematic.webp)](examples/talking-head-demo/cinematic.mp4) | [![kinetic-doc](examples/talking-head-demo/kinetic-doc.webp)](examples/talking-head-demo/kinetic-doc.mp4) |

Một phóng sự truyền hình quay ngang dài 2 phút 26 giây, được kit tự dựng thành video dọc 1 phút:
ghép 4 đoạn người dân, cán bộ và lời dẫn → chèn cảnh minh hoạ → cắt khoảng lặng → cắt khung dọc
bỏ logo và thanh chữ của đài → phụ đề sáng từng từ → chỉnh màu theo phong cách.
Nguồn: Đài PTTH Thanh Hoá, giấy phép CC BY 3.0 — [chi tiết](examples/talking-head-demo/).

---

## Bạn cần chuẩn bị gì?

1. **Một máy tính** Windows, macOS hoặc Linux, đã cài Google Chrome.
2. **Một trợ lý AI lập trình**: [Claude Code](https://claude.com/claude-code) hoặc Antigravity.
3. **Hai phần mềm miễn phí** (cài một lần). Trên Windows, mở PowerShell và dán:
   ```
   winget install OpenJS.NodeJS.LTS Gyan.FFmpeg
   ```
   macOS: `brew install node ffmpeg`
4. **Tải bộ kit về**: bấm nút xanh **Code → Download ZIP** ở đầu trang, giải nén, rồi mở thư mục
   đó bằng trợ lý AI.

## Dùng thế nào? Chỉ cần nói

Gõ những câu như thế này vào trợ lý AI:

| Bạn muốn | Hãy nói |
|---|---|
| Tạo bộ máy làm nội dung cho ngành của bạn | *"Tạo cho tôi một agent nội dung về **mỹ phẩm handmade**"* |
| Biết hôm nay có gì hot | *"Hôm nay có gì hot về **xe điện**?"* |
| Làm một video | *"Làm video 60 giây về **cách chọn kem chống nắng**"* |
| Soi đối thủ | *"Phân tích kênh **@ten-kenh-doi-thu** giúp tôi"* |
| Dựng video tự quay | *"Cắt khoảng lặng và thêm phụ đề cho file **video-cua-toi.mp4**, phong cách **pop**"* |
| Viết bài đăng mỗi ngày | *"Tạo nội dung hôm nay"* |

AI sẽ tự đọc hướng dẫn trong bộ kit, làm từng bước và **cho bạn duyệt trước khi đăng**.

## Có mất tiền không?

| Miễn phí | Tuỳ chọn, trả phí |
|---|---|
| Làm video: 115 mẫu khung hình, 16 bảng màu | Giọng đọc cao cấp (Vbee, FPT AI, ElevenLabs…) |
| Giọng đọc chạy trên máy (OmniVoice) | Dữ liệu TikTok/Instagram qua Apify |
| Tìm chủ đề hot, phân tích kênh YouTube và báo | Video AI quay như thật (Google Veo) |
| Cắt khoảng lặng, phụ đề, ảnh bìa | |

Phần trả phí luôn **báo giá trước** và chỉ chạy khi bạn tự thêm khoá (key) vào file `.env`.

## Câu hỏi thường gặp

**Video có bị "mùi AI" không?** Bảng màu được chọn theo ngành, không dùng gradient tím-xanh hay
chữ phát sáng. Phụ đề và nhịp cắt theo kiểu video đang thịnh hành năm 2026.

**Có được dùng video, bài của người khác không?** Kit chỉ lấy *ý tưởng và số liệu có nguồn*, luôn
viết lại nội dung mới. Video của người khác chỉ dùng khi giấy phép cho phép, và luôn ghi nguồn.

**Muốn đổi màu theo thương hiệu của mình?** Nói với AI: *"Lấy màu từ website
**ten-mien-cua-ban.vn** cho video"*.

---

## Tìm hiểu sâu hơn

- 📘 [Hướng dẫn kỹ thuật chi tiết](docs/00-huong-dan-chi-tiet.md): toàn bộ tính năng, thư viện mẫu khung hình, các lệnh
- 🎨 [Bảng màu theo ngành](docs/25-palettes.md) · ✂️ [Tự dựng video](docs/26-auto-edit.md) · 🔍 [Phân tích đối thủ](docs/24-competitor-analysis.md)
- 🤖 [AGENTS.md](AGENTS.md): hướng dẫn dành cho trợ lý AI
- 🧩 [Danh mục mẫu khung hình](video-templates/CATALOG.md)

Giấy phép **MIT** · Ghi công mã nguồn và tư liệu: [NOTICE.md](NOTICE.md) · Đóng góp: [CONTRIBUTING.md](CONTRIBUTING.md)
