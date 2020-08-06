'use strict';

angular.module('paceApp')
.directive('fileupload', ['FileSet', 'FileUploader', 'ImageReader', function (FileSet, FileUploader, ImageReader) {
    return {
        templateUrl: 'views/components/fileUpload.html',
        replace: true,
        restrict: 'E',
        require: 'form',
        scope: {
            product:"=product",
            optionCode:"@"
        },
        link: function postLink(scope, element, attrs, ctrl) {

            scope.dropBoxActive = false;
            scope.label = attrs.label;

            if (attrs.dropboxCentered === "true")
                scope.dropboxCentered = true;

            scope.info = attrs.info;
            if (attrs.info)
                element.find('.drop-info').css({display: 'block'});
            
            scope.fileSet = FileSet.getByCode({code:attrs.optionCode});
            scope.files = [];

            //  [
            //     { name:"Die1.jpg", selected:true },
            //     { name:"Die2.jpg" }
            // ]

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

                    var progressCallback = function(fileInfo) {
                        return function(progress) {
                            fileInfo.progress = progress; 
                            console.log('progress ', fileInfo.filename, progress);
                        };
                    };
                    
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        
                        var promise = FileUploader.upload(apiUrl + '/api/upload', file,
                            { fileSetCode: attrs.optionCode });

                        var fileInfo = {
                            filename:file.name,
                            promise:promise,
                            progress:0
                        };

                        promise.then(function(ret) {

                                scope.product.options[attrs.optionCode] = {
                                    file: file
                                };

                            }, 
                            function(error) { }, 
                            progressCallback(fileInfo)
                        );

                        scope.files.push( fileInfo );

                        ImageReader.read(file)
                            .then(function(imageInfo) {
                               
                                element.append( imageInfo.getThumbnailAsImage() );

                            }, function(error) {
                                console.log('error', error);
                            });
                    }

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
