PACE.FillFrameCommand = function(el) {
    "use strict";

    var state = _.pick(el, 'imageX', 'imageY', 'imageWidth', 'imageHeight');

    this.execute = function() {
        if (el.imageFile) {
            var scale1 = el.width / el.imageFile.width,
                scale2 = el.height / el.imageFile.height,
                scale = Math.max(scale1, scale2);

            el.imageWidth = el.imageFile.width * scale;
            el.imageHeight = el.imageFile.height * scale;
            el.imageRotation = 0;
            el.imageX = 0;  
            el.imageY = 0;
        }
    };

    this.undo = function() {
        _.extend(el, state);
    };

};

PACE.FillFrameAndCenterCommand = function(el) {
    "use strict";

    var state = _.pick(el, 'imageX', 'imageY', 'imageWidth', 'imageHeight');

    this.execute = function() {
        
        new PACE.FillFrameCommand(el).execute();
        new PACE.CenterContentCommand(el).execute();
        
    };

    this.undo = function() {
        _.extend(el, state);
    };

};