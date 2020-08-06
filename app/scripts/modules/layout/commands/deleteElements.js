PACE.DeleteElementsCommand = function(spread, elements) {
    "use strict";

    this.execute = function() {
        var i, el, idx;
        
        this.indices = [];
        for (i = 0; i < elements.length; i++) {
            el = elements[i];
            idx = spread.elements.indexOf(el);
            this.indices.push(idx);
            spread.elements.splice(idx,1);
        }
    };

    this.undo = function() {
        var i, el, idx;

        for (i = 0; i < elements.length; i++) {
            el = elements[i];
            delete el._id;
            idx = Math.min(spread.elements.length - 1, this.indices[i]);
            spread.elements.splice(idx, 0, el);
        }
    };
};