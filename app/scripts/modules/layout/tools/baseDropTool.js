PACE.BaseDropTool = function() {
	"use strict";

    var settings = {
        margin: 60,
        fillStyle: 'rgba(102, 204, 255, 0.2)',
        swapFillStyle: 'rgba(119, 210, 246, 0.5)',
        overlayFillStyle: 'rgba(0, 0, 0, 0.5)'
    };

    var that = this;
    
    this.dropTarget = null,
    this.dropMode = null;
    this.allowElementSelection = true;
    this.allowSpreadSelection = true;
    this.allowPagesSelection = true;

    var prevDrawFn,
        currentDrawFn,
        layoutController;

    function findTarget(renderer, e) {
        var objects = renderer.canvas.getObjects();
        for (var i = objects.length - 1; i >= 0; i--) {
            var object = objects[i];
            if (object.element.type==='ImageElement' && renderer.canvas.containsPoint(e.e, object)) {
                return object;
            }
        }
        return null;
    }

    function getMode(renderer, e, allowSpreadSelection) {
        var canvas = renderer.canvas,
            mousePos = canvas.getPointer(e),
            m = allowSpreadSelection ? settings.margin : 0;

        if (renderer.spreadInfo.pages.length===1) {
            return renderer.spreadInfo.pages[0].isLeft() ? 'left' : 'right';
        }

        if (mousePos.x >= 0 && mousePos.y >= 0 && mousePos.x <= canvas.width && mousePos.y <= canvas.height) {
            if (canvas.width / 2 - m >= mousePos.x)
                return 'left';
            if (canvas.width / 2 + m < mousePos.x)
                return 'right';
            return 'spread';
        }
    }

    function clearCanvas(renderer) {
        var canvas = renderer.canvas,
            ctx = canvas.getSelectionContext();
            
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function getPageUnderMouse(renderer, e) {
        var canvas = renderer.canvas,
            pages = renderer.spreadInfo.pages,
            mousePos = canvas.getPointer(e);

        for (var i = pages.length - 1; i >= 0; i--) {
            var rect = pages[i].getBleedRect().toCanvasSpace(canvas);
            if (rect.containsPoint(mousePos.x, mousePos.y)) {
                return pages[i];
            }
        }
        return null;
    }

    function isPageEmpty(spread, page) {
        var rect = page.getBleedRect();
        for (var i = 0; i < spread.elements.length; i++) {
            var elRect = new PACE.Element(spread.elements[i]).getBoundingBox();
            if (rect.intersects(elRect)) {
                return false;
            }
        }
        return true;
    }

    function doTransition(renderer, drawFn) {
        prevDrawFn = currentDrawFn;
        currentDrawFn = drawFn;

        fabric.util.animate({
            startValue: 0,
            endValue: 1,
            duration: 300,
            onChange: function(value) {
                clearCanvas(renderer);
                if (prevDrawFn) prevDrawFn(1 - value);
                if (currentDrawFn) currentDrawFn(value);
            }
        });
    }

    this.drawPageOverlay = function (renderer, e, page) {
        var canvas = renderer.canvas,
            ctx = canvas.getSelectionContext(),
            rect;

        if (page) {
            rect = page.getBleedRect().toCanvasSpace(canvas).round();
            this.dropMode = 'page';
        } else {
            var mode = 'spread';

            if (this.allowPagesSelection) {
                mode = getMode(renderer, e, this.allowSpreadSelection);
            }

            if (renderer.spread.numPages === 1 && 
                ((renderer.spread.pageNumber === 1 && mode!=='right') ||
                (renderer.spread.pageNumber !== 1 && mode!=='left'))) {
                return;
            }

            var bounds = _.map(
                renderer.spreadInfo.pages,
                function (page) {
                    return page.getBleedRect(); 
                }
            );
            
            switch (mode) {
                case 'left':
                    rect = bounds[0];
                    break;
                case 'right':
                    if (bounds.length > 1)
                        rect = bounds[1];
                    else rect = bounds[0];
                    break;
                default:
                    if (bounds.length > 1)
                        rect = bounds[0].union(bounds[1]);
                    else rect = bounds[0];
                    break;
            }
            
            this.dropMode = 'spread-' + mode;
            rect = rect.toCanvasSpace(canvas).round();
        }
        
        return function(t) {
            ctx.save();
            ctx.globalAlpha = t;
            ctx.fillStyle = settings.fillStyle;
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            ctx.restore();
        };
    }

    this.drawTargetOverlay = function(target, renderer, e) {
        this.dropTarget = target;
        if (!target) {
            this.dropMode = null;
            return null;
        }

        var canvas = renderer.canvas,
            ctx = canvas.getSelectionContext(),
            isEmptyFrame = !target.element.imageFile;
            
        var matrix = target.getMatrix(),
            midY =  target.height*target.scaleY/2,
            mid1 = matrix.transformPoint(target.width/2, target.height*0.25),
            mid2 = matrix.transformPoint(target.width/2, target.height*0.75);
            
        matrix.invert();
        var mousePos = canvas.getPointer(e);
        mousePos = matrix.transformPoint(mousePos.x, mousePos.y);

        this.dropMode = 'target-' + target.element._id;
        
        return function(t) {
            ctx.save();

            ctx.setTransform(1,0,0,1,0,0);
            ctx.translate(target.left, target.top);
            ctx.rotate(target.angle * Math.PI/180);

            ctx.globalAlpha = t;
            ctx.fillStyle = settings.swapFillStyle;
            ctx.fillRect(0, 0, target.width*target.scaleX, target.height*target.scaleY);
        
            ctx.restore();
        };
    }

    this.init = function(ctrl) {
        layoutController = ctrl;
    };

    this.onDrop = function(renderer, e) {
    };

    this.onDragOver = function(renderer, e) {
        var prevDropMode = this.dropMode,
            drawFn;

        if (this.allowElementSelection && renderer.canvas.getObjects().length>0) {
            var page = getPageUnderMouse(renderer, e),
                target = findTarget(renderer, e);

            if (target) {
                drawFn = this.drawTargetOverlay(target, renderer, e);
            } else {
                drawFn = this.drawPageOverlay(renderer, e);
            } 
        } else {
            drawFn = this.drawPageOverlay(renderer, e);
        }

        if (this.dropMode!==prevDropMode) {
            doTransition(renderer, drawFn);
        }
    };

    this.onDragLeave = function(renderer, e) {
        this.dropMode = null;
        doTransition(renderer, null);
    };
	
};