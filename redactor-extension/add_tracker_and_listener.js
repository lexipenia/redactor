// first time a tab is loaded, add a hidden element to track the
// number of redactions + the fact that the event listener
// has not yet been added (need to avoid adding multiple listeners)

var already_edited = document.getElementById("redaction_total");

if (!already_edited) {
    var redaction_total = document.createElement("redactor");
    redaction_total.id = "redaction_total";
    redaction_total.setAttribute("total", "0");
    redaction_total.setAttribute("listener", "false");
    document.head.appendChild(redaction_total);
}