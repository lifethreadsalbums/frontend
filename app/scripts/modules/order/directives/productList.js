'use strict';

angular.module('pace.order')
    .directive('productList', ['$timeout', 'ProductListComponent',
        function ($timeout, ProductListComponent) {
        return {
            restrict: 'E',
            scope: {
                products: '=',
                selectedProducts: '=',
                loadNextPage: '=',
                canLoadNextPage: '=',
                jobs: '='
            },
            priority: 0,
            replace: true,
            template: '<div></div>',
            link: function postLink($scope, $element, $attrs) {

                var container = $element[0];

                var render = function (val, oldVal) {
                    //if (val===oldVal) return;

                    $timeout(function () {
                        var props = {
                            products: $scope.products,
                            selectedProducts: $scope.selectedProducts,
                            loadNextPage: $scope.loadNextPage,
                            canLoadNextPage: $scope.canLoadNextPage,
                            jobs: $scope.jobs,
                        };
                        var time = Date.now();
                        ReactDOM.render(React.createElement(ProductListComponent, props), container);
                        //console.log('Product list render', (Math.round(Date.now() - time)/1000)+' s');
                    });

                };

                $scope.$watchCollection('products', render);

                $scope.$watch('jobs', function(val, oldVal) {
                    render();
                }, true);

                $scope.$watch('selectedProducts', function(val, oldVal) {
                    if (val===oldVal) return;
                    render();
                });

                $scope.$watch('canLoadNextPage', function(val, oldVal) {
                    if (val===oldVal) return;
                    render();
                });

                // cleanup when scope is destroyed
                $scope.$on('$destroy', function () {
                    setTimeout(function() {
                        ReactDOM.unmountComponentAtNode(container);
                    }, 1000);
                });

            }
        };
    }]);
