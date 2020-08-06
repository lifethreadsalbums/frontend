PACE.MoveSelectionCommand = function(layoutController, offset) {
    'use strict';

    var state;

    this.execute = function() {
        //save current state;
        state = _.map(layoutController.selectedElements, function(el) {
            return { element: el, state: _.pick(el, 'x', 'y') };
        });
        this.renderer = layoutController.currentRenderer;
        
        var rect = layoutController.getSelectionBoundingBox();
        var prePos = _.pick(rect, 'x','y');
        rect.x += offset.x;
        rect.y += offset.y;

        layoutController.snappingService.beginSnapping(layoutController);
        var snapped = layoutController.snappingService.snapObject(rect);
        layoutController.snappingService.endSnapping();
        if (snapped && (rect.x===prePos.x || (rect.x>prePos.x && offset.x<0) || (rect.x<prePos.x && offset.x>0))) 
            rect.x = prePos.x + offset.x;
        if (snapped && (rect.y===prePos.y || (rect.y>prePos.y && offset.y<0) || (rect.y<prePos.y && offset.y>0))) 
            rect.y = prePos.y + offset.y;
        
        new PACE.TransformElementsCommand(layoutController.selectedElements, rect).execute();
    };

    this.undo = function() {
        _.each(state, function(state) {
            _.extend(state.element, state.state);
        });
    };
};