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
};

const SA_REGEX = /symbol\/([a-zA-Z0-9\.\-]+)/;
const ZA_REGEX = /stock\/(?:research|quote)\/([a-zA-Z0-9\.\-]+)/;
const YF_REGEX = /quote\/([a-zA-Z0-9\.\-]+)/;

const FETCH_URL = "aHR0cHM6Ly9maW52aXouY29tL3N0b2NrP3Q9";
const FETCH_URL_PREFIX = "aHR0cHM6Ly9maW52aXouY29tLw==";
const IMAGE_URL = "aHR0cHM6Ly9jaGFydHMyLmZpbnZpei5jb20vY2hhcnQ/dD0=";
const CHROME_PREFIX_REGEX = /chrome-extension:\/\/\w+\//;
const FIREFOX_PREFIX_REGEX = /moz-extension:\/\/((\w{4,12}-?)){5}\//;

const CSS = (showChart = false, show_earnings_surprise = false) => `
<style>
    #ht-msg-noearnings, #ht-waiting {
       font-size: 15px;
       font-style: normal;
       z-index: 9999;
       color: #38bdf8;
       background-color: #14171f;
       border: 1px solid #262b3a;
       border-radius: 8px;
       padding: 24px;
       font-weight: 600;
       margin: 16px auto;
       max-width: 1200px;
       text-align: center;
       box-shadow: 0 4px 20px rgba(0,0,0,0.3);
       font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    #ht-warningmsg {
        color: #f87171;
    }
    #ht-waiting-fundamentals {
        color: #38bdf8; 
    }
    #ht-waiting-earnings {
        color: #38bdf8; 
        font-size: 13px;
        font-weight: 500;
    }
    #ht-root-container {
        --text-color: #f1f5f9;
        --text-muted: #94a3b8;
        --bkg-color: #131722;
        --card-bkg: #181c27;
        --card-bkg-alt: #1e2230;
        --border: 1px solid #262b3a;
        --border-subtle: 1px solid rgba(255, 255, 255, 0.07);
        --earnings-header-color: #202534;
        --earnings-bkg-color-even: #1a1e2b;
        --earnings-change-positive-color: #10b981;
        --earnings-change-negative-color: #f43f5e;
        --link-color: #38bdf8;
        --link-hover-color: #7dd3fc;
        --ratings-upgrade-color: #10b981;
        --ratings-downgrade-color: #f43f5e;
        
        width: 100%;
        max-width: 1180px;
        box-sizing: border-box;
        margin: 0 auto 16px auto;
        border: var(--border);
        border-radius: 10px;
        color: var(--text-color);
        background: var(--bkg-color);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        padding: 14px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
        font-size: 13px;
        line-height: 1.4;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    #ht-root-container.ht-dark-theme {
        --text-color: #f1f5f9;
        --text-muted: #94a3b8;
        --bkg-color: #131722;
        --card-bkg: #181c27;
        --card-bkg-alt: #1e2230;
        --border: 1px solid #262b3a;
        --border-subtle: 1px solid rgba(255, 255, 255, 0.07);
        --earnings-header-color: #202534;
        --earnings-bkg-color-even: #1a1e2b;
        --earnings-change-positive-color: #10b981;
        --earnings-change-negative-color: #f43f5e;
        --link-color: #38bdf8;
        --link-hover-color: #7dd3fc;
    }
    #ht-root-container:not(.ht-dark-theme) {
        --text-color: #0f172a;
        --text-muted: #64748b;
        --bkg-color: #f8fafc;
        --card-bkg: #ffffff;
        --card-bkg-alt: #f1f5f9;
        --border: 1px solid #e2e8f0;
        --border-subtle: 1px solid rgba(0, 0, 0, 0.07);
        --earnings-header-color: #e2e8f0;
        --earnings-bkg-color-even: #f8fafc;
        --earnings-change-positive-color: #059669;
        --earnings-change-negative-color: #e11d48;
        --link-color: #0284c7;
        --link-hover-color: #0369a1;
        --ratings-upgrade-color: #059669;
        --ratings-downgrade-color: #e11d48;
    }
    #ht-root-container table {
        border-collapse: collapse;
        box-sizing: border-box;
    }
    #ht-fundamentals-container {
        width: 100%;
        box-sizing: border-box;
        margin: 0;
        border: var(--border);
        border-radius: 8px;
        overflow: hidden;
        background: var(--card-bkg);
        padding: 14px 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    #ht-header-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding-bottom: 8px;
        border-bottom: var(--border-subtle);
        gap: 16px;
    }
    #ht-company {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-color);
        line-height: 1.3;
    }
    #ht-company a {
        color: var(--link-color);
        text-decoration: none;
    }
    #ht-company a:hover {
        text-decoration: underline;
    }
    #ht-ticker {
        font-size: 15px;
        font-weight: 700;
        color: var(--link-color);
    }
    #ht-pricevol {
        text-align: right;
        font-size: 18px;
        font-weight: 700;
        color: var(--text-color);
        white-space: nowrap;
        line-height: 1.2;
    }
    #ht-volume {
        font-size: 11px;
        font-weight: 400;
        color: var(--text-muted);
        display: block;
        margin-top: 2px;
    }
    #ht-description {
        font-size: 12px;
        line-height: 1.5;
        color: var(--text-muted);
        max-height: 38px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        transition: max-height 0.3s ease;
    }
    #ht-description:hover {
        -webkit-line-clamp: unset;
        max-height: 400px;
    }
    #ht-fundamentals-grid {
        width: 100%;
        max-width: 860px;
        margin: 0 auto;
        table-layout: fixed;
        border-collapse: collapse;
        border-spacing: 0;
        font-size: 12px;
    }
    #ht-fundamentals-grid td {
        padding: 4px 8px;
        border-bottom: var(--border-subtle);
        vertical-align: middle;
    }
    #ht-fundamentals-grid tr:last-child td {
        border-bottom: none;
    }
    #ht-fundamentals-grid td:nth-child(1),
    #ht-fundamentals-grid td:nth-child(3) {
        color: var(--text-muted);
        font-weight: 500;
        text-align: left;
    }
    #ht-fundamentals-grid td:nth-child(2),
    #ht-fundamentals-grid td:nth-child(4) {
        color: var(--text-color);
        font-weight: 600;
        text-align: right;
        font-variant-numeric: tabular-nums;
    }
    #ht-fundamentals-grid td:nth-child(2) {
        border-right: var(--border);
        padding-right: 16px;
    }
    #ht-fundamentals-grid td:nth-child(3) {
        padding-left: 16px;
    }
    #ht-fundamentals-earnings.learnings,
    #ht-fundamentals-adr.ladr,
    #ht-fundamentals-shortfloat.hshorts {
        color: #f43f5e !important;
        font-weight: 700;
    }
    #ht-fundamentals-instown.hinstchange {
        color: #10b981 !important;
        font-weight: 700;
    }

    /* MarketSmith Style: Equal 50/50 Layout for Annual and Quarterly */
    #ht-ec-container {
        display: flex;
        flex-direction: row;
        gap: 12px;
        align-items: stretch;
        width: 100%;
        margin: 0;
    }
    #ht-earnings-container {
        display: flex;
        flex-direction: row;
        gap: 12px;
        align-items: stretch;
        flex: 1 1 0;
        width: 100%;
        min-width: 0;
    }
    #ht-earnings-yearly {
        flex: 38 1 0;
        min-width: 0;
    }
    #ht-earnings-quarterly {
        flex: 62 1 0;
        min-width: 0;
        overflow-x: auto;
    }
    #ht-earnings-quarterly .ht-earnings-table thead tr td:nth-child(2),
    #ht-earnings-quarterly .ht-earnings-table tbody tr td:nth-child(2) {
        text-align: left;
    }
    #ht-earnings-yearly .ht-earnings-table thead tr td:nth-child(2),
    #ht-earnings-yearly .ht-earnings-table tbody tr td:nth-child(2) {
        text-align: right;
    }
    @media (max-width: 992px) {
        #ht-earnings-container {
            flex-direction: column;
        }
        #ht-earnings-yearly {
            width: 100%;
            min-width: 100%;
        }
        #ht-chart-container.ht-chart-grid {
            grid-template-columns: 1fr !important;
        }
        #ht-rni-container {
            grid-template-columns: 1fr !important;
        }
    }
    .ht-earnings-table {
        table-layout: fixed;
        border-collapse: separate;
        border-spacing: 0;
        border: var(--border);
        border-radius: 8px;
        overflow: hidden;
        background: var(--card-bkg);
        font-size: 11.5px;
        width: 100%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .ht-earnings-table thead tr td {
        background-color: var(--earnings-header-color);
        color: var(--text-muted);
        font-weight: 600;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        padding: 6px 4px;
        border-bottom: var(--border);
        text-align: right;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        box-sizing: border-box;
    }
    .ht-earnings-table thead tr td:first-child {
        text-align: left;
        padding-left: 8px;
    }
    .ht-earnings-table tbody tr {
        border-bottom: var(--border-subtle);
        transition: background 0.15s;
    }
    .ht-earnings-table tbody tr:last-child {
        border-bottom: none;
    }
    .ht-earnings-table tbody tr:nth-of-type(even) {
        background-color: var(--earnings-bkg-color-even);
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
        padding-left: 8px;
        font-weight: 500;
        color: var(--text-muted);
    }
    #ht-earnings-quarterly .ht-earnings-table tbody tr td:nth-child(2) {
        text-align: left;
        font-weight: 600;
    }
    .ht-strong-pos-change, .ht-strong-pos-surprise {
        color: var(--earnings-change-positive-color) !important;
        font-weight: 700;
    }
    .ht-weak-pos-change, .ht-weak-pos-surprise {
        color: var(--link-color) !important;
        font-weight: 500;
    }
    .ht-weak-neg-change {
        color: #fb923c !important;
    }
    .ht-strong-neg-change {
        color: var(--earnings-change-negative-color) !important;
        font-weight: 700;
    }

    /* Stock Charts Section: Dedicated 50/50 Cards */
    #ht-chart-container {
        width: 100%;
        margin: 0;
        box-sizing: border-box;
    }
    #ht-chart-container.ht-chart-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        align-items: stretch;
    }
    #ht-chart-container.ht-chart-single {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
    }
    .ht-chart-card {
        background: var(--card-bkg);
        border: var(--border);
        border-radius: 8px;
        padding: 12px 14px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
    }
    .ht-chart-card .ht-section-heading {
        margin: 0 0 10px 0;
    }
    .ht-chart-img-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 220px;
        background: var(--card-bkg-alt);
        border: var(--border-subtle);
        border-radius: 6px;
        padding: 10px;
        overflow: hidden;
    }
    .ht-chart-img-wrapper img {
        max-width: 100%;
        width: auto;
        height: auto;
        max-height: 400px;
        object-fit: contain;
        border-radius: 4px;
        border: var(--border);
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.25);
        display: block;
        margin: 0 auto;
        image-rendering: -webkit-optimize-contrast;
    }
    .ht-chart-single .ht-chart-img-wrapper img {
        max-width: 580px;
        width: 100%;
    }
    .ht-no-chart {
        color: var(--text-muted);
        font-size: 12px;
        font-style: italic;
        padding: 24px 12px;
        text-align: center;
    }

    /* News & Insiders Section: Equal 50/50 */
    #ht-rni-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        width: 100%;
        margin: 0;
    }
    #ht-news-cell, #ht-insiders-cell {
        background: var(--card-bkg);
        border: var(--border);
        border-radius: 8px;
        padding: 12px 14px;
        max-height: 280px;
        overflow-y: auto;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        box-sizing: border-box;
    }
    .ht-section-heading {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--text-muted);
        margin: 0 0 8px 0;
        padding-bottom: 6px;
        border-bottom: var(--border);
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
        width: 80px;
    }
    .ht-news-link-cell {
        text-align: left;
    }
    a.ht-news-link {
        color: var(--link-color);
        text-decoration: none;
    }
    a.ht-news-link:hover {
        text-decoration: underline;
    }
    .ht-news-source {
        color: #c084fc;
        font-size: 10px;
        margin-left: 6px;
    }
    .ht-insiders-date {
        white-space: nowrap;
        color: var(--text-muted);
        width: 70px;
    }
    .ht-insiders-buy {
        color: #10b981 !important;
        font-weight: 700;
    }
    .ht-insiders-sell {
        color: #f43f5e !important;
        font-weight: 700;
    }
    a.ht-insiders-link {
        color: var(--link-color);
        text-decoration: none;
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
</style>
`;

const HTML_EARNINGS_ONLY = (theme = "dark") => `
<div id="ht-root-container"${theme === "dark" ? ' class="ht-dark-theme"' : ""}>
    <div id="ht-ec-container">
        <div id="ht-earnings-container">
            <div id="ht-earnings-yearly"></div>
            <div id="ht-earnings-quarterly"></div>
        </div>
    </div>
</div>
`;

const renderChartContainer = (chartType) => {
    if (chartType == CHART_TYPE.BOTH) {
        return `
    <div id="ht-chart-container" class="ht-chart-grid">
        <div id="ht-chart-weekly-card" class="ht-chart-card">
            <div class="ht-section-heading">Weekly Chart</div>
            <div id="ht-chart-weekly" class="ht-chart-img-wrapper">
                <span class="ht-loadingmsg">Waiting for weekly chart</span>
            </div>
        </div>
        <div id="ht-chart-daily-card" class="ht-chart-card">
            <div class="ht-section-heading">Daily Chart</div>
            <div id="ht-chart-daily" class="ht-chart-img-wrapper">
                <span class="ht-loadingmsg">Waiting for daily chart</span>
            </div>
        </div>
    </div>`;
    } else if (chartType == CHART_TYPE.WEEKLY) {
        return `
    <div id="ht-chart-container" class="ht-chart-single">
        <div id="ht-chart-weekly-card" class="ht-chart-card">
            <div class="ht-section-heading">Weekly Chart</div>
            <div id="ht-chart-weekly" class="ht-chart-img-wrapper">
                <span class="ht-loadingmsg">Waiting for weekly chart</span>
            </div>
        </div>
    </div>`;
    } else if (chartType == CHART_TYPE.DAILY) {
        return `
    <div id="ht-chart-container" class="ht-chart-single">
        <div id="ht-chart-daily-card" class="ht-chart-card">
            <div class="ht-section-heading">Daily Chart</div>
            <div id="ht-chart-daily" class="ht-chart-img-wrapper">
                <span class="ht-loadingmsg">Waiting for daily chart</span>
            </div>
        </div>
    </div>`;
    }
    return "";
};

const HTML = (theme = "dark", showChart = false, show_earnings_surprise = false, chartType = CHART_TYPE.NONE) => `
<div id="ht-root-container"${theme === "dark" ? ' class="ht-dark-theme"' : ""}>
    <div id="ht-fundamentals-container" style="display: none;">
        <div id="ht-header-row">
            <div id="ht-company"></div>
            <div title="Price / Volume" id="ht-pricevol"></div>
        </div>
        <div id="ht-description"></div>
        <table id="ht-fundamentals-grid">
            <colgroup>
                <col style="width: 22%;">
                <col style="width: 28%;">
                <col style="width: 22%;">
                <col style="width: 28%;">
            </colgroup>
            <tbody>
                <tr class="ht-fdata">
                    <td title="Market capitalization">Mkt Cap</td><td id="ht-fundamentals-mktcap"></td>
                    <td title="Monthly volatility">ADR</td><td id="ht-fundamentals-adr"></td>
                </tr>
                <tr class="ht-fdata">
                    <td title="Shares float">Shares Float</td><td id="ht-fundamentals-float"></td>
                    <td title="Next earnings date">Next Earnings</td><td id="ht-fundamentals-earnings"></td>
                </tr>
                <tr class="ht-fdata">
                    <td title="Short interest shares">Short Float</td><td id="ht-fundamentals-shortfloat"></td>
                    <td title="Institutional ownership">Inst Own</td><td id="ht-fundamentals-instown"></td>
                </tr>
                <tr class="ht-fdata">
                    <td title="Short interest ratio">Days to cover</td><td id="ht-fundamentals-daystocover"></td>
                    <td title="Institutional transactions (3 month change in institutional ownership)">Inst Trans</td><td id="ht-fundamentals-instrans3mo"></td>
                </tr>
                <tr class="ht-fdata">
                    <td title="Average volume (3 months)">Avg Volume</td><td id="ht-fundamentals-avgvol"></td>
                    <td title="Relative volume">Rel Volume</td><td id="ht-fundamentals-relvol"></td>
                </tr>
            </tbody>
        </table>
    </div>            
    <div id="ht-ec-container">
        <div id="ht-earnings-container">
            <div id="ht-earnings-yearly"><span id="ht-waiting-earnings" class="ht-loadingmsg">Waiting for earnings data</span></div>
            <div id="ht-earnings-quarterly"></div>
        </div>
    </div>
    ${showChart ? renderChartContainer(chartType) : ""}
    <div id="ht-rni-container">
        <div id="ht-news-cell">
            <div class="ht-section-heading">Recent News</div>
            <span id="ht-waiting-news" class="ht-loadingmsg">Waiting for news</span>
        </div>   
        <div id="ht-insiders-cell">
            <div class="ht-section-heading">Insider Transactions</div>
            <span id="ht-waiting-insiders" class="ht-loadingmsg">Waiting for insider data</span>
        </div>
    </div>
</div>
`;
