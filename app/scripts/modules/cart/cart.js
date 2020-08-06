'use strict';

angular.module('pace.cart', [])
.config(['$stateProvider', function($stateProvider) {

    //------------- set up cart pages --------------
    $stateProvider
        .state('checkout', {
            url: '/checkout',
            templateUrl: 'views/cart/checkout.html',
            abstract: true,
            controller: 'CheckoutCtrl',
            resolve: {
                currentStore: ['StoreService', function(StoreService) {
                    return StoreService.getCurrentStore().$promise;
                }],
                cart: ['Cart', function(Cart) {
                    return Cart.get().$promise;
                }],
                userOrders: ['Order', function(Order) {
                    return Order.getMyInProductionOrders().$promise;
                }]
            }
        })
        .state('checkout.cart', {
            url: '/cart',
            templateUrl: 'views/cart/cart.html',
            data: { nextState: 'checkout.addressDetails' }
        })
        .state('checkout.details', {
            url: '/details',
            templateUrl: 'views/cart/cart.html',
            data: { nextState: 'checkout.addressDetails' }
        })
        .state('checkout.addressDetails', {
            url: '/addressDetails',
            templateUrl: 'views/cart/addressDetails.html',
            data: { nextState: 'checkout.shipping' }
        })
        .state('checkout.shipping', {
            url: '/shipping',
            templateUrl: 'views/cart/shipping.html',
            data: { nextState: 'checkout.orderSummary' }
        })
        .state('checkout.orderSummary', {
            url: '/orderSummary',
            templateUrl: 'views/cart/orderSummary.html',
            data: { nextState: 'checkout.payment' }
        })
        .state('paymentError', {
            url: '/paymentError',
            templateUrl: 'views/cart/paymentError.html',
            controller: 'PaymentErrorCtrl'
        })
        .state('paymentComplete', {
            url: '/paymentComplete',
            templateUrl: 'views/cart/paymentComplete.html',
            controller: 'CheckoutCtrl'
        });

}]);
