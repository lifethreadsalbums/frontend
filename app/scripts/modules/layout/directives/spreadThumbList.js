'use strict';

angular.module('pace.layout')
    .directive('spreadThumbList', ['$timeout', 'SpreadThumbListComponent',
        function ($timeout, SpreadThumbListComponent) {
        return {
            restrict: 'E',
            scope: { 
                layout:'=',
                coverLayout:'=',
                coverLayouts:'=',
                layoutController:'=',
                thumbSize:'=',
                thumbScale:'=',
                selectedIndices:'=',
                autoCenter:'=?',
                pageType:'='
            },
            priority:0,
            link: function postLink($scope, $element, $attrs) {

                var container = $element.parent()[0];
                var render = function (val, oldVal) {
                    if (val===oldVal) return;

                    $timeout(function () {
                        var props = { 
                            layout: $scope.layout,
                            coverLayout: $scope.coverLayout,
                            coverLayouts: $scope.coverLayouts,
                            layoutController: $scope.layoutController,
                            thumbSize: $scope.thumbSize,
                            thumbScale: $scope.thumbScale,
                            selectedIndices: $scope.selectedIndices,
                            autoCenter: $scope.autoCenter,
                            pageType: $scope.pageType
                        };
                        ReactDOM.render(React.createElement(SpreadThumbListComponent, props), container);
                    });
                };

                var toWatch = ['layout', 'layout.spreads.length', 'thumbScale', 'selectedIndices.length'];
                _.each(toWatch, function (prop) {
                    $scope.$watch(prop, render, false);
                });

                render(true);

                // cleanup when scope is destroyed
                $scope.$on('$destroy', function () {

                    //delay unmounting to make sure it happens after transition
                    setTimeout(function() {
                        ReactDOM.unmountComponentAtNode(container);
                    }, 1000);
                    
                });
            }
        };
    }]);