/*

The command checks if the image fills the entire frame and if not,
it fixes the image position and/or size

*/
PACE.FixContentInFrame = function(element, bleed) {
    'use strict';

    var state = _.pick(element, 'imageX', 'imageY', 'imageWidth', 'imageHeight');

    this.execute = function() {
        if ((element.type!=='ImageElement' && element.type!=='CameoElement') || !element.imageFile) return;

        bleed = bleed || 0;

        var elementMatrix = new PACE.Element(element).getMatrix(),
            p1 = elementMatrix.transformPoint(0, 0),
            p2 = elementMatrix.transformPoint(element.width, 0),
            p3 = elementMatrix.transformPoint(element.width, element.height),
            p4 = elementMatrix.transformPoint(0, element.height),
            topLeft = elementMatrix.transformPoint(element.imageX, element.imageY);

        var contentMatrix = new PACE.Matrix2D();
        contentMatrix.rotate((element.imageRotation + element.rotation) * Math.PI/180);
        contentMatrix.translate(topLeft.x, topLeft.y);
        contentMatrix.invert();

        //calculate frame coordinates in content space
        var pp1 = contentMatrix.transformPoint(p1.x, p1.y);
        var pp2 = contentMatrix.transformPoint(p2.x, p2.y);
        var pp3 = contentMatrix.transformPoint(p3.x, p3.y);
        var pp4 = contentMatrix.transformPoint(p4.x, p4.y);
        //calculate bounding box
        var minx = Math.min( Math.min(pp1.x, pp2.x), Math.min(pp3.x, pp4.x) ) - bleed;
        var maxx = Math.max( Math.max(pp1.x, pp2.x), Math.max(pp3.x, pp4.x) ) + bleed;
        var miny = Math.min( Math.min(pp1.y, pp2.y), Math.min(pp3.y, pp4.y) ) - bleed;
        var maxy = Math.max( Math.max(pp1.y, pp2.y), Math.max(pp3.y, pp4.y) ) + bleed;
                
        //calculate min size
        var minWidth = maxx - minx;
        var minHeight = maxy - miny;

        //make sure the content is not distorted
        var contentScale = element.imageWidth / element.imageFile.width;
        element.imageHeight = element.imageFile.height * contentScale;

        if (element.imageWidth < minWidth || element.imageHeight < minHeight) {
            var sX = minWidth/element.imageWidth;
            var sY = minHeight/element.imageHeight;
            var s = Math.max(sX, sY);

            element.imageWidth = element.imageWidth * s;
            element.imageHeight = element.imageHeight * s;
        }

        p1 = {x:0, y:0};
        p2 = {x:element.imageWidth, y: element.imageHeight};

        if (p1.x>minx)
            p1.x = minx;
        if (p1.y>miny)
            p1.y = miny;
        if (p2.x<maxx)
            p1.x = maxx - element.imageWidth;
        if (p2.y<maxy)
            p1.y = maxy - element.imageHeight;
        
        contentMatrix = new PACE.Matrix2D();
        contentMatrix.rotate((element.imageRotation + element.rotation) * Math.PI/180);
        contentMatrix.translate(topLeft.x, topLeft.y);

        var pStart = contentMatrix.transformPoint( p1.x, p1.y );
        elementMatrix.invert();
        pStart = elementMatrix.transformPoint(pStart.x, pStart.y);

        element.imageX = pStart.x;
        element.imageY = pStart.y; 
    };

    this.undo = function() {
        _.extend(element, state);
    };

};