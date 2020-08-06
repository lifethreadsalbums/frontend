'use strict';

angular.module('paceApp')
.directive('priceButton', ['Currency', '$state', 'LoginEvent', 'AuthService', 
    function (Currency, $state, LoginEvent, AuthService) {
    return {
        templateUrl: 'views/components/priceButton.html',
        replace: true,
        restrict: 'E',
        scope: {
            price: '=?'
        },
        link: {
            pre: function(scope ,element, attrs) {
                scope.color = attrs.color || '';
                scope.direction = attrs.direction || '';
                scope.frpNavView = attrs.frpNavView || null;
            },
            post: function postLink(scope, element, attrs) {
                scope.$watch('price', function(value) {
                    if (value) {
                        scope.displayPrice = value.displayPrice;
                        scope.currency = value.displayCurrency;
                    } else {
                        scope.displayPrice = Currency.zeroPrice.displayPrice;
                        scope.currency = Currency.zeroPrice.displayCurrency;
                    }

                    var currency = scope.currency || '';
                    scope.currencyOptions =  [
                        {
                            value: currency, 
                            label:'', 
                            labelPreIcon: 'currency-' + currency.toLowerCase()
                        }
                    ];

                });
            }
        }
    };
}]);
