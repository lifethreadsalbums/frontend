'use strict';

angular.module('paceApp')
    .directive('numberFormat', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function postLink(scope, element, attrs, ngModelController) {

                var format = attrs.numberFormat,
                    postfix = attrs.postfix || '';

                var numberFormatWatchUnregister = scope.$watch(attrs.numberFormat, function (newFormat, oldFormat) {
                    if (newFormat===oldFormat) return;
                    format = newFormat;
                    element.trigger('change');
                });

                function formatNumber(data) {
                    var val = parseFloat(data);
                    if (isNaN(val)) return '';
                    return numeral(val).format(format) + postfix;
                }

                ngModelController.$parsers.push(function(data) {
                    if (typeof data === 'undefined') {
                        return false;
                    }

                    var string = data.replace(postfix, '');
                    var value = numeral().unformat(string);
                    if (isNaN(value)) return false;
                    return value;
                });

                ngModelController.$formatters.push(formatNumber);

                element.bind('change', function() {
                    ngModelController.$setViewValue( formatNumber(ngModelController.$viewValue) );
                    ngModelController.$render();
                });

                element.on('$destroy', function() {
                    numberFormatWatchUnregister();
                });
            }
        };
    })
    .directive('dateFormat2', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function postLink(scope, element, attrs, ngModelController) {

                var format = attrs.numberFormat,
                    postfix = attrs.postfix || '';

                function formatNumber(data) {
                    if (!data) return;
                    return moment(data).format('YYYY-MM-DD');
                }

                // ngModelController.$parsers.push(function(data) {
                //     var string = data.replace(postfix, '');
                //     var value = numeral().unformat(string);
                //     if (isNaN(value)) return false;
                //     return value;
                // });

                ngModelController.$formatters.push(formatNumber);

                element.bind('change', function() {
                    ngModelController.$setViewValue( formatNumber(ngModelController.$viewValue) );
                    ngModelController.$render();
                });

            }
        };
    });
