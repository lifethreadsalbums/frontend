'use strict';

PACE.ImageStampElement = fabric.util.createClass(PACE.ImageElement, {

    type: 'ImageStampElement',

    initialize: function(element, options) {
        this.callSuper('initialize', element, options);
        this.borderColor = 'red';
        this.cornerColor = 'red';
        this.cornerSize = 6;
        this.skipClipping = true;
    },
    
    refresh: function() {
      
    	this.foilColor = this.element && this.element.foil ? this.element.foil.color : undefined;
    	this.callSuper('refresh');

        if (this.element.stampLayer) {
            this.foilColor = '#000000';
        } else if (this.element.materialLayer && this.element.foil && this.element.foil.code==='blind') {
            this.foilColor = '#00000000';
        }
    
    },

    drawBorders: function(ctx) {
        if (!this.hasBorders) {
            return this;
        }

        ctx.save();

        var bounds = this._getRoundedBounds();

        ctx.globalAlpha = this.isMoving ? this.borderOpacityWhenMoving : 1;
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 1;

        ctx.setTransform(1,0,0,1,0,0);
        ctx.translate(bounds.x, bounds.y);
        ctx.rotate(this.angle * Math.PI/180);
        ctx.strokeRect(0.5, 0.5, bounds.width, bounds.height);
       
        ctx.restore();

        return this;
    },

    // _render: function(ctx) {

    //     var matrix = this.getGlobalMatrix(),
    //         lt = new PACE.Point(matrix.transformPoint(0, 0)).round(),
    //         rt = new PACE.Point(matrix.transformPoint(this.width, 0)).round(),
    //         lb = new PACE.Point(matrix.transformPoint(0, this.height)).round(),
    //         width = PACE.Point.distance(lt, rt),
    //         height = PACE.Point.distance(lt, lb);

    //     if (!this.resizing && this.hiResImageLoaded && this.image.width!==width && this.image.height!==height) {

    //         if (!this.originalImage)
    //             this.originalImage = this.image;
    //         var that = this;

    //         var promise = PACE.ImageService.resize(this.originalImage, width, height);
    //         this.resizing = true;
    //         promise.then(function(resizedImage) {

    //             that.image = resizedImage;
    //             that.resizing = false;
    //             that.fire('image:loaded');

    //             console.log('image resized');

    //         });

    //     }

    //     this.callSuper('_render', ctx);
    // },

    
});