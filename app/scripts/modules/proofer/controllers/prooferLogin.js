'use strict';

angular.module('pace.proofer')
.controller('ProoferLoginCtrl', ['$scope', 'MessageService', '$state', 'AuthService', 'prooferSettings', '$rootScope', 'StoreConfig',
    function ($scope, MessageService, $state, AuthService, prooferSettings, $rootScope, StoreConfig) {


    	if (prooferSettings.logo) {
    		$rootScope.prooferLogo = {
    			url: StoreConfig.imageUrlPrefix + 'original/' + prooferSettings.logo.url,
    			text: ''
    		};    		
    	}

    	$scope.password = '';

    	$scope.login = function() {
    		if ($scope.password==='') return false;

			$scope.loggingIn = true;
			var auth = {
				username: 'proofer-user-' + $state.params.productId,
				password: $scope.password,
				rememberMe: $scope.rememberMe
			};
			AuthService.login(auth)
				.success(function(value) {
					$state.go('proofer', $state.params);
				})
				.error(function(err) {
					$scope.loggingIn = false;
					MessageService.show(err.error, 'alert');
				});
		};

    }
]);