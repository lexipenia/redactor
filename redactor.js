document.addEventListener("mouseup", redactor);

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

    // carry out redaction
    if (direction == 0){
        redactText(user_begin, redact_begin, redact_end);
    }
    else{
        // redact the beginning and the ending nodes
        redactText(beginning_node, redact_begin, beginning_node.length);
        redactText(ending_node, 0, redact_end);

        // redact all intervening nodes
        var ancestor = firstCommonAncestor(beginning_node, ending_node);
        var all_children = getLowestLevelChildren(ancestor);
        var intervening_nodes = getInterveningTextNodes(all_children, beginning_node, ending_node);
        intervening_nodes.forEach(node => {
            redactText(node, 0, node.length);
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

// replace text within a node between two specified points
// "blackout" is global and can be set by user to control blackout/whiteout
var blackout = true;
function redactText(node, beginning, ending) {

    var text_to_redact = node.data.substring(beginning, ending).split('');
    var replacement_bars = "";
    var replacement_character;

    if (blackout) {
        replacement_character = "\u2588"; // Full block for blackout       
    }
    else{
        replacement_character = "\u00A0"; // No-break space for whiteout
    }

    // Generate redacted string, preserving breaking spaces and new lines
    text_to_redact.forEach(chr => {
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
    node.replaceData(beginning, text_to_redact.length, replacement_bars);
}
