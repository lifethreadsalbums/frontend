'use strict';

angular.module('paceApp')
.directive('hideFlexsliderArrows', ['MutationObserver', '$timeout', function (MutationObserver, $timeout) {
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        $timeout(function() {
                            if (element.find('.flex-direction-nav a.flex-disabled').length === 2) {
                                element.addClass('hideDirectionNav');
                            } else {
                                element.removeClass('hideDirectionNav');
                            }
                        });
                    }
                });    
            });
            var config = { attributes: false, childList: true, characterData: false, subtree: false};
            observer.observe(element[0], config);

            //clean up when the element is destroyed
            element.on('$destroy', function() {
                observer.disconnect();
            });
        }
    };
}]);
