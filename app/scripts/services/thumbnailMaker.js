'use strict';

angular.module('paceApp')
.service('ThumbnailMaker', ['GeomService', function ThumbnailMaker(GeomService) {

    //hermite filter code taken from here:
    //http://stackoverflow.com/questions/18922880/html5-canvas-resize-downscale-image-high-quality
    /*
    var resample_hermite = function (canvas, W, H, W2, H2) {
        console.log('resample_hermite', W, H, W2, H2)
        var time1 = Date.now();
        var ctx = canvas.getContext("2d");
        var img = ctx.getImageData(0, 0, W, H);
        var img2 = ctx.getImageData(0, 0, W2, H2);
        var data = img.data;
        var data2 = img2.data;
        var ratio_w = W / W2;
        var ratio_h = H / H2;
        var ratio_w_half = Math.ceil(ratio_w/2);
        var ratio_h_half = Math.ceil(ratio_h/2);
        for(var j = 0; j < H2; j++) {
            for(var i = 0; i < W2; i++) {
                var x2 = (i + j*W2) * 4;
                var weight = 0;
                var weights = 0;
                var gx_r = 0,
                    gx_g = 0,
                    gx_b = 0,
                    gx_a = 0;
                var center_y = (j + 0.5) * ratio_h;
                for(var yy = Math.floor(j * ratio_h); yy < (j + 1) * ratio_h; yy++){
                    var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
                    var center_x = (i + 0.5) * ratio_w;
                    var w0 = dy*dy //pre-calc part of w
                    for(var xx = Math.floor(i * ratio_w); xx < (i + 1) * ratio_w; xx++){
                        var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
                        var w = Math.sqrt(w0 + dx*dx);
                        if(w >= -1 && w <= 1){
                            //hermite filter
                            weight = 2 * w*w*w - 3*w*w + 1;
                            if(weight > 0){
                                dx = 4*(xx + yy*W);
                                gx_r += weight * data[dx];
                                gx_g += weight * data[dx + 1];
                                gx_b += weight * data[dx + 2];
                                gx_a += weight * data[dx + 3];
                                weights += weight;
                            }
                        }
                    }       
                }
                data2[x2]     = gx_r / weights;
                data2[x2 + 1] = gx_g / weights;
                data2[x2 + 2] = gx_b / weights;
                data2[x2 + 3] = gx_a / weights;
            }
        }

        //canvas.getContext("2d").clearRect(0, 0, Math.max(W, W2), Math.max(H, H2));
        canvas.width = W2;
        canvas.height = H2;
        ctx.putImageData(img2, 0, 0);
        console.log("hermite = "+(Math.round(Date.now() - time1)/1000)+" s");
    }
    */

    var canvas;

    // function arrayBufferToBase64( buffer ) {
    //     var binary = '',
    //         bytes = new Uint8Array( buffer ),
    //         len = bytes.byteLength;
    //     for (var i = 0; i < len; i++) {
    //         binary += String.fromCharCode( bytes[i] );
    //     }
    //     return btoa( binary );
    // }

    this.makeThumbnail = function(file, imageType, thumbMaxDimension) {

        var startTime = new Date().getTime();
        var deferred = Q.defer();

        var img = new Image();
        //var base64 = arrayBufferToBase64(fileDataAsArrayBuffer);
        
        img.onload = function(e) {
        
            // var canvas = document.createElement("canvas");
            // canvas.width = img.width;
            // canvas.height = img.height;
            // canvas.getContext("2d").drawImage(img, 0, 0);
            // resample_hermite(canvas, img.width, img.height, thumbSize.width, thumbSize.height);

            var thumbSize = GeomService.fitRectangleProportionally( img, { width: thumbMaxDimension, height: thumbMaxDimension } );            
            if (!canvas) {
                canvas = document.createElement("canvas");
            }
            canvas.width = thumbSize.width;
            canvas.height = thumbSize.height;
            canvas.getContext("2d").drawImage(img, 0, 0, thumbSize.width, thumbSize.height);

            var dataUrl = canvas.toDataURL(imageType);
            var thumbBase64 = dataUrl.substring(dataUrl.indexOf('base64,') + 7);
            deferred.resolve(thumbBase64);
            
            console.log('Thumbnail generated in: ' + (new Date().getTime() - startTime) + ' ms');
        };
        img.onerror = function(e, msg) {
            console.log('Cannot generate thumbnail');
            deferred.reject(e);
        };
        //img.src = 'data:' + imageType + ';base64,' + base64;
        //img.src = imageDataUrl;
        var reader = new FileReader();

        reader.onload = function(e) {
            img.src = reader.result;
        };

        reader.readAsDataURL(file);
        
        return deferred.promise;
    };

}])

.service('ImageService', ['$http', '$q', '$timeout', function ($http, $q, $timeout) {
  var NUM_LOBES = 3
  var lanczos = lanczosGenerator(NUM_LOBES);

  PACE.ImageService = this;

  // resize via lanczos-sinc convolution
  this.resize = function (img, width, height) {
    var self = { }

    self.type    = "image/png"
    self.quality = 1.0
    self.resultD = $q.defer()

    self.canvas = document.createElement('canvas')

    self.ctx = getContext(self.canvas)
    self.ctx.imageSmoothingEnabled       = true
    self.ctx.mozImageSmoothingEnabled    = true
    self.ctx.oImageSmoothingEnabled      = true
    self.ctx.webkitImageSmoothingEnabled = true

    if (img.naturalWidth <= width || img.naturalHeight <= height) {
      console.log("FAST resizing image", img.naturalWidth, img.naturalHeight, "=>", width, height)

      self.canvas.width  = width
      self.canvas.height = height
      self.ctx.drawImage(img, 0, 0, width, height)
      resolveLanczos(self)
    } else {
      console.log("SLOW resizing image", img.naturalWidth, img.naturalHeight, "=>", width, height)

      self.canvas.width  = img.naturalWidth
      self.canvas.height = img.naturalHeight
      self.ctx.drawImage(img, 0, 0, self.canvas.width, self.canvas.height)

      self.img = img
      self.src = self.ctx.getImageData(0, 0, self.canvas.width, self.canvas.height)
      self.dest = {
        width:  width,
        height: height
      }
      self.dest.data = new Array(self.dest.width * self.dest.height * 4)

      self.ratio     = img.naturalWidth / width
      self.rcpRatio  = 2 / self.ratio
      self.range2    = Math.ceil(self.ratio * NUM_LOBES / 2)
      self.cacheLanc = {}
      self.center    = {}
      self.icenter   = {}

      $timeout(function () { applyLanczosColumn(self, 0) })
    }

    return self.resultD.promise
  }

  function applyLanczosColumn (self, u) {
    self.center.x  = (u + 0.5) * self.ratio
    self.icenter.x = self.center.x | 0

    for (var v = 0; v < self.dest.height; v++) {
      self.center.y  = (v + 0.5) * self.ratio
      self.icenter.y = self.center.y | 0

      var a, r, g, b
      a = r = g = b = 0

      var norm = 0
      var idx

      for (var i = self.icenter.x - self.range2; i <= self.icenter.x + self.range2; i++) {
        if (i < 0 || i >= self.src.width) continue
        var fX = (1000 * Math.abs(i - self.center.x)) | 0
        if (!self.cacheLanc[fX]) {
          self.cacheLanc[fX] = {}
        }

        for (var j = self.icenter.y - self.range2; j <= self.icenter.y + self.range2; j++) {
          if (j < 0 || j >= self.src.height) continue

          var fY = (1000 * Math.abs(j - self.center.y)) | 0
          if (self.cacheLanc[fX][fY] === undefined) {
            self.cacheLanc[fX][fY] = lanczos(Math.sqrt(Math.pow(fX * self.rcpRatio, 2) + Math.pow(fY * self.rcpRatio, 2)) / 1000)
          }

          var weight = self.cacheLanc[fX][fY]
          if (weight > 0) {
            idx = (j * self.src.width + i) * 4
            norm += weight

            r += weight * self.src.data[idx + 0]
            g += weight * self.src.data[idx + 1]
            b += weight * self.src.data[idx + 2]
            a += weight * self.src.data[idx + 3]
          }
        }
      }

      idx = (v * self.dest.width + u) * 4
      self.dest.data[idx + 0] = r / norm
      self.dest.data[idx + 1] = g / norm
      self.dest.data[idx + 2] = b / norm
      self.dest.data[idx + 3] = a / norm
    }

    if (++u < self.dest.width) {
      if (u % 16 === 0) {
        $timeout(function () { applyLanczosColumn(self, u) })
      } else {
        applyLanczosColumn(self, u)
      }
    } else {
      $timeout(function () { finalizeLanczos(self) })
    }
  }

  function finalizeLanczos (self) {
    self.canvas.width  = self.dest.width
    self.canvas.height = self.dest.height
    //self.ctx.drawImage(self.img, 0, 0, self.dest.width, self.dest.height)
    self.src = self.ctx.getImageData(0, 0, self.dest.width, self.dest.height)
    var idx
    for (var i = 0; i < self.dest.width; i++) {
      for (var j = 0; j < self.dest.height; j++) {
        idx = (j * self.dest.width + i) * 4
        self.src.data[idx + 0] = self.dest.data[idx + 0]
        self.src.data[idx + 1] = self.dest.data[idx + 1]
        self.src.data[idx + 2] = self.dest.data[idx + 2]
        self.src.data[idx + 3] = self.dest.data[idx + 3]
      }
    }
    self.ctx.putImageData(self.src, 0, 0)
    resolveLanczos(self)
  }

  function resolveLanczos (self) {
    var result = new Image()

    result.onload = function () {
      self.resultD.resolve(result)
    }

    result.onerror = function (err) {
      self.resultD.reject(err)
    }

    result.src = self.canvas.toDataURL(self.type, self.quality)
  }

  // resize by stepping down
  this.resizeStep = function (img, width, height, quality) {
    quality = quality || 1.0

    var resultD = $q.defer()
    var canvas  = document.createElement( 'canvas' )
    var context = getContext(canvas)
    var type = "image/png"

    var cW = img.naturalWidth
    var cH = img.naturalHeight

    var dst = new Image()
    var tmp = null

    //resultD.resolve(img)
    //return resultD.promise

    function stepDown () {
      cW = Math.max(cW / 2, width) | 0
      cH = Math.max(cH / 2, height) | 0

      canvas.width  = cW
      canvas.height = cH

      context.drawImage(tmp || img, 0, 0, cW, cH)

      dst.src = canvas.toDataURL(type, quality)

      if (cW <= width || cH <= height) {
        return resultD.resolve(dst)
      }

      if (!tmp) {
        tmp = new Image()
        tmp.onload = stepDown
      }

      tmp.src = dst.src
    }

    if (cW <= width || cH <= height || cW / 2 < width || cH / 2 < height) {
      canvas.width  = width
      canvas.height = height
      context.drawImage(img, 0, 0, width, height)
      dst.src = canvas.toDataURL(type, quality)

      resultD.resolve(dst)
    } else {
      stepDown()
    }

    return resultD.promise
  }

  function getContext (canvas) {
    var context = canvas.getContext('2d')

    context.imageSmoothingEnabled       = true
    context.mozImageSmoothingEnabled    = true
    context.oImageSmoothingEnabled      = true
    context.webkitImageSmoothingEnabled = true

    return context
  }

  // returns a function that calculates lanczos weight
  function lanczosGenerator (lobes) {
    var recLobes = 1.0 / lobes

    return function (x) {
      if (x > lobes) return 0
      x *= Math.PI
      if (Math.abs(x) < 1e-16) return 1
      var xx = x * recLobes
      return Math.sin(x) * Math.sin(xx) / x / xx
    }
  }

  
}]);
