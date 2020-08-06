'use strict';

angular.module('paceApp').
    factory('ImageFile', ['$resource', 'StoreConfig', function($resource, StoreConfig){

        var ImageFile = $resource(apiUrl+'api/file/:id', {} , {
            saveThumbnail: { method:'POST', url: apiUrl + 'api/imagefile/thumb' },
            
            update: { 
                method: 'PATCH',
                params: {
                    id: '@id',
                    patches: '@patches'
                }
            },

            regenerate: { method:'POST', url: apiUrl + 'api/imagefile/regenerate' },

            'delete': { method:'DELETE', url: apiUrl + 'api/imagefile/:id'  }
        });

        ImageFile.prototype.getThumbnailUrl = function() {
            return StoreConfig.imageUrlPrefix + 'thumbnail/' + this.url;
        };

        ImageFile.prototype.getLowResUrl = function() {
            return StoreConfig.imageUrlPrefix + 'lowres/' + this.url;
        };

        ImageFile.prototype.getOriginalUrl = function() {
            return StoreConfig.imageUrlPrefix + 'original/' + this.url;
        };

        return ImageFile;

}]).factory('LogoFile', ['$resource', 'StoreConfig', function($resource, StoreConfig){

        var LogoFile = $resource(apiUrl+'api/file/:id', {} , {
             getMyLogos: { method:'GET', url:apiUrl + 'api/currentuser/logos', isArray:true },
        });

        return LogoFile;
}]).factory('ProoferLogoFile', ['$resource', 'StoreConfig', function($resource, StoreConfig){

        var ProoferLogoFile = $resource(apiUrl+'api/file/:id', {} , {
             getMyLogos: { method:'GET', url:apiUrl + 'api/currentuser/prooferLogos', isArray:true },
        });

        return ProoferLogoFile;
}]).factory('DieFile', ['$resource', 'StoreConfig', function($resource, StoreConfig){

        var DieFile = $resource(apiUrl+'api/file/:id', {} , {
             getMyDies: { method:'GET', url:apiUrl + 'api/currentuser/dies', isArray:true },
        });

        return DieFile;
}]);
