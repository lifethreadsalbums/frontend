PACE.ScrollToSpreadCommand = function(spread, layoutController) {
	'use strict';

	this.execute = function() {
		if(layoutController && spread) {
			var renderer = _.findWhere(layoutController.renderers, { spread: spread });
			if(renderer) {
				layoutController.setCurrentRenderer(renderer);
				renderer.makeFirstVisible();
			}
		}
	};
};