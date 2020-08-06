PACE.LowResLayoutError = function() {
    'use strict';

    this.type = 'LowResLayoutError';

    var minEffectivePPI = PACE.minEffectivePPI || PACE.StoreConfig.minEffectivePPI || 200;

    this.getIcon = function() {
        var imgData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAANlBMVEUAAADtHCQAAAAAAAAAAAAAAAAAAAAAAADZGiHHFx4AAADCFx6qFBqTERaGEBSEEBR9DxPtHCTTQWuMAAAAEXRSTlMAAAgYMDhogIqWmJq0y+To82KMr64AAADASURBVHgBdZJBrsMgFAMNNNCWFMr9L/sV8mUxSH07e2YFVrguPp8x4NxoptcYLxts9J9WA43uBAONnGywkZMNNkrngAE+zqSUGwzwlpPio/SlqnUJvTyiwmZsPCjQ2Pkl0CCfAg3yKcAAtwAD3EKIx2cVPsfFIdSBqxD4vvw5kdOwQE5DPzkX5ft+N0Pk/f3uNERejqPQUDr5fn5TLsqcr85F3XwxuChzG1yUuQ0uqrWFo9Gdc144Gs2LKUXh3PwB8aomh8NRumYAAAAASUVORK5CYII=';
        var img = new Image();
        img.src = imgData;
        return img;
    };

    this.getErrorMessage = function() {
        return 'The resolution for this image is below print quality at this size. <br/>'+
            'Please reduce the size or replace it with a larger version.';
    }

    this.check = function(element) {
        var errors = [];
        if (element.type==='ImageElement' && element.imageFile) {
            var effectivePpiX = 72 * element.imageFile.width / element.imageWidth,
                effectivePpiY = 72 * element.imageFile.height / element.imageHeight;

            var ppi = PACE.GeomService.roundNumber( Math.min(effectivePpiX, effectivePpiY), 2);
            if (ppi<minEffectivePPI) {
                errors.push(new PACE.LowResLayoutError());
            }
        }
        return errors;
    };

};

PACE.ImageNotUploadedError = function(element) {
    'use strict';

    this.type = 'ImageNotUploadedError';

    this.getIcon = function() {
        var imgData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAANlBMVEUAAADtHCQAAAAAAAAAAAAAAAAAAAAAAADZGiHHFx4AAADCFx6qFBqTERaGEBSEEBR9DxPtHCTTQWuMAAAAEXRSTlMAAAgYMDhogIqWmJq0y+To82KMr64AAADASURBVHgBdZJBrsMgFAMNNNCWFMr9L/sV8mUxSH07e2YFVrguPp8x4NxoptcYLxts9J9WA43uBAONnGywkZMNNkrngAE+zqSUGwzwlpPio/SlqnUJvTyiwmZsPCjQ2Pkl0CCfAg3yKcAAtwAD3EKIx2cVPsfFIdSBqxD4vvw5kdOwQE5DPzkX5ft+N0Pk/f3uNERejqPQUDr5fn5TLsqcr85F3XwxuChzG1yUuQ0uqrWFo9Gdc144Gs2LKUXh3PwB8aomh8NRumYAAAAASUVORK5CYII=';
        var img = new Image();
        img.src = imgData;
        return img;
    };

    this.getErrorMessage = function() {
        return element.imageFile.errorMessage;
    }

    this.check = function(element) {
        var errors = [];
        if (element.type==='ImageElement' && element.imageFile && element.imageFile.status==='Rejected') {
            errors.push(new PACE.ImageNotUploadedError(element));
        }
        return errors;
    };

};

PACE.PreflightLayoutCommand = function(layout) {
    'use strict';

    this.execute = function() {
        _.each(layout.spreads, function(spread) {
            new PACE.PreflightSpreadCommand(spread).execute();
        });
    };

};

PACE.PreflightSpreadCommand = function(spread) {
    'use strict';

    this.execute = function() {
        _.each(spread.elements, function(el) {
            new PACE.PreflightElementCommand(el).execute();
        });
    };

};

PACE.PreflightElementCommand = function(element) {
    'use strict';

    this.execute = function() {
        var checks = [ new PACE.LowResLayoutError(), new PACE.ImageNotUploadedError() ],
            errors = [];

        _.each(checks, function(check) {
            errors = errors.concat( check.check(element) );
        });

        element.errors = errors;
    };

};

