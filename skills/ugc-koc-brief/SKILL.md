---
name: ugc-koc-brief
description: Write briefs for KOC / UGC creators making fashion content to run as ads — the hook bank (try-on, haul, OOTD, GRWM, "1 món 3 cách phối", size-honest review), shot list, do/don't, deliverables and specs, usage rights and partnership-ads (whitelisting) terms, and paid-partnership disclosure. Use when the user says "brief KOC", "brief KOL", "thuê KOC", "booking KOC", "UGC", "video review từ khách", "partnership ads", "quảng cáo đối tác", "creator brief". Produces documents; does not contact anyone.
---

# UGC / KOC brief — content that looks like a person, licensed like an ad

UGC-style video from real people is the format fashion ads keep returning to: a real body, a real
room, someone turning around in the mirror. It only works as an **ad** if the brief gets the
first 3 seconds and the rights right.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Đọc thông tin sản phẩm | Đọc `KNOWLEDGE.md`: chất liệu, size, giá, ưu đãi | Bổ sung thông tin còn thiếu |
| 2. Chọn hook | Đề xuất 3 hook (mặc thử nói size, 1 món 3 cách phối, GRWM…) | Chọn hook muốn test |
| 3. Viết brief | Mục tiêu, thông tin bắt buộc, danh sách cảnh quay, nên/không nên, file cần giao | — |
| 4. Soát chính sách | Chạy lời thoại qua `ads-policy-check` | — |
| 5. Ghi quyền sử dụng | Thời hạn, nền tảng, partnership ads, gắn nhãn hợp tác trả phí | Chốt thời hạn và phí với KOC |
| 6. Lưu brief | Ghi `briefs/<koc>-<sản-phẩm>-<ngày>.md` | Tự gửi cho KOC — agent không liên hệ ai |

**Hay vướng:**
- Thiếu điều khoản quyền sử dụng → không chạy quảng cáo bằng video đó được; ghi rõ trước khi quay.
- KOC so sánh trước/sau cơ thể hoặc nói "bạn béo thì…" → Meta từ chối; ghi vào mục không nên.
- Nhạc trong video không có bản quyền quảng cáo → dùng thư viện nhạc thương mại hoặc bỏ nhạc.

## 1. Before writing

Read `KNOWLEDGE.md` (product, voice, price, size chart) and, if available, the last
`ads-creative-lab` round — the brief should test the hook/angle the data says to test next.

## 2. The brief (one page per creator)

1. **One sentence goal:** "Video 9:16, 20–30s, làm người xem tin váy linen mặc đi làm cả ngày vẫn mát."
2. **Product facts** the creator must get right (fabric, sizes they wear, price, offer, dates).
3. **Hook — pick one, film 3 takes:**
   - try-on: "Mình 1m58 52kg, mặc size M nè" (size-honest — the question every comment asks)
   - "1 chiếc váy, 3 cách phối cho cả tuần"
   - POV: "đồng nghiệp hỏi váy mua ở đâu"
   - GRWM đi làm / đi hẹn hò
   - haul: unbox → mặc thử → nhận xét thật cả điểm chưa ưng
   - đọc bình luận khách hỏi rồi trả lời bằng cách mặc thử
4. **Shot list:** hook (0–3s, face + product in frame) · full-body turn · fabric close-up in
   daylight · movement (walk, sit) · detail (zip, pocket, lining) · reaction/verdict · CTA.
5. **Do:** natural light, own voice, real body, say height/weight if comfortable, show the label.
   **Don't:** before/after body comparisons, "bạn béo/lùn thì…", claims of slimming, other brands'
   logos, music they do not have rights to for ads (use the platform's commercial library or none).
6. **Deliverables:** 1 main video + 3 alternative hooks (first 3s only) + raw clips; 9:16 1080×1920,
   no burned-in captions (the team adds them), no platform watermark.

Run the script/talking points through `ads-policy-check` before sending.

## 3. Rights — written, before the shoot

- **Usage:** paid ads on Facebook/Instagram (and other platforms if needed), duration (e.g. 3 or 6
  months), territories, edits allowed (cut, captions, music).
- **Partnership ads (whitelisting):** the creator grants access so the ad runs from their handle;
  state the duration and that they can see the ad.
- **Disclosure:** organic posts use the platform's paid-partnership label; ads made with
  partnership ads carry it automatically. Never present a paid review as an unprompted customer.
- Payment, deadline, revision rounds (max 1–2), who owns raw files.
- **Livestream selling:** under the e-commerce law (122/2025/QH15) and Nghị định 248/2026/NĐ-CP
  (reported in force 2026-07-01) the person selling on a live stream must be identity-verified
  on the platform BEFORE going live, and is answerable for the claims they make. Put it in the
  brief; claims on a live follow the same rules as an ad (`ads-policy-check`).
- **AI in the content:** a cloned voice or AI-altered face of the creator needs their written
  consent AND the AI label (Luật Trí tuệ nhân tạo, Điều 11) — see `review-gate` → Policy.

The footage then goes through `talking-head` / `autocut` (`docs/26-auto-edit.md`) for captions and
cuts, with the creator credit kept as agreed.

## 4. Output

`briefs/<creator>-<product>-<date>.md`. The agent does not message creators or agree fees.
