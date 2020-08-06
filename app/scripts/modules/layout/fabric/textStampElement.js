'use strict';

PACE.TextStampElement = fabric.util.createClass(PACE.TextElement, {

    type: 'TextStampElement',

    placeholder: 'Enter text here',

    initialize: function(element, options) {
        this.callSuper('initialize', element, options);
        this.editingBorderColor = 'rgba(255,0,0,0)';
        this.borderColor = 'rgba(0,0,0,0)';
        this.cornerColor = 'rgba(0,0,0,0)';
        this.hasControls = false;
        this._pad = 0.125 * 72;
        this._textHeightCache = {};
    },

    // clipTo: function(ctx) {
    //     ctx.rect(-this.width/2, -this.height/2, this.width, this.height);
    // },

    _initDimensions: function(ctx) {
        if (this.__skipDimension) {
            return;
        }
        if (!ctx) {
            ctx = fabric.util.createCanvasElement().getContext('2d');
            this._setTextStyles(ctx);
        }
        var text = this.text || '';
        this._textLines = text.split(this._reNewline);
        this._clearCache();
        
        var currentTextAlign = this.textAlign;
        this.textAlign = 'left';
        this._textWidth = this._getTextWidth(ctx);
        
        this.textAlign = currentTextAlign;
        this._textHeight = this._getTextHeight(ctx);
        if (this.element.autoSize) {
            this.width = this._textWidth;
            this.height = this._textHeight;
        }
    },

    _translateForTextAlign: function(ctx) {
        this.callSuper('_translateForTextAlign', ctx);
        if (this.element.autoSize || this._measuringText) return;
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
        if (val && this._offsetY) val.y -= this._offsetY;
        return val;
    },

    renderSelection: function(chars, boundaries, ctx) {
        if (this._offsetY) ctx.translate(0, this._offsetY);
        this.callSuper('renderSelection', chars, boundaries, ctx);
    },

    measureTextHeight: function() {
        var cachedValue = this._textHeightCache[this.text];
        if (cachedValue) return cachedValue;

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

    insertChars: function(_chars, useCopiedStyle) {
        this.text = this.text.slice(0, this.selectionStart) +
                    _chars +
                    this.text.slice(this.selectionEnd);

        var isEndOfLine = this.text.slice(this.selectionStart, this.selectionStart + 1) === '\n';

        if (this.selectionStart === this.selectionEnd) {
            this.insertStyleObjects(_chars, isEndOfLine, useCopiedStyle);
        }
        // else if (this.selectionEnd - this.selectionStart > 1) {
        // TODO: replace styles properly
        // console.log('replacing MORE than 1 char');
        // }
        this.abortCursorAnimation();
        this.setSelectionStart(this.selectionStart + _chars.length);
        this.setSelectionEnd(this.selectionStart);
        this._clearCache();
        //this.canvas && this.canvas.renderAll();

        this.setCoords();
        this.fire('changed');
        this.canvas && this.canvas.fire('text:changed', { target: this });
        this.initDelayedCursor();
    },

    removeChars: function(e) {
        if (this.selectionStart === this.selectionEnd) {
          this._removeCharsNearCursor(e);
        }
        else {
          this._removeCharsFromTo(this.selectionStart, this.selectionEnd);
        }

        this.setSelectionEnd(this.selectionStart);

        this._removeExtraneousStyles();

        this._clearCache();
        //this.canvas && this.canvas.renderAll();

        this.setCoords();
        this.fire('changed');
        this.canvas && this.canvas.fire('text:changed', { target: this });
    },

    onKeyDown: function(e) {
        var maxLines = PACE.StoreConfig.maxNumberOfStampLines || 2;
        if (this._textLines.length>=maxLines && e.keyCode===13) {
            return;
        }
        this.callSuper('onKeyDown', e);
    },

    onKeyPress: function(e) {
        var allowedChars=/[0-9a-zA-Z&\-\+,\.\s]/;
        var ch = String.fromCharCode(e.charCode);

        if (!allowedChars.test(ch)) return;
        if (this.restrict && this.restrict.indexOf(ch)>=0) { 
            this.canvas.fire('TextStampElement:char-restricted', {char:ch, event:e});
            return;
        }
        var maxLines = PACE.StoreConfig.maxNumberOfStampLines || 2;

        if (this._textLines.length>=maxLines && e.keyCode===13) {
            return;
        }

        var cursorLocation = this.get2DCursorLocation(),
            lineIndex      = cursorLocation.lineIndex;

        if (lineIndex>=0 && lineIndex<this._textLines.length) {
            var currentLineWidth = this._getLineWidth(this.ctx, lineIndex);

            if (this.element.autoSize) {
                var pad = 0.25 * 72;
                if (this.renderer && this.renderer.stampRect && 
                    ((currentLineWidth + pad) > this.renderer.stampRect.width || (this.height + pad) > this.renderer.stampRect.height)) {
                    return;
                }
            } else if ( (currentLineWidth + this._pad) > this.width || (this._textHeight + this._pad)>this.height ) {
                return;
            }
        }
       
        this.callSuper('onKeyPress', e);
    },

    paste: function(e) {
        var copiedText = null,
            clipboardData = this._getClipboardData(e);

        // Check for backward compatibility with old browsers
        if (clipboardData) {
            copiedText = clipboardData.getData('text');
        }
        else {
            copiedText = this.copiedText;
        }

        if (copiedText) {
            copiedText = copiedText.replace(/[^0-9a-zA-Z&\-\+,\.\s]/g, '');
            this.insertChars(copiedText, true);
        }
    },

    drawControls: function(ctx) {
        return this;
    },

    _drawControl: function(control, ctx, methodName, left, top) {
        var sizeX = this.cornerSize,
            sizeY = this.cornerSize;

        if (this.isControlVisible(control)) {
            ctx.beginPath();
            ctx.arc(left + sizeX/2, top + sizeY/2, sizeX/2, 0, 2 * Math.PI, false);
            ctx.fill();
        }
    },

    refresh: function() {
        //this.callSuper('refresh');
        
        this.text = this.element.text;
        this.fontFamily = this.element.fontFamily || 'Times';
        this.fontSize = this.element.fontSize || 16;
        this.fontStyle = this.element.fontStyle || 'normal';
        this.fontWeight = this.element.fontWeight || 'normal';
        this.textAlign = this.element.textAlign || 'left';
        this.lockScalingX = true;
        this.lockScalingY = true;
        this.editable = false;

        this.styles = this.element.styles ? angular.copy(this.element.styles) : {};

        if (this.element.stampLayer) {
            var fill = this.element.metalPlaque ? '#e6e6e6' : '#000000';
            //stampLayer means the text is rendered on the height map layer used for bump mapping,
            //so it's always rendered as black
            this.fill = fill;
            for (var i = 0; i < this.text.length; i++) {
                this._extendStyles(i, {fill:fill});
            }
        } else if (this.element.materialLayer && !this.element.metalPlaque && this.element.foil && this.element.foil.code==='blind') {
            this.fill = 'transparent';
            for (var i = 0; i < this.text.length; i++) {
                this._extendStyles(i, {fill:'transparent'});
            }
        } else {
            this.loadTexture();
            // If texture is defined, then use texture for filling.
            if(this.texture) {
                // Applying pattern to 'this.fill' instead of 'styles' because
                // the styles are copied several times and the pattern
                // object has recursive structure. The 'fill' property of 'styles'
                // has to be deleted in order not to override the 'this.fill' property.
                this.fill = this.texture.pattern;
                _.each(this.styles, function(line) {
                    _.each(line, function(style) {
                        delete style.fill;
                    });
                });
            } else {
                if (this.element.foil)
                    this.fill = this.element.foil.color;
                else
                    this.fill = this.element.fill || '#000000';
            }
        }
        this._initDimensions();
    }

});