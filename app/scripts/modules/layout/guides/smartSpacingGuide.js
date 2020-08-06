var PACE = PACE || {};

PACE.SmartSpacingGuide = function(elementBounds, distInfo, edge,
                                    x1, y1, x2, y2, 
                                    middle,
                                    fixedSpacingGuide) {
    this.init(x1, y1, x2, y2);
    this.distInfo = distInfo;
    this.edge = edge;
    this.middle = middle;
    this.bounds = elementBounds;
    this.fixedSpacingGuide = fixedSpacingGuide;
    this.color = '#01DB25';
        
};

PACE.SmartSpacingGuide.prototype = new PACE.Guide();

PACE.SmartSpacingGuide.prototype.draw = function(canvas) {

    var ctx = canvas.getSelectionContext(),
        scale = canvas.scale,
        bounds = this.bounds,
        distInfo = this.distInfo,
        middle = this.middle,
        currentBounds = new PACE.Element(canvas.getActiveObjectOrGroup().getCoordsInModelSpace()).getBoundingBox();

    var w = 10 / scale,
        d = 3 / scale,
        d2 = 5 / scale;

    ctx.save();
    ctx.setTransform(1,0,0,1, Math.round(canvas.offset.x * scale) + 0.5, Math.round(canvas.offset.y * scale) + 0.5 );
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    
    var lineTo = function(x, y) {
        ctx.lineTo(Math.round(x * scale), Math.round(y * scale));
    };

    var moveTo = function(x, y) {
        ctx.moveTo(Math.round(x * scale), Math.round(y * scale));
    };
    
    ctx.beginPath();
    if (this.isHorizontal())
    {
        
        var x3 = Math.max( Math.max(distInfo.x1 + w, distInfo.x2 + w), 
            Math.max(currentBounds.right + w, bounds.right + w));
        
        var x1 = distInfo.x1;
        var y1 = distInfo.y1;
        
        var x2 = middle ? currentBounds.right : distInfo.x2;
        var y2 = distInfo.y2;
        
        for(var i=0;i<2;i++)
        {
            
            if (!(this.fixedSpacingGuide && i==0))
            {
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
            
            if (bounds.bottom < currentBounds.y)
            {
                y1 = bounds.bottom;
                x1 = bounds.right;
                x2 = currentBounds.right;
                y2 = currentBounds.top;
            } else {
                y1 = currentBounds.bottom;
                x1 = currentBounds.right;
                
                x2 = bounds.right;
                y2 = bounds.top; 
            }
            
        }
        
    } else if (this.isVertical()) {
        
        var y3 = Math.max( Math.max(distInfo.y1 + w, distInfo.y2 + w), 
            Math.max(currentBounds.bottom + w, bounds.bottom + w));
        
        x1 = distInfo.x1;
        y1 = distInfo.y1;
        x2 = distInfo.x2;
        y2 = middle ? currentBounds.bottom : distInfo.y2;
        
        for(i=0;i<2;i++)
        {
            if (!(this.fixedSpacingGuide && i==0))
            {
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
            
            if (bounds.right < currentBounds.x)
            {
                x1 = bounds.right;
                y1 = bounds.bottom;
                x2 = currentBounds.left;
                y2 = currentBounds.bottom;
            } else {
                x1 = currentBounds.right;
                y1 = currentBounds.bottom;
                x2 = bounds.left;
                y2 = bounds.bottom;
            }
            
        }
        
    }

    ctx.stroke();
    ctx.restore();
};