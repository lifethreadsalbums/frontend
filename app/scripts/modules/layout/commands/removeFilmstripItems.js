PACE.RemoveFilmstripItemsCommand = function(filmstripItems, layout, itemsToRemove) {
	'use strict';

	var removedFilmstripItems,
		removedSpreadItems,
		// command state - i.e. this command were told to remove only
		// the items of given id. Has been introduced in order to 
		// make the command idependent from the particular instances
		// of items that are removed. It always removes the items of given ids.
		idsToRemove = _.map(itemsToRemove, function(item) {
			return item._id;
		});

	var removeFromFilmstrip = function() {
		var removedItems = [];

		_.each(
			// finding current index of each item in the 'filmstripItems'
			// the items are being reversed, in order to remove the items
			// 'by index'.
			_.map(
				// filtering 'filmstripItems' in order to obtain items with id
				// that is in the 'idsToRemove' collection
				_.filter(
					filmstripItems,
					function(item) {
						return _.contains(idsToRemove, item._id);
					}
				),
				function(item) {
					return {
						index: filmstripItems.indexOf(item),
						item: item
					};
				}
			).reverse(),
			function(el) {
				if(el.index >= 0) {
					filmstripItems.splice(el.index, 1);
					removedItems.push(el);
				}
			}
		);

		return removedItems;
	};

	var undoFilmstrip = function(removedItems) {
		if(removedItems) {
			_.each(removedItems.reverse(), function(el) {
				filmstripItems.splice(el.index, 0, el.item);
			});
		}
	};

	var removeFromSpread = function(el) {
		var removedItems = [];

		_.each(removedFilmstripItems, function(removedItem) {
			_.each(removedItem.item.occurrences, function(occurrence) {
				var index = occurrence.spread.elements.indexOf(occurrence.element);
				if(index > -1) {
					occurrence.spread.elements.splice(index, 1);
					removedItems.push({
						item: occurrence.element,
						spread: occurrence.spread
					});
				}
			});
		});

		return removedItems;
	};

	var undoSpread = function(removedItems) {
		if(removedItems) {
			_.each(removedSpreadItems, function(el) {
				el.spread.elements.push(el.item);
			});
		}
	};

	this.execute = function() {
		removedFilmstripItems = removeFromFilmstrip();
		removedSpreadItems = removeFromSpread();		
	};

	this.undo = function() {
		undoSpread(removedSpreadItems);
		undoFilmstrip(removedFilmstripItems);		

		removedFilmstripItems = null;
		removedSpreadItems = null;
	};
};