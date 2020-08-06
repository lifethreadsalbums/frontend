PACE.TextTool = function (ctrl) {
    'use strict';

    this.type = 'TextTool';

    ctrl.setSelectionEnabled(false);
    ctrl.setDefaultCursor('crosshair');
    
    var defaultTextElement = {
            type: 'TextElement',
            text: '',
            fontSize: 40,
            fontFamily: 'HelveticaRegular',
            opacity: 1,
            rotation: 0,
            fill: '#000000'
        },
    
        canvas,
        ctx, 
        frame,
        that = this,

        clearCanvas = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        
        drawFrame = function () {
            if (frame) {
                ctx.clearRect(0,0,canvas.width,canvas.height);
                ctx.save();
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'red';
                ctx.strokeRect(Math.round(frame.x) + 0.5, Math.round(frame.y) + 0.5, Math.round(frame.width), Math.round(frame.height));
                ctx.restore();
            }
        },
        
        editElement = function (el, renderer, e) {
            ctrl.selectElements([el], true);
            ctrl.currentEditor = new PACE.TextEditor(ctrl);
            ctrl.currentEditor.beginEdit(e);
            ctrl.fireEvent('layout:current-editor-changed');
        },

        addToSpread = function(el, renderer) {
            var spread = renderer.spread;

            that.lastTextElement = el;
            new PACE.AddElementsCommand(spread, [el]).execute();
            renderer.render();
            editElement(el, renderer);
        },

        getSpineRect = function(renderer) {
            var spreadInfo = new PACE.SpreadInfoFactory().create(renderer.spread, renderer.layout);
            return spreadInfo.getSpineRect();
        },

        createSpineText = function(renderer) {
            var spread = renderer.spread,
                layout = renderer.layout;

            var spineColor = _.findWhere(spread.elements, {type:'BackgroundFrameElement', target:'spine'});

            var fill = '#000000';
            if (spineColor && spineColor.backgroundColor==='#000000')
                fill = '#ffffff';

            var el = _.extend(angular.copy(defaultTextElement), 
                    {
                        type: 'SpineTextElement',
                        rotation: 90,
                        textAlign: 'center',
                        fill: fill
                    });

            var spineRect = getSpineRect(renderer);
            el.x = spineRect.x + spineRect.width;
            el.y = spineRect.y;
            el.width = spineRect.height;
            el.height = spineRect.width;
            
            addToSpread(el, renderer);
        };

    this.setDefaultTextElement = function(el) {
        _.extend(defaultTextElement, el);
    };

    this.onMouseDown = function (renderer, options) {

        var target = options.target,
            targetType = target && target.element ? target.element.type : null;

        canvas = renderer.canvas;
        ctx = canvas.contextTop;

        if (target && ctrl.currentRenderer===renderer && 
            ctrl.currentEditor instanceof PACE.TextEditor && 
            ctrl.selectedElements.length===1 && ctrl.selectedElements[0]===target.element) {

            var corner = target._findTargetCorner(canvas.getPointer(options.e, true));
            if (corner) {
                //hack to prevent selecting text when the text box is being resized
                target.selected = false;
                setTimeout(function() {
                    target.selected = true;
                    target.__isMousedown = false;
                });
            }
            return;
        }

        if (targetType==='TextElement' || targetType==='SpineTextElement') {
            editElement(options.target.element, renderer, options.e);
            this.lastTextElement = options.target.element;
            return;
        }

        ctrl.clearSelection();
        if (ctrl.currentRenderer && ctrl.currentRenderer !== renderer) {
            ctrl.currentRenderer.clearSelection();
        }

        ctrl.setCurrentRenderer(renderer);
        ctrl.setSelectionEnabled(false);

        //draw text box
        var pos = canvas.getPointer(options.e),
            pt = new PACE.Point(pos.x, pos.y).toModelSpace(canvas);

        if (renderer.layout.layoutSize.coverType &&
            renderer.layout.layoutSize.dynamicSpineWidth && targetType!=='SpineTextElement') {

            var spineRect = getSpineRect(renderer);
            if (spineRect.containsPoint(pt.x, pt.y)) {
                setTimeout(function() { 
                    createSpineText(renderer);
                });
                frame = null;
                return;
            }
        }

        frame = {
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0
        };
        ctrl.snappingService.beginSnapping(ctrl);
    };

    this.onDoubleClick = function(layoutRenderer, options) {
        if (options.target instanceof PACE.TextElement || options.target instanceof PACE.SpineTextElement) {
            ctrl.currentEditor = new PACE.TextEditor(ctrl);
            ctrl.currentEditor.beginEdit(options.e);
            ctrl.fireEvent('layout:current-editor-changed');
        }
    };
    
    this.onMouseMove = function (renderer, options) {
        var canvas = renderer.canvas,
            target = options.target,
            targetType = target && target.element ? target.element.type : null;

        if (canvas._currentTransform) return;

        if (targetType==='TextElement' || targetType==='SpineTextElement') {
            
            var corner = target._findTargetCorner(canvas.getPointer(options.e, true));
            if (corner)
                canvas._setCornerCursor(corner, target);
            else {
                ctrl.setDefaultCursor(targetType==='SpineTextElement' && target.angle!==0 ? 'vertical-text' : 'text');
            }

        } else {
            ctrl.setDefaultCursor('crosshair');
        }

        if (frame) {
            var pos = canvas.getPointer(options.e);
            
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
            
            drawFrame();

            if (snapped) {
                //fake active object only for the purpose of drawing snapped guides
                var obj = new fabric.Object({left:frame.x, top:frame.y, 
                    width:frame.width, height:frame.height, originX:'left', originY:'top'});
                obj.canvas = canvas;
                canvas.setActiveObject(obj);
                renderer.renderGuides( ctrl.snappingService.getSnappedGuides() );
                canvas.discardActiveObject();
            }
        }  
    };
    
    this.onMouseUp = function (renderer, options) {
        if (!frame || frame.width<10 || frame.height<10) {
            frame = null;
            ctrl.snappingService.endSnapping();
            ctrl.snappingService.clearSnappedGuides();
            clearCanvas();

            // if (!options.target || options.target.type==='BackgroundFrameElement') {
            //     this.exit();
            // }
            return;
        } 
        
        var spread = renderer.spread,
            rect = new PACE.Rect(frame).toModelSpace(canvas),
            el = _.extend(angular.copy(defaultTextElement), {});
        
        if (ctrl.scope.model.defaultFontStyle) {
            _.extend(el, ctrl.scope.model.defaultFontStyle);
        }
        // extend element with model coordinates
        _.extend(el, _.pick(rect, 'x', 'y', 'width', 'height') );

        // set the frame variable to null - i.e. drawing is done.
        frame = null;

        addToSpread(el, renderer);
        ctrl.snappingService.endSnapping();
        ctrl.snappingService.clearSnappedGuides();
        clearCanvas();

        ctrl.fireEvent('layout:layout-changed');

        // if (this.selectionToolClass) {
        //     ctrl.currentTool = new PACE[this.selectionToolClass](ctrl);
        // } else {
        //     ctrl.currentTool = new PACE.SelectionTool(ctrl);
        // }
    };

    this.exit = function() {

        if (ctrl.currentEditor instanceof PACE.TextEditor) {
            ctrl.currentEditor.endEdit();
        }

        if (this.selectionToolClass) {
            ctrl.currentTool = new PACE[this.selectionToolClass](ctrl);
        } else {
            ctrl.currentTool = new PACE.SelectionTool(ctrl);
        }
        if (ctrl.selectedElements.length>0)
            ctrl.currentTool.beginEdit();

        ctrl.scope.$apply();
    };

    // this.onKeyUp = function(e) {
        
    //     if (e.keyCode===27) {
    //         this.exit();
    //     }
        
    // };
};