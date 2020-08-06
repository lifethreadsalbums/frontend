'use strict';

angular.module('paceApp')
.directive('colorSelector', ['$timeout', 'ngDialog', function($timeout, ngDialog) {
    return {
        restrict: 'A',
        scope: {},
        require: '?ngModel',
        link: function postLink(scope, element, attrs, model) {
            if (!model) {
                return;
            }

            // theme color
            scope.color = attrs.color || 'light';

            scope.pickerColor = '#ffffff';

            element.addClass('color-selector');
            element.addClass(scope.color);
            init();

            element.on('click', showColorPicker);
            element.on('$destroy', destroy);

            scope.selectColor = function selectColor() {
                var newValue = model.$viewValue;
                newValue.color = scope.pickerColor;
                model.$setViewValue(newValue);
                model.$render();
            };

            function init() {
                model.$render = function() {
                    element.removeClass('color-selector-bg color-selector-stroke');

                    // plain color
                    if (model.$viewValue.color && !model.$viewValue.hasOwnProperty('stroke')) {
                        element.css('background-color', model.$viewValue.color);
                        element.addClass('color-selector-bg');
                    }

                    // stroke width and color
                    if (model.$viewValue.stroke) {
                        element.css('border-width', model.$viewValue.stroke);

                        if (model.$viewValue.color) {
                            element.css('border-color', model.$viewValue.color);
                        }

                        element.addClass('color-selector-stroke');
                    }

                    // set picker color
                    scope.pickerColor = model.$viewValue.color;
                };
            }

            function showColorPicker() {
                scope.pickerColor = model.$viewValue.color;

                ngDialog.open({
                    template: 'views/components/colorSelector.html',
                    scope: scope,
                    className: 'pace-modal pace-modal-' + scope.color,
                    showClose: false
                });

                $timeout(function() {
                    $('#color-selector-picker').colpick({
                        flat: true,
                        layout: 'full',
                        submit: false,
                        colorScheme: scope.color,
                        color: scope.pickerColor,
                        onChange: function(hsb, hex, rgb, el, bySetColor) {
                            scope.pickerColor = '#' + hex;
                        }
                    });
                }, 100);
            }

            function destroy() {
                element.unbind('click', showColorPicker);
            }
        }
    }
}]);