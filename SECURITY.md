# Chính sách bảo mật

## Báo lỗi bảo mật

**Đừng mở issue công khai cho lỗi bảo mật.**

Gửi email tới **ngotranxuanhoa09062004@gmail.com** với tiêu đề bắt đầu bằng `[SECURITY]`, hoặc
dùng [GitHub Security Advisory](https://github.com/XuHo-IT/Content-Agent-Kit/security/advisories/new)
để báo riêng.

Nếu được, hãy nêu: loại lỗi, file liên quan, các bước tái hiện, và mức ảnh hưởng bạn đánh giá.
Đây là dự án làm ngoài giờ nên không cam kết thời gian phản hồi cố định, nhưng tôi sẽ trả lời
sớm nhất có thể.

## Phiên bản được hỗ trợ

Chỉ nhánh `main`. Kit này được copy vào project của bạn chứ không cài như một package, nên
"nâng cấp" nghĩa là kéo lại file mới.

## Mô hình bảo mật của kit

### Bí mật chỉ nằm trong env — không có ngoại lệ

Mọi script đọc cấu hình qua `scripts/lib/env.mjs`. `requireEnv()` ném lỗi khi thiếu; **không có
một giá trị fallback hardcode nào trong toàn bộ repo**. Đây là bài học từ những agent thật mà
kit này rút ra: chúng từng có sẵn token ingest và URL webhook Make.com nhúng thẳng trong mã
nguồn. Xem `docs/09-security.md`.

`.env` đã nằm trong `.gitignore`. Trước khi push, quét lại:

```bash
git grep -nE "hook\.(eu|us)[0-9]*\.make\.com/[a-z0-9]|Bearer [A-Za-z0-9_-]{16,}|R2_SECRET_ACCESS_KEY\s*=\s*." -- . ':!*.example'
```

### URL webhook chính là bí mật

`MAKE_WEBHOOK_URL` không có header xác thực — **ai biết URL thì đăng bài được lên kênh của bạn**.
Đối xử với nó như mật khẩu. Lộ rồi thì tạo webhook mới trong Make.com, URL cũ chết ngay.

### Bề mặt tấn công nhỏ vì không có dependency

Kit **không có `package.json`, không có `node_modules`** — nên không có chuỗi cung ứng npm để bị
tấn công. Nhưng có ba thứ chạy lúc runtime cần biết:

| Thứ | Rủi ro | Ghi chú |
|---|---|---|
| `npx -y hyperframes@0.6.94` | tải package từ npm khi render | **Đã ghim phiên bản.** Đây là engine HTML→MP4, không thể tự viết lại. Ghim để render tất định và không bị đổi ngầm. |
| `chrome --headless --screenshot` | mở **URL tuỳ ý** bằng trình duyệt thật | Chỉ chụp trang bạn (hoặc agent của bạn) chỉ định. Đừng cho nó URL từ nguồn không kiểm soát. Chạy trong profile tạm, xoá sau mỗi lần. |
| Template `<link>` Google Fonts | gọi mạng lúc render | Font tĩnh, không chạy script. Muốn offline hoàn toàn thì tự host font. |

### Khoá API bạn cắm vào

Khoá TTS (ElevenLabs, Vbee, FPT.AI, Viettel), khoá kho video (Pexels, Pixabay) và khoá host
(R2, Cloudinary) đều **chỉ đọc từ env, chỉ gửi tới đúng nhà cung cấp đó**, không ghi ra log.
Thân phản hồi HTTP luôn bị cắt trước khi in (`.slice(0, 300)`) để khoá không lọt vào log qua
thông báo lỗi.

Riêng khoá R2 dùng để **ký AWS SigV4**, nghĩa là secret không bao giờ rời máy bạn — chỉ chữ ký
được gửi đi. Bộ ký được kiểm chứng bằng vector chuẩn của AWS
(`node scripts/media/host-check.mjs --selftest`).

### Chạy tự động: quyền hạn có giới hạn

Agent chạy theo lịch phải dùng `acceptEdits` với danh sách lệnh cho phép hẹp — **không bao giờ
dùng `bypassPermissions`**. `docs/13-permissions.md` có sẵn cấu hình mẫu, kèm danh sách chặn
(`rm`, `git push --force`, `DROP TABLE`, `psql`, `curl`…).

### Media công khai

File tải lên R2/Cloudinary/Catbox là **công khai theo thiết kế** — nền tảng mạng xã hội phải tải
được từ URL đó. Đừng đưa thứ riêng tư vào video rồi upload. Catbox còn ẩn danh và không cam kết
lưu trữ; kit cảnh báo mỗi lần dùng và chỉ để test.

## Không thuộc phạm vi

- **Nội dung do AI sinh ra.** Kit không kiểm duyệt được điều mô hình viết. Đó là việc của
  review gate (`skills/review-gate`) và của bạn.
- **Bản quyền tư liệu.** Crawler chỉ lưu trích đoạn ≤1500 ký tự kèm link, và clip stock đến từ
  nguồn cho phép thương mại — nhưng **bạn chịu trách nhiệm** về những gì mình đăng.
- **Tài khoản mạng xã hội của bạn.** Kit đẩy payload tới webhook; phần xác thực nền tảng nằm
  hoàn toàn trong Make.com/n8n/Zapier.
