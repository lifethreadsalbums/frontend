PACE.ApplyCustomTemplateCommand = function(template, elements, page) {
	
	this.execute = function() {
		if (template.type!=='CustomLayoutTemplate') throw new Error("Spierdalaj, it's not a CustomLayoutTemplate");

		var fn = 'get' + S(template.span).capitalize().s + 'Rect',
			targetRect = page[fn](),
            originalFrames,
            bboxCenter,
            offsetX,
            offsetY;

        var center = page.getCenteringRect && template.span!=='bleed' ? 
                page.getCenteringRect().getCenter() : page.getBleedRect().getCenter();

        if (template.span==='bleed') {
            var framesRect = template.frames.rect;
            originalFrames = _.map(template.frames.frames, function(frame) {
                return {
                    x: frame.x * framesRect.width,
                    y: frame.y * framesRect.height,
                    width: frame.width * framesRect.width,
                    height: frame.height * framesRect.height
                };
            });
            bboxCenter = new PACE.Element({type:'ElementGroup', elements:originalFrames}).getBoundingBox().getCenter();
            offsetX = (framesRect.width / 2) - bboxCenter.x - (template.frames.offset.x * framesRect.width);
            offsetY = (framesRect.height / 2) - bboxCenter.y - (template.frames.offset.y * framesRect.height);
            
            var srcRect = new PACE.Rect({x:0,y:0,width:framesRect.width, height:framesRect.height}),
                tolerance = 0.00001;

            _.each(originalFrames, function(f) {
                f.x += offsetX;
                f.y += offsetY;
                var r = new PACE.Rect(f);

                var edges = {
                    leftEdge: PACE.GeomService.equals(r.left, srcRect.left, tolerance),
                    topEdge: PACE.GeomService.equals(r.top, srcRect.top, tolerance),
                    rightEdge: PACE.GeomService.equals(r.right, srcRect.right, tolerance),
                    bottomEdge: PACE.GeomService.equals(r.bottom, srcRect.bottom, tolerance)
                };
                _.extend(f, edges);
            });
        }
        
        var rect = PACE.GeomService.fitRect(template.frames.rect, targetRect),
			frames = _.map(template.frames.frames, function(frame) {
	            return {
	                x: frame.x * rect.width,
	                y: frame.y * rect.height,
	                width: frame.width * rect.width,
	                height: frame.height * rect.height,
                };
	        });
	   
        bboxCenter = new PACE.Element({type:'ElementGroup', elements:frames}).getBoundingBox().getCenter();

        var offsetSign = page.isRight && page.isRight() ? -1 : 1;

        offsetX = center.x - bboxCenter.x - (offsetSign * (template.frames.offset.x * targetRect.width));
		offsetY = center.y - bboxCenter.y - (template.frames.offset.y * targetRect.height);

        var elFrames = [];
        for (var i = 0; i < elements.length; i++) {
            var f = frames[i];
            f.x += offsetX;
            f.y += offsetY;

            if (template.span==='bleed') {
                var of = originalFrames[i];
                var r = new PACE.Rect(f);

                if (of.leftEdge) r.left = targetRect.left;
                if (of.rightEdge) r.right = targetRect.right;
                if (of.topEdge) r.top = targetRect.top;
                if (of.bottomEdge) r.bottom = targetRect.bottom;

                f = {
                    x: r.left,
                    y: r.top,
                    width: r.right - r.left,
                    height: r.bottom - r.top
                };
            }
            elFrames.push(f);
        }

        for (var i = 0; i < elements.length; i++) {
            var el = new PACE.Element(elements[i]),
                cp = el.getBoundingBox().getCenter(),
                frame,
                minDist = Number.MAX_VALUE;

            for (var j = 0; j < elFrames.length; j++) {
                if (elFrames[j].used) continue;
                var dist = PACE.Point.distance(cp, new PACE.Element(elFrames[j]).getBoundingBox().getCenter());
                if (dist<minDist) {
                    frame = elFrames[j];
                    minDist = dist;
                }
            }
            frame.used = true;
            
            el.transformElement(frame).fillFrame().centerContent();
        }

        var gap = new PACE.Elements(elements).getGapSpacing();
        var result = PACE.GeomService.roundNumber(gap / 72, 3);
        if (template.id<2468 && result===0.125) {
            //reapply the default spacing
            var bleedRect = (page.spreadInfo || page).getBleedRect(),
                bbox = new PACE.Elements(elements).getBoundingBox(),
                eq = PACE.GeomService.equals, 
                tol = 0.0001,
                fixedSpacingSticky = false;

            if ( (eq(bbox.left, bleedRect.left, tol) && eq(bbox.right, bleedRect.right)) ||
                 (eq(bbox.top, bleedRect.top, tol) && eq(bbox.bottom, bleedRect.bottom, tol)) ) {
                fixedSpacingSticky = true;
            }

            console.log('reapply default gap spacing');
            new PACE.FixedSpacingCenteredCommand(elements, PACE.AppConstants.DEFAULT_FIXED_SPACING  * 72, fixedSpacingSticky).execute();
        }


	};


};