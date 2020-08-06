(function() {
    "use strict";

    PACE.Point = function(x, y) {
        if (_.isObject(x) && x.hasOwnProperty('x') && x.hasOwnProperty('y')) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x;
            this.y = y;
        }
    };

    PACE.Point.prototype.toCanvasSpace = function(canvas) {
        var offset = canvas.offset,
            scale = canvas.scale;
        return new PACE.Point( 
            (this.x + offset.x) * scale,
            (this.y + offset.y) * scale
        );
    };

    PACE.Point.prototype.toModelSpace = function(canvas) {
        var offset = canvas.offset,
            scale = canvas.scale;
        return new PACE.Point(
            (this.x / scale) - offset.x,
            (this.y / scale) - offset.y 
        );
    };

    PACE.Point.distance = function(point1, point2) {
        var dx = point2.x - point1.x,
            dy = point2.y - point1.y;
        return Math.sqrt( (dx*dx) + (dy*dy) );
    };

    PACE.Point.prototype.round = function() {
        return new PACE.Point(Math.round(this.x), Math.round(this.y));
    };
}());