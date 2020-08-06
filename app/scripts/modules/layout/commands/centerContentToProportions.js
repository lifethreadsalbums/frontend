// if the proportions of the image and element are similar,
// then fits to width/height and centers the remaining dimension
// if 'allProportions' is set to false, then pictures are centered
// iff the proportion of image and element is similar.
PACE.CenterContentToProportionsCommand = function(el, allProportions, width, height) {
    'use strict';
    
    if (typeof(width) === 'undefined') width = el.width;
    if (typeof(height) === 'undefined') height = el.height;
    
    this.execute = function() {
        if (el.imageFile) {
            var elProp = width / height,
				imgProp = el.imageFile.width / el.imageFile.height,

				fitToWidth = function() {
					el.imageWidth = width;
					el.imageHeight = width / imgProp;
					el.imageX = 0;
					el.imageY = -Math.abs(el.imageHeight - height) / 2;
				},

				fitToHeight = function() {
					el.imageHeight = height;
					el.imageWidth = height * imgProp;
					el.imageY = 0;
					el.imageX = -Math.abs(el.imageWidth - width) / 2;
				};

			if(elProp === 1) {
				// for square frames always center images
				if(imgProp < 1) fitToWidth();
				else fitToHeight();
			} else {
				// center image iff there is similar proportion
				if(allProportions ||
				   imgProp < 1 && elProp < 1 || imgProp > 1 && elProp > 1) {
					if(imgProp < elProp) fitToWidth();
					else fitToHeight();
				} else {
					delete el.imageHeight;
					delete el.imageWidth;
					delete el.imageX;
					delete el.imageY;
				}
			}
        }
    };
    
};