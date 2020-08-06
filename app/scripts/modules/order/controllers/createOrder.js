'use strict';

angular.module('pace.order')
.controller('CreateOrderCtrl', ['$scope', '$state', 'Product', '$location', '$stateParams', '$rootScope', '$timeout', 'MessageService',
    function ($scope, $state, Product, $location, $stateParams, $rootScope, $timeout, MessageService) {
        var favourities = Product.getMyProducts({favourite:true});
        $scope.enableFav = false;
        if (favourities.$promise) {
            favourities.$promise.then(function(value) {
                if (value && value.length>0)
                    $scope.enableFav = true;
            });
        }
        $scope.validating = false;

        $scope.createOrder = function() {
            
            $scope.validating = false;
            Product.getMyProducts({name:$scope.productName}, function(products) {
                $scope.validating = false;
                if (products.length>0) {
                    MessageService.show('This Project name currently exists please choose another name.', 'alert');
                } else {
                    $state.go($scope.nextState, { name:$scope.productName });   
                    $scope.closeThisDialog();
                }
            });
        }

        $scope.cancel = function(event) {
            event.preventDefault();
            $state.go('orders.current');
            $scope.closeThisDialog();
        }

    }]);
