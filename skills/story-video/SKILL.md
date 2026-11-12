---
name: story-video
description: Make a 9:16 video that tells a STORY — a brand story, a customer story, a legend or history, a case breakdown — instead of listing facts, using the kit's storytelling templates (frame-story-*) and story genres. Use when the user says "video kể chuyện", "storytelling", "câu chuyện thương hiệu", "kể chuyện khách hàng", "video về lịch sử / nguồn gốc", "làm quảng cáo dạng kể chuyện", "brand story", "origin story", "customer story video", or when a create-video request has a before/after, a turn, or a person at its centre. Writes script.json on a story arc, validates, renders, and hands off to the review gate.
---

# Story video

A list of facts gets watched until the viewer has the gist. A story gets watched until it
ends, because the viewer wants to know how it ends. This skill is `create-video` with one
change: **the script is written on an arc first, and the frames are picked by the beat they
carry, not by how they look.**

Do everything `skills/create-video/SKILL.md` says (read `VIDEO_CRAFT`, read `CATALOG.md`,
validate before rendering, never `--skip-validate`). This file adds what is specific to story.

## Hướng dẫn từng bước cho người dùng

> Chạy lệnh `node scripts/…` ở **thư mục gốc của kit** — thư mục có `AGENTS.md`, hai cấp trên file này (nếu skill được cài bằng `install-skills.mjs --kit`, đường dẫn nằm trong file `.kit-root` cạnh file này).

Dẫn người dùng theo đúng các bước dưới, bằng lời đơn giản. Trước khi bắt đầu: một câu nói skill sẽ làm gì, mất khoảng bao lâu, cần người dùng chuẩn bị gì. Đầu mỗi bước báo **"Bước n/N — <tên bước>"** kèm một câu đang làm gì. Khi cần người dùng làm gì, chỉ hỏi đúng một việc. Kết thúc: kết quả nằm ở đâu và việc nên làm tiếp.

| Bước | Agent làm gì | Người dùng cần làm |
|---|---|---|
| 1. Lấy âm thanh (một lần) | Chạy `node scripts/video/sfx-cc0.mjs` tải 27 âm thanh CC0 | — |
| 2. Tìm câu chuyện | Hỏi 5 điều: ai, muốn gì, vướng gì, bước ngoặt, sau đó ra sao | Kể câu chuyện, kèm ngày tháng, con số thật |
| 3. Dựng mạch | Chia thành 6 nhịp, mỗi nhịp một scene 25–40 từ đọc | Duyệt dàn ý |
| 4. Chọn khung | Chọn `frame-story-*` theo nhịp, bắt đầu từ một thể loại kể chuyện | — |
| 5. Kiểm tra | `validate-script.mjs --strict` (vài giây), xem ảnh bằng `template-sheet.mjs --script` | Xem ảnh khung hình |
| 6. Render | `render.mjs` (3–5 phút) | — |
| 7. Kiểm duyệt | Qua `review-gate` trước khi đăng | Duyệt video |

**Hay vướng:**
- Thư cảm ơn hay lời khen của khách phải là tin nhắn thật, được phép dùng → không có thì chọn khung khác, không bịa.
- Số liệu chưa có thật → ghi "số minh hoạ" ngay trên khung hình.
- Không nghe thấy âm thanh → chưa chạy `sfx-cc0.mjs`, hoặc ghi `sfx` sai dạng `{ "name": "transition/cc0-paper-riffle" }`.

## 1. Find the story before writing a line

Ask, or find in the source, these five things. If two are missing, it is not a story yet —
say so and offer `create-video` with a list genre instead of padding.

| | question | a weak answer | a strong answer |
| --- | --- | --- | --- |
| **who** | whose story is it? | "our customers" | "Lan, a teacher in Huế who wears size L" |
| **want** | what did they want? | "good clothes" | "one dress she could teach in and go out in" |
| **in the way** | what stopped them? | "the market is competitive" | "every size L online fit like a size M" |
| **turn** | what changed, and when? | "we launched a product" | "March 2021, we re-cut every pattern on real bodies" |
| **after** | how is it now, concretely? | "customers are happy" | "her third order, same size, no return" |

Specific beats general every time: a date, a place, a number, a name (with permission).

## 2. Put it on an arc

Six beats, roughly 60–75 seconds. Each beat is one scene of 25–40 spoken words — the
validator's limit — so the arc is also the scene list.

```
hook ─▶ setup ─▶ in the way ─▶ TURN ─▶ proof ─▶ payoff / CTA
 3s       8s        8s          8s       8s        6s
```

- **The hook gives away the ending or the stakes, not the topic.** "Ba năm trước, cửa hàng này
  còn đúng hai tháng tiền thuê" — not "Câu chuyện thương hiệu X".
- **Open a loop in the hook and close it at the payoff.** If scene 1 asks a question, the last
  body scene answers it in the same words.
- **The turn is the one beat a story cannot lose.** If you must cut, cut setup.
- **Proof is a number or a voice, never an adjective.** "73% đánh giá nhắc chữ *vừa người*" or
  a customer's real message. If the number is illustrative, the template's source slot says so.

## 3. Pick frames by beat

`templates/VIDEO_GENRES.template.json` has four story genres that already put these in order —
start from one of them and change what the story needs:

| genre | for | arc in frames |
| --- | --- | --- |
| `brand-story` | why the brand exists | one-line → swiss-chapter → world-pan → page-turn → pencil-chart → letter → kinetic-floor |
| `customer-story` | a storytelling AD | comic-panels → page-turn → halftone-case → letter → trend-price-drop |
| `legend` | history, heritage, a craft | sand → silent-film → frieze → swiss-chapter → kinetic-floor |
| `case-breakdown` | what happened and why | halftone-case → rundown → telestrator → pencil-chart → step-numeral → statement-outro |

Beat → frame, when you build your own order:

| beat | frames | what the frame does for the story |
| --- | --- | --- |
| hook: the whole arc | `frame-story-one-line` | one pen line draws start → struggle → payoff, each named |
| hook: a recognisable moment | `frame-story-comic-panels` | three panels, the third breaks with a sound word |
| hook: a memory / a year | `frame-story-sand` | words brushed out of sand on a lit table |
| hook: the question | `frame-story-halftone-case` | case file: question, claim, exhibit, stamp |
| setup / chapter | `frame-story-swiss-chapter`, `frame-story-silent-film` | dated chapter card; or an intertitle — "Meanwhile…" |
| what nobody saw | `frame-story-world-pan` | camera dives from the result into the roots |
| **the turn** | `frame-story-page-turn` | the old way's page turns to reveal the new |
| the decisive moment | `frame-story-telestrator` | freeze, ring the key words, label the finding |
| proof | `frame-story-pencil-chart`, `frame-story-halftone-case` | one number drawn to scale; the exhibit, stamped |
| a voice | `frame-story-letter` | a real message, hand-written on screen |
| a saga in four acts | `frame-story-frieze` | four panels round a turning vase |
| lesson | `frame-story-step-numeral` | numbered lesson, key words big |
| where we are | `frame-story-rundown` | rundown with covered points ticked off — use twice |
| climax / last line | `frame-story-kinetic-floor` | each line a floor, the final word stands on top |

Mixing in the rest of the library is fine and usually good — `frame-trend-word-pop` for a
spoken one-liner, `frame-broll` for real footage of the place. Two story frames with the same
device back to back (two letters, two chapter cards) read as a stall.

## 4. Sound carries half of it

Fetch the CC0 pack once — `node scripts/video/sfx-cc0.mjs` (free for commercial use, no credit
needed) — then name sounds per scene as `"sfx": { "name": "transition/cc0-paper-riffle", "volume": 0.5 }`
(a path under `assets/sfx/`, no `.mp3`; `startOffsetSec` lands it on the beat — the stamp in
`frame-story-halftone-case` slams at ~2.9 s):

| frame | sound |
| --- | --- |
| `frame-story-page-turn` | `transition/cc0-paper-riffle` |
| `frame-story-silent-film` | `cinematic/cc0-dark-sting` |
| `frame-story-halftone-case` (the stamp) | `reveal/cc0-deep-boom` |
| `frame-story-step-numeral` | `drumroll/cc0-swell-short` |
| `frame-story-swiss-chapter`, `frame-story-rundown` | `transition/cc0-paper-flip` |
| `frame-story-comic-panels` | `transition/cc0-whip-crack`; `meme/cc0-group-ooh` only if the tone is comic — `meme/*` is never picked automatically |

One sound per beat, on the beat. A sound under every scene is noise.

## 5. The rules that are easy to break in a story

- **Never invent a customer, a quote or a letter.** `frame-story-letter` and any testimonial
  must be a real message, used with permission, lightly trimmed at most. No real one → use a
  different frame. A made-up testimonial in an ad is also a consumer-protection problem.
- **Numbers are sourced or labelled.** Every template here has a slot for where a number came
  from; fill it. "Số minh hoạ" on screen is honest; a plausible fake is not.
- **Dates and places are checkable.** If the brand story says "phố Hàng Gai, 1998", someone
  will check.
- **A competitor in `frame-story-telestrator` is described, not mocked**, and only with public
  facts (`skills/competitor-analysis`).
- **Ads:** run the copy through `skills/ads-policy-check` before it goes to Meta — a story about
  "feeling fat in every dress" breaks the personal-attributes rule however warm it is.

## 6. Run it

```bash
node scripts/video/validate-script.mjs <dir>/script.json --strict
node scripts/video/template-sheet.mjs --script <dir>/script.json --out <dir>/sheet.jpg   # LOOK at it
node scripts/video/render.mjs <dir>/script.json
```

Then `skills/review-gate` — the reviewer reads the arc too: does the hook's question get
answered, is there a turn, is the proof real.

**Own footage instead of templates?** The same arc applies. Cut it with
`scripts/video/talking-head.mjs --edl` (several ranges = several beats) and pick the finish:
`cinematic` or `kinetic-doc` for a story, `launch` for a product origin, `meme` only for comedy.

Method and sources: `docs/27-storytelling.md`.

**Before the story, the position.** If the user has not decided who the brand is for and which feeling it should own, run `brand-lessons` → `bitis-hunter` first (positioning sentence, one emotional territory, a series rather than one-offs) — `docs/32-bai-hoc-thuong-hieu.md`.
