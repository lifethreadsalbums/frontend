'use strict';

angular.module('pace.proofer', [])

.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('proofer', {
            url: '/proofer/:productId',
            templateUrl: 'views/proofer/proofer.html',
            controller:'ProoferCtrl',
            data: {
                spinner: 'designer'
            },
            resolve: {
                currentStore: ['StoreService', function(StoreService) {
                    return StoreService.getCurrentStore().$promise;
                }],

                data:['$stateParams', 'LayoutViewData', function($stateParams, LayoutViewData) {
                    return LayoutViewData.get({id:$stateParams.productId}).$promise;
                }],

                product:['data', function(data) { return data.product; }],

                productPrototype:['product', 'ProductPrototype', function(product, ProductPrototype) {
                    return ProductPrototype.get({id:product.prototypeId}).$promise;
                }],

                layout:['data', function(data) {
                    return data.layout;
                }],
                
                coverLayouts:['data', function(data) { 
                    return data.coverLayouts; 
                }],

                spines:['data', function(data) { 
                    return data.spines; 
                }],

                hinges:['data', function(data) { 
                    return data.hinges; 
                }],

                user: ['User', function(User) {
                    return User.getCurrent().$promise;
                }],

                prooferSettings: ['ProoferService', '$stateParams', function(ProoferService, $stateParams) {
                    return ProoferService.getSettingsByProductId($stateParams.productId);
                }]
            }
        })
        .state('album-preview', {
            url: '/preview/:productId',
            templateUrl: 'views/proofer/preview.html',
            controller:'ProoferPreviewCtrl',
            data: {
                loginLayout: true 
            },
            resolve: {
                currentStore: ['StoreService', function(StoreService) {
                    return StoreService.getCurrentStore().$promise;
                }],
                data: ['$resource', '$stateParams', function($resource, $stateParams) {
                    var api = $resource('', {}, {
                        preview: { method:'GET', url: apiUrl + 'api/proofer/preview/:id', isArray:false },
                    });
                    return api.preview({id:$stateParams.productId}).$promise;
                }],
                
                productPrototype:['data', function(data) {
                    return data.productPrototype;
                }],

                layout:['data', function(data) {
                    return data.layout;
                }],

                coverLayout:['data', function(data) {
                    return data.coverLayout;
                }],
            }
        })
        .state('proofer-login', {
            url: '/proof/:productId',
            templateUrl: 'views/proofer/proofer-login.html',
            controller:'ProoferLoginCtrl',
            resolve: {
                currentStore: ['StoreService', function(StoreService) {
                    return StoreService.getCurrentStore().$promise;
                }],
                prooferSettings: ['ProoferService', '$stateParams', function(ProoferService, $stateParams) {
                    return ProoferService.getSettingsByProductId($stateParams.productId);
                }]
            }
        })
        
}]);
