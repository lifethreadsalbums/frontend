'use strict';

angular.module('pace.layout')
    .directive('layoutKeyHandler', ['$timeout', '$window', '$parse', 'KeyboardService', function ($timeout, $window, $parse, KeyboardService) {
        return {
            restrict: 'A',
            priority: -1000,
            link: function postLink($scope, $element, $attrs) {

                var layoutController = $parse($attrs.layoutController)($scope);

                var onKeyPress = function(e) {
                    layoutController.onKeyPress(e);

                };
                var onKeyDown = function(e) {
                    layoutController.onKeyDown(e);
                };
                var onKeyUp = function(e) {
                    layoutController.onKeyUp(e);
                };

                $element[0].addEventListener('keydown', onKeyDown);
                $element[0].addEventListener('keyup', onKeyUp);
                //$window.addEventListener('copy', onKeyPress);

                $element.on('$destroy', function() {
                    $element[0].removeEventListener('keydown', onKeyDown);
                    $element[0].removeEventListener('keyup', onKeyUp);
                    //$window.removeEventListener('copy', onKeyPress);
                });

            }
        };

    }])

    .controller('SpreadController', ['$scope', '$element', '$attrs', 'GeomService', 'DataTransferService',
        function($scope, $element, $attrs, GeomService, DataTransferService) {

        var fabricObjects = {},
            self = this,
            eventsEnabled = true,
            isAnimating = false,
            editable = $attrs.editable!=='false',
            layoutController = $scope.layoutController,
            $canvasContainer = $element.closest('.scrollable-container'),
            spreadElement = $element.closest('.spread'),
            horizontalContainer = $canvasContainer ? $canvasContainer.hasClass('scrollable-container-horizontal') : null;


        fabric.Object.prototype.transparentCorners = false;
        fabric.Object.prototype.cornerSize = 8;
        fabric.Object.prototype.rotatingPointOffset = 20;
        fabric.Object.prototype.borderColor = '#0bc1f3';
        fabric.Object.prototype.cornerColor = '#0bc1f3';
        fabric.Object.prototype.hasRotatingPoint = false;

        this.spread = $scope.spread;
        this.layout = $scope.layout;
        this.scale = $scope.layoutController.scale;
        this.layoutController = $scope.layoutController;
        this.pages = [];
        this.selectionEnabled = true;
        this.allowUnknownObjects = false;
        this.mode = $scope.mode || 'Spread';
        this.canvasRoundFn = Math.floor;

        var previewScale = this.scale,
            scalePreviewMode = false,
            // set to true is the page guides should be drawn during scale preview
            drawGuidesInScalePreview = false,
            calcOffset = true;

        var canvas = this.canvas = new fabric.Canvas($element[0], {
            selection:editable,
            renderOnAddRemove:false,
            controlsAboveOverlay:true
        });
        canvas.scale = this.scale;
        canvas.selectionColor = 'rgba(102, 204, 255, 0.2)';
        canvas.selectionBorderColor = 'rgba(102, 204, 255, 255)';
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'default';
        //fix problem with text rendering in safari
        //canvas.getElement().style.webkitFontSmoothing = 'antialiased';

        function onCanvasContainerScroll() {
            calcOffset=true;
        }

        if ($canvasContainer) {
            $canvasContainer.on('scroll', onCanvasContainerScroll);
        }

        var addEventHandler = function(eventName, fn) {
            canvas.on(eventName, function(options) {
                //if (eventsEnabled && !isAnimating) {
                if (eventsEnabled) {
                    eventsEnabled = false;
                    fn.call(layoutController, self, options);
                    eventsEnabled = true;
                    //console.log('event - ' + eventName);
                }
            });
        };

        var events = {
            'object:selected': layoutController.onObjectSelected,
            'selection:cleared': layoutController.onSelectionCleared,
            'mouse:down': layoutController.onMouseDown,
            'mouse:move': layoutController.onMouseMove,
            'mouse:up': layoutController.onMouseUp,
            'before:mousedown': layoutController.onBeforeMouseDown
        };

        for(var eventName in events) {
            addEventHandler(eventName, events[eventName]);
        }

        canvas.on('before:render', function() {
            if (self.mode==='Spread') {
                self.spreadInfo.drawBackground(canvas);
            }
        });

        canvas.on('after:render', function() {
            if (drawGuidesInScalePreview || !scalePreviewMode) {

                if (self.mode === 'Spread') {
                    self.spreadInfo.drawForeground(canvas);
                }

                if (self.layout && self.layout.viewState && self.layout.viewState.guidesVisible) {
                    _.each($scope.spread.guideLines, function (guide) {
                        if (guide.__type === 'PACE.FixedGuide') {
                            guide.selected = _.contains(layoutController.selectedGuides, guide);
                            PACE.FixedGuide.draw(guide, canvas);
                        } else {
                            guide.draw(canvas);
                        }
                    });
                }
            }
        });

        function closeErrorPopup(popup) {
            popup.fadeOut(300, function() {
                popup.remove();
            });
        }

        canvas.on('mouse:over', function(info) {
            var element = info.target.element;
            if (element && element.errors && element.errors.length>0) {
                var box = new PACE.Element(element).getBoundingBox().toCanvasSpace(canvas);

                var errorPopup = angular.element('<div class="error-popup-container">'+
                        '<div class="error-popup"><span>' + element.errors[0].getErrorMessage() +
                        '</span></div></div>');

                document.body.appendChild(errorPopup[0]);
                errorPopup.hide().fadeIn(300);

                var rect = self.element[0].getBoundingClientRect();
                box.left += rect.left;
                box.top += rect.top;

                var popupRect = errorPopup[0].getBoundingClientRect();
                errorPopup[0].style.top = (box.top - popupRect.height - 10) + 'px';
                errorPopup[0].style.left = ((box.left + box.width - 48) - popupRect.width/2)  + 'px';
                info.target.errorPopup = errorPopup;
            }
        });

        canvas.on('mouse:out', function(info) {
            var errorPopup = info.target.errorPopup;
            if (errorPopup) {
                closeErrorPopup(errorPopup);
                info.target.errorPopup = null;
            }
        });

        function upperCanvasDoubleClick(e) {
            if (eventsEnabled) {
                eventsEnabled = false;
                layoutController.onDoubleClick(self, { e: e, target: canvas.getActiveObject() });
                eventsEnabled = true;
            }
        }

        function upperCanvasMouseOut(e) {
            _.each(canvas.getObjects(), function(object) {
                var errorPopup = object.errorPopup;
                if (errorPopup) {
                    closeErrorPopup(errorPopup);
                    object.errorPopup = null;
                }
            });
            if (eventsEnabled) {
                layoutController.onMouseOut(self, { e:e, target: null });
            }
        }

        function upperCanvasMouseMove() {
            if (calcOffset) {
                canvas.calcOffset();
                calcOffset = false;
            }
        }

        canvas.getSelectionElement().addEventListener('dblclick', upperCanvasDoubleClick);
        canvas.getSelectionElement().addEventListener('mouseout', upperCanvasMouseOut);
        canvas.getSelectionElement().addEventListener('mousemove', upperCanvasMouseMove);

        this.addGuides = function (guides) {
            if(!_.isUndefined(guides) && !_.isNull(guides)) {
                if (_.isArray(guides)) {
                    _.each(guides, self.addGuides);
                } else {
                    if(_.isUndefined($scope.spread.guideLines)) {
                        $scope.spread.guideLines = [];
                    }
                    $scope.spread.guideLines.push(guides);
                }
            }
        };

        this.removeGuides = function (guides) {
            if(!_.isUndefined(guides) && !_.isNull(guides)) {
                if (_.isArray(guides)) {
                    _.each(guides, self.removeGuides);
                } else {
                    $scope.spread.guideLines = _.reject($scope.spread.guideLines, function (g) {
                        return g === guides;
                    });
                }
            }
        };

        this.hasGuide = function (guide) {
            return _.contains($scope.spread.guideLines, guide);
        };

        this.getGuideAtPos = function (event) {
            var guideTolerance = 4,
                pointer = canvas.getPointer(event),
                pos = new PACE.Point(pointer.x, pointer.y).toModelSpace(canvas),
                eq = function(a, b) { return a > b - guideTolerance && a < b + guideTolerance; };

            return _.find($scope.spread.guideLines, function (g) {
                if (PACE.Guide.isHorizontal(g)) {
                    return eq(pos.y, g.y1) && pos.x >= g.x1 && pos.x <= g.x2;
                } else {
                    return eq(pos.x, g.x1) && pos.y >= g.y1 && pos.y <= g.y2;
                }
            });
        };

        this.selectAllGuides = function (select) {
            if (_.isUndefined(select)) select = true;
            _.each($scope.spread.guideLines, function (g) { g.selected = select; });
        };

        this.setSelectionEnabled = function(enabled) {
            this.selectionEnabled = enabled;
            canvas.selection = enabled;
            canvas.forEachObject(function(o) {
                o.selectable = enabled;
                if (o.refresh) o.refresh();
            });
        };

        this.makePages = function() {
            var spreadInfoFactory = this.spreadInfoFactory || new PACE.SpreadInfoFactory();

            this.spreadInfo = spreadInfoFactory.create($scope.spread, $scope.layout);
            this.padding = this.mode==='Spread' ? this.spreadInfo.padding : 0;
            this.offset = canvas.offset = {x: this.padding, y: this.padding};
        };

        this.getFabricObject = function (id) {
            return fabricObjects[id];
        };

        var onImageLoading = function() {
            if($scope.$parent && $scope.$parent.setLoading) {
                $scope.$parent.setLoading(true);
            }
        };

        var onImageLoaded = function () {
            if (self.disposed || isAnimating) return;

            if($scope.$parent && $scope.$parent.setLoading) {
                $scope.$parent.setLoading(false);
            }
            if (this.refresh) this.refresh();
            canvas.renderAll();
        };

        var newFabricObject = function(element) {
            var clazz = PACE[element.type],
                object;

            if (element.type==='TextElement') clazz = PACE.TextBoxElement;

            if (clazz===PACE.MaterialElement || clazz===PACE.PolygonMaterialElement) {
                object = new clazz(element, $scope.product, $scope.productPrototype);
            } else {
                object = new clazz(element);
            }
            if (object instanceof PACE.ImageElement ||
                object instanceof PACE.MaterialElement ||
                object instanceof PACE.PolygonMaterialElement ||
                object instanceof PACE.ImageStampElement ||
                object instanceof PACE.TextStampElement ||
                object instanceof PACE.TextElement) {
                object.on('image:loading', onImageLoading);
                object.on('image:loaded', onImageLoaded);
            }

            return object;
        };

        var getCanvasSize = function(scale) {
            var canvasSize;

            if (self.mode!=='Spread') {
                var layoutSize = $scope.layout.layoutSize;
                canvasSize = {
                    width: layoutSize.width,
                    height: layoutSize.height
                }
            } else {
                canvasSize = self.spreadInfo.getCanvasSize();
            }

            canvasSize.width = self.canvasRoundFn(canvasSize.width * scale);
            canvasSize.height = self.canvasRoundFn(canvasSize.height * scale);

            return canvasSize;
        };

        var uniqueId = function() {
            return _.uniqueId('element-') + _.now();
        };

        var setupFabricObject = function(fabricObject, element) {
            var isSpreadLocked = !!$scope.spread.locked,
                isElementLocked = isSpreadLocked || element.locked,
                isStamp = element.type==='TextStampElement' || element.type==='ImageStampElement';

            fabricObject.renderer = self;
            fabricObject.canvas = canvas;
            fabricObject.element = element;
            fabricObject.selectable = self.selectionEnabled;
            fabricObject.setCoordsFromModel(element);
            fabricObject.lockMovementX = fabricObject.lockMovementY =
                fabricObject.lockScalingX = fabricObject.lockScalingY = isElementLocked;
            fabricObject.hasControls = !isElementLocked || isStamp;
            //fabricObject.borderScaleFactor = isSpreadLocked && !isStamp ? 0.2 : 1;
            //fabricObject.strokeWidth = isSpreadLocked && !isStamp ? -8 : 1;
            if (fabricObject.refresh) fabricObject.refresh();
        };

        var initGroup = function(elementGroup, ids) {
            elementGroup.saveCoords();
            var group = elementGroup.element;
            for (var i = 0; i < group.elements.length; i++) {
                var element = group.elements[i];
                element._id = element._id || uniqueId();
                ids.push(element._id);
                var fabricObject = fabricObjects[element._id] || newFabricObject(element);

                if (!elementGroup.contains(fabricObject))
                    elementGroup.add(fabricObject);

                setupFabricObject(fabricObject, element);
                fabricObjects[element._id] = fabricObject;
            }
            elementGroup.saveCoords();
        };

        this.makeFirstVisible = function(duration) {
            var pos = spreadElement.position();
            if (_.isUndefined(duration)) duration = 500;

            if (horizontalContainer) {
                var scrollRect = $canvasContainer[0].getBoundingClientRect(),
                    spreadRect = spreadElement[0].getBoundingClientRect();

                var scrollLeft = ($canvasContainer.scrollLeft() + pos.left) - scrollRect.width/2 + spreadRect.width/2;
                $canvasContainer.stop().animate({ scrollLeft : scrollLeft }, duration);
            } else if ($canvasContainer[0]) {
                var scrollRect = $canvasContainer[0].getBoundingClientRect(),
                    scrollWidth = $canvasContainer[0].scrollWidth,
                    scrollTop = $canvasContainer.scrollTop() + pos.top,
                    scrollLeft = scrollWidth>scrollRect.width ? $canvasContainer[0].scrollWidth / 2 - scrollRect.width/2 : 0;

                //console.log(scrollRect.width, $canvasContainer[0].scrollWidth);
                if (duration===0) {
                    $canvasContainer[0].scrollTop = scrollTop;
                    $canvasContainer[0].scrollLeft = scrollLeft;
                } else {
                    $canvasContainer
                        .stop()
                        .animate({scrollTop : scrollTop, scrollLeft: scrollLeft}, duration);
                }
            }
            $canvasContainer.trigger('scroll');
        };

        this.getCanvasContainer = function() {
            return $canvasContainer;
        };

        this.getBoundingClientRect = function() {
            return this.element[0].getBoundingClientRect();
        };

        this.isVisible = function() {
            var e = this.element[0],
                z = $canvasContainer[0].getBoundingClientRect(),
                r = e.getBoundingClientRect();

            return !(r.top>z.bottom || r.bottom<z.top);
        };

        this.getCanvasSize = function(scale) {
            return getCanvasSize(scale || this.scale);
        };

        this.selectElements = function(elements) {
            eventsEnabled = false;
            if (elements.length===1) {
                var fabricObject = fabricObjects[elements[0]._id];
                if (fabricObject) {
                    canvas.setActiveObject(fabricObject);
                }
            } else if (elements.length>1) {

                var objects = _.map(elements, function(el) { return fabricObjects[el._id]; });
                var group = new fabric.Group(objects, {
                    canvas: canvas,
                    originX: 'left',
                    originY: 'top',
                });
                group.addWithUpdate();
                canvas.setActiveGroup(group);
            }
            eventsEnabled = true;
        };

        this.clearSelection = function() {
            eventsEnabled = false;
            canvas.discardActiveObject();
            canvas.discardActiveGroup();
            canvas.renderAll();
            eventsEnabled = true;
        };

        this.renderElement = function(element) {
            var fabricObject = fabricObjects[element._id];
            if (fabricObject) {
                setupFabricObject(fabricObject, element);

                if (element.type==='ElementGroup')
                    initGroup(fabricObject, []);

                canvas.renderAll();
            }
        };

        // Refreshes all current canvas fabric objects.
        this.refresh = function() {
            _.each($scope.spread.elements, function (element) {
                var fabricObject = fabricObjects[element._id];
                if(fabricObject && fabricObject.refresh) {
                    fabricObject.refresh();
                }
            });
        };

        this.renderElements = function(elements, cleanUpAfterRender) {
            if (fabricObjects===null) //do nothing, the element is being destroyed now
                return;
            if (isAnimating)
                return;

            eventsEnabled = false;

            if ($scope.layout.layoutSize.dynamicSpineWidth ||
                this.spreadInfo.pages.length!==this.spreadInfo.spread.numPages) {
                this.makePages();
            }

            if (this.mode==='CoverRight') {
                canvas.offset.x = this.offset.x = -($scope.layout.layoutSize.width + this.padding);
            } else {
                canvas.offset.x = this.offset.x = this.padding;
            }

            var activeObject = canvas.getActiveObject(),
                activeGroup = canvas.getActiveGroup(),
                canvasSize = getCanvasSize(this.scale),
                scale = this.scale;

            if (canvas.width!==canvasSize.width ||
                canvas.height!==canvasSize.height) {
                canvas.setCanvasSize(canvasSize);
                calcOffset = true;
            }
            var ids = [];
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];
                element._id = element._id || uniqueId();
                ids.push(element._id);
                var fabricObject = fabricObjects[element._id] || newFabricObject(element);

                if (canvas.contains(fabricObject)) {
                    canvas.remove(fabricObject);
                }
                canvas.add(fabricObject);

                fabricObject.group = null;
                setupFabricObject(fabricObject, element);

                if (element.type==='ElementGroup')
                    initGroup(fabricObject, ids);

                fabricObjects[element._id] = fabricObject;
            }

            if (activeObject) {
                if (!canvas.contains(activeObject) && !activeObject.element) {
                    canvas.add(activeObject);
                }
                //call Fabric's private method to avoid triggering 'object:selected' event and rendering
                canvas._setActiveObject(activeObject);
            } else if (activeGroup) {
                var group = new fabric.Group(activeGroup.getObjects(), {
                    originX: 'left',
                    originY: 'top',
                });
                _.extend(group, _.pick(activeGroup, 'lockUniScaling', 'canvas'));
                group.saveCoords();
                canvas._setActiveGroup(group);
            }
            if (cleanUpAfterRender) {
                for(var id in fabricObjects) {
                    if (ids.indexOf(id)===-1) {
                        if(canvas.contains(fabricObjects[id])) {
                            canvas.remove(fabricObjects[id]);
                        }
                        delete fabricObjects[id];
                    }
                }
                if (!this.allowUnknownObjects) {
                    var objects = canvas.getObjects().concat();
                    angular.forEach(objects, function(object) {
                        if (!object.element || elements.indexOf(object.element)===-1) {
                            canvas.remove(object);
                        }
                    });
                }
            }

            canvas.renderAll();
            eventsEnabled = true;
        };

        this.renderWithAnimation = function(completeCallback, onChangeCallback, duration) {
            var animProps = ['left', 'top', 'width', 'height', 'imageX', 'imageY',
                'imageWidth', 'imageHeight', 'rotation', 'imageRotation'],
                objects = [],
                newElements = [],
                objectToBeRemoved = [],
                newObjects;

            //collect objects to be animated
            var activeGroup = canvas.getActiveGroup(),
                activeGroupObjects;
            if (activeGroup) {
                activeGroup.destroy();
                activeGroupObjects = activeGroup.getObjects();
            }

            _.each($scope.spread.elements, function(element) {
                var currentObject = fabricObjects[element._id],
                    next = newFabricObject(element);
                setupFabricObject(next, element);
                if (currentObject) {
                    objects.push( {
                        current: currentObject,
                        prev: _.pick(currentObject, animProps),
                        next: _.pick(next, animProps)
                    });
                } else {
                    newElements.push(element);
                }
            });

            _.each(canvas.getObjects(), function(obj) {
                if (obj.element && obj.element._id) {
                    var el = _.findWhere($scope.spread.elements, {_id:obj.element._id});
                    if (!el) {
                        objectToBeRemoved.push(obj);
                        if (activeGroupObjects && activeGroupObjects.length>0) {
                            var idx = activeGroupObjects.indexOf(obj);
                            if (idx>=0)
                                activeGroupObjects.splice(idx,1);
                        }
                    }
                }
            });

            if (!_.isEmpty(newElements)) {
                this.renderElements(newElements, false);
                newObjects = _.compact(_.map(newElements, function (e) {
                    return fabricObjects[e._id];
                }));
            }

            if (objects.length===0 && _.isEmpty(newObjects) && _.isEmpty(objectToBeRemoved)) {
                //nothing to animate, just render
                this.render();
                return;
            }

            //animate objects
            isAnimating = true;
            var that = this;
            fabric.util.animate({
                startValue: 0,
                endValue: 1,
                duration: duration || 500,
                onChange: function(value) {

                    _.each(objects, function(object) {
                        _.each(animProps, function(prop) {
                            var prevValue = object.prev[prop],
                                nextValue = object.next[prop],
                                byValue = nextValue - prevValue;
                            object.current.set(prop, prevValue + (byValue * value) );
                        });
                        object.current.setCoords();
                    });
                    _.invoke(newObjects, 'set', 'opacity', value);
                    _.invoke(objectToBeRemoved, 'set', 'opacity', 1 - value);

                    if (activeGroup && activeGroupObjects.length>=0) {
                        var group = new fabric.Group(activeGroupObjects, {
                            originX: 'left',
                            originY: 'top',
                        });
                        _.extend(group, _.pick(activeGroup, 'lockUniScaling', 'canvas'));
                        group.saveCoords();
                        canvas.setActiveGroup(group);
                    }

                    canvas.renderAll();
                    if (onChangeCallback) onChangeCallback();
                },
                onComplete: function() {
                    isAnimating = false;
                    that.render();
                    if (completeCallback) completeCallback();
                }
            });
        };

        this.render = function() {
            this.renderElements($scope.spread.elements, true);
        };

        this.renderGuides = function(guides) {
            for (var i = 0, n = guides.length; i < n; i++) {
                var guide = guides[i];
                if (guide.draw) {
                    guide.draw(canvas);
                }
            }
        };

        this.resetPreviewScale = function() {
            var prefix = ['-webkit-','-moz-', '-ms-', '-o-', ''],
                outerDiv = $element.parent(),
                canvases = outerDiv.children(),
                canvasSize = getCanvasSize(this.scale);

            angular.forEach(prefix, function(p) {
                canvases.css(p + 'transform', 'none');
            });

            outerDiv.css('width', Math.round(canvasSize.width + 1) + 'px');
            outerDiv.css('height', Math.round(canvasSize.height) + 'px');
            this.previewScale = this.scale;
        };

        // fixed guide lines cannot be scaled proportionally
        // (they consists of scalable and non scalable parts - i.e. offsets)
        // so they are remembered before scaling with CSS and restored
        // in the setScale call
        var tempGuideLines;

        this.setScale = function(value) {
            var render = value!==this.scale;
            this.scale = canvas.scale = value;

            // restoring already remembered guidelines
            if (scalePreviewMode) {
                $scope.spread.guideLines = tempGuideLines;
                scalePreviewMode = false;
            }

            if (render) {
                //if (previewScale!==value)
                    this.resetPreviewScale();
                this.render();
                calcOffset = true;
            }
        };

        this.setPreviewScale = function(value) {
            var prefix = ['-webkit-','-moz-', '-ms-', '-o-', ''],
                outerDiv = $element.parent(),
                canvases = outerDiv.children(),
                scale = value / this.scale,
                canvasSize = getCanvasSize(value);

            // remembering current spread guideLines under
            // tempGuideLines reference
            /*
            if (!scalePreviewMode) {
                tempGuideLines = $scope.spread.guideLines;
                $scope.spread.guideLines = [];
                scalePreviewMode = true;
                // the call to render is required in order to redraw without the guides
                this.render();
            }
            */

            this.previewScale = value;
            angular.forEach(prefix, function(p) {
                canvases
                    .css(p + 'transform-origin', '0px 0px')
                    .css(p + 'transform', 'scale(' + scale + ',' + scale + ')');
            });

            outerDiv.css('width', Math.round(canvasSize.width) + 'px');
            outerDiv.css('height', Math.round(canvasSize.height) + 'px');
        };

        this.scaleToFit = function(containerRect) {
            var canvasSize = getCanvasSize(1.0),
                rect = GeomService.fitRectangleProportionally( canvasSize, containerRect ),
                scale = rect.width / canvasSize.width;
            this.setScale(scale);
        };

        this.register = function() {
            layoutController.registerRenderer(self);
        };



        //------------------------------------------
        //---------- drag & drop handlers ----------
        //------------------------------------------
        var dropZone = canvas.getSelectionElement();

        function checkDropTypes(e) {
            var dt = DataTransferService.getDataTransfer(e);
            if ( !PACE.utils.containsDragType(dt.types, 'text/x-pace-rejected-images') &&
                    (
                        PACE.utils.containsDragType(dt.types, 'text/x-pace-filmstrip-items') ||
                        PACE.utils.containsDragType(dt.types, 'text/x-pace-template') ||
                        PACE.utils.containsDragType(dt.types, 'text/x-pace-color')
                    )
                ) {
                e.preventDefault();
            }
        }

        function upperCanvasDragEnter(e) {
            checkDropTypes(e);
            layoutController.onDragEnter(self, e);
        }

        function upperCanvasDragEnd(e) {
            console.log('dragend', e);
        }

        function upperCanvasDragOver(e) {
            checkDropTypes(e);

            if (calcOffset) {
                canvas.calcOffset();
                calcOffset = false;
            }

            layoutController.onDragOver(self, e);
        }

        function upperCanvasDragLeave(e) {
            layoutController.onDragLeave(self, e);
        }

        function upperCanvasDrop(e) {
            e.preventDefault();
            layoutController.onDrop(self, e);
        }

        dropZone.addEventListener('dragenter', upperCanvasDragEnter);
        dropZone.addEventListener('dragend', upperCanvasDragEnd);
        dropZone.addEventListener('dragover', upperCanvasDragOver);
        dropZone.addEventListener('dragleave', upperCanvasDragLeave);
        dropZone.addEventListener('drop', upperCanvasDrop);


        // Clean up when the element is destroyed
        this.dispose = function() {
            //console.log('layoutRenderer $destroy', this.spread.pageNumber);
            fabricObjects = null;
            layoutController.unregisterRenderer(self);

            canvas.clear();
            canvas.dispose();
            canvas.off();

            if ($canvasContainer) {
                $canvasContainer.off('scroll', onCanvasContainerScroll);
            }

            canvas.upperCanvasEl.removeEventListener('dragenter', upperCanvasDragEnter);
            canvas.upperCanvasEl.removeEventListener('dragend', upperCanvasDragEnd);
            canvas.upperCanvasEl.removeEventListener('dragover', upperCanvasDragOver);
            canvas.upperCanvasEl.removeEventListener('dragleave', upperCanvasDragLeave);
            canvas.upperCanvasEl.removeEventListener('drop', upperCanvasDrop);

            canvas.upperCanvasEl.removeEventListener('dblclick', upperCanvasDoubleClick);
            canvas.upperCanvasEl.removeEventListener('mouseout', upperCanvasMouseOut);
            canvas.upperCanvasEl.removeEventListener('mousemove', upperCanvasMouseMove);

            canvas.wrapperEl = null;
            $(canvas.upperCanvasEl).remove();
            $(canvas.lowerCanvasEl).unwrap();

            canvas.lowerCanvasEl = null;
            canvas.upperCanvasEl = null;

            this.canvas = canvas = null;
            this.spreadInfo = null;

            this.spread = null;
            this.layout = null;
            this.layoutController = null;
            this.pages = null;

            this.disposed = true;

            fabric.StaticCanvas.activeInstance = null;
            fabric.Canvas.activeInstance = null;
        };

    }])

    .directive('layoutRenderer', ['$timeout', 'GeomService', 'TextureCache', '$debounce', '$location', '$anchorScroll',
        function ($timeout, GeomService, TextureCache, $debounce, $location, $anchorScroll) {
        return {
            restrict: 'A',
            scope: {
                spread:'=',
                layout:'=',
                layoutController:'=',
                product:'=',
                productPrototype:'=',
                mode: '='
            },
            priority:0,
            controller: 'SpreadController',
            link: function postLink($scope, $element, $attrs, ctrl) {

                ctrl.element = $element;
                ctrl.register();

                if ($scope.layout) {
                    ctrl.makePages();
                    ctrl.render();
                }

                if ($scope.spread) {
                    // attributing ids to the spreads in order to retrieve actual
                    // dom elements easily
                    $element.attr('id', 'spread-' + $scope.spread.id);
                }

                var disableWatches = $attrs.disableWatches==='true';

                $scope.$watch('mode', function(val, oldVal) {
                    if (val!==oldVal) {
                        ctrl.mode = val;
                        if (!disableWatches)
                            ctrl.render();
                    }
                });

                $scope.$watch('spread', function(val, oldVal) {
                    if (val!==oldVal || !ctrl.spread) {
                        ctrl.spread = val;
                        if (!disableWatches)
                            ctrl.render();
                    }
                });

                $scope.$watch('layout', function(val, oldVal) {
                    if (val && (val!==oldVal || !ctrl.layout)) {
                        ctrl.layout = val;
                        ctrl.makePages();

                        if (!disableWatches)
                            ctrl.render();
                    }
                });

            }
        };
    }]);
