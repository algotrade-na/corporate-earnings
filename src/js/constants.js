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

const SA_REGEX = /symbol\/([a-zA-Z0-9\.\-]+)\/earnings/;
const ZA_REGEX = /stock\/research\/([a-zA-Z0-9\.\-]+)\/earnings-calendar/;

const FETCH_URL = "aHR0cHM6Ly9maW52aXouY29tL3F1b3RlLmFzaHg/dD0=";
const FETCH_URL_PREFIX = "aHR0cHM6Ly9maW52aXouY29tLw==";
const IMAGE_URL = "aHR0cHM6Ly9jaGFydHMyLmZpbnZpei5jb20vY2hhcnQuYXNoeD90PQ==";
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
        background-color: var(--bkg-color);
        color: var(--text-color);
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
</style>
`;
