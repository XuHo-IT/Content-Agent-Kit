# 18 — Ads and marketing / Quảng cáo và marketing

## English

The kit publishes content and schedules content. Until now nothing told it **which content
was worth publishing**. This closes that loop from two directions: marketing skills that
decide what to make, and ads MCP servers that report what happened after it went out.

Both are optional. The kit runs end to end with neither connected.

### Ads MCP servers

`.mcp.json` declares five hosted [Pipeboard](https://pipeboard.co) servers — Meta, Google,
TikTok, Snap and Reddit. Claude Code reads that file on startup in this directory; other
clients want the same block under their own config name.

```bash
# Claude Code, if you prefer adding one by hand:
claude mcp add --transport http meta-ads https://meta-ads.mcp.pipeboard.co/
# then type /mcp to authenticate
```

**No credentials live in this repo.** Authentication is OAuth in your client. Pipeboard
never receives your Meta, Google or TikTok password, and nothing is written to a file git
can see — the same env-only rule every script in `scripts/` follows.

Delete a server block you do not use. An unreachable server is one more thing failing at
startup for no benefit.

**Two things worth knowing before you connect:**

- Pipeboard's own code is **Business Source License 1.1** — source-available, becoming
  Apache-2.0 in 2029. That does not restrict you as a user of the hosted service, but this
  kit says so rather than implying everything it suggests is MIT like the rest of the tree.
- These servers are **read and write**. The same connection that reads spend can pause a
  campaign or change a budget. Ask an agent for a plan before letting it act on a live
  account.

### The `ads-report` skill

`skills/ads-report/SKILL.md` ships with the kit. It reads the numbers and produces **a
decision about what to write next**, not a dashboard — a report ending at "CTR was 1.4%"
leaves the reader where they started.

It writes `brain/ads-report-<date>.md` with four sections that matter more than the metrics:

| Section | Why it is there |
|---|---|
| What worked | with the number *and* the sample size behind it |
| What did not | and what you would change, not just that it lost |
| **Not enough data** | listing these stops them being blindly re-tested next week |
| **Do not repeat** | the losing angles, with their numbers |

It proposes `queue.json` entries and then **stops and asks**. A skill that can see an account
spending real money does not get to set the content plan by itself.

### Marketing skills

Six entries in `skills/registry.json`, selected from
[`minhnv0807/ai-business-skills`](https://github.com/minhnv0807/ai-business-skills) (MIT,
63 skills, Vietnamese and English):

```bash
node scripts/install-skills.mjs mkt-context mkt-calendar mkt-ads-audit
```

| id | what it does | where it plugs in |
|---|---|---|
| `mkt-context` | product, audience, positioning | run first — every other one reads it |
| `mkt-calendar` | content calendar from a goal | fills the queue the scheduler already drains |
| `mkt-video-script` | hook, beats, CTA | the narrative half of a `script.json` |
| `mkt-ad-copy` | headlines, primary text, variants | what goes into the campaigns the MCP manages |
| `mkt-ads-audit` | account-level diagnosis | the depth `ads-report` hands off to |
| `mkt-design` | campaign visuals, infographics | the image side `brandkit` does not cover |

Only the six that plug into this kit's loop are listed. To add another, copy an entry in
`registry.json` and change `path`. Note the upstream default branch is **`master`**, not
`main` — which is why `ref` is per-entry.

### The loop, once both halves are connected

```
crawl → write → review gate → publish → ads report → next week's queue
                    ↑                                        │
                    └────────────────────────────────────────┘
```

---

## Tiếng Việt

Kit này viết và đăng nội dung. Nhưng đến giờ chưa có gì cho biết **nội dung nào đáng đăng**.
Phần này khép vòng đó từ hai phía: skill marketing quyết định làm gì, và MCP quảng cáo báo
lại chuyện gì đã xảy ra sau khi đăng.

Cả hai đều tuỳ chọn. Không nối gì thì kit vẫn chạy trọn vẹn.

### MCP quảng cáo

`.mcp.json` khai báo năm server [Pipeboard](https://pipeboard.co): Meta, Google, TikTok,
Snap, Reddit.

**Không có credential nào nằm trong repo.** Đăng nhập bằng OAuth ngay trong client
(`/mcp` với Claude Code). Pipeboard không nhận mật khẩu Meta/Google/TikTok của bạn, và không
có gì được ghi vào file mà git nhìn thấy — đúng nguyên tắc env-only của toàn bộ `scripts/`.

**Hai điều cần biết trước khi nối:**

- Mã nguồn của Pipeboard dùng **Business Source License 1.1** — nguồn mở xem được nhưng chưa
  phải open source, đến 2029 mới thành Apache-2.0. Điều này không hạn chế bạn khi dùng dịch
  vụ, nhưng kit nói rõ thay vì để bạn tưởng mọi thứ nó gợi ý đều MIT như phần còn lại.
- Các server này **đọc và ghi**. Cùng một kết nối đọc được chi phí thì cũng tạm dừng được
  chiến dịch hay đổi được ngân sách. Bắt agent trình bày kế hoạch trước khi cho đụng vào tài
  khoản thật.

### Skill `ads-report`

Đi kèm sẵn trong kit. Nó đọc số liệu rồi ra **quyết định viết gì tiếp theo**, không phải một
cái dashboard — báo cáo dừng ở "CTR 1,4%" thì người đọc vẫn đứng nguyên chỗ cũ.

Hai mục quan trọng nhất lại là hai mục ít ai viết: **"chưa đủ dữ liệu"** (để tuần sau khỏi
thử lại mù) và **"đừng lặp lại"** (kèm con số). Nó đề xuất mục cho `queue.json` rồi **dừng
lại hỏi** — một skill nhìn thấy tài khoản đang tiêu tiền thật thì không tự quyết kế hoạch
nội dung.
