# Video mẫu theo ngành

Mười sáu video ngắn 9:16, mỗi ngành một video, mỗi ngành một bảng màu (`theme`) lấy từ
[`templates/INDUSTRIES.template.json`](../../templates/INDUSTRIES.template.json). Mỗi video
dài khoảng 76–92 giây, gồm 9–10 cảnh, không lặp khung hình trong cùng video, và đều qua
`validate-script.mjs --strict`. Tất cả do bộ kit tự làm từ `script.json` trong từng thư mục:
khung hình động, giọng đọc tiếng Việt (OmniVoice, chạy trên máy), chuyển cảnh và nhạc nền.

| ngách | chủ đề | bảng màu | khung hình theo thứ tự |
|---|---|---|---|
| [`cong-nghe-ai`](cong-nghe-ai/) | AI agent khác chatbot ở đâu, và khi nào nên dùng | `graphite-signal` | opus-shader-orb → 3d-flip → trend-exploded-layers → diagram-architecture → trend-compare-wipe → ui-glass-dashboard → meme → diagram-quadrant → creative-voltage → statement-outro |
| [`lap-trinh`](lap-trinh/) | Lỗi "máy tôi chạy được": bốn lớp cần khoá | `terminal-moss` | trend-search-morph → terminal → 3d-stack → trend-code-diff → ui-terminal-ide → node-graph → diagram-flowchart → opus-cursor-flow → progress → logo-outro |
| [`tai-chinh`](tai-chinh/) | Lãi kép: bắt đầu sớm quan trọng hơn bắt đầu nhiều | `ledger-green` | trend-word-pop → dashboard → diagram-flowchart → split-compare → trend-stat-odometer → trend-line → trend-bar-race → kinetic-type → opus-kinetic-reel → statement-outro |
| [`doanh-nghiep`](doanh-nghiep/) | Viết mục tiêu quý (OKR) cho nhóm nhỏ trong một buổi họp | `cobalt-slate` | liquid-bg-hero → 3d-flip → 3d-stack → dashboard → pentagram-stat → chat-bubbles → diagram-flywheel → opus-cursor-flow → progress → logo-outro |
| [`marketing`](marketing/) | Ba giây đầu: cách viết câu mở đầu giữ người xem | `riso-pink` | opus-kinetic-reel → funnel → chart-bars → trend-compare-wipe → creative-voltage → meme → 3d-perspective-card → trend-live-poll → build-minimal → statement-outro |
| [`thuong-mai-dien-tu`](thuong-mai-dien-tu/) | Bán bình giữ nhiệt: trả lời sẵn câu khách sẽ hỏi | `tomato-cream` | trend-phone-notifs → product-reveal → trend-exploded-layers → 3d-perspective-card → chat-bubbles → chart-bars → review-verdict → opus-shader-orb → quote-testimonial → trend-price-drop |
| [`logistics`](logistics/) | Đơn hàng đi đâu sau khi bạn bấm đặt | `safety-orange` | trend-search-morph → node-graph → blueprint-draw → kinetic-type → hud → split-compare → pentagram-stat → opus-pixel-arcade → logo-outro |
| [`game`](game/) | FPS tụt? Năm việc nên làm trước khi nâng cấp máy | `acid-night` | glitch-title → trend-stat-odometer → hud → diagram-radar → trend-code-diff → thermal-cam → vhs-nosignal → opus-pixel-arcade → trend-live-poll → logo-outro |
| [`giao-duc`](giao-duc/) | Học ít mà nhớ lâu: bốn kỹ thuật có cơ sở | `chalk-marigold` | trend-comment-reply → trend-line → whiteboard-doodle → 3d-flip → opus-handdrawn → timeline → math-manim → meme → vox-highlighter → statement-outro |
| [`lich-su`](lich-su/) | Chữ Quốc ngữ: gần bốn thế kỷ để thành chữ của người Việt | `archive-sepia` | trend-infinite-zoom → trend-timeline-flight → vox-torchlight → vox-newspaper-tear → opus-collage-stopmo → papercut-diorama → cipher-decrypt → 3d-spotlight → vox-investigation-board → logo-outro |
| [`tin-tuc`](tin-tuc/) | Năm bước kiểm tra một tin trước khi chia sẻ | `newsprint-red` | vox-collage → vox-newspaper-tear → suspect-lineup → step-list → opus-cursor-flow → cipher-decrypt → hybrid-vox-geo → dispatch-waveform → trend-word-pop → statement-outro |
| [`phap-ly`](phap-ly/) | Hợp đồng thuê nhà: soi kỹ trước khi ký | `oxblood-paper` | vox-investigation-board → vox-highlighter → trend-code-diff → vox-declassified → diagram-flowchart → forensic-chat → checklist → opus-handdrawn → kinetic-type → logo-outro |
| [`y-te`](y-te/) | Ngủ đủ hay chỉ nằm đủ? Năm thói quen cho giấc ngủ | `clinic-sage` | 3d-spotlight → vox-data-callout → hybrid-math-diagram → whiteboard-doodle → timeline → fitness-workout → opus-kinetic-reel → trend-comment-reply → myth-fact → statement-outro |
| [`moi-truong`](moi-truong/) | Phân loại rác tại nhà: ba thùng là đủ | `moss-paper` | bold-poster → vox-torchlight → opus-collage-stopmo → math-manim → vox-silhouette-file → draw-on → interrogation-log → trend-search-morph → papercut-diorama → statement-outro |
| [`du-lich`](du-lich/) | Hội An trong một ngày: đi gì, ăn gì, tránh gì | `terracotta-sand` | broll → myth-fact → vox-collage → step-list → trend-word-pop → opus-kinetic-reel → meme → interrogation-log → checklist → logo-outro |
| [`bat-dong-san`](bat-dong-san/) | Mua nhà trả góp: làm phép tính trước khi xuống tiền | `limestone-clay` | opus-shader-orb → trend-search-morph → forensic-instrument → trend-line → vox-data-callout → hybrid-math-diagram → geo-sonar-radar → trend-infinite-zoom → kinetic-type → logo-outro |

**Nội dung là ví dụ minh hoạ, không phải tin tức.** Kiến thức phổ thông và mẹo thực hành.
Mọi con số hoặc là phép tính có ghi rõ giả định (lãi kép ở `tai-chinh`, trả góp ở
`bat-dong-san`), hoặc là mốc đã được xác lập (năm 1651, 1865, 1907, 1945 ở `lich-su`;
đường cong quên lãng của Ebbinghaus, 1885, ở `giao-duc`; khuyến nghị 150 phút vận động mỗi
tuần của WHO ở `y-te`). Sản phẩm, bình luận và lời chứng thực đều là minh hoạ. `tai-chinh`,
`bat-dong-san`, `phap-ly` và `y-te` không phải lời khuyên chuyên môn và có nói rõ điều đó.

Bốn video có meme (`cong-nghe-ai`, `marketing`, `giao-duc`, `du-lich`), dựng qua memegen.link.
`du-lich` mở bằng cảnh bản đồ vệ tinh rơi xuống Hội An. Ghi nguồn bản đồ được vẽ cố định
trên clip và ghi lại trong [`du-lich/credits.txt`](du-lich/credits.txt).

Không đốt phụ đề vào các video này: chữ quan trọng đã nằm trong khung hình động, phụ đề đè lên
sẽ thành hai lớp chữ chồng nhau. Phụ đề sáng từng từ dành cho cảnh quay thật — xem
[`../talking-head-demo/`](../talking-head-demo/).

## Làm lại

```bash
node examples/niche-samples/make-scripts.mjs tai-chinh             # ghi script.json (bỏ tên = cả 16)
node scripts/video/validate-script.mjs examples/niche-samples/tai-chinh/script.json --strict
node scripts/video/render.mjs examples/niche-samples/tai-chinh/script.json --captions off
node scripts/video/make-preview.mjs examples/niche-samples/tai-chinh/video.mp4      --mp4 examples/niche-samples/tai-chinh/video.mp4               # preview.webp + bản nén 540p
```

Kịch bản nằm ở [`niches-1.mjs`](niches-1.mjs) (công nghệ, kinh doanh, game) và
[`niches-2.mjs`](niches-2.mjs) (giáo dục, lịch sử, tin tức, pháp lý, sức khoẻ, môi trường, du
lịch, bất động sản). Mỗi thư mục chỉ giữ `script.json`, `video.mp4` (540×960) và
`preview.webp`; file tạm của lần render (clip từng cảnh, giọng đọc) đã xoá theo quy ước của kit.
