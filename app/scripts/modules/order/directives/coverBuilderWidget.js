'use strict';

angular.module('pace.order')

.directive('coverBuilderWidget', ['BuildService', '$timeout', 'StoreConfig', 'MessageService', 'ProductService', '$state',
    function (BuildService, $timeout, StoreConfig, MessageService, ProductService, $state) {
        return {
            template: '<div style="width:100%;padding-right:16px"><span>{{optionLabel}}</span><button class="pull-right" ng-click="edit()">Edit</button></div>',
            replace: true,
            restrict: 'E',
            scope: { },
            link: function postLink($scope, $element, $attrs) {

                var product;

                $scope.edit = function() {
                    var optionUrl = $attrs.optionUrl,
                        sectionUrl = $attrs.sectionUrl,
                        optionCode = $attrs.optionCode;

                    var productId = product.id;
                    $state.go('build.section.option', { 
                        productId:productId, 
                        section:sectionUrl, 
                        optionUrl:optionUrl,
                        projects:true
                    });
                };

                $scope.$parent.$watch('model.product', function(value) {
                    product = value;
                    if (product) {
                        var viewModel = ProductService.getProductViewModel(product);
                        viewModel.$promise.then(function(val) {
                            var optionLabel = val.options[$attrs.optionCode];
                            $scope.optionLabel = optionLabel;
                        });
                    }
                });

                $scope.$on('option-enabled', function(args, optionCode) {
                    if (optionCode===$attrs.optionCode) {
                        $scope.edit();
                    }
                });
            }
        };
    }
]);
