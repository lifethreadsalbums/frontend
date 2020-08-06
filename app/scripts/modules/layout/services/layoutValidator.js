'use strict';

angular.module('pace.layout')
.service('LayoutValidator', ['GeomService', function(GeomService) {

    var that = this,
        rules = [
            {
                type: 'ForbiddenZone',
                check: function(element, spread, layout) {

                    var roundRect = function(rect, d) {
                        d = d || 0;
                        var round = PACE.GeomService.roundNumber;
                        return {
                            left: round(rect.left, 4) - d,
                            top: round(rect.top, 4) - d,
                            right: round(rect.right, 4) + d,
                            bottom: round(rect.bottom, 4) + d
                        };
                    };

                    var bbox = roundRect(new PACE.Element(element).getBoundingBox()),
                        spreadInfoFactory = new PACE.SpreadInfoFactory,
                        spreadInfo = spreadInfoFactory.create(spread, layout),
                        page = spreadInfo.getPage(element),
                        isLeft = page.isLeft(),
                        marginRect = roundRect(page.getMarginRect(), 2),
                        bleedRect = roundRect(page.getBleedRect(), -2);

                    if (element.type==='TextElement' && 
                        (   
                            (!isLeft && bbox.right>marginRect.right) || 
                            (isLeft && bbox.left<marginRect.left) ||
                            (bbox.bottom>marginRect.bottom) || 
                            (bbox.top<marginRect.top)
                        )) {
                        return false;
                    }

                    if ((bbox.right>marginRect.right && bbox.right<bleedRect.right) ||
                        (bbox.left<marginRect.left && bbox.left>bleedRect.left) ||
                        (bbox.bottom>marginRect.bottom && bbox.bottom<bleedRect.bottom) ||
                        (bbox.top<marginRect.top && bbox.top>bleedRect.top)) {

                        // var d = function(rect) {
                        //     return _.pick(rect, 'left', 'top', 'right', 'bottom');
                        // };
                        // console.log(element, d(bbox), d(marginRect), d(bleedRect))
                        
                        return false;
                    }

                    return true;
                },
            },

            {
                type: 'TopBottomBleed',
                check: function(element, spread, layout) {
                    if (!element) return true;
                    if (!(layout.isLayFlat || layout.pageType==='SpreadBased') || spread.numPages===1) return true;

                    var bbox = new PACE.Element({type:'ElementGroup', elements:spread.elements}).getBoundingBox(),
                        spreadInfo = new PACE.SpreadInfoFactory().create(spread, layout),
                        bleed = spreadInfo.getBleedRect(),
                        topMargin = bbox.top - bleed.top,
                        bottomMargin = bleed.bottom - bbox.bottom,
                        leftMargin = bbox.left - bleed.left,
                        rightMargin = bleed.right - bbox.right,
                        diff = leftMargin - topMargin;

                    //console.log('leftMargin', leftMargin, rightMargin)
                    if (GeomService.equals(topMargin,bottomMargin) && 
                        GeomService.equals(leftMargin,rightMargin) && 
                        leftMargin>0 &&
                        diff > 50) {
                        return false;
                    }
                    
                    return true;
                }
            }
        ];

    this.getBrokenRulesForSpread = function(spread, layout) {
        var result = [];

        _.each(rules, function(rule) {
            var elements = [];
            _.each(spread.elements, function(el) {
                if (!rule.check(el, spread, layout))
                    elements.push(el);
            });
            if (elements.length>0) result.push({type:rule.type, elements:elements});
        });

        return result;
    };

    this.validateElement = function(element, spread, layout) {
        return _.every(rules, function(rule) {
            return rule.check(element, spread, layout);
        });
    };

    this.validateSpread = function(spread, layout) {
        return _.every(spread.elements, function(el) {
            return that.validateElement(el, spread, layout);
        });
    };

    this.validateLayout = function(layout) {
        return _.every(layout.spreads, function(spread) {
            return that.validateSpread(spread, layout);
        });
    };
    
}]);