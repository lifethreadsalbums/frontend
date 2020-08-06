'use strict';

angular.module('paceApp')
.directive('foundationDropdown', [function() {
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {
            setTimeout(function() {
            
                var left, timeoutId;

                element
                    .on('opened.fndtn.dropdown', function () {
                        clearTimeout(timeoutId);
                        var dropdown = $(this);
                        left = dropdown.css('left');
                        dropdown.css('pointer-events', 'auto');
                    })
                    .on('closed.fndtn.dropdown', function() {
                        var dropdown = $(this);
                        dropdown.css('left', left).removeClass('open');
                        dropdown.css('pointer-events', 'none');
                        clearTimeout(timeoutId);
                        timeoutId = setTimeout(function() {
                            dropdown.css('left', '-99999px');
                        }, 750);
                    });

            });
        }
    };
}]);