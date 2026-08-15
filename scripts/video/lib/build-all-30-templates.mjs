// build-all-30-templates.mjs — generates 30 new templates across 6 distinct categories.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const TEMPLATES_DIR = path.join(ROOT, "video-templates");

const TEMPLATES = [
  // =========================================================================
  // GROUP 1: FINTECH, CRYPTO & TRADING
  // =========================================================================
  {
    id: "frame-stock-candlestick",
    name: "Stock Candlestick Chart",
    category: "fintech",
    fonts: ["JetBrains Mono:wght@400;700", "Chakra Petch:wght@500;700", "Be Vietnam Pro:wght@400;600"],
    bg: "#0B0E14",
    slots: {
      ticker: "BTC/USDT",
      price: "$96,450.00",
      change: "+14.2%",
      kicker: "PHÂN TÍCH KỸ THUẬT",
      headline: "Đột phá kháng cự then chốt",
      res_level: "Cản $95,000",
      indicator: "RSI 68.4 · Volume Spike +240%",
      summary: "Áp lực mua gom từ tổ chức đẩy giá vượt đỉnh 30 ngày."
    },
    markup: `
      <div class="header">
        <div class="ticker-box">
          <span class="ticker-badge" data-slot="ticker"></span>
          <span class="price-val" data-slot="price"></span>
          <span class="change-tag" data-slot="change"></span>
        </div>
        <div class="kicker" data-slot="kicker"></div>
        <h1 class="headline" data-slot="headline"></h1>
      </div>
      <div class="chart-canvas-wrap">
        <div class="chart-grid">
          <div class="resistance-line"><span class="res-label" data-slot="res_level"></span></div>
          <div class="candles">
            <div class="candle red" style="--h: 40px; --top: 60px;"></div>
            <div class="candle red" style="--h: 55px; --top: 80px;"></div>
            <div class="candle green" style="--h: 65px; --top: 50px;"></div>
            <div class="candle green" style="--h: 80px; --top: 35px;"></div>
            <div class="candle green breakout" style="--h: 120px; --top: 10px;"><div class="sparkle"></div></div>
          </div>
          <div class="volume-bars">
            <div class="vol" style="--vh: 20%;"></div>
            <div class="vol" style="--vh: 35%;"></div>
            <div class="vol" style="--vh: 50%;"></div>
            <div class="vol" style="--vh: 65%;"></div>
            <div class="vol surge" style="--vh: 95%;"></div>
          </div>
        </div>
      </div>
      <div class="footer-box">
        <div class="indicator" data-slot="indicator"></div>
        <p class="summary" data-slot="summary"></p>
      </div>
    `,
    styles: `
      .header { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
      .ticker-box { display: flex; align-items: center; gap: 16px; }
      .ticker-badge { background: #1F2937; color: #F3F4F6; font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700; padding: 6px 16px; border-radius: 8px; border: 1px solid #374151; }
      .price-val { font-family: 'Chakra Petch', sans-serif; font-size: 40px; font-weight: 700; color: #00E676; text-shadow: 0 0 20px rgba(0,230,118,0.3); }
      .change-tag { background: rgba(0,230,118,0.15); color: #00E676; font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 700; padding: 4px 12px; border-radius: 6px; }
      .kicker { font-family: 'JetBrains Mono', monospace; font-size: 20px; color: #9CA3AF; letter-spacing: 2px; text-transform: uppercase; }
      .headline { font-family: 'Chakra Petch', sans-serif; font-size: 48px; font-weight: 700; color: #FFFFFF; line-height: 1.2; }
      .chart-canvas-wrap { background: #111827; border: 1px solid #1F2937; border-radius: 16px; padding: 30px; position: relative; height: 340px; overflow: hidden; margin-bottom: 24px; }
      .chart-grid { position: relative; height: 100%; display: flex; flex-direction: column; justify-content: space-between; border-left: 2px solid #374151; border-bottom: 2px solid #374151; }
      .resistance-line { position: absolute; top: 30px; left: 0; right: 0; border-top: 2px dashed #EF4444; display: flex; justify-content: flex-end; }
      .res-label { background: #EF4444; color: #FFF; font-size: 14px; font-family: 'JetBrains Mono'; padding: 2px 8px; border-radius: 4px; }
      .candles { position: absolute; left: 40px; right: 40px; top: 0; bottom: 80px; display: flex; justify-content: space-around; align-items: flex-end; }
      .candle { width: 36px; border-radius: 4px; position: relative; height: var(--h); margin-bottom: var(--top); }
      .candle.green { background: #00E676; box-shadow: 0 0 15px rgba(0,230,118,0.4); }
      .candle.red { background: #FF1744; box-shadow: 0 0 15px rgba(255,23,68,0.4); }
      .candle::before { content: ''; position: absolute; left: 50%; top: -20px; bottom: -20px; width: 2px; transform: translateX(-50%); background: inherit; z-index: -1; }
      .candle.breakout { animation: pulseBreakout 1.5s infinite alternate; }
      @keyframes pulseBreakout { 0% { transform: scale(1); } 100% { transform: scale(1.08); filter: brightness(1.2); } }
      .volume-bars { position: absolute; left: 40px; right: 40px; bottom: 10px; height: 60px; display: flex; justify-content: space-around; align-items: flex-end; }
      .vol { width: 28px; height: var(--vh); background: rgba(156,163,175,0.3); border-radius: 4px; }
      .vol.surge { background: #00E676; }
      .footer-box { background: #161F30; border-left: 4px solid #00E676; padding: 18px 24px; border-radius: 8px; }
      .indicator { font-family: 'JetBrains Mono', monospace; font-size: 22px; color: #38BDF8; font-weight: 700; margin-bottom: 6px; }
      .summary { font-family: 'Be Vietnam Pro', sans-serif; font-size: 24px; color: #D1D5DB; line-height: 1.4; }
    `
  },
  {
    id: "frame-crypto-orderbook",
    name: "Crypto Orderbook Depth",
    category: "fintech",
    fonts: ["JetBrains Mono:wght@400;700", "Chakra Petch:wght@600;700", "Be Vietnam Pro:wght@400;600"],
    bg: "#080B11",
    slots: {
      pair: "ETH / USDT",
      spread: "Spread: 0.01 USDT (0.00%)",
      bids_title: "BIDS (LỆNH MUA)",
      asks_title: "ASKS (LỆNH BÁN)",
      bids: "3480.50:42.5|3480.00:118.2|3479.50:240.8",
      asks: "3481.00:35.1|3481.50:88.4|3482.00:310.6",
      insight: "Tường mua 240 ETH đang chặn đà giảm."
    },
    markup: `
      <div class="ob-header">
        <h2 class="ob-pair" data-slot="pair"></h2>
        <span class="ob-spread" data-slot="spread"></span>
      </div>
      <div class="ob-body">
        <div class="ob-column bids-col">
          <div class="col-title" data-slot="bids_title"></div>
          <div class="orders-list bids-list"></div>
        </div>
        <div class="ob-column asks-col">
          <div class="col-title" data-slot="asks_title"></div>
          <div class="orders-list asks-list"></div>
        </div>
      </div>
      <div class="ob-footer">
        <div class="pulse-icon"></div>
        <span class="ob-insight" data-slot="insight"></span>
      </div>
    `,
    styles: `
      .ob-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #1F2937; }
      .ob-pair { font-family: 'Chakra Petch', sans-serif; font-size: 40px; color: #FFF; font-weight: 700; }
      .ob-spread { font-family: 'JetBrains Mono', monospace; font-size: 18px; color: #9CA3AF; background: #111827; padding: 6px 14px; border-radius: 6px; }
      .ob-body { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
      .ob-column { background: #0E131F; border: 1px solid #1E293B; border-radius: 12px; padding: 20px; }
      .col-title { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 700; letter-spacing: 1.5px; margin-bottom: 16px; text-align: center; }
      .bids-col .col-title { color: #00E676; }
      .asks-col .col-title { color: #FF1744; }
      .orders-list { display: flex; flex-direction: column; gap: 12px; }
      .order-row { display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 20px; padding: 8px 12px; border-radius: 6px; position: relative; overflow: hidden; }
      .bids-list .order-row { color: #00E676; background: rgba(0,230,118,0.06); }
      .asks-list .order-row { color: #FF1744; background: rgba(255,23,68,0.06); }
      .ob-footer { display: flex; align-items: center; gap: 16px; background: #131B2E; border: 1px solid #2563EB; padding: 18px 24px; border-radius: 10px; }
      .pulse-icon { width: 14px; height: 14px; border-radius: 50%; background: #38BDF8; box-shadow: 0 0 12px #38BDF8; animation: pulseGlow 1s infinite alternate; }
      @keyframes pulseGlow { 0% { opacity: 0.4; } 100% { opacity: 1; } }
      .ob-insight { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #F1F5F9; font-weight: 600; }
    `
  },
  {
    id: "frame-wealth-compound",
    name: "Compound Interest Wealth Curve",
    category: "fintech",
    fonts: ["Plus Jakarta Sans:wght@500;700", "Chakra Petch:wght@700", "Be Vietnam Pro:wght@400;600"],
    bg: "#0A0D14",
    slots: {
      headline: "SỨC MẠNH CỦA LÃI KÉP",
      subline: "Đầu tư $300/tháng ở 2 mốc tuổi khác nhau",
      person_a: "Tuổi 20: $1,280,000",
      person_b: "Tuổi 35: $340,000",
      delta: "Chênh lệch gấp 3.7 lần (+ $940,000)",
      rule: "Thời gian trên thị trường quan trọng hơn căn thời điểm."
    },
    markup: `
      <div class="compound-header">
        <h1 class="c-headline" data-slot="headline"></h1>
        <p class="c-subline" data-slot="subline"></p>
      </div>
      <div class="curve-chart-card">
        <svg class="curve-svg" viewBox="0 0 800 300">
          <path d="M 50 250 Q 300 240 500 180 T 750 40" fill="none" stroke="#00E676" stroke-width="6" class="path-a"/>
          <path d="M 350 250 Q 500 245 650 200 T 750 170" fill="none" stroke="#F59E0B" stroke-width="4" stroke-dasharray="6,6" class="path-b"/>
          <circle cx="750" cy="40" r="8" fill="#00E676"/>
          <circle cx="750" cy="170" r="6" fill="#F59E0B"/>
        </svg>
        <div class="curve-tags">
          <div class="tag-a" data-slot="person_a"></div>
          <div class="tag-b" data-slot="person_b"></div>
        </div>
      </div>
      <div class="delta-badge" data-slot="delta"></div>
      <p class="rule-txt" data-slot="rule"></p>
    `,
    styles: `
      .compound-header { text-align: center; margin-bottom: 24px; }
      .c-headline { font-family: 'Chakra Petch', sans-serif; font-size: 46px; color: #FFF; font-weight: 700; letter-spacing: 1px; }
      .c-subline { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; color: #94A3B8; margin-top: 6px; }
      .curve-chart-card { background: #111827; border: 1px solid #1F2937; border-radius: 16px; padding: 24px; position: relative; margin-bottom: 20px; }
      .curve-svg { width: 100%; height: 220px; }
      .curve-tags { display: flex; justify-content: space-between; margin-top: 12px; }
      .tag-a { color: #00E676; font-family: 'Chakra Petch', sans-serif; font-size: 24px; font-weight: 700; }
      .tag-b { color: #F59E0B; font-family: 'Chakra Petch', sans-serif; font-size: 22px; font-weight: 600; }
      .delta-badge { background: linear-gradient(90deg, rgba(0,230,118,0.2), rgba(0,230,118,0.05)); border: 1px solid #00E676; color: #00E676; font-family: 'Chakra Petch', sans-serif; font-size: 26px; font-weight: 700; text-align: center; padding: 14px; border-radius: 10px; margin-bottom: 14px; }
      .rule-txt { font-family: 'Be Vietnam Pro', sans-serif; font-size: 20px; color: #CBD5E1; text-align: center; font-style: italic; }
    `
  },
  {
    id: "frame-portfolio-donut",
    name: "Portfolio Asset Allocation",
    category: "fintech",
    fonts: ["Chakra Petch:wght@600;700", "Be Vietnam Pro:wght@400;600"],
    bg: "#0B0E17",
    slots: {
      title: "CƠ CẤU DANH MỤC ĐẦU TƯ",
      total_pnl: "Lợi nhuận: +34.2% YTD",
      total_label: "TỔNG 100%",
      items: "Cổ phiếu:45%|Crypto:25%|Bất động sản:20%|Tiền mặt:10%",
      verdict: "Tỷ trọng rủi ro cao chiếm 70% danh mục."
    },
    markup: `
      <div class="pf-header">
        <h2 class="pf-title" data-slot="title"></h2>
        <span class="pf-pnl" data-slot="total_pnl"></span>
      </div>
      <div class="pf-body">
        <div class="donut-chart-box">
          <svg class="donut-svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1E293B" stroke-width="16"/>
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3B82F6" stroke-width="16" stroke-dasharray="107 239" stroke-dashoffset="0"/>
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8B5CF6" stroke-width="16" stroke-dasharray="60 239" stroke-dashoffset="-107"/>
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10B981" stroke-width="16" stroke-dasharray="48 239" stroke-dashoffset="-167"/>
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F59E0B" stroke-width="16" stroke-dasharray="24 239" stroke-dashoffset="-215"/>
          </svg>
          <div class="donut-center">
            <span class="center-val" data-slot="total_label"></span>
          </div>
        </div>
        <div class="pf-legend-list"></div>
      </div>
      <div class="pf-verdict" data-slot="verdict"></div>
    `,
    styles: `
      .pf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
      .pf-title { font-family: 'Chakra Petch', sans-serif; font-size: 36px; color: #FFF; font-weight: 700; }
      .pf-pnl { background: rgba(16,185,129,0.15); color: #10B981; font-family: 'Chakra Petch', sans-serif; font-size: 20px; font-weight: 700; padding: 6px 16px; border-radius: 8px; border: 1px solid #10B981; }
      .pf-body { display: flex; align-items: center; gap: 30px; background: #111827; border: 1px solid #1F2937; border-radius: 16px; padding: 24px; margin-bottom: 20px; }
      .donut-chart-box { position: relative; width: 180px; height: 180px; flex-shrink: 0; }
      .donut-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
      .donut-center { position: absolute; inset: 0; display: flex; justify-content: center; align-items: center; text-align: center; }
      .center-val { font-size: 20px; color: #FFF; font-weight: 700; font-family: 'Chakra Petch'; }
      .pf-legend-list { flex: 1; display: flex; flex-direction: column; gap: 10px; }
      .legend-item { display: flex; justify-content: space-between; font-family: 'Be Vietnam Pro', sans-serif; font-size: 20px; color: #E2E8F0; padding: 6px 10px; background: #1E293B; border-radius: 6px; }
      .pf-verdict { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #FCD34D; background: rgba(245,158,11,0.1); border-left: 4px solid #F59E0B; padding: 14px 20px; border-radius: 6px; }
    `
  },
  {
    id: "frame-inflation-purchasing-power",
    name: "Inflation Purchasing Power",
    category: "fintech",
    fonts: ["Alfa Slab One", "Chakra Petch:wght@700", "Be Vietnam Pro:wght@400;600"],
    bg: "#10131A",
    slots: {
      headline: "100K MUA ĐƯỢC GÌ THEO THỜI GIAN?",
      subline: "Sức mua thực tế bị bào mòn bởi lạm phát",
      era_1: "Năm 2000: Đổ đầy 10 bình xăng",
      era_2: "Năm 2015: Đổ được 4 bình xăng",
      era_3: "Năm 2026: Đổ chưa tới 1.5 bình",
      insight: "Tiền mặt để yên là tài sản tự bốc hơi mỗi năm."
    },
    markup: `
      <div class="inf-header">
        <h1 class="inf-headline" data-slot="headline"></h1>
        <p class="inf-subline" data-slot="subline"></p>
      </div>
      <div class="inf-timeline">
        <div class="era-card c1">
          <div class="era-desc" data-slot="era_1"></div>
        </div>
        <div class="era-card c2">
          <div class="era-desc" data-slot="era_2"></div>
        </div>
        <div class="era-card c3">
          <div class="era-desc" data-slot="era_3"></div>
        </div>
      </div>
      <div class="inf-insight" data-slot="insight"></div>
    `,
    styles: `
      .inf-header { text-align: center; margin-bottom: 24px; }
      .inf-headline { font-family: 'Alfa Slab One', cursive; font-size: 42px; color: #EF4444; line-height: 1.2; text-shadow: 0 0 20px rgba(239,68,68,0.3); }
      .inf-subline { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #94A3B8; margin-top: 6px; }
      .inf-timeline { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
      .era-card { display: flex; align-items: center; gap: 16px; background: #1E293B; border-radius: 12px; padding: 16px 20px; border-left: 6px solid #64748B; }
      .era-card.c1 { border-color: #10B981; }
      .era-card.c2 { border-color: #F59E0B; }
      .era-card.c3 { border-color: #EF4444; }
      .era-desc { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #E2E8F0; }
      .inf-insight { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #FCA5A5; background: rgba(239,68,68,0.15); border: 1px solid #EF4444; padding: 14px; text-align: center; border-radius: 10px; font-weight: 600; }
    `
  },

  // =========================================================================
  // GROUP 2: SCIENCE & PSYCHOLOGY
  // =========================================================================
  {
    id: "frame-iceberg-levels",
    name: "Iceberg 3-Tier Explainer",
    category: "science",
    fonts: ["Plus Jakarta Sans:wght@600;800", "Be Vietnam Pro:wght@400;600"],
    bg: "#0B132B",
    slots: {
      headline: "TẢNG BĂNG CHÌM CỦA SỰ THÀNH CÔNG",
      tag_surface: "10% TRÊN MẶT NƯỚC",
      level_1: "TẦNG NỔI: Kết quả ai cũng thấy (Tiền tài, Danh tiếng, Xe sang)",
      tag_middle: "50% DƯỚI MẶT NƯỚC",
      level_2: "TẦNG TRUNG: Kỷ luật ngầm (Thức khuya dậy sớm, Bị từ chối 100 lần)",
      tag_deep: "40% ĐÁY TỐI SÂU THẲM",
      level_3: "ĐÁY SÂU: Nỗi đau & Hy sinh (Cô độc, Nghi ngờ bản thân, Rủi ro phá sản)",
      takeaway: "Đừng so sánh hậu trường của bạn với sân khấu của người khác."
    },
    markup: `
      <div class="ice-header">
        <h1 class="ice-title" data-slot="headline"></h1>
      </div>
      <div class="ice-levels">
        <div class="level-box surface">
          <div class="level-tag" data-slot="tag_surface"></div>
          <div class="level-desc" data-slot="level_1"></div>
        </div>
        <div class="level-box middle">
          <div class="level-tag" data-slot="tag_middle"></div>
          <div class="level-desc" data-slot="level_2"></div>
        </div>
        <div class="level-box deep">
          <div class="level-tag" data-slot="tag_deep"></div>
          <div class="level-desc" data-slot="level_3"></div>
        </div>
      </div>
      <div class="ice-takeaway" data-slot="takeaway"></div>
    `,
    styles: `
      .ice-header { text-align: center; margin-bottom: 24px; }
      .ice-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 44px; color: #38BDF8; font-weight: 800; text-shadow: 0 0 25px rgba(56,189,248,0.4); }
      .ice-levels { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; position: relative; }
      .level-box { border-radius: 12px; padding: 16px 20px; }
      .level-box.surface { background: #1C2541; border: 1px solid #38BDF8; }
      .level-box.middle { background: #0B1D3A; border: 1px solid #1D4ED8; }
      .level-box.deep { background: #050C1A; border: 1px solid #4338CA; }
      .level-tag { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; color: #00E5FF; margin-bottom: 6px; letter-spacing: 1px; }
      .level-desc { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #E2E8F0; }
      .ice-takeaway { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #F8FAFC; background: rgba(56,189,248,0.12); border-left: 4px solid #38BDF8; padding: 14px 20px; border-radius: 8px; }
    `
  },
  {
    id: "frame-brain-synapse",
    name: "Brain Synapse Neural Activation",
    category: "science",
    fonts: ["Plus Jakarta Sans:wght@600;800", "Be Vietnam Pro:wght@400;600"],
    bg: "#0B0C16",
    slots: {
      headline: "HIỆU ỨNG DOPAMINE TRONG NÃO BỘ",
      molecule: "DOPAMINE (C8H11NO2)",
      node_1: "Thèm muốn",
      node_2: "Kích thích",
      node_3: "Thỏa mãn ngắn hạn",
      trigger: "Kích hoạt: Thông báo điện thoại, Lướt video ngắn",
      reaction: "Vỏ não trước trán giảm tập trung 40%",
      warning: "Cơn nghiện dopamine rẻ tiền bào mòn ý chí dài hạn."
    },
    markup: `
      <div class="brain-header">
        <h1 class="b-title" data-slot="headline"></h1>
        <span class="mol-badge" data-slot="molecule"></span>
      </div>
      <div class="brain-visual-card">
        <div class="synapse-nodes">
          <div class="node n1"><span data-slot="node_1"></span></div>
          <div class="node n2"><span data-slot="node_2"></span></div>
          <div class="node n3 active"><span data-slot="node_3"></span></div>
        </div>
        <div class="info-grid">
          <div class="info-col trigger-box">
            <p class="col-val" data-slot="trigger"></p>
          </div>
          <div class="info-col reaction-box">
            <p class="col-val" data-slot="reaction"></p>
          </div>
        </div>
      </div>
      <div class="brain-warning" data-slot="warning"></div>
    `,
    styles: `
      .brain-header { text-align: center; margin-bottom: 24px; }
      .b-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 44px; color: #A855F7; font-weight: 800; text-shadow: 0 0 20px rgba(168,85,247,0.3); }
      .mol-badge { background: #2E1065; color: #D8B4FE; font-family: 'Plus Jakarta Sans'; font-size: 18px; font-weight: 700; padding: 4px 14px; border-radius: 20px; border: 1px solid #7C3AED; display: inline-block; margin-top: 8px; }
      .brain-visual-card { background: #131127; border: 1px solid #3B0764; border-radius: 16px; padding: 24px; margin-bottom: 20px; }
      .synapse-nodes { display: flex; justify-content: space-around; margin-bottom: 24px; }
      .node { background: #1F1D36; border: 2px solid #7C3AED; color: #FFF; font-family: 'Plus Jakarta Sans'; font-size: 18px; font-weight: 700; padding: 12px 18px; border-radius: 30px; position: relative; }
      .node.active { border-color: #EC4899; color: #F472B6; box-shadow: 0 0 15px rgba(236,72,153,0.5); }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .info-col { background: #181530; padding: 16px; border-radius: 10px; border-left: 4px solid #A855F7; }
      .col-val { font-family: 'Be Vietnam Pro', sans-serif; font-size: 20px; color: #E2E8F0; margin-top: 6px; }
      .brain-warning { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #F472B6; background: rgba(236,72,153,0.12); border: 1px solid #EC4899; padding: 14px 20px; border-radius: 10px; text-align: center; }
    `
  },
  {
    id: "frame-habit-loop",
    name: "Habit Loop 4-Quadrant",
    category: "science",
    fonts: ["Plus Jakarta Sans:wght@700;800", "Be Vietnam Pro:wght@400;600"],
    bg: "#0D111A",
    slots: {
      headline: "VÒNG LẶP 4 BƯỚC CỦA MỌI THÓI QUEN",
      cue: "1. GỢI Ý: Chuông thông báo reo",
      craving: "2. KHAO KHÁT: Muốn biết ai nhắn gì",
      response: "3. HÀNH ĐỘNG: Cầm điện thoại mở khóa",
      reward: "4. PHẦN THƯỞNG: Đọc tin nhắn (Dopamine)",
      key_point: "Muốn bỏ thói quen xấu: Cắt đứt bước Gợi Ý."
    },
    markup: `
      <div class="habit-header">
        <h1 class="h-title" data-slot="headline"></h1>
      </div>
      <div class="habit-grid">
        <div class="h-card c-cue">
          <div class="h-text" data-slot="cue"></div>
        </div>
        <div class="h-card c-craving">
          <div class="h-text" data-slot="craving"></div>
        </div>
        <div class="h-card c-response">
          <div class="h-text" data-slot="response"></div>
        </div>
        <div class="h-card c-reward">
          <div class="h-text" data-slot="reward"></div>
        </div>
      </div>
      <div class="h-key" data-slot="key_point"></div>
    `,
    styles: `
      .habit-header { text-align: center; margin-bottom: 24px; }
      .h-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 42px; color: #FFF; font-weight: 800; }
      .habit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
      .h-card { background: #161F30; border: 1px solid #1E293B; border-radius: 12px; padding: 20px; display: flex; align-items: center; }
      .c-cue { border-left: 6px solid #38BDF8; }
      .c-craving { border-left: 6px solid #A855F7; }
      .c-response { border-left: 6px solid #F59E0B; }
      .c-reward { border-left: 6px solid #10B981; }
      .h-text { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #E2E8F0; font-weight: 600; }
      .h-key { font-family: 'Be Vietnam Pro', sans-serif; font-size: 24px; color: #38BDF8; background: rgba(56,189,248,0.12); border: 1px solid #38BDF8; padding: 14px; text-align: center; border-radius: 10px; font-weight: 700; }
    `
  },
  {
    id: "frame-dna-helix-breakdown",
    name: "DNA Helix Genetic Breakdown",
    category: "science",
    fonts: ["Plus Jakarta Sans:wght@600;800", "Be Vietnam Pro:wght@400;600"],
    bg: "#080F1E",
    slots: {
      headline: "CÔNG NGHỆ CHỈNH SỬA GEN CRISPR",
      target_gene: "Đoạn mã đột biến: CAS-9 TARGET #4",
      mechanism: "Cắt đứt đoạn ADN lỗi và thay thế bằng chuỗi chuẩn",
      application: "Điều trị bệnh di truyền & ung thư",
      impact: "Mở ra kỷ nguyên can thiệp sinh học trực tiếp."
    },
    markup: `
      <div class="dna-header">
        <h1 class="dna-title" data-slot="headline"></h1>
        <span class="gene-badge" data-slot="target_gene"></span>
      </div>
      <div class="dna-visual-box">
        <div class="dna-details">
          <div class="detail-row">
            <p class="d-val" data-slot="mechanism"></p>
          </div>
          <div class="detail-row">
            <p class="d-val" data-slot="application"></p>
          </div>
        </div>
      </div>
      <div class="dna-impact" data-slot="impact"></div>
    `,
    styles: `
      .dna-header { text-align: center; margin-bottom: 24px; }
      .dna-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 42px; color: #00E5FF; font-weight: 800; }
      .gene-badge { background: #132F4C; color: #38BDF8; font-family: 'Plus Jakarta Sans'; font-size: 18px; font-weight: 700; padding: 4px 14px; border-radius: 20px; border: 1px solid #0284C7; display: inline-block; margin-top: 8px; }
      .dna-visual-box { background: #0D1E36; border: 1px solid #1E3A8A; border-radius: 16px; padding: 24px; margin-bottom: 20px; }
      .dna-details { display: flex; flex-direction: column; gap: 12px; }
      .d-val { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #E2E8F0; }
      .dna-impact { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #F8FAFC; background: rgba(0,229,255,0.12); border-left: 4px solid #00E5FF; padding: 14px 20px; border-radius: 8px; font-weight: 600; }
    `
  },
  {
    id: "frame-bell-curve-iq",
    name: "Gaussian Bell Curve Distribution",
    category: "science",
    fonts: ["Plus Jakarta Sans:wght@600;800", "Be Vietnam Pro:wght@400;600"],
    bg: "#0A0E17",
    slots: {
      headline: "HIỆU ỨNG TỰ TIN THÁI QUÁ (DUNNING-KRUGER)",
      low_group: "Biết 1 chút: Tự tin 100% (Đỉnh cao ngu ngốc)",
      mid_group: "Học sâu hơn: Hoang mang (Thung lũng tuyệt vọng)",
      high_group: "Chuyên gia: Cẩn trọng (Dốc nghiêng giác ngộ)",
      lesson: "Người càng giỏi càng nhận ra mình biết quá ít."
    },
    markup: `
      <div class="bell-header">
        <h1 class="bell-title" data-slot="headline"></h1>
      </div>
      <div class="bell-curve-card">
        <svg class="bell-svg" viewBox="0 0 800 250">
          <path d="M 50 220 Q 200 40 400 20 T 750 220" fill="none" stroke="#6366F1" stroke-width="4"/>
          <line x1="200" y1="40" x2="200" y2="220" stroke="#EF4444" stroke-dasharray="4,4"/>
          <line x1="450" y1="180" x2="450" y2="220" stroke="#F59E0B" stroke-dasharray="4,4"/>
          <line x1="700" y1="120" x2="700" y2="220" stroke="#10B981" stroke-dasharray="4,4"/>
          <circle cx="200" cy="40" r="8" fill="#EF4444"/>
          <circle cx="450" cy="180" r="8" fill="#F59E0B"/>
          <circle cx="700" cy="120" r="8" fill="#10B981"/>
        </svg>
        <div class="curve-phases">
          <div class="phase p-red" data-slot="low_group"></div>
          <div class="phase p-yel" data-slot="mid_group"></div>
          <div class="phase p-grn" data-slot="high_group"></div>
        </div>
      </div>
      <div class="bell-lesson" data-slot="lesson"></div>
    `,
    styles: `
      .bell-header { text-align: center; margin-bottom: 24px; }
      .bell-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 40px; color: #FFF; font-weight: 800; }
      .bell-curve-card { background: #111827; border: 1px solid #1F2937; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
      .bell-svg { width: 100%; height: 180px; }
      .curve-phases { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
      .phase { font-family: 'Be Vietnam Pro', sans-serif; font-size: 18px; padding: 8px 14px; border-radius: 6px; font-weight: 600; }
      .p-red { background: rgba(239,68,68,0.15); color: #FCA5A5; border-left: 4px solid #EF4444; }
      .p-yel { background: rgba(245,158,11,0.15); color: #FCD34D; border-left: 4px solid #F59E0B; }
      .p-grn { background: rgba(16,185,129,0.15); color: #6EE7B7; border-left: 4px solid #10B981; }
      .bell-lesson { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #A5B4FC; background: rgba(99,102,241,0.12); border: 1px solid #6366F1; padding: 14px; text-align: center; border-radius: 8px; font-weight: 600; }
    `
  },

  // =========================================================================
  // GROUP 3: DOCUMENTARY, INVESTIGATION & BUSINESS WARS
  // =========================================================================
  {
    id: "frame-magnates-polaroid-desk",
    name: "Detective Polaroid Investigation Desk",
    category: "documentary",
    fonts: ["Special Elite", "Cinzel:wght@700", "Be Vietnam Pro:wght@400;600"],
    bg: "#1A1510",
    slots: {
      headline: "HỒ SƠ ĐIỀU TRA MỐI QUAN HỆ NGẦM",
      case_no: "CASE FILE #8849-CLASSIFIED",
      target_a: "Nhân vật A: Cựu CEO tập đoàn",
      target_b: "Công ty ma tại Quần đảo Cayman",
      connection: "Dòng vốn 500 triệu USD chuyển dịch bí mật",
      verdict: "Tất cả manh mối đều chỉ về một người đứng sau."
    },
    markup: `
      <div class="desk-header">
        <span class="case-stamp" data-slot="case_no"></span>
        <h1 class="desk-title" data-slot="headline"></h1>
      </div>
      <div class="desk-surface">
        <div class="polaroid-card p-left">
          <div class="p-caption" data-slot="target_a"></div>
        </div>
        <div class="connection-tag" data-slot="connection"></div>
        <div class="polaroid-card p-right">
          <div class="p-caption" data-slot="target_b"></div>
        </div>
      </div>
      <div class="desk-verdict" data-slot="verdict"></div>
    `,
    styles: `
      .desk-header { text-align: center; margin-bottom: 24px; }
      .case-stamp { font-family: 'Special Elite', cursive; color: #EF4444; border: 2px solid #EF4444; padding: 4px 14px; border-radius: 4px; display: inline-block; font-size: 18px; transform: rotate(-2deg); margin-bottom: 8px; }
      .desk-title { font-family: 'Cinzel', serif; font-size: 42px; color: #E5E7EB; font-weight: 700; }
      .desk-surface { background: #261F17; border: 2px solid #443729; border-radius: 16px; padding: 30px; position: relative; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; height: 260px; }
      .polaroid-card { background: #F3F4F6; color: #111827; padding: 16px; border-radius: 4px; width: 240px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); position: relative; z-index: 2; transform: rotate(-3deg); }
      .p-right { transform: rotate(4deg); }
      .p-caption { font-family: 'Special Elite', cursive; font-size: 18px; text-align: center; color: #1F2937; }
      .connection-tag { background: #991B1B; color: #FEF2F2; font-family: 'Special Elite'; font-size: 16px; padding: 8px 14px; border-radius: 6px; z-index: 3; text-align: center; max-width: 240px; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
      .desk-verdict { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #FCD34D; background: rgba(217,119,6,0.15); border-left: 4px solid #D97706; padding: 14px 20px; border-radius: 6px; }
    `
  },
  {
    id: "frame-stock-ticker-tape",
    name: "Wall Street LED Ticker Tape",
    category: "documentary",
    fonts: ["Chakra Petch:wght@700", "Be Vietnam Pro:wght@400;600"],
    bg: "#0A0A0A",
    slots: {
      breaking: "BẢN TIN KHẨN CẤP · PHỐ WALL",
      ticker_feed: "AAPL -4.2% · NVDA +8.6% · TSLA -12.1% · BTC +15.4%",
      headline: "Đợt bán tháo kích hoạt chuỗi thanh lý 2 tỷ USD",
      context: "Các quỹ đầu cơ đồng loạt rút vốn khỏi nhóm cổ phiếu công nghệ."
    },
    markup: `
      <div class="tt-header">
        <span class="tt-badge" data-slot="breaking"></span>
      </div>
      <div class="led-ticker-wrap">
        <div class="led-track" data-slot="ticker_feed"></div>
      </div>
      <div class="tt-main-card">
        <h1 class="tt-headline" data-slot="headline"></h1>
        <p class="tt-context" data-slot="context"></p>
      </div>
    `,
    styles: `
      .tt-header { text-align: center; margin-bottom: 24px; }
      .tt-badge { background: #DC2626; color: #FFF; font-family: 'Chakra Petch', sans-serif; font-size: 22px; font-weight: 700; padding: 6px 20px; border-radius: 6px; letter-spacing: 2px; }
      .led-ticker-wrap { background: #171717; border: 2px solid #333; padding: 16px 24px; border-radius: 10px; margin-bottom: 24px; overflow: hidden; box-shadow: inset 0 0 20px #000; }
      .led-track { font-family: 'Chakra Petch', sans-serif; font-size: 32px; font-weight: 700; color: #F59E0B; text-shadow: 0 0 10px #F59E0B; white-space: nowrap; }
      .tt-main-card { background: #1C1917; border: 1px solid #44403C; border-radius: 16px; padding: 30px; }
      .tt-headline { font-family: 'Be Vietnam Pro', sans-serif; font-size: 40px; font-weight: 700; color: #FFF; line-height: 1.3; margin-bottom: 14px; }
      .tt-context { font-family: 'Be Vietnam Pro', sans-serif; font-size: 24px; color: #D6D3D1; line-height: 1.5; }
    `
  },
  {
    id: "frame-timeline-war-era",
    name: "Burnt Parchment Historical Timeline",
    category: "documentary",
    fonts: ["Cinzel:wght@600;700", "Special Elite", "Be Vietnam Pro:wght@400;600"],
    bg: "#181410",
    slots: {
      headline: "DÒNG THỜI GIAN BIẾN CỐ LỊCH SỬ",
      event_1: "1997: Khủng hoảng tài chính Châu Á bùng nổ",
      event_2: "2008: Cú sụp đổ Lehman Brothers & bong bóng nhà đất",
      event_3: "2020: Đại dịch & đợt bơm tiền kỷ lục lịch sử",
      conclusion: "Lịch sử không lặp lại nguyên vẹn, nhưng luôn có cùng nhịp điệu."
    },
    markup: `
      <div class="war-header">
        <h1 class="war-title" data-slot="headline"></h1>
      </div>
      <div class="war-timeline">
        <div class="war-event">
          <div class="event-txt" data-slot="event_1"></div>
        </div>
        <div class="war-event">
          <div class="event-txt" data-slot="event_2"></div>
        </div>
        <div class="war-event">
          <div class="event-txt" data-slot="event_3"></div>
        </div>
      </div>
      <div class="war-conclusion" data-slot="conclusion"></div>
    `,
    styles: `
      .war-header { text-align: center; margin-bottom: 26px; }
      .war-title { font-family: 'Cinzel', serif; font-size: 42px; color: #F59E0B; font-weight: 700; letter-spacing: 1px; }
      .war-timeline { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }
      .war-event { display: flex; align-items: center; }
      .event-txt { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #E5E7EB; background: #261F17; padding: 14px 20px; border-radius: 8px; border-left: 6px solid #D97706; flex: 1; }
      .war-conclusion { font-family: 'Special Elite', cursive; font-size: 22px; color: #FDE68A; background: rgba(217,119,6,0.15); border: 1px solid #D97706; padding: 14px 20px; text-align: center; border-radius: 8px; }
    `
  },
  {
    id: "frame-document-redacted",
    name: "Declassified Redacted Secret Document",
    category: "documentary",
    fonts: ["Special Elite", "Cinzel:wght@700", "Be Vietnam Pro:wght@400;600"],
    bg: "#141414",
    slots: {
      classification: "TOP SECRET // DECLASSIFIED",
      doc_title: "BÁO CÁO THẨM ĐỊNH NỘI BỘ #09",
      secret_text: "Thỏa thuận bí mật trị giá 2.4 tỷ USD đã được ký kết",
      revealed_info: "Các điều khoản bảo mật chỉ có hiệu lực trong 5 năm.",
      summary: "Sự thật bị che giấu suốt một thập kỷ vừa được công bố."
    },
    markup: `
      <div class="redact-header">
        <span class="stamp-top" data-slot="classification"></span>
        <h2 class="doc-title" data-slot="doc_title"></h2>
      </div>
      <div class="document-sheet">
        <div class="redact-line">
          <p class="secret-revealed" data-slot="secret_text"></p>
        </div>
        <div class="doc-body-txt" data-slot="revealed_info"></div>
      </div>
      <div class="doc-summary" data-slot="summary"></div>
    `,
    styles: `
      .redact-header { text-align: center; margin-bottom: 24px; }
      .stamp-top { font-family: 'Special Elite', cursive; color: #EF4444; border: 2px solid #EF4444; padding: 4px 16px; font-size: 18px; display: inline-block; transform: rotate(1deg); margin-bottom: 8px; }
      .doc-title { font-family: 'Cinzel', serif; font-size: 38px; color: #F3F4F6; }
      .document-sheet { background: #27272A; border: 1px solid #3F3F46; border-radius: 12px; padding: 26px; margin-bottom: 20px; }
      .redact-line { position: relative; margin-bottom: 14px; }
      .secret-revealed { font-family: 'Special Elite', cursive; font-size: 26px; color: #F87171; background: rgba(239,68,68,0.1); border-left: 4px solid #EF4444; padding: 8px 14px; }
      .doc-body-txt { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #D4D4D8; line-height: 1.5; }
      .doc-summary { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #FDE047; background: rgba(234,179,8,0.12); border: 1px solid #EAB308; padding: 14px 20px; border-radius: 8px; text-align: center; }
    `
  },
  {
    id: "frame-money-flow-conduit",
    name: "Offshore Money Flow Conduit",
    category: "documentary",
    fonts: ["Chakra Petch:wght@600;700", "Be Vietnam Pro:wght@400;600"],
    bg: "#0D1117",
    slots: {
      headline: "ĐƯỜNG ĐI CỦA DÒNG TIỀN NÉ THUẾ",
      source_entity: "Tập Đoàn Mẹ (Hoa Kỳ)",
      conduit_entity: "Công Ty Trung Gian (Ireland)",
      tax_haven: "Thiên Đường Thuế (Bermuda)",
      savings: "Thuế thực nộp: Giảm từ 35% xuống 0.05%"
    },
    markup: `
      <div class="mf-header">
        <h1 class="mf-title" data-slot="headline"></h1>
      </div>
      <div class="flow-chain">
        <div class="chain-box b-source">
          <div class="box-name" data-slot="source_entity"></div>
        </div>
        <div class="chain-box b-conduit">
          <div class="box-name" data-slot="conduit_entity"></div>
        </div>
        <div class="chain-box b-haven">
          <div class="box-name" data-slot="tax_haven"></div>
        </div>
      </div>
      <div class="savings-badge" data-slot="savings"></div>
    `,
    styles: `
      .mf-header { text-align: center; margin-bottom: 24px; }
      .mf-title { font-family: 'Chakra Petch', sans-serif; font-size: 40px; color: #FFF; font-weight: 700; }
      .flow-chain { display: flex; justify-content: space-between; align-items: center; background: #161B22; border: 1px solid #30363D; border-radius: 16px; padding: 24px; margin-bottom: 20px; }
      .chain-box { background: #21262D; border-radius: 10px; padding: 20px; text-align: center; width: 220px; border: 1px solid #30363D; }
      .b-source { border-top: 4px solid #3B82F6; }
      .b-conduit { border-top: 4px solid #F59E0B; }
      .b-haven { border-top: 4px solid #10B981; }
      .box-name { font-family: 'Be Vietnam Pro', sans-serif; font-size: 18px; color: #E6EDF3; font-weight: 600; }
      .savings-badge { font-family: 'Chakra Petch', sans-serif; font-size: 26px; color: #10B981; background: rgba(16,185,129,0.15); border: 1px solid #10B981; padding: 14px; text-align: center; border-radius: 8px; font-weight: 700; }
    `
  },

  // =========================================================================
  // GROUP 4: VIRAL HOOKS & GAMIFICATION
  // =========================================================================
  {
    id: "frame-tier-list",
    name: "Viral Tier List Ranker (S-A-B-C-D)",
    category: "viral",
    fonts: ["Montserrat:wght@800;900", "Be Vietnam Pro:wght@400;600"],
    bg: "#181124",
    slots: {
      headline: "XẾP HẠNG CÔNG CỤ AI NĂM 2026",
      tier_s: "S: Claude 3.7 Sonnet, DeepSeek V3",
      tier_a: "A: GPT-4.5, Gemini 2.0 Pro",
      tier_b: "B: Copilot, Perplexity",
      verdict: "Tier S thống trị tuyệt đối về khả năng coding."
    },
    markup: `
      <div class="tl-header">
        <h1 class="tl-title" data-slot="headline"></h1>
      </div>
      <div class="tier-board">
        <div class="tier-row row-s">
          <div class="tier-items" data-slot="tier_s"></div>
        </div>
        <div class="tier-row row-a">
          <div class="tier-items" data-slot="tier_a"></div>
        </div>
        <div class="tier-row row-b">
          <div class="tier-items" data-slot="tier_b"></div>
        </div>
      </div>
      <div class="tl-verdict" data-slot="verdict"></div>
    `,
    styles: `
      .tl-header { text-align: center; margin-bottom: 24px; }
      .tl-title { font-family: 'Montserrat', sans-serif; font-size: 42px; color: #FFE600; font-weight: 900; text-shadow: 0 0 20px rgba(255,230,0,0.4); }
      .tier-board { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
      .tier-row { background: #261B38; border-radius: 8px; overflow: hidden; border: 1px solid #44325E; padding: 14px 20px; }
      .row-s { border-left: 8px solid #FF3B30; }
      .row-a { border-left: 8px solid #FF9500; }
      .row-b { border-left: 8px solid #FFCC00; }
      .tier-items { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #F3F4F6; font-weight: 600; }
      .tl-verdict { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #FFF; background: #FF0055; padding: 14px; text-align: center; border-radius: 8px; font-weight: 700; }
    `
  },
  {
    id: "frame-notification-stack",
    name: "Push Notification Cascading Stack",
    category: "viral",
    fonts: ["Plus Jakarta Sans:wght@700;800", "Be Vietnam Pro:wght@400;600"],
    bg: "#0B0813",
    slots: {
      phone_time: "09:41",
      noti_1: "Stripe: Bạn vừa nhận $4,250.00 từ khách hàng A",
      noti_2: "X (Twitter): Bài viết của bạn đã vượt 100,000 lượt xem",
      noti_3: "Discord: 45 thành viên mới vừa tham gia server",
      proof_hook: "Kết quả sau 14 ngày áp dụng chiến lược Content Agent."
    },
    markup: `
      <div class="phone-screen-wrap">
        <div class="phone-clock" data-slot="phone_time"></div>
        <div class="noti-stack">
          <div class="noti-card n-stripe">
            <div class="noti-text" data-slot="noti_1"></div>
          </div>
          <div class="noti-card n-x">
            <div class="noti-text" data-slot="noti_2"></div>
          </div>
          <div class="noti-card n-discord">
            <div class="noti-text" data-slot="noti_3"></div>
          </div>
        </div>
      </div>
      <div class="noti-hook" data-slot="proof_hook"></div>
    `,
    styles: `
      .phone-screen-wrap { background: rgba(30,20,50,0.6); border: 2px solid #581C87; border-radius: 20px; padding: 24px; margin-bottom: 20px; backdrop-filter: blur(10px); }
      .phone-clock { text-align: center; font-family: 'Plus Jakarta Sans'; font-size: 54px; font-weight: 800; color: #FFF; margin-bottom: 20px; }
      .noti-stack { display: flex; flex-direction: column; gap: 12px; }
      .noti-card { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 16px 20px; }
      .noti-text { font-family: 'Be Vietnam Pro', sans-serif; font-size: 20px; color: #FFF; font-weight: 600; }
      .noti-hook { font-family: 'Be Vietnam Pro', sans-serif; font-size: 24px; color: #F0ABFC; background: #581C87; padding: 14px; text-align: center; border-radius: 10px; font-weight: 700; }
    `
  },
  {
    id: "frame-poll-voting",
    name: "Interactive Tug-of-War Community Poll",
    category: "viral",
    fonts: ["Montserrat:wght@800;900", "Be Vietnam Pro:wght@400;600"],
    bg: "#150C22",
    slots: {
      question: "BẠN SẼ CHỌN MÔ HÌNH NÀO NĂM 2026?",
      option_a: "Option A: Tự làm thủ công (18%)",
      option_b: "Option B: Tự động bằng AI Agent (82%)",
      cta: "Bình luận AGENT để nhận bộ source code miễn phí!"
    },
    markup: `
      <div class="poll-header">
        <h1 class="poll-q" data-slot="question"></h1>
      </div>
      <div class="poll-card">
        <div class="poll-bar bar-a">
          <div class="bar-fill fill-a" style="width: 18%;"></div>
          <span class="poll-label" data-slot="option_a"></span>
        </div>
        <div class="poll-bar bar-b winning">
          <div class="bar-fill fill-b" style="width: 82%;"></div>
          <span class="poll-label" data-slot="option_b"></span>
        </div>
      </div>
      <div class="poll-cta" data-slot="cta"></div>
    `,
    styles: `
      .poll-header { text-align: center; margin-bottom: 24px; }
      .poll-q { font-family: 'Montserrat', sans-serif; font-size: 40px; color: #FFF; font-weight: 900; }
      .poll-card { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
      .poll-bar { background: #26183C; border: 2px solid #4C2882; border-radius: 12px; height: 70px; position: relative; overflow: hidden; display: flex; align-items: center; padding: 0 20px; }
      .bar-fill { position: absolute; left: 0; top: 0; bottom: 0; opacity: 0.3; }
      .fill-a { background: #94A3B8; }
      .fill-b { background: #00E676; opacity: 0.4; }
      .poll-bar.winning { border-color: #00E676; }
      .poll-label { position: relative; z-index: 2; font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #FFF; font-weight: 700; }
      .poll-cta { font-family: 'Be Vietnam Pro', sans-serif; font-size: 24px; color: #FFE600; background: #4C2882; padding: 14px; text-align: center; border-radius: 10px; font-weight: 700; }
    `
  },
  {
    id: "frame-speedrun-timer",
    name: "High-Urgency Speedrun Countdown Timer",
    category: "viral",
    fonts: ["JetBrains Mono:wght@700;800", "Be Vietnam Pro:wght@400;600"],
    bg: "#11071F",
    slots: {
      headline: "THỬ THÁCH BUILD AGENT TRONG 60 GIÂY",
      timer_display: "00:48.24",
      milestone_1: "00:15 - Tạo prompt & cấu trúc file",
      milestone_2: "00:30 - Tích hợp TTS & Video templates",
      milestone_3: "00:45 - Render video MP4 hoàn tất",
      outcome: "Kỷ lục mới: Hoàn thành trước thời hạn 12 giây!"
    },
    markup: `
      <div class="sr-header">
        <h1 class="sr-title" data-slot="headline"></h1>
      </div>
      <div class="sr-main">
        <div class="timer-giant" data-slot="timer_display"></div>
        <div class="milestones-box">
          <div class="m-row" data-slot="milestone_1"></div>
          <div class="m-row" data-slot="milestone_2"></div>
          <div class="m-row" data-slot="milestone_3"></div>
        </div>
      </div>
      <div class="sr-outcome" data-slot="outcome"></div>
    `,
    styles: `
      .sr-header { text-align: center; margin-bottom: 20px; }
      .sr-title { font-family: 'JetBrains Mono', monospace; font-size: 38px; color: #FF0055; font-weight: 800; text-shadow: 0 0 20px rgba(255,0,85,0.4); }
      .sr-main { background: #1F0D38; border: 2px solid #FF0055; border-radius: 16px; padding: 24px; margin-bottom: 20px; text-align: center; }
      .timer-giant { font-family: 'JetBrains Mono', monospace; font-size: 64px; font-weight: 800; color: #FFE600; text-shadow: 0 0 20px #FFE600; margin-bottom: 16px; }
      .milestones-box { display: flex; flex-direction: column; gap: 8px; text-align: left; background: #130724; padding: 14px 18px; border-radius: 8px; }
      .m-row { font-family: 'Be Vietnam Pro', sans-serif; font-size: 20px; color: #00E676; font-weight: 600; }
      .sr-outcome { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #000; background: #00E676; padding: 14px; text-align: center; border-radius: 8px; font-weight: 800; }
    `
  },
  {
    id: "frame-card-pack-opening",
    name: "Gacha Rare Card Pack Opening",
    category: "viral",
    fonts: ["Montserrat:wght@800;900", "Be Vietnam Pro:wght@400;600"],
    bg: "#10081E",
    slots: {
      headline: "MỞ KHÓA TÍNH NĂNG ĐẲNG CẤP SSR",
      card_name: "SUPER AGENT V2",
      power_stat: "Power: 9,999+ (Full Autonomous)",
      attribute: "Hệ: Coding + Video Automation",
      rarity: "ĐỘ HIẾM: ULTRA RARE (0.1%)"
    },
    markup: `
      <div class="gacha-header">
        <h1 class="gacha-title" data-slot="headline"></h1>
      </div>
      <div class="holo-card-wrap">
        <div class="holo-card">
          <div class="rarity-tag" data-slot="rarity"></div>
          <h2 class="card-name" data-slot="card_name"></h2>
          <div class="stat-badge" data-slot="power_stat"></div>
          <p class="attr-txt" data-slot="attribute"></p>
        </div>
      </div>
    `,
    styles: `
      .gacha-header { text-align: center; margin-bottom: 24px; }
      .gacha-title { font-family: 'Montserrat', sans-serif; font-size: 40px; color: #FFE600; font-weight: 900; }
      .holo-card-wrap { display: flex; justify-content: center; margin-bottom: 20px; }
      .holo-card { background: linear-gradient(135deg, #FF0055, #7928CA, #00DFD8); padding: 30px; border-radius: 16px; width: 440px; text-align: center; box-shadow: 0 0 35px rgba(255,0,85,0.4); border: 2px solid #FFF; }
      .rarity-tag { background: #FFE600; color: #000; font-family: 'Montserrat'; font-size: 16px; font-weight: 900; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 14px; }
      .card-name { font-family: 'Montserrat'; font-size: 32px; color: #FFF; font-weight: 900; margin-bottom: 12px; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
      .stat-badge { background: rgba(0,0,0,0.5); color: #00E676; font-family: 'Montserrat'; font-size: 20px; font-weight: 800; padding: 8px; border-radius: 8px; margin-bottom: 10px; }
      .attr-txt { font-family: 'Be Vietnam Pro', sans-serif; font-size: 18px; color: #FFF; font-weight: 600; }
    `
  },

  // =========================================================================
  // GROUP 5: SAAS, AI TOOLING & DEV ENGINEERING
  // =========================================================================
  {
    id: "frame-saas-pricing-tier",
    name: "SaaS 3-Tier Pricing Table",
    category: "saas",
    fonts: ["Plus Jakarta Sans:wght@700;800", "Be Vietnam Pro:wght@400;600"],
    bg: "#0F172A",
    slots: {
      headline: "CHỌN GÓI PHÙ HỢP VỚI BẠN",
      plan_free: "FREE: $0/tháng (1 Agent, 10 Video)",
      plan_pro: "PRO: $29/tháng (Không giới hạn + TTS cao cấp)",
      plan_ent: "ENTERPRISE: Custom (Dedicated Support)",
      highlight_note: "Gói PRO được 85% creator lựa chọn sử dụng."
    },
    markup: `
      <div class="pricing-header">
        <h1 class="p-title" data-slot="headline"></h1>
      </div>
      <div class="pricing-grid">
        <div class="tier-card t-free">
          <div class="t-desc" data-slot="plan_free"></div>
        </div>
        <div class="tier-card t-pro popular">
          <div class="t-desc" data-slot="plan_pro"></div>
        </div>
        <div class="tier-card t-ent">
          <div class="t-desc" data-slot="plan_ent"></div>
        </div>
      </div>
      <div class="pricing-note" data-slot="highlight_note"></div>
    `,
    styles: `
      .pricing-header { text-align: center; margin-bottom: 24px; }
      .p-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 40px; color: #FFF; font-weight: 800; }
      .pricing-grid { display: grid; grid-template-columns: 1fr 1.15fr 1fr; gap: 14px; align-items: center; margin-bottom: 20px; }
      .tier-card { background: #1E293B; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center; }
      .tier-card.popular { background: #1E1B4B; border: 2px solid #6366F1; box-shadow: 0 0 25px rgba(99,102,241,0.3); }
      .t-desc { font-family: 'Be Vietnam Pro', sans-serif; font-size: 20px; color: #CBD5E1; line-height: 1.5; font-weight: 600; }
      .pricing-note { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #A5B4FC; background: rgba(99,102,241,0.15); border: 1px solid #6366F1; padding: 14px; text-align: center; border-radius: 8px; font-weight: 600; }
    `
  },
  {
    id: "frame-api-request-response",
    name: "API Request Response Latency Flow",
    category: "saas",
    fonts: ["JetBrains Mono:wght@600;700", "Be Vietnam Pro:wght@400;600"],
    bg: "#0B1120",
    slots: {
      endpoint: "POST /api/v1/agent/render",
      status_code: "200 OK · 12ms",
      req_payload: '{"topic": "AI News", "genre": "vox", "theme": "paper-blue"}',
      res_payload: '{"status": "success", "file": "video.mp4"}',
      insight: "Tốc độ xử lý realtime với độ trễ thấp tối đa."
    },
    markup: `
      <div class="api-header">
        <span class="api-endpoint" data-slot="endpoint"></span>
        <span class="api-status" data-slot="status_code"></span>
      </div>
      <div class="api-code-grid">
        <div class="code-box req-box">
          <pre data-slot="req_payload"></pre>
        </div>
        <div class="code-box res-box">
          <pre data-slot="res_payload"></pre>
        </div>
      </div>
      <div class="api-insight" data-slot="insight"></div>
    `,
    styles: `
      .api-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; background: #1E293B; padding: 14px 20px; border-radius: 10px; border: 1px solid #334155; }
      .api-endpoint { font-family: 'JetBrains Mono'; font-size: 22px; color: #F8FAFC; }
      .api-status { background: rgba(16,185,129,0.2); color: #10B981; font-family: 'JetBrains Mono'; font-size: 18px; font-weight: 700; padding: 4px 12px; border-radius: 6px; }
      .api-code-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
      .code-box { background: #020617; border: 1px solid #1E293B; border-radius: 10px; padding: 20px; }
      pre { font-family: 'JetBrains Mono'; font-size: 18px; color: #38BDF8; white-space: pre-wrap; word-break: break-all; }
      .res-box pre { color: #34D399; }
      .api-insight { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #38BDF8; background: rgba(56,189,248,0.12); border: 1px solid #38BDF8; padding: 14px; text-align: center; border-radius: 8px; font-weight: 600; }
    `
  },
  {
    id: "frame-diff-code-editor",
    name: "Code Editor Optimization Diff",
    category: "saas",
    fonts: ["JetBrains Mono:wght@400;700", "Be Vietnam Pro:wght@400;600"],
    bg: "#0B0F19",
    slots: {
      headline: "TỐI ƯU HÓA CODE: TĂNG TỐC 10X",
      file_name: "pipeline.mjs",
      before_code: "- for (let i=0; i<data.length; i++) slowProcess(data[i]);",
      after_code: "+ await Promise.all(data.map(fastProcess));",
      perf_gain: "Thời gian xử lý: Giảm từ 4,200ms xuống còn 380ms"
    },
    markup: `
      <div class="diff-header">
        <h1 class="diff-title" data-slot="headline"></h1>
        <span class="file-tag" data-slot="file_name"></span>
      </div>
      <div class="editor-window">
        <div class="diff-body">
          <div class="diff-row del" data-slot="before_code"></div>
          <div class="diff-row add" data-slot="after_code"></div>
        </div>
      </div>
      <div class="perf-tag" data-slot="perf_gain"></div>
    `,
    styles: `
      .diff-header { text-align: center; margin-bottom: 20px; }
      .diff-title { font-family: 'Be Vietnam Pro', sans-serif; font-size: 38px; color: #FFF; font-weight: 700; }
      .file-tag { font-family: 'JetBrains Mono'; font-size: 18px; color: #38BDF8; background: #1E293B; padding: 4px 14px; border-radius: 6px; display: inline-block; margin-top: 6px; }
      .editor-window { background: #020617; border: 1px solid #1E293B; border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
      .diff-body { padding: 24px; display: flex; flex-direction: column; gap: 12px; font-family: 'JetBrains Mono'; font-size: 20px; }
      .diff-row.del { background: rgba(239,68,68,0.15); color: #FCA5A5; padding: 10px 14px; border-radius: 6px; border-left: 4px solid #EF4444; }
      .diff-row.add { background: rgba(16,185,129,0.15); color: #6EE7B7; padding: 10px 14px; border-radius: 6px; border-left: 4px solid #10B981; }
      .perf-tag { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #10B981; background: rgba(16,185,129,0.15); border: 1px solid #10B981; padding: 14px; text-align: center; border-radius: 8px; font-weight: 700; }
    `
  },
  {
    id: "frame-git-branch-graph",
    name: "Git Branching Workflow Graph",
    category: "saas",
    fonts: ["JetBrains Mono:wght@600;700", "Be Vietnam Pro:wght@400;600"],
    bg: "#0D1117",
    slots: {
      headline: "QUY TRÌNH PHÁT HÀNH CODE CHUẨN",
      branch_main: "main (Production) · v2.4.0 Live",
      branch_staging: "staging (Review Gate & Test CI/CD)",
      branch_feature: "feat/video-render (Đang phát triển)",
      status: "Tự động merge sau khi pass 100% test."
    },
    markup: `
      <div class="git-header">
        <h1 class="git-title" data-slot="headline"></h1>
      </div>
      <div class="git-tree-card">
        <div class="branch-row b-main">
          <span class="commit-dot dot-main"></span>
          <span class="b-txt" data-slot="branch_main"></span>
        </div>
        <div class="branch-row b-staging">
          <span class="commit-dot dot-staging"></span>
          <span class="b-txt" data-slot="branch_staging"></span>
        </div>
        <div class="branch-row b-feat">
          <span class="commit-dot dot-feat"></span>
          <span class="b-txt" data-slot="branch_feature"></span>
        </div>
      </div>
      <div class="git-status" data-slot="status"></div>
    `,
    styles: `
      .git-header { text-align: center; margin-bottom: 24px; }
      .git-title { font-family: 'Be Vietnam Pro', sans-serif; font-size: 40px; color: #FFF; font-weight: 700; }
      .git-tree-card { background: #161B22; border: 1px solid #30363D; border-radius: 16px; padding: 26px; display: flex; flex-direction: column; gap: 18px; margin-bottom: 20px; }
      .branch-row { display: flex; align-items: center; gap: 16px; font-family: 'JetBrains Mono'; font-size: 20px; }
      .commit-dot { width: 16px; height: 16px; border-radius: 50%; }
      .dot-main { background: #38BDF8; box-shadow: 0 0 10px #38BDF8; }
      .dot-staging { background: #A855F7; box-shadow: 0 0 10px #A855F7; }
      .dot-feat { background: #10B981; box-shadow: 0 0 10px #10B981; }
      .b-txt { color: #E6EDF3; }
      .git-status { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #38BDF8; background: rgba(56,189,248,0.12); border: 1px solid #38BDF8; padding: 14px; text-align: center; border-radius: 8px; font-weight: 600; }
    `
  },
  {
    id: "frame-ai-benchmark-leaderboard",
    name: "AI Benchmark Race Leaderboard",
    category: "saas",
    fonts: ["Plus Jakarta Sans:wght@700;800", "Be Vietnam Pro:wght@400;600"],
    bg: "#0A0D14",
    slots: {
      benchmark_name: "SWE-BENCH VERIFIED (KHẢ NĂNG LẬP TRÌNH)",
      rank_1: "Claude 3.7 Sonnet: 70.3%",
      rank_2: "DeepSeek V3: 65.8%",
      rank_3: "GPT-4.5: 62.4%",
      verdict: "Kỷ lục mới về điểm số tự giải quyết issue phần mềm."
    },
    markup: `
      <div class="bm-header">
        <span class="bm-badge" data-slot="benchmark_name"></span>
      </div>
      <div class="leaderboard-card">
        <div class="bm-row r1">
          <div class="bm-fill f1" style="width: 70.3%;"></div>
          <span class="bm-txt" data-slot="rank_1"></span>
        </div>
        <div class="bm-row r2">
          <div class="bm-fill f2" style="width: 65.8%;"></div>
          <span class="bm-txt" data-slot="rank_2"></span>
        </div>
        <div class="bm-row r3">
          <div class="bm-fill f3" style="width: 62.4%;"></div>
          <span class="bm-txt" data-slot="rank_3"></span>
        </div>
      </div>
      <div class="bm-verdict" data-slot="verdict"></div>
    `,
    styles: `
      .bm-header { text-align: center; margin-bottom: 24px; }
      .bm-badge { background: #1E1B4B; color: #818CF8; font-family: 'Plus Jakarta Sans'; font-size: 22px; font-weight: 800; padding: 6px 20px; border-radius: 20px; border: 1px solid #6366F1; letter-spacing: 1px; }
      .leaderboard-card { background: #111827; border: 1px solid #1F2937; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
      .bm-row { background: #1F2937; height: 56px; border-radius: 8px; position: relative; overflow: hidden; display: flex; align-items: center; padding: 0 16px; }
      .bm-fill { position: absolute; left: 0; top: 0; bottom: 0; opacity: 0.3; }
      .f1 { background: #6366F1; opacity: 0.5; }
      .f2 { background: #38BDF8; }
      .f3 { background: #10B981; }
      .bm-txt { position: relative; z-index: 2; font-family: 'Be Vietnam Pro', sans-serif; font-size: 20px; color: #FFF; font-weight: 700; }
      .bm-verdict { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #818CF8; background: rgba(99,102,241,0.15); border: 1px solid #6366F1; padding: 14px; text-align: center; border-radius: 8px; font-weight: 700; }
    `
  },

  // =========================================================================
  // GROUP 6: REVIEW, UNBOXING & E-COMMERCE
  // =========================================================================
  {
    id: "frame-pros-cons-scale",
    name: "Pros vs Cons Justice Balance Scale",
    category: "ecommerce",
    fonts: ["Plus Jakarta Sans:wght@700;800", "Be Vietnam Pro:wght@400;600"],
    bg: "#FAFAFA",
    slots: {
      headline: "ĐÁNH GIÁ THỰC TẾ: CÓ ĐÁNG TIỀN?",
      pros_title: "ƯU ĐIỂM (NÊN MUA)",
      pros_list: "• Hiệu năng đỉnh cao • Pin 2 ngày • Màn hình 120Hz",
      cons_title: "NHƯỢC ĐIỂM (CÂN NHẮC)",
      cons_list: "• Giá khá cao • Cụm camera lồi • Thiếu củ sạc",
      verdict: "Điểm 9/10: Lựa chọn tốt nhất trong phân khúc cao cấp."
    },
    markup: `
      <div class="scale-header">
        <h1 class="scale-title" data-slot="headline"></h1>
      </div>
      <div class="scale-body">
        <div class="card-side pros-card">
          <div class="side-head" data-slot="pros_title"></div>
          <div class="side-content" data-slot="pros_list"></div>
        </div>
        <div class="card-side cons-card">
          <div class="side-head" data-slot="cons_title"></div>
          <div class="side-content" data-slot="cons_list"></div>
        </div>
      </div>
      <div class="scale-verdict" data-slot="verdict"></div>
    `,
    styles: `
      .scale-header { text-align: center; margin-bottom: 24px; }
      .scale-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 40px; color: #0F172A; font-weight: 800; }
      .scale-body { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
      .card-side { background: #FFFFFF; border-radius: 12px; padding: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
      .pros-card { border-top: 6px solid #10B981; }
      .cons-card { border-top: 6px solid #EF4444; }
      .side-head { font-family: 'Plus Jakarta Sans'; font-size: 20px; font-weight: 800; margin-bottom: 12px; }
      .pros-card .side-head { color: #10B981; }
      .cons-card .side-head { color: #EF4444; }
      .side-content { font-family: 'Be Vietnam Pro', sans-serif; font-size: 20px; color: #334155; line-height: 1.6; white-space: pre-line; }
      .scale-verdict { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #0F172A; background: #FEF3C7; border: 1px solid #F59E0B; padding: 14px; text-align: center; border-radius: 8px; font-weight: 700; }
    `
  },
  {
    id: "frame-receipt-slip",
    name: "Sliding Thermal Receipt Ribbon",
    category: "ecommerce",
    fonts: ["JetBrains Mono:wght@400;700", "Be Vietnam Pro:wght@400;600"],
    bg: "#F1F5F9",
    slots: {
      store_name: "HONEST REVIEW RECEIPT",
      item_1: "Giá niêm yết: $1,200.00",
      item_2: "Chi phí ẩn (Phụ kiện): + $150.00",
      item_3: "Khấu hao sau 1 năm: - $400.00",
      total: "TỔNG CHI PHÍ THỰC: $950.00",
      advice: "Mẹo: Mua hàng like new tiết kiệm ngay 30%."
    },
    markup: `
      <div class="receipt-wrap">
        <div class="receipt-paper">
          <div class="r-store" data-slot="store_name"></div>
          <div class="r-items">
            <div class="r-line" data-slot="item_1"></div>
            <div class="r-line" data-slot="item_2"></div>
            <div class="r-line" data-slot="item_3"></div>
          </div>
          <div class="r-total" data-slot="total"></div>
        </div>
      </div>
      <div class="receipt-advice" data-slot="advice"></div>
    `,
    styles: `
      .receipt-wrap { display: flex; justify-content: center; margin-bottom: 20px; }
      .receipt-paper { background: #FFFFFF; width: 500px; padding: 26px; border-radius: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); font-family: 'JetBrains Mono', monospace; color: #1E293B; border-bottom: 6px dashed #CBD5E1; }
      .r-store { text-align: center; font-size: 22px; font-weight: 700; margin-bottom: 14px; }
      .r-items { display: flex; flex-direction: column; gap: 8px; font-size: 18px; margin-bottom: 14px; border-top: 1px dashed #CBD5E1; border-bottom: 1px dashed #CBD5E1; padding: 12px 0; }
      .r-total { font-size: 22px; font-weight: 700; color: #0F172A; text-align: right; }
      .receipt-advice { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #0F172A; background: #E2E8F0; padding: 14px; text-align: center; border-radius: 8px; font-weight: 600; }
    `
  },
  {
    id: "frame-unboxing-specs",
    name: "Product Showcase 4-Point Specs",
    category: "ecommerce",
    fonts: ["Plus Jakarta Sans:wght@700;800", "Be Vietnam Pro:wght@400;600"],
    bg: "#FAFAFA",
    slots: {
      product_name: "FLAGSHIP PRO MAX (2026)",
      spec_chip: "Chip M4 Ultra 3nm",
      spec_battery: "Pin 5,000 mAh · Sạc 100W",
      spec_screen: "OLED 6.8 inch 2000 nits",
      spec_weight: "Trọng lượng 185g siêu nhẹ",
      verdict: "Thiết bị dẫn đầu toàn diện về cấu hình."
    },
    markup: `
      <div class="ub-header">
        <h1 class="p-name" data-slot="product_name"></h1>
      </div>
      <div class="ub-grid">
        <div class="ub-spec s1">
          <div class="s-text" data-slot="spec_chip"></div>
        </div>
        <div class="ub-spec s2">
          <div class="s-text" data-slot="spec_battery"></div>
        </div>
        <div class="ub-spec s3">
          <div class="s-text" data-slot="spec_screen"></div>
        </div>
        <div class="ub-spec s4">
          <div class="s-text" data-slot="spec_weight"></div>
        </div>
      </div>
      <div class="ub-verdict" data-slot="verdict"></div>
    `,
    styles: `
      .ub-header { text-align: center; margin-bottom: 24px; }
      .p-name { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 40px; color: #0F172A; font-weight: 800; }
      .ub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
      .ub-spec { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; display: flex; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.04); }
      .s-text { font-family: 'Be Vietnam Pro', sans-serif; font-size: 20px; color: #1E293B; font-weight: 600; }
      .ub-verdict { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #0F172A; background: #E0E7FF; border: 1px solid #6366F1; padding: 14px; text-align: center; border-radius: 8px; font-weight: 700; }
    `
  },
  {
    id: "frame-radar-rating-star",
    name: "5-Criterion Star Rating Review",
    category: "ecommerce",
    fonts: ["Plus Jakarta Sans:wght@700;800", "Be Vietnam Pro:wght@400;600"],
    bg: "#FAFAFA",
    slots: {
      headline: "TỔNG KẾT ĐÁNH GIÁ 5 TIÊU CHÍ",
      crit_1: "Thiết kế & Độ hoàn thiện: 5.0 / 5.0",
      crit_2: "Hiệu năng & Tốc độ: 4.8 / 5.0",
      crit_3: "Thời lượng pin: 5.0 / 5.0",
      crit_4: "Mức giá hợp lý: 4.5 / 5.0",
      overall_badge: "TỔNG ĐIỂM: 4.8 / 5.0 (CỰC KỲ KHUYÊN DÙNG)"
    },
    markup: `
      <div class="star-header">
        <h1 class="star-title" data-slot="headline"></h1>
      </div>
      <div class="crit-list">
        <div class="crit-row" data-slot="crit_1"></div>
        <div class="crit-row" data-slot="crit_2"></div>
        <div class="crit-row" data-slot="crit_3"></div>
        <div class="crit-row" data-slot="crit_4"></div>
      </div>
      <div class="overall-score" data-slot="overall_badge"></div>
    `,
    styles: `
      .star-header { text-align: center; margin-bottom: 24px; }
      .star-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 40px; color: #0F172A; font-weight: 800; }
      .crit-list { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); }
      .crit-row { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #334155; font-weight: 600; padding: 8px 12px; background: #F8FAFC; border-radius: 8px; }
      .overall-score { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 26px; color: #B45309; background: #FEF3C7; border: 2px solid #F59E0B; padding: 16px; text-align: center; border-radius: 10px; font-weight: 800; }
    `
  },
  {
    id: "frame-discount-coupon-tear",
    name: "Serrated Discount Coupon Tear",
    category: "ecommerce",
    fonts: ["Montserrat:wght@800;900", "Be Vietnam Pro:wght@400;600"],
    bg: "#FAFAFA",
    slots: {
      headline: "ƯU ĐÃI ĐẶC QUYỀN HÔM NAY",
      discount: "-50% OFF",
      code: "MÃ: AIAGENT2026",
      condition: "Áp dụng cho 100 người đăng ký đầu tiên",
      cta: "Nhấp vào link trong phần bio để kích hoạt ngay!"
    },
    markup: `
      <div class="coupon-header">
        <h1 class="cp-title" data-slot="headline"></h1>
      </div>
      <div class="coupon-card">
        <div class="cp-disc" data-slot="discount"></div>
        <div class="cp-code" data-slot="code"></div>
        <div class="cp-cond" data-slot="condition"></div>
      </div>
      <div class="coupon-cta" data-slot="cta"></div>
    `,
    styles: `
      .coupon-header { text-align: center; margin-bottom: 24px; }
      .cp-title { font-family: 'Montserrat', sans-serif; font-size: 40px; color: #0F172A; font-weight: 900; }
      .coupon-card { background: linear-gradient(135deg, #FF6B00, #EA580C); color: #FFF; border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 20px; box-shadow: 0 10px 25px rgba(234,88,12,0.3); border: 3px dashed #FFF; }
      .cp-disc { font-family: 'Montserrat'; font-size: 64px; font-weight: 900; }
      .cp-code { font-family: 'Montserrat'; font-size: 28px; font-weight: 800; background: #FFF; color: #EA580C; padding: 8px 18px; border-radius: 8px; display: inline-block; margin: 12px 0; }
      .cp-cond { font-family: 'Be Vietnam Pro', sans-serif; font-size: 18px; opacity: 0.9; }
      .coupon-cta { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; color: #0F172A; background: #FFEDD5; border: 1px solid #FF6B00; padding: 14px; text-align: center; border-radius: 8px; font-weight: 700; }
    `
  }
];

console.log(`Building ${TEMPLATES.length} templates...`);

for (const t of TEMPLATES) {
  const dir = path.join(TEMPLATES_DIR, t.id);
  const compDir = path.join(dir, "compositions");
  fs.mkdirSync(compDir, { recursive: true });

  const fontLinks = t.fonts.map(f => `family=${f.replace(/ /g, '+')}`).join('&');

  const html = (aspect, w, h) => `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=${w}, height=${h}" />
  <title>${t.name} · ${aspect}</title>
  <link href="https://fonts.googleapis.com/css2?${fontLinks}&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${w}px; height: ${h}px; overflow: hidden; background: ${t.bg}; }
    #root {
      position: relative;
      width: ${w}px;
      height: ${h}px;
      background: ${t.bg};
      color: #F8FAFC;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: ${aspect === "16:9" ? "60px 120px" : "120px 60px"};
    }
    ${t.styles}
  </style>
</head>
<body>
  <div id="root" data-composition-id="${aspect === "16:9" ? "main" : "portrait"}" data-start="0" data-duration="5" data-width="${w}" data-height="${h}" data-composition-variables='${JSON.stringify(t.slots)}'>
    ${t.markup}
  </div>
  <script>
    (function () {
      var root = document.getElementById("root");
      var v = {};
      try { v = JSON.parse(root.getAttribute("data-composition-variables") || "{}"); } catch (e) {}
      
      document.querySelectorAll("[data-slot]").forEach(function (el) {
        var k = el.getAttribute("data-slot");
        if (v[k] !== undefined) {
          if (v[k] === "") el.remove();
          else el.textContent = v[k];
        }
      });

      // Special dynamic parsing for list items if present
      var ordersListBids = document.querySelector(".bids-list");
      var ordersListAsks = document.querySelector(".asks-list");
      if (ordersListBids && v.bids) {
        v.bids.split("|").forEach(function(item) {
          var p = item.split(":");
          if(p.length === 2) {
            var row = document.createElement("div");
            row.className = "order-row";
            row.innerHTML = "<span>" + p[0].trim() + "</span><span>" + p[1].trim() + "</span>";
            ordersListBids.appendChild(row);
          }
        });
      }
      if (ordersListAsks && v.asks) {
        v.asks.split("|").forEach(function(item) {
          var p = item.split(":");
          if(p.length === 2) {
            var row = document.createElement("div");
            row.className = "order-row";
            row.innerHTML = "<span>" + p[0].trim() + "</span><span>" + p[1].trim() + "</span>";
            ordersListAsks.appendChild(row);
          }
        });
      }

      var legendList = document.querySelector(".pf-legend-list");
      if (legendList && v.items) {
        v.items.split("|").forEach(function(item) {
          var p = item.split(":");
          if(p.length === 2) {
            var row = document.createElement("div");
            row.className = "legend-item";
            row.innerHTML = "<span>" + p[0].trim() + "</span><span style='font-weight:700;'>" + p[1].trim() + "</span>";
            legendList.appendChild(row);
          }
        });
      }
    })();

    window.__timelines = window.__timelines || {};
    window.__timelines["main"] = window.__timelines["portrait"] = {
      pause: function () {},
      seek: function () {},
      paused: function () { return true; },
      duration: function () { return 5; }
    };
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(dir, "index.html"), html("16:9", 1920, 1080));
  fs.writeFileSync(path.join(compDir, "portrait.html"), html("9:16", 1080, 1920));

  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ id: t.id, name: t.name }, null, 2));
  fs.writeFileSync(path.join(dir, "hyperframes.json"), JSON.stringify({ schemaVersion: "1.0", composition: "main" }, null, 2));
  fs.writeFileSync(path.join(dir, "NOTICE.md"), `# ${t.name}\n\nOriginal template authored for content-agent-kit.\nCategory: ${t.category}\n`);
  console.log(`✓ Created ${t.id}`);
}

console.log(`\n✓ All ${TEMPLATES.length} templates successfully built!`);
