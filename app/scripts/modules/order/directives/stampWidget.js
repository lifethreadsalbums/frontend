'use strict';

angular.module('pace.order')

.directive('stampWidget', ['$parse', 'UndoService', 'SnappingService', 'GeomService', 'Page',
    'BuildService', '$timeout', 'QuillToFabric', 'FabricToQuill', 'ImageUploadService', 'UploadEvent', 'StoreConfig', 'ImageFile', 'LogoFile',
    'MessageService', 'CoverBuilderFonts', 'optionVisibilityFilter', 'ProductService', 'TextEditorService', 'DebossingService', 'Layout', 'DieFile',
    function ($parse, UndoService, SnappingService, GeomService, Page, BuildService,
        $timeout, QuillToFabric, FabricToQuill, ImageUploadService, UploadEvent, StoreConfig, ImageFile, LogoFile,
        MessageService, CoverBuilderFonts, optionVisibilityFilter, ProductService, TextEditorService, DebossingService, Layout, DieFile) {
        return {
            templateUrl: 'views/components/stampWidget.html',
            replace: true,
            restrict: 'E',
            scope: {
                readOnly:'='
            },
            require: 'ngModel',

            link: function postLink(scope, element, attrs, ngModelCtrl) {

                var Parchment = Quill.import('parchment');
                var Keyboard = Quill.import('modules/keyboard');
                var FontStyle = new Parchment.Attributor.Style('size', 'font-size', { scope: Parchment.Scope.INLINE });
                var FontStyle2 = new Parchment.Attributor.Style('font', 'font-family', { scope: Parchment.Scope.INLINE });
                Quill.register(FontStyle, true);
                Quill.register(FontStyle2, true);

                var DEFAULT_SIZE = 36,
                    coverLayout,
                    shouldInitFormat = false,
                    editable = element.find('.stamp-editor'),
                    toolbar = element.find('.text-editor-toolbar');


                var editor = new Quill(editable[0], {
                        formats: ['align', 'font', 'size', 'color'],
                        //debug: 'info',
                        modules: {
                            'toolbar': {container:toolbar[0]},
                        }
                    }),
                    changeFn = $parse(attrs.onChange),
                    firstTime = true,
                    initialized = false,
                    tmpTextBox = new PACE.TextStampElement({text:''});


                //init scope
                var customLogo = scope.customLogo = attrs.customLogo==='true';

                updateAvailableFonts();

                scope.selectedFont = scope.fonts[0];
                scope.selectedFontSize = scope.fonts[0].sizes[0].fontSize;
                scope.selectedFontStyle = scope.fonts[0].styles[0].fontFamily;
                scope.selectedPosition = null;
                scope.selectedFoil = null;
                scope.files = [];
                scope.type = customLogo ? 'custom' : 'standard';
                scope.selectedStampingTab = customLogo ? 1 : 0;
                scope.storeConfig = StoreConfig;
                scope.model = {};

                //load logos
                if (customLogo) {
                    scope.files = LogoFile.getMyLogos();
                } else {
                    scope.files = DieFile.getMyDies();
                }

//---------------------------------------------------------------------------------------------------
//----------------------------------- set up ngModelController --------------------------------------
//---------------------------------------------------------------------------------------------------

                function fireChangeEvent() {
                    changeFn(scope.$parent, {value:ngModelCtrl.$viewValue});
                }

                function validateModel(value) {
                    var required = true,
                        position = true,
                        foil = true;
                    if (value) {
                        if (value.type==='TextStampElement') {
                            if (!value.text || value.text.length===0)
                                required = false;
                        } else if (value.type==='ImageStampElement') {
                            if (!value.imageFile)
                                required = false;
                        }
                        if (!value.elementPosition)
                            position = false;
                        if (!value.foil)
                            foil = false;

                    } else {
                        required = position = foil = false;
                    }

                    ngModelCtrl.$setValidity('required', required);
                    ngModelCtrl.$setValidity('positionRequired', position);
                    ngModelCtrl.$setValidity('foilRequired', foil);

                    //console.log('validateModel', required && position && foil, value, ngModelCtrl);
                    return required && position && foil ? value || {} : null;
                }

                function getStyles(element) {
                    var styles = {},
                        lines = element.text.split('\n'),
                        charStyle = _.pick(element, 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fill');

                    if (element.foil) {
                        charStyle.fill = element.foil.color;
                    }

                    for(var l=0;l<lines.length;l++) {
                        styles[l] = {};
                        for(var i=0;i<lines[l].length;i++) {
                            styles[l][i] = charStyle;
                        }
                    }
                    return styles;
                }

                var oldViewValue;

                function stampEquals(val, oldVal) {
                    var props = ['id', 'type'];
                    //console.log('stampEquals', _.pick(val, props), _.pick(oldVal, props));
                    return angular.equals(_.pick(val, props), _.pick(oldVal, props));
                }

                function renderModel() {
                    var element = ngModelCtrl.$viewValue;

                    if (oldViewValue && element && element!==oldViewValue &&
                        element.version>=oldViewValue.version && stampEquals(element, oldViewValue)) {
                        //prevent from rendering when the element saves and its version increases
                        return;
                    }

                    //console.log('stampWidget render', element, attrs.ngModel);
                    if (element && element.type) {
                        if (element.type==='TextStampElement') {
                            scope.type = 'standard';
                            scope.selectedStampingTab = 0;
                            var range = editor.getSelection();
                            var styles = element.styles;
                            if (element.text.length>0 && !styles.hasOwnProperty('0'))
                                styles = getStyles(element);

                            editor.setContents( FabricToQuill.getQuillDelta(element.text, styles) );

                            if (element.textAlign) {
                                var align = element.textAlign==='left' ? false : element.textAlign;
                                editor.formatLine(0, editor.getLength(), 'align', align);
                            }
                            if (range) {
                                editor.setSelection(range);
                            }

                            editor.enable(!scope.readOnly);

                            
                            // if (element.text.length>0) {
                            //     var style = styles[0][0];

                            //     scope.model.selectedFont = findFont(style.fontFamily);
                            //     scope.model.selectedFontStyle = style.fontFamily || scope.model.selectedFont.styles[0].fontFamily;

                            //     var fontSize = style.fontSize;
                            //     var sizeItem = _.findWhere(scope.selectedFont.sizes, {fontSize:fontSize});
                            //     if (!sizeItem)
                            //         fontSize = scope.selectedFont.sizes[0].fontSize;
                            //     //scope.model.selectedFontSize = fontSize;

                            //     //editor.format({fontFamily:style.fontFamily, fontSize:fontSize});
                            // } 
                            

                            updateAvailableFonts();

                        } else if (element.type==='ImageStampElement') {
                            scope.type = 'custom';
                            scope.selectedStampingTab = 1;
                            scope.selectedFile = element.imageFile;
                            if (element.imageFile) {
                                scope.imageUrl = element.imageFile.url ?
                                    StoreConfig.imageUrlPrefix + 'thumbnail/' + element.imageFile.url : element.imageFile.thumbnailAsBase64;
                            } else {
                                scope.imageUrl = null;
                            }
                        }
                        scope.selectedPosition = element.elementPosition;
                        scope.selectedFoil = element.foil;
                        

                    } else {
                        shouldInitFormat = true;
                        scope.model.selectedFont = scope.fonts[0];
                        scope.model.selectedFontSize = scope.fonts[0].sizes[0].fontSize;
                        scope.model.selectedFontStyle = scope.fonts[0].styles[0].fontFamily;
                        scope.selectedPosition = null;
                        scope.selectedFoil = null;
                        scope.selectedFile = null;
                        scope.imageUrl = null;
                        editor.setContents({ops:[]});
                    }
                    firstTime = false;
                    oldViewValue = ngModelCtrl.$viewValue;
                    updateToolbar();
                }

                ngModelCtrl.$parsers.push(validateModel);
                ngModelCtrl.$formatters.push(validateModel);
                ngModelCtrl.$render = renderModel;


//---------------------------------------------------------------------------------------------------
//------------------------------------- set up QuillJS editor ---------------------------------------
//--------------------------------------------- -----------------------------------------------------
                function isEditorEmpty() {
                    var text = editor.getText();
                    return (text==='' || text==='\n');
                }

                function initEditor() {
                    if (initialized || !isEditorEmpty()) return;

                    editor.setSelection(0);
                    editor.format('font',scope.model.selectedFontStyle);
                    editor.format('size', scope.model.selectedFontSize+'px');
                    editor.formatText(0, editor.getLength(), 'align', 'center');

                    initialized = true;
                }

                editable[0].addEventListener('keydown', function(e) {

                    if (e.keyCode!==8 && e.keyCode!==46 && coverLayout) {
                        var stampRect = DebossingService.getStampRect(coverLayout);
                        var element = ngModelCtrl.$viewValue;
                        if (element && (element.width > stampRect.width || element.height > stampRect.height)) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                        }
                    }

                    if (e.keyCode===13) {
                        var textLines = editor.getText().split('\n');
                        if (textLines.length>2) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                        }
                    }

                }, true);

                editor.on('text-change', function(delta, oldDelta, source) {

                    if(scope.delta) scope.delta = scope.delta.compose(delta);
                    else scope.delta = delta;

                    if (source === 'api')
                        return;

                    if (isEditorEmpty()) {
                        editor.setSelection(0);
                        editor.format('font',scope.model.selectedFontStyle);
                        editor.format('size', scope.model.selectedFontSize+'px');
                        if (scope.selectedFoil) {
                            editor.format('color', scope.selectedFoil.color);
                        }
                    }

                    var textLines = editor.getText().split('\n');
                    if (textLines.length<3 && scope.align!=='center') {
                        scope.setAlign('center');
                    }

                    scope.$apply(function() {
                        updateStampElement();
                        updateAvailableFonts();
                        updateToolbar();
                        fireChangeEvent();
                    });

                });

                editor.on('selection-change', function(range, source) {
                    $timeout(function() {
                        updateToolbar(range);
                    });
                });


                function findFont(fontFamily) {
                    var fonts = scope.fonts;
                    for (var i = 0; i < fonts.length; i++) {
                        var style = _.findWhere(fonts[i].styles, {fontFamily:fontFamily});
                        if (style) {
                            return fonts[i];
                        }
                    };
                    //return default font
                    return fonts[0];
                }

                function updateToolbar(range) {
                    
                    if (scope.type === 'custom') return;
                    if (isEditorEmpty()) {
                        return;
                    } 
                    if (!range) {
                        range = { index:0, length: editor.getLength()};
                    }

                    var format = editor.getFormat(range.index, range.length);
                    if (!format) return;

                    var fontFamily=null;
                    if (format.font && !angular.isArray(format.font))
                        fontFamily = format.font.replace(/\'/g,'');

                    scope.model.selectedFont = findFont(fontFamily);
                    scope.model.selectedFontStyle = fontFamily || scope.model.selectedFont.styles[0].fontFamily;

                    var fontSize = (format.size || DEFAULT_SIZE+'px');
                    if (angular.isArray(fontSize))
                        fontSize = fontSize[0];
                    fontSize = parseInt(fontSize.replace('px',''));
                    var sizeItem = _.findWhere(scope.model.selectedFont.sizes, {fontSize:fontSize});
                    if (!sizeItem)
                        fontSize = scope.model.selectedFont.sizes[0].fontSize;
                    scope.model.selectedFontSize = fontSize;
                    scope.model.align = format.align || 'left';

                    var currentLineRange = getCurrentLineSelection();
                    if (currentLineRange) {
                        var text = editor.getText(currentLineRange.index, currentLineRange.length);
                        scope.model.caps = TextEditorService.getCase(text || '');
                    }

                    var textLines = editor.getText().split('\n');
                    scope.model.numTextLines = textLines.length;
                    
                }

//---------------------------------------------------------------------------------------------------
//---------------------------------------- helper functions -----------------------------------------
//---------------------------------------------------------------------------------------------------

                function updateAvailableFonts() {
                    var element = ngModelCtrl.$viewValue || {},
                        stampRect = coverLayout ? DebossingService.getStampRect(coverLayout) : null;

                    tmpTextBox.element = angular.copy(element);
                    tmpTextBox.element.styles = {};
                    var fonts = CoverBuilderFonts.fonts;

                    _.each(fonts, function(font) {
                        if (font.visibilityExpression) {
                            font.visible = ProductService.evalExpression(font.visibilityExpression, product);
                        } else
                            font.visible = true;

                        if (stampRect && element.text) {
                            var numAvailable = 0;

                            _.each(font.sizes, function(size) {
                                tmpTextBox.element.text = element.text;
                                tmpTextBox.element.fontFamily = font.styles[0].fontFamily;
                                tmpTextBox.element.fontSize = size.fontSize;
                                tmpTextBox.refresh();
                                size.disabled = !(tmpTextBox.width<=stampRect.width && tmpTextBox.height<=stampRect.height);

                                if (size.restrict) {
                                    var regexp = new RegExp('[' + size.restrict + ']');
                                    if (regexp.test(element.text))
                                        size.disabled = true;
                                }

                                if (!size.disabled)  {
                                    numAvailable++;
                                }
                            });

                            font.enabled = numAvailable>0;
                        }
                    });
                    scope.fonts = fonts;

                }

                function updateStampElement() {
                    var element = ngModelCtrl.$viewValue;

                    var newElement = !element;
                    element = element || {};

                    var oldType = element.type;

                    if (scope.type==='standard') {
                        var delta = editor.getContents();
                        if (delta) {
                            //console.log('updateStampElement', delta)
                            var stylesAndText = QuillToFabric.getStylesAndText(delta);
                            element.text = stylesAndText.text;
                            element.styles = stylesAndText.styles;
                            if (stylesAndText.styles[0] && stylesAndText.styles[0][0]) {
                                var s = stylesAndText.styles[0][0];
                                _.extend(element, _.pick(s, 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'fill'));
                            }
                        }
                        element.type = 'TextStampElement';
                        if (newElement) {
                            element.textAlign = 'center';
                        }

                    } else {
                        var imageFile = scope.selectedFile;

                        if (imageFile) {
                            var rect = GeomService.fitRectangleProportionally(imageFile, {width:72 * 2, height:72 * 2});

                            element.width = rect.width;
                            element.height = rect.height;
                            element.imageX = 0;
                            element.imageY = 0;
                            element.imageWidth = rect.width;
                            element.imageHeight = rect.height;
                        }
                        element.imageFile = imageFile;
                        element.type = 'ImageStampElement';
                    }

                    element.opacity = 1;
                    element.foil = scope.selectedFoil;
                    element.elementPosition = scope.selectedPosition;

                    if (element.type === 'TextStampElement') {
                        tmpTextBox.element = element;
                        tmpTextBox.refresh();
                        element.width = GeomService.roundNumber(tmpTextBox.width, 2);
                        element.height = GeomService.roundNumber(tmpTextBox.height, 2);
                        console.log('size='+element.width + 'x' + element.height);
                    }

                    if (oldType!==element.type) {
                        element = angular.copy(element);
                        element.id = null;
                    }

                    ngModelCtrl.$setViewValue(element);
                }

                function flattenPositionsOrFoils(prototypeProductOptionValues, prop) {
                    var items = optionVisibilityFilter(prototypeProductOptionValues, scope.$parent.model.product, attrs.optionCode);

                    return _.map(items, function(value) {
                        var item = angular.copy(value[prop]);
                        item.displayName = value.displayName;
                        return item;
                    });
                }

                function getCurrentLineSelection() {
                    //editor.focus();
                    return { index:0, length: editor.getLength()};
                    //var selection = editor.getSelection();
                    // if (!selection) return { index:0, length: editor.getLength()};

                    // if (selection) {
                    //     selection = { start: selection.index, end: selection.index + selection.length };
                    //     var lines = editor.getText().split('\n');
                    //     lines = _.filter(lines, function(line) { return line!==''; });

                    //     var lineStart = 0,
                    //         start = selection.start,
                    //         end = selection.end;

                    //     for (var i = 0; i < lines.length; i++) {
                    //         var line = lines[i];
                    //         var lineEnd = lineStart + line.length;
                    //         if (i===lines.length - 1) {
                    //             lineEnd++;
                    //         }

                    //         if (selection.start>=lineStart && selection.start<=lineEnd) {
                    //             start = lineStart;
                    //         }

                    //         if (selection.end>=lineStart && selection.end<=lineEnd) {
                    //             end = lineEnd;
                    //         }

                    //         lineStart = lineEnd + 1;
                    //     }

                    //     selection.index = start;
                    //     selection.length = end - start;
                    // }
                    // return selection;
                }

                function fixStamps() {
                    if (product && coverLayout) {
                        DebossingService.fixStamps(product, coverLayout);
                        oldViewValue = null;
                        ngModelCtrl.$render();
                    }
                }

                function applySelectionStyle(style) {
                    if (isEditorEmpty()) {
                        editor.setSelection(0);
                        _.each(style, function(value, key) {
                            editor.format(key,value);
                        });
                        return;
                    }

                    var selection = getCurrentLineSelection();
                    editor.formatText(selection.index, selection.length, style);
                    editor.focus();
                    updateStampElement();
                    fixStamps();
                    updateToolbar();
                    fireChangeEvent();
                }

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
                    return size.fontSize;
                }

//---------------------------------------------------------------------------------------------------
//----------------------------------- scope functions and watches -----------------------------------
//---------------------------------------------------------------------------------------------------
                scope.updateStampElement = updateStampElement;

                scope.focus = function() {
                    editor.focus();
                };

                scope.changeFoil = function() {

                    if (scope.type==='standard') {
                        if (editor.getLength()>0)
                            editor.formatText(0, editor.getLength(), { color: scope.selectedFoil.color });
                        else
                            editor.format('color', scope.selectedFoil.color);
                    }

                    updateStampElement();
                    fireChangeEvent();
                };

                scope.changePosition = function() {
                    fireChangeEvent();
                }

                scope.setStampType = function(type) {

                    var doStuff = function() {
                        scope.type = (type === 0) ? 'standard' : 'custom';
                        updateStampElement();
                        ngModelCtrl.$render();
                        fireChangeEvent();
                    };
                        
                    scope.selectedStampingTab = 1 - type;

                    var currentElement = ngModelCtrl.$viewValue;
                    if (currentElement) {
                        var msg = currentElement.type==='TextStampElement' ? 
                            'Uploading Art Work will replace your standard fonts, and additional charges will apply. Would you like to continue?' :
                            'Creating Standard Fonts will replace your custom die, continue anyway?';

                        MessageService.confirm(msg, doStuff, ngModelCtrl.$render);
                        return;
                    } else {
                        doStuff();
                    }
                };

                scope.changeFontSize = function() {
                    applySelectionStyle({ size: scope.model.selectedFontSize + 'px' });
                };

                scope.changeFont = function() {
                    scope.model.selectedFontStyle = scope.model.selectedFont.styles[0].fontFamily;
                    scope.model.selectedFontSize = getPreferredFontSize(scope.model.selectedFont, scope.model.selectedFontSize);
                    applySelectionStyle({ font: scope.model.selectedFontStyle, size:scope.model.selectedFontSize+'px' });
                };

                scope.changeFontStyle = function() {
                    applySelectionStyle({ font: scope.model.selectedFontStyle });
                };

                scope.clearImage = function() {
                    scope.selectedFile = null;
                    scope.imageUrl = null;
                    ngModelCtrl.$setViewValue(null);
                };

                scope.select = function(file) {
                    scope.selectedFile = file;
                    scope.imageUrl = file.url ?
                        StoreConfig.imageUrlPrefix + 'thumbnail/' + file.url : file.thumbnailAsBase64;
                    updateStampElement();
                    fireChangeEvent();
                    ngModelCtrl.$render();
                };

                scope.remove = function(e, file) {
                    e.stopImmediatePropagation();

                    var msg = customLogo ? 
                        'Do you really want to delete your company logo?' : 
                        'Do you really want to delete this file?';

                    MessageService.confirm(msg, function() {

                        var idx = scope.files.indexOf(file);
                        if (idx===-1) {
                            file = _.findWhere(scope.files, {id:file.id});
                            idx = scope.files.indexOf(file);
                        }

                        if (idx>=0) {
                            scope.files.splice(idx, 1);
                            if (scope.selectedFile && (scope.selectedFile.id===file.id || scope.selectedFile==file)) {
                                scope.selectedFile = null;
                                scope.imageUrl = null;
                                ngModelCtrl.$setViewValue(null);
                            }
                            if (file.id) {
                                var product = scope.$parent.model.product;
                                $timeout(function() {

                                    product.$save(function() {
                                        ImageFile.delete({id:file.id}, 
                                            function() { },
                                            function(err) {
                                                if (err.data && err.data.type==='org.springframework.dao.DataIntegrityViolationException') {
                                                    
                                                    MessageService.error('You cannot delete this file because it is associated with another project.');
                                                    if (idx>=0)
                                                        scope.files[idx] = file;
                                                }
                                            });
                                    });
                                        
                                });
                                
                            }

                        }

                    });
                };

                scope.handleUpload = function(files) {

                    var pngFiles = _.where(files, {type:'image/png'});
                    if (pngFiles.length===0)
                        return;

                    var imageFiles = ImageUploadService.uploadImages([ pngFiles[0] ]);
                    var imageFile = imageFiles[0];

                    if (customLogo)
                        imageFile.type = 'LogoFile';
                    else
                        imageFile.type = 'DieFile';

                    scope.selectedFile = imageFile;
                    scope.selectedFile.uploadStarted = true;

                    imageFile.promise.then(function(value) {
                        console.log('die uploaded', imageFile);
                        scope.selectedFile.uploadStarted = false;
                        updateStampElement();
                        fireChangeEvent();
                    }, function(err) {
                        scope.selectedFile.uploadStarted = false;
                        MessageService.show(err.error, 'alert');

                        var idx = scope.files.indexOf(imageFile);
                        if (idx>=0)
                            scope.files.splice(idx,1);
                        scope.selectedFile = null;
                        scope.imageUrl = null;
                        updateStampElement();
                    }, function(event) {
                        // console.log('event ', event.imageFile.filename, event);
                        if (event.type===UploadEvent.ThumbnailReady) {
                           scope.imageUrl = event.imageFile.thumbnailAsBase64;
                        }
                        scope.$apply();
                    });

                    scope.files.push(imageFile);
                };

                scope.setCaps = function(caps) {
                    var range = getCurrentLineSelection(),
                        toolbar = editor.getModule('toolbar'),
                        selection = editor.getSelection();

                    var text = editor.getText().substring(range.index, range.index + range.length);
                    var format = editor.getFormat(range);

                    var newFormat = {};
                    _.each(format, function(value, key) {
                        if (angular.isArray(value)) {
                            newFormat[key] = value[0];
                        } else {
                            newFormat[key] = value;
                        }
                    });
                    if (scope.selectedFoil) {
                        newFormat.color = scope.selectedFoil.color;
                    }

                    //console.log('setCaps', range, newFormat);

                    text = TextEditorService.capitalize(text, caps);
                    editor.deleteText(range.index, range.length);
                    editor.insertText(range.index, text, newFormat);
                    if (selection) editor.setSelection(selection);

                    updateStampElement();
                    fixStamps();
                    updateToolbar();

                    fireChangeEvent();
                };

                scope.setAlign = function(align) {
                    var len = editor.getLength();
                    var alignVal = align==='left' ? false : align;

                    if (len>0)
                        editor.formatLine(0, len, 'align', alignVal);
                    else
                        editor.format('align', alignVal);

                    var element = ngModelCtrl.$viewValue || {};
                    element.textAlign = align;
                    ngModelCtrl.$setViewValue(element);

                    updateStampElement();
                    updateToolbar();
                    fireChangeEvent();
                };

                scope.$parent.$watch('model.productOptions.' + attrs.positionOption, function(value) {
                    if (value) {
                        scope.positions = flattenPositionsOrFoils(
                            value.prototypeProductOptionValues, 'elementPosition');
                        if (!scope.selectedPosition) {
                            scope.selectedPosition = scope.positions.length===1 ? scope.positions[0] : null;
                        }
                        initEditor();
                    }
                });

                scope.$parent.$watch('model.productOptions.' + attrs.foilOption, function(value) {
                    if (value) {
                        scope.foils = flattenPositionsOrFoils(
                            value.prototypeProductOptionValues, 'foil');
                        if (!scope.selectedFoil) {
                            scope.selectedFoil = scope.foils.length===1 ? scope.foils[0] : null;
                        }
                        initEditor();
                    }
                });

                var coverWatches = [],
                    coverLayout,
                    product;

                function getCoverLayout() {
                    Layout.getCoverLayout(product, function(layout) {
                        if (layout && layout.layoutSize) {
                            coverLayout = layout;
                            updateAvailableFonts();
                        } else {
                            coverLayout = null;
                        }
                    });
                }

                function watchForCoverChanges(option) {
                    var watch = scope.$watch('model.product.options.' + option.effectiveCode, function(value, oldValue) {
                        if (oldValue!=value) {
                            getCoverLayout();
                        }
                    });
                    coverWatches.push(watch);
                };

                scope.$parent.$watch('model.product', function(value) {
                    product = value;
                    //release watches
                    if (product) {
                        _.each(coverWatches, function(w) { w(); });
                        coverWatches = [];

                        BuildService.getLayoutSizeOption(product).then(watchForCoverChanges);
                        BuildService.getCoverTypeOption(product).then(watchForCoverChanges);

                        getCoverLayout();
                    }
                });

            }
        };
    }
]);
