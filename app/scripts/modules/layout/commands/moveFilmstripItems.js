PACE.MoveFilmstripItemsCommand = function(filmstrip, items, targetIndex) {
    'use strict';
    
	var oldIndex = items.length > 0 ? filmstrip.items.indexOf(items[0]) : -1;
	
	var move = function(targetIndex) {
		var i, idx, stackId;

		if (targetIndex > 0 &&
			targetIndex < filmstrip.items.length &&
			filmstrip.items[targetIndex-1].stackId === filmstrip.items[targetIndex].stackId) {
			stackId = filmstrip.items[targetIndex].stackId;
		}

		for (i = 0; i < items.length; i++) {
			idx = filmstrip.items.indexOf(items[i]);
			filmstrip.items.splice(idx, 1);
			if (targetIndex>idx)
				targetIndex--;
			if (!items[i].stackCollapsed)
				items[i].stackId = stackId;
            if (stackId)
                items[i].active = false;
		};

		for (i = 0; i < items.length; i++) {
			filmstrip.items.splice(targetIndex + i, 0, items[i]);
		}
    
        new PACE.FixFilmstripStacksCommand(filmstrip.items).execute();
		
	};

	this.execute = function() {
        move(targetIndex);		
	};

	this.undo = function() {
		if(oldIndex >= 0) {
			move(oldIndex);
		}
	};

		
};

/**
 * Fixes broken stacks, i.e. updates the values of
 * stackItemCount, stackItemNumber,
 * and stackItems and stackId of there is an element without
 * stackId in the middle of the stack.
 */
PACE.FixFilmstripStacksCommand = function (filmstripItems) {
    'use strict';

    var updateStacks = function () {
        var updateStack = function (id, start, end) {
            var items = filmstripItems.slice(start, end + 1),
                collapsed;

            _.each(items, function (item, i) {
                var count = end - start + 1;
                collapsed = collapsed || item.stackCollapsed;
                
                item.stackId = id;
                item.stackItemCount = count;
                item.stackItemNumber = i + 1;
                item.stackCollapsed = collapsed;
            });
        };

        for (var i = 0; i < filmstripItems.length; i++) {
            var item = filmstripItems[i];

            // check if the element has stackId defined
            if (item.stackId) {
                // find the last item of same stackId
                for (var j = filmstripItems.length - 1; j >= i; j--) {
                    var lastItem = filmstripItems[j];

                    if (item.stackId === lastItem.stackId) {
                        if (j > i) {
                            updateStack(item.stackId, i, j);
                        } else {
                            new PACE.UnstackFilmstripItemsCommand(
                                filmstripItems,
                                filmstripItems.slice(i, j + 1)
                            ).execute();
                        }

                        // continue from current 'last'
                        i = j;
                        break;
                    }
                }
            }
        }
    };
    
    this.execute = function () {
        updateStacks();
    };
};

/**
 * Deletes stack-related properties from the selectedItems and
 * calls command that is fixing broken stacks.
 */
PACE.UnstackFilmstripItemsCommand = function (filmstripItems, selectedItems) {
    'use strict';
    
    var deleteStackProps = function (items) {
        _.each(items, function (item) {
            delete item.stackId;
            delete item.stackItemCount;
            delete item.stackItemNumber;
            delete item.stackCollapsed;
        });
    };
    
    this.execute = function () {
        deleteStackProps(selectedItems);
        new PACE.FixFilmstripStacksCommand(filmstripItems).execute();
    };
};

PACE.StackFilmstripItemsCommand = function(filmstrip, items) {
    'use strict';

	this.execute = function() {
		var firstIndex = filmstrip.items.indexOf(items[0]),
            stackId = _.uniqueId('stack-'),
            stackItems = [];

        (new PACE.MoveFilmstripItemsCommand(filmstrip, items, firstIndex))
        	.execute();

        var count = items.length - _.filter(items, function(item) {
          	return item.type !== 'FilmStripImageItem';
        }).length;

        for (var i = 0, index = 1; i < items.length; i++) {
        	if(items[i].type === 'FilmStripImageItem') {
	            items[i].stackItemNumber = index++;
	        }
            items[i].isDoubleSpread = false;
	        items[i].stackItemCount = count;
	        items[i].stackId = stackId;
	        stackItems.push(items[i]);
        };
        
        new PACE.FixFilmstripStacksCommand(filmstrip.items).execute();
        filmstrip._version = (filmstrip._version || 0) + 1;
	};
};


PACE.CollapseStackCommand = function(items) {
    'use strict';

	this.execute = function() {
		for (var i = 0; i < items.length; i++) {
            items[i].stackCollapsed = true;
        };
	};
};

PACE.ExpandStackCommand = function(items) {
    'use strict';

	this.execute = function() {
		for (var i = 0; i < items.length; i++) {
            items[i].stackCollapsed = false;
        };
	};
};

PACE.CoverZoneCommand = function(items, inCoverZone) {
    'use strict';

    var undoState = _.pluck(items, 'inCoverZone');

    this.execute = function() {
        for (var i = 0; i < items.length; i++) {
            items[i].inCoverZone = inCoverZone;
        };  
    };

    this.undo = function() {
        for (var i = 0; i < items.length; i++) {
            items[i].inCoverZone = undoState[i];
        };
    };
};

PACE.MakeDoubleSpreadCommand = function(items, isDoubleSpread) {
    'use strict';

    var undoState = _.pluck(items, 'isDoubleSpread');

    this.execute = function() {
        for (var i = 0; i < items.length; i++) {
            items[i].isDoubleSpread = isDoubleSpread;
        };  
    };

    this.undo = function() {
        for (var i = 0; i < items.length; i++) {
            items[i].isDoubleSpread = undoState[i];
        };
    };
};
