
/**
 * An auxiliary class that is resposoble for supporting main logic of emboss text rendering
 */
/*

PACE.pixelManipulatorEmbossText = (function () {

    var HEXtoRGB = function(hexColor){
        if(hexColor.charAt(0)==="#"){
            hexColor = hexColor.substring(1,7);
        }
        return {
            r: parseInt(hexColor.substring(0,2),16),
            g: parseInt(hexColor.substring(2,4),16),
            b: parseInt(hexColor.substring(4,6),16),
            a:255
        }
    }

    var getPixel = function (imgData, which) {
        return {
            r: imgData.data[which],
            g: imgData.data[which + 1],
            b: imgData.data[which + 2],
            a: imgData.data[which + 3]
        }
    }

//        var getPixelByRowCol = function(imgData, row, col) {
//            return getPixel(imgData, row * imgData.width + col);
//        }

    var setPixel = function (imgData, which, color) {
        imgData.data[which] = color.r;
        imgData.data[which + 1] = color.g;
        imgData.data[which + 2] = color.b;
        if(color.a) { imgData.data[which + 3] = color.a; }
    };

//        var setPixelByRowCol = function(imgData, row, col, color) {
//            setPixel(imgData, row * imgData.width + col, color);
//        };

    // * color1 - color2
    //  * @param color1
    //  * @param color2
    //  * @returns {{r: number, g: number, b: number, a: number}}
     
    var getColorDifference = function(color1, color2) {
        var alpha = Math.max(color1.a, color2.a);
        if(alpha === undefined) alpha = 0;
        return {
            r : color1.r - color2.r,
            g : color1.g - color2.g,
            b : color1.b - color2.b,
            a : alpha
        }
    }

    // * color1 + color2
    //  * @param color1
    //  * @param color2
    //  * @returns {{r: number, g: number, b: number, a: number}}
     
    var getColorSum = function(color1, color2) {
        return {
            r : color1.r + color2.r,
            g : color1.g + color2.g,
            b : color1.b + color2.b,
            a : (color1.a && color2.a) ? Math.max(color1.a, color2.a) : 255
        }
    }

    var multColor = function(color, factor, includeAlpha){
        return {
            r : color.r * factor,
            g : color.g * factor,
            b : color.b * factor,
            a : (includeAlpha) ? (color.a * factor)  : color.a
        }
    }

    var toDataURL = function (imgDataObjects) {
        var canvas = document.createElement("canvas"),
            ctx = canvas.getContext('2d');

        for (var key in imgDataObjects) {
            var imgData = imgDataObjects[key];
            canvas.width = imgData.width;
            canvas.height = imgData.height;
            ctx.putImageData(imgData, 0, 0);
            imgDataObjects[key] = canvas.toDataURL();
        }

        return imgDataObjects;
    };

    var calculateAvgColor = function(total, counter){
        return {
            r : total.r / counter,
            g : total.g / counter,
            b : total.b / counter,
            a : 0
        }
    };

    var blurSingle = function(source, pixels, index, blurMatrix){
        var width = source.width;
        var totalColor = {r:0, g:0, b:0};
        var counter = 0;
        for(var i = -1; i < 1; i++){
            for(var j = -1; j < 1; j++){
                var current = index + i * (width+j) * 4;
                var factor = blurMatrix[i+1][j+1];
                var currentColor=getPixel(source,current);
                totalColor.r += currentColor.r * factor;
                totalColor.g += currentColor.g * factor;
                totalColor.b += currentColor.b * factor;
                counter += factor;
            }
        }
        setPixel(source,index,calculateAvgColor(totalColor,counter));
    }

    var blur = function(source, pixels, blurMatrix, filterFn){
        for(var p in pixels){

            if(!filterFn || filterFn(pixels[p])){
                var index = parseInt(p);
                blurSingle(source, pixels, index, blurMatrix);
            }
        }
    }


    var getPixelsStatistics = function (imageDataText, imageDataBack) {
        var modified = [];
        var onLightEdges = [];
        var onShadowEdges = [];
        var colorInfo = {
            color: {
                r: 0,
                g: 0,
                b: 0},
            counter: 0
        };

        var isModified = function (source, i) {
            return source.data[i+3] > 0;
        }

        // set first row
        for (var i = 0; i < imageDataText.width * 4; i+=4){
            if(isModified(imageDataText, i)){
                modified[i] = {
                    distanceFromEdge : 0,
                    opacity : imageDataText.data[i+3]
                }
            }
        }

        // set first column
        for (var i = 0; i < imageDataText.height * imageDataText.width * 4; i += imageDataText.width * 4){
            if(isModified(imageDataText, i)){
                modified[i] = {
                    distanceFromEdge : 0,
                    opacity : imageDataText.data[i+3]
                }
            }
        }

        for (var i = 1; i < imageDataText.height; i++){
            for (var j = 4; j < imageDataText.width*4; j+=4){
                var index = i * imageDataText.width*4 + j;
                if(isModified(imageDataText, index)){
                    modified[index] = {
                        distanceFromEdge: modified[index-imageDataText.width*4-4] ? modified[index-imageDataText.width*4-4].distanceFromEdge + 1 : 0,
                        opacity : imageDataText.data[index+3]
                    }

                    if(modified[index].distanceFromEdge === 0){
                        onShadowEdges.push(index);
                    }

                    if(!isModified(imageDataText, index + imageDataText.width*4+4)){
                        onLightEdges.push(index);
                    }
                    // for color stats, grab only pixels that are totally opaque
                    if (imageDataText.data[index + 3] == 255) {
                        colorInfo.color.r += imageDataBack.data[index];
                        colorInfo.color.g += imageDataBack.data[index + 1];
                        colorInfo.color.b += imageDataBack.data[index + 2];
                        colorInfo.counter += 1;
                    }
                }
            }
        }


        return {
            width : imageDataText.width,
            height : imageDataText.height,
            modified : modified,
            onLightEdges : onLightEdges,
            avgColor : calculateAvgColor(colorInfo.color, colorInfo.counter)
        };
    }

    var clearNotModifiedPixels = function (imageData, modified) {
        for (var i = 0; i < imageData.data.length; i += 4) {
            if (modified[i]==undefined) {
                imageData.data[i + 3] = 0;
            }
            else {
                imageData.data[i+3] = modified[i].opacity;
            }
        }
    }

    // *
    //  *
    //  * @param source
    //  * @param pixelStats
    //  * @param meanDistance {type: Number} value from [0,1] 0 - use avarge color everywher; 1 - do not modify anything
     
    var setPixelsToColor = function (source, modified, color, meanDistance) {

        var c;

        for (var i in modified){
            if(modified[i].distanceFromEdge === 0) continue;
            i = parseInt(i);
            c = getPixel(source, i);
            c = getColorDifference(color, c);
            c = multColor(c,  (1-meanDistance), false);
            c = getColorSum(c, getPixel(source, i));
            setPixel(source, i, c);
        }
    };

    var multiplePixelsByFactor = function(source, pixelStats, factor, applyToAlpha){
        var c;
        for (var i in pixelStats.modified){
            i = parseInt(i);
            c = getPixel(source, i);
            c = multColor(c,  factor, applyToAlpha);
            setPixel(source, i, c);
        }
    };



    var putShadow = function(source, modified, configShadow) {
        var c, factors = [];
        var leftCol, topCol, diagCol;

        factors.push(parseFloat(configShadow.intensity));
        for(var i = 1; i <= configShadow.depth; i++){
            factors[i] = Math.min(factors[i-1] * configShadow.gradient, 1);
        }

        for(var i in modified){
            var distance = modified[i].distanceFromEdge;
            i = parseInt(i);
            if(distance <= configShadow.depth && distance > 0){
                c = getPixel(source, i);
                c = multColor(c,  factors[distance], false);

                if(distance>1){
                    leftCol=getPixel(source, i-4);
                    topCol=getPixel(source, i-source.width*4);
                    diagCol=getPixel(source, i-source.width*4-4);
                    c.r += (leftCol.r + topCol.r + diagCol.r);
                    c.b += (leftCol.b + topCol.b + diagCol.b);
                    c.g += (leftCol.g + topCol.g + diagCol.g);

                    c = calculateAvgColor(c,4);
                }

                setPixel(source, i, c);

            }
        };

//            blur(
//                source,
//                modified,
//                [
//                    [0,1,0],
//                    [1,1,0],
//                    [0,0,0]
//                ],
//                function(pixelInfo){
//                    return pixelInfo.distanceFromEdge > 0 && pixelInfo.distanceFromEdge < configShadow.depth;
//                }
//            );

        blur(
            source,
            modified,
            [
                [1,1,1],
                [1,2,1],
                [1,1,1]
            ],
            function(pixelInfo){
                return pixelInfo.distanceFromEdge < configShadow.depth+2;
            }
        );

    };

    var putLight = function(source, pixels, intensity) {
        var c;

        for (var i in pixels){
            var index = pixels[i];
//                c = getPixel(source, index);
//                c = multColor(c, intensity, false);
//                setPixel(source, index, c);

            index = index + source.width * 4 + 4;
            c = getPixel(source, index);
            c = multColor(c, intensity * 1.5, false);
            c.a = 160;
            setPixel(source, index, c);
        }
    };



    return {
        auxCanvas : (function(){
            var auxCan = document.createElement('canvas');
            return new fabric.StaticCanvas(auxCan);
        })(),
        hexToRGB : HEXtoRGB,
        toDataURL: toDataURL,
        getPixelsStatistics: getPixelsStatistics,
        clearNotModifiedPixels: clearNotModifiedPixels,
        setPixelsToColor: setPixelsToColor,
        multiplePixelsByFactor : multiplePixelsByFactor,
        putShadow : putShadow,
        putLight : putLight,
        blur : blur
    }
}
    )();

PACE.ITextEmboss = fabric.util.createClass(fabric.IText, {

    type: 'i-text-emboss',

    initialize : function (element, options) {

        options || (options = {});
        options.fill = 'rgba(150,150,150,255)';

        this.set('mode', options.mode || 'emboss');

        this.set('smoothDistance', options.smoothDistance || 1.0);
        this.set('smoothFactor', options.smoothFactor || 1.0);

        this.set('colorDistance', options.colorDistance || 0.5);

        this.set('shadowDepth', options.shadowDepth || 2);
        this.set('shadowStart', options.shadowStart || 0.45);
        this.set('shadowFading', options.shadowFading || 1.2);

        this.set('lightIntensity', options.lightIntensity || 0.75);

        this.callSuper('initialize', element.text, options);

    },

    isActiveInput: function() {
        var activeElement = $(document.activeElement);
        return (activeElement.is('input') || activeElement.is('textarea'));
    },

    onKeyDown: function(e) {
        if (this.isActiveInput())
            return;
        this.callSuper('onKeyDown', e);
    },

    onKeyPress: function(e) {
        if (this.isActiveInput())
            return;
        this.callSuper('onKeyPress', e);
    },

    toObject : function (){
        return fabric.util.object.extend(this.callSuper('toObject'), {

            mode : this.get('mode'),

            smoothDistance : this.get('smoothDistance'),
            smoothFactor : this.get('smoothFactor'),

            colorDistance : this.get('colorDistance'),

            shadowDepth : this.get('shadowDepth'),
            shadowStart : this.get('shadowStart'),
            shadowFading : this.get('shadowFading'),

            lightIntensity : this.get('lightIntensity')
        })
    },
    ____render:true,

    _render: function (ctx) {
        if (this.width===0 || this.height===0)
            return;

        if (this.get('mode') == "edit"){
            this.callSuper('_render', ctx);
        }
        else if (this.get('mode') == 'emboss') {

            console.log(this);

            var pixelManipulator = PACE.pixelManipulatorEmbossText,
                auxCanvas = pixelManipulator.auxCanvas,
                left = this.get('left'),
                top = this.get('top'),
                fill = this.get('fill'),
                rect = this.getBoundingRect(),
                imgResult = ctx.getImageData(rect.left, rect.top, rect.width, rect.height),
                imgTxt;


            auxCanvas.setDimensions({width: rect.width, height: rect.height});

            this.set({
                top: 0,
                left: 0,
                fill: "rgba(255,0,0,255)",
                mode: "edit"
            });

            //auxCanvas.add(this);
            var auxCtx = auxCanvas.getContext('2d');

            this.callSuper('_render', auxCtx);

            imgTxt = auxCanvas.getContext('2d').getImageData(0,0,rect.width,rect.height);

            this.set({
                top:top,
                left:left,
                fill:fill,
                mode:"emboss"
            });

            var pixelsStats = pixelManipulator.getPixelsStatistics(imgTxt, imgResult);

            // SMOOTH
            pixelManipulator.setPixelsToColor(imgResult, pixelsStats.modified, pixelsStats.avgColor, this.get('smoothDistance'));
            pixelManipulator.multiplePixelsByFactor(imgResult, pixelsStats, this.get('smoothFactor'), false);
            // COLOR
            //console.log('hextoRGB:', this.get('fill'), " to: ", pixelManipulator.hexToRGB(this.get('fill')));
            pixelManipulator.setPixelsToColor(imgResult, pixelsStats.modified, pixelManipulator.hexToRGB(this.get('fill')), this.get('colorDistance'));
            // SHADOW
            pixelManipulator.putShadow(imgResult, pixelsStats.modified, { depth: this.get('shadowDepth'), intensity: this.get('shadowStart'), gradient: this.get('shadowFading')});
            // LIGHT
            pixelManipulator.putLight(imgResult, pixelsStats.onLightEdges, this.get('lightIntensity'));

           ctx.putImageData(imgResult,left,top);

           //auxCanvas.remove(this);
           this.setCoords();
           //this.canvas.calcOffset();
           this.____render = false;
           this.callSuper('_render', ctx);
           this.____render = true;
        }
        else {
            throw new Error("EmbossText. Unknown mode: " + this.mode);
        }
    },

    _renderText: function(ctx, textLines) {
        if (!this.____render)
            return;
      ctx.save();
      this._setShadow(ctx);
      this._renderTextFill(ctx, textLines);
      this._renderTextStroke(ctx, textLines);
      this._removeShadow(ctx);
      ctx.restore();
    },

    refresh: function() {
        this.text = this.element.text;
        this.fill = this.element.color || '#000000';
        this.fontFamily = this.element.fontFamily || 'Times';
        this.fontSize = this.element.fontSize || 16;
        this.fontStyle = this.element.fontStyle || 'normal';
        this.fontWeight = this.element.fontWeight || 'normal';
        this.styles = this.element.styles || {};

        this._initDimensions();
    }
});

*/



