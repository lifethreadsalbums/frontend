'use strict';

angular.module('pace.build')
.directive('filterTemplates', function () {
    return {
     	restrict: 'A',
      	link: function postLink(scope, element, attrs) {
        	function filterTemplates() {
        		
        	}
        	
        	element.on('change', filterTemplates);

	        //clean up when the element is destroyed
	        element.on('$destroy', function() {
	        	element.unbind('change', filterTemplates);
	        });
      	}
    };
});
