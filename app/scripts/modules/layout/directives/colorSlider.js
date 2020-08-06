'use strict';

angular.module('pace.layout')
    .directive('colorSlider', ['$timeout', 'ColorService', function ($timeout, ColorService) {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                color: '=',
                onChange: '&'
            },
            templateUrl: 'views/layout/colorSlider.html',
            link: function postLink($scope, $element, $attrs) {

                $scope.rgbNumbers = /^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/;
                $scope.colors = {r:0, g:0, b:0};

                $scope.$watch(function() {
                    return $scope.colors;
                }, function(value, oldValue) {
                    if (!value || value===oldValue) return;

                    if (value.nullColor) {
                        $scope.hex = 'N/A';
                        $scope.color = null;
                    } else {
                        var color = ColorService.rgbToHex(value.r, value.g, value.b);
                        $scope.hex = color;
                        $scope.color = color;
                    }
                }, true);

                $scope.$watch('color', function(value, oldValue) {
                    
                    $scope.nullColor = (value===null);
                    
                    $scope.colors = ColorService.hexToRgb(value || '#000000');
                    $scope.colors.nullColor = (value===null);
                    
                    if (value!==oldValue) {
                        $timeout(function() {
                            $scope.$broadcast('rzSliderForceRender');    
                        });
                    }
                });

                $scope.onEditEnd = function() {
                    $scope.onChange();
                };                
            }
        };
    }]);