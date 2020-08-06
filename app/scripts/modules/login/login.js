'use strict';

angular.module('pace.login', [])
.config(['$stateProvider', function($stateProvider) {

	//------------- set up login and registration pages --------------
        
	$stateProvider
        .state('login', {
            templateUrl: 'views/login/login-layout.html',
            abstract:true,
            data: { loginLayout:true },
            resolve: {
                currentStore: ['StoreService', function(StoreService) { 
                    return StoreService.getCurrentStore().$promise;
                }],
            }
        })
        .state('login.login', {
            url:'/login',
            templateUrl: 'views/login/login.html',
            controller: 'LoginCtrl'
        })
        .state('login.signup', {
            url:'/signup',
            templateUrl: 'views/login/signup.html',
            controller: 'SignupCtrl',
        })
        .state('login.signup2', {
            url:'/signup/:page',
            templateUrl: 'views/login/signup.html',
            controller: 'SignupCtrl',
        })
        .state('login.forgotpass', {
            url:'/forgotpass',
            templateUrl: 'views/login/forgotpass.html',
            controller: 'ForgotpassCtrl',
        })
        .state('login.forgotpass2', {
            url:'/forgotpass/:page',
            templateUrl: 'views/login/forgotpass.html',
            controller: 'ForgotpassCtrl',
        })
        .state('login.change-pass', {
            url:'/change-password',
            templateUrl: 'views/login/changePassword.html',
            controller: 'ChangePasswordCtrl',
        })
        .state('login.change-pass2', {
            url: '/change-password/:page',
            templateUrl: 'views/login/changePassword.html',
            controller: 'ChangePasswordCtrl',
        })
        .state('login.email-verified', {
            url: '/email-verified',
            templateUrl: 'views/login/emailVerified.html',
            controller: 'EmailverifiedCtrl'
        });

}]);