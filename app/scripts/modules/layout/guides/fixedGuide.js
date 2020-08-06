var PACE = PACE || {};

(function () {
    'use strict';
    
    var settings = {
        color: '#00ffff',
        colorSelected: '#4f99ff',
        lineWidth: 1
    };
    
    /**
     * Guide that is 'fixed' - independently from the current selection/position of elements.
     */
    PACE.FixedGuide = function (x1, y1, x2, y2, fitPage, selected) {
        if(_.isUndefined(selected)) selected = false;

        this.init(x1, y1, x2, y2);
        this.selected = selected;
        this.fitPage = fitPage;
        this.__type = 'PACE.FixedGuide';
    };
    
    PACE.FixedGuide.prototype = new PACE.Guide();
    
    PACE.FixedGuide.draw = function (guide, canvas) {
        var ctx = canvas.getContext('2d'),
            scale = canvas.scale;
        
        ctx.save();        
        ctx.setTransform(1,0,0,1, Math.round(canvas.offset.x * scale) + 0.5, Math.round(canvas.offset.y * scale) + 0.5);
        ctx.strokeStyle = guide.selected ? settings.colorSelected : settings.color;
        ctx.lineWidth = settings.lineWidth;
        
        ctx.beginPath();
        
        if (guide.fitPage) {
            ctx.moveTo(Math.round(guide.x1 * scale), Math.round(guide.y1 * scale));
            ctx.lineTo(Math.round(guide.x2 * scale), Math.round(guide.y2 * scale));
        } else {
            if (PACE.Guide.isHorizontal(guide)) {
                ctx.moveTo(Math.round(guide.x1 * scale), Math.round(guide.y1 * scale));
                ctx.lineTo(Math.round(guide.x2 * scale), Math.round(guide.y2 * scale));
            } else {
                ctx.moveTo(Math.round(guide.x1 * scale), Math.round(guide.y1 * scale));
                ctx.lineTo(Math.round(guide.x2 * scale), Math.round(guide.y2 * scale));
            }
        }
        
        ctx.stroke();
        ctx.restore();
    };
    
    PACE.FixedGuide.prototype.draw = function (canvas) {
        PACE.FixedGuide.draw(this, canvas);  
    };
    
}());