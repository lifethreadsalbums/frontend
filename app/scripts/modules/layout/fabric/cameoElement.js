'use strict';

PACE.CameoElement = fabric.util.createClass(PACE.ImageElement, {

    type: 'CameoElement',

    initialize: function(element, options) {
        this.callSuper('initialize', element, options);
        this.hasControls = false;

        // this.layer1 = new Image();
        // this.layer1.onload = this.onLayerLoad.bind(this);
        // this.layer1.src = 'images/cover-builder/cameo-layer1.png';

        // this.layer2 = new Image();
        // this.layer2.onload = this.onLayerLoad.bind(this);
        // this.layer2.src = 'images/cover-builder/cameo-layer2.png';
        // this.layersLoaded = 0;

        this.uploadPlaceholder = new Image();
        this.uploadPlaceholder.onload = this.onLayerLoad.bind(this);
        this.uploadPlaceholder.src = '/images/cover-builder/upload-placeholder.svg';        
    },

    onLayerLoad: function() {
        this.layersLoaded++;
        //if (this.layersLoaded===3) {
            this.fire('image:loaded');
        //}
    },

    loadImage: function() {
        if (!this.loaded && this.element.metalPlaque && PACE.metalPlaqueImage) {
            this.image = PACE.metalPlaqueImage;
            this.loaded = true;
            this.fire('image:loaded');
        } else {
            this.callSuper('loadImage');
        }
        var imageFile = this.element.imageFile,
            that = this;
        if (!this.uploadingImage && imageFile && imageFile.promise && !imageFile.promise.$resolved && 
            imageFile.promise.then) {
            this.uploadingImage = true;
            this.progress = 0;
            imageFile.promise.then(function(value) {
                    that.uploadingImage = false;
                },
                null,
                function(event) {
                    if (event.type === 'UploadProgress') {
                        that.fire('image:loaded');
                    }
                }
            );
        }
    },
    
    _drawRoundedRect: function(ctx, x, y, w, h, rx) {
        var rx = rx || 2,
            k = 1 - 0.5522847498 /* "magic number" for bezier approximations of arcs (http://itc.ktu.lt/itc354/Riskus354.pdf) */;

        ctx.beginPath();

        ctx.moveTo(x + rx, y);

        ctx.lineTo(x + w - rx, y);
        ctx.bezierCurveTo(x + w - k * rx, y, x + w, y + k * rx, x + w, y + rx);

        ctx.lineTo(x + w, y + h - rx);
        ctx.bezierCurveTo(x + w, y + h - k * rx, x + w - k * rx, y + h, x + w - rx, y + h);

        ctx.lineTo(x + rx, y + h);
        ctx.bezierCurveTo(x + k * rx, y + h, x, y + h - k * rx, x, y + h - rx);

        ctx.lineTo(x, y + rx);
        ctx.bezierCurveTo(x, y + k * rx, x + k * rx, y, x + rx, y);

        ctx.closePath();
    },

    _render: function(ctx) {
        if (this.element.imageFile && !this.element.metalPlaque && !this.loaded) return;
        //if (this.layersLoaded<3) return;

        ctx.save();

        var matrix = this.getGlobalMatrix(),
            lt = new PACE.Point(matrix.transformPoint(0, 0)).round(),
            rt = new PACE.Point(matrix.transformPoint(this.width, 0)).round(),
            lb = new PACE.Point(matrix.transformPoint(0, this.height)).round(),
            width = PACE.Point.distance(lt, rt),
            height = PACE.Point.distance(lt, lb),
            scaleX = this.scaleX,
            scaleY = this.scaleY;

        if (this.group) {
            scaleX *= this.group.scaleX;
            scaleY *= this.group.scaleY;
        }

        var imageX = Math.round(this.imageX * scaleX),
            imageY = Math.round(this.imageY * scaleY),
            imageWidth = Math.ceil(this.imageWidth * scaleX),  //round up to avoid white stripes between the image and the image frame
            imageHeight = Math.ceil(this.imageHeight * scaleY);

        ctx.setTransform(1,0,0,1,0,0);
        ctx.translate(lt.x, lt.y);
        ctx.rotate(this.angle * Math.PI/180);


        ctx.save();
        
        var offset = 10000,
            s = this.canvas.scale, 
            pad = 3 * s;
        ctx.fillStyle="rgba(105,105,105,0.5)";
        //ctx.fillRect(-pad,-pad, width + (pad*2), height + (pad*2));
        ctx.fillRect(0, 0, width, height);

        // ctx.strokeStyle = 'rgba(244,244,244,1)';
        // ctx.lineWidth = 3 * s;
        // ctx.lineJoin = ctx.lineCap = 'round';
        // ctx.shadowBlur = 8 * s;
        // ctx.shadowOffsetX = offset;
        // ctx.shadowColor = 'rgb(244, 244, 244)';
        // ctx.beginPath();
        // ctx.moveTo(-offset - pad, -pad);
        // ctx.lineTo(-offset - pad, height + pad);
        // ctx.lineTo(width - offset + pad, height + pad);
        // ctx.stroke();

        // ctx.shadowColor = 'rgb(37, 37, 37)';
        // ctx.beginPath();
        // ctx.moveTo(-offset + (4*s) - pad, -pad);
        // ctx.lineTo(width - offset + pad, -pad);
        // ctx.lineTo(width - offset + pad, height - (4*s) + pad);
        // ctx.stroke();

        ctx.restore();


        // var pad = 20,
        //     pad2 = 22;
        // if (this.layer1.width>0 && this.layer2.width>0) {
        //     var scaledMask = new Scale9(this.layer1, pad, pad, this.layer1.width - (pad * 2), this.layer1.height - (pad * 2));
        //     scaledMask.resize(width + (pad2 * 2), height + (pad2 * 2));
        //     scaledMask.drawImageTo(ctx, -pad2, -pad2);
        // }


        if (this.loaded && this.showCroppedImage) {
            ctx.translate(imageX, imageY);
            ctx.rotate(this.imageRotation * Math.PI/180);
            ctx.globalAlpha = 0.2;
            ctx.drawImage(this.image, 0, 0, imageWidth, imageHeight);
        }

        ctx.globalAlpha = this.opacity;
        
        //reset transform
        ctx.setTransform(1,0,0,1,0,0);
        ctx.translate(lt.x, lt.y);
        ctx.rotate(this.angle * Math.PI/180);
        ctx.save();
        
        //draw clipping path
        ctx.beginPath();
        if (this.element.metalPlaque) {
            ctx.rect(0,0,width,height);
        } else {
            this._drawRoundedRect(ctx, 0, 0, width, height);
        }
        ctx.clip();

        //draw clipped image
        if (this.loaded) {
            ctx.translate(imageX,imageY);
            ctx.rotate(this.imageRotation * Math.PI/180);
            ctx.drawImage(this.image, 0, 0, imageWidth + 1, imageHeight + 1);
            if (this.element.metalPlaque) {
                PACE.metalPlaqueImage = this.image;
            }
        } else if (!this.element.metalPlaque) {
            var r = PACE.GeomService.fitRect({width:this.uploadPlaceholder.width, height:this.uploadPlaceholder.height}, 
                {width:Math.min(width * 0.75,60), height:Math.min(height * 0.6, 60)});
            ctx.globalAlpha = 0.5;
            var ps = r.width/this.uploadPlaceholder.width;

            var centerX = r.width/2 - (70 * ps);
            var centerY = r.height * 0.8;
            ctx.drawImage(this.uploadPlaceholder, width/2  - centerX, height/2 - centerY, r.width, r.height);

            var fontSize = r.height * 0.2;
            ctx.font = fontSize + 'px Arial';
            ctx.fillStyle = '#000';
            ctx.lineWidth = 0;
            ctx.textAlign = 'center';
      
            var lineHeight = fontSize * 1.2,
                textY = height/2 - centerY + r.height;
            
            ctx.fillText('CLICK HERE', width/2, textY + lineHeight);
            ctx.fillText('TO UPLOAD', width/2, textY + lineHeight*2);
            
        }

        ctx.restore();

        // if (this.layer1.width>0 && this.layer2.width>0) {
        //     var scaledMask = new Scale9(this.layer2, pad, pad, this.layer2.width - (pad * 2), this.layer2.height - (pad * 2));
        //     scaledMask.resize(width + (pad2 * 2), height + (pad2 * 2));
        //     scaledMask.drawImageTo(ctx, -pad2, -pad2);
        // }


        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2 * s;
        ctx.lineJoin = ctx.lineCap = 'round';
        ctx.shadowBlur = 10 * s;
        ctx.shadowOffsetX = offset;
        ctx.shadowColor = 'rgba(244, 244, 244, 1)';
        ctx.beginPath();
        ctx.moveTo(-offset - pad, -pad);
        ctx.lineTo(-offset - pad, height + pad);
        ctx.lineTo(width - offset + pad, height + pad);
        ctx.stroke();

        ctx.lineWidth = 2 * s;
        ctx.shadowBlur = 8 * s;

        pad = 2*s;
        ctx.shadowColor = 'rgba(37, 37, 37, 1)';
        ctx.beginPath();
        ctx.moveTo(-offset + (4*s) - pad, -pad);
        ctx.lineTo(width - offset + pad, -pad);
        ctx.lineTo(width - offset + pad, height - (4*s) + pad);
        ctx.stroke();

        if (this.element.metalPlaque) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(0, 0, 1, height); 
            ctx.fillRect(0, 0, width, 1); 
        }

        if (this.uploadingImage && this.element.imageFile && this.element.imageFile.progress<100) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, height - 10, width, 10);
            ctx.fillStyle = '#666';
            this._drawRoundedRect(ctx, 3, height - 7, width - 6, 4, 2);
            ctx.fill();

            if (this.element.imageFile.progress>0) {
                ctx.fillStyle = '#fff';
                this._drawRoundedRect(ctx, 3, height - 7, (width - 6) * this.element.imageFile.progress/100, 4, 2);
                ctx.fill();
            }
        }
       
        ctx.restore();
        
    },

    //override the drawBorders method to make the borders crisp
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
    }
    
});