var fetch_fundamental_data = true;
var show_earnings_only = false;
var chart_type = CHART_TYPE.TRADINGVIEW;
var show_earnings_surprise = true;
var default_ds = 1;
var default_theme = "dark";
var ms_style_output = true;
var limit_num_qtr = true;

var quarterlyData = [];
var annualData = [];
var fundamentals = {};

let overwrite_qtr_data = undefined;
let pageDs = 1;
let currentBarTab = "quarterly";
let currentTvInterval = "D";

// Detect current site automatically
function detectSiteDataSource(fallbackDs = 1) {
    if (typeof window === "undefined" || !window.location || !window.location.hostname) {
        return fallbackDs;
    }
    const host = window.location.hostname.toLowerCase();
    if (host.includes("zacks.com")) {
        return 2;
    } else if (host.includes("seekingalpha.com")) {
        return 1;
    } else if (host.includes("yahoo.com")) {
        return 3;
    }
    return fallbackDs;
}

if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(
        [
            "chart_type",
            "show_earnings_only",
            "show_earnings_surprise",
            "ms_style_output",
            "limit_num_qtr",
            "default_ds",
            "theme",
        ],
        function (options) {
            if (!options) options = {};
            if (isDefined(options.show_earnings_only)) {
                show_earnings_only = options.show_earnings_only;
                fetch_fundamental_data = !options.show_earnings_only;
            }
            if (isDefined(options.chart_type) && options.chart_type != CHART_TYPE.NONE) {
                chart_type = options.chart_type;
            } else if (isDefined(options.chart_type) && options.chart_type == CHART_TYPE.NONE && options.show_earnings_only) {
                chart_type = CHART_TYPE.NONE;
            } else {
                chart_type = CHART_TYPE.TRADINGVIEW;
            }
            if (isDefined(options.show_earnings_surprise))
                show_earnings_surprise = options.show_earnings_surprise;
            if (isDefined(options.default_ds)) default_ds = options.default_ds;
            if (isDefined(options.theme)) default_theme = options.theme;
            if (isDefined(options.ms_style_output))
                ms_style_output = options.ms_style_output;
            if (isDefined(options.limit_num_qtr))
                limit_num_qtr = options.limit_num_qtr;

            insertCSS();
            displayWaiting();

            pageDs = detectSiteDataSource(default_ds);
            const symbol = getSymbol(window.location.href);

            if (fetch_fundamental_data && symbol) {
                chrome.runtime.sendMessage(
                    {
                        command: "fetch_fundamentals",
                        symbol: symbol,
                        chart_type: chart_type,
                    },
                    (response) => {
                        if (response && !response.error) {
                            extractFundamentalData(response, fundamentals);
                            pushFundamentalsData();
                            waitForEl(
                                "#ht-root-container",
                                pushFundamentalsData,
                                25
                            );
                        }
                    }
                );
            }

            const currentHost = window.location.hostname.toLowerCase();
            const isZacks = currentHost.includes("zacks.com");
            const isSA = currentHost.includes("seekingalpha.com");
            const isYahoo = currentHost.includes("yahoo.com");

            const handleQuarterlyResponse = (response) => {
                if (
                    response &&
                    !response.error &&
                    isDefined(response.raw) &&
                    response.raw.length > 0
                ) {
                    const parser = getParser(0, response.raw);
                    if (parser && parser.qtrData && parser.qtrData.length > 0) {
                        overwrite_qtr_data = parser.qtrData;
                        if (parser.annualData && parser.annualData.length > 0 && annualData.length === 0) {
                            annualData = parser.annualData;
                        }
                        displayEarnings(true, pageDs);
                    }
                }
            };

            if (isZacks) {
                // On Zacks: poll for obj_data in scripts / DOM
                waitForZacksData((found) => {
                    if (found) {
                        displayEarnings(true, 2);
                    } else if (symbol) {
                        chrome.runtime.sendMessage(
                            { command: "fetch_quarterly_data", symbol: symbol },
                            handleQuarterlyResponse
                        );
                    }
                }, 40);
            } else if (isSA) {
                // On Seeking Alpha: request background fallback data immediately
                if (symbol) {
                    chrome.runtime.sendMessage(
                        { command: "fetch_quarterly_data", symbol: symbol },
                        handleQuarterlyResponse
                    );
                }
                // Also wait for Seeking Alpha page data if present
                waitForEarningsData((found) => {
                    displayEarnings(found, 1);
                }, 30);
            } else if (isYahoo) {
                // On Yahoo Finance: check page scripts first
                let yf = new YFParser();
                if (yf && yf.qtrData && yf.qtrData.length > 0) {
                    overwrite_qtr_data = yf.qtrData;
                    if (yf.annualData && yf.annualData.length > 0) {
                        annualData = yf.annualData;
                    }
                    displayEarnings(true, 3);
                } else {
                    waitForYFData((found) => {
                        if (found) {
                            displayEarnings(true, 3);
                        } else if (symbol) {
                            chrome.runtime.sendMessage(
                                { command: "fetch_quarterly_data", symbol: symbol },
                                handleQuarterlyResponse
                            );
                        }
                    }, 30);
                }
            } else {
                // Fallback for any other pages
                if (symbol) {
                    chrome.runtime.sendMessage(
                        { command: "fetch_quarterly_data", symbol: symbol },
                        handleQuarterlyResponse
                    );
                }
                displayEarnings(true, pageDs);
            }

            // listen for option updates
            chrome.runtime.onMessage.addListener(
                (request, sender, sendResponse) => {
                    if (request && request.theme) {
                        const root = document.getElementById("ht-root-container");
                        if (root) {
                            if (request.theme == "dark")
                                root.classList.add("ht-dark-theme");
                            else
                                root.classList.remove("ht-dark-theme");
                        }
                    }
                }
            );
        }
    );
}

function waitForZacksData(callback, maxtries = 40, interval = 100) {
    const poller = setInterval(() => {
        let isReady = false;
        try {
            const parser = new ZAParser();
            if (parser && parser.qtrData && parser.qtrData.length > 0) {
                isReady = true;
            }
        } catch (e) {}

        const retry = maxtries === false || maxtries-- > 0;
        if (retry && !isReady) return;
        clearInterval(poller);
        callback(isReady);
    }, interval);
}

function waitForYFData(callback, maxtries = 30, interval = 100) {
    const poller = setInterval(() => {
        let isReady = false;
        try {
            const parser = new YFParser();
            if (parser && parser.qtrData && parser.qtrData.length > 0) {
                isReady = true;
            }
        } catch (e) {}

        const retry = maxtries === false || maxtries-- > 0;
        if (retry && !isReady) return;
        clearInterval(poller);
        callback(isReady);
    }, interval);
}

function waitForEarningsData(callback, maxtries = 30, interval = 100) {
    const poller = setInterval(() => {
        const isContains =
            contains("h2", "FQ") ||
            contains("table", "Earnings") ||
            contains("div", "Earnings") ||
            contains("table", "FQ");
        const retry = maxtries === false || maxtries-- > 0;
        if (retry && !isContains) return;
        clearInterval(poller);
        setTimeout(function () {
            callback(isContains);
        }, 800);
    }, interval);
}

function waitForEl(el, callback, maxtries = false, interval = 200) {
    const poller = setInterval(() => {
        const isContains = document.querySelector(el);
        const retry = maxtries === false || maxtries-- > 0;
        if (retry && !isContains) return;
        clearInterval(poller);
        callback(isContains);
    }, interval);
}

function renderSvgBarChart(items, isCurrency = false) {
    if (!items || items.length === 0) {
        return '<svg width="100%" height="130"><text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-size="11">No data</text></svg>';
    }

    const validVals = items.filter(it => it && it.val !== null && !isNaN(it.val)).map(it => it.val);
    if (validVals.length === 0) {
        return '<svg width="100%" height="130"><text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-size="11">No data</text></svg>';
    }

    const maxVal = Math.max(Math.max(...validVals), 0);
    const minVal = Math.min(Math.min(...validVals), 0);

    const svgW = 280;
    const svgH = 130;
    const padTop = 22;
    const padBottom = 28;
    const chartH = svgH - padTop - padBottom;

    const valRange = (maxVal - minVal) > 0 ? (maxVal - minVal) : 1.0;
    const zeroY = padTop + (maxVal / valRange) * chartH;

    const n = items.length;
    const barWidth = Math.max(Math.min(svgW / (n * 1.6), 24), 10);
    const step = svgW / n;

    let svg = `<svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<line x1="0" y1="${zeroY.toFixed(1)}" x2="${svgW}" y2="${zeroY.toFixed(1)}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`;

    for (let i = 0; i < n; i++) {
        const item = items[i];
        if (!item || item.val === null || isNaN(item.val)) continue;

        const cx = i * step + step / 2;
        const bx = cx - barWidth / 2;
        const val = item.val;
        const display = item.displayVal || val.toString();
        const lbl = item.label || "";

        let barH = (Math.abs(val) / valRange) * chartH;
        if (barH < 2) barH = 2;

        let by = 0;
        let fill = "#38bdf8";
        let ty = 0;

        if (val >= 0) {
            by = zeroY - barH;
            fill = "#38bdf8";
            ty = by - 4;
        } else {
            by = zeroY;
            fill = "#f43f5e";
            ty = by + barH + 11;
        }

        svg += `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barH.toFixed(1)}" rx="2" fill="${fill}" opacity="0.9"/>`;
        svg += `<text x="${cx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" fill="#e2e8f0" font-size="9" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="600">${display}</text>`;
        svg += `<text x="${cx.toFixed(1)}" y="${svgH - 6}" text-anchor="middle" fill="#64748b" font-size="8.5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" transform="rotate(-35, ${cx.toFixed(1)}, ${svgH - 6})">${lbl}</text>`;
    }

    svg += '</svg>';
    return svg;
}

function updateEarningsBarCharts(barTab = "quarterly") {
    currentBarTab = barTab;
    const epsContainer = document.getElementById("ht-eps-bars-container");
    const salesContainer = document.getElementById("ht-sales-bars-container");
    const salesTitleRight = document.querySelector(".ht-bars-title-right");

    let epsItems = [];
    let salesItems = [];
    let inBillions = false;

    if (barTab === "quarterly") {
        const qtrs = (quarterlyData && quarterlyData.length > 0)
            ? quarterlyData.slice(Math.max(0, quarterlyData.length - 8))
            : [];

        const maxSales = Math.max(...qtrs.map(q => (q && q.rev && isDefined(q.rev.rev)) ? q.rev.rev : 0), 0);
        inBillions = maxSales >= 1000;

        qtrs.forEach(q => {
            if (!q) return;
            const qtrLbl = getDisplayQuarter(q.name);

            let epsVal = (q.eps && isDefined(q.eps.eps)) ? q.eps.eps : null;
            let epsDisplay = epsVal !== null ? epsVal.toString() : "-";
            epsItems.push({ label: qtrLbl, val: epsVal, displayVal: epsDisplay });

            let revVal = (q.rev && isDefined(q.rev.rev)) ? q.rev.rev : null;
            let revDisplay = "-";
            let chartVal = revVal;
            if (revVal !== null) {
                if (inBillions) {
                    chartVal = +(revVal / 1000).toFixed(2);
                    revDisplay = chartVal.toString();
                } else {
                    revDisplay = numberWithCommas(revVal);
                }
            }
            salesItems.push({ label: qtrLbl, val: chartVal, displayVal: revDisplay });
        });
    } else {
        const years = (annualData && annualData.length > 0)
            ? annualData.slice(Math.max(0, annualData.length - 8))
            : [];

        const maxSales = Math.max(...years.map(y => (y && isDefined(y.rev)) ? y.rev : 0), 0);
        inBillions = maxSales >= 1000;

        years.forEach(y => {
            if (!y) return;
            const yrLbl = (y.name || y.year || "").toString().replace("*", "");

            let epsVal = isDefined(y.eps) ? parseFloat(y.eps) : null;
            let epsDisplay = epsVal !== null && !isNaN(epsVal) ? epsVal.toFixed(2) : "-";
            epsItems.push({ label: yrLbl, val: isNaN(epsVal) ? null : epsVal, displayVal: epsDisplay });

            let revVal = isDefined(y.rev) ? parseFloat(y.rev) : null;
            let revDisplay = "-";
            let chartVal = revVal;
            if (revVal !== null && !isNaN(revVal)) {
                if (inBillions) {
                    chartVal = +(revVal / 1000).toFixed(2);
                    revDisplay = chartVal.toString();
                } else {
                    revDisplay = numberWithCommas(revVal);
                }
            }
            salesItems.push({ label: yrLbl, val: isNaN(chartVal) ? null : chartVal, displayVal: revDisplay });
        });
    }

    if (salesTitleRight) {
        salesTitleRight.textContent = inBillions ? "Sales (B)" : "Sales ($M)";
    }

    if (epsContainer) {
        epsContainer.innerHTML = renderSvgBarChart(epsItems, false);
    }
    if (salesContainer) {
        salesContainer.innerHTML = renderSvgBarChart(salesItems, true);
    }
}

function renderTradingViewChart(symbol, interval = currentTvInterval) {
    if (!symbol) {
        symbol = fundamentals.ticker || getSymbol(window.location.href);
    }
    if (!symbol) return;

    currentTvInterval = interval;
    const cleanSym = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");

    const displayElem = document.getElementById("ht-tv-symbol-display");
    if (displayElem) {
        displayElem.textContent = `${cleanSym} · TradingView Chart`;
    }

    const linkElem = document.getElementById("ht-tv-external-link");
    if (linkElem) {
        linkElem.href = `https://www.tradingview.com/symbols/${cleanSym}/`;
    }

    const wrapper = document.getElementById("ht-tv-iframe-wrapper");
    if (wrapper) {
        const existingIframe = document.getElementById("ht-tv-iframe");
        const tvUrl = `https://s.tradingview.com/widgetembed/?symbol=${cleanSym}&interval=${interval}&symboledit=1&saveimage=1&toolbarbg=0b0e14&theme=dark&style=1&timezone=exchange&withdateranges=1&hideideas=1&studies=[]`;

        if (existingIframe && existingIframe.getAttribute("data-symbol") === cleanSym && existingIframe.getAttribute("data-interval") === interval) {
            return;
        }

        wrapper.innerHTML = `<iframe id="ht-tv-iframe" data-symbol="${cleanSym}" data-interval="${interval}" src="${tvUrl}" frameborder="0" allowtransparency="true" scrolling="no" style="width: 100%; height: 100%; min-height: 550px; border: none; display: block;"></iframe>`;
    }
}

function attachEventHandlers() {
    // Deep-dive tabs
    const tabBtns = document.querySelectorAll(".ht-tab-btn");
    tabBtns.forEach(btn => {
        btn.onclick = function () {
            tabBtns.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            const target = this.getAttribute("data-tab");
            document.querySelectorAll(".ht-tab-content").forEach(c => c.style.display = "none");
            const activeContent = document.getElementById("ht-tab-" + target);
            if (activeContent) activeContent.style.display = "block";
        };
    });

    // Bar chart tabs
    const barTabs = document.querySelectorAll(".ht-bar-tab");
    barTabs.forEach(tab => {
        tab.onclick = function () {
            barTabs.forEach(t => t.classList.remove("active"));
            this.classList.add("active");
            const bartab = this.getAttribute("data-bartab") || "quarterly";
            updateEarningsBarCharts(bartab);
        };
    });

    // TradingView timeframe buttons
    const tfBtns = document.querySelectorAll(".ht-tf-btn");
    tfBtns.forEach(btn => {
        btn.onclick = function () {
            tfBtns.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            const interval = this.getAttribute("data-interval") || "D";
            renderTradingViewChart(null, interval);
        };
    });

    // Description toggle
    const toggle = document.getElementById("ht-desc-toggle");
    const desc = document.getElementById("ht-description");
    if (toggle && desc) {
        toggle.onclick = function () {
            if (desc.classList.contains("expanded")) {
                desc.classList.remove("expanded");
                toggle.textContent = "▾";
                toggle.title = "Expand description";
            } else {
                desc.classList.add("expanded");
                toggle.textContent = "▴";
                toggle.title = "Collapse description";
            }
        };
    }
}

function pushFundamentalsData(found = true) {
    if (!found) return;
    if (!isDefined(fundamentals.ticker) || fundamentals.ticker === "") return;

    // Profile Card Header
    const tickerBadge = document.getElementById("ht-ticker-badge");
    if (tickerBadge) tickerBadge.textContent = fundamentals.ticker || "-";

    const compNameElem = document.getElementById("ht-company-name");
    if (compNameElem) {
        if (fundamentals.companySite) {
            compNameElem.innerHTML = `<a href="${fundamentals.companySite}" target="_blank" style="color: inherit; text-decoration: none;">${fundamentals.companyName || ''}</a>`;
        } else {
            compNameElem.textContent = fundamentals.companyName || "";
        }
    }

    const priceElem = document.getElementById("ht-current-price");
    if (priceElem) priceElem.textContent = fundamentals.price ? `$${fundamentals.price}` : "-";

    const chgElem = document.getElementById("ht-price-change");
    if (chgElem) {
        const chg = fundamentals.change || "-";
        chgElem.textContent = chg;
        chgElem.className = "";
        if (chg.startsWith("+")) chgElem.classList.add("pos");
        else if (chg.startsWith("-")) chgElem.classList.add("neg");
    }

    // Pills
    const pillsElem = document.getElementById("ht-tag-pills");
    if (pillsElem) {
        let pills = [];
        if (fundamentals.industry && fundamentals.industry !== "-") pills.push(fundamentals.industry);
        if (fundamentals.sector && fundamentals.sector !== "-") pills.push(fundamentals.sector);
        if (fundamentals.country && fundamentals.country !== "-") pills.push(fundamentals.country);
        if (fundamentals.mktcap && fundamentals.mktcap !== "-") pills.push(`${fundamentals.mktcap} Cap`);
        pillsElem.innerHTML = pills.map(p => `<span class="ht-pill">${p}</span>`).join("");
    }

    // Sector Line
    const secElem = document.getElementById("ht-sector-line");
    if (secElem) {
        let secParts = [];
        if (fundamentals.sector && fundamentals.sector !== "-") secParts.push(fundamentals.sector);
        if (fundamentals.industry && fundamentals.industry !== "-") secParts.push(fundamentals.industry);
        if (fundamentals.country && fundamentals.country !== "-") secParts.push(fundamentals.country);
        if (fundamentals.mktcap && fundamentals.mktcap !== "-") secParts.push(`Mkt cap ${fundamentals.mktcap}`);
        secElem.textContent = secParts.join(" | ") || "-";
    }

    // Description
    const descElem = document.getElementById("ht-description");
    if (descElem) {
        descElem.textContent = fundamentals.description || "No company description available.";
    }

    // 3-Column Metrics Grid
    const setMetric = (id, val, addClass) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = val || "-";
            if (addClass) el.className = `ht-m-val ${addClass}`;
        }
    };

    let earnDisplay = fundamentals.earnings || "-";
    if (fundamentals.daysToEarnings && earnDisplay !== "-") {
        earnDisplay += ` · ${fundamentals.daysToEarnings}d`;
    }
    setMetric("ht-m-earnings", earnDisplay, isEarningsDateClose(fundamentals.earnings, fundamentals.daysToEarnings) ? "learnings" : "");
    setMetric("ht-m-adr", fundamentals.adr, isAdrLow(fundamentals.adr) ? "ladr" : "");
    setMetric("ht-m-atr", fundamentals.atr);
    setMetric("ht-m-sma", (fundamentals.sma50 || "-") + " / " + (fundamentals.sma200 || "-"));
    setMetric("ht-m-perf", (fundamentals.perfMonth || "-") + " / " + (fundamentals.perfQuarter || "-"));

    setMetric("ht-m-relvol", fundamentals.relvolume ? (fundamentals.relvolume.toString().endsWith("x") ? fundamentals.relvolume : `${fundamentals.relvolume}x`) : "-");
    setMetric("ht-m-vol", fundamentals.volume);
    setMetric("ht-m-avgvol", fundamentals.avgvolume ? `${fundamentals.avgvolume}/d` : "-");
    setMetric("ht-m-52w", fundamentals.range52w);
    setMetric("ht-m-mktcap", fundamentals.mktcap);

    setMetric("ht-m-float", fundamentals.float);
    setMetric("ht-m-short", fundamentals.shorts, isShortInterestHigh(fundamentals.shorts) ? "hshorts" : "");
    setMetric("ht-m-dtc", fundamentals.daystocover);
    setMetric("ht-m-pe", fundamentals.pe);
    setMetric("ht-m-ps", fundamentals.ps);

    // Deep-Dive: Profitability Tab
    const setProf = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || "-";
    };
    setProf("ht-prof-gross", fundamentals.grossMargin);
    setProf("ht-prof-oper", fundamentals.operMargin);
    setProf("ht-prof-net", fundamentals.profitMargin);
    setProf("ht-prof-roe", fundamentals.roe);
    setProf("ht-prof-roa", fundamentals.roa);
    setProf("ht-prof-ps", fundamentals.ps);

    setProf("ht-prof-roi", fundamentals.roi);
    setProf("ht-prof-fwdpe", fundamentals.fwdPe);
    setProf("ht-prof-dtc", fundamentals.daystocover);
    setProf("ht-prof-instown", fundamentals.instown);

    // Deep-Dive: Institutions Tab
    setProf("ht-inst-own-val", fundamentals.instown);
    setProf("ht-inst-trans-val", fundamentals.instchange);
    setProf("ht-inst-float-val", fundamentals.float);
    setProf("ht-inst-short-val", fundamentals.shorts);
    setProf("ht-inst-dtc-val", fundamentals.daystocover);

    // Deep-Dive: Insiders Tab
    const insElem = document.getElementById("ht-insiders-cell");
    if (insElem) {
        insElem.innerHTML = fundamentals.insidersHtml || "No insider transactions";
    }

    // Deep-Dive: News Tab
    const newsElem = document.getElementById("ht-news-cell");
    if (newsElem) {
        newsElem.innerHTML = fundamentals.newsHtml || "No news";
    }

    // Event handlers
    attachEventHandlers();

    // Render TradingView Chart
    renderTradingViewChart(fundamentals.ticker || getSymbol(window.location.href));
}

function displayEarnings(isContains, dsToUse = pageDs) {
    extractAndProcessEarningsData(dsToUse);

    const noEarningsMsg = document.getElementById("ht-msg-noearnings");
    if (quarterlyData.length > 0 || annualData.length > 0 || isDefined(fundamentals.ticker)) {
        if (noEarningsMsg) noEarningsMsg.remove();
    }

    if (document.getElementById("ht-root-container") == null) {
        if (quarterlyData.length == 0 && annualData.length == 0) {
            hide(document.getElementById("ht-waiting"));
            if (isDefined(fundamentals.ticker) && fundamentals.ticker !== "") {
                insertHTML();
                pushFundamentalsData();
                pushEarningsData();
                hideNativeContent();
            } else {
                if (!document.getElementById("ht-msg-noearnings")) {
                    bodyPrepend(
                        '<div id="ht-msg-noearnings">No earnings data available for this symbol.</div>'
                    );
                }
            }
        } else {
            insertHTML();
            pushEarningsData();
            pushFundamentalsData();
            hideNativeContent();
        }
    } else {
        pushEarningsData();
        pushFundamentalsData();
    }
}

function pushEarningsData() {
    hide(document.getElementById("ht-waiting-earnings"));
    const yElem = document.getElementById("ht-earnings-yearly");
    if (yElem) yElem.innerHTML = annualToHtml(annualData);
    const qElem = document.getElementById("ht-earnings-quarterly");
    if (qElem) qElem.innerHTML = quarterlyToHtml(quarterlyData);

    updateEarningsBarCharts(currentBarTab);
    attachEventHandlers();
    renderTradingViewChart(fundamentals.ticker || getSymbol(window.location.href));
}

function displayWaiting() {
    if (!document.getElementById("ht-waiting")) {
        bodyPrepend(
            '<div id="ht-waiting"><p class="ht-loadingmsg">Waiting for data</p></div>'
        );
    }
}

function insertCSS() {
    const showChart = fetch_fundamental_data && chart_type != CHART_TYPE.NONE;
    headPrepend(CSS(showChart));
}

function insertHTML() {
    hide(document.querySelector("#ht-waiting"));
    let html = "";
    const showEarningsOnly = !fetch_fundamental_data;
    if (showEarningsOnly) {
        html = HTML_EARNINGS_ONLY(default_theme);
    } else {
        const showChart =
            fetch_fundamental_data && chart_type != CHART_TYPE.NONE;
        html = HTML(default_theme, showChart, show_earnings_surprise, chart_type);
    }
    bodyPrepend(html);
}

function quarterlyToHtml(quarterlyData) {
    if (!quarterlyData || quarterlyData.length == 0) {
        return `<table class="ht-earnings-table"><tbody><tr><td colspan="${show_earnings_surprise ? 7 : 5}" style="text-align: center; padding: 24px 10px; color: var(--text-muted); font-style: italic;">No quarterly earnings data available</td></tr></tbody></table>`;
    }

    const displayedQtrs = limit_num_qtr
        ? quarterlyData.slice(Math.max(0, quarterlyData.length - 8))
        : quarterlyData;

    const maxSales = Math.max(...displayedQtrs.map(q => (q && q.rev && isDefined(q.rev.rev)) ? q.rev.rev : 0), 0);
    const inBillions = maxSales >= 1000;
    const salesColHeader = inBillions ? "SALES(B)" : "SALES ($M)";

    let html = '<table class="ht-earnings-table">';
    if (show_earnings_surprise) {
        html += '<colgroup><col style="width: 16%;"><col style="width: 13%;"><col style="width: 13%;"><col style="width: 14%;"><col style="width: 16%;"><col style="width: 14%;"><col style="width: 14%;"></colgroup>';
        html += `<thead><tr><td>QUARTER</td><td>EPS</td><td>%CHG</td><td>SURP</td><td>${salesColHeader}</td><td>%CHG</td><td>SURP</td></tr></thead><tbody>`;
    } else {
        html += '<colgroup><col style="width: 20%;"><col style="width: 20%;"><col style="width: 20%;"><col style="width: 20%;"><col style="width: 20%;"></colgroup>';
        html += `<thead><tr><td>QUARTER</td><td>EPS</td><td>%CHG</td><td>${salesColHeader}</td><td>%CHG</td></tr></thead><tbody>`;
    }

    displayedQtrs.forEach(function (item) {
        if (!item) return;

        let epsPerf = "-";
        if (isDefined(item.eps) && isDefined(item.eps.perf)) {
            if (ms_style_output == true && item.eps.negativeCompQtr) {
                epsPerf = "N/A";
            } else {
                if (ms_style_output == true && item.eps.perf >= 1000) {
                    epsPerf = "999";
                } else {
                    epsPerf = item.eps.perf;
                }
                if (item.eps.perf > 0) {
                    epsPerf = "+" + epsPerf;
                }
                if (ms_style_output == true && item.eps.negativeTurnaround) {
                    epsPerf = "#" + epsPerf;
                }
                if (ms_style_output == true) {
                    epsPerf = epsPerf + "%";
                }
            }
        }
        let surpriseEpsPerf = "-";
        if (isDefined(item.eps) && isDefined(item.eps.surprisePerf)) {
            surpriseEpsPerf = item.eps.surprisePerf;
            if (item.eps.surprisePerf > 0) {
                surpriseEpsPerf = "+" + surpriseEpsPerf;
            }
            if (ms_style_output == true) {
                surpriseEpsPerf = surpriseEpsPerf + "%";
            }
        }
        let revPerf = "-";
        if (isDefined(item.rev) && isDefined(item.rev.perf)) {
            if (ms_style_output == true && item.rev.perf >= 1000) {
                revPerf = "999";
            } else {
                revPerf = item.rev.perf;
            }
            if (item.rev.perf > 0) {
                revPerf = "+" + revPerf;
            }
            if (ms_style_output == true) {
                revPerf = revPerf + "%";
            }
        }
        let surpriseRevPerf = "-";
        if (isDefined(item.rev) && isDefined(item.rev.surprisePerf)) {
            surpriseRevPerf = item.rev.surprisePerf;
            if (item.rev.surprisePerf > 0) {
                surpriseRevPerf = "+" + surpriseRevPerf;
            }
            if (ms_style_output == true) {
                surpriseRevPerf = surpriseRevPerf + "%";
            }
        }

        let salesDisplay = "-";
        if (item.rev && isDefined(item.rev.rev)) {
            salesDisplay = inBillions
                ? (item.rev.rev / 1000).toFixed(2)
                : numberWithCommas(item.rev.rev);
        }

        const dateTooltip = item.date ? ` title="Reported: ${item.date}"` : "";

        html += "<tr>";
        html += `<td${dateTooltip}>${getDisplayQuarter(item.name)}</td>`;
        html += `<td>${item.eps && isDefined(item.eps.eps) ? item.eps.eps : '-'}</td>`;
        html += `<td class="${getHighlightClass4Change(item.eps ? item.eps.perf : undefined, epsPerf)}">${epsPerf}</td>`;
        if (show_earnings_surprise) {
            html += `<td class="${getHighlightClass4Surprise(item.eps ? item.eps.surprisePerf : undefined, surpriseEpsPerf)}">${surpriseEpsPerf}</td>`;
        }
        html += `<td${dateTooltip}>${salesDisplay}</td>`;
        html += `<td class="${getHighlightClass4Change(item.rev ? item.rev.perf : undefined, revPerf)}">${revPerf}</td>`;
        if (show_earnings_surprise) {
            html += `<td class="${getHighlightClass4Surprise(item.rev ? item.rev.surprisePerf : undefined, surpriseRevPerf)}">${surpriseRevPerf}</td>`;
        }
        html += "</tr>";
    });
    html += "</tbody></table>";
    return html;
}

function annualToHtml(annualData) {
    if (!annualData || annualData.length == 0) {
        return '<table class="ht-earnings-table"><tbody><tr><td colspan="5" style="text-align: center; padding: 24px 10px; color: var(--text-muted); font-style: italic;">No annual earnings data available</td></tr></tbody></table>';
    }

    const maxSales = Math.max(...annualData.map(y => (y && isDefined(y.rev)) ? y.rev : 0), 0);
    const inBillions = maxSales >= 1000;
    const salesColHeader = inBillions ? "SALES(B)" : "SALES ($M)";

    let html = '<table class="ht-earnings-table">';
    html += '<colgroup><col style="width: 24%;"><col style="width: 18%;"><col style="width: 20%;"><col style="width: 20%;"><col style="width: 18%;"></colgroup>';
    html += `<thead><tr><td>FISCAL YEAR</td><td>EPS</td><td>%CHG</td><td>${salesColHeader}</td><td>%CHG</td></tr></thead><tbody>`;

    annualData.forEach(function (item) {
        if (!item) return;
        let yearlyEps = isDefined(item.eps) ? item.eps.toString() : "-";
        let yearlyRev = "-";
        if (isDefined(item.rev)) {
            yearlyRev = inBillions
                ? (item.rev / 1000).toFixed(2)
                : numberWithCommas(item.rev);
        }
        let epsPerf = "-";
        if (isDefined(item.epsPerf)) {
            epsPerf = item.epsPerf > 0 ? "+" + item.epsPerf : item.epsPerf;
            if (ms_style_output == true) epsPerf = epsPerf + "%";
        }
        let revPerf = "-";
        if (isDefined(item.revPerf)) {
            revPerf = item.revPerf > 0 ? "+" + item.revPerf : item.revPerf;
            if (ms_style_output == true) revPerf = revPerf + "%";
        }

        let isEst = item.name && item.name.toString().startsWith("*");
        html += `<tr><td ${isEst ? 'title="Estimated"' : ''}>${item.name || '-'}</td>`;
        html += `<td ${isEst ? 'title="Estimated"' : ''}>${yearlyEps}</td>`;
        html += `<td ${isEst ? 'title="Estimated"' : ''} class="${getHighlightClass4Change(item.epsPerf, epsPerf)}">${epsPerf}</td>`;
        html += `<td ${isEst ? 'title="Estimated"' : ''}>${yearlyRev}</td>`;
        html += `<td ${isEst ? 'title="Estimated"' : ''} class="${getHighlightClass4Change(item.revPerf, revPerf)}">${revPerf}</td></tr>`;
    });
    html += "</tbody></table>";
    return html;
}

function extractAndProcessEarningsData(ds = pageDs) {
    try {
        const parser = getParser(ds);
        if (parser) {
            if (isDefined(parser.qtrData) && parser.qtrData.length > 0) quarterlyData = parser.qtrData;
            if (isDefined(parser.annualData) && parser.annualData.length > 0) annualData = parser.annualData;
        }
        if (isDefined(overwrite_qtr_data) && overwrite_qtr_data.length > 0) {
            quarterlyData = overwrite_qtr_data;
        }

        calculateQuarterlyPerf(quarterlyData);
        fillAnnual(quarterlyData, annualData);
        calculateAnnualPerf(annualData);
    } catch (err) {
        console.warn("extractAndProcessEarningsData error", err);
    }
}

function calculateQuarterlyPerf(qrts) {
    if (!qrts || !Array.isArray(qrts)) return;
    qrts.map(function (qtr) {
        if (!qtr || !qtr.eps || !qtr.rev) return;
        let compQuarter = qrts.find(
            (q) => q && q.name == getComparativeQuarterName(qtr)
        );
        if (isDefined(compQuarter) && compQuarter.eps) {
            if (compQuarter.eps.eps != 0) {
                qtr.eps.negativeCompQtr = false;
                qtr.eps.negativeTurnaround = false;
                qtr.eps.perf = calculatePercentChange(
                    qtr.eps.eps,
                    compQuarter.eps.eps
                );
                if (qtr.eps.eps < 0 && compQuarter.eps.eps) {
                    qtr.eps.negativeCompQtr = true;
                } else if (compQuarter.eps.eps < 0) {
                    qtr.eps.negativeTurnaround = true;
                }
            }
            if (isAbleToCalculateQtrRevChange(qtr, compQuarter)) {
                qtr.rev.perf = calculatePercentChange(
                    qtr.rev.rev,
                    compQuarter.rev.rev
                );
            }
        }
    });
}

function fillAnnual(quarterlyData, annualData) {
    if (!quarterlyData || quarterlyData.length == 0 || !annualData) {
        return;
    }
    let year = getLatestQtrYear(quarterlyData);
    if (!year) return;
    let maxLoops = 20;
    while (maxLoops-- > 0) {
        let yearItem = new Year(year, year, 0, 0);
        let qtrs4Year = 0;

        quarterlyData.forEach(function (qtr) {
            if (qtr && qtr.name && qtr.name.indexOf(year.toString()) > -1) {
                if (qtr.eps && isDefined(qtr.eps.eps)) yearItem.eps += qtr.eps.eps;
                if (qtr.rev && isDefined(qtr.rev.rev)) yearItem.rev += qtr.rev.rev;
                ++qtrs4Year;
            }
        });

        if (qtrs4Year == 0) break;

        if (qtrs4Year == 4) {
            yearItem.eps = +yearItem.eps.toFixed(2);
            yearItem.rev = +yearItem.rev.toFixed(1);
            yearItem.qtrs4Year = qtrs4Year;
            const existing = annualData.find(e => e && e.year === year);
            if (!existing) {
                annualData.unshift(yearItem);
            } else {
                if (!isDefined(existing.eps) && isDefined(yearItem.eps)) existing.eps = yearItem.eps;
                if (!isDefined(existing.rev) && isDefined(yearItem.rev)) existing.rev = yearItem.rev;
                existing.qtrs4Year = 4;
            }
        }
        --year;
    }
}

function calculateAnnualPerf(years) {
    if (!years || !Array.isArray(years)) return;
    years.map(function (item) {
        if (!item) return;
        const previousYear = years.find((q) => q && q.year == item.year - 1);
        if (isDefined(previousYear)) {
            if (isDefined(item.eps) && isDefined(previousYear.eps) && (item.qtrs4Year == 4 || !isDefined(item.qtrs4Year))) {
                item.epsPerf = calculatePercentChange(item.eps, previousYear.eps);
            }
            if (isDefined(item.rev) && isDefined(previousYear.rev)) {
                item.revPerf = calculatePercentChange(item.rev, previousYear.rev);
            }
        }
    });
}

function extractFundamentalData(response, results) {
    if (!response || !response.raw) return results;
    results.dailyChart = response.dailyChart;
    results.weeklyChart = response.weeklyChart;

    try {
        const parser = new DOMParser();
        const dom = parser.parseFromString(response.raw, "text/html");
        
        const tickerNode = dom.querySelector(".quote-header_ticker-wrapper_ticker, .quote-header_ticker-wrapper > h1, h1.quote-header_ticker, h1");
        results.ticker = tickerNode ? tickerNode.textContent.trim() : "";
        
        const anchorNode = dom.querySelector(".quote-header_ticker-wrapper > h2 > a") || dom.querySelector("h2 > a");
        results.companyName = anchorNode ? anchorNode.textContent.trim() : "";
        results.companySite = anchorNode ? fixExternalLink(anchorNode.getAttribute("href") || "") : "";

        // Query Finviz category nodes
        const categoryNodes = Array.from(dom.querySelectorAll("a.quote-header_category, .quote-links a, a[href*='screener?v=111']"));
        const sectorNode = categoryNodes.find(a => (a.getAttribute("href") || "").includes("f=sec_")) || categoryNodes[0];
        const industryNode = categoryNodes.find(a => (a.getAttribute("href") || "").includes("f=ind_")) || categoryNodes[1];
        const countryNode = categoryNodes.find(a => (a.getAttribute("href") || "").includes("geo_")) || categoryNodes[2];

        results.sector = sectorNode ? sectorNode.textContent.trim() : "";
        results.sectorHref = sectorNode ? fixExternalLink(sectorNode.getAttribute("href") || "") : "";

        results.industry = industryNode ? industryNode.textContent.trim() : "";
        results.industryHref = industryNode ? fixExternalLink(industryNode.getAttribute("href") || "") : "";

        results.country = countryNode ? countryNode.textContent.trim() : "";
        results.countryHref = countryNode ? fixExternalLink(countryNode.getAttribute("href") || "") : "";

        const tds = Array.from(dom.querySelectorAll("td"));
        results.shorts = getSiblingText(tds, "Short Float");
        results.daystocover = getSiblingText(tds, "Short Ratio");
        results.float = getSiblingText(tds, "Shs Float");
        processEarnings(getSiblingText(tds, "Earnings"), results);
        results.mktcap = getSiblingText(tds, "Market Cap");
        
        let volStr = getSiblingText(tds, "Volatility");
        results.adr = (volStr && volStr.includes(" ")) ? volStr.split(" ")[1] : volStr;
        
        results.instown = getSiblingText(tds, "Inst Own");
        results.instchange = getSiblingText(tds, "Inst Trans");
        results.relvolume = getSiblingText(tds, "Rel Volume");
        results.avgvolume = getSiblingText(tds, "Avg Volume");
        results.price = getSiblingText(tds, "Price");
        results.volume = getSiblingText(tds, "Volume");

        // Expanded fundamentals for redesigned overview
        results.change = getSiblingText(tds, "Change");
        results.pe = getSiblingText(tds, "P/E");
        results.fwdPe = getSiblingText(tds, "Forward P/E");
        results.ps = getSiblingText(tds, "P/S");
        let atrVal = getSiblingText(tds, "ATR");
        if (!atrVal || atrVal === "-") atrVal = getSiblingText(tds, "ATR (14)");
        results.atr = atrVal;
        results.range52w = getSiblingText(tds, "52W Range");
        results.sma50 = getSiblingText(tds, "SMA50");
        results.sma200 = getSiblingText(tds, "SMA200");
        results.perfMonth = getSiblingText(tds, "Perf Month");
        results.perfQuarter = getSiblingText(tds, "Perf Quarter");
        results.grossMargin = getSiblingText(tds, "Gross Margin");
        results.operMargin = getSiblingText(tds, "Oper. Margin");
        results.profitMargin = getSiblingText(tds, "Profit Margin");
        results.roe = getSiblingText(tds, "ROE");
        results.roa = getSiblingText(tds, "ROA");
        results.roi = getSiblingText(tds, "ROI");

        const profileNode = dom.querySelector(".fullview-profile");
        results.description = profileNode ? profileNode.textContent.trim() : "";
        if (isDefined(results.companyName) && results.companyName !== "" && results.description) {
            const regex = new RegExp(
                "^" +
                    results.companyName +
                    ",? (together with its subsidiaries, )?(through its subsidiaries, )?"
            );
            results.description = results.description.replace(regex, "");
        }

        results.ratingsHtml = "";

        const newsOuter = dom.querySelector(".fullview-news-outer");
        if (newsOuter != null) {
            results.newsJson = extractNews(newsOuter.outerHTML);
            results.newsHtml = renderNews(results.newsJson);
        } else {
            results.newsHtml = "No news";
        }

        const insidersNode = dom.querySelector(".body-table");
        if (insidersNode != null) {
            const insidersJson = extractInsiders(insidersNode.outerHTML);
            results.insidersHtml =
                insidersJson.length > 0
                    ? renderInsiders(insidersJson)
                    : "No insider transactions";
        }
    } catch (err) {
        console.warn("extractFundamentalData error", err);
    }
    return results;
}

function processEarnings(str, results) {
    if (!str || typeof str !== "string" || str === "-") {
        results.earnings = "-";
        return;
    }
    results.earnings = str;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = str.split(" ");
    if (parts.length < 2 || !REVERSE_MONTH_MAP[parts[0]]) {
        return;
    }
    const earningsMonth = REVERSE_MONTH_MAP[parts[0]];
    const earningsDate = new Date(today.getFullYear(), earningsMonth, parseInt(parts[1]) || 1);
    earningsDate.setHours(0, 0, 0, 0);

    if (earningsDate.getTime() + 24 * 60 * 60 * 1000 < today.getTime()) {
        results.earnings = "-";
        return;
    }

    if (
        (earningsMonth == 9 || earningsMonth == 10 || earningsMonth == 11) &&
        (today.getMonth() == 0 || today.getMonth() == 1 || today.getMonth() == 2)
    ) {
        earningsDate.setFullYear(today.getFullYear() - 1);
    }

    results.earningsDate = earningsDate;
    if (today.getFullYear() != earningsDate.getFullYear()) {
        results.daysToEarnings = 185;
    } else {
        results.daysToEarnings = getWorkingDays(today, earningsDate);
    }
}

const extractInsiders = (html) => {
    let insiders = [];
    try {
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, "text/html");
        const rows = dom.querySelectorAll("tr");
        for (let [index, row] of rows.entries()) {
            if (index == 0) continue;
            let result = {};
            if (row.className && row.className.includes("is-sale")) result.isSell = 1;
            else if (row.className && row.className.includes("is-buy")) result.isBuy = 1;
            let cells = row.querySelectorAll("td");
            if (cells.length < 8) continue;
            let a0 = cells[0].querySelector("a");
            result.insider = a0 ? a0.innerHTML : cells[0].innerHTML;
            result.relationship = cells[1].innerHTML;
            result.date = cells[2].innerHTML;
            result.transaction = cells[3].innerHTML;
            result.cost = cells[4].innerHTML;
            result.shares = cells[5].innerHTML;
            result.value = cells[6].innerHTML;
            result.sharesTotal = cells[7].innerHTML;
            let a8 = cells[8] ? cells[8].querySelector("a") : null;
            result.linkHref = a8 ? a8.getAttribute("href") : "#";
            result.linkText = a8 ? a8.innerHTML : "link";
            insiders.push(result);
        }
    } catch (e) {
        console.warn("extractInsiders error", e);
    }
    return insiders;
};

const renderInsiders = (json) => {
    let html = '<table id="ht-insiders-table">\n';
    if (!json || !Array.isArray(json)) return html + "</table>\n";
    for (const item of json) {
        html += "<tr>\n";
        html += '<td class="ht-insiders-date">' + (item.date || '') + "</td>\n";
        html += "<td";
        if (item.isSell) html += ' class="ht-insiders-sell"';
        else if (item.isBuy) html += ' class="ht-insiders-buy"';
        html += ">" + (item.transaction || '') + "</td>\n";
        html += "<td>$" + (item.value || '0') + " (" + (item.shares || '0') + " shs)</td>\n";
        html += "<td>" + (item.insider || '') + " (" + (item.relationship || '') + ")</td>\n";
        html +=
            '<td><a class="ht-insiders-link" href="' +
            (item.linkHref || '#') +
            '" target="_blank">f4</a></td>\n';
        html += "</tr>\n";
    }
    html += "</table>\n";
    return html;
};

const extractNews = (html) => {
    let news = [];
    try {
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, "text/html");
        const newsTableNode = dom.querySelector("table");
        if (!newsTableNode) return news;
        let newsRowsNodes = newsTableNode.querySelectorAll("tr");

        for (const newsRowNode of newsRowsNodes) {
            let result = {};
            let cells = newsRowNode.querySelectorAll("td");
            for (let cellNode of cells) {
                let linkNode = cellNode.querySelector("a");
                if (linkNode != null) {
                    result.linkHref = linkNode.getAttribute("href");
                    result.linkText = linkNode.innerHTML;
                    let spanNode = cellNode.querySelector("span");
                    if (spanNode != null) result.source = spanNode.innerHTML.trim();
                } else
                    result.date = cellNode.innerHTML.trim().replace(/\&nbsp;/g, "");
            }
            news.push(result);
        }
    } catch (e) {
        console.warn("extractNews error", e);
    }
    return news;
};

const renderNews = (json) => {
    let html = '<table id="ht-news-table">\n';
    if (!json || !Array.isArray(json)) return html + "</table>\n";
    for (const item of json) {
        html += "<tr>\n";
        html += '<td class="ht-news-date-cell">' + (item.date || '') + "</td>\n";
        html +=
            '<td class="ht-news-link-cell"><a class="ht-news-link" href="' +
            (item.linkHref || '#') +
            '" target="_blank">' +
            (item.linkText || '') +
            '</a><span class="ht-news-source">' +
            (item.source || '') +
            "</span></td>\n";
        html += "</tr>\n";
    }
    html += "</table>\n";
    return html;
};
