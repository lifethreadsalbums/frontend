PACE.FixedGuideTool = function (layoutController, orientation, selectedGuide) {
    'use strict';
    
    var settings = {
            pageGetRect: 'getBleedRect'
        },
    
        that = this,
        renderer = layoutController.currentRenderer,
        canvas = renderer.canvas,
        guide = selectedGuide,
        
        getGuide = function (pos, rect) {
            return orientation === 'h' ?
                new PACE.FixedGuide(rect.left, pos.y, rect.right, pos.y, false, true) : 
                new PACE.FixedGuide(pos.x, rect.top, pos.x, rect.bottom, false, true);
        },
        
        getParentSpreadRect = function (spread, layout) {
            var pages = new PACE.SpreadInfoFactory().create(spread, layout).pages,
                rects = _.map(pages, function (page) {
                    return page[settings.pageGetRect]();
                });

            return _.reduce(
                rects,
                function (spreadRect, rect) {
                    if (spreadRect === null) return rect;
                    else return spreadRect.union(rect);
                },
                null);
        },
        
        setUpRenderers = function (newRenderer) {
            if (renderer !== newRenderer) {
                renderer.removeGuides(guide);
                renderer.render();
            } else {
                newRenderer.removeGuides(guide);
                layoutController.deselectGuide(guide);
            }
            
            renderer = newRenderer;
            canvas = renderer.canvas;
        };

    var selectedElements = layoutController.selectedElements;
    layoutController.selectedElements = [];
    layoutController.snappingService.beginSnapping(layoutController);
    layoutController.selectedElements = selectedElements;
    
    this.onExit = function () {
        layoutController.currentTool = new PACE.SelectionTool(layoutController);
        layoutController.selectGuide(guide);
        renderer.render();
    };
    
    this.onMouseMove = function (layoutRenderer, options) {
        setUpRenderers(layoutRenderer);
        
        var pointer = canvas.getPointer(options.e),
            pos = new PACE.Point(pointer.x, pointer.y).toModelSpace(canvas);

        layoutController.snappingService.enableSmartDimensions = false;
        var snapped = layoutController.snappingService.snapPoint(null, pos);
        layoutController.snappingService.enableSmartDimensions = true;

        guide = getGuide(pos, getParentSpreadRect(layoutRenderer.spread, layoutRenderer.layout));
        layoutController.selectGuide(guide);
        
        renderer.addGuides(guide);
        renderer.render();
    };
    
    this.onMouseUp = function (layoutRenderer, options) { that.onExit(); };
};
