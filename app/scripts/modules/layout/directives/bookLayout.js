'use strict';

angular.module('pace.layout')
    .directive('bookLayout', ['$timeout', 'LayoutComponent',
        function ($timeout, LayoutComponent) {
        return {
            restrict: 'E',
            scope: { 
                layout:'=',
                coverLayouts:'=',
                layoutController:'=',
                product:'=',
                productPrototype:'=',
                editable:'='
            },
            priority: 0,
            replace: true,
            template: '<div class="book-layout"></div>',
            link: function postLink($scope, $element, $attrs) {

                var container = $element[0], //$element.parent()[0],
                    firstTime = true,
                    initialDelay = $attrs.delay ? parseInt($attrs.delay) : 0;

                var render = function (val, oldVal) {
                    if (val===oldVal) return;

                    setTimeout(function () {
                        var props = {
                            layout: $scope.layout,
                            coverLayouts: $scope.coverLayouts,
                            layoutController: $scope.layoutController,
                            product: $scope.product,
                            productPrototype: $scope.productPrototype,
                            topToolbar: $attrs.topToolbar,
                            bottomToolbar: $attrs.bottomToolbar,
                            horizontal: $attrs.horizontal==='true',
                            editable: $scope.editable
                        };
                        var time = Date.now();
                        ReactDOM.render(React.createElement(LayoutComponent, props), container);
                        //console.log('book render', $element.attr('id'), (Math.round(Date.now() - time)/1000)+' s');
                    }, firstTime ? initialDelay : 0);
                    firstTime = false;
                };

                var toWatch = ['layout', 'layout.spreads.length', 'editable'];
                _.each(toWatch, function (prop) {
                    $scope.$watch(prop, render, false);
                });

                render(true);

                // cleanup when scope is destroyed
                $scope.$on('$destroy', function () {
                    setTimeout(function() {
                        ReactDOM.unmountComponentAtNode(container);
                    }, 1000);
                });
                
            }
        };
    }]);