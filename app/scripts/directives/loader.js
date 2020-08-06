'use strict';

angular.module('paceApp')
    .directive('loader', ['$rootScope', function ($rootScope) {
        return {
            replace: true,
            restrict: 'E',
            scope: true,
            link: function postLink(scope, element, attrs, ctrl) {
                var counter = 0,
                    loaderId = attrs.loaderId;

                var loaderRun = $rootScope.$on('loader-run', function(e, data) {
                    if (loaderId !== data.loaderId)
                        return;
    
                    var loaderColor = attrs.color || '#4d4d4d',
                        loaderOptions = {
                            lines: data.lines || 8,
                            length: data.length || 1,
                            width: data.width || 4,
                            radius: data.radius || 4,
                        };

                    if ( ! $.isNumeric(counter) || counter < 0)
                        counter = 0;

                    counter++;

                    if (counter === 1)
                        element.spin(loaderOptions, loaderColor);
                });

                var loaderStop = $rootScope.$on('loader-stop', function(e, data) {
                    if (loaderId !== data.loaderId)
                        return;

                    if ( ! $.isNumeric(counter) || counter < 1)
                        counter = 1;

                    counter--; 

                    if (counter < 1)
                        element.spin(false);
                });

                scope.$on('$destroy', function() {
                    loaderRun();
                    loaderStop();
                });
            },
            template: function() {
                return '<span class="loader"></span>';
            }
        };
    }])

    .directive('loaderRun', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                element.on('click', function(e) {
                    e.preventDefault();

                    $rootScope.$broadcast('loader-run', {
                        loaderId: attrs.loaderId
                    });
                });

                element.on('$destroy', function() {
                    element.unbind('click');
                });
            }
        };
    }])

    .directive('loaderStop', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                element.on('click', function(e) {
                    e.preventDefault();

                    $rootScope.$broadcast('loader-stop', {
                        loaderId: attrs.loaderId
                    });
                });

                element.on('$destroy', function() {
                    element.unbind('click');
                });
            }
        };
    }]);