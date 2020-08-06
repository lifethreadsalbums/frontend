'use strict';

angular.module('paceApp')
    .directive('matchFields', function() {
        
        return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl) {

                var field1;
                var field2;

                function updateUI() {
                    if (attrs.matchFieldsNot==='true') 
                        ctrl.$setValidity('doesMatch', field1!==field2);
                    else
                        ctrl.$setValidity('doesntMatch', field1===field2);
                }
                
                scope.$watch(attrs.matchFields, function(value) {
                    field1 = value;
                    updateUI();
                });

                scope.$watch(attrs.ngModel, function(value) {
                    field2 = value;
                    updateUI();
                });

            }

        };

        
    });