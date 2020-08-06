'use strict';

angular.module('paceApp')
.factory('PaceHttpInterceptor', ['$q', '$injector', '$location', 'SessionService', function($q, $injector, $location, SessionService) {

    return {
        
        responseError: function(rejection) {

            console.log('PaceHttpInterceptor', rejection)
            
            var data = rejection.data || {};

            if (rejection.status===403 || rejection.status===401) {
                var $state = $injector.get('$state');

                var path = $location.path();
                if (path.indexOf('/proofer/')>=0) {
                    var id = path.substring(path.lastIndexOf('/') + 1);
                    $state.go('proofer-login', {productId: id});
                } else if (path.indexOf('/proof/')===-1) {
                    //save state
                    if (!SessionService.get('lastPath'))
                        SessionService.set('lastPath', $location.path());
                    $location.path('/login');
                }   
            }

            return $q.reject(rejection);

        }

    };

}]);