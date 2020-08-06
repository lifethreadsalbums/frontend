PACE.ImageStampEditor = function(layoutController, debossingCtrl) {
    "use strict";

    var MIN_EDGE_LENGTH = 1.0;

    var injector = angular.element('body').injector(),
        MessageService = injector.get('MessageService'),
        DebossingService = injector.get('DebossingService');
    
    var renderer = layoutController.currentRenderer,
        canvas = renderer.canvas,
        self = this;

    this.onObjectScaling = function(options) {

        // var canvas = renderer.canvas,
        //     activeObject = canvas.getActiveObjectOrGroup(),
        //     element = activeObject.element;

        // var rect = activeObject.getCoordsInModelSpace();

        // var elPos = DebossingService.getElementPosition(rect, 
        //                         debossingCtrl.getCoverLayout().layoutSize, 
        //                         debossingCtrl.getCoverPage(), 
        //                         self.stampPosition);
        // var p = new PACE.Point(elPos.x, elPos.y).toCanvasSpace(canvas);
        // activeObject.left = p.x;
        // activeObject.top = p.y;
        // activeObject.setCoords();

        // canvas._currentTransform.left = p.x;
        // canvas._currentTransform.top = p.y;
        //canvas._setupCurrentTransform(options.e, activeObject);
        //canvas.renderAll();

    };

    this.onObjectModified = function(options) {
        var canvas = renderer.canvas,
            activeObject = canvas.getActiveObjectOrGroup(),
            element = activeObject.element;
        

        var scale = renderer.scale,
            canvas = renderer.canvas,
            target = options.target,
            selectionRect = target.getCoordsInModelSpace(),
            selectedElements = layoutController.selectedElements,
            cmd = new PACE.TransformElementsCommand(selectedElements, selectionRect);
        cmd.renderer = renderer;
        cmd.execute();

        debossingCtrl.fixPosition(element);
        renderer.render();

        var ppi = 72 * target.element.imageFile.width / selectionRect.width,
            minDpi = self.minDpi || 300;

        /*
        if (ppi<minDpi) {
            MessageService.ok('You cannot scale this die any further as it will drop below '+ minDpi+ 'DPI. '+
                'If you need to continue, please upload a larger file.',
                function() {
                    
                    var imageElement = selectedElements[0],
                        dpi = imageElement.imageFile.dpiX || 300,
                        el = new PACE.Element(imageElement),
                        center = el.getCenter();

                    imageElement.imageWidth = imageElement.width = imageElement.imageFile.width * 72/dpi;
                    imageElement.imageHeight = imageElement.height = imageElement.imageFile.height * 72/dpi;

                    var center2 = el.getCenter();

                    imageElement.x += center.x - center2.x;
                    imageElement.y += center.y - center2.y;

                    layoutController.refreshCoverPreview();
                    renderer.render();
                });
            return;
        }
        */

        layoutController.fireEvent('layout:selection-modified');
    };
    

    this.onMouseUp = function (options) {
        layoutController.snappingService.clearSnappedGuides();
        renderer.render();

        var activeObject = canvas.getActiveObjectOrGroup(),
            element = activeObject.element;
        if (activeObject) {
            activeObject.forceCorner = false;
            activeObject.lockUniScaling = false;
        }
    };
    
    function onBeforeMouseDown(e) {
        var canvas = renderer.canvas,
            activeObject = canvas.getActiveObjectOrGroup();

        if (!activeObject) return;

        var maxRect = {
            width: self.stampRect.width, 
            height: self.stampRect.height 
        };

        if (self.dieMaxSize) {
            maxRect.width = Math.min(maxRect.width, self.dieMaxSize.width);
            maxRect.height = Math.min(maxRect.height, self.dieMaxSize.height);
        }
        
        var objectRect = activeObject.getCoordsInModelSpace(),
            rect = PACE.GeomService.fitRectangleProportionally(objectRect, maxRect);

        activeObject.maxScale = (rect.width / objectRect.width) * canvas.scale;

        var minDim = Math.min(objectRect.width, objectRect.height);
        activeObject.minScale = ((MIN_EDGE_LENGTH * 72) / minDim) * canvas.scale;
        
        
        var pointer = canvas.getPointer(e);
        var targetCorner = activeObject._findTargetCorner(pointer),
            middleCorners = { 'mt':'tr', 'mr':'br', 'mb':'br', 'ml':'bl' },
            corner = middleCorners[targetCorner];

        activeObject.centeredScaling = true;
        activeObject.lockUniScaling = true;
        activeObject.lockMovementX = true;
        activeObject.lockMovementY = true;

        if (self.stampPosition && self.stampPosition.bottom && self.stampPosition.right) {
            corner = 'tl';
            activeObject.centeredScaling = false;
        }

        if (corner) {
            activeObject.forceCorner = corner;
        }
    }

    this.beginEdit = function() {
        var canvas = renderer.canvas,
            activeObject = canvas.getActiveObjectOrGroup(),
            element = activeObject.element;

        canvas.uniScaleTransform = true;        
        canvas.snappingService = layoutController.snappingService;
        canvas.on('before:mousedown', onBeforeMouseDown);
        canvas.on('object:modified', this.onObjectModified);
        canvas.on('object:scaling', this.onObjectScaling);
        canvas.on('mouse:up', this.onMouseUp);
        layoutController.snappingService.beginSnapping(layoutController);
        canvas.renderAll();
        //console.debug('ImageStampEditor: beginEdit');
    };

    this.endEdit = function() {
        //console.debug('ImageStampEditor: endEdit');
        var canvas = renderer.canvas;
        canvas.snappingService = undefined;
        canvas.uniScaleTransform = false;
        canvas.off('before:mousedown', onBeforeMouseDown);
        canvas.off('object:modified', this.onObjectModified);
        canvas.off('object:scaling', this.onObjectScaling);
        canvas.off('mouse:up', this.onMouseUp);
        layoutController.snappingService.endSnapping();

        canvas.getSelectionContext().clearRect(0,0,canvas.width, canvas.height);
    };

};