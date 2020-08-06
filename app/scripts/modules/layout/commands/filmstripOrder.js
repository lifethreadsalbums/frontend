PACE.UpdateFilmstripOrder = function(filmStripItems) {
	'use strict';

	var oldOrder = _.map(filmStripItems, function(item) {
		return item.currentOrder;
	});

	this.execute = function() {
		for(var i = 0; i < filmStripItems.length; i += 1) {
			filmStripItems[i].currentOrder = i;
		}
	};

	this.undo = function() {
		for(var i = 0; i < filmStripItems.length; i += 1) {
			filmStripItems[i].currentOrder = oldOrder[i];
		}
	};

};