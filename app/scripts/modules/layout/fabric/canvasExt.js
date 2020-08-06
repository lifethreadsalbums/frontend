'use strict';

var originalMouseDown = fabric.Canvas.prototype._onMouseDown,
    originalSetObjectScale = fabric.Canvas.prototype._setObjectScale;

fabric.util.getScrollLeftTop = function(element, upperCanvasEl) {
    return {left:0, top:0};
};

fabric.util.object.extend(fabric.Canvas.prototype, {

        // findTarget: function (e) {
        //     var mousePos = this.getPointer(e);
        //     var objects = this.getObjects();
        //     var target = null;
        //     for (var i = objects.length - 1; i >= 0; i--) {
        //         var object = objects[i],
        //             m = object.getGlobalMatrix();
        //         m.invert();
        //         var localMousePos = m.transformPoint(mousePos.x, mousePos.y);

        //         if (localMousePos.x>=0 && localMousePos.y>=0 &&
        //             localMousePos.x<=object.width && localMousePos.y<=object.height) {
        //             target = object;
        //             break;
        //         }
        //     }
        //     this._fireOverOutEvents(target);
        //     return target;
        // },

        getActiveObjectOrGroup: function() {
            return this.getActiveGroup() ? this.getActiveGroup() : this.getActiveObject();
        },

        setCanvasSize: function (size) {
            for (var prop in size) {
                var value = size[prop];
                this.lowerCanvasEl[prop] = value;
                this.lowerCanvasEl.style[prop] = value + 'px';

                if (this.upperCanvasEl) {
                    this.upperCanvasEl[prop] = value;
                    this.upperCanvasEl.style[prop] = value + 'px';
                }

                if (this.cacheCanvasEl) {
                    this.cacheCanvasEl[prop] = value;
                }

                if (this.wrapperEl) {
                    this.wrapperEl.style[prop] = value + 'px';
                }

                this[prop] = value;
                //this.calcOffset();
            }
          
            return this;
        },

        renderTop: function () {
            var ctx = this.contextTop || this.contextContainer;
            this.clearContext(ctx);

            // we render the top context - last object
            if (this.selection && this._groupSelector) {
                this._drawSelection();
            }

            // delegate rendering to group selection if one exists
            // used for drawing selection borders/controls
            var activeGroup = this.getActiveGroup();
            if (activeGroup) {
                activeGroup.render(ctx);
            }

            this._renderOverlay(ctx);

            //PACE tweak - do not fire after:render here
            //this.fire('after:render');

            return this;
        },

        //the code below is a bunch of hacks required to implement snapping
        
        _setObjectScale: function(localMouse, transform, lockScalingX, lockScalingY, by, lockScalingFlip, _dim) {

            var t = transform.target;
            if (t instanceof PACE.TextBoxElement) {
                var scaleX = (localMouse.x / transform.scaleX) / (t.width + t.strokeWidth),
                    scaleY = (localMouse.y / transform.scaleY) / (t.height + t.strokeWidth),
                    w = t.width * scaleX,
                    h = t.height * scaleY;

                if (t.get('lockUniScaling')) {
                    var scale = Math.max(scaleX, scaleY);
                    w = t.width * scale;
                    h = t.height * scale;
                    if (w >= t.minWidth && h >= t.minHeight) {
                        t.set('width', w);
                        t.set('height', h);
                    }
                } else {
                    if (w >= t.minWidth) t.set('width', w);
                    if (h >= t.minHeight) t.set('height', h);
                }
            } else {
                originalSetObjectScale.call(fabric.Canvas.prototype, localMouse, transform,
                    lockScalingX, lockScalingY, by, lockScalingFlip, _dim);
            }
        },
    

        //Tweaked method from canvas.class.js line 522
        //Changed how the new scale is calculated
        
        _scaleObjectEqually: function(localMouse, target, transform) {
            var strokeWidth = target.stroke ? target.strokeWidth : 0;
            var newScaleX = localMouse.x / (target.width + strokeWidth/2),
                newScaleY = localMouse.y / (target.height + strokeWidth/2),
                scale = Math.max(newScaleX, newScaleY);
           
            // if (transform.mousePos && transform.mousePos.snapped) {
            //     if (transform.mousePos.x!==transform.mousePos.oldX) {
            //         scale = newScaleX;
            //     } else if (transform.mousePos.y!==transform.mousePos.oldY) {
            //         scale = newScaleY;
            //     }               
            // }
            if (target.minScale) {
                scale = Math.max(scale, target.minScale);
            }
            if (target.maxScale) {
                scale = Math.min(scale, target.maxScale);
            }
            
            transform.newScaleX = scale;
            transform.newScaleY = scale;
            
            target.set('scaleX', transform.newScaleX);
            target.set('scaleY', transform.newScaleY);
            
            this.fire('object:scale-equally', { target: target });
        },

        /**
        canvas_events.mixin.js line 528
        Code for snapping has been added
        */
        
        _transformObject: function(e) {
            var pointer = this.getPointer(e),
                transform = this._currentTransform,
                edges = {
                    'mt': 'top',
                    'tr': 'top right',
                    'mr': 'right', 
                    'br': 'bottom right', 
                    'mb': 'bottom',
                    'bl': 'bottom left', 
                    'ml': 'left',
                    'tl': 'top left'
                };

            if (this.snappingService && transform.action!=='drag' && transform.target.__corner && 
                !(transform.target.lockScalingX || transform.target.lockScalingY)) {
                var mousePos = angular.copy(pointer),
                    pt = { 
                        x: (mousePos.x / this.scale) - this.offset.x, 
                        y: (mousePos.y / this.scale) - this.offset.y
                    },
                    rect = transform.target.getCoordsInModelSpace();

                mousePos.oldX = mousePos.x;
                mousePos.oldY = mousePos.y;
                var edge = edges[transform.target.__corner];
                var snapped = this.snappingService.snapPoint(rect, pt, edge);
                
                mousePos.x = (pt.x + this.offset.x) * this.scale;
                mousePos.y = (pt.y + this.offset.y) * this.scale;
                mousePos.snapped = snapped;
                pointer.x = mousePos.x;
                pointer.y = mousePos.y;
                transform.mousePos = mousePos;
            }
            
            transform.reset = false,
            transform.target.isMoving = true;

            this._beforeScaleTransform(e, transform);
            this._performTransformAction(e, transform, pointer);

            this.renderAll();
        },

        _shouldCenterTransform: function (e, target) {
            if (!target) return;

            var t = this._currentTransform,
                centerTransform;

            if (t.action === 'scale' || t.action === 'scaleX' || t.action === 'scaleY') {
                centerTransform = this.centeredScaling || target.centeredScaling;
            }
            else if (t.action === 'rotate') {
                centerTransform = this.centeredRotation || target.centeredRotation;
            }

            //modified code to disable centered transform with alt key
            return centerTransform;
        },
        
        //modify mouse down handler to add ability to prevent calling the original event handler
        _onMouseDown: function (e) {
            
            this.fire('before:mousedown', e);
            if (this.preventMouseDown) {
                return;
            }
            originalMouseDown.call(this, e);

        }, 

        //modify the original version to allow duplicating frames and shift+alt keys are pressed
        //and locking the X or Y axis
        _shouldGroup: function(e, target) {
            var activeObject = this.getActiveObject();

            var activeGroup = this.getActiveGroup();
            if (activeGroup===target) return false;

            return e.shiftKey && 
                (activeGroup || (activeObject && activeObject !== target)) && 
                this.selection;
        },

        _initStatic: function(el, options) {
            this._objects = [];

            this._createLowerCanvas(el);
            this._initOptions(options);

            if (options.overlayImage) {
                this.setOverlayImage(options.overlayImage, this.renderAll.bind(this));
            }
            if (options.backgroundImage) {
                this.setBackgroundImage(options.backgroundImage, this.renderAll.bind(this));
            }
            if (options.backgroundColor) {
                this.setBackgroundColor(options.backgroundColor, this.renderAll.bind(this));
            }
            if (options.overlayColor) {
                this.setOverlayColor(options.overlayColor, this.renderAll.bind(this));
            }
            //this.calcOffset();
            this._offset = {left:0, top:0};
        },

        _initInteractive: function() {
            this._currentTransform = null;
            this._groupSelector = null;
            this._initWrapperElement();
            this._createUpperCanvas();
            this._initEventListeners();

            this.freeDrawingBrush = fabric.PencilBrush && new fabric.PencilBrush(this);
            
            //this.calcOffset();
        },
       
    }
);
