'use strict';

angular.module('pace.order')
    .controller('OrderListCtrl', ['$scope', 'orders', 'title', '$state', '$location', '_',
        function ($scope, orders, title, $state, $location, _) {

            var extractProducts = function(orders) {
                var products = [];
                _.each(orders, function (order) {
                    _.each(order.orderItems, function (orderItem) {
                        products.push(orderItem.product);
                    });
                })
                return products;
            }

            $scope.orders = orders;
            $scope.products = extractProducts(orders);
            $scope.title = title;

            //TODO: find a better way to navigate to the first product
            if (!$state.params.id && $scope.products.length>0) {
                $state.go($state.current.name + '.details', {id:$scope.products[0].id});
            }
    }])
    .controller('OrderHistoryListCtrl', ['$scope', 'orders', '$state', '$location', '_', 'StoreConfig', 'user', 'AppConstants',
        function ($scope, orders, $state, $location, _, StoreConfig, user, AppConstants) {

            function onSelectionChange(params) {
                var selectedItems = params.selectedItems;
                if (selectedItems.length>0) {
                    var state = $state.current.name;
                    if (state.indexOf('.details')===-1)
                        state += '.details';

                    $state.go(state, { id: selectedItems[0].id });
                }
            }

            var dateFormat = AppConstants.DATE_FORMAT;

            if (user && user.admin && StoreConfig.adminUsers && StoreConfig.adminUsers.dateFormat) {
                dateFormat = StoreConfig.adminUsers.dateFormat;
            }

            $scope.orderListProps = {
                keyboardNav: true,
                items: orders,
                onSelectionChange: onSelectionChange,
                customOptions: {
                    dateFormat: dateFormat
                }
            };

    }])
    .controller('OrderDetailsCtrl', ['$scope', '$state', '$location', '_',
        function ($scope, $state, $location, _) {

            function getInvoiceUrl() {
                return apiUrl + 'invoice-' + $state.params.id;
            }

            $scope.invoiceUrl = getInvoiceUrl() + '.html';

            $scope.download = function() {
                window.open(getInvoiceUrl() + '.pdf', '_blank');
            };

    }]);
