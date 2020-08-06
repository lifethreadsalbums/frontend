(function () {
    'use strict';

    angular.module('pace.layout')
        .constant('templatePreviewSettings', {
            fill: '#c2c2c2',
            selectedFill: '#66CCFF',
            spacing: 2,
            floatToMarginProp: 0.8,
            splitLineWidth: 0.2,
            maxSize: 85
        })
        .filter('templateOfSize', ['_', 'TemplateService', 'recentlyUsedTemplatesSettings',
        function (_, TemplateService, recentlyUsedTemplatesSettings) {
            return function (templates, spread, layout, numFrames) {

                if (numFrames==='all') {
                    return templates;
                }
                var numElements = numFrames==='match' ?
                    _.where(spread.elements, { type: 'ImageElement' }).length : numFrames;


                return _.filter(templates, function (t) {
                    var numCells = TemplateService.getNumCells(t);

                    if (numFrames==='match' && spread.numPages===2 &&
                        TemplateService.isSinglePageTemplate(t)) {

                        var spreadInfo = new PACE.Spread(spread, layout);
                            return numCells===spreadInfo.pages[0].getImageElements().length ||
                                numCells===spreadInfo.pages[1].getImageElements().length;
                    }

                    return (numCells === numElements) ||
                        (recentlyUsedTemplatesSettings.maxFrames === numFrames && numCells>=numFrames);
                });

            };
        }])
        .service('TemplatePreviewService',['$controller', 'GeomService', 'TemplateService', 'templatePreviewSettings',
        function($controller, GeomService, TemplateService, templatePreviewSettings) {


            var layoutController = new PACE.LayoutController();
            layoutController.frameSpacing = 0.25;


            var el = $(document.createElement('canvas')),
                scope = {
                    spread: {},
                    layout: {},
                    layoutController: layoutController
                };
            var renderer = $controller('SpreadController',
                {
                    $element: el,
                    $scope: scope,
                    $attrs: {}
                }
            );
            renderer.element = el;
            //renderer.canvasRoundFn = Math.round;

            function getNumObjectsReady() {
                var numObjectsReady = 0;

                _.each(renderer.canvas.getObjects(), function(object) {
                    if (object.element.type==='ImageElement' && object.element.imageFile)
                        numObjectsReady += object.loaded ? 1 : 0;
                    else
                        numObjectsReady++;
                });
                return numObjectsReady;
            }

            function runQueue() {
                if (isRendering) return;

                if (renderQueue.length>0) {
                    setTimeout(function() {
                        var r = renderQueue.shift(),
                            t = templateQueue.shift();
                        if (r) r();
                        //console.log('runQueue', new Date(), renderQueue.length);
                    }, 0);
                }
            }


            function renderThumb(canvas, template) {
                var ctx = canvas.getContext('2d'),
                    width = renderer.canvas.width,
                    height = renderer.canvas.height,
                    isSinglePageTemplate = TemplateService.isSinglePageTemplate(template);



                ctx.clearRect(0,0, canvas.width, canvas.height);
                ctx.fillStyle = '#ffffff';
                if (isSinglePageTemplate) {
                    var spreadInfo = new PACE.SpreadInfoFactory().create(renderer.spread, renderer.layout);
                    spreadInfo.padding = 0;
                    var rect = spreadInfo.getCanvasSize();

                    ctx.fillRect(Math.round(renderer.layout.layoutSize.width / 2  * canvas.scale), 0, Math.round(rect.width * canvas.scale/2) + 1, height + 1);
                } else {
                    ctx.fillRect(1, 1, width, height);
                }

                renderer.canvas._renderObjects(ctx);

                if (!isSinglePageTemplate) {
                    //draw split line
                    var lineWidth = templatePreviewSettings.splitLineWidth;
                    ctx.save();
                    ctx.fillStyle = templatePreviewSettings.fill;
                    if (renderer.layout.layoutSize.pageOrientation === 'Horizontal') {
                        ctx.fillRect(Math.round(width/2), 0, lineWidth, height);
                    } else {
                        ctx.fillRect(0, Math.round(height/2), width, lineWidth);
                    }
                    ctx.restore();
                }

                var numObjectsReady = getNumObjectsReady();
                if (numObjectsReady<renderer.canvas.size()) {
                    setTimeout(function() {
                        renderThumb(canvas, template);
                    }, 0);
                    return;
                }
                $(canvas).removeClass('rendering');
                isRendering = false;
                runQueue();
            }

            var renderQueue = [],
                templateQueue = [],
                isRendering = false;

            this.scheduleRender = function(canvas, spread, layout, template) {

                var fn = this.render.bind(this, canvas, spread, layout, template);
                var idx = templateQueue.indexOf(template);
                if (idx>=0) {
                    renderQueue[idx] = fn;
                } else {
                    renderQueue.push(fn);
                    templateQueue.push(template);
                }
                if (renderQueue.length===1)
                    runQueue();
            };

            this.render = function(canvas, spread, layout, template) {

                //console.log('render', renderQueue.length);
                isRendering = true;

                var ctx = canvas.getContext('2d'),
                    tSpread = angular.copy(spread),
                    tTemplate = template;// angular.copy(template);

                var numFrames = TemplateService.getNumCells(tTemplate);
                var spreadInfo = new PACE.SpreadInfoFactory().create(tSpread, layout);

                if (TemplateService.isSinglePageTemplate(tTemplate)) {

                    if (spreadInfo.pages.length===2) {
                        var leftElements = spreadInfo.pages[0].getImageElements(),
                            rightElements = spreadInfo.pages[1].getImageElements();

                        if (numFrames===leftElements.length)
                            tSpread.elements = angular.copy(leftElements);
                        else if (numFrames===rightElements.length)
                            tSpread.elements = angular.copy(rightElements);
                        else
                            tSpread.elements = [];
                    }
                    tSpread.numPages = 1;
                    tSpread.pageNumber = 1;
                } else {
                    tSpread.numPages = 2;
                    tSpread.pageNumber = layout.lps ? 1 : 2;
                    tSpread.elements = spreadInfo.getImageElements();

                    if (tSpread.elements.length!==numFrames) {
                        tSpread.elements = [];
                    }
                }

                var maxSize = templatePreviewSettings.maxSize * 2;

                var spreadInfo = new PACE.SpreadInfoFactory().create(tSpread, layout);
                spreadInfo.padding = 0;
                var rect = spreadInfo.getCanvasSize();
                var canvasSize = GeomService.fitRect(rect, {width: maxSize, height: maxSize});
                var width = Math.round(canvasSize.width),
                    height = Math.round(canvasSize.height);

                var scale = canvasSize.width / rect.width;

                ctx.canvas.width = width + 1;
                ctx.canvas.height = height + 1;
                ctx.canvas.scale = scale;

                new PACE.ApplyTemplateCommand(
                    tTemplate,
                    'spread',
                    tSpread,
                    layout,
                    null,
                    null,
                    0.3 //some frame spacing value
                ).execute();

                var makeGapsBigger = (tTemplate.type==='CustomLayoutTemplate') ||
                    (tTemplate.left && tTemplate.left.type==='CustomLayoutTemplate') ||
                    (tTemplate.right && tTemplate.right.type==='CustomLayoutTemplate');

                var bleed = spreadInfo.getBleedRect();

                if (tSpread.elements.length>1) {
                    _.each(tSpread.elements, function(el) {

                        if (makeGapsBigger) {
                            var gap = 4,
                                element = new PACE.Element(el),
                                rect = element.getBoundingBox(),
                                m = new PACE.Element(el).getMatrix(),
                                p = m.transformPoint(gap, gap);

                            if (!GeomService.equals(rect.left, bleed.left)) {
                                el.x = p.x;
                                el.width -= gap;
                            }
                            if (!GeomService.equals(rect.top, bleed.top)) {
                                rect.top = p.y;
                                el.height -= gap;
                            }
                            if (!GeomService.equals(rect.right, bleed.right)) {
                                el.width -= gap;
                            }
                            if (!GeomService.equals(rect.bottom, bleed.bottom)) {
                                el.height -= gap;
                            }
                        }
                        if (el.type==='ImageElement') {
                            el.templatePreviewStroke = true;
                        }
                    });
                }

                scope.spread = renderer.spread = tSpread;
                scope.layout = renderer.layout = layout;

                _.each(tSpread.elements, function(el) {
                    //delete el._id;
                    delete el.errors;
                });

                renderer.makePages();
                renderer.padding = renderer.spreadInfo.padding = 0;

                renderer.offset = renderer.canvas.offset = {x:0,y:0};
                renderer.setScale(scale);
                renderer.render();

                renderThumb(canvas, template);
            };


        }])
        .directive('templatePreview', [
            '_', 'templatePreviewSettings', 'GeomService', 'TemplateToFramesService', 'TemplateService', 'TemplatePreviewService', '$debounce', 'DataTransferService',
            function (_, templatePreviewSettings, GeomService, TemplateToFramesService, TemplateService, TemplatePreviewService, $debounce, DataTransferService) {
                return {
                    replace: true,
                    restrict: 'E',
                    scope: {
                        template: '=',
                        layout: '=',
                        spread: '=',
                        selected: '=',
                        width: '=',
                        height: '='
                    },
                    template: '<canvas class="template-preview" />',
                    link: function (scope, element) {

                        //set up drag&drop stuff
                        element[0].draggable = true;
                        element.on('dragstart', function(e) {
                            var dt = DataTransferService.getDataTransfer(e, 'originalEvent'),
                                json = JSON.stringify(scope.template);

                            dt.setData('text/x-pace-template', json);
                            if (TemplateService.isSinglePageTemplate(scope.template))
                                dt.setData('text/x-pace-single-page-template', json);

                        }).on('dragend', function(e) {
                            scope.$parent.onDragEnd(scope.template);
                        }).on('dragover', function(e) {
                            if (scope.$parent.selectedLayoutType!=='saved') return;

                            var el = element[0],
                                rect = el.getBoundingClientRect(),
                                mid = rect.top + rect.height * 0.75,
                                dropClass = 'drop-' + (e.originalEvent.pageY < mid ? 'top' : 'bottom');

                            scope.dropClass = dropClass;

                            element.parent().removeClass('drop-top drop-bottom').addClass(dropClass);

                            e.originalEvent.dataTransfer.dropEffect = 'move';
                            e.originalEvent.preventDefault();

                        }).on('dragleave', function(e) {
                            element.parent().removeClass('drop-top drop-bottom');
                        }).on('drop', function(e) {

                            scope.$parent.onTemplateDrop(scope.template, scope.dropClass, e.originalEvent);
                            element.parent().removeClass('drop-top drop-bottom');

                        });
                        element[0].width = scope.width;
                        element[0].height = scope.height;
                        var layout = TemplatePreviewService.layout || {};

                        if (layout.id!==scope.layout.id) {
                            layout = angular.copy( _.omit(scope.layout, 'spreads') );
                            layout.layoutSize.centerRect = 'margin';
                            layout.layoutSize.marginTop = 36;
                            layout.layoutSize.marginBottom = 36;
                            layout.layoutSize.marginInside = 36;
                            layout.layoutSize.marginOutside = 36;
                            layout.layoutSize.bleedTop = 0;
                            layout.layoutSize.bleedBottom = 0;
                            layout.layoutSize.bleedOutside = 0;
                            layout.layoutSize.bleedInside = 0;
                            layout.layoutSize.width = Math.round(layout.layoutSize.width);
                            layout.layoutSize.height = Math.round(layout.layoutSize.height);
                            TemplatePreviewService.layout = layout;
                        }

                        var render = function () {
                            TemplatePreviewService.scheduleRender(element[0], scope.spread, layout, scope.template);
                        };

                        var renderDebounced = $debounce(render, 250 + (scope.$parent.$index * 20));
                        element.addClass('rendering');

                        scope.$watch('template', function(val, oldVal) {
                            element.addClass('rendering');
                            renderDebounced();
                        });
                    }
                };
            }
        ]);
})();
