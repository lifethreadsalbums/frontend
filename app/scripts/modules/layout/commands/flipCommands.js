PACE.FlipElementsCommand = function(elements, mode, bounds) {
    'use strict';

    var state;
    
    this.execute = function() {

        //save state;
        state = _.map(elements, function(el) { return _.pick(el, 'x','y'); });

        if (!bounds) {
            var group = new PACE.Element({type:'ElementGroup', elements:elements});
            bounds = group.getBoundingBox();
        }

        _.each(elements, function(el) {
            if (mode==='horizontal') {
                el.x = bounds.right - ((el.x - bounds.left) + el.width);
            } else {
                el.y = bounds.bottom - ((el.y - bounds.top) + el.height);
            }
            
        });

    };

    this.undo = function() {
        _.each(elements, function(el, i) {
            _.extend(el, state[i]);
        })
    };

};




PACE.FlipSelectionCommand = function(layoutController, mode) {
    'use strict';

    var cmd;
    
    this.execute = function() {

        var elements = layoutController.selectedElements,
            rect,
            renderer = layoutController.currentRenderer;

        if (elements.length===0) {
            elements = layoutController.currentRenderer.spread.elements;
            rect = new PACE.SpreadInfoFactory().create(renderer.spread, 
                renderer.layout).getBleedRect();
        } 
        if (elements.length>0) {
            cmd = new PACE.FlipElementsCommand(elements, mode, rect);
            cmd.execute();
        }

    };

    this.undo = function() {
        if (cmd) cmd.undo();
    };

};