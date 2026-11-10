# Demo: dựng lại một đoạn video người Việt nói chuyện

[![Bản đã dựng](preview.webp)](short.mp4)

**Đầu vào:** phóng sự *"Cấp đổi giấy phép LX qua bưu điện"* (2 phút 26 giây, quay ngang 16:9,
có thanh chữ và logo của đài truyền hình).
**Đầu ra:** [`short.mp4`](short.mp4), một đoạn ngắn dọc 9:16 dùng phần phỏng vấn, được bộ kit tự:

1. cắt đúng câu trả lời của người được phỏng vấn,
2. bỏ các khoảng lặng, xen kẽ zoom nhẹ ở mỗi vết cắt, chuẩn hoá âm lượng (-16 LUFS),
3. cắt khung dọc **bỏ thanh chữ và logo cứng** của đài,
4. thêm **phụ đề sáng từng từ** theo đúng thời điểm từng từ được nói,
5. thêm tiêu đề 2 giây đầu và dòng ghi nguồn cố định.

## Nguồn và giấy phép

| | |
|---|---|
| Tác phẩm gốc | [Cấp đổi giấy phép LX qua bưu điện](https://commons.wikimedia.org/wiki/File:C%E1%BA%A5p_%C4%91%E1%BB%95i_gi%E1%BA%A5y_ph%C3%A9p_LX_qua_b%C6%B0u_%C4%91i%E1%BB%87n.ogv) |
| Tác giả | Đài Phát thanh và Truyền hình Thanh Hoá |
| Giấy phép | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/deed.vi) |
| Thay đổi | cắt đoạn, bỏ khoảng lặng, zoom, cắt khung 9:16 (bỏ thanh chữ/logo), thêm phụ đề, tiêu đề và dòng ghi nguồn |

CC BY cho phép dùng lại và chỉnh sửa, kể cả thương mại, **với điều kiện ghi tác giả, dẫn giấy
phép và nói rõ đã thay đổi gì**. Dòng ghi nguồn được đốt cố định vào video vì thế. Bản dựng này
không thuộc và không được Đài PTTH Thanh Hoá xác nhận.

Phụ đề lấy từ nhận dạng giọng nói tự động (faster-whisper, model `medium`) nên có thể sai một
vài từ; đã dò lại thủ công trước khi đốt. Xem [`transcript.json`](transcript.json).

## Làm lại

```bash
# 1. transcript có mốc thời gian từng từ (faster-whisper, MIT — xem docs/26-auto-edit.md)
# 2. một lệnh dựng:
node scripts/video/talking-head.mjs gplx.ogv --transcript transcript.json \
     --from <giây bắt đầu> --to <giây kết thúc> --crop <w:h:x:y> --theme clinic-sage \
     --hook "<tiêu đề>" --credit "Nguồn: Đài PTTH Thanh Hoá · CC BY 3.0"
node scripts/video/make-preview.mjs short.mp4
```

Các tham số chính xác của lần dựng này nằm trong [`short.cuts.json`](short.cuts.json).
