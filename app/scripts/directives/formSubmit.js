'use strict';

angular.module('paceApp')
    .directive('formSubmit', ['$parse', '$rootScope', 'MessageService', 'localize', function ($parse, $rootScope, MessageService, localize) {
        return {
            restrict: 'A',
            require: 'form',
            link: function (scope, formElement, attributes, formController) {
 
                var BLURRED_CLASS = "ng-blurred";
                
                var fn = $parse(attributes.formSubmit);
                var errorMsg = attributes.errorMessage || localize.getLocalizedString('correctErrors');

                var markFieldsAsBlurred = function(controller) {

                    angular.forEach(controller, function(field, name) {

                        if (typeof(field)==="object") {
                            if (Object.getPrototypeOf(field)===Object.getPrototypeOf(controller)) {

                                var required = field.required || true;
                                if (required)
                                    markFieldsAsBlurred(field);
                                else
                                    field.$setValidity(true);

                            } else if (typeof(name) === 'string' && !name.match('^[\$]') && !field.$blurred) {
                                field.$blurred = true;
                                
                                var selector = "form[name='" + controller.$name + "'] *[name='" + name + "'], "+
                                    "ng-form[name='" + controller.$name + "'] *[name='" + name + "']";
                                var formField = angular.element( selector );
                                
                                formField.addClass(BLURRED_CLASS);
                            }
                        }
                    });

                };

                formController.submit = function(event) {
                    // if form is not valid cancel it.
                    
                    if (!formController.$valid) {
                        markFieldsAsBlurred(formController);
                        if (errorMsg) {                        
                            MessageService.show(errorMsg, 'alert');
                        }
                        return false;
                    }
                 
                    fn(scope, {$event:event});
                    
                };

                formElement.bind('submit', function (event) {
                    event.preventDefault();
                    scope.$apply(function() {
                        formController.submit(event);
                    });
                });
            }
        };
    }]);
