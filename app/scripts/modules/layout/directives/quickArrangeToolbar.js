'use strict';

angular.module('pace.layout')
    .directive('quickArrangeToolbar', [ function () {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                layoutController: '=',
                layout: '=',
                product: '=',
                productPrototype: '=',
                layoutVisible: '='
            },
            link: function postLink($scope, $element, $attrs) {
                var layoutController = $scope.layoutController;

                $scope.currentPage = 1;

                function isSpreadBased() {
                    return $scope.productPrototype.productPageType==='SpreadBased';
                }

                function clampSpreadIndex(spreadIndex) {
                    if (spreadIndex<0)
                        spreadIndex = 0;
                    if (spreadIndex>=$scope.layout.spreads.length)
                        spreadIndex = $scope.layout.spreads.length - 1;
                    return spreadIndex;
                }

                function updateSelectionInfo() {
                    if (!layoutController.currentRenderer) {
                        $scope.currentPage = 1;
                        return;
                    }
                    var layout = $scope.layout,
                        lps = layout.lps;

                    var currentSpread = layoutController.currentRenderer.spread,
                        spreadIndex = layout.spreads.indexOf(currentSpread);

                    $scope.currentPage = Math.max(1, isSpreadBased() ? spreadIndex + 1 : currentSpread.pageNumber);
                    if ($scope.layout.spreads.length===0) $scope.currentPage = '';


                    $scope.pageCount = isSpreadBased() ? (layout.spreads.length) : ((layout.spreads.length - (lps ? 0 : 1)) * 2);
                    $scope.numPages = '/ ' + $scope.pageCount;
                }

                //$scope.$on('layout:selection-cleared', updateSelectionInfo);
                //$scope.$on('layout:selection-changed', updateSelectionInfo);
                //$scope.$on('layout:selection-modified', updateSelectionInfo);
                $scope.$on('layout:current-renderer-changed', updateSelectionInfo);

                $scope.$on('layout:layout-loading', function() {
                    $scope.currentPage = '';
                    $scope.numPages = '';
                });

                $scope.$on('layout:layout-loaded', updateSelectionInfo);

                $scope.currentPageChanged = function() {
                    var spread, pageIndex, spreadIndex,
                        lps = $scope.layout.lps;

                    if ($scope.currentPage === '') {
                        return;
                    }

                    pageIndex = $scope.currentPage - 1;

                    if (isSpreadBased()) {
                        spreadIndex = clampSpreadIndex(pageIndex);
                        spread = $scope.layout.spreads[spreadIndex];
                        $scope.currentPage = spreadIndex + 1;
                    } else {
                        spreadIndex = clampSpreadIndex( lps ? Math.floor(pageIndex/2) : Math.floor((pageIndex+1)/2) );
                        spread = $scope.layout.spreads[spreadIndex];
                        $scope.currentPage = spread.pageNumber;
                    }

                    var r = _.findWhere(layoutController.renderers, {spread:spread});
                    layoutController.setCurrentRenderer(r);
                    r.makeFirstVisible();
                };

                $scope.setPageNumber = function(num) {
                    $scope.currentPage = num;
                    $scope.currentPageChanged();
                };

                $scope.step = function(step) {
                    var idx = Math.max(0,
                        Math.min(
                            layoutController.renderers.indexOf(layoutController.currentRenderer) + step,
                            layoutController.renderers.length - 1
                        )
                    );
                    var r = layoutController.renderers[idx];
                    layoutController.setCurrentRenderer(r);
                    r.makeFirstVisible();
                };

                $scope.$watchCollection('layout.spreads', function(value, oldValue) {
                    if (!$scope.layoutVisible) return;

                    var layout = $scope.layout,
                        lps = layout.lps;

                    $scope.pageCount = isSpreadBased() ? (layout.spreads.length) : ((layout.spreads.length - (lps ? 0 : 1)) * 2);
                    $scope.numPages = '/ ' + $scope.pageCount;
                    if (layout.spreads.length===0) $scope.numPages = '';
                });

                $element.find('.pagination-current').on('keydown', onKeyDown);

                function onKeyDown(event) {
                    var keyCode = event.keyCode;
                    var keyCodes = [8,9,13,37,39,46,48,49,50,51,52,53,54,55,56,57,96,97,98,99,100,101,102,103,104,105];

                    if (keyCodes.indexOf(keyCode) === -1 || event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) {
                        event.stopPropagation();
                        event.preventDefault();
                    }
                }

                $scope.onFocus = function() {
                    $scope.currentPage = '';
                }
            },
            template: function (elem, attrs) {
                return '<div class="pagination-toolbar">' +

                    '<div class="designer-pagination designer-pagination-' + (attrs.vertical==='true' ? 'vertical' : 'horizontal') + '">' +
                        '<span class="pagination-first" ng-click="step(-10000)" ng-disabled="currentPage==1"></span>' +
                        '<span class="pagination-prev" ng-click="step(-1)" ng-disabled="currentPage==1"></span>' +
                        '<span class="pagination-pages">' +
                            '<input type="text" class="pagination-current" min="1" step="2" ng-model="currentPage" ng-change="currentPageChanged()" ng-focus="onFocus()">' +
                            '<span class="pagination-total">{{numPages}}</span>' +
                        '</span>' +
                        '<span class="pagination-next" ng-click="step(1)" ng-disabled="currentPage==pageCount"></span>' +
                        '<span class="pagination-last" ng-click="step(10000)" ng-disabled="currentPage==pageCount"></span>' +
                    '</div>' +
                '</div>';
            }
        };
    }]);
