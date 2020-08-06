'use strict';

angular.module('pace.build')
    .controller('DebossingViewCtrl', ['$scope', 'product', 'productPrototype', '$state', 'sectionItem', 'nextSection', 'section',
        'BuildService', '$timeout', 'coverLayout', 'GeomService', 'Page', 'DebossingService', 'SnappingService', 'UndoService', 'CoverBuilderFonts',
        'FontEvent', 'StampPlaceholder', 'MessageService', 'TextEditorService', 'coverSettings', '$debounce', 'ProductService', 'BumpMapService', '$sce',
        'StampSelectionTool', 'DesignerFonts', 'DieFile', 'LogoFile', 'UploadEvent', 'ImageUploadService', 'ImageFile', 'ImageFileStatus', 'StoreConfig',
        'sections', 'user',

        function ($scope, product, productPrototype, $state, sectionItem, nextSection, section,
            BuildService, $timeout, coverLayout, GeomService, Page, DebossingService, SnappingService, UndoService, CoverBuilderFonts,
            FontEvent, StampPlaceholder, MessageService, TextEditorService, coverSettings, $debounce, ProductService, BumpMapService, $sce,
            StampSelectionTool, DesignerFonts, DieFile, LogoFile, UploadEvent, ImageUploadService, ImageFile, ImageFileStatus, StoreConfig,
            sections, user) {

            SnappingService.enableSmartPageGuides = false;
            SnappingService.enableSmartEdgeGuides = false;

            var params = sectionItem.params || {},
                lastItem = section.children.indexOf(sectionItem)===section.children.length-1,
                layoutController = new PACE.LayoutController($scope),
                optionCode = sectionItem.prototypeProductOption.effectiveCode,
                prototypeProductOption = productPrototype.getPrototypeProductOption(optionCode),
                customLogo = prototypeProductOption.systemAttribute==='CustomLogo',
                coverPage = Page.RIGHT,
                preferredFontSize = 72,
                padding = 0.125 * 72,
                stampRect = DebossingService.getStampRect(coverLayout),
                metalPlaque = params.metalPlaque,
                customDieDPI = params.customDieDPI || 300,
                self = this,
                recentTextStampElement,
                recentImageStampElement;

            $scope.layoutController = layoutController;
            $scope.label = sectionItem.displayLabel;
            $scope.description = sectionItem.description;
            $scope.product = product;
            $scope.productPrototype = productPrototype;
            $scope.coverLayout = $scope.model.coverLayout = coverLayout;
            $scope.positionsVisible = false;
            $scope.rotation = 0;
            $scope.colorPickerToggle = false;

            var allowMultipleFonts = user.admin; 

            $scope.enableFontSearch = false;
            $scope.showFoilsInToolbar = params.showFoilsInToolbar;

            StoreConfig.maxNumberOfStampLines = params.maxNumberOfStampLines || 2;

            if (params.maxNumberOfStampLines && _.isString(params.maxNumberOfStampLines)) {
                var numLines = ProductService.evalExpression(params.maxNumberOfStampLines, product, {currentUser:user});
                if (_.isNumber(numLines)) {
                    StoreConfig.maxNumberOfStampLines = numLines;
                }
            }
            //console.log('maxNumberOfStampLines', StoreConfig.maxNumberOfStampLines);

            var positions = DebossingService.getElementPositions(productPrototype, product, optionCode);
            var foils = DebossingService.getFoils(productPrototype, product, optionCode);

            if (params.positionOption && params.showPositionsInToolbar) {
                var maxSize = 75;
                var canvasSize = GeomService.fitRect(coverLayout.layoutSize, {width: maxSize, height: maxSize}),
                    scale = canvasSize.width/coverLayout.layoutSize.width;
                _.each(positions, function(f) {

                    var width = f.width || 72 * 1.5,
                        height = f.height || 72 * 1.2;
                    
                    var span = '<span class="' + (f.width ? 'cameo-window' : 'stamp-position') + '" style="position:absolute;'+
                        'width:'+Math.round(width * scale)+'px;'+
                        'height:'+Math.round(height * scale)+'px;';
                    if (f.left) span += 'left:'+Math.round(f.left*scale)+'px;';
                    if (f.top) span += 'top:'+Math.round(f.top*scale)+'px;';
                    if (f.right) span += 'right:'+Math.round(f.right*scale)+'px;';
                    if (f.bottom) span += 'bottom:'+Math.round(f.bottom*scale)+'px;';
                    if (_.isNumber(f.centerX)) span += 'left:' + Math.round(canvasSize.width/2 - ((width * scale)/2) + (f.centerX * scale) - 1) + 'px;';
                    if (_.isNumber(f.centerY)) span += 'top:' + Math.round(canvasSize.height/2 - ((height * scale)/2) + (f.centerY * scale) - 1) + 'px;';
                    span += '"></span>';
                    
                    f.previewHtml = $sce.trustAsHtml('<div class="cameo-window" style="display:inline-block;position:relative;width:'+
                        Math.round(canvasSize.width) + 'px;height:' + Math.round(canvasSize.height) + 'px;top:' + 
                        ((maxSize - canvasSize.height)/2 + 10) + 'px">' + span + '</div>'); 

                });
                $scope.stampPositions = positions;
            }

            $scope.mode = 'CoverRight';
            if (params.coverPage==='back') {
                $scope.mode = 'CoverLeft';
                coverPage = Page.LEFT;
            }

            //TODO: warning, iris-only hack
            if (coverLayout && ['qbic', 'fic'].indexOf(product.options.bookMaterial)>=0) {
                _.each(coverLayout.spreads[0].elements, function(el) {
                    if (el.prototypeProductOption && el.prototypeProductOption.effectiveCode==='bookColour') {
                        console.log( angular.copy(el.prototypeProductOption) );
                        el.prototypeProductOption = { effectiveCode:'boxColour'};
                    }
                });
                BumpMapService.lastCoverImage = null;
            }

            $scope.$on('$destroy', function() {
                if (coverLayout && ['qbic', 'fic'].indexOf(product.options.bookMaterial)>=0) {
                    BumpMapService.lastCoverImage = null;
                    $scope.model.coverLayout = null;
                }
            });

            $scope.model.selectedStampPosition = null;
            $scope.model.foils = foils;
            $scope.model.debossingCtrl = this;
            $scope.model.caps = 'lowercase';
            $scope.model.align = 'left';
            $scope.model.customLogo = customLogo;
            $scope.model.files = [];
            $scope.model.alignOptions = [
                {value: 'left', icon: 'left'},
                {value: 'center', icon: 'center'},
                {value: 'right', icon: 'right'},
                {value: 'justify', icon: 'justify'}
            ];

            var fonts = DesignerFonts;

            if (PACE.StoreConfig.coverBuilder && PACE.StoreConfig.coverBuilder.fonts) {
                fonts = PACE.StoreConfig.coverBuilder.fonts;
            }

            $scope.model.fonts = fonts;
            $scope.model.strictFontSizes = false;

            if (PACE.StoreConfig.coverBuilder && PACE.StoreConfig.coverBuilder.strictFontSizes) {
                $scope.model.strictFontSizes = true;
            }

            //some getters
            this.getPositions = function() { return positions; };
            this.getCoverLayout = function() { return coverLayout; };
            this.getCoverPage = function() { return coverPage; };
            this.getProduct = function() { return product; };
            this.getParams = function() { return params; };
            this.getCurrentStampElement = function() { return product.options[optionCode]; };

            function getDefaultPosition() { 
                return _.findWhere(positions, {isDefault:true}) || positions[0];
            }

            function getDefaultFoil() {
                return _.findWhere(foils, {isDefault:true}) || foils[0];
            }

            function updateAvailableFonts() {
                //var element = product.options[optionCode];
                //if (!element || element.type!=='TextStampElement') return;

                _.each(fonts, function(font) {
                    font.visible = true;
                    font.enabled = true;
                    if (font.visibilityExpression) {
                        font.visible = ProductService.evalExpression(font.visibilityExpression, product);
                    }
                });
            }

            function updateToolbar() {
                var editMode = (layoutController.currentEditor instanceof PACE.TextEditor),
                    element;
                if (editMode) {
                    element = layoutController.selectedElements[0];
                } else {
                    element = product.options[optionCode];
                }

                if (!element || element.type!=='TextStampElement') return;
                $scope.model.caps = TextEditorService.getCase(element.text);
                $scope.model.align = element.textAlign || 'left';
                $scope.model.alignEnabled = element.text && element.text.indexOf('\n')>0;
                var font = getFontInfo(element);
                if (editMode && allowMultipleFonts) {
                    var selectionStyles = layoutController.currentEditor.getSelectionStyles();
                    font = getFontInfo(selectionStyles);
                }
                $scope.model.selectedFoil = {code:element.foilCode};
                $scope.model.selectedFontFamily = font.fontFamily;
                $scope.model.selectedFontSize = font.fontSize;
                $scope.model.selectedFont = font.font;
            }

            function fixPosition(element) {
                layoutController.fixStampPosition(element, optionCode);
            }

            this.fixPosition = fixPosition;

            function getPreferredFontSize(font, fontSize) {
                var size = _.findWhere(font.sizes, {fontSize:fontSize});
                if (!size) {
                    var sizeDiff = Number.MAX_VALUE;
                    _.each(font.sizes, function(item) {
                        var diff = Math.abs(fontSize - item.fontSize);
                        if (diff<sizeDiff) {
                            size = item;
                            sizeDiff = diff;
                        }
                    });
                }
                return size ? size.fontSize : fontSize;
            }

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

                    if ($scope.model.selectedFont) {
                        var fontSize = getTextStyle(element, 'fontSize'),
                            sizes = $scope.model.selectedFont.sizes;
                        var sizeIdx = _.findIndex(sizes, function(item) {
                            return item.fontSize===fontSize;
                        });

                        if (sizeIdx>0) {
                            $scope.model.selectedFontSize = sizes[sizeIdx - 1].fontSize;
                            console.log('Stamp too big, trying with font size ' + $scope.model.selectedFontSize);
                            applyTextStyles({fontSize:$scope.model.selectedFontSize}, false, false);
                            return checkStampSize(element);
                        } else {
                            MessageService.ok('Stamp is too wide, please make it shorter.');
                        }
                    }
                    //if (!skipMsg)
                    //    MessageService.ask('Stamp is too wide, please make it shorter.', 'alert', [{label:'Ok'}]);
                    return false;
                }
                return true;
            }

            function checkRestrictions(element) {
                var fontInfo = getFontInfo(element),
                    numReplaced = 0;
                if (fontInfo.font) {
                    var size = _.findWhere(fontInfo.font.sizes, {fontSize:fontInfo.fontSize});
                    if (size && size.restrict) {
                        for (var i = 0; i < size.restrict.length; i++) {
                            var ch = size.restrict[i];
                            element.text = element.text.replace(new RegExp(ch, "g"), "");
                            numReplaced++;
                        };
                        if (layoutController.currentEditor instanceof PACE.TextEditor) {
                            layoutController.currentEditor.setRestrict(size.restrict);
                        }
                    }
                }
            }

            function getTextStyle(element, prop) {
                var style = element[prop];
                _.each(element.styles, function(line) {
                    _.each(line, function(charStyle) {
                        if (!style)
                            style = charStyle[prop];
                    });
                });
                return style;
            }

            function setStampPosition(element, pos) {
                if (!element) return;

                if (element.type==='TextStampElement' && pos.width && pos.height) {
                    element.width = pos.width;
                    element.height = pos.height;
                    element.autoSize = false;
                } else {
                    element.autoSize = true;
                }
                element.positionCode = pos.code;
                element.metalPlaque = metalPlaque;

                if (element.type==='ImageStampElement' && pos.width && pos.height) {
                    var pad = 0.5 * 72;
                    var rect = GeomService.fitRectangleProportionally(element.imageFile, {width:pos.width - pad, height:pos.height-pad});
                    element.imageWidth = element.width = rect.width;
                    element.imageHeight = element.height = rect.height;
                }

                if (element.type==='TextStampElement') {
                    if (pos.fontSize) {
                        new PACE.AddFabricStyleToAllCommand(element, _.pick(pos,'fontSize')).execute();
                    }
                    if (element.autoSize) {
                        TextEditorService.autoSize(element, stampRect.width, stampRect.height);
                    } else {
                        TextEditorService.autoSize(element, element.width - padding * 2, element.height - padding * 2);
                    }
                }
            }

            $scope.selectStampPosition = this.selectStampPosition = function(pos) {
                layoutController.clearSelection(true);
                
                var element = product.options[optionCode];                
                $scope.model.selectedStampPosition = pos;
                setStampPosition(element, pos);

                layoutController.refreshCoverPreview();
            };

            var resetOptions;

            function initStampElement() {
                var element = product.options[optionCode];

                if (!element && params.syncOption) {
                    element = product.options[params.syncOption];
                    if (element) {
                        product.options[optionCode] = element;
                        product.options[params.syncOption] = null;
                        element.id = null;

                        var pos = getDefaultPosition();
                        if (pos) {
                            $scope.model.selectedStampPosition = pos;
                            setStampPosition(element, pos);
                        }
                    }
                }

                if (!element && $scope.model.type!=='custom') {
                    element = DebossingService.getDefaultStampElement(product, productPrototype, prototypeProductOption);
                    element.foilCode = getDefaultFoil().code;
                    product.options[optionCode] = element;
                    preferredFontSize = element.fontSize;

                    var pos = $scope.model.selectedStampPosition || getDefaultPosition();
                    if (pos) {
                        $scope.model.selectedStampPosition = pos;
                        setStampPosition(element, pos);
                    }
                    
                }

                if (element) {
                    element.metalPlaque = metalPlaque;
                    if (element.positionCode) {
                        $scope.model.selectedStampPosition = _.findWhere(positions, {code:element.positionCode});
                    }
                }

                if (params.resetOptions) {
                    resetOptions = {}
                    _.each(params.resetOptions, function(opt) {
                        resetOptions[opt] = product.options[opt];
                        product.options[opt] = null;
                    });
                }
            }

            function initEditor() {
                var currentElement = product.options[optionCode];
                if (currentElement) {
                    $scope.model.type = currentElement.type==='ImageStampElement' ? 'custom' : 'standard';
                } else {
                    $scope.model.type = customLogo ? 'custom' : 'standard';
                }

                initStampElement();
                
                //var currentElement = product.options[optionCode];
                if (customLogo) {
                    $scope.model.files = LogoFile.getMyLogos();
                } else {
                    $scope.model.files = DieFile.getMyDies();
                }

                if (currentElement && currentElement.type==='ImageStampElement') {
                    if ($scope.model.files.$promise && !$scope.model.files.$resolved) {
                        $scope.model.files.$promise.then(function() {
                            if (currentElement.imageFile) {
                                $scope.model.selectedFile = _.findWhere($scope.model.files, {id:currentElement.imageFile.id});
                            }
                        });
                    } else {
                        $scope.model.files = [ currentElement.imageFile ];
                        $scope.model.selectedFile = currentElement.imageFile;
                    }
                }
                updateAvailableFonts();
                updateToolbar();
                $('.position-slider').focus();
            }

            function applyTextStyles(styles, applyToSelection, checkSize) {
                var element = product.options[optionCode];

                if (!element || element.type!=='TextStampElement')
                    return;

                if (element.text==='')
                    element.text = StampPlaceholder;

                var editMode = (layoutController.currentEditor instanceof PACE.TextEditor);

                if (editMode) {
                    element = layoutController.selectedElements[0];
                    if (applyToSelection) {
                        layoutController.currentEditor.setSelectionStyles(styles);
                    } else {
                        layoutController.currentEditor.setStyles(styles);
                    }
                    layoutController.currentEditor.focus();
                } else {
                    element = product.options[optionCode];
                    new PACE.AddFabricStyleToAllCommand(element, styles).execute();
                }

                checkRestrictions(element);
                
                if (!$scope.model.strictFontSizes) {
                    if (element.autoSize) {
                        TextEditorService.autoSize(element, stampRect.width, stampRect.height);
                    } else {
                        TextEditorService.autoSize(element, element.width - padding * 2, element.height - padding * 2);
                    }
                } else if (checkSize) {
                    fixPosition(element);
                    checkStampSize(element);
                }

                fixPosition(element);

                if (editMode) {
                    layoutController.currentEditor.refresh();
                    layoutController.fireEvent('layout:selection-modified');
                } else {
                    layoutController.refreshCoverPreview();
                }
                $timeout(updateToolbar);
            }

            function onTextChanged() {
                var element = layoutController.selectedElements[0];
                if (element.autoSize) {
                    fixPosition(element);
                    updateToolbar();
                    layoutController.currentEditor.refresh();
                }
                if (element && element.textAlign!=='center' && element.text.indexOf('\n')===-1) {
                    $scope.model.align = 'center';
                    $scope.changeAlign();
                    $scope.$apply();
                }
            }

            this.setLogo = function(image) {
                if ($scope.model.selectedFile===image) {
                    product.options[optionCode] = null;
                    $scope.model.selectedFile = null;
                    self.clearSelection();
                    return;
                }                

                var currentElement = product.options[optionCode],
                    defaultPosition = $scope.model.selectedStampPosition || positions[0],
                    defaultFoil = foils[0],
                    dpi = image.dpiX || 300;
                
                var imageElement = {
                    imageX: 0,
                    imageY: 0,
                    imageRotation: 0,
                    rotation: 0,
                    opacity: 1,
                    firstUse: !!image.firstUse,
                    positionCode: defaultPosition.code,
                    foilCode: (currentElement && currentElement.foilCode) ? currentElement.foilCode : defaultFoil.code,
                    type: 'ImageStampElement',
                    metalPlaque: params.metalPlaque
                };
                imageElement.imageWidth = imageElement.width = image.width * 72/dpi;
                imageElement.imageHeight = imageElement.height = image.height * 72/dpi;
                imageElement.imageFile = image;

                DebossingService.fixImageStampElementSize(imageElement, coverLayout);
                if (params.metalPlaque) {
                    var defaultPosition,
                        pad = 0.5 * 72;
                    var rect = GeomService.fitRectangleProportionally(imageElement.imageFile, {width:defaultPosition.width - pad, height:defaultPosition.height-pad});
                    imageElement.imageWidth = imageElement.width = rect.width;
                    imageElement.imageHeight = imageElement.height = rect.height;
                }

                product.options[optionCode] = imageElement;
                $scope.model.selectedFile = image;
                self.clearSelection();
            };

            this.setStampType = function(type) {
                $scope.model.type = type;
                var currentElement = product.options[optionCode];
                if (currentElement) {

                    if (type==='standard' && currentElement.type==='ImageStampElement') {
                        recentImageStampElement = angular.copy(currentElement);
                        recentImageStampElement.id = null;
                        recentImageStampElement._id = null;
                    } else if (type==='custom' && currentElement.type==='TextStampElement' &&
                        currentElement.text!==StampPlaceholder) {
                        recentTextStampElement = angular.copy(currentElement);
                        recentTextStampElement.id = null;
                        recentTextStampElement._id = null;
                    }

                    var doStuff = function() { 
                        $scope.model.type = type;
                        product.options[optionCode] = null;
                        if (type==='standard') {
                            if (recentTextStampElement) {
                                product.options[optionCode] = recentTextStampElement;
                                if ($scope.model.selectedStampPosition) {
                                    setStampPosition(recentTextStampElement, $scope.model.selectedStampPosition);
                                }
                                layoutController.refreshCoverPreview();
                            } else {
                                self.initTextStamp();
                            }
                            updateAvailableFonts();
                            updateToolbar();

                        } else {
                            if (recentImageStampElement) {
                                product.options[optionCode] = recentImageStampElement;
                                if ($scope.model.selectedStampPosition) {
                                    setStampPosition(recentImageStampElement, $scope.model.selectedStampPosition);
                                }
                                layoutController.refreshCoverPreview();
                            } else {

                                if ($scope.model.files.length>0) {
                                    $scope.model.selectedFile = null;
                                    self.setLogo($scope.model.files[0]);
                                } else {
                                    layoutController.refreshCoverPreview();
                                }
                            }
                        }
                    };

                    self.clearSelection();
                    if (params.customDieWarning!==false) {
                        var msg = currentElement.type==='TextStampElement' ? 
                            'Uploading Art Work will replace your standard fonts, and additional charges will apply. Would you like to continue?' :
                            'Creating Standard Fonts will replace your custom die, continue anyway?';
                        MessageService.confirm(msg, doStuff);
                    } else {
                        doStuff();
                    }
                    return;
                } else {
                    self.initTextStamp();
                    updateToolbar();
                }
            };

            function processImage(image) {
                image.firstUse = true;
                image.promise.then(function(value) {

                    console.log('file ' + value.filename + ' complete');
                   
                }, function(err) {
                    
                    MessageService.error(err.error);
                    
                }, function(event) { 

                    if (event.type === UploadEvent.ImagePreflighted) {
                        if (image.status===ImageFileStatus.Rejected) {
                            MessageService.ok(image.errorMessage);
                            image.status = ImageFileStatus.Cancelled;
                            return;
                        }

                        if (image.colorSpace === 'RGB') {
                            MessageService.ok('Your file is not on a transparent background. Please re-upload a correct file.');
                            image.status = ImageFileStatus.Cancelled;
                            return;
                        } else {
                            $scope.model.files.push(image);
                        }
                        
                    }
                    if (event.type === UploadEvent.ThumbnailReady && 
                        image.status!==ImageFileStatus.Cancelled &&
                        image.status!==ImageFileStatus.Rejected) {
                        self.setLogo(image);
                    }
                    
                });
            }

            this.onFilesDropped = function(files) {
                var imageFiles = ImageUploadService.uploadImages(files);

                for (var i = 0; i < imageFiles.length; i++) {
                    imageFiles[i].type = customLogo ? 'LogoFile' : 'DieFile';
                    processImage(imageFiles[i]);
                }
            };

            this.deleteImageFile = function(event, imageFile) {
                event.stopImmediatePropagation();
                
                var msg = customLogo ? 
                    'Do you really want to delete your company logo?' : 
                    'Do you really want to delete this file?';

                MessageService.confirm(msg, function() {
                    self.clearSelection();
                    var currentElement = product.options[optionCode];
                    if (currentElement && currentElement.imageFile && 
                        (currentElement.imageFile.id === imageFile.id || currentElement.imageFile === imageFile) ) {

                        product.options[optionCode] = null;
                    }

                    var idx = $scope.model.files.indexOf(imageFile);
                    if (idx>=0)
                        $scope.model.files.splice(idx, 1);

                    if (imageFile.id) {
                        product.$save(function() {
                            ImageFile.delete({id:imageFile.id}, 
                            function() { },
                            function(err) {
                                if (err.data && err.data.type==='org.springframework.dao.DataIntegrityViolationException') {
                                    MessageService.error('You cannot delete this file because it is associated with another project.');
                                    if (idx>=0)
                                        $scope.model.files[idx] = imageFile;
                                }
                            });
                        });
                    }
                    layoutController.refreshCoverPreview();
                });
            };

            this.changeFontSize = function() {
                preferredFontSize = $scope.model.selectedFontSize;

                var applyToSelection = allowMultipleFonts;
                if (layoutController.currentEditor instanceof PACE.TextEditor &&
                    layoutController.currentEditor.isLineSelected()) {
                    applyToSelection = true;
                }
                
                applyTextStyles({ fontSize: $scope.model.selectedFontSize }, applyToSelection, true);
            };

            this.changeFont = function(font) {
                $scope.model.selectedFont = font;
                $scope.model.selectedFontFamily = font.styles[0].fontFamily;
                $scope.model.selectedFontSize = getPreferredFontSize(font, preferredFontSize);

                var applyToSelection = allowMultipleFonts;
               
                applyTextStyles({
                    fontFamily: $scope.model.selectedFontFamily,
                    fontSize: $scope.model.selectedFontSize
                }, applyToSelection, true);
            };

            this.changeFontStyle = function() {
                var applyToSelection = allowMultipleFonts;
                applyTextStyles({fontFamily: $scope.model.selectedFontFamily}, applyToSelection, true);
            };

            this.openColorPicker = function() {
                if ($scope.model.foils.length < 2) {
                    return;
                }
                $scope.model.colorPickerToggle = true;
            };

            this.initTextStamp = function() {
                initStampElement();
                layoutController.refreshCoverPreview();
                layoutController.renderStampLayer(); //rerender stamp layer as a workaround for a text positioning bug in Fabric
            };

            this.clearSelection = function() {
                layoutController.clearSelection();
                layoutController.refreshCoverPreview();
            };

            $scope.setOrientation = function(index) {
                if (layoutController.selectedElements.length!=1)
                    return;
                var angle = [0, 90, 270];
                $scope.rotation = angle[index];
                $scope.rotate();
            };

            $scope.setAlignment = function(index) {
                if (layoutController.selectedElements.length!=1)
                    return;
                var element = layoutController.selectedElements[0];
                if (element.type!=='TextStampElement')
                    return;

                var alignments = ['left', 'center', 'right'];
                var cmd = new PACE.ChangeTextCommand(element, { textAlign:alignments[index] });
                cmd.execute();
                layoutController.currentRenderer.render();
            };

            $scope.changeAlign = function() {
                applyTextStyles({ textAlign:$scope.model.align }, false, true);
            };

            $scope.rotate = function() {
                if (layoutController.selectedElements.length!=1)
                    return;

                var element = layoutController.selectedElements[0];
                var newPos = { rotation: $scope.rotation };
                var cmd = new PACE.TransformElementCommand(element, newPos);
                cmd.execute();
                UndoService.pushUndo(cmd);
                layoutController.currentRenderer.render();
            };

            this.setCaps = function(index) {
                var caps = ['uppercase', 'capitalize', 'lowercase'];

                layoutController.clearSelection();
                var element = product.options[optionCode];

                if (element.type!=='TextStampElement' ||
                    element.text===StampPlaceholder) {
                    return;
                }
                var text = TextEditorService.capitalize(element.text, caps[index]);
                var cmd = new PACE.ChangeTextCommand(element, {text:text});
                cmd.execute();

                fixPosition(element);
                checkStampSize(element);
                layoutController.refreshCoverPreview();
            };

            $scope.onKeyPress = function(e) {
                if (!$scope.stampPositions) return;
                
                var idx = $scope.stampPositions.indexOf($scope.model.selectedStampPosition);
                if (e.keyCode===39) {
                    idx++;
                } else if (e.keyCode===37) {
                    idx--;
                }
                idx = Math.max(0, Math.min($scope.stampPositions.length-1, idx));
                $scope.selectStampPosition($scope.stampPositions[idx]);
            };

            var resetFoilPromise;

            $scope.selectFoil = function(item, preview) {
                if (!preview) {
                    $scope.model.selectedFoil = item;
                    $scope.model.colorPickerToggle = false;
                    $scope.autoSaver.setEnabled(true);
                    return;
                }
                $timeout.cancel(resetFoilPromise);
                
                var element = product.options[optionCode];
                element.foilCode = item.code;
                layoutController.clearSelection();
                layoutController.refreshCoverPreview();
               
                $scope.autoSaver.setEnabled(false);
            };

            this.resetFoilPreview = function() {
                resetFoilPromise = $timeout(function() {
                    $scope.selectFoil( $scope.model.selectedFoil, true );
                }, 200);
            };

            $scope.$on('layout:current-editor-changed', function() {
                if (layoutController.currentEditor instanceof PACE.TextEditor) {
                    layoutController.currentEditor.onTextChanged = onTextChanged;
                }
            });

            $scope.$on('layout:selection-cleared', function() {
                $scope.rotation = 0;

                var element = product.options[optionCode];
                if (element && element.type==='TextStampElement') {
                    var textChanged = false;
                    if (element.text==='') {
                        element.text = StampPlaceholder;
                        textChanged = true;
                    } else if (element.text && element.text.indexOf('\n')>0) {
                        var lines = _.filter(element.text.split('\n'), function(line) { return line!=='';});
                        element.text = lines.join('\n');
                        textChanged = true;
                    }
                    if (textChanged) {
                        fixPosition(element);
                        layoutController.refreshCoverPreview();
                    }
                }

            });

            $scope.$on('layout:text-selection-changed', function (arg, styles) {
                var fontStyle = TextEditorService.getMergedFontStyle(styles);

                var font = getFontInfo(fontStyle);
                $scope.model.selectedFontFamily = font.fontFamily;
                $scope.model.selectedFontSize = font.fontSize;
                $scope.model.selectedFont = font.font;
            });

            $scope.$on(FontEvent.FontsLoaded, function() {
                $timeout(function() {
                    layoutController.refreshCoverPreview();
                });
            });

            $scope.$on('build-next-click', function() {
                var element = product.options[optionCode];
                //if (!checkStampSize(element)) return;

                layoutController.clearSelection();
                if ($state.params.projects) {
                    $scope.$emit('build:goto-orders');
                    return;
                }

                BuildService.goToNextWizardStep(sectionItem, section, sections, productPrototype, product);
            });

            $scope.$on('build-back-click', function() {
                var element = product.options[optionCode] || {};

                if (element.text===StampPlaceholder) {
                    product.options[optionCode] = null;
                    _.each(resetOptions, function(val, key) {
                        product.options[key] = val;
                    });
                    layoutController.refreshCoverPreview();
                }
                //$state.go('^');
                history.back();
            });

            $scope.$on('build-remove-optional-addon-click', function() {
                $scope.model.sidebarAnimation = 'right';
                product.options[optionCode] = null;
                layoutController.refreshCoverPreview();
                $state.go('^');
            });

            $scope.$on('build:edit-stamp', function(event, data) {
                var element = product.options[optionCode];
                if (element) {
                    var target = _.find(layoutController.renderers[0].canvas.getObjects(), 
                        function(o) {
                            return o.element.originalElement = element;
                        });
                    layoutController.selectElements([target.element], true);
                    layoutController.currentTool.onObjectSelected( 
                        layoutController.renderers[0], { target:target, e:data.event });
                } 
            });

            $scope.$watch('product.options.' + optionCode, function(val) {
                $scope.model.nextButtonEnabled = val && ( 
                    (val.type==='TextStampElement' && val.text!==StampPlaceholder && !_.isEmpty(val.text)) ||
                    (val.type==='ImageStampElement' && val.imageFile)
                );
            }, true);

            initEditor();

            //init controller
            layoutController.currentTool = new StampSelectionTool(layoutController, this,
                onTextChanged, $scope, stampRect, coverSettings, coverLayout, customDieDPI);
    }
]).factory('StampSelectionTool', ['$timeout', 'StampPlaceholder', 'TextEditorService', 'DebossingService',
    function StampSelectionTool($timeout, StampPlaceholder, TextEditorService, DebossingService) {
        return function(layoutController, debossingCtrl, onTextChanged, $scope, stampRect, coverSettings, coverLayout, minDpi) {
            'use strict';

            var ctrl = layoutController,
                positionRects = [];
            ctrl.setSelectionEnabled(true);

            setTimeout(initCanvas);

            function findPosition(e, canvas) {

                if (!debossingCtrl.getParams().showPositionsOnCanvas) return null;

                var pos = canvas.getPointer(e),
                    p = new PACE.Point(pos.x, pos.y).toModelSpace(canvas);

                for (var i = 0; i < positionRects.length; i++) {
                    var r = positionRects[i];
                    if (r.x<=p.x && r.y<=p.y && p.x<r.x+r.width && p.y<=r.y+r.height) {
                        return r.position;
                    }
                };
            }

            function drawPositionRect(ctx, r) {
                var rx = 5,
                    ry = 5,
                    w = r.width,
                    h = r.height,
                    x = r.x,
                    y = r.y,
                    k = 1 - 0.5522847498 /* "magic number" for bezier approximations of arcs (http://itc.ktu.lt/itc354/Riskus354.pdf) */;

                ctx.beginPath();
                ctx.moveTo(x + rx, y);

                ctx.lineTo(x + w - rx, y);
                ctx.bezierCurveTo(x + w - k * rx, y, x + w, y + k * ry, x + w, y + ry);

                ctx.lineTo(x + w, y + h - ry);
                ctx.bezierCurveTo(x + w, y + h - k * ry, x + w - k * rx, y + h, x + w - rx, y + h);

                ctx.lineTo(x + rx, y + h);
                ctx.bezierCurveTo(x + k * rx, y + h, x, y + h - k * ry, x, y + h - ry);

                ctx.lineTo(x, y + ry);
                ctx.bezierCurveTo(x, y + k * ry, x + k * rx, y, x + rx, y);

                ctx.closePath();
                ctx.fill();
            }

            function onRender() {

                var positions = debossingCtrl.getPositions();
                if (positions && positions.length>0) {
                    var canvas = layoutController.renderers[0].canvas,
                        ctx = canvas.getContext(),
                        currentElement = debossingCtrl.getCurrentStampElement();

                    ctx.save();
                    ctx.setTransform(1,0,0,1,0,0);
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    positionRects = [];
                    for (var i = 0; i < positions.length; i++) {
                        var pos = positions[i],
                            el = { width:1.5*72, height:1.2*72, position:pos },
                            elPos = DebossingService.getElementPosition(el, 
                                debossingCtrl.getCoverLayout().layoutSize, 
                                debossingCtrl.getCoverPage(), 
                                pos);
                        if (currentElement && currentElement.positionCode===pos.code) 
                            continue;

                        elPos = layoutController.pointToCoverPreviewSpace(elPos);
                        el.x = elPos.x;
                        el.y = elPos.y;
                        positionRects.push(el);
                        var rect = new PACE.Rect(el).toCanvasSpace(canvas).round();

                        if (positions.length>1) {
                            drawPositionRect(ctx, rect);
                        }
                    }
                    ctx.restore();
                }

            }

            function initCanvas() {
                var canvas = layoutController.renderers[0].canvas;
                if (debossingCtrl.getParams().showPositionsOnCanvas) {
                    canvas.on('after:render', onRender);
                }

                canvas.on('TextStampElement:char-restricted', function(data) {

                    var isUpperCase = data.char.toUpperCase()===data.char;
                    var txt = 'Unfortunately we no longer have a ' + (isUpperCase ? 'CAPS ':'') + '"' + data.char +
                            '" in ' + $scope.model.selectedFont.displayName +
                            '. You can either choose a lower case "' + data.char.toLowerCase() +
                            '" or choose another font altogether.';

                    MessageService.warn(txt);
                });
            }

            this.onObjectSelected = function(renderer, options) {

                console.log('onObjectSelected', options.target)
                if (ctrl.currentRenderer && ctrl.currentRenderer !== renderer) {
                    ctrl.currentRenderer.clearSelection();
                }

                ctrl.setCurrentRenderer(renderer);
                ctrl.selectElements( [options.target.element], false );

                if (ctrl.selectedElements.length===1) {
                    var element = ctrl.selectedElements[0];

                    $timeout(function() {
                        if (element.type==='TextStampElement') {
                            if (element.text===StampPlaceholder)
                                element.text = '';

                            var fontSize = TextEditorService.getMergedFontStyle(element).fontSize,
                                size = _.findWhere($scope.model.selectedFont.sizes, {fontSize:fontSize});

                            ctrl.currentEditor = new PACE.TextEditor(ctrl);
                            if (size && size.restrict) {
                                ctrl.currentEditor.restrict = size.restrict;
                            }
                            ctrl.currentEditor.beginEdit( element.text!=='' ? options.e : null );
                            onTextChanged();
                            if (element.text==='') {
                                ctrl.currentEditor.refresh();
                            }
                        } else {
                            ctrl.currentEditor = new PACE.ImageStampEditor(ctrl, debossingCtrl);
                            ctrl.currentEditor.stampRect = stampRect;
                            ctrl.currentEditor.dieMaxSize = coverSettings.dieMaxSize;
                            ctrl.currentEditor.coverLayout = coverLayout;
                            ctrl.currentEditor.minDpi = minDpi;
                            ctrl.currentEditor.stampPosition = $scope.model.selectedStampPosition;

                            if ($scope.model.selectedStampPosition && $scope.model.selectedStampPosition.width &&
                                $scope.model.selectedStampPosition.height) {

                                var pad = 0.5 * 72;
                                ctrl.currentEditor.dieMaxSize = {
                                    width:$scope.model.selectedStampPosition.width - pad, 
                                    height:$scope.model.selectedStampPosition.height - pad
                                };
                            }

                            ctrl.currentEditor.beginEdit();
                        }
                        ctrl.fireEvent('layout:current-editor-changed');
                        ctrl.fireEvent('layout:selection-modified');
                    }, 0);

                    //hack to prevent weird behaviour when the user clicks multiple times on the stamp
                    renderer.canvas.preventMouseDown = true;
                    setTimeout(function() {
                        renderer.canvas.preventMouseDown = false;
                    }, 500);
                }

            };

            this.onMouseDown = function(renderer, options) {
                if (!options.target && ctrl.currentRenderer && ctrl.currentRenderer !== renderer) {
                    var prevRenderer = ctrl.currentRenderer;
                    ctrl.setCurrentRenderer(renderer);
                    ctrl.clearSelection();
                    prevRenderer.clearSelection();
                }
            };

            this.onMouseUp = function(renderer, options) {
                //if (!options.target) {
                    var position = findPosition(options.e, renderer.canvas);
                    if (position) {
                        debossingCtrl.selectStampPosition(position);
                        ctrl.clearSelection(true);
                    }
                //}
                
            };

            this.onMouseMove = function (renderer, options) {
                var canvas = renderer.canvas,
                    target = options.target,
                    targetType = target && target.element ? target.element.type : null;

                if (targetType==='TextStampElement') {
                    ctrl.setDefaultCursor('text');
                } else {
                    var position = findPosition(options.e, renderer.canvas);
                    if (position)
                        ctrl.setDefaultCursor('pointer');
                    else if (!target)
                        ctrl.setDefaultCursor('default');
                }
            };

        };
    }
]);
