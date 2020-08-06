'use strict';

angular.module('pace.layout')
    .controller('StylesCtrl', ['$scope', 'UndoService', 'TextEditorService', 'DesignerFonts', '$timeout',
        function ($scope, UndoService, TextEditorService, DesignerFonts, $timeout) {

            var layoutController = $scope.layoutController,
                MAX_FONT_SIZE = 300;

            $scope.styleOptions = [
                {value: 'general', label: 'General Styles'},
                {value: 'templates', label: 'Album Templates'}
            ];
            $scope.selectedStyleOption = 'general';

            var style = {
                    backgroundColor: null,
                    strokeColor: null,
                    strokeWidth: 0
                },
                fontStyle = {
                    fontStyle: 'normal',
                    fontWeight: 'normal'
                };

            $scope.style = style;
            $scope.fontStyle = fontStyle;
            $scope.hasSelection = false;
            $scope.maxFontSize = MAX_FONT_SIZE;
            $scope.recentlyUsedFonts = [];
            
            // Add Logo Directive Dummy Data
            var logos = [
                // {
                //     filename: 'logo1.png',
                //     url: 'https://placehold.it/50.png/&text=logo%201',
                //     printLogo: true,
                //     default: true,
                //     leaveLastBlankPage: true,
                //     firstPage: true,
                //     lastPage: false
                // },{
                //     filename: 'logo2.png',
                //     url: 'https://placehold.it/100x50.png/&text=logo%202',
                //     printLogo: true,
                //     default: false,
                //     leaveLastBlankPage: true,
                //     firstPage: true,
                //     lastPage: false
                // }
            ];

            $scope.logos = logos;

            // Logo Settings Dummy Data
            var logo = {
                filename: 'logo1.png',
                //url: 'https://placehold.it/50.png/&text=logo%201',
                printLogo: true,
                default: false,
                leaveLastBlankPage: true,
                firstPage: true,
                lastPage: false
            };

            $scope.logo = logo;

            function findFont(fontFamily) {
                return _.find(DesignerFonts, function(font) {
                    var style = _.findWhere(font.styles, {fontFamily:fontFamily});
                    if (style) return true;
                });
            }

            function pushRecentlyUsedFont(fontFamily) {
                var val = findFont(fontFamily);
                var recentArr = $scope.recentlyUsedFonts;
                if (recentArr.indexOf(val)===-1) {
                    recentArr.unshift(val);
                    var max = 5;
                    if (recentArr.length>max) {
                        recentArr.pop();
                    }
                }
            }

            function collectRecentlyUsedFonts(el) {
                if (el.fontFamily) pushRecentlyUsedFont(el.fontFamily);

                if (el.styles) {
                    var newLine = /\r?\n/;
                    var textLines = (el.text || '').split(newLine);

                    _.each(el.styles, function(lineStyle, lineIndex) {
                        lineIndex = parseInt(lineIndex);
                        _.each(lineStyle, function(charStyle, charIndex) {
                            charIndex = parseInt(charIndex);
                            if (textLines[lineIndex] && textLines[lineIndex][charIndex] && charStyle.fontFamily) {
                                pushRecentlyUsedFont(charStyle.fontFamily);
                            }
                        });
                    });
                }
                //console.log('collectRecentlyUsedFonts', $scope.recentlyUsedFonts);
            }

            function refreshRecentlyUsedFonts() {
                $scope.recentlyUsedFonts = [];
                var spread = layoutController.getCurrentSpread();
                if (!spread) return;

                _.each(spread.elements, function(el) {
                    if (el.type==='TextElement' || el.type==='SpineTextElement') {
                        collectRecentlyUsedFonts(el);
                    }
                });
            }

            function selectionChanged() {
                if (layoutController.selectedElements.length===1) {
                    var el = layoutController.selectedElements[0];
                    $scope.style = {
                        backgroundColor: el.backgroundColor,
                        strokeColor: el.strokeColor,
                        strokeWidth: el.strokeWidth || 0
                    };
                    if ((!el.strokeColor || el.strokeColor==='#0') && !el.strokeWidth)
                        $scope.style.strokeColor = null;
                    
                    if (el.type==='TextElement' || el.type==='SpineTextElement') {
                        var prevFontSize = $scope.fontStyle.fontSize;

                        var editor = layoutController.currentEditor;
                        if (editor instanceof PACE.TextEditor) {
                            var styles = editor.getSelectionStyles();
                            $scope.fontStyle = TextEditorService.getMergedFontStyle(styles);
                        } else {
                            $scope.fontStyle = TextEditorService.getMergedFontStyle(el);
                        }
                        collectRecentlyUsedFonts(el);
                        
                        //$scope.maxFontSize = Math.min(MAX_FONT_SIZE, Math.floor(el.height * 0.70));
                        //console.log('maxFontSize', $scope.maxFontSize);
                    }

                } else {
                    $scope.style = style;
                    $scope.fontStyle = fontStyle;
                    //$scope.maxFontSize = MAX_FONT_SIZE;
                }
                $scope.numSelectedElements = layoutController.selectedElements.length;
            }

            $scope.$on('layout:selection-changed', selectionChanged);
            $scope.$on('layout:selection-cleared', selectionChanged);
            $scope.$on('layout:selection-modified', selectionChanged);
            $scope.$on('layout:current-renderer-changed', function() {
                if (!layoutController.currentRenderer.spreadInfo) return;

                var layout = layoutController.currentRenderer.layout;
                $scope.showSpineOption = layout.layoutSize && 
                    layout.layoutSize.coverType && layout.layoutSize.dynamicSpineWidth;

                var pages = layoutController.currentRenderer.spreadInfo.pages;

                $scope.showLeftPageOption = pages.length===2 || pages[0].isLeft();
                $scope.showRightPageOption = pages.length===2 || pages[0].isRight();

                refreshRecentlyUsedFonts();
            });

            $scope.$on('layout:text-selection-changed', function (arg, styles) {
                //$scope.fontStyle = TextEditorService.getUpdatedTextOptions(styles, $scope.fontStyle);
                $scope.fontStyle = TextEditorService.getMergedFontStyle(styles);
            });

            function getPage() {
                var leftPage = $scope.layout.viewState.stylesApplyToOption==='leftPage',
                    page = _.find(layoutController.currentRenderer.spreadInfo.pages, 
                        function(page) { 
                            return leftPage ? page.isLeft() : page.isRight();
                        }
                    );
                return page;
            }

            $scope.onStyleChange = function() {
                var renderer = layoutController.currentRenderer,
                    mode = $scope.layout.viewState.stylesMode,
                    applyToOption = $scope.layout.viewState.stylesApplyToOption,
                    applyToRange = $scope.layout.viewState.stylesApplyToRange;

                if (mode==='backgroundColor' && applyToOption!=='selectedObject') {

                    if (applyToOption==='leftPage' || applyToOption==='rightPage') {
                        var cmd = new PACE.ChangePageBackgroundColor(getPage(), $scope.style.backgroundColor);
                        layoutController.execCommand(cmd);
                    } else if (applyToOption==='spine') {

                        //apply background color to the spine
                        var cmd = new PACE.ChangeSpineBackgroundColor(renderer.spreadInfo, $scope.style.backgroundColor);
                        layoutController.execCommand(cmd);
                        
                    } else if (applyToOption==='book') {
                        
                        //apply background color to the entire book
                        var cmd = new PACE.ChangeBookBackgroundColor(renderer.layout, $scope.style.backgroundColor);
                        cmd.execute();
                        UndoService.pushUndo(cmd);
                        layoutController.renderAllDelayed();

                    } else if (applyToOption==='selectedSpread') {
                        
                        //apply background color to the selected spread
                        var cmd = new PACE.ChangeSpreadBackgroundColor(renderer.spreadInfo, $scope.style.backgroundColor);
                        layoutController.execCommand(cmd);

                    } else if (applyToOption==='range') {
                        var pageNumbers = PACE.utils.parsePageNumbers(applyToRange);
                        //console.log('applyToRange', pageNumbers);
                        var isSpreadBased = $scope.layout.pageType==='SpreadBased';

                        var commands = _.reduce(renderer.layout.spreads, function(cmds, spread) {

                            var pages = PACE.Spread.create(spread, renderer.layout).pages;
                            _.each(pages, function(page) {
                                var pageNumber = page.getPageNumber();
                                if (isSpreadBased)
                                    pageNumber = (spread.pageNumber + 1) / 2;

                                if (pageNumbers.indexOf(pageNumber)>=0) {
                                    cmds.push(new PACE.ChangePageBackgroundColor(page, $scope.style.backgroundColor));
                                }
                            });

                            return cmds;
                        }, []);

                        var cmd = new PACE.MacroCommand(commands);
                        cmd.execute();
                        UndoService.pushUndo(cmd);
                        layoutController.renderAllDelayed();
                    } 

                } else {
                    var elements,
                        rendererAll = false;
                    if (applyToOption==='leftPage' || applyToOption==='rightPage') {
                        var page = getPage();
                        elements = page.getElements();
                    } else if (applyToOption==='allPhotos') {
                        elements = renderer.spread.elements.concat();
                        elements = _.reduce(renderer.container.spreads, function(elms, s) {
                            if (s.elements.length>0 && s.elements[0].type==='ImageElement') {
                                elms.push(s.elements[0]);
                            }
                            return elms;
                        }, elements);
                    } else if (applyToOption==='selectedSpread') {
                        elements = renderer.spread.elements;
                    } else if (applyToOption==='book') {
                        elements = _.flatten( _.pluck(renderer.layout.spreads, 'elements') );
                        rendererAll = true;
                    } else if (applyToOption==='range') {
                        
                        var pageNumbers = PACE.utils.parsePageNumbers(applyToRange);
                        var isSpreadBased = $scope.layout.pageType==='SpreadBased';
                        elements = _.reduce(renderer.layout.spreads, function(elms, spread) {

                            var pages = PACE.Spread.create(spread, renderer.layout).pages;
                            _.each(pages, function(page) {
                                var pageNumber = page.getPageNumber();
                                if (isSpreadBased)
                                    pageNumber = (spread.pageNumber + 1) / 2;

                                if (pageNumbers.indexOf(pageNumber)>=0) {
                                    elms = elms.concat(page.getImageElements());
                                }
                            });

                            return elms;
                        }, []);
                        rendererAll = true;

                    } else {
                        elements = layoutController.selectedElements;
                    }
                    elements = _.filter(elements, function(el) { return el.type!=='BackgroundFrameElement'; } );

                    //apply styles to the elements
                    var style = angular.copy($scope.style);
                    if (mode!=='backgroundColor') {
                        style = _.omit(style, 'backgroundColor');
                    }

                    var cmd = new PACE.MacroCommand(
                        _.map(elements, function(el) { 
                            return new PACE.TransformElementCommand(el, style);
                        })
                    );
                    cmd.execute();
                    UndoService.pushUndo(cmd);
                    if (rendererAll) {
                        layoutController.renderAllDelayed();
                    } else {
                        renderer.render();
                    }
                }
                layoutController.fireEvent('layout:selection-modified');
                layoutController.fireEvent('layout:layout-changed');
            };

            $scope.onFontStyleChange = function(prop) {
                if (layoutController.selectedElements.length===0) {
                    $scope.model.defaultFontStyle = angular.copy($scope.fontStyle);
                    return;
                } 

                TextEditorService.applyForSelection($scope.layoutController, $scope.fontStyle, prop);
                selectionChanged;
            };

            $timeout(selectionChanged);
        }
    ]);