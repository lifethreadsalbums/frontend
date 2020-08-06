'use strict';

angular.module('pace.layout')
.directive('centerizeQaFilmstrip', ['MutationObserver', function (MutationObserver) {
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {
            var $window = $(window);

            var observer = new MutationObserver(function(mutations) {
                resizeHandler();
            });

            var observerConfig = { attributes: true, childList: true, characterData: false, subtree: true },

            resizeHandler = function() {
                observer.disconnect();
                var filmstrip = element.find('#filmstrip');
                var filmstripWidth = filmstrip.width();
                var firstItem = filmstrip.find('li').first();
                var itemWidth = firstItem.outerWidth(true);
                var fitItems = Math.floor((filmstripWidth / itemWidth)) || 0;
                var leftOffset = (filmstripWidth - (fitItems * itemWidth)) / 2;

                filmstrip.css({left: leftOffset});
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
