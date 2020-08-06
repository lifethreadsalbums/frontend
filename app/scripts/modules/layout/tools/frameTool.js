PACE.FrameTool = function(ctrl) {
    'use strict';

    this.type = 'FrameTool';

    ctrl.setSelectionEnabled(false);
    ctrl.setDefaultCursor('crosshair');

    var frame, ctx, canvas,
        gridCols = 1,
        gridRows = 1,
        horizontalGap,
        verticalGap,
        constraint,
        lastMousePos,
        lastTarget;

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawGrid(grid) {
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0, canvas.width, canvas.height);
        ctx.lineWidth = 1;
        ctx.strokeStyle = PACE.LayoutSettings.emptyFrameColor;
        ctx.fillStyle = PACE.LayoutSettings.emptyFrameBackgroundColor;

        for (var i = 0; i < grid.length; i++) {
            var el = grid[i],
                x = Math.round(el.x),
                y = Math.round(el.y),
                w = Math.round(el.x + el.width) - x,
                h = Math.round(el.y + el.height) - y;

            ctx.globalAlpha = PACE.LayoutSettings.emptyFrameBackgroundAlpha;
            ctx.fillRect(x, y, w, h);
            ctx.globalAlpha = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, w, h);

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y + h);

            ctx.moveTo(x + w, y);
            ctx.lineTo(x, y + h);
            ctx.stroke();
        }
        ctx.restore();
    }

    function makeGrid(rect, gridCols, gridRows, hGap, vGap, square) {
        var gridWidth = Math.max(0.0001, (rect.width - (gridCols-1) * hGap) /  gridCols);
        var gridHeight = Math.max(0.0001, (rect.height - (gridRows-1) * vGap) /  gridRows);

        if (square) {
            var size = Math.min(gridWidth, gridHeight);
            gridWidth = gridHeight = size;
        }

        var grid = [],
            x = rect.x,
            y = rect.y;
        for(var r = 0;r<gridRows;r++)
        {
            x = rect.x;
            for(var c = 0;c<gridCols;c++)
            {
                grid.push( {x:x, y:y, width:gridWidth, height:gridHeight} );
                x += gridWidth + horizontalGap;
            }
            y += gridHeight + verticalGap;
        }
        return grid;
    }

    function changeGap(hgap, vgap) {
        var gridWidth = (frame.width - (gridCols-1) * hgap) /  gridCols;
        var gridHeight = (frame.height - (gridRows-1) * vgap) /  gridRows;

        if (hgap>0 && gridWidth>20)
            horizontalGap = hgap;
        if (vgap>0 && gridHeight>20)
            verticalGap = vgap;

        var grid = makeGrid(frame, gridCols, gridRows, horizontalGap, verticalGap);
        drawGrid(grid);
    }

    function makeRowsAndCols(numCols, numRows) {
        gridCols = numCols;
        gridRows = numRows;

        var grid = makeGrid(frame, gridCols, gridRows, horizontalGap, verticalGap);
        drawGrid(grid);
    }

    this.setConstraint = function(rect) {
        constraint = rect;
        if (frame) {
            if (constraint) {
                frame.height = frame.width * constraint.height/constraint.width;
            } else if (lastMousePos) {
                frame.width = lastMousePos.x - frame.x;
                frame.height = lastMousePos.y - frame.y;
            }
            makeRowsAndCols(gridCols, gridRows);
        }
    };

    this.onMouseDown = function(renderer, options) {
        if (options.target && options.target.element &&
            !options.target.element.imageFile &&
            options.target.element.type!=='BackgroundFrameElement') {

            ctrl.clearSelection();
            ctrl.currentTool = new PACE.SelectionTool(ctrl);
            ctrl.selectElements([options.target.element], true);
            ctrl.currentTool.beginEdit();
            renderer.canvas.__onMouseDown(options.e);
            return;
        }

        canvas = renderer.canvas;
        ctx = canvas.contextTop;
        ctrl.currentRenderer = renderer;
        ctrl.fireEvent('layout:current-renderer-changed');

        horizontalGap = verticalGap = ctrl.frameSpacing * 72 * ctrl.scale;

        var pos = canvas.getPointer(options.e);
        frame = {x:pos.x, y:pos.y, width:0, height:0, rotation:0};

        ctrl.snappingService.beginSnapping(ctrl);
        var pt = new PACE.Point(pos.x, pos.y).toModelSpace(canvas);
        ctrl.snappingService.enableSmartDimensions = false;
        var snapped = ctrl.snappingService.snapPoint(null, pt);
        ctrl.snappingService.enableSmartDimensions = true;

        if (snapped) {
            pos = pt.toCanvasSpace(canvas);
            frame.x = pos.x;
            frame.y = pos.y;
        }
    };

    this.onMouseMove = function(renderer, options) {

        if (options.target && options.target.element &&
            !options.target.element.imageFile &&
            options.target.element.type!=='BackgroundFrameElement') {
            ctrl.setDefaultCursor('move');
        } else {
            ctrl.setDefaultCursor('crosshair');
        }

        lastTarget = options.target;

        if (!frame)
            return;

        var pos = canvas.getPointer(options.e);
        lastMousePos = pos;

        frame.width = pos.x - frame.x;
        frame.height = pos.y - frame.y;

        var rect = new PACE.Rect(frame).toModelSpace(canvas),
            pt = new PACE.Point(pos.x, pos.y).toModelSpace(canvas);

        var snapped = ctrl.snappingService.snapPoint(rect, pt, 'right bottom');
        if (snapped) {
            pos = pt.toCanvasSpace(canvas);
            frame.width = pos.x - frame.x;
            frame.height = pos.y - frame.y;
        }
        if (constraint)
            frame.height = frame.width * constraint.height/constraint.width;

        var grid = makeGrid(frame, gridCols, gridRows, horizontalGap, verticalGap);
        drawGrid(grid);
        if (snapped) {
            //fake active object only for the purpose of drawing snapped guides
            var obj = new fabric.Object({left:frame.x, top:frame.y,
                width:frame.width, height:frame.height, originX:'left', originY:'top'});
            obj.canvas = canvas;
            canvas.setActiveObject(obj);
            renderer.renderGuides( ctrl.snappingService.getSnappedGuides() );
            canvas.discardActiveObject();
        }
    };

    this.onMouseUp = function(renderer, options) {

        if (frame.width<10 || frame.height<10) {
            frame = null;
            ctrl.snappingService.endSnapping();
            ctrl.snappingService.clearSnappedGuides();
            clearCanvas();

            if (!options.target) {
                this.exit();
            }
            return;
        }

        var spread = renderer.spread,
            grid = makeGrid(frame, gridCols, gridRows, horizontalGap, verticalGap),
            elements = [];

        for (var i = 0; i < grid.length; i++) {
            var rect = new PACE.Rect(grid[i]).toModelSpace(canvas),
                el = { type: 'ImageElement', rotation:0, opacity:1, imageRotation:0 };

            _.extend(el, _.pick(rect,'x','y','width','height'));
            elements.push(el);
        }

        spread.locked = false;

        var cmd = new PACE.AddElementsCommand(spread, elements);
        cmd.execute();
        renderer.render();

        frame = null;
        gridCols = 1;
        gridRows = 1;

        ctrl.snappingService.endSnapping();
        ctrl.snappingService.clearSnappedGuides();
        clearCanvas();

        ctrl.selectElements(elements, true);
        ctrl.fireEvent('layout:layout-changed');
    };

    this.onKeyDown = function(e) {

        // if (lastTarget) {
        //     var cursor = e.altKey ? 'crosshair' : 'move';
        //     ctrl.setDefaultCursor(cursor);
        // }

        if (!frame) return;

        if (e.keyCode===38 || e.keyCode===40 || e.keyCode===39 || e.keyCode===37) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        if (e.ctrlKey || e.metaKey) {
            var inc = 0.01 * 72; 
            if (e.keyCode===38) //up
                changeGap(horizontalGap, verticalGap + inc);
            else if (e.keyCode===40) //down
                changeGap(horizontalGap, verticalGap - inc);
            else if (e.keyCode===39) //right
                changeGap(horizontalGap + inc, verticalGap);
            else if (e.keyCode===37 && gridCols>1) //left
                changeGap(horizontalGap - inc, verticalGap);
        } else {
            if (e.keyCode===38) //up
                makeRowsAndCols(gridCols, gridRows+1);
            else if (e.keyCode===40 && gridRows>1) //down
                makeRowsAndCols(gridCols, gridRows-1);
            else if (e.keyCode===39) //right
                makeRowsAndCols(gridCols+1, gridRows);
            else if (e.keyCode===37 && gridCols>1) //left
                makeRowsAndCols(gridCols-1, gridRows);
            else if (e.shiftKey) {
                this.setConstraint({width:gridCols, height:gridRows});
            }
        }

        // if (e.keyCode==Keyboard.SPACE && addingNewFrame)
        // {
        //  if (!movingWithSpace)
        //  {
        //      stopResizing();
        //      startDragging();
        //      movingWithSpace = true;
        //      draggingEdge = currentEdge;
        //      editor.editManager.setGlobalAutoCentering(false);
        //  }
        //  e.stopImmediatePropagation();
        //  e.preventDefault();
        // }

        //X = 88
        //Period = 190
        if ((e.keyCode===88 || e.keyCode===190) && constraint==null) {
            var bounds = frame;
            var w, h;

            if (bounds.width > bounds.height)
            {
                w = bounds.width;
                h = bounds.width * 2/3;
            } else {
                h = bounds.height;
                w = bounds.height * 2/3;
            }
            this.setConstraint({width:w * gridCols, height:h * gridRows});
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    };

    this.exit = function() {
        ctrl.currentTool = new PACE.SelectionTool(ctrl);
        if (ctrl.selectedElements.length>0)
            ctrl.currentTool.beginEdit();
        ctrl.scope.$apply();
    };

    this.onKeyUp = function(e) {
        if (!e.shiftKey && constraint && frame) {
            this.setConstraint(null);
        }

        if (e.keyCode===27) {
            this.exit();
        }

        // if (lastTarget) {
        //     var cursor = e.altKey ? 'crosshair' : 'move';
        //     ctrl.setDefaultCursor(cursor);
        // }
    };
};
