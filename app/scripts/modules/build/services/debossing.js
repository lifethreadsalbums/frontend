'use strict';

angular.module('pace.build')

.constant('StampPlaceholder', 'Enter text here')

.service('DebossingService', ['ProductPrototype', 'StampPlaceholder', 'CoverBuilderFonts', 'optionVisibilityFilter', 'Page',
        '$controller', '$rootScope', 'coverSettings', '$q', '$debounce', 'BumpMapService', '$timeout', 'MessageService', 'ProductService', 'GeomService',
        'StoreConfig', 'TextEditorService',
    function (ProductPrototype, StampPlaceholder, CoverBuilderFonts, optionVisibilityFilter, Page,
        $controller, $rootScope, coverSettings, $q, $debounce, BumpMapService, $timeout, MessageService, ProductService, GeomService,
        StoreConfig, TextEditorService) {

        this.allowedChars = /[0-9a-zA-Z&\-\+:;',\.\s]/;
        this.restrictedChars = /[^0-9a-zA-Z&\-\+:;',\.\s]/g;

        this.filterStampText = function(text) {
            return text.replace(this.restrictedChars, '');
        };        

        this.getElementPosition = function(element, layoutSize, page, elementPosition) {
            //TODO: handle spine widths correctly
            var spineWidth = 0;
            var size = {
                    width: layoutSize.width,
                    height: layoutSize.height
                },
                //center = { x: size.width/2, y: size.height/2 - (0.02 * layoutSize.height) },
                center = { x: size.width/2, y: size.height/2 },
                left = 0,
                top = 0;

            if (_.isNumber(elementPosition.left))
                left = elementPosition.left;
            else if (_.isNumber(elementPosition.centerX))
                left = center.x - element.width/2 + elementPosition.centerX;
            else if (_.isNumber(elementPosition.right))
                left = size.width - element.width - elementPosition.right;

            if (_.isNumber(elementPosition.top))
                top = elementPosition.top;
            else if (_.isNumber(elementPosition.centerY)) {
                top = center.y - element.height/2 + elementPosition.centerY;
            } else if (_.isNumber(elementPosition.bottom))
                top = size.height - element.height - elementPosition.bottom;

            if (page===Page.RIGHT)
                left += layoutSize.width + spineWidth;

            return { x: left, y: top };
        };

        function flattenParams(prototypeProductOptionValues, product, optionCode, defaultOptionValueCode) {
            var items = optionVisibilityFilter(prototypeProductOptionValues, product, optionCode);

            return _.map(items, function(value) {
                var item = angular.copy(value.productOptionValue.params);
                if (!item) {
                    console.warn('Params prop is undefined for '+value.displayName, value);
                    item = {};
                }
                item.id = value.id || _.uniqueId('item-');
                item.code = value.code;
                item.displayName = value.displayName;
                item.isDefault = value.code===defaultOptionValueCode;
                return item; 
            });
        }

        function getPrototypeProductOptionValuesByParamsProp(productPrototype, product, optionCode, paramsProp) {
            var productOption = productPrototype.getPrototypeProductOption(optionCode);
            if (!productOption) return [];
            var positionOptionCode = productOption.effectiveParams[paramsProp],
                positionOption = productPrototype.getPrototypeProductOption(positionOptionCode);
            if (!positionOption) return [];

            var defaultOptionValueCode;
            if (positionOption.effectiveDefaultValue) {
                defaultOptionValueCode = ProductService.evalExpression(positionOption.effectiveDefaultValue, product);
            }

            return flattenParams(positionOption.prototypeProductOptionValues, product, optionCode, defaultOptionValueCode);
        }

        this.getElementPositions = function(productPrototype, product, optionCode) {
            return getPrototypeProductOptionValuesByParamsProp(productPrototype, product, optionCode, 'positionOption');
        };

        this.getFoils = function(productPrototype, product, optionCode) {
            return getPrototypeProductOptionValuesByParamsProp(productPrototype, product, optionCode, 'foilOption');
        };

        this.getCameos = function(productPrototype, product, optionCode) {
            return getPrototypeProductOptionValuesByParamsProp(productPrototype, product, optionCode, 'cameoListOption');
        };

        this.getDefaultLogo = function (logos, product, productPrototype, prototypeProductOption) {
            var positions = this.getElementPositions(productPrototype, product, prototypeProductOption.effectiveCode),
                foils = this.getFoils(productPrototype, product, prototypeProductOption.effectiveCode),
                defaultPosition = _.findWhere(positions, {isDefault:true}) || positions[0],
                defaultFoil = _.findWhere(foils, {isDefault:true}) || foils[0],
                image = logos[logos.length - 1];

            var rect = GeomService.fitRectangleProportionally(image, {width:72 * 2, height:72 * 2});

            var imageElement = {
                imageX: 0,
                imageY: 0,
                imageRotation: 0,
                rotation: 0,
                opacity: 1,
                firstUse: false,
                positionCode: defaultPosition.code,
                foilCode: defaultFoil.code,
                type: 'ImageStampElement',
            };
            imageElement.width = rect.width;
            imageElement.height = rect.height;
            imageElement.imageWidth = rect.width;
            imageElement.imageHeight = rect.height;
            imageElement.imageFile = image;

            return imageElement;
        }

        this.getDefaultStampElement = function(product, productPrototype, prototypeProductOption) {

            var positions = this.getElementPositions(productPrototype, product, prototypeProductOption.effectiveCode),
                foils = this.getFoils(productPrototype, product, prototypeProductOption.effectiveCode),
                defaultPosition = _.findWhere(positions, {isDefault:true}) || positions[0],
                defaultFoil = _.findWhere(foils, {isDefault:true}) || foils[0];

            var defaultFontFamily = ProductService.evalExpression(StoreConfig.coverBuilder.defaultFontFamily, product),
                defaultFontSize = ProductService.evalExpression(StoreConfig.coverBuilder.defaultFontSize, product);
                
            var style = {
                fill: 'black',
                fontFamily: defaultFontFamily,
                fontSize: defaultFontSize
            };
            
            var element = {
                type: 'TextStampElement',
                text: StampPlaceholder,
                textAlign: 'center',
                rotation: 0,
                opacity: 1,
                fontFamily: defaultFontFamily,
                fontSize: defaultFontSize,
                styles: {},
                positionCode: defaultPosition.code,
                foilCode: defaultFoil.code
            };
            var styles = {};
            for(var i=0;i<element.text.length;i++) {
                styles[i] = angular.copy(style);
            }
            element.styles[0] = styles;
                
            return element;
        };

        this.getStampRect = function(coverLayout) {
            if (StoreConfig.coverBuilder && StoreConfig.coverBuilder.stampRect) {
                var ctx = { coverLayout: coverLayout };
                var rect = ProductService.evalExpression(StoreConfig.coverBuilder.stampRect, null, ctx);
                //console.log('stampRect from config', rect);
                return rect;
            }

            var stampRect = { 
                x: coverSettings.stampMargin,
                y: coverSettings.stampMargin,
                width: coverLayout.layoutSize.width * 0.4,
                height: coverLayout.layoutSize.height * 0.4
            };

            return stampRect;
        };

        this.fixImageStampElementSize = function(element, coverLayout) {
            var stampRect = this.getStampRect(coverLayout);

            var maxRect = element.width>=element.height ? 
                coverSettings.dieMaxSize : { width:coverSettings.dieMaxSize.height, height:coverSettings.dieMaxSize.width };

            var maxWidth = Math.min(stampRect.width, maxRect.width),
                maxHeight = Math.min(stampRect.height, maxRect.height);

            if (element.width>maxWidth || element.height>maxHeight) {
                var rect = GeomService.fitRectangleProportionally(element, {width:maxWidth, height:maxHeight});
                element.imageWidth = element.width = rect.width;
                element.imageHeight = element.height = rect.height;
            }
        };

        this.fixCameos = function(productPrototype, product, coverLayout) {

            var self = this;

            function createCameoSetElement(cameo, optionCode) {
                var currentOption = product.options[optionCode],
                    currentShapes = currentOption ? currentOption.shapes : null;
                
                var option = { 
                    type: 'CameoSetElement', 
                    shapes: [],
                    positionCode: cameo.code
                };

                for (var i = 0; i < cameo.shapes.length; i++) {
                    var shape = _.extend(cameo.shapes[i], 
                        {
                            type:'CameoElement',
                            opacity: 1,
                            imageRotation: 0,
                            rotation: 0,
                            locked: true,
                        }
                    );
                    if (currentShapes && i<currentShapes.length) {
                        _.extend(shape, _.pick(currentShapes[i], '_id', 'imageFile', 'imageX', 'imageY', 'imageWidth', 'imageHeight'));

                        var oldRatio = currentShapes[i].width / currentShapes[i].height,
                            newRatio = shape.width / shape.height,
                            keepCrop = GeomService.equals(oldRatio, newRatio, 0.1);
                        if (keepCrop) {
                            new PACE.FixContentInFrame(shape).execute();
                        } else {
                            new PACE.FillFrameCommand(shape).execute();
                            new PACE.CenterContentCommand(shape).execute();
                        }
                    }
                    option.shapes.push(shape);
                }
                return option;
            }
            
            _.each(product.options, function(value, optionCode) {
                if (value && value.type==='CameoSetElement') {
                    var cameos = self.getCameos(productPrototype, product, optionCode);
                    console.log('Cameos for ' + optionCode, cameos);
                    var currentCameo = _.findWhere(cameos, {code:value.positionCode});
                    if (!currentCameo && cameos.length>0) {
                        var defaultCameo = cameos[0];
                        product.options[optionCode] = createCameoSetElement(defaultCameo, optionCode);
                    }
                }
            })
        };

        this.fixMetalPlaques = function(productPrototype, product, coverLayout) {
            var self = this;

            var stampRect = self.getStampRect(coverLayout),
                padding = 0.125 * 72;

            _.each(product.options, function(element, optionCode) {
                if (element && element.type==='TextStampElement' && element.metalPlaque) {
                    console.log('fixing metal plaques');
                    var positions = self.getElementPositions(productPrototype, product, optionCode);
                    var pos = _.findWhere(positions, {code:element.positionCode});
                    if (!pos && positions.length>0) {
                        var defaultPos = positions[0];
                        element.positionCode = defaultPos.code;

                        if (element.type==='TextStampElement' && defaultPos.width && defaultPos.height) {
                            element.width = defaultPos.width;
                            element.height = defaultPos.height;
                            element.autoSize = false;
                        } else {
                            element.autoSize = true;
                        }

                        if (element.type==='ImageStampElement' && defaultPos.width && defaultPos.height) {
                            var pad = 0.5 * 72;
                            var rect = GeomService.fitRectangleProportionally(element.imageFile, {width:defaultPos.width - pad, height:defaultPos.height-pad});
                            element.imageWidth = element.width = rect.width;
                            element.imageHeight = element.height = rect.height;
                        }

                        if (element.type==='TextStampElement') {
                            if (defaultPos.fontSize) {
                                new PACE.AddFabricStyleToAllCommand(element, _.pick(defaultPos,'fontSize')).execute();
                            }
                            if (element.autoSize) {
                                TextEditorService.autoSize(element, stampRect.width, stampRect.height);
                            } else {
                                TextEditorService.autoSize(element, element.width - padding * 2, element.height - padding * 2);
                            }
                        }
                        
                    }
                }
            });
        };

        this.fixStamps = function(product, coverLayout) {

            var self = this;

            var stampRect = self.getStampRect(coverLayout),
                padding = 0.125 * 72;

            /*
            _.each(product.options, function(element, optionCode) {
                if (element && (element.type==='TextStampElement' || element.type==='ImageStampElement') && !element.metalPlaque) {
                    console.log('fixing stamps');
                    
                    if (element.type==='ImageStampElement' && (element.width>stampRect.width || element.height>stampRect.height)) {
                        var pad = 0.5 * 72;
                        var rect = GeomService.fitRectangleProportionally(element.imageFile, {width:defaultPos.width - pad, height:defaultPos.height-pad});
                        element.imageWidth = element.width = rect.width;
                        element.imageHeight = element.height = rect.height;
                    }

                    if (element.type==='TextStampElement') {
                        if (element.autoSize) {
                            TextEditorService.autoSize(element, stampRect.width, stampRect.height);
                        } 
                    }
                    
                }
            });
            */

            /*
            var fonts = CoverBuilderFonts.fonts,
                stampRect = this.getStampRect(coverLayout);
            
            function getFontInfo(element) {
                var result = {
                    fontFamily: element.fontFamily,
                    fontSize: element.fontSize
                };

                result.font = _.find(fonts, function(font) {
                    var style = _.findWhere(font.styles, {fontFamily: result.fontFamily});
                    return style!=null;
                });
                
                return result;
            }

            function checkStampSize(element) {

                if (element.width > stampRect.width || element.height > stampRect.height) {
                    var fontInfo = getFontInfo(element);
                    if (fontInfo) {
                        var fontSize = fontInfo.fontSize,
                            sizes = fontInfo.font.sizes;
                        var sizeIdx = _.findIndex(sizes, function(item) {
                            return item.fontSize===fontSize;
                        });

                        if (sizeIdx>0) {
                            fontSize = sizes[sizeIdx - 1].fontSize;
                            console.log('Stamp too big, trying with font size ' + fontSize);
                            new PACE.AddFabricStyleToAllCommand(element, {fontSize:fontSize}).execute();
                            return checkStampSize(element);
                        } else if (fontInfo.font.alt) {
                            var fontFamily = fontInfo.font.alt;
                            fontInfo = getFontInfo({fontFamily:fontFamily});
                            if (fontInfo) {
                                sizes = fontInfo.font.sizes;
                                fontSize = sizes[sizes.length-1].fontSize;
                                new PACE.AddFabricStyleToAllCommand(element, {fontSize:fontSize, fontFamily:fontFamily}).execute();
                                return checkStampSize(element);
                            }
                        }
                        return false;
                    }
                }
                return true;

            }

            var result = true;

            _.each(product.options, function(element, optionCode) {
                if (element && element.type==='TextStampElement' && !element.metalPlaque) {
                    result = result && checkStampSize(element);
                }
            });
            
            // if (!result) {
            //     MessageService.ask('Stamp is too wide, please choose another font.', 'alert', [], false, true);
            // }
            */
        };

        this.renderStampsOnMaterial = function(product, productPrototype, materialElement) {

            function createRenderer(el, spread, scope) {
                var ctrlScope = scope.$new(false);
                ctrlScope.spread = spread;

                var ctrl = $controller('SpreadController', { $element: el, $scope: ctrlScope, $attrs: {} });
                ctrl.element = el;
                ctrl.makePages();
                ctrl.register();
                return ctrl;
            }

            var stampScale = materialElement.stampScale || 0.75,
                deferred = $q.defer(),
                that = this,
                firstTime = true,
                width = (materialElement.materialWidth || materialElement.width) * 1/stampScale,
                height = (materialElement.materialHeight || materialElement.height) * 1/stampScale,
                layout = { layoutSize: { width: width, height: height } },
                scope = $rootScope.$new(true);

            scope.layoutController = new PACE.LayoutController(scope);
            scope.layoutController.scale = stampScale;
            scope.layoutController.currentRenderer = {};
            scope.product = product;
            scope.productPrototype = productPrototype;
            scope.mode = 'CoverRight';
            scope.layout = layout;

            var stampsCanvas = angular.element(document.createElement('canvas')),
                materialsCanvas = angular.element(document.createElement('canvas')),
                
                stampsSpread = { numPages: 2, elements: [] },
                materialsSpread = { numPages: 2, elements: [] },
                
                stampsRenderer = createRenderer(stampsCanvas, stampsSpread, scope),
                materialsRenderer = createRenderer(materialsCanvas, materialsSpread, scope);

            
            function setupLayouts() {
                stampsSpread.elements = [];
                materialsSpread.elements = [];

                materialsSpread.elements.push({
                    type: 'MaterialElement',
                    x: width,
                    y: 0,
                    width: width,
                    height: height,
                    rotation: 0,
                    opacity: 1,
                    prototypeProductOption: materialElement.prototypeProductOption
                });
                
                var mode = 'CoverRight';
                //console.log('prepareLayouts', coverLayout, $scope.mode)

                for(var prop in product.options) {
                    var val = product.options[prop];
                    if (val && (val.type==='TextStampElement' || val.type==='ImageStampElement')) {

                        var option = productPrototype.getPrototypeProductOption(prop);
                        
                        var coverMode;
                        if (option.effectiveParams && option.effectiveParams.coverPage)
                            coverMode = option.effectiveParams.coverPage==='front' ? 'CoverRight' : 'CoverLeft';
                        else
                            coverMode = 'CoverRight';

                        if (coverMode!==mode) continue;

                        var element = val;
                        if (element.type==='TextStampElement' && !(element.width && element.height) ) {
                            var textBox = new PACE.TextStampElement(element);
                            textBox.refresh();
                            element.width = textBox.width;
                            element.height = textBox.height;
                        }

                        // if (element.elementPosition) {
                        //     var pos = that.getElementPosition(element, layout.layoutSize, 
                        //         Page.RIGHT, element.elementPosition);
                        //     element.x = pos.x;
                        //     element.y = pos.y;
                        // }

                        if (element.positionCode) {
                            var posVal = productPrototype.getPrototypeProductOptionValue(option.effectiveParams.positionOption, 
                                element.positionCode);
                            if (posVal) {
                                var pos = that.getElementPosition(element, layout.layoutSize, 
                                    Page.RIGHT, posVal.productOptionValue.params);
                                element.x = pos.x;
                                element.y = pos.y;
                            }
                        }
                        
                        element._id = _.uniqueId('element_');
                 
                        var stampLayerElement = angular.copy(element),
                            materialLayerElement = angular.copy(element);
                           
                        materialLayerElement.opacity = coverSettings.foilOpacity;
                        materialsSpread.elements.push(materialLayerElement);
                        
                        stampsSpread.elements.push(stampLayerElement);

                        stampLayerElement.stampLayer = true;
                        materialLayerElement.materialLayer = true;
                    }
                }    
                
            } //end of setupLayouts()

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

            //stampsRenderer.canvas.on('after:render', debouncedMaterialsRender);
            

            materialsRenderer.canvas.on('after:render', function() {

                var ctx = materialsRenderer.canvas.getContext(),
                    width = materialsRenderer.canvas.width,
                    height = materialsRenderer.canvas.height,
                    numObjectsReady = getNumObjectsReady();
          
                if (numObjectsReady>0 && numObjectsReady===materialsRenderer.canvas.size()) {
                    ctx.save();

                    var stamps = _.filter(materialsSpread.elements, function(el) { 
                        return el.type==='TextStampElement' || el.type==='ImageStampElement' 
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

                    //done, fire event 
                    if (firstTime) {
                        var image = materialsCanvas[0].toDataURL("image/png");
                        deferred.resolve(image);
                    }

                    firstTime = false;
                } 
                
            }); 

            setupLayouts();
            stampsRenderer.render();

            stampsRenderer.canvas.on('after:render', function() {
                materialsRenderer.render();
            });

            stampsRenderer.render();
            
            return deferred.promise;
        }; //end of this.renderStampsOnMaterial()


    }]);