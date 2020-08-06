'use strict';

angular.module('paceApp')
.factory('MutationObserver', ['$window', function($window) {
	return $window.MutationObserver || $window.WebKitMutationObserver;
}]);