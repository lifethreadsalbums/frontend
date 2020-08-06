'use strict';

PACE.TextBoxElement = fabric.util.createClass(PACE.TextElement, PACE.ProoferElement, {

    type: 'TextBoxElement',

    _initDimensions: function(ctx) {
        //this.callSuper('_initDimensions', e);
        if (!PACE.FontsLoaded) return;

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
        
        var width = this._getTextWidth(ctx) + 8;
        //console.log('_getTextWidth', width);

        this.minWidth = width;
        if (width > this.width || !this.width) 
            this.width = width;
        
        this.textAlign = currentTextAlign;

        var height = this._getTextHeight(ctx);
        this.minHeight = height;
        if (height > this.height || !this.height)
            this.height = height;
    },

    _setEditingProps: function() {
        this.callSuper('_setEditingProps');
        this.hasControls = true;
        this.selectable = true;
    },

    onKeyDown: function(e) {
        if (e.keyCode===27) {
            this.fire('key-escape');
            return;
        }
        this.callSuper('onKeyDown', e);

        if (e.keyCode>=33 && e.keyCode<=40) {
            this.fire('cursor-changed');
        }
    },
    
    _render: function(ctx) {
        var thumbRendering = this.canvas.thumbRendering,
            selectedEdit,
            comment,
            isSelectedComment;
        
        if (!thumbRendering) {
            selectedEdit = PACE.ProoferService.getSelectedEdit();
            comment = this.element.comment;
            isSelectedComment = (comment && selectedEdit && comment.id===selectedEdit.id);

            if ((PACE.ProoferEnabled || this.element.hasComments) && isSelectedComment) {
                this._renderCommentStroke.bind(this)(ctx);
            }   
        }

        this.callSuper('_render', ctx);

        if (!thumbRendering) {
            if (PACE.ProoferEnabled && comment) {
                this._renderImageNumberInCircle.bind(this)(ctx);
            }
            
            //draw comment icon
            if (this.element.hasComments) {
                this._renderComments.bind(this)(ctx);
            }
        }
    },

    drawBorders: function(ctx) {
        return this;
    },

    refresh: function() {
        this.selectionColor = 'rgba(255,0,0,0.3)';
        this.text = this.element.text;
        this.fontFamily = this.element.fontFamily || 'Times';
        this.fontSize = this.element.fontSize || 16;
        this.fontStyle = this.element.fontStyle || 'normal';
        this.fontWeight = this.element.fontWeight || 'normal';
        this.textAlign = this.element.textAlign || 'left';
        this.fill = this.element.fill || '#000000';
        this.styles = this.element.styles || {};

        this._initDimensions();
        var locked = this.element.locked;
        this.lockScalingX = locked;
        this.lockScalingY = locked;
        this.lockUniScaling = locked;
        this.editable = false;
    }

});