(function() {
    "use strict";

    //----------------------------------------------------------------
    //                       SinglePrintPage
    //----------------------------------------------------------------
    PACE.SinglePrintPage = function(spread, layoutSize, pageNumber) {
        if (spread && layoutSize) {
            this.layoutSize = layoutSize;
            this.init(spread, this.layoutSize, pageNumber);
        }
    };

    var p = PACE.SinglePrintPage.prototype = new PACE.Page();

    p.getPageLabel = function() {
        return '';
    };

    p.getBleedRect = function() {
            
        var rect = this.getPageRect();
        
        rect.right += this.layoutSize.bleedOutside;
        rect.left -= this.layoutSize.bleedOutside;
        rect.top -= this.layoutSize.bleedTop;
        rect.bottom += this.layoutSize.bleedBottom;
        
        return new PACE.Rect({x:rect.left, y:rect.top, width:rect.right - rect.left, height:rect.bottom - rect.top});
    };

    
    

    //----------------------------------------------------------------
    //                       SinglePrintSpread
    //----------------------------------------------------------------
    PACE.SinglePrintSpread = function(spread, layout) {
        if (spread && layout) {
            
            this.init(spread, layout);
            this.pageClass = PACE.SinglePrintPage;
            this.padding = 300;
            this.createPages();
        }
    };
    p = PACE.SinglePrintSpread.prototype = new PACE.Spread();

    p.createPages = function() {
        
        var page = new this.pageClass(this.spread, this.layout.layoutSize, 0);
        page.spreadInfo = this;
        page.x = 0;
        page.y = 0;

        this.pages = [page];
    };

    p.drawBackground = function(canvas) { };

    p.getCanvasSize = function() {
        var pad2 = this.padding * 2;
        var rect1 = this.pages[0].getPageRect();
            
        var canvasSize = {
            width: rect1.width + pad2,
            height: rect1.height + pad2
        };
        
        return canvasSize;
    };
    

})();