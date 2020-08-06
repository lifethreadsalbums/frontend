'use strict';

angular.module('paceApp')
  .directive('foundationDropdownClose', [function() {
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {
            
            element.on('click', function() {
                Foundation.libs.dropdown.close(element);
            });

        }
    };
  }]);
