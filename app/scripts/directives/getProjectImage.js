'use strict';

angular.module('paceApp')
    .directive('getProjectImage', ['$parse', '$timeout', 'Product', function ($parse, $timeout, Product) {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                project:'=',
                index: '@'
            },
            template: '<div class="image project-thumb" ng-style="{\'background-image\':\'url(\' + thumbUrl.url + \')\'}"><span ng-if="price" class="price">{{price}}</span></div>',
            link: function postLink(scope, element, attrs, ctrl) {
                scope.thumbUrl = Product.getThumbUrl({id: scope.project.id});

                if (scope.project.options.productType === 'custom_services') {
                    scope.thumbUrl = {url: '/images/cart-custom-services.png'};
                    scope.price = scope.project.subtotal.displayPrice;
                } else {
                    scope.thumbUrl = Product.getThumbUrl({id: scope.project.id});
                }
            }
        };
    }]);
