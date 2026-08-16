function hideNativeContent() {
    try {
        let waiting = document.querySelector("#ht-waiting");
        if (!waiting) return;
        let elem = waiting.nextElementSibling;
        while (elem) {
            hide(elem);
            elem = elem.nextElementSibling;
        }
    } catch (e) {
        console.warn("hideNativeContent error", e);
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
        if (cells.length > 0 && cells[0] !== "") {
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
        let val = parseFloat(revStr);
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
    } else {
        res = ZA_REGEX.exec(url);
        if (res != null) {
            return res[1].toUpperCase();
        }
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
    if (ds_type === 1) return new SAParser(html);
    else if (ds_type === 2) return new ZAParser(html);
    else return new FallbackParser(html);
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
            console.warn("SAParser failed to parse HTML", e);
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
                : document;
            
            const monthYearRegex = /^[A-Za-z]{3} \d{4}/;
            let blocks = dom.querySelectorAll('[data-test-id="table-body"], [data-test-id*="table"], tbody, [role="rowgroup"], div[class*="table"]');
            
            let dataBlockCount = 1;
            blocks.forEach((block) => {
                if (block.textContent && (block.textContent.startsWith('FY') || block.textContent.includes('Fiscal Year'))) {
                    return; 
                }
                let rows = collectChildText(block);
                if (!rows || rows.length === 0) return;

                switch (dataBlockCount) {
                    case 1:
                        for (const row of rows) {
                            if (
                                !isDefined(row[0]) ||
                                row[0] == "" ||
                                row[0].match(monthYearRegex) == null
                            )
                                continue;
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
                            if (
                                !isDefined(row[0]) ||
                                row[0] == "" ||
                                row[0].match(monthYearRegex) == null
                            )
                                continue;
                            let yearInt = getAnnualEstimateYear(row[0]);
                            const foundYear = annualData.find(
                                (q) => q.year == yearInt
                            );
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
            });
        } catch (err) {
            console.warn("SAParser.parse error", err);
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
            this.annualData = undefined;
        } catch (e) {
            console.warn("ZAParser failed to parse HTML", e);
            this.qtrData = [];
            this.annualData = undefined;
        }
    }

    static parse(html = undefined) {
        const quarterlyData = [], annualData = [];
        try {
            const parser = new DOMParser();
            let dom = isDefined(html)
                ? parser.parseFromString(html, "text/html")
                : document;
            
            let jsonStr = "";
            const rawText = isDefined(html) ? html : (dom.documentElement ? dom.documentElement.innerHTML : "");
            
            const objDataMatch = rawText.match(/document\.obj_data\s*=\s*(\{[\s\S]*?\});\s*(?:document|\n|\$|<\/script>)/);
            if (objDataMatch) {
                jsonStr = objDataMatch[1];
            } else {
                const tabsElem = dom.querySelector("#earnings_announcements_tabs");
                if (tabsElem && tabsElem.nextElementSibling) {
                    let scriptText = tabsElem.nextElementSibling.innerHTML.trim();
                    let start = scriptText.indexOf("{");
                    if (start !== -1) {
                        let braceCount = 0;
                        let end = -1;
                        for (let i = start; i < scriptText.length; i++) {
                            if (scriptText[i] === '{') braceCount++;
                            else if (scriptText[i] === '}') {
                                braceCount--;
                                if (braceCount === 0) {
                                    end = i;
                                    break;
                                }
                            }
                        }
                        if (end !== -1) {
                            jsonStr = scriptText.substring(start, end + 1);
                        }
                    }
                }
            }

            if (!jsonStr) {
                return [quarterlyData, undefined];
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
            console.warn("ZAParser.parse error", err);
        }
        return [quarterlyData, undefined];
    }
}

class Quarter {
    constructor() {}
}

class SAQarter extends Quarter {
    constructor(cells) {
        super();
        if (!cells || cells.length < 4) return;
        const nameAttr = SAQarter.parseQtrName(cells[0] || "");
        this.name = nameAttr.name;
        this.month = nameAttr.month;
        this.year = parseInt(nameAttr.year) || 0;
        this.eps = SAQarter.parseQtrEps(cells[1], cells[2]);
        this.rev = SAQarter.parseQtrRev(cells[3], cells[5]);
    }

    static parseQtrName(str) {
        let qtr = { name: "-", month: "-", year: "0" };
        if (!str || typeof str !== "string") return qtr;
        let start = str.indexOf("(") + 1;
        let end = str.indexOf(")");
        if (start > 0 && end > start) {
            qtr.name = str.substring(start, end);
            qtr.month = qtr.name.substr(0, 3);
            qtr.year = qtr.name.substr(4);
        }
        return qtr;
    }

    static parseQtrEps(epsStr, surpriseStr) {
        let eps = { eps: undefined };
        if (!epsStr || epsStr === "" || epsStr === "-") return eps;
        let val = parseFloat(epsStr);
        eps.eps = isNaN(val) ? undefined : val;
        if (
            isDefined(surpriseStr) &&
            surpriseStr !== "-" &&
            isDefined(eps.eps)
        ) {
            let surpVal = parseFloat(surpriseStr);
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

class Year {
    constructor(year, name, eps, rev) {
        this.year = year;
        this.name = name;
        this.eps = eps;
        this.rev = rev;
    }
}
