'use strict';

angular.module('paceApp')
.directive('fileUploadPlaceholder', ['$parse', '$timeout', function ($parse, $timeout) {
    return {
        templateUrl: 'views/components/fileUploadPlaceholder.html',
        replace: true,
        restrict: 'E',
        require: 'form',
        scope: {},
        link: function postLink(scope, element, attrs, ctrl) {

            scope.dropBoxActive = false;
            scope.label = attrs.label;
            scope.dropboxCentered = attrs.dropboxCentered === 'true';
            scope.info = attrs.info;
            if (attrs.info)
                element.find('.drop-info').css({display: 'block'});

            var dropFn = $parse(attrs.onFilesDropped);

            var handleChange = function(e) {
                var evt = e.originalEvent;
                evt.stopPropagation();
                evt.preventDefault();

                scope.$apply(function() {
                    dropFn(scope.$parent, { files: e.target.files });
                });
            };
            
            var handleDrop = function(e) {
                var evt = e.originalEvent;
                evt.stopPropagation();
                evt.preventDefault();

                var dt = evt.dataTransfer;
                scope.$apply(function() {
                    scope.dropBoxActive = false; 
                    dropFn(scope.$parent, { files:dt.files });
                });
            };

            var handleDragOver = function(e) {
                var evt = e.originalEvent;
                evt.stopPropagation();
                evt.preventDefault();

                evt.dataTransfer.dropEffect = 'copy';

                scope.$apply(function() {
                    scope.dropBoxActive = true; 
                });
            };

            var handleDragLeave = function(e) {
                scope.$apply(function() {
                    scope.dropBoxActive = false; 
                });
            };

            var el = element.find('.drop-box');
            el.on('drop', handleDrop);
            el.on('dragover', handleDragOver);
            el.on('dragleave', handleDragLeave);

            var input = element.find('input[type="file"]');
            input.on('change', handleChange);

            element.find('.drop-browse a').on('click', function(e) {
                e.preventDefault();
                element.find('.drop-browse input').trigger('click');
            });
        }
    };
}]);
