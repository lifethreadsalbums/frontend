PACE.TwoSidedBleedCommand = function(el, page) {
    'use strict';
    
    var state = _.pick(el, 'x', 'y', 'width', 'height', 'rotation',
        'imageX', 'imageY', 'imageWidth', 'imageHeight', 'imageRotation');

    this.execute = function() {
        var bleedRect = page.getBleedRect(),
            imageRect = el.imageFile || el,
            rect = PACE.GeomService.fitRect(imageRect, bleedRect);
            
        el.x = bleedRect.x;
        el.y = bleedRect.y;
        el.width = rect.width;
        el.height = rect.height;
        el.imageX = el.width/2 - rect.width/2;
        el.imageY = el.height/2 - rect.height/2;
        el.imageWidth = rect.width;
        el.imageHeight = rect.height;
        el.imageRotation = 0;
        el.rotation = 0;
            
        rect = page.getCenteringRect();
            
        if (el.width<el.height) 
            el.x = (rect.x + rect.width/2) - (el.width/2);
        else
            el.y = (rect.y + rect.height/2) - (el.height/2);
    };

    this.undo = function() {
        _.extend(el, state);
    };

};