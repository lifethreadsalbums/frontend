(function() {
    "use strict";

    PACE.Rect = function(data) {
        this.x = data.x;
        this.y = data.y;
        this.width = data.width;
        this.height = data.height;

        this.left = this.x;
        this.right = this.x + this.width;
        this.top = this.y;
        this.bottom = this.y + this.height;
    };

    PACE.Rect.prototype.calcLeftRightTopBottom = function() {
        this.left = this.x;
        this.right = this.x + this.width;
        this.top = this.y;
        this.bottom = this.y + this.height;
    };

    PACE.Rect.prototype.round = function() {
        this.calcLeftRightTopBottom();
        var left = Math.round(this.left),
            top = Math.round(this.top),
            right = Math.round(this.right),
            bottom = Math.round(this.bottom);
        return new PACE.Rect({
            x: left,
            y: top,
            width: right - left,
            height: bottom - top
        });
    };

    PACE.Rect.prototype.toCanvasSpace = function(canvas) {
        var offset = canvas.offset,
            scale = canvas.scale;
        return new PACE.Rect({
            x: (this.x + offset.x) * scale,
            y: (this.y + offset.y) * scale,
            width: this.width * scale,
            height: this.height * scale
        });
    };

    PACE.Rect.prototype.toModelSpace = function(canvas) {
        var offset = canvas.offset,
            scale = canvas.scale;
        return new PACE.Rect({
            x: (this.x / scale) - offset.x,
            y: (this.y / scale) - offset.y,
            width: this.width / scale,
            height: this.height / scale
        });
    };

    PACE.Rect.prototype.equals = function(rect, tolerance) {
        tolerance = tolerance || 0;
        var eq = PACE.GeomService.equals;
        return eq(this.x, rect.x, tolerance) &&
               eq(this.y, rect.y, tolerance) &&
               eq(this.width, rect.width, tolerance) &&
               eq(this.height, rect.height, tolerance);
    };

    PACE.Rect.prototype.union = function(r2) {

        var r1 = this;
        var p1 = {x:r1.x, y: r1.y};
        var p2 = {x:r1.x + r1.width, y: r1.y + r1.height};
        var p3 = {x:r2.x, y: r2.y};
        var p4 = {x:r2.x + r2.width, y: r2.y + r2.height};

        var minx = Math.min( Math.min(p1.x, p2.x), Math.min(p3.x, p4.x) );
        var maxx = Math.max( Math.max(p1.x, p2.x), Math.max(p3.x, p4.x) );
        var miny = Math.min( Math.min(p1.y, p2.y), Math.min(p3.y, p4.y) );
        var maxy = Math.max( Math.max(p1.y, p2.y), Math.max(p3.y, p4.y) );

        return new PACE.Rect({x:minx, y:miny, width:maxx - minx, height:maxy - miny});

    };

    PACE.Rect.prototype.intersects = function(r2) {
        var r1 = this;
        return !(r2.x >= r1.x + r1.width || 
               r2.x + r2.width <= r1.x || 
               r2.y >= r1.y + r1.height ||
               r2.y + r2.height <= r1.y);
    };

    PACE.Rect.prototype.intersection = function(b) {
        var a = this;
  
        var x0 = Math.max(a.x, b.x);
        var x1 = Math.min(a.x + a.width, b.x + b.width);

        if (x0 <= x1) {
            var y0 = Math.max(a.y, b.y);
            var y1 = Math.min(a.y + a.height, b.y + b.height);

            if (y0 <= y1) {
                return new PACE.Rect({x:x0, y:y0, width:x1 - x0, height:y1 - y0});
            }
        }
        return null;
    };

    PACE.Rect.prototype.containsPoint = function(x, y) {
        var r = this;
        return (x >= r.x && 
            x <= r.x + r.width && 
            y >= r.y && 
            y <= r.y + r.height);
    };

    PACE.Rect.prototype.containsRect = function(rect) {
        var x = rect.x,
            y = rect.y;
        return x >= this.x && y >= this.y
                && x + rect.width <= this.x + this.width
                && y + rect.height <= this.y + this.height;
    };

    PACE.Rect.prototype.inflate = function(dx, dy) {
        this.x -= dx;
        this.width += 2 * dx;
        this.y -= dy;
        this.height += 2 * dy;
        this.calcLeftRightTopBottom();

        return this; //for chaining
    };

    PACE.Rect.prototype.getCenter = function() {
        return new PACE.Point(this.x + this.width/2, this.y + this.height/2);
    };

}());
