PACE.ImageCropEditor = function(layoutController, eventOptions) {
    "use strict";
    
    eventOptions = eventOptions || {};

    var frame = new PACE.Frame();
    frame.lockUniScaling = false;
    
    var imageFrame = eventOptions.target,
        renderer = layoutController.currentRenderer,
        element = layoutController.selectedElements[0],
        lastElementState = angular.copy(element),
        imageRotation = element.imageRotation + element.rotation,
        lastCorrectPos,
        timer,
        dashList = [2, 4],
        antOffset = 0,
        constraint;


    function lineDistance( point1, point2 ) {
        var xs = point2.x - point1.x;
        var ys = point2.y - point1.y;
     
        return Math.sqrt( (xs * xs) + (ys * ys) );
    };

    function checkMinMax() {
        var m = new PACE.Element(element).getMatrix();
        var m2 = new PACE.Matrix2D();
        m2.rotate(element.imageRotation*Math.PI/180);
        m2.translate(element.imageX, element.imageY);
        
        //append image transformation matrix to the element matrix
        m.appendMatrix(m2);
        //and invert it
        m.invert();

        var selectionRect = frame.getCoordsInModelSpace();
        var selectionMatrix = new PACE.Element(selectionRect).getMatrix();

        var p1 = selectionMatrix.transformPoint(0, 0);
        var p2 = selectionMatrix.transformPoint(selectionRect.width, 0);
        var p3 = selectionMatrix.transformPoint(selectionRect.width, selectionRect.height);
        var p4 = selectionMatrix.transformPoint(0, selectionRect.height);

        var pp1 = m.transformPoint(p1.x, p1.y);
        var pp2 = m.transformPoint(p2.x, p2.y);
        var pp3 = m.transformPoint(p3.x, p3.y);
        var pp4 = m.transformPoint(p4.x, p4.y);



        //calculate bounding box
        var minx = Math.min( Math.min(pp1.x, pp2.x), Math.min(pp3.x, pp4.x) );
        var maxx = Math.max( Math.max(pp1.x, pp2.x), Math.max(pp3.x, pp4.x) );
        var miny = Math.min( Math.min(pp1.y, pp2.y), Math.min(pp3.y, pp4.y) );
        var maxy = Math.max( Math.max(pp1.y, pp2.y), Math.max(pp3.y, pp4.y) );

        var bbox = new PACE.Rect({x:minx, y:miny, width:maxx - minx, height:maxy - miny});
        //var rect = PACE.GeomService.fitRect(bbox, {width: element.imageWidth, height: element.imageHeight});

        var rect = bbox.intersection({x:0, y:0, width: element.imageWidth, height: element.imageHeight});


        var points = [pp1, pp2, pp3, pp4];
        var outside = false;

        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            if (p.x<0||p.y<0||p.x>element.imageWidth||p.y>element.imageHeight) {
                outside = true;
                break;
            }
        }
        
        if (outside) {

            if (PACE.GeomService.equals(element.rotation,element.imageRotation, 0.1)) {

                if (renderer.canvas._currentTransform &&
                    renderer.canvas._currentTransform.action==='drag') {

                    var left = bbox.x,
                        top = bbox.y,
                        right = bbox.x + bbox.width,
                        bottom = bbox.y + bbox.height;

                    if (left<0) selectionRect.x -= left;
                    if (right>element.imageWidth) selectionRect.x -= (right - element.imageWidth);
                    if (top<0) selectionRect.y -= top;
                    if (bottom>element.imageHeight) selectionRect.y -= (bottom - element.imageHeight);

                } else { 

                    var dx = (rect.x - bbox.x);
                    var dy = (rect.y - bbox.y);
                    var dw = (rect.width - bbox.width);
                    var dh = (rect.height - bbox.height);

                    selectionRect.x += dx;
                    selectionRect.y += dy;
                    selectionRect.width += dw;
                    selectionRect.height += dh;
                }
            
            } else {
                selectionRect.x = lastCorrectPos.x;
                selectionRect.y = lastCorrectPos.y;
                selectionRect.width = lastCorrectPos.width;
                selectionRect.height = lastCorrectPos.height;
                selectionRect.rotation = lastCorrectPos.rotation;
            }
        }

        frame.setCoordsFromModel(selectionRect);
        lastCorrectPos = angular.copy(element);
    };

    function transformHandler(options) {
        
        var minSize = 0.5 * 72 * renderer.canvas.scale;
        frame.width =  Math.max(minSize, frame.width * frame.scaleX);
        frame.height = Math.max(minSize, frame.height * frame.scaleY);
        frame.scaleX = frame.scaleY = 1;

        if (constraint)
            frame.height = frame.width * constraint.height/constraint.width;

        checkMinMax();

        var rect = frame.getCoordsInModelSpace();
        var selectionMatrix = new PACE.Element(rect).getMatrix();
        selectionMatrix.invert();
            
        var m = new PACE.Element(element).getMatrix();
        var p = m.transformPoint(element.imageX, element.imageY);
        var p2 = selectionMatrix.transformPoint(p.x, p.y);
            
        element.x = rect.x;
        element.y = rect.y;
        element.width = rect.width;
        element.height = rect.height;
        element.rotation = rect.rotation;
        element.imageX = p2.x;
        element.imageY = p2.y;
        element.imageRotation = imageRotation - rect.rotation;

        lastCorrectPos = angular.copy(element);
        renderer.renderElement(element);

        //console.log(frame.__corner)
    };

    function onRender() {
        var canvas = renderer.canvas;
        var ctx = canvas.getSelectionContext();

        ctx.save();
        ctx.clearRect(0,0,canvas.width, canvas.height);

        var snappingService = layoutController.snappingService;
        renderer.renderGuides( snappingService.getSnappedGuides() );
       
        var matrix = frame.getGlobalMatrix(),
            lt = new PACE.Point(matrix.transformPoint(0, 0)).round(),
            rt = new PACE.Point(matrix.transformPoint(frame.width, 0)).round(),
            lb = new PACE.Point(matrix.transformPoint(0, frame.height)).round(),
            width = PACE.Point.distance(lt, rt),
            height = PACE.Point.distance(lt, lb);

        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;

        ctx.setLineDash(dashList);
        ctx.lineDashOffset = antOffset;
        ctx.lineJoin = "round";

        ctx.setTransform(1,0,0,1,0,0);
        ctx.translate(lt.x, lt.y);
        ctx.rotate(frame.angle * Math.PI/180);
        ctx.strokeRect(0.5, 0.5, width, height);

        frame.drawControls(ctx);
        ctx.restore();
    }

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

    function doAnts() {
        antOffset++;    
        if (antOffset > 6) antOffset = 0;
        
        onRender();
        timer = setTimeout(doAnts, 100); 
    }

    this.getConstraint = function() { 
        return constraint; 
    };

    this.setConstraint = function(rect) {

        constraint = rect;

        if (constraint) {
            var r1 = frame.width/frame.height,
                r2 = constraint.width/constraint.height;

            if ( (r1>1 && r2<1) || (r1<1 && r2>1)) {
                constraint = {width: constraint.height, height: constraint.width};
            }
        }
        
        transformHandler();
    };

    this.beginEdit = function() {
        var element = layoutController.selectedElements[0],
            canvas = renderer.canvas;

        layoutController.snappingService.beginSnapping(layoutController);
        canvas.snappingService = layoutController.snappingService;

        canvas.on('after:render', onRender);
        canvas.uniScaleTransform = true;

        lastCorrectPos = angular.copy(element);

        if (!imageFrame) {
            imageFrame = renderer.getFabricObject(element._id);
        }
        imageFrame.showCroppedImage = true;
        imageFrame.isMoving = false;

        layoutController.currentTool.croppedElement = element;
            
        frame.canvas = canvas;
        _.extend(frame, _.pick(imageFrame, 'left', 'top', 'width', 'height', 'angle', 'scaleX', 'scaleY'));
        frame.setCoords();
        frame.lockScalingFlip = true;
        canvas.add(frame);
        canvas.setActiveObject(frame);

        if (canvas._currentTransform && eventOptions) {
            transformHandler();

            var action = canvas._currentTransform.action;
            canvas._beforeTransform(eventOptions.e, frame);
            canvas._setupCurrentTransform(eventOptions.e, frame);
            if (action!=='drag' && canvas._currentTransform.action==='drag') {
                canvas._currentTransform.action = action;
            }
        }
        canvas.renderAll();
        //console.log('ImageCropEditor - beginEdit');
        doAnts();
    };

    this.endEdit = function() {
        var canvas = renderer.canvas;
        layoutController.snappingService.endSnapping();
        canvas.snappingService = null;

        clearTimeout(timer);

        canvas.off('after:render', onRender);
        canvas.uniScaleTransform = false;
        
        imageFrame.showCroppedImage = false;
        frame.off('moving', transformHandler);
        frame.off('scaling', transformHandler);
        frame.off('rotating', transformHandler);
        canvas._discardActiveObject();
        canvas.remove(frame);
        canvas.renderAll();
        //console.log('ImageCropEditor - endEdit');
    };

    this.refresh = function() {
        this.endEdit();
        this.beginEdit();
    };

};