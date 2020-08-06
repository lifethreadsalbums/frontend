PACE.AutoArrangeCommand = function(mode, layout, layoutController) {
    'use strict';


    var injector = angular.element('body').injector(),
        TemplateGeneratorService = injector.get('TemplateGeneratorService'),
        TemplateService = injector.get('TemplateService'),
        IconSet = injector.get('IconSet'),
        stateCmd = new PACE.SaveLayoutStateCommand(layout);

    var modes = {
        'clear' : { },
        'two-sided-bleed': { pageMode:'both', cmdClass:PACE.TwoSidedBleedCommand },
        'two-sided-bleed-left': { pageMode:'left', cmdClass:PACE.TwoSidedBleedCommand },
        'two-sided-bleed-right': { pageMode:'right', cmdClass:PACE.TwoSidedBleedCommand },
        'four-sided-bleed': { pageMode:'both', cmdClass:PACE.FourSidedBleedCommand },
        'four-sided-bleed-left': { pageMode:'left', cmdClass:PACE.FourSidedBleedCommand },
        'four-sided-bleed-right': { pageMode:'right', cmdClass:PACE.FourSidedBleedCommand },
        'floating-image': { pageMode:'both', cmdClass:PACE.FloatingImageCommand },
        'floating-image-left': { pageMode:'left', cmdClass:PACE.FloatingImageCommand },
        'floating-image-right': { pageMode:'right', cmdClass:PACE.FloatingImageCommand },
        'double-spread': { pageMode:'spread', cmdClass:PACE.SpreadFourSidedBleedCommand }
    };

    function isLeft(pageNumber) {
        if (layout.lps)
            return pageNumber%2!=0;
        else
            return pageNumber%2==0;
    }

    function setTemplateSpanningMode (mode, pageMode, t) {
        var spanningMode = 'margin';
        if (mode.indexOf('bleed') >= 0) spanningMode = 'bleed';
        else if (mode.indexOf('float')) spanningMode = 'float';

        if (t.type === 'TwoPageLayoutTemplate') {
            switch (pageMode) {
                case 'left': t.left.span = spanningMode; break;
                case 'right': t.right.span = spanningMode; break;
                case 'both':
                    t.left && (t.left.span = spanningMode);
                    t.right && (t.right.span = spanningMode);
                    break;
                case 'spread':
                    t.left.span = 'bleed';
                    t.right.span = 'bleed';
                    break;
            }
        } else {
            if (pageMode === 'spread') t.span = 'bleed';
            else t.span = spanningMode;
        }
    }

    function checkLayout() {
        _.each(layout.spreads, function(spread) {
            new PACE.PreflightSpreadCommand(spread).execute();
            new PACE.CheckFramesOnSpread(layoutController, spread, layout).execute();
        });
    }

    this.execute = function() {
        var pages = [],
            spreadFactory = new PACE.SpreadInfoFactory(),
            pageNumber = 1,
            pageMode = modes[mode].pageMode,
            cmdClass = modes[mode].cmdClass;

        stateCmd.execute();

        var modeIndex = _.findIndex(IconSet['auto-arrange'], function(item) { return item.value===mode; });
        layout.autoFillVariant = modeIndex;

        if (mode === 'clear') {
            _.each(layout.spreads, function (s) {
                s.template = null;
                s.applyAutoFill = true;
                s.hasErrorsLeft = false;
                s.hasErrorsRight = false;
                s.elements = [];
            });

            layoutController.fireEvent('layout:layout-changed');
            return;
        }

        _.each(layout.spreads, function(spread) {
            //if (spread.applyAutoFill) {
                //spread.elements = [];

                var textElements = _.where(spread.elements, {type:'TextElement'});
                spread.elements = textElements;

                var spreadPages = spreadFactory.create(spread, layout).pages;
                _.each(spreadPages, function(page) {

                    if (page.getElementsOfType('TextElement').length>0) return;

                    if (pageMode==='both' ||
                        ((pageMode==='left' || pageMode === 'spread') && isLeft(pageNumber)) ||
                        (pageMode==='right' && !isLeft(pageNumber)) || (!layout.lps && pageNumber===1)) {

                        page.pages = spreadPages;
                        page.spread = spread;
                        pages.push(page);
                    }
                    pageNumber++;
                });
            //}
        });

        var imageGroups = _.reduce(layout.filmStrip.items, function(acc, item) {
                if (item.type === 'FilmStripImageItem' && 
                    !item.inCoverZone &&
                    item.image.status!=='Rejected' &&
                    item.image.status!=='Cancelled') {
                    
                    if(item.stackId != null && acc.lastStackId === item.stackId) {
                        _.last(acc.imageGroups).push(item);
                    } else {
                        acc.lastStackId = item.stackId;
                        acc.imageGroups.push([item]);
                    }
                }

                return acc;
            }, { imageGroups: [], lastStackId: undefined }).imageGroups,

            getSpreadElement = function(filmStripItem) {
                return {
                    type: 'ImageElement',
                    imageFile: filmStripItem.image,
                    rotation: 0,
                    opacity: 1
                };
            };

        var pageIdx = 0, 
            imageIdx = 0;
        while(pageIdx<pages.length && imageIdx<imageGroups.length) {
            var page = pages[pageIdx],
                imageGroup = imageGroups[imageIdx];

            page.spread.template = null;

            if(imageGroup.length > 1) {
                var elements = _.map(imageGroup, getSpreadElement);

                _.each(elements, function(e) {
                    page.spread.elements.push(e);
                    new PACE.TwoSidedBleedCommand(e, page).execute();
                });

                var templateMode = isLeft(page.getPageNumber()) ? 'left':'right';
                var template = TemplateGeneratorService.nextRandomTemplate(
                    page.spread, layout, pageMode === 'spread' ? 'spread' : templateMode);

                setTemplateSpanningMode(mode, pageMode, template);

                new PACE.AutoLayoutSpreadCommand(
                    page.spread,
                    layout,
                    layoutController,
                    undefined,
                    pageMode === 'spread' ? 'spread' : templateMode,
                    template
                ).execute();

            } else {
                var item = _.first(imageGroup);
                var element = getSpreadElement(item);

                if(cmdClass) {

                    var left = isLeft(page.getPageNumber());

                    if (left && item.isDoubleSpread) {
                        (new PACE.SpreadFourSidedBleedCommand(element, page, page.pages)).execute();
                        pageIdx++;
                    } else {
                        (new cmdClass(element, page, page.pages)).execute();
                    }
                    page.spread.elements.push(element);
                }
            }

            pageIdx++;
            imageIdx++;
        }

        checkLayout();
        layoutController.fireEvent('layout:layout-changed');
    };

    this.undo = function() {
        stateCmd.undo();
        checkLayout();
    };
};
