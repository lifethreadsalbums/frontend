(function () {
    'use strict';

    angular.module('pace.layout')
        /**
         * Service for generating templates in an order.
         * At first the public templates are returned, then randomly generated.
         */
        .service('TemplateGeneratorService', [
            '_', 'TemplateService',
            function (_, TemplateService) {
                var publicTemplates = [],

                    getPagePublicTemplates = function (size, isVert) {
                        return _.filter(publicTemplates, function (t) {
                            if (t.target === 'page') {
                                if (size === 1) {
                                    return t.numEffectiveCells === 1 &&
                                        (isVert ? t.desiredProportion <= 1 :
                                                    t.desiredProportion >= 1);
                                }
                                else return t.numEffectiveCells === size;
                            }
                            return false;
                        });
                    },

                    getSpreadPublicTemplates = function (size, isVert, pages, pageType) {
                        return _.filter(publicTemplates, function (t) {
                            if (t.target === 'spread') {
                                if (size === 1) {
                                    return t.type === 'GridLayoutTemplate' &&
                                        t.numEffectiveCells === 1 &&
                                        (isVert ? t.desiredProportion <= 1 : t.desiredProportion >= 1);
                                } else if (pages.length === 1) {
                                    return t.type === 'GridLayoutTemplate' &&
                                            t.numEffectiveCells == size;
                                } else if (pageType === 'PageBased') {
                                    return t.type === 'TwoPageLayoutTemplate' &&
                                            t.left.numEffectiveCells +
                                                t.right.numEffectiveCells === size
                                } else return (t.type === 'GridLayoutTemplate' &&
                                        t.numEffectiveCells === size) ||
                                        (t.type === 'TwoPageLayoutTemplate' &&
                                        t.left.numEffectiveCells +
                                        t.right.numEffectiveCells === size);
                            }
                            return false;
                        });
                    },

                    getPublic = function (target, size, isVertical, pages, pageType) {
                        var templates;

                        switch (target) {
                        case 'spread':
                            templates = getSpreadPublicTemplates(size, isVertical, pages, pageType);
                            break;
                        case 'page':
                        default:
                            templates = getPagePublicTemplates(size, isVertical);
                            break;
                        }

                        return _.sortBy(templates, function (t) {
                           return -t.ord;
                        });
                    },

                    extendT = function (template, order, mode) {
                        var t = angular.copy(template);

                        if (t.type === 'TwoPageLayoutTemplate' &&
                            (mode === 'left' || mode === 'right')) {
                            t[mode].ord = order;
                            delete t[mode].id;
                        } else {
                            t.ord = order;
                            delete t.id;
                        }

                        return t;
                    },

                    getTarget = function (mode) {
                        if (mode === 'left' || mode === 'right')
                            return 'page';
                        return 'spread';
                    },

                    /**
                     * @param target - 'page' or 'spread'
                     * @param elements - elements from the spread
                     * @param order - place in order of current template
                     */
                    nextPublicTemplate = function (target, elements, order, pages, pageType) {
                        if (elements.length <= 0) {
                            throw new Error('Illegal argument.');
                        }
                        if (_.isUndefined(order)) {
                            order = 0;
                        }

                        target = getTarget(target);

                        var pub = getPublic(
                            target,
                            elements.length,
                            TemplateService.getElementProp(elements[0]) <= 1,
                            pages, pageType);

                        if (pub && pub.length > order) {
                            return extendT(pub[order], order);
                        }
                    },

                    getOrder = function (spread, mode) {
                        if (!spread.template)
                            return -1;

                        switch (mode) {
                        case 'left':
                        case 'right':
                            if (spread.template.type === 'TwoPageLayoutTemplate' && spread.template[mode])
                                return _.isNumber(spread.template[mode].ord) ? spread.template[mode].ord : -1;
                        case 'spread':
                        case 'spread-two-page':
                        default:
                            return _.isNumber(spread.template.ord) ? spread.template.ord : -1;
                        }
                    },

                    nextPredefinedTemplate = function (spread, layout, mode, order, next) {
                        var t;

                        if (mode.indexOf('spread') >= 0) {
                            mode = 'full-spread';
                        }

                        switch (next) {
                            case 0:
                                t = TemplateService.getTemplateForSpread(
                                    spread, layout, mode, undefined, 'single-line', 'bleed', 'center');
                                break;
                            case 1:
                                t = TemplateService.getTemplateForSpread(
                                    spread, layout, mode, undefined, 'single-line', 'margin', 'center');
                                break;
                            case 2:
                                t = TemplateService.getTemplateForSpread(
                                    spread, layout, mode, undefined, 'single-line', 'float', 'center');
                                break;
                        }


                        if (t) {
                            return extendT(t, order, mode);
                        }
                    };

                this.setPublicTemplates = function (templates) {
                    publicTemplates = templates;
                };

                this.getPublicTemplates = function () {
                    return publicTemplates;
                };

                /**
                 * @param spread
                 * @param layout
                 * @param mode
                 */
                this.nextTemplate = function (spread, layout, mode) {
                    if (mode === 'spread' || mode === 'left' || mode === 'right') {
                        var pages = new PACE.SpreadInfoFactory().create(spread, layout).pages,
                            els = _.map(pages, function (p) { return p.getImageElements(); }),
                            all = _.reduce(els, function (acc, e) { return acc.concat(e); }, []),
                            elements = mode.indexOf('spread') >= 0 ? all : mode === 'left' ? els[0] : els[els.length > 1 ? 1 : 0],
                            
                            publicTemplates = getPublic(getTarget(mode), elements.length,
                                 TemplateService.getElementProp(elements[0]) <= 1, pages, layout.pageType),

                            order = getOrder(spread, mode) + 1,

                            next = order - publicTemplates.length,
                            nextPublic = nextPublicTemplate(mode, elements, order, pages, layout.pageType),
                            nextPredefined = layout.pageType !== 'PageBased' ?
                                nextPredefinedTemplate(spread, layout, mode, order, next) : null;
                            

                        return nextPublic || nextPredefined ||
                            extendT(TemplateService.getTemplateForSpread(spread, layout, mode), order, mode);
                    } else {
                        return extendT(TemplateService.getTemplateForSpread(
                                    spread, layout, mode), getOrder(spread, mode) + 1, mode)
                    }
                };

                this.nextRandomTemplate = function (spread, layout, mode) {
                    return TemplateService.getTemplateForSpread(spread, layout, mode);
                };
            }
        ]);
})();
