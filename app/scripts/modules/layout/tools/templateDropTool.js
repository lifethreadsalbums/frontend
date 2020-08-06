PACE.TemplateDropTool = function(layoutController, DataTransferService) {
    "use strict";

    var injector = angular.element('body').injector(),
        UndoService = injector.get('UndoService'),
        DataTransferService = injector.get('DataTransferService');

    this.init(layoutController);
    this.allowElementSelection = false;

    this.onDragEnter = function(renderer, e) {
        var dt = DataTransferService.getDataTransfer(e);
        var singlePageTemplate = PACE.utils.containsDragType(dt.types,'text/x-pace-single-page-template');
        this.allowSpreadSelection = !singlePageTemplate;
        this.allowPagesSelection = singlePageTemplate;
    };

    this.onDrop = function(renderer, e) {
        var spread = renderer.spread,
            dt = DataTransferService.getDataTransfer(e),
            template = JSON.parse(dt.getData("text/x-pace-template"));

        console.log('template dropped', template);

        var mode = this.dropMode.replace('spread-','');
        var cmd = new PACE.ApplyTemplateCommand(
            template,
            mode,
            spread,
            renderer.layout,
            null,
            null,
            PACE.AppConstants.DEFAULT_FIXED_SPACING);
        cmd.renderer = renderer;
        cmd.execute();

        UndoService.pushUndo(cmd);
        layoutController.scope.$apply();
        layoutController.fireEvent('layout:template-dropped');
        layoutController.fireEvent('layout:layout-changed');

        this.onDragLeave(renderer, e);


        var droppedFrames;
        if (mode==='left') {
            droppedFrames = renderer.spreadInfo.getLeftPage().getImageElements();
        } else if (mode==='right') {
            droppedFrames = renderer.spreadInfo.getRightPage().getImageElements();
        } else {
            droppedFrames = renderer.spreadInfo.getImageElements();
        }
        layoutController.clearSelection();
        renderer.clearSelection();

        if (_.every(droppedFrames, function(el) { return !el.imageFile; } )) {
            renderer.renderWithAnimation(function() {
                renderer.clearSelection();
                layoutController.clearSelection();
                layoutController.currentTool = new PACE.SelectionTool(layoutController);
                layoutController.selectElements(droppedFrames, true);
                layoutController.currentTool.beginEdit();
            });
        } else {
            renderer.renderWithAnimation();
        }

    };

};

PACE.TemplateDropTool.prototype = new PACE.BaseDropTool();
