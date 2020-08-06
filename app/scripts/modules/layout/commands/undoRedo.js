PACE.UndoCommand = function(layoutController) {
    'use strict';

    this.execute = function() {
        layoutController.undo();
        layoutController.fireEvent('layout:layout-changed');
    };

};

PACE.RedoCommand = function(layoutController) {
    'use strict';

    this.execute = function() {
        layoutController.redo();
        layoutController.fireEvent('layout:layout-changed');
    };

};