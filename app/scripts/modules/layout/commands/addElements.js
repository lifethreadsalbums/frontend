PACE.AddElementsCommand = function(spread, elements, index) {
    'use strict';
    
    this.execute = function() {

        var i, el, idx;

        if (_.isUndefined(index))
            index = spread.elements.length;
        for (i = 0; i < elements.length; i++) {
            el = elements[i];
            delete el._id;
            idx = Math.min(spread.elements.length, index++);
            spread.elements.splice(idx, 0, el);
        }

    };

    this.undo = function() {
        var i, el, idx;

        for (i = 0; i < elements.length; i++) {
            el = elements[i];
            idx = spread.elements.indexOf(el);
            spread.elements.splice(idx,1);
        }
    };
};