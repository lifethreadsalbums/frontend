'use strict';


PACE.Filters = { 
    greyscale: function() {
        return function(rgba) {
           var avg = (rgba.r + rgba.g + rgba.b) / 3;

            rgba.r = avg;
            rgba.g = avg;
            rgba.b = avg;
            return rgba;
        }
    },

    saturation: function(adjust) {
        adjust *= -0.01;
        return function(rgba) {
            var max;

            max = Math.max(rgba.r, rgba.g, rgba.b);
            if (rgba.r !== max) {
              rgba.r += (max - rgba.r) * adjust;
            }
            if (rgba.g !== max) {
              rgba.g += (max - rgba.g) * adjust;
            }
            if (rgba.b !== max) {
              rgba.b += (max - rgba.b) * adjust;
            }
            return rgba;
        };
    },

    sepia: function(adjust) {
        if (adjust == null) {
            adjust = 100;
        }
        adjust /= 100;
        return function(rgba) {
            rgba.r = Math.min(255, (rgba.r * (1 - (0.607 * adjust))) + (rgba.g * (0.769 * adjust)) + (rgba.b * (0.189 * adjust)));
            rgba.g = Math.min(255, (rgba.r * (0.349 * adjust)) + (rgba.g * (1 - (0.314 * adjust))) + (rgba.b * (0.168 * adjust)));
            rgba.b = Math.min(255, (rgba.r * (0.272 * adjust)) + (rgba.g * (0.534 * adjust)) + (rgba.b * (1 - (0.869 * adjust))));
            return rgba;
        };
    }

};



PACE.SepiaFilter = fabric.util.createClass(fabric.Image.filters.BaseFilter,  {
    
    type: 'SepiaFilter',

    applyTo: function(canvasEl) {

        var filters = [
            PACE.Filters.greyscale(),
            PACE.Filters.sepia(40)
        ];

        var clampRGB = function(val) {
          if (val < 0) {
            return 0;
          }
          if (val > 255) {
            return 255;
          }
          return val;
        };

        var context = canvasEl.getContext('2d'),
            imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
            data = imageData.data,
            len = imageData.width * imageData.height * 4,
            index = 0;

        while (index < len) {
            var rgba = {
                r: data[index],
                g: data[index + 1],
                b: data[index + 2],
                a: data[index + 3]
            };
            
            for (var i = 0; i < filters.length; i++) {
                rgba = filters[i](rgba);
            }

            data[index]     = clampRGB(rgba.r);
            data[index + 1] = clampRGB(rgba.g);
            data[index + 2] = clampRGB(rgba.b);
            data[index + 3] = clampRGB(rgba.a);
            
            index += 4;
        }

        context.putImageData(imageData, 0, 0);
    }
});

