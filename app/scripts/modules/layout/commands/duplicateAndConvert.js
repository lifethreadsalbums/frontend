PACE.DuplicateAndConvertCommand = function(layoutController, layout) {
    'use strict';

    var injector = angular.element('body').injector(),
        Layout = injector.get('Layout'),
        $rootScope = injector.get('$rootScope');
    
    function getBackgroundFrame() {
        var picBox = new PACE.Element(layoutController.selectedElements[0]),
            rect = picBox.getBoundingBox(),
            spread = layoutController.getCurrentSpread();

        rect.inflate(-0.125 * 72, -0.125 * 72);

        for (var i = 0; i < spread.elements.length; i++) {
            var el = spread.elements[i];
            if (el.type==='ImageElement' && el.imageFile) {
                var rect2 = new PACE.Element(el).getBoundingBox();
                if (rect2.containsRect(rect))
                    return el;
            }
        }
        return null;
    }

    this.execute = function() {

        if (layoutController.selectedElements.length===0) return;

        var backgroundPicBox = getBackgroundFrame(),
            picBox = layoutController.selectedElements[0];

        if (backgroundPicBox && picBox && !picBox.imageFile) {
            $rootScope.designerSpinner = true;
            Layout.duplicateAndConvert({layoutId: layout.id, backgroundFrame:backgroundPicBox, emptyFrame:picBox},
                function(imageFile) {
                    picBox.imageFile = imageFile;
                    picBox.imageX = 0;
                    picBox.imageY = 0;
                    picBox.imageWidth = picBox.width;
                    picBox.imageHeight = picBox.height;
                    layoutController.getCurrentRenderer().render();

                    var filmStripItem = {
                         _id: _.uniqueId('filmstrip-item-') + _.now(),
                        type:'FilmStripImageItem',
                        image:imageFile
                    };

                    layout.filmStrip.items.push(filmStripItem);
                    layoutController.fireEvent('layout:layout-changed');
                    $rootScope.designerSpinner = false;
                }, 
                function(error) {
                    $rootScope.designerSpinner = false; 
                }
            );

        }
        
    };

};