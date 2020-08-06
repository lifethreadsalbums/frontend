/*

The command snaps image to frame center

*/
PACE.SnapContentInFrame = function(element) {
    'use strict';

    var state = _.pick(element, 'imageX', 'imageY', 'imageWidth', 'imageHeight');

    this.execute = function() {
        if ((element.type!=='ImageElement' && element.type!=='CameoElement') || !element.imageFile) return;

        var SNAP_DIST = 10,
            frameCenter = {x: element.width / 2, y: element.height / 2},
            xSnapping = false,
            ySnapping = false;

        var contentMatrix = new PACE.Matrix2D();
        contentMatrix.rotate((element.imageRotation) * Math.PI/180);
        contentMatrix.translate(element.imageX, element.imageY);
        var imageCenter = contentMatrix.transformPoint(element.imageWidth / 2, element.imageHeight / 2);

        if ((imageCenter.x >= frameCenter.x - SNAP_DIST) && (imageCenter.x <= frameCenter.x + SNAP_DIST)) {
            var newX = element.imageX + (frameCenter.x - imageCenter.x);
            element.imageX = newX;
            xSnapping = true;
        }

        if ((imageCenter.y >= frameCenter.y - SNAP_DIST) && (imageCenter.y <= frameCenter.y + SNAP_DIST)) {
            var newY = element.imageY + (frameCenter.y - imageCenter.y);
            element.imageY = newY;
            ySnapping = true;
        }

        return {
            xSnapping: xSnapping,
            ySnapping: ySnapping
        };
    };

    this.undo = function() {
        _.extend(element, state);
    };

};
