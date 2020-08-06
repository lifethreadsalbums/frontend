PACE.ApplyTemplateCommand = function(template, mode, spread, layout, renderer, layoutController, frameSpacing) {
	'use strict';

	var injector = angular.element('body').injector(),
        TemplateService = injector.get('TemplateService'),
        TemplateToFramesService = injector.get('TemplateToFramesService'),
        TemplateGeneratorService = injector.get('TemplateGeneratorService'),
        LayoutValidator = injector.get('LayoutValidator'),
        layoutSize = layout.layoutSize,
        spreadInfo = new PACE.SpreadInfoFactory().create(spread, layout),
    	stateCmd = new PACE.SaveSpreadStateCommand(spread),
        stateAfterCmd;

    //save spread's state
    stateCmd.execute();
    this.renderer = renderer;

    function mergeTemplate(template) {
        if (spread.elements.length===0) spread.template = null;

        if (spread.numPages===2 && (mode==='left' || mode==='right')) {
            if (!spread.template || spread.template.type !== 'TwoPageLayoutTemplate') {
                spread.template = {
                    type: 'TwoPageLayoutTemplate'
                };
            }
            //reset historyId, because that's in fact a new template
            spread.template.historyId = null;

            if (template.type === 'TwoPageLayoutTemplate') {
                spread.template[mode] = template[mode];
            } else {
                spread.template[mode] = template;
            }
        } else {
            spread.template = template;
        } 
        //console.log('mergeTemplate', spread.template)
    }

    function createFrame(rect) {
        return {
            type: 'ImageElement', 
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            rotation: 0,
            opacity: 1,
            imageX: 0,
            imageY: 0,
            imageWidth: rect.width,
            imageHeight: rect.height,
            imageRotation: 0,
            imageFile: {
                width: rect.width,
                height: rect.height,
            }
        };
    }
    
    function fixFrames(spreadInfo, template) {
        var spread = spreadInfo.spread,
            pages = spreadInfo.pages;

        function fixFramesOnPage(page, pageTemplate) {
            var elements = page.getImageElements(),
                numPageFrames = TemplateService.getNumCells(pageTemplate) - elements.length,
                rect = page.getPageRect();

            //console.log('adding frames', numPageFrames);
            for (var i = 0; i < Math.abs(numPageFrames); i++) {
                if (numPageFrames<0) {
                    spread.elements = _.without(spread.elements, elements[elements.length - i - 1] );
                } else {
                    spread.elements.push( createFrame(rect) );
                }
            }
        }

        function shuffleFramesOnSpread(t) {
            var numFramesLeft = TemplateService.getNumCells(t.left),
                allElements = pages[0].getImageElements().concat(pages[1].getImageElements());
                
            for (var i = 0; i < allElements.length; i++) {
                var el = allElements[i];
                var rect = pages[i<numFramesLeft ? 0 : 1].getPageRect(),
                    fitRect = PACE.GeomService.fitRect(el, rect);
                fitRect.x = rect.x;
                fitRect.y = rect.y;
                _.extend(el, fitRect);
            }
        }

        if (mode==='spread' && template.type==='TwoPageLayoutTemplate') {
            var numFrames = TemplateService.getNumCells(template);
            if (numFrames===spread.elements.length) {
                shuffleFramesOnSpread(template);
            } else {
                fixFramesOnPage(pages[0], template.left);
                fixFramesOnPage(pages[1], template.right);
            }
        } else if (mode==='left' || mode==='right') {
            fixFramesOnPage(pages[mode==='right' && pages.length>1 ? 1 : 0], template);
        } else {
            fixFramesOnPage(spreadInfo, template);
        }
    }

    function getSpanGetter(spanMode) {
        if (!spanMode || spanMode==='full-bleed') spanMode='bleed';
        var fn = S('get-' + spanMode + '-rect').camelize().s;
        return fn;
    }

    function getPageRect(page, spanMode) {
        return page[getSpanGetter(spanMode)]();
    }

    function getSpreadRect(spreadInfo, spanMode) {
        var fn = getSpanGetter(spanMode);
        //if (!spreadInfo.pages[0][fn]) debugger;

        var r = spreadInfo.pages[0][fn]();
        if (spreadInfo.pages.length>1)
        	r = r.union( spreadInfo.pages[1][fn]() );
        return r;
    }

    function getExtendedSpreadRect(t, r) {
    	var extendedRect = angular.copy(r),
            rProp = r.width / r.height,
            off = Math.max(layoutSize.width, layoutSize.height) * 10;

        if (t.desiredProportion >= rProp) {
            extendedRect.x -= off;
            extendedRect.width += 2 * off;
        } else {
            extendedRect.y -= off;
            extendedRect.height += 2 * off;
        }
        return extendedRect;
    }

    function applyGridTemplate(t, page) {
    	var els = page ? page.getImageElements() : spreadInfo.getImageElements(),
    		r = page ? getPageRect(page, t.span) : getSpreadRect(spreadInfo, t.span);

    	if (t.span==='full-bleed' && els.length===1) {
    		var frame = _.pick(r, 'x', 'y', 'width', 'height'),
                el = new PACE.Element(els[0]);

            if (el.hasDefaultCropping()) {
                el.transformElement(frame).fillFrame().centerContent();
            } else {
                el.transformElement({x:frame.x, y:frame.y, rotation:0})
                  .resizeImageElement(frame.width, frame.height);
            }
            return;
        }  

        if (t.span==='full-bleed') {
        	var extendedRect = getExtendedSpreadRect(t, r);
            var oldRect = r;
            r = extendedRect;
        }

        var numCells = TemplateService.getNumCells(t);
        if (els.length === numCells) {
            var frames = TemplateToFramesService.getFramesOfDim(t, r.width, r.height, r.x, r.y);

            for (var i = 0; i < els.length; i++) {

                var el = new PACE.Element(els[i]),
                    cp = el.getBoundingBox().getCenter(),
                    frame = frames[i],
                    minDist = Number.MAX_VALUE;

                for (var j = 0; j < frames.length; j++) {
                    if (frames[j].used) continue;
                    var dist = PACE.Point.distance(cp, new PACE.Element(frames[j]).getBoundingBox().getCenter());
                    if (dist<minDist) {
                        frame = frames[j];
                        minDist = dist;
                    }
                }
                frame.used = true;

                //if (el.hasDefaultCropping()) {
                    el.transformElement(frame).fillFrame().centerContent();
                //} else {
                //    el.transformElement({x:frame.x, y:frame.y, rotation:0})
                //      .resizeImageElement(frame.width, frame.height);
                //}
            }
        } else {
            console.warn('the template cannot be applied for the elements', t, els);
            return;
        }

        // apply spacing to the elements
        frameSpacing = frameSpacing || layoutController.frameSpacing;
        new PACE.FixedSpacingCommand(els, frameSpacing * 72).execute();

        // fit frames into target rectangle);
        var rect = PACE.GeomService.fitRect(new PACE.Elements(els).getBoundingBox(), r);
        rect.rotation = 0;

        // align the adjusted rectangle (left, right... etc.)
        new PACE.AlignElementCommand(rect, r, t.align).execute();

        if ((!t.align || t.align==='center') && page) {
            //center on page to take centerOffset into account
            new PACE.CenterOnPageCommand(rect, page.spreadInfo.spread, page.spreadInfo.layout).execute();
        }

        // position the elements inside the aligned rectangle
        new PACE.TransformElementsCommand(els, rect).execute();

        if (t.span==='full-bleed' && oldRect) {
        	// truncate the elements that are laying outside of
            // the spread bleed rectangle
            new PACE.TruncateElementsToRectCommand(els, oldRect).execute();
        }

        var result = LayoutValidator.getBrokenRulesForSpread(spread, layout);
        var found = _.findWhere(result, {type:'ForbiddenZone'});

        if (found) {
            //console.log('template broken', template, found);
            //fix template
            
            if (page && t.span==='bleed') {
                var bleed = page.getBleedRect(),
                    s1 = rect.width / bleed.width,
                    s2 = rect.height / bleed.height,
                    s = Math.min(s1,s2);

                var w = rect.width / s,
                    h = rect.height / s;

                var r2 = new PACE.Rect(rect).inflate(w - rect.width, h - rect.height);
                r2.rotation = 0;
                
                if (r2.width > bleed.width) {
                    if (page.isLeft()) {
                        r2.x -= r2.right - bleed.right;
                    } else {
                        r2.x += bleed.left - r2.left;
                    }
                } 
                var rect2 = PACE.GeomService.fitRect(rect, r2);
                rect2.x = rect.x + rect.width/2 - rect2.width/2;
                rect2.y = rect.y + rect.height/2 - rect2.height/2;
                rect2.rotation = 0;

                // position the elements inside the aligned rectangle
                new PACE.TransformElementsCommand(els, rect2).execute();
                new PACE.TruncateElementsToRectCommand(els, bleed).execute();
            } else if (page && t.span==='margin') {
                var margin = page.getMarginRect(),
                    bounds = new PACE.Rect(rect),
                    dl = margin.left - bounds.left,
                    dr = bounds.right - margin.right,
                    dt = margin.top - bounds.top,
                    db = bounds.bottom - margin.bottom,
                    d = Math.max(Math.max(dl,dr), Math.max(dt,db));

                bounds.inflate(-d, -d);
                bounds.rotation = 0;

                var rect2 = PACE.GeomService.fitRect(rect, bounds);
                rect2.x = rect.x + rect.width/2 - rect2.width/2;
                rect2.y = rect.y + rect.height/2 - rect2.height/2;
                rect2.rotation = 0;

                new PACE.TransformElementsCommand(els, rect2).execute();
            }
            
            result = LayoutValidator.getBrokenRulesForSpread(spread, layout);
            found = _.findWhere(result, {type:'ForbiddenZone'});

            //the template is still broken - mark it as broken
            if (found) {
                template.broken = true;
            }

        } else {
            template.broken = false;
        }
    }

    function applyCustomTemplate(t, page) {
        page = page || spreadInfo;
    	new PACE.ApplyCustomTemplateCommand(t, page.getImageElements(), page).execute();
    }

    function applyTemplate(t, page) {
    	if (t.type==='CustomLayoutTemplate')
    		applyCustomTemplate(t, page);
    	else
    		applyGridTemplate(t, page);
    }
	
	this.execute = function() {
        if (stateAfterCmd) {
            stateAfterCmd.undo();
            return;
        }

        spread.lastTemplateMode = mode;

		//check if there is any element that crosses the gutter
		//if so we need to switch to the the two separate pages mode
        if (spread.numPages===2 && (mode==='left' || mode==='right')) {
            if (spreadInfo.isSpreadLayout()) {
            	//switch to the two separate pages layout
                var mode2 = mode==='left' ? 'right' : 'left';
            	var t = TemplateGeneratorService.nextTemplate(spread, layout, mode2);
            	
                if (t.type!=='TwoPageLayoutTemplate') {
                    var tmp = { type: 'TwoPageLayoutTemplate' };
                    tmp[mode2] = t;
                    t = tmp;
                }

                t[mode] = template;
            	template = t;
            	mode = 'spread';
            } 
        }

        if (mode==='spread' && spread.numPages===1) {
            mode = spread.pageNumber === 1 ? 'right' : 'left';
        }

		mergeTemplate(template);
		fixFrames(spreadInfo, template);

		//apply the template
		var pages = spreadInfo.pages;
		if (mode==='spread') {
			if (template.type==='TwoPageLayoutTemplate' && pages.length===2) {
				//apply template to both pages
                if (template.left)
                    applyTemplate(template.left, pages[0]);
                if (template.right)
                    applyTemplate(template.right, pages[1]);
			} else {
				//apply template to spread
				applyTemplate(template);
			}
		} else {
			//apply template to single page
			var page = mode==='right' && pages.length===2 ? pages[1] : pages[0];
			applyTemplate(template, page);
		}

		//delete fake imageFiles
		_.each(spread.elements, function(el) {
            if (el.imageFile && !el.imageFile.filename)
                delete el.imageFile;
        });

		new PACE.PreflightSpreadCommand(spread).execute();

		if (renderer) {
            renderer.clearSelection();
            layoutController.clearSelection();
            renderer.renderWithAnimation();
        }

        stateAfterCmd = new PACE.SaveSpreadStateCommand(spread);
        stateAfterCmd.execute();
	};

	this.undo = function() {
        stateCmd.undo();
    };
	
};