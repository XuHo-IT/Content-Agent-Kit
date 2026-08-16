# Kế hoạch — đưa chuyển động của kit lên mức CapCut / After Effects

**Lập ngày:** 2026-08-16
**Phạm vi:** Content-Agent-Kit (động cơ + template). Phần vận hành series nằm ở
`Horror-Agent/PLAN-2026-08-16-series.md`.

---

## Đang đứng ở đâu (đo, không phải cảm nhận)

| thứ | hiện trạng |
|---|---|
| Template | 106 · **39** có hoạt ảnh nền · **67** còn đứng im |
| Kỹ thuật ngoài `opacity`/`translate` | **20** template đã dùng — nhưng phân bố rất lệch |
| ├ `stroke-dashoffset` (draw-on) | 13 template — **đã đủ dùng** |
| ├ `background-clip: text` | 8 template |
| ├ `mask-image` | **2** (đều là template aicoding) |
| └ `clip-path: polygon` | **1** (`frame-3d-spotlight`) |
| Transition | kit phơi ra **7** · ffmpeg trên máy có **34** |
| Caption | `.ass` tĩnh, không có chuyển động |
| Adapter hyperframes đang dùng | **1/7** (`css`) |

> **Một giả định sai đã bị bác bỏ khi lập kế hoạch này.** Bản nháp đầu ghi *"0 template dùng
> kỹ thuật ngoài opacity/translate"* và đặt toàn bộ ưu tiên lên việc dựng một template tham
> chiếu. Đếm lại thì con số là **20**, trong đó có `frame-draw-on`, `frame-geo-route` (draw-on
> ngay trên bản đồ — đúng thể loại), `frame-math-manim`, và cả `frame-vox-investigation-board`
> mà tập 01 đã dùng. Vấn đề không phải là *thiếu ví dụ*, mà là **không có gì trỏ agent tới
> chúng**. P1 dưới đây đã viết lại theo đúng phát hiện đó, và nó rẻ hơn hẳn phương án cũ.

---

## Một ràng buộc phải nói trước, vì nó định hình mọi thứ dưới đây

**Template là file HTML đơn, tự chứa, render được offline.** Không có file CSS/JS dùng chung
để import. Nên "thư viện chuyển động" ở đây **không thể** là một runtime include — nó phải là
bộ đoạn mã được *chèn vào lúc tạo template*. Kế hoạch bên dưới đi theo đúng ràng buộc đó thay
vì phá nó; phá nó là đánh đổi lấy việc mất khả năng render offline, và đó là thứ cả kit dựa vào.

---

## P1 · Làm cho 20 ví dụ sẵn có TÌM ĐƯỢC — tuần 2026-08-17 → 08-23

**Vì sao đứng đầu:** agent bắt chước thứ đang tồn tại mạnh hơn nhiều so với đọc tài liệu. Ví dụ
thì đã có 20 cái, nhưng **không có đường nào dẫn tới chúng** — `CATALOG.md` mô tả template làm
*gì*, không mô tả nó *chuyển động bằng cách nào*. Agent mở `frame-vox-collage`, thấy `translateY`,
rồi làm lại `translateY`, trong khi `frame-geo-route` ngay bên cạnh đang vẽ một tuyến đường bằng
`stroke-dashoffset`.

Việc — rẻ, không phải viết template nào:

1. **Thêm cột `Motion:` vào `CATALOG.md`** cho 20 template đó, ghi đúng kỹ thuật chúng dùng.
2. **Một lệnh liệt kê** — `node scripts/video/motion-index.mjs` quét thư mục template và in ra
   template nào dùng kỹ thuật nào. Tự sinh, nên không bao giờ lệch với thực tế.
3. **Trỏ thẳng trong `motion-craft`**: mỗi kỹ thuật kèm *"xem `frame-<id>` để lấy mẫu"*.

Sau bước này mới lộ ra chỗ thiếu thật, và nó lệch hẳn so với tưởng tượng:

| kỹ thuật | số template | kết luận |
|---|---|---|
| `stroke-dashoffset` | 13 | đủ, chỉ cần chỉ đường |
| `background-clip: text` | 8 | đủ |
| `mask-image` | **2** | mỏng, và cả hai đều là template aicoding — không hợp thể loại tư liệu |
| `clip-path: polygon` | **1** | gần như chưa có |

Nên phần *dựng mới* của P1 thu lại còn **một** template, cho hai kỹ thuật đang thiếu:
`clip-path` mở khung như cú lia máy, cộng `mask-image` quét sáng qua chữ.

**Nghiệm thu:** render ở `--at 0`, `2`, `4.5`; ba khung khác nhau rõ, và khung `0` không được
lộ trạng thái kết thúc (bẫy số 1 trong `motion-craft`).

**Rủi ro thật:** `mask-image` chồng `background-clip: text` có thể vỡ trong Chrome headless.
Vỡ thì bỏ `mask-sweep` khỏi template mẫu và ghi lại là *không dùng được* — thà mất một kỹ thuật
còn hơn để lại một mẫu mà chép theo là hỏng.

---

## P2 · Bộ mồi chuyển động cho `add-template` — tuần 2026-08-24 → 08-30

Biến P1 thành thứ tái sử dụng được: `add-template.mjs --motion <kind>` chèn sẵn khối CSS đã
kiểm chứng vào template mới.

```
--motion draw-on      stroke-dasharray/offset + biến thời lượng
--motion clip-reveal  clip-path polygon, bốn hướng
--motion mask-sweep   mask-image gradient chạy ngang
--motion dimensional  perspective + rotateY, có backface
--motion mechanical   steps() cho đếm số và hạt phim
```

Kèm lớp nền ambient đúng chuẩn hai tầng, để template mới **không bao giờ** ra đời trong tình
trạng đứng im. Đây là chỗ sửa gốc cho 67 template chết: cái mới sinh ra đã sống.

---

## P3 · Đường cong easing tuỳ ý — tuần 2026-08-31 → 09-06

AE mạnh ở **graph editor**: mỗi keyframe một đường cong riêng. CSS nay có `linear()` — xấp xỉ
được đường cong bất kỳ bằng danh sách điểm, và `waapi` của hyperframes seek nó bình thường.

Việc: thêm vào `motion-craft` một bảng nhỏ các đường cong đã dựng sẵn — *overshoot*,
*anticipate* (lùi rồi mới bật), *settle* — dạng `linear(...)` copy dán được. Ba đường cong này
là thứ làm chuyển động "có trọng lượng"; thiếu chúng thì mọi thứ trôi đều như PowerPoint.

**Kiểm trước khi hứa:** xác nhận Chrome trong bản hyperframes đang dùng có hỗ trợ `linear()`.
Nếu không, lùi về `cubic-bezier` nhiều chặng và nói rõ là xấp xỉ thô hơn.

---

## P4 · Caption động kiểu CapCut — tuần 2026-09-07 → 09-13

Caption hiện là `.ass` tĩnh. Thứ làm nên caption CapCut là **chữ hiện theo từng từ, lệch pha
nhau, có nảy**.

Hai đường, chọn sau khi thử:

1. **`.ass` với thẻ `\t`** — libass làm được chuyển tiếp theo thời gian. Rẻ, giữ nguyên đường
   ống hiện tại, nhưng cú pháp khó chịu và giới hạn.
2. **Caption thành một lớp template** — render chữ bằng HTML rồi chồng lên. Mạnh hơn hẳn,
   nhưng phải chèn vào giai đoạn ghép và **sẽ đụng đúng vấn đề che nội dung** đã gặp: dải
   caption nằm ở 76–88% chiều cao, đúng vùng template Vox đổ chữ.

> Nếu đi đường 2, phải giải quyết chỗ đặt **trước**, không phải sau. Bài học từ lần nướng
> caption vào hình: kỹ thuật chạy được không có nghĩa là kết quả nhìn được.

---

## P5 · Mở rộng transition — tuần 2026-09-14 → 09-20

Kit phơi ra 7, ffmpeg có 34. Những cái đọc ra "chất CapCut": `hblur` (gần với whip pan),
`radial`, `distance`, `squeezev`, `pixelize` (đã có), `hlslice`, `coverleft`, `revealup`.

Việc: thêm vào `TRANSITIONS` kèm **mô tả dùng khi nào**, không phải đổ cả 34 cái vào. Một danh
sách 34 dòng không tên gọi ý nghĩa thì agent chọn bừa, và bừa thì tệ hơn `fade`.

**Giới hạn phải ghi thẳng vào tài liệu:** `xfade` tác động lên **mối nối**. Nó không phải một
cú máy mà cảnh đang chiếu để lại. Pipeline không có khái niệm "hiệu ứng lúc scene đi ra" — đã
ghi chú ở `zoom`, cần nhắc lại cho cả bộ mới.

---

## P6 · Chiều sâu giả trên ảnh tĩnh — tuần 2026-09-21 → 09-27

Ken Burns chỉ phóng to. CapCut/AE tách lớp rồi cho chúng chạy lệch nhau — đó là thứ làm một
tấm ảnh tĩnh trông như quay thật.

Với ảnh AI tự gen, có một lối đi rẻ mà kit đủ sức: **gen kèm một lớp tiền cảnh nền trong suốt**
(sương, khung cửa, cành cây) rồi cho hai lớp chạy khác tốc độ bằng CSS. Không cần bản đồ độ sâu,
không cần mô hình nào thêm.

**Rủi ro:** model ảnh tích hợp có thể không xuất được PNG nền trong suốt đúng ý. Thử một lần ở
đầu giai đoạn; không được thì bỏ P6, đừng kéo dài.

---

## P7 · Rà soát nợ chuyển động — 2026-09-28, và mỗi tháng sau đó

Chạy phần "debt" của `tests/motion.test.mjs`, đọc con số còn lại (hiện **67**), sửa 8–10 cái
mỗi đợt — **mỗi cái một chữ ký riêng**, không dùng chung một hiệu ứng. Dùng chung thì hết khung
chết nhưng ra một loạt khung giống hệt nhau, mất đúng thứ cần.

Cùng dịp: rà đống *frame chữ ký* theo `new-template` §signature — dùng ≥2 lần thì lên thư viện
chung, dùng đúng một lần thì xoá.

---

## Cố ý KHÔNG làm

- **Không nhét GSAP vào làm mặc định.** Có adapter thật và dùng được, nhưng phải nạp script CDN
  lúc render — thêm một thứ có thể chậm hoặc chết giữa lượt dựng. Để dành cho frame thật sự cần
  dàn dựng chồng lớp. *(Việc cần làm trước khi dùng: xác nhận điều khoản giấy phép GSAP hiện
  hành — đừng cho là miễn phí rồi mới đọc.)*
- **Không dùng canvas chạy bằng `requestAnimationFrame`.** Bundle hyperframes **không** shim
  đồng hồ cho rAF, nên nó chụp nhầm khung — cùng loại lỗi với clip trong template. Cần canvas
  thì đọc `window.__hfThreeTime`.
- **Không phá kiến trúc file đơn** để có thư viện dùng chung. Đổi lấy nó là mất render offline.
- **Không đuổi theo particle/shader.** `three` và `typegpu` có adapter, nhưng chi phí bảo trì
  vượt xa giá trị cho thể loại video này.

---

## Cách biết kế hoạch này có thật sự ăn thua

Không phải "template trông đẹp hơn". Ba con số, đo lại vào **2026-09-28**:

| chỉ số | hôm nay | mục tiêu |
|---|---|---|
| Template có hoạt ảnh nền | 39 / 106 | ≥ 60 / 106 |
| Template dùng `clip-path` hoặc `mask-image` | **3** | ≥ 10 |
| Kỹ thuật được trỏ đường trong CATALOG + `motion-index` | **0** | 4/4 |
| Transition có tên gọi ý nghĩa | 7 | ≥ 14 |

Chỉ số **thứ ba** mới là chỉ số quan trọng nhất, và hôm nay nó bằng không. Kit không thiếu
ví dụ — nó thiếu đường dẫn tới ví dụ. Đó là lý do P1 rẻ hơn nhiều so với bản nháp đầu, và vẫn
đứng trước mọi thứ khác.
