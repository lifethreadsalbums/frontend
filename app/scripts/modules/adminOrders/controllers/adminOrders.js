'use strict';

angular.module('pace.adminOrders')
.controller('AdminOrdersCtrl', ['$scope','$stateParams', '$timeout', '$state', 'Product', '$location',
    '$rootScope', 'Order', '_', 'ngDialog', 'Batch', 'AuthService', 'LoginEvent',
    'NotificationEvent',
    function ($scope, $stateParams, $timeout, $state, Product, $location,
        $rootScope, Order, _, ngDialog, Batch, AuthService, LoginEvent,
        NotificationEvent) {


        function countProducts(prop, count) {

            count.$promise.then(function(result) {
                $scope[prop] = result;
            });

        }

        function count() {
            countProducts('printedCount', Product.count({states:['Printing', 'Printed', 'Bindery']}));
            countProducts('orderCount',  Order.count());
            countProducts('unassignedCount', Product.count({state:'New'}));
            countProducts('readyToPrintProductCount', Product.count({states:['Preflight']}));
            countProducts('shippedCount', Product.count({states:['Shipped', 'ReadyToShip']}));
            countProducts('completedCount', Product.count({states:['Completed', 'Cancelled']}));
        }

        count();

        $scope.$on('product-saved', function(event, args) { args.isNew && count(); });
        $scope.$on('product-deleted', count);
        $scope.$on('products-moved', count);

        $scope.$on(LoginEvent.LoginSuccess, function() {
            count();
        });

        $scope.$on(NotificationEvent.NotificationReceived, function(event, notification) {
            if (notification.type==='OrderCreated' ||
                notification.type==='ProductStateChanged' ||
                notification.type==='BatchSentToPrint') {
                count();
            }
        });

        $scope.count = count;
        $scope.model = {
            fromDate: '',
            toDate: '',
            isSearchByDate: false
        };

        $scope.handleDrop = function(products, state) {

            var ids = _.pluck(products, 'id');
            Product.setState({productIds:ids, state:state}, function() {

                $rootScope.$broadcast('products-moved', products);

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

        var stateBeforeSearch;
        $scope.search = function() {
            if ($scope.searchQuery && $scope.searchQuery.length>0) {
                stateBeforeSearch = $state.includes('adminOrders.search') ? null : $state.current.name;
                if ($state.includes('adminOrders.history')) {
                    $state.go($state.current.name, {q:$scope.searchQuery});
                } else {
                    $state.go('adminOrders.search', {q:$scope.searchQuery});
                }
            } else {
                if (stateBeforeSearch) {
                    stateBeforeSearch = stateBeforeSearch.replace('.details','');
                }
                $state.go(stateBeforeSearch || 'adminOrders.orders', {q:null});
            }
        };

        var stateBefore;
        $scope.searchByDate = function () {
            if ($scope.model.fromDate && $scope.model.fromDate.length > 0 && $scope.model.toDate && $scope.model.toDate.length > 0) {
                stateBefore = $state.includes('adminOrders.searchByDate') ? null : $state.current.name;
                if ($state.includes('adminOrders.history')) {
                    $state.go('adminOrders.historyByDate', {
                        fromDate: $scope.model.fromDate,
                        toDate: $scope.model.toDate
                    });
                } else {
                    $state.go('adminOrders.searchByDate', {
                        fromDate: $scope.model.fromDate,
                        toDate: $scope.model.toDate
                    });
                }
            } else {
                if (stateBefore) {
                    stateBefore = stateBefore.replace('.details', '');
                }
                $state.go(stateBefore || 'adminOrders.orders', {fromDate: null, toDate: null});
            }
        };

        $scope.clearDates = function () {
            $scope.model.fromDate = '';
            $scope.model.toDate = '';
            $scope.searchByDate();
        };

        $scope.searchQuery = $state.params.q;
        $scope.model.fromDate = $state.params.fromDate;
        $scope.model.toDate = $state.params.toDate;

        $scope.$on('$stateChangeSuccess',
            function(event, toState, toParams, fromState, fromParams) {
                $scope.searchQuery = toParams.q;
            }
        );

        $scope.onKeyUp = function(e) {
            if (e.keyCode===27) {
                $scope.searchQuery = '';
                $scope.search();
            }
        }

        $scope.backToSearch = function() {
            $scope.model.isSearchByDate = false;
        };


    }
]);
