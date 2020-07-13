// check if the listener has already been added; if it has,
// then do nothing; if it hasn't, then add it

var header_tag = document.getElementById("redaction_total");
if (header_tag.getAttribute("listener") == "false") {
    document.addEventListener("mouseup", function() {
        redactor();
    });
    header_tag.setAttribute("listener", "true");
}

function redactor() {

    // find out where the user began and ended their selection
    var full_selection = document.getSelection();
    var user_begin = full_selection.anchorNode;
    var user_end = full_selection.focusNode;

    // standardize beginning and ending nodes + where to redact based on page location
    var direction = user_begin.compareDocumentPosition(user_end);
    var beginning_node;
    var ending_node;
    var redact_begin;
    var redact_end;

    if (direction == 0){        // Selection is all within one node
        redact_begin = full_selection.anchorOffset;
        redact_end = full_selection.focusOffset;
        if (redact_begin > redact_end){
            redact_begin = full_selection.focusOffset;
            redact_end = full_selection.anchorOffset;
        }
         // break execution if the user has clicked without selecting anything
        else if (redact_begin == redact_end) {
            return;
        }
    }
    else if (direction == 4){   // Selection is LTR and spills over end of first user node
        beginning_node = user_begin;
        redact_begin = full_selection.anchorOffset;
        ending_node = user_end;
        redact_end = full_selection.focusOffset;
    }
    else if (direction == 2){   // Selection is RTL and spills over beginning of first user node
        beginning_node = user_end;
        redact_begin = full_selection.focusOffset;
        ending_node = user_begin;
        redact_end = full_selection.anchorOffset;
    }

     // set the "undo" tracking number for this batch of redactions + update in main document
     var redaction_total = document.getElementById("redaction_total");
     var undo_track_number = parseInt(redaction_total.getAttribute("total")) + 1;
     redaction_total.setAttribute("total", undo_track_number);

    // carry out redaction
    if (direction == 0){
        redactText(user_begin, redact_begin, redact_end, undo_track_number);
    }
    else{
        // redact the beginning and ending nodes
        redactText(beginning_node, redact_begin, beginning_node.length, undo_track_number);
        redactText(ending_node, 0, redact_end, undo_track_number);

        // redact all intervening nodes
        var ancestor = firstCommonAncestor(beginning_node, ending_node);
        var all_children = getLowestLevelChildren(ancestor);
        var intervening_nodes = getInterveningTextNodes(all_children, beginning_node, ending_node);
        intervening_nodes.forEach(node => {
            redactText(node, 0, node.length, undo_track_number);
        });
    }
}   

// search over each node's full parental line to find first common ancestor
function firstCommonAncestor(node1, node2) {

    var line_node1 = getFullLine(node1);
    var line_node2 = getFullLine(node2);

    for (let i = 0; i < line_node1.length; i++) {
        for (let j = 0; j < line_node2.length; j++) {
            if (line_node1[i] == line_node2[j]) {
                return line_node1[i];
            }
        }
    }
}

// return an array of a node's full parental line, with the highest node (document) last
function getFullLine(node) {

    var full_line = [node]; // include the node itself in the line
    pushParents(node);
    return full_line;

    function pushParents(x) {
        var y = x.parentNode;
        if (y) {
            full_line.push(y);
            pushParents(y);
        }
    }
}

// get all the nodes with no children contained within a common ancestor
function getLowestLevelChildren(node) {

    var lowest_children = [];
    check_and_recur(node);
    return lowest_children;

    function check_and_recur(x) {

        if (x.hasChildNodes()){
            x.childNodes.forEach(child => {
                check_and_recur(child); 
            });
        }
        else {
            lowest_children.push(x);
        }
    }
}

// return from an array all the text nodes between two other nodes on the page
function getInterveningTextNodes(node_array, first_node, second_node) {

    var desired_nodes = [];

    node_array.forEach(node => {
        if (first_node.compareDocumentPosition(node) == 4
        && second_node.compareDocumentPosition(node) == 2
        && node.nodeType == 3){
            desired_nodes.push(node);
        }
    });
    return desired_nodes;    
}

// determine replacement character from user preferences
// whenever the script is run (NB. will be set before the main
// "on_mouseup" function, whenever the extension popup is loaded
// or the blackout/whiteout buttons are clicked)
var replace_with;
chrome.storage.local.get("redact_with", function(result) {
    if (result.redact_with == "blackout") {
        replace_with = "blackout";
    }
    else if (result.redact_with == "whiteout") {
        replace_with = "whiteout";
    }
});

// replace text within a node between two specified points
function redactText(node, beginning, ending, tracking_number) {

    var text_to_redact = node.data.substring(beginning, ending);
    var replacement_bars = "";
    var replacement_character;

    if (replace_with == "blackout") {
        replacement_character = "\u2588"; // Full block for blackout       
    }
    else if (replace_with == "whiteout") {
        replacement_character = "\u00A0"; // No-break space for whiteout
    }

    // Generate redacted string, preserving breaking spaces and new lines
    text_to_redact.split('').forEach(chr => {
        if (chr == "\u0020") { // space
            replacement_bars = replacement_bars + "\u0020";
        }
        else if (chr == "\u000A") { // new line
            replacement_bars = replacement_bars + "\u000A";
        }
        else if (chr == "\u000D") { // carriage return
            replacement_bars = replacement_bars + "\u000D";
        }
        else {
            replacement_bars = replacement_bars + replacement_character;
        }
    });

    // add tracker nodes + then perform the actual redaction
    undoTracker(node, beginning, ending, tracking_number);
    node.replaceData(beginning, text_to_redact.length, replacement_bars);
}

// add hidden "tracker" elements to store original text for "undo" function
function undoTracker(node, beginning, ending, tracking_number) {

    // get the number of the text node within its parent
    var node_number = 0;
    var iterate_back = node.previousSibling;
    while(iterate_back != null){
        iterate_back = iterate_back.previousSibling;
        node_number++;
    }

    // create the tracker tag and store all the required data
    var tracker_tag = document.createElement("redactor");
    tracker_tag.id = "redaction_number_" + tracking_number;
    tracker_tag.setAttribute("node_number", node_number);
    tracker_tag.setAttribute("original_text", node.data.substring(beginning, ending));
    tracker_tag.setAttribute("redact_begin", beginning);
    node.parentElement.appendChild(tracker_tag);
}