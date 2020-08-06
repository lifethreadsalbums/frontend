PACE.FitElementCommand = function(element, position, spread, layout, mode) {
    'use strict';
     /* jshint indent: false */

    if(typeof(mode) === 'undefined') mode = 'inPlace';

    this.execute = function() {
        var spreadInfo = new PACE.SpreadInfoFactory().create(spread, layout),
            rect;

        switch(mode) {
            case 'left':
                rect = spreadInfo.pages[0].getBleedRect();
                break;
            case 'right':
                rect = spreadInfo.pages[spreadInfo.pages.length - 1].getBleedRect();
                break;
            case 'spread':
                rect = spreadInfo.pages[0].getBleedRect().union(spreadInfo.pages[spreadInfo.pages.length - 1].getBleedRect());
                break;
            case 'inPlace':
            default:
                var w = Math.min(layout.layoutSize.width, layout.layoutSize.height) * 0.75,
                    h = w * element.imageFile.height / element.imageFile.width;

                rect = { 
                    x: position.x - w / 2,
                    y: position.y - h / 2,
                    width: w,
                    height: h
                };
                break;
        }

        element.x = rect.x;
        element.y = rect.y;
        element.width = rect.width;
        element.height = rect.height;
        element.imageX = 0;
        element.imageY = 0;
        element.imageRotation = 0;
        element.rotation = 0;

    };
};
