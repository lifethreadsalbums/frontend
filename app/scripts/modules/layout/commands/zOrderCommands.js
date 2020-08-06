(function() {
    "use strict";

    function moveElements(elements, spread, index) {
        _.each(elements, function(el) {
            var idx = spread.elements.indexOf(el);
            if (idx!==index) {
                spread.elements.splice(idx, 1);
                spread.elements.splice(index, 0, el);
            }
            index++;
        });
    }

    PACE.SendBackwardCommand = function(elements, spread) {
        var spreadElements = spread.elements.concat();

        this.execute = function() {
            var minIndex = _.reduce(elements, function(memo, el) { 
                    return Math.min(memo, spread.elements.indexOf(el)); 
                }, Number.MAX_VALUE);
                 
            moveElements(elements, spread, Math.max(0, minIndex - 1));
        };

        this.undo = function() {
            spread.elements = spreadElements;
        };
    };

    PACE.SendToBackCommand = function(elements, spread) {
        var spreadElements = spread.elements.concat();

        this.execute = function() {
            moveElements(elements, spread, 0);
        };

        this.undo = function() {
            spread.elements = spreadElements;
        };
    };

    PACE.BringForwardCommand = function(elements, spread) {
        var spreadElements = spread.elements.concat();

        this.execute = function() {
            var maxIndex = _.reduce(elements, function(memo, el) { 
                    return Math.max(memo, spread.elements.indexOf(el)); 
                }, -1);
                 
            moveElements(elements, spread, Math.min(spread.elements.length - 1, maxIndex + 1));
        };

        this.undo = function() {
            spread.elements = spreadElements;
        };
    };

    PACE.BringToFrontCommand = function(elements, spread) {
        var spreadElements = spread.elements.concat();

        this.execute = function() {
            moveElements(elements, spread, spread.elements.length - 1);
        };

        this.undo = function() {
            spread.elements = spreadElements;
        };
    };

    PACE.BringTextElementsToFront = function(spread) {

        var spreadElements = spread.elements.concat(),
            textElements = _.filter(spread.elements, {type:'TextElement'});

        this.execute = function() {
            moveElements(textElements, spread, spread.elements.length - 1);
        };

        this.undo = function() {
            spread.elements = spreadElements;
        };
    };

    PACE.MoveElementsCommand = function(spread, elements, index) {

        this.execute = function() {
            var spreadElements = spread.elements.concat();
            moveElements(elements, spread, index);
        };

        this.undo = function() {
            spread.elements = spreadElements;
        };
    };

    function selectionCmd(cmd) {
        return function(layoutController) {
            var cmdInstance;

            this.execute = function() {
                if (!cmdInstance) {
                    var args = [null, layoutController.selectedElements.concat(), 
                        layoutController.currentRenderer.spread];
                
                    cmdInstance = new (Function.prototype.bind.apply(cmd, args));
                }
                cmdInstance.execute();
            };

            this.undo = function() {
                cmdInstance.undo();
            };
        };
    };

    PACE.SelectionSendBackwardCommand = selectionCmd(PACE.SendBackwardCommand);
    PACE.SelectionSendToBackCommand = selectionCmd(PACE.SendToBackCommand);
    PACE.SelectionBringForwardCommand = selectionCmd(PACE.BringForwardCommand);
    PACE.SelectionBringToFrontCommand = selectionCmd(PACE.BringToFrontCommand);
})();