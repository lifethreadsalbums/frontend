PACE.AutoFlowCommand = function(layout, layoutController, TemplateService, autoLayout, cleanFilmstrip) {
	'use strict';

	if(typeof(autoLayout) === 'undefined') autoLayout = true;
    if(typeof(cleanFilmstrip) === 'undefined') cleanFilmstrip = true;

	// for a given filmstrip items, returns the spreads
	// representation (array of { 'l': [...], 'r': [...] } objects
	// that contains the filmstrip items)
	var getSpreadsData = function(filmStripItems) {
		var spreadsData = [];

		var currSpread = { 'l': [], 'r': [] },
			page = layout.lps ? 'l' : 'r';
		_.each(filmStripItems, function(item) {
			switch(item.type) {
				case 'FilmStripImageItem':
					currSpread[page].push(item);
					break;
				case'FilmStripSpreadCut':
					spreadsData.push(currSpread);
					currSpread = { 'l': [], 'r': [] };
					page = 'l';
					break;
				case 'FilmStripPageCut':
					page = page === 'l' ? 'r' : 'l';
					break;
			}
		});
		spreadsData.push(currSpread);

		return spreadsData;
	};

	var oldSpreads = angular.copy(layout.spreads),
		oldSpreadsData = getSpreadsData(layout.filmStrip.items);

	// Refreshes the 'spread' by:
	// 	1. removing all items from spread
	//	2. filling the spread with 'spreadData'
	var refreshSpread = function(spread, spreadData, isLastSpread, refreshLeftPage, refreshRightPage) {
		var removeElements = function() {
				var remove = function(elements) {
						for(var e = spread.elements.length - 1; e >= 0; e--) {
							if(_.contains(elements, spread.elements[e]))
								spread.elements.splice(e, 1);
						}
					},
                    spreadInfoFactory = new PACE.SpreadInfoFactory(),
					pages = spreadInfoFactory.create(spread, layout).pages;
				if(refreshLeftPage && refreshRightPage)
					spread.elements.splice(0, spread.elements.length);
				else if(refreshLeftPage)
					remove(pages[0].getImageElements());
				else if(refreshRightPage)
					remove(pages[pages.length > 1 ? 1 : 0].getImageElements());
			},
			getPagesArr = function() {
				var arr = [];
				if(refreshLeftPage) arr.push('l');
				if(refreshRightPage) arr.push('r');
				return arr;
			};


		if(!spread) {
			return;
		}

		// empty the spread first
		removeElements();

		if(!spreadData) {
			return;
		}

		// add elements from the spreadData
		_.each(getPagesArr(), function(page) {
			if((isLastSpread && page === 'r') ||
				(isLastSpread && spreadData['r'].length === 0)) {
				return;
			} else {
				_.each(spreadData[page], function(item) {
					spread.elements.push({
						type: 'ImageElement',
						imageFile: item.image,
						x: page === 'l' ? -layout.layoutSize.bleedOutside : layout.layoutSize.width,
						y: -layout.layoutSize.bleedTop,
						width: layout.layoutSize.width + layout.layoutSize.bleedOutside,
		            	height: layout.layoutSize.height + (layout.layoutSize.bleedTop * 2),
		            	imageX:0,
		                imageY:0,
		                imageRotation:0,
		                rotation:0
					});
				});
			}
		});

		// layout the spread
		if(autoLayout) {
            var mode = refreshLeftPage && refreshRightPage ?
                'spread' : refreshLeftPage ? 'left' : 'right';
			var cmd = new PACE.AutoLayoutSpreadCommand(
                spread, layout.layoutSize, layoutController, undefined, mode);
			cmd.execute();
		}
	};

	// compares the spreads data. returns array with the indices of spreads
	// that should be refreshed. If last spread is empty, the the last - 1
	// should be refreshed either, in order to avoid filling the last 
	// page with all tail items.
	var getSpreadsToRefresh = function(oldSpreadsData, newSpreadsData) {
		var spreadsToRefresh = [];

		// compares arrays by id properties of the array objects
		// returns true is arrays contains objects with same ids,
		// false otherwise
		var arrsEqual = function(oldArr, newArr) {
			for(var i = 0; i < newArr.length; i += 1) {
				var item = _.find(oldArr, function(oldItem) {
					return newArr[i].id === oldItem.id;
				});
				if(typeof(item) === 'undefined') {
					return false;
				}
			}
			return true;
		}

		var isSpreadEmpty = function(newS, oldS) {
			var check = function(s) {
				return s && s['l'] && s['l'].length === 0 && s['r'] && s['r'].length === 0;
			};
			return check(newS) || check(oldS);
		};

		for(var i = 0; i < Math.max(newSpreadsData.length, oldSpreadsData.length); i += 1) {
			var oldSpread = oldSpreadsData[i],
				newSpread = newSpreadsData[i];

			// If it's the very last (and empty) spread, then
			// the previous one should be added.
			if(i > 0 &&
				newSpread && !oldSpread &&
				isSpreadEmpty(newSpread, oldSpread) &&
				!_.some(spreadsToRefresh, function(item) { return item.index === i - 1; })) {
				spreadsToRefresh.push({
					index: i - 1,
					l: true,
					r: true
				});
			}

			// Checking for a spread that either has appeared or
			// has been deleted or has different length or differs in 
			// content.
			var left = false, right = false;
			if(typeof(oldSpread) === 'undefined' || // there is no old spread at all
				typeof(newSpread) === 'undefined') { // there is no new spread at all
				left = right = true;
			} else {
				if(oldSpread['l'].length !== newSpread['l'].length || // left side counts different number of items
					!arrsEqual(oldSpread['l'], newSpread['l'])) // left side contains different elements
					left = true;
				if(oldSpread['r'].length !== newSpread['r'].length || // right side counts different number of items
					!arrsEqual(oldSpread['r'], newSpread['r'])) // right side contains different elements
					right = true;
			}
			if(left || right) {
				spreadsToRefresh.push({
					index: i,
					l: left,
					r: right
				});
			}
		}

		return spreadsToRefresh;
	};

	// Returns the index of last non empty spread.
	var lastNonEmptySpreadIndex = function() {
		for(var i = layout.spreads.length - 1; i >= 0; i--) {
			if(layout.spreads[i].elements.length > 0) {
				return i;
			}
		}
		return 0;
	};

	var doCleanupFilmstrip = function() {
		var cleanupCmd = new PACE.CleanupFilmstripCommand(layout.filmStrip);
		cleanupCmd.execute();
	};

	var scrollToSpread = function(spreadsToRefresh) {
		if(spreadsToRefresh) {
            // should scroll to the last non-empty spread that has
            // been changed. assuming that 'spreadsToRefresh' are sorted
            // in ascending order.
            for (var i = spreadsToRefresh.length - 1; i >= 0; i--) {
                var spread = layout.spreads[spreadsToRefresh[i].index];
                if (spread) {
                    if (i === 0 || spread.elements.length > 0) {
                        new PACE.ScrollToSpreadCommand(spread, layoutController).execute();
                        break;
                    }
                }
            }
        }
	};

	this.execute = function() {
        if(cleanFilmstrip)
            doCleanupFilmstrip();

		var newSpreadsData = getSpreadsData(layout.filmStrip.items),
			spreadsToRefresh = getSpreadsToRefresh(oldSpreadsData, newSpreadsData),
			lastSpreadIndex = newSpreadsData.length - 1;
        
        // if spread has been qualified as 'spreadToRefresh', then
        // the number of elements in the spread has changed, so the
        // selection should be cleared
        if (layoutController.currentRenderer)
            layoutController.currentRenderer.clearSelection();
        
		_.each(spreadsToRefresh, function(item) {
			refreshSpread(
				layout.spreads[item.index],
				newSpreadsData[item.index],
				item.index === lastSpreadIndex,
				item.l, item.r);
		});

		scrollToSpread(spreadsToRefresh);
	};

	this.undo = function() {
		for(var i = 0; i < layout.spreads.length; i += 1) {
			var spread = layout.spreads[i];
			spread.elements.splice(0, spread.elements.length);
			_.each(oldSpreads[i].elements, function(element) {
				spread.elements.push(element);
			});
		}
	};
};
