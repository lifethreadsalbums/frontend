(function() {
    "use strict";

    PACE.BookBleedPage = function(spread, layoutSize, pageNumber) {
        this.init(spread, layoutSize, pageNumber);
    };

    var p = PACE.BookBleedPage.prototype = new PACE.BookPage();
    
    p.drawBleed = function(canvas) { };
    p.drawMargins = function(canvas) { };
    p.drawTrimArea = function(canvas) { };

    p.draw = function(canvas) {
        var ctx = canvas.getContext(),
            numPages = this.spread.numPages;

        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.translate(0.5, 0.5);
        if (this.spread.numPages===2 && this.isLeft() && this.layoutSize.drawSpine) {
            this.drawSpine(canvas);
        }

        ctx.restore();

        if (this.spread.comment) {

            var selectedEdit = PACE.ProoferService.getSelectedEdit(),
                comment = this.spread.comment,
                isSelectedComment = (comment && selectedEdit && comment.id===selectedEdit.id);

                
            if ((PACE.ProoferEnabled || this.spread.flipBookSide) && isSelectedComment) {
                ctx.save();
                var color = this.spread.comment.completed ? '#79cf19' : '#f5a623';
                var lw = 12;// * canvas.scale;
                ctx.strokeStyle = color;
                ctx.lineWidth = lw;
                ctx.globalAlpha = 1;
                ctx.setTransform(1,0,0,1,0,0);
                ctx.translate(0.5, 0.5);

                var rect = this.spreadInfo.getPageRect().toCanvasSpace(canvas).round();
                
                if (PACE.ProoferEnabled) {
                    ctx.lineWidth = 6;
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

})();