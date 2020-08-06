
PACE.ProoferElement = {
	
	_renderImageNumberInCircle: function(ctx) {
        if (this.element.comment.isArchived) return;

        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        var color = this.element.comment.completed ? '#79cf19' : '#f5a623';

        var matrix = this.getGlobalMatrix(),
            pt = matrix.transformPoint(0, 0);
        ctx.translate(pt.x, pt.y);
        ctx.rotate(this.angle * Math.PI/180);

        var width = this.width * this.scaleX,
            height = this.height * this.scaleY;
        var pad = 9,
            rw = 20,
            rh = 20;
        
        var rx = pad - 1,
            ry = height - rh - pad;
       
        //draw image number
        if (this.element.imageNumber>0) {
            ctx.fillStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeStyle = color;
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
           
            PACE.CanvasHelper.drawRoundedRect(ctx, rx, ry, rw, rh, 10);
            ctx.fill();
            ctx.shadowColor = "transparent";
            ctx.stroke();

            ctx.font = '12px Arial';
            ctx.fillStyle = '#000';
            ctx.lineWidth = 0;
            ctx.textAlign = 'center';  
            ctx.fillText(this.element.imageNumber, rx + rw/2, ry + rh * 0.7);
        }

        ctx.restore();
    },

    _renderCommentStroke: function(ctx) {
        if (this.element.comment.isArchived) return;
        
        ctx.save();
        var color = this.element.comment.completed ? '#79cf19' : '#f5a623';
        var lw = 6;
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.globalAlpha = 1;

        var matrix = this.getGlobalMatrix(),
            lt = new PACE.Point(matrix.transformPoint(0, 0)).round(),
            rt = new PACE.Point(matrix.transformPoint(this.width, 0)).round(),
            lb = new PACE.Point(matrix.transformPoint(0, this.height)).round(),
            w = PACE.Point.distance(lt, rt),
            h = PACE.Point.distance(lt, lb);

        ctx.setTransform(1,0,0,1,0,0);

        if (this.angle===0 && this.renderer.flipBookSide) {
            var lx = this.renderer.flipBookSide==='left' ? Math.max(0, lt.x) : lt.x,
                ly = Math.max(0, lt.y),
                rx = this.renderer.flipBookSide==='right' ? Math.min(this.canvas.width, rt.x) : rt.x,
                ry = Math.min(this.canvas.height, lb.y);
            ctx.strokeRect(lx + lw/2, ly + lw/2, (rx-lx) - lw, (ry - ly) - lw);
        } else {
            ctx.translate(lt.x, lt.y);
            ctx.rotate(this.angle * Math.PI/180);
            ctx.strokeRect(lw/2, lw/2, w - lw, h - lw);
        }
        ctx.restore();
    },

    _renderComments: function(ctx) {
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);

        var matrix = this.getGlobalMatrix(),
            pt = matrix.transformPoint(0, 0);
        ctx.translate(pt.x, pt.y);
        ctx.rotate(this.angle * Math.PI/180);

        var m = new PACE.Matrix2D();
        m.translate(pt.x, pt.y);
        m.rotate(this.angle * Math.PI/180);
        m.invert();

        var pad = 10,
            rw = 20,
            rh = 20;
        var width = this.width * this.scaleX,
            height = this.height * this.scaleY;

        var canvasTl = m.transformPoint(pad, pad),
            canvasBr = m.transformPoint(this.canvas.width - rw - pad, this.canvas.height - rh - pad);

        var ix = this.renderer.flipBookSide==='left' ? Math.max(pad, canvasTl.x) : pad,
            iy = Math.max(pad, canvasTl.y),
            rx = this.renderer.flipBookSide==='right' ? Math.min(width - rw - pad, canvasBr.x) : width - rw - pad,
            ry = Math.min(height - rh - pad, canvasBr.y);

        PACE.IconCache = PACE.IconCache || {};
        if (!PACE.IconCache.commentIcon) {
            var commentIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAZCAYAAADNAiUZAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2hpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowMTgwMTE3NDA3MjA2ODExODA4M0U4QkY1MTRGNTBBQSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4NUVGMjhFNkVEMUMxMUU3ODBDNUU0NEZGQjgwOTQyRiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4NUVGMjhFNUVEMUMxMUU3ODBDNUU0NEZGQjgwOTQyRiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDE4MDExNzQwNzIwNjgxMTgwODNFOEJGNTE0RjUwQUEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MDE4MDExNzQwNzIwNjgxMTgwODNFOEJGNTE0RjUwQUEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7jTEu+AAACzUlEQVR42rxWS2gTYRCe3W2ahOQQN2Wjhb4sPiJ6syB4qSe9eqkQqiF6kWqpiHdPJtAQKKiLIqJNJOCxoPXmwYNFPEgrQdHUGtI2yUIxNO/NPpy/bEPLts1m03bgy/472dnvn/nnsaCqKlWtVu/LspxRD0BEURQSicQjp9PJAYAFiCDhPfUQZGZm5iXSDRBiSpKkDE3TR+GAJZ/Pl1iW9ePyE90u4RsB4NKCCs8zKijq7s+5XC4HXs4gjnS0QxjLqfBsVdlYR7MAmB5wu5vey8SFsNEYbjCDaEYGPi2BIisNxFG3lw0K2RFtytPoKiGUdfpbPYwh+w5tB4ZlekUCPiXp9GN9HXD9GA1G3tcS6XS6Dk//1nX6O/0WuNHNgNF3GQ7v65QITxZrOv3dQSv4eywtRcuQp6+WavD4d1WnHz9hA3+vBVo9IrrZA1/W6iBKClzhGFAkuQHiYWDAaqrUmnr6VRDhWr8NumyYJFgW71dqMOF1QOC4tWUPG542q8eFNRHG5vIgVGTosdMwftIOgUGbqdo2nEip9Tr0Ohl4+6cM57s64QLX2XYfbhre2cvubfdmQ7otvDjaUnAIsry8XMYLaWMKPT8/HzHbf1tBOBz+iYRriDKFP+zU1NTE8PDwTRw/LPmS2GmnbrfbxjCM7j/yQkEQNoqYoihd7LPZbIXn+V+xWGwObz8iPlNaMnkQ5xCnybxD6Dr3yMhIXyQSuYqD2LFVXyqVJI7j3uEyjVjfYb8kpP8QxNPviBxVLBYBv18IsXNz3u3SNKxDQ0NncdcPvV7v4FZSj8fzApcfEIs72JGBSyKRRxQREhBSI9C8Z+12+8V4PD5bKBQU1Ku5XI5MgEktUvvTBjcFCTbCVKlUvvl8vgfBYHASicvaOSr72pG2AklUQoR2yVAoxI+Ojo4lk8kl7cxko6RUG6XHaDlwCkGS6wcpRyOG/wUYAFGA5TsJXqRLAAAAAElFTkSuQmCC';
            var img = new Image();
            img.src = commentIcon;
            PACE.IconCache.commentIcon = img;
        }
        
        if (ix<width && iy<height) {
            ctx.drawImage(PACE.IconCache.commentIcon, ix, iy);
        }

        //draw image number
        if (this.element.imageNumber>0 && this.element.comment && rx>0 && ry>0) {
            var color = this.element.comment.completed ? '#79cf19' : '#f5a623';
            ctx.fillStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeStyle = color;
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
           
            PACE.CanvasHelper.drawRoundedRect(ctx, rx, ry, rw, rh, 10);
            ctx.fill();
            ctx.shadowColor = "transparent";
            ctx.stroke();

            ctx.font = '12px Arial';
            ctx.fillStyle = '#000';
            ctx.lineWidth = 0;
            ctx.textAlign = 'center';  
            ctx.fillText(this.element.imageNumber, rx + rw/2, ry + rh * 0.7);
        }

        ctx.restore();
    }
};