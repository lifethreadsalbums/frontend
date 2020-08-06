(function() {
    "use strict";

    //----------------------------------------------------------------
    //                       CoverPage
    //----------------------------------------------------------------
    PACE.CoverPage = function(spread, layoutSize, pageNumber) {
        if (spread && layoutSize) {
            this.layoutSize = layoutSize;
            this.adjustLayoutSize();
            this.init(spread, this.layoutSize, pageNumber);
        }
    };

    var p = PACE.CoverPage.prototype = new PACE.BookPage();

    p.drawSpine = function() {};
    
    p.adjustLayoutSize = function() {
        var boardWidthBuffer = this.layoutSize.boardWidthBuffer,
            boardHeightBuffer = this.layoutSize.boardHeightBuffer;
        this.layoutSize = angular.copy(this.layoutSize);
        this.layoutSize.width = this.layoutSize.width + boardWidthBuffer;
        this.layoutSize.height = this.layoutSize.height + boardHeightBuffer;  
    };

    p.getPageLabel = function() {
        return this.isLeft() ? 'BACK' : 'FRONT';
    };

    p.drawLabels = function(canvas) {
        var ctx = canvas.getContext(),
            rect = this.getMarginRect(),
            offset = canvas.offset,
            scale = canvas.scale;

        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.translate(offset.x * scale, offset.y * scale);
        ctx.scale(scale, scale);
        
        var fontSize = Math.min(rect.width, rect.height) * 0.2;
        ctx.font = fontSize + 'px Arial';
        ctx.fillStyle = '#F0F0F0';
        ctx.strokeStyle = '#F0F0F0';
        ctx.lineWidth = 0;
        ctx.textAlign = 'center';
        var label = this.getPageLabel();
        
        ctx.fillText(label, Math.round(rect.x + rect.width/2), 
            Math.round(rect.y + rect.height/2 + fontSize/2 * 0.75) );
        
        ctx.restore();
    };


    //----------------------------------------------------------------
    //                       FicPage
    //----------------------------------------------------------------
    PACE.FicPage = function(spread, layoutSize, pageNumber, spineWidth, hingeGap) {
        this.layoutSize = layoutSize;
        this.spineWidth = spineWidth;
        this.hingeGap = hingeGap;
        this.adjustLayoutSize();
        this.init(spread, this.layoutSize, pageNumber);
    };

    p = PACE.FicPage.prototype = new PACE.CoverPage();
    p.drawTrimArea = function() {};
    p.drawBleed = function() {};

    p.getBleedRect = function() {
            
        var rect = this.getPageRect();
        
        if (this.layoutSize.pageOrientation==='Horizontal') {
            if (!this.isLeft()) {
                //calculate bleed area for page on the right
                rect.right += this.layoutSize.bleedOutside;
                rect.left -= this.hingeGap;
            } else {
                //calculate bleed area for page on the left
                rect.left -= this.layoutSize.bleedOutside;
                rect.right += this.hingeGap;
            }
            
            rect.top -= this.layoutSize.bleedTop;
            rect.bottom += this.layoutSize.bleedBottom;
        } else {
            if (!this.isLeft()) {
                //calculate bleed area for bottom page
                rect.bottom += this.layoutSize.bleedOutside;
                rect.top -= this.hingeGap;
            } else {
                //calculate bleed area for top page
                rect.top -= this.layoutSize.bleedOutside;
                rect.bottom += this.hingeGap;
            }
            
            rect.right += this.layoutSize.bleedTop;
            rect.left -= this.layoutSize.bleedBottom;
        }
        return new PACE.Rect({x:rect.left, y:rect.top, width:rect.right - rect.left, height:rect.bottom - rect.top});
    };

    //----------------------------------------------------------------
    //                       CoverSpread
    //----------------------------------------------------------------
    PACE.CoverSpread = function(spread, layout) {
        if (spread && layout) {
            
            this.init(spread, layout);
            this.pageClass = PACE.CoverPage;
            this.padding = 100;
            this.createPages();
        }
    };
    p = PACE.CoverSpread.prototype = new PACE.Spread();

    p.drawBackground = function(canvas) {
        var ctx = canvas.getContext(),
            canvasSize = this.getCanvasSize();
        
        canvasSize.width = canvasSize.width * canvas.scale;
        canvasSize.height = canvasSize.height * canvas.scale;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect( 0, 0, Math.round(canvasSize.width), Math.round(canvasSize.height) );

        for (var i = 0; i < this.pages.length; i++) {
            this.pages[i].drawLabels(canvas);
        }
    };

    p.getCanvasSize = function() {
        var pad2 = this.padding * 2;

        var rect1 = this.pages[0].getPageRect(),
            rect2 = rect1.union(this.pages[1].getPageRect());

        var canvasSize = {
            width: rect2.width + pad2,
            height: rect2.height + pad2
        };
        
        return canvasSize;
    };    


    //----------------------------------------------------------------
    //                       FicSpread
    //----------------------------------------------------------------

    PACE.FicSpread = function(spread, layout, pageCount) {
        this.pageCount = pageCount;
        this.spines = layout.spines.values;
        this.hinges = layout.hinges.values;
        this.init(spread, layout);
        this.pageClass = PACE.FicPage;
        this.createPages();
        this.padding = 100;
    };

    p = PACE.FicSpread.prototype = new PACE.CoverSpread();

    p.getPageCount = function() {
        if (this.pageCount) return this.pageCount;

        var numPages = 0;
        for(var i=0;i<this.layout.bookLayout.spreads.length;i++) {
            numPages += this.layout.bookLayout.spreads[i].numPages;
        }
        if (this.layout.bookLayout.pageType==='SpreadBased') {
            numPages = (numPages / 2) + (this.layout.bookLayout.lps ? 0 : 1);
        }
        return numPages;
    };

    p.getPageRangeValue = function(values) {
        if (!values) return 0;
        var numPages = this.getPageCount(),
            value = 0;
        for(var i=0;i<values.length;i++) {
            if (values[i].from<=numPages && values[i].to>=numPages) {
                value = values[i].value;
                break;
            }
        }
        return value * PACE.AppConstants.POINTS_PER_CM;
    };

    p.getSpineWidth = function() {
        var spineBuffer = this.layout.layoutSize.spineBuffer || 0;
        return this.getPageRangeValue(this.spines) + spineBuffer;
    };

    p.getHingeGap = function() {
        return this.getPageRangeValue(this.hinges);
    };

    p.getSpineRect = function() {
        var rect1 = this.pages[0].getPageRect(),
            rect2 = this.pages[1].getPageRect(),
            hingeGap = this.getHingeGap();

        return new PACE.Rect({
            x: rect1.right + hingeGap,
            y: rect1.y + (this.layout.layoutSize.marginTop),
            width: rect2.left - (rect1.right + hingeGap * 2),
            height: rect1.height - (this.layout.layoutSize.marginTop + this.layout.layoutSize.marginBottom)
        });
    },

    p.createPages = function() {
        var layoutSize = this.layout.layoutSize,
            x = 0, 
            y = 0,
            spineWidth = this.getSpineWidth(),
            hingeGap = this.getHingeGap(),
            horizontal = this.isHorizontal();
        
        this.pages = [];
        for (var i = 0; i < this.spread.numPages; i++) {
            var page = new this.pageClass(this.spread, layoutSize, i, spineWidth, hingeGap);
            page.x = x;
            page.y = y;
            page.spreadInfo = this;
            if (horizontal)
                x += page.getPageRect().width + hingeGap + spineWidth + hingeGap;
            else
                y += page.getPageRect().height + hingeGap + spineWidth + hingeGap;
            this.pages.push(page);
        }
    };

    p.drawForeground = function(canvas) {

        var drawDashedLine = function(ctx, x, y, x2, y2, da) {
          var dx = x2 - x,
              dy = y2 - y,
              len = Math.sqrt(dx * dx + dy * dy),
              rot = Math.atan2(dy, dx),
              dc = da.length,
              di = 0,
              draw = true;

          ctx.save();
          ctx.translate(x, y);
          ctx.moveTo(0, 0);
          ctx.rotate(rot);

          x = 0;
          while (len > x) {

            var dx = da[di++ % dc];
            x += dx;
            if (x > len) {
              x = len;
            }
            if (x+2>=len) {
                draw = true;
            }
            
            ctx[draw ? 'lineTo' : 'moveTo'](x, 0);
            draw = !draw;
          }

          ctx.restore();
        };


        var rect = this.pages[0].getPageRect().union(this.pages[1].getPageRect()),
            trimColor = '#ffffff',//000000',
            bleedColor = '#ff0000',
            spineColor = '#909090',
            ctx = canvas.getContext();
        
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.translate(0.5, 0.5);
        ctx.strokeStyle = trimColor;
        ctx.lineWidth = 1;
        //draw trim
        rect = rect.toCanvasSpace(canvas).round();

        ctx.globalCompositeOperation = 'difference';
        ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

        ctx.globalCompositeOperation = 'source-over';
        //draw bleed
        ctx.strokeStyle = bleedColor;
        rect = this.pages[0].getBleedRect().union(this.pages[1].getBleedRect());
        rect = rect.toCanvasSpace(canvas).round();
        ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

        var trim1 = this.pages[0].getPageRect(),
            trim2 = this.pages[1].getPageRect();

        var xpos = [ trim1.right,
            trim1.right + this.getHingeGap(),
            trim2.left,
            trim2.left - this.getHingeGap() 
        ];
        var n = xpos.length;
        for(var i=0;i<n;i++) {
            ctx.strokeStyle = spineColor;
            ctx.beginPath();
            var pt1 = new PACE.Point(xpos[i], trim1.top).toCanvasSpace(canvas).round(), 
                pt2 = new PACE.Point(xpos[i], trim1.bottom).toCanvasSpace(canvas).round();

            drawDashedLine(ctx, pt1.x, pt1.y, pt2.x, pt2.y, [5,5]);
            ctx.stroke();
        }

        ctx.restore();
        for (i = 0; i < this.pages.length; i++) {
            this.pages[i].draw(canvas);
        }
    };

})();