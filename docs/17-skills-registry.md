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

### Remotion's own skills

Remotion maintains 11 first-party skills for writing Remotion well. `remotion-dev/skills`
ships **no licence file** — the API reports `license: null` and its `package.json` says
`"private": true`. The plugin mirror's `plugin.json` declares `"license": "MIT"`, but a string
in a manifest is not a licence grant over the files beside it.

Under the old rule that made them uninstallable. Under the rule as it stands they could be a
`unlicensed: true` entry — but they still are not listed here, for a different and better
reason: **they install to `.agents/skills/` and are versioned against the Remotion release you
are on**, which this registry cannot track.

```bash
npx remotion skills add             # or: npx skills add remotion-dev/skills
```

Run it from your Remotion project. `docs/20-video-backends.md` also covers Remotion's two-tier
licence, which matters more than the skills' do.

### The licence rule, and the day it turned out to be answering the wrong question

It used to be *no licence, no install*, on the grounds that a skill with no licence is a skill
nobody may legally reuse.

That reasoning is correct about **vendoring** and was being applied to **fetching**, which is a
different act. This page opens by saying it: *they are not vendored*. Nothing is copied into
this repository. The files land on the user's own disk, which is what `git clone` does — and
these upstreams publish install commands inviting exactly that. `vibe-motion/skills` prints
`npx skills add vibe-motion/skills` in its own README. Refusing to fetch what an author is
asking you to fetch protects nobody.

So the rule split in two:

| | |
|---|---|
| **carrying unlicensed work in this repo** | still refused, and that has not moved |
| **fetching it to your machine** | allowed — with the restriction stated, not implied |

An entry marked `"unlicensed": true` installs and prints:

```
[skills] ! vibe-motion/skills publishes NO LICENCE FILE.
[skills]   You may keep and run this copy. You may NOT redistribute it, ship it
[skills]   inside a product, or relicense it — absent a licence, all rights are
[skills]   reserved. Upstream invites the install; it has not granted anything more.
```

and writes the same sentence into the `NOTICE.md` beside the skill, so it survives after the
terminal scrollback is gone. What the installer refuses now is **vagueness**: an entry either
names a licence file or admits it has none. `tests/registry.test.mjs` also caps how many
entries may take the escape hatch — if most of the catalogue drifts into it, the warning stops
being read.

### `via: "skills"` — hand off rather than reimplement

Walking the contents API one file at a time is right for a handful of markdown files and
hopeless for a repository that is mostly a project. `video-shotcraft` is **181 MB**, and an
unauthenticated caller gets **60 API requests an hour**.

`skills` (MIT, on npm) is the installer both vibe-motion and Remotion tell people to use, so an
entry can delegate to it:

```bash
node scripts/install-skills.mjs video-shotcraft   # runs: npx -y skills add Vincentwei1021/video-shotcraft
```

It is interactive upstream — it asks which skills and which agent — so the terminal is
inherited rather than captured. Size is printed before it starts.

### Rules the installer enforces

- **No `SKILL.md`, no install.** That means the registry entry points at the wrong path.
- **A licence file, or an admission that there is none.** Never silence.
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

- **Không có `SKILL.md` thì không cài.** Nghĩa là mục trong registry trỏ sai đường dẫn.
- **Phải khai giấy phép, hoặc phải thừa nhận là không có.** Không được im lặng.
- **Không ghi đè** skill đã có, trừ khi truyền `--force`.

### Luật giấy phép đã đổi, và vì sao

Trước đây là *không giấy phép thì không cài*. Lý lẽ đó **đúng với việc chép vào repo** và bị
áp nhầm cho **việc tải về máy** — hai chuyện khác nhau. Ngay dòng đầu trang này đã viết:
*không vendor vào repo*. File rơi xuống máy của chính bạn, y như `git clone`, và **chính tác
giả in sẵn lệnh cài** trong README của họ (`npx skills add vibe-motion/skills`).

Nên luật tách làm hai:

| | |
|---|---|
| **repo này mang theo tác phẩm không giấy phép** | vẫn từ chối, phần này không đổi |
| **tải về máy bạn** | cho phép — kèm nói thẳng giới hạn |

Mục có `"unlicensed": true` sẽ cài được, in cảnh báo, và ghi luôn câu đó vào `NOTICE.md` bên
cạnh skill để nó còn lại sau khi cuộn terminal trôi mất: **bạn giữ và chạy bản này được; phân
phối lại, đóng gói vào sản phẩm, hay cấp phép lại thì không.**

Mục có `"via": "skills"` thì uỷ quyền cho `npx skills add <repo>` thay vì tự đi API — cần cho
repo lớn (`video-shotcraft` nặng **181 MB**, mà API không xác thực chỉ cho **60 request/giờ**).

Xoá thư mục là gỡ cài đặt. Không có gì khác thay đổi.
