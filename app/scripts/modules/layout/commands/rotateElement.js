PACE.RotateElementCommand = function(element, rotation) {
    'use strict';
    
    this.element = element;
    this.prevPos = _.pick(element, 'x', 'y', 'rotation');
    
    this.execute = function() {
        var matrix = new PACE.Element(element).getMatrix(),
            center = matrix.transformPoint(element.width/2, element.height/2),
            angle = rotation - element.rotation;

        //rotate around bounding frame center
        matrix.translate(-center.x, -center.y);
        matrix.rotate(angle * Math.PI/180);
        matrix.translate(center.x, center.y);

        var pt = matrix.transformPoint(0,0);
        element.x = pt.x;
        element.y = pt.y;
        element.rotation = rotation;
    };

    this.undo = function() {
        _.extend(this.element, this.prevPos);
    };

};


PACE.RotateContentCommand = function(element, rotation) {
    'use strict';
    
    this.element = element;
    this.prevPos = _.pick(element, 'imageX', 'imageY', 'imageRotation');
    
    this.execute = function() {
        var angle = rotation - element.imageRotation;
        var contentMatrix = new PACE.Matrix2D();
        contentMatrix.rotate(element.imageRotation * Math.PI/180);
        contentMatrix.translate(element.imageX, element.imageY);
        contentMatrix.invert();

        //calculate bounding frame center in content space
        var center = contentMatrix.transformPoint(element.width/2, element.height/2);

        //rotate around bounding frame center
        contentMatrix = new PACE.Matrix2D();
        contentMatrix.translate(-center.x, -center.y);
        contentMatrix.rotate(angle * Math.PI/180);
        contentMatrix.translate(center.x, center.y);

        //apply existing transformation
        contentMatrix.rotate(element.imageRotation * Math.PI/180);
        contentMatrix.translate(element.imageX, element.imageY);

        var p = contentMatrix.transformPoint(0,0);
        element.imageX = p.x;
        element.imageY = p.y;
        element.imageRotation = rotation;

        //fix content to fit in the frame
        var contentMatrix = new PACE.Matrix2D();
        contentMatrix.rotate(element.imageRotation * Math.PI/180);
        contentMatrix.translate(element.imageX, element.imageY);
        contentMatrix.invert();
        var pp1 = contentMatrix.transformPoint(0, 0);
        var pp2 = contentMatrix.transformPoint(element.width, 0);
        var pp3 = contentMatrix.transformPoint(element.width, element.height);
        var pp4 = contentMatrix.transformPoint(0, element.height);
        //calculate bounding box
        var minx = Math.min( Math.min(pp1.x, pp2.x), Math.min(pp3.x, pp4.x) );
        var maxx = Math.max( Math.max(pp1.x, pp2.x), Math.max(pp3.x, pp4.x) );
        var miny = Math.min( Math.min(pp1.y, pp2.y), Math.min(pp3.y, pp4.y) );
        var maxy = Math.max( Math.max(pp1.y, pp2.y), Math.max(pp3.y, pp4.y) );

        var bbox = {width: maxx - minx, height: maxy - miny};

        var minWidth = maxx - minx;
        var minHeight = maxy - miny;

        var midx = minx + (minWidth/2);
        var midy = miny + (minHeight/2);

        if (minx<0) minx = 0;
        if (maxx>element.imageWidth) maxx = element.imageWidth;
        if (miny<0) miny = 0;
        if (maxy>element.imageHeight) maxy = element.imageHeight;

        var sx1 = (midx - minx) / (minWidth/2);
        var sx2 = (maxx - midx) / (minWidth/2);
        var sx = Math.min(sx1, sx2);

        var sy1 = (midy - miny) / (minHeight/2);
        var sy2 = (maxy - midy) / (minHeight/2);
        var sy = Math.min(sy1, sy2);

        var s = 1 / Math.min(sx, sy);

        //scale around bounding frame center
        contentMatrix = new PACE.Matrix2D();
        contentMatrix.translate(-center.x, -center.y);
        contentMatrix.scale(s,s);
        contentMatrix.translate(center.x, center.y);

        //apply existing transformation
        contentMatrix.rotate(element.imageRotation * Math.PI/180);
        contentMatrix.translate(element.imageX, element.imageY);

        var p = contentMatrix.transformPoint(0,0);
        element.imageX = p.x;
        element.imageY = p.y;
        element.imageWidth = element.imageWidth * s;
        element.imageHeight = element.imageHeight * s;
    };

    this.undo = function() {
        _.extend(this.element, this.prevPos);
    };

};