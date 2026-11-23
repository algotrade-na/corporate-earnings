// constants
const CHANGE_POSITIVE_COLOR = "#10b981";
const CHANGE_NEGATIVE_COLOR = "#f43f5e";
const SURPRISE_POSITIVE_COLOR = "#10b981";

const LOW_ADR_THRESHOLD = 4.0;
const LOW_ADR_COLOR = "#f43f5e";

const HIGH_SHORT_INTEREST_THRESHOLD = 20;
const HIGH_SHORT_INTEREST_COLOR = "#f43f5e";

const DAYS_BEFORE_EARNINGS_WARN_THRESHOLD = 3;
const DAYS_BEFORE_EARNINGS_WARN_COLOR = "#f43f5e";

const HIGH_INST_CHANGE_THRESHOLD = 10;
const HIGH_INST_CHANGE_COLOR = "#10b981";

const MONTH_MAP = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "May",
    6: "Jun",
    7: "Jul",
    8: "Aug",
    9: "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dec",
};

const REVERSE_MONTH_MAP = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
};

const CHART_TYPE = {
    NONE: 1,
    WEEKLY: 2,
    DAILY: 3,
    BOTH: 4,
    TRADINGVIEW: 5,
};

const SA_REGEX = /symbol\/([a-zA-Z0-9\.\-]+)/;
const ZA_REGEX = /stock\/(?:research|quote)\/([a-zA-Z0-9\.\-]+)/;
const YF_REGEX = /quote\/([a-zA-Z0-9\.\-]+)/;

const FETCH_URL = "aHR0cHM6Ly9maW52aXouY29tL3N0b2NrP3Q9";
const FETCH_URL_PREFIX = "aHR0cHM6Ly9maW52aXouY29tLw==";
const IMAGE_URL = "aHR0cHM6Ly9jaGFydHMyLmZpbnZpei5jb20vY2hhcnQ/dD0=";
const CHROME_PREFIX_REGEX = /chrome-extension:\/\/\w+\//;
const FIREFOX_PREFIX_REGEX = /moz-extension:\/\/((\w{4,12}-?)){5}\//;

const CSS = (showChart = true, show_earnings_surprise = false) => `
<style>
    #ht-msg-noearnings, #ht-waiting {
       font-size: 14px;
       font-style: normal;
       z-index: 9999;
       color: #38bdf8;
       background-color: #0f141f;
       border: 1px solid #1e2638;
       border-radius: 8px;
       padding: 20px;
       font-weight: 600;
       margin: 16px auto;
       max-width: 1200px;
       text-align: center;
       box-shadow: 0 4px 20px rgba(0,0,0,0.4);
       font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    #ht-warningmsg { color: #f87171; }
    #ht-waiting-fundamentals, #ht-waiting-earnings { color: #38bdf8; font-size: 13px; font-weight: 500; }
    
    #ht-root-container {
        --text-color: #f1f5f9;
        --text-muted: #64748b;
        --bkg-color: #080b11;
        --card-bkg: #0f141f;
        --card-bkg-alt: #151b29;
        --border: 1px solid #1e2638;
        --border-subtle: 1px solid rgba(255, 255, 255, 0.07);
        --earnings-header-color: #121824;
        --earnings-bkg-color-even: #121824;
        --earnings-change-positive-color: #10b981;
        --earnings-change-negative-color: #f43f5e;
        --link-color: #38bdf8;
        --link-hover-color: #7dd3fc;
        
        width: 100%;
        max-width: 1380px;
        box-sizing: border-box;
        margin: 0 auto 16px auto;
        border: var(--border);
        border-radius: 12px;
        color: var(--text-color);
        background: var(--bkg-color);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        padding: 16px;
        box-shadow: 0 6px 28px rgba(0, 0, 0, 0.55);
        font-size: 12px;
        line-height: 1.4;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .ht-card {
        background: var(--card-bkg);
        border: var(--border);
        border-radius: 10px;
        padding: 14px 16px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        box-sizing: border-box;
    }
    
    /* TOP SECTION: Overview Grid (Image 1) */
    #ht-overview-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        align-items: stretch;
        width: 100%;
    }
    
    /* Profile Card (Left) */
    #ht-profile-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    #ht-profile-title-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    }
    #ht-company-title {
        display: flex;
        align-items: baseline;
        gap: 8px;
    }
    #ht-ticker-badge {
        font-size: 20px;
        font-weight: 800;
        color: #f1f5f9;
        letter-spacing: -0.3px;
    }
    #ht-company-name {
        font-size: 15px;
        font-weight: 600;
        color: #94a3b8;
    }
    #ht-company-name a {
        color: #94a3b8;
        text-decoration: none;
    }
    #ht-company-name a:hover {
        color: var(--link-color);
        text-decoration: underline;
    }
    #ht-price-box {
        text-align: right;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    }
    #ht-current-price {
        font-size: 20px;
        font-weight: 800;
        color: #f1f5f9;
        line-height: 1.1;
    }
    #ht-price-change {
        font-size: 12px;
        font-weight: 700;
        margin-top: 2px;
    }
    #ht-price-change.pos { color: #10b981; }
    #ht-price-change.neg { color: #f43f5e; }
    
    #ht-tag-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: -4px;
    }
    .ht-pill {
        display: inline-block;
        background: #151b29;
        border: 1px solid #232d42;
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 10.5px;
        color: #94a3b8;
        font-weight: 500;
    }
    #ht-sector-line {
        color: #64748b;
        font-size: 11px;
    }
    #ht-description-box {
        position: relative;
        padding-right: 20px;
    }
    #ht-description {
        font-size: 11.5px;
        line-height: 1.45;
        color: #94a3b8;
        max-height: 34px;
        overflow: hidden;
        transition: max-height 0.25s ease;
        margin: 0;
    }
    #ht-description.expanded {
        max-height: 400px;
    }
    #ht-desc-toggle {
        position: absolute;
        right: 0;
        top: 0;
        color: #38bdf8;
        cursor: pointer;
        font-size: 13px;
        user-select: none;
        padding: 2px 4px;
    }
    
    /* 3-Column Metrics Grid */
    #ht-metrics-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        padding-top: 10px;
        border-top: var(--border-subtle);
    }
    .ht-metric-col {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .ht-metric-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: 2px 0;
        font-size: 11.5px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }
    .ht-metric-row:last-child {
        border-bottom: none;
    }
    .ht-m-label {
        color: #64748b;
        font-weight: 600;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }
    .ht-m-val {
        color: #f1f5f9;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }
    
    /* Right Card: Tabbed Deep-Dive Area (Image 1) */
    #ht-deepdive-card {
        display: flex;
        flex-direction: column;
    }
    .ht-tabs-header {
        display: flex;
        gap: 16px;
        border-bottom: 1px solid #1e2638;
        padding-bottom: 8px;
        margin-bottom: 12px;
    }
    .ht-tab-btn {
        background: none;
        border: none;
        color: #64748b;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        padding: 4px 2px;
        border-bottom: 2px solid transparent;
        transition: all 0.15s;
    }
    .ht-tab-btn:hover { color: #cbd5e1; }
    .ht-tab-btn.active {
        color: #f1f5f9;
        border-bottom: 2px solid #38bdf8;
        font-weight: 700;
    }
    .ht-tab-content {
        flex: 1;
    }
    .ht-prof-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
    }
    .ht-prof-box {
        background: var(--card-bkg-alt);
        border: 1px solid #222c40;
        border-radius: 6px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 3px;
        position: relative;
    }
    .ht-prof-label {
        font-size: 9.5px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }
    .ht-prof-val {
        font-size: 18px;
        font-weight: 800;
        color: #f1f5f9;
        letter-spacing: -0.2px;
    }
    .ht-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 9px;
        font-weight: 700;
        border-radius: 3px;
        padding: 1px 5px;
        text-transform: uppercase;
    }
    .ht-badge.strong { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .ht-badge.fair { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .ht-prof-bottom-bar {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #64748b;
        padding-top: 10px;
        border-top: var(--border-subtle);
        margin-top: 12px;
    }
    .ht-prof-bottom-bar span b {
        color: #f1f5f9;
        font-weight: 600;
        margin-left: 4px;
    }
    
    #ht-news-cell, #ht-insiders-cell, #ht-institutions-cell {
        max-height: 250px;
        overflow-y: auto;
    }
    #ht-news-table, #ht-insiders-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
    }
    #ht-news-table tr, #ht-insiders-table tr {
        border-bottom: var(--border-subtle);
    }
    #ht-news-table tr:last-child, #ht-insiders-table tr:last-child {
        border-bottom: none;
    }
    #ht-news-table td, #ht-insiders-table td {
        padding: 5px 6px;
        vertical-align: top;
    }
    .ht-news-date-cell {
        white-space: nowrap;
        color: var(--text-muted);
        text-align: left;
        width: 75px;
    }
    .ht-news-link-cell { text-align: left; }
    a.ht-news-link { color: var(--link-color); text-decoration: none; }
    a.ht-news-link:hover { text-decoration: underline; }
    .ht-news-source { color: #c084fc; font-size: 10px; margin-left: 6px; }
    .ht-insiders-date { white-space: nowrap; color: var(--text-muted); width: 70px; }
    .ht-insiders-buy { color: #10b981 !important; font-weight: 700; }
    .ht-insiders-sell { color: #f43f5e !important; font-weight: 700; }
    a.ht-insiders-link { color: var(--link-color); text-decoration: none; }
    
    .ht-inst-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 4px;
        border-bottom: var(--border-subtle);
        font-size: 12px;
    }
    .ht-inst-row span { color: var(--text-muted); }
    .ht-inst-row b { color: var(--text-color); font-weight: 600; }
    
    /* MAIN 2-COLUMN SECTION: Earnings on Left, TradingView on Right (Image 0) */
    #ht-main-grid {
        display: grid;
        grid-template-columns: 44% 56%;
        gap: 16px;
        align-items: stretch;
        width: 100%;
    }
    #ht-earnings-pane {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    /* EPS & Sales Bar Chart Visualizer */
    #ht-bars-card {
        padding: 12px 14px;
    }
    .ht-bars-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 11.5px;
        font-weight: 700;
        color: #cbd5e1;
    }
    .ht-bars-tabs {
        background: #141a26;
        border-radius: 6px;
        padding: 2px;
        border: 1px solid #202a3d;
        display: flex;
        gap: 2px;
    }
    .ht-bar-tab {
        background: none;
        border: none;
        font-size: 10.5px;
        font-weight: 600;
        padding: 2px 10px;
        color: #64748b;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s;
    }
    .ht-bar-tab.active {
        background: #253147;
        color: #f1f5f9;
        font-weight: 700;
    }
    .ht-bars-body {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
    .ht-bar-chart-half {
        width: 100%;
        height: 130px;
    }
    
    /* Tables in Main Section */
    #ht-fiscal-year-card, #ht-quarterly-card {
        padding: 10px 12px;
    }
    .ht-card-title {
        font-size: 10.5px;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        margin-bottom: 6px;
        display: flex;
        justify-content: space-between;
    }
    .ht-card-title a {
        color: #38bdf8;
        text-decoration: none;
        font-size: 10.5px;
        font-weight: 500;
    }
    .ht-card-title a:hover { text-decoration: underline; }
    
    .ht-earnings-table {
        table-layout: fixed;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 11.5px;
        width: 100%;
    }
    .ht-earnings-table thead tr td {
        background-color: transparent;
        color: #64748b;
        font-weight: 600;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        padding: 5px 4px;
        border-bottom: var(--border);
        text-align: right;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        box-sizing: border-box;
    }
    .ht-earnings-table thead tr td:first-child {
        text-align: left;
        padding-left: 4px;
    }
    .ht-earnings-table tbody tr {
        border-bottom: var(--border-subtle);
        transition: background 0.15s;
    }
    .ht-earnings-table tbody tr:last-child {
        border-bottom: none;
    }
    .ht-earnings-table tbody tr:nth-of-type(even) {
        background-color: rgba(255, 255, 255, 0.02);
    }
    .ht-earnings-table tbody tr:hover {
        background-color: var(--card-bkg-alt);
    }
    .ht-earnings-table tbody tr td {
        padding: 4px 4px;
        text-align: right;
        color: var(--text-color);
        font-variant-numeric: tabular-nums;
        border-bottom: var(--border-subtle);
        white-space: nowrap;
        font-size: 11.5px;
        box-sizing: border-box;
    }
    .ht-earnings-table tbody tr:last-child td {
        border-bottom: none;
    }
    .ht-earnings-table tbody tr td:first-child {
        text-align: left;
        padding-left: 4px;
        font-weight: 600;
        color: var(--text-color);
    }
    
    .ht-strong-pos-change, .ht-strong-pos-surprise {
        color: #10b981 !important;
        font-weight: 700;
    }
    .ht-weak-pos-change, .ht-weak-pos-surprise {
        color: #38bdf8 !important;
        font-weight: 500;
    }
    .ht-weak-neg-change { color: #fb923c !important; }
    .ht-strong-neg-change {
        color: #f43f5e !important;
        font-weight: 700;
    }
    
    /* TradingView Chart Container (Image 0 Right) */
    #ht-tv-pane {
        display: flex;
        flex-direction: column;
        min-height: 590px;
        padding: 12px 14px;
    }
    .ht-tv-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }
    .ht-tv-tf-btns {
        display: flex;
        gap: 4px;
    }
    .ht-tf-btn {
        background: #151b29;
        border: 1px solid #222c40;
        color: #64748b;
        font-size: 11px;
        font-weight: 700;
        border-radius: 4px;
        padding: 3px 8px;
        cursor: pointer;
        transition: all 0.15s;
    }
    .ht-tf-btn:hover { color: #cbd5e1; border-color: #38bdf8; }
    .ht-tf-btn.active {
        background: #253147;
        color: #38bdf8;
        border-color: #38bdf8;
    }
    .ht-tv-title {
        font-size: 11.5px;
        font-weight: 700;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .ht-tv-link {
        color: #64748b;
        text-decoration: none;
        font-size: 13px;
    }
    .ht-tv-link:hover { color: #38bdf8; }
    #ht-tv-iframe-wrapper {
        flex: 1;
        width: 100%;
        min-height: 550px;
        border-radius: 8px;
        overflow: hidden;
        background: #000000;
        border: 1px solid #1a2233;
    }
    #ht-tv-iframe {
        width: 100%;
        height: 100%;
        min-height: 550px;
        border: none;
        display: block;
    }
    
    .ht-loadingmsg:after {
        content: '.';
        animation: ht-dots 1s steps(1, end) infinite;
    }
    @keyframes ht-dots {
        0%, 12.5% { opacity: 0; }
        25% { opacity: 1; }
        37.5% { text-shadow: .5em 0; }
        50% { text-shadow: .5em 0, 1em 0; }
        62.5% { text-shadow: .5em 0, 1em 0, 1.5em 0; }
        75% { text-shadow: .5em 0, 1em 0, 1.5em 0, 2em 0; }
        87.5%, 100% { text-shadow: .5em 0, 1em 0, 1.5em 0, 2em 0, 2.5em; }
    }

    /* Responsive Collapsing */
    @media (max-width: 1080px) {
        #ht-overview-grid {
            grid-template-columns: 1fr !important;
        }
        #ht-main-grid {
            grid-template-columns: 1fr !important;
        }
        #ht-tv-pane {
            min-height: 480px;
        }
        #ht-tv-iframe-wrapper, #ht-tv-iframe {
            min-height: 440px;
        }
    }
</style>
`;

const HTML_EARNINGS_ONLY = (theme = "dark") => `
<div id="ht-root-container" class="ht-dark-theme">
    <div id="ht-main-grid">
        <div id="ht-earnings-pane">
            <div id="ht-bars-card" class="ht-card">
                <div class="ht-bars-header">
                    <span class="ht-bars-title-left">EPS</span>
                    <div class="ht-bars-tabs">
                        <button class="ht-bar-tab active" data-bartab="quarterly">Quarterly</button>
                        <button class="ht-bar-tab" data-bartab="annual">Annual</button>
                    </div>
                    <span class="ht-bars-title-right">Sales ($M)</span>
                </div>
                <div class="ht-bars-body">
                    <div id="ht-eps-bars-container" class="ht-bar-chart-half"></div>
                    <div id="ht-sales-bars-container" class="ht-bar-chart-half"></div>
                </div>
            </div>
            <div id="ht-fiscal-year-card" class="ht-card">
                <div class="ht-card-title"><span>FISCAL YEAR</span></div>
                <div id="ht-earnings-yearly"><span class="ht-loadingmsg">Waiting for earnings data</span></div>
            </div>
            <div id="ht-quarterly-card" class="ht-card">
                <div class="ht-card-title"><span>QUARTER</span></div>
                <div id="ht-earnings-quarterly"><span class="ht-loadingmsg">Waiting for earnings data</span></div>
            </div>
        </div>
        <div id="ht-tv-pane" class="ht-card">
            <div class="ht-tv-header">
                <div class="ht-tv-tf-btns">
                    <button class="ht-tf-btn active" data-interval="D">D</button>
                    <button class="ht-tf-btn" data-interval="W">W</button>
                    <button class="ht-tf-btn" data-interval="M">M</button>
                </div>
                <div class="ht-tv-title">
                    <span id="ht-tv-symbol-display">TradingView Chart</span>
                    <a id="ht-tv-external-link" class="ht-tv-link" href="#" target="_blank" title="Open full chart on TradingView">↗</a>
                </div>
            </div>
            <div id="ht-tv-iframe-wrapper">
                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;">Loading TradingView Chart...</div>
            </div>
        </div>
    </div>
</div>
`;

const HTML = (theme = "dark", showChart = true, show_earnings_surprise = false, chartType = CHART_TYPE.TRADINGVIEW) => `
<div id="ht-root-container" class="ht-dark-theme">
    <!-- TOP SECTION: Profile & Research (Image 1) -->
    <div id="ht-overview-grid">
        <!-- Left Card: Company Profile & Core Metrics -->
        <div id="ht-profile-card" class="ht-card">
            <div id="ht-profile-header">
                <div id="ht-profile-title-row">
                    <div id="ht-company-title">
                        <span id="ht-ticker-badge">-</span>
                        <span id="ht-company-name">Loading...</span>
                    </div>
                    <div id="ht-price-box">
                        <span id="ht-current-price">-</span>
                        <span id="ht-price-change">-</span>
                    </div>
                </div>
                <div id="ht-tag-pills"></div>
                <div id="ht-sector-line">-</div>
                <div id="ht-description-box">
                    <p id="ht-description"></p>
                    <span id="ht-desc-toggle" title="Expand description">▾</span>
                </div>
            </div>
            <!-- 3-Column Key Metrics Grid -->
            <div id="ht-metrics-grid">
                <div class="ht-metric-col">
                    <div class="ht-metric-row"><span class="ht-m-label">EARNINGS</span><span class="ht-m-val" id="ht-m-earnings">-</span></div>
                    <div class="ht-metric-row"><span class="ht-m-label">ADR%</span><span class="ht-m-val" id="ht-m-adr">-</span></div>
                    <div class="ht-metric-row"><span class="ht-m-label">ATR</span><span class="ht-m-val" id="ht-m-atr">-</span></div>
                    <div class="ht-metric-row"><span class="ht-m-label">50/200D</span><span class="ht-m-val" id="ht-m-sma">-</span></div>
                    <div class="ht-metric-row"><span class="ht-m-label">1M / 3M</span><span class="ht-m-val" id="ht-m-perf">-</span></div>
                </div>
                <div class="ht-metric-col">
                    <div class="ht-metric-row"><span class="ht-m-label">RVOL</span><span class="ht-m-val" id="ht-m-relvol">-</span></div>
                    <div class="ht-metric-row"><span class="ht-m-label">VOL</span><span class="ht-m-val" id="ht-m-vol">-</span></div>
                    <div class="ht-metric-row"><span class="ht-m-label">AVG VOL</span><span class="ht-m-val" id="ht-m-avgvol">-</span></div>
                    <div class="ht-metric-row"><span class="ht-m-label">52W RANGE</span><span class="ht-m-val" id="ht-m-52w">-</span></div>
                    <div class="ht-metric-row"><span class="ht-m-label">MKT CAP</span><span class="ht-m-val" id="ht-m-mktcap">-</span></div>
                </div>
                <div class="ht-metric-col">
                    <div class="ht-metric-row"><span class="ht-m-label">FLOAT</span><span class="ht-m-val" id="ht-m-float">-</span></div>
                    <div class="ht-metric-row"><span class="ht-m-label">SHORT</span><span class="ht-m-val" id="ht-m-short">-</span></div>
                    <div class="ht-metric-row"><span class="ht-m-label">DTC</span><span class="ht-m-val" id="ht-m-dtc">-</span></div>
                    <div class="ht-metric-row"><span class="ht-m-label">P/E</span><span class="ht-m-val" id="ht-m-pe">-</span></div>
                    <div class="ht-metric-row"><span class="ht-m-label">P/S</span><span class="ht-m-val" id="ht-m-ps">-</span></div>
                </div>
            </div>
        </div>

        <!-- Right Card: Tabbed Deep-Dive Area -->
        <div id="ht-deepdive-card" class="ht-card">
            <div class="ht-tabs-header">
                <button class="ht-tab-btn active" data-tab="profitability">Profitability</button>
                <button class="ht-tab-btn" data-tab="insiders">Insiders</button>
                <button class="ht-tab-btn" data-tab="news">News</button>
                <button class="ht-tab-btn" data-tab="institutions">Institutions</button>
            </div>
            <div class="ht-tab-content" id="ht-tab-profitability">
                <div class="ht-prof-grid">
                    <div class="ht-prof-box"><span class="ht-prof-label">GROSS MARGIN</span><span class="ht-prof-val" id="ht-prof-gross">-</span><span class="ht-badge strong">Strong</span></div>
                    <div class="ht-prof-box"><span class="ht-prof-label">OPER. MARGIN</span><span class="ht-prof-val" id="ht-prof-oper">-</span><span class="ht-badge strong">Strong</span></div>
                    <div class="ht-prof-box"><span class="ht-prof-label">NET MARGIN</span><span class="ht-prof-val" id="ht-prof-net">-</span><span class="ht-badge strong">Strong</span></div>
                    <div class="ht-prof-box"><span class="ht-prof-label">ROE</span><span class="ht-prof-val" id="ht-prof-roe">-</span><span class="ht-badge strong">Strong</span></div>
                    <div class="ht-prof-box"><span class="ht-prof-label">ROA</span><span class="ht-prof-val" id="ht-prof-roa">-</span><span class="ht-badge fair">Fair</span></div>
                    <div class="ht-prof-box"><span class="ht-prof-label">P/S RATIO</span><span class="ht-prof-val" id="ht-prof-ps">-</span><span class="ht-badge fair">Fair</span></div>
                </div>
                <div class="ht-prof-bottom-bar">
                    <span>ROI: <b id="ht-prof-roi">-</b></span>
                    <span>FWD P/E: <b id="ht-prof-fwdpe">-</b></span>
                    <span>SHORT RATIO: <b id="ht-prof-dtc">-</b></span>
                    <span>INST OWN: <b id="ht-prof-instown">-</b></span>
                </div>
            </div>
            <div class="ht-tab-content" id="ht-tab-insiders" style="display: none;">
                <div id="ht-insiders-cell"><span class="ht-loadingmsg">Waiting for insider data</span></div>
            </div>
            <div class="ht-tab-content" id="ht-tab-news" style="display: none;">
                <div id="ht-news-cell"><span class="ht-loadingmsg">Waiting for news</span></div>
            </div>
            <div class="ht-tab-content" id="ht-tab-institutions" style="display: none;">
                <div id="ht-institutions-cell">
                    <div class="ht-inst-row"><span>Institutional Ownership</span><b id="ht-inst-own-val">-</b></div>
                    <div class="ht-inst-row"><span>Institutional Transactions (3Mo)</span><b id="ht-inst-trans-val">-</b></div>
                    <div class="ht-inst-row"><span>Shares Float</span><b id="ht-inst-float-val">-</b></div>
                    <div class="ht-inst-row"><span>Short Float %</span><b id="ht-inst-short-val">-</b></div>
                    <div class="ht-inst-row"><span>Days To Cover</span><b id="ht-inst-dtc-val">-</b></div>
                </div>
            </div>
        </div>
    </div>

    <!-- MAIN 2-COLUMN SECTION: Earnings on Left, TradingView on Right (Image 0) -->
    <div id="ht-main-grid">
        <!-- Left Column: Bar Charts + Annual Table + Quarterly Table -->
        <div id="ht-earnings-pane">
            <!-- EPS & Sales Bar Chart Visualizer -->
            <div id="ht-bars-card" class="ht-card">
                <div class="ht-bars-header">
                    <span class="ht-bars-title-left">EPS</span>
                    <div class="ht-bars-tabs">
                        <button class="ht-bar-tab active" data-bartab="quarterly">Quarterly</button>
                        <button class="ht-bar-tab" data-bartab="annual">Annual</button>
                    </div>
                    <span class="ht-bars-title-right">Sales ($M)</span>
                </div>
                <div class="ht-bars-body">
                    <div id="ht-eps-bars-container" class="ht-bar-chart-half"></div>
                    <div id="ht-sales-bars-container" class="ht-bar-chart-half"></div>
                </div>
            </div>

            <!-- Fiscal Year Table -->
            <div id="ht-fiscal-year-card" class="ht-card">
                <div class="ht-card-title">
                    <span>FISCAL YEAR</span>
                </div>
                <div id="ht-earnings-yearly"><span class="ht-loadingmsg">Waiting for earnings data</span></div>
            </div>

            <!-- Quarterly Table -->
            <div id="ht-quarterly-card" class="ht-card">
                <div class="ht-card-title">
                    <span>QUARTER</span>
                </div>
                <div id="ht-earnings-quarterly"><span class="ht-loadingmsg">Waiting for earnings data</span></div>
            </div>
        </div>

        <!-- Right Column: TradingView Interactive Candlestick Chart -->
        <div id="ht-tv-pane" class="ht-card">
            <div class="ht-tv-header">
                <div class="ht-tv-tf-btns">
                    <button class="ht-tf-btn active" data-interval="D">D</button>
                    <button class="ht-tf-btn" data-interval="W">W</button>
                    <button class="ht-tf-btn" data-interval="M">M</button>
                </div>
                <div class="ht-tv-title">
                    <span id="ht-tv-symbol-display">TradingView Chart</span>
                    <a id="ht-tv-external-link" class="ht-tv-link" href="#" target="_blank" title="Open full chart on TradingView">↗</a>
                </div>
            </div>
            <div id="ht-tv-iframe-wrapper">
                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;">Loading TradingView Chart...</div>
            </div>
        </div>
    </div>
</div>
`;
