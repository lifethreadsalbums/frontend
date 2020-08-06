(function() {
    'use strict';

    function makeFloatingImageCommand(size) {
        return function(el, page) {
            var stateCmd;

            this.execute = function() {
                var rect = PACE.GeomService.getFloatingImageSize(page.layoutSize, size);
                if (_.isArray(el)) {
                    stateCmd = new PACE.SaveElementsStateCommand(el);
                    stateCmd.execute();

                    var group = new PACE.Elements(el),
                        bbox = group.getBoundingBox(),
                        center = bbox.getCenter(),
                        gap = group.getGapSpacing() || PACE.AppConstants.DEFAULT_FIXED_SPACING;

                    rect = PACE.GeomService.fitRectangleProportionally(bbox, rect);

                    rect.x = center.x - rect.width/2;
                    rect.y = center.y - rect.height/2;
                    rect.rotation = 0;

                    gap += (bbox.width>rect.width ? -0.000001 : 0.000001); 
                    
                    new PACE.TransformElementsCommand(el, rect).execute();
                    new PACE.FixedSpacingCenteredCommand(el, gap).execute();
                    return;
                } 

                stateCmd = new PACE.SaveElementsStateCommand([el]);
                stateCmd.execute();

                if (!(el.width && el.height)) {
                    rect = PACE.GeomService.fitRectangleProportionally(el.imageFile, rect);
                
                    el.width = rect.width;
                    el.height = rect.height;
                    el.imageWidth = rect.width;
                    el.imageHeight = rect.height;
                    el.rotation = 0;
                    el.imageRotation = 0;
                        
                    new PACE.CenterFrameCommand(el, page).execute();
                    new PACE.CenterContentCommand(el).execute();
                } else {
                    rect = PACE.GeomService.fitRectangleProportionally(el, rect);

                    var cp1 = new PACE.Element(el).getCenter();
                    new PACE.ResizeImageElement(el, rect.width, rect.height).execute();
                    var cp2 = new PACE.Element(el).getCenter();
                    el.x += cp1.x - cp2.x;
                    el.y += cp1.y - cp2.y;
                }
            };

            this.undo = function() {
                stateCmd.undo();
            };

        };
    }

    PACE.FloatingImageSmallCommand = makeFloatingImageCommand('s');
    PACE.FloatingImageMediumCommand = makeFloatingImageCommand('m');
    PACE.FloatingImageLargeCommand = makeFloatingImageCommand('l');
    PACE.FloatingImageCommand = makeFloatingImageCommand('l');

}());