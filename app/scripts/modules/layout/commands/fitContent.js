PACE.FitContentCommand = function(el, s) {
    "use strict";

    var state = _.pick(el, 'imageX', 'imageY', 'imageWidth', 'imageHeight');

    this.execute = function() {
        if (el.imageFile) {
            var rect = PACE.GeomService.fitRectangleProportionally(el.imageFile, el);
            
            el.width = rect.width;
            el.height = rect.height;
            el.imageX = el.width/2 - rect.width/2;
            el.imageY = el.height/2 - rect.height/2;
            el.imageWidth = rect.width;
            el.imageHeight = rect.height;
            el.imageRotation = 0;
        }
    };

    this.undo = function() {
        _.extend(el, state);
    };

};