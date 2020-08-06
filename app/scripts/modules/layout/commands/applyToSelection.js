PACE.ApplyToSelectionCommand = function(layoutController, cmd, params) {
    'use strict';

    var macroCommand,
        elements = layoutController.selectedElements.concat();

    this.execute = function() {
        var spreadInfoFactory = new PACE.SpreadInfoFactory(),
            renderer = layoutController.currentRenderer,
            pages = spreadInfoFactory.create(renderer.spread, renderer.layout).pages,
            commands = [];

        if (cmd===PACE.FloatingImageSmallCommand || 
            cmd===PACE.FloatingImageMediumCommand ||
            cmd===PACE.FloatingImageLargeCommand) {

            if (elements.length===1) {
                var page = _.find(pages, function(page) { return page.containsElement(elements[0]); });
                commands.push(new cmd(elements[0], page));
            } else {
                commands.push(new cmd(elements, renderer.layout));
            }
        } else {
            _.each(elements, function(el) {
                if (cmd===PACE.FourSidedBleedCommand || cmd===PACE.TwoSidedBleedCommand) {
                    var page = _.find(pages, function(page) { return page.containsElement(el); });
                    commands.push(new cmd(el, page));
                } else if (cmd===PACE.SpreadFourSidedBleedCommand) {
                    var page = _.find(pages, function(page) { return page.containsElement(el); });
                    commands.push(new cmd(el, page, pages));
                } else {
                    var args = _.union([null, el], [params]),
                        cmdInstance = new (Function.prototype.bind.apply(cmd, args));

                    commands.push(cmdInstance);
                }
            });
        }

        macroCommand = new PACE.MacroCommand(commands);
        macroCommand.renderer = renderer;
        macroCommand.execute();
    };

    this.undo = function() {
        macroCommand.undo();
    };

};