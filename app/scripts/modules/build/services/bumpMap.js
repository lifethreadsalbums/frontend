'use strict';

angular.module('pace.build')
// .value('BumpMapParams', {
//     STRENGTH: 0.3,
//     DIFFUSE: 0.54,
//     SPECTACULAR: 0.34,
//     AMBIENT: 0.0,
//     MAX_INTENSITY: 1.54,
//     LIGHT: { x: 3370, y: 1450, z: 2050 },
//     DEBUG: false
// })
.value('BumpMapParams', {
    STRENGTH: 0.3,
    DIFFUSE: 0.57,
    SPECTACULAR: 0.45,
    AMBIENT: 0.15,
    MAX_INTENSITY: 1.87,
    LIGHT: { x: 2380, y: 930, z: 2950 },
    DEBUG: false
})
.service('BumpMapService', ['BumpMapParams', function(BumpMapParams) {

    function clamp(x, min, max) {
        if(x < min) return min;
        if(x >= max) return max-1;
        return x;
    }

    //
    // Computes normals for a given height map and then draws light on a given texture
    // Works under assumption that either height map and texture have same dimensions.
    //
    this.computeNormalMapAndDrawLight = function(heightMapCtx, textureCtx, startX, startY, width, height, scale) {
        var timeStart = Date.now();

        // Constants
        var W           = width,
            H           = height,
            W2          = W / 2,
            H2          = H / 2,
            dZ          = 1.0 / BumpMapParams.STRENGTH + 1.0,
            lx          = W + (BumpMapParams.LIGHT.x * scale),
            ly          = BumpMapParams.LIGHT.y * scale,
            lz          = BumpMapParams.LIGHT.z * scale,

            // Actual data to process
            stampsImageData = heightMapCtx.getImageData(startX, startY, W, H),
            stampsData = stampsImageData.data,
            textureImageData = textureCtx.getImageData(startX, startY, W, H),
            textureData = textureImageData.data,
            i = 0,
            ni = 0;

        for(var y = 0; y < H; y++) {
            var y0 = y * W,
                y1 = clamp(y - 1, 0, H) * W,
                y2 = clamp(y + 1, 0, H) * W;

            for(var x = 0; x < W; x++) {
                // Process SOBEL
                
                if (stampsData[i + 3]<120) {
                    stampsData[i] = stampsData[i+1] = stampsData[i+2] = 128;
                }
                var x0 = x,
                    x1 = clamp(x - 1, 0, W),
                    x2 = clamp(x + 1, 0, W),

                    // Pixels
                    topLeft     = (x1 + y1) * 4,
                    top         = (x0 + y1) * 4,
                    topRight    = (x2 + y1) * 4,
                    bottomRight = (x2 + y2) * 4,
                    bottom      = (x0 + y2) * 4,
                    bottomLeft  = (x1 + y2) * 4,
                    left        = (x1 + y0) * 4,
                    center      = (x0 + y0) * 4,
                    right       = (x2 + y0) * 4,

                    iUL         = 1 - ( (stampsData[topLeft]     + stampsData[topLeft+1]        + stampsData[topLeft+2]    ) / 765.0),
                    iUM         = 1 - ( (stampsData[top]         + stampsData[top+1]            + stampsData[top+2]        ) / 765.0),
                    iUR         = 1 - ( (stampsData[topRight]    + stampsData[topRight+1]       + stampsData[topRight+2]   ) / 765.0),
                    iMR         = 1 - ( (stampsData[right]       + stampsData[right+1]          + stampsData[right+2]      ) / 765.0),
                    iLR         = 1 - ( (stampsData[bottomRight] + stampsData[bottomRight+1]    + stampsData[bottomRight+2]) / 765.0),
                    iLM         = 1 - ( (stampsData[bottom]      + stampsData[bottom+1]         + stampsData[bottom+2]     ) / 765.0),
                    iLL         = 1 - ( (stampsData[bottomLeft]  + stampsData[bottomLeft+1]     + stampsData[bottomLeft+2] ) / 765.0),
                    iML         = 1 - ( (stampsData[left]        + stampsData[left+1]           + stampsData[left+2]       ) / 765.0),

                    dX          = (iUR + 2.0 * iMR + iLR) - (iUL + 2.0 * iML + iLL) + 1.0,
                    dY          = (iLL + 2.0 * iLM + iLR) - (iUL + 2.0 * iUM + iUR) + 1.0,

                    len = Math.sqrt(dX * dX + dY * dY + dZ * dZ),

                    // normals:
                    Nx = dX / len,
                    Ny = dY / len,
                    Nz = dZ / len,

                    // Draw Light
                    LxTemp = lx - x,
                    LyTemp = ly - y,
                    LzTemp = lz,
                    Llen = Math.sqrt(LxTemp * LxTemp + LyTemp * LyTemp + LzTemp * LzTemp),
                    Lx = LxTemp / Llen,
                    Ly = LyTemp / Llen,
                    Lz = LzTemp / Llen,

                    dotNL = Nx * Lx + Ny * Ly + Nz * Lz,
                    diffuseLight = dotNL * BumpMapParams.DIFFUSE,

                    RxTemp = Nx * dotNL * 2 - Lx,
                    RyTemp = Ny * dotNL * 2 - Ly,
                    RzTemp = Nz * dotNL * 2 - Lz,
                    Rlen = Math.sqrt(RxTemp * RxTemp + RyTemp * RyTemp + RzTemp * RzTemp),
                    Rx = RxTemp / Rlen,
                    Ry = RyTemp / Rlen,
                    Rz = RzTemp / Rlen,

                    VxTemp = W2 - x,
                    VyTemp = H2 - y,
                    VzTemp = 1000,
                    Vlen = Math.sqrt(VxTemp * VxTemp + VyTemp * VyTemp + VzTemp * VzTemp),
                    Vx = VxTemp / Vlen,
                    Vy = VyTemp / Vlen,
                    Vz = VzTemp / Vlen,

                    dotRV = Rx * Vx + Ry * Vy + Rz * Vz,
                    spectacularLight = Math.pow(Math.max(dotRV, 0), 3) * BumpMapParams.SPECTACULAR,
                    intensity = Math.min(BumpMapParams.MAX_INTENSITY, spectacularLight + diffuseLight + BumpMapParams.AMBIENT);

                if (iUL<0.1 && iUM<0.1 && iUR<0.1 && iMR<0.1 && iLR<0.1 && iLM<0.1 && iLL<0.1 && iML<0.1) {
                    intensity = 1;// Math.min(1, intensity);
                }
                
                if (!BumpMapParams.DEBUG || y< H * 0.66 ) {
                    textureData[i] = clamp(textureData[i] * intensity, 0, 256) >> 0;
                    textureData[i + 1] = clamp(textureData[i + 1] * intensity, 0, 256) >> 0;
                    textureData[i + 2] = clamp(textureData[i + 2] * intensity, 0, 256) >> 0;
                }
                //textureData[i + 3] = stampsData[i + 3];

                i += 4;
                ni += 3;
            }
        }
        
        textureCtx.putImageData(textureImageData, startX, startY);

        //console.log('computeNormalMapAndDrawLight = ' + (Date.now() - timeStart) + ' ms');
    };

    //
    //Computes normal map from a canvas with a height map 
    //
    this.computeNormalMapFromHeightMap = function(canvas, ctx, mode, strength) {
        if(typeof(mode) === 'undefined') mode = 'SSBUMP';
        if(typeof(strength) === 'undefined') strength = 0.3;

        var R = 0, G = 1, B = 2,
            //ctx = canvas.getContext('2d'),
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height),
            data = imageData.data;

        var intensity = function(px) {
          return 1 - ( (data[px + R] + data[px + G] + data[px + B]) / 765.0);
        };

        var index = function(x, y) {
            return (clamp(x, 0, canvas.width) + clamp(y, 0, canvas.height) * canvas.width) * 4;
        };

        var processSSBump = function(normals) {
            for(var y = 0; y < canvas.height; y++) {
                for(var x = 0; x < canvas.width; x++) {
                      // Pixels
                    var top         = index(x    , y - 1),
                        bottom      = index(x    , y + 1),
                        left        = index(x - 1, y    ),
                        center      = index(x    , y    ),
                        right       = index(x + 1, y    ),

                        // Intensities
                        iUM         = intensity(top),
                        iMR         = intensity(right),
                        iLM         = intensity(bottom),
                        iML         = intensity(left),

                        dX = iML - iMR,
                        dY = iLM - iUM,
                        dZ = 1.0 / strength,

                        normal = new PACE.Vector3D(dX + 1.0, dY + 1.0, dZ + 1.0).unit();

                    normals.push(normal.x);
                    normals.push(normal.y);
                    normals.push(normal.z); 
                }
            }
        };

        var processSobel = function(normals) {

            var dZ = 1.0 / strength;
            
            for(var y = 0; y < canvas.height; y++) {
                var y0 = y * canvas.width,
                    y1 = clamp(y - 1, 0, canvas.height) * canvas.width,
                    y2 = clamp(y + 1, 0, canvas.height) * canvas.width;

                for(var x = 0; x < canvas.width; x++) {
                    var x0 = x,
                        x1 = clamp(x - 1, 0, canvas.width),
                        x2 = clamp(x + 1, 0, canvas.width);
                    // Pixels
                    var 
                        // topLeft     = index(x - 1, y - 1),
                        // top         = index(x    , y - 1),
                        // topRight    = index(x + 1, y - 1),
                        // bottomRight = index(x + 1, y + 1),
                        // bottom      = index(x    , y + 1),
                        // bottomLeft  = index(x - 1, y + 1),
                        // left        = index(x - 1, y    ),
                        // center      = index(x    , y    ),
                        // right       = index(x + 1, y    ),

                        topLeft     = (x1 + y1) * 4,
                        top         = (x0 + y1) * 4,
                        topRight    = (x2 + y1) * 4,
                        bottomRight = (x2 + y2) * 4,
                        bottom      = (x0 + y2) * 4,
                        bottomLeft  = (x1 + y2) * 4,
                        left        = (x1 + y0) * 4,
                        center      = (x0 + y0) * 4,
                        right       = (x2 + y0) * 4,

                        // Intensities
                        // iUL         = intensity(topLeft),
                        // iUM         = intensity(top),
                        // iUR         = intensity(topRight),
                        // iMR         = intensity(right),
                        // iLR         = intensity(bottomRight),
                        // iLM         = intensity(bottom),
                        // iLL         = intensity(bottomLeft),
                        // iML         = intensity(left),

                        iUL         = 1 - ( (data[topLeft]     + data[topLeft+1]        + data[topLeft+2]    ) / 765.0),
                        iUM         = 1 - ( (data[top]         + data[top+1]            + data[top+2]        ) / 765.0),
                        iUR         = 1 - ( (data[topRight]    + data[topRight+1]       + data[topRight+2]   ) / 765.0),
                        iMR         = 1 - ( (data[right]       + data[right+1]          + data[right+2]      ) / 765.0),
                        iLR         = 1 - ( (data[bottomRight] + data[bottomRight+1]    + data[bottomRight+2]) / 765.0),
                        iLM         = 1 - ( (data[bottom]      + data[bottom+1]         + data[bottom+2]     ) / 765.0),
                        iLL         = 1 - ( (data[bottomLeft]  + data[bottomLeft+1]     + data[bottomLeft+2] ) / 765.0),
                        iML         = 1 - ( (data[left]        + data[left+1]           + data[left+2]       ) / 765.0),

                        // Sobel filter
                        dX          = (iUR + 2.0 * iMR + iLR) - (iUL + 2.0 * iML + iLL),
                        dY          = (iLL + 2.0 * iLM + iLR) - (iUL + 2.0 * iUM + iUR),
                        
                        normal = new PACE.Vector3D(dX + 1.0, dY + 1.0, dZ + 1.0).unit();

                    normals.push(normal.x);
                    normals.push(normal.y);
                    normals.push(normal.z); 
                    
                }
            }
        };

        var computeNormals = function() {
            var time1 = Date.now();
            var normals = [];
            switch(mode) {
                case 'SOBEL':
                    processSobel(normals);
                    break;
                case 'SSBUMP':
                    processSSBump(normals);
                    break;
            }

            console.log("computeNormals " + mode + " = " + (Math.round(Date.now() - time1)/1000)+" s");
            return normals;
        };

        return computeNormals();
    };

    

    this.drawLight = function(canvas, ctx, textureCtx, normals, lx, ly, lz) {

        var time1 = Date.now();

        var w = Math.ceil(canvas.width),
            h = Math.ceil(canvas.height),
            w2 = w/2,
            h2 = h/2;

        var textureImageData = textureCtx.getImageData(0, 0, w, h),
            textureData = textureImageData.data,
            i = 0, ni = 0;
        
        for(var y = 0; y < h; y++) {
            for(var x = 0; x < w; x++) {
                
                var diffuse = 0.5,
                    spectacular = 0.6,
                    ambient = 0.3;
              
                var N = new PACE.Vector3D(normals[ni], normals[ni+1], normals[ni+2]),
                    L = new PACE.Vector3D(lx - x, ly - y, lz).unit(),
                    dotNL = N.dot(L),
                    diffuseLight = dotNL * diffuse,
                    R = N.multiply(dotNL * 2).subtract(L).unit(),
                    V = new PACE.Vector3D(w2 - x, h2 - y, 1000).unit(),
                    spectacularLight = Math.pow( Math.max( R.dot(V), 0), 3 ) * spectacular,
                    intensity =  spectacularLight + diffuseLight + ambient;

                for(var channel = 0; channel < 3; channel++) {
                    textureData[i+channel] = Math.round(clamp(textureData[i+channel]*intensity, 0, 256));
                }
                
                i += 4;
                ni += 3;
                
            }
        }
        ctx.putImageData(textureImageData, 0, 0);
        console.log("drawLight = "+(Math.round(Date.now() - time1)/1000)+" s");
    }

}]);