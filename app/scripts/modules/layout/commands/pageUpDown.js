(function() {
    "use strict";

    PACE.PageNavCommand = function(layoutController, offset) {

        this.execute = function() {
            var currentIdx = layoutController.renderers.indexOf(layoutController.currentRenderer),
                idx = Math.max(0, Math.min(layoutController.renderers.length - 1, currentIdx + offset));

            if (currentIdx===idx) return;
            
            var renderer = layoutController.renderers[idx];
            layoutController.setCurrentRenderer(renderer);
            renderer.makeFirstVisible();
        };
            
    };    

}());