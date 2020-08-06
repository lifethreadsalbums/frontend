PACE.SplitImagesCommand = function(layoutController, layout) {
    'use strict';

    var injector = angular.element('body').injector(),
        Layout = injector.get('Layout'),
        $rootScope = injector.get('$rootScope');
    
    function onSplitImageComplete(imageFiles) {
        
        layoutController.clearSelection();
        var allElements = _.reduce(layout.spreads, function(result, spread) {

            var elements = _.map(spread.elements, function(el) {
                return {
                    element: el,
                    spread: spread,
                    imageId: el.imageFile ? el.imageFile.id : null
                };
            })
            return result.concat(elements);

        }, []);

        for(var i=0;i<imageFiles.length;i+=2) {
            var imageFile = imageFiles[i],
                imageFile2 = imageFiles[i + 1];
            var elements = _.where(allElements, {imageId:imageFile.id});
            _.each(elements, function(elementInfo) {
                var element = elementInfo.element;
            
                delete element._id;
                element.imageFile = imageFile;
                element.imageWidth /= 2;
                element.width /= 2;
                
                var element2 = angular.copy(element);
                delete element2.id;
                delete element2._id;
                element2.imageFile = imageFile2;
                element2.x += element.width;

                elementInfo.spread.elements.push(element2);
            });
            var filmStripItem = {
                 _id: _.uniqueId('filmstrip-item-') + _.now(),
                type:'FilmStripImageItem',
                image:imageFile2
            };

            layout.filmStrip.items.push(filmStripItem);
            _.each(layout.filmStrip.items, function(item) {
                if (item.image && item.image.id===imageFile.id) {
                    item.image = imageFile;
                }
            });
        }
        layoutController.renderAllWithAnimation();
        layoutController.fireEvent('layout:layout-changed');
        $rootScope.designerSpinner = false;
    }

    function onSplitImageError() {
        $rootScope.designerSpinner = false;
    }

    this.execute = function() {
        if (layoutController.selectedElements.length==0) return;

        var imageFiles = _.reduce(layoutController.selectedElements, function(res, el) { 
            if (el.type==='ImageElement' && el.imageFile)
                res.push(el.imageFile);
            return res;
        }, []);
        
        $rootScope.designerSpinner = true;
        Layout.splitImages(imageFiles, onSplitImageComplete, onSplitImageError);
    };

};