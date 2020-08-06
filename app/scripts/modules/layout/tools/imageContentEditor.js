PACE.ImageContentEditor = function(layoutController, eventOptions) {
    'use strict';
        
    var frame = new PACE.Frame();
    frame.lockUniScaling = true;
    var imageFrame = eventOptions.target;
    
    var renderer = layoutController.currentRenderer;
    var element = layoutController.selectedElements[0];
    var lastElementState = angular.copy(element);

    var checkMinMax = function() {
        var scale = renderer.scale,
            offset = renderer.offset;
        
        var elementMatrix = new PACE.Matrix2D();
        elementMatrix.rotate(element.rotation*Math.PI/180);
        elementMatrix.translate((element.x * scale) + offset.x , (element.y * scale) + offset.y);

        var p1 = elementMatrix.transformPoint(0, 0);
        var p2 = elementMatrix.transformPoint(element.width * scale, 0);
        var p3 = elementMatrix.transformPoint(element.width * scale, element.height * scale);
        var p4 = elementMatrix.transformPoint(0, element.height * scale);
        
        var inv = frame.getMatrix();
        inv.invert();
        //calculate frame coordinates in content space
        var pp1 = inv.transformPoint(p1.x, p1.y);
        var pp2 = inv.transformPoint(p2.x, p2.y);
        var pp3 = inv.transformPoint(p3.x, p3.y);
        var pp4 = inv.transformPoint(p4.x, p4.y);
        //calculate bounding box
        var minx = Math.min( Math.min(pp1.x, pp2.x), Math.min(pp3.x, pp4.x) );
        var maxx = Math.max( Math.max(pp1.x, pp2.x), Math.max(pp3.x, pp4.x) );
        var miny = Math.min( Math.min(pp1.y, pp2.y), Math.min(pp3.y, pp4.y) );
        var maxy = Math.max( Math.max(pp1.y, pp2.y), Math.max(pp3.y, pp4.y) );
                
        //calculate min size
        var minWidth = maxx - minx;
        var minHeight = maxy - miny;
        
        if (frame.width < minWidth || frame.height < minHeight) {
            var sX = minWidth/frame.width;
            var sY = minHeight/frame.height;
            var s = Math.max(sX, sY);

            frame.width = frame.width * s;
            frame.height = frame.height * s;
        }

        p1 = {x:0, y:0};
        p2 = {x:frame.width, y: frame.height};
        
        if (p1.x>minx)
            p1.x = minx;
        if (p1.y>miny)
            p1.y = miny;
        if (p2.x<maxx)
            p1.x = maxx - frame.width;
        if (p2.y<maxy)
            p1.y = maxy - frame.height;
        
        var m = frame.getMatrix();
        var pStart = m.transformPoint( 
            frame.originX === 'left' ? p1.x : frame.width/2 + p1.x ,
            frame.originY === 'top' ? p1.y : frame.height/2 + p1.y  
        );
        
        frame.left = pStart.x;
        frame.top = pStart.y;
    };

    var transformHandler = function(options) {
        frame.width = frame.width * frame.scaleX;
        frame.height = frame.height * frame.scaleY;
        frame.scaleX = frame.scaleY = 1;
        checkMinMax();

        var scale = renderer.scale,
            offset = renderer.offset;
            
        var m = new PACE.Matrix2D();
        m.rotate(element.rotation*Math.PI/180);
        m.translate(element.x, element.y);
        m.invert();

        var frameMatrix = frame.getMatrix();
        var frameTopLeft = frameMatrix.transformPoint(0, 0);
        
        var p = m.transformPoint((frameTopLeft.x - offset.x) / scale , (frameTopLeft.y - offset.y) / scale);
        element.imageX = p.x;
        element.imageY = p.y;
        element.imageWidth = frame.width * frame.scaleX / scale;
        element.imageHeight = frame.height * frame.scaleY / scale;
        element.imageRotation = frame.angle - element.rotation;
        renderer.renderElement(element);
    };

    frame.on('moving', transformHandler);
    frame.on('scaling', transformHandler);
    frame.on('rotating', transformHandler);

    frame.on('modified', function(options) {
        var cmd = new PACE.TransformElementCommand(element, angular.copy(element), lastElementState);
        cmd.renderer = layoutController.currentRenderer;
        cmd.execute();
        layoutController.undoService.pushUndo(cmd);
        lastElementState = angular.copy(element);
        layoutController.fireEvent('layout:selection-modified');
    });

    this.beginEdit = function() {
        var element = layoutController.selectedElements[0],
            scale = renderer.scale,
            offset = renderer.offset,
            canvas = renderer.canvas,
            pt = new PACE.Element(element).getMatrix()
                .transformPoint(element.imageX, element.imageY),
            topLeft = new PACE.Point(pt.x, pt.y).toCanvasSpace(canvas);

        lastElementState = angular.copy(element);

        frame.left = topLeft.x;
        frame.top = topLeft.y;
        frame.width = element.imageWidth * scale;
        frame.height = element.imageHeight * scale;
        frame.angle = element.rotation + element.imageRotation;

        imageFrame.showCroppedImage = true;
        canvas.add(frame);
        
        setTimeout(function() { 
            canvas.setActiveObject(frame); 
            if (eventOptions.e) {
                canvas._beforeTransform(eventOptions.e, frame);
                canvas._setupCurrentTransform(eventOptions.e, frame);
            }
        });
    };

    this.endEdit = function() {
        var canvas = renderer.canvas;
        imageFrame.showCroppedImage = false;
        frame.off('moving', transformHandler);
        frame.off('scaling', transformHandler);
        frame.off('rotating', transformHandler);
        canvas.remove(frame);
    };

};