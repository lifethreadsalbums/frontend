PACE.SwapContentCommand = function(element1, element2) {
    "use strict";
    
    var state = [];
    _.each([element1, element2], function (item) {
        state.push(_.pick(item, 'imageFile', 'imageX', 'imageY', 'imageWidth', 'imageHeight'));
    });

    this.execute = function() {
        if (!element1.imageFile || !element2.imageFile)
            return;
        var tmp = element2.imageFile;
        element2.imageFile = element1.imageFile;
        element1.imageFile = tmp;
        
        _.each([element1, element2], function (element) {
            new PACE.FillFrameCommand(element).execute();
            new PACE.CenterContentCommand(element).execute();
        });
    };

    this.undo = function() {
        _.extend(element1, state[0]);
        _.extend(element2, state[1]);
    };

};

PACE.ReplaceContentCommand = function(element, imageFile) {
    "use strict";
    
    var state = _.pick(element, 'imageFile', 'imageX', 'imageY', 'imageWidth', 'imageHeight');
    if (!element.imageFile) state.imageFile = null;

    this.execute = function() {
        var oldImage = element.imageFile;
        element.imageFile = imageFile;
        var keepCrop = false;

        if (oldImage) {
            var oldRatio = oldImage.width > oldImage.height,
                newRatio = element.imageFile.width > element.imageFile.height;

            keepCrop = oldRatio===newRatio;
        }

        if (keepCrop) {
            var ratio = oldImage.height / oldImage.width,
                sx = element.imageX / element.imageWidth,
                sy = element.imageY / element.imageHeight;

            element.imageHeight = element.imageWidth * ratio;
            element.imageX = element.imageWidth * sx;
            element.imageY = element.imageHeight * sy;
            new PACE.FixContentInFrame(element).execute();
        } else {
            new PACE.FillFrameCommand(element).execute();
            new PACE.CenterContentCommand(element).execute();
        }
        new PACE.PreflightElementCommand(element).execute();
    };

    this.undo = function() {
        _.extend(element, state);
    };

};