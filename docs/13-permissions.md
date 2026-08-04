# 13 — Permissions & auto-accept / Quyền hạn & tự động chấp nhận

## English

A scheduled agent runs unattended, so it needs to act without a human clicking "approve"
on every step — but "unattended" must not mean "unlimited". Scope the power to the job.

### Auto-accept the RIGHT way
- **`acceptEdits` + a tight allow-list**, never `bypassPermissions`. A content agent that
  crawls the web ingests untrusted text — prompt-injection is a real risk, so a blanket
  "yes to everything" is dangerous.
- **Allow only the scripts the job needs**: the publish/append/update/list CLIs, the queue
  client, the social poster, the crawl script, the audit script, a type-check. Nothing else.
- **Deny destructive / out-of-scope commands** outright: file deletion (`rm`, `Remove-Item`,
  `del`, `rmdir`), `git push --force` / `reset --hard` / `clean`, task-scheduler deletion,
  raw DB (`psql`, `DROP` / `TRUNCATE` / `DELETE FROM`, `supabase db reset`), arbitrary `curl`.
- **Stay in scope.** Only touch the files/records for today's items. Do not edit machine
  config, secrets, or infrastructure. If a task seems to need a denied command → **STOP and
  log it in the report**, don't work around it.

Example (Claude Code `.claude/settings.local.json`), shape only — adapt the names:
```jsonc
{
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": [
      "Bash(node scripts/publish.mjs:*)", "Bash(node scripts/append.mjs:*)",
      "Bash(node scripts/update.mjs:*)", "Bash(node scripts/list-published.mjs:*)",
      "Bash(node scripts/queue-client.mjs:*)", "Bash(node scripts/social/make-post.mjs:*)",
      "Bash(node scripts/audit-quality.mjs:*)", "Bash(python scripts/crawl/crawl.py:*)"
    ],
    "deny": [
      "Bash(rm:*)", "Bash(Remove-Item:*)", "Bash(git push --force:*)",
      "Bash(git reset --hard:*)", "Bash(:*DROP TABLE*)", "Bash(:*DELETE FROM*)",
      "Bash(psql:*)", "Bash(curl:*)"
    ]
  }
}
```

### Subagent tool-sandbox limitation
Fan-out subagents typically run in a **restricted sandbox and cannot call the native
image-generation tool** (it throws "invalid tool call"). Pattern: the writing subagent
returns an `image_prompt` field (English description) and leaves `image` blank; the
**parent** generates the image from that prompt and fills it in before publishing.

### Who may merge — the `Author gate` check

A pull request opened by anyone other than the repository owner, `github-actions[bot]` or
`dependabot[bot]` fails the **Author gate** check until a maintainer adds the `reviewed`
label. `Author gate` is a required status check, so a red one blocks the merge button.

It gates **merging, not contributing.** `CONTRIBUTING.md` invites small pull requests
outright and that stays true — the check's own output says so, because a red X with no
explanation reads as rejection.

Trusted without a label:

| | why |
|---|---|
| the repository owner | the only account with write access |
| `github-actions[bot]` | opens `chore/registry-sync`, whose diff is a snapshot and six numbers |
| `dependabot[bot]` | configured here for `github-actions` and `pip`; without it every security bump would need hand-labelling |

**This is not a security boundary, and calling it one would be worse than not having it.**
`enforce_admins` is `false` and `required_approving_review_count` is `0`, so the owner can
merge straight past a red check. What it buys is that an unreviewed outside change cannot be
merged *by accident*, and that the state is visible on the PR rather than remembered.

Raising the review count to 1 is deliberately **not** the fix: GitHub does not let anyone
approve their own pull request, so on a solo-maintained repo it would lock the maintainer out
of their own main branch — including from Dependabot's security bumps.

### Actions permissions, in `repo-about.json`

`.github/workflows/registry-watch.yml` opens a pull request, which needs the repo-level
switch shown in the UI as *"Allow GitHub Actions to create and approve pull requests"*. It
defaults to **off**, and with it off the API refuses no matter what the workflow's own
`permissions:` block asks for.

It is recorded in `.github/repo-about.json` under `actions` and applied by
`node .github/apply-about.mjs --apply`, rather than clicked once and forgotten. The default
token permission stays `read`: a workflow that needs more asks in its own `permissions:`
block, where the request shows up in a diff instead of being granted to everything at once.

---

## Tiếng Việt

Agent chạy theo lịch (không người trực) nên phải hành động mà không cần bấm "duyệt" từng
bước — nhưng "không người trực" KHÔNG có nghĩa là "toàn quyền". Giới hạn quyền đúng tác vụ.

### Tự động chấp nhận ĐÚNG cách
- **`acceptEdits` + allow-list chặt**, KHÔNG dùng `bypassPermissions`. Agent crawl web nạp
  văn bản không tin cậy → rủi ro prompt-injection; "đồng ý tất" là nguy hiểm.
- **Chỉ cho phép script tác vụ cần**: publish/append/update/list, queue client, social poster,
  crawl, audit, type-check. Không gì khác.
- **Chặn lệnh phá huỷ / ngoài phạm vi**: xoá file (`rm`/`Remove-Item`/`del`/`rmdir`),
  `git push --force`/`reset --hard`/`clean`, xoá scheduled task, DB thô (`psql`, `DROP`/
  `TRUNCATE`/`DELETE FROM`, `supabase db reset`), `curl` tuỳ tiện.
- **Giữ đúng phạm vi.** Chỉ đụng file/record của bài hôm nay. Không sửa config máy, secrets,
  hạ tầng. Gặp việc cần lệnh bị chặn → **DỪNG + ghi report**, không lách.

### Giới hạn sandbox của subagent
Subagent fan-out thường chạy **sandbox hạn chế, KHÔNG gọi được tool sinh ảnh** (báo "invalid
tool call"). Cách làm: subagent viết trả về field `image_prompt` (mô tả tiếng Anh), để trống
`image`; **parent** sinh ảnh từ prompt đó rồi điền vào trước khi đăng.
