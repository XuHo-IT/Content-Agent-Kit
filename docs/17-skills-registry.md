# 17 — Skill registry / Kho skill ngoài

## English

Skills from other projects that pair well with this kit. **They are not vendored.**

```bash
node scripts/install-skills.mjs --list          # the catalogue, and what you already have
node scripts/install-skills.mjs seo taste       # into ./.claude/skills/
node scripts/install-skills.mjs --all --global  # into ~/.claude/skills/
node scripts/install-skills.mjs seo --dry-run   # print what would be written
node scripts/install-skills.mjs seo --force     # re-fetch a newer version
```

Restart your agent afterwards — Claude Code reads the skills folder at startup.

### Why fetch instead of vendor

Copying these repositories in would mean carrying their licence obligations in this tree,
re-merging by hand every time upstream ships a fix, and adding megabytes for files most
users never open. The kit is zero-dependency by design; a catalogue plus an installer keeps
that true while making the skills one command away.

The trade is real and worth stating: **installing needs network**, and an upstream can
disappear. Nothing already installed breaks when that happens — the files are on your disk
with their licence and a NOTICE beside them.

### What an install writes

```
.claude/skills/seo/
├── SKILL.md          the skill itself, byte-for-byte from upstream
├── README.md         whatever else the upstream folder contained
├── assets/…
├── LICENSE           copied from the upstream repo root
└── NOTICE.md         written by this kit: source URL, commit sha, licence, date
```

The commit sha is pinned in the NOTICE rather than the branch name, because `main` moves
and a sha can still be diffed a year later.

Delete the folder to uninstall. Nothing else changes.

### The `fb-*` entries need a caveat

Three come from [facebook-skills](https://github.com/sergebulaev/facebook-skills) (MIT, part
of a family covering LinkedIn, Instagram, X, YouTube, TikTok and Threads). Two things to know
before installing one:

**They are written for Facebook Pages, in English.** The voice rules, the under-80-character
sweet spot and the vocabulary lists are English-language conventions. This kit publishes
Vietnamese, so treat them as a second opinion rather than as house rules. Concretely: their
catalogue calls the em dash the biggest AI tell of 2026, and this repo's own reference article
uses thirteen of them and reads well.

**Two skills are deliberately not listed.** `fb-audience-insights` and `fb-engagement-drafter`
need a paid Apify token to read real Page data. Everything in this registry should be runnable
without a subscription, so they are left out — install them from upstream directly if you have
an Apify account.

The forensic half of `fb-humanizer` is already built into `validate-post.mjs`; install the
skill when you want the English style rules on top.

### What the rule has actually excluded: Remotion

Remotion maintains 11 first-party skills for writing Remotion well. They are **not here**, and
the reason is worth stating so it does not read as an oversight.

`remotion-dev/skills` ships no licence file — the API reports `license: null`, and its
`package.json` says `"private": true`. The plugin mirror's `plugin.json` declares
`"license": "MIT"`, but a string in a manifest is not a licence grant over the files beside
it. The installer refuses, which is the rule working as designed.

Remotion's own command installs them in one line, from a Remotion project:

```bash
npx remotion skills add             # or: npx skills add remotion-dev/skills
```

That is the right route anyway — they install to `.agents/skills/` and are versioned with the
Remotion release you are on. See `docs/20-video-backends.md`, which also covers Remotion's
two-tier licence.

### Rules the installer enforces

- **No licence, no install.** If the upstream has no licence file at that commit it refuses,
  because a skill with no licence is a skill nobody may legally reuse.
- **No `SKILL.md`, no install.** That means the registry entry points at the wrong path.
- **Never overwrites** an existing skill without `--force`.

### Adding an entry

Add to `skills/registry.json`:

```json
"my-skill": {
  "repo": "owner/name",
  "ref": "main",
  "path": "skills/my-skill",   // "." for a repo whose root is the skill
  "installAs": "my-skill",     // folder name; lowercase-kebab
  "license": "MIT",
  "licenseFile": "LICENSE",
  "summary": "One line: what it does.",
  "why": "One line: why it belongs next to this kit."
}
```

`tests/registry.test.mjs` checks the shape offline — missing fields, two skills claiming the
same folder, a path that escapes the repo. It deliberately does **not** hit the network:
CI must not fail because someone else's repository is having a bad day.

### Rate limits

Unauthenticated GitHub API calls are capped at 60/hour. Installing everything in the
catalogue costs a handful. If you hit the cap, set `GITHUB_TOKEN` and retry — the installer
says so explicitly rather than failing with a bare 403.

---

## Tiếng Việt

Skill từ các dự án khác, dùng chung tốt với kit này. **Không vendor vào repo.**

```bash
node scripts/install-skills.mjs --list          # xem danh mục và những gì đã cài
node scripts/install-skills.mjs seo taste       # cài vào ./.claude/skills/
node scripts/install-skills.mjs --all --global  # cài vào ~/.claude/skills/
```

Cài xong nhớ khởi động lại agent — Claude Code chỉ đọc thư mục skill lúc khởi động.

### Vì sao tải về chứ không chép vào repo

Chép vào nghĩa là mang theo nghĩa vụ giấy phép của người khác, mỗi lần upstream sửa lại phải
merge tay, và repo phình lên vì những file phần lớn người dùng không mở tới. Kit này cố ý
zero-dependency; một danh mục cộng một trình cài giữ được điều đó mà vẫn cách skill đúng một
câu lệnh.

Đánh đổi có thật và cần nói rõ: **lúc cài phải có mạng**, và upstream có thể biến mất. Nhưng
thứ đã cài rồi thì không hỏng — file nằm trên đĩa của bạn, kèm giấy phép và NOTICE.

### Quy tắc trình cài bắt buộc

- **Không giấy phép thì không cài.** Skill không có giấy phép là skill không ai được phép
  dùng lại — đúng lỗ hổng mà RAG-EVAL-VN từng mắc.
- **Không có `SKILL.md` thì không cài.** Nghĩa là mục trong registry trỏ sai đường dẫn.
- **Không ghi đè** skill đã có, trừ khi truyền `--force`.

Xoá thư mục là gỡ cài đặt. Không có gì khác thay đổi.
