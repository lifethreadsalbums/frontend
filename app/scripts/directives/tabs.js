'use strict';

angular.module('paceApp').
directive('tabs', ['$compile', '$timeout', '$parse', '$rootScope', function($compile, $timeout, $parse, $rootScope) {

    var navContainer = '<ul class="nav-tabs {{tabClasses}}">' +
                            '<li ng-repeat="pane in panes">'+
                                '<a href="" class="button small {{pane.tabIconClass}} {{pane.tabCloseClass}} {{pane.tabSubactionClass}}" style="{{tabItemStyles}}" ng-class="{active:pane.selected}" ng-click="select(pane)"><span  ng-if="pane.title != \'Proofer\'">{{pane.title}}</span>' +
                                    '<span class="tab-sub-action-button tab-subaction-type-{{pane.tabSubactionType}}" ng-click="handleTabSubaction($event, pane)" ng-if="pane.tabSubactionType"><span class="tab-sub-action-button-icon"></span></span></span>' +
                                    '<span class="close" ng-click="handleCloseTab(pane)" ng-if="pane.tabCloseClass"></span>' +
                                    '<span class="badge medium inline" ng-hide="!pane.tabBadge" ng-click="pane.handleBadgeClick($event)">{{pane.tabBadge}}</span>' +
                                '</a>' +
                            '</li>'+
                        '</ul>';

    return {
        restrict: 'E',
        transclude: true,
        scope: {},
        require: "?ngModel",
        controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs, modelController) {

            var self = this,
                tabGapSide = ($attrs.gapSide) ? $attrs.gapSide : 0,
                tabGapBottom = ($attrs.gapBottom === "false") ? "" : " tab-gap-bottom",
                tabSize = ($attrs.size) ? ' tab-size-' + $attrs.size : '',
                tabColor = ($attrs.color) ? ' tab-color-' + $attrs.color : ' tab-color-default',
                tabRound = ' tab-no-round',
                tabPosition = ($attrs.position) ? ' tab-position-' + $attrs.position : '',
                tabNoLeftBorder = ($attrs.noLeftBorder === 'true') ? ' no-left-border' : '',
                tabItemStyles = 'margin-right:' + tabGapSide + ';',
                tabClasses = ' ',
                sliderName = $attrs.sliderName || null,
                initialSelectCompleted = false;

            if ($attrs.round === 'true') {
                tabRound = ' tab-round';
            } else if ($attrs.round === 'top') {
                tabRound = ' tab-round-top';
            }

            tabClasses += tabSize;
            tabClasses += tabColor;
            tabClasses += tabRound;
            tabClasses += tabGapBottom;
            tabClasses += tabPosition;
            tabClasses += tabNoLeftBorder;

            $scope.tabItemStyles = tabItemStyles;
            $scope.tabClasses = tabClasses;

            this.panes = $scope.panes = [];
            this.selectedIndex = -1;

            this.select = function(pane) {
                angular.forEach(this.panes, function(pane) {
                    pane.selected = false;
                });

                pane.selected = true;
                this.selectedIndex = this.panes.indexOf(pane);

                // TODO: Find different solution then timeout for initial refresh
                if (!initialSelectCompleted) {
                    setTimeout(function() {
                        self.refreshSlider();
                        initialSelectCompleted = true;
                    }, 300);
                }
            };

            this.addPane = function(pane) {
                this.panes.push(pane);

                if (this.selectedIndex===-1 && this.panes.length===1) this.select(pane);
                if (this.modelController && this.modelController.$viewValue===this.panes.length - 1) this.select(pane);

            };

            this.removePane = function(pane) {
                var idx = this.panes.indexOf(pane);
                if (idx >= 0) {
                    this.panes.splice(idx,1);
                    if (this.selectedIndex >= 0 && this.selectedIndex < this.panes.length)
                        this.select(this.panes[this.selectedIndex]);
                }
            };

            // Method sends event to refresh potential slider inside tab
            this.refreshSlider = function() {
                if (sliderName) {
                    $rootScope.$broadcast('refreshSlider', {
                        sliderName: sliderName
                    });
                }
            };
        }],
        controllerAs: "tabsController",
        link: function(scope, element, attrs, modelController) {
            var onTabClose = $parse(attrs.onTabClose);

            if (attrs.onTabSubaction) {
                var onTabSubaction = $parse(attrs.onTabSubaction);
            }

            if (attrs.onTabChange) {
                var onTabChange = $parse(attrs.onTabChange);
            }

            if (modelController) {
                scope.tabsController.modelController = modelController;
                modelController.$render = function() {
                    var index = modelController.$viewValue;
                    if (angular.isDefined(index) && index>=0 && index < scope.tabsController.panes.length &&
                        index !== scope.tabsController.selectedIndex) {
                        scope.tabsController.select(scope.tabsController.panes[index]);
                    }
                };
            }

            scope.select = function(pane) {
                scope.tabsController.select(pane);
                if (modelController)
                    modelController.$setViewValue(scope.tabsController.selectedIndex);

                if (onTabChange) {
                    var idx = scope.tabsController.panes.indexOf(pane);
                    onTabChange(scope.$parent, { index: idx });
                }
            };

            if (attrs.navContainer) {
                var el = angular.element(navContainer);
                $compile(el)(scope);
                $('#' + attrs.navContainer).prepend(el);
            }

            scope.handleCloseTab = function (pane) {
                var idx = scope.tabsController.panes.indexOf(pane);
                onTabClose(scope.$parent, { index: idx });
            };

            scope.handleTabSubaction = function ($event, pane) {
                $event.stopPropagation();
                $event.preventDefault();

                if (onTabSubaction) {
                    var idx = scope.tabsController.panes.indexOf(pane);
                    onTabSubaction(scope.$parent, { index: idx });
                }
            };

        },
        template: function(tElement, tAttrs) {

            return '<div class="tabs">' +
                (tAttrs.position || tAttrs.navContainer ? '' : navContainer) +
                '<div class="tab-content" ng-transclude></div>' +
                (tAttrs.position === 'bottom-left' && !tAttrs.navContainer ? navContainer : '') +
            '</div>';

        },

        replace: true
    };
}]).
directive('tab', ['$timeout', '$parse', function($timeout, $parse) {
    return {
        require: '^tabs',
        restrict: 'E',
        transclude: true,
        scope: {
            title: '@',
            tabBadge:'@',
            tabSubactionType:'@',
            onBadgeClick:'&'
        },
        link: function(scope, element, attrs, tabsCtrl) {
            scope.tabIconClass = (attrs.icon) ? "tab-icon tab-icon-" + attrs.icon  : "";
            scope.tabCloseClass = (attrs.close === "true") ? "tab-close" : "";
            scope.tabSubactionClass = scope.tabSubactionType ? 'tab-is-subaction' : '';

            scope.handleBadgeClick = function(e) {
                if (scope.onBadgeClick) {
                    scope.onBadgeClick({index: 122, $event:e});
                }
            }

            tabsCtrl.addPane(scope);

            element.on('$destroy', function() {
                scope.$evalAsync(function() {
                    tabsCtrl.removePane(scope);
                });
            });

            function transitionTab() {
                if (scope.selected) {
                    element[0].offsetWidth;
                    element.addClass('in');
                } else {
                    element.removeClass('in');
                }
            }

            $timeout(transitionTab);

            scope.$watch('selected', function(newVal, oldVal) {
                if (newVal !== oldVal) {
                    $timeout(transitionTab);
                }
            });
        },
        template:
            '<div title="" class="tab-pane is-fade" ng-class="{active: selected}" ng-transclude></div>',
        replace: true
    };
}]);
