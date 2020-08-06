PACE.ResizeImageElement = function(element, w, h) {
    'use strict';

    this.execute = function() {

        var contentChanged = false;
        if (element.imageFile) {
            if (!element.imageWidth) {
                //new PACE.CenterContentToProportionsCommand(element, true, w, h).execute();
                element.width = w;
                element.height = h;
                new PACE.FillFrameAndCenterCommand(element).execute();
            } else {
                var scale;
                if (w>element.width || h>element.height) {
                    scale = Math.max(w/element.width, h/element.height);
                } else {
                    scale = Math.min(w/element.width, h/element.height);
                }

                var contentMatrix = new PACE.Matrix2D();
                contentMatrix.rotate(element.imageRotation * Math.PI/180);
                contentMatrix.translate(element.imageX, element.imageY);
                contentMatrix.invert();

                //calculate bounding frame center in content space
                var center2 = contentMatrix.transformPoint(w/2, h/2);
                var center = contentMatrix.transformPoint(element.width/2, element.height/2);

                contentMatrix = new PACE.Matrix2D();
                //rotate around bounding frame center and move to the new center
                contentMatrix.translate(-center.x, -center.y);
                contentMatrix.scale(scale, scale);
                contentMatrix.translate(center2.x, center2.y);

                //apply existing transformations
                contentMatrix.rotate(element.imageRotation * Math.PI/180);
                contentMatrix.translate(element.imageX, element.imageY);

                var contentScale = element.imageWidth / element.imageFile.width;
                scale = contentScale * scale;
                
                var p = contentMatrix.transformPoint(0,0);
                element.imageX = p.x ;
                element.imageY = p.y ;
                element.imageWidth = element.imageFile.width * scale;// element.imageWidth * scale;
                element.imageHeight = element.imageFile.height * scale; //element.imageHeight * scale;
                contentChanged = true;
            }
        }

        element.width = w;
        element.height = h;

        if (contentChanged)
            new PACE.FixContentInFrame(element).execute();
    };
    
};

PACE.ResizeToRatio = function(element, ratio) {

    this.execute = function() {
        var w,h;
        
        if (element.width < element.height) {
            w = element.width;
            h = element.width * ratio;
        } else {
            h = element.height;
            w = element.height * ratio;
        }

        var el = new PACE.Element(element),
            center = el.getCenter();

        new PACE.ResizeImageElement(element, w, h).execute();

        var center2 = el.getCenter();
        element.x -= center2.x - center.x;
        element.y -= center2.y - center.y;
    };

}