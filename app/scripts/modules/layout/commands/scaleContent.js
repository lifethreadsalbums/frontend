PACE.ScaleContentCommand = function(el, s) {
    "use strict";

    var state = _.pick(el, 'imageX', 'imageY', 'imageWidth', 'imageHeight');

    this.execute = function() {
        if (el.imageFile)
        {
            var scale1 = el.imageWidth / el.width,
                scale2 = el.imageHeight / el.height,
                scale = s / Math.min(scale1, scale2);

            var cx = (el.width/2 - el.imageX) / el.imageWidth;
            var cy = (el.height/2 - el.imageY) / el.imageHeight;
            el.imageWidth *= scale;
            el.imageHeight *= scale;
            
            el.imageX = Math.min(0, -(cx * el.imageWidth) + el.width/2);
            el.imageY = Math.min(0, -(cy * el.imageHeight) + el.height/2);
        }
    };

    this.undo = function() {
        _.extend(el, state);
    };
};