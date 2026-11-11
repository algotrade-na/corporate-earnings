// constants
const CHANGE_POSITIVE_COLOR = "#0000FF";
const CHANGE_NEGATIVE_COLOR = "#FF0000";
const SURPRISE_POSITIVE_COLOR = "#04C90A";

const LOW_ADR_THRESHOLD = 4.0;
const LOW_ADR_COLOR = "#FF0000";

const HIGH_SHORT_INTEREST_THRESHOLD = 20;
const HIGH_SHORT_INTEREST_COLOR = "#FF0000";

const DAYS_BEFORE_EARNINGS_WARN_THRESHOLD = 3;
const DAYS_BEFORE_EARNINGS_WARN_COLOR = "#FF0000";

const HIGH_INST_CHANGE_THRESHOLD = 10;
const HIGH_INST_CHANGE_COLOR = "#00FF00";

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
       font-size: large;
       font-style: italic;
       z-index: 9999;
       color: #39ff14;
       background-color: #000000;
       padding: 40px;
       font-weight: bold;
       position: relative;
    }
    #ht-warningmsg {
        color: #ff0000;
        font-style: italic;
    }
    #ht-waiting-fundamentals {
        font-style: italic; 
        font-weight: bold; 
        color: #39ff14; 
    }
    #ht-waiting-earnings {
        font-style: italic; 
        font-weight: bold; 
        color: #39ff14; 
        font-size: medium;
    }
    #ht-root-container {
        --text-color: black;
        --bkg-color: white;
        --border: 1px solid #c9c9bb;
        --earnings-bkg-color: #333333;
        --earnings-bkg-color-even: #f3f3f3;
        --earnings-header-color: #333333;
        --earnings-change-positive-color: #1877F2;
        --earnings-change-negative-color: #FF0800;
        --link-color: #1e6dc0;
        --link-hover-color: #fff;
        --link-hover-bg-color: #1e6dc0;
        --ratings-upgrade-color: #00ff00;
        --ratings-downgrade-color: #ff0000;
        width: 100%;
        margin: 0;
        border: var(--border);
        border-collapse: collapse;
        color: var(--text-color);
        background: var(--bkg-color);
        font-family: Arial, sans-serif;
        padding: 12px;
        margin-bottom: 16px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    #ht-root-container.ht-dark-theme {
        --text-color: #e2e8f0;
        --bkg-color: #0f172a;
        --border: 1px solid #334155;
        --earnings-bkg-color: #1e293b;
        --earnings-bkg-color-even: #1e293b;
        --earnings-header-color: #1e293b;
        --earnings-change-positive-color: #38bdf8;
        --earnings-change-negative-color: #f87171;
        --link-color: #38bdf8;
        --link-hover-color: #fff;
        --link-hover-bg-color: #38bdf8;
        --ratings-upgrade-color: #40fb46;
        --ratings-downgrade-color: #ff1a1a;
    }
    #ht-root-container table {
        width: auto;
        display: table;
        margin: 0 0;
        border-collapse: collapse;
    }
    #ht-root-container td {
        line-height: 1.5;
        font-family: sans-serif;
    }
    table#ht-fundamentals-container {
       border: var(--border);
       border-collapse: collapse;
       margin: 0px 0px 5px 0px;
       box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
       display: none;
    }
    #ht-fundamentals-container tr {
        border: var(--border);
    }
    #ht-fundamentals-container td {
        border: var(--border);
        padding: 2px 5px;   
        font-size: small;
        text-align: left;
    }
    #ht-fundamentals-container.ht-fdata td {
        text-align: left;
        font-size: small;
    }    
    #ht-fundamentals-earnings.learnings {
        color: ${DAYS_BEFORE_EARNINGS_WARN_COLOR};
        font-weight: bold;
    }
    #ht-fundamentals-adr.ladr {
        color: ${LOW_ADR_COLOR};
        font-weight: bold;
    }
    #ht-fundamentals-shortfloat.hshorts {
        color: ${HIGH_SHORT_INTEREST_COLOR};
        font-weight: bold;
    }
    #ht-fundamentals-instown.hinstchange {
        color: ${HIGH_INST_CHANGE_COLOR};
        font-weight: bold;
    }
    #ht-company a {  
        text-align: left;
        font-size: medium;
    }
    a#ht-company-link, a#ht-company-link:hover, a#ht-company-link:link, a#ht-company-link:visited {
        color: var(--link-color);
        text-decoration: none;
    }
    a#ht-company-link:hover {
        background-color: var(--link-hover-bg-color);
        color: var(--link-hover-color);
    }
    span#ht-ticker {
       font-size: medium; 
    }
    td#ht-pricevol {
        font-size: medium;
    }
    .ht-earnings-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
    }
    .ht-earnings-table td {
        padding: 6px 10px;
        border: var(--border);
    }
    .ht-earnings-table thead td {
        font-weight: bold;
        background-color: var(--earnings-header-color);
        color: white;
    }
    .ht-earnings-table tbody tr:nth-child(even) {
        background-color: var(--earnings-bkg-color-even);
    }
    .ht-strong-pos-change, .ht-strong-pos-surprise {
        color: #10b981;
        font-weight: bold;
    }
    .ht-weak-pos-change, .ht-weak-pos-surprise {
        color: #3b82f6;
    }
    .ht-weak-neg-change {
        color: #f59e0b;
    }
    .ht-strong-neg-change {
        color: #ef4444;
        font-weight: bold;
    }
    .ladr, .learnings, .hshorts {
        color: #ef4444;
        font-weight: bold;
    }
    .hinstchange {
        color: #10b981;
        font-weight: bold;
    }
    #ht-ec-container {
        width: 100%;
        margin-top: 10px;
    }
    #ht-earnings-container {
        vertical-align: top;
    }
    #ht-chart-container {
        vertical-align: top;
        padding-left: 10px;
    }
    #ht-chart-weekly, #ht-chart-daily {
        margin-bottom: 8px;
    }
    #ht-chart-weekly img, #ht-chart-daily img {
        max-width: 100%;
        border: var(--border);
        border-radius: 4px;
    }
    #ht-rni-container {
        width: 100%;
        margin-top: 10px;
        font-size: small;
    }
    #ht-ratings-cell, #ht-news-cell, #ht-insiders-cell {
        vertical-align: top;
        padding: 5px;
        border: var(--border);
    }
    #ht-news-table, #ht-insiders-table {
        width: 100%;
        border-collapse: collapse;
    }
    #ht-news-table td, #ht-insiders-table td {
        padding: 3px 5px;
        border-bottom: 1px solid #4443;
    }
    .ht-loadingmsg:after {
        content: '.';
        animation: ht-dots 1s steps(1, end) infinite;
    }
    @keyframes ht-dots {
        0%, 12.5% {
            opacity: 0;
        }
        25% {
            opacity: 1;
        }
        37.5% {
            text-shadow: .5em 0;
        }
        50% {
            text-shadow: .5em 0, 1em 0;
        }
        62.5% {
            text-shadow: .5em 0, 1em 0, 1.5em 0;
        }
        75% {
            text-shadow: .5em 0, 1em 0, 1.5em 0, 2em 0;
        }
        87.5%, 100% {
            text-shadow: .5em 0, 1em 0, 1.5em 0, 2em 0, 2.5em;
        }
    }
</style>
`;

const HTML_EARNINGS_ONLY = (theme = "dark") => `
<div id="ht-root-container"${theme === "dark" ? ' class="ht-dark-theme"' : ""} style="width: 100%; border: 0;">
    <div id="ht-earnings-yearly"></div>
    <div id="ht-earnings-quarterly"></div>
</div>
`;

const HTML = (theme = "dark", showChart = false, show_earnings_surprise = false) => `
<div id="ht-root-container"${theme === "dark" ? ' class="ht-dark-theme"' : ""}>
    <table id="ht-fundamentals-container" style="display: none;">
        <tr>
            <td colspan="3" id="ht-company"></td>
            <td title="Price / Volume" id="ht-pricevol"></td>
        </tr>
        <tr>
            <td colspan="4"><div id="ht-description"></div></td>
        </tr>
        <tr class="ht-fdata">
            <td title="Market capitalization">Mkt Cap</td><td title="Market capitalization" id="ht-fundamentals-mktcap"></td>
            <td title="Monthly volatility">ADR</td><td title="Monthly volatility" id="ht-fundamentals-adr"></td>
        </tr>
        <tr class="ht-fdata">
            <td title="Shares float">Shares Float</td><td title="Shares float" id="ht-fundamentals-float"></td>
            <td title="Next earnings date">Next Earnings</td><td title="Next earnings date" id="ht-fundamentals-earnings"></td>
        </tr>
        <tr class="ht-fdata">
            <td title="Short interest shares">Short Float</td><td title="Short interest shares" id="ht-fundamentals-shortfloat"></td>
            <td title="Institutional ownership">Inst Own</td><td title="Institutional ownership" id="ht-fundamentals-instown"></td>
        </tr>
        <tr class="ht-fdata">
            <td title="Short interest ratio">Days to cover</td><td title="Short interest ratio" id="ht-fundamentals-daystocover"></td>
            <td title="Institutional transactions (3 month change in institutional ownership)">Inst Trans</td><td title="Institutional transactions (3 month change in institutional ownership)" id="ht-fundamentals-instrans3mo"></td>
        </tr>
        <tr class="ht-fdata">
            <td title="Average volume (3 months)">Avg Volume</td><td title="Average volume (3 months)" id="ht-fundamentals-avgvol"></td>
            <td title="Relative volume">Rel Volume</td><td title="Relative volume" id="ht-fundamentals-relvol"></td>
        </tr> 
    </table>            
    <table id="ht-ec-container">
        <tr>
            <td id="ht-earnings-container">
                <div id="ht-earnings-yearly"><span id="ht-waiting-earnings" class="ht-loadingmsg">Waiting for data</span></div>
                <div id="ht-earnings-quarterly"></div>
            </td>
            ${showChart ? '<td id="ht-chart-container"><div id="ht-chart-weekly"></div><div id="ht-chart-daily"></div></td>' : ""}              
        </tr>
    </table>
    <table id="ht-rni-container">
        <tr>
            <td id="ht-ratings-cell"></td>
            <td id="ht-news-cell"></td>   
            <td id="ht-insiders-cell"></td>
        </tr>    
    </table>
</div>
`;
