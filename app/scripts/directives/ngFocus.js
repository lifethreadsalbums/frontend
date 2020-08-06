'use strict';

angular.module('paceApp')
.directive('ngFocus', [function() {
	var FOCUS_CLASS = "ng-focused";
	var BLURRED_CLASS = "ng-blurred";

	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, element, attrs, ctrl) {

			
			ctrl.$focused = false;

			element.bind('focus', function(evt) {
				element.addClass(FOCUS_CLASS);
				ctrl.$focused = true;
				if(scope.$$phase !== '$digest') { scope.$digest() };
			}).bind('blur', function(evt) {
				element.removeClass(FOCUS_CLASS);
				element.addClass(BLURRED_CLASS);
				ctrl.$focused = false;
				ctrl.$blurred = true;
				if(scope.$$phase !== '$digest') { scope.$digest() };
			});

		}
	};
}]);