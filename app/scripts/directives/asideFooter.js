'use strict';

angular.module('paceApp')
.directive('asideFooter', ['MutationObserver', function (MutationObserver) {
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {

            var footer = element;
            var contentDiv = footer.prev();
            var aside = footer.parents('aside');
            var $window = $(window);

            function positionLeftPanelFooter() {
                if ((aside.height() - contentDiv.outerHeight()) < footer.outerHeight() + 60) {
                    footer.addClass('relative');
                } else {
                    footer.removeClass('relative');
                }
            }
            positionLeftPanelFooter();

            var resizeHandler = function() {
                positionLeftPanelFooter();
            };
            $window.resize(resizeHandler);

            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    positionLeftPanelFooter();
                });
            });
            var config = { attributes: true, childList: true, characterData: true, subtree: true };
            observer.observe(contentDiv[0], config);

            //clean up when the element is destroyed
            element.on('$destroy', function() {
                $window.unbind('resize', resizeHandler);
                observer.disconnect();
            });
        }
    };
}]);
