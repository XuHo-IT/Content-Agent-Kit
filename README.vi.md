<div align="center">

# content-agent-kit

**Nói cho IDE agentic biết bạn muốn xuất bản gì. Nó đọc repo này rồi tự dựng agent.**

[![CI](https://github.com/XuHo-IT/Content-Agent-Kit/actions/workflows/ci.yml/badge.svg)](https://github.com/XuHo-IT/Content-Agent-Kit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg?style=flat-square)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-zero-0ea5e9?style=flat-square)](#zero-dependency-l%C3%A0-c%E1%BB%91-%C3%BD)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](#y%C3%AAu-c%E1%BA%A7u)
[![Discussions](https://img.shields.io/badge/Discussions-join-a855f7?style=flat-square&logo=github)](https://github.com/XuHo-IT/Content-Agent-Kit/discussions)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-f59e0b?style=flat-square)](CONTRIBUTING.md)

[English](README.md) · **🇻🇳 Tiếng Việt**

</div>

---

Bộ kit tái sử dụng để **dựng agent nội dung tự động** trong IDE agentic (**Claude Code** và
**Antigravity / Gemini**). Clone về, nói cho AI biết bạn muốn làm gì, nó đọc repo này rồi tự
dựng một agent riêng cho dự án của bạn: một *playbook* (nguồn sự thật duy nhất), file trạng
thái, script đăng bài, pipeline crawl tìm ý tưởng, đăng mạng xã hội, lịch chạy, một cổng review
trước khi đăng — và nếu bạn cần, **video dọc 9:16 có giọng đọc thật, cảnh quay stock và ảnh
chụp trang web**.

## Mô hình vận hành

```
                       ┌──────────── PLAYBOOK.md (nguồn sự thật duy nhất) ───────────┐
                       │  nhịp đăng · schema · chuẩn chất lượng · bậc · dọn dẹp     │
                       └─────────────────────────────────────────────────────────────┘
 (tuỳ chọn)                                     │ AI đọc lại mỗi lượt chạy
 [cron] → crawl.py (crawl4ai) → hàng đợi ý tưởng┤
          sources.yaml, dedup qua queue API     ▼
                              fan-out subagent → cổng REVIEW → đăng web + social (Make.com)
                                     │                              │
                              trạng thái: queue/ledger/history  báo cáo → brain/<id>/report.md

 (tuỳ chọn) item VIDEO đi thêm hai chặng trước cổng review:
     script.json → validate-script.mjs → resolve media ──► render.mjs → video.mp4
     (AI viết)     schema + luật craft    Pexels/Pixabay    TTS · SFX · template
                                          + ảnh chụp        · ffmpeg
```

**Bảy ý tưởng cốt lõi**, rút ra từ những agent chạy thật:

1. **Playbook là nguồn sự thật duy nhất.** Agent đọc lại `PLAYBOOK.md` mỗi lượt chạy — không bao giờ dựa vào trí nhớ hội thoại.
2. **Trạng thái là file phẳng.** `queue.json` (lịch), `ledger.json` (việc đang dở), `history.json` (chống trùng). Mọi thao tác **idempotent** — `409` nghĩa là "đã xong rồi".
3. **Cổng review.** Mọi item phải qua một **subagent review độc lập** trước khi đăng; trượt → sửa (2–3 vòng) → bỏ và ghi log.
4. **Chất lượng viết được cưỡng chế, không phải trông chờ.** File `WRITING_CRAFT.md` (giọng theo thể loại, danh sách sáo rỗng cấm, cặp trước/sau) được đọc *trước khi* viết, và **rubric đo được** của nó được chấm *trước khi* đăng. Đó mới là thứ khiến nội dung không đọc ra mùi AI.
5. **Tìm ý tưởng (tuỳ chọn).** Crawler `crawl4ai` nạp vào **hàng đợi ý tưởng**; server chính là bộ nhớ chống trùng, vì máy CI là phù du.
6. **Lịch chạy.** Mặc định là `cron` của GitHub Actions; `schtasks` trên Windows và scheduler in-process là hai lựa chọn thay thế.
7. **Bí mật chỉ nằm trong env.** Không token, webhook hay URL nào bị hardcode. `.env` đã gitignore, và thiếu biến thì báo lỗi rõ ràng chứ không âm thầm dùng giá trị thay thế.
8. **Video (tuỳ chọn).** AI viết *nội dung* (`script.json` — lời đọc và chọn template); code tất định lo *pixel*. Một validator chạy trước khi render biến luật soạn thảo thành lỗi máy kiểm được, nên script sai hỏng trong vài giây thay vì sau năm phút render.

## Bắt đầu nhanh

**Claude Code**

1. Clone repo này cạnh (hoặc vào trong) dự án của bạn.
2. Copy skill: `cp -r skills/* .claude/skills/` (hoặc trỏ Claude Code vào đó).
3. Chạy meta-skill **`/bootstrap-content-agent`** — AI phỏng vấn bạn rồi dựng agent mới.

**Antigravity / Gemini**

1. Clone repo này vào workspace.
2. Bảo agent: *"Đọc `AGENTS.md` và `docs/`, rồi dựng cho tôi một agent làm việc X."*
3. Nó đọc `skills/bootstrap-content-agent/SKILL.md` như một tài liệu chỉ dẫn thông thường.

Hằng ngày thì chạy **`/daily-run`** — hoặc `schedule-prompt.md` được sinh ra, đặt trên cron.

## Bên trong có gì

| Đường dẫn | Nội dung |
|---|---|
| `docs/` | Phương pháp luận, song ngữ EN + VI, 16 tài liệu ngắn — gồm **`12-writing-craft.md`**, `14-video-generation.md`, **`15-media-sources.md`** (B-roll và ảnh chụp) và **`16-template-registry.md`**. |
| `templates/` | Khung điền sẵn: `PLAYBOOK`, **`WRITING_CRAFT`**, **`VIDEO_CRAFT`**, `KNOWLEDGE`, **`VIDEO_SCRIPT.json`**, `sources.yaml`, file trạng thái, workflow cron. |
| `scripts/` | CLI **chạy được thật**: publish/append/update, queue client, `social/make-post` (ảnh **hoặc video**, đa nền tảng), `crawl/crawl.py`, `audit-quality`, scheduler, **`video/`** (validate, render, `tts-check`, `contact-sheet`, `add-template`) và **`media/`** (B-roll kho mở, ảnh chụp web, host upload). Tất cả env-only. |
| `video-templates/` | 14 template video HTML tự chứa cùng **`CATALOG.md`** — đủ slot và giới hạn ký tự từng cái. 146 template nữa chỉ cách một câu lệnh. |
| `skills/` | Skill cho Claude Code: **`bootstrap-content-agent`** (meta-skill), `daily-run`, `review-gate`, `audit-and-fix`, `crawl-and-queue`, **`create-video`**, **`video-and-post`**, **`research-and-capture`**. |
| `examples/ai-news-social/` | Một agent mẫu hoàn chỉnh: agent tin AI (crawl → viết → ảnh → web + Make.com → cron). |
| `examples/ai-video-social/` | Bản video của agent đó: crawl → `script.json` → render 9:16 → TikTok / Shorts / Reels. |

## Video

Tuỳ chọn, và **nằm hoàn toàn trong repo này** — không gọi dịch vụ ngoài, không phụ thuộc repo khác.

```bash
node scripts/video/tts-check.mjs                                          # nghe thử giọng trước
node scripts/video/validate-script.mjs brain/<slug>/script.json --strict  # vài giây
node scripts/video/render.mjs          brain/<slug>/script.json           # ~3–5 phút
node scripts/video/contact-sheet.mjs   brain/<slug>/video.mp4             # rồi NHÌN nó
node scripts/social/make-post.mjs --video brain/<slug>/video.mp4 \
     --post caption.txt --platforms tiktok,youtube_shorts --dry-run
```

**Giọng đọc.** `omnivoice` (local, miễn phí) · `elevenlabs` · `vbee` · `fptai` · `viettel` ·
`http` (adapter tổng quát, mô tả bất kỳ API TTS nào hoàn toàn bằng biến env). Chỉ cái local mới
cần dựng server — **những cái còn lại chỉ cần một API key**. `tts-check.mjs --providers` liệt kê
offline. Lời đọc được đánh vân tay theo provider, giọng, tốc độ và nội dung, nên đổi giọng thì
chỉ đọc lại đúng phần cần đọc lại; `render.mjs --estimate` cho biết số ký tự bị tính tiền trước
khi bạn tiêu.

**Cảnh quay thật và ảnh chụp thật**, để video thôi là mấy slide chữ đọc lên. Mỗi scene có thể
mang một khối `media` — clip stock từ Pexels/Pixabay, hoặc một trang web chụp lại làm bằng chứng:

```bash
node scripts/media/stock-search.mjs --query "data center servers"   # in ra clip đó QUAY GÌ
node scripts/media/screenshot.mjs --url "https://…" --out shot.png  # Chrome headless, zero-dep
```

Một lần tìm kiếm được giải rồi ghim vào `media-lock.json` cạnh script, nên cùng một `script.json`
luôn cho ra cùng một video — và file đó đồng thời là sổ ghi nguồn từng clip. Xem
**[`docs/15-media-sources.md`](docs/15-media-sources.md)**.

**Nhìn lại thứ mình vừa làm ra.** `contact-sheet.mjs` gom mỗi scene một khung có nhãn vào một
ảnh duy nhất. Bốn lỗi đã lọt vào video hoàn chỉnh mà không luật nào chặn được — B-roll lạc đề,
tiêu đề in hai lần, headline lặp nhãn, một từ bị vỡ dòng — và **cả bốn đều lộ ra trong một cái
nhìn**.

**Muốn sinh động hơn.** `node scripts/video/add-template.mjs --preset news` kéo về hiệu ứng
chuyển cảnh, caption động, lower-third và biểu đồ từ
[HyperFrames registry](https://github.com/heygen-com/hyperframes) (146 mục, Apache-2.0).
Xem **[`docs/16-template-registry.md`](docs/16-template-registry.md)**.

Hướng dẫn đầy đủ: **[`docs/14-video-generation.md`](docs/14-video-generation.md)**.

## Yêu cầu

| | Khi nào cần |
|---|---|
| **Node ≥ 18** | luôn luôn |
| Python 3.12 + `scripts/crawl/requirements.txt` | chỉ khi crawl tìm ý tưởng |
| **FFmpeg + ffprobe** và **Chrome/Chromium** | chỉ khi dùng pipeline video |
| Một API key TTS *hoặc* server OmniVoice local | chỉ khi render video thật |

Render cần máy thật — **GitHub Actions không làm được**. Xem
[`docs/06-scheduling.md`](docs/06-scheduling.md).

### Zero-dependency là cố ý

**Không có `package.json`, không có `node_modules`.** Mọi thứ chạy trên một bản Node trần —
đó chính là lý do kit copy được vào bất kỳ dự án nào và đọc được bởi bất kỳ IDE agentic nào mà
không cần bước cài đặt. Thứ duy nhất không thể tự viết lại — engine HTML→MP4 — được `npx` tải về
lúc render và đã ghim phiên bản.

Ràng buộc này chịu lực thật chứ không phải để làm màu: chẳng hạn phần ký AWS SigV4 cho
Cloudflare R2 được viết bằng `node:crypto` và đối chiếu với chính vector chuẩn AWS công bố
(`node scripts/media/host-check.mjs --selftest`).

## An toàn

- **Không bao giờ commit `.env`.** Script chỉ đọc env; thiếu biến thì báo lỗi rõ ràng, không âm thầm thay thế.
- **URL webhook Make.com chính là bí mật** — nó không có header xác thực. Ai biết URL thì đăng được lên kênh của bạn. Đối xử với nó như mật khẩu.
- **Bản quyền:** crawler chỉ lưu **trích đoạn** (≤1500 ký tự) kèm link nguồn, không bao giờ lưu toàn văn. Hãy viết lại và tóm tắt bằng lời của bạn.

Mô hình đầy đủ và cách báo lỗi bảo mật: **[`SECURITY.md`](SECURITY.md)**.

## Đóng góp

Đóng góp giá trị nhất thường đến từ người đã thực sự chạy nó — một nhà cung cấp giọng ở nước
bạn, một template mới, hay một luật craft mà bạn thấy AI hay vi phạm. **Không có bước cài đặt**:
clone rồi chạy. CI cũng chạy offline, không cần key nào.

- 🐛 Lỗi và đề xuất → [Issues](https://github.com/XuHo-IT/Content-Agent-Kit/issues)
- 💬 Hỏi đáp, khoe agent bạn dựng, bàn ý tưởng chưa rõ hình hài → [Discussions](https://github.com/XuHo-IT/Content-Agent-Kit/discussions)
- 📋 Quy ước và các lệnh kiểm chứng → [`CONTRIBUTING.md`](CONTRIBUTING.md)
- 🔐 Lỗi bảo mật → **đừng mở issue**, xem [`SECURITY.md`](SECURITY.md)

**Adapter chưa kiểm chứng.** Cloudflare R2, Cloudinary và Viettel AI được viết theo tài liệu
chính thức nhưng **chưa từng chạy với credential thật**. Chúng tự khai điều đó trong
`host-check.mjs --hosts` và `tts-check.mjs --providers`. Nếu bạn có tài khoản và xác nhận được
một trong số đó chạy, PR đổi cờ ấy là đóng góp rất được việc.

## Giấy phép

MIT — xem [`LICENSE`](LICENSE).

Pipeline video và các template kế thừa từ mã nguồn mở MIT / Apache-2.0
([AI-auto-generate-video](https://github.com/huytranvan2010/AI-auto-generate-video),
[nexu-io/html-video](https://github.com/nexu-io/html-video),
[heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)). Phần ghi công nằm ở
**[`NOTICE.md`](NOTICE.md)** và trong từng `video-templates/*/NOTICE.md` — hãy giữ nguyên các
file đó, chúng là **điều kiện giấy phép** chứ không phải phép lịch sự.
