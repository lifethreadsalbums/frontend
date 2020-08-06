PACE.PrevHistoryTemplateCommand = function (layoutCtrl, recentlyUsedControl) {
    'use strict';
    
    this.execute = function () {
        recentlyUsedControl.applyHistoryPrevious();
    };
};

PACE.NextHistoryTemplateCommand = function (layoutCtrl, recentlyUsedControl, mode, nextFromHistory) {
    'use strict';

    var injector = angular.element('body').injector(),
        UndoService = injector.get('UndoService');

    if (typeof(nextFromHistory) === 'undefined') nextFromHistory = true;
    
    this.execute = function () {
        if (!nextFromHistory || !recentlyUsedControl.applyHistoryNext()) {
            var r = layoutCtrl.currentRenderer;
            var cmd = new PACE.AutoLayoutSpreadCommand(r.spread, r.layout, layoutCtrl, r, mode);
            cmd.execute();
            UndoService.pushUndo(cmd);
            layoutCtrl.fireEvent('layout:layout-changed');
        }
    };
};
