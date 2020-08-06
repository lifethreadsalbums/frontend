'use strict';

angular.module('paceApp')
	.directive('footerHandle', [function() {
		return {
			restrict: 'A',
			link: function postLink(scope, element, attrs) {
				var footer = element.closest('#footer');

				element.on('click', function() {
					footer.toggleClass('collapsed');
				});

				// Clean up when the element is destroyed
				element.on('$destroy', function() {
					element.unbind('click');
				});
			}
		};
	}]);
