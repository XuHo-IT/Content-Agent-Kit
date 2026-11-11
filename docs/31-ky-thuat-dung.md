# 31 — Kỹ thuật dựng: cắt sao cho người xem không thấy vết cắt

Kit dựng tự động phần lớn video, nhưng creator vẫn tự dựng tay trên CapCut, hoặc chỉnh lại
bản kit xuất ra. Tài liệu này gom các kỹ thuật dựng cơ bản vào một chỗ. Mỗi kỹ thuật có đủ
năm phần: nó là gì, khi nào dùng, khi nào **đừng** dùng, làm trên CapCut ra sao, và trong kit
thì có sẵn ở đâu.

Mọi kỹ thuật ở đây là kiến thức dựng phim phổ thông. Ý tưởng gom chúng thành một bộ lấy từ gói
skill chia sẻ của Hải Đăng (không có giấy phép, nên không chép câu chữ nào); phần cắt theo
nhịp nhạc tham khảo `beat-sync-editing` của iart.ai (MIT, cài bằng
`node scripts/install-skills.mjs beat-sync-editing`).

> Quy tắc chung: **một kỹ thuật phải có lý do**. Chuyển cảnh nào cũng là một câu "chú ý, đổi
> rồi". Dùng ở mọi vết cắt thì nó thành tiếng ồn, giống như sfx trên mọi thẻ.

## Bảng chọn nhanh

| Bạn muốn | Dùng | Đừng dùng khi |
|---|---|---|
| đổi cảnh mà người xem không giật mình | cắt theo hành động | không có chuyển động nào để bám |
| nối hai nơi, hai thời điểm thành một mạch | match cut | hai khung khác bố cục, ép vào sẽ trông lỗi |
| cho thấy thời gian trôi | hoà tan (cross dissolve) | video tin tức, mẹo nhanh: hoà tan làm chậm nhịp |
| đổi món đồ, liệt kê nhanh nhiều thứ | thu nhỏ rồi bật (scale-pop) | đồ vật khác cỡ, khác vị trí trong khung |
| giọng nói nối liền qua vết cắt hình | J-cut / L-cut | đổi hẳn chủ đề, cần một khoảng nghỉ rõ |
| video nhạc, montage, cảnh mở | cắt theo nhịp | video người nói: lời quan trọng hơn nhịp |

## 1. Cắt theo hành động (cut on action)

**Là gì:** cắt *giữa* một động tác, như đứng dậy, quay đầu hay đưa tay, rồi cho động tác đó
chạy tiếp ở cảnh sau, từ góc khác hoặc ở nơi khác. Mắt người xem bám theo chuyển động nên
không kịp thấy vết cắt.

**Làm:** đặt điểm cắt ở khoảng 1/3 động tác, khi chuyển động đã rõ nhưng chưa xong. Cảnh sau
bắt đầu ở đúng pha đó. Lệch 2–3 khung là chấp nhận được, nhưng lặp lại cùng một pha thì thành
"nhảy hình".

**CapCut:** đặt đầu phát ở giữa động tác ở clip A rồi bấm *Tách*; xoá phần sau. Ở clip B, tìm
đúng pha đó, *Tách* rồi xoá phần trước. Xem lại ở tốc độ 0.5×.

**Trong kit:** `talking-head.mjs` đặt điểm cắt ở khoảng lặng, không ở giữa động tác. Với video
nhiều cảnh quay, hãy chọn `from`/`to` của từng đoạn trong EDL sao cho đoạn sau mở bằng chuyển
động.

## 2. Match cut

**Là gì:** hai cảnh khác nơi, khác lúc, nhưng **cùng hình dáng, cùng vị trí trong khung, cùng
cỡ**. Ví dụ: tách cà phê sáng nối sang vầng trăng tròn; người bước ra cửa nhà nối sang người
bước vào văn phòng.

**Làm:** khớp ba thứ theo thứ tự quan trọng: vị trí chủ thể trong khung, cỡ chủ thể, rồi hướng
chuyển động. Màu khớp được thì càng tốt, không khớp cũng không sao.

**CapCut:** bật *lưới* (grid), đánh dấu vị trí chủ thể ở clip A, rồi dùng *Biến đổi* để phóng
to/dời clip B cho chủ thể nằm đúng ô đó.

**Trong kit:** `frame-story-one-line` (một nét vẽ liền biến từ hình này sang hình kia) và
`frame-trend-search-morph` (một chấm tròn biến thành ô tìm kiếm) là "match cut bằng thiết kế".

## 3. Hoà tan (cross dissolve)

**Là gì:** cảnh A mờ dần đi trong lúc cảnh B hiện dần lên (độ mờ 100 → 0 và 0 → 100). Nghĩa
là "một lúc sau", hoặc "cùng lúc đó, ở chỗ khác".

**Làm:** 0,4–0,8 s. Ngắn hơn thì giống lỗi khung hình, dài hơn thì thành hiệu ứng. Hai cảnh
nên có bố cục gần nhau, nếu không phần giữa sẽ thành một ảnh chồng lộn xộn.

**CapCut:** chạm vào mối nối giữa hai clip → *Chuyển cảnh* → *Hoà tan* (Dissolve/Mix), kéo
thời lượng về khoảng 0,5 s.

**Trong kit:** `script.json` → `"transition": "fade"` giữa hai scene (`render.mjs`,
`lib/ffmpeg-video.mjs#TRANSITIONS`). Đừng dùng hoà tan cho video tin tức hay mẹo nhanh, vì
cắt thẳng mới giữ được nhịp.

## 4. Thu nhỏ rồi bật (scale-pop swap)

**Là gì:** món đồ đang hiện thu nhỏ về một điểm, món mới bật to ra **đúng tại điểm đó**, vượt
quá cỡ một chút rồi nhún về đúng cỡ. Hợp với video liệt kê đồ, outfit, "trước khi / sau khi".

**Làm:** thu nhỏ 6–8 khung (0,2 s). Món mới bật lên 110% trong 5 khung rồi về 100% trong 4
khung. Thêm một tiếng "pop" ngắn đúng khung bật.

**CapCut:** đặt *keyframe* tỉ lệ ở cuối clip A (100% → 0%) và ở đầu clip B (0% → 110% → 100%),
tâm phóng to ở cùng một điểm.

**Trong kit:** sfx `transition/cc0-cartoon-zip` cho tiếng pop; `frame-trend-price-drop` là dạng
thiết kế của nhịp "đổi + bật".

## 5. J-cut và L-cut

**Là gì:** hình và tiếng không cắt cùng lúc. **J-cut:** tiếng của cảnh sau đến *trước* hình của
nó, người xem nghe trước rồi mới thấy. **L-cut:** tiếng của cảnh trước *kéo dài* sang hình cảnh
sau.

**Khi nào:** J-cut để mở một phần mới ("nghe thấy tiếng chợ, rồi mới thấy chợ"). L-cut để
B-roll minh hoạ đúng điều người nói vừa nói.

**Trong kit:** B-roll trong EDL của `talking-head.mjs` chính là L-cut: hình chuyển sang B-roll
còn giọng vẫn chạy tiếp (`docs/26` §2b).

## 6. Cắt theo nhịp nhạc

**Là gì:** đặt vết cắt, lúc thẻ hiện ra, lúc punch-in **đúng beat**. Phô trương đổi ở đầu ô
nhịp (mỗi 4 beat), đổi nhỏ ở beat thường.

**Đo nhịp bằng kit:**

```bash
node scripts/video/beat-grid.mjs nhac.mp3 --out beats.json        # BPM, độ tin cậy, mốc từng beat
node scripts/video/talking-head.mjs quay.mp4 … --music nhac.mp3 --snap-beats   # thẻ đáp đúng beat
```

**Đọc `confidence` trước:** dưới khoảng 0,3 thì bài nhạc không có nhịp đều (ambient, piano tự
do), và "cắt theo nhịp" sẽ trông ngẫu nhiên. Với video người nói, lời quan trọng hơn nhịp:
`--snap-beats` chỉ xê dịch thẻ ≤ 0,12 s, nên thẻ vẫn bám đúng chữ được nói.

**Đừng:** cắt ở *mọi* beat kèm một chuyển cảnh mỗi lần. Ba vết cắt đúng chỗ hơn hai mươi vết
cắt đều đặn.

## 7. Trước khi đăng: kiểm file

Video dựng đẹp vẫn có thể bị từ chối khi tải lên: video sản phẩm Shopee quá 30 MB, Zalo Ads
quá 60 s, hay video 16:9 đăng lên Shorts sẽ thành video dài.

```bash
node scripts/video/delivery-check.mjs video.mp4 --platform tiktok,facebook-reels,shopee-product
node scripts/video/delivery-check.mjs video.mp4 --platform shopee-product --fix video.shopee.mp4
```

Mỗi giới hạn có ghi nguồn và ngày kiểm (`scripts/video/lib/delivery-specs.mjs`). Con số có
nguồn chính thức thì vi phạm là **lỗi**; con số mà các nguồn còn vênh nhau thì chỉ **cảnh báo**.
`--fix` thu nhỏ, nén cho vừa dung lượng và chuẩn hoá độ to về -14 LUFS, nhưng **không bao giờ
tự cắt ngắn**: video quá dài thì phải dựng lại, không nén được.

---

## English

Editing techniques for creators who cut by hand (CapCut) or touch up what the kit renders:
cut on action, match cut, cross dissolve, scale-pop swap, J/L-cuts and cutting to the beat —
each with when to use it, when not to, the CapCut steps and where the kit already does it.
New tools referenced: `beat-grid.mjs` (tempo + beat times, no dependencies; ±33 ms on test
tracks) with `talking-head --snap-beats`, and `delivery-check.mjs` (a real file against
TikTok / Facebook Reels / YouTube Shorts / Shopee / Zalo limits, each sourced and dated;
`--fix` re-encodes to fit, never trims). The collection idea comes from Hải Đăng's shared skill
bundle (no licence — no text taken); beat-cutting craft: iart.ai's `beat-sync-editing` (MIT),
installable from the registry.
