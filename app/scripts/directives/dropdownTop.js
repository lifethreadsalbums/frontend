'use strict';

angular.module('paceApp')
.directive('dropdownTop', ['MutationObserver', function (MutationObserver) {
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {
            var offsetTop = (attrs.offsetTop) ? parseInt(attrs.offsetTop, 10) : 12,
                offsetLeft = (attrs.offsetLeft) ? parseInt(attrs.offsetLeft, 10) : 15;

            function positionDropdown() {
                if (element.hasClass('open')) {
                    var newTop = '-' + (element.outerHeight() + offsetTop) + 'px',
                        newLeft = (element.position().left - offsetLeft) + 'px';

                    element.css({
                        top: newTop,
                        left: newLeft
                    });
                }
            }
            positionDropdown();
            
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'class')
                        positionDropdown();
                });    
            });
            var config = { attributes: true, childList: true, characterData: true, subtree: true,  };
            observer.observe(element[0], config);

            //clean up when the element is destroyed
            element.on('$destroy', function() {
                observer.disconnect();
            });

        }
    };
}]);
