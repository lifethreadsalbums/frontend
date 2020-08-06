PACE.ApplyTintCommand = function(ctx, tintColor, width, height, textureImg) {
	'use strict';

	function hex2RGBA(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b, a) {
            if(typeof(a) === 'undefined') a = 'F';
            return r + r + g + g + b + b + a + a;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex),
            r = parseInt(result[1], 16),
            g = parseInt(result[2], 16),
            b = parseInt(result[3], 16),
            a = parseInt(result[4], 16);
        return result ? {
            r: r,
            g: g,
            b: b,
            a: isNaN(a) ? 255 : a
        } : null;
    };

    var tint = tintColor && hex2RGBA(tintColor);

	this.execute = function() {
		if(!tint) return;

        console.log('apply tint', tint, tintColor)

		var imageData = ctx.getImageData(0, 0, width, height),
            data = imageData.data;

        if(!textureImg) {
            for(var i = 0; i < data.length; i += 4) {
                var R = data[i],
                    G = data[i + 1],
                    B = data[i + 2],
                    A = data[i + 3];

                if(A > 0) {
                    data[i]     = (tint.r - R) * A + R;
                    data[i + 1] = (tint.g - G) * A + G;
                    data[i + 2] = (tint.b - B) * A + B; 
                    data[i + 3] = tint.a;
                }
            }
        } else {
            var textureData = textureImg.data,
                W = width >> 0,
                H = height >> 0,
                TW = textureImg.width >> 0;

            for(var y = 0; y < H; y++) {
                for(var x = 0; x < W; x++) {
                    var i = (y * W + x) * 4,
                        j = ((y * TW + x) * 4) % textureData.length;
                    if(data[i + 3] > 0) {
                        data[i] = textureData[j];
                        data[i + 1] = textureData[j + 1];
                        data[i + 2] = textureData[j + 2];
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
	};

};