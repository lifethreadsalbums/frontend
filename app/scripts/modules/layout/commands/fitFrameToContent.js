PACE.FitFrameToContentCommand = function(el, s) {
    "use strict";

    var state = _.pick(el, 'imageX', 'imageY', 'imageWidth', 'imageHeight');

    this.execute = function() {
        if (el.imageFile) {
            el.width = el.imageWidth;
            el.height = el.imageHeight;
            el.x += el.imageX;
            el.y += el.imageY;
            el.imageX = 0;
            el.imageY = 0;
            el.imageRotation = 0;
        }
    };

    this.undo = function() {
        _.extend(el, state);
    };

};