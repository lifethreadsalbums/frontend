PACE.CopyCommand = function(layoutController) {
    'use strict';

    var injector = angular.element('body').injector(),
        SessionService = injector.get('SessionService');

    this.execute = function() {
        if (layoutController.selectedElements.length > 0 || layoutController.selectedGuides.length > 0) {
            SessionService.set('clipboard', JSON.stringify({
                elements: layoutController.selectedElements,
                guides: _.filter(layoutController.selectedGuides, layoutController.currentRenderer.hasGuide)
            }));
        }
    };

};

PACE.PasteCommand = function(layoutController) {
    'use strict';

    var injector = angular.element('body').injector(),
        SessionService = injector.get('SessionService'),
        cmd;

    this.execute = function() {
        var clipboard = SessionService.get('clipboard');
        if (clipboard) {
            clipboard = JSON.parse(clipboard);
            if (clipboard.elements && clipboard.elements.length > 0) {
                _.each(clipboard.elements, function(el) { 
                    delete el.id;
                    delete el._id;
                });
                cmd = new PACE.AddElementsCommand(layoutController.currentRenderer.spread, clipboard.elements);
                cmd.renderer = layoutController.currentRenderer;
                cmd.execute();
                layoutController.currentRenderer.render();
            }
            if (clipboard.guides && clipboard.guides.length > 0) {
                var guides = clipboard.guides;
    
                layoutController.selectedGuides = guides;
                layoutController.currentRenderer.addGuides(guides);
                layoutController.currentRenderer.render();
            }
        }
    };

    this.undo = function() {
        if (cmd) cmd.undo();
    };
};