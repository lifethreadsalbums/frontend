(function() {
    "use strict";

    PACE.Page = function(spread, layoutSize, pageNumber) {
        this.init(spread, layoutSize, pageNumber);
    };

    var p = PACE.Page.prototype;

    p.init = function(spread, layoutSize, pageNumber) {
        this.x = 0;
        this.y = 0;
        this.layoutSize = layoutSize;
        this.spread = spread;
        this.pageNumber = pageNumber;
    };

    p.getElements = function (fPred) {
        var elements = [];
            
        for (var i = 0; i < this.spread.elements.length; i++) {
            var el = this.spread.elements[i];
            
            if (this.spread.numPages === 1 || this.containsElement(el)) {
                if (fPred) {
                    if (fPred(el)) elements.push(el); 
                } else elements.push(el);
            }
        }
        return elements;
    };

    p.getElementsOfType = function(type) {
        return this.getElements(function (el) {
            return el.type === type;
        });
    };
    
    p.getImageElements = function () {
        return this.getElementsOfType('ImageElement');
    };

    p.getElementAreaOnPage = function(element) {
        var rect = this.getPageRect(),
            buffer = 2000;
        
        if (this.isHorizontal()) {
            rect.top -= buffer;
            rect.bottom += buffer;
            if (this.isLeft()) {
                rect.left -= buffer;
            } else {
                rect.right += buffer;
            }
        } else {
            rect.right += buffer;
            rect.left -= buffer;
            if (this.isLeft()) {
                rect.top -= buffer;
            } else {
                rect.bottom += buffer;
            }
        }
        rect = new PACE.Rect({
            x: rect.left,
            y: rect.top,
            width: rect.right - rect.left, 
            height:rect.bottom - rect.top
        });
        
        var elementBounds = new PACE.Element(element).getBoundingBox(),
            intersection = rect.intersection(elementBounds),
            area1 = elementBounds.width * elementBounds.height,
            area2 = intersection ? (intersection.width * intersection.height) : 0;
        
        return (area2/area1);
    };

    p.containsElement = function(el) {
        return this.spreadInfo.getPage(el) == this;
    };
    
    p.getHalfInchRect = function () {
        var r = this.getBleedRect(),
            h = 0.5 * 72;
        return new PACE.Rect({
            x: r.x + h,
            y: r.y + h,
            width: r.width - 2 * h,
            height: r.height - 2 * h
        });
    };

    p.getPageRect = function() {
        return new PACE.Rect({
            x:this.x, 
            y:this.y, 
            width:this.layoutSize.width, 
            height:this.layoutSize.height
        });
    };

    p.getTrimRect = function() {
        return this.getPageRect();
    };
            
    p.getBleedRect = function() {
        return this.getPageRect();
    };
            
    p.getMarginRect = function() {
        return this.getPageRect();
    };
    
    p.getFloatRect = function () {
        return this.getPageRect();
    };

    p.getPageNumber = function () {
        return this.spread.pageNumber + this.pageNumber;
    };

    p.getSpreadNumber = function() {
        var pageIndex = this.getPageNumber() - 1;
        var spreadIndex = this.layoutSize.lps ? Math.floor(pageIndex/2) : Math.floor((pageIndex+1)/2);
        return spreadIndex + 1;
    };

    p.isEven = function() {
        return this.getPageNumber()%2===0;
    };

    p.isLeft = function() {
        var pageNumber = this.getPageNumber();
        if (this.layoutSize.lps)
            return pageNumber%2!==0;
        else
            return pageNumber%2===0;
    };

    p.isRight = function() {
        return !this.isLeft();
    };

    p.isHorizontal = function() {
        return (this.layoutSize.pageOrientation==='Horizontal');
    };

    p.getPageLabel = function() {
        return this.layoutSize.lps ? this.getSpreadNumber().toString() : this.getPageNumber().toString();
    };

    p.getCenteringRect = function() {
        var centerRect = this.layoutSize.centerRect || 'margin',
            centerOffset = this.spreadInfo.layout.centerOffset || 0,
            rect = centerRect==='margin' ? this.getMarginRect() : this.getTrimRect();
            
        //console.log('getCenteringRect', centerRect, centerOffset);
        if (centerOffset!==0) {
            if (this.isHorizontal())
                rect.x += (this.isLeft() ? -1 : 1) * centerOffset;
            else
                rect.y += (this.isLeft() ? -1 : 1) * centerOffset;
        }
        return rect;
    };

    p.drawLabels = function(canvas) { };

    p.drawBackground = function(canvas) { };
 
    p.draw = function(canvas, numPages) { };

    p.getGuides = function() { return []; };


})();