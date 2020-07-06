document.addEventListener("mouseup", function() {

    var full_selection = document.getSelection();
    var beginning_node = full_selection.anchorNode;
    var ending_node = full_selection.focusNode;

    // For simplicity's sake, only make changes to the anchor node
    var direction = beginning_node.compareDocumentPosition(ending_node);
    var redact_begin;
    var redact_end;

    if (direction == 0){        // Selection is within one paragraph
        redact_begin = full_selection.anchorOffset;
        redact_end = full_selection.focusOffset;
        if (redact_begin > redact_end){
            redact_begin = full_selection.focusOffset;
            redact_end = full_selection.anchorOffset;
        }
    }
    else if (direction == 4){   // Selection is LTR and spills over end of first paragraph
        redact_begin = full_selection.anchorOffset;
        redact_end = beginning_node.length;
    }
    else if (direction == 2){   // Selection is RTL and spills over beginning of first paragraph
        redact_begin = 0;
        redact_end = full_selection.anchorOffset;
    }

    redactText(full_selection.anchorNode, redact_begin, redact_end);

});

var blackout = true;    // Control whether blackout or whiteout

function redactText(node, beginning, ending) {

    var text_to_redact = node.textContent.substring(beginning, ending);
    var replacement_bars = "";
    var replacement_character;

    if (blackout) {
        replacement_character = "\u2588"; // Full block for blackout       
    }
    else{
        replacement_character = "\u00A0"; // No-break space for whiteout
    }

    // Generate redacted string, preserving breaking spaces
    for (i = 0; i < text_to_redact.length; i++){
        if (text_to_redact.charAt(i) == "\u0020"){
            replacement_bars = replacement_bars + "\u0020";
        }
        else {
            replacement_bars = replacement_bars + replacement_character;
        }
    }

    node.replaceData(beginning, text_to_redact.length, replacement_bars);

}