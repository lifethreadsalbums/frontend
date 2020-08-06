PACE.FixFrameOnSpread = function(element, spread, layout) {
    'use strict';
    
    this.execute = function() {
        var bbox = new PACE.Element(element).getBoundingBox(),
            spreadInfoFactory = new PACE.SpreadInfoFactory,
            spreadInfo = spreadInfoFactory.create(spread, layout),
            bleedRect = spreadInfo.getBleedRect();

        if (bbox.width>bleedRect.width || bbox.height>bleedRect.height) {
            var scaleX = Math.min(bleedRect.width, bbox.width)/bbox.width,
                scaleY = Math.min(bleedRect.height, bbox.height)/bbox.height,
                s = Math.min(scaleX, scaleY);

            new PACE.ResizeImageElement(element, element.width*s, element.height*s).execute();
            bbox = new PACE.Element(element).getBoundingBox();
        }
        var rect = new PACE.Rect(bbox),
            page = spreadInfo.getPage(element),
            margin = page.getMarginRect(),
            bleed = page.getBleedRect();

        if (bbox.right>margin.right && page.isRight()) {
            rect.x = (bbox.right - margin.right) >= (bleed.right - bbox.right) ? bleed.right - rect.width : margin.right - rect.width;
        } else if (bbox.left<margin.left && page.isLeft()) {
            rect.x = (margin.left - bbox.left) >= (bbox.left - bleed.left) ? bleedRect.left : margin.left;
        }

        if (bbox.bottom>margin.bottom) {
            rect.y = (bbox.bottom - margin.bottom) >= (bleed.bottom - bbox.bottom) ? bleed.bottom - rect.height : margin.bottom - rect.height;
        } else if (bbox.top<margin.top) {
            rect.y = (margin.top - bbox.top) >= (bbox.top - bleed.top) ? bleed.top : margin.top;
        }

        element.x += rect.x - bbox.x;
        element.y += rect.y - bbox.y;
    };

};

PACE.CheckFramesOnSpread = function(layoutController, spread, layout) {
    'use strict';

    var injector = angular.element('body').injector(),
        LayoutValidator = injector.get('LayoutValidator');

    this.execute = function() {

        if (!spread) {
            spread = layoutController.currentRenderer.spread;
            layout = layoutController.currentRenderer.layout;
        }
        
        var result = LayoutValidator.getBrokenRulesForSpread(spread, layout);
        var found = _.findWhere(result, {type:'ForbiddenZone'});
        
        if (found) {
            var hasErrors = spread.hasErrorsLeft || spread.hasErrorsRight;

            spread.hasErrorsLeft = spread.hasErrorsRight = false;
            var spreadInfo = PACE.Spread.create(spread, layout);
            var numEmptyFrames = 0,
                numImageFrames = 0,
                numTextFrames = 0,
                textOnTop = false,
                marginRect = spreadInfo.getMarginRect();
            _.each(found.elements, function(el) {

                if (el.type==='ImageElement') {
                    if (el.imageFile) numImageFrames++; 
                    else numEmptyFrames++;
                } else if (el.type==='TextElement') {

                    var bbox = new PACE.Element(el).getBoundingBox();
                    if (bbox.top < marginRect.top) 
                        textOnTop = true;

                    numTextFrames++;
                }

                var page = spreadInfo.getPage(el);
                if (page.isLeft()) spread.hasErrorsLeft = true;
                if (page.isRight()) spread.hasErrorsRight = true;
            });

            var oldErrorTop = spread.errorTop,
                oldErrorBottom = spread.errorBottom;

            if (numImageFrames>0 && numEmptyFrames===0 && numTextFrames===0) {
                spread.errorTop = 1 + (numImageFrames>1 ? 10 : 0);
                spread.errorBottom = 1 + (numImageFrames>1 ? 10 : 0);
            } else if (numImageFrames===0 && numEmptyFrames>0 && numTextFrames===0) {
                spread.errorTop = 2 + (numEmptyFrames>1 ? 10 : 0);
                spread.errorBottom = 2 + (numEmptyFrames>1 ? 10 : 0);
            } else if (numImageFrames===0 && numEmptyFrames===0 && numTextFrames>0) {
                spread.errorTop = 3 + (numTextFrames>1 ? 10 : 0);
                spread.errorBottom = 3 + (numTextFrames>1 ? 10 : 0);
            } else if (numImageFrames>0 && numTextFrames>0) {
                if (textOnTop) {
                    spread.errorTop = 3 + (numTextFrames>1 ? 10 : 0);
                    spread.errorBottom = 1 + (numImageFrames>1 ? 10 : 0);
                } else {
                    spread.errorTop = 1 + (numImageFrames>1 ? 10 : 0);;
                    spread.errorBottom = 3 + (numTextFrames>1 ? 10 : 0);
                }
            } else if (numEmptyFrames>0 && numTextFrames>0) {
                if (textOnTop) {
                    spread.errorTop = 3 + (numTextFrames>1 ? 10 : 0);
                    spread.errorBottom = 2 + (numEmptyFrames>1 ? 10 : 0);
                } else {
                    spread.errorTop = 2 + (numEmptyFrames>1 ? 10 : 0);
                    spread.errorBottom = 3 + (numTextFrames>1 ? 10 : 0);
                }
            }

            if (!hasErrors || oldErrorTop!==spread.errorTop || oldErrorBottom!==spread.errorBottom) {
                layoutController.fireEvent('layout:errors-added', {spread:spread});
            }
        } else {
            var hasErrors = spread.hasErrorsLeft || spread.hasErrorsRight;
            if (hasErrors) {
                spread.hasErrorsLeft = spread.hasErrorsRight = false;
                layoutController.fireEvent('layout:errors-removed', {spread:spread});
            }
        }

    };
};