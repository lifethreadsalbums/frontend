'use strict';

angular.module('paceApp').
service('ImageUploadService', [
    '$resource', 'ImageReader', 'FileUploader', 'ThumbnailMaker', '_', 'ImageFile', 'UploadEvent', 'ImageFileStatus', 'PreflightService',
    function($resource, ImageReader, FileUploader, ThumbnailMaker, _, ImageFile, UploadEvent, ImageFileStatus, PreflightService) {

        var thumbnailQueue = [],
            uploadQueue = [],
            activeUploads = [],
            deferredMap = {},
            imageFiles = {},
            maxUploads = 4,
            currentUploads = 0,
            allowedTypes = ['image/jpeg', 'image/png'];

        var log = {
            dataLoad: false,
            thumbnailQueue: false,
            uploadQueue: false,
            progress: false
        };

        this.getImageFiles = function() { return imageFiles; };

        this.uploadImages = function(files) {
            var worker = new Worker('scripts/workers/imageLoadWorker.js'),
                filesMap = [],
                result = [];

            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (allowedTypes.indexOf(file.type)<0)
                    continue;

                var imageFile = new ImageFile();
                imageFile.status = ImageFileStatus.New;
                imageFile.type = 'ImageFile';
                imageFile.filename = file.name;
                imageFile.size = file.size;
                imageFile.file = file;
                imageFile._id = _.uniqueId('imageFile') + _.now();
                imageFile.replace = file.replace || false;

                imageFiles[imageFile._id] = imageFile;
                filesMap[imageFile._id] = file;
                deferredMap[imageFile._id] = Q.defer();
                imageFile.promise = deferredMap[imageFile._id].promise;

                result.push(imageFile);
            }

            worker.onmessage = function(e) {
                var imageData = e.data.imageData;

                if(e.data.type === 'SUCCESS') {

                    var imageFile = imageFiles[imageData.key];
                    if (imageFile.status===ImageFileStatus.Cancelled)
                        return;

                    _.extend(imageFile, imageData.imageInfo);

                    //preflight image
                    PreflightService.preflight(imageFile);
                    deferredMap[imageData.key].notify( { type:UploadEvent.ImagePreflighted, imageFile: imageFile } );

                    //we can cancel upload in the prefliight event
                    if (imageFile.status===ImageFileStatus.Cancelled)
                        return;
                    //add image to the thumbnail queue
                    thumbnailQueue.push(imageFile);

                } else if(e.data.type === 'FAILURE') {
                    // Tu katastrofa
                    var imageFile = imageFiles[imageData.key];
                    console.log('error', e.data.text);

                    imageFile.status = ImageFileStatus.Rejected;
                    imageFile.errorMessage = e.data.text;

                    deferredMap[imageData.key].reject(e.data.text);
                    delete deferredMap[imageData.key];
                } else if(e.data.type === 'FINISH') {
                    // Tutaj sukces
                } else if (e.data.type === 'DEBUG') {
                    console.log(e.data.debug);
                }
                if(log.dataLoad) {
                    console.log(e.data.text);
                }
            };

            worker.postMessage({files: filesMap});
            return result;
        };

        this.cancelAllUploads = function() {
            _.each(imageFiles, function(imageFile) {
                imageFile.status = ImageFileStatus.Cancelled;
            });
            _.each(activeUploads, function(uploadPromise) {
                uploadPromise.xhr.abort();
            });
            activeUploads = [];
        };

        var processNextThumbnailQueueItem = function() {
            if(log.thumbnailQueue) {
                console.log('There are ' + thumbnailQueue.length + ' items to process in thumbnailQueue.');
            }
            if(thumbnailQueue.length > 0) {
                var item = thumbnailQueue.shift();
                if (item.status===ImageFileStatus.Cancelled) {
                    //process next item in the queue
                    delete deferredMap[item._id];
                    delete imageFiles[item._id];
                    setTimeout(processNextThumbnailQueueItem, 500);
                    return;
                }

                var onThumbnailSaved = function(value) {
                    _.extend(item, value);

                    deferredMap[item._id].notify( { type:UploadEvent.ImageFileSaved, imageFile: item } );
                    if (item.status===ImageFileStatus.UploadInProgress) {
                        //upload actual file after saving the thumbnail
                        uploadQueue.push(item);
                    } else if (item.status === ImageFileStatus.Rejected) {
                        //the file has been rejected during preflight phase so we need to call reject() on promise;
                        deferredMap[item._id].reject({error:item.errorMessage});
                        delete deferredMap[item._id];
                        delete imageFiles[item._id];
                    }
                };

                var saveThumbnail = function(base64) {
                    delete item.thumbBytes;
                    delete item.binaryString;
                    delete item.imageDataUrl;

                    var imageFileDto = {
                        imageFile: _.omit(item, 'file'),
                        thumbnailAsBase64: base64
                    };
                    ImageFile.saveThumbnail(imageFileDto, onThumbnailSaved);

                    item.thumbnailAsBase64 = 'data:' + item.file.type + ';base64,' + base64;
                    deferredMap[item._id].notify( { type:UploadEvent.ThumbnailReady, imageFile: item } );
                };

                if (item.thumbBytes) {
                    var binary = String.fromCharCode.apply(null, item.thumbBytes);
                    var base64 = btoa(binary);

                    saveThumbnail(base64);
                    setTimeout(processNextThumbnailQueueItem, 50);

                } else {
                    var promise = ThumbnailMaker.makeThumbnail(item.file, item.file.type, 300);
                    promise.then(function(value) {

                        saveThumbnail(value);
                        setTimeout(processNextThumbnailQueueItem, 500);

                    });
                }
            } else {
                setTimeout(processNextThumbnailQueueItem, 500);
            }
        };

        var processNextUploadQueueItem = function() {
            if(log.uploadQueue) {
                console.log('There are ' + uploadQueue.length + ' items to process in uploadQueue. (' + currentUploads + ' active uploads)');
            }
            if(uploadQueue.length > 0 && currentUploads < maxUploads) {
                currentUploads++;
                var item = uploadQueue.shift();
                if (item.status===ImageFileStatus.Cancelled) {
                    delete deferredMap[item._id];
                    delete imageFiles[item._id];
                    setTimeout(processNextUploadQueueItem, 50);
                    return;
                }

                var promise = FileUploader.upload(apiUrl + 'api/imageupload', item.file, { imageId: item.id });
                deferredMap[item._id].notify( { type:UploadEvent.UploadStart, imageFile: item } );

                activeUploads.push(promise);

                promise.then(function(value) {
                    //File upload complete
                    _.extend(item, value.data);

                    deferredMap[item._id].resolve(item);
                    delete deferredMap[item._id];
                    delete imageFiles[item._id];
                    currentUploads--;
                    setTimeout(processNextUploadQueueItem, 50);
                    activeUploads = _.without(activeUploads, promise);

                }, function(error) {
                    // File upload error
                    item.status = ImageFileStatus.Rejected;
                    item.errorMessage = error;
                    deferredMap[item._id].reject(error);
                    delete deferredMap[item._id];
                    delete imageFiles[item._id];
                    currentUploads--;
                    setTimeout(processNextUploadQueueItem, 50);
                    console.error('upload error', item, error);
                    activeUploads = _.without(activeUploads, promise);

                }, function(percentComplete) {
                    if (percentComplete>item.progress || !item.progress) {
                        item.progress = percentComplete;
                        deferredMap[item._id].notify( { type:UploadEvent.UploadProgress, imageFile: item } );
                        if (log.progress) {
                            console.log(item.file.name + ': ' + percentComplete);
                        }
                    }
                });
            }
            setTimeout(processNextUploadQueueItem, 500);
        };

        processNextThumbnailQueueItem();
        processNextUploadQueueItem();
    }
]);
