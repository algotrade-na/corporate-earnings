const SA_REGEX = /symbol\/([a-zA-Z0-9\.\-]+)\/earnings/;
const ZA_REGEX = /stock\/research\/([a-zA-Z0-9\.\-]+)\/earnings-calendar/;
const YF_REGEX = /quote\/([a-zA-Z0-9\.\-]+)/;

const FUNDAMENTALS_URL = "aHR0cHM6Ly9maW52aXouY29tL3F1b3RlLmFzaHg/dD0=";
const FUNDAMENTALS_URL_PREFIX = "aHR0cHM6Ly9maW52aXouY29tLw==";
const IMAGE_URL = "aHR0cHM6Ly9jaGFydHMyLmZpbnZpei5jb20vY2hhcnQuYXNoeD90PQ==";
const QUARTERLY_DATA_URL =
    "aHR0cHM6Ly93d3cuemFja3MuY29tL3N0b2NrL3Jlc2VhcmNoLyVzL2Vhcm5pbmdzLWNhbGVuZGFy";

const CHART_TYPE = {
    NONE: 1,
    WEEKLY: 2,
    DAILY: 3,
    BOTH: 4,
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || tabs.length === 0 || !tabs[0].url) {
            sendResponse({ error: "No active tab URL found" });
            return;
        }
        let url = tabs[0].url;
        const symbol = getSymbol(url);
        if (message.command === "fetch_fundamentals") {
            fetchFundamentals(symbol, message.chart_type, sendResponse);
        } else if (message.command === "fetch_quarterly_data") {
            fetchQuarterlyData(symbol, sendResponse);
        }
    });
    return true;
});

function fetchQuarterlyData(symbol, sendResponse) {
    if (!isDefined(symbol)) {
        sendResponse({
            error: "No valid symbol passed to fetchQuarterlyData",
        });
        return;
    }

    const results = { symbol: symbol };
    let responseStatus = 0;
    fetch(getQuarterlyDataUrl(symbol))
        .then(function (response) {
            responseStatus = response.status;
            return response.text();
        })
        .then(function (html) {
            if (responseStatus != 200) {
                sendResponse({
                    error: "failed to fetch fundamentals for symbol: " + symbol,
                });
                return;
            }
            results.raw = html;
            sendResponse(results);
        })
        .catch(function (err) {
            console.log("Failed to fetch page: ", err);
            sendResponse({
                error: "failed to fetch quarterly data for symbol: " + symbol,
            });
        });
}

function fetchFundamentals(symbol, chart_type, sendResponse) {
    if (!isDefined(symbol)) {
        sendResponse({
            error: "No valid symbol passed to fetchFundamentals",
        });
        return;
    }
    let chartType = CHART_TYPE.NONE;
    if (isDefined(chart_type)) {
        chartType = parseInt(chart_type);
    }

    const results = { symbol: symbol };
    let responseStatus = 0;
    fetch(decode(FUNDAMENTALS_URL) + symbol)
        .then(function (response) {
            responseStatus = response.status;
            return response.text();
        })
        .then(async function (response) {
            if (responseStatus != 200) {
                sendResponse({
                    error: "failed to fetch fundamentals for symbol: " + symbol,
                });
                return;
            }

            results.raw = response;
            try {
                const charts = await fetchImages(symbol, chartType);
                if (isDefined(charts)) {
                    switch (chartType) {
                        case CHART_TYPE.WEEKLY:
                            results.weeklyChart = charts[0];
                            break;
                        case CHART_TYPE.DAILY:
                            results.dailyChart = charts[0];
                            break;
                        case CHART_TYPE.BOTH:
                            results.weeklyChart = charts[0];
                            results.dailyChart = charts[1];
                            break;
                    }
                }
            } catch (err) {
                console.warn("Failed to fetch chart images, returning fundamentals raw data", err);
            }
            sendResponse(results);
        })
        .catch(function (err) {
            console.log("Failed to fetch page: ", err);
            sendResponse({
                error: "failed to fetch fundamentals for symbol: " + symbol,
            });
        });
}

async function fetchImages(symbol, chartType) {
    let urls = [];
    switch (chartType) {
        case CHART_TYPE.WEEKLY:
            urls.push(decode(IMAGE_URL) + symbol + "&ty=c&ta=0&p=w&s=l");
            break;
        case CHART_TYPE.DAILY:
            urls.push(decode(IMAGE_URL) + symbol + "&ty=c&ta=1&p=d&s=l");
            break;
        case CHART_TYPE.BOTH:
            urls.push(decode(IMAGE_URL) + symbol + "&ty=c&ta=0&p=w&s=l");
            urls.push(decode(IMAGE_URL) + symbol + "&ty=c&ta=1&p=d&s=l");
            break;
    }
    if (urls.length == 0) {
        return undefined;
    }
    try {
        let data = await Promise.all(
            urls.map((url) =>
                fetch(url)
                    .then((response) => response.arrayBuffer())
                    .then((buf) => arrayBufferToBase64(buf))
            )
        );
        return data;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}

function isDefined(smth) {
    return typeof smth !== "undefined" && smth !== null;
}

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
    return btoa(binary);
}

function decode(str) {
    if (!isDefined(str)) {
        return undefined;
    }
    return decodeURIComponent(escape(atob(str)));
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

function getQuarterlyDataUrl(symbol) {
    let url = decode(QUARTERLY_DATA_URL);
    return url.replace("%s", symbol);
}
