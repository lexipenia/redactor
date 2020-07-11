document.addEventListener("DOMContentLoaded", function() {
    // set up variable for defining replacement character on first run
    // then set up the buttons, etc.
    chrome.storage.local.get(["redact_with"], function(result) {
        if (typeof result.redact_with === "undefined"){
            chrome.storage.local.set({"redact_with": "blackout"});
            configAndRun();      
        }
        else {
            configAndRun();
        }
    });
});

function configAndRun() {
    var blackout_button = document.getElementById("blackout_button");
    blackout_button.addEventListener("click", blackoutClicked);

    var whiteout_button = document.getElementById("whiteout_button");
    whiteout_button.addEventListener("click", whiteoutClicked);

    // pre-check button based on existing selection
    chrome.storage.local.get(["redact_with"], function(result) {
        if (result.redact_with == "blackout") {
            blackout_button.checked = true;
        }
        else if (result.redact_with == "whiteout") {
            whiteout_button.checked = true;
        }
    });
    // run redactor script to activate immediately, save user a click
    chrome.tabs.executeScript({file: "redactor.js"});
}

function blackoutClicked(){
    chrome.storage.local.set({"redact_with": "blackout"});
    // run redactor script again to load the new value
    chrome.tabs.executeScript({file: "redactor.js"});
}

function whiteoutClicked(){
    chrome.storage.local.set({"redact_with": "whiteout"});
    // run redactor script again to load the new value
    chrome.tabs.executeScript({file: "redactor.js"});
}