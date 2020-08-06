'use strict';

angular.module('pace.build')
    .constant('coverSettings', {
        foilOpacity: 0.9,
        stampMargin: 0.98 * 72, //2.5 cm
        dieMaxSize: { width: 8.22 * 72, height: 5.23 * 72 }, //20.9CM x 13.3CM
        stampTextMaxSize: { width: 8.07 * 72, height: 2.36 * 72 } //20.5CM x 6CM
    })
    .directive('coverPreview', ['Page', 'BumpMapService', '$timeout', 'GeomService', '$debounce', 'coverSettings', 'StampPlaceholder',
        'DebossingService', '$controller', 'TextureCache', 'ImageService', 'FontEvent', 'StoreConfig',
    function (Page, BumpMapService, $timeout, GeomService, $debounce, coverSettings, StampPlaceholder,
        DebossingService, $controller, TextureCache, ImageService, FontEvent, StoreConfig) {

        //directive's link function
        var link = function($scope, $element, $attrs) {

            function createRenderer(el, spread) {
                var ctrlScope = $scope.$new(false);
                ctrlScope.spread = spread;

                var ctrl = $controller('SpreadController', { $element: el, $scope: ctrlScope, $attrs: {} });
                ctrl.element = el;
                if (ctrlScope.layout)
                    ctrl.makePages();
                ctrl.register();
                return ctrl;
            }

            var materialsSpread = { numPages: 2, elements: [] },
                stampsSpread = { numPages: 2, elements: [] },
                mainSpread = { numPages: 2, elements: [] },

                layoutController = $scope.layoutController,
                mainCanvas = $element.find('.mainCanvas'),
                materialsCanvas = $element.find('.materialsCanvas'),
                stampsCanvas = $element.find('.stampsCanvas'),

                mainRenderer = createRenderer(mainCanvas, mainSpread),
                materialsRenderer = createRenderer(materialsCanvas, materialsSpread),
                stampsRenderer = createRenderer(stampsCanvas, stampsSpread),

                editMode = false,
                containerClass = '.' + ($attrs.layoutContainer || 'builder__content-primary-inner'),
                $canvasWrap = $element.closest(containerClass),
                $window = $(window),
                spinner = $element.find('.spinner-container'),
                firstTime = true,
                bumpMappingDone = false,
                scaleChanged = false,
                HINGE_SCALE = 0.8,
                tmpTextBox = new PACE.TextStampElement({text:''});

            tmpTextBox.canvas = {scale:1.0, offset:{x:0,y:0}};

            stampsRenderer.canvas.selection = false;
            materialsRenderer.canvas.selection = false;
            layoutController.setCurrentRenderer(mainRenderer);

            var tsCoverShapeInfo = {
                urlPrefix: 'images/cover-builder/ts-layer',
                urlSuffix: '.jpg',
                maskLayerIndex: -1,
                width: 1000,
                height: 667,
                padding: {
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0
                },
                layers: [
                    { mode:'source-over',   opacity:1.0 }
                ]
            };

            var pbCoverShapeInfo = {
                urlPrefix: 'images/cover-builder/pb-layer',
                maskLayerIndex: 1,
                width: 1000,
                height: 1030,
                padding: {
                    left: 83, // 90,
                    top: 20,
                    right: 27,
                    bottom: 52
                },
                layers: [
                    { mode:'source-over',   opacity:1.0 },
                    { mode:'source-over',   opacity:1.0 },
                    { mode:'source-over',   opacity:0.3 },
                    { mode:'source-over',   opacity:1.0, repeat:2 },
                    { mode:'multiply',      opacity:0.8, repeat:2 },
                    { mode:'multiply',      opacity:1.0 },
                    { mode:'multiply',      opacity:1.0 },
                    { mode:'multiply',      opacity:1.0, repeat:2 },
                    { mode:'multiply',      opacity:0.5, repeat:2 },
                    { mode:'source-over',   opacity:1.0 },
                    { mode:'source-over',   opacity:1.0 }
                ]
            };

            var fmCoverShapeInfo = {
                urlPrefix: 'images/cover-builder/fm-layer',
                maskLayerIndex: 1,
                width:1000,
                height: 1160,
                padding: {
                    left: 110,
                    top: 20,
                    right: 30,
                    bottom: 52
                },
                layers: [
                    { mode:'source-over',   opacity:1.0 },
                    { mode:'source-over',   opacity:1.0 },
                    { mode:'multiply',      opacity:0.5 },
                    { mode:'multiply',      opacity:1.0 },
                    { mode:'source-over',   opacity:0.3, darkOpacity:0.2 },  //hilites - 0.2 for dark textures
                    { mode:'source-over',   opacity:1.0 },
                    { mode:'multiply',      opacity:1.0 },
                    { mode:'multiply',      opacity:1.0 },
                    { mode:'source-over',   opacity:1.0 },
                ]
            };

            var boxShapeInfo = {
                urlPrefix: 'images/cover-builder/box-layer',
                maskLayerIndex: 1,
                width:1000,
                height: 1266,
                padding: {
                    left: 77,
                    top: 45,
                    right: 44,
                    bottom: 70
                },
                layers: [
                    { mode:'source-over',   opacity:1.0 },  //layer 1
                    { mode:'source-over',   opacity:1.0 },  //layer 2
                    { mode:'source-over',   opacity:0.3 },  //layer 3
                    { mode:'multiply',      opacity:1.0 },  //layer 4
                    { mode:'source-over',   opacity:0.3 },  //layer 5
                    { mode:'source-over',   opacity:1.0 },  //layer 6
                    { mode:'multiply',      opacity:1.0 },  //layer 7
                    { mode:'multiply',      opacity:0.5 },  //layer 8
                    { mode:'multiply',      opacity:1.0 },  //layer 9
                    { mode:'multiply',      opacity:1.0 },  //layer 10
                    { mode:'source-over',   opacity:1.0 },  //layer 11
                    { mode:'source-over',   opacity:0.4 },  //layer 12
                ]
            };
            var coverShapes = {
                'fm': fmCoverShapeInfo,
                'pb': pbCoverShapeInfo,
                'box': boxShapeInfo,
                'ts': tsCoverShapeInfo
            }

            var coverShapeInfo = coverShapes[$scope.productPrototype.coverBuilderMask] || pbCoverShapeInfo;
            //var coverShapeInfo = $scope.productPrototype.coverBuilderMask==='fm' ? fmCoverShapeInfo : pbCoverShapeInfo;

            var boxMode = false;
            if (['fic'].indexOf($scope.product.options.bookMaterial)>=0 && $attrs.allowBoxMode==='true') {
               coverShapeInfo = boxShapeInfo;
               boxMode = true;
            }

            var layers = [],
                numLayersLoaded = 0,
                layersLoaded = false;

            //load layers
            function onLayerLoad() {
                numLayersLoaded++;
                if (numLayersLoaded===coverShapeInfo.layers.length) {
                    layersLoaded = true;
                    if ($scope.layout) {
                        stampsRenderer.render();
                        materialsRenderer.render();
                    }
                }
            };

            for(var i=0;i<coverShapeInfo.layers.length;i++) {
                var layer = new Image();
                layer.onload = onLayerLoad;
                layer.src = coverShapeInfo.urlPrefix + (i+1) + (coverShapeInfo.urlSuffix || '.png');
                layers.push(layer);
            }

            function getCoverPage() {
                return $scope.mode === 'CoverRight' ? Page.RIGHT : Page.LEFT;
            }

            function getPadding() {
                var pad = coverShapeInfo.padding,
                    result = {
                        top: pad.top * HINGE_SCALE,
                        bottom: pad.bottom * HINGE_SCALE
                    };

                if ($scope.mode === 'CoverLeft') {
                    result.left = pad.right * HINGE_SCALE;
                    result.right = pad.left * HINGE_SCALE;
                } else {
                    result.left = pad.left * HINGE_SCALE;
                    result.right = pad.right * HINGE_SCALE;
                }
                return result;
            }

            function pointToCoverPreviewSpace(point) {
                var padding = getPadding(),
                    pt = {x:point.x, y:point.y};

                if ($scope.mode === 'CoverRight') {
                    pt.x += padding.left + padding.right;
                }
                pt.x = GeomService.roundNumber(pt.x + padding.left, 2);
                pt.y = GeomService.roundNumber(pt.y + padding.top, 2);
                return pt;
            }

            var minScale;

            function autoScale() {
                if (!$scope.coverLayout) return;

                var size = { width:$canvasWrap.width(), height:$canvasWrap.height() },
                    canvasSize = mainRenderer.getCanvasSize(1.0),
                    rect = GeomService.fitRectangleProportionally( canvasSize, size ),
                    scale = rect.width / canvasSize.width;

                if (minScale) {
                    scale = Math.min(minScale, scale);
                }
                minScale = scale;

                _.each(layoutController.renderers, function(r) {
                    r.scale = r.canvas.scale = scale;
                });
                layoutController.scale = scale;
                scaleChanged = true;

                if (scale!==BumpMapService.lastCoverImageScale)
                    BumpMapService.lastCoverImage = null;

                $scope.marginTop = -Math.round(canvasSize.height * scale / 2) + 'px';

                stampsRenderer.render();
                mainRenderer.render();
            }

            function getStudioSampleElement() {
                var positions = DebossingService.getElementPositions(
                        $scope.productPrototype, $scope.product, '_studioSample'),
                    foils = DebossingService.getFoils(
                        $scope.productPrototype, $scope.product, '_studioSample'),
                    imageFile = angular.copy(StoreConfig.studioSampleDie),
                    rect = GeomService.fitRectangleProportionally(imageFile, {width:72 * 2.5, height:72 * 2.5}),

                    element = {
                        width: rect.width,
                        height: rect.height,
                        imageWidth: rect.width,
                        imageHeight: rect.height,
                        imageFile: imageFile,
                        imageX: 0,
                        imageY: 0,
                        imageRotation: 0,
                        rotation: 0,
                        opacity: 1,
                        positionCode: positions[0].code,
                        foilCode: foils[0].code,
                        type: 'ImageStampElement'
                    };
                return element;
            }

            function prepareLayouts() {
                var product = $scope.product,
                    productPrototype = $scope.productPrototype,
                    coverLayout = angular.copy($scope.coverLayout),
                    padding = getPadding();

                if (coverLayout) {
                    var stampRect = DebossingService.getStampRect(coverLayout);

                    $scope.layout = coverLayout;
                    var layoutSize = coverLayout.layoutSize;
                    layoutSize.width += padding.left + padding.right;
                    layoutSize.height += padding.top + padding.bottom;

                    _.each(layoutController.renderers, function(r) {
                        r.layout = coverLayout;
                        r.stampRect = stampRect;
                        r.makePages();
                    });
                }

                stampsSpread.elements = [];
                mainSpread.elements = [];
                materialsSpread.elements = [];

                if ($scope.coverLayout && $scope.coverLayout.spreads.length>0) {
                    angular.forEach($scope.coverLayout.spreads[0].elements, function(element) {
                        if (element.type==='MaterialElement' || element.type==='ImageElement') {
                            //if (firstTime)
                                element._id = element._id || _.uniqueId('element_');

                            //console.log(element.type, element._id)
                            element = angular.copy(element);
                            var eq = function(a,b) {
                                return Math.abs(a-b)<=0.1;
                            };

                            var rect = new PACE.Rect(element),
                                left = rect.left,
                                right = rect.right,
                                top = rect.top,
                                bottom = rect.bottom,
                                pageWidth = $scope.coverLayout.layoutSize.width,
                                pageHeight = $scope.coverLayout.layoutSize.height;

                            if (rect.left<pageWidth)
                                left += padding.right;
                            else
                                left = coverLayout.layoutSize.width + (rect.left - pageWidth);

                            if (rect.right<pageWidth)
                                right += padding.right;
                            else
                                right = coverLayout.layoutSize.width + (rect.right - pageWidth);

                            if (eq(rect.left, 0))
                                left = 0;

                            if (eq(rect.right, pageWidth*2))
                                right = coverLayout.layoutSize.width * 2;

                            if (eq(rect.top, 0))
                                top = 0;

                            if (eq(rect.bottom, pageHeight))
                                bottom = coverLayout.layoutSize.height;

                            element.x = GeomService.roundNumber(left, 2);
                            element.y = GeomService.roundNumber(top, 2);
                            element.width = GeomService.roundNumber(right - left, 2);
                            element.height = GeomService.roundNumber(bottom - top, 2);
                            if (element.type==='ImageElement') {
                                new PACE.FillFrameCommand(element).execute();
                                new PACE.CenterContentCommand(element).execute();
                            }

                            materialsSpread.elements.push(element);

                            // if (element.type==='ImageElement') {
                            //     var materialLayerElement = angular.copy(element),
                            //         mainElement = angular.copy(element);

                            //     mainElement.stampsLayerElement = {};
                            //     mainElement.originalElement = element;
                            //     materialsSpread.elements.push(materialLayerElement);

                            //     mainElement.materialsLayerElement = materialLayerElement;
                            //     mainElement.opacity = 0;
                            //     mainSpread.elements.push(mainElement);
                            // } else {
                            //     materialsSpread.elements.push(element);
                            // }
                        }
                    });
                }

                //console.log('prepareLayouts', coverLayout, $scope.mode)
                var studioSampleElement = (product.options._studioSample && $scope.mode==='CoverLeft') ? getStudioSampleElement() : null,
                    elementOffsetY = 0;


                for(var prop in product.options) {
                    var val = product.options[prop];

                    //TODO: IRIS only hack
                    if (['qbic', 'fic'].indexOf($scope.product.options.bookMaterial)>=0 && $attrs.allowBoxMode!=='true') {
                       continue;
                    }

                    if (val && val.type==='CameoSetElement') {
                        var option = productPrototype.getPrototypeProductOption(prop);

                        var coverMode = 'CoverRight';
                        if (option.effectiveParams && option.effectiveParams.coverPage)
                            coverMode = option.effectiveParams.coverPage==='front' ? 'CoverRight' : 'CoverLeft';

                        if (coverMode!==$scope.mode) continue;

                        for(var i=0;i<val.shapes.length;i++) {
                            var el = val.shapes[i];
                            var p = DebossingService.getElementPosition(el,
                                $scope.coverLayout.layoutSize,
                                getCoverPage(),
                                el);
                            p = pointToCoverPreviewSpace(p);
                            el.x = p.x;
                            el.y = p.y;

                            //if (firstTime)
                            console.log('CameoElement', el._id);

                            el._id = el._id || _.uniqueId('element_');

                            var mainElement = angular.copy(el);
                            mainElement.imageFile = el.imageFile;

                            mainElement.originalElement = el;
                            mainElement.opacity = 1;
                            mainSpread.elements.push(mainElement);
                        }
                    }

                    if (val && (val.type==='TextStampElement' || val.type==='ImageStampElement' || prop==='_studioSample')) {

                        var option = productPrototype.getPrototypeProductOption(prop);

                        var coverMode;
                        if (option.effectiveParams && option.effectiveParams.coverPage)
                            coverMode = option.effectiveParams.coverPage==='front' ? 'CoverRight' : 'CoverLeft';
                        else if (prop==='_studioSample')
                            coverMode = 'CoverLeft';
                        else
                            coverMode = 'CoverRight';

                        if (coverMode!==$scope.mode) continue;

                        var element = val;

                        if (prop==='_studioSample') {
                            element = studioSampleElement;
                            elementOffsetY = 0;
                        } else if (studioSampleElement) {
                            elementOffsetY -= studioSampleElement.height + 0.125 * 72;
                        }

                        if (element.autoSize && element.type==='TextStampElement' && PACE.FontsLoaded) {
                            tmpTextBox.element = element;
                            tmpTextBox.refresh();

                            element.width = GeomService.roundNumber(tmpTextBox.width, 2);
                            element.height = GeomService.roundNumber(tmpTextBox.height, 2);
                        }

                        var posVal;

                        if (element.positionCode) {
                            posVal = productPrototype.getPrototypeProductOptionValue(option.effectiveParams.positionOption,
                                element.positionCode);
                            if (posVal) {
                                var pos = DebossingService.getElementPosition(element, $scope.coverLayout.layoutSize,
                                    getCoverPage(), posVal.productOptionValue.params);
                                pos = pointToCoverPreviewSpace(pos);
                                element.x = pos.x;
                                element.y = pos.y + elementOffsetY;
                            }
                        }

                        if (element.foilCode) {
                            var foilVal = productPrototype.getPrototypeProductOptionValue(option.effectiveParams.foilOption,
                                element.foilCode);
                            if (foilVal) {
                                element.foil = _.extend({code:foilVal.productOptionValue.code}, foilVal.productOptionValue.params);
                            }
                        }

                        //if (firstTime)
                            element._id = element._id || _.uniqueId('element_');

                        if (element.metalPlaque && posVal) {

                            var plaquePos = {
                                width: posVal.productOptionValue.params.width,
                                height: posVal.productOptionValue.params.height
                            };
                            var pos = DebossingService.getElementPosition(plaquePos, $scope.coverLayout.layoutSize,
                                getCoverPage(), posVal.productOptionValue.params);
                            pos = pointToCoverPreviewSpace(pos);

                            if (element.type==='ImageStampElement') {
                                element.x = pos.x + plaquePos.width/2 - element.width/2;
                                element.y = pos.y + plaquePos.height/2 - element.height/2;
                            }

                            var plaque = {
                                type: 'CameoElement',
                                x: pos.x,
                                y: pos.y,
                                width: plaquePos.width,
                                height: plaquePos.height,
                                opacity: 1,
                                imageX: 0,
                                imageY: 0,
                                imageWidth: plaquePos.width,
                                imageHeight: plaquePos.height,
                                imageRotation: 0,
                                rotation: 0,
                                metalPlaque: true,
                                imageFile: {
                                    url: '/images/cover-builder/metal-plaque-small.jpg',
                                    width: 512,
                                    height: 512
                                }
                            };
                            plaque._id = element._id + '_plaque';
                            materialsSpread.elements.push(plaque);
                        }

                        var stampLayerElement = angular.copy(element),
                            materialLayerElement = angular.copy(element),
                            mainElement = angular.copy(element);

                        mainElement.originalElement = element;
                        stampLayerElement.originalElement = element;

                        materialLayerElement.opacity = coverSettings.foilOpacity;
                        materialsSpread.elements.push(materialLayerElement);

                        mainElement.stampsLayerElement = stampLayerElement;
                        mainElement.materialsLayerElement = materialLayerElement;
                        mainElement.opacity = 0;
                        mainSpread.elements.push(mainElement);

                        stampLayerElement.stampLayer = true;
                        materialLayerElement.materialLayer = true;

                        stampsSpread.elements.push(stampLayerElement);
                    }
                }
                firstTime = false;
                bumpMappingDone = false;
            }

            function getNumObjectsReady() {
                var numObjectsReady = 0;

                angular.forEach(materialsRenderer.canvas.getObjects(), function(object) {
                    if (object.type==='ImageStampElement' ||
                        object.type==='MaterialElement' ||
                        object.type==='ImageElement')
                        numObjectsReady += object.loaded ? 1 : 0;
                    else
                        numObjectsReady++;
                });
                return numObjectsReady;
            }

            stampsRenderer.canvas.on('before:render', function() {
                var ctx = stampsRenderer.canvas.getContext();
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, stampsRenderer.canvas.width, stampsRenderer.canvas.height);
            });

            var debouncedMaterialsRender = $debounce(function() {
                 materialsRenderer.render();
            }, 0);

            stampsRenderer.canvas.on('after:render', function() {
                if (editMode)
                    materialsRenderer.render();
                else
                    debouncedMaterialsRender();
            });

            var currentAnimation;

            var transitionDebounced = $debounce(function() {
                var materials = [],
                    numMaterialsLoaded = 0;

                _.each(materialsRenderer.canvas.getObjects(), function(object) {
                    if ((object.type==='MaterialElement' || object.type==='PolygonMaterialElement') && object.prevImage) {
                        materials.push(object);
                        object.transition = 0;

                        if (object.loaded) numMaterialsLoaded++;
                    }
                });

                if (materials.length>numMaterialsLoaded) return;
                loadingStuff = false;
                spinner.hide();

                var animation = {};
                if (currentAnimation) {
                    currentAnimation.cancelled = true;
                }
                currentAnimation = animation;

                fabric.util.animate({
                    startValue: 0,
                    endValue: 1,
                    duration: 500,
                    onChange: function(value) {
                        _.each(materials, function(m) {
                            m.transition = value;
                        });

                        materialsRenderer.canvas.renderAll();
                    },
                    onComplete: function() {
                         _.each(materials, function(m) {
                            m.prevImage = null;
                        });
                        currentAnimation = null;
                    },
                    abort: function() {
                        return animation.cancelled;
                    }
                });

            }, 50);

            materialsRenderer.canvas.on('material:loaded', function() {
                transitionDebounced();
            });

            materialsRenderer.canvas.on('after:render', function() {

                var ctx = materialsRenderer.canvas.getContext(),
                    width = materialsRenderer.canvas.width,
                    height = materialsRenderer.canvas.height,
                    numObjectsReady = getNumObjectsReady();

                //console.log('render 1', numObjectsReady);

                if (numObjectsReady>0 && numObjectsReady===materialsRenderer.canvas.size()) {
                    ctx.save();

                    var stamps = _.filter(stampsSpread.elements, function(el) {
                        return el.type==='TextStampElement' || el.type==='ImageStampElement';
                    });

                    for (var i = 0; i < stamps.length; i++) {
                        var element = new PACE.Element(stamps[i]),
                            bounds = element.getBoundingBox()
                                .toCanvasSpace(materialsRenderer.canvas)
                                .inflate(30, 30)
                                .round()
                                .intersection(new PACE.Rect({x:0, y:0, width:width, height:height}));

                        if (!bounds) continue;
                        BumpMapService.computeNormalMapAndDrawLight(
                            stampsRenderer.canvas.getContext(),
                            ctx,
                            bounds.x,
                            bounds.y,
                            bounds.width,
                            bounds.height,
                            materialsRenderer.canvas.scale);
                    };

                    ctx.restore();
                    bumpMappingDone = true;

                }
                if (editMode) {
                    mainRenderer.canvas.renderAll();
                } else
                    mainRenderer.render();

                if (scaleChanged) {
                    scaleChanged = false;
                    setTimeout(function() { mainRenderer.canvas.calcOffset(); });
                }
            });

            var renderFirstTime = true,
                tmpCanvas;

            mainRenderer.canvas.on('before:render', function() {

                var ctx = mainRenderer.canvas.getContext(),
                    width = mainRenderer.canvas.width,
                    height = mainRenderer.canvas.height,
                    scale = mainRenderer.scale,
                    numObjectsReady = getNumObjectsReady();

                //console.log('render 2', numObjectsReady);

                var objects = mainRenderer.canvas.getObjects();
                for (var i = 0; i < objects.length; i++) {
                    var o = objects[i];
                    o.opacity = o.element.opacity;
                    o.selectable = mainRenderer.canvas.selection &&
                        (o.type==='ImageStampElement' || o.type==='TextStampElement' ||
                        (o.type==='CameoElement' && o.element.imageFile));
                    o.lockMovementX = true;
                    o.lockMovementY = true;
                }

                if (!layersLoaded || !bumpMappingDone || numObjectsReady<materialsRenderer.canvas.size()) {
                    if (BumpMapService.lastCoverImage && BumpMapService.lastCoverImageMode===$scope.mode) {
                        for (var i = 0; i < objects.length; i++) {
                            var o = objects[i];
                            o.opacity = 0;
                        }
                        ctx.putImageData(BumpMapService.lastCoverImage, 0, 0);
                    }
                    return;
                }

                if (editMode && layoutController.selectedElements.length===1 &&
                    layoutController.selectedElements[0].type==='CameoElement' &&
                    BumpMapService.lastCoverImage && BumpMapService.lastCoverImageMode===$scope.mode) {
                    ctx.putImageData(BumpMapService.lastCoverImage, 0, 0);
                    return;
                }

                tmpCanvas = tmpCanvas || document.createElement("canvas");
                if (tmpCanvas.width!==width || tmpCanvas.height!==height) {
                    tmpCanvas.width = width;
                    tmpCanvas.height = height;
                }
                var tmpCtx = tmpCanvas.getContext("2d");
                tmpCtx.clearRect(0, 0, width, height);

                ctx.globalCompositeOperation = 'source-over';
                ctx.clearRect(0, 0, width, height);

                //mask the texture
                var mask = layers[coverShapeInfo.maskLayerIndex],
                    padding = coverShapeInfo.padding,
                    pad = {
                        x: padding.left,
                        y: padding.top,
                        width: coverShapeInfo.width - (padding.left + padding.right),
                        height: coverShapeInfo.height - (padding.top + padding.bottom)
                    };

                var hingeScale = 0.8;

                tmpCtx.globalCompositeOperation = 'source-over';
                var scaledMask = new Scale9(mask, pad.x, pad.y, pad.width, pad.height);

                var lw = (padding.left + padding.right) + ($scope.coverLayout.layoutSize.width * 1/HINGE_SCALE),
                    lh = (padding.top + padding.bottom) + ($scope.coverLayout.layoutSize.height * 1/HINGE_SCALE);

                scaledMask.resize(lw , lh);

                tmpCtx.save();
                if ($scope.mode === 'CoverLeft') {
                    tmpCtx.translate(width, 0);
                    tmpCtx.scale(-1, 1);
                }
                scaledMask.drawImageTo(tmpCtx, 0, 0, scale * HINGE_SCALE);
                tmpCtx.restore();

                tmpCtx.globalCompositeOperation = 'source-atop';
                tmpCtx.drawImage(materialsRenderer.canvas.getElement(), 0, 0, width, height);

                //draw layers
                for(var i=0;i<coverShapeInfo.layers.length;i++) {
                    var img = i===coverShapeInfo.maskLayerIndex ? tmpCanvas : layers[i];
                    var layerInfo = coverShapeInfo.layers[i];
                    ctx.globalAlpha = layerInfo.opacity;
                    ctx.globalCompositeOperation = layerInfo.mode;

                    if (i===coverShapeInfo.maskLayerIndex) {
                        ctx.drawImage(img, 0, 0, width, height);
                    } else {
                        var scaledImage = new Scale9(img, pad.x, pad.y, pad.width, pad.height);
                        scaledImage.resize(lw, lh);
                        ctx.save();
                        if ($scope.mode === 'CoverLeft') {
                            ctx.translate(width, 0);
                            ctx.scale(-1, 1);
                        }
                        var r = layerInfo.repeat || 1;
                        for(var j=0;j<r;j++) {
                            scaledImage.drawImageTo(ctx, 0, 0, scale * HINGE_SCALE);
                        }
                        ctx.restore();
                    }
                }

                //debug info
                /*
                ctx.save();
                if ($scope.mode === 'CoverLeft') {
                    ctx.translate(width, 0);
                    ctx.scale(-1, 1);
                }
                ctx.strokeStyle = '#ff0000';
                var s = scale * HINGE_SCALE;
                ctx.strokeRect(pad.x * s, pad.y * s, $scope.coverLayout.layoutSize.width * scale, $scope.coverLayout.layoutSize.height * scale);
                ctx.restore();
                */

                if (renderFirstTime && (!BumpMapService.lastCoverImage || BumpMapService.lastCoverImageMode!==$scope.mode)) {
                    renderFirstTime = false;
                    $element.fadeOut(0).fadeIn();
                }

                if (!editMode) {
                    var ctx = mainRenderer.canvas.getContext(),
                        width = mainRenderer.canvas.width,
                        height = mainRenderer.canvas.height,
                        scale = mainRenderer.scale;

                    try {
                        BumpMapService.lastCoverImage = ctx.getImageData(0, 0, width, height);
                        BumpMapService.lastCoverImageScale = scale;
                        BumpMapService.lastCoverImageMode = $scope.mode;
                    } catch(error) {
                        console.log('Cannot store lastCoverImage');
                    }
                }

            });

            mainRenderer.canvas.on('after:render', function() {
                // if (renderFirstTime && (!BumpMapService.lastCoverImage || BumpMapService.lastCoverImageMode!==$scope.mode)) {
                //     renderFirstTime = false;
                //     $element.fadeOut(0).fadeIn();
                // }

                // if (!editMode) {
                //     var ctx = mainRenderer.canvas.getContext(),
                //         width = mainRenderer.canvas.width,
                //         height = mainRenderer.canvas.height,
                //         scale = mainRenderer.scale;

                //     try {
                //         BumpMapService.lastCoverImage = ctx.getImageData(0, 0, width, height);
                //         BumpMapService.lastCoverImageScale = scale;
                //         BumpMapService.lastCoverImageMode = $scope.mode;
                //     } catch(error) {
                //         console.log('Cannot store lastCoverImage');
                //     }
                // }
            });

            function updateLayers() {
                angular.forEach(layoutController.selectedElements, function(element) {

                    var props = _.pick(element, 'x', 'y', 'width', 'height', 'imageWidth',
                            'imageHeight', 'imageX', 'imageY', 'text', 'rotation', 'textAlign',
                            'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fill', 'autoSize');

                    if (element.originalElement) {
                        _.extend(element.originalElement, props);
                        element.originalElement.styles = angular.copy(element.styles);
                    }
                    if (element.materialsLayerElement) {
                        _.extend(element.materialsLayerElement, props);
                        element.materialsLayerElement.styles = angular.copy(element.styles);
                    }
                    if (element.stampsLayerElement) {
                        _.extend(element.stampsLayerElement, props);
                        element.stampsLayerElement.styles = angular.copy(element.styles);
                    }

                });
            }

            var tempCanvas;

            function updateCrop() {

                var imageStamps = _.where(stampsRenderer.canvas.getObjects(), {type:'ImageStampElement'});

                for (var i = 0; i < imageStamps.length; i++) {
                    var stamp = imageStamps[i],
                        w = Math.ceil(stamp.width * stamp.scaleX),
                        h = Math.ceil(stamp.height * stamp.scaleY),
                        left = stamp.left,
                        top = stamp.top;

                    stamp.left = 0;
                    stamp.top = 0;
                    tempCanvas = tempCanvas || fabric.util.createCanvasElement();
                    tempCanvas.width = w;
                    tempCanvas.height = h;

                    // tempCanvas.style.position = 'absolute';
                    // tempCanvas.style['z-index'] = 1000;
                    // tempCanvas.style['background-color'] = '#fff';
                    // document.body.appendChild(tempCanvas);

                    var ctx = tempCanvas.getContext('2d');

                    ctx.save();
                    stamp.render(ctx, true);
                    ctx.restore();

                    var pixels = ctx.getImageData(0, 0, w, h).data;
                    var minY = h,
                        maxY = 0,
                        minX = w,
                        maxX = 0;
                    for (var y = 0; y < h; y++) {
                        for (var x = 0; x < w; x++) {
                            var index = (y * w + x) * 4,
                                r = pixels[index],
                                g = pixels[index+1],
                                b = pixels[index+2],
                                a = pixels[index+3];
                            if (a>0) {
                                minY = Math.min(y, minY);
                                maxY = Math.max(y, maxY);

                                minX = Math.min(x, minX);
                                maxX = Math.max(x, maxX);
                            }
                        }
                    }
                    var cropWidth = (maxX - minX) / stamp.scaleX,
                        cropHeight = (maxY - minY) / stamp.scaleY;

                    stamp.left = left;
                    stamp.top = top;
                    stamp.element.originalElement.cropWidth = cropWidth;
                    stamp.element.originalElement.cropHeight = cropHeight;
                    //console.log('crop', cropWidth, cropHeight);
                }
            }

            $scope.$parent.$on('layout:selection-modified', function() {
                //console.log('selection-modified, update layers')
                updateLayers();
                stampsRenderer.render();
                updateCrop();
            });

            mainRenderer.canvas.on('object:moving', function(options) {

                if (layoutController.selectedElements.length===0) return;

                var scale = mainRenderer.scale,
                    canvas = mainRenderer.canvas,
                    target = options.target,
                    selectionRect = target.getCoordsInModelSpace(),
                    selectedElements = layoutController.selectedElements,
                    cmd = new PACE.TransformElementsCommand(selectedElements, selectionRect);
                cmd.execute();

                updateLayers();
                stampsRenderer.render();

            });

            mainRenderer.canvas.on('object:scaling', function(options) {

                if (layoutController.selectedElements.length===0) return;

                var scale = mainRenderer.scale,
                    canvas = mainRenderer.canvas,
                    target = options.target,
                    selectionRect = target.getCoordsInModelSpace(),
                    selectedElements = layoutController.selectedElements,
                    cmd = new PACE.TransformElementsCommand(selectedElements, selectionRect);
                cmd.execute();

                updateLayers();
                stampsRenderer.render();

            });

            $scope.$parent.$on('layout:selection-changed', function() {
                editMode = true;
            });

            var loadingStuff = false;
            $scope.setLoading = function(loading) {
                loadingStuff = loading;
                if (loadingStuff) {
                    setTimeout(function() {
                        if (loadingStuff) {
                            spinner.show();
                        }
                    }, 500);
                } else if (layersLoaded) {
                    spinner.hide();
                }
            };

            $scope.$parent.$on('layout:selection-cleared', function() {
                if (!editMode)
                    return;

                editMode = false;
                stampsRenderer.render();

            });

            $scope.$parent.$on(FontEvent.FontsLoaded, function() {
                $timeout(function() {
                    layoutController.refreshCoverPreview();
                });
            });

            spinner.hide();

            if (!BumpMapService.lastCoverImage || BumpMapService.lastCoverImageMode!==$scope.mode) {
                $element.fadeOut(0);
            }

            if ($scope.coverLayout) {
                prepareLayouts();
                autoScale();
            }

            function resize() {
                minScale = null;
                autoScale();
            }

            var resizeHandler = $debounce(resize, 500);
            $window.resize(resizeHandler);

            layoutController.pointToCoverPreviewSpace = pointToCoverPreviewSpace;

            layoutController.renderStampLayer = function() {
                stampsRenderer.render();
            };

            layoutController.refreshCoverPreview = function(fade) {
                var refresh = function() {
                    if (layoutController.selectedElements.length>0) {
                        updateLayers();
                        stampsRenderer.render();
                    } else if ($scope.coverLayout) {
                        prepareLayouts();
                        stampsRenderer.render();
                    }
                };

                if (fade) {
                    firstTime = true;
                    renderFirstTime = true;
                    BumpMapService.lastCoverImage = null;
                    $element.fadeOut();
                    $timeout(refresh, 400);
                } else {
                    refresh();
                }
            };

            layoutController.autoScaleCoverPreview = function() {
                autoScale();
            };

            layoutController.fixStampPosition = function(element, optionCode) {

                if (element.type==='TextStampElement' && element.autoSize && PACE.FontsLoaded) {
                    tmpTextBox.element = element;
                    tmpTextBox.refresh();
                    element.width = GeomService.roundNumber(tmpTextBox.width, 2);
                    element.height = GeomService.roundNumber(tmpTextBox.height, 2);
                }

                if (element.positionCode) {
                    var option = $scope.productPrototype.getPrototypeProductOption(optionCode);
                    var posVal = $scope.productPrototype.getPrototypeProductOptionValue(
                        option.effectiveParams.positionOption, element.positionCode);
                    if (posVal) {
                        var pos = DebossingService.getElementPosition(element, $scope.coverLayout.layoutSize, getCoverPage(),
                            posVal.productOptionValue.params);
                        pos = pointToCoverPreviewSpace(pos);
                        element.x = pos.x;
                        element.y = pos.y;
                    }
                }
            };

            $scope.$watch('coverLayout', function(value, oldValue) {

                if (value && value!==oldValue) {

                    $element.fadeOut();
                    firstTime = true;
                    renderFirstTime = true;
                    BumpMapService.lastCoverImage = null;
                    prepareLayouts();


                    $timeout(function() {
                        //we need to call render on the stampsRenderer here to fix some weird issues with stamp rendering
                        //sometimes fabric doesn't calculate the text dimension correctly when rendering the text for a first time,
                        //thus we need to render it here for the first time, then render it again in the autoScale() function
                        stampsRenderer.render();
                        autoScale();
                    }, 400);


                }

            });

            $scope.$on('$destroy', function() {
                $window.unbind('resize', resizeHandler);
            });
        }

        return {
            scope: {
                coverLayout:'=',
                product:'=',
                productPrototype:'=',
                layoutController:'=',
                mode:'=',
            },
            replace: true,
            restrict: 'E',
            link: link,
            template: '<div class="cover-preview" ng-style="{\'margin-top\':marginTop}"> \
                            <canvas class="mainCanvas"></canvas> \
                            <spinner style="position:absolute;top:50%;left:50%"></spinner> \
                            <div style="display:none"> \
                                <canvas class="materialsCanvas"></canvas> \
                                <canvas class="stampsCanvas"></canvas> \
                            </div> \
                        </div>'
        }
    }])
    .directive('coverControlPanel', ['BumpMapParams', function(BumpMapParams) {
            return {
                scope: {
                    layoutController:'=',
                    render:'&'
                },
                replace: true,
                restrict: 'E',
                template: function() {
                    var params = ['STRENGTH', 'DIFFUSE', 'SPECTACULAR', 'AMBIENT', 'MAX_INTENSITY', 'LIGHT.x', 'LIGHT.y', 'LIGHT.z'],
                        t = '<div style="display:none;position:fixed;left:576px;top:93px;background:#333;padding:20px;z-index:100;font-size:12px">',
                        i;

                    for (var i = 0; i < params.length; i++) {
                        var p = params[i],
                            min = 0, max = 1, step = 0.01, precision = 2;
                        if (i>4) {
                            min = -5000; max = 5000; step = 10; precision = 0;
                        } else if (i===4) {
                            min=1; max=3; precision=3; step=0.01;
                        }
                        t += '<div style="height:35px"><span>' + p + ': </span>' +
                        '<slider-button direction="down" color="dark" slider-scale="full" ' +
                            'ng-model="params.' + p + '" on-change="sliderEditEnd()" slider-precision="' + precision + '" ' +
                            'slider-input="true" slider-input-class="small-75" ' +
                            'slider-label="true" slider-step="' + step + '" slider-min="' + min + '" slider-max="' + max + '"></slider-button></div>';
                    };
                    t += '<div style="margin-top:10px"><span>Show original:</span><input type="checkbox" ng-change="sliderEditEnd()" ng-model="params.DEBUG"/></div>'
                    t += '</div>';

                    return t;
                },
                link: function($scope, $element, $attrs) {
                    $scope.params = BumpMapParams;
                    $scope.sliderEditEnd = function() {
                        if ($scope.render)
                            $scope.render();
                        else
                            $scope.layoutController.refreshCoverPreview();
                    }
                }
            }
        }
    ]);

