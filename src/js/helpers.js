function logWarn(msg, err) {
    if (typeof console !== "undefined" && console.warn) {
        console.warn(msg, err);
    }
}

function hideNativeContent() {
    try {
        const root = document.getElementById("ht-root-container");
        const waiting = document.getElementById("ht-waiting");
        if (document.body && document.body.children) {
            Array.from(document.body.children).forEach((child) => {
                if (child !== root && child !== waiting && child.id !== "ht-msg-noearnings") {
                    hide(child);
                }
            });
        }
    } catch (e) {
        logWarn("hideNativeContent error", e);
    }
}

function collectChildText(elem) {
    let rows = [];
    if (!elem || !elem.children) return rows;
    Array.from(elem.children).forEach((child) => {
        let cells = [];
        if (child.children && child.children.length > 0) {
            Array.from(child.children).forEach((subChild) => {
                cells.push(subChild.textContent ? subChild.textContent.trim() : "");
            });
        } else if (child.textContent) {
            cells.push(child.textContent.trim());
        }
        if (cells.length > 0 && cells.some(c => c !== "")) {
            rows.push(cells);
        }
    });
    return rows;
}

// Helpers
function getComparativeQuarterName(qtr) {
    if (!qtr || !qtr.month || !qtr.year) return "";
    return qtr.month + " " + (qtr.year - 1);
}

function getDisplayQuarter(qtr) {
    if (!qtr || typeof qtr !== "string") return "-";
    if (qtr.length < 6) return qtr;
    return qtr.substr(0, 3) + "-" + qtr.substr(6);
}

function revenueStringToFloat(revStr) {
    if (!revStr || typeof revStr !== "string") return undefined;
    revStr = revStr.trim();
    if (revStr === "" || revStr === "-") return undefined;
    if (revStr.endsWith("M")) {
        return parseFloat(parseFloat(revStr).toFixed(1));
    } else if (revStr.endsWith("K")) {
        return parseFloat((parseFloat(revStr) / 1000).toFixed(2));
    } else if (revStr.endsWith("B")) {
        return Math.round(parseFloat(revStr) * 1000);
    } else {
        let val = parseFloat(revStr.replace(/[^\d.-]/g, ""));
        return isNaN(val) ? undefined : parseFloat((val / 1000).toFixed(2));
    }
}

function getAnnualEstimateYear(str) {
    if (!str || typeof str !== "string") return 0;
    let start = str.indexOf(" ");
    if (start > -1) {
        return parseInt(str.substr(start + 1)) || 0;
    }
    return parseInt(str) || 0;
}

function getLatestQtrYear(quarterlyData) {
    if (!quarterlyData || quarterlyData.length == 0) {
        return undefined;
    }
    let lastQtrName = quarterlyData[quarterlyData.length - 1].name;
    if (!lastQtrName) return undefined;
    let year = parseInt(lastQtrName.substr(lastQtrName.indexOf(" ") + 1));
    return isNaN(year) ? undefined : year;
}

function calculatePercentChange(current, previous) {
    if (!isDefined(current) || !isDefined(previous) || previous == 0 || isNaN(current) || isNaN(previous)) {
        return undefined;
    }
    return Math.round(100 * ((current - previous) / Math.abs(previous)));
}

function isQuarterValid(qtr) {
    return (
        isDefined(qtr) &&
        isDefined(qtr.name) &&
        qtr.name.length > 0 &&
        qtr.name !== "-" &&
        isDefined(qtr.eps) &&
        isDefined(qtr.eps.eps) &&
        !isNaN(qtr.eps.eps)
    );
}

function isAbleToCalculateQtrRevChange(qtr, compQuarter) {
    return (
        isDefined(qtr) &&
        isDefined(qtr.rev) &&
        isDefined(qtr.rev.rev) &&
        qtr.rev.rev != 0 &&
        isDefined(compQuarter) &&
        isDefined(compQuarter.rev) &&
        isDefined(compQuarter.rev.rev) &&
        compQuarter.rev.rev != 0
    );
}

function numberWithCommas(x) {
    if (!isDefined(x) || x == null) {
        return "-";
    }
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function isDefined(smth) {
    return typeof smth !== "undefined" && smth !== null;
}

function fixExternalLink(str) {
    if (!str || typeof str !== "string") return "#";
    let res = str.replace(CHROME_PREFIX_REGEX, decode(FETCH_URL_PREFIX));
    res = res.replace(FIREFOX_PREFIX_REGEX, decode(FETCH_URL_PREFIX));
    if (!res.startsWith("http")) res = decode(FETCH_URL_PREFIX) + res;
    return res;
}

function getWorkingDays(startDate, endDate) {
    var numWorkDays = 0;
    var currentDate = new Date(startDate);
    while (currentDate < endDate) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
            numWorkDays++;
        }
        currentDate = currentDate.addDays(1);
    }
    return numWorkDays;
}

Date.prototype.addDays = function (days) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
};

function arrayBufferToBase64(buffer) {
    if (!buffer || buffer.byteLength == 0) {
        return undefined;
    }
    let binary = "";
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function decode(str) {
    if (!isDefined(str)) {
        return undefined;
    }
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch (e) {
        return str;
    }
}

function getSymbol(url) {
    if (!url) return undefined;
    let res = SA_REGEX.exec(url);
    if (res != null) {
        return res[1].toUpperCase();
    }
    res = ZA_REGEX.exec(url);
    if (res != null) {
        return res[1].toUpperCase();
    }
    res = YF_REGEX.exec(url);
    if (res != null) {
        return res[1].toUpperCase();
    }
    return undefined;
}

function getSiblingText(arr, txt) {
    if (!arr || !Array.isArray(arr)) return "-";
    const idx = arr.findIndex((el) => el && el.textContent && el.textContent.trim() === txt);
    if (idx !== -1 && idx + 1 < arr.length && arr[idx + 1]) {
        return arr[idx + 1].textContent.trim();
    }
    return "-";
}

const bodyPrepend = (html) => {
    if (document.body) {
        document.body.insertAdjacentHTML("afterbegin", html);
    }
};

const headPrepend = (html) => {
    if (document.head) {
        document.head.insertAdjacentHTML("afterbegin", html);
    }
};

const hide = (element) => {
    if (element != null && element.style != null)
        element.style.display = "none";
};

const show = (element) => {
    if (element != null && element.style != null)
        element.style.display = "table";
};

const toggle = (element) => {
    if (element != null && element.style != null) {
        if (element.style.display === "none") {
            element.style.display = "table";
        } else {
            element.style.display = "none";
        }
    }
};

const contains = (selector, text) => {
    const elements = document.querySelectorAll(selector);
    return (
        [].filter.call(elements, (element) => {
            return element.textContent && element.textContent.includes(text);
        }).length > 0
    );
};

function isAdrLow(adrStr) {
    if (!isDefined(adrStr) || adrStr.length == 0 || adrStr == "-") return false;
    let adr = parseFloat(adrStr.replace(/%$/, ""));
    if (!isNaN(adr) && adr < LOW_ADR_THRESHOLD) {
        return true;
    }
    return false;
}

function isShortInterestHigh(shortsStr) {
    if (!isDefined(shortsStr) || shortsStr.length == 0 || shortsStr == "-")
        return false;
    let shorts = parseFloat(shortsStr.replace(/%$/, ""));
    if (!isNaN(shorts) && shorts > HIGH_SHORT_INTEREST_THRESHOLD) {
        return true;
    }
    return false;
}

function isHighInstitutionalOwnershipChange(instChangeStr) {
    if (
        !isDefined(instChangeStr) ||
        instChangeStr.length == 0 ||
        instChangeStr == "-"
    )
        return false;
    let instChange = parseFloat(instChangeStr.replace(/%$/, ""));
    if (!isNaN(instChange) && instChange > HIGH_INST_CHANGE_THRESHOLD) {
        return true;
    }
    return false;
}

function strToNum(str) {
    if (!isDefined(str)) return 0;
    str = str.replace(/[^\d.-]/g, "");
    if (str == "") return 0;
    let num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

function isEarningsDateClose(earningsStr, daysToEarnings) {
    if (
        !isDefined(earningsStr) ||
        earningsStr.length == 0 ||
        earningsStr == "-"
    )
        return false;
    if (
        isDefined(daysToEarnings) &&
        daysToEarnings <= DAYS_BEFORE_EARNINGS_WARN_THRESHOLD
    ) {
        return true;
    }
    return false;
}

function getHighlightClass4Change(num, str) {
    let hclass = "";
    if (str === "N/A" || !isDefined(num) || isNaN(num)) {
        return hclass;
    }
    if (num >= 30) {
        hclass = " ht-strong-pos-change";
    } else if (num > 0 && num < 30) {
        hclass = " ht-weak-pos-change";
    } else if (num < 0 && num > -20) {
        hclass = " ht-weak-neg-change";
    } else if (num <= -20) {
        hclass = " ht-strong-neg-change";
    }
    return hclass;
}

function getHighlightClass4Surprise(num, str) {
    let hclass = "";
    if (str === "N/A" || !isDefined(num) || isNaN(num)) {
        return hclass;
    }
    if (num >= 30) {
        hclass = " ht-strong-pos-surprise";
    } else if (num > 0 && num < 30) {
        hclass = " ht-weak-pos-surprise";
    } else if (num < 0 && num > -20) {
        hclass = " ht-weak-neg-change";
    } else if (num <= -20) {
        hclass = " ht-strong-neg-change";
    }
    return hclass;
}

function getParser(ds_type, html) {
    if (isDefined(html) && typeof html === "string") {
        if (html.includes("earningsChart") || html.includes("financialsChart")) {
            return new YFParser(html);
        }
        if (html.includes("obj_data") || html.includes("earnings_announcements_earnings_table")) {
            return new ZAParser(html);
        }
        return new SAParser(html);
    }
    if (ds_type === 3) return new YFParser();
    if (ds_type === 2) return new ZAParser();
    if (ds_type === 1) return new SAParser();
    return new FallbackParser();
}

class Parser {
    constructor() {}
}

class FallbackParser extends Parser {
    constructor(html) {
        super();
        this.qtrData = [];
        this.annualData = [];
    }
}

class SAParser extends Parser {
    constructor(html) {
        super();
        try {
            const parsedData = SAParser.parse(html);
            this.qtrData = parsedData[0] || [];
            this.annualData = parsedData[1] || [];
        } catch (e) {
            logWarn("SAParser failed to parse HTML", e);
            this.qtrData = [];
            this.annualData = [];
        }
    }

    static parse(html = undefined) {
        const quarterlyData = [], annualData = [];
        try {
            const parser = new DOMParser();
            let dom = isDefined(html)
                ? parser.parseFromString(html, "text/html")
                : (typeof document !== "undefined" ? document : null);
            if (!dom) return [quarterlyData, annualData];

            const monthYearRegex = /^[A-Za-z]{3}\s*\d{4}/;
            const qtrRegex = /(?:FQ[1-4]|Q[1-4]|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}\b)/i;

            let blocks = Array.from(dom.querySelectorAll('[data-test-id="table-body"], [data-test-id*="table"], tbody, [role="rowgroup"], div[class*="table"]'));
            if (blocks.length === 0) {
                blocks = Array.from(dom.querySelectorAll('table'));
            }

            let dataBlockCount = 1;
            blocks.forEach((block) => {
                let rows = collectChildText(block);
                if (!rows || rows.length === 0) return;

                // Check if this block is quarterly earnings data (contains FQ or quarterly labels and numeric EPS/Rev)
                let isQuarterlyBlock = rows.some(r => r[0] && qtrRegex.test(r[0]) && r.length >= 3);

                if (isQuarterlyBlock) {
                    for (const row of rows) {
                        if (!row[0] || !qtrRegex.test(row[0])) continue;
                        let q = new SAQarter(row);
                        if (isQuarterValid(q)) {
                            if (!quarterlyData.some(existing => existing.name === q.name)) {
                                quarterlyData.unshift(q);
                            }
                        }
                    }
                } else if (block.textContent && (block.textContent.startsWith('FY') || block.textContent.includes('Fiscal Year'))) {
                    return;
                } else {
                    // Estimates blocks (EPS & Revenue estimates)
                    switch (dataBlockCount) {
                        case 1:
                            for (const row of rows) {
                                if (!isDefined(row[0]) || row[0] == "" || row[0].match(monthYearRegex) == null) continue;
                                let year = new Year(
                                    getAnnualEstimateYear(row[0]),
                                    "*" + getAnnualEstimateYear(row[0]),
                                    row[1]
                                );
                                year.qtrs4Year = 4;
                                annualData.push(year);
                            }
                            break;
                        case 2:
                            for (const row of rows) {
                                if (!isDefined(row[0]) || row[0] == "" || row[0].match(monthYearRegex) == null) continue;
                                let yearInt = getAnnualEstimateYear(row[0]);
                                const foundYear = annualData.find((q) => q.year == yearInt);
                                if (foundYear) {
                                    foundYear.rev = revenueStringToFloat(row[1]);
                                } else {
                                    let year = new Year(
                                        yearInt,
                                        "*" + yearInt,
                                        undefined,
                                        revenueStringToFloat(row[1])
                                    );
                                    annualData.push(year);
                                }
                            }
                            break;
                    }
                    ++dataBlockCount;
                }
            });
        } catch (err) {
            logWarn("SAParser.parse error", err);
        }
        return [quarterlyData, annualData];
    }
}

class ZAParser extends Parser {
    constructor(html) {
        super();
        try {
            const parsedData = ZAParser.parse(html);
            this.qtrData = parsedData[0] || [];
            this.annualData = parsedData[1] || [];
        } catch (e) {
            logWarn("ZAParser failed to parse HTML", e);
            this.qtrData = [];
            this.annualData = [];
        }
    }

    static parse(html = undefined) {
        const quarterlyData = [], annualData = [];
        try {
            let jsonStr = "";

            // 1. If running live in document, check inline scripts directly
            if (!isDefined(html) && typeof document !== "undefined") {
                const scripts = Array.from(document.scripts || []);
                for (const s of scripts) {
                    if (s.textContent && s.textContent.includes("obj_data")) {
                        jsonStr = ZAParser.extractJsonFromText(s.textContent);
                        if (jsonStr) break;
                    }
                }
            }

            // 2. If not found, check rawText (html or document.documentElement.innerHTML)
            if (!jsonStr) {
                const rawText = isDefined(html) ? html : (typeof document !== "undefined" && document.documentElement ? document.documentElement.innerHTML : "");
                jsonStr = ZAParser.extractJsonFromText(rawText);
            }

            // 3. Fallback: check #earnings_announcements_tabs sibling
            if (!jsonStr && typeof document !== "undefined") {
                const tabsElem = document.querySelector("#earnings_announcements_tabs");
                if (tabsElem && tabsElem.nextElementSibling) {
                    jsonStr = ZAParser.extractJsonFromText(tabsElem.nextElementSibling.innerHTML);
                }
            }

            if (!jsonStr) {
                return [quarterlyData, annualData];
            }

            let dataObj = JSON.parse(jsonStr);
            if (dataObj && dataObj.earnings_announcements_earnings_table) {
                dataObj.earnings_announcements_earnings_table.forEach((item) => {
                    if (!item || item.length < 4) return;
                    let quarter = new ZAQarter(
                        item[0],
                        item[1],
                        item[3],
                        item[5] || "",
                        dataObj.earnings_announcements_sales_table || []
                    );

                    if (isQuarterValid(quarter)) {
                        quarterlyData.unshift(quarter);
                    }
                });
            }
        } catch (err) {
            logWarn("ZAParser.parse error", err);
        }
        return [quarterlyData, annualData];
    }

    static extractJsonFromText(text) {
        if (!text || typeof text !== "string") return "";
        const m = text.match(/(?:document\.)?obj_data\s*=\s*\{/);
        if (!m) return "";
        const start = m.index + m[0].length - 1;
        let braceCount = 0;
        let inString = false;
        let escape = false;
        for (let i = start; i < text.length; i++) {
            const ch = text[i];
            if (inString) {
                if (escape) {
                    escape = false;
                } else if (ch === "\\") {
                    escape = true;
                } else if (ch === '"') {
                    inString = false;
                }
            } else {
                if (ch === '"') {
                    inString = true;
                } else if (ch === "{") {
                    braceCount++;
                } else if (ch === "}") {
                    braceCount--;
                    if (braceCount === 0) {
                        return text.substring(start, i + 1);
                    }
                }
            }
        }
        return "";
    }
}

class YFParser extends Parser {
    constructor(html) {
        super();
        try {
            const parsedData = YFParser.parse(html);
            this.qtrData = parsedData[0] || [];
            this.annualData = parsedData[1] || [];
        } catch (e) {
            logWarn("YFParser failed to parse", e);
            this.qtrData = [];
            this.annualData = [];
        }
    }

    static parse(html = undefined) {
        const quarterlyData = [];
        const annualData = [];
        try {
            let earningsObj = null;
            let keyStatsObj = null;

            if (isDefined(html) && typeof html === "string") {
                const extracted = YFParser.extractEarningsFromHtml(html);
                if (extracted) {
                    earningsObj = extracted.earnings;
                    if (extracted.keyStats) keyStatsObj = extracted.keyStats;
                }
            } else if (typeof document !== "undefined") {
                const scripts = Array.from(document.scripts || document.querySelectorAll("script") || []);
                for (const s of scripts) {
                    const text = s.textContent || "";
                    if (!text) continue;
                    if (text.includes("earningsChart") || text.includes("financialsChart")) {
                        const extracted = YFParser.extractEarningsFromText(text);
                        if (extracted) {
                            earningsObj = extracted.earnings;
                            if (extracted.keyStats) keyStatsObj = extracted.keyStats;
                            break;
                        }
                    }
                }
            }

            if (!earningsObj) return [quarterlyData, annualData];

            const ec = earningsObj.earningsChart || {};
            const fc = earningsObj.financialsChart || {};
            const qEc = ec.quarterly || [];
            const qFc = fc.quarterly || [];
            const yFc = fc.yearly || [];

            qEc.forEach((item) => {
                const q = new YFQarter(item, qFc);
                if (isQuarterValid(q)) {
                    quarterlyData.push(q);
                }
            });

            let shares = (keyStatsObj && keyStatsObj.sharesOutstanding && keyStatsObj.sharesOutstanding.raw)
                ? keyStatsObj.sharesOutstanding.raw
                : undefined;

            yFc.forEach((item) => {
                if (!item || !item.date) return;
                const yearInt = parseInt(item.date);
                if (isNaN(yearInt)) return;

                let revMil = undefined;
                if (item.revenue && isDefined(item.revenue.raw)) {
                    revMil = Math.round(item.revenue.raw / 1e6 * 10) / 10;
                }

                let epsVal = undefined;
                if (shares && item.earnings && isDefined(item.earnings.raw)) {
                    epsVal = Math.round(item.earnings.raw / shares * 100) / 100;
                }

                const yearObj = new Year(yearInt, yearInt, epsVal, revMil);
                yearObj.qtrs4Year = 4;
                annualData.push(yearObj);
            });
        } catch (err) {
            logWarn("YFParser.parse error", err);
        }
        return [quarterlyData, annualData];
    }

    static extractEarningsFromHtml(html) {
        if (!html || typeof html !== "string") return null;
        const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
        let match;
        while ((match = scriptRegex.exec(html)) !== null) {
            const scriptText = match[1];
            if (scriptText.includes("earningsChart") || scriptText.includes("financialsChart")) {
                const extracted = YFParser.extractEarningsFromText(scriptText);
                if (extracted) return extracted;
            }
        }
        return YFParser.extractEarningsFromText(html);
    }

    static extractEarningsFromText(text) {
        if (!text || typeof text !== "string") return null;
        try {
            let obj = JSON.parse(text.trim());
            let extracted = YFParser.findEarningsInObject(obj);
            if (extracted) return extracted;
        } catch (e) {}

        const qsMatch = text.match(/"quoteSummary"\s*:\s*\{/);
        if (qsMatch) {
            const start = qsMatch.index + 15;
            const jsonSub = YFParser.extractBalancedJson(text, start);
            if (jsonSub) {
                try {
                    const qsObj = JSON.parse(jsonSub);
                    let extracted = YFParser.findEarningsInQuoteSummary(qsObj);
                    if (extracted) return extracted;
                } catch (e) {}
            }
        }

        const ecMatch = text.match(/"earnings"\s*:\s*\{/);
        if (ecMatch) {
            const start = ecMatch.index + 11;
            const jsonSub = YFParser.extractBalancedJson(text, start);
            if (jsonSub) {
                try {
                    const earningsObj = JSON.parse(jsonSub);
                    if (earningsObj.earningsChart || earningsObj.financialsChart) {
                        return { earnings: earningsObj };
                    }
                } catch (e) {}
            }
        }

        return null;
    }

    static findEarningsInObject(obj) {
        if (!obj || typeof obj !== "object") return null;
        if (obj.body && typeof obj.body === "string") {
            try {
                const bodyObj = JSON.parse(obj.body);
                return YFParser.findEarningsInObject(bodyObj);
            } catch (e) {}
        }
        if (obj.quoteSummary) {
            return YFParser.findEarningsInQuoteSummary(obj.quoteSummary);
        }
        if (obj.earnings && (obj.earnings.earningsChart || obj.earnings.financialsChart)) {
            return { earnings: obj.earnings, keyStats: obj.defaultKeyStatistics };
        }
        return null;
    }

    static findEarningsInQuoteSummary(qs) {
        if (!qs || !qs.result || !Array.isArray(qs.result) || qs.result.length === 0) return null;
        const res = qs.result[0];
        if (res.earnings && (res.earnings.earningsChart || res.earnings.financialsChart)) {
            return { earnings: res.earnings, keyStats: res.defaultKeyStatistics };
        }
        return null;
    }

    static extractBalancedJson(text, startIdx) {
        let braceCount = 0;
        let inString = false;
        let escape = false;
        let firstBrace = -1;
        for (let i = startIdx; i < text.length; i++) {
            const ch = text[i];
            if (firstBrace === -1) {
                if (ch === "{") {
                    firstBrace = i;
                    braceCount = 1;
                }
                continue;
            }
            if (inString) {
                if (escape) {
                    escape = false;
                } else if (ch === "\\") {
                    escape = true;
                } else if (ch === '"') {
                    inString = false;
                }
            } else {
                if (ch === '"') {
                    inString = true;
                } else if (ch === "{") {
                    braceCount++;
                } else if (ch === "}") {
                    braceCount--;
                    if (braceCount === 0) {
                        return text.substring(firstBrace, i + 1);
                    }
                }
            }
        }
        return "";
    }
}

class Quarter {
    constructor() {}
}

class SAQarter extends Quarter {
    constructor(cells) {
        super();
        if (!cells || cells.length < 3) return;
        const nameAttr = SAQarter.parseQtrName(cells[0] || "");
        this.date = cells[0] || "-";
        this.name = nameAttr.name;
        this.month = nameAttr.month;
        this.year = parseInt(nameAttr.year) || 0;
        this.eps = SAQarter.parseQtrEps(cells[1], cells[2]);
        this.rev = SAQarter.parseQtrRev(cells[3], isDefined(cells[5]) && cells[5] !== "" ? cells[5] : cells[4]);
    }

    static parseQtrName(str) {
        let qtr = { name: "-", month: "-", year: "0" };
        if (!str || typeof str !== "string") return qtr;

        // 1. Format: "FQ3 2026 (Jun 2026)" or "(Jun 2026)"
        let start = str.indexOf("(") + 1;
        let end = str.indexOf(")");
        if (start > 0 && end > start) {
            let inside = str.substring(start, end).trim();
            let parts = inside.split(/\s+/);
            if (parts.length >= 2) {
                qtr.name = parts[0].substr(0, 3) + " " + parts[1];
                qtr.month = parts[0].substr(0, 3);
                qtr.year = parts[1];
                return qtr;
            }
        }

        // 2. Format: "Jun 2026" or "June 2026"
        let m = str.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i);
        if (m) {
            let mon = m[1].substr(0, 3);
            mon = mon.charAt(0).toUpperCase() + mon.substr(1).toLowerCase();
            qtr.name = mon + " " + m[2];
            qtr.month = mon;
            qtr.year = m[2];
            return qtr;
        }

        // 3. Format: "FQ1 2026" or "Q1 2026"
        let qm = str.match(/\b(?:FQ|Q)([1-4])\s+(\d{4})\b/i);
        if (qm) {
            const quarterMonths = { "1": "Mar", "2": "Jun", "3": "Sep", "4": "Dec" };
            let mon = quarterMonths[qm[1]] || "Mar";
            qtr.name = mon + " " + qm[2];
            qtr.month = mon;
            qtr.year = qm[2];
            return qtr;
        }

        return qtr;
    }

    static parseQtrEps(epsStr, surpriseStr) {
        let eps = { eps: undefined };
        if (!epsStr || epsStr === "" || epsStr === "-") return eps;
        let clean = epsStr.replace(/[\$\,]/g, "");
        let val = parseFloat(clean);
        eps.eps = isNaN(val) ? undefined : val;
        if (
            isDefined(surpriseStr) &&
            surpriseStr !== "-" &&
            isDefined(eps.eps)
        ) {
            let cleanSurp = surpriseStr.replace(/[\$\,%]/g, "");
            let surpVal = parseFloat(cleanSurp);
            if (!isNaN(surpVal)) {
                eps.surprisePerf = SAQarter.calculateSurprisePercent(
                    surpVal,
                    eps.eps
                );
            }
        }
        return eps;
    }

    static parseQtrRev(revStr, surpriseStr) {
        let rev = { rev: 0 };
        rev.rev = SAQarter.revenueStringToFloat(revStr) || 0;
        if (
            isDefined(surpriseStr) &&
            surpriseStr !== "-" &&
            isDefined(rev.rev)
        ) {
            let surpFloat = SAQarter.revenueStringToFloat(surpriseStr);
            if (isDefined(surpFloat)) {
                rev.surprisePerf = SAQarter.calculateSurprisePercent(
                    surpFloat,
                    rev.rev
                );
            }
        }
        return rev;
    }

    static calculateSurprisePercent(surprise, measure) {
        if (!isDefined(surprise) || !isDefined(measure) || isNaN(surprise) || isNaN(measure)) {
            return undefined;
        }
        let projected = measure - surprise;
        let surprisePercent = calculatePercentChange(measure, projected);
        return surprisePercent;
    }

    static revenueStringToFloat(revStr) {
        return revenueStringToFloat(revStr);
    }
}

class ZAQarter extends Quarter {
    constructor(dateStr, nameStr, epsStr, epsSurpriseStr, revData) {
        super();
        const nameAttr = ZAQarter.parseQtrName(nameStr || "");
        this.date = dateStr || "-";
        this.name = nameAttr.name;
        this.month = nameAttr.month;
        this.year = parseInt(nameAttr.year) || 0;
        this.eps = ZAQarter.parseQtrEps(epsStr || "0", epsSurpriseStr || "");
        this.rev = ZAQarter.parseQtrRev(nameStr || "", revData || []);
    }

    static parseQtrName(str) {
        let qtr = { name: "-", month: "-", year: 0 };
        if (!str || typeof str !== "string") return qtr;
        let parts = str.split("/");
        if (parts.length >= 2) {
            let month = parseInt(parts[0]);
            let year = parseInt(parts[1]);
            if (!isNaN(month) && !isNaN(year)) {
                qtr.name = (MONTH_MAP[month] || "Jan") + " " + year;
                qtr.month = MONTH_MAP[month] || "Jan";
                qtr.year = year;
            }
        }
        return qtr;
    }

    static parseQtrEps(epsStr, epsSurpriseStr) {
        let eps = { eps: 0 };
        if (epsStr) {
            let clean = epsStr.replace(/[\$\,]/g, "");
            let val = parseFloat(clean);
            eps.eps = isNaN(val) ? 0 : val;
        }

        if (isDefined(epsSurpriseStr) && typeof epsSurpriseStr === "string") {
            const strippedStr = epsSurpriseStr.replace(/<[^>]+>/g, '');
            const match = strippedStr.match(/([-+]?[\d,]+\.?\d*)%?/);
            if (match) {
                const cleanedStr = match[1].replace(/[,|%]/g, '');
                let surpVal = parseFloat(cleanedStr);
                eps.surprisePerf = isNaN(surpVal) ? undefined : Math.round(surpVal);
            }
        }
        return eps;
    }

    static parseQtrRev(period, revData) {
        let rev = { rev: 0 };
        if (!revData || !Array.isArray(revData)) return rev;
        revData.forEach(function (item) {
            if (item && item[1] === period && item[3]) {
                let clean = item[3].replace(/[\$\,]/g, "");
                let val = parseFloat(clean);
                if (!isNaN(val)) {
                    rev.rev = Math.round(val * 10) / 10;
                }

                if (isDefined(item[5]) && typeof item[5] === "string" && item[5].indexOf(">") > -1) {
                    let revSurprise = item[5]
                        .substr(item[5].indexOf(">") + 1)
                        .replace(/<[^>]+>/g, '')
                        .replace(/[%]/g, '');
                    let surpVal = parseFloat(revSurprise);
                    if (!isNaN(surpVal)) {
                        rev.surprisePerf = Math.round(surpVal);
                    }
                }
            }
        });
        return rev;
    }
}

class YFQarter extends Quarter {
    constructor(ecItem, qFcList = []) {
        super();
        if (!ecItem) return;
        const dateLabel = ecItem.date || "";
        const periodEnd = (ecItem.periodEndDate && ecItem.periodEndDate.fmt) ? ecItem.periodEndDate.fmt : "";
        const reportedDate = (ecItem.reportedDate && ecItem.reportedDate.fmt) ? ecItem.reportedDate.fmt : "";
        
        let monthStr = "Mar";
        let yearNum = 2025;
        if (periodEnd) {
            const parts = periodEnd.split("-");
            if (parts.length >= 2) {
                yearNum = parseInt(parts[0]) || 2025;
                const mInt = parseInt(parts[1]) || 3;
                monthStr = MONTH_MAP[mInt] || "Mar";
            }
        } else if (dateLabel.length >= 6) {
            const qNum = dateLabel.charAt(0);
            yearNum = parseInt(dateLabel.substring(2)) || 2025;
            const qMonths = { "1": "Mar", "2": "Jun", "3": "Sep", "4": "Dec" };
            monthStr = qMonths[qNum] || "Mar";
        }
        
        this.date = reportedDate || periodEnd || dateLabel || "-";
        this.name = monthStr + " " + yearNum;
        this.month = monthStr;
        this.year = yearNum;
        
        let actualEps = (ecItem.actual && isDefined(ecItem.actual.raw)) ? ecItem.actual.raw : undefined;
        let surpriseVal = undefined;
        if (isDefined(ecItem.surprisePct)) {
            let sFloat = parseFloat(ecItem.surprisePct);
            if (!isNaN(sFloat)) {
                surpriseVal = Math.round(sFloat);
            }
        }
        this.eps = {
            eps: actualEps,
            surprisePerf: surpriseVal
        };
        
        let revMil = undefined;
        if (Array.isArray(qFcList)) {
            const match = qFcList.find(f => 
                f && (f.date === dateLabel || (ecItem.fiscalQuarter && f.fiscalQuarter === ecItem.fiscalQuarter))
            );
            if (match && match.revenue && isDefined(match.revenue.raw)) {
                revMil = Math.round(match.revenue.raw / 1e6 * 10) / 10;
            }
        }
        this.rev = {
            rev: revMil
        };
    }
}

class Year {
    constructor(year, name, eps, rev) {
        this.year = year;
        this.name = name;
        this.eps = eps;
        this.rev = rev;
    }
}
