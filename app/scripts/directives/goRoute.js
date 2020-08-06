'use strict';

angular.module('paceApp')
	.directive('goRoute', ['$location',
		function($location) {
			return function(scope, element, attrs) {
				var path;

				attrs.$observe('goRoute', function(val) {
					path = val;
				});

				element.bind('click', function() {
					scope.$apply(function() {
						if(path.indexOf('mailto:') >= 0) {
							window.location.href = path;
							return;
						}

						if(path.indexOf('http://') < 0)
							path = 'http://' + path;

						window.open(path);
					});
				});
			};
		}]);