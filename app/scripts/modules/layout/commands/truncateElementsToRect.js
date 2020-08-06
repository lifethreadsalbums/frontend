// truncates elements to the bounding rectangle
PACE.TruncateElementsToRectCommand = function (elements, rect) {
    'use strict';
    
    this.execute = function () {
        _.each(elements, function (e) {
            // truncate from left
            if (e.x < rect.x) {
                e.width -= rect.x - e.x;
                e.x = rect.x;
            }
            
            // truncate from top
            if (e.y < rect.y) {
                e.height -= rect.y - e.y;
                e.y = rect.y;
            }
            
            // truncate from right
            if (e.x + e.width > rect.x + rect.width)
                e.width -= (e.x + e.width - rect.x - rect.width);
            
            // truncate from bottom
            if (e.y + e.height > rect.y + rect.height)
                e.height -= (e.y + e.height - rect.y - rect.height);
            
            new PACE.CenterContentCommand(e).execute();
        });
    };
};
