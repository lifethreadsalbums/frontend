PACE.ChangeBackgroundColor = function(spread, rect, color, target, layerOnTop) {
    var injector = angular.element('body').injector(),
        ColorService = injector.get('ColorService'),
        TextEditorService = injector.get('TextEditorService'),
        cmd;

    this.execute = function() {
        var elements, commands = [];

        elements = _.filter(spread.elements, function(el) {
            var bbox = new PACE.Element(el).getBoundingBox().inflate(-2,-2);
            return el.type==='BackgroundFrameElement' && ((el.target===target && bbox.intersects(rect)) || el.target===null);
        });

        // if (elements.length>4 || color===null) {
        //     commands.push(new PACE.DeleteElementsCommand(spread, elements.splice(elements.length - 1)));
        // }

        if (elements.length>0) {
            commands.push(new PACE.DeleteElementsCommand(spread, elements));
        }

        if (color!==null) {
            var el = {
                type: 'BackgroundFrameElement',
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                backgroundColor: color,
                opacity: 1,
                rotation: 0,
                target: target,
                locked: true
            };
            var idx = layerOnTop ? undefined : 0;
            commands.push( new PACE.AddElementsCommand(spread, [el], idx) );
        }

        if (target==='spine' || target==='spread') {
            var spineTextEl = _.findWhere(spread.elements, {type:'SpineTextElement'});
            if (spineTextEl) {
                if (color===null) color = '#FFFFFF';
                var rgb = ColorService.hexToRgb(color),
                    avg = (rgb.r + rgb.g + rgb.b) / 3;

                var fills = [];
                _.each(spineTextEl.styles, function(lineStyle) {
                    _.each(lineStyle, function(charStyle) {
                        var charFill = '#' + new fabric.Color(charStyle.fill || spineTextEl.fill).toHex();
                        if (fills.indexOf(charFill)) {
                            fills.push(charFill);
                        }
                    });
                });
                var fill = fills.length===1 ? fills[0] : null;

                if (fill && (fill==='#000000' || fill==='#FFFFFF')) {
                    if (avg===0 && (fill==='#000000'))
                        fill = '#FFFFFF';
                    else if (avg===255 && (fill==='#FFFFFF'))
                        fill = '#000000';
                    spineTextEl.fill = fill;
                    commands.push(new PACE.AddFabricStyleToAllCommand(spineTextEl, {fill:fill}));
                }
            }
        }

        cmd = new PACE.MacroCommand(commands);
        cmd.execute();
    };

    this.undo = function() {
        cmd.undo();
    };
};

PACE.ChangePageBackgroundColor = function(page, color) {
    var cmd;

    this.execute = function() {
        cmd = new PACE.ChangeBackgroundColor(page.spread, page.getBleedRect(), color, 'page', false);
        cmd.execute();
    };

    this.undo = function() {
        cmd.undo();
    };
};

PACE.ChangeSpreadBackgroundColor = function(spreadInfo, color) {
    var cmd;

    this.execute = function() {
        // if (spreadInfo.layout.layoutSize.gapBetweenPages>0) {
        //     var commands = _.map(spreadInfo.pages, function(page) {
        //         return new PACE.ChangePageBackgroundColor(page, color);
        //     });
        //     cmd = new PACE.MacroCommand(commands);
        // } else {
        //     cmd = new PACE.ChangeBackgroundColor(spreadInfo.spread, spreadInfo.getBleedRect(), color, 'spread');
        // }
        var pageBackground = _.findWhere(spreadInfo.spread.elements, {type:'BackgroundFrameElement', target:'page'});

        var commands = _.map(spreadInfo.pages, function(page) {
            return new PACE.ChangePageBackgroundColor(page, color);
        });
        if (spreadInfo.getHingeGap && spreadInfo.getHingeGap()>0) {
            var spineBackground = _.findWhere(spreadInfo.spread.elements, {type:'BackgroundFrameElement', target:'spine'});

            if (!spineBackground || (pageBackground && spineBackground && pageBackground.backgroundColor===spineBackground.backgroundColor)) {
                commands.push(new PACE.ChangeSpineBackgroundColor(spreadInfo, color));
            }
        }

        cmd = new PACE.MacroCommand(commands);
        cmd.execute();
    };

    this.undo = function() {
        cmd.undo();
    };
};

PACE.ChangeBookBackgroundColor = function(layout, color) {
    var cmd;

    this.execute = function() {
        var factory = new PACE.SpreadInfoFactory();
        var commands = _.map(layout.spreads, function(spread) {
            return new PACE.ChangeSpreadBackgroundColor(factory.create(spread, layout), color);
        });
        cmd = new PACE.MacroCommand(commands);
        cmd.execute();
    };

    this.undo = function() {
        cmd.undo();
    };
};

PACE.ChangeSpineBackgroundColor = function(spreadInfo, color) {
    var cmd;

    this.execute = function() {
        var rect1 = spreadInfo.pages[0].getPageRect(),
            rect2 = spreadInfo.pages[1].getPageRect(),
            hingeGap = spreadInfo.getHingeGap();

        var rect = new PACE.Rect({
            x: rect1.right + hingeGap,
            y: rect1.y - spreadInfo.layout.layoutSize.bleedTop,
            width: rect2.left - (rect1.right + hingeGap * 2),
            height: rect1.height + (spreadInfo.layout.layoutSize.bleedTop + spreadInfo.layout.layoutSize.bleedBottom)
        });

        cmd = new PACE.ChangeBackgroundColor(spreadInfo.spread, rect, color, 'spine', true);
        cmd.execute();
    };

    this.undo = function() {
        cmd.undo();
    };
};