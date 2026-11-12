# Demo: một phóng sự, năm phong cách dựng

Cùng một đoạn phóng sự truyền hình quay ngang, bộ kit dựng thành video dọc 9:16 dài ~1 phút
theo **năm phong cách khác nhau**, mỗi bản một lệnh. Bấm vào ảnh để xem video có tiếng.

| `clean` | `pop` | `editorial` | `cinematic` | `kinetic-doc` |
|:---:|:---:|:---:|:---:|:---:|
| [![clean](clean.webp)](clean.mp4) | [![pop](pop.webp)](pop.mp4) | [![editorial](editorial.webp)](editorial.mp4) | [![cinematic](cinematic.webp)](cinematic.mp4) | [![kinetic-doc](kinetic-doc.webp)](kinetic-doc.mp4) |
| chữ trắng, một từ nhấn màu | CHỮ HOA trong ô màu, zoom mạnh | chữ thường mờ dần vào, màu dịu | màu phim, hạt, B-roll đen trắng | đen trắng, một từ to màu đỏ |

## Bản hoàn chỉnh — có minh hoạ xuyên suốt

[![hoàn chỉnh](hoan-chinh.webp)](hoan-chinh.mp4)

Cùng phóng sự, cùng 4 đoạn, nhưng thêm **8 thẻ minh hoạ** đặt đúng lúc người nói nhắc tới nội
dung đó — người xem vừa nghe vừa thấy con số, danh sách, các bước:

| giây (gốc) | người nói đang nói | thẻ minh hoạ |
|---|---|---|
| 61 | người dân kể chuyện đi đổi bằng | thanh tìm kiếm *"đổi bằng lái ở bưu điện"* (người nói vẫn ở góc trên) |
| 70 | "chuyển về tận nhà… người ở xa" | danh sách lợi ích, tích từng dòng |
| 78 | "30 đến 50 hồ sơ mỗi ngày" | con số lăn kiểu đồng hồ |
| 82 | "cao điểm 70 đến 100 bộ" | biểu đồ vẽ bút chì: ngày thường và cao điểm |
| 97 | giám đốc bưu cục: bố trí thêm cán bộ | "Cách làm 1" |
| 108 | "ghi đủ họ tên, địa chỉ, số điện thoại" | "Cách làm 2" |
| 122 | "theo ghi nhận thực tế" | trang giấy lật: trước đây → bây giờ |
| 128 | "thuận lợi, giảm chi phí và thời gian" | ba tầng chữ, chốt "Hiệu quả." |

- **Hai kiểu đặt thẻ:** khi người thật đang kể, thẻ dùng kiểu `pip` — người nói vẫn hiện trong khung
  nhỏ góc trên. Khi là lời dẫn, thẻ chiếm cả khung (`full`) và tạm ẩn phụ đề, vì thẻ đã viết chữ to.
- **Không bị cắt vụn:** thẻ được đặt *sau* bước cắt khoảng lặng, nên mỗi thẻ chạy trọn hiệu ứng của nó.
- **Ước lượng:** thẻ che người nói khoảng 45% thời lượng (thẻ `pip` tính một nửa).
- **Kế hoạch dựng:** ở [`hoan-chinh/edl.json`](hoan-chinh/edl.json) — chép file đó để dựng video của bạn.

## Bộ kit đã làm gì

**Đầu vào:** phóng sự *"Cấp đổi giấy phép LX qua bưu điện"* (2 phút 26 giây, 16:9, có thanh
chữ và logo của đài). **Đầu ra:** 63 giây, gồm 4 đoạn ghép lại ([`edl.json`](edl.json)):

| | đoạn | nội dung |
|---|---|---|
| 1 | 58–73 s | người dân: *"rất là thuận tiện… chuyển về đến tận nhà"* |
| 2 | 74–86 s | lời dẫn: mỗi ngày 30–50 hồ sơ, cao điểm 70–100 |
| 3 | 95–121 s | chị Lê Thị Ngọc, giám đốc bưu cục huyện Triệu Sơn |
| 4 | 121–134 s | lời dẫn: kết quả bước đầu |

Trong từng đoạn, kit tự:

1. cắt khung dọc **riêng cho từng cảnh** theo vị trí khuôn mặt, bỏ thanh chữ và logo của đài;
2. chèn **3 cảnh B-roll** lấy từ chính phóng sự (quầy tiếp nhận, người dân điền tờ khai) phủ
   lên người nói, tiếng vẫn chạy liên tục (~13% thời lượng);
3. bỏ khoảng lặng, zoom xen kẽ ở mỗi vết cắt, chuẩn hoá âm lượng -16 LUFS;
4. thêm **phụ đề sáng từng từ** theo đúng thời điểm từng từ được nói, tự dời theo các vết cắt;
5. hoàn thiện theo phong cách: kiểu chữ, màu, hạt phim, viền tối, thanh tiến trình, tiêu đề mở đầu.

## Nguồn và giấy phép

| | |
|---|---|
| Tác phẩm gốc | [Cấp đổi giấy phép LX qua bưu điện](https://commons.wikimedia.org/wiki/File:C%E1%BA%A5p_%C4%91%E1%BB%95i_gi%E1%BA%A5y_ph%C3%A9p_LX_qua_b%C6%B0u_%C4%91i%E1%BB%87n.ogv) |
| Tác giả | Đài Phát thanh và Truyền hình Thanh Hoá |
| Giấy phép | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/deed.vi) |
| Thay đổi | chọn và ghép 4 đoạn, chèn cảnh của chính phóng sự, thêm thẻ minh hoạ (bản hoàn chỉnh), bỏ khoảng lặng, zoom, cắt khung 9:16 (bỏ thanh chữ/logo), chỉnh màu, thêm phụ đề, tiêu đề và dòng ghi nguồn |

CC BY cho phép dùng lại và chỉnh sửa, kể cả thương mại, **với điều kiện ghi tác giả, dẫn giấy
phép và nói rõ đã thay đổi gì**. Dòng ghi nguồn được đốt cố định vào cả năm video vì thế. Các
bản dựng này không thuộc và không được Đài PTTH Thanh Hoá xác nhận.

**Phụ đề** lấy từ nhận dạng giọng nói tự động (faster-whisper `large-v3-turbo`, đối chiếu với
`medium`), xem [`transcript.json`](transcript.json). Đã sửa tay: "chuyển viện" → "chuyển về"
ở giây 66,8. Cả hai model đều nghe là "viện", nên đây là phỏng đoán theo ngữ cảnh, **chưa
được nghe lại để xác nhận**.

## Làm lại

```bash
# 1. transcript có mốc thời gian từng từ (faster-whisper, MIT — xem docs/26-auto-edit.md)
# 2. một lệnh cho mỗi phong cách:
node scripts/video/talking-head.mjs gplx.ogv --edl edl.json --transcript transcript.json \
     --style pop --hook "Đổi bằng lái: KHÔNG PHẢI ĐI LẠI" \
     --credit "Nguồn: Đài PTTH Thanh Hoá · CC BY 3.0 · đã cắt ghép, thêm phụ đề"
node scripts/video/make-preview.mjs gplx.short.mp4 --highlights 5 --out pop.webp --mp4 pop.mp4
# bản rộng ở README chính: 3 cột, mỗi cột 4 khoảnh khắc
node scripts/video/make-preview.mjs hoan-chinh.mp4 --highlights 4 --columns 3 --width 300 --out hoan-chinh-wide.webp
```

Tham số chính xác của từng bản nằm trong `<phong-cách>.cuts.json`.

Bản hoàn chỉnh (8 thẻ minh hoạ, mỗi thẻ render khoảng 1 phút):

```bash
node scripts/video/talking-head.mjs gplx.ogv --edl hoan-chinh/edl.json --transcript transcript.json \
     --style editorial --theme newsprint-red --hook "Đổi bằng lái: không phải đi lại" \
     --credit "Nguồn: Đài PTTH Thanh Hoá · CC BY 3.0 · đã cắt ghép, thêm phụ đề và minh hoạ"
```

Chưa có transcript cho video của bạn? `node scripts/video/transcribe.mjs video.mp4`.
