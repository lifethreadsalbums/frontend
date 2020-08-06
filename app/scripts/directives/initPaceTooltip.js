'use strict';

angular.module('paceApp')
    .directive('initPaceTooltip', ['$timeout', 'PaceTooltipService', function ($timeout, PaceTooltipService) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                init();

                element.on('$destroy', clearEvents);

                function init() {
                    PaceTooltipService.start(element);
                }

                function clearEvents() {
                    PaceTooltipService.stop(element);
                }
            }
        };
    }]);
