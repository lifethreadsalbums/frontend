'use strict';

/**
 * Triggers form submission when the given event is broadcasted by Angular
 * @param {string} submitOn Event name.
 * 
 */

angular.module('paceApp')
.directive('submitOn', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {
            scope.$on(attrs.submitOn, function() {
                $timeout(function() {
                    element.trigger('submit');
                });
            });
        }
    };
}]);
