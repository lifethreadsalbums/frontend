'use strict';

angular.module('paceApp')
.directive('forceMinMax', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function postLink(scope, element, attrs, ngModel) {

            var min,max,step;

            function checkMinMax(value) {
                var oldValue = value;

                if (min && value<min) {
                    value = min;
                }
                if (max && value>max) {
                    value = max;
                }
                if (step && value%step!==0) {
                    value = Math.round(value/step) * step;
                }
                if (value && value!==ngModel.$viewValue) {
                    ngModel.$setViewValue(value);
                    element.val(value);
                }
                return value;
            }

            ngModel.$parsers.push(function(value) {
                var numVal = parseFloat(value);
                if (isNaN(numVal)) numVal = 0;

                return checkMinMax(numVal);
            });

            attrs.$observe('min', function(value) {
                min = value ? parseFloat(value) : undefined;
                checkMinMax(ngModel.$viewValue);
            });
            attrs.$observe('max', function(value) {
                max = value ? parseFloat(value) : undefined;
                checkMinMax(ngModel.$viewValue);
            });
            attrs.$observe('step', function(value) {
                step = value ? parseFloat(value) : undefined;
                checkMinMax(ngModel.$viewValue);
            });
            
            element.on('keydown', function(e) {
                if (min>0 && e.keyCode===189) //disable minus key
                    e.preventDefault(); 
            });
            
        }
    };
}]);
