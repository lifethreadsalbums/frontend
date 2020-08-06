'use strict';

angular.module('paceApp')
.service('FileUploader', ['$rootScope', function FileUploader($rootScope) {
	
	this.upload = function(url, file, data) {

        var deferred = Q.defer();

        var xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                var percentCompleted = Math.round(e.loaded / e.total * 100);
                //console.log('upload progress', percentCompleted);
                deferred.notify(percentCompleted);
            }
        });

        xhr.addEventListener("load", function(e) {
            if (xhr.status!==200) {
                var error = JSON.parse(xhr.responseText);
                deferred.reject(error.error);
                return;
            }

            var ret = {
                file: file,
                data: angular.fromJson(xhr.responseText)
            };
            deferred.resolve(ret);
        });

        xhr.addEventListener("error", function(e) {
            console.error('FileUploader error', e);
            var error = 'Upload error: ' + xhr.status + ' - ' + xhr.statusText;
            deferred.reject(error);
        });

        xhr.addEventListener("abort", function(e) {
            //console.error('FileUploader abort', e);
            deferred.reject('Upload cancelled');
        });

        var formData = new FormData();

        if (data) {
            Object.keys(data).forEach(function(key) {
                formData.append(key, data[key]);
            });
        }

        formData.append('file', file);

        xhr.open("POST", url);
        xhr.send(formData);

        deferred.promise.xhr = xhr;
        
        return deferred.promise;

	};

}]);
