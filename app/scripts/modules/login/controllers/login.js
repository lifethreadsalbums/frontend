'use strict';

angular.module('pace.login')
	.controller('LoginCtrl', ['$scope', '$rootScope', 'AuthService', 'MessageService', '$timeout', '$location',
		'$state', 'Product', 'SessionService', 'ngDialog', 'User', 'localize', 'StoreConfig', 'currentStore', '$interpolate',
		function($scope, $rootScope, AuthService, MessageService, $timeout, $location,
			$state, Product, SessionService, ngDialog, User, localize, StoreConfig, currentStore, $interpolate) {

			$rootScope.actPage = 'login';
			$rootScope.storeConfig = StoreConfig;

			$scope.dataIn = {
				'password': '',
				'username': '',
				'rememberMe': (localStorage.getItem('rememberMe') === 'true') ? true : false
			};

			$scope.rememberMeChanged = function() {
			    localStorage.setItem('rememberMe', $scope.dataIn.rememberMe);
            };

            function onLoginSuccess(value) {
              var date1 = new Date('01.05.2023');

                if(date1.getTime() > new Date().getTime()) {
                      MessageService.ok("Please note: Pearl & Velvet papers are no longer available. All albums will be printed on lustre paper");
                }
            	var user = value.user,
					billingAddress = user.billingAddress,
					taxCountryId = 2,
					taxStateId = 2;

				if (StoreConfig.taxNumber) {
					taxCountryId = StoreConfig.taxNumber.countryId;
					taxStateId = StoreConfig.taxNumber.stateId;
				}

				if (billingAddress &&
					billingAddress.country && billingAddress.country.id===taxCountryId &&
					billingAddress.state && billingAddress.state.id===taxStateId &&
					user.taxNumber===null) {

					var dialogScope = $rootScope.$new();
					dialogScope.user = user;

					ngDialog.open({
                        template: 'views/login/taxExemptionForm.html',
                        scope: dialogScope,
                        controller: 'TaxExemptionCtrl',
                        className: 'pace-modal pace-modal-light pace-modal-wide'
                    });

				}

				if (user.changePasswordOnNextLogin) {
					var dialogScope = $rootScope.$new();
					ngDialog.open({
                        template: 'views/login/changePasswordPopup.html',
                        scope: dialogScope,
                        controller: 'ChangePasswordPopupCtrl',
                        className: 'pace-modal pace-modal-light pace-modal-wide'
                    });
				}

				// var lastPath = SessionService.get('lastPath');
    //             if (lastPath) {
    //                 $timeout(function() { $location.path(lastPath); });
    //                 SessionService.unset('lastPath');
    //             } else {

    			if (user.admin) {
    				$state.go('adminOrders.orders');
    			} else {

					Product.countMyCurrentProducts({}, function(value) {
						if (value.count===0)
							$state.go('welcome');
						else
							$state.go('dashboard.default.overview');
					}, function() {
						$state.go('dashboard.default.overview');
					});

				}
            }

			$scope.signin = function() {
				$scope.loggingIn = true;

				if($scope.dataIn.username==='' &&  $scope.dataIn.password===''){
					MessageService.show('Please enter a valid email and password.','alert');
					return false;
				}
				if($scope.dataIn.username==='' &&  $scope.dataIn.password!==''){
					MessageService.show('Please enter a valid email.','alert');
					return false;
				}
				if($scope.dataIn.username!=='' &&  $scope.dataIn.password===''){
					MessageService.show('Please enter a valid password.','alert');
					return false;
				}
				AuthService.login($scope.dataIn)
					.success(function(value) {

						$timeout(function() {
							onLoginSuccess(value);
						});

					})
					.error(function(err) {

						$scope.loggingIn = false;
						if (err.type==='org.springframework.security.authentication.LockedException') {

							var getter = $interpolate(localize.getLocalizedString('accountDisabled'));
							var ctx = {
								storeConfig: StoreConfig
							};
                    		MessageService.show(getter(ctx),'alert');


						} else if (err.type==='com.poweredbypace.pace.exception.EmailNotVerifiedException') {

							MessageService.confirm('Your email address has not yet been verified. '+
								'Please check your email account. Would you like us to send you another email verification?',
								function() {
									User.resendVerificationEmail({email:$scope.dataIn.username}, function() {
                    					MessageService.show('Verification email has been sent to ' + $scope.dataIn.username);
                					});
								}
							);


						} else {
							MessageService.show(err.error, 'alert');
						}

					});
			};
		}
	]);
