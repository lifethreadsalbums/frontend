'use strict';

angular.module('paceApp')
    .directive('correctPassword', function() {
            return {
                require: 'ngModel',
                link: function(scope, elm, attrs, ctrl) {

                    var regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{6,120}$/;
                    
                    scope.$watch(attrs.ngModel, function(value) {
                        var len = value ? value.length : 0;

                        if(value===null || len===0) {
                            ctrl.$setValidity('short', true);
                            ctrl.$setValidity('wrong', true);
                        } else if(len<attrs.minLength) {
                            ctrl.$setValidity('short', false);
                            ctrl.$setValidity('wrong', true);
                        } else if(!regex.test(value)) {
                            ctrl.$setValidity('short', true);
                            ctrl.$setValidity('wrong', false);
                        } else {
                            ctrl.$setValidity('short', true);
                            ctrl.$setValidity('wrong', true);
                        }
                    
                    });
                }
            };
        });