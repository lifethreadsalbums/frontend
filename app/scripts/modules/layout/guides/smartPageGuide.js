var PACE = PACE || {};

(function(){
    "use strict";
    
    PACE.SmartPageGuide = function(element, x1, y1, x2, y2) {
        this.init(x1, y1, x2, y2);
        this.color = '#FF00FF';
        this.element = element;
    }

    var p = PACE.SmartPageGuide.prototype = new PACE.Guide();

    p.draw = function(canvas) {
        var ctx = canvas.getSelectionContext(),
            scale = canvas.scale,
            bounds = new PACE.Element(canvas.getActiveObjectOrGroup().getCoordsInModelSpace()).getBoundingBox();
            
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, Math.round(canvas.offset.x * scale) + 0.5, Math.round(canvas.offset.y * scale) + 0.5);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.beginPath();

        if (this.isHorizontal())
        {
            var xx1 = Math.min(this.x1, bounds.left);
            var xx2 = Math.max(this.x2, bounds.right);
            ctx.moveTo(Math.round(xx1 * scale), Math.round(this.y1 * scale));
            ctx.lineTo(Math.round(xx2 * scale), Math.round(this.y2 * scale));
        } else if (this.isVertical()) {
            var yy1 = Math.min(this.y1, bounds.top);
            var yy2 = Math.max(this.y2, bounds.bottom);
            ctx.moveTo(Math.round(this.x1 * scale), Math.round(yy1 * scale));
            ctx.lineTo(Math.round(this.x2 * scale), Math.round(yy2 * scale));
        }

        ctx.stroke();
        ctx.restore();
    }
})();


