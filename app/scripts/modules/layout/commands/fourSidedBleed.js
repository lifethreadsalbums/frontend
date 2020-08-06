PACE.FourSidedBleedCommand = function(el, page) {
    'use strict';
    
    var state = _.pick(el, 'x', 'y', 'width', 'height');

    this.execute = function() {
        var bleedRect = page.getBleedRect();
            
        _.extend(el, _.pick(bleedRect, 'x', 'y', 'width', 'height'));
        new PACE.FillFrameCommand(el).execute();
        new PACE.CenterContentCommand(el).execute();
    };

    this.undo = function() {
        _.extend(el, state);
    };

};

/**
 * Command for layouting single image element in the whole 
 * spread, spanning up to the bleeds.
 */
PACE.SpreadFourSidedBleedCommand = function (el, page, pages) {
    'use strict';
    
    var state = _.pick(el, 'x', 'y', 'width', 'height');
    
    this.execute = function () {
        var rects = _.map(pages, function (page) { return page.getBleedRect(); });
        
        // if there are two pages, then spread over them,
        // otherwise probably there is only one page left,
        // so apply FourSidedBleedCommand
        if (rects.length === 2) {
            var rect = rects[0].union(rects[1]);
            _.extend(el, _.pick(rect, 'x', 'y', 'width', 'height'));

            new PACE.FillFrameCommand(el).execute();
            new PACE.CenterContentCommand(el).execute();
        } else new PACE.FourSidedBleedCommand(el, page).execute();
    };
    
    this.undo = function () {
        _.extend(el, state);
    };
};