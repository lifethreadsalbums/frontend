'use strict';

angular.module('pace.layout')
    .directive('layoutAutoScale', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            require: 'layoutRenderer',
            link: function postLink($scope, $element, $attrs, layoutRenderer) {

                var containerClass = '.' + ($attrs.layoutAutoScale || 'builder__content-primary-inner'),
                    $canvasWrap = $element.closest(containerClass),
                    $window = $(window);

                var autoScale = function() {
                    layoutRenderer.scaleToFit( {width:$canvasWrap.width(), height:$canvasWrap.height()} );
                    layoutRenderer.canvas.calcOffset();
                };

                $window.resize(autoScale);
                $timeout(autoScale);

                // Clean up when the element is destroyed
                $element.on('$destroy', function() {
                    $window.unbind('resize', autoScale);
                });

            }
        };
    }]);
