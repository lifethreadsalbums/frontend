'use strict';

angular.module('paceApp')
    .directive('inputNumber', function() {
        return {
            restrict: 'E',
            priority: 2,
            require: 'ngModel',
            link: function(scope, element, attrs, ngModelCtrl) {
                var inputEl = element.find('.input-number__input');
                var plusEl = element.find('.input-number__plus');
                var minusEl = element.find('.input-number__minus');

                var max = parseInt(attrs.max);
                var min = parseInt(attrs.min);
                var step = parseInt(attrs.step || 1);
                var postfix = (attrs.postfix) ? ' ' + postfix : '';
                var validation = attrs.validation || /[^0-9]/g;

                var keyCodes = [13,8,9,37,39,46,48,49,50,51,52,53,54,55,56,57,96,97,98,99,100,101,102,103,104,105,110];

                scope.placeholder = attrs.placeholder || '--';
                scope.postfix = attrs.postfix || '';

                inputEl.on('keydown', onKeyDown);
                inputEl.on('blur', onBlur);
                plusEl.on('click', increaseStep);
                minusEl.on('click', decreseStep);

                function onKeyDown() {
                    var keyCode = event.keyCode;

                    if (keyCodes.indexOf(keyCode) === -1) {
                        event.stopPropagation();
                        event.preventDefault();
                    } else if (keyCode === 13) {
                        ngModelCtrl.$setViewValue(getValue());
                        ngModelCtrl.$render();
                        event.stopPropagation();
                        event.preventDefault();
                    }
                }

                function onBlur() {
                    var value = parseInt(getValue());

                    if (_.isNumber(value) && !isNaN(value)) {
                        var value2 = Math.max(min, Math.min(max, value));
                        ngModelCtrl.$setViewValue(value2);
                        ngModelCtrl.$render();
                    }
                }

                function increaseStep() {
                    changeStep(step);
                }

                function decreseStep() {
                    changeStep(step * -1);
                }

                function changeStep(stepValue) {
                    var value = parseInt(getValue());

                    if (_.isNumber(value) && !isNaN(value)) {
                        var value2 = Math.max(min, Math.min(max, value + stepValue));
                        ngModelCtrl.$setViewValue(value2);
                        ngModelCtrl.$render();
                    }
                }

                function getValue() {
                    var text = inputEl.val();
                    return text.replace(validation, '');
                }
            },
            template: function(elem, attrs) {
                var spinnerVisible = !attrs.spinnerHidden;
                return '<div class="input-number">' +
                            '<input class="input-number__input" type="text" ng-model="' + attrs.ngModel + '">' +
                            '<span class="input-number__placeholder" ng-if="!' + attrs.ngModel + '">{{placeholder}}</span>' +
                            '<span class="input-number__postfix" ng-if="' + attrs.ngModel + '">{{postfix}}</span>' +
                            (spinnerVisible ? '<span class="input-number__plus"></span><span class="input-number__minus"></span>' : '') +
                        '</div>';
            }
        };
    })

    .directive('moneyInput', ["$parse", function ($parse) {

        var NUMBER_REGEXP = /^(\d+|(\d*(\.\d*)))\s*$/;
        var DEFAULT_PRECISION = 2;
        
        function link(scope, el, attrs, ngModelCtrl) {


            var min, max, precision, lastValidValue;

            /**
             * Returns a rounded number in the precision setup by the directive
             * @param  {Number} num Number to be rounded
             * @return {Number}     Rounded number
             */
            function round(num) {
                var d = Math.pow(10, precision);
                return Math.round(num * d) / d;
            }

            /**
             * Returns a string that represents the rounded number
             * @param  {Number} value Number to be rounded
             * @return {String}       The string representation
             */
            function formatPrecision(value) {
                return parseFloat(value).toFixed(precision);
            }

            function isPrecisionValid() {
                return !isNaN(precision) && precision > -1;
            }

            function updateValuePrecision() {
                // $modelValue shows up as NaN in 1.2 on init
                var modelValue = ngModelCtrl.$modelValue;

                if (!isNaN(modelValue) && isPrecisionValid()) {
                    ngModelCtrl.$modelValue = round(modelValue);
                    $parse(attrs.ngModel).assign(scope, ngModelCtrl.$modelValue);

                    var viewValue = formatPrecision(modelValue);

                    if (viewValue!==ngModelCtrl.$viewValue) {
                        ngModelCtrl.$viewValue = viewValue;
                        ngModelCtrl.$render();
                    }
                }
            }

            function minValidator(value) {
                if (!ngModelCtrl.$isEmpty(value) && value < min) {
                    ngModelCtrl.$setValidity('min', false);
                    return undefined;
                } else {
                    ngModelCtrl.$setValidity('min', true);
                    return value;
                }
            }

            function maxValidator(value) {
                if (!ngModelCtrl.$isEmpty(value) && value > max) {
                    ngModelCtrl.$setValidity('max', false);
                    return undefined;
                } else {
                    ngModelCtrl.$setValidity('max', true);
                    return value;
                }
            }

            ngModelCtrl.$parsers.push(function (value) {
              if (angular.isUndefined(value)) {
                value = '';
              }

              // Handle leading decimal point, like ".5"
              if (value.indexOf('.') === 0) {
                value = '0' + value;
              }

              // Allow "-" inputs only when min < 0
              if (value.indexOf('-') === 0) {
                if (min >= 0) {
                  value = null;
                  ngModelCtrl.$viewValue = '';
                  ngModelCtrl.$render();
                } else if (value === '-') {
                  value = '';
                }
              }

              var empty = ngModelCtrl.$isEmpty(value);
              if (empty || NUMBER_REGEXP.test(value)) {
                lastValidValue = (value === '')
                  ? null
                  : (empty ? value : parseFloat(value));
              } else {
                // Render the last valid input in the field
                ngModelCtrl.$viewValue = lastValidValue;
                ngModelCtrl.$render();
              }

              ngModelCtrl.$setValidity('number', true);

              return lastValidValue;
            });


            // Min validation
            attrs.$observe('min', function (value) {
              min = parseFloat(value || 0);
              minValidator(ngModelCtrl.$modelValue);
            });

            ngModelCtrl.$parsers.push(minValidator);
            ngModelCtrl.$formatters.push(minValidator);


            // Max validation (optional)
            if (angular.isDefined(attrs.max)) {
              attrs.$observe('max', function (val) {
                max = parseFloat(val);
                maxValidator(ngModelCtrl.$modelValue);
              });

              ngModelCtrl.$parsers.push(maxValidator);
              ngModelCtrl.$formatters.push(maxValidator);
            }


            // Round off (disabled by "-1")
            if (angular.isDefined(attrs.precision)) {
              attrs.$observe('precision', function (value) {
                precision = parseInt(value, 10);

                updateValuePrecision();
              });
            } else {
              precision = DEFAULT_PRECISION;
            }

            ngModelCtrl.$parsers.push(function (value) {
              if (value) {
                // Save with rounded value
                lastValidValue = isPrecisionValid() ? round(value) : value;
                return lastValidValue;
              } else {
                return undefined;
              }
            });

            ngModelCtrl.$formatters.push(function (value) {
              if (value) {
                return isPrecisionValid() ? formatPrecision(value) : value;
              } else {
                return '';
              }
            });

            // Auto-format precision on blur
            el.bind('blur', updateValuePrecision);
        }

        return {
            restrict: 'A',
            require: 'ngModel',
            link: link
        };
}]);