PACE.FixFilmstripCommand = function(mode, layout) {
    'use strict';

    this.execute = function() {
        var pages = [],
            spreadFactory = new PACE.SpreadInfoFactory(),
            pageNumber = 1,
            pageMode = 'both';
            
        if (mode==='double-spread')
            pageMode = 'spread';
        else if (mode.indexOf('-left')>0)
            pageMode = 'left';
        else if (mode.indexOf('-right')>0)
            pageMode = 'right';

        // if (mode === 'clear') {
        //     return;
        // }

        _.each(layout.spreads, function(spread) {
            var spreadPages = spreadFactory.create(spread, layout).pages;
            _.each(spreadPages, function(page) {
                if (page.getElementsOfType('TextElement').length>0) return;

                if (pageMode==='both' ||
                    ((pageMode==='left' || pageMode === 'spread') && page.isLeft()) ||
                    (pageMode==='right' && !page.isLeft()) || (!layout.lps && pageNumber===1)) {

                    page.pages = spreadPages;
                    page.spread = spread;
                    pages.push(page);
                }
                pageNumber++;
            });
        });

        var imageGroups = [],
            lastStackId;

        _.each(layout.filmStrip.items, function(item) {
            if (item.type === 'FilmStripImageItem' && 
                item.image.status!=='Rejected' &&
                item.image.status!=='Cancelled') {
                
                if (item.stackId != null && lastStackId === item.stackId) {
                    _.last(imageGroups).push(item);
                } else {
                    lastStackId = item.stackId;
                    imageGroups.push([item]);
                }
            } 
        });

        var pageIdx = 0, 
            imageIdx = 0,
            changed = false;
        while(pageIdx<pages.length && imageIdx<imageGroups.length) {
            var page = pages[pageIdx],
                imageGroup = imageGroups[imageIdx];

            if (imageGroup.length===1 && imageGroup[0].isDoubleSpread) {
                if (page.isLeft())
                    pageIdx++;
                else {
                    imageGroup[0].isDoubleSpread = false;
                    changed = true;
                }
            } 
            pageIdx++;
            imageIdx++;
        }
        
    };

};
