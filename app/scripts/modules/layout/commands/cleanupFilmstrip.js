PACE.CleanupFilmstripCommand = function(filmstrip) {
	'use strict';

	// first element should be a FilmStripImageItem
	var isFirstElementCorrect = function() {
		return filmstrip.items[0].type === 'FilmStripImageItem';
	};

	// last element should be either a FilmStripImageItem or FilmStripSpreadCut
	var isLastElementCorrect = function() {
		return filmstrip.items[filmstrip.items.length - 1].type !== 'FilmStripPageCut';
	};

	// there are no two neighbouring cuts
	var getSamePlaceCuts = function() {
		var indices = [];

		for(var i = 1; i < filmstrip.items.length; i++) {
			if(filmstrip.items[i - 1].type !== 'FilmStripImageItem' &&
				filmstrip.items[i].type !== 'FilmStripImageItem') {
				if(filmstrip.items[i - 1].type === 'FilmStripPageCut')
					indices.push(i - 1);
				else indices.push(i);
			}
		}

		return indices;
	};

	var getNeighbouringPageCuts = function() {
		var lastPageCutIndex = -1,
			indices = [];

		for(var i = 0; i < filmstrip.items.length; i++) {
			switch(filmstrip.items[i].type) {
				case 'FilmStripPageCut':
					if(lastPageCutIndex >= 0)
						indices.push(i);
					lastPageCutIndex = i;
					break;
				case 'FilmStripSpreadCut':
					lastPageCutIndex = -1;
					break;
				case 'FilmStripImageItem':
				default:
					break;
			}
		}

		return indices;
	};

	var removeIndices = function(indices) {
		_.each(indices.reverse(), function(index) {
			filmstrip.items.splice(index, 1);
		});
	};

	var fixFilmstrip = function() {
		var index;
		// consider only filmstrips of non-zero length
		if(filmstrip.items.length > 0) {
			if(!isFirstElementCorrect()) {
				// if the first element is different that FilmStripImageItem, that element
				// should be removed
				filmstrip.items.splice(0, 1);
				fixFilmstrip();
			} else if(!isLastElementCorrect()) {
				// if the last element is a FilmStripPageCut, then it should be removed
				filmstrip.items.splice(filmstrip.items.length - 1, 1);
				fixFilmstrip();
			} else {
				// two cuts can't be placed on the same place
				removeIndices(getSamePlaceCuts());

				// there shouldn't be two neighbouring page cuts
				removeIndices(getNeighbouringPageCuts());
			}

		}
	};

	this.execute = function() {
		fixFilmstrip();
	};

	this.undo = function() {}
};