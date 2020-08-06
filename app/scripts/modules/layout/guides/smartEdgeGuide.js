var PACE = PACE || {};

(function(){
    "use strict";

    PACE.SmartEdgeGuide = function(element, x1, y1, x2, y2) {
        this.init(x1, y1, x2, y2);
        this.color = '#01DB25';
        this.element = element;
    }

    var p = PACE.SmartEdgeGuide.prototype = new PACE.Guide();

    p.draw = function(canvas) {
        var ctx = canvas.getSelectionContext(),
            scale = canvas.scale;

        var elementBounds = new PACE.Element(this.element).getBoundingBox();
        var selectionBounds = new PACE.Element(canvas.getActiveObjectOrGroup().getCoordsInModelSpace()).getBoundingBox();
        var bounds = elementBounds.union(selectionBounds);

        ctx.save();
        ctx.setTransform(1,0,0,1, Math.round(canvas.offset.x * scale) + 0.5, Math.round(canvas.offset.y * scale) + 0.5);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.beginPath();

        if (this.isHorizontal()) {
            var xx1 = Math.max(this.x1, bounds.x);
            var xx2 = Math.min(this.x2, bounds.x + bounds.width);
            ctx.moveTo(xx1 * scale, Math.round(this.y1 * scale) );
            ctx.lineTo(xx2 * scale, Math.round(this.y2 * scale) );
        } else if (this.isVertical()) {
            var yy1 = Math.max(this.y1, bounds.y);
            var yy2 = Math.min(this.y2, bounds.y + bounds.height);
            ctx.moveTo(Math.round(this.x1 * scale), yy1 * scale);
            ctx.lineTo(Math.round(this.x2 * scale), yy2 * scale);
        }

        ctx.stroke();
        ctx.restore();
    }
})();


