# Thay đổi gì

<!-- Một hai câu: đổi cái gì và vì sao. Có issue liên quan thì ghi "Closes #123". -->

## Kiểm chứng

<!-- Dán output thật, đừng chỉ tick. CI chạy đúng những lệnh này. -->

```
[ ] for f in $(find scripts -name "*.mjs"); do node -c "$f"; done
[ ] mọi CLI chạy được --help
[ ] node scripts/video/validate-script.mjs templates/VIDEO_SCRIPT.template.json --strict
[ ] node scripts/media/host-check.mjs --selftest
[ ] không có secret nào bị commit
```

## Có động vào phần nhìn?

<!-- Nếu PR đụng tới template, pipeline render hay media: render thử rồi đính contact sheet.
     Validator không nhìn được ảnh — bốn lỗi đã từng lọt vào video hoàn chỉnh vì thiếu bước này. -->

```bash
node scripts/video/render.mjs <script.json>
node scripts/video/contact-sheet.mjs <dir>/video.mp4
```

## Có thêm adapter mới?

<!-- Nhà cung cấp giọng, nguồn media hay host upload. -->

- [ ] Đã chạy thật với credential của tôi — dán output `tts-check.mjs` / `host-check.mjs` bên dưới
- [ ] **Chưa** chạy thật được → tôi đã đánh dấu `verified = false` trong adapter

<!-- Thà nói thật là chưa test còn hơn để người sau tin nhầm. Cloudflare R2, Cloudinary và
     Viettel AI hiện đang ở trạng thái đó. -->

## Checklist

- [ ] Không thêm npm dependency (kit không có `package.json` — đây là điều cố ý)
- [ ] Bí mật đọc từ env, không hardcode; đã thêm biến mới vào `.env.example`
- [ ] Script mới có header comment: mục đích, ví dụ dùng, dòng `ENV:`, và hiểu `--help`
- [ ] Sửa `docs/` thì sửa **cả hai** phần EN và Tiếng Việt
- [ ] Không xoá `NOTICE.md` nào (điều kiện giấy phép, không phải phép lịch sự)
- [ ] Thêm template thì đã thêm dòng vào `video-templates/CATALOG.md`
