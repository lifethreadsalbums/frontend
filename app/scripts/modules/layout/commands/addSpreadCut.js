PACE.AddSpreadCutCommand = function(filmStripItems, index, getAllowedCutType) {
	'use strict';

	var addSpreadCut = function(item) {
		filmStripItems.splice(index, 0, item);
	};

	var removeItem = function(item) {
		var index = filmStripItems.indexOf(item);
		if (index >= 0) {
			filmStripItems.splice(index, 1);
		}
	};

	var spreadCut = {
		type: getAllowedCutType(index)
	};

	this.execute = function() {
		addSpreadCut(spreadCut);	
	};

	this.undo = function() {
		removeItem(spreadCut);
	};
};

PACE.RemoveAllCutsCommand = function(filmStripItems) {
	'use strict';

	var removedItems = [];

	this.execute = function() {
		for(var i = filmStripItems.length - 1; i >= 0; i -= 1) {
			if(filmStripItems[i].type === 'FilmStripPageCut' ||
				filmStripItems[i].type === 'FilmStripSpreadCut') {
				removedItems.push({ pos: i, val: filmStripItems[i] });
				filmStripItems.splice(i, 1);
			}
		}
	};

	this.undo = function() {
		_.each(removedItems, function(item) {
			filmStripItems.splice(item.pos, 0, item.val);
		});
	};
};

PACE.AddCutsCommand = function(filmStripItems,
	spreadCutStartIndex, spreadCutEndIndex, spreadCutInterval,
	pageCutStartIndex, pageCutEndIndex, pageCutInterval) {
	'use strict';

	if(typeof(spreadCutEndIndex) === 'undefined') spreadCutEndIndex = filmStripItems.length - 1;
	if(typeof(pageCutEndIndex) === 'undefined') pageCutEndIndex = filmStripItems.length - 1;
	if(typeof(spreadCutInterval) === 'undefined') spreadCutInterval = 2;
	if(typeof(pageCutInterval) === 'undefined') pageCutInterval = 2;

	var insertedItems;

	var getSpreadCut = function() {
		return {
			type: 'FilmStripSpreadCut'
		};
	};

	var getPageCut = function() {
		return {
			type: 'FilmStripPageCut'
		};
	};

	var insertCutItems = function(spreadItems, pageItems) {
		insertedItems = spreadItems.concat(pageItems);
		// in order to insert spread cut first, the sort
		// function has been adjusted
		insertedItems.sort(function(a, b) {
			var aval = a.pos + (a.type === 'page' ? 0.5 : 0),
				bval = b.pos + (b.type === 'page' ? 0.5 : 0);
			return bval - aval;
		});
		_.each(insertedItems, function(item) {
			filmStripItems.splice(item.pos, 0, item.val);
		});
	};

	var removeCutItems = function(items) {
		_.each(items, function(item) {
			filmStripItems.splice(item.pos, 1);
		});
	};
    
    var getCutsIndices = function (start, end, step, getCut, type) {
        var stackOffset = 0,
            cuts = [];
        
        if (!_.isUndefined(start)) {
            for (var i = 0; i < filmStripItems.length; i++) {
                var j = i + stackOffset,
                    prev = filmStripItems[j - 1],
                    curr = filmStripItems[j];

                // increment stackOffset if we are in the middle of the stack
                while (prev && _.has(prev, 'stackId') && !_.isNull(prev.stackId) &&
                       curr && _.has(curr, 'stackId') && !_.isNull(curr.stackId) &&
                       prev.stackId === curr.stackId) {
                    ++stackOffset;
                    
                    prev = filmStripItems[i + stackOffset - 1];
                    curr = filmStripItems[i + stackOffset];
                }
                
                // check whether the 'i' index holds the start/end/step requiremenet
                // but push 'i + stackOffset' as the final index.
                if (i >= start && i <= end) {
                    if ((i - start) % step === 0) {
                        cuts.push({ pos: i + stackOffset, val: getCut(), type: type });
                    }
                }
            }
        }
        
        return cuts;
    }

	this.execute = function() {
		insertCutItems(
            getCutsIndices(
                spreadCutStartIndex, spreadCutEndIndex,
                spreadCutInterval, getSpreadCut, 'spread'),
            getCutsIndices(
                pageCutStartIndex, pageCutEndIndex,
                pageCutInterval, getPageCut, 'page')
        );
	};

	this.undo = function() {
		if(insertedItems) {
			removeCutItems(insertedItems.reverse());
		}
	};
};