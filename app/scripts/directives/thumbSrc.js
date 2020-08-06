'use strict';

angular.module('paceApp')
.directive('thumbSrc', ['StoreConfig', 'UploadEvent', function (StoreConfig, UploadEvent) {
    return {
        restrict: 'A',
        scope: {
            thumbSrc:'=',
        },
        link: function postLink(scope, element, attrs) {

            var backgroundImage = attrs.hasOwnProperty('backgroundImage');

            function setSrc(src) {
                if (backgroundImage) {
                    attrs.$set('style', 'background-image: url(' + src + ')');
                } else {
                    attrs.$set('src', src);
                }
            }
            
            scope.$watch('thumbSrc', function(imageFile) {
                if (!imageFile)
                    return;
                if (imageFile.thumbnailAsBase64) {
                    setSrc(imageFile.thumbnailAsBase64);
                } else if (imageFile.url) {
                    setSrc(StoreConfig.imageUrlPrefix + 'thumbnail/' + imageFile.url);
                } else if (imageFile.promise) {
                    imageFile.promise.then(
                        function(value) { },
                        function(error) { },
                        function(event) {
                            if(event.type === UploadEvent.ThumbnailReady) {
                                setSrc(imageFile.thumbnailAsBase64);
                            }
                        }
                    );
                }
            });
        }
    };
}]);
