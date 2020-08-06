'use strict';

angular.module('pace.layout')

.directive('draggableColor', [function() {
    return {
        restrict: 'A',
        scope: {
            color: '=draggableColor',
            layoutController: '='
        },
        link: function postLink($scope, $element, $attrs) {
            $element[0].draggable = true;

            $element.on('dragstart', function(e) {
                var dt = e.originalEvent.dataTransfer;
                    
                dt.effectAllowed = 'move';
                dt.setData('text/x-pace-color', $scope.color);
            });
        }
    };
}])

.directive('backgroundStroke', [ '$rootScope', 'ngDialog', 'ColorService', '$timeout', 'KeyboardService',
function ($rootScope, ngDialog, ColorService, $timeout, KeyboardService) {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'views/layout/backgroundStroke.html',
        scope:{
            style: '=',
            customApplyToOptions: '=?',
            applyToOption: '=',
            applyToRange: '=',
            showSpineOption: '=',
            showLeftPageOption: '=',
            showRightPageOption: '=',
            mode: '=',
            swatches: '=',
            numSelectedElements: '=',
            onChange: '&',
            layoutController: '=',
            layout: '=',
            onSwatchChange: '&',
            defaultStrokeWeight: '=',
            strokeSliderEnabled: '='
        },
        link: function postLink($scope, $element, $attrs) {

            var lastStrokeWidth = 0;// 0.5;

            function addToSwatches(color) {
                var rgb = ColorService.hexToRgb(color);
                var c = _.find($scope.swatches, function(s) {
                    return s && ColorService.isNeighborColor(ColorService.hexToRgb(s), rgb);
                });

                if (!c) {
                    $scope.swatches.push(color);
                    $scope.onSwatchChange();
                }
            }

            $scope.colorTooltip = function(color) {
                if (color===null) return 'None';
                else if (color==='#000000') return 'Black';
                else if (color==='#ffffff') return 'White';

                var rgb = ColorService.hexToRgb(color);
                return 'R:' + rgb.r + ' G:' + rgb.g + ' B:' + rgb.b;
            };

            $scope.applyColor = function(color) {
                $scope.style[$scope.mode] = color;
                $scope.refresh();
                $scope.onChange();
            };

            $scope.refresh = function() {
                $timeout(function() {
                    $scope.$broadcast('rzSliderForceRender');
                });
            };

            $scope.onSliderChange = function() {
                addToSwatches($scope.style[$scope.mode]);
                $scope.onChange();
            };

            $scope.onStrokeWeightChange = function() {
                var stroke = isNaN($scope.style.strokeWidth) ? 0 : $scope.style.strokeWidth,
                    step = 0.25;
                $scope.style.strokeWidth = Math.round($scope.style.strokeWidth / step) * step;
            };

            $scope.onApplyToChange = function(value) {
                $scope.applyToOption = value;
                $scope.$apply();
                $scope.onChange();
            };

            $scope.onSwatchClick = function(color) {
                if ($scope.mode==='strokeColor') {
                    if (color===null) {
                        $scope.style.strokeWidth = 0;
                    } else if ($scope.style.strokeWidth===0) {
                        $scope.style.strokeWidth = lastStrokeWidth || $scope.defaultStrokeWeight || 0;
                    }
                }
                $scope.style[$scope.mode] = color;
                $scope.refresh();
            };

            $scope.showPicker = function() {
                var scope = $rootScope.$new();

                scope.ok = function(selectedColor) {
                    addToSwatches(selectedColor);
                    $scope.style[$scope.mode] = selectedColor;
                };

                scope.selectedColor = $scope.style[$scope.mode] || '#000000';

                ngDialog.open({
                    template: 'views/layout/colpick.html',
                    scope: scope,
                    className: 'pace-modal pace-modal-dark',
                    showClose: false ,
                    controller: 'ColPickCtrl'
                });
            };

            $scope.showEyedropper = function() {

                if ($scope.layoutController.currentTool instanceof PACE.EyedropperTool) {
                    setTimeout(function() {
                        $scope.layoutController.currentTool.exit();
                        $scope.eyedropperActive = false;    
                    });
                } else {
                    $scope.eyedropperActive = true;
                    $scope.layoutController.currentTool = new PACE.EyedropperTool($scope.layoutController,  function(red, green, blue) {
                        //RGB to Hex
                        var color = ColorService.rgbToHex(red, green, blue);
                        $scope.style[$scope.mode] = color;
                        $scope.$apply();
                    },

                    function() {
                        var selectedColor = $scope.style[$scope.mode];
                        addToSwatches(selectedColor);
                        $scope.$apply();
                    },

                    function() {
                        $scope.eyedropperActive = false;
                        $scope.$apply();
                    });
                }
            };

            $scope.backgroundOptions = [
                {
                    name: 'Colors',
                    value: 'colors'
                },
                // {
                //     name: 'Pictures',
                //     value: 'pictures'
                // }
            ];

            $scope.selectedBackgroundOption = $scope.backgroundOptions[0].value;
            $scope.backgroundImages = _.times(5, function() { return {url: "https://placehold.it/96x86/87787B/000000"}; });

            var applyToOptions = [
                {
                    name: 'Apply to Book',
                    value: 'book'
                },
                {
                    name: 'Apply to Left Page',
                    value: 'leftPage'
                },
                {
                    name: 'Apply to Range',
                    value: 'range'
                },
                {
                    name: 'Apply to Right Page',
                    value: 'rightPage'
                },
                {
                    name: 'Apply to Selected Object',
                    value: 'selectedObject'
                },
                {
                    name: 'Apply to Spine',
                    value: 'spine'
                },
                {
                    name: 'Apply to Spread',
                    value: 'selectedSpread'
                },
            ];

            var oldApplyToOption,
                customApplyToOptions;

            $scope.$watch('applyToOption', function(val, oldVal) {
                oldApplyToOption = oldVal || 'selectedSpread';
            });

            $scope.$watch('customApplyToOptions', function(val) {
                if (val) {
                    applyToOptions = val;
                    customApplyToOptions = true;
                }
            });

            function filterOptions() {
                if (customApplyToOptions) {
                    $scope.applyToOptions = applyToOptions;
                    return;
                }
                $scope.applyToOptions = _.filter(applyToOptions, function(item) {

                    if (item.value==='selectedObject') {
                        item.name = 'Apply to Selected Object' + ($scope.numSelectedElements>1 ? 's' : '');
                    }

                    return ($scope.showSpineOption || item.value!=='spine') && 
                        (!$scope.showSpineOption || item.value!=='range') &&
                        ($scope.showLeftPageOption || item.value!=='leftPage') &&
                        ($scope.showRightPageOption || item.value!=='rightPage') &&
                        ($scope.numSelectedElements>0 || item.value!=='selectedObject');
                });
                if ((!$scope.showSpineOption && $scope.applyToOption==='spine') ||
                    ($scope.numSelectedElements===0 && $scope.applyToOption==='selectedObject')) {
                    $scope.applyToOption = oldApplyToOption;
                }
            }

            $scope.$watch('numSelectedElements', function(val, oldVal) {
                filterOptions();
                if ($scope.numSelectedElements>0) {
                    $scope.applyToOption = 'selectedObject';
                }
            });

            $scope.$watch('showSpineOption', filterOptions);
            $scope.$watch('showLeftPageOption', filterOptions);
            $scope.$watch('showRightPageOption', filterOptions);

            $scope.$watch('style.strokeWidth', function(value) {
                if (value>0) {
                    lastStrokeWidth = value;
                }
            });

            $scope.$on('background-eyedropper-tool', $scope.showEyedropper);

            $scope.onKeyDown = function(e) {
                var key = KeyboardService.getShortcut(e);
                if (key==='DELETE' || key==='BACKSPACE') {
                    var color = $scope.style[$scope.mode],
                        idx = $scope.swatches.indexOf(color);

                    if (idx>2) {
                        $scope.swatches.splice(idx, 1);
                        $scope.style[$scope.mode] = null;
                        $scope.onSwatchChange();
                    }
                }
            };
        }
    };

}]);