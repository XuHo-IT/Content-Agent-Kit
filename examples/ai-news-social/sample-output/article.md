# Bài viết mẫu — đầu ra thật của `ai-news-social`

> Đây là **kết quả thật**, không phải khung điền sẵn: một bài do agent viết theo
> `WRITING_CRAFT.md` của chính nó, đã qua `review-gate`. Giữ ở đây để bạn thấy đầu ra trông
> thế nào **trước khi** bỏ công dựng agent.
>
> Cùng một nguồn này còn được dựng thành video —
> xem [`examples/ai-video-social/sample-output/`](../../ai-video-social/sample-output/).
> Một nguồn, hai định dạng: đó là điểm chính của bộ kit.
>
> **Nguồn:** https://www.anthropic.com/news/claude-fable-5-mythos-5 · **Ngày:** 09/06/2026

---

## Payload gửi đi

Đây là JSON mà `publish.mjs` và `make-post.mjs` nhận — đúng schema ở `PLAYBOOK.md` §4:

```json
{
  "title": "Anthropic ra mắt Claude Fable 5 rồi bị buộc gỡ sau ba ngày",
  "post": "Meta: …\nSlug: …\n\n<toàn văn bài viết bên dưới>",
  "comment": "<comment engagement bên dưới>",
  "image": "scratch/news_1.png"
}
```

Hai dòng `Meta:` và `Slug:` nằm **đầu trường `post`** và bị web ingest cắt bỏ khi đăng — chúng
là metadata SEO, không phải nội dung bài.

---

## Trường `post` (nguyên văn)

```
Meta: Claude Fable 5 đạt điểm cao nhất ở gần như mọi bài kiểm tra, rồi bị lệnh kiểm soát xuất khẩu buộc gỡ sau ba ngày. Chuyện gì đã xảy ra?
Slug: claude-fable-5-ra-mat-roi-bi-go-sau-ba-ngay

Stripe đưa cho nó một kho mã Ruby năm mươi triệu dòng và bảo chuyển đổi. Công việc mà đội kỹ
thuật của họ dự trù vài tháng, mô hình làm xong trong vài ngày.

Ba ngày sau, chính phủ Mỹ buộc nó phải ngừng hoạt động.

Đó là hai tuần đầu đời của Claude Fable 5 — mô hình Anthropic công bố ngày 9 tháng 6 năm 2026,
và là cái tên đầu tiên thuộc một hạng mới mà họ gọi là Mythos, đặt trên cả dòng Opus vốn đang
là đỉnh của họ.

### Nó làm được gì mà đáng gọi là hạng riêng

Anthropic nói Fable 5 đạt mức tốt nhất ở gần như toàn bộ các bài kiểm tra năng lực họ chạy. Con
số cụ thể đáng chú ý hơn lời tuyên bố: đây là mô hình đầu tiên vượt mốc 90% trên bài kiểm tra
phân tích lõi của chính họ. Trên FrontierCode — bộ bài kiểm tra lập trình — nó dẫn đầu nhóm mô
hình tiên tiến, và dẫn đầu ngay cả khi chạy ở mức nỗ lực trung bình chứ không phải chế độ nặng
nhất. Bài kiểm tra tài chính cũng cho điểm cao nhất từ trước tới nay.

Nhưng thứ Anthropic nhấn mạnh không phải điểm số. Họ mô tả Fable 5 được xây cho các tác vụ
*agent* kéo dài nhiều ngày — loại việc mà mô hình phải tự lập kế hoạch, tự chạy, tự sửa qua
hàng trăm bước mà không có người ngồi kèm từng lượt. Đây là chỗ các thế hệ trước đuối: chúng
giải tốt một bài toán khó trong một lượt, nhưng mất mạch khi việc kéo dài.

Trường hợp Stripe là ví dụ của đúng loại việc đó. Chuyển đổi một kho mã năm mươi triệu dòng
không phải một câu hỏi khó; nó là hàng chục nghìn thay đổi nhỏ phải nhất quán với nhau.

### Cái giá: nó từ chối trả lời nhiều hơn

Đi kèm năng lực đó là lớp chắn an toàn mạnh nhất Anthropic từng đặt lên một bản phát hành rộng
rãi. Cơ chế khá lạ: ở các lĩnh vực rủi ro cao — an ninh mạng, sinh học, hoá học — Fable 5 không
tự trả lời mà **đẩy câu hỏi xuống cho Claude Opus 4.8** xử lý thay. Người dùng vẫn nhận được
câu trả lời, chỉ là từ một mô hình yếu hơn.

Anthropic nói cơ chế này kích hoạt ở dưới 5% số phiên làm việc. Con số nghe nhỏ, nhưng chính họ
thừa nhận lớp chắn hiện còn quá rộng: nó chặn nhầm cả những câu hỏi vô hại chỉ vì chúng nằm gần
một chủ đề nhạy cảm. Nếu công việc của bạn dính tới bảo mật hay sinh học, tỷ lệ 5% đó sẽ không
phân bố đều — bạn sẽ gặp nó thường xuyên hơn con số trung bình gợi ý rất nhiều.

Song song với Fable 5, Anthropic phát hành Claude Mythos 5: **cùng một mô hình bên dưới**,
nhưng gỡ bớt lớp chắn ở một số vùng. Nó không mở công khai — chỉ dành cho đối tác hạ tầng trong
chương trình Glasswing và một số nhà nghiên cứu được xét duyệt.

### Rồi chính phủ Mỹ can thiệp

Ba ngày sau khi ra mắt, một chỉ thị kiểm soát xuất khẩu buộc Fable 5 tạm ngừng hoạt động. Đến
cuối tháng 6, lệnh được dỡ bỏ và mô hình quay lại. Anthropic không công bố chi tiết đàm phán,
nên phần này đến giờ vẫn là một khoảng trống.

Điều đáng để ý không phải bản thân sự cố, mà là nó cho thấy một thứ mới: năng lực mô hình đã
chạm ngưỡng khiến chính phủ coi nó là mặt hàng cần kiểm soát xuất khẩu, chứ không còn là phần
mềm thông thường.

### Giá và nơi dùng được

Mỗi triệu token đầu vào tốn 10 đô la, đầu ra 50 đô la. Đắt hơn hẳn các bậc dưới, và với loại
tác vụ agent nhiều bước mà nó được thiết kế cho, lượng token tiêu thụ không hề nhỏ — chi phí
thực tế của một tác vụ dài có thể vượt xa cảm giác ban đầu khi nhìn đơn giá.

Mô hình có mặt trên Claude API, trên các ứng dụng Claude và trên Amazon Bedrock. Các gói thuê
bao Pro, Max, Team và Enterprise được dùng miễn phí trong hai tuần đầu kể từ ngày ra mắt, sau
đó tính theo tín dụng sử dụng.

### Vậy có nên đổi sang không

Câu trả lời phụ thuộc vào việc bạn giao cho nó thứ gì.

Nếu là tác vụ dài nhiều bước, cần giữ mạch qua hàng trăm lượt — di trú kho mã, phân tích một bộ
dữ liệu lớn, chạy một quy trình tự động nhiều chặng — thì khoảng cách năng lực là thật, và giá
cao vẫn đáng.

Nếu là việc thường ngày như viết, tóm tắt, hỏi đáp, sinh code từng đoạn, thì các bậc rẻ hơn vẫn
dư sức, và bạn sẽ trả gấp nhiều lần cho phần năng lực không dùng tới.

Còn nếu công việc của bạn nằm gần an ninh mạng hay sinh học, hãy thử kỹ trước khi cam kết —
lớp chắn "quá rộng" mà Anthropic tự thừa nhận có thể khiến mô hình mạnh nhất lại là mô hình
kém hữu ích nhất với bạn.

Thế bạn nghĩ sao về: một mô hình mạnh tới mức bị kiểm soát xuất khẩu — đó là dấu hiệu ngành đã
trưởng thành, hay là rào cản đầu tiên trong nhiều rào cản sắp tới?
```

---

## Trường `comment` (nguyên văn)

```
Chi tiết đầy đủ trong công bố gốc của Anthropic: https://www.anthropic.com/news/claude-fable-5-mythos-5

Con số mình thấy đáng nói nhất không phải điểm benchmark, mà là "dưới 5% số phiên bị chặn" — nghe nhỏ, nhưng nếu bạn làm bảo mật thì 5% đó dồn hết vào việc của bạn. Ai đang dùng cho việc gần mấy lĩnh vực nhạy cảm thì thử kỹ trước khi đổi nhé.

#AI #Claude #Anthropic #CongNghe #LapTrinh
```

---

## Bài này vượt rubric ở đâu

`review-gate` chấm theo `WRITING_CRAFT.md` §7 — mười tiêu chí đo được:

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | Cụm sáo rỗng (§4.1) | 0 — không có "bước tiến vượt bậc", "mở ra kỷ nguyên mới", "không thể phủ nhận rằng"… |
| 2 | Đoạn liên tiếp mở cùng cấu trúc | tối đa 1 |
| 3 | Con số cụ thể | 9 (50 triệu dòng, 90%, <5%, 10/50 đô, 3 ngày, 09/06/2026, Opus 4.8, 2 tuần) |
| 4 | Đoạn nói mặt trái | 2 mục riêng — lớp chắn chặn nhầm, và chi phí token thực tế |
| 5 | Câu mở bài | mở bằng **sự việc** (Stripe, 50 triệu dòng), không phải định nghĩa |
| 6 | Thuật ngữ | "tác vụ agent" được giải thích ngay câu sau |
| 7 | Tính từ rỗng không kèm số | 0 |
| 8 | Comment khác giọng bài | có — comment ngôi thứ nhất, nêu góc nhìn riêng, không lặp câu nào trong bài |
| 9 | Hashtag | 5, đúng chủ đề |
| 10 | Độ dài + Meta/Slug + câu kết | ~950 từ · có đủ Meta và Slug · kết bằng câu hỏi mở |

**Điều bài này cố ý KHÔNG làm:** không tuyên bố Fable 5 "tốt nhất" một cách trống rỗng, không
liệt kê tính năng suông, và không né phần bất lợi. Playbook của agent bắt buộc mỗi bài phải có
ít nhất một đoạn về giới hạn — bài chỉ khen là bài mất uy tín.

## Tự tái tạo

```bash
node scripts/social/make-post.mjs --json examples/ai-news-social/sample-output/post.json --dry-run
```
