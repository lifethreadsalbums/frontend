'use strict';

angular.module('paceApp')
.directive('fileDrop', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {

            var dropFn = $parse(attrs.fileDrop);
            
            var handleDrop = function(e) {
                var evt = e.originalEvent,
                    dt = evt.dataTransfer;

                if (PACE.utils.containsDragType(dt.types, 'Files') &&
                    !PACE.utils.containsDragType(dt.types,'text/x-pace-filmstrip-items')) {
                    evt.stopPropagation();
                    evt.preventDefault();

                    scope.$apply(function() {
                        dropFn(scope, { files:dt.files });
                    });
                    element.removeClass('active');
                }
            };

            var handleDragOver = function(e) {
                var evt = e.originalEvent,
                    dt = evt.dataTransfer;

                if (PACE.utils.containsDragType(dt.types, 'Files') && 
                    !PACE.utils.containsDragType(dt.types,'text/x-pace-filmstrip-items')) {
                    evt.stopPropagation();
                    evt.preventDefault();

                    dt.dropEffect = 'copy';
                    element.addClass('active');
                }
            };

            var handleDragLeave = function(e) {
                element.removeClass('active');
            };

            element.on('drop', handleDrop);
            element.on('dragover', handleDragOver);
            element.on('dragleave', handleDragLeave);
        }
    };
}]);
