const ds1_urlPrefix = "aHR0cHM6Ly9zZWVraW5nYWxwaGEuY29tL3N5bWJvbC8=";
const ds2_urlPrefix = "aHR0cHM6Ly93d3cuemFja3MuY29tL3N0b2NrL3Jlc2VhcmNoLw==";
// Allow letters, digits, dots, hyphens, and spaces
const input_box_allowed_regex = /[a-zA-Z0-9\.\-\s]+/;

var open_new_tab = false;
var default_ds = 1;
var default_theme = "dark";

if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(
        ["open_new_tab", "default_ds", "theme"],
        function (options) {
            if (!options) options = {};
            if (isDefined(options.open_new_tab))
                open_new_tab = options.open_new_tab;
            if (isDefined(options.default_ds)) default_ds = options.default_ds;
            if (isDefined(options.theme)) default_theme = options.theme;
        }
    );
}

document.addEventListener("DOMContentLoaded", () => {
    const symbolElem = document.getElementById("symbol");
    const cogwheelElem = document.getElementById("cogwheel");

    if (symbolElem) {
        symbolElem.addEventListener("keyup", (event) => {
            if (event.key === "Enter" || event.keyCode === 13) {
                handleSubmit();
            }
        });
        symbolElem.addEventListener("keypress", (event) => {
            if (event.key && !input_box_allowed_regex.test(event.key)) {
                event.preventDefault();
            }
        });
        symbolElem.focus();
    }

    if (cogwheelElem) {
        cogwheelElem.addEventListener("mouseover", () => {
            cogwheelElem.src = "../images/icons8-engineering-24-blue.png";
        });
        cogwheelElem.addEventListener("mouseout", () => {
            cogwheelElem.src = "../images/icons8-engineering-24-black.png";
        });
    }
});

function handleSubmit() {
    // Valid ticker pattern: letters, numbers, dots, hyphens
    let stockRegex = /^[a-zA-Z0-9\.\-\s]+$/;
    const symbolElem = document.getElementById("symbol");
    if (!symbolElem) return;
    let symbol = symbolElem.value ? symbolElem.value.trim() : "";

    if (symbol === "") {
        alert("Symbol must not be blank");
        return;
    } else if (!stockRegex.test(symbol)) {
        alert("Symbol must only contain valid ticker characters (A-Z, 0-9, ., -)");
        return;
    }

    let targetUrl = "";
    if (default_ds == 1) {
        targetUrl =
            decodeURIComponent(escape(window.atob(ds1_urlPrefix))) +
            symbol.toUpperCase() +
            "/earnings";
    } else if (default_ds == 2) {
        targetUrl =
            decodeURIComponent(escape(window.atob(ds2_urlPrefix))) +
            symbol.toUpperCase() +
            "/earnings-calendar";
    }

    if (typeof chrome !== "undefined" && chrome.tabs) {
        if (open_new_tab) {
            chrome.tabs.create({ url: targetUrl });
        } else {
            chrome.tabs.query(
                { active: true, currentWindow: true },
                function (tabs) {
                    if (tabs && tabs[0]) {
                        chrome.tabs.update(tabs[0].id, { url: targetUrl });
                    } else {
                        chrome.tabs.create({ url: targetUrl });
                    }
                }
            );
            symbolElem.focus();
            symbolElem.select();
        }
    }
}

function isDefined(smth) {
    return typeof smth !== "undefined" && smth !== null;
}
