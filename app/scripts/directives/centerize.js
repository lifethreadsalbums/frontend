'use strict';

angular.module('paceApp')
.directive('centerize', ['MutationObserver', function (MutationObserver) {
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {
            element.addClass('centerize');

            var $window = $(window),
                parent = element.parent(),

            observer = new MutationObserver(function(mutations) {
                resizeHandler();
            }),
            observerConfig = { attributes: true, childList: true, characterData: false, subtree: true },

            resizeHandler = function() {
                observer.disconnect();
                var itemWidth = element.children().first().outerWidth(true),
                    fitItems = Math.floor((parent.width() / itemWidth)) || 0;

                element.width(fitItems * itemWidth);
                observer.observe(element[0], observerConfig);
            };

            $window.resize(resizeHandler);
            setTimeout(function() {
                resizeHandler();
            });

            //clean up when the element is destroyed
            element.on('$destroy', function() {
                $window.unbind('resize', resizeHandler);
                observer.disconnect();
            });
        }
    };
}]);
