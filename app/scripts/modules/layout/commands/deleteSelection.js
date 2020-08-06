PACE.DeleteSelectionCommand = function(layoutController) {
    'use strict';

    var cmd;

    this.execute = function() {

        if (cmd) {
            cmd.execute();
            return;
        }

        var selectedGuides = layoutController.selectedGuides.concat(),
            selectedElements = layoutController.selectedElements.concat(),
            currentRenderer = layoutController.currentRenderer;

        if (selectedGuides.length > 0) {
            layoutController.currentRenderer.removeGuides(selectedGuides);
            layoutController.clearSelection();
        } else if (selectedElements.length>0) {
            layoutController.fireEvent('layout:deleting-elements');
           
            layoutController.clearSelection();
            currentRenderer.clearSelection();

            var el = selectedElements[0];
            if (selectedElements.length===1 && el.type==='BackgroundFrameElement' && el.target==='spine') {
                cmd = new PACE.ChangeSpineBackgroundColor(currentRenderer.spreadInfo, null);
            } else {
                cmd = new PACE.DeleteElementsCommand(currentRenderer.spread, selectedElements);
            }
            cmd.renderer = currentRenderer;
            cmd.execute();
            layoutController.fireEvent('layout:elements-deleted');
        }
        this.renderer = layoutController.currentRenderer;

    };

    this.undo = function() {
        if (cmd) cmd.undo();
    };

};