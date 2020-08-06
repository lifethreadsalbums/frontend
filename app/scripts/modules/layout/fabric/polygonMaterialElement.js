
(function() {
    'use strict';

    var Triangle = function (p0, p1, p2) {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
        // ---- pre calculation for transform----
        this.d    = p0.tx * (p2.ty - p1.ty) - p1.tx * p2.ty + p2.tx * p1.ty + (p1.tx - p2.tx) * p0.ty;
        this.pmy  = p1.ty - p2.ty;
        this.pmx  = p1.tx - p2.tx;
        this.pxy  = p2.tx * p1.ty - p1.tx * p2.ty;
    };


    PACE.PolygonMaterialElement = fabric.util.createClass(PACE.MaterialElement, fabric.Observable, {
        originX: 'left',
        originY: 'top',
        type: 'PolygonMaterialElement',
        initialize: function(element, product, productPrototype, options) {
            this.callSuper('initialize', element, product, productPrototype, options);
            this.lev = 8;
            this.setupTriangles();
        },

        setCoordsFromModel: function(element) {
            var scale = this.canvas.scale,
                offset = this.canvas.offset,
                points = [];

            for (var i = 0; i < element.points.length; i++) {
                var p = element.points[i];

                points.push({
                    x: (p.x + offset.x) * scale,
                    y: (p.y + offset.y) * scale
                });
            }

            this.points = points;
            this.angle = element.rotation || 0;
            this.opacity = typeof(element.opacity) === 'undefined' ? 1.0 : element.opacity;
            this.setCoords();
            this.width = this.height = 1;
        },

        _renderTexture: function(ctx, image, points) {
            var p0 = points[0],
                p1 = points[1],
                p2 = points[2],
                p3 = points[3],
                w = this.canvas.width,
                h = this.canvas.height,
                texturePoints = this.texturePoints,
                textureTriangles = this.textureTriangles;

            this.tmpCanvas = this.tmpCanvas || document.createElement("canvas");
            if (this.tmpCanvas.width!==w || this.tmpCanvas.height!==h) {
                this.tmpCanvas.width = w;
                this.tmpCanvas.height = h;
            }

            var tmpCtx = this.tmpCanvas.getContext("2d");
            tmpCtx.clearRect(0,0,w,h);

            // ---- project points ----
            for (var i = 0; i < texturePoints.length; i++) {
                var p = texturePoints[i];
                var mx = p0.x + p.ny * (p3.x - p0.x);
                var my = p0.y + p.ny * (p3.y - p0.y);
                p.px = (mx + p.nx * (p1.x + p.ny * (p2.x - p1.x) - mx));
                p.py = (my + p.nx * (p1.y + p.ny * (p2.y - p1.y) - my));
            } 
            // ---- draw triangles ----
            for (var i = 0; i < textureTriangles.length; i++) {
                var t = textureTriangles[i];
                var p0 = t.p0;
                var p1 = t.p1;
                var p2 = t.p2;
                // ---- centroid ----
                var xc = (p0.px + p1.px + p2.px) / 3;
                var yc = (p0.py + p1.py + p2.py) / 3;
                // ---- clipping ----
                var isTriangleVisible = true;
                if (xc < 0 || xc > w || yc < 0 || yc > h) {
                    if (Math.max(p0.px, p1.px, p2.px) < 0 || Math.min(p0.px, p1.px, p2.px) > w || Math.max(p0.py, p1.py, p2.py) < 0 || Math.min(p0.py, p1.py, p2.py) > h) {
                        isTriangleVisible = false;
                    }
                }
                if (isTriangleVisible) {
                    var dx, dy, d;
                    tmpCtx.save();
                    tmpCtx.beginPath();
                    // ---- draw non anti-aliased triangle ----
                    dx = xc - p0.px;
                    dy = yc - p0.py;
                    d = Math.max(Math.abs(dx), Math.abs(dy));
                    tmpCtx.moveTo(p0.px - 2 * (dx / d), p0.py - 2 * (dy / d));
                    dx = xc - p1.px;
                    dy = yc - p1.py;
                    d = Math.max(Math.abs(dx), Math.abs(dy));
                    tmpCtx.lineTo(p1.px - 2 * (dx / d), p1.py - 2 * (dy / d));
                    dx = xc - p2.px;
                    dy = yc - p2.py;
                    d = Math.max(Math.abs(dx), Math.abs(dy));
                    tmpCtx.lineTo(p2.px - 2 * (dx / d), p2.py - 2 * (dy / d));
                    tmpCtx.closePath();
                    
                    // ---- clip ----
                    tmpCtx.clip();
                    // ---- texture mapping ----
                    tmpCtx.transform(
                        -(p0.ty * (p2.px - p1.px) -  p1.ty * p2.px  + p2.ty *  p1.px + t.pmy * p0.px) / t.d, // m11
                         (p1.ty *  p2.py + p0.ty  * (p1.py - p2.py) - p2.ty *  p1.py - t.pmy * p0.py) / t.d, // m12
                         (p0.tx * (p2.px - p1.px) -  p1.tx * p2.px  + p2.tx *  p1.px + t.pmx * p0.px) / t.d, // m21
                        -(p1.tx *  p2.py + p0.tx  * (p1.py - p2.py) - p2.tx *  p1.py - t.pmx * p0.py) / t.d, // m22
                         (p0.tx * (p2.ty * p1.px  -  p1.ty * p2.px) + p0.ty * (p1.tx *  p2.px - p2.tx  * p1.px) + t.pxy * p0.px) / t.d, // dx
                         (p0.tx * (p2.ty * p1.py  -  p1.ty * p2.py) + p0.ty * (p1.tx *  p2.py - p2.tx  * p1.py) + t.pxy * p0.py) / t.d  // dy
                    );
                    tmpCtx.drawImage(image, 0, 0);
                    tmpCtx.restore();
                }
            } 
            
            ctx.drawImage(this.tmpCanvas, 0, 0);

        },

        render: function(ctx) {
            if (!this.visible) return;

            ctx.save();
            if (this.prevImage && this.prevImage.width && this.prevImage.height) {
                ctx.globalAlpha = 1;
                this._renderTexture(ctx, this.prevImage, this.points);
            } 

            if (this.loaded && this.image && this.image.width && this.image.height) {
                ctx.globalAlpha = this.transition;
                this._renderTexture(ctx, this.image, this.points);
            }
            ctx.restore();
        },

        setupTriangles: function() {
            this.texturePoints = [];
            this.textureTriangles = [];
            
            // ---- create points ----
            for (var i = 0; i <= this.lev; i++) {
                for (var j = 0; j <= this.lev; j++) {
                    var tx = (i * (this.element.materialWidth / this.lev));
                    var ty = (j * (this.element.materialHeight / this.lev));
                    var p = {
                        tx: tx,
                        ty: ty,
                        nx: tx / this.element.materialWidth,
                        ny: ty / this.element.materialHeight,
                    };
                    this.texturePoints.push(p);
                }
            }
            var lev = this.lev + 1;
            for (var i = 0; i < this.lev; i++) {
                for (var j = 0; j < this.lev; j++) {
                    // ---- up ----
                    this.textureTriangles.push(new Triangle( 
                        this.texturePoints[j + i * lev],
                        this.texturePoints[j + i * lev + 1],
                        this.texturePoints[j + (i + 1) * lev]
                    ));
                    // ---- down ----
                    this.textureTriangles.push(new Triangle(
                        this.texturePoints[j + (i + 1) * lev + 1],
                        this.texturePoints[j + (i + 1) * lev],
                        this.texturePoints[j + i * lev + 1]
                    ));
                }
            }        
        },
      
    });
  
})();


