(function() {
    "use strict";

	PACE.SpreadInfoFactory = function() { };
	var p = PACE.SpreadInfoFactory.prototype;

	p.create = function(spread, layout) {
		if (layout.layoutSize.singlePrint) {
			return new PACE.SinglePrintSpread(spread, layout);
		} else if (layout.layoutSize.coverType) {
            if (layout.layoutSize.dynamicSpineWidth) {
			    return new PACE.FicSpread(spread, layout);
            } else {
                return new PACE.CoverSpread(spread, layout);
            }
        } else
			return new PACE.Spread(spread, layout);
	};

})();
