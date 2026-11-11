# 29 — Bắt đầu nhanh: cài skill và dùng lần đầu / Quick start

## Tiếng Việt

Trang này dành cho người mới, không cần biết lập trình. Làm theo thứ tự: **chuẩn bị → cài →
kiểm tra → dùng thử**. Mất khoảng 10–15 phút cho lần đầu.

### 1. Chuẩn bị (một lần)

| Cần | Cách cài | Để làm gì |
|---|---|---|
| Claude Code (hoặc Antigravity) | [claude.com/claude-code](https://claude.com/claude-code) | trợ lý AI chạy các skill |
| Node.js | Windows: `winget install OpenJS.NodeJS.LTS` · macOS: `brew install node` | chạy các lệnh `node scripts/…` |
| FFmpeg | Windows: `winget install Gyan.FFmpeg` · macOS: `brew install ffmpeg` | chỉ cần nếu làm video |
| Google Chrome | đã có trên hầu hết máy | dựng khung hình video |

Cài xong, **đóng và mở lại** cửa sổ dòng lệnh để máy nhận Node và FFmpeg.

### 2. Cài skill — chọn MỘT trong ba cách

Claude Code chỉ đọc skill trong thư mục `.claude/skills/` hoặc từ plugin. Tải bộ kit về rồi mở
ra thôi **chưa đủ** để có skill — cần thêm một bước dưới đây.

**Cách A — Plugin (dễ nhất, tự cập nhật).** Trong Claude Code, gõ lần lượt:

```
/plugin marketplace add XuHo-IT/Content-Agent-Kit
/plugin install content-agent-kit@content-agent-kit
```

Khởi động lại Claude Code. Skill hiện với tên có tiền tố, ví dụ `/content-agent-kit:story-video`.

**Cách B — Tải kit về và cài vào máy.** Tải ZIP (nút **Code → Download ZIP**) hoặc
`git clone`, mở thư mục kit, rồi chạy:

```bash
node scripts/install-skills.mjs --kit --global   # cài cả 26 skill, dùng được ở mọi thư mục
node scripts/install-skills.mjs --kit            # hoặc: chỉ dùng trong thư mục kit này
node scripts/install-skills.mjs --kit story-video ads-policy-check   # hoặc: chỉ vài skill
```

Mỗi skill được cài kèm file `.kit-root` ghi đường dẫn tới kit, để skill biết chạy lệnh ở đâu
khi bạn dùng nó từ thư mục khác. **Đừng xoá hay di chuyển thư mục kit sau khi cài** — nếu lỡ
chuyển, chạy lại lệnh trên với `--force`.

**Cách C — Antigravity / Gemini.** Mở thư mục kit. AI tự đọc `AGENTS.md` và dùng các file
`skills/*/SKILL.md` như tài liệu hướng dẫn — không cần cài gì thêm.

### 3. Kiểm tra đã cài được chưa

Mở phiên Claude Code mới và hỏi: *"Bạn có những skill nào của content-agent-kit?"* — AI sẽ liệt
kê. Hoặc gõ `/` và tìm `story-video`, `create-video`, `ads-policy-check`.

Kiểm tra máy đủ đồ nghề làm video:

```bash
node --version       # cần từ 18 trở lên
ffmpeg -version      # có in ra phiên bản là được
```

### 4. Dùng thử — chỉ cần nói

| Bạn muốn | Hãy nói | Skill sẽ chạy |
|---|---|---|
| Biết hôm nay có gì hot | *"Hôm nay có gì hot về thời trang công sở?"* | `topic-radar` |
| Làm một video ngắn | *"Làm video 60 giây về cách chọn size áo online"* | `create-video` |
| Video kể chuyện thương hiệu | *"Làm video câu chuyện thương hiệu cho shop, có bước ngoặt"* | `story-video` |
| Soát quảng cáo trước khi chạy | *"Soát chính sách mấy mẫu quảng cáo này"* (dán nội dung) | `ads-policy-check` |
| Lọc bình luận quảng cáo | *"Lọc bình luận hôm qua"* (gửi file xuất bình luận) | `ads-comment-triage` |
| Xem mẫu quảng cáo nào đang đuối | *"Mẫu nào đang đuối?"* (gửi file xuất Ads Manager) | `ads-fatigue-watch` |

### 5. Khi skill chạy, bạn sẽ thấy gì

Mỗi skill có một bảng các bước. AI sẽ:

1. **Nói trước** skill làm gì, mất bao lâu, bạn cần chuẩn bị gì.
2. **Báo từng bước**: *"Bước 2/5 — Kiểm tra kịch bản: đang soát lỗi trước khi dựng…"*
3. **Chỉ hỏi một việc mỗi lần** khi cần bạn (dán số liệu, chọn câu, duyệt bản nháp).
4. **Dừng lại hỏi bạn** trước mọi việc không rút lại được: đăng bài, sửa quảng cáo thật, ẩn
   bình luận, gửi tin cho KOC.
5. **Kết thúc** bằng: kết quả nằm ở đâu, việc nên làm tiếp.

Thời gian tham khảo: soát kịch bản vài giây; dựng một video 60–90 giây khoảng 3–5 phút.

### 6. Hay vướng

| Gặp | Cách gỡ |
|---|---|
| Gõ `/` không thấy skill | Khởi động lại Claude Code. Cách A: gõ `/plugin` xem đã bật chưa. Cách B: chạy lại lệnh cài |
| `node` hoặc `ffmpeg` "not recognized" | Đóng và mở lại cửa sổ dòng lệnh sau khi cài; vẫn lỗi thì khởi động lại máy |
| Skill chạy lệnh báo không thấy `scripts/…` | Thư mục kit đã bị chuyển — chạy lại `install-skills.mjs --kit --global --force` từ chỗ mới |
| Video không có tiếng hiệu ứng | Tải gói âm thanh miễn phí một lần: `node scripts/video/sfx-cc0.mjs` |
| AI nói cần "authorize" Meta / Canva | Các kết nối đó tuỳ chọn; gõ `/mcp` để đăng nhập. Không có vẫn dùng được bằng file xuất |

### 7. Cập nhật

- Cách A: `/plugin marketplace update content-agent-kit`, rồi khởi động lại.
- Cách B: tải bản mới (hoặc `git pull`), rồi `node scripts/install-skills.mjs --kit --global --force`.

---

## English

Three ways to get the kit's 26 skills into your assistant. Claude Code only loads skills from
`.claude/skills/`, `~/.claude/skills/` or a plugin, so opening the folder is not enough:

- **Plugin** — `/plugin marketplace add XuHo-IT/Content-Agent-Kit`, then
  `/plugin install content-agent-kit@content-agent-kit`; skills appear as
  `/content-agent-kit:<name>`.
- **Copy** — `node scripts/install-skills.mjs --kit [--global] [<name>…]`. Each copy gets a
  `.kit-root` file holding the kit's path, because the skills run `node scripts/…` from there.
- **Antigravity / Gemini** — open the folder; `AGENTS.md` routes to `skills/*/SKILL.md`.

Every skill opens with a "Hướng dẫn từng bước cho người dùng" table the agent narrates as
"Bước n/N", asks for one thing at a time, and stops before anything irreversible.
`tests/wiring.test.mjs` keeps every skill carrying one, and checks every skill's frontmatter
parses as YAML — `ads-report` once shipped with a stray `: ` that made Claude Code drop its name
and description, so it never triggered.
