var fetch_fundamental_data = true;
var show_earnings_only = false;
var chart_type = CHART_TYPE.NONE;
var show_earnings_surprise = true;
var default_ds = 1;
var default_theme = "dark";
var ms_style_output = true;
var limit_num_qtr = true;

var quarterlyData = [];
var annualData = [];
var fundamentals = {};

let overwrite_qtr_data = undefined;

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
            if (isDefined(options.chart_type)) chart_type = options.chart_type;
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

            if (fetch_fundamental_data) {
                chrome.runtime.sendMessage(
                    {
                        command: "fetch_fundamentals",
                        chart_type: chart_type,
                    },
                    (response) => {
                        if (response && !response.error) {
                            extractFundamentalData(response, fundamentals);
                            waitForEl(
                                "#ht-root-container",
                                pushFundamentalsData,
                                25
                            );
                        }
                    }
                );
            }

            if (default_ds === 1) {
                chrome.runtime.sendMessage(
                    {
                        command: "fetch_quarterly_data",
                    },
                    (response) => {
                        if (
                            response &&
                            !response.error &&
                            isDefined(response.raw) &&
                            response.raw.length > 0
                        ) {
                            const parser = getParser(2, response.raw);
                            if (parser && parser.qtrData) {
                                overwrite_qtr_data = parser.qtrData;
                            }
                        }
                    }
                );
            }

            if (default_ds === 1) {
                // Seeking Alpha
                waitForEarningsData(displayEarnings, 30);
            } else if (default_ds === 2) {
                // Zacks
                displayEarnings(true);
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

function waitForEarningsData(callback, maxtries = false, interval = 100) {
    const poller = setInterval(() => {
        const isContains = contains("h2", "FQ") || contains("table", "Earnings") || contains("div", "Earnings");
        const retry = maxtries === false || maxtries-- > 0;
        if (retry && !isContains) return;
        clearInterval(poller);
        setTimeout(function () {
            callback(isContains);
        }, 1000);
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

function pushFundamentalsData(found = true) {
    if (!found) return;
    if (!isDefined(fundamentals.ticker)) return;

    let companyHtml = "";
    if (isDefined(fundamentals.companySite))
        companyHtml = `<a id="ht-company-link" href="${fundamentals.companySite}" target="_blank"><b>${fundamentals.companyName || ''}</b></a>`;
    else companyHtml = `<b>${fundamentals.companyName || ''}</b>`;

    companyHtml += ` <span id="ht-ticker">(${fundamentals.ticker || ''})</span> - 
                    ${fundamentals.sector || '-'} | ${fundamentals.industry || '-'} | ${fundamentals.country || '-'}`;

    const compElem = document.getElementById("ht-company");
    if (compElem) compElem.innerHTML = companyHtml;
    
    const priceVolElem = document.getElementById("ht-pricevol");
    if (priceVolElem) priceVolElem.innerHTML = `\$${fundamentals.price || '-'}</br><span id="ht-volume">Vol: ${fundamentals.volume || '-'}</span>`;
    
    const descElem = document.getElementById("ht-description");
    if (descElem) descElem.innerHTML = fundamentals.description || "";
    
    const mktElem = document.getElementById("ht-fundamentals-mktcap");
    if (mktElem) mktElem.innerHTML = fundamentals.mktcap || "-";
    
    const adrElem = document.getElementById("ht-fundamentals-adr");
    if (adrElem) {
        adrElem.innerHTML = fundamentals.adr || "-";
        if (isAdrLow(fundamentals.adr)) adrElem.classList.add("ladr");
    }

    const floatElem = document.getElementById("ht-fundamentals-float");
    if (floatElem) floatElem.innerHTML = fundamentals.float || "-";

    const earnElem = document.getElementById("ht-fundamentals-earnings");
    if (earnElem) {
        earnElem.innerHTML = fundamentals.earnings || "-";
        if (isEarningsDateClose(fundamentals.earnings, fundamentals.daysToEarnings)) {
            earnElem.classList.add("learnings");
        }
    }

    const shortElem = document.getElementById("ht-fundamentals-shortfloat");
    if (shortElem) {
        shortElem.innerHTML = fundamentals.shorts || "-";
        if (isShortInterestHigh(fundamentals.shorts)) shortElem.classList.add("hshorts");
    }

    const instElem = document.getElementById("ht-fundamentals-instown");
    if (instElem) instElem.innerHTML = fundamentals.instown || "-";

    const dtcElem = document.getElementById("ht-fundamentals-daystocover");
    if (dtcElem) dtcElem.innerHTML = fundamentals.daystocover || "-";

    const instChangeElem = document.getElementById("ht-fundamentals-instrans3mo");
    if (instChangeElem) {
        instChangeElem.innerHTML = fundamentals.instchange || "-";
        if (isHighInstitutionalOwnershipChange(fundamentals.instchange)) {
            instChangeElem.classList.add("hinstchange");
        }
    }

    const avgVolElem = document.getElementById("ht-fundamentals-avgvol");
    if (avgVolElem) avgVolElem.innerHTML = fundamentals.avgvolume || "-";

    const relVolElem = document.getElementById("ht-fundamentals-relvol");
    if (relVolElem) relVolElem.innerHTML = fundamentals.relvolume || "-";

    const ratingsElem = document.getElementById("ht-ratings-cell");
    if (ratingsElem) ratingsElem.innerHTML = fundamentals.ratingsHtml || "";

    const newsElem = document.getElementById("ht-news-cell");
    if (newsElem) newsElem.innerHTML = fundamentals.newsHtml || "";

    const insElem = document.getElementById("ht-insiders-cell");
    if (insElem) insElem.innerHTML = fundamentals.insidersHtml || "";

    if (chart_type == CHART_TYPE.WEEKLY || chart_type == CHART_TYPE.BOTH) {
        let weekly = isDefined(fundamentals.weeklyChart)
            ? `<img src="data:image/png;base64, ${fundamentals.weeklyChart}" alt="${fundamentals.ticker} chart"/>`
            : "No weekly chart available";
        const wElem = document.getElementById("ht-chart-weekly");
        if (wElem) wElem.innerHTML = weekly;
    }
    if (chart_type == CHART_TYPE.DAILY || chart_type == CHART_TYPE.BOTH) {
        let daily = isDefined(fundamentals.dailyChart)
            ? `<img src="data:image/png;base64, ${fundamentals.dailyChart}" alt="${fundamentals.ticker} chart"/>`
            : "No daily chart available";
        const dElem = document.getElementById("ht-chart-daily");
        if (dElem) dElem.innerHTML = daily;
    }
    show(document.getElementById("ht-fundamentals-container"));
}

function displayEarnings(isContains) {
    extractAndProcessEarningsData();
    if (document.getElementById("ht-root-container") == null) {
        if (quarterlyData.length == 0 && annualData.length == 0) {
            hide(document.getElementById("ht-waiting"));
            if (isDefined(fundamentals.ticker)) {
                insertHTML();
                pushFundamentalsData();
                pushEarningsData();
                hideNativeContent();
            } else {
                bodyPrepend(
                    '<div id="ht-msg-noearnings">No earnings data available for this symbol.</div>'
                );
            }
        } else {
            insertHTML();
            pushEarningsData();
            hideNativeContent();
        }
    } else {
        pushEarningsData();
    }
}

function pushEarningsData() {
    hide(document.getElementById("ht-waiting-earnings"));
    const yElem = document.getElementById("ht-earnings-yearly");
    if (yElem) yElem.innerHTML = annualToHtml(annualData);
    const qElem = document.getElementById("ht-earnings-quarterly");
    if (qElem) qElem.innerHTML = quarterlyToHtml(quarterlyData);
}

function displayWaiting() {
    bodyPrepend(
        '<div id="ht-waiting"><p class="ht-loadingmsg">Waiting for data</p></div>'
    );
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
        html = HTML(default_theme, showChart, show_earnings_surprise);
    }
    bodyPrepend(html);
}

function quarterlyToHtml(quarterlyData) {
    let html = '<table class="ht-earnings-table">';
    html += "<thead><tr>";
    html += "<td>Date</td>";
    html += "<td>Quarter</td><td>EPS</td><td>%Change</td>";
    if (show_earnings_surprise) {
        html += "<td>%Surprise</td>";
    }
    html += "<td>Revenue(Mil)</td><td>%Change</td>";
    if (show_earnings_surprise) {
        html += "<td>%Surprise</td>";
    }
    html += "</tr></thead><tbody>";

    if (!quarterlyData || quarterlyData.length == 0) {
        html += `<tr><td colspan="${show_earnings_surprise ? 7 : 5}">No data</td></tr>`;
        html += "</tbody></table>";
        return html;
    }

    quarterlyData.forEach(function (item, index) {
        if (limit_num_qtr == true && index < quarterlyData.length - 8) {
            return;
        }

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
        html += "<tr>";
        html += "<td>" + (item.date || '-') + "</td>";
        html += '<td style="white-space: nowrap;">' + getDisplayQuarter(item.name) + "</td>";
        html += "<td>" + (item.eps && isDefined(item.eps.eps) ? item.eps.eps : '-') + "</td>";
        html += '<td class="' + getHighlightClass4Change(item.eps ? item.eps.perf : undefined, epsPerf) + '">' + epsPerf + "</td>";
        if (show_earnings_surprise) {
            html += '<td class="' + getHighlightClass4Surprise(item.eps ? item.eps.surprisePerf : undefined, surpriseEpsPerf) + '">' + surpriseEpsPerf + "</td>";
        }
        html += "<td>" + (item.rev && isDefined(item.rev.rev) ? numberWithCommas(item.rev.rev) : '-') + "</td>";
        html += '<td class="' + getHighlightClass4Change(item.rev ? item.rev.perf : undefined, revPerf) + '">' + revPerf + "</td>";
        if (show_earnings_surprise) {
            html += '<td class="' + getHighlightClass4Surprise(item.rev ? item.rev.surprisePerf : undefined, surpriseRevPerf) + '">' + surpriseRevPerf + "</td>";
        }
        html += "</tr>";
    });
    html += "</tbody></table>";
    return html;
}

function annualToHtml(annualData) {
    let html = '<table class="ht-earnings-table">';
    html += "<thead><tr><td>Year</td><td>EPS</td><td>%Change</td><td>Revenue(Mil)</td><td>%Change</td></tr></thead><tbody>";

    if (!annualData || annualData.length == 0) {
        html += '<tr><td colspan="5">No data</td></tr>';
        html += "</tbody></table>";
        return html;
    }

    annualData.forEach(function (item, index) {
        let yearlyEps = isDefined(item.eps) ? item.eps.toString() : "-";
        let yearlyRev = isDefined(item.rev) ? item.rev.toString() : "-";
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
        html += `<td ${isEst ? 'title="Estimated"' : ''}>${numberWithCommas(yearlyRev)}</td>`;
        html += `<td ${isEst ? 'title="Estimated"' : ''} class="${getHighlightClass4Change(item.revPerf, revPerf)}">${revPerf}</td></tr>`;
    });
    html += "</tbody></table>";
    return html;
}

function extractAndProcessEarningsData() {
    try {
        const parser = getParser(default_ds);
        if (parser) {
            if (isDefined(parser.qtrData)) quarterlyData = parser.qtrData;
            if (isDefined(parser.annualData)) annualData = parser.annualData;
        }
        if (isDefined(overwrite_qtr_data)) quarterlyData = overwrite_qtr_data;

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
            annualData.unshift(yearItem);
        }
        --year;
    }
}

function calculateAnnualPerf(years) {
    if (!years || !Array.isArray(years)) return;
    years.map(function (item) {
        if (!item) return;
        const previousYear = years.find((q) => q && q.year == item.year - 1);
        if (
            isDefined(previousYear) &&
            item.qtrs4Year == 4 &&
            previousYear.qtrs4Year == 4
        ) {
            item.epsPerf = calculatePercentChange(item.eps, previousYear.eps);
            item.revPerf = calculatePercentChange(item.rev, previousYear.rev);
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

        // Query both new Finviz class a.quote-header_category and legacy .quote-links a
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
