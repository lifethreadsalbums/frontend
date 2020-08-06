(function() {
    "use strict";

    PACE.ZoomToFitCommand = function(layoutController, scope) {

        this.execute = function() {
            scope.zoomOption = 'fit';
            scope.zoomChanged();
        };
            
    }; 

    PACE.ZoomCommand = function(layoutController, scope, zoomIn) {

        this.execute = function() {
            var zoomDiff = Number.MAX_VALUE,
                idx = 0;
            _.each(scope.zoomOptions, function(item, i) {
                if (!_.isNumber(item.value)) return;

                var diff = Math.abs((layoutController.scale * 100) - item.value);
                if (diff<zoomDiff) {
                    idx = i;
                    zoomDiff = diff;
                }
            });

            var newIdx = idx + (zoomIn ? 1 : -1);
            if (newIdx>0 && newIdx<scope.zoomOptions.length) {
                scope.zoomOption = scope.zoomOptions[newIdx].value;
                scope.zoomChanged();
            }
        };
            
    };    

}());