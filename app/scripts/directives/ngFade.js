'use strict';
angular.module('paceApp')
    .directive('ngFade', ['$timeout', function($timeout) {
        return {
            restrict: 'A',
            scope: {
                ngFade: '='
            },
            link: function($scope, element, attrs) {
                var fadeDuration = attrs.ngFadeDuration || 1,
                    animationName = attrs.ngFadeName || 'fadeIn',
                    durationString = fadeDuration + 's';
                    
                var css = {
                    'opacity': '0',
                    '-webkit-animation': animationName + ' ease-in ' + fadeDuration,
                    '-moz-animation': animationName + ' ease-in ' + fadeDuration,
                    'animation': animationName + ' ease-in ' + fadeDuration,

                    '-webkit-animation-fill-mode': 'forwards',
                    '-moz-animation-fill-mode': 'forwards',
                    'animation-fill-mode': 'forwards',

                    '-webkit-animation-duration': durationString,
                    '-moz-animation-duration': durationString,
                    'animation-duration': durationString
                };

                $scope.$watch('ngFade', function (value) {
                    if (value) {
                        element.css(css);
                        $timeout(function() {
                            element[0].removeAttribute('style');
                        }, fadeDuration * 1000);
                    }
                });
            }
        };
    }
]);