# 21 — Video genres / Thể loại video

## English

`templates/VIDEO_GENRES.template.json` answers a question the rest of the kit does not.
`VIDEO_SCRIPT.template.json` shows the *shape* of a script. `video-templates/CATALOG.md`
says what each template *does*. Neither answers what someone actually asks:

> I want to make a review — which frames, in what order?

Without an answer, every video ends up using the first three templates in the list, because
picking a sequence from scratch is work and the list has an order.

### Use one

Copy the `beats` array of the genre you want and fill in `voiceText` and `inputs`:

```bash
node -e "console.log(JSON.stringify(require('./templates/VIDEO_GENRES.template.json').genres.review.beats, null, 2))"
```

Then validate before you spend anything:

```bash
node scripts/video/validate-script.mjs brain/<slug>/script.json --strict
```

### The six

| genre | when | the shape |
|---|---|---|
| **review** | you tried something and have a verdict | verdict spoiled in the hook → what you measured → the number → why → **the cost** → the score card |
| **tutorial** | someone wants to do the thing | the outcome, not the topic → 3–5 steps → the hardest step on screen → where to get it |
| **news** | something happened | the event in one sentence → the number that makes it news → what was true before → what changes for the viewer |
| **listicle** | a ranked or grouped set | the count is a promise — keep it → the list, arriving one at a time → the two hardest to choose between |
| **launch** | you built something and it is now available | the problem, not the product → how it was against how it is → **the name, finally** → what it does → one link |
| **testimonial** | someone else's result | the result first → their words, unedited → before and after, measured |

### Two rules that hold across all six

**The hook is not a title card.** A frame that names the topic without giving anything away
is a frame people scroll past. Lead with the verdict, the number or the result. A review
especially: nobody watches one for suspense.

**Do not use the same template twice in a row.** `validate-script.mjs` warns about this, and
the reason is that two identical frames read as a stall — the viewer assumes the video has
repeated itself and leaves.

### The one that is easy to skip

**Review needs a scene for the cost.** The genre file gives `frame-pentagram-stat` to the
hidden cost on purpose. A review that lists only upsides is an advertisement, and viewers
can tell — the credibility of everything else in the video depends on that one scene
existing.

`examples/ai-video-social/sample-review-rag/` is that shape rendered: reranking wins on
precision and token cost, and the fifth scene is the 14.2-second retrieval penalty.

### Genre picks the shape. Industry picks the evidence.

A genre answers *"I want to make a review — which frames, in what order?"*.
`templates/INDUSTRIES.template.json` answers the question underneath it: **what counts as
proof in this business, and what may you not claim.**

A property review and a fintech review are the same genre and are not the same job. One
needs a price per m² with a date on it; the other may not promise a return at all.

16 verticals, each naming a genre, a frame set, a palette — and on the writing side the post
types, what proof looks like, and what to avoid. Three of them (**healthcare, finance,
property**) carry a `legal` block where every rule has a **source link**, because getting one
of those wrong costs a fine rather than an eyebrow. A test enforces that: a claim phrased as
law with no link fails the build.

Each entry also lists what that vertical **wants and this kit cannot draw yet**. That is the
build queue, and it is more honest than pointing an industry at a frame that only nearly fits.

### Adding a genre

Add an entry to `genres`. `tests/templates.test.mjs` enforces the parts that are not
matters of taste:

- every `templateId` must exist
- the first beat must be `hook`, the last must be `outro`
- no template twice in a row
- every beat needs a `beat` line explaining **why it is there**, not just which template

That last one is the point of the file. A preset without reasoning is a list of template
names, which `CATALOG.md` already is.

---

## Tiếng Việt

`templates/VIDEO_GENRES.template.json` trả lời câu hỏi mà phần còn lại của kit không trả lời.
`VIDEO_SCRIPT.template.json` cho biết script có **hình dạng** gì. `CATALOG.md` cho biết mỗi
template **làm gì**. Không cái nào trả lời câu người ta thực sự hỏi:

> Tôi muốn làm một bài review — dùng khung nào, theo thứ tự nào?

Không có câu trả lời thì mọi video đều dùng ba template đầu danh sách, vì tự nghĩ ra trình tự
là việc mất công còn danh sách thì có sẵn thứ tự.

### Dùng một thể loại

Copy mảng `beats` của thể loại bạn muốn rồi điền `voiceText` và `inputs`. Kiểm tra trước khi
tiêu tiền:

```bash
node scripts/video/validate-script.mjs brain/<slug>/script.json --strict
```

### Sáu thể loại

| thể loại | khi nào | hình dạng |
|---|---|---|
| **review** | bạn đã dùng thử và có kết luận | spoil kết luận ngay hook → đo cái gì → con số → vì sao → **cái giá** → thẻ điểm |
| **tutorial** | người ta muốn tự làm được | kết quả chứ không phải chủ đề → 3–5 bước → bước khó nhất chiếu lên màn → lấy ở đâu |
| **news** | có chuyện vừa xảy ra | sự việc trong một câu → con số khiến nó thành tin → trước đó thế nào → đổi gì với người xem |
| **listicle** | một danh sách có thứ hạng | con số là lời hứa, phải giữ → danh sách hiện dần → hai cái khó chọn nhất |
| **launch** | bạn làm xong một thứ và giờ nó có sẵn | vấn đề chứ không phải sản phẩm → trước so với sau → **tên, cuối cùng** → nó làm được gì → một đường dẫn |
| **testimonial** | kết quả của người khác | kết quả trước → lời của họ, không sửa → trước và sau, có đo |

### Hai quy tắc đúng cho cả sáu

**Hook không phải slide tiêu đề.** Một khung chỉ nêu chủ đề mà không hé lộ gì là khung người
ta lướt qua. Mở bằng kết luận, con số hoặc kết quả. Riêng review càng đúng: không ai xem
review để hồi hộp.

**Không dùng cùng một template hai lần liên tiếp.** `validate-script.mjs` có cảnh báo, và lý
do là hai khung giống nhau đọc ra như video bị đứng — người xem tưởng nó lặp lại rồi thoát.

### Quy tắc dễ bỏ qua nhất

**Review phải có một scene cho cái giá.** File thể loại dành hẳn `frame-pentagram-stat` cho
chi phí ẩn, và đó là chủ ý. Một bài review chỉ liệt kê điểm tốt là một quảng cáo, người xem
nhận ra ngay — độ tin cậy của mọi thứ còn lại trong video phụ thuộc vào việc scene đó có tồn
tại hay không.

`examples/ai-video-social/sample-review-rag/` chính là hình dạng đó đã render: rerank thắng cả
về precision lẫn chi phí token, và scene thứ năm là 14,2 giây retrieval phải trả thêm.

### Thêm thể loại mới

Thêm một mục vào `genres`. `tests/templates.test.mjs` bắt buộc những phần không phải chuyện
gu thẩm mỹ: mọi `templateId` phải có thật, beat đầu là `hook`, beat cuối là `outro`, không
lặp template liền nhau, và mỗi beat phải có dòng `beat` giải thích **vì sao nó ở đó**.

Dòng cuối mới là mục đích của file này. Một preset không kèm lý do chỉ là danh sách tên
template — mà `CATALOG.md` vốn đã là như vậy rồi.
