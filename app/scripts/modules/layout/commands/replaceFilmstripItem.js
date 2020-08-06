PACE.ReplaceFilmstripItemCommand = function(imageFile, filmstripItem, layout, coverLayouts, layoutController) {
	'use strict';

    var state,
        injector = angular.element('body').injector(),
        FilmstripItem = injector.get('FilmStripItem'),
        UploadEvent = injector.get('UploadEvent');

	var oldImage = angular.copy(filmstripItem.image),
        oldImageRef = filmstripItem.image;

    var layouts = [layout];
    if (coverLayouts)
        layouts = layouts.concat(coverLayouts);

    var spreads = _.flatten( _.map(layouts, function(cl) { return cl.spreads; }) );

	var updateSpreads = function(filmstripItem) {
		var layoutChanged = false;

        _.each(spreads, function(spread) {
            _.each(spread.elements, function(el) {
                if (el.imageFile && oldImageRef && (
                    el.imageFile.id===oldImageRef.id ||
                    el.imageFile===oldImageRef)) {

                    delete el._id;
                    el.imageFile = filmstripItem.image;
                    var oldRatio = oldImage.width > oldImage.height,
                        newRatio = el.imageFile.width > el.imageFile.height;

                    if (oldRatio===newRatio) {
                        var ratio = oldImage.height / oldImage.width,
                        	sx = el.imageX / el.imageWidth,
                        	sy = el.imageY / el.imageHeight;

                        el.imageHeight = el.imageWidth * ratio;
                        el.imageX = el.imageWidth * sx;
                        el.imageY = el.imageHeight * sy;
                        new PACE.FixContentInFrame(el).execute();
                    } else {
                        new PACE.FillFrameCommand(el).execute();
                        new PACE.CenterContentCommand(el).execute();
                    }

                    layoutChanged = true;
                }
            })
        })

        if (layoutChanged) {
            layoutController.clearSelection(true);
            layoutController.fireEvent('layout:layout-changed');
            layoutController.renderAll();
        }

	};

	
	this.execute = function() {
		filmstripItem.image = imageFile;
		if(!imageFile.$resolved) {
			imageFile.promise.then(
				function(value) { console.log('file ' + value.filename + ' complete'); },
				function(error) { console.log(error); },
				function(event) {
					//console.log('event', event);
					switch(event.type) {
						case UploadEvent.ImageFileSaved: 
							//trigger layout-changed event to force auto save
                            layoutController.fireEvent('layout:layout-changed');
							break;
                        case UploadEvent.ThumbnailReady: 
                            updateSpreads(filmstripItem);
                            break;
					}
				}
			);
		} else {
			updateSpreads(filmstripItem);
		}
        layout.filmStrip._version = (layout.filmStrip._version || 0) + 1;
	};

	this.undo = function() {
		filmstripItem.image = oldImage;
		updateFilmstripItem(filmstripItem);
		updateSpreads(filmstripItem);
	};
};