'use strict';

angular.module('paceApp')
	.directive('onScrollEnd', function() {
		return {
			scope: {
				onScrollEnd:'&'
			},
			link: function postLink(scope, element, attrs) {
				element.on('scroll', function() {
					var howScroll = element[0].scrollHeight - element.height() - 15;
					var scrollTop = element.scrollTop();
					if (howScroll < scrollTop) {
						scope.onScrollEnd();
					}
				});
			}
		};
	});