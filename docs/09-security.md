# 09 — Security / Bảo mật

## English

**Env-only. Always.** Every secret — API tokens, webhook URLs, image-host accounts,
DB service keys — comes from environment variables. This kit has **zero** hardcoded
fallbacks: a missing var throws a clear error (see `scripts/lib/env.mjs`).

> Anti-pattern to avoid: the agents this kit generalizes had a hardcoded
> `INGEST_API_TOKEN` fallback and a hardcoded Make.com webhook URL baked into script
> source. If that repo ever went public, the token + webhook would leak. Don't do that.

**Checklist**
- `.env` is git-ignored; only `.env.example` (key names, no values) is committed.
- State files (`queue`/`ledger`/`history`), `scratch/`, `brain/`, `*.log` are git-ignored.
- CI (GitHub Actions) reads secrets from repo Settings → Secrets, never from the repo.
- Before pushing, grep the repo for accidental secrets:
  `grep -rniE "hook\.(eu|us)[0-9]*\.make\.com|Bearer [A-Za-z0-9]|api_key|secret" --include=*.{js,mjs,cjs,py,ts,md,json}`
- Image uploads use **unsigned** Cloudinary presets or Catbox (no secret key needed
  client-side).

---

## Tiếng Việt

**Env-only. Luôn luôn.** Mọi secret — token API, webhook URL, tài khoản image-host,
key DB — đều lấy từ biến môi trường. Kit này **không** có fallback hardcode: thiếu biến
→ báo lỗi rõ (`scripts/lib/env.mjs`).

> Anti-pattern cần tránh: agent gốc từng hardcode `INGEST_API_TOKEN` fallback + URL
> webhook Make.com thẳng trong source. Repo mà public là lộ token + webhook. Đừng làm.

**Checklist**
- `.env` gitignore; chỉ commit `.env.example` (tên biến, không giá trị).
- State (`queue`/`ledger`/`history`), `scratch/`, `brain/`, `*.log` gitignore.
- CI đọc secret từ repo Settings → Secrets, không từ repo.
- Trước khi push, grep tìm secret lỡ lọt (lệnh ở bản EN).
- Upload ảnh dùng preset Cloudinary **unsigned** hoặc Catbox (không cần key phía client).
