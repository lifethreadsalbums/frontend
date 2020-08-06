'use strict';

angular.module('pace.order')
.controller('OrdersCtrl', ['$scope','$stateParams', '$timeout', '$state', 'Product', '$location',
    '$rootScope', 'Order', '_', 'ngDialog', 'Batch', 'AuthService', 'LoginEvent',
    function ($scope, $stateParams, $timeout, $state, Product, $location,
        $rootScope, Order, _, ngDialog, Batch, AuthService, LoginEvent) {


        function countProducts(prop, count) {

            count.$promise.then(function(result) {
                $scope[prop] = result;
            });

        }

        var count = function() {

            var user = AuthService.getCurrentUser();
            if (!user) return;

            if (user.admin) {

                countProducts('batchCount', Batch.count());
                countProducts('currentBatchCount', Batch.getCurrentBatchItemCount());
                countProducts('orderCount',  Order.count());
                countProducts('unassignedCount', Product.count({state:'New'}));
                countProducts('readyToPrintProductCount', Product.count({state:'Printing'}));
                countProducts('shippedCount', Product.count({state:'Shipped'}));
                countProducts('completedCount', Product.count({state:'Completed'}));

            } else {
                $scope.productCount = Product.countMyCurrentProducts();
                $scope.completedOrdersCount = Product.countMyShippedProducts();
                $scope.inProductionOrders = Product.countMyProductionProducts();
            }

        }

        count();
        $scope.model =  { productListLoading: false };

        $scope.$on('product-saved', function(event, args) { args.isNew && count(); });
        $scope.$on('product-deleted', count);
        $scope.$on('products-moved', count);

        $scope.$on(LoginEvent.LoginSuccess, function() {
            count();
        });

        $scope.handleDrop = function(products, state) {

            var ids = _.pluck(products, 'id');
            Product.setState({productIds:ids, state:state}, function() {

                $rootScope.$broadcast('products-moved', products);
                count();

            }, function(error) {


            });

        };

        $scope.create = function() {
            // ngDialog.open({
            //     template: 'views/orders/create.html',
            //     className: 'pace-modal',
            //     controller: 'CreateOrderCtrl',
            // });
            $state.go('welcome');
        };

        $scope.search = function() {

            $state.go($state.current.name, {q:$scope.searchQuery});

        };



    }
]);
