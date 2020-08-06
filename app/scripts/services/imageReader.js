'use strict';

angular.module('paceApp')
.service('ImageReader', ['$q', 'ThumbnailMaker', function ImageReader($q, ThumbnailMaker) {
    
    this.read = function(file) {

        var imageInfoClass;
        if (file.type==='image/jpeg')
            imageInfoClass = JpegImageInfo;
        else if (file.type==='image/png')
            imageInfoClass = PngImageInfo;
        else
            throw new Error('Image type not supported');

        var deferred = $q.defer();
        var binaryReader = new FileReader();
        binaryReader.onload = function () {
                
            var imageInfo = new imageInfoClass( binaryReader.result );
            console.log('ImageReader', imageInfo);

            if (imageInfo.thumbBytes) 
                deferred.resolve(imageInfo);
            else {
                var promise = ThumbnailMaker.makeThumbnail(binaryReader.result, file.type, 300);
                promise.then(function(value) {
                    imageInfo.thumbDataURL = value;
                    deferred.resolve(imageInfo);
                });
            } 
            
        };
         
        binaryReader.readAsBinaryString(file);

        return deferred.promise;
    };

}]);
