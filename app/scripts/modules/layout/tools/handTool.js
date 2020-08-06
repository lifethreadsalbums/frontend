PACE.HandTool = function(ctrl) {
    'use strict';

    this.type = 'HandTool';

    ctrl.setSelectionEnabled(false);
    ctrl.setDefaultCursor('pointer');

    var container = ctrl.renderers[0].getCanvasContainer()[0];
    container.style.cursor = 'pointer';
    
    var mousePos,
        scrollPos;

    this.onMouseDown = function (renderer, options) {
        
        var ctrlKey = (options.e.ctrlKey || options.e.metaKey),
            altKey = options.e.altKey;

        console.log('onMouseDown', ctrlKey, altKey)
        if (ctrlKey) {
            new PACE.ZoomCommand(ctrl, ctrl.scope, !altKey).execute();
        } else {
            mousePos = {x: options.e.pageX, y: options.e.pageY};
            scrollPos = {top: container.scrollTop, left: container.scrollLeft};
        }
    };

    this.onMouseMove = function (renderer, options) {
        if (mousePos) {
            var pos = {x: options.e.pageX, y: options.e.pageY},
                dx = pos.x - mousePos.x,
                dy = pos.y - mousePos.y;
            container.scrollTop = scrollPos.top - dy;
            container.scrollLeft = scrollPos.left - dx;
        }
    };
    
    this.onMouseUp = function (renderer, options) {
        mousePos = null;
    };

    this.exit = function() {
        ctrl.currentTool = new PACE.SelectionTool(ctrl);
        ctrl.setSelectionEnabled(true);
        ctrl.setDefaultCursor('default');
        container.style.cursor = 'default';
    };

};