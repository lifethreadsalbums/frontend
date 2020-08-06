'use strict';

angular.module('pace.layout')
.service('TextureCache', ['$q', '$cacheFactory', function($q, $cacheFactory) {

    var canvas = document.createElement('canvas'),
        cache = $cacheFactory('TextureCache');

    this.getCache = function() {
        return cache;
    };

    this.get = function(url) {
        var deferred = $q.defer(),
            cachedTexture = cache.get(url);

        if (cachedTexture) {
            deferred.resolve(cachedTexture);
        } else {
            var texture = new Image();
            texture.crossOrigin = 'anonymous';
            texture.onload = function() {
                
                canvas.width = texture.width;
                canvas.height = texture.height;

                var ctx = canvas.getContext('2d');
                ctx.drawImage(texture, 0, 0);

                var textureObject = {
                    url: url,
                    data: ctx.getImageData(0, 0, texture.width, texture.height),
                    pattern: new fabric.Pattern({
                        source: texture,
                        repeat: 'repeat'
                    })
                };

                cache.put(url, textureObject);
                deferred.resolve(textureObject);
                
            };
            texture.src = url;
        }

        return deferred.promise;
    };

    PACE.TextureCache = this;
    
}]);