'use strict';

angular.module('paceApp')
.directive('imageupload', ['FileSet', 'FileUploader', 'ImageUploadService', function (FileSet, FileUploader, ImageUploadService) {
    return {
        templateUrl: 'views/components/imageUpload.html',
        replace: true,
        restrict: 'E',
        scope: {
            data:'=',
        },
        link: function postLink(scope, element, attrs, ctrl) {

            scope.dropBoxActive = false;
            scope.label = attrs.label;

            
            scope.files = [];

            scope.select = function(file) {
                for (var i = 0; i < scope.files.length; i++) {
                    scope.files[i].selected = false;
                }
                file.selected = true;
            };

            scope.remove = function(e, file) {
                e.stopImmediatePropagation();

                var idx = scope.files.indexOf(file);
                if (idx>=0) {
                    scope.files.splice(idx, 1);
                    if (file.selected) {
                        if (idx>=scope.files.length)
                            idx--;
                        if (idx>=0)
                            scope.files[idx].selected = true;
                    }
                }
            };

            scope.handleDrop = function(e) {

                var evt = e.originalEvent;
                evt.stopPropagation();
                evt.preventDefault();

                var dt = evt.dataTransfer;
                var files = dt.files;

                scope.$apply(function() {

                    scope.data.imageFiles = scope.data.imageFiles.concat(ImageUploadService.uploadImages(files));
                    console.log('-------------------> ' + scope.data.imageFiles.length);
                    scope.dropBoxActive = false;
                });
            };

            scope.handleDragOver = function(e) {
                var evt = e.originalEvent;

                evt.stopPropagation();
                evt.preventDefault();
                evt.dataTransfer.dropEffect = 'copy';

                scope.$apply(function() {
                    scope.dropBoxActive = true; 
                });
            };

            scope.handleDragLeave = function(e) {
                scope.$apply(function() {
                    scope.dropBoxActive = false; 
                });
            };

            var el = element.find('.drop-box');
            el.on('drop', scope.handleDrop);
            el.on('dragover', scope.handleDragOver);
            el.on('dragleave', scope.handleDragLeave);

            element.find('.drop-browse a').on('click', function(e) {
                e.preventDefault();
                element.find('.drop-browse input').trigger('click');
            });
        }
    };
}]);
