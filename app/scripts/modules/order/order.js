'use strict';

angular.module('pace.order', [])
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

    //
    // For any unmatched url, redirect to this url
    //$urlRouterProvider.otherwise('/orders');
    $urlRouterProvider.when('/orders/completed', '/orders/completed/recent');
    $urlRouterProvider.when('/orders', ['AuthService', function(AuthService) {
        var user = AuthService.getCurrentUser();
        if (user && user.admin)
            return '/orders/unassigned';
        else if (user && !user.admin)
            return '/orders/current';
    }]);

    $stateProvider.orderState = function(stateName, url, title, products) {
        return $stateProvider.state(stateName, {
            url: url + '?section?q?optionUrl',
            resolve: {
                currentStore: ['StoreService', function(StoreService) {
                    return StoreService.getCurrentStore().$promise;
                }],
                products: products,
                title: function() { return title; }
            },
            views: {
                'left': {
                    controller:'ProductListCtrl',
                    templateUrl: 'views/orders/productList.html',
                },
                'right@orders': {
                    controller:'ProductCtrl',
                    templateUrl:'views/orders/product.html',
                }
            },
        })
        .state(stateName+'.details', {
            url: '/:id',
        })
        .state(stateName+'.details.duplicate', {
            url: '/:duplicateId',
            data: {
                spinner:'productDetails'
            },
        });
    }

    $stateProvider.orderListState = function(stateName, url, title, data, orders) {
        return $stateProvider.state(stateName, {
            url: url,
            data: data,
            views: {
                'left': {
                    controller:'OrderListCtrl',
                    templateUrl: 'views/orders/orderList.html',
                    resolve: {
                        orders: orders,
                        title: function() { return title; }
                    }
                },
            },
        })
        .state(stateName+'.details', {
            url: '/:id',
            data: {
                forceReadOnly: true,
                spinner:'productDetails'
            },
            views: {
                'right@orders': {
                    controller:'ProductCtrl',
                    templateUrl:'views/orders/product.html',
                    resolve: {
                        product: ['Product', '$stateParams', function(Product, $stateParams) {
                            return Product.get({ id:$stateParams.id }).$promise;
                        }]
                    }
                }
            }
        });
    }



    //
    // Now set up the states
    $stateProvider

        //orders panel
        .state('orders', {
            url: '/orders',
            controller: 'OrdersCtrl',
            templateUrl: 'views/orders/orders.html',
            abstract:true,
        })

        .state('orders.new', {
            url: '/new?name&id&reprint&prototypeId',
            views: {
                'right@orders': {
                    controller:'ProductCtrl',
                    templateUrl:'views/orders/product.html',
                    resolve: {
                        products: [ function() { return [] } ]
                    }
                }
            },
            data: { leftPanelHidden:true }
        })
        .state('orders.create.from-template', {
            url: '/from-template?name',
            views: {
                'left@orders': {
                    controller:['products', '$scope', function(products, $scope) {
                        $scope.products = products;
                        $scope.cancel = function(event) {
                            event.preventDefault();
                            $state.go('orders.current');
                        }
                    }],
                    templateUrl: 'views/orders/templateList.html',
                    resolve: {
                        products: ['Product', function(Product) {
                            return Product.getMyProducts({favourite:true});
                        }],
                    }
                },
            },
        })

        .orderState('orders.current', '/current', 'Current Orders',
            ['Product', '$stateParams', function(Product, $stateParams) {
                return function (pageSize, pageIndex) {
                    return Product.getMyCurrentProducts({
                        q:$stateParams.q, 
                        pageSize:pageSize, 
                        pageIndex:pageIndex});
                }
            }]
        )

        .orderState('orders.production', '/production', 'Orders In Production',
            ['Product', '$stateParams', function(Product, $stateParams) {
                return function (pageSize, pageIndex) {
                    return Product.getMyProductionProducts({
                        q:$stateParams.q, 
                        pageSize:pageSize, 
                        pageIndex:pageIndex});
                }
            }]
        )

        .orderState('orders.completed', '/completed', 'Completed Orders',
            ['Product',  '$stateParams', function(Product, $stateParams) {
                return function (pageSize, pageIndex) {
                    return Product.getMyShippedProducts({
                        q:$stateParams.q, 
                        pageSize:pageSize, 
                        pageIndex:pageIndex});
                }
            }]
        )

        .state('orders.history', {
            url: '/history',
            views: {
                'left': {
                    controller:'OrderHistoryListCtrl',
                    templateUrl: 'views/orders/orderHistoryList.html',
                    resolve: {
                        user: ['User', function(User) {
                            return User.getCurrent().$promise;
                        }],
                        orders: ['Order', function(Order) {
                            return function(pageSize, pageIndex) {
                                return Order.getMyInProductionOrders();
                            }
                        }]
                    }
                },
            },
        })
        .state('orders.history.details', {
            url: '/:id',
            data: {
                forceReadOnly: true,
                spinner:'productDetails'
            },
            views: {
                'right@orders': {
                    controller:'OrderDetailsCtrl',
                    templateUrl:'views/orders/orderDetails.html',
                }
            }
        })

        .orderState('orders.search', '/search', 'Unassigned Jobs',
            ['Product', '$stateParams', function(Product, $stateParams) {
                return function loadProducts(pageSize, pageIndex) {

                    return Product.query({q:$stateParams.q, pageSize:pageSize, pageIndex:pageIndex});

                }
            }
        ])


}]);
