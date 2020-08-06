(function() {
    "use strict";

    /* jshint eqeqeq: false */
    /* jshint eqnull: true */
    var Matrix2D = function(a, b, c, d, tx, ty) {
        this.initialize(a, b, c, d, tx, ty);
    };
    var p = Matrix2D.prototype;

    Matrix2D.DEG_TO_RAD = Math.PI/180;

    p.a = 1;
    p.b = 0;
    p.c = 0;
    p.d = 1;
    p.tx = 0;
    p.ty = 0;

    p.initialize = function(a, b, c, d, tx, ty) {
        this.a = (a == null) ? 1 : a;
        this.b = b || 0;
        this.c = c || 0;
        this.d = (d == null) ? 1 : d;
        this.tx = tx || 0;
        this.ty = ty || 0;
        return this;
    };

    p.prepend = function(a, b, c, d, tx, ty) {
        var tx1 = this.tx;
        if (a != 1 || b != 0 || c != 0 || d != 1) {
            var a1 = this.a;
            var c1 = this.c;
            this.a = a1*a+this.b*c;
            this.b = a1*b+this.b*d;
            this.c = c1*a+this.d*c;
            this.d = c1*b+this.d*d;
        }
        this.tx = tx1*a+this.ty*c+tx;
        this.ty = tx1*b+this.ty*d+ty;
        return this;
    };

    p.append = function(a, b, c, d, tx, ty) {
        var a1 = this.a;
        var b1 = this.b;
        var c1 = this.c;
        var d1 = this.d;

        this.a  = a*a1+b*c1;
        this.b  = a*b1+b*d1;
        this.c  = c*a1+d*c1;
        this.d  = c*b1+d*d1;
        this.tx = tx*a1+ty*c1+this.tx;
        this.ty = tx*b1+ty*d1+this.ty;
        return this;
    };

    p.prependMatrix = function(matrix) {
        this.prepend(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
        return this;
    };

    p.appendMatrix = function(matrix) {
        this.append(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
        return this;
    };

    p.rotate = function(angle) {
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);

        var a1 = this.a;
        var c1 = this.c;
        var tx1 = this.tx;

        this.a = a1*cos-this.b*sin;
        this.b = a1*sin+this.b*cos;
        this.c = c1*cos-this.d*sin;
        this.d = c1*sin+this.d*cos;
        this.tx = tx1*cos-this.ty*sin;
        this.ty = tx1*sin+this.ty*cos;
        return this;
    };

    p.skew = function(skewX, skewY) {
        skewX = skewX*Matrix2D.DEG_TO_RAD;
        skewY = skewY*Matrix2D.DEG_TO_RAD;
        this.append(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), 0, 0);
        return this;
    };

    p.scale = function(x, y) {
        this.a *= x;
        this.d *= y;
        this.c *= x;
        this.b *= y;
        this.tx *= x;
        this.ty *= y;
        return this;
    };


    p.translate = function(x, y) {
        this.tx += x;
        this.ty += y;
        return this;
    };

       
    p.identity = function() {
        this.a = this.d = 1;
        this.b = this.c = this.tx = this.ty = 0;
        return this;
    };

    p.invert = function() {
        var a1 = this.a;
        var b1 = this.b;
        var c1 = this.c;
        var d1 = this.d;
        var tx1 = this.tx;
        var n = a1*d1-b1*c1;

        this.a = d1/n;
        this.b = -b1/n;
        this.c = -c1/n;
        this.d = a1/n;
        this.tx = (c1*this.ty-d1*tx1)/n;
        this.ty = -(a1*this.ty-b1*tx1)/n;
        return this;
    };

    p.transformPoint = function(x, y, pt) {
        pt = pt||{};
        pt.x = x*this.a+y*this.c+this.tx;
        pt.y = x*this.b+y*this.d+this.ty;
        return pt;
    };

    Matrix2D.identity = new Matrix2D();

    PACE.Matrix2D = Matrix2D;

}());