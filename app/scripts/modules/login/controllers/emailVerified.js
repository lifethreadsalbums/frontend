'use strict';

angular.module('pace.login')
.controller('EmailverifiedCtrl', ['$scope', '$timeout', 'localize', '$state', 'StoreConfig',
    function ($scope, $timeout, localize, $state, StoreConfig) {
    	
        $timeout(function() {
            $state.go('login.login');
        }, 10000);

        $scope.storeConfig = StoreConfig;

        localize.setLanguage('en');
}]);
