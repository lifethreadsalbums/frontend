'use strict';

PACE.ImageElement = fabric.util.createClass(fabric.Object, fabric.Observable, PACE.ProoferElement,  {
    originX: 'left',
    originY: 'top',
    type:'ImageElement',
    initialize: function(element, options) {
        this.callSuper('initialize', options);
        this.element = element;
        this.auxCanvas = document.createElement('canvas');
        this.auxCtx = this.auxCanvas.getContext('2d');
        this.refresh();
    },

    _doImageTransition: function() {
        if (this.prevImage) {
            if (this.currentAnimation) {
                this.currentAnimation.cancelled = true;
            }
            var animation = {};
            var that = this;
            this.transition = 0;
            this.animate('transition', 1, {
                from: 0,
                duration: 500,
                onChange: that.canvas.renderAll.bind(that.canvas),
                onComplete: function() {
                    that.prevImage = null;
                    that.currentAnimation = null;
                    that.canvas.renderAll();
                },
                abort:function() {
                    return animation.cancelled;
                },
                easing: fabric.util.ease.easeInQuad
            });
            this.currentAnimation = animation;
        }
    },

    loadImage: function() {
        if (this.loaded && !this.element.imageFile) {
            this.loaded = false;
            this.hiResImageLoaded = false;
            this.prevImage = this.image;
            this.image = new Image();
            this._doImageTransition();
        }

        var url,
            httpRegex = /^https?:\/\/.*/;
        var imageFile = this.element.imageFile;
        if (imageFile) {
            if (/tour-sample-[\d]{3}.jpg/.test(imageFile.url)) {
                // load tour sample image from app assets
                url = '/images/tour-sample-assets/' + imageFile.url;
            } else if (imageFile.url && httpRegex.test(imageFile.url)) {
                url = imageFile.url + '?v=1';
            } else if (imageFile.thumbnailAsBase64) {
                url = imageFile.thumbnailAsBase64;
            } else if (imageFile.url && imageFile.url.indexOf('/')===0) {
                url = imageFile.url;
            } else if (imageFile.url) {
                //var prefix = 'https://images' + ((imageFile.id % 10) + 1) + '.irisbook.com/images/';
                //url = prefix + 'thumbnail/' + imageFile.url;

                url = PACE.StoreConfig.imageUrlPrefix + 'thumbnail/' + imageFile.url + '?v=1';

            }
        }

        if (this.loaded && this.imageUrl!==url) {
            this.loaded = false;
            this.hiResImageLoaded = false;
        }

        if (this.loaded || this.loading || this.hiResImageLoaded) {
            return;
        }

        if (!this.hiResScheduled && imageFile && imageFile.promise && imageFile.promise.then) {
            var that = this;

            this.hiResScheduled = true;
            imageFile.promise.then( function() {
                setTimeout(that.loadHiResImage.bind(that), 2000);
                setTimeout(that.loadHiResImage.bind(that), 5000);
                setTimeout(that.loadHiResImage.bind(that), 10000);
                setTimeout(that.loadHiResImage.bind(that), 15000);
            });
        }

        if (!_.isUndefined(url)) {
            this.loaded = false;
            this.loading = true;
            this.hiResImageLoaded = false;
            this.originalImage = null;

            if (this.image) {
                this.prevImage = this.image;
                this.transition = 0;
            }
            this.image = new Image();
            if (httpRegex.test(url)) {
                this.image.crossOrigin = 'anonymous';
            }
            this.image.onload = (function() {
                this.loaded = true;
                this.loading = false;
                this.setCoords();
                this.originalImage = this.image;
                var that = this;

                if (this.element.filter) {
                    this.applyFilters(function() {
                        that._doImageTransition();
                        that.fire('image:loaded');
                        that.loadHiResImage();
                    });
                } else {
                    this._doImageTransition();
                    this.fire('image:loaded');
                    this.loadHiResImage();
                }

            }).bind(this);
            this.image.src = url;
            this.imageUrl = url;
        } else {
            this.image = new Image();
        }
    },

    loadHiResImage: function() {
        var imageFile = this.element.imageFile;

        if (!this.hiResImageLoaded && !this.hiResImageLoading &&
            imageFile && imageFile.status==='Uploaded') {

            //var prefix = 'https://images' + ((imageFile.id % 10) + 1) + '.irisbook.com/images/';
            //var url = prefix + 'lowres/' + imageFile.url;
            var url = PACE.StoreConfig.imageUrlPrefix + 'lowres/' + imageFile.url + '?v=1';

            var httpRegex = /^https?:\/\/.*/;

            this.hiResImageLoading = true;
            this.hiResImage = new Image();

            if (httpRegex.test(url)) {
                this.hiResImage.crossOrigin = 'anonymous';
            }
            this.hiResImage.onload = (function() {
                this.hiResImageLoaded = true;
                this.hiResImageLoading = false;
                this.hiResScheduled = false;
                this.loaded = true;
                this.image = this.hiResImage;
                this.originalImage = this.hiResImage;
                var that = this;
                if (this.element.filter) {
                    this.applyFilters(function() {
                        that.fire('image:loaded');
                    });
                } else {
                    this.fire('image:loaded');
                }
            }).bind(this);
            this.hiResImage.onerror = (function() {
                this.hiResImageLoaded = false;
                this.hiResImageLoading = false;
            }).bind(this);
            this.hiResImage.src = url;
        }
    },

    loadTexture: function() {
        var textureUrl = this.element.foil ? this.element.foil.textureUrl : null;
        if (this.texture && this.texture.url===textureUrl)
            return;

        if (textureUrl) {
            //load texture
            var myself = this;
            PACE.TextureCache.get(textureUrl)
                .then(function(texture) {
                    myself.texture = texture;
                    myself.fire('image:loaded');
                });
        } else if (this.texture) {
            this.texture = null;
            this.fire('image:loaded');
        }
    },

    _render: function(ctx) {
        if (this.prevImage && !this._renderingPrevImage) {
            var tmp = this.image,
                tmpLoaded = this.loaded,
                tmpImageFile = this.element.imageFile;

            this.image = this.prevImage;
            this.imageX = this.prevElement.imageX;
            this.imageY = this.prevElement.imageY;
            this.imageWidth = this.prevElement.imageWidth;
            this.imageHeight = this.prevElement.imageHeight;
            this.flipX = this.prevElement.flipX;
            this.flipY = this.prevElement.flipY;
            this.border = this.prevElement.border;
            this.borderSize = this.prevElement.borderSize;
            this.loaded = true;

            if (!this.prevImage.width) {
                this.loaded = false;
                this.element.imageFile = null;
            }

            this._renderingPrevImage = true;
            this._render(ctx);
            this._renderingPrevImage = false;

            this.image = tmp;
            this.imageX = this.element.imageX;
            this.imageY = this.element.imageY;
            this.imageWidth = this.element.imageWidth;
            this.imageHeight = this.element.imageHeight;
            this.flipX = this.element.flipX;
            this.flipY = this.element.flipY;
            this.border = this.element.border;
            this.borderSize = this.element.borderSize;
            this.loaded = tmpLoaded;
            this.element.imageFile = tmpImageFile;
        }

        var thumbRendering = this.canvas.thumbRendering;

        if (!this.prevImage && !this._renderingPrevImage) {
            this.prevElement = {
                imageX: this.imageX,
                imageY: this.imageY,
                imageWidth: this.imageWidth,
                imageHeight: this.imageHeight,
                flipX: this.flipX,
                flipY: this.flipY,
                border: this.border,
                borderSize: this.borderSize
            };
        }

        

        if (this.loaded) {
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

            if (thumbRendering) {
                scaleX = scaleY = 1;
                width = this.width;
                height = this.height;
            }

            var imageX = Math.round(this.imageX * scaleX),
                imageY = Math.round(this.imageY * scaleY),
                imageWidth = Math.ceil(this.imageWidth * scaleX),  //round up to avoid white stripes between the image and the image frame
                imageHeight = Math.ceil(this.imageHeight * scaleY);

            var flipX = this.flipX ? -1 : 1,
                flipY = this.flipY ? -1 : 1;

            if (!thumbRendering) {
                ctx.setTransform(1,0,0,1,0,0);
                ctx.translate(lt.x, lt.y);
                ctx.rotate(this.angle * Math.PI/180);
            } else {
                ctx.translate(-this.width / 2 , -this.height / 2);
            }

            var applyTint = this.texture || this.foilColor;

            if (this.showCroppedImage) {
                ctx.translate(imageX, imageY);
                ctx.rotate(this.imageRotation * Math.PI/180);
                ctx.globalAlpha = 0.2;
                if (this.flipX || this.flipY) {
                    ctx.scale(flipX, flipY);
                }
                if (applyTint)
                    ctx.drawImage(this.auxCanvas, 0, 0, imageWidth * flipX, imageHeight * flipY);
                else
                    ctx.drawImage(this.image, 0, 0, imageWidth * flipX, imageHeight * flipY);

                if (thumbRendering) {
                    ctx.rotate(-this.imageRotation * Math.PI/180);
                    ctx.translate(-this.imageX, -this.imageY);
                }
            }

            if (this._renderingPrevImage) {
                ctx.globalAlpha = 1; //1 - this.transition;
            } else {
                ctx.globalAlpha = this.prevImage ? this.transition : this.opacity;
            }

            if (!thumbRendering) {
                //reset transform
                ctx.setTransform(1,0,0,1,0,0);
                ctx.translate(lt.x, lt.y);
                ctx.rotate(this.angle * Math.PI/180);
            }

            //draw clipping path
            if (!this.skipClipping) {
                ctx.beginPath();
                //ctx.rect(0, 0, width + 1, height + 1);
                ctx.rect(0, 0, width, height);
                ctx.clip();
            }

            ctx.save();
            //draw clipped image
            ctx.translate(imageX,imageY);
            ctx.rotate(this.imageRotation * Math.PI/180);

            if (this.flipX || this.flipY) {
                ctx.scale(flipX, flipY);
            }

            if (applyTint) {
                // Update dimension of auxiliary canvas
                this.auxCanvas.width = this.imageWidth;
                this.auxCanvas.height = this.imageHeight;
                // Draw the image on the auxiliary canvas
                if (this.foilColor!=='#00000000') {
                    this.auxCtx.drawImage(this.image, 0, 0, this.imageWidth, this.imageHeight);
                    // apply tint to the auxiliary canvas

                    if (this.foilColor!=='#000' && this.foilColor!=='#000000') {
                        this.applyTint(this.auxCtx, this.foilColor, this.imageWidth, this.imageHeight, this.texture && this.texture.data);
                    }

                    // draw the auxiliary canvas on the target canvas
                    ctx.drawImage(this.auxCanvas, 0, 0, flipX * (imageWidth + 1), flipY * (imageHeight + 1));
                }
            } else {
                ctx.drawImage(this.image, 0, 0, flipX * (imageWidth + 1), flipY * (imageHeight + 1));
            }
            ctx.restore();

            if (this.strokeColor && this.strokeWeight>0) {
                this._renderStroke(ctx, width, height, this.strokeColor, this.strokeWeight, 1);
            }

            ctx.restore();
        } else if (!this.element.imageFile || (this.element.imageFile && !this.loaded && thumbRendering)) {
            this._renderEmptyFrame(ctx, thumbRendering);
        }

        if (this.element.templatePreviewStroke && this.element.imageFile) {
            this._renderTemplatePreviewStroke(ctx);
        }

        
        
        if (!thumbRendering) {
            //draw layout error icons
            if (this.element.errors) this._renderErrors(ctx);

            var selectedEdit = PACE.ProoferService.getSelectedEdit(),
                comment = this.element.comment,
                isSelectedComment = (comment && selectedEdit && comment.id===selectedEdit.id);

                
            if ((PACE.ProoferEnabled || this.element.hasComments) && isSelectedComment) {
                this._renderCommentStroke(ctx);
            }

            if (PACE.ProoferEnabled && comment) {
                this._renderImageNumberInCircle(ctx);
            }
            
            //draw comment icon
            if (this.element.hasComments) {
                this._renderComments(ctx);
            }
            
        }
       
    },

    _renderTemplatePreviewStroke: function(ctx) {
        var matrix = this.getGlobalMatrix(),
            lt = new PACE.Point(matrix.transformPoint(0, 0)).round(),
            rt = new PACE.Point(matrix.transformPoint(this.width, 0)).round(),
            lb = new PACE.Point(matrix.transformPoint(0, this.height)).round(),
            w = PACE.Point.distance(lt, rt),
            h = PACE.Point.distance(lt, lb);
        ctx.save();

        ctx.setTransform(1,0,0,1,0,0);
        ctx.translate(lt.x, lt.y);
        ctx.rotate(this.angle * Math.PI/180);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000';// PACE.LayoutSettings.emptyFrameColor;
        ctx.globalAlpha = 1;
        ctx.strokeRect(0.5, 0.5, w, h);

        ctx.restore();
    },

    _renderErrors: function(ctx) {
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);

        var matrix = this.getMatrix(),
            pt = matrix.transformPoint(this.width, 0);
        ctx.translate(pt.x, pt.y);
        ctx.rotate(this.angle * Math.PI/180);

        var iconY = 8;
        for(var i=0;i<this.element.errors.length;i++) {
            var error = this.element.errors[i];
            ctx.drawImage(error.getIcon(), -65, iconY);
            iconY +=40;
        }

        ctx.restore();
    },

    _renderEmptyFrame: function(ctx, thumbRendering) {
        ctx.save();

        var opacity = this.prevImage ? this.transition : this.opacity;
        if (this._renderingPrevImage) opacity = 1;

        var matrix = this.getGlobalMatrix(),
            lt = new PACE.Point(matrix.transformPoint(0, 0)).round(),
            rt = new PACE.Point(matrix.transformPoint(this.width, 0)).round(),
            lb = new PACE.Point(matrix.transformPoint(0, this.height)).round(),
            w = PACE.Point.distance(lt, rt),
            h = PACE.Point.distance(lt, lb);

        if (!thumbRendering) {
            ctx.setTransform(1,0,0,1,0,0);
            ctx.translate(lt.x, lt.y);
            ctx.rotate(this.angle * Math.PI/180);
        } else {
            ctx.translate(-this.width / 2 , -this.height / 2);
            w = this.width;
            h = this.height;
        }

        if (this.backgroundColor) {
            ctx.lineWidth = 0;
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(0, 0, w, h);
        } else if (this.element.placeholder) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.lineWidth = 0;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.element.placeholder, w/2, h/2);    
        } else {
            ctx.lineWidth = 1;
            ctx.strokeStyle = PACE.LayoutSettings.emptyFrameColor;
            ctx.fillStyle = PACE.LayoutSettings.emptyFrameBackgroundColor;

            ctx.globalAlpha = opacity * PACE.LayoutSettings.emptyFrameBackgroundAlpha;
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = opacity;
            ctx.strokeRect(0.5, 0.5, w, h);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(w, h);

            ctx.moveTo(w, 0);
            ctx.lineTo(0, h);
            ctx.stroke();
        }
        ctx.restore();
    },

    _renderStroke: function(ctx, width, height, color, size, opacity) {
        //ctx.save();

        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.globalAlpha = opacity;

        var w = width,
            h = height;
        ctx.strokeRect(
            size/2,
            size/2,
            w - size,
            h - size
        );

        //ctx.restore();
    },

    refresh: function() {
        this.imageX = this.element.imageX;
        this.imageY = this.element.imageY;
        this.imageWidth = this.element.imageWidth;
        this.imageHeight = this.element.imageHeight;
        this.imageRotation = this.element.imageRotation;
        this.flipX = this.element.flipX;
        this.flipY = this.element.flipY;
        this.border = this.element.border;
        this.borderSize = this.element.borderSize;

        this.opacity = this.element.opacity;
        this.backgroundColor = this.element.backgroundColor;
        this.strokeColor = this.element.strokeColor;
        this.strokeWeight = this.element.strokeWidth;

        this.loadImage();
        this.loadTexture();

        if ((this.hiResImageLoaded || this.loaded) && this.filter!==this.element.filter) {
            var that = this;
            setTimeout(function() {
                that.prevImage = that.image;
                that.applyFilters(function() {
                    that._doImageTransition();
                });
            });
        }

        if (_.isUndefined(this.element.opacity) || _.isNull(this.element.opacity)) {
            this.opacity = 1;
            console.warn('Opacity not defined for element', this.element);
        }
    },

    applyFilters: function(callback) {

        var filters = [];
        if (this.element.filter==='bw') {
            filters.push(new fabric.Image.filters.Grayscale());
        } else if (this.element.filter==='sepia') {
            filters.push(new PACE.SepiaFilter());
        }
        this.filter = this.element.filter;

        if (filters.length===0 && callback) {
            this.image = this.originalImage;
            callback();
            return;
        }

        var imgEl = this.originalImage,
            canvasEl = fabric.util.createCanvasElement(),
            replacement = fabric.util.createImage(),
            _this = this;

        canvasEl.width = imgEl.width;
        canvasEl.height = imgEl.height;
        canvasEl.getContext('2d').drawImage(imgEl, 0, 0, imgEl.width, imgEl.height);

        filters.forEach(function(filter) {
            filter && filter.applyTo(canvasEl, filter.scaleX || _this.scaleX, filter.scaleY || _this.scaleY);
        });

        replacement.width = canvasEl.width;
        replacement.height = canvasEl.height;
        replacement.onload = function() {
            _this.image = replacement;
            replacement.onload = canvasEl = imgEl = null;
            callback && callback();
        };
        replacement.src = canvasEl.toDataURL('image/png');
    },

    applyTint: function(ctx, tintColor, width, height, textureData) {
        (new PACE.ApplyTintCommand(ctx, tintColor, width, height, textureData)).execute();
    }

});
