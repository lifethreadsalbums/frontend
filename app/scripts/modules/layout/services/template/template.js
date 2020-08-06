'use strict';

angular.module('pace.layout')

	.value('templatesSettings', {
        // set of allowed spanning modes
        allSpanModes: ['margin', 'bleed', 'float', 'half-inch'],
    
        // full-bleed templates are in the DB, so they shouldn't
        // occur in the random stream of layouts
        singleSpanModes: ['margin', 'bleed', 'float', 'half-inch'/*, 'full-bleed'*/],
        fullSpreadSingleSpanModes: ['bleed', 'float'/*, 'full-bleed'*/],
        fullSpreadSpanModes: ['bleed', 'float'],
        twoPageSpanModes: ['margin', 'float', 'half-inch'],
        defSpanMode: 'margin',
    
        twoPageLayoutModes: ['spread-two-page', 'full-spread', 'full-spread', 'full-spread', 'full-spread'],
        singlePageLayoutModes: ['full-spread'],

        // set of allowed align modes
        allAlignModes: ['left', 'right', 'top', 'bottom', 'center'],
        defAlignMode: 'center',
    
        similarTemplateTrials: 5,
        checkTwoPageTrials: 5,
    
        similarPropTreshold: 0.3,
    
        // accuracy that left.desiredProportion === +/- x% of right.desiredProportion
        // and then merge them if so
        mergeTwoSideAccuracy: 0.05,
    
        // accuracy that we consider that left page proportion is similar to
        // right page proportion
        twoPageSimilarPropAccuracy: 0.2,
    
        // if the proportion of the full-spread template is around fullSpreadToBleedAccuracy
        // of spread proportion, then the template should span to full-bleed (disregarding
        // the proportions).
        fullSpreadToBleedAccuracy: 0.05,
    
        defAlignLimit: 1
    })

	/**
	 * Helper service for layouting a group of elements/layouting spread with random/given
     * layout template.
	 */
	.service('TemplateService',
    ['_', 'templatesSettings', 'LayoutTemplateService', 'TemplateToFramesService', 'FillFramesService', 'GeomService',
     function(_, templatesSettings, LayoutTemplateService, TemplateToFramesService, FillFramesService, GeomService) {

			var that = this,
                
                settings = templatesSettings,
                
                pickAny = function (arr) {
                    return _.isEmpty(arr) ? undefined : arr[_.random(arr.length - 1)];
                },
                
                nextTemplate = function (order, allProps, targetProp, layoutSize, mode, mergeMode, spanMode, alignMode) {
                    var t = LayoutTemplateService.nextTemplate(order, allProps, targetProp, mergeMode, layoutSize),
                        spansArr,
                        target;
                    
                    if (mode === 'full-spread') {
                        target = 'spread';
                        spansArr = order.length > 1 ?
                                    settings.fullSpreadSpanModes :
                                    settings.fullSpreadSingleSpanModes;
                    } else {
                        spansArr = order.length > 1 ?
                                    settings.allSpanModes :
                                    settings.singleSpanModes;
                        target = 'page';
                    }

                    return _.extend(t, {
                        target: target,
                        span: spanMode || pickAny(spansArr),
                        align: alignMode || order.length > settings.defAlignLimit ?
                                                settings.defAlignMode :
                                                pickAny(settings.allAlignModes)
                    });
                },
                
                getElementProps = function (el) {
                    var w, h;
                    
                    if (el.imageWidth && el.imageHeight) {
                        w = el.imageWidth;
                        h = el.imageHeight;
                    } else if ( el.imageFile && 
                                el.imageFile.width &&
                                el.imageFile.height) {
                        w = el.imageFile.width;
                        h = el.imageFile.height;
                    } else {
                        w = el.width;
                        h = el.height;
                    }
                    
                    return w / h;
                },
                
                areGridTemplatesSimilar = function (t1, t2) {
                    if (_.isEmpty(t1) || _.isEmpty(t2))
                        return false;
                    
                    if (t1.type !== 'GridLayoutTemplate' ||
                        t2.type !== 'GridLayoutTemplate')
                        throw new Error('Cannot handle template different than GridLayoutTemplate');

                    if (
                        (t1.numEffectiveCells !== t2.numEffectiveCells) ||
                        (t1.span !== t2.span) ||
                        (t1.align !== t2.align) ||
                        (Math.abs(t1.desiredProportion - t2.desiredProportion) > settings.similarPropTreshold)
                            ) {
                        return false;
                    }
                    
                    return true;
                },
                
                /**
                 * Checking the case that both left and right pages are
                 * of similar proportions within twoPageSimilarPropAccuracy interval.
                 *
                 * @param left - left side template
                 * @param right - right side template
                 * @returns - true if the proportions are not similar 
                 */
                checkTwoPageSimilarPropCase = function (left, right) {
                    if (!_.isEmpty(left) && !_.isEmpty(right)) {
                        if (left.desiredProportion >= (1 - settings.twoPageSimilarPropAccuracy) * right.desiredProportion &&
                            left.desiredProportion <= (1 + settings.twoPageSimilarPropAccuracy) * right.desiredProportion) {
                            return false;
                        }
                    }
                    
                    return true;
                },
                
                /**
                 * @returns true if val is contained in range:
                 * [targetVal * (1 - rate), targetVal * (1 + rate)]
                 */
                inRange = function (val, targetVal, rate) {
                    return val >= targetVal * (1 - rate) && val <= targetVal * (1 + rate);
                };
                
            this.areTemplatesSimilar = function (t1, t2) {
                    if (t1.type !== t2.type) {
                        return false;
                    }
                    
                    if (t1.type === 'TwoPageLayoutTemplate') {
                        return areGridTemplatesSimilar(t1.left, t2.left) ||
                                areGridTemplatesSimilar(t1.right, t2.right);
                    } else {
                        return areGridTemplatesSimilar(t1, t2);
                    }
                };
         
            this.getElementProp = function (el) {
                return getElementProps(el);
            };

            this.getNumCells = function(t) {
                if(t && t.type) {
                    switch(t.type) {
                        case 'TwoPageLayoutTemplate':
                            return that.getNumCells(t.left) + that.getNumCells(t.right);
                        case 'GridLayoutTemplate':
                            return t.numEffectiveCells;
                        case 'CustomLayoutTemplate':
                            return t.frames.frames.length;
                    }
                } else return 0;
            };

            this.isSinglePageTemplate = function(t) {
                return (t.type==='CustomLayoutTemplate' && t.target==='page') ||
                    (t.type==='GridLayoutTemplate' && t.target==='page');
            };

            this.hasSquareFrames = function(t) {
                if (t.type==='TwoPageLayoutTemplate') {
                    return (t.left && that.hasSquareFrames(t.left)) ||
                        (t.right && that.hasSquareFrames(t.right));
                } else if (t.type==='GridLayoutTemplate' || t.type==='CustomLayoutTemplate') {
                    var frames,
                        size = 100,
                        tolerance = 5.0;

                    if (t.type==='GridLayoutTemplate') {
                        frames = TemplateToFramesService.getFramesOfDim(t, size, size, 0, 0);
                    } else {
                        frames = _.map(t.frames.frames, function(frame) {
                            return {
                                width: frame.width * t.frames.rect.width,
                                height: frame.height * t.frames.rect.height
                            };
                        });
                    }

                    return _.any(frames, function(frame) {
                        return GeomService.equals(frame.width, frame.height, tolerance);
                    });
                }

                return false;
            };

            /**
             * Generates template for a given spread in modes 'left'/'right'/'spread'.
             */
            this.getTemplateForSpread = function (spread, layout, mode, allProps,
                                                   mergeMode, spanMode, alignMode) {
                // the default mode is 'spread'
                if (_.isUndefined(mode)) {
                    mode = 'spread';
                }
                
                var getProps = function (elements) { return _.map(elements, getElementProps); },
                    splitElements = function (arr) {
                        var rand = Math.round(Math.random() * (arr.length - 2)) + 1;
                        return [arr.slice(0, rand), arr.slice(rand, arr.length)];
                    },

                    pages = new PACE.SpreadInfoFactory().create(spread, layout).pages,
                    leftPageEl = pages.length === 2 || spread.pageNumber > 1 ?
                                    pages[0].getImageElements() : [],
                    rightPageEl = pages.length === 2 ?
                                    pages[1].getImageElements() : spread.pageNumber === 1 ?
                                    pages[0].getImageElements() : [],
                    allElements = leftPageEl.concat(rightPageEl),
                    layoutSize = layout.layoutSize,
                    pageProp = layoutSize.width / layoutSize.height,
                    spreadProp = layoutSize.pageOrientation === 'Horizontal' ?
                        2 * layoutSize.width / layoutSize.height :
                        layoutSize.width / (2 * layoutSize.height),
                    
                    properMode = function (mode) {
                        if (mode === 'spread') {
                            
                            if (pages.length === 1) {
                                return pickAny(settings.singlePageLayoutModes);
                            } else {
                                if (leftPageEl.length===0 && rightPageEl.length===1)
                                    return 'right';
                                else if (leftPageEl.length===1 && rightPageEl.length===0)
                                    return 'left';
                                else if (!layout.isLayFlat && layout.pageType === 'PageBased') {
                                    return 'spread-two-page';
                                } else {
                                    return pickAny(settings.twoPageLayoutModes);
                                }
                            }
                            
                        } else {
                            return mode;
                        }
                    },

                    getTemplate = function () {
                        var m = properMode(mode);

                        switch (m) {
                            case 'left':
                                if (_.isEmpty(leftPageEl))
                                    return null;
                                return {
                                    type: 'TwoPageLayoutTemplate',
                                    left: nextTemplate(getProps(leftPageEl), allProps, pageProp, layoutSize, mode,
                                                       mergeMode, spanMode, alignMode)
                                };
                            case 'right':
                                if (_.isEmpty(rightPageEl))
                                    return null;
                                return {
                                    type: 'TwoPageLayoutTemplate',
                                    right:nextTemplate(getProps(rightPageEl), allProps, pageProp, layoutSize, mode,
                                                       mergeMode, spanMode, alignMode)
                                };
                            case 'spread-two-page':
                                var split, left, right, trial = 0;
                                
                                do {
                                    split = splitElements(allElements);
                                    left = nextTemplate(getProps(split[0]), allProps, pageProp, layoutSize, mode,
                                                            mergeMode, spanMode, alignMode);
                                    right = nextTemplate(getProps(split[1]), allProps, pageProp, layoutSize, mode,
                                                             mergeMode, spanMode, alignMode);
                                    
                                    // in case when both left and right pages are of similar proportions
                                    if (inRange(left.desiredProportion, right.desiredProportion, settings.mergeTwoSideAccuracy)) {
                                        // and that proportion is greater than page orientation on horizontal spread
                                        // or smaller than page orientation on vertical spread
                                        // i.e. when left & right may span to bleed they mey touch each other
                                        if (left.desiredProportion >= pageProp && layoutSize.pageOrientation === 'Horizontal' ||
                                                left.desiredProportion <= pageProp && layoutSize.pageOrientation === 'Vertical') {
                                            return LayoutTemplateService.mergeTemplates(
                                                left, right, spreadProp, layoutSize.pageOrientation.toLowerCase());
                                        }
                                    }

                                    // in two page mode always aligning to center
                                    left.align = right.align = 'center';

                                    // in case of two-page templates spanning mode should be same for both sides
                                    right.span = left.span = pickAny(settings.twoPageSpanModes);
                                    
                                    trial++;
                                } while (!checkTwoPageSimilarPropCase(left, right) &&
                                            trial < settings.checkTwoPageTrials);
                                
                                return {
                                    type: 'TwoPageLayoutTemplate',
                                    left: left,
                                    right: right
                                };
                            case 'full-spread':
                            default:
                                if (_.isEmpty(leftPageEl) && _.isEmpty(rightPageEl))
                                    return null;
                                var t = nextTemplate(getProps(allElements), allProps, spreadProp, layoutSize, 'full-spread',
                                                    mergeMode, spanMode, alignMode);
                                
                                // if the proportion of the full-spread template is around fullSpreadToBleedAccuracy
                                // of spread proportion, then the template should span to full-bleed (disregarding
                                // the proportions).
                                if (inRange(t.desiredProportion, spreadProp, settings.fullSpreadToBleedAccuracy)) {
                                    t.span = 'full-bleed';
                                }
                                
                                return t;
                        }
                    };
                
                if (spread.template) {
                    var oldTemplate = spread.template,
                        template;
                    
                    for (var i = 0; i < settings.similarTemplateTrials; i++) {
                        template = getTemplate();
                        if (!that.areTemplatesSimilar(template, oldTemplate)) {
                            return template;
                        }
                    }
                }

                return getTemplate();
            };
         
            this.nextTemplateForElements = function (elements, allProps) {
                return nextTemplate(_.map(elements, getElementProps), allProps);
            };
         
            /**
             * Prepares the spread to removing selectedElements;
             */
            this.cleanUpSpreadTemplate = function (spread, selectedElements, layout) {
                if (spread && spread.template && !_.isEmpty(selectedElements)) {
                    if (spread.numPages === 2 && spread.template.type === 'TwoPageLayoutTemplate') {
                        var pages = new PACE.SpreadInfoFactory().create(spread, layout).pages,
                            els = _.map(pages, function (p) { return p.getImageElements(); }),

                            cleanUp = _.map(selectedElements, function (e) {
                                if (_.contains(els[0], e))
                                    return 'left';
                                if (_.contains(els[1], e))
                                    return 'right';
                            }),

                            cLeft = _.contains(cleanUp, 'left'),
                            cRight = _.contains(cleanUp, 'right');

                        if (cLeft && cRight) {
                            spread.template = null;
                        } else if (cLeft) {
                            spread.template.left = null;
                            delete spread.template.order;
                        } else if (cRight) {
                            spread.template.right = null;
                            delete spread.template.order;
                        }
                    } else {
                        spread.template = null;
                    }
                }
            };
         
         
        }
	]);
