'use strict';

angular.module('pace.adminOrders', [])
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

    var ALL_PRODUCT_STATES = ['Completed', 'Shipped','ReadyToShip','Bindery','Printed','Printing','Cancelled','Preflight','OnHold','New'];

    $stateProvider.adminOrdersState = function(stateName, url, orders, products, columns, statusDropdownItems, statuses) {
        var views =  {
            'right@adminOrders': {
                controller: 'AdminOrderListCtrl',
                controllerAs: 'orderListCtrl',
                templateUrl: 'views/adminOrders/adminOrderList.html',
            },
        };

        views['productDetails@'+stateName] = {
            controller:'AdminProductCtrl',
            templateUrl:'views/adminOrders/product.html'
        };

        return $stateProvider
            .state(stateName, {
                url: url,
                resolve: {
                    orders: orders,
                    columns: columns,
                    products: products,
                    currentBatch: ['Batch', function(Batch) {return Batch.getCurrentBatch().$promise} ],
                    statusDropdownItems: statusDropdownItems,
                    statuses: statuses,
                    currentStore: ['StoreService', function(StoreService) {
                        return StoreService.getCurrentStore().$promise;
                    }],
                    user: ['User', function(User) {
                        return User.getCurrent().$promise;
                    }],
                    userSettings: ['Settings', 'user', function(Settings, user) {
                        return Settings.getUserSettings(user.id);
                    }]
                },
                views: views,
                data: { leftPanelHidden: true }
            })
            .state(stateName + '.details', {
                url: '/:id',
            });
    }

    $stateProvider

        //admin projects panel
        .state('adminOrders', {
            url: '/admin/orders',
            controller: 'AdminOrdersCtrl',
            templateUrl: 'views/adminOrders/adminOrders.html',
            abstract:true,
        })

        .state('adminOrders.new', {
            url: '/new?name&id&reprint&prototypeId',
            views: {
                'right@adminOrders': {
                    controller:'ProductCtrl',
                    templateUrl:'views/orders/product.html',
                    resolve: {
                        products: [ function() { return [] } ]
                    }
                }
            },
            data: { leftPanelHidden:true }
        })

        .adminOrdersState('adminOrders.search', '/search?q',

            // ['Order', '$stateParams', function(Order, $stateParams) {
            //     return function(pageSize, pageIndex) {
            //         return Order.query({q:$stateParams.q, 
            //             productStates: ALL_PRODUCT_STATES,
            //             pageSize:pageSize, pageIndex:pageIndex});
            //     }
            // }],

            function() { return null; },

            ['Product', '$stateParams', function(Product, $stateParams) {
                return function(pageSize, pageIndex) {
                    return Product.query({
                        q:$stateParams.q, 
                        states: ALL_PRODUCT_STATES,
                        pageSize:pageSize, 
                        pageIndex:pageIndex
                    });
                }
            }],

            ['currentStore','StoreConfig', function(currentStore, StoreConfig) {
                return StoreConfig.adminOrders.orders;
            }],
            
            function() {
                return [
                    {id:'Preflight', label:'PREFLIGHT'},
                    {id:'Printing', label:'PRINTING'},
                    {id:'Bindery', label:'BINDERY'},
                    {id:'ReadyToShip', label:'READY TO SHIP'},
                    {id:'Completed', label:'COMPLETED'},
                    {id:'OnHold', label:'HOLD'},
                    {id:'Cancelled', label:'CANCEL'}
                ]
            },
            function() { return ALL_PRODUCT_STATES; }
        )

        .adminOrdersState('adminOrders.searchByDate', '/search/searchByDate?fromDate&toDate',

            function () {
                return null;
            },

            ['Product', '$stateParams', function (Product, $stateParams) {
                return function (pageSize, pageIndex) {
                    return Product.queryByDate({
                        fromDate: $stateParams.fromDate,
                        toDate: $stateParams.toDate,
                        states: ALL_PRODUCT_STATES,
                        pageSize: pageSize,
                        pageIndex: pageIndex
                    });
                }
            }],

            ['currentStore', 'StoreConfig', function (currentStore, StoreConfig) {
                return StoreConfig.adminOrders.orders;
            }],

            function () {
                return [
                    {id: 'Preflight', label: 'PREFLIGHT'},
                    {id: 'Printing', label: 'PRINTING'},
                    {id: 'Bindery', label: 'BINDERY'},
                    {id: 'ReadyToShip', label: 'READY TO SHIP'},
                    {id: 'Completed', label: 'COMPLETED'},
                    {id: 'OnHold', label: 'HOLD'},
                    {id: 'Cancelled', label: 'CANCEL'}
                ]
            },
            function () {
                return ALL_PRODUCT_STATES;
            }
        )


        .adminOrdersState('adminOrders.projects', '/projects?q',

            ['Product', 'Order', '$stateParams', function(Product, Order, $stateParams) {
                if (!$stateParams.q) return null;
                return function(pageSize, pageIndex) {
                    return Order.query({q:$stateParams.q, 
                        productStates: ALL_PRODUCT_STATES,
                        pageSize:pageSize, pageIndex:pageIndex});
                }
            }],

            ['Product', 'Order', '$stateParams', function(Product, Order, $stateParams) {
                if ($stateParams.q) return null;
                return function(pageSize, pageIndex) {
                    return Product.query({state:'New', 
                        q:$stateParams.q, 
                        pageSize:pageSize, 
                        pageIndex:pageIndex});
                }
            }],
            ['currentStore','StoreConfig', function(currentStore, StoreConfig) {
                return StoreConfig.adminOrders.projects;
            }],
            function() { return []; },
            function() { return ['New']; }
        )

        .adminOrdersState('adminOrders.orders', '/orders?q',

            ['Order', '$stateParams', function(Order, $stateParams) {
                return function (pageSize, pageIndex) {
                    var productStates = ['Preflight'];
                    if ($stateParams.q) productStates = ALL_PRODUCT_STATES;
                    
                    return Order.query({q:$stateParams.q, 
                        productStates: productStates,
                        pageSize:pageSize, pageIndex:pageIndex});
                }
            }],
            // products
            function() { return null; },

            // columns
            ['currentStore','StoreConfig', function(currentStore, StoreConfig) {
                return StoreConfig.adminOrders.orders;
            }],
            // statusDropdownItems
            function() {
                return [
                    {id:'Preflight', label:'PREFLIGHT'},
                    {id:'Printing', label:'PRINTING'},
                    {id:'ReadyToShip', label:'READY TO SHIP'},
                    {id:'OnHold', label:'HOLD'},
                    {id:'Cancelled', label:'CANCEL'}
                ]
            },
            // statuses
            function() {
                return ['Preflight'];
            }
        )

        .adminOrdersState('adminOrders.currentBatch', '/print?q',

            ['Order', '$stateParams', function(Order, $stateParams) {
                return function (pageSize, pageIndex) {
                    var productStates = ['Printing', 'Printed', 'Bindery'];
                    if ($stateParams.q) productStates = ALL_PRODUCT_STATES;
                    
                    return Order.query({q:$stateParams.q, 
                        productStates: productStates, 
                        pageSize:pageSize, pageIndex:pageIndex});
                }
            }],
            function() { return null; },
            ['currentStore','StoreConfig', function(currentStore, StoreConfig) {
                return StoreConfig.adminOrders.currentBatch;
            }],
            /*
            function() {
                return [
                    { field: 'productStatus', header:'Status' },
                    { field: 'orderDate', header:'Ordered' },
                    { field: 'currentBatchId', header:'Batch ID' },
                    { field: 'orderId', header:'Order ID' },
                    { field: 'user', header: 'User' },
                    { optionCode: '_name', header: 'Project' },
                    { optionCode: 'productType', header: 'Product Type' },
                    { optionCode: '_productPrototype', header: 'Product Line' },
                    { optionCode: 'size', header: 'Shape' },
                    { optionCode: 'bookMaterial', header: 'Material' },
                    { optionCode: 'paperType', header: 'Paper' },
                    { optionCode: '_quantity', header: 'Sets' },
                    { optionCode: '_pageCount', header: 'Pages' },
                    {
                        expression: 'data.product.options._pageCount>0 ? data.product.options._pageCount * data.product.options._quantity : ""',
                        header: 'Total Pages'
                    },
                    { expression:"data.product && data.product.options.size ? '100%' : ''", header: 'Scale' },
                    { expression:'ctx.irisSheets(data.product)', header: 'Sheets' },
                    {
                        optionCode: 'rate',
                        header: 'Rate',
                        editable: true,
                        editor: 'dropdown',
                        expression:'ctx.formatIrisRate(ctx.irisRate(data.product))'
                    },
                    {
                        expression:'ctx.formatMoney( ctx.irisRate(data.product) * ctx.irisSheets(data.product) )',
                        header: 'Total'
                    },
                    { field: 'attachments', header:'Files' },
                    { field: 'jobProgress', header: 'Progress' },
                ]
            },
            */
            function() {
                return [
                    {id:'Preflight', label:'BACK TO ORDERS'},
                    {id:'Printing', label:'PRINTING'},
                    {id:'Bindery', label:'BINDERY'},
                    {id:'ReadyToShip', label:'READY TO SHIP'},
                    {id:'OnHold', label:'HOLD'},
                    {id:'Cancelled', label:'CANCEL'}
                ]
            },
            function() {
                return ['Printing', 'Printed', 'Bindery'];
            }
        )

        .adminOrdersState('adminOrders.shipped', '/shipped?q',

            ['Order', '$stateParams', function(Order, $stateParams) {
                return function (pageSize, pageIndex) {
                    var productStates = ['Shipped', 'ReadyToShip'];
                    if ($stateParams.q) productStates = ALL_PRODUCT_STATES;
                    return Order.query({q:$stateParams.q, 
                        productStates: productStates, 
                        pageSize:pageSize, pageIndex:pageIndex});
                }
            }],
            function() { return null; },
            ['currentStore','StoreConfig', function(currentStore, StoreConfig) {
                return StoreConfig.adminOrders.shipped;
            }],
            /*
            function() {
                return [
                    { field: 'productStatus', header:'Status' },
                    { field: 'orderDate', header:'Ordered' },
                    { field: 'batchId', header:'Batch ID' },
                    { field: 'orderId', header:'Order ID' },
                    { optionCode: 'carrier', header:'Carrier', editable:true, editor:'dropdown' },
                    { optionCode: 'trackingId', header:'Tracking ID', editable:true, editor:'text' },
                    { optionCode: 'dateShipped', header:'Shipped', editable:true, editor:'date' },
                    { optionCode: 'dateDelivered', header:'Delivered', editable:true, editor:'date' },
                    { optionCode: '_quantity', header: 'Qty' },
                    { field: 'user', header: 'User' },
                    { field: 'company', header: 'Company' },
                    { optionCode: '_name', header: 'Project' },
                    { optionCode: 'productType', header: 'Product Type' },
                    { optionCode: '_productPrototype', header: 'Product Line' },
                    { optionCode: 'size', header: 'Shape' },
                    { optionCode: 'bookMaterial', header: 'Material' },
                    { field: 'studioSample', header: 'Sample' },
                    { field: 'productDate', header: 'Created' },
                    { field: 'price', header: 'Price' },
                    { field: 'currency', header: '$' },
                    { field: 'orderState', header:'Payment' },
                    { field: 'jobProgress', header: 'Progress' }
                ]
            },
            */
            function() {
                return [
                    {id:'Printing', label:'BACK TO PRINT'},
                    {id:'ReadyToShip', label:'READY TO SHIP'},
                    {id:'Shipped', label:'SHIPPED'},
                    {id:'Completed', label:'COMPLETED'},
                    {id:'OnHold', label:'HOLD'},
                    {id:'Cancelled', label:'CANCEL'}
                ]
            },
            function() {
                return ['Shipped', 'ReadyToShip'];
            }

        )
        .adminOrdersState('adminOrders.completed', '/completed?q',

            ['Order', '$stateParams', function(Order, $stateParams) {
                return function (pageSize, pageIndex) {
                    var productStates = ['Completed', 'Cancelled'];
                    if ($stateParams.q) productStates = ALL_PRODUCT_STATES;
                    
                    return Order.query({q:$stateParams.q, 
                        productStates: productStates,
                        pageSize:pageSize, pageIndex:pageIndex});
                }
            }],
            function() { return null; },
            ['currentStore','StoreConfig', function(currentStore, StoreConfig) {
                return StoreConfig.adminOrders.completed;
            }],
            function() {
                return [
                    {id:'Shipped', label:'BACK TO SHIPPED'},
                    {id:'Completed', label:'COMPLETED'},
                    {id:'OnHold', label:'HOLD'},
                    {id:'Cancelled', label:'CANCEL'}
                ]
            },
            function() {
                return ['Completed', 'Cancelled'];
            }
        )

        .state('adminOrders.history', {
            url: '/history?q',
            views: {
                'left': {
                    controller:'OrderHistoryListCtrl',
                    templateUrl: 'views/orders/orderHistoryList.html',
                    resolve: {
                        currentStore: ['StoreService', function(StoreService) {
                            return StoreService.getCurrentStore().$promise;
                        }],
                        user: ['User', function(User) {
                            return User.getCurrent().$promise;
                        }],
                        orders: ['Order', '$stateParams', function(Order, $stateParams) {
                            return function(pageSize, pageIndex) {
                                return Order.query({q:$stateParams.q, 
                                    orderStates:['PaymentComplete', 'Shipped', 'Completed'], 
                                    pageSize:pageSize, pageIndex:pageIndex});
                            }
                        }]
                    }
                },
            },
        })
        .state('adminOrders.history.details', {
            url: '/:id',
            data: {
                forceReadOnly: true,
                spinner:'productDetails'
            },
            views: {
                'right@adminOrders': {
                    controller:'OrderDetailsCtrl',
                    templateUrl:'views/orders/orderDetails.html',
                }
            }
        })

        .state('adminOrders.historyByDate', {
            url: '/historyByDate?fromDate&toDate',
            views: {
                'left': {
                    controller: 'OrderHistoryListCtrl',
                    templateUrl: 'views/orders/orderHistoryList.html',
                    resolve: {
                        currentStore: ['StoreService', function (StoreService) {
                            return StoreService.getCurrentStore().$promise;
                        }],
                        user: ['User', function (User) {
                            return User.getCurrent().$promise;
                        }],
                        orders: ['Order', '$stateParams', function (Order, $stateParams) {
                            return function (pageSize, pageIndex) {
                                return Order.queryByDate({
                                    fromDate: $stateParams.fromDate,
                                    toDate: $stateParams.toDate,
                                    orderStates: ['PaymentComplete', 'Shipped', 'Completed'],
                                    pageSize: pageSize, pageIndex: pageIndex
                                });
                            }
                        }]
                    }
                },
            },
        })

}]);
