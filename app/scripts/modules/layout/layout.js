'use strict';

angular.module('pace.layout', [])

.config(['$stateProvider', function($stateProvider) {

    $stateProvider

         .state('layout', {
            url: '/layout/:productId',
            //templateUrl: 'views/layout/layout.html',
            //controller:'LayoutCtrl',
            data: {
                spinner: 'designer'
            },
            resolve: {
                currentStore: ['StoreService', function(StoreService) {
                    return StoreService.getCurrentStore().$promise;
                }],
            }
            //     data:['$stateParams', 'LayoutViewData', function($stateParams, LayoutViewData) {
            //         return LayoutViewData.get({id:$stateParams.productId}).$promise;
            //     }],

            //     product:['data', function(data) { return data.product; }],

            //     productPrototype:['product', 'ProductPrototype', function(product, ProductPrototype) {
            //         return ProductPrototype.get({id:product.prototypeId}).$promise;
            //     }],

            //     layout:['data', function(data) {
            //         if (!data.layout) throw new Error('No Layout for product ID=' + data.product.id);
            //         return data.layout;
            //     }],
            //     coverLayouts:['data', function(data) { return data.coverLayouts; }],
            //     spines: ['data', function(data) { return data.spines; }],
            //     hinges: ['data', function(data) { return data.hinges; }],
            //     savedLayoutTemplates: ['data', function(data) { return data.savedLayoutTemplates; }],
            //     centerOffset: ['data', function(data) { return data.centerOffset; }],
            //     layoutSettings: ['data', function(data) { return data.layoutSettings; }],

            //     publicLayoutTemplates: ['LayoutTemplate', function (LayoutTemplate) {
            //         return LayoutTemplate.getPublic();
            //     }],

            //     userSettings: ['Settings', 'product', function(Settings, product) {
            //         return Settings.getUserSettings(product.user.id);
            //     }],

            //     viewType: [function() { return 'Layout'; }]
            // }
        })

        .state('layout.pages', {
            url:'/pages',
            // resolve: {
            //      product: ['product', function(product) { return product; }],
            //      layout: ['layout', function(layout) { return layout; }]
            // },
            views: {
                // 'frp@layout' : {
                //     templateUrl: 'views/layout/frp-pages.html',
                //     controller: 'PagesCtrl'
                // }
            }
        })

        .state('layout.prefs', {
            url:'/prefs',
            resolve: {
                product: ['product', function(product) { return product; }],
                layout: ['layout', function(layout) { return layout; }],
                user: ['User', function(User) {
                    return User.getCurrent().$promise;
                }],
                userSettings: ['Settings', 'user', function(Settings, user) {
                    return Settings.getUserSettings(user.id);
                }],
                productSettings: ['product', 'Settings', function(product, Settings) {
                    return Settings.getProductSettings({productId:product.id}).$promise;
                }],
                theme: function() { return 'dark-grey'; }
            },
            views: {
                'frp@layout' : {
                    //templateUrl: 'views/layout/frp-prefs.html',
                    //controller: 'ProoferPrefsCtrl'
                    templateUrl: 'views/dashboard/projectPrefs.html',
                    controller:'ProjectPrefsCtrl',
                }
            }
        })

        .state('layout.arrange', {
            url:'/arrange',
            // resolve: {
            //     product: ['product', function(value) { return value; }],
            //     layout: ['layout', function(value) { return value; }],
            //     productPrototype: ['productPrototype', function(value) { return value; }],
            //     coverLayouts: ['coverLayouts', function(value) { return value; }],
            //     savedLayoutTemplates: ['savedLayoutTemplates', function(value) { return value; }],
            //     publicLayoutTemplates: ['publicLayoutTemplates', function(value) { return value; }],
            //     viewType: [function() { return 'QuickArrange'; }]
            // },
            views: {
                // 'frp2' : {
                //     templateUrl: 'views/layout/frp-quick-arrange.html',
                //     controller: 'LayoutCtrl'
                // }
            }
        })

        .state('layout-snapshots', {
            url:'/layout/:productId/snapshots',
            resolve: {
                product:['$stateParams', 'Product', function($stateParams, Product) {
                    return Product.get({id:$stateParams.productId}).$promise;
                }],

                layout:['product', 'Layout', function(product, Layout) {
                    return Layout.get({id:product.layoutId}).$promise;
                }],
            },

            templateUrl: 'views/layout/frp-snapshots.html',
            controller: 'SnapshotsCtrl'

        })

        .state('template-import',{
            url:'/template-import',
            controller: 'TemplateImportCtrl',
            templateUrl: 'views/layout/ui.html',
            resolve: {
                layoutSizes: ['LayoutSize', function(LayoutSize) { return LayoutSize.query().$promise; }],
                users: ['User', function(User) { return User.query().$promise; }]
            },
        })

        // .state('preview', {
        //     url: '/preview/:productId',
        //     templateUrl: 'views/layout/preview.html',
        //     controller:'PreviewCtrl',
        //     data: {
        //         loginLayout: true
        //     },
        //     resolve: {
        //         product:['$stateParams', 'Product', function($stateParams, Product) {
        //             return Product.get({id:$stateParams.productId}).$promise;
        //         }],

        //         layout:['product', 'Layout', function(product, Layout) {
        //             return Layout.get({id:product.layoutId}).$promise;
        //         }],
        //     }
        // });


}]);
