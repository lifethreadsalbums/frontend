'use strict';

angular.module('pace.static', [])
.config(['$stateProvider', function($stateProvider) {

    //------------- set up static pages --------------
    $stateProvider
        .state('termsOfUse', {
            url: '/terms-of-use',
            templateUrl: 'views/static/terms-of-use.html',
            controller:'StaticCtrl',
            resolve: {
                currentStore: ['StoreService', function(StoreService) { 
                    return StoreService.getCurrentStore().$promise;
                }],
            }
        })
        .state('eula', {
            url: '/eula',
            templateUrl: 'views/static/eula.html',
            controller:'StaticCtrl',
            resolve: {
                currentStore: ['StoreService', function(StoreService) { 
                    return StoreService.getCurrentStore().$promise;
                }],
            }
        })
        .state('privacyPolicy', {
            url: '/privacy-policy',
            templateUrl: 'views/static/privacy-policy.html',
            controller:'StaticCtrl',
            resolve: {
                currentStore: ['StoreService', function(StoreService) { 
                    return StoreService.getCurrentStore().$promise;
                }],
            }
        })
        .state('help', {
            url: '/help',
            templateUrl: 'views/static/help.html',
            controller:'StaticCtrl',
            resolve: {
                currentStore: ['StoreService', function(StoreService) { 
                    return StoreService.getCurrentStore().$promise;
                }],
            }
        });
    
}]);