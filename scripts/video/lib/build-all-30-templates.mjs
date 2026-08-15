// build-all-30-templates.mjs
// Generates 30 distinctive, high-craft video templates across 6 categories.
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
    name: "Stock Candlestick Terminal",
    category: "fintech",
    fonts: ["JetBrains+Mono:wght@400;700;800", "Chakra+Petch:wght@600;700", "Be+Vietnam+Pro:wght@400;600;700"],
    bg: "#080A0F",
    slots: {
      ticker: "BTC/USDT",
      price: "$96,450.00",
      change: "+14.2%",
      kicker: "PHÂN TÍCH KỸ THUẬT",
      headline: "Đột phá kháng cự then chốt",
      res_level: "Cản $95,000",
      gl_100k: "100K",
      gl_90k: "90K",
      gl_80k: "80K",
      indicator: "RSI 68.4 · Volume +240%",
      summary: "Áp lực mua gom từ tổ chức đẩy giá vượt đỉnh 30 ngày.",
      telemetry: "LIVE TELEMETRY"
    },
    markup: `
      <div class="terminal-frame">
        <div class="terminal-topbar">
          <div class="dots"><span class="d d-r"></span><span class="d d-y"></span><span class="d d-g"></span></div>
          <div class="topbar-ticker">
            <span class="tb-badge" data-slot="ticker"></span>
            <span class="tb-price" data-slot="price"></span>
            <span class="tb-change" data-slot="change"></span>
          </div>
          <div class="topbar-status"><span class="pulse-dot"></span> <span data-slot="telemetry"></span></div>
        </div>

        <div class="terminal-body">
          <div class="chart-section">
            <div class="chart-hud">
              <span class="kicker-tag" data-slot="kicker"></span>
              <h2 class="main-title" data-slot="headline"></h2>
            </div>
            
            <div class="candlestick-stage">
              <div class="grid-lines">
                <div class="gl"><span data-slot="gl_100k"></span></div>
                <div class="gl res-line"><span class="res-badge" data-slot="res_level"></span></div>
                <div class="gl"><span data-slot="gl_90k"></span></div>
                <div class="gl"><span data-slot="gl_80k"></span></div>
              </div>
              <div class="candles-stream">
                <div class="candle c-red" style="--h:45px;"></div>
                <div class="candle c-red" style="--h:65px;"></div>
                <div class="candle c-green" style="--h:80px;"></div>
                <div class="candle c-green" style="--h:110px;"></div>
                <div class="candle c-green c-breakout" style="--h:150px;">
                  <div class="breakout-pulse"></div>
                </div>
              </div>
              <div class="volume-bars">
                <div class="vbar" style="height: 30%;"></div>
                <div class="vbar" style="height: 45%;"></div>
                <div class="vbar" style="height: 55%;"></div>
                <div class="vbar" style="height: 80%;"></div>
                <div class="vbar v-spike" style="height: 100%;"></div>
              </div>
            </div>
          </div>

          <div class="info-dock">
            <div class="stat-capsule">
              <span class="capsule-icon">⚡</span>
              <span class="capsule-text" data-slot="indicator"></span>
            </div>
            <div class="summary-card">
              <p class="summary-text" data-slot="summary"></p>
            </div>
          </div>
        </div>
      </div>
    `,
    styles: `
      .terminal-frame { border: 1px solid #1F2937; background: #0B0F17; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1); display: flex; flex-direction: column; height: 100%; }
      .terminal-topbar { height: 64px; background: #111827; border-bottom: 1px solid #1F2937; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; font-family: 'JetBrains Mono', monospace; }
      .dots { display: flex; gap: 8px; }
      .d { width: 12px; height: 12px; border-radius: 50%; }
      .d-r { background: #EF4444; } .d-y { background: #F59E0B; } .d-g { background: #10B981; }
      .topbar-ticker { display: flex; align-items: center; gap: 14px; }
      .tb-badge { background: #1F2937; color: #F3F4F6; padding: 4px 12px; border-radius: 6px; font-size: 18px; font-weight: 700; border: 1px solid #374151; }
      .tb-price { font-size: 22px; font-weight: 800; color: #FFFFFF; }
      .tb-change { color: #00E676; font-size: 18px; font-weight: 700; background: rgba(0,230,118,0.12); padding: 4px 10px; border-radius: 6px; }
      .topbar-status { font-size: 13px; color: #9CA3AF; display: flex; align-items: center; gap: 8px; letter-spacing: 1px; }
      .pulse-dot { width: 8px; height: 8px; background: #00E676; border-radius: 50%; box-shadow: 0 0 10px #00E676; animation: blink 1.5s infinite; }
      
      .terminal-body { padding: 32px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 24px; }
      .chart-hud { margin-bottom: 16px; }
      .kicker-tag { font-family: 'Chakra Petch', sans-serif; font-size: 16px; letter-spacing: 3px; color: #00E676; font-weight: 700; text-transform: uppercase; }
      .main-title { font-family: 'Be Vietnam Pro', sans-serif; font-size: 38px; font-weight: 800; color: #F9FAFB; margin-top: 6px; letter-spacing: -0.02em; }
      
      .candlestick-stage { position: relative; height: 260px; background: rgba(15,23,42,0.6); border: 1px solid #1E293B; border-radius: 12px; padding: 16px; overflow: hidden; }
      .grid-lines { position: absolute; inset: 16px; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; }
      .gl { border-bottom: 1px dashed rgba(51,65,85,0.4); font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #475569; display: flex; justify-content: flex-end; }
      .res-line { border-bottom: 1px solid #FF1744; }
      .res-badge { background: #FF1744; color: #FFF; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; transform: translateY(-8px); }
      
      .candles-stream { position: absolute; left: 60px; right: 60px; top: 20px; bottom: 60px; display: flex; justify-content: space-around; align-items: flex-end; }
      .candle { width: 24px; height: var(--h); position: relative; border-radius: 3px; }
      .candle::before { content: ''; position: absolute; top: -14px; bottom: -14px; left: 50%; width: 2px; transform: translateX(-50%); background: inherit; }
      .c-red { background: #FF1744; }
      .c-green { background: #00E676; }
      .c-breakout { box-shadow: 0 0 25px rgba(0,230,118,0.6); }
      .breakout-pulse { position: absolute; top: -10px; right: -10px; width: 16px; height: 16px; border-radius: 50%; background: #00E676; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite; }
      
      .volume-bars { position: absolute; left: 60px; right: 60px; bottom: 12px; height: 35px; display: flex; justify-content: space-around; align-items: flex-end; opacity: 0.5; }
      .vbar { width: 20px; background: #334155; border-radius: 2px 2px 0 0; }
      .v-spike { background: #00E676; opacity: 0.9; }

      .info-dock { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; align-items: center; }
      .stat-capsule { background: rgba(30,41,59,0.8); border: 1px solid #334155; padding: 14px 20px; border-radius: 12px; font-family: 'JetBrains Mono', monospace; font-size: 15px; color: #38BDF8; font-weight: 700; display: flex; align-items: center; gap: 10px; }
      .summary-card { background: #111827; border-left: 4px solid #00E676; padding: 14px 20px; border-radius: 0 12px 12px 0; }
      .summary-text { font-family: 'Be Vietnam Pro', sans-serif; font-size: 16px; color: #D1D5DB; line-height: 1.5; margin: 0; }
      
      @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
    `
  },

  {
    id: "frame-crypto-orderbook",
    name: "Crypto Orderbook & Liquidity Depth",
    category: "fintech",
    fonts: ["JetBrains+Mono:wght@400;700;800", "Chakra+Petch:wght@700", "Be+Vietnam+Pro:wght@400;600"],
    bg: "#06080E",
    slots: {
      pair: "ETH / USDT",
      spread: "Spread: $0.15 (0.004%)",
      bids_title: "LỆNH MUA (BIDS)",
      asks_title: "LỆNH BÁN (ASKS)",
      bids: "$3,620.50 : 42.5 ETH|$3,619.00 : 128.4 ETH|$3,618.20 : 310.0 ETH",
      asks: "$3,621.20 : 18.2 ETH|$3,622.00 : 95.6 ETH|$3,623.50 : 240.8 ETH",
      radar_tag: "WHALE RADAR",
      insight: "Tường mua 310 ETH bảo vệ mốc $3,618 cực kỳ vững chắc."
    },
    markup: `
      <div class="ob-wrapper">
        <div class="ob-header">
          <div class="ob-pair-box">
            <span class="crypto-icon">⚡</span>
            <span class="ob-pair" data-slot="pair"></span>
          </div>
          <div class="ob-spread-badge" data-slot="spread"></div>
        </div>

        <div class="ob-columns">
          <div class="ob-col col-bids">
            <div class="col-head"><span class="ch-tag" data-slot="bids_title"></span></div>
            <div class="orders-list bids-list"></div>
          </div>
          <div class="ob-divider"></div>
          <div class="ob-col col-asks">
            <div class="col-head"><span class="ch-tag" data-slot="asks_title"></span></div>
            <div class="orders-list asks-list"></div>
          </div>
        </div>

        <div class="ob-footer">
          <span class="radar-tag" data-slot="radar_tag"></span>
          <p class="ob-insight-text" data-slot="insight"></p>
        </div>
      </div>
    `,
    styles: `
      .ob-wrapper { border: 1px solid #1E293B; background: radial-gradient(circle at 50% 0%, #0F172A 0%, #06080E 100%); border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 20px 50px rgba(0,0,0,0.7); }
      .ob-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1E293B; padding-bottom: 20px; }
      .ob-pair-box { display: flex; align-items: center; gap: 12px; font-family: 'Chakra Petch', sans-serif; font-size: 28px; font-weight: 800; color: #F8FAFC; }
      .crypto-icon { font-size: 26px; }
      .ob-spread-badge { font-family: 'JetBrains Mono', monospace; font-size: 14px; background: rgba(56,189,248,0.1); color: #38BDF8; border: 1px solid rgba(56,189,248,0.3); padding: 6px 14px; border-radius: 20px; font-weight: 700; }
      
      .ob-columns { display: grid; grid-template-columns: 1fr 2px 1fr; gap: 24px; align-items: center; margin: 24px 0; }
      .ob-divider { height: 100%; background: #1E293B; }
      .col-head { margin-bottom: 16px; }
      .col-bids .ch-tag { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 800; color: #00E676; }
      .col-asks .ch-tag { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 800; color: #FF1744; }
      
      .orders-list { display: flex; flex-direction: column; gap: 12px; }
      .order-row { font-family: 'JetBrains Mono', monospace; font-size: 16px; padding: 12px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; font-weight: 700; position: relative; overflow: hidden; }
      .col-bids .order-row { color: #00E676; background: rgba(0,230,118,0.06); border-left: 4px solid #00E676; }
      .col-asks .order-row { color: #FF1744; background: rgba(255,23,68,0.06); border-right: 4px solid #FF1744; }
      
      .ob-footer { background: #0F172A; border: 1px solid #334155; border-radius: 14px; padding: 18px 24px; display: flex; align-items: center; gap: 18px; }
      .radar-tag { font-family: 'Chakra Petch', sans-serif; font-size: 13px; font-weight: 800; background: #38BDF8; color: #0F172A; padding: 4px 8px; border-radius: 4px; letter-spacing: 1px; }
      .ob-insight-text { font-family: 'Be Vietnam Pro', sans-serif; font-size: 16px; color: #E2E8F0; margin: 0; font-weight: 600; }
    `
  },

  {
    id: "frame-wealth-compound",
    name: "Wealth Compound Growth Curves",
    category: "fintech",
    fonts: ["Montserrat:wght@700;900", "Plus+Jakarta+Sans:wght@500;700;800"],
    bg: "#0A0D14",
    slots: {
      headline: "Sức mạnh của Lãi Kép",
      subline: "Đầu tư $500/tháng: Tuổi 20 vs Tuổi 30",
      person_a: "Bắt đầu tuổi 20: $1,850,000",
      person_b: "Bắt đầu tuổi 30: $620,000",
      delta: "Chênh lệch: Gấp 3 Lần Tài Sản",
      rule: "Thời gian trên thị trường quan trọng hơn căn thời điểm."
    },
    markup: `
      <div class="compound-container">
        <div class="cp-header">
          <h1 class="cp-title" data-slot="headline"></h1>
          <p class="cp-sub" data-slot="subline"></p>
        </div>

        <div class="curves-stage">
          <svg class="curves-svg" viewBox="0 0 800 320" fill="none">
            <path d="M 50 280 Q 400 270 750 40" stroke="#00F0FF" stroke-width="6" stroke-linecap="round" class="anim-curve-a" />
            <path d="M 50 280 Q 500 280 750 180" stroke="#94A3B8" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 8" class="anim-curve-b" />
            <circle cx="750" cy="40" r="10" fill="#00F0FF" class="pulse-point" />
            <circle cx="750" cy="180" r="8" fill="#94A3B8" />
          </svg>
          <div class="curve-marker marker-a" data-slot="person_a"></div>
          <div class="curve-marker marker-b" data-slot="person_b"></div>
        </div>

        <div class="cp-bottom-bar">
          <div class="delta-pill" data-slot="delta"></div>
          <div class="rule-box"><span class="star-icon">💡</span> <span class="rule-txt" data-slot="rule"></span></div>
        </div>
      </div>
    `,
    styles: `
      .compound-container { background: radial-gradient(circle at 100% 0%, #162032 0%, #0A0D14 70%); border: 1px solid #1E293B; border-radius: 24px; padding: 40px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .cp-header { text-align: center; }
      .cp-title { font-family: 'Montserrat', sans-serif; font-size: 42px; font-weight: 900; color: #FFF; letter-spacing: -0.02em; }
      .cp-sub { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; color: #94A3B8; margin-top: 6px; font-weight: 600; }
      
      .curves-stage { position: relative; height: 320px; width: 100%; margin: 10px 0; }
      .curves-svg { width: 100%; height: 100%; filter: drop-shadow(0 0 15px rgba(0,240,255,0.3)); }
      .pulse-point { filter: drop-shadow(0 0 12px #00F0FF); }
      
      .curve-marker { position: absolute; right: 20px; font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 16px; padding: 8px 16px; border-radius: 8px; }
      .marker-a { top: 20px; background: #00F0FF; color: #0A0D14; box-shadow: 0 0 20px rgba(0,240,255,0.5); }
      .marker-b { top: 160px; background: #334155; color: #E2E8F0; }

      .cp-bottom-bar { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
      .delta-pill { background: linear-gradient(135deg, #FF0055, #FF5500); color: #FFF; font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 900; padding: 14px 24px; border-radius: 12px; box-shadow: 0 8px 25px rgba(255,0,85,0.4); }
      .rule-box { flex: 1; background: rgba(30,41,59,0.7); border: 1px solid #334155; padding: 14px 20px; border-radius: 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; color: #CBD5E1; font-weight: 600; display: flex; align-items: center; gap: 10px; }
    `
  },

  {
    id: "frame-portfolio-donut",
    name: "Portfolio Asset Allocation Donut",
    category: "fintech",
    fonts: ["Inter:wght@500;700;800", "JetBrains+Mono:wght@700"],
    bg: "#0B0E17",
    slots: {
      title: "Cơ Cấu Danh Mục Chuẩn",
      total_pnl: "+28.4% Lợi Nhuận YTD",
      total_label: "TỔNG TÀI SẢN",
      total_pct: "100%",
      items: "Cổ Phiếu:45%|Bất Động Sản:30%|Vàng & Crypto:15%|Tiền Mặt:10%",
      verdict: "Tỷ trọng cân bằng giúp giảm 40% rủi ro khi thị trường điều chỉnh."
    },
    markup: `
      <div class="pf-container">
        <div class="pf-top">
          <h2 class="pf-title" data-slot="title"></h2>
          <div class="pnl-badge" data-slot="total_pnl"></div>
        </div>

        <div class="pf-center">
          <div class="donut-chart-box">
            <svg class="donut-svg" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="75" stroke="#1E293B" stroke-width="24" fill="none" />
              <circle cx="100" cy="100" r="75" stroke="#3B82F6" stroke-width="24" stroke-dasharray="212 471" stroke-dashoffset="0" fill="none" />
              <circle cx="100" cy="100" r="75" stroke="#10B981" stroke-width="24" stroke-dasharray="141 471" stroke-dashoffset="-212" fill="none" />
              <circle cx="100" cy="100" r="75" stroke="#F59E0B" stroke-width="24" stroke-dasharray="70 471" stroke-dashoffset="-353" fill="none" />
              <circle cx="100" cy="100" r="75" stroke="#8B5CF6" stroke-width="24" stroke-dasharray="48 471" stroke-dashoffset="-423" fill="none" />
            </svg>
            <div class="donut-center-label">
              <span class="dcl-muted" data-slot="total_label"></span>
              <span class="dcl-val" data-slot="total_pct"></span>
            </div>
          </div>

          <div class="pf-legend-list"></div>
        </div>

        <div class="pf-verdict-box">
          <p class="pf-verdict-txt" data-slot="verdict"></p>
        </div>
      </div>
    `,
    styles: `
      .pf-container { background: #0B0E17; border: 1px solid #1E293B; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .pf-top { display: flex; justify-content: space-between; align-items: center; }
      .pf-title { font-family: 'Inter', sans-serif; font-size: 34px; font-weight: 800; color: #FFF; }
      .pnl-badge { background: rgba(16,185,129,0.15); border: 1px solid #10B981; color: #10B981; font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; padding: 6px 16px; border-radius: 30px; }
      
      .pf-center { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center; margin: 20px 0; }
      .donut-chart-box { position: relative; width: 220px; height: 220px; margin: 0 auto; }
      .donut-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
      .donut-center-label { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: 'Inter', sans-serif; }
      .dcl-muted { font-size: 12px; font-weight: 700; color: #64748B; letter-spacing: 1px; }
      .dcl-val { font-size: 32px; font-weight: 900; color: #FFF; }

      .pf-legend-list { display: flex; flex-direction: column; gap: 12px; }
      .legend-item { display: flex; justify-content: space-between; font-family: 'Inter', sans-serif; font-size: 17px; color: #E2E8F0; padding: 10px 16px; background: #131B2E; border-radius: 8px; border-left: 4px solid #3B82F6; }
      .legend-item:nth-child(2) { border-left-color: #10B981; }
      .legend-item:nth-child(3) { border-left-color: #F59E0B; }
      .legend-item:nth-child(4) { border-left-color: #8B5CF6; }

      .pf-verdict-box { background: #131B2E; border: 1px solid #1E293B; border-radius: 12px; padding: 16px 20px; }
      .pf-verdict-txt { font-family: 'Inter', sans-serif; font-size: 16px; color: #94A3B8; margin: 0; font-weight: 500; }
    `
  },

  {
    id: "frame-inflation-purchasing-power",
    name: "Inflation & Purchasing Power Erosion",
    category: "fintech",
    fonts: ["Space+Grotesk:wght@700", "Plus+Jakarta+Sans:wght@500;700;800"],
    bg: "#0D1117",
    slots: {
      headline: "Sức Mua Bị Bào Mòn Bởi Lạm Phát",
      subline: "Cùng một tờ $100 mua được bao nhiêu giỏ hàng?",
      warning_tag: "CẢNH BÁO LẠM PHÁT",
      era_1: "Năm 2000: Đầy 100% Xe Hàng",
      era_2: "Năm 2012: Còn 55% Xe Hàng",
      era_3: "Năm 2026: Chỉ Còn 22% Xe Hàng",
      insight: "Giữ tiền mặt quá nhiều đồng nghĩa với việc chấp nhận mất dần tài sản."
    },
    markup: `
      <div class="inf-container">
        <div class="inf-header">
          <span class="warning-pill" data-slot="warning_tag"></span>
          <h1 class="inf-title" data-slot="headline"></h1>
          <p class="inf-sub" data-slot="subline"></p>
        </div>

        <div class="eras-grid">
          <div class="era-card era-past">
            <div class="cart-visual v-100">🛒 100%</div>
            <span class="era-label" data-slot="era_1"></span>
          </div>
          <div class="era-card era-mid">
            <div class="cart-visual v-55">🛒 55%</div>
            <span class="era-label" data-slot="era_2"></span>
          </div>
          <div class="era-card era-now">
            <div class="cart-visual v-22">🛒 22%</div>
            <span class="era-label" data-slot="era_3"></span>
          </div>
        </div>

        <div class="inf-takeaway">
          <p class="takeaway-text" data-slot="insight"></p>
        </div>
      </div>
    `,
    styles: `
      .inf-container { background: #0D1117; border: 1px solid #30363D; border-radius: 24px; padding: 40px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .inf-header { text-align: center; }
      .warning-pill { background: rgba(239,68,68,0.15); color: #EF4444; border: 1px solid #EF4444; font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 2px; }
      .inf-title { font-family: 'Space Grotesk', sans-serif; font-size: 38px; color: #F0F6FC; font-weight: 700; margin-top: 10px; }
      .inf-sub { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; color: #8B949E; margin-top: 4px; }

      .eras-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
      .era-card { background: #161B22; border: 1px solid #30363D; border-radius: 16px; padding: 24px 16px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
      .cart-visual { font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 700; padding: 16px 20px; border-radius: 12px; width: 100%; }
      .v-100 { background: rgba(16,185,129,0.2); color: #10B981; border: 1px solid #10B981; }
      .v-55 { background: rgba(245,158,11,0.2); color: #F59E0B; border: 1px solid #F59E0B; }
      .v-22 { background: rgba(239,68,68,0.2); color: #EF4444; border: 1px solid #EF4444; box-shadow: 0 0 20px rgba(239,68,68,0.3); }
      .era-label { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700; color: #C9D1D9; }

      .inf-takeaway { background: #21262D; border-left: 5px solid #EF4444; padding: 18px 24px; border-radius: 0 12px 12px 0; }
      .takeaway-text { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; color: #F0F6FC; margin: 0; font-weight: 600; }
    `
  },

  // =========================================================================
  // GROUP 2: SCIENCE, PSYCHOLOGY & EDU
  // =========================================================================
  {
    id: "frame-iceberg-levels",
    name: "Scientific Iceberg 3-Tier Descent",
    category: "science",
    fonts: ["Plus+Jakarta+Sans:wght@600;800", "Space+Mono:wght@700"],
    bg: "#020B14",
    slots: {
      headline: "Mô Hình Tảng Băng Nhận Thức",
      tag_surface: "TẦNG 1: BỀ MẶT (10%)",
      level_1: "Hành vi quan sát được & Lời nói bên ngoài",
      tag_middle: "TẦNG 2: ẨN GIẤU (40%)",
      level_2: "Cảm xúc, nỗi sợ & Định kiến vô thức",
      tag_deep: "TẦNG 3: GỐC RỄ (50%)",
      level_3: "Hệ niềm tin cốt lõi & Chấn thương thời thơ ấu",
      water_label: "~~~~~~~~ MẶT NƯỚC ~~~~~~~~",
      depth_0m: "0m",
      depth_500m: "-500m",
      depth_2000m: "-2000m",
      takeaway: "Muốn thay đổi hành vi bền vững, phải chạm vào tầng sâu nhất."
    },
    markup: `
      <div class="iceberg-stage">
        <div class="ib-header">
          <h1 class="ib-title" data-slot="headline"></h1>
        </div>

        <div class="ib-tiers">
          <div class="tier tier-surface">
            <div class="depth-marker" data-slot="depth_0m"></div>
            <div class="tier-content">
              <span class="tier-badge" data-slot="tag_surface"></span>
              <p class="tier-desc" data-slot="level_1"></p>
            </div>
          </div>
          <div class="water-line" data-slot="water_label"></div>
          <div class="tier tier-middle">
            <div class="depth-marker" data-slot="depth_500m"></div>
            <div class="tier-content">
              <span class="tier-badge" data-slot="tag_middle"></span>
              <p class="tier-desc" data-slot="level_2"></p>
            </div>
          </div>
          <div class="tier tier-deep">
            <div class="depth-marker" data-slot="depth_2000m"></div>
            <div class="tier-content">
              <span class="tier-badge" data-slot="tag_deep"></span>
              <p class="tier-desc" data-slot="level_3"></p>
            </div>
          </div>
        </div>

        <div class="ib-footer">
          <p class="ib-takeaway-txt" data-slot="takeaway"></p>
        </div>
      </div>
    `,
    styles: `
      .iceberg-stage { background: linear-gradient(180deg, #0284C7 0%, #0369A1 18%, #0C4A6E 45%, #020B14 100%); border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 20px 60px rgba(0,0,0,0.8); }
      .ib-header { text-align: center; }
      .ib-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 38px; font-weight: 800; color: #FFF; text-shadow: 0 4px 12px rgba(0,0,0,0.4); }
      
      .ib-tiers { display: flex; flex-direction: column; gap: 12px; margin: 16px 0; }
      .water-line { font-family: 'Space Mono', monospace; font-size: 12px; color: #BAE6FD; text-align: center; letter-spacing: 2px; opacity: 0.8; }
      .tier { display: flex; align-items: center; gap: 18px; padding: 14px 20px; border-radius: 12px; background: rgba(2,11,20,0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
      .depth-marker { font-family: 'Space Mono', monospace; font-size: 14px; color: #38BDF8; font-weight: 700; min-width: 70px; }
      .tier-content { flex: 1; }
      .tier-badge { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 800; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 4px; }
      .tier-surface .tier-badge { background: #BAE6FD; color: #0369A1; }
      .tier-middle .tier-badge { background: #38BDF8; color: #0C4A6E; }
      .tier-deep .tier-badge { background: #F43F5E; color: #FFF; box-shadow: 0 0 15px rgba(244,63,94,0.5); }
      .tier-desc { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; color: #F0F9FF; margin: 0; font-weight: 600; }

      .ib-footer { background: rgba(0,0,0,0.7); border: 1px solid #38BDF8; border-radius: 12px; padding: 14px 20px; text-align: center; }
      .ib-takeaway-txt { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; color: #E0F2FE; margin: 0; font-weight: 700; }
    `
  },

  {
    id: "frame-brain-synapse",
    name: "Neural Synapse & Dopamine Circuit",
    category: "science",
    fonts: ["Chakra+Petch:wght@600;700", "Plus+Jakarta+Sans:wght@500;700"],
    bg: "#050711",
    slots: {
      headline: "Vòng Lặp Kích Thích Dopamine",
      molecule: "HỢP CHẤT: C8H11NO2 (DOPAMINE)",
      node_1: "KÍCH THÍCH",
      node_2: "TIẾT HORMONE",
      node_3: "THỎA MÃN",
      trigger_tag: "TÁC NHÂN",
      reaction_tag: "PHẢN ỨNG NÃO BỘ",
      trigger: "Thông báo chuông điện thoại hoặc lướt feed mạng xã hội",
      reaction: "Não giải phóng Dopamine thúc đẩy hành vi lặp lại tức thì",
      warning: "Cắt đứt tín hiệu kích thích là cách duy nhất để cai nghiện dopamine."
    },
    markup: `
      <div class="synapse-hud">
        <div class="syn-header">
          <div class="chem-badge" data-slot="molecule"></div>
          <h1 class="syn-title" data-slot="headline"></h1>
        </div>

        <div class="neural-network-stage">
          <svg class="nn-svg" viewBox="0 0 600 160">
            <line x1="100" y1="80" x2="300" y2="80" stroke="#7000FF" stroke-width="4" stroke-dasharray="6 6" />
            <line x1="300" y1="80" x2="500" y2="80" stroke="#00F5D4" stroke-width="4" />
            <circle cx="100" cy="80" r="36" fill="#7000FF" class="syn-node" />
            <circle cx="300" cy="80" r="44" fill="#FF007A" class="syn-node pulse-syn" />
            <circle cx="500" cy="80" r="36" fill="#00F5D4" class="syn-node" />
          </svg>
          <div class="node-labels">
            <span class="nl nl-1" data-slot="node_1"></span>
            <span class="nl nl-2" data-slot="node_2"></span>
            <span class="nl nl-3" data-slot="node_3"></span>
          </div>
        </div>

        <div class="flow-breakdown">
          <div class="flow-card">
            <span class="fc-head" data-slot="trigger_tag"></span>
            <p class="fc-body" data-slot="trigger"></p>
          </div>
          <div class="flow-card">
            <span class="fc-head" data-slot="reaction_tag"></span>
            <p class="fc-body" data-slot="reaction"></p>
          </div>
        </div>

        <div class="syn-warning" data-slot="warning"></div>
      </div>
    `,
    styles: `
      .synapse-hud { background: #050711; border: 1px solid #1E1B4B; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .syn-header { text-align: center; }
      .chem-badge { font-family: 'Chakra Petch', sans-serif; font-size: 13px; font-weight: 700; color: #00F5D4; letter-spacing: 2px; }
      .syn-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 38px; font-weight: 800; color: #FFF; margin-top: 6px; }

      .neural-network-stage { position: relative; margin: 10px 0; }
      .nn-svg { width: 100%; height: 140px; }
      .syn-node { filter: drop-shadow(0 0 15px currentColor); }
      .pulse-syn { animation: nodePulse 1.5s infinite alternate; }
      .node-labels { display: flex; justify-content: space-around; font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: 15px; color: #E2E8F0; }

      .flow-breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .flow-card { background: rgba(30,27,75,0.5); border: 1px solid #312E81; border-radius: 12px; padding: 16px; }
      .fc-head { font-family: 'Chakra Petch', sans-serif; font-size: 12px; font-weight: 700; color: #A78BFA; letter-spacing: 1px; }
      .fc-body { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; color: #F1F5F9; margin-top: 6px; margin-bottom: 0; line-height: 1.4; }

      .syn-warning { background: #1E1B4B; border-left: 4px solid #FF007A; color: #FDF2F8; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 600; padding: 12px 18px; border-radius: 0 8px 8px 0; }
      @keyframes nodePulse { to { transform: scale(1.08); } }
    `
  },

  {
    id: "frame-habit-loop",
    name: "4-Quadrant Habit Loop Framework",
    category: "science",
    fonts: ["Cabinet+Grotesk:wght@800;900", "Plus+Jakarta+Sans:wght@600;700"],
    bg: "#0B0F19",
    slots: {
      headline: "Vòng Lặp Thói Quen (Atomic Habits)",
      cue: "1. Gợi Ý (Cue)",
      craving: "2. Thèm Khát (Craving)",
      response: "3. Phản Ứng (Response)",
      reward: "4. Phần Thưởng (Reward)",
      loop_center: "LOOP",
      key_point: "Thay đổi một thói quen bắt đầu từ việc thay đổi gợi ý môi trường."
    },
    markup: `
      <div class="habit-container">
        <div class="hb-top">
          <h1 class="hb-title" data-slot="headline"></h1>
        </div>

        <div class="loop-quadrants">
          <div class="quad q-1" data-slot="cue"></div>
          <div class="quad q-2" data-slot="craving"></div>
          <div class="quad q-3" data-slot="response"></div>
          <div class="quad q-4" data-slot="reward"></div>
          <div class="loop-center" data-slot="loop_center"></div>
        </div>

        <div class="hb-footer">
          <p class="hb-key-point" data-slot="key_point"></p>
        </div>
      </div>
    `,
    styles: `
      .habit-container { background: #0B0F19; border: 1px solid #1E293B; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; align-items: center; }
      .hb-title { font-family: 'Cabinet Grotesk', sans-serif; font-size: 38px; font-weight: 900; color: #FFF; text-align: center; }

      .loop-quadrants { position: relative; width: 340px; height: 340px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 10px 0; }
      .quad { border-radius: 16px; padding: 20px; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 800; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
      .q-1 { background: #3B82F6; color: #FFF; }
      .q-2 { background: #F59E0B; color: #000; }
      .q-3 { background: #10B981; color: #FFF; }
      .q-4 { background: #EC4899; color: #FFF; }
      .loop-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70px; height: 70px; background: #0B0F19; border: 3px solid #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Cabinet Grotesk', sans-serif; font-size: 14px; font-weight: 900; color: #FFF; }

      .hb-footer { width: 100%; background: #1E293B; border-radius: 12px; padding: 16px 20px; text-align: center; }
      .hb-key-point { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; color: #E2E8F0; margin: 0; font-weight: 700; }
    `
  },

  {
    id: "frame-dna-helix-breakdown",
    name: "DNA Helix & Biotech Blueprint",
    category: "science",
    fonts: ["Space+Mono:wght@700", "Plus+Jakarta+Sans:wght@600;800"],
    bg: "#040D1A",
    slots: {
      headline: "Đột Phá Chỉnh Sửa Gen CRISPR",
      target_gene: "TARGET: GEN BCL11A",
      rung_1: "A === T",
      rung_2: "G === C",
      rung_3: "CRISPR CUT",
      rung_4: "T === A",
      rung_5: "C === G",
      mechanism: "Cơ chế: Cắt đứt đoạn ADN gây đột biến bệnh thiếu máu",
      application: "Ứng dụng: Chữa lành tận gốc bệnh di truyền tế bào hình liềm",
      impact: "Mở ra kỷ nguyên y học chính xác loại bỏ bệnh nan y."
    },
    markup: `
      <div class="dna-container">
        <div class="dna-topbar">
          <span class="gene-target" data-slot="target_gene"></span>
          <h1 class="dna-title" data-slot="headline"></h1>
        </div>

        <div class="dna-visual-row">
          <div class="helix-graphic">
            <div class="rungs">
              <span class="rung" data-slot="rung_1"></span>
              <span class="rung" data-slot="rung_2"></span>
              <span class="rung rung-cut" data-slot="rung_3"></span>
              <span class="rung" data-slot="rung_4"></span>
              <span class="rung" data-slot="rung_5"></span>
            </div>
          </div>

          <div class="dna-cards">
            <div class="d-card" data-slot="mechanism"></div>
            <div class="d-card" data-slot="application"></div>
          </div>
        </div>

        <div class="dna-footer" data-slot="impact"></div>
      </div>
    `,
    styles: `
      .dna-container { background: #040D1A; border: 1px solid #0284C7; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .gene-target { font-family: 'Space Mono', monospace; font-size: 14px; color: #38BDF8; font-weight: 700; letter-spacing: 2px; }
      .dna-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 38px; font-weight: 800; color: #FFF; margin-top: 6px; }

      .dna-visual-row { display: grid; grid-template-columns: 1fr 1.5fr; gap: 24px; align-items: center; margin: 16px 0; }
      .helix-graphic { background: #082F49; border-radius: 16px; padding: 20px; }
      .rungs { display: flex; flex-direction: column; gap: 10px; font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 700; text-align: center; }
      .rung { background: #0C4A6E; color: #38BDF8; padding: 8px; border-radius: 6px; }
      .rung-cut { background: #EF4444; color: #FFF; box-shadow: 0 0 15px rgba(239,68,68,0.5); }

      .dna-cards { display: flex; flex-direction: column; gap: 12px; }
      .d-card { background: rgba(14,116,144,0.2); border-left: 4px solid #38BDF8; padding: 14px 18px; border-radius: 0 10px 10px 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; color: #E0F2FE; font-weight: 600; }

      .dna-footer { background: #0C4A6E; color: #FFF; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; padding: 16px 20px; border-radius: 12px; text-align: center; }
    `
  },

  {
    id: "frame-bell-curve-iq",
    name: "Gaussian Bell Curve & Cognitive Distribution",
    category: "science",
    fonts: ["Space+Mono:wght@700", "Plus+Jakarta+Sans:wght@600;800"],
    bg: "#0B0E14",
    slots: {
      headline: "Hiệu Ứng Dunning-Kruger",
      low_group: "Mới Học: Tự tin tột đỉnh (Chưa biết mình không biết)",
      mid_group: "Thực chiến: Thung lũng thất vọng (Biết mình còn yếu)",
      high_group: "Chuyên Gia: Khiêm tốn & Vững vàng (Hiểu rõ ranh giới)",
      lesson: "Càng học nhiều, ta càng nhận ra mình còn biết rất ít."
    },
    markup: `
      <div class="bell-container">
        <div class="bell-top">
          <h1 class="bell-title" data-slot="headline"></h1>
        </div>

        <div class="bell-stage">
          <svg class="bell-svg" viewBox="0 0 600 180">
            <path d="M 30 160 Q 150 160 200 40 Q 300 20 400 40 Q 450 160 570 160" stroke="#38BDF8" stroke-width="4" fill="rgba(56,189,248,0.1)" />
            <line x1="300" y1="20" x2="300" y2="160" stroke="#F59E0B" stroke-width="2" stroke-dasharray="4 4" />
          </svg>
          <div class="bell-stages-grid">
            <div class="b-stage stage-1" data-slot="low_group"></div>
            <div class="b-stage stage-2" data-slot="mid_group"></div>
            <div class="b-stage stage-3" data-slot="high_group"></div>
          </div>
        </div>

        <div class="bell-footer">
          <p class="bell-lesson" data-slot="lesson"></p>
        </div>
      </div>
    `,
    styles: `
      .bell-container { background: #0B0E14; border: 1px solid #1E293B; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .bell-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 38px; font-weight: 800; color: #FFF; text-align: center; }

      .bell-stage { position: relative; margin: 10px 0; }
      .bell-svg { width: 100%; height: 130px; }
      .bell-stages-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px; }
      .b-stage { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700; padding: 12px; border-radius: 8px; text-align: center; }
      .stage-1 { background: rgba(239,68,68,0.2); color: #FCA5A5; border: 1px solid #EF4444; }
      .stage-2 { background: rgba(245,158,11,0.2); color: #FCD34D; border: 1px solid #F59E0B; }
      .stage-3 { background: rgba(16,185,129,0.2); color: #6EE7B7; border: 1px solid #10B981; }

      .bell-footer { background: #1E293B; border-radius: 12px; padding: 16px 20px; text-align: center; }
      .bell-lesson { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; color: #F8FAFC; margin: 0; font-weight: 700; }
    `
  },

  // =========================================================================
  // GROUP 3: DOCUMENTARY, CRIME & BUSINESS WARS
  // =========================================================================
  {
    id: "frame-magnates-polaroid-desk",
    name: "Investigation Corkboard & Polaroid",
    category: "documentary",
    fonts: ["Special+Elite", "Courier+Prime:wght@700", "Cinzel:wght@700"],
    bg: "#14110F",
    slots: {
      headline: "Đại Án Thao Túng Thị Trường",
      case_no: "HỒ SƠ MẬT #8492-X",
      target_a: "Nhân vật A: Chủ tịch Tập đoàn",
      target_b: "Tổ chức B: Quỹ đầu tư vỏ bọc",
      connection: "Giao dịch ngầm: 5,000 tỷ VNĐ",
      seal_text: "TỐI MẬT",
      verdict: "Toàn bộ mạng lưới công ty con bị phong tỏa tài sản."
    },
    markup: `
      <div class="corkboard-frame">
        <div class="cb-header">
          <span class="case-stamp" data-slot="case_no"></span>
          <h1 class="case-title" data-slot="headline"></h1>
        </div>

        <div class="polaroid-desk">
          <div class="polaroid p-left">
            <div class="photo-box">👤</div>
            <span class="p-caption" data-slot="target_a"></span>
          </div>

          <div class="yarn-connector">
            <span class="yarn-line"></span>
            <span class="yarn-tag" data-slot="connection"></span>
          </div>

          <div class="polaroid p-right">
            <div class="photo-box">🏢</div>
            <span class="p-caption" data-slot="target_b"></span>
          </div>
        </div>

        <div class="dossier-verdict">
          <span class="confidential-seal" data-slot="seal_text"></span>
          <p class="verdict-text" data-slot="verdict"></p>
        </div>
      </div>
    `,
    styles: `
      .corkboard-frame { background: #1C1917; border: 8px solid #292524; border-radius: 20px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; box-shadow: inset 0 0 80px rgba(0,0,0,0.9); }
      .cb-header { text-align: center; }
      .case-stamp { font-family: 'Courier Prime', monospace; font-size: 15px; color: #EF4444; border: 2px solid #EF4444; padding: 4px 12px; display: inline-block; font-weight: 700; letter-spacing: 2px; transform: rotate(-2deg); }
      .case-title { font-family: 'Cinzel', serif; font-size: 38px; color: #E7E5E4; font-weight: 700; margin-top: 10px; }

      .polaroid-desk { display: flex; justify-content: space-between; align-items: center; margin: 16px 0; }
      .polaroid { background: #F5F5F4; color: #1C1917; padding: 14px 14px 24px 14px; border-radius: 4px; box-shadow: 0 15px 35px rgba(0,0,0,0.8); width: 220px; text-align: center; }
      .p-left { transform: rotate(-4deg); }
      .p-right { transform: rotate(4deg); }
      .photo-box { background: #292524; height: 130px; display: flex; align-items: center; justify-content: center; font-size: 44px; margin-bottom: 12px; }
      .p-caption { font-family: 'Special Elite', cursive; font-size: 14px; font-weight: 700; }

      .yarn-connector { flex: 1; position: relative; text-align: center; }
      .yarn-line { display: block; height: 3px; background: #DC2626; box-shadow: 0 0 10px #DC2626; }
      .yarn-tag { font-family: 'Courier Prime', monospace; font-size: 13px; background: #DC2626; color: #FFF; padding: 4px 10px; border-radius: 4px; display: inline-block; transform: translateY(-12px); font-weight: 700; }

      .dossier-verdict { background: #292524; border-left: 6px solid #DC2626; padding: 16px 20px; border-radius: 0 8px 8px 0; display: flex; align-items: center; gap: 16px; }
      .confidential-seal { background: #DC2626; color: #FFF; font-family: 'Courier Prime', monospace; font-size: 13px; font-weight: 700; padding: 4px 8px; }
      .verdict-text { font-family: 'Special Elite', cursive; font-size: 16px; color: #D6D3D1; margin: 0; }
    `
  },

  {
    id: "frame-stock-ticker-tape",
    name: "Dot-Matrix Stock Ticker & Breaking News",
    category: "documentary",
    fonts: ["VT323", "Montserrat:wght@800;900", "Be+Vietnam+Pro:wght@600"],
    bg: "#050505",
    slots: {
      breaking: "BẢN TIN KHẨN CẤP",
      ticker_feed: "DOW -1,200 PTS · S&P500 -4.2% · NASDAQ -5.8% · CRUDE OIL +8.4%",
      headline: "Thị Trường Hoảng Loạn Bán Tháo",
      context: "Áp lực lạm phát và căng thẳng địa chính trị kích hoạt làn sóng tháo chạy vốn kỷ lục."
    },
    markup: `
      <div class="ticker-news-stage">
        <div class="led-ticker-bar">
          <div class="ticker-scroll" data-slot="ticker_feed"></div>
        </div>

        <div class="breaking-banner">
          <span class="flash-beacon"></span>
          <span class="breaking-tag" data-slot="breaking"></span>
        </div>

        <div class="news-content-box">
          <h1 class="news-headline" data-slot="headline"></h1>
          <p class="news-context" data-slot="context"></p>
        </div>
      </div>
    `,
    styles: `
      .ticker-news-stage { background: #0A0A0A; border: 2px solid #262626; border-radius: 20px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .led-ticker-bar { background: #000; border: 2px solid #F59E0B; border-radius: 8px; padding: 12px 20px; overflow: hidden; box-shadow: 0 0 20px rgba(245,158,11,0.2); }
      .ticker-scroll { font-family: 'VT323', monospace; font-size: 32px; color: #F59E0B; text-shadow: 0 0 10px #F59E0B; white-space: nowrap; }

      .breaking-banner { display: flex; align-items: center; gap: 14px; margin-top: 10px; }
      .flash-beacon { width: 14px; height: 14px; background: #EF4444; border-radius: 50%; box-shadow: 0 0 15px #EF4444; }
      .breaking-tag { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 900; background: #EF4444; color: #FFF; padding: 4px 14px; border-radius: 4px; letter-spacing: 2px; }

      .news-content-box { background: #171717; border: 1px solid #333; border-radius: 16px; padding: 30px; }
      .news-headline { font-family: 'Montserrat', sans-serif; font-size: 42px; font-weight: 900; color: #FFF; line-height: 1.2; }
      .news-context { font-family: 'Be Vietnam Pro', sans-serif; font-size: 18px; color: #A3A3A3; margin-top: 14px; line-height: 1.5; font-weight: 600; margin-bottom: 0; }
    `
  },

  {
    id: "frame-timeline-war-era",
    name: "Historical Milestone War Timeline",
    category: "documentary",
    fonts: ["Cinzel:wght@700;900", "Plus+Jakarta+Sans:wght@500;700"],
    bg: "#12100E",
    slots: {
      headline: "Cuộc Chiến Giành Thị Phần Trình Duyệt",
      event_1: "1995: Netscape thống trị 90% người dùng web",
      event_2: "1998: Microsoft tung IE tích hợp thẳng vào Windows",
      event_3: "2008: Google Chrome ra mắt thay đổi hoàn toàn cục diện",
      conclusion: "Tốc độ và hệ sinh thái mở luôn đánh bại sự độc quyền khép kín."
    },
    markup: `
      <div class="war-timeline-stage">
        <h1 class="wt-title" data-slot="headline"></h1>

        <div class="milestones-spine">
          <div class="spine-line"></div>
          <div class="ms-node">
            <span class="ms-dot"></span>
            <div class="ms-card" data-slot="event_1"></div>
          </div>
          <div class="ms-node">
            <span class="ms-dot"></span>
            <div class="ms-card" data-slot="event_2"></div>
          </div>
          <div class="ms-node">
            <span class="ms-dot ms-active"></span>
            <div class="ms-card ms-highlight" data-slot="event_3"></div>
          </div>
        </div>

        <div class="wt-footer" data-slot="conclusion"></div>
      </div>
    `,
    styles: `
      .war-timeline-stage { background: radial-gradient(circle at 50% 0%, #26201A 0%, #12100E 100%); border: 1px solid #44372C; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .wt-title { font-family: 'Cinzel', serif; font-size: 36px; font-weight: 900; color: #D4AF37; text-align: center; }

      .milestones-spine { position: relative; display: flex; flex-direction: column; gap: 16px; margin: 10px 0 10px 20px; }
      .spine-line { position: absolute; top: 10px; bottom: 10px; left: 7px; width: 2px; background: #D4AF37; }
      .ms-node { display: flex; align-items: center; gap: 20px; position: relative; z-index: 2; }
      .ms-dot { width: 16px; height: 16px; border-radius: 50%; background: #26201A; border: 2px solid #D4AF37; }
      .ms-active { background: #D4AF37; box-shadow: 0 0 12px #D4AF37; }
      .ms-card { background: #1C1814; border: 1px solid #44372C; padding: 12px 18px; border-radius: 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; color: #E7E5E4; font-weight: 600; flex: 1; }
      .ms-highlight { background: rgba(212,175,55,0.15); border-color: #D4AF37; color: #FFF; font-weight: 700; }

      .wt-footer { background: #1C1814; border-left: 4px solid #D4AF37; padding: 14px 20px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; color: #D4AF37; font-weight: 700; }
    `
  },

  {
    id: "frame-document-redacted",
    name: "Declassified Document & Evaporating Redaction",
    category: "documentary",
    fonts: ["Courier+Prime:wght@400;700", "Cinzel:wght@700"],
    bg: "#E8E2D5",
    slots: {
      classification: "BÁO CÁO MẬT ĐÃ GIẢI MẬT",
      doc_title: "HỒ SƠ THỎA THUẬN NGẦM GIỮA 2 ÔNG LỚN",
      redact_tag: "ĐIỀU KHOẢN BÍ MẬT:",
      secret_text: "Cam kết chia đôi thị trường và giữ giá cao nhân tạo",
      revealed_info: "Hành vi vi phạm luật chống độc quyền kéo dài suốt 7 năm.",
      summary: "Tài liệu nội bộ rò rỉ làm bằng chứng kết tội trước tòa án."
    },
    markup: `
      <div class="memo-sheet">
        <div class="memo-header">
          <span class="declass-stamp" data-slot="classification"></span>
          <h2 class="doc-subject" data-slot="doc_title"></h2>
        </div>

        <div class="memo-body">
          <div class="redacted-reveal-box">
            <span class="redact-label" data-slot="redact_tag"></span>
            <div class="revealed-clause" data-slot="secret_text"></div>
          </div>
          <p class="memo-context" data-slot="revealed_info"></p>
        </div>

        <div class="memo-footer" data-slot="summary"></div>
      </div>
    `,
    styles: `
      .memo-sheet { background: #F5EFEB; color: #1C1917; border: 1px solid #D6CEBE; border-radius: 12px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 15px 40px rgba(0,0,0,0.4); }
      .memo-header { text-align: center; border-bottom: 2px solid #1C1917; padding-bottom: 16px; }
      .declass-stamp { font-family: 'Courier Prime', monospace; font-size: 14px; font-weight: 700; color: #DC2626; border: 2px solid #DC2626; padding: 4px 12px; display: inline-block; letter-spacing: 2px; }
      .doc-subject { font-family: 'Cinzel', serif; font-size: 30px; font-weight: 700; color: #1C1917; margin-top: 10px; }

      .memo-body { margin: 16px 0; }
      .redacted-reveal-box { background: #1C1917; color: #FFF; padding: 18px; border-radius: 6px; margin-bottom: 12px; }
      .redact-label { font-family: 'Courier Prime', monospace; font-size: 12px; color: #DC2626; font-weight: 700; display: block; margin-bottom: 4px; }
      .revealed-clause { font-family: 'Courier Prime', monospace; font-size: 20px; font-weight: 700; color: #FEF08A; }
      .memo-context { font-family: 'Courier Prime', monospace; font-size: 16px; color: #44403C; line-height: 1.5; margin: 0; }

      .memo-footer { font-family: 'Courier Prime', monospace; font-size: 15px; background: #E7E0D3; padding: 12px 16px; border-radius: 4px; font-weight: 700; }
    `
  },

  {
    id: "frame-money-flow-conduit",
    name: "Money Flow & Offshore Conduit Pipeline",
    category: "documentary",
    fonts: ["Montserrat:wght@800;900", "JetBrains+Mono:wght@700"],
    bg: "#0A0E17",
    slots: {
      headline: "Đường Đi Dòng Tiền Trốn Thuế",
      source_entity: "Doanh Thu Mỹ: $10 Tỷ",
      conduit_entity: "Chuyển giá qua Ireland",
      tax_haven: "Thiên Đường Thuế Bermuda",
      savings: "Thuế Suất Giảm Từ 35% Xuống 0.005%"
    },
    markup: `
      <div class="money-flow-stage">
        <h1 class="mf-title" data-slot="headline"></h1>

        <div class="flow-pipeline">
          <div class="pipeline-node node-src">
            <span class="p-icon">🏢</span>
            <span class="p-name" data-slot="source_entity"></span>
          </div>
          <div class="flow-arrow">➡️ 💰 ➡️</div>
          <div class="pipeline-node node-conduit">
            <span class="p-icon">🔄</span>
            <span class="p-name" data-slot="conduit_entity"></span>
          </div>
          <div class="flow-arrow">➡️ 💸 ➡️</div>
          <div class="pipeline-node node-haven">
            <span class="p-icon">🏝️</span>
            <span class="p-name" data-slot="tax_haven"></span>
          </div>
        </div>

        <div class="savings-badge" data-slot="savings"></div>
      </div>
    `,
    styles: `
      .money-flow-stage { background: #0A0E17; border: 1px solid #1E293B; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; text-align: center; }
      .mf-title { font-family: 'Montserrat', sans-serif; font-size: 38px; font-weight: 900; color: #FFF; }

      .flow-pipeline { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin: 20px 0; }
      .pipeline-node { background: #131D31; border: 1px solid #334155; border-radius: 14px; padding: 20px 14px; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px; }
      .p-icon { font-size: 32px; }
      .p-name { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #F1F5F9; font-weight: 700; }
      .node-haven { background: rgba(16,185,129,0.15); border-color: #10B981; }
      .flow-arrow { font-size: 18px; }

      .savings-badge { background: linear-gradient(135deg, #10B981, #059669); color: #FFF; font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 900; padding: 16px; border-radius: 12px; box-shadow: 0 10px 30px rgba(16,185,129,0.4); }
    `
  },

  // =========================================================================
  // GROUP 4: VIRAL HOOKS & GAMIFICATION
  // =========================================================================
  {
    id: "frame-tier-list",
    name: "Arcade Tier List Ranking Board",
    category: "viral",
    fonts: ["Montserrat:wght@900", "Plus+Jakarta+Sans:wght@700;800"],
    bg: "#0E0E12",
    slots: {
      headline: "Xếp Hạng AI Coding Tools 2026",
      badge_s: "S",
      badge_a: "A",
      badge_b: "B",
      tier_s: "Claude 3.7 Sonnet · Cursor AI",
      tier_a: "GitHub Copilot · Windsurf",
      tier_b: "ChatGPT Plus · v0.dev",
      verdict: "Claude 3.7 + Cursor là combo bất bại cho lập trình viên."
    },
    markup: `
      <div class="tier-board">
        <h1 class="tb-title" data-slot="headline"></h1>

        <div class="tiers-stack">
          <div class="t-row t-s">
            <div class="t-badge" data-slot="badge_s"></div>
            <div class="t-items" data-slot="tier_s"></div>
          </div>
          <div class="t-row t-a">
            <div class="t-badge" data-slot="badge_a"></div>
            <div class="t-items" data-slot="tier_a"></div>
          </div>
          <div class="t-row t-b">
            <div class="t-badge" data-slot="badge_b"></div>
            <div class="t-items" data-slot="tier_b"></div>
          </div>
        </div>

        <div class="tb-verdict" data-slot="verdict"></div>
      </div>
    `,
    styles: `
      .tier-board { background: #0E0E12; border: 4px solid #000; border-radius: 20px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 8px 8px 0px #000; }
      .tb-title { font-family: 'Montserrat', sans-serif; font-size: 38px; font-weight: 900; color: #FFF; text-align: center; }

      .tiers-stack { display: flex; flex-direction: column; gap: 10px; margin: 10px 0; }
      .t-row { display: flex; background: #181820; border: 3px solid #000; border-radius: 10px; overflow: hidden; min-height: 60px; }
      .t-badge { width: 70px; display: flex; align-items: center; justify-content: center; font-family: 'Montserrat', sans-serif; font-size: 32px; font-weight: 900; color: #000; }
      .t-s .t-badge { background: #FF0055; color: #FFF; }
      .t-a .t-badge { background: #FF6B00; }
      .t-b .t-badge { background: #FFD700; }
      .t-items { flex: 1; padding: 12px 20px; display: flex; align-items: center; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 800; color: #FFF; }

      .tb-verdict { background: #FFD700; color: #000; font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 900; padding: 14px 20px; border-radius: 8px; border: 3px solid #000; text-align: center; }
    `
  },

  {
    id: "frame-notification-stack",
    name: "Smartphone Notification Cascade Hook",
    category: "viral",
    fonts: ["Inter:wght@500;700;800"],
    bg: "#090A0F",
    slots: {
      phone_time: "09:41",
      phone_date: "THỨ BẢY, 15 THÁNG 8",
      noti_1: "💰 Stripe: Nhận thanh toán +$4,950.00 từ khách hàng mới",
      noti_2: "🚀 TikTok: Video của bạn vừa cán mốc 1,200,000 views",
      noti_3: "⭐ YouTube: +15,000 Người đăng ký mới hôm nay",
      proof_hook: "Bí quyết tạo cỗ máy tăng trưởng tự động không cần quảng cáo."
    },
    markup: `
      <div class="lockscreen-stage">
        <div class="ls-clock">
          <span class="clock-time" data-slot="phone_time"></span>
          <span class="clock-date" data-slot="phone_date"></span>
        </div>

        <div class="notifications-cascade">
          <div class="noti noti-1" data-slot="noti_1"></div>
          <div class="noti noti-2" data-slot="noti_2"></div>
          <div class="noti noti-3" data-slot="noti_3"></div>
        </div>

        <div class="hook-banner" data-slot="proof_hook"></div>
      </div>
    `,
    styles: `
      .lockscreen-stage { background: radial-gradient(circle at 50% 30%, #1E1B4B 0%, #090A0F 100%); border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid rgba(255,255,255,0.1); }
      .ls-clock { text-align: center; color: #FFF; font-family: 'Inter', sans-serif; }
      .clock-time { font-size: 64px; font-weight: 800; display: block; line-height: 1; }
      .clock-date { font-size: 14px; font-weight: 600; color: #A5B4FC; letter-spacing: 2px; margin-top: 6px; }

      .notifications-cascade { display: flex; flex-direction: column; gap: 12px; margin: 10px 0; }
      .noti { background: rgba(255,255,255,0.15); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 16px 20px; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 700; color: #FFF; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }

      .hook-banner { background: #38BDF8; color: #0F172A; font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 800; padding: 16px; border-radius: 14px; text-align: center; }
    `
  },

  {
    id: "frame-poll-voting",
    name: "Interactive Tug-of-War Community Poll",
    category: "viral",
    fonts: ["Montserrat:wght@900", "Plus+Jakarta+Sans:wght@700;800"],
    bg: "#0B0C10",
    slots: {
      headline: "Cuộc Chiến Hệ Điều Hành: Mac vs Windows?",
      option_a: "Option A: MacBook M3 (68%)",
      option_b: "Option B: Windows Gaming (32%)",
      vs_label: "VS",
      cta: "Bạn chọn bên nào? Hãy để lại bình luận phía dưới!"
    },
    markup: `
      <div class="poll-arena">
        <h1 class="poll-title" data-slot="headline"></h1>

        <div class="poll-bars-wrap">
          <div class="opt-bar bar-a" data-slot="option_a"></div>
          <div class="vs-badge" data-slot="vs_label"></div>
          <div class="opt-bar bar-b" data-slot="option_b"></div>
        </div>

        <div class="poll-cta" data-slot="cta"></div>
      </div>
    `,
    styles: `
      .poll-arena { background: #0B0C10; border: 3px solid #1F2833; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .poll-title { font-family: 'Montserrat', sans-serif; font-size: 38px; font-weight: 900; color: #66FCF1; text-align: center; }

      .poll-bars-wrap { display: flex; flex-direction: column; gap: 16px; position: relative; margin: 10px 0; }
      .opt-bar { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 800; padding: 20px 24px; border-radius: 14px; color: #FFF; box-shadow: 0 10px 25px rgba(0,0,0,0.6); }
      .bar-a { background: linear-gradient(90deg, #45A29E, #66FCF1); color: #0B0C10; }
      .bar-b { background: linear-gradient(90deg, #FF007F, #FF5500); }
      .vs-badge { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #0B0C10; border: 3px solid #FFF; color: #FFF; font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 900; padding: 6px 12px; border-radius: 20px; }

      .poll-cta { background: #1F2833; border: 1px solid #45A29E; color: #C5C6C7; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; padding: 16px; border-radius: 12px; text-align: center; }
    `
  },

  {
    id: "frame-speedrun-timer",
    name: "Speedrun Challenge & Milestones HUD",
    category: "viral",
    fonts: ["VT323", "Chakra+Petch:wght@700;800", "Plus+Jakarta+Sans:wght@700"],
    bg: "#05060A",
    slots: {
      headline: "Thử Thách Dựng Web Full-Stack Trong 60s",
      timer_display: "00:48.24",
      timer_tag: "CHALLENGE RUNNING",
      milestone_1: "00:15 - Khởi tạo Next.js & Tailwind",
      milestone_2: "00:32 - Kết nối Database Supabase",
      milestone_3: "00:48 - Deploy production lên Vercel",
      outcome: "KỶ LỤC HOÀN THÀNH TRƯỚC HẠN 12 GIÂY"
    },
    markup: `
      <div class="speedrun-stage">
        <h1 class="sr-title" data-slot="headline"></h1>

        <div class="timer-display-box">
          <span class="digital-timer" data-slot="timer_display"></span>
          <span class="timer-tag" data-slot="timer_tag"></span>
        </div>

        <div class="milestones-box">
          <div class="ms-line" data-slot="milestone_1"></div>
          <div class="ms-line" data-slot="milestone_2"></div>
          <div class="ms-line" data-slot="milestone_3"></div>
        </div>

        <div class="sr-outcome" data-slot="outcome"></div>
      </div>
    `,
    styles: `
      .speedrun-stage { background: #05060A; border: 2px solid #00F0FF; border-radius: 20px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 0 40px rgba(0,240,255,0.2); }
      .sr-title { font-family: 'Chakra Petch', sans-serif; font-size: 36px; font-weight: 800; color: #FFF; text-align: center; }

      .timer-display-box { background: #000; border: 2px solid #FF0055; border-radius: 14px; padding: 16px; text-align: center; box-shadow: 0 0 25px rgba(255,0,85,0.4); }
      .digital-timer { font-family: 'VT323', monospace; font-size: 64px; color: #FF0055; text-shadow: 0 0 15px #FF0055; display: block; line-height: 1; }
      .timer-tag { font-family: 'Chakra Petch', sans-serif; font-size: 13px; color: #94A3B8; letter-spacing: 2px; font-weight: 700; }

      .milestones-box { display: flex; flex-direction: column; gap: 8px; }
      .ms-line { background: #0F172A; border: 1px solid #334155; padding: 12px 18px; border-radius: 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; color: #E2E8F0; }

      .sr-outcome { background: #00F0FF; color: #000; font-family: 'Chakra Petch', sans-serif; font-size: 18px; font-weight: 800; padding: 14px; border-radius: 8px; text-align: center; }
    `
  },

  {
    id: "frame-card-pack-opening",
    name: "Gacha Pack Opening & Card Reveal",
    category: "viral",
    fonts: ["Montserrat:wght@900", "Plus+Jakarta+Sans:wght@700;800"],
    bg: "#0A0518",
    slots: {
      headline: "Mở Rương Siêu Năng Lực AI",
      card_name: "Claude 3.7 Hybrid Reasoning",
      power_stat: "SỨC MẠNH: 99.8/100",
      attribute: "Hệ: Deep Thinking & Instant Code",
      rarity: "⭐ ULTRA RARE 5-STAR ⭐"
    },
    markup: `
      <div class="gacha-stage">
        <h1 class="gc-title" data-slot="headline"></h1>

        <div class="holo-card">
          <div class="card-glow-border">
            <span class="rarity-badge" data-slot="rarity"></span>
            <h2 class="card-hero-name" data-slot="card_name"></h2>
            <div class="card-stat-pill" data-slot="power_stat"></div>
            <p class="card-attr" data-slot="attribute"></p>
          </div>
        </div>
      </div>
    `,
    styles: `
      .gacha-stage { background: radial-gradient(circle at 50% 50%, #2E1065 0%, #0A0518 100%); border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; align-items: center; }
      .gc-title { font-family: 'Montserrat', sans-serif; font-size: 36px; font-weight: 900; color: #FFD700; text-align: center; }

      .holo-card { width: 340px; background: linear-gradient(135deg, #FF007A, #7000FF, #00F5D4); padding: 4px; border-radius: 20px; box-shadow: 0 20px 60px rgba(112,0,255,0.6); }
      .card-glow-border { background: #0A0518; border-radius: 18px; padding: 30px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
      .rarity-badge { background: #FFD700; color: #000; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 900; padding: 4px 12px; border-radius: 20px; }
      .card-hero-name { font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 900; color: #FFF; }
      .card-stat-pill { background: #7000FF; color: #FFF; font-family: 'Montserrat', sans-serif; font-size: 15px; font-weight: 900; padding: 8px 16px; border-radius: 8px; }
      .card-attr { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; color: #C4B5FD; font-weight: 700; margin: 0; }
    `
  },

  // =========================================================================
  // GROUP 5: SAAS, AI TOOLING & DEV ENGINEERING
  // =========================================================================
  {
    id: "frame-saas-pricing-tier",
    name: "SaaS 3-Tier Pricing Highlight",
    category: "saas",
    fonts: ["Inter:wght@600;700;800", "Plus+Jakarta+Sans:wght@700;800"],
    bg: "#0A0D14",
    slots: {
      headline: "Bảng Giá Linh Hoạt Cho Mọi Quy Mô",
      pro_tag: "PHỔ BIẾN NHẤT",
      plan_free: "Starter: $0/tháng (1 Agent)",
      plan_pro: "Pro Team: $49/tháng (10 Agents + Video HD)",
      plan_ent: "Enterprise: Tùy chỉnh SLA & Custom API",
      highlight_note: "Gói Pro được 85% doanh nghiệp tin dùng."
    },
    markup: `
      <div class="pricing-stage">
        <h1 class="pc-title" data-slot="headline"></h1>

        <div class="pricing-grid">
          <div class="p-tier tier-starter">
            <span class="pt-name" data-slot="plan_free"></span>
          </div>
          <div class="p-tier tier-pro">
            <span class="pro-tag" data-slot="pro_tag"></span>
            <span class="pt-name" data-slot="plan_pro"></span>
          </div>
          <div class="p-tier tier-ent">
            <span class="pt-name" data-slot="plan_ent"></span>
          </div>
        </div>

        <div class="pricing-note" data-slot="highlight_note"></div>
      </div>
    `,
    styles: `
      .pricing-stage { background: #0A0D14; border: 1px solid #1E293B; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .pc-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 38px; font-weight: 800; color: #FFF; text-align: center; }

      .pricing-grid { display: flex; flex-direction: column; gap: 14px; margin: 10px 0; }
      .p-tier { background: #131A29; border: 1px solid #334155; border-radius: 14px; padding: 18px 24px; font-family: 'Inter', sans-serif; font-size: 17px; font-weight: 700; color: #E2E8F0; display: flex; justify-content: space-between; align-items: center; }
      .tier-pro { background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(147,51,234,0.2)); border: 2px solid #3B82F6; box-shadow: 0 10px 30px rgba(59,130,246,0.3); position: relative; }
      .pro-tag { background: #3B82F6; color: #FFF; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px; }

      .pricing-note { background: #1E293B; border-radius: 12px; padding: 14px; font-family: 'Inter', sans-serif; font-size: 15px; color: #94A3B8; text-align: center; font-weight: 600; }
    `
  },

  {
    id: "frame-api-request-response",
    name: "API Request & JSON Response Inspector",
    category: "saas",
    fonts: ["Fira+Code:wght@500;700", "Plus+Jakarta+Sans:wght@700"],
    bg: "#0D1117",
    slots: {
      endpoint: "POST /v1/agents/publish",
      status_code: "200 OK · 24ms",
      req_tag: "REQUEST PAYLOAD",
      res_tag: "RESPONSE BODY",
      req_payload: '{\\n  "channel": "threads",\\n  "auto_approve": true\\n}',
      res_payload: '{\\n  "status": "published",\\n  "post_id": "849204"\\n}',
      insight: "Tốc độ xử lý webhook đạt chuẩn microsecond latency."
    },
    markup: `
      <div class="api-inspector">
        <div class="api-topbar">
          <span class="method-endpoint" data-slot="endpoint"></span>
          <span class="status-pill" data-slot="status_code"></span>
        </div>

        <div class="api-panes">
          <div class="code-pane req-pane">
            <span class="pane-tag" data-slot="req_tag"></span>
            <pre class="json-code" data-slot="req_payload"></pre>
          </div>
          <div class="code-pane res-pane">
            <span class="pane-tag" data-slot="res_tag"></span>
            <pre class="json-code" data-slot="res_payload"></pre>
          </div>
        </div>

        <div class="api-footer" data-slot="insight"></div>
      </div>
    `,
    styles: `
      .api-inspector { background: #0D1117; border: 1px solid #30363D; border-radius: 20px; padding: 32px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .api-topbar { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363D; padding-bottom: 16px; }
      .method-endpoint { font-family: 'Fira Code', monospace; font-size: 20px; font-weight: 700; color: #58A6FF; }
      .status-pill { font-family: 'Fira Code', monospace; font-size: 15px; font-weight: 700; background: rgba(63,185,80,0.15); color: #3FB950; border: 1px solid #3FB950; padding: 4px 12px; border-radius: 6px; }

      .api-panes { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
      .code-pane { background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px; }
      .pane-tag { font-family: 'Fira Code', monospace; font-size: 12px; font-weight: 700; color: #8B949E; display: block; margin-bottom: 8px; }
      .json-code { font-family: 'Fira Code', monospace; font-size: 15px; color: #79C0FF; margin: 0; white-space: pre-wrap; line-height: 1.4; }

      .api-footer { background: #161B22; border-left: 4px solid #58A6FF; padding: 12px 18px; border-radius: 0 8px 8px 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; color: #C9D1D9; font-weight: 600; }
    `
  },

  {
    id: "frame-diff-code-editor",
    name: "Code Refactoring & Performance Diff",
    category: "saas",
    fonts: ["JetBrains+Mono:wght@500;700", "Plus+Jakarta+Sans:wght@700;800"],
    bg: "#0A0E17",
    slots: {
      headline: "Tối Ưu Hiệu Năng Xử Lý AI",
      file_name: "pipeline.ts",
      before_code: "- const res = await Promise.all(urls.map(crawlSlow))",
      after_code: "+ const res = await cluster.mapConcurrent(urls, 10)",
      perf_gain: "Tăng tốc 10x · Giảm 80% RAM"
    },
    markup: `
      <div class="diff-editor">
        <div class="diff-header">
          <div class="file-tab">📄 <span class="tab-title" data-slot="file_name"></span></div>
          <h2 class="diff-hl" data-slot="headline"></h2>
        </div>

        <div class="diff-lines-stage">
          <div class="diff-line line-del" data-slot="before_code"></div>
          <div class="diff-line line-add" data-slot="after_code"></div>
        </div>

        <div class="perf-badge" data-slot="perf_gain"></div>
      </div>
    `,
    styles: `
      .diff-editor { background: #0A0E17; border: 1px solid #1E293B; border-radius: 20px; padding: 32px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .diff-header { border-bottom: 1px solid #1E293B; padding-bottom: 14px; }
      .file-tab { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #94A3B8; font-weight: 700; margin-bottom: 6px; }
      .diff-hl { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 34px; font-weight: 800; color: #FFF; margin: 0; }

      .diff-lines-stage { display: flex; flex-direction: column; gap: 12px; margin: 16px 0; }
      .diff-line { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 600; padding: 16px 20px; border-radius: 8px; line-height: 1.4; }
      .line-del { background: rgba(239,68,68,0.15); color: #FCA5A5; border-left: 5px solid #EF4444; }
      .line-add { background: rgba(16,185,129,0.15); color: #6EE7B7; border-left: 5px solid #10B981; }

      .perf-badge { background: #10B981; color: #000; font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 800; padding: 14px; border-radius: 10px; text-align: center; }
    `
  },

  {
    id: "frame-git-branch-graph",
    name: "Git Branching & DevOps Topology",
    category: "saas",
    fonts: ["JetBrains+Mono:wght@700", "Plus+Jakarta+Sans:wght@700;800"],
    bg: "#080A10",
    slots: {
      headline: "Quy Trình CI/CD Tự Động Hóa",
      branch_main: "main (Production)",
      branch_staging: "staging (Automated Tests)",
      branch_feature: "feature/ai-agent (Active Dev)",
      status: "Test Suite Passed (227/227) · Auto-deploy active"
    },
    markup: `
      <div class="git-stage">
        <h1 class="git-title" data-slot="headline"></h1>

        <div class="git-tree">
          <div class="b-row b-main">
            <span class="git-node n-green"></span>
            <span class="b-text" data-slot="branch_main"></span>
          </div>
          <div class="b-row b-staging">
            <span class="git-node n-blue"></span>
            <span class="b-text" data-slot="branch_staging"></span>
          </div>
          <div class="b-row b-feature">
            <span class="git-node n-purple"></span>
            <span class="b-text" data-slot="branch_feature"></span>
          </div>
        </div>

        <div class="git-status-card" data-slot="status"></div>
      </div>
    `,
    styles: `
      .git-stage { background: #080A10; border: 1px solid #1E293B; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .git-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 36px; font-weight: 800; color: #FFF; text-align: center; }

      .git-tree { display: flex; flex-direction: column; gap: 16px; margin: 16px 0; }
      .b-row { display: flex; align-items: center; gap: 16px; background: #101626; padding: 14px 20px; border-radius: 10px; border: 1px solid #1E293B; }
      .git-node { width: 16px; height: 16px; border-radius: 50%; }
      .n-green { background: #10B981; box-shadow: 0 0 10px #10B981; }
      .n-blue { background: #3B82F6; box-shadow: 0 0 10px #3B82F6; }
      .n-purple { background: #A855F7; box-shadow: 0 0 10px #A855F7; }
      .b-text { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; color: #F1F5F9; }

      .git-status-card { background: rgba(16,185,129,0.15); border: 1px solid #10B981; color: #10B981; font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; padding: 14px 20px; border-radius: 10px; text-align: center; }
    `
  },

  {
    id: "frame-ai-benchmark-leaderboard",
    name: "AI Model Benchmark Leaderboard",
    category: "saas",
    fonts: ["Montserrat:wght@800;900", "Plus+Jakarta+Sans:wght@700"],
    bg: "#0B0F19",
    slots: {
      benchmark_name: "LEADERBOARD: HUMAN-EVAL BENCHMARK",
      rank_1: "1. Claude 3.7 Sonnet: 92.4%",
      rank_2: "2. GPT-4o: 88.2%",
      rank_3: "3. Gemini 2.0 Pro: 86.5%",
      verdict: "Claude 3.7 vượt trội ở các tác vụ lập trình kiến trúc phức tạp."
    },
    markup: `
      <div class="lb-stage">
        <span class="lb-head-badge" data-slot="benchmark_name"></span>

        <div class="ranks-stack">
          <div class="r-bar r-gold" data-slot="rank_1"></div>
          <div class="r-bar r-silver" data-slot="rank_2"></div>
          <div class="r-bar r-bronze" data-slot="rank_3"></div>
        </div>

        <div class="lb-verdict" data-slot="verdict"></div>
      </div>
    `,
    styles: `
      .lb-stage { background: #0B0F19; border: 1px solid #1E293B; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .lb-head-badge { font-family: 'Montserrat', sans-serif; font-size: 15px; font-weight: 900; color: #38BDF8; letter-spacing: 2px; text-align: center; }

      .ranks-stack { display: flex; flex-direction: column; gap: 14px; margin: 16px 0; }
      .r-bar { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 800; padding: 18px 24px; border-radius: 12px; display: flex; align-items: center; }
      .r-gold { background: linear-gradient(90deg, #D4AF37, #FFDF73); color: #000; box-shadow: 0 10px 25px rgba(212,175,55,0.4); }
      .r-silver { background: #334155; color: #FFF; width: 90%; }
      .r-bronze { background: #1E293B; color: #94A3B8; width: 85%; }

      .lb-verdict { background: #1E293B; border-radius: 12px; padding: 16px 20px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; color: #E2E8F0; font-weight: 700; text-align: center; }
    `
  },

  // =========================================================================
  // GROUP 6: REVIEW, E-COMMERCE & UNBOXING
  // =========================================================================
  {
    id: "frame-pros-cons-scale",
    name: "Mechanical Pros vs Cons Scale",
    category: "ecommerce",
    fonts: ["Montserrat:wght@800;900", "Be+Vietnam+Pro:wght@600;700"],
    bg: "#F8FAFC",
    slots: {
      headline: "Cân Nhắc Trước Khi Xuống Tiền",
      pros_title: "ƯU ĐIỂM NỔI BẬT",
      pros_list: "Hiệu năng cực mạnh · Thiết kế siêu mỏng · Màn hình 120Hz",
      cons_title: "NHƯỢC ĐIỂM",
      cons_list: "Giá thành cao · Thời lượng pin trung bình",
      verdict: "Đánh giá 8.5/10 — Xứng đáng đầu tư cho công việc chuyên nghiệp."
    },
    markup: `
      <div class="scale-stage">
        <h1 class="sc-title" data-slot="headline"></h1>

        <div class="scale-cards-grid">
          <div class="sc-card card-pros">
            <span class="sc-badge pb" data-slot="pros_title"></span>
            <p class="sc-desc" data-slot="pros_list"></p>
          </div>
          <div class="sc-card card-cons">
            <span class="sc-badge cb" data-slot="cons_title"></span>
            <p class="sc-desc" data-slot="cons_list"></p>
          </div>
        </div>

        <div class="sc-verdict" data-slot="verdict"></div>
      </div>
    `,
    styles: `
      .scale-stage { background: #F8FAFC; color: #0F172A; border: 2px solid #E2E8F0; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
      .sc-title { font-family: 'Montserrat', sans-serif; font-size: 38px; font-weight: 900; text-align: center; }

      .scale-cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 16px 0; }
      .sc-card { border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 10px; }
      .card-pros { background: #ECFDF5; border: 2px solid #10B981; }
      .card-cons { background: #FEF2F2; border: 2px solid #EF4444; }
      .sc-badge { font-family: 'Montserrat', sans-serif; font-size: 15px; font-weight: 900; }
      .pb { color: #059669; }
      .cb { color: #DC2626; }
      .sc-desc { font-family: 'Be Vietnam Pro', sans-serif; font-size: 16px; line-height: 1.5; font-weight: 600; margin: 0; }

      .sc-verdict { background: #0F172A; color: #FFF; font-family: 'Be Vietnam Pro', sans-serif; font-size: 16px; font-weight: 700; padding: 16px 20px; border-radius: 12px; text-align: center; }
    `
  },

  {
    id: "frame-receipt-slip",
    name: "Thermal Store Receipt Cost Breakdown",
    category: "ecommerce",
    fonts: ["Space+Mono:wght@400;700", "Be+Vietnam+Pro:wght@700"],
    bg: "#18181B",
    slots: {
      store_name: "CỬA HÀNG CÔNG NGHỆ CHÍNH HÃNG",
      item_1: "1x MacBook Pro M3 Max : $3,499.00",
      item_2: "1x AppleCare+ Protection : $399.00",
      item_3: "1x Phụ kiện USB-C Hub : $89.00",
      total: "TỔNG THANH TOÁN: $3,987.00",
      advice: "Mẹo: Mua gói giáo dục giúp tiết kiệm ngay $400."
    },
    markup: `
      <div class="receipt-stage">
        <div class="thermal-slip">
          <div class="slip-header">
            <span class="barcode">||| | |||| || ||| |||||</span>
            <h2 class="store-txt" data-slot="store_name"></h2>
          </div>

          <div class="items-breakdown">
            <div class="item-line" data-slot="item_1"></div>
            <div class="item-line" data-slot="item_2"></div>
            <div class="item-line" data-slot="item_3"></div>
          </div>

          <div class="slip-total" data-slot="total"></div>
        </div>

        <div class="receipt-advice" data-slot="advice"></div>
      </div>
    `,
    styles: `
      .receipt-stage { background: #18181B; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; align-items: center; }
      .thermal-slip { background: #FAFAFA; color: #000; border-radius: 12px; padding: 28px 24px; width: 440px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); font-family: 'Space Mono', monospace; }
      .slip-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 12px; }
      .barcode { font-size: 20px; display: block; letter-spacing: 4px; }
      .store-txt { font-size: 15px; font-weight: 700; margin-top: 6px; }

      .items-breakdown { display: flex; flex-direction: column; gap: 8px; margin: 16px 0; border-bottom: 2px dashed #000; padding-bottom: 16px; }
      .item-line { font-size: 14px; font-weight: 700; }

      .slip-total { font-size: 18px; font-weight: 700; text-align: center; }

      .receipt-advice { background: #27272A; border-left: 4px solid #38BDF8; color: #F4F4F5; font-family: 'Be Vietnam Pro', sans-serif; font-size: 16px; font-weight: 700; padding: 14px 20px; border-radius: 0 8px 8px 0; width: 100%; text-align: center; }
    `
  },

  {
    id: "frame-unboxing-specs",
    name: "Hardware Specs & Teardown Grid",
    category: "ecommerce",
    fonts: ["Montserrat:wght@800;900", "Be+Vietnam+Pro:wght@600;700"],
    bg: "#0B0E14",
    slots: {
      product_name: "MacBook Pro 16 M3 Max",
      spec_chip: "Vi Xử Lý: Apple M3 Max 16-Core",
      spec_battery: "Pin: 22 Giờ Sử Dụng Thực Tế",
      spec_screen: "Màn Hình: Liquid Retina XDR 120Hz",
      spec_weight: "Trọng Lượng: 2.16 kg Nhôm Nguyên Khối",
      verdict: "Cỗ máy làm việc mạnh mẽ nhất trong phân khúc laptop di động."
    },
    markup: `
      <div class="specs-stage">
        <h1 class="prod-title" data-slot="product_name"></h1>

        <div class="specs-grid">
          <div class="sp-card" data-slot="spec_chip"></div>
          <div class="sp-card" data-slot="spec_battery"></div>
          <div class="sp-card" data-slot="spec_screen"></div>
          <div class="sp-card" data-slot="spec_weight"></div>
        </div>

        <div class="specs-verdict" data-slot="verdict"></div>
      </div>
    `,
    styles: `
      .specs-stage { background: #0B0E14; border: 1px solid #1E293B; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .prod-title { font-family: 'Montserrat', sans-serif; font-size: 38px; font-weight: 900; color: #FFF; text-align: center; }

      .specs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
      .sp-card { background: #131A29; border: 1px solid #334155; border-radius: 14px; padding: 20px; font-family: 'Be Vietnam Pro', sans-serif; font-size: 16px; font-weight: 700; color: #E2E8F0; }

      .specs-verdict { background: #1E293B; border-radius: 12px; padding: 16px 20px; font-family: 'Be Vietnam Pro', sans-serif; font-size: 16px; color: #38BDF8; font-weight: 700; text-align: center; }
    `
  },

  {
    id: "frame-radar-rating-star",
    name: "5-Criterion Scorecard & Gold Badge",
    category: "ecommerce",
    fonts: ["Montserrat:wght@800;900", "Plus+Jakarta+Sans:wght@700;800"],
    bg: "#0A0D14",
    slots: {
      headline: "Bảng Điểm Đánh Giá Toàn Diện",
      crit_1: "Thiết Kế: 9.5 / 10 ⭐",
      crit_2: "Hiệu Năng: 9.8 / 10 ⭐",
      crit_3: "Thời Lượng Pin: 8.5 / 10 ⭐",
      crit_4: "Độ Đáng Tiền: 9.0 / 10 ⭐",
      overall_badge: "TỔNG KẾT: 9.2 / 10 (XUẤT SẮC)"
    },
    markup: `
      <div class="scorecard-stage">
        <h1 class="sc-head" data-slot="headline"></h1>

        <div class="criteria-list">
          <div class="cr-row" data-slot="crit_1"></div>
          <div class="cr-row" data-slot="crit_2"></div>
          <div class="cr-row" data-slot="crit_3"></div>
          <div class="cr-row" data-slot="crit_4"></div>
        </div>

        <div class="master-score-badge" data-slot="overall_badge"></div>
      </div>
    `,
    styles: `
      .scorecard-stage { background: #0A0D14; border: 1px solid #1E293B; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .sc-head { font-family: 'Montserrat', sans-serif; font-size: 38px; font-weight: 900; color: #FFF; text-align: center; }

      .criteria-list { display: flex; flex-direction: column; gap: 10px; margin: 12px 0; }
      .cr-row { background: #131A29; border: 1px solid #334155; border-radius: 10px; padding: 14px 20px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 800; color: #F1F5F9; }

      .master-score-badge { background: linear-gradient(135deg, #F59E0B, #D97706); color: #000; font-family: 'Montserrat', sans-serif; font-size: 20px; font-weight: 900; padding: 16px; border-radius: 12px; text-align: center; box-shadow: 0 10px 25px rgba(245,158,11,0.4); }
    `
  },

  {
    id: "frame-discount-coupon-tear",
    name: "Neo-Brutalist Tearing Discount Voucher",
    category: "ecommerce",
    fonts: ["Montserrat:wght@900", "Be+Vietnam+Pro:wght@700;800"],
    bg: "#FFFBEB",
    slots: {
      headline: "Ưu Đãi Giới Hạn Cho Người Xem",
      discount: "GIẢM 50% HÔM NAY",
      code: "MÃ: AGENTKIT50",
      condition: "Áp dụng cho 100 đơn hàng đầu tiên trong tuần này",
      cta: "Truy cập đường link ở bio hoặc phần mô tả để nhận ngay!"
    },
    markup: `
      <div class="coupon-stage">
        <div class="coupon-header">
          <h1 class="cp-title" data-slot="headline"></h1>
        </div>

        <div class="coupon-card">
          <span class="cp-disc" data-slot="discount"></span>
          <span class="cp-code" data-slot="code"></span>
          <span class="cp-cond" data-slot="condition"></span>
        </div>

        <div class="coupon-cta" data-slot="cta"></div>
      </div>
    `,
    styles: `
      .coupon-stage { background: #FFFBEB; border: 4px solid #000; border-radius: 24px; padding: 36px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 8px 8px 0px #000; }
      .coupon-header { text-align: center; }
      .cp-title { font-family: 'Montserrat', sans-serif; font-size: 38px; color: #0F172A; font-weight: 900; }

      .coupon-card { background: #FF6B00; color: #FFF; border-radius: 16px; padding: 24px; text-align: center; border: 3px dashed #000; display: flex; flex-direction: column; align-items: center; gap: 10px; }
      .cp-disc { font-family: 'Montserrat', sans-serif; font-size: 36px; font-weight: 900; }
      .cp-code { font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 900; background: #FFF; color: #FF6B00; padding: 6px 16px; border-radius: 8px; border: 2px solid #000; }
      .cp-cond { font-family: 'Be Vietnam Pro', sans-serif; font-size: 15px; font-weight: 700; }

      .coupon-cta { font-family: 'Be Vietnam Pro', sans-serif; font-size: 16px; color: #0F172A; background: #FEF08A; border: 2px solid #000; padding: 14px; text-align: center; border-radius: 8px; font-weight: 800; }
    `
  }
];

for (const t of TEMPLATES) {
  const dir = path.join(TEMPLATES_DIR, t.id);
  const compDir = path.join(dir, "compositions");
  fs.mkdirSync(compDir, { recursive: true });

  const fontLinks = t.fonts.map(f => `family=${f}`).join('&');

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
      padding: ${aspect === "16:9" ? "50px 100px" : "100px 50px"};
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
}

console.log(`✓ All ${TEMPLATES.length} templates successfully built!`);
