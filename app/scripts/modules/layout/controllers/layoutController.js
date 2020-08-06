PACE.LayoutController = function(scope) {
    'use strict';

    var injector = angular.element('body').injector(),
        UndoService = injector.get('UndoService'),
        SnappingService = injector.get('SnappingService'),
        KeyboardService = injector.get('KeyboardService'),
        SessionService = injector.get('SessionService'),
        TemplateService = injector.get('TemplateService'),
        QueueRequestService = injector.get('QueueRequestService'),
        DataTransferService = injector.get('DataTransferService'),
        $q = injector.get('$q');


    var that = this;
    this.scope = scope;

    this.registerRenderer = function(renderer) {
        if (!this.currentRenderer)
            this.setCurrentRenderer(renderer);
        this.renderers.push(renderer);
    };

    this.unregisterRenderer = function(renderer) {
        var idx = this.renderers.indexOf(renderer);
        if (idx>=0)
            this.renderers.splice(idx, 1);
        if (renderer===this.currentRenderer)
            this.currentRenderer = null;
    };

    var renderWithDelay = function(rndrSingle) {
        var getRenderOrder = function () {
                var tpls = [],
                    r = that.renderers,
                    i = that.renderers.indexOf(that.currentRenderer);

                tpls.push([r[i]]);

                for (var l = i - 1, u = i + 1; l >= 0 || u < r.length; l--, u++) {
                    var tpl = [];

                    if (l >= 0) tpl.push(r[l]);
                    if (u < r.length) tpl.push(r[u]);

                    tpls.push(tpl);
                }

                return tpls;
            },
            getPromise = function (tpl) {
                var d = $q.defer();

                setTimeout(function () {
                    _.invoke(tpl, rndrSingle);
                    d.resolve();
                }, 10);

                return d.promise;
            };

        _.each(getRenderOrder(), function (tpl, index) {
            QueueRequestService.push('render-delayed', _.bind(getPromise, null, tpl));
            QueueRequestService.run('render-delayed');
        });
    };

    this.renderAllWithAnimationDelayed = _.bind(renderWithDelay, that, 'renderWithAnimation');
    this.renderAllDelayed = _.bind(renderWithDelay, that, 'render');

    this.renderAll = function() {
        for (var i = 0; i < this.renderers.length; i++) {
            this.renderers[i].render();
        }
    };

    this.renderAllWithAnimation = function () {
        _.invoke(this.renderers, 'renderWithAnimation');
    };

    this.setSelectionEnabled = function(enabled) {
        angular.forEach(this.renderers, function(r) {
            r.setSelectionEnabled(enabled);
        });
    };

    this.setDefaultCursor = function(cursor) {
        cursor = cursor || 'default';
        _.each(this.renderers, function(r) {
            r.canvas.defaultCursor = cursor;
            r.canvas.hoverCursor = cursor;
            r.canvas.setCursor(cursor);
        });
    };

    this.setCurrentRenderer = function(r) {
        if (r===this.currentRenderer)
            return;

        this.currentRenderer = r;
        this.fireEvent('layout:current-renderer-changed');
    };

    this.getCurrentRenderer = function() {
        return this.currentRenderer;
    };

    this.getCurrentSpread = function() {
        return this.currentRenderer ? this.currentRenderer.spread : null;
    };

    this.setScale = function(scale) {
        if (this.scale===scale)
            return;

        this.scale = scale;
        angular.forEach(this.renderers, function(r) {
            r.setScale(scale);
        });
        this.currentRenderer.makeFirstVisible(0);
        this.fireEvent('layout:scale-changed');
    };

    this.setScaleWithDelay = function(scale, coverScales) {

        var visibleRenderers = this.getVisibleRenderers(),
            currentRenderer = this.currentRenderer,
            that = this;

        this.scale = scale;
        this.coverScales = coverScales;

        var getScaleForRenderer = function(idx) {
            if (coverScales && idx<coverScales.length)
                return coverScales[idx];
            else
                return scale;
        };

        _.each(visibleRenderers, function(r) {
            var idx = that.renderers.indexOf(r);
            r.setScale(getScaleForRenderer(idx));
        });

        var interval = 100,
            scaleFn = function(r, s) {
                return function() {
                    r.setScale(s);
                };
            };
        if (this.pendingScaleTimeouts) {
            _.each(this.pendingScaleTimeouts, function(id) {
                clearTimeout(id);
            });
        }

        this.pendingScaleTimeouts = [];
        var currentRendererIndex = this.renderers.indexOf(currentRenderer);

        if (currentRendererIndex<0) currentRendererIndex = 0;
        _.each(this.renderers, function(r, i) {
            if (visibleRenderers.indexOf(r)===-1) {
                var s = getScaleForRenderer(i);
                r.setPreviewScale(s);

                var delay = Math.abs(i - currentRendererIndex) * interval;
                var id = setTimeout(scaleFn(r, s), delay);
                that.pendingScaleTimeouts.push(id);
            }
        });

        currentRenderer.makeFirstVisible(0);
        this.fireEvent('layout:scale-changed');
    };

    this.scaleToFit = function(containerRect) {
        var canvasSize = this.renderers[0].getCanvasSize(1.0),
            rect = PACE.GeomService.fitRectangleProportionally( canvasSize, containerRect ),
            scale = rect.width / canvasSize.width;
        this.setScale(scale);
    };

    this.setPreviewScale = function(scale, coverScales) {
        var getScaleForRenderer = function(idx) {
            if (coverScales && idx<coverScales.length)
                return coverScales[idx];
            else
                return scale;
        };

        _.each(this.renderers, function(r, i) {
            var s = getScaleForRenderer(i);
            r.setPreviewScale(s);
        });
    };

    this.clearSelection = function(clearCurrentRenderer) {
        this.selectedElements = [];

        if (this.currentEditor) {
            this.currentEditor.endEdit();
            this.currentEditor = null;
        }
        if (clearCurrentRenderer && this.currentRenderer) {
            this.currentRenderer.clearSelection();
        }

        this.fireEvent('layout:selection-cleared');
    };

    this.findRenderer = function(element) {
        for (var i = 0; i < this.renderers.length; i++) {
            var r = this.renderers[i];
            var idx = r.spread.elements.indexOf(element);
            if (idx>=0)
                return r;
        }
    };

    this.getVisibleRenderers = function() {
        var result = [];
        for (var i = 0; i < this.renderers.length; i++) {
            var r = this.renderers[i];
            if (r.isVisible())
                result.push(r);
        }
        return result;
    };

    this.fireEvent = function(event, arg) {
        if (!scope) return;

        if (scope.$$phase)
            scope.$broadcast(event, arg);
        else scope.$apply(function() {
            scope.$broadcast(event, arg);
        });
    };

    this.on = function(event, handler) {
        if (!scope) return;
        return scope.$on(event, handler);
    };

    //select elements programmatically
    this.selectElements = function(elements, selectElementsOnCanvas) {
        this.selectedElements = elements;

        if (elements && elements.length>0 && selectElementsOnCanvas) {
            this.currentRenderer = this.findRenderer(elements[0]);
            this.currentRenderer.selectElements(elements);
        }
        this.fireEvent('layout:selection-changed');
    };

    //delegate events to tools
    this.onObjectSelected = function(layoutRenderer, options) {
        //console.log('onObjectSelected', options)
        if (this.currentTool && this.currentTool.onObjectSelected) {
            this.currentTool.onObjectSelected(layoutRenderer, options);
        }

        this.deselectGuides();
    };

    this.onSelectionCleared = function(layoutRenderer, options) {
        this.clearSelection();
        if (this.currentTool && this.currentTool.onSelectionCleared) {
            this.currentTool.onSelectionCleared(layoutRenderer, options);
        }
    };

    this.onBeforeMouseDown = function(layoutRenderer, options) {
        if (this.currentTool && this.currentTool.onBeforeMouseDown) {
            this.currentTool.onBeforeMouseDown(layoutRenderer, options);
        }
    };

    this.onMouseDown = function(layoutRenderer, options) {
        if (this.currentTool && this.currentTool.onMouseDown) {
            this.currentTool.onMouseDown(layoutRenderer, options);
        }
    };

    this.onMouseMove = function(layoutRenderer, options) {
        if (this.currentTool && this.currentTool.onMouseMove) {
            this.currentTool.onMouseMove(layoutRenderer, options);
        }
    };

    this.onMouseUp = function(layoutRenderer, options) {
        if (this.currentTool && this.currentTool.onMouseUp) {
            this.currentTool.onMouseUp(layoutRenderer, options);
        }
    };

    this.onMouseOut = function(layoutRenderer, options) {
        if (this.currentTool && this.currentTool.onMouseOut) {
            this.currentTool.onMouseOut(layoutRenderer, options);
        }
    };

    this.onDoubleClick = function(layoutRenderer, options) {
        if (this.currentTool && this.currentTool.onDoubleClick) {
            this.currentTool.onDoubleClick(layoutRenderer, options);
        }
    };

    this.onDragEnter = function(layoutRenderer, event) {
        var dt = DataTransferService.getDataTransfer(event);

        if (PACE.utils.containsDragType(dt.types, 'text/x-pace-filmstrip-items')) {
            if (this.currentTool && this.currentTool.exit) this.currentTool.exit();
            this.currentTool = new PACE.ImageDropTool(this);
        } else if (PACE.utils.containsDragType(dt.types,'text/x-pace-template')) {
            if (this.currentTool && this.currentTool.exit) this.currentTool.exit();
            this.currentTool = new PACE.TemplateDropTool(this);
        } else if (PACE.utils.containsDragType(dt.types, 'text/x-pace-color')) {
            if (this.currentTool && this.currentTool.exit) this.currentTool.exit();
            this.currentTool = new PACE.ColorDropTool(this);
        }

        if (this.currentTool && this.currentTool.onDragEnter) {
            this.currentTool.onDragEnter(layoutRenderer, event);
        }
    };

    this.onDragLeave = function(layoutRenderer, event) {
        if (this.currentTool && this.currentTool.onDragLeave) {
            this.currentTool.onDragLeave(layoutRenderer, event);
        }

        this.currentTool = new PACE.SelectionTool(this);
    };

    this.onDragOver = function(layoutRenderer, event) {
        if (this.currentTool && this.currentTool.onDragOver) {
            this.currentTool.onDragOver(layoutRenderer, event);
        }
    };

    this.onDrop = function(layoutRenderer, event) {
        if (this.currentTool && this.currentTool.onDrop) {
            this.currentTool.onDrop(layoutRenderer, event);
        }
        this.currentTool = new PACE.SelectionTool(this);
    };

    this.onKeyPress = function(e) {
        if (this.currentTool && this.currentTool.onKeyPress) {
            this.currentTool.onKeyPress(e);
        }
    };

    this.onKeyDown = function(e) {
        var activeElement = $(document.activeElement);
        var isInputActive = (activeElement.is('input') || activeElement.is('textarea'));

        if (isInputActive) return;

        if (this.currentTool && this.currentTool.onKeyDown) {
            this.currentTool.onKeyDown(e);
        }
    };

    this.onKeyUp = function(e) {
        if (this.currentTool && this.currentTool.onKeyUp) {
            this.currentTool.onKeyUp(e);
        }
    };

    this.execCommand = function(cmd, animate) {
        cmd.renderer = this.currentRenderer;
        cmd.execute();
        UndoService.pushUndo(cmd);
        if (animate) {
            this.currentRenderer.renderWithAnimation();
        } else {
            this.currentRenderer.render();
        }
    };

    this.undo = function() {
        if (UndoService.canUndo()) {
            var cmd = UndoService.popUndo();
            console.log("UNDO: ", cmd);
            cmd.undo();
            UndoService.pushRedo(cmd);
            if (cmd.renderer) {
                cmd.renderer.renderWithAnimation();
            } else {
                this.renderAll();
            }
            this.fireEvent('layout:layout-changed');
        }
    };

    this.redo = function() {
        if (UndoService.canRedo()) {
            var cmd = UndoService.popRedo();
            console.log("REDO: ", cmd);
            cmd.execute();
            UndoService.pushUndo(cmd);
            if (cmd.renderer) {
                cmd.renderer.renderWithAnimation();
            } else {
                this.renderAll();
            }
            this.fireEvent('layout:layout-changed');
        }
    };

    this.getSelectionBoundingBox = function() {
        var selection = this.selectedElements.length===1 ?
                this.selectedElements[0] :
                new PACE.Element({type:'ElementGroup', elements: this.selectedElements }).getBoundingBox();

        return {
            x: selection.x,
            y: selection.y,
            width: selection.width,
            height: selection.height,
            rotation: selection.rotation || 0,
        };
    };

    this.selectGuide = function (guide) {
        if (!_.contains(this.selectedGuides, guide)) {
            this.selectedGuides.push(guide);
        }
    };

    this.selectGuides = function(guides) {
        this.deselectGuides();
        this.selectedGuides = guides;
        _.each(this.selectedGuides, function(guide) { guide.selected = true; });
    };

    this.deselectGuide = function (guide) {
        if (guide) {
            this.selectedGuides = _.reject(this.selectedGuides, function(g) { return g === guide; });
        }
    };

    this.deselectGuides = function () {
        _.each(this.selectedGuides, function(guide) {
            if (guide) {
                guide.selected = false;
            }
        });
        this.selectedGuides = [];
    };

    this.undoService = UndoService;
    this.snappingService = SnappingService;
    this.currentRenderer = null;
    this.currentEditor = null;
    this.currentTool = new PACE.SelectionTool(this);
    this.selectedElements = [];
    this.selectedGuides = [];
    this.renderers = [];
    this.scale = 0.3;
    this.frameSpacing = PACE.AppConstants.DEFAULT_FIXED_SPACING;
};
