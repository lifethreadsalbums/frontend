'use strict';

angular.module('paceApp')
.constant('hoverPreviewSettings', {
    previewDelay: 150,
    resetDelay: 250
})
.directive('hoverPreview', ['$parse', 'hoverPreviewSettings', function ($parse, hoverPreviewSettings) {
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {
            
            var hoverPreview = $parse(attrs.hoverPreview).bind(null,scope),
                hoverReset = $parse(attrs.hoverReset).bind(null, scope),
                settings = hoverPreviewSettings;
            
            function onMouseEnter(e) {
                clearTimeout(settings.previewTimerId);
                clearTimeout(settings.resetTimerId);
                settings.previewTimerId = setTimeout(hoverPreview, settings.previewDelay);
            }

            function onMouseLeave(e) {
                clearTimeout(settings.resetTimerId);
                clearTimeout(settings.previewTimerId);
                settings.resetTimerId = setTimeout(hoverReset, settings.resetDelay);
            }

            element.on('mouseenter', onMouseEnter);
            element.on('mouseleave', onMouseLeave);

            //clean up when the element is destroyed
            element.on('$destroy', function() {
                element.off('mouseenter', onMouseEnter);
                element.off('mouseleave', onMouseLeave);
            });

        }
    };
}]);
