'use strict';

PACE.TextElement = fabric.util.createClass(fabric.IText, {

    type: 'TextElement',
    originX: 'left',
    originY: 'top',

    initialize: function(element, options) {
        this.element = element;
        this.callSuper('initialize', element.text);
        this.lockScalingX = this.lockScalingY = true;
        this.lineHeight = 1.2;
        this.editable = false;
        this.selectionColor = 'rgba(39,180,234,0.3)';
        this.editingBorderColor = 'rgba(255,0,0,0.25)';
        this.borderColor = 'red';
        this.cornerColor = 'red';
        this.caching = false;
        this._cursorVisible = true;
    },

    initHiddenTextarea: function() {
        this.callSuper('initHiddenTextarea');
        this.hiddenTextarea.style.cssText = 'position: fixed; top: 0; left: 50%; opacity: 0; '
                                        + ' width: 0px; height: 0px; z-index: -999;';
        var that = this;
        this.hiddenTextarea.addEventListener('blur', function() {
            that._cursorVisible = 0;
            //console.log('blur');
            that.canvas.renderAll();
        });

        this.hiddenTextarea.addEventListener('focus', function() {
            that._cursorVisible = 1;
            //console.log('focus');
            that.canvas.renderAll();
        });

        //this._currentCursorOpacity;
    },

    renderCursor: function(boundaries, ctx) {
        if (!this._cursorVisible) return;
        this.callSuper('renderCursor', boundaries, ctx);
    },

    renderSelection: function(chars, boundaries, ctx) {
        ctx.globalCompositeOperation = 'difference';
        this.callSuper('renderSelection', chars, boundaries, ctx);
        ctx.globalCompositeOperation = 'source-over';
    },

    _setTextStyles: function(ctx) {
        ctx.textBaseline = 'alphabetic';
        // if (!this.skipTextAlign) {
        //   ctx.textAlign = this.textAlign;
        // }
        ctx.font = this._getFontDeclaration();
    },

    _renderTextLine: function(method, ctx, line, left, top, lineIndex) {
        if (this.isEmptyStyles()) {
            top += this.fontSize * (this._fontSizeFraction + 0.03);
        }
        this.callSuper('_renderTextLine', method, ctx, line, left, top, lineIndex);
    },

    _renderChars: function(method, ctx, line, left, top, lineIndex) {

        //DO NOT USE _renderCharsFast method at all, it's inconsitent so let's favour consistency over performance,
        //which in this case shouldn't be even noticeable

        // if (this.isEmptyStyles()) {
        //   return this._renderCharsFast(method, ctx, line, left, top);
        // }
        //console.log('render chars', this.left)
        this.skipTextAlign = true;

        // set proper box offset
        left -= this.textAlign === 'center'
            ? (this.width / 2)
            : (this.textAlign === 'right')
              ? this.width
              : 0;

        // set proper line offset
        var lineHeight = this._getHeightOfLine(ctx, lineIndex),
            lineLeftOffset = this._getCachedLineOffset(lineIndex),
            chars = line.split(''),
            prevStyle,
            charsToRender = '';

        left += lineLeftOffset || 0;

        ctx.save();
        top -= lineHeight / this.lineHeight * this._fontSizeFraction;
        for (var i = 0, len = chars.length; i <= len; i++) {
            prevStyle = prevStyle || this.getCurrentCharStyle(lineIndex, i);
            var thisStyle = this.getCurrentCharStyle(lineIndex, i + 1);

            if (this._hasStyleChanged(prevStyle, thisStyle) || i === len) {
                this._renderChar(method, ctx, lineIndex, i - 1, charsToRender, left, top, lineHeight);
                charsToRender = '';
                prevStyle = thisStyle;
            }
            charsToRender += chars[i];
        }

        ctx.restore();
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
        this.canvas && this.canvas.renderAll();

        this.setCoords();
        this.fire('changed');
        this.canvas && this.canvas.fire('text:changed', { target: this });
        this.initDelayedCursor();
    },

    insertCharStyleObject: function(lineIndex, charIndex, style) {
        var clone = fabric.util.object.clone;

        var currentLineStyles = this.styles[lineIndex],
            currentLineStylesCloned = clone(currentLineStyles);

        if (charIndex === 0 && !style) {
            charIndex = 1;
        }

        // shift all char styles by 1 forward
        // 0,1,2,3 -> (charIndex=2) -> 0,1,3,4 -> (insert 2) -> 0,1,2,3,4
        for (var index in currentLineStylesCloned) {
            var numericIndex = parseInt(index, 10);
            if (numericIndex >= charIndex) {
                currentLineStyles[numericIndex + 1] = currentLineStylesCloned[numericIndex];
                //delete currentLineStyles[index];
            }
        }

        var idx = charIndex - 1;
        if (this.caretStyle) {

            if (charIndex === 1 && !style) {
                charIndex = 0;
            }

            style = this.caretStyle;
            this.caretStyle = null;
        }

        this.styles[lineIndex][charIndex] = style || clone(currentLineStyles[idx]);
        this._clearCache();
    },

    insertNewlineStyleObject: function(lineIndex, charIndex, isEndOfLine) {
        var clone = fabric.util.object.clone;

        this.shiftLineStyles(lineIndex, +1);

        if (!this.styles[lineIndex + 1]) {
            this.styles[lineIndex + 1] = { };
        }

        var currentCharStyle = this.styles[lineIndex][Math.max(0,charIndex - 1)],
            newLineStyles = { };

        // if there's nothing after cursor,
        // we clone current char style onto the next (otherwise empty) line
        if (isEndOfLine) {
            newLineStyles[0] = clone(currentCharStyle);
            this.styles[lineIndex + 1] = newLineStyles;
        }
            // otherwise we clone styles of all chars
            // after cursor onto the next line, from the beginning
            else {
                for (var index in this.styles[lineIndex]) {
                    if (parseInt(index, 10) >= charIndex) {
                        newLineStyles[parseInt(index, 10) - charIndex] = this.styles[lineIndex][index];
                        // remove lines from the previous line since they're on a new line now
                    delete this.styles[lineIndex][index];
                }
            }
            this.styles[lineIndex + 1] = newLineStyles;
        }
        this._clearCache();
    },

    _insertStyles: function(styles) {
        if (!styles) return;
        for (var i = 0, len = styles.length; i < len; i++) {

            var cursorLocation = this.get2DCursorLocation(this.selectionStart + i),
                lineIndex = cursorLocation.lineIndex,
                charIndex = cursorLocation.charIndex;

            this.insertCharStyleObject(lineIndex, charIndex, styles[i]);
        }
    },

    getCurrentCharFontSize: function(lineIndex, charIndex) {
        if (this.caretStyle && this.caretStyle.fontSize) {
            var loc = this.get2DCursorLocation();
            if (loc.lineIndex===lineIndex && loc.charIndex===charIndex) {
                return this.caretStyle.fontSize;
            }
        }
        return (
            this.styles[lineIndex] &&
            this.styles[lineIndex][charIndex === 0 ? 0 : (charIndex - 1)] &&
            this.styles[lineIndex][charIndex === 0 ? 0 : (charIndex - 1)].fontSize) || this.fontSize;
    },
  
    isInputActive: function() {
        var activeElement = $(document.activeElement);
        return (activeElement.is('input') || activeElement.is('textarea'));
    },

    setCursorByClick: function(e) {
        if (!this.isEditing) return;
        this.callSuper('setCursorByClick', e);
    },

    initDelayedCursor: function(restart) {
        if (!this.isEditing) return;
        this.callSuper('initDelayedCursor', restart);
    },

    removeChars: function(e) {
        if (this.text.length===0) return;
        this.abortCursorAnimation();
        this.callSuper('removeChars', e);
        this.initDelayedCursor();
    },

    focus: function() {
        this.hiddenTextarea && this.hiddenTextarea.focus();
    },

    _render: function(ctx) {

        if (PACE.FontsLoaded && this._textLines) {
            this.callSuper('_render', ctx);
        }

        if (this.type==='TextStampElement') return;
        if (this._measuringText) return;

        ctx.save();

        var matrix = this.getGlobalMatrix(),
            lt = new PACE.Point(matrix.transformPoint(0, 0)).round(),
            rt = new PACE.Point(matrix.transformPoint(this.width, 0)).round(),
            lb = new PACE.Point(matrix.transformPoint(0, this.height)).round(),
            w = PACE.Point.distance(lt, rt),
            h = PACE.Point.distance(lt, lb);

        ctx.setTransform(1,0,0,1,0,0);
        ctx.translate(lt.x, lt.y);
        ctx.rotate(this.angle * Math.PI/180);
 
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1;

        if (this.isEditing) {
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, w, h);
        }

        ctx.globalAlpha = 1
        ctx.strokeRect(0.5, 0.5, w, h);
        
        ctx.restore();
    },

    loadTexture: function() {
        var textureUrl = this.element.foil ? this.element.foil.textureUrl : null;
        if (this.element.metalPlaque) {
            textureUrl = '/images/cover-builder/dark-metal3.png';
        }

        if (this.texture && this.texture.url===textureUrl)
            return;

        if (textureUrl && !this.loadingTexture) {
            //load texture
            var cachedTexture = PACE.TextureCache.getCache().get(textureUrl);
            if (cachedTexture) {
                this.texture = cachedTexture;
                this.fire('image:loaded');
            } else {
                this.loadingTexture = true;
                var myself = this;
                
                PACE.TextureCache.get(textureUrl)
                    .then(function(texture) {
                        myself.loadingTexture = false;
                        myself.texture = texture;
                        myself.fire('image:loaded');
                    });
            }
        } else if (this.texture) {
            this.texture = null;
            this.fire('image:loaded');
        }
    },

    refresh: function() {
        this.loadTexture();
        this.text = element.text;
        this.fontFamily = this.element.fontFamily || 'Times';
        this.fontSize = this.element.fontSize || 16;
        this.fontStyle = this.element.fontStyle || 'normal';
        this.fontWeight = this.element.fontWeight || 'normal';
        this.textAlign = this.element.textAlign || 'left';

        // If texture is defined, then use texture for filling.
        if(this.texture) {
            // Applying pattern to 'this.fill' instead of 'styles' because
            // the styles are copied several times and the pattern
            // object has recursive structure. The 'fill' property of 'styles'
            // has to be deleted in order not to override the 'this.fill' property.
            this.fill = this.texture.pattern;
            this.styles = angular.copy(this.element.styles);
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
            this.styles = this.element.styles || {};
        }

        this._initDimensions();
        this.lockScalingX = true;
        this.lockScalingY = true;
        this.editable = false;
    }
    
});