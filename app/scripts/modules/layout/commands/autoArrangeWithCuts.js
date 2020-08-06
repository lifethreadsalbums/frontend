/**
 * Instantiates and calls 'layoutClass' command in the all elements in a spread.
 * Works with commands: TwoSidedBleedCommand, FourSidedBleedCommand,
 * SpreadFourSidedBleedCommand, FloatingImageCommand.
 */
PACE.LayoutInModeCommand = function (layout, layoutController, layoutClass, TemplateService) {
    'use strict';
    
    this.execute = function () {
        var spreadInfoFactory = new PACE.SpreadInfoFactory();
        _.each(layout.spreads, function (spread) {
            var pages = pageFactory.create(spread, layout).pages;
            _.each(pages, function (page) {
                var imageEl = page.getImageElements();
                if (imageEl.length === 1) {
                    new layoutClass(imageEl[0], page, pages).execute();
                }
            }); 
        });
    };
    
    this.undo = function () { /* TODO */ };
};

/**
 * For a given 'autoArrangeOption':
 *  1. removea all cuts from the filmstrip
 *  2. adds spread/page cuts in order to achieve desired arrangement,
 *  3. for a given arrangement of cuts fills the layout with elements,
 *  4. layouts the elements within a spread (e.g. fits TwoSided/FourSided bleed).
 */
PACE.AutoArrangeWithCutsCommand = function (autoArrangeOption, layout, layoutController, filmStripItems, TemplateService) {
    'use strict';
    
    var lps = layout.lps,
        
        layoutClasses = {
            'two-sided-bleed': PACE.TwoSidedBleedCommand,
            'two-sided-bleed-left': PACE.TwoSidedBleedCommand,
            'two-sided-bleed-right': PACE.TwoSidedBleedCommand,
            'four-sided-bleed': PACE.FourSidedBleedCommand,
            'four-sided-bleed-left': PACE.FourSidedBleedCommand,
            'four-sided-bleed-right': PACE.FourSidedBleedCommand,
            'floating-image': PACE.FloatingImageCommand,
            'floating-image-left': PACE.FloatingImageCommand,
            'floating-image-right': PACE.FloatingImageCommand,
            'double-spread': PACE.SpreadFourSidedBleedCommand
        },
        
        getLayoutCmd = function () {
            if(!_.isUndefined(layoutClasses[autoArrangeOption]))
                return new PACE.LayoutInModeCommand(layout, layoutController,
                    layoutClasses[autoArrangeOption], TemplateService);
            else
                return new PACE.AutoFlowCommand(layout, layoutController, TemplateService, false, false);
        },
        
        callCmd = function (cutsCmd) {
            var cmd = new PACE.MacroCommand([
                new PACE.RemoveAllCutsCommand(filmStripItems),
                cutsCmd,
                new PACE.AutoFlowCommand(layout, layoutController, TemplateService, false, false),
                getLayoutCmd()
            ]);
            
            cmd.execute();
        },
        
        getAddCutsCmd = function () {
            switch (autoArrangeOption) {
                case 'two-sided-bleed':
                case 'four-sided-bleed':
                case 'floating-image':
                    return new PACE.AddCutsCommand(filmStripItems, lps ? 2 : 1, undefined, 2, lps ? 1 : 2, undefined, 2);
                case 'two-sided-bleed-left':
                case 'four-sided-bleed-left':
                case 'floating-image-left':
                    return new PACE.AddCutsCommand(filmStripItems, lps ? 1 : 0, undefined, 1);
                case 'two-sided-bleed-right':
                case 'four-sided-bleed-right':
                case 'floating-image-right':
                    return new PACE.AddCutsCommand(filmStripItems, 1, undefined, 1, lps ? 0 : 1, undefined, 1);  
                case 'double-spread':
                    return new PACE.AddCutsCommand(filmStripItems, 1, undefined, 1);
                case 'clear':
                default: return new PACE.RemoveAllCutsCommand(filmStripItems);
            }
        };
    
    this.execute = function () {
        callCmd(getAddCutsCmd());
    };
    
    this.undo = function () { /* TODO */ };
};
