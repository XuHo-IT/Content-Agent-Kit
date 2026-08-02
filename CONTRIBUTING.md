# Đóng góp cho content-agent-kit

Cảm ơn bạn đã quan tâm. Đây là bộ kit để **AI đọc rồi tự dựng agent nội dung**, nên đóng góp có
giá trị nhất thường đến từ người đã thực sự chạy nó: một template video mới, một nhà cung cấp
giọng ở nước bạn, một luật craft mà bạn thấy AI hay vi phạm, hay đơn giản là chỗ tài liệu nói
sai so với code.

Việc nhỏ (sửa lỗi chính tả, sửa bug rõ ràng, thêm một luật vào validator) thì cứ mở PR, không
cần hỏi trước. Thay đổi lớn thì mở [Discussion](../../discussions) bàn trước cho đỡ mất công.

## Chuẩn bị môi trường

**Không có bước cài đặt.** Kit này cố ý **không có `package.json` và không có dependency nào** —
chạy thẳng bằng `node`.

```bash
git clone https://github.com/XuHo-IT/Content-Agent-Kit.git
cd Content-Agent-Kit
cp .env.example .env        # .env đã gitignore, không bao giờ commit
```

| Cần | Khi nào |
|---|---|
| **Node ≥ 18** | luôn luôn |
| Python 3.12 + `pip install -r scripts/crawl/requirements.txt` | chỉ khi động vào crawler |
| **FFmpeg + ffprobe** và **Chrome** | chỉ khi động vào pipeline video |
| Một API key TTS *hoặc* server OmniVoice local | chỉ khi render video thật |

Phần lớn đóng góp **không cần** hai dòng cuối. Toàn bộ CI chạy offline, không key, không ffmpeg.

## Trước khi mở PR

Chạy đúng những gì CI chạy:

```bash
# 1. cú pháp — mọi script phải parse được
for f in $(find scripts -name "*.mjs"); do node -c "$f"; done

# 2. mọi CLI phải nạp được và có --help
for f in scripts/*/*.mjs scripts/*.mjs; do node "$f" --help >/dev/null || echo "FAIL $f"; done

# 3. script mẫu phải sạch ở chế độ nghiêm
node scripts/video/validate-script.mjs templates/VIDEO_SCRIPT.template.json --strict

# 4. bộ ký SigV4 của R2 phải khớp vector chuẩn của AWS
node scripts/media/host-check.mjs --selftest

# 5. không để lọt secret
git grep -nE "hook\.(eu|us)[0-9]*\.make\.com/[a-z0-9]|Bearer [A-Za-z0-9_-]{16,}" -- . ':!*.example'
```

Có động vào pipeline video thì **render thử và nhìn khung hình** — validator không nhìn được ảnh:

```bash
node scripts/video/render.mjs <script.json>
node scripts/video/contact-sheet.mjs <dir>/video.mp4
```

Bốn lỗi đã từng lọt vào video hoàn chỉnh mà validator không chặn được: B-roll lạc đề, tiêu đề in
hai lần, headline lặp nhãn, và một từ bị vỡ dòng. **Cả bốn đều lộ ra ngay trong contact sheet.**

## Quy ước của kit

Đây không phải sở thích cá nhân — chúng là lý do kit chạy được ở cả Claude Code lẫn Antigravity,
trên Windows lẫn Linux, mà không cần cài gì.

**Zero dependency.** Không thêm `package.json`, không thêm npm package. Node 18+ có sẵn `fetch`,
`FormData`, `Blob`, `crypto`. Cần ký AWS SigV4? Viết bằng `node:crypto` (đã có, đã kiểm chứng
với vector chuẩn). Ngoại lệ duy nhất là `npx hyperframes` — engine HTML→MP4 không thể tự viết
lại, và nó vốn được gọi qua `npx` chứ không phải cài vào.

**File script `.mjs`**, mở đầu bằng khối comment: một dòng mục đích, vài dòng ví dụ dùng, rồi
dòng `ENV:`. Mọi CLI phải hiểu `--help`. Xem `scripts/publish.mjs` làm mẫu.

**Env-only, không fallback.** Không bao giờ hardcode token/URL/key. Thiếu env thì `requireEnv()`
ném lỗi nói rõ thiếu biến nào và sửa ở đâu. Đây là bài học từ những agent thật mà kit này rút
ra — xem `docs/09-security.md`.

**Log kiểu `[tag] ✓ / ✗`**, cắt ngắn thân phản hồi HTTP trước khi in (`.slice(0, 300)`).
`409` luôn được coi là "đã xong rồi", không phải lỗi.

**Tài liệu song ngữ.** Mọi file trong `docs/` có phần `## English` rồi `## Tiếng Việt`. Sửa một
nửa thì sửa cả nửa kia.

**Đừng xoá `NOTICE.md`.** File ở gốc repo và trong từng thư mục `video-templates/*/` là **điều
kiện giấy phép** của mã Apache-2.0 và MIT được vendor vào, không phải phép lịch sự. Thêm template
kéo từ registry thì `add-template.mjs` tự sinh NOTICE — giữ nguyên.

**Mở rộng bằng registry, đừng bằng `if`.** Nhà cung cấp giọng, nguồn video, host upload đều là
bảng dữ liệu: thêm một file, thêm một dòng vào `index.mjs`. Xem `scripts/video/lib/tts.mjs`,
`scripts/media/lib/sources/`, `scripts/lib/media-hosts/`.

## Những đóng góp được hoan nghênh nhất

- **Nhà cung cấp giọng ở nước bạn** — kit hiện có OmniVoice, ElevenLabs, Vbee, FPT.AI, Viettel.
  Mọi API TTS đều rơi vào một trong ba khuôn (`bytes`, `asyncUrl`, `asyncJob`), nên thường chỉ
  là một file dữ liệu. Kèm kết quả `tts-check.mjs` chạy thật vào PR.
- **Template video mới** — hoặc tự viết, hoặc kéo từ registry HyperFrames rồi viết composition
  dọc 9:16 cho nó (7/8 example upstream là ngang). Xem `docs/16-template-registry.md`.
- **Luật craft** — bạn thấy AI viết script hay sai chỗ nào? Biến nó thành một luật máy kiểm được
  trong `scripts/video/lib/validate.mjs`, kèm thông báo **trích đúng câu vi phạm**.
- **Ngôn ngữ khác** — bảng đọc số trong `VIDEO_CRAFT` hiện dành cho tiếng Việt. TTS ngôn ngữ nào
  cũng có kiểu đọc sai riêng.
- **Chỗ tài liệu nói sai so với code.** Kit thay đổi nhanh; loại PR này rất được việc.

## Adapter chưa kiểm chứng

Vài adapter được viết theo tài liệu chính thức nhưng **chưa từng chạy với credential thật** —
hiện là Cloudflare R2, Cloudinary và Viettel AI. Chúng được đánh dấu `UNVERIFIED` ngay trong công
cụ (`host-check.mjs --hosts`, `tts-check.mjs --providers`).

Nếu bạn có tài khoản và chạy được, **PR chỉ đổi cờ đó thành verified kèm output thật là đóng góp
rất giá trị**. Ngược lại, nếu bạn thêm adapter mới mà chưa test được, hãy đánh dấu `UNVERIFIED` —
thà nói thật còn hơn để người sau tin nhầm.

## Commit và PR

Commit theo kiểu mệnh lệnh, ngắn: `feat: add Zalo TTS provider`, `fix: hero text wraps in
frame-build-minimal`, `docs: sync docs/14 with the 9-step pipeline`.

PR mô tả **cái gì đổi và vì sao**, kèm output của các lệnh kiểm chứng ở trên. Có động vào phần
nhìn thì đính kèm contact sheet — nhanh hơn mọi lời mô tả.

## Giấy phép

Đóng góp của bạn được phát hành theo [MIT](LICENSE), cùng giấy phép với dự án.
