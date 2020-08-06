(function() {
    "use strict";

    PACE.Spread = function(spread, layout) {
        if (spread && layout) {
            this.init(spread, layout);
        }
    };

    PACE.Spread.create = function(spread, layout) {
        return (new PACE.SpreadInfoFactory()).create(spread, layout);
    };

    var p = PACE.Spread.prototype;

    p.init = function(spread, layout) {
        this.x = 0;
        this.y = 0;
        this.layout = layout;
        this.spread = spread;

        this.pageClass = PACE.LayoutPageClass || PACE.BookBleedPage;
        this.padding = 20; //(this.pageClass===PACE.BookBleedPage) ? 20 : 100;
        this.fullCanvasBackground = false; //(this.pageClass!==PACE.BookBleedPage);

        this.createPages();
    };

    p.isHorizontal = function() {
        return (this.layout.layoutSize.pageOrientation==='Horizontal');
    };

    p.getElements = function (filter) {
        var elements = [];

        for (var i = 0; i < this.spread.elements.length; i++) {
            var el = this.spread.elements[i];

            if (filter) {
                if (filter(el)) elements.push(el);
            } else elements.push(el);
        }
        return elements;
    };

    p.getElementsOfType = function(type) {
        return this.getElements(function (el) {
            return el.type === type;
        });
    };

    p.getImageElements = function () {
        return this.getElements(function (el) {
            return el.type === 'ImageElement';
        });
    };

    p.getPage = function(element) {
        var result = this.pages[0],
            len = this.pages.length,
            maxArea = 0;
        for(var i=0;i<len;i++) {
            var page = this.pages[i];
            var area = page.getElementAreaOnPage(element);
            if (area>maxArea)
            {
                maxArea = area;
                result = page;
            }
        }
        return result;
    };

    p.createPages = function() {

        var layoutSize = this.layout.layoutSize,
            x = 0,
            y = 0,
            horizontal = this.isHorizontal(),
            gap = this.layout.layoutSize.gapBetweenPages || 0;

        if (this.spread.numPages===1) {
            if (horizontal)
                x = layoutSize.width/2;
            else
                y = layoutSize.height/2;
        }

        this.pages = [];

        for (var i = 0; i < this.spread.numPages; i++) {
            var page = new this.pageClass(this.spread, layoutSize, i);
            page.spreadInfo = this;
            page.x = x;
            page.y = y;

            if (horizontal)
                x += page.getPageRect().width + gap;
            else
                y += page.getPageRect().height + gap;
            this.pages.push(page);
        }

    };

    p.getLayoutWarningRenderFn = function(canvas, context, skipText) {
        var ctx = context ? context : canvas.getContext(),
            bleed = this.getBleedRect().toCanvasSpace(canvas).round(),
            trim = this.getTrimRect().toCanvasSpace(canvas).round(),
            margin = this.getMarginRect().toCanvasSpace(canvas).round(),
            that = this,
            numPages = this.pages.length;

        var measureTextBinaryMethod = function(text, fontface, min, max, desiredWidth) {
            if (max-min < 1) {
                return min;
            }
            var test = min+((max-min)/2); //Find half interval
            ctx.font = test+'px '+fontface;
            var measureTest = ctx.measureText(text).width,
                found;
            if (measureTest > desiredWidth) {
                found = measureTextBinaryMethod(text, fontface, min, test, desiredWidth)
            } else {
                found = measureTextBinaryMethod(text, fontface, test, max, desiredWidth)
            }
            return found;
        };

        var labels = {
            0: 'YOU CANNOT PLACE YOUR IMAGE IN THIS AREA. IMAGES MUST EITHER GO TO THE CANVAS EDGE OR BE ON THE PINK SAFETY MARGIN.',
            1: 'YOU CANNOT PLACE YOUR IMAGE FRAME IN THIS AREA. YOUR IMAGE FRAME MUST EITHER GO TO THE CANVAS EDGE OR BE ON THE PINK SAFETY MARGIN.',
            2: 'TEXT CANNOT BE PLACED IN THIS AREA. TEXT MAY ONLY BE PLACED UP TO THE PINK SAFETY MARGIN.',
            10: 'YOU CANNOT PLACE YOUR IMAGES IN THIS AREA. IMAGES MUST EITHER GO TO THE CANVAS EDGE OR BE ON THE PINK SAFETY MARGIN.',
            11: 'YOU CANNOT PLACE YOUR IMAGE FRAMES IN THIS AREA. YOUR IMAGE FRAMES MUST EITHER GO TO THE CANVAS EDGE OR BE ON THE PINK SAFETY MARGIN.',
            12: 'TEXT FRAMES CANNOT BE PLACED IN THIS AREA. TEXT FRAMES MAY ONLY BE PLACED UP TO THE PINK SAFETY MARGIN.',
        };

        var fontface = 'Arial',
            fontSize,
            errorTop = this.spread.errorTop || 1,
            errorBottom = this.spread.errorBottom || 1,
            labelTop = labels[errorTop - 1],
            labelBottom = labels[errorBottom - 1],
            topHeight = (margin.top - trim.top);

        if (!skipText) {
            var text = labels[1],
                maxFontSize = topHeight - 2;
            fontSize = this.warningFontSize || measureTextBinaryMethod(text, fontface, 4, maxFontSize, bleed.width);

            this.warningFontSize = fontSize;
        }

        var render = function(t) {
            ctx.save();
            //ctx.setTransform(1,0,0,1,0,0);

            ctx.fillStyle = '#f00';
            ctx.globalAlpha = t * 0.25;
            ctx.fillRect(bleed.left, bleed.top, bleed.width, margin.top - bleed.top);
            ctx.fillRect(bleed.left, margin.bottom, bleed.width, bleed.bottom - margin.bottom);

            ctx.fillRect(bleed.left, margin.top, margin.left - bleed.left, margin.height);
            ctx.fillRect(margin.right, margin.top, bleed.right - margin.right, margin.height);

            ctx.font = fontSize + 'px ' + fontface;
            ctx.fillStyle = ctx.strokeStyle = '#7d7d7d';
            ctx.lineWidth = 1;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (!skipText) {
                var left = margin.left,
                    width = margin.width;

                if (numPages===1) {
                    var pad = 8;
                    width -= pad;
                    if (that.pages[0].isRight()) {
                        left += pad;
                    }
                }

                var textX = Math.round(left + width/2);
                ctx.globalAlpha = t;
                ctx.fillText(labelTop, textX, Math.round(trim.top + topHeight/2), width);
                ctx.fillText(labelBottom, textX, Math.round(margin.bottom + topHeight/2), width);
            }

            ctx.restore();
        };

        return render;
    };

    p.drawLayoutWarning = function(canvas) {
        var render = this.getLayoutWarningRenderFn(canvas);
        this.lastLayoutWarningRenderFn = render;
        render(1);
    };

    p.drawBackground = function(canvas) {
        var ctx = canvas.getContext(),
            layoutSize = this.layout.layoutSize,
            isHorizontal = this.isHorizontal(),
            canvasSize,
            rect;

        canvasSize = {
            x: (this.padding - layoutSize.bleedOutside) * canvas.scale,
            y: (this.padding - layoutSize.bleedTop) * canvas.scale,
            width: ((layoutSize.width * (isHorizontal ? 2 : 1)) + layoutSize.bleedOutside * 2) * canvas.scale,
            height: ((layoutSize.height * (isHorizontal ? 1 : 2)) + layoutSize.bleedTop + layoutSize.bleedBottom) * canvas.scale
        };

        rect = new PACE.Rect(canvasSize);
        if (this.pages.length===1) {
            if (isHorizontal) {
                rect.width = (layoutSize.width + layoutSize.bleedOutside) * canvas.scale;
                if (this.spread.pageNumber===1) {
                    rect.x = (this.padding + this.pages[0].x) * canvas.scale;
                } else {
                    rect.x = (this.padding + this.pages[0].x - layoutSize.bleedOutside) * canvas.scale;
                }
            } else {
                rect.height = (layoutSize.height + layoutSize.bleedBottom) * canvas.scale;
                if (this.spread.pageNumber===1) {
                    rect.y = (this.padding + this.pages[0].y) * canvas.scale;
                } else {
                    rect.y = (this.padding + this.pages[0].y - layoutSize.bleedTop) * canvas.scale;
                }
            }
        }

        if (this.fullCanvasBackground) {
            rect.x = 0;
            rect.y = 0;
            rect.width = ((layoutSize.width * (isHorizontal ? 2 : 1)) + this.padding * 2) * canvas.scale;
            rect.height = ((layoutSize.height * (isHorizontal ? 1 : 2)) + this.padding * 2) * canvas.scale;

            if (this.pages.length===1) {
                if (isHorizontal) {
                    rect.width = (layoutSize.width + this.padding * 2) * canvas.scale;
                    rect.x = this.pages[0].x * canvas.scale;

                } else {
                    rect.height = (layoutSize.height + this.padding * 2) * canvas.scale;
                    rect.y = this.pages[0].y * canvas.scale;
                }
            }
        }


        rect = rect.round();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect( rect.x, rect.y, rect.width, rect.height);

        for (var i = 0; i < this.pages.length; i++) {
            this.pages[i].drawLabels(canvas);
        }
    };

    p.drawForeground = function(canvas) {
        for (var i = 0; i < this.pages.length; i++) {
            this.pages[i].draw(canvas);
        }

        if (!this.layoutWarningAnimation && (this.spread.hasErrorsLeft || this.spread.hasErrorsRight)) {
            this.drawLayoutWarning(canvas);
        }

        this.drawGrid(canvas);
    };

    p.drawGrid = function (canvas) {
        if (!this.layout.viewState.gridVisible) {
            return;
        }

        var ctx = canvas.getContext();
        var rect = this.getPageRect().toCanvasSpace(canvas).round();
        var bleed = this.getBleedRect().toCanvasSpace(canvas).round();

        var lineNo = 1;
        var gridLineSpacing = this.layout.viewState.gridLineSpacing * canvas.scale;

        ctx.lineWidth = 1;
        ctx.setTransform(1,0,0,1,0.5,0.5);

        // horizontal
        var n = Math.max(rect.height, rect.width);
        for (var i = 0; i < n; i = i + gridLineSpacing) {
            if (lineNo > 4) {
                lineNo = 1;
            }

            if (lineNo === 1) {
                ctx.strokeStyle = '#828282';
                ctx.setLineDash([]);
            } else {
                ctx.strokeStyle = '#c3c3c3';
                ctx.setLineDash([2, 2]);
            }

            ctx.beginPath();

            //horizontal
            if (i<rect.height) {
                var y = Math.round(rect.top + i);
                ctx.moveTo(bleed.left, y);
                ctx.lineTo(bleed.right, y);
            }
            if (i<rect.width/2) {

                var x = Math.round(rect.left + i);
                //vertical left page
                ctx.moveTo(x, bleed.top);
                ctx.lineTo(x, bleed.bottom);

                x = Math.round(rect.right - i);
                //vertical right page
                ctx.moveTo(x, bleed.top);
                ctx.lineTo(x, bleed.bottom);
            }

            ctx.stroke();
            lineNo++;
        }
    };

    p.getCanvasSize = function() {
        var layoutSize = this.layout.layoutSize,
            isHorizontal = this.isHorizontal(),
            pad2 = this.padding * 2;

        var canvasSize = {
            width: (layoutSize.width * (isHorizontal ? 2 : 1)) + pad2,
            height: (layoutSize.height * (isHorizontal ? 1 : 2)) + pad2
        };

        return canvasSize;
    };

    p.getLeftPage = function() {
        if (this.pages.length===2)
            return this.pages[0];
        else if (this.pages[0].isLeft())
            return this.pages[0];
        return null;
    };

    p.getRightPage = function() {
        if (this.pages.length===2)
            return this.pages[1];
        else if (!this.pages[0].isLeft())
            return this.pages[0];
        return null;
    };

    function getUnionRect(fn) {
        var rect = this.pages[0][fn]();
        if (this.pages.length>1) {
            rect = rect.union(this.pages[1][fn]());
        }
        return rect;
    }

    p.getPageRect = p.getTrimRect = function() { return getUnionRect.call(this, 'getPageRect'); };

    p.getBleedRect = function() { return getUnionRect.call(this, 'getBleedRect'); };

    p.getMarginRect = function() { return getUnionRect.call(this, 'getMarginRect'); };

    p.isSpreadLayout = function() {
        if (this.spread.numPages===1) return false;

        var buf = -0.125 * 72,
            bleedRects = [this.pages[0].getBleedRect().inflate(buf, buf),
                this.pages[1].getBleedRect().inflate(buf, buf)];

        var elementFound = _.find(this.spread.elements, function(el) {

            if (el.type==='BackgroundFrameElement') return false;

            var bbox = new PACE.Element(el).getBoundingBox();
            var result = (bbox.intersects(bleedRects[0]) && bbox.intersects(bleedRects[1]));
            return result;
        });

        return elementFound;
    };


})();
