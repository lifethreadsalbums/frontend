PACE.SelectAllCommand = function(ctrl) {

    this.execute = function() {
        ctrl.clearSelection();
        var elements = ctrl.currentRenderer.spread.elements.concat();
        ctrl.selectElements(elements, true);
        ctrl.currentRenderer.render();
        ctrl.currentTool = new PACE.SelectionTool(ctrl);
        ctrl.currentTool.beginEdit();
    };

};

PACE.DeselectAllCommand = function(ctrl) {

    this.execute = function() {
        ctrl.clearSelection();
        ctrl.currentRenderer.render();
    };

};

PACE.SelectAllGuidesCommand = function(ctrl) {

    this.execute = function() {
        ctrl.clearSelection();
        var guides = ctrl.currentRenderer.spread.guideLines;
        if (guides && guides.length>0) {
            ctrl.selectGuides(guides);
            ctrl.currentRenderer.render();
            ctrl.currentTool = new PACE.SelectionTool(ctrl);
            ctrl.currentTool.beginEdit();
        }
    };

};