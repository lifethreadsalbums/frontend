'use strict';

angular.module('paceApp')
.service('PreflightService', ['ImageFileStatus', 'StoreConfig', function PreflightService(ImageFileStatus, StoreConfig) {
    
    this.preflight = function(imageFile) {

        var errors = [];

        //TODO: make sure admin can edit all these settings and error messages

        if (!(imageFile.colorSpace==='RGB' || imageFile.colorSpace==='RGB_ALPHA')) {
            errors.push('This is not an RGB image. Only RGB images are supported.');
        }

        if (imageFile.file.size > StoreConfig.maxImageFileSize) {
            errors.push('Your file exceeds the maximum upload size of 15MB.');
        }
        
        if (imageFile.width<StoreConfig.minImageWidth || imageFile.height<StoreConfig.minImageHeight) {
            errors.push('The resolution of this file is too low. Please re-upload a print quality version.');
        }

        if (errors.length>0) {
            imageFile.status = ImageFileStatus.Rejected;
            imageFile.errorMessage = errors.join('\n\n');
        } else {
            imageFile.status = ImageFileStatus.Preflighted;
        }

    };

}]);
