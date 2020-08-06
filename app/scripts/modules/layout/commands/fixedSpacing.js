PACE.FixedSpacingCommand = function(elements, spacing) {
	'use strict';
	
	var settings = {
			tolerance: 0.01,
			gapCorrection: 0.001
		},
	
		contains = function(arr, value) {
			return _.some(arr, function(item) {
				return item - settings.tolerance < value &&
						item + settings.tolerance > value;
			});
		},

		stateCmd = new PACE.SaveElementsStateCommand(elements),
		
		setFixedSpacing = function(elements, gap) {
			var positionProperties = _.map(elements, function(e) {
					// sV - number of verical lines splittng the current element,
					// sH - number of horizontal lines splitting the current element,
					// oV - number of elements above the current element
					// oH - number of elements on to the left of the current element
					// gap - the initial value of spacing
					var ret = { sV: 0, sH: 0, oV: 0, oH: 0, gap: Number.MAX_VALUE };
						
					_.reduce(elements, function(levels, e2) {
						if(e2.y > e.y && e2.y < e.y + e.height && !contains(levels.sv, e2.y)) {
							levels.sv.push(e2.y);
							ret.sV++;
						}
		
						if(e2.x > e.x && e2.x < e.x + e.width && !contains(levels.sh, e2.x)) {
							levels.sh.push(e2.x);
							ret.sH++;
						}
		
						if(e2.y + e2.height < e.y && !contains(levels.ov, e2.y + e2.height)) {
							levels.ov.push(e2.y + e2.height);
							ret.gap = Math.min(ret.gap, e.y - (e2.y + e2.height))
							ret.oV++;
						}
		
						if(e2.x + e2.width < e.x && !contains(levels.oh, e2.x + e2.width)) {
							levels.oh.push(e2.x + e2.width);
							ret.gap = Math.min(ret.gap, e.x - (e2.x + e2.width))
							ret.oH++;
						}
		
						return levels;
					}, { sv: [], sh: [], ov: [], oh: [] });
		
					return ret;
				}),
				
				initialGap = _.min(positionProperties, function(el) { return el.gap; }).gap,

				// relative gap size
				gapDiff = initialGap === Number.MAX_VALUE ? gap : gap - initialGap + settings.gapCorrection;
				
			_.each(_.zip(elements, positionProperties), function(tpl) {
				var w = tpl[0].width + gapDiff * tpl[1].sH,
					h = tpl[0].height + gapDiff * tpl[1].sV;
	
				new PACE.ResizeImageElement(tpl[0], w, h).execute();
	
				tpl[0].x += gapDiff * tpl[1].oH;
				tpl[0].y += gapDiff * tpl[1].oV;
			});
		};

	this.execute = function() {
		stateCmd.execute();
		setFixedSpacing(elements, spacing);
	};

	this.undo = function() {
		stateCmd.undo();
	};
};

/*
PACE.FixedSpacingCommand2 = function(elements, spacing) {
	'use strict';

	var stateCmd = new PACE.SaveElementsStateCommand(elements);
	var elementBoundsById = {};

	for (var i = elements.length - 1; i >= 0; i--) {
		var el = elements[i];
		el._id = el._id || _.uniqueId('element-') + _.now();
		elementBoundsById[el._id] = new PACE.Element(el).getBoundingBox();
	}

	function getNumCols(el, elements) {
		var n = elements.length;
		var rect = elementBoundsById[el._id];// new PACE.Element(el).getBoundingBox();
		var maxx = Number.MIN_VALUE;
		var num = 0;
		for(var i=0;i<n;i++) {
			var r = elementBoundsById[elements[i]._id];// new PACE.Element(elements[i]).getBoundingBox();
			var r2 = new PACE.Rect(r);
			r2.x = rect.x;

			if (rect.intersects(r2) && r.x >= maxx) {
				maxx = r.right;
				num++;
			}
		}
		return num;
	}
	
	function getNumRows(el, elements) {
		var n = elements.length;
		var rect = elementBoundsById[el._id]; //new PACE.Element(el).getBoundingBox();
		var maxy = Number.MIN_VALUE;
		var num = 0;
		for(var i=0;i<n;i++) {
			var r = elementBoundsById[elements[i]._id]; //new PACE.Element(elements[i]).getBoundingBox();
			var r2 = new PACE.Rect(r);
			r2.y = rect.y;
			if (rect.intersects(r2) && r.y >= maxy) {
				maxy = r.bottom;
				num++;
			}
		}
		return num;
	}

	function setFixedSpacing(elements, bounds, gap)	{
		if (elements.length<2) return;

		var groupBounds = new PACE.Element({type:'ElementGroup', elements:elements}).getBoundingBox();
		if (!bounds)
			bounds = groupBounds;

		var helements = elements.concat();
		helements.sort(
			function(a, b) {
				var ra = elementBoundsById[a._id]; //new PACE.Element(a).getBoundingBox();
				var rb = elementBoundsById[b._id]; //new PACE.Element(b).getBoundingBox();
				if (ra.x < rb.x)
					return -1;
				else if (ra.x > rb.x)
					return 1;
				else 
					return 0;
				
			});
		var velements = elements.concat();
		velements.sort(
			function(a, b) {
				var ra = elementBoundsById[a._id]; //new PACE.Element(a).getBoundingBox();
				var rb = elementBoundsById[b._id]; //new PACE.Element(b).getBoundingBox();
				if (ra.y < rb.y)
					return -1;
				else if (ra.y > rb.y)
					return 1;
				else 
					return 0;
				
			});
		
		var rightEdges = [];
		var bottomEdges = [];
		var n = elements.length;
		var tolerance = 0.01;
		
		for(var j=0;j<n;j++) {
			var el2 = elements[j];
			// if (j===n-1) {
			// 	console.log((el2.x + el2.width), groupBounds.right, Math.abs((el2.x + el2.width) - groupBounds.right))
			// }
			if (Math.abs((el2.x + el2.width) - groupBounds.right)<tolerance) {
				rightEdges.push(j);
			}
			
			if (Math.abs((el2.y + el2.height) - groupBounds.bottom)<tolerance) {
				bottomEdges.push(j);
			}
		}
		//console.log(rightEdges);
		
		var elementBounds = [];
		for(var i=0;i<n;i++) {
			elementBounds[i] = elementBoundsById[elements[i]._id]; // new PACE.Element(elements[i]).getBoundingBox();
		}
	
		var closestLeft = [];
		var closestTop = [];
		
		for(i=0;i<n;i++) {
			var r = elementBounds[i];
			var clLeft = null;
			var clTop = null;
			var clLeftElement = null;
			var clTopElement = null;
			 
			for(j=0;j<n;j++) {
				if (i==j)
					continue;
				var r2 = elementBounds[j];
				var hr = new PACE.Rect(r2);
				hr.x = r.x;
				
				if (hr.intersects(r)) {
					var dleft = r.x - r2.right;
					if (dleft>=0) {
						if (!clLeft || dleft < r.x - clLeft.right) {
							clLeft = r2;
							clLeftElement = elements[j];
						}
					} 
				}
				
				var vr = new PACE.Rect(r2);
				vr.y = r.y;
				if (vr.intersects(r)) {
					var dtop = r.y - r2.bottom;
					if (dtop>=0) {
						if (!clTop || dtop < r.y - clTop.bottom) {
							clTop = r2;
							clTopElement = elements[j];
						}
					} 
				}
			}
			closestLeft[i] = clLeftElement;
			closestTop[i] = clTopElement;
		}
		
		var cols = [];
		var rows = [];
		for(i=0;i<n;i++) {
			cols[i] = getNumCols(elements[i], helements);
			rows[i] = getNumRows(elements[i], velements);
		}
		
		for(var k=0;k<2;k++) {
			for(i=0;i<n;i++) {
				var el = elements[i];
				var left = closestLeft[i];
				var top = closestTop[i];
				
				var x = el.x;
				var y = el.y;
				
				if (left) {
					if (gap===0)
						x = left.x + left.width;// - left.stroke;
					else
						x = left.x + left.width + gap;
				} else 
					x = bounds.x + (elementBounds[i].x - groupBounds.x);
				if (top) {
					if (gap===0)
						y = top.y + top.height;// - top.stroke;
					else
						y = top.y + top.height + gap;
				} else
					y = bounds.y + (elementBounds[i].y - groupBounds.y);
				
				if (k===0) {
					var dw = (bounds.width - groupBounds.width) / cols[i];
					var dh = (bounds.height - groupBounds.height) / rows[i];
					if (isNaN(dw)) dw = 0;
					if (isNaN(dh)) dh = 0;

					var w = Math.max(0.0001, el.width + dw);
                    if (isNaN(w)) w = 0;
					var h = Math.max(0.0001, el.height + dh);
                    if (isNaN(h)) h = 0;
                    new PACE.ResizeImageElement(el, w, h).execute();
				}
				
				el.x = x;
				el.y = y;
			}
		}
		
		var maxy = Number.MIN_VALUE;
		var maxx = Number.MIN_VALUE;
        
		for(j=0;j<n;j++) {
			el = elements[j];
            var d = Math.abs(el.height - groupBounds.height);
            if (d>0.000001)
				maxy = Math.max(el.y + el.height, maxy);
            
            d = Math.abs(el.width - groupBounds.width);
            if (d>0.000001)
				maxx = Math.max(el.x + el.width, maxx);
		}
		
		if (maxx!=Number.MIN_VALUE && elements.length>2) {
			for(i=0;i<rightEdges.length;i++) {
				var idx = rightEdges[i];
				el = elements[idx];
				if (cols[idx]===1)
				{
					w = maxx - el.x;
					h = el.height;
					new PACE.ResizeImageElement(el, w, h).execute();
				}
			}
		}
		
		if (maxy!=Number.MIN_VALUE && elements.length>2) {
			for(i=0;i<bottomEdges.length;i++) {
				var idx = bottomEdges[i];
				el = elements[idx];
				if (rows[idx]===1)
				{
					w = el.width;
					h = maxy - el.y;
					new PACE.ResizeImageElement(el, w, h).execute();
				}
			}
		}
		
	}

	this.execute = function() {
		stateCmd.execute();
		setFixedSpacing(elements, null, spacing);
	};

	this.undo = function() {
		stateCmd.undo();
	};

};


PACE.FixedSpacingCenteredCommand = function(elements, spacing) {

	var stateCmd;

	function getCenter() {
		return new PACE.Element({type:'ElementGroup', elements:elements})
			.getBoundingBox()
			.getCenter();
	}

	this.execute = function() {
		stateCmd = new PACE.SaveElementsStateCommand(elements);
		stateCmd.execute();
		if (elements.length<2) return;

		var preCenter = getCenter();
		//spacingCmd.execute();

		new PACE.FixGridCommand(elements, spacing).execute();

		var postCenter = getCenter();
		_.each(elements, function(el) {
		 	el.x -= postCenter.x - preCenter.x;
		 	el.y -= postCenter.y - preCenter.y;
		});
	};

	this.undo = function() {
		stateCmd.undo();
	};

};
*/

PACE.FixedSpacingCenteredCommand = function(frames, spacing, stickToOuterRect) {

	if (frames.selectedElements)
		frames = frames.selectedElements;

	var elements = _.map(frames, function(el) { return new PACE.Element( angular.copy(el) ); }),
		currentGap = new PACE.Elements(frames).getGapSpacing();

	var elementsBox = new PACE.Elements(frames).getBoundingBox();

	var stateCmd;

	function getCenter(elements) {
		return new PACE.Element({type:'ElementGroup', elements:elements})
			.getBoundingBox()
			.getCenter();
	}

	function round(x) {
		return PACE.GeomService.roundNumber(x, 4);
	}

	function getLines(els, props) {
		var lines = [];
		for (var i = 0; i < els.length; i++) {
			var bbox = els[i].getBoundingBox();
			for (var j = 0; j < props.length; j++) {
				var lineInfo = {
					pos: bbox[props[j]],
					prop: props[j],
					el: els[i]
				}
				lines.push(lineInfo);	
			}
		}
		lines.sort(function(a,b) {
			return a.pos - b.pos;
		});
		return lines;
	}

	function align(els, bboxProp, elProp, left) {
		var numPasses = 0;
		do {
			var numAdjustments = 0;
			
			for (var i = 0; i < elements.length; i++) {
				var el = elements[i],
					bbox = el.getBoundingBox(),
					pos = bbox[bboxProp];

				var lines = getLines(els, [bboxProp]);
				var closestLine = _.min(lines, function(line) {
					if (line.el === el) return Number.MAX_VALUE;
					if ( (left && pos<line.pos) || (!left && pos>line.pos)) return Number.MAX_VALUE;
					
					var dist = Math.abs(pos - line.pos);
					if (dist===0) return Number.MAX_VALUE;

					return dist;
				});
				var dist = Math.abs(closestLine.pos - pos),
					tolerance = 10;//Math.max(0, spacing * 1.2);
				if (closestLine.el!==el && dist>0 && dist<tolerance) {
					numAdjustments++;
					el.element[elProp] += closestLine.pos - pos;
				}
			}
			//console.log('align', numPasses, bboxProp, numAdjustments);
			numPasses++;
		} while (numPasses<els.length && numAdjustments>0);
	}

	function space(elements, gap) {
		var n = elements.length,
			i, j,
			closestLeft = [],
			closestTop = [],
			elementBounds = [];

		for(i=0;i<n;i++) {
			elementBounds[i] = elements[i].getBoundingBox();
		}
		
		for(i=0;i<n;i++) {
			var r = elementBounds[i],
				clLeft = null, 
				clTop = null,
				clLeftElement = null,
				clTopElement = null;
			 
			for(j=0;j<n;j++) {
				if (i==j) continue;
				var r2 = elementBounds[j];
				var hr = new PACE.Rect(r2);
				hr.x = r.x;
				
				if (hr.intersects(r)) {
					var dleft = r.x - r2.right;
					if (dleft>=0) {
						if (!clLeft || dleft < r.x - clLeft.right) {
							clLeft = r2;
							clLeftElement = elements[j];
						}
					} 
				}
				
				var vr = new PACE.Rect(r2);
				vr.y = r.y;
				if (vr.intersects(r)) {
					var dtop = r.y - r2.bottom;
					if (dtop>=0) {
						if (!clTop || dtop < r.y - clTop.bottom) {
							clTop = r2;
							clTopElement = elements[j];
						}
					} 
				}
			}
			closestLeft[i] = clLeftElement;
			closestTop[i] = clTopElement;
		}
		
		var lines = getLines(elements, ['right','bottom']);
		//merge lines
		var lines2 = [];
		for(i=0;i<lines.length;i++) {
			var line = lines[i];
			var line2 = _.findWhere(lines2, {pos:line.pos, prop:line.prop});
			if (!line2) {
				line2 = {
					pos: line.pos,
					prop: line.prop,
					elements: [line.el]
				};
				lines2.push(line2);
			} else {
				line2.elements.push(line.el);
			}
		}
		
		for(var k=0;k<n;k++) {
			//apply gaps
			for(i=0;i<n;i++) {
				var el = elements[i],
					left = closestLeft[i],
					top = closestTop[i],
					elBox = el.getBoundingBox();
				
				var x = elBox.x;
				var y = elBox.y;
				
				if (left) {
					x = left.getBoundingBox().right + gap;
				} 
				
				if (top) {
					y = top.getBoundingBox().bottom + gap;
				}
				
				el.element.x += (x - elBox.x);
				el.element.y += (y - elBox.y);
			}
			
			for(i=0;i<n;i++) {
				var el = elements[i],
					bbox = el.getBoundingBox();

				//fix bottom edges
				var lineBottom = _.find(lines2, function(line) {
					return line.prop==='bottom' && line.elements.indexOf(el)>=0;
				});

				var fn = currentGap<spacing ? _.max : _.min;
				
				var elBottom = fn(lineBottom.elements, function(el2) {
					var bbox2 = el2.getBoundingBox();
					return bbox2.bottom - bbox.bottom;
				});

				var pos = elBottom.getBoundingBox().bottom;
				el.element.height += pos - bbox.bottom;
				
				//fix right edges
				var lineRight = _.find(lines2, function(line) {
					return line.prop==='right' && line.elements.indexOf(el)>=0;
				});				

				var elRight = fn(lineRight.elements, function(el2) {
					var bbox2 = el2.getBoundingBox();
					return bbox2.right - bbox.right;
				});

				var pos = elRight.getBoundingBox().right;
				el.element.width += pos - bbox.right;
			}
		}
	}
	
	this.execute = function() {

		stateCmd = new PACE.SaveElementsStateCommand(frames);
		stateCmd.execute();

		var preCenter = getCenter(frames);

		align(elements, 'left', 'x', true);
		align(elements, 'top', 'y', true);

		align(elements, 'right', 'width', false);
		align(elements, 'bottom', 'height', false);

		space(elements, spacing);

		var newFrames = _.pluck(elements, 'element');

		var postCenter = getCenter(newFrames);
		for (var i = 0; i < elements.length; i++) {	
			var el = elements[i].element;

			el.x -= postCenter.x - preCenter.x;
		 	el.y -= postCenter.y - preCenter.y;
		}

		if (stickToOuterRect) {
			var bbox = new PACE.Elements(newFrames).getBoundingBox(),
				eq = PACE.GeomService.equals, 
                tol = 0.0001;;

			for (var i = 0; i < elements.length; i++) {	
				var el = elements[i].element,
					left = el.x,
					right = el.x + el.width,
					top = el.y,
					bottom = el.y + el.height;

				if ( eq(left, bbox.left, tol) ) {
					el.x = elementsBox.left;
					el.width = right - el.x;
				}

				if ( eq(right, bbox.right, tol) ) {
					el.width = elementsBox.right - el.x;
				}

				if ( eq(top, bbox.top, tol) ) {
					el.y = elementsBox.top;
					el.height = bottom - el.y;
				}

				if ( eq(bottom, bbox.bottom, tol) ) {
					el.height = elementsBox.bottom - el.y;
				}
			}
		}

		for (var i = 0; i < frames.length; i++) {
			var el = frames[i],
				el2 = elements[i].element;

			el.x = el2.x;
			el.y = el2.y;
			if (el.width!==el2.width || el.height!==el2.height) {
				new PACE.ResizeImageElement(el, el2.width, el2.height).execute();
			}
		}
	};

	this.undo = function() {
		stateCmd.undo();
	};

};