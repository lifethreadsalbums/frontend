'use strict';

angular.module('pace.prints', [])

.config(['$stateProvider', function($stateProvider) {

    $stateProvider

        .state('prints', {
            url: '/prints/:productId',
            templateUrl: 'views/prints/prints.html',
            controller:'PrintsCtrl',
            resolve: {
                currentStore: ['StoreService', function(StoreService) {
                    return StoreService.getCurrentStore().$promise;
                }],
                // user: ['User', function(User) {
                //     return User.getCurrent().$promise;
                // }],
                // userSettings: ['Settings', 'user', function(Settings, user) {
                //     return Settings.getUserSettings(user.id);
                // }],
                
                data:['$stateParams', 'LayoutViewData', function($stateParams, LayoutViewData) {
                    return LayoutViewData.get({id:$stateParams.productId}).$promise;
                }],

                product:['data', function(data) { return data.product; }],

                productPrototype:['product', 'ProductPrototype', function(product, ProductPrototype) {
                    return ProductPrototype.get({id:product.prototypeId}).$promise;
                }],

                layoutSizeOption:['product', 'BuildService', function(product, BuildService) {
                    return BuildService.getLayoutSizeOption(product);
                }],

                layouts2: ['product', '$q', 'Layout', function(product, $q, Layout) {
                    console.log('layouts2')
                    if (product.children.length===0) return [];

                    var promises = _.map(product.children, function(child) {
                        return Layout.get({id:child.layoutId}).$promise;
                    });

                    return $.all(promises);
                }],

                layout:['data', function(data) {
                    if (!data.layout) throw new Error('No Layout for product ID=' + data.product.id);
                    return data.layout;
                }]
                
            }
        });

}]);
