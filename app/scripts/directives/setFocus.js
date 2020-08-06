'use strict';

angular.module('paceApp')
.directive('setFocus', ['$timeout', function($timeout) {
    return {
        scope: { trigger: '@setFocus' },
        link: function(scope, element) {
            scope.$watch('trigger', function(value) {
                if(value === "true") { 
                    $timeout(function() {
                        element.focus(); 
                    });
                }
            });
        }
    };
}]);
