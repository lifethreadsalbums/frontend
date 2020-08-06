(function() {
    "use strict";
    
    var pageSettings = {
        floatToMarginProp: 0.75
    };

    PACE.BookPage = function(spread, layoutSize, pageNumber) {
        this.init(spread, layoutSize, pageNumber);
    };

    var p = PACE.BookPage.prototype = new PACE.Page();
    
    p.getBleedRect = function() {
            
        var rect = this.getPageRect();
        
        if (this.layoutSize.pageOrientation==='Horizontal') {
            if (!this.isLeft()) {
                //calculate bleed area for page on the right
                rect.right += this.layoutSize.bleedOutside;
            } else {
                //calculate bleed area for page on the left
                rect.left -= this.layoutSize.bleedOutside;
            }
            
            rect.top -= this.layoutSize.bleedTop;
            rect.bottom += this.layoutSize.bleedBottom;
        } else {
            if (!this.isLeft()) {
                //calculate bleed area for bottom page
                rect.bottom += this.layoutSize.bleedOutside;
            } else {
                //calculate bleed area for top page
                rect.top -= this.layoutSize.bleedOutside;
            }
            
            rect.right += this.layoutSize.bleedTop;
            rect.left -= this.layoutSize.bleedBottom;
        }
        return new PACE.Rect({x:rect.left, y:rect.top, width:rect.right - rect.left, height:rect.bottom - rect.top});
    };

    p.getMarginRect = function() {
        var rect = this.getPageRect();
        
        if (this.layoutSize.pageOrientation==='Horizontal') {
            if (this.isLeft())
            {
                rect.left += this.layoutSize.marginOutside;
                rect.right -= this.layoutSize.marginInside;
                
            } else {
                rect.left += this.layoutSize.marginInside;
                rect.right -= this.layoutSize.marginOutside;
            }
            
            rect.top += this.layoutSize.marginTop;
            rect.bottom -= this.layoutSize.marginBottom;
        } else {
            if (this.isLeft())
            {
                rect.top += this.layoutSize.marginOutside;
                rect.bottom -= this.layoutSize.marginInside;
            } else {
                rect.top += this.layoutSize.marginInside;
                rect.bottom -= this.layoutSize.marginOutside;
            }
            
            rect.right -= this.layoutSize.marginTop;
            rect.left += this.layoutSize.marginBottom;
        }
        
        return new PACE.Rect({x:rect.left, y:rect.top, width:rect.right - rect.left, height:rect.bottom - rect.top});
    };
    
    p.getFloatRect = function () {
        var rect = this.getMarginRect();
        
        var p = pageSettings.floatToMarginProp,
            marginCx = (rect.right - rect.left) / 2 + rect.left,
            marginCy = (rect.bottom - rect.top) / 2 + rect.top,
            w = (rect.right - rect.left) * p,
            h = (rect.bottom - rect.top) * p;
        
        return new PACE.Rect({
            x: marginCx - w / 2,
            y: marginCy - h / 2,
            width: w,
            height: h
        });
    };

    p.getSpinePosition = function() {
        return this.isLeft() ? this.x + this.layoutSize.width - this.layoutSize.spineWidth : 
            this.x + this.layoutSize.spineWidth;
    };

    p.drawLabels = function(canvas) {

        if (this.layoutSize.lps && !this.isLeft()) return;
        if (!this.layoutSize.drawPageNumbers) return;

        var ctx = canvas.getContext(),
            rect = this.getMarginRect(),
            offset = canvas.offset,
            scale = canvas.scale;

        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.translate(offset.x * scale, offset.y * scale);
        ctx.scale(scale, scale);
        
        var fontSize = Math.min(rect.width, rect.height) * 0.4;
        ctx.font = fontSize + 'px Arial';
        ctx.fillStyle = '#F0F0F0';
        ctx.strokeStyle = '#F0F0F0';
        ctx.lineWidth = 0;
        ctx.textAlign = 'center';
        var label = this.getPageLabel();

        if (this.layoutSize.lps) {
            rect = this.getPageRect();
            ctx.fillText(label, Math.round(rect.x + rect.width), 
                Math.round(rect.y + rect.height/2 + fontSize/2 * 0.75) );
        } else {
            ctx.fillText(label, Math.round(rect.x + rect.width/2), 
                Math.round(rect.y + rect.height/2 + fontSize/2 * 0.75) );
        }
        ctx.restore();
    };

    p.drawBackground = function(canvas) {
        var rect = this.getBleedRect().toCanvasSpace(canvas).round(),
            ctx = canvas.getContext();
         
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.restore();

        console.log('drawBackground', this.spread)
    };

    p.draw = function(canvas) {
        var ctx = canvas.getContext(),
            numPages = this.spread.numPages;

        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.translate(0.5, 0.5);
        this.drawMargins(canvas);
        this.drawBleed(canvas);
        this.drawTrimArea(canvas);
        ctx.restore();

        if (this.spread.comment) {

            var selectedEdit = PACE.ProoferService.getSelectedEdit(),
                comment = this.spread.comment,
                isSelectedComment = (comment && selectedEdit && comment.id===selectedEdit.id);

                
            if ((PACE.ProoferEnabled || this.spread.flipBookSide) && isSelectedComment) {
                ctx.save();
                var color = this.spread.comment.completed ? '#79cf19' : '#f5a623';
                ctx.strokeStyle = 12;
                ctx.lineWidth = lw;
                ctx.globalAlpha = 1;
                ctx.setTransform(1,0,0,1,0,0);
                ctx.translate(0.5, 0.5);

                var rect = this.spreadInfo.getPageRect().toCanvasSpace(canvas).round();
                if (PACE.ProoferEnabled) {
                    ctx.strokeStyle = 12;
                    rect = this.spreadInfo.getBleedRect().toCanvasSpace(canvas).round();
                } else {
                    if (this.spread.flipBookSide==='right')
                        rect.left -= rect.width;
                    rect.width *= 2;
                }

                ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                ctx.restore();
            } 
        }
    };

    p.drawSpine = function(canvas) {
        var pos = this.getSpinePosition(),
            ctx = canvas.getContext(),
            bleedRect = this.getBleedRect(),
            pt1 = new PACE.Point(pos, bleedRect.top).toCanvasSpace(canvas),
            pt2 = new PACE.Point(pos, bleedRect.bottom).toCanvasSpace(canvas),
            color = '#909090';

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        fabric.util.drawDashedLine(ctx, 
            Math.round(pt1.x), 
            Math.round(pt1.y), 
            Math.round(pt2.x), 
            Math.round(pt2.y), 
            [5,5]);
        ctx.stroke();
    };

    p.drawBleed = function(canvas) {
        var rect = this.getBleedRect().toCanvasSpace(canvas).round(),
            ctx = canvas.getContext(),
            bleedColor = '#ff0000',
            numPages = this.spread.numPages;
        
        ctx.strokeStyle = bleedColor;
        ctx.lineWidth = 1;
        var gap = this.layoutSize.gapBetweenPages;
        
        if (gap>0 || numPages===1)
        {
            ctx.strokeRect( rect.x,
                rect.y,
                rect.width, 
                rect.height);
        } else {
            ctx.beginPath();
            if (this.layoutSize.pageOrientation==='Horizontal') {
                if (this.isLeft())
                {
                    ctx.moveTo(rect.x+rect.width, rect.y);
                    ctx.lineTo(rect.x, rect.y);
                    ctx.lineTo(rect.x, rect.y + rect.height);
                    ctx.lineTo(rect.x+rect.width, rect.y+rect.height);
                } else {
                    ctx.moveTo(rect.x, rect.y);
                    ctx.lineTo(rect.x+rect.width, rect.y);
                    ctx.lineTo(rect.x+rect.width, rect.y+rect.height);
                    ctx.lineTo(rect.x, rect.y+rect.height);
                }
            } else {
                if (this.isLeft())
                {
                    ctx.moveTo(rect.x,  rect.y + rect.height);
                    ctx.lineTo(rect.x, rect.y);
                    ctx.lineTo(rect.x + rect.width, rect.y);
                    ctx.lineTo(rect.x+rect.width, rect.y+rect.height);
                } else {
                    ctx.moveTo(rect.x, rect.y);
                    ctx.lineTo(rect.x, rect.y + rect.height);
                    ctx.lineTo(rect.x+rect.width, rect.y+rect.height);
                    ctx.lineTo(rect.x+rect.width, rect.y);
                }
            }
            ctx.stroke();
        }
            
    };

    p.drawMargins = function(canvas) {
        var rect,
            marginColor = '#FF00FF',
            ctx = canvas.getContext();
        
        ctx.strokeStyle = marginColor;
        ctx.lineWidth = 1;
        if (!this.layoutSize.drawInsideMargins) {
            rect = this.spreadInfo.getMarginRect().toCanvasSpace(canvas).round();
        } else {
            rect = this.getMarginRect().toCanvasSpace(canvas).round();
        }
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    };

    p.drawTrimArea = function(canvas) {
        var trimColor = '#000000',
            ctx = canvas.getContext(),
            rect;
        
        ctx.strokeStyle = trimColor;
        ctx.lineWidth = 1;
        if (!this.layoutSize.drawInsideTrim) {
            rect = this.spreadInfo.getPageRect().toCanvasSpace(canvas).round();
        } else {
            rect = this.getPageRect().toCanvasSpace(canvas).round();
        }
        ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
    };

    p.getGuides = function() {
        var guides = [];
        
        _.each([this.getBleedRect(), this.getMarginRect()], function(rect) {
            if (!rect) return;

            guides.push( new PACE.Guide(rect.left, rect.top, rect.right, rect.top) );
            guides.push( new PACE.Guide(rect.left, rect.bottom, rect.right, rect.bottom) );
            guides.push( new PACE.Guide(rect.left, rect.top, rect.left, rect.bottom) );
            guides.push( new PACE.Guide(rect.right, rect.top, rect.right, rect.bottom) );
        });
        
        var spinePos = this.getSpinePosition();
        //guides.push( new PACE.Guide(spinePos, this.y, spinePos, this.y + this.layoutSize.height) );
        
        return guides;
    };
})();