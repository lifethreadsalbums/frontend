'use strict';

angular.module('pace.login')
  .controller('ForgotpassCtrl', ['$scope', '$rootScope', '$stateParams', 'MessageService', '$location','localize', 'Userdata', 'AuthService',
		function($scope, $rootScope, $stateParams, MessageService, $location, localize, Userdata, AuthService) {
			MessageService.clear();

			$scope.$on('$viewContentLoaded', function() {
				$rootScope.viewLoaded = true;
			});
			$scope.dataIn = Userdata.getData();

			if ($stateParams.page) {
				$rootScope.actPage = 'forgotpass' + $stateParams.page;
			} else {
				$rootScope.actPage = 'forgotpass1';
			}


			if($rootScope.actPage === 'forgotpass4'){
				Userdata.makeNewPassword().success(function (dataIn) {

				}).error(function (dataIn) {
					MessageService.show(dataIn.error, 'alert');
					$rootScope.actPage = 'forgotpassError';
				});
			}


			$scope.validate = function(page) {
				
				Userdata.resetPass().success(function (dataIn) {
					Userdata.setData($scope.dataIn);
					$location.path('/forgotpass/' + page);
				}).error(function (response) {

					if (response.type==="org.springframework.security.authentication.DisabledException") 
	                    MessageService.show(localize.getLocalizedString('emailNotEnabledBeforePasswordReset'),'alert');
	                else if (response.type==="com.poweredbypace.pace.exception.EmailNotVerifiedException")
	                    MessageService.ask(localize.getLocalizedString('emailNotVerifiedBeforePasswordReset'),'alert', function() {
                        	AuthService.resendVerificationEmail(Userdata.getData().email);
                    	});
	                else 
	                    MessageService.show(response.error,'alert');
					
				});

				
			};

			
  }]);
