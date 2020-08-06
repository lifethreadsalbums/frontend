'use strict';

angular.module('pace.layout')
.controller('SpreadTopToolbarCtrl', [
    '$scope', 'UndoService', 'SnappingService', 'StoreConfig', 'GeomService', 'SpreadToTemplateService', 'LayoutTemplate', 'QueueRequestService',
    'TextEditorService', 'LayoutTemplateService', 'IconSet', 'LayoutEvent', 'AppConstants', '$debounce',
    function ($scope, UndoService, SnappingService, StoreConfig, GeomService, SpreadToTemplateService, LayoutTemplate, QueueRequestService,
        TextEditorService, LayoutTemplateService, IconSet, LayoutEvent, AppConstants, $debounce) {

        var layoutController = $scope.layoutController,
            maxSpacing = 2,
            fixedSpacingGroups,
            fixedSpacingStateCmd,
            fixedSpacingChanged,
            fixedSpacingSticky = false,
            lastGapOption,
            prevGapOption = 'spread';

        var gapToolOptions = [
            {value: 'selected', icon: 'gap-tool-selected', iconText: 'Apply to Selected' },
            {value: 'leftPage', icon: 'gap-tool-left-page', iconText: 'Apply to Left Page' },
            {value: 'rightPage', icon: 'gap-tool-right-page', iconText: 'Apply to Right Page' },
            {value: 'spread', icon: 'gap-tool-spread', iconText: 'Apply to Spread' },
            {value: 'book', icon: 'gap-tool-book', iconText: 'Apply to Book' }
        ];

        $scope.gapToolOptions = gapToolOptions;
        $scope.selectedGapOption = 'spread';

//---------------------------------------------------------------------------------
//                                TOOLBAR ACTIONS
//---------------------------------------------------------------------------------

        $scope.frameModeChanged = function(index) {
            var props = index===0 ? [3/2, 2/3, 1/1] : [3/2, 2/3];
            LayoutTemplateService.setCurrProps(props);
        };

        $scope.lockSpread = function(spread) {
            spread.locked = !spread.locked;
            var renderer = _.findWhere(layoutController.renderers, {spread:spread});
            if (renderer) renderer.render();
        };

        $scope.autoLayoutDisabled = function (spread, mode) {
            if (!spread) return;

            var pages = new PACE.SpreadInfoFactory().create(spread, $scope.layout).pages,
                count = _.map(pages, function (p) { return p.getImageElements().length; });

            switch (mode) {
            case 'left':
                return (spread.numPages === 1 && spread.pageNumber === 1) ||
                        (count[0] === 0) || (!$scope.layout.layoutSize.allowSinglePageLayouts);
            case 'right':
                return (spread.numPages === 1 && (spread.pageNumber > 1 || count[0] === 0)) ||
                        count[1] === 0 || (!$scope.layout.layoutSize.allowSinglePageLayouts);
            case 'spread':
                return spread.numPages === 1 || spread.elements.length === 0;
            }
        };

        $scope.nextTemplate = function() {
            var currentSpread = layoutController.getCurrentSpread();
            new PACE.NextHistoryTemplateCommand(layoutController,
                $scope.$parent.recentlyUsedControl,
                currentSpread.lastTemplateMode, true).execute();
        };

        $scope.prevTemplate = function() {
            new PACE.PrevHistoryTemplateCommand(layoutController,
                $scope.$parent.recentlyUsedControl).execute();
        };


//---------------------------------------------------------------------------------
//                             FIXED SPACING TOOL
//---------------------------------------------------------------------------------

        function getFixedSpacingForElements(elements) {
            if (elements.length<2)
                return null;

            var gap = new PACE.Elements(elements).getGapSpacing();
            var result = PACE.GeomService.roundNumber(gap / 72, 5);

            //console.log('getFixedSpacing', result)
            return Math.min(result, maxSpacing);
        }

        function getFixedSpacing() {
            var spread = layoutController.getCurrentSpread(),
                elements = [],
                selectedGapOption;

            if (!spread) return;

            $scope.gapToolOptions[0].disabled = false;
            $scope.gapToolOptions[1].disabled = false;
            $scope.gapToolOptions[2].disabled = false;
            $scope.gapToolOptions[3].disabled = false;

            if (layoutController.selectedElements.length>1) {
                elements = layoutController.selectedElements;
                //selectedGapOption = 'selected';
            } else {
                $scope.gapToolOptions[0].disabled = true;
                var spreadInfo = layoutController.getCurrentRenderer().spreadInfo;
                if (spreadInfo.pages.length===1) {
                    elements = spread.elements;
                    if (spreadInfo.pages[0].isLeft()) {
                        //selectedGapOption = 'leftPage';
                        $scope.gapToolOptions[2].disabled = true;
                    } else {
                        //selectedGapOption = 'rightPage';
                        $scope.gapToolOptions[1].disabled = true;
                    }
                    $scope.gapToolOptions[3].disabled = true;
                } else {
                    var gap1 = getFixedSpacingForElements(spreadInfo.pages[0].getElements()) || Number.MAX_VALUE,
                        gap2 = getFixedSpacingForElements(spreadInfo.pages[1].getElements()) || Number.MAX_VALUE,
                        gap = Math.min(gap1, gap2);

                    if (gap1!==Number.MAX_VALUE && gap2===Number.MAX_VALUE) {
                        //selectedGapOption = 'leftPage';
                        $scope.gapToolOptions[2].disabled = true;
                    } else if (gap1===Number.MAX_VALUE && gap2!==Number.MAX_VALUE) {
                        //selectedGapOption = 'rightPage';
                        $scope.gapToolOptions[1].disabled = true;
                    } else {
                        if (spreadInfo.isSpreadLayout()) {
                            $scope.gapToolOptions[1].disabled = true;
                            $scope.gapToolOptions[2].disabled = true;
                        }
                        //selectedGapOption = 'spread';
                    }
                    return gap!==Number.MAX_VALUE ? gap : null;
                }
            }

            return getFixedSpacingForElements(elements);
        }

        $scope.onSpacingToolOpen = function() {
            fixedSpacingGroups = null;
            fixedSpacingChanged = false;
            lastGapOption = null;

            $scope.updateFixedSpacing();

            if (layoutController.selectedElements.length>0) {
                if ($scope.selectedGapOption!=='selected') {
                    prevGapOption = $scope.selectedGapOption;
                    $scope.selectedGapOption='selected';
                }
            } else {
                $scope.selectedGapOption = prevGapOption;
            }

            var gapOption = _.findWhere($scope.gapToolOptions, {value:$scope.selectedGapOption});
            if (gapOption && gapOption.disabled) {
                if (gapOption.value!=='spread')
                    $scope.selectedGapOption = 'spread';
                else {
                    $scope.selectedGapOption = !$scope.gapToolOptions[1].disabled ? 'leftPage' : 'rightPage';
                }
            }

            if($scope.$$phase !== '$digest') { $scope.$digest() };
        };

        $scope.spacingEditEnd = function() {
            if (!fixedSpacingChanged || isNaN(layoutController.frameSpacing)) return;

            $scope.fixedSpacing(true);

            if ($scope.selectedGapOption==='book') {
                layoutController.renderAllDelayed();
                layoutController.fireEvent(LayoutEvent.LayoutChanged);
            }
        };

        $scope.spacingEditBegin = function() {
            var spread = layoutController.getCurrentSpread(),
                spreadInfo = layoutController.getCurrentRenderer().spreadInfo;
            
            fixedSpacingSticky = false;
            if ($scope.selectedGapOption==='selected') {
                fixedSpacingGroups = [{elements: layoutController.selectedElements}];
            } else if ($scope.selectedGapOption==='leftPage') {
                var page = spreadInfo.getLeftPage();
                fixedSpacingGroups = [{elements: page ? page.getElements() : []}];
            } else if ($scope.selectedGapOption==='rightPage') {
                var page = spreadInfo.getRightPage();
                fixedSpacingGroups = [{elements: page ? page.getElements() : []}];
            } else if ($scope.selectedGapOption==='spread') {
                fixedSpacingGroups = [{elements: spread.elements}];
            } else if ($scope.selectedGapOption==='book') {
                fixedSpacingGroups = [];
                for (var i = 0; i < spreadInfo.layout.spreads.length; i++) {
                    var s = PACE.Spread.create(spreadInfo.layout.spreads[i], spreadInfo.layout);
                    if (s.isSpreadLayout()) {
                        fixedSpacingGroups.push({elements: s.spread.elements});
                    } else {
                        fixedSpacingGroups.push({elements: s.pages[0].getElements()});
                        if (s.pages.length>1)
                            fixedSpacingGroups.push({elements: s.pages[1].getElements()});
                    }
                }
            }
            if (fixedSpacingGroups.length===1) {
                var bbox = new PACE.Elements(fixedSpacingGroups[0].elements).getBoundingBox(),
                    bleedRect = spreadInfo.getBleedRect(),
                    eq = PACE.GeomService.equals, 
                    tol = 0.0001;

                if ( (eq(bbox.left, bleedRect.left, tol) || eq(bbox.right, bleedRect.right)) ||
                     (eq(bbox.top, bleedRect.top, tol) || eq(bbox.bottom, bleedRect.bottom, tol)) ) {
                    fixedSpacingSticky = true;
                }
            }

        };

        $scope.fixedSpacing = function(undo, anim) {
            if (isNaN(layoutController.frameSpacing)) return;
            var spread = layoutController.getCurrentSpread(),
                spreadInfo = layoutController.getCurrentRenderer().spreadInfo;


            if (lastGapOption!==$scope.selectedGapOption) {
                var elements = [];
                if ($scope.selectedGapOption==='book') {
                    elements = _.flatten(_.pluck(spreadInfo.layout.spreads, 'elements'));
                } else {
                    elements = spread.elements;
                }

                fixedSpacingStateCmd = new PACE.SaveElementsStateCommand(elements);
                fixedSpacingStateCmd.execute();
            } else {
                fixedSpacingStateCmd.undo();
            }

            var commands = _.map(fixedSpacingGroups, function(group) {

                var gap = new PACE.Elements(group.elements).getGapSpacing(),
                    sticky = false,
                    newGap = layoutController.frameSpacing * 72;
                if (fixedSpacingSticky && gap>newGap) {
                    sticky = true;
                }

                return new PACE.FixedSpacingCenteredCommand(group.elements, newGap, sticky);
            });
            var cmd = new PACE.MacroCommand(commands);
            cmd.execute();

            if ($scope.selectedGapOption==='book') {
                _.invoke(layoutController.getVisibleRenderers(), 'render');
            } else {
                if (anim)
                    layoutController.currentRenderer.renderWithAnimation();
                else
                    layoutController.currentRenderer.render();
            }

            if (undo) {
                UndoService.pushUndo(cmd);
            }
            if ($scope.selectedGapOption!=='book') {
                layoutController.fireEvent(LayoutEvent.LayoutChanged);
            }
            fixedSpacingChanged = true;
            lastGapOption = $scope.selectedGapOption;
            if ($scope.selectedGapOption!=='selected')
                prevGapOption = $scope.selectedGapOption;
        };

        $scope.updateFixedSpacing = function() {
            var gap = getFixedSpacing();
            if (gap===null || gap===undefined) 
                gap = AppConstants.DEFAULT_FIXED_SPACING;

            layoutController.frameSpacing = gap;
            $scope.markedFrameSpacing = gap;
        };

        function updateUI() {
            var spread = layoutController.getCurrentSpread();
            $scope.gapToolEnabled = (spread && spread.elements.length>1);
        }

        $scope.$on('layout:layout-changed', updateUI);
        $scope.$on('layout:layout-loaded', updateUI);
        $scope.$on('layout:current-renderer-changed', updateUI);

        //$scope.$on('layout:selection-changed', $scope.updateFixedSpacing);
        //$scope.$on('layout:selection-cleared', $scope.updateFixedSpacing);

    }
]).controller('SpreadBottomToolbarCtrl', [
    '$scope', 'UndoService', 'SnappingService', 'StoreConfig', 'GeomService', 'SpreadToTemplateService', 'LayoutTemplate', 'QueueRequestService',
    'TextEditorService', 'LayoutTemplateService', 'IconSet', 'LayoutEvent', 'AppConstants', '$debounce',
    function ($scope, UndoService, SnappingService, StoreConfig, GeomService, SpreadToTemplateService, LayoutTemplate, QueueRequestService,
        TextEditorService, LayoutTemplateService, IconSet, LayoutEvent, AppConstants, $debounce) {

        var prevOpacity,
            ctrl = $scope.layoutController;

        $scope.opacity = 100;
        $scope.orientationOptions = IconSet['text-orientation'];

        function getCurrentElements() {
            var elements = ctrl.selectedElements.length>0 ?
                ctrl.selectedElements : ctrl.getCurrentSpread().elements;
            if (!elements) elements = [];
            return elements;
        }

//---------------------------------------------------------------------------------
//                                TOOLBAR ACTIONS
//---------------------------------------------------------------------------------

        $scope.flip = function(mode) {
            ctrl.execCommand(
                new PACE.FlipSelectionCommand(ctrl, mode),
                true
            );
        };

        $scope.toolsetChanged = function(index) {
            if (index===1) {
                $scope.layout.viewState.rightTabIndex = 1;
                $scope.layout.viewState.stylesViewIndex = 3;
                new PACE.ToggleToolCommand(ctrl, ctrl.scope, 'TextTool', 4).execute();
            } else if (ctrl.currentTool.type==='TextTool') {
                $scope.layout.viewState.rightTabIndex = 0;
            }
        };

        $scope.lockSpread = function(spread) {
            spread.locked = !spread.locked;
            var renderer = _.findWhere(ctrl.renderers, {spread:spread});
            if (renderer) renderer.render();
        };

        $scope.onNewFrameModeChanged = function() {
            if (ctrl.currentTool.type==='FrameTool') {
                var constraint = null;
                if ($scope.model.newFrameMode!=='new-frame') {
                    constraint = { width:3, height: ($scope.model.newFrameMode==='new-frame32' ? 2 : 3) };
                }
                ctrl.currentTool.setConstraint(constraint);
            }
        };

//---------------------------------------------------------------------------------
//                                 OPACITY TOOL
//---------------------------------------------------------------------------------
        $scope.opacityEditEnd = function() {
            var elements = getCurrentElements();
            if (elements.length===0) return;

            var cmd = new PACE.MacroCommand(
                _.map(elements, function(el, index) {
                    return new PACE.TransformElementCommand(el, {opacity: $scope.opacity / 100}, {opacity: prevOpacity[index]});
                })
            );
            cmd.execute();
            UndoService.pushUndo(cmd);
        };

        $scope.opacityEditBegin = function() {
            var elements = getCurrentElements();
            if (elements.length===0) return;
            prevOpacity = _.pluck(elements, 'opacity');
        };

        $scope.opacityChanging = function() {
            var elements = getCurrentElements();
            if (elements.length===0) return;

            _.each(elements, function(el) {
                el.opacity = $scope.opacity / 100;
            });
            ctrl.currentRenderer.render();
        };

//---------------------------------------------------------------------------------
//                                 TYPE TOOL
//---------------------------------------------------------------------------------
        $scope.textOpt = TextEditorService.getDefaultOptions();

        var inlineTextProps = TextEditorService.getInlineProps();

        $scope.onTextOptionsChanged = function (prop) {
            TextEditorService.applyForSelection(ctrl, $scope.textOpt, prop);
        };

        $scope.toggleTextOption = function(prop) {
            $scope.textOpt[prop] = !$scope.textOpt[prop];
            $scope.onTextOptionsChanged(prop);
        };

        $scope.$on('layout:text-selection-changed', function (arg, styles) {
            $scope.textOpt = TextEditorService.getUpdatedTextOptions(styles, $scope.textOpt);
        });

        function getTextFormat(target) {
            return {
                width: target.width,
                height: target.height,
                text: target.text,
                fontFamily: target.fontFamily,
                fontSize: target.fontSize,
                fontWeight: target.fontWeight,
                fontStyle: target.fontStyle,
                textAlign: target.textAlign,
                fill: target.fill,
                styles: angular.copy(target.styles),
            };
        }

        function getCurrentFontStyles(fixCharStyles) {
            var styles = [],
                el = ctrl.selectedElements[0];

            if (!el) return styles;

            var editor = ctrl.currentEditor;
            if (editor instanceof PACE.TextEditor) {
                var target = editor.getTarget();
                if (target.selectionStart===target.selectionEnd) {
                    var charStyle = _.pick(el, 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight');
                    charStyle = _.extend(charStyle, target.getSelectionStyles());
                    styles.push(charStyle);
                } else {
                    styles = target.getSelectionStyles(target.selectionStart, target.selectionEnd);
                }
            } else {
                var newLine = /\r?\n/;
                var textLines = el.text.split(newLine);
                if (fixCharStyles && !el.styles) el.styles = {};

                _.each(textLines, function(textLine, lineIndex) {
                    if (fixCharStyles && !el.styles[lineIndex]) el.styles[lineIndex] = {};
                    _.each(textLine, function(ch, charIndex) {
                        var charStyle = _.pick(el, 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight');
                        if (el.styles[lineIndex][charIndex]) {
                            charStyle = _.extend(charStyle, el.styles[lineIndex][charIndex]);
                        }
                        if (fixCharStyles)
                            el.styles[lineIndex][charIndex] = charStyle;
                        styles.push(charStyle);
                    });
                });
            }
            return styles;
        }

        function toggle(el, style, bold, italic) {
            var fontFamily = style.fontFamily || el.fontFamily;
            var font = TextEditorService.findFont(fontFamily);
            if (!font) return;
            var fs = _.findWhere(font.styles, {fontFamily:fontFamily});
            var fs2 = _.find(font.styles, function(fontStyle) {
                return fontStyle.group === fs.group &&
                    !!fontStyle.bold === bold &&
                    !!fontStyle.italic === italic;
            });

            if (fs2) {
                style.fontFamily = fs2.fontFamily;
            }
        }

        function getBoldItalic(styles) {
            var numBold = 0, numItalic = 0;

            _.each(styles, function(s) {
                if (s.fontFamily) {
                    var fontStyle = TextEditorService.findFontStyle(s.fontFamily);
                    if (fontStyle.bold) numBold++;
                    if (fontStyle.italic) numItalic++;
                }
            });
            return {
                bold: numBold===styles.length,
                italic: numItalic===styles.length
            };
        }

        function toggleFn(toggleBold, toggleItalic) {
            var el = ctrl.selectedElements[0];
            var styles = getCurrentFontStyles(true);
            var styleInfo = getBoldItalic(styles);

            if (toggleBold) styleInfo.bold = !styleInfo.bold;
            if (toggleItalic) styleInfo.italic = !styleInfo.italic;

            _.each(styles, function(style) {
                toggle(el, style, styleInfo.bold, styleInfo.italic);
            });

            ctrl.currentRenderer.canvas.renderAll();

            var target = el;
            if (ctrl.currentEditor instanceof PACE.TextEditor) {
                target = ctrl.currentEditor.getTarget();
                if (target.selectionStart===target.selectionEnd) {
                    ctrl.currentEditor.setSelectionStyles(styles[0], true);
                }
            } else {
                ctrl.currentRenderer.render();
            }
            var cmd = new PACE.ChangeTextCommand(el, {styles:angular.copy(target.styles)});
            cmd.execute();
            ctrl.undoService.pushUndo(cmd);

            ctrl.fireEvent('layout:selection-modified');
        }

        function canToggle(toggleBold, toggleItalic) {
            var el = ctrl.selectedElements[0];
            var styles = angular.copy(getCurrentFontStyles()),
                styles2 = angular.copy(styles);

            var styleInfo = getBoldItalic(styles);

            if (toggleBold) styleInfo.bold = !styleInfo.bold;
            if (toggleItalic) styleInfo.italic = !styleInfo.italic;

            _.each(styles, function(style) {
                toggle(el, style, styleInfo.bold, styleInfo.italic);
            });
            return !angular.equals(styles, styles2);
        }

        $scope.toggleBold = toggleFn.bind(null, true, false);

        $scope.toggleItalic = toggleFn.bind(null, false, true);

        function isSelectionCentered() {
            if (ctrl.selectedElements.length===0) return false;

            var spread = ctrl.currentRenderer.spread,
                layout = ctrl.currentRenderer.layout,
                bbox = new PACE.Elements(ctrl.selectedElements).getBoundingBox(),
                center = bbox.getCenter();

            bbox.rotation = 0;
            new PACE.CenterOnPageCommand(bbox, spread, layout).execute();
            var center2 = bbox.getCenter();

            return PACE.GeomService.equals(center.x, center2.x) &&
                   PACE.GeomService.equals(center.y, center2.y);
        }

        function onLayoutChanged() {

        }

        function selectionChanged(e) {
            // ignore the event if it's comming from a different layoutController
            // than the one associated with this scope
            if (e.targetScope!==$scope.$parent) return;
            
            if (ctrl.selectedElements.length===1) {
                var el = ctrl.selectedElements[0];
                $scope.opacity = el.opacity * 100;

                if (el.type==='TextElement' || el.type==='SpineTextElement') {
                    //switch to text tool set
                    $scope.model.selectedToolset = 'tools4';
                    $scope.layout.viewState.rightTabIndex = 1;
                    $scope.layout.viewState.stylesViewIndex = 3;

                    $scope.textOpt = TextEditorService.getUpdatedTextOptions(el, $scope.textOpt);
                    $scope.boldDisabled = !canToggle(true, false);
                    $scope.italicDisabled = !canToggle(false, true);

                } else if ((el.type==='ImageElement' && !el.imageFile && el.backgroundColor) ||
                    el.type==='BackgroundFrameElement') {
                    //$scope.layout.viewState.rightTabIndex = 1;
                    //$scope.layout.viewState.stylesViewIndex = 1;
                    $scope.boldDisabled = true;
                    $scope.italicDisabled = true;
                }
                $scope.orientationOptions[0].disabled = el.type==='SpineTextElement';
            } else {
                $scope.boldDisabled = true;
                $scope.italicDisabled = true;
                $scope.opacity = 100;
                $scope.textOpt = TextEditorService.getDefaultOptions();
            }

            $scope.isSelectionCentered = isSelectionCentered();
        }

        $scope.$on('layout:selection-double-click', function() {
            if (ctrl.selectedElements.length===1) {
                var el = ctrl.selectedElements[0];
                $scope.opacity = el.opacity * 100;

                if (el.type==='TextElement' || el.type==='SpineTextElement') {
                    $scope.layout.viewState.rightTabIndex = 1;
                    $scope.layout.viewState.stylesViewIndex = 3;

                } else if ((el.type==='ImageElement' && !el.imageFile && el.backgroundColor) ||
                    el.type==='BackgroundFrameElement') {
                    $scope.layout.viewState.rightTabIndex = 1;
                    $scope.layout.viewState.stylesViewIndex = 1;
                }
            }
        });

        //$scope.$on('layout:layout-changed', selectionChanged);
        $scope.$on('layout:selection-changed', selectionChanged);
        $scope.$on('layout:selection-modified', selectionChanged);
        $scope.$on('layout:selection-cleared', selectionChanged);

        $scope.$on('layout:text-selection-changed', function (arg, styles) {
            $scope.boldDisabled = !canToggle(true, false);
            $scope.italicDisabled = !canToggle(false, true);
        });

    }
]);
