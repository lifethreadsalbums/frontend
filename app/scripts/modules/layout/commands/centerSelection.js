PACE.CenterSelectionCommand = function(layoutController) {
    'use strict';

    var state,
        elements = layoutController.selectedElements.concat();

    this.execute = function() {

        //save current state;
        state = _.map(elements, function(el) {
            return { element: el, state: _.pick(el, 'x', 'y') };
        });

        this.renderer = layoutController.currentRenderer;

        var currentSpread = layoutController.currentRenderer.spread,
            layout = layoutController.currentRenderer.layout,
            tempGroup = { type:'ElementGroup', elements: elements },
            rect = new PACE.Element(tempGroup).getBoundingBox(),
            centerCmd = new PACE.CenterOnPageCommand(rect, currentSpread, layout),
            cmd = new PACE.TransformElementsCommand(elements, rect);

        rect.rotation = 0;
        centerCmd.execute();
        cmd.execute();
    };

    this.undo = function() {
        _.each(state, function(state) {
            _.extend(state.element, state.state);
        });
    };
};
