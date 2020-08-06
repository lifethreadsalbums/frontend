'use strict';

angular.module('pace.layout')
    .directive('keypressHandler', ['$timeout', '$window', '$parse', 'KeyboardService', function ($timeout, $window, $parse, KeyboardService) {
        return {
            restrict: 'A',
            scope: {
                shortcut: '@',
                fn: '&keypressHandler',
                onKeyPressed: '='
            },
            link: function postLink($scope, $element, $attrs) {

                function onKeyPress(e) {
                    
                    var activeElement = $(document.activeElement),
                        isInputActive = (activeElement.is('input') || activeElement.is('textarea')),
                        key = KeyboardService.getShortcut(e),
                        triggerOnInput = $attrs.triggerOnInput==='true';

                    if($scope.onKeyPressed) $scope.onKeyPressed(e);

                    if ((!isInputActive || triggerOnInput) && $scope.shortcut===key) {
                        $scope.$apply($scope.fn);
                        e.preventDefault();
                    }
                }
            
                $window.addEventListener('keydown', onKeyPress);
                
                $element.on('$destroy', function() {
                    $window.removeEventListener('keydown', onKeyPress);
                });

            }
        };

    }]);