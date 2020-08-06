var PACE = PACE || {};

PACE.SmartDimensionGuide = function(elementBounds, x1, y1, x2, y2) {
    this.init(x1, y1, x2, y2);
    this.bounds = elementBounds;
    this.color = '#01DB25';
}


PACE.SmartDimensionGuide.prototype = new PACE.Guide();

PACE.SmartDimensionGuide.prototype.draw = function(canvas) {

    var ctx = canvas.getSelectionContext(),
        scale = canvas.scale,
        currentBounds = new PACE.Element(canvas.getActiveObjectOrGroup().getCoordsInModelSpace()).getBoundingBox();

    var lineTo = function(x, y) {
        ctx.lineTo(Math.round(x * scale), Math.round(y * scale));
    };

    var moveTo = function(x, y) {
        ctx.moveTo(Math.round(x * scale), Math.round(y * scale));
    };

    var w = 10 / scale,
        d = 3 / scale,
        d2 = 5 / scale;

    var drawVerticalArrows = function (bounds) {
        var x3 = bounds.right + w,
            x1 = bounds.right,
            y1 = bounds.top,
            x2 = bounds.right,
            y2 = bounds.bottom;
        
        moveTo(x1, y1);
        lineTo(x3, y1);
        
        moveTo(x2, y2);
        lineTo(x3, y2);
        
        moveTo(x3 - d, y1);
        lineTo(x3 - d, y2);
        
        moveTo(x3 - d, y1);
        lineTo(x3 - d*2, y1 + d2);
        moveTo(x3 - d, y1);
        lineTo(x3, y1 + d2);
        
        moveTo(x3 - d, y2);
        lineTo(x3 - d*2, y2 - d2);
        moveTo(x3 - d, y2);
        lineTo(x3, y2 - d2);
    }
        
    var drawHorizontalArrows = function (bounds) {
        var y3 = bounds.bottom + w,
            x1 = bounds.left,
            y1 = bounds.bottom,
            x2 = bounds.right,
            y2 = bounds.bottom;
        
        moveTo(x1, y1);
        lineTo(x1, y3);
        
        moveTo(x2, y2);
        lineTo(x2, y3);
        
        //horizontal line
        moveTo(x1, y3 - d);
        lineTo(x2, y3 - d);
        
        //arrows
        moveTo(x1, y3 - d);
        lineTo(x1 + d2, y3 - d*2);
        moveTo(x1, y3 - d);
        lineTo(x1 + d2, y3);
        
        moveTo(x2, y3 - d);
        lineTo(x2 - d2, y3 - d*2);
        moveTo(x2, y3 - d);
        lineTo(x2 - d2, y3);
    }

    ctx.save();
    ctx.setTransform(1,0,0,1, Math.round(canvas.offset.x * scale) + 0.5, Math.round(canvas.offset.y * scale) + 0.5 );
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (this.isHorizontal())
    {
        drawVerticalArrows(this.bounds);
        drawVerticalArrows(currentBounds);
    } else if (this.isVertical()) {
        drawHorizontalArrows(this.bounds);
        drawHorizontalArrows(currentBounds);
    }
    ctx.stroke();
    ctx.restore();
}
