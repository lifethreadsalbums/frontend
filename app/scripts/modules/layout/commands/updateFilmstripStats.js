PACE.UpdateFilmstripStatsCommand = function(layout, coverLayouts) {
    'use strict';
        
    this.execute = function() {

        // For each FilmstripItem, count how many times it appears
        // on the layout.

        var layouts = [layout];
        if (coverLayouts)
            layouts = layouts.concat(coverLayouts);


        var spreads = _.flatten( _.map(layouts, function(cl) { return cl.spreads; }) );
        
        _.each(layout.filmStrip.items, function (item) {
            if(item.type === 'FilmStripImageItem') {
                item.occurrences =
                    _.flatten(
                        _.map(spreads, function (spread) {
                            var elements = _.filter(spread.elements, function (element) {
                                return element.imageFile && item.image &&
                                    ( (element.imageFile === item.image) ||
                                      (element.imageFile.id && item.image.id && element.imageFile.id === item.image.id) ||
                                      (element.imageFile._id && item.image._id && element.imageFile._id === item.image._id) )
                                         
                            });
                            return _.map(elements, function (element) {
                                var pageWidth = layout.layoutSize ? layout.layoutSize.width : 0,
                                    isOnRightPage = spread.numPages===2 && element.x > pageWidth,
                                    pageX =  isOnRightPage ? element.x - pageWidth : element.x,
                                    pageNum = spread.pageNumber + (spread.numPages===2 && isOnRightPage ? 1 : 0);
                                var spreadIndex = (pageNum * 10000000) + (element.y * 10000) + pageX;
                                return {
                                    page: pageNum,
                                    spreadIndex: spreadIndex,  
                                    element: element,
                                    spread: spread,
                                };
                            });
                        })
                    );
            }
        });
        layout.filmStrip._version = (layout.filmStrip._version || 0) + 1;
        
    };

};