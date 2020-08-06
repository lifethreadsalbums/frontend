'use strict';

PACE.MaterialElement = fabric.util.createClass(fabric.Rect, fabric.Observable, {
    originX: 'left',
    originY: 'top',
    type:'MaterialElement',
    initialize: function(element, product, productPrototype, options) {
        this.callSuper('initialize', options);

        var injector = angular.element('body').injector();
        this.$parse = injector.get('$parse');
        this.DebossingService = injector.get('DebossingService');

        this.element = element;
        this.product = product;
        this.productPrototype = productPrototype;
        this.fill = '#cccccc';
        this.transition = 1;
        this.refresh();
    },

    onMaterialLoaded: function() { },

    onMaterialLoading: function() { },

    setImageUrl: function(url) {
        var isBase64 = url && url.indexOf('data:image')===0;

        if (url && !isBase64)
            url += '?v=1';

        if (this.image && this.image.src===url)
            return;

        if (this.renderingStamps) return;

        if (this.element.renderStamps && !this.stampUrl) {
            var that = this;
            this.loaded = false;
            var promise = this.DebossingService.renderStampsOnMaterial(this.product, this.productPrototype, this.element);
            promise.then(function(imageUrl) {
                that.stampUrl = imageUrl;
                that.renderingStamps = false;
                that.setImageUrl(imageUrl);
            });
            this.renderingStamps = true;
            return;
        }

        if (this.image) {
            this.prevImage = this.image;
        }

        //console.log('loading', url)
        this.image = new Image();
        if (!isBase64)
            this.image.crossOrigin = 'anonymous';
        this.fire('image:loading');
        this.loaded = false;
        this.onMaterialLoading();
        
        this.image.onload = (function() {
            this.loaded = true;
            this.onMaterialLoaded();
            this.setCoords();
            
            var canvas = this.canvas,
                that = this;
           
            if (canvas && this.prevImage) {
                this.transition = 0;
                /*
                if (this.currentAnimation) {
                    this.currentAnimation.cancelled = true;
                }
                var animation = {};
                this.transition = 0;
                this.animate('transition', 1, {
                    from: 0,
                    duration: 500,
                    onChange: function() {
                        //canvas.renderAll();
                        canvas.fire('material:transition');  
                    },
                    onComplete: function() {
                        that.prevImage = null;
                        that.currentAnimation = null;
                    },
                    abort: function() {
                        return animation.cancelled;
                    }
                });

                this.currentAnimation = animation;
                */
                canvas.fire('material:loaded');  
            }
            this.fire('image:loaded');

        }).bind(this);
        this.image.src = url;
    },

    render: function(ctx) {
        if (!this.visible) return;
        
        var w = this.width * this.scaleX,
            h = this.height * this.scaleY,
            rect = { width:this.width, height:this.height },
            prevRect = { width:this.width, height:this.height };

        ctx.save();

        if ((this.element && this.element.fillWithMaterial) || (this.image && (this.width>this.image.width || this.height>this.image.height)))  {
            if (this.prevImage) {
                prevRect = PACE.GeomService.fitRectangleProportionally(rect, this.prevImage);
            }
            rect = PACE.GeomService.fitRectangleProportionally(rect, this.image);
        }

        if (this.prevImage && this.prevImage.width && this.prevImage.height) {
            ctx.globalAlpha = 1;
            ctx.drawImage(this.prevImage, 0, 0, prevRect.width, prevRect.height, this.left, this.top, w, h);
        }
        if (this.loaded && this.image && this.image.width && this.image.height) {
            ctx.globalAlpha = this.transition;
            ctx.drawImage(this.image, 0, 0, rect.width, rect.height, this.left, this.top, w, h);
        }

        ctx.restore();
    },

    refresh: function() {
        var url = PACE.StoreConfig.defaultMaterialUrl,
            visible = true;

        if (this.element.prototypeProductOption) {
            var optionCode = this.element.prototypeProductOption.effectiveCode,
                optionValueCode = this.product.options[optionCode],
                optionValue = this.productPrototype.getPrototypeProductOptionValue(optionCode, optionValueCode);

            if (this.element.prototypeProductOption.visibilityExpression && !this.visibilityExpression) {
                this.visibilityExpression = this.$parse(this.element.prototypeProductOption.visibilityExpression);
            }

            if (this.visibilityExpression) {
                //check visibility
                visible = this.visibilityExpression({ product: this.product });
            }

            if (optionValue && optionValue.productOptionValue.params && optionValue.productOptionValue.params.url) {
                url = optionValue.productOptionValue.params.url;     
            }
        } else if (this.element.materialUrl) {
            url = this.element.materialUrl;
        }

        //console.log('MaterialElement', this.element)
        if (this.element.backgroundColor==='transparent' && url===PACE.StoreConfig.defaultMaterialUrl) {
            visible = false;
        }

        if (this.element.backgroundColor==='dark' && url===PACE.StoreConfig.defaultMaterialUrl) {
            url = PACE.StoreConfig.defaultDarkMaterialUrl || PACE.StoreConfig.defaultMaterialUrl;
        }

        if (this.materialUrl!==url) {
            this.stampUrl = null;
            this.materialUrl = url;
            this.setImageUrl(url);
        }
        this.selectable = false;
        this.visible = visible;
    }
    
});
  


