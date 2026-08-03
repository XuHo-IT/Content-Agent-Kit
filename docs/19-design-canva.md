# 19 — Campaign visuals with Canva / Ảnh campaign bằng Canva

## English

The kit could put an image on a post and inside a video frame. It could not **make** one:
stock search finds photographs, screenshots capture a page, and neither produces a branded
campaign visual.

Optional, like everything else in `.mcp.json`. The kit runs end to end without it.

### Connect

`.mcp.json` already declares it. In Claude Code, type `/mcp` and authenticate — each person
uses their own Canva account, nothing is shared through this repo.

Declared as a remote HTTP server, which Claude Code speaks natively. A client that cannot do
remote OAuth needs the shim Canva documents:

```bash
npx -y mcp-remote@latest https://mcp.canva.com/mcp
```

That form is deliberately not the default here: it would put an `npx` download in the
startup path of a kit whose whole premise is that it installs nothing.

### Plan limits — read these before designing a workflow

| Capability | Plan |
|---|---|
| Generate, edit, search, upload, comment, **export** | any, including free |
| Resize a design to another aspect | Pro and above |
| Autofill a template from data | **Enterprise** |

`skills/design-campaign/` is built for the **free plan**. Autofill is treated as an
accelerator, never a required step — a workflow that depends on Enterprise is a workflow
most readers of this repo cannot run.

Resizing being paid has a practical consequence: **decide the canvas before you open Canva.**
Producing 1080×1080 when you needed 1080×1920 costs a redo on a free account.

### What it hands back

A **file on disk**, not a Canva link. Everything downstream — `make-post.mjs`,
`video/render.mjs` — takes a path or a URL; a design link is neither and fails at the
webhook rather than at the point the mistake was made.

Exports land in `brain/<slug>/design/`, beside that item's other artifacts, matching where
`create-video` and `research-and-capture` already write.

```bash
node scripts/social/make-post.mjs --post caption.txt --image brain/<slug>/design/post-1080.png
```

PNG for anything with text. JPEG artefacts around type are visible at the sizes social
platforms re-encode to.

### Brand comes from what already exists

The skill checks `PLAYBOOK.md`, then `video-templates/theme-map.json`, then the `brandkit`
skill, then the Canva brand kit — and stops at the first that answers. It never invents a
palette when one of those has one.

That order matters for a specific reason: if the video side already has a theme, an image
that disagrees with it turns one post into two visual identities.

---

## Tiếng Việt

Kit vốn gắn được ảnh vào bài đăng và vào khung video, nhưng không **tạo** được ảnh: tìm
stock ra ảnh chụp, screenshot ra ảnh trang web, không cái nào ra một visual campaign có
thương hiệu.

Tuỳ chọn, như mọi thứ trong `.mcp.json`. Không nối thì kit vẫn chạy đủ.

### Kết nối

`.mcp.json` đã khai sẵn. Trong Claude Code gõ `/mcp` rồi đăng nhập — mỗi người dùng tài
khoản Canva riêng, không có gì chia sẻ qua repo này.

### Giới hạn theo gói — đọc trước khi thiết kế quy trình

| Khả năng | Gói |
|---|---|
| Tạo, sửa, tìm, tải lên, bình luận, **export** | mọi gói, kể cả miễn phí |
| Đổi kích thước sang tỷ lệ khác | Pro trở lên |
| Autofill template từ dữ liệu | **Enterprise** |

`skills/design-campaign/` viết cho **gói miễn phí**. Autofill chỉ là thứ chạy nhanh hơn,
không bao giờ là bước bắt buộc — một quy trình phụ thuộc Enterprise là quy trình phần lớn
người đọc repo này không chạy được.

Việc đổi kích thước là tính năng trả phí kéo theo một hệ quả thực tế: **chốt khổ trước khi
mở Canva.** Làm ra 1080×1080 trong khi cần 1080×1920 là phải làm lại từ đầu ở gói miễn phí.

### Nó trả về cái gì

**Một file trên đĩa**, không phải link Canva. Mọi thứ phía sau — `make-post.mjs`,
`video/render.mjs` — nhận đường dẫn hoặc URL; link thiết kế không phải cả hai, và nó sẽ hỏng
ở chỗ webhook chứ không hỏng ngay tại nơi gây ra lỗi.

PNG cho mọi thứ có chữ. Nhiễu JPEG quanh chữ nhìn thấy rõ ở kích thước mà mạng xã hội nén lại.

### Màu lấy từ thứ đã có sẵn

Skill tra `PLAYBOOK.md`, rồi `video-templates/theme-map.json`, rồi skill `brandkit`, rồi
brand kit trên Canva — và dừng ở chỗ đầu tiên có câu trả lời. Nó không tự bịa bảng màu khi
một trong số đó đã có.

Thứ tự này quan trọng vì một lý do cụ thể: nếu bên video đã có theme, một tấm ảnh lệch màu
biến một bài đăng thành hai bộ nhận diện.
