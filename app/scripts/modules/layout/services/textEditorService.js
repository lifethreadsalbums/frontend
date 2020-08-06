angular.module('pace.layout')
    .service('TextEditorService', [
        'UndoService', 'DesignerFonts',
        function (UndoService, DesignerFonts) {
            'use strict';
        
            var textOptDefault = {
                    orientation: 'normal',
                    align: 'left',
                    'case': 'capitalize',
                    bold: false,
                    italic: false,
                    leading: { value: 14 },
                    kerning: { value: 14 },
                    tracking: { value: 14 },
                    fontFamily: 'HelveticaRegular',
                    color: '#000000',
                    fontSize: 40
                },
                orientation = {
                    '0': 'normal',
                    '90': 'top-bottom',
                    '270': 'bottom-top',
                    'normal': 0,
                    'top-bottom': 90,
                    'bottom-top': 270
                },
                textCase = [ 'uppercase', 'lowercase', 'capitalize' ],
                capitalize = function(text, caps) {
                    switch(caps)
                    {
                        case "uppercase":
                            text = text.toUpperCase();
                            break;
                        case "lowercase":
                            text = text.toLowerCase();
                            break;
                        case "capitalize":
                            var words = text.split(/[\s\n]+/);
                            for(var i=0;i<words.length;i++) {
                                var word = words[i],
                                    newWord = word.charAt(0).toUpperCase() + 
                                        (word.length>1 ? word.toLowerCase().substr(1) : '');
                                text = text.replace(word, newWord);
                            }
                            text = text.replace(/ And /g, ' and ');
                            break;
                    }
                    return text;
                },
                
                getText = function (text, format) {
                    return capitalize(text, format);
                },
                
                getProp = function (element, prop, txtOpt) {
                    var value = txtOpt[prop];

                    switch (prop) {
                        case 'align': return { textAlign: value };
                        case 'bold': return { fontWeight: value ? 'bold' : 'normal' };
                        case 'italic': return { fontStyle: value ? 'italic' : 'normal' };
                        case 'fontFamily': return { fontFamily: value };
                        case 'fontSize': return { fontSize: value };
                        case 'fill': return { fill: value };
                        case 'orientation': return { rotation: orientation[value] };
                        case 'case': return { text: getText(element.text, txtOpt[prop]) };
                    }
                },
                
                // some properties should be applied through the 'styles' instead of
                // the properties of the element (e.g. color of the fill)
                applyToStyles = ['fill'];

            var tempTextBox = new PACE.SpineTextElement({text:'', placeholder:''});
            tempTextBox.canvas = {scale:1.0, offset:{x:0,y:0}};
            
                
            // properties that can be applied to the selection (not to the whole element only)
            this.getInlineProps = function () {
                return ['bold', 'italic', 'fontFamily', 'fill', 'fontSize'];  
            };
            
            this.getDefaultOptions = function () {
                return angular.copy(textOptDefault);  
            };
            
            this.getOptValues = function () {
                return angular.copy(textOptValues);  
            };
            
            this.applyProp = function (elements, prop, txtOpt) {
                var commands = [];

                var saveStateCmd = new PACE.SaveElementsStateCommand(elements);
                saveStateCmd.execute();
                
                _.each(elements, function (el) {
                    if (el.type === 'TextStampElement' || el.type === 'TextElement' || el.type === 'SpineTextElement') {
                        var props = getProp(el, prop, txtOpt);
                        
                        if (prop==='orientation') {
                            //rotate around center
                            var el2 = angular.copy(el);
                            new PACE.RotateElementCommand(el2, props.rotation).execute();
                            props.x = el2.x;
                            props.y = el2.y;
                        }

                        new PACE.RemoveFabricTextStyleCommand(el.styles, _.keys(props)).execute();
                        
                        if (_.contains(applyToStyles, prop))
                            new PACE.AddFabricStyleToAllCommand(el, props).execute();
                        else 
                            new PACE.ChangeTextCommand(el, props).execute();

                        if (el.type==='SpineTextElement') {
                            var tb = new PACE.SpineTextElement(el);
                            tb.canvas = {scale:1.0, offset:{x:0,y:0}};
                            tb.setCoordsFromModel(el);
                            tb.refresh();
                            tb._initDimensions();
                            tb._autoSize();
                            el.styles = angular.copy(tb.styles);
                            el.fontSize = tb.fontSize;
                        }
                    }
                });
                
                UndoService.pushUndo(saveStateCmd);
            };

            this.autoSize = function(el, width, height) {
                if (!el.text || el.text==='') return;
                
                tempTextBox._pad = 0;
                tempTextBox.element = angular.copy(el);
                tempTextBox.setCoordsFromModel(el);

                tempTextBox.refresh();
                if (width && height) {
                    tempTextBox.width = width;
                    tempTextBox.height = height;
                }
                tempTextBox._initDimensions();
                tempTextBox._autoSize();
                el.styles = angular.copy(tempTextBox.styles);
                el.fontSize = tempTextBox.fontSize;

                //console.log('fontSize', el.fontSize, el.styles)
            };
            
            this.addProps = function (currentStyles, prop, txtOpt) {
                return _.extend(currentStyles, getProp(null, prop, txtOpt));
            };

            this.forEachCharStyle = function(styles, callback) {
                _.each(styles, function(lineStyle) {
                    _.each(lineStyle, callback);
                });
            };
            
            this.applyForSelection = function(layoutController, textOpt, prop) {
                var editor = layoutController.currentEditor,
                    inlineTextProps = this.getInlineProps();

                if (editor && editor instanceof PACE.TextEditor && _.contains(inlineTextProps, prop)) {

                    var currentStyles = editor.getSelectionStyles();
                    currentStyles = this.getMergedFontStyle(currentStyles);
                    currentStyles = _.extend(currentStyles, textOpt);

                    editor.setSelectionStyles( currentStyles, true );
                } else {
                    this.applyProp(
                        layoutController.selectedElements,
                        prop,
                        textOpt);
                    
                    if (layoutController.currentRenderer)
                        layoutController.currentRenderer.render();
                    layoutController.fireEvent('layout:selection-modified');
                }
            };

            this.getUpdatedTextOptions = function (styles, txtOpt) {
                txtOpt = _.extend(textOptDefault, txtOpt);
                
                _.each(_.keys(styles), function (prop) {
                    switch (prop) {
                    case 'textAlign':
                        txtOpt.align = styles[prop];
                        break;
                    case 'fontWeight':
                        txtOpt.bold = styles[prop] === 'bold';
                        break;
                    case 'fontStyle':
                        txtOpt.italic = styles[prop] === 'italic';
                        break;
                    case 'fontFamily':
                        txtOpt.fontFamily = styles[prop];
                        break;
                    case 'fontSize':
                        txtOpt.fontSize = styles[prop];
                        break;
                    case 'fill':
                        txtOpt.fill = { value: styles[prop] };
                        break;
                    case 'rotation':
                        txtOpt.orientation = orientation[styles[prop]];
                        break;
                    default: break;
                    }
                });
                
                return txtOpt;
            };

            this.findFont = function (fontFamily) {
                return _.find(DesignerFonts, function(font) {
                    var style = _.findWhere(font.styles, {fontFamily:fontFamily});
                    if (style) return true;
                });
            };

            this.findFontStyle = function (fontFamily) {
                for (var i = 0; i < DesignerFonts.length; i++) {
                    var font = DesignerFonts[i],
                        style = _.findWhere(font.styles, {fontFamily:fontFamily});
                    if (style) return style;
                }
            };

            this.getMergedFontStyle = function(el) {
                var styles = _.pick(el, 'textAlign', 'fontFamily', 'fontSize', 'fill', 'fontStyle', 'fontWeight');
                styles.orientation = orientation[el.rotation];
                styles.case = this.getCase(el.text);

                var fontSizes = {},
                    fontFamilies = {},
                    fills = {},
                    collectedStyles = {},
                    props = ['fontFamily', 'fontSize', 'fill'],
                    newLine = /\r?\n/;

                _.each(props, function(prop) {
                    collectedStyles[prop] = {};
                });

                var collect = function(style) {
                    _.each(props, function(prop) {
                        var val = style[prop];
                        if (val) collectedStyles[prop][val] = val;
                    });
                };
                
                if (el.text) {
                    var textLines = el.text.split(newLine);
                    _.each(textLines, function(textLine, lineIndex) {
                        _.each(textLine, function(ch, charIndex) {
                            var charStyle = _.pick(el, 'textAlign', 'fontFamily', 'fontSize', 'fill', 'fontStyle', 'fontWeight');
                            if (el.styles[lineIndex] && el.styles[lineIndex][charIndex]) {
                                charStyle = _.extend(charStyle, el.styles[lineIndex][charIndex]);
                            }
                            collect(charStyle);
                        });
                    });
                } else if (_.isArray(el.styles)) {
                    _.each(el.styles, collect);
                } else {
                    collect(el);
                }
                _.each(props, function(prop) {
                    var keys = _.keys(collectedStyles[prop]);
                    styles[prop] = keys.length===0 ? el[prop] : (keys.length===1 ? collectedStyles[prop][keys[0]] : null);
                });
                
                return styles;
            };

            this.getCase = function(text) {
                if (!text) return 'lowercase';
                var result = _.find(textCase, function(tc) { return text===capitalize(text,tc); } );
                return result || 'capitalize';
            };

            this.capitalize = capitalize;
        }
    ]);