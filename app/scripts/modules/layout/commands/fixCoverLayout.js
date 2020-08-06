(function() {
    "use strict";

  
    PACE.FixCoverLayoutCommand = function(coverLayout) {
        
        var prevCoverLayout = angular.copy(coverLayout);
       
        this.execute = function() {
            var spread = coverLayout.spreads[0],
                backgroundFrames = _.filter(spread.elements, {type:'BackgroundFrameElement'}),
                backgroundSpineFrames = _.filter(spread.elements, {type:'BackgroundFrameElement', target:'spine'}),
                spineTexts = _.filter(spread.elements, {type:'SpineTextElement'});
            
            new PACE.MoveElementsCommand(spread, backgroundFrames, 0).execute();
            new PACE.MoveElementsCommand(spread, backgroundSpineFrames, spread.elements.length - 1).execute();
            new PACE.MoveElementsCommand(spread, spineTexts, spread.elements.length - 1).execute();
            
            //fix spine text
            if (coverLayout.layoutSize.dynamicSpineWidth) {
                
                var spreadInfo = new PACE.SpreadInfoFactory().create(spread, coverLayout),
                    spineRect = spreadInfo.getSpineRect();

                coverLayout.viewState = coverLayout.viewState || {};

                var oldPageCount = coverLayout.viewState.pageCount;
                var newPageCount = spreadInfo.getPageCount();
                if (oldPageCount!==newPageCount) {

                    var oldSpreadInfo = new PACE.FicSpread(spread, coverLayout, oldPageCount);

                    //fix layout
                    coverLayout.viewState.pageCount = newPageCount;

                    for (var i = 0; i < spread.elements.length; i++) {
                        var el = spread.elements[i];
                        if (el.type==='SpineTextElement') {
                            var scale = spineRect.width / el.height;

                            el.x = spineRect.x + spineRect.width;
                            el.y = spineRect.y;
                            el.width = spineRect.height;
                            el.height = spineRect.width;

                            if (el.text) {
                                //scale spine text
                                
                                var newLine = /\r?\n/;
                                var textLines = el.text.split(newLine);
                                _.each(textLines, function(textLine, lineIndex) {
                                    _.each(textLine, function(ch, charIndex) {
                                        var charStyle = _.pick(el, 'fontSize');
                                        if (el.styles[lineIndex] && el.styles[lineIndex][charIndex]) {
                                            charStyle = _.extend(charStyle, el.styles[lineIndex][charIndex]);
                                        } else {
                                            if (!el.styles[lineIndex]) el.styles[lineIndex] = {};
                                            if (!el.styles[lineIndex][charIndex]) el.styles[lineIndex][charIndex] = {};
                                        }
                                        el.styles[lineIndex][charIndex].fontSize = 
                                            Math.round(charStyle.fontSize * scale * 1.2 * 2) / 2;
                                    });
                                });
                                
                                //fake text box
                                var tb = new PACE.SpineTextElement(el);
                                tb.canvas = {scale:1.0, offset:{x:0,y:0}};
                                tb.setCoordsFromModel(el);
                                tb.refresh();
                                tb._initDimensions();
                                tb._autoSize();
                                el.styles = angular.copy(tb.styles);

                                el.refreshAlign = true;
                            }
                        } else if (el.type==='BackgroundFrameElement' && el.target==='spine') {
                            el.x = spineRect.x;
                            el.width = spineRect.width;
                            
                        } else if (el.type==='BackgroundFrameElement') {
                            var page = spreadInfo.getPage(el);

                            if (page) {
                                var rect = page.getBleedRect();
                                el.x = rect.x;
                                el.y = rect.y;
                                el.width = rect.width;
                                el.height = rect.height;
                            }
                        } else {
                            //fix other frames
                            var eq = PACE.GeomService.equals,
                                rectEq = function(el, rect) {
                                    return (eq(el.x, rect.x) && eq(el.y, rect.y) && 
                                        eq(el.width, rect.width) && eq(el.height, rect.height));
                                };

                            var oldPage = oldSpreadInfo.getPage(el),
                                oldBleed = oldPage.getBleedRect(),
                                newPage = spreadInfo.pages[oldPage.pageNumber],
                                oldFullBleed = oldSpreadInfo.getBleedRect();
                            
                            //fix full bleed images
                            
                            if (rectEq(el, oldFullBleed)) {
                                var newFullBleed = spreadInfo.getBleedRect();
                                el.x = newFullBleed.x;
                                el.y = newFullBleed.y;
                                new PACE.ResizeImageElement(el, newFullBleed.width, newFullBleed.height).execute();
                            }
                        
                            //fix images on the right page
                                
                            if (rectEq(el, oldBleed)) {
                                var newBleed = newPage.getBleedRect();
                                el.x = newBleed.x;
                                el.y = newBleed.y;
                                new PACE.ResizeImageElement(el, newBleed.width, newBleed.height).execute();
                            } else {
                                var dx = newPage.getBleedRect().getCenter().x - oldPage.getBleedRect().getCenter().x;
                                el.x += dx;
                            }
                            
                        }

                    };
                }
            }
        };

        this.undo = function() {
            
        };

    };

}());
