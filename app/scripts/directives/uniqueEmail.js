'use strict';

angular.module('paceApp')
.directive('uniqueEmail', ['$http', '$parse', function($http, $parse) {
	return {
		require: 'ngModel',
		link: function(scope, element, attrs, ctrl) {
		    element.on('blur', onBlur);
            element.on('$destroy', onDestroy);

            var userGetter = $parse(attrs.uniqueEmail);

            function onBlur() {
                if (ctrl.$viewValue) {

                    var user = userGetter(scope),
                        userIdParam='';
                    if (user && user.id) userIdParam = '&userId='+user.id;

                    $http.get(apiUrl + 'api/isEmailRegistered?email=' + ctrl.$viewValue + userIdParam)
                        .success(function(data) {
                            ctrl.$setValidity('unique', !data.result);
                        })
                        .error(function() {
                            ctrl.$setValidity('unique', false);
                        });
                }
            }

            function onDestroy() {
                element.unbind('blur');
            }
		}
	};
}]);
