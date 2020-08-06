'use strict';

angular.module('paceApp')
    .directive('frp', ['$rootScope', '$compile', '$http', '$templateCache', function ($rootScope, $compile, $http, $templateCache) {
        return {
            template:   '<ng-form novalidate class="frp direction-{{direction}} {{fullWidth}} {{fullHeight}} {{customClass}}">'+
                            '<div class="frp-overlay"></div>' +
                            '<div class="frp-content ng-animate-enabled" ng-include="viewPanel"></div>' +
                        '</ng-form>',
            restrict: 'E',
            replace: true,
            require: 'form',
            link: function postLink($scope, $element, $attrs, $ctrl) {
                $scope.direction = 'right';
                $scope.fullWidth = '';
                $scope.fullHeight = '';
                $scope.customClass = '';

                var overlay = $element.find('.frp-overlay');

                var frpNavClick = $rootScope.$on('frp-nav-click', function(e, data) {
                    if ($scope.viewPanel === data.view)
                        changePanel();
                    else
                        changePanel(data.view, data.modal, data.direction, data.fullWidth, data.fullHeight, data.customClass);
                });

                var frpClose = $rootScope.$on('frp-close', function() {
                    changePanel(null);
                });

                $scope.$on('$destroy', function() {
                    frpNavClick();
                    frpClose();
                });

                function changePanel(view, modal, direction, fullWidth, fullHeight, customClass) {

                    if (modal === "true") {
                        overlay.show(0, function() {
                            overlay.css({opacity: 1});
                        });
                    } else {
                        overlay.css({opacity: 0});
                        setTimeout(function() {
                            overlay.hide();
                        }, 500);
                    }

                    if (direction) {
                        $scope.direction = direction;
                    }

                    if (fullWidth) {
                        $scope.fullWidth = 'full-width';
                    }

                    if (fullHeight) {
                        $scope.fullHeight = 'full-height';
                    }

                    if (customClass) {
                        $scope.customClass = customClass;
                    }

                    $scope.viewPanel = view;

                }
            }
        };
    }]);

angular.module('paceApp')
    .directive('frpNav', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            link: function postLink($scope, $element, $attrs) {
                $element.on('click', function(e) {
                    e.preventDefault();

                    $scope.$apply(function() {
                        $rootScope.$broadcast('frp-nav-click', {
                            view: $attrs.view,
                            modal: $attrs.modal,
                            direction: $attrs.direction || 'right',
                            fullWidth: $attrs.fullWidth === "true" || '',
                            fullHeight: $attrs.fullHeight === "true" || ''
                        });
                    });
                });

                $element.on('$destroy', function() {
                    $element.unbind('click');
                });
            }
        };
    }]);

angular.module('paceApp')
    .directive('frpClose', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            link: function postLink($scope, $element, $attrs) {
                var overlay = $element.find('.frp-overlay');

                $element.on('click', function(e) {
                    e.preventDefault();

                    $scope.$apply(function() {
                        $rootScope.$broadcast('frp-close');
                    });
                });

                $element.on('$destroy', function() {
                    $element.unbind('click');
                });
            }
        };
    }]);
