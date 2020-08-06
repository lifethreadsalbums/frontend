'use strict';

angular.module('paceApp')
.directive('onOff', ['_', '$parse', '$timeout', function (_, $parse, $timeout) {
    return {
        replace: true,
        restrict: 'E',
        require: 'ngModel',
        scope: {},
        link: function postLink(scope, element, attrs, ngModelCtrl) {

            var onInput = element.find('input[value="on"]'),
                offInput = element.find('input[value="off"]'),
                changeFn = $parse(attrs.onChange);

            scope.widgetId = _.uniqueId('on-off-');

            function onInputChange() {
                scope.$apply(function() {
                    var value = onInput.is(':checked');
                    ngModelCtrl.$setViewValue(value);
                    ngModelCtrl.$render();
                    changeFn(scope.$parent, {value:value});
                });
            }
            onInput.on('change', onInputChange);
            offInput.on('change', onInputChange);

            ngModelCtrl.$render = function() {
                var value = !!ngModelCtrl.$viewValue;

                $timeout(function() {
                    onInput.prop('checked', value);
                    offInput.prop('checked', !value);
                });

                if (value) {
                    element.addClass('is-on');
                } else {
                    element.removeClass('is-on');
                }
            };
        },
        template: function(elem, attrs) {

            var preLabel = attrs.preLabel,
                color = attrs.color || 'light',
                size = '',
                onLabel = attrs.onLabel || 'On',
                offLabel = attrs.offLabel || 'Off';

            if (attrs.size && attrs.size === 'input') {
                size = 'on-off-container--input-height';
            }

            return '<div class="on-off-container ' +  color + ' ' + size + '">' +
                        (preLabel ? '<span class="on-off-pre-label">' + preLabel + '</span>' : '') +
                        '<div class="on-off">' +
                            '<input name="{{widgetId}}" type="radio" value="off">' +
                            '<label>' + offLabel + '</label>' +

                            '<input name="{{widgetId}}" type="radio" value="on">' +
                            '<label>' + onLabel + '</label>' +

                            '<span></span>' +
                        '</div>' +
                    '</div>';
        }
    };
}]);
