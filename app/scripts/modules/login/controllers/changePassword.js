'use strict';

angular.module('pace.login')
    .controller('ChangePasswordCtrl', ['$scope', '$rootScope', '$stateParams', 'MessageService', '$location','localize', '$timeout', 'Userdata', 
		function($scope, $rootScope, $stateParams, MessageService, $location, localize, $timeout, Userdata) {
			MessageService.clear();

			$scope.password = null;
			$scope.confirmPassword = null;

			$rootScope.actPage = $stateParams.page;

			if ($stateParams.page==="done" && $rootScope.passwordChanged===undefined ) {
				$rootScope.actPage = "";
				return;
			}

			$scope.submit = function(page) {
				
				Userdata.changePassword($scope.password)
					.success(function (dataIn) {

						$rootScope.passwordChanged = true;
						$location.path('/change-password/done');

					}).error(function (dataIn) {
						MessageService.show(dataIn.error, 'alert');
					});
				
			};

    }])
    .controller('ChangePasswordPopupCtrl', ['$scope', '$rootScope', 'MessageService', 'AuthService',
        function($scope, $rootScope, MessageService, AuthService) {
            
            $scope.save = function() {
                $scope.saving = true;
                AuthService.changePassword($scope.password)
                    .success(function(value) {
                        $scope.closeThisDialog();
                    })
                    .error(function(err) {
                        $scope.saving = false;
                        MessageService.show(err.error, 'alert');
                    });
                
            };
                    
    }]);
