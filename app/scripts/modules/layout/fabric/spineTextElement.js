'use strict';

PACE.SpineTextElement = fabric.util.createClass(PACE.TextElement, {

    type: 'SpineTextElement',

    initialize: function(element, options) {
        this.callSuper('initialize', element, options);
        this._offsetY = 0;
        this._pad = 0.078 * 72;
    },

    clipTo: function (ctx) {
        ctx.rect(-this.width/2, -this.height/2, this.width, this.height);
    },

    _initDimensions: function(ctx) {
        if (this.__skipDimension) {
            return;
        }
        
        if (!ctx) {
            ctx = fabric.util.createCanvasElement().getContext('2d');
            this._setTextStyles(ctx);
        }
        this._textLines = this.text.split(this._reNewline);
        this._clearCache();
        
        var currentTextAlign = this.textAlign;
        this.textAlign = 'left';
        this._textWidth = this._getTextWidth(ctx);
        this.textAlign = currentTextAlign;
        this._textHeight = this._getTextHeight(ctx);
    },

    _translateForTextAlign: function(ctx) {
        this.callSuper('_translateForTextAlign', ctx);
        if (this._measuringText) return;

        if (this._textWidth>0 && this._textHeight>0) {
            var textHeight = this.measureTextHeight(),
                midRect = this.height / 2,
                midText = textHeight.minY + ((textHeight.maxY - textHeight.minY) / 2);

            var offset = midRect - midText;
            //console.log('spine text offset', offset);
            this._offsetY = offset;
            ctx.translate(0, offset);
        } else {
            this._offsetY = this.height/2 - this.fontSize/2;
            ctx.translate(0, this._offsetY);
        }
    },

    renderCursor: function(boundaries, ctx) {
        if (this._offsetY) ctx.translate(0, this._offsetY);
        this.callSuper('renderCursor', boundaries, ctx);
    },

    _getLocalRotatedPointer: function(e) {
        var val = this.callSuper('_getLocalRotatedPointer', e);
        if (val) val.y -= this._offsetY;
        return val;
    },

    renderSelection: function(chars, boundaries, ctx) {
        if (this._offsetY) ctx.translate(0, this._offsetY);
        this.callSuper('renderSelection', chars, boundaries, ctx);
    },

    measureTextHeight: function() {
        this._measuringText = true;
        var w = Math.ceil(this._textWidth),
            h = Math.ceil(this._textHeight);

        this.tempCanvas = this.tempCanvas || fabric.util.createCanvasElement();
        this.tempCanvas.width = w;
        this.tempCanvas.height = h;
        // this.tempCanvas.style.position = 'absolute';
        // this.tempCanvas.style['z-index'] = 1000;
        // this.tempCanvas.style['background-color'] = '#fff';
        // document.body.appendChild(this.tempCanvas);

        var ctx = this.tempCanvas.getContext('2d');
            
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.translate(w / 2, this.height / 2);

        var editing = this.isEditing;
        this.isEditing = false;
        this.render(ctx, true);
        this.isEditing = editing;

        ctx.restore();

        var pixels = ctx.getImageData(0, 0, w, h).data;
        var minY = h,
            maxY = 0;
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var index = (y * w + x) * 4,
                    a = pixels[index+3];
                if (a>0) {
                    minY = Math.min(y, minY);
                    maxY = Math.max(y, maxY);
                }
            }
        }
        
        this._measuringText = false;
        return {minY:minY, maxY:maxY};
    },

    onKeyDown: function(e) {
        if (this._textLines.length>=2 && e.keyCode===13) {
            return;
        }
        if (e.keyCode===27) {
            this.fire('key-escape');
            return;
        }
        this.callSuper('onKeyDown', e);
    },

    onKeyPress: function(e) {
        if (this._textLines.length>=2 && e.keyCode===13) {
            return;
        }

        var cursorLocation = this.get2DCursorLocation(),
            lineIndex      = cursorLocation.lineIndex;

        if (lineIndex>=0 && lineIndex<this._textLines.length) {
            var currentLineWidth = this._getLineWidth(this.ctx, lineIndex);
            if ( (currentLineWidth + this._pad) > this.width || (this._textHeight + this._pad)>this.height ) {
                this._autoSize();
                this.canvas.renderAll();
                this.fire('changed');
            }
        }
       
        this.callSuper('onKeyPress', e);
    },

    _autoSize: function() {
        if (this.text.length===0) return;

        var num = 0,
            el = this.element,
            styles = el.styles || {},
            lines = el.text.split('\n');

        while(num<500 && ((this._textWidth + this._pad) > this.width || (this._textHeight + this._pad) > this.height)) {
            var maxFontSize = 0;
            for(var i in lines) {
                var line = lines[i];
                if (!styles[i]) styles[i] = {};
                for(var j in line) {
                    if (!styles[i][j]) styles[i][j] = {};

                    var fontSize = (styles[i][j].fontSize || el.fontSize) - 0.5;
                    maxFontSize = Math.max(maxFontSize, fontSize);
                    styles[i][j].fontSize = fontSize;
                }
            }
            el.fontSize = maxFontSize;
            el.styles = styles;
            this.refresh();
            this._initDimensions();
            num++;
        }
        return num>0;
    },

    paste: function(e) {
        this.callSuper('paste', e);
        this._autoSize();
        this.canvas.renderAll();
    },

    drawControls: function(ctx) {
        return this;
    },

    refresh: function() {
        this.text = this.element.text;
        this.fontFamily = this.element.fontFamily || 'HelveticaRegular';
        this.fontSize = this.element.fontSize || 16;
        this.fontStyle = this.element.fontStyle || 'normal';
        this.fontWeight = this.element.fontWeight || 'normal';
        this.textAlign = this.element.textAlign || 'left';
        this.fill = this.element.fill || '#000000';
        this.styles = this.element.styles || {};
        this.lockScalingX = true;
        this.lockScalingY = true;
        this.lockMovementX = true;
        this.lockMovementY = true;
        if (this.element.refreshAlign || (PACE.FontsLoaded && !this.fontsLoaded)) {
            this.element.refreshAlign = false;
            this._initDimensions();
        }
        this.cursorColor = this.element.fill;
        this.fontsLoaded = PACE.FontsLoaded;
    }

});