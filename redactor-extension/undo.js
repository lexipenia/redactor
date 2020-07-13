// get the "undo" tracking number of the last set of actions
var redaction_total = document.getElementById("redaction_total");
var undo_number = parseInt(redaction_total.getAttribute("total"));

// don't do anything if there have been no redactions
if (undo_number > 0) {

    // construct the ID to find all nodes affected by last batch of redactions
    var tracker_element_id = "redaction_number_" + undo_number;

    // loop through all elements with the relevant ID
    // undo the changes + remove tracker element at the end

    while (document.getElementById(tracker_element_id)){

        // get the tracking element containing info + the parent node
        var tracker_element = document.getElementById(tracker_element_id);
        var parent = tracker_element.parentElement;

        // get the relevant data from the tracker to perform the reverse redaction
        var node_number = tracker_element.getAttribute("node_number");
        var original_text = tracker_element.getAttribute("original_text");
        var redact_begin = tracker_element.getAttribute("redact_begin");

        // specify the text node and undo the redaction
        var node = parent.childNodes[node_number];
        node.replaceData(redact_begin, original_text.length, original_text);

        // delete this particular tracking node
        parent.removeChild(tracker_element);
    }

    // decrement the main "undo" tracking number
    undo_number--;
    redaction_total.setAttribute("total", undo_number);
}