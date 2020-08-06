var PACE = PACE || {};

(function() {
	"use strict";

	PACE.Guide = function(x1, y1, x2, y2) { 
	    this.init(x1, y1, x2, y2);
	}
    
    PACE.Guide.isHorizontal = function(guide) {
        return guide.y1 === guide.y2;  
    };
    
    PACE.Guide.isVertical = function(guide) {
        return guide.x1 === guide.x2;  
    };
    
	var p = PACE.Guide.prototype;
	p.init = function(x1, y1, x2, y2) {
	    this.x1 = x1;
	    this.y1 = y1;
	    this.x2 = x2;
	    this.y2 = y2;
	}

	p.isHorizontal = function() {
	    return PACE.Guide.isHorizontal(this);
	}

	p.isVertical = function() {
	    return PACE.Guide.isVertical(this);
    }
    
})();