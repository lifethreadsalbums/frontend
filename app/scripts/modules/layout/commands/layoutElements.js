
PACE.AutoLayoutSpreadCommand = function(spread, layout, layoutController,
                                         renderer, mode) {
    'use strict';

    var injector = angular.element('body').injector(),
        TemplateGeneratorService = injector.get('TemplateGeneratorService'),
        LayoutValidator = injector.get('LayoutValidator'),
        stateCmd = new PACE.SaveSpreadStateCommand(spread),
        afterStateCmd;

    //save spread's state
    stateCmd.execute();
    this.renderer = renderer;

    this.undo = function() {
        stateCmd.undo();
    };

    this.execute = function() {
        if (afterStateCmd) {
            afterStateCmd.undo();
            return;
        }

        var spreadValid = false,
            i = 0,
            elements = angular.copy(spread.elements);

        while(!spreadValid && i<10) {
            var template = TemplateGeneratorService.nextTemplate(spread, layout, mode);
            if ((mode=='left' || mode==='right') && template.type==='TwoPageLayoutTemplate')
                template = template[mode];

            new PACE.ApplyTemplateCommand(
                template, 
                mode, 
                spread, 
                layout, 
                null, 
                null,
                PACE.AppConstants.DEFAULT_FIXED_SPACING).execute();

            spreadValid = LayoutValidator.validateSpread(spread, layout);

            if (!spreadValid) {
                console.debug('Spread not valid, trying another template');
                template = undefined;
                spread.elements = angular.copy(elements);
            }
            i++;
        }

        if (renderer) {
            layoutController.clearSelection();
            renderer.clearSelection();
            renderer.renderWithAnimation();
        }

        afterStateCmd = new PACE.SaveSpreadStateCommand(spread),
        afterStateCmd.execute();
    };
};