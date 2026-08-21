# Attribution — frame-forensic-instrument

**Original template** authored for content-agent-kit (MIT, same as this repo).
Rebuilt to design mock-ups supplied by the repo owner; no third-party code, markup, fonts or
imagery is vendored here.

## Why it exists

Two gallery pages held 38 forensic designs and every one of them was the same frame with a
different dial in the middle. Thirty-eight directories would have grown the library by 30%
while adding one layout, and roughly sixteen of them duplicated frames that already existed.
This is that layout once, with the dial chosen by a slot — and `value_1..3` drive the drawing,
so the printed number and the drawn shape cannot disagree.

## Slots

- `panel`
- `kicker`
- `value_1`
- `value_2`
- `value_3`
- `label_1`
- `label_2`
- `label_3`
- `threshold`
- `readout_1`
- `readout_2`
- `caption`

## Instruments (`panel`)

- `toxicology` — Ba ống nghiệm, mực chất lỏng lấy từ value_1..3 — ống nào vượt ngưỡng thì đỏ.
- `xray` — Ảnh chụp X-quang đảo màu với một vòng khoanh vùng tổn thương — vị trí theo value_1/value_2 (%).
- `dental` — Cung răng 16 vị trí; value_1 là phần trăm trùng khớp, số răng sáng lên tính từ đó.
- `algor-curve` — Đường thân nhiệt tụt sau khi chết, vẽ dần; value_1 là điểm đo hiện tại trên trục thời gian (%).
- `microscope` — Vòng kính hiển vi soi một nét mực; dùng khi nói về chữ ký giả hay nét bút.
- `evidence-bag` — Túi niêm phong vật chứng có mã vạch — dùng cho chuỗi bảo quản vật chứng.
- `web-history` — Ba dòng lịch sử tìm kiếm với dấu thời gian; dòng nào đáng ngại thì đỏ (label bắt đầu bằng !).
- `ip-trace` — Chuỗi máy chủ trung chuyển, chặng cuối sáng đỏ — dùng khi lần ra nguồn thật của một tài khoản.
- `gps-dashcam` — Đồng hồ tốc độ; value_1 là phần trăm kim quay, label_1 là con số đọc ra.
- `spectrogram` — Phổ âm thanh với một dải sáng nổi lên giữa nhiễu — dùng khi bóc tách được tiếng nói trong tạp âm.
- `lidar-mesh` — Khối lưới LiDAR xoay chậm — dùng khi nói về mô hình 3D của một không gian.
- `terrain-contour` — Đường bình độ địa hình với một điểm đánh dấu — dùng cho địa hình hiểm trở hay ranh giới.
- `sewer-cutaway` — Mặt cắt đường hầm ngầm — dùng cho lối thoát, cống, hầm.
- `flight-radar` — Vệt bay cắt ngang màn radar rồi mất tín hiệu ở value_1% quãng đường.
- `bts-triangulate` — Ba vòng phủ sóng giao nhau; điểm giao là vị trí máy — dùng cho định vị điện thoại.
- `smuggle-route` — Cung đường vượt biên vẽ dần qua các trạm — dùng cho buôn lậu, di chuyển xuyên biên giới.
- `ais-vessel` — Bảng thông số tàu neo ngoài khơi — ba dòng label_1..3, kiểu bản tin hàng hải.
- `money-chain` — Chuỗi tài khoản tiền đi qua, mỗi chặng một dòng; chặng cuối đỏ. Dùng cho rửa tiền, thiên đường thuế.
- `doppler-storm` — Radar thời tiết với tâm bão xoáy — dùng khi thời tiết đã xoá dấu vết hiện trường.

Both compositions expose the same slot names; they are emitted together by
`scripts/video/lib/build-instrument-templates.mjs`. Edit that file, not the HTML.
