'use strict';

angular.module('pace.layout')

.directive('fontSizeInput', function () {
    return {
        require: 'ngModel',
        priority: 1,
        replace: true,
        restrict: 'E',
        template: '<input class="font-input" type="text">',
        link: function (scope, element, attr, ngModelCtrl) {

            var placeholder = '--',
                eventNamespace = '.fontSizeInput',
                holdTimeoutId;

            ngModelCtrl.$parsers.push(function(text) {
                if (text && text!=='' && text!==placeholder) {
                    var transformedInput = text.replace(/[^0-9]/g, '');
                    transformedInput = clamp(parseInt(transformedInput));
                    if (!isNaN(transformedInput))
                        return transformedInput;
                } else if (text!==placeholder) {
                    ngModelCtrl.$setViewValue(placeholder);
                    ngModelCtrl.$render();
                }

                return undefined;
            });

            ngModelCtrl.$formatters.push(function(value) {
                if (!value || value==='') return placeholder;
                return value + ' pt';
            });

            function clamp(val) {
                var max = parseInt(attr.max),
                    min = parseInt(attr.min);
                return Math.max(min, Math.min(max, val));
            }

            function getValue() {
                return ngModelCtrl.$modelValue;
            }

            var defaultEvents = ["keydown", "input", "change"];

            angular.forEach(defaultEvents, function (event) {
                // ie8 does not support some events
                // use try catch to mask this
                try { element.off(event); } catch (e) { }
            });

            element.on('blur' + eventNamespace, function(event) {
                ngModelCtrl.$setViewValue(clamp(getValue())+' pt');
                ngModelCtrl.$render();
            });

            var keyCodes = [13,8,9,37,39,46,48,49,50,51,52,53,54,55,56,57,96,97,98,99,100,101,102,103,104,105,110];
            element.on('keydown' + eventNamespace, function(event) {
                var keyCode = event.keyCode;
                
                if (keyCodes.indexOf(keyCode)===-1) {
                    event.stopPropagation();
                    event.preventDefault();
                } else if (keyCode===13) {
                    ngModelCtrl.$setViewValue(clamp(getValue())+' pt');
                    ngModelCtrl.$render();
                    event.stopPropagation();
                    event.preventDefault();
                } else if (element.val()===placeholder) {
                    element.val('');
                }
            });

            var plusButton = angular.element('<span class="plus-button"></span>'),
                minusButton = angular.element('<span class="minus-button"></span>');

            var step = function(step) {
                var value = getValue();

                if (_.isNumber(value) && !isNaN(value)) {
                    ngModelCtrl.$setViewValue(clamp(value + step) + ' pt');
                    ngModelCtrl.$render();
                    //console.log('step', value, value2);
                    
                }
            };

            function onPlusMinusMousedown(dir, e) {
                var doStuff = function() {
                    step(dir);
                    
                };
                doStuff();
                holdTimeoutId = setInterval(doStuff, 150);
            }

            function onPlusMinusMouseup(e) {
                clearInterval(holdTimeoutId);
                element.trigger('change');
                scope.$apply();
                element.focus();
            }

            plusButton.insertAfter(element);//.on('click' + eventNamespace, onPlusMinusMousedown.bind(null, 1));
            minusButton.insertAfter(element);//.on('click' + eventNamespace, onPlusMinusMousedown.bind(null, -1));

            plusButton
                .on('mousedown' + eventNamespace, onPlusMinusMousedown.bind(null, 1))
                .on('mouseup' + eventNamespace + ' mouseleave' + eventNamespace, onPlusMinusMouseup);

            minusButton
                .on('mousedown' + eventNamespace, onPlusMinusMousedown.bind(null, -1))
                .on('mouseup' + eventNamespace + ' mouseleave' + eventNamespace, onPlusMinusMouseup);

            element.on('$destroy', function() {
                element.off(eventNamespace);
                minusButton.off(eventNamespace);
                plusButton.off(eventNamespace);
            });

        }
    };
})

.directive('fontStyles', ['$rootScope', 'ngDialog', 'DesignerFonts', '$timeout', 'ColorService', 'KeyboardService',
    function ($rootScope, ngDialog, DesignerFonts, $timeout, ColorService, KeyboardService) {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'views/layout/fontStyles.html',
        scope: {
            style: '=',
            numSelectedElements: '=',
            recentlyUsedFonts: '=',
            onChange: '&',
            layoutController: '=',
            swatches: '=',
            onSwatchChange: '&',
            maxFontSize: '='
        },

        link: function postLink($scope, $element, $attrs) {
            var allStyles = _.flatten( _.pluck(DesignerFonts, 'styles') );

            $scope.fonts = DesignerFonts;

            function addToSwatches(color) {
                if (color==='#000000' || color==='#ffffff') return;

                var rgb = ColorService.hexToRgb(color);
                var c = _.find($scope.swatches, function(s) {
                    return s && ColorService.isNeighborColor(ColorService.hexToRgb(s), rgb);
                });

                if (!c) {
                    $scope.swatches.push(color);
                    $scope.onSwatchChange();
                }
            }

            $scope.$watch('style', function(value) {

                if (value && value.fontFamily) {
                    _.find(DesignerFonts, function(font) {
                        var style = _.findWhere(font.styles, {fontFamily:value.fontFamily});
                        //console.log('selectedFont', style, font)
                        if (style) {
                            $scope.selectedFont = font;
                            $scope.selectedFontStyle = style;
                            return true;
                        }
                    });
                } else {
                    $scope.selectedFont = null;
                    $scope.selectedFontStyle = null;
                }

                $scope.selectedColor = (value ? value.fill : null);
                //console.log('style', value, $scope.selectedColor);

            }, true);



            $scope.selectFont = function(font, apply) {
                $scope.selectedFont = font;
                if (font && font.styles) {
                    $scope.selectedFontStyle = _.findWhere(font.styles, {isDefault:true}) || font.styles[0];
                } else {
                    $scope.selectedFontStyle = null;
                }

                if (apply) {
                    $scope.applyStyle('fontFamily', $scope.selectedFontStyle.fontFamily);
                    if (!$scope.style.fontSize) {
                        $scope.applyStyle('fontSize', 40);
                    }
                }
            };

            $scope.applyStyle = function(prop, val) {
                if (prop==='fontSize') val = Math.min(val,$scope.maxFontSize);
                $scope.style[prop] = val;
                $scope.onChange({prop:prop});

                if (prop==='fill') {
                    $scope.selectedColor = val;
                    addToSwatches(val);
                }
            };

            $scope.showPicker = function() {
                var scope = $rootScope.$new();
                scope.ok = function(selectedColor) {
                    $scope.applyStyle('fill', selectedColor);
                };

                scope.selectedColor = $scope.selectedColor || '#000000';

                ngDialog.open({
                    template: 'views/layout/colpick.html',
                    scope: scope,
                    className: 'pace-modal pace-modal-dark',
                    showClose: false ,
                    controller: 'ColPickCtrl'
                });
            };

            var lastEyeDropperFill;

            $scope.showEyedropper = function() {

                if ($scope.layoutController.currentTool instanceof PACE.EyedropperTool) {
                    setTimeout(function() {
                        $scope.layoutController.currentTool.exit();
                        $scope.eyedropperActive = false;
                        if (lastEyeDropperFill) {
                            $scope.applyStyle('fill', lastEyeDropperFill);
                            lastEyeDropperFill = null;
                        }
                    });
                } else {
                    $scope.eyedropperActive = true;
                    $scope.layoutController.currentTool = new PACE.EyedropperTool($scope.layoutController,  function(red, green, blue) {
                        //RGB to Hex
                        var color = ColorService.rgbToHex(red, green, blue);
                        $scope.style.fill = color;
                        $scope.onChange({prop:'fill'});
                        $scope.$apply();
                    },

                    function() {
                        lastEyeDropperFill = $scope.style.fill;
                        $scope.layoutController.currentTool.defaultColor = $scope.style.fill;
                        $scope.applyStyle('fill', $scope.style.fill);
                        $scope.$apply();
                    },

                    function() {
                        $scope.eyedropperActive = false;
                        if (lastEyeDropperFill) {
                            $scope.applyStyle('fill', lastEyeDropperFill);
                            lastEyeDropperFill = null;
                        }
                        $scope.$apply();
                    });

                    $scope.layoutController.currentTool.defaultColor = $scope.style.fill;
                }
            };

            $scope.onKeyDown = function(e) {
                var key = KeyboardService.getShortcut(e);
                if (key==='DELETE' || key==='BACKSPACE') {
                    var color = $scope.selectedColor,
                        idx = $scope.swatches.indexOf(color);

                    if (idx>=0) {
                        $scope.swatches.splice(idx, 1);
                        $scope.selectedColor = null;
                        $scope.style.fill = null;
                        $scope.onSwatchChange();
                    }
                }
            };

            $scope.$on('font-eyedropper-tool', $scope.showEyedropper);

            $scope.getFontTitle = function(font) {
                return font.tooltip || font.displayName;
            };
        }
    };
}]);
