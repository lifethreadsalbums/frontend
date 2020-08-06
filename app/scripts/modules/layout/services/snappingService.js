'use strict';

angular.module('pace.layout')
.service('SnappingService', [function () {

    var SNAP_MIN = -10000,
        SNAP_MAX = 10000,
        SNAP_DIST = 10,
        guides = [],
        snappedGuides = [],
        spreadElements = [],
        selectedSpreadModel,
        layoutCtrl;

    this.enableSmartSpacing = true;
    this.enableSmartDimensions = true;
    this.enableSmartPageGuides = true;
    this.enableFixedGuides = true;
    this.enableSmartEdgeGuides = true;

    this.getSnappedGuides = function() {
        return snappedGuides;
    };

    this.clearSnappedGuides = function() {
        snappedGuides = [];
    };

    this.beginSnapping = function(layoutController) {
        layoutCtrl = layoutController;
        selectedSpreadModel = layoutController.currentRenderer.spread;
        var layout = layoutController.currentRenderer.layout;
        var r, i, n;
        guides = [];
        //collect smart guides

        spreadElements = [];

        this.enableFixedGuides = (layout.viewState && layout.viewState.guidesVisible) ? layout.viewState.guidesVisible : false;

        for (i = 0, n = selectedSpreadModel.elements.length; i < n; i++) {

            var element = selectedSpreadModel.elements[i];
            if (layoutController.selectedElements.indexOf(element)>=0)
                continue;

            spreadElements.push(element);

            r = new PACE.Element(element).getBoundingBox();

            if (this.enableSmartEdgeGuides) {
                guides.push( new PACE.SmartEdgeGuide(element, SNAP_MIN, r.y, SNAP_MAX, r.y) );
                guides.push( new PACE.SmartEdgeGuide(element, r.x, SNAP_MIN, r.x, SNAP_MAX) );
                guides.push( new PACE.SmartEdgeGuide(element, r.x + r.width, SNAP_MIN, r.x + r.width, SNAP_MAX) );
                guides.push( new PACE.SmartEdgeGuide(element, SNAP_MIN, r.y + r.height, SNAP_MAX, r.y + r.height) );

                //object center guides
                guides.push( new PACE.SmartEdgeGuide(element, SNAP_MIN, r.y + r.height/2, SNAP_MAX, r.y + r.height/2) );
                guides.push( new PACE.SmartEdgeGuide(element, r.x + r.width/2 , SNAP_MIN, r.x + r.width/2, SNAP_MAX) );
            }

        }

        if (this.enableSmartPageGuides) {
            var pages = layoutController.currentRenderer.spreadInfo.pages;
            for (i = 0; i < pages.length; i++) {
                var page = pages[i];
                guides = guides.concat(page.getGuides());

                r = page.getBleedRect();

                var centeringRect = page.getCenteringRect();
                guides.push( new PACE.SmartPageGuide(page, centeringRect.x + centeringRect.width/2, r.y,
                    centeringRect.x + centeringRect.width/2, r.y + r.height) );
                guides.push( new PACE.SmartPageGuide(page, r.x, centeringRect.y + centeringRect.height/2,
                    r.x + r.width, centeringRect.y + centeringRect.height/2) );
            }
        }

        if (this.enableFixedGuides &&
            layoutController.currentRenderer.spread &&
            layoutController.currentRenderer.spread.guideLines) {
            guides = guides.concat(layoutController.currentRenderer.spread.guideLines);
        }

        if (layout.viewState && layout.viewState.gridVisible) {
            var spreadInfo = layoutController.currentRenderer.spreadInfo,
                rect = spreadInfo.getPageRect(),
                bleed = spreadInfo.getBleedRect(),
                gridLineSpacing = layout.viewState.gridLineSpacing;

            // horizontal
            var n = Math.max(rect.height, rect.width);
            for (var i = 0; i < n; i = i + gridLineSpacing) {
                //horizontal
                if (i<rect.height) {
                    var y = Math.round(rect.top + i);
                    guides.push(new PACE.Guide(bleed.left, y, bleed.right, y));
                }
                if (i<rect.width/2) {
                    //vertical left page
                    var x = Math.round(rect.left + i);
                    guides.push(new PACE.Guide(x, bleed.top, x, bleed.bottom));
                   
                    //vertical right page
                    x = Math.round(rect.right - i);
                    guides.push(new PACE.Guide(x, bleed.top, x, bleed.bottom));
                }
            }

        }

        //page center guides
        // for each(var page:AbstractPage in designer.selectedPageSpread.pages)
        // {
        //     var config:ProductConfiguration = page.bookDetails.getProductConfiguration();


        //     if (config.pageType==PageType.SPREAD && !page.isCoverPage)
        //         r = page.getBleedRect();
        //     else
        //         r = page.getPageRect();

        //     var centeringRect:Rectangle = page.getCenteringRect();
        //     if (page is FullImageCover)
        //     {
        //         var gap:Number = FullImageCover(page).getSpineWidth();

        //         if (page.bookTemplate.pageOrientation==PageOrientation.HORIZONTAL)
        //         {
        //             if (page.isEven)
        //                 r.right -= gap;
        //             else
        //                 r.left += gap;
        //         } else {
        //             if (page.isEven)
        //                 r.bottom -= gap;
        //             else
        //                 r.top += gap;
        //         }
        //     }

        //     guides.push( new SmartPageGuide(page, centeringRect.x + centeringRect.width/2, r.y,
        //         centeringRect.x + centeringRect.width/2, r.y + r.height) );
        //     guides.push( new SmartPageGuide(page, r.x, centeringRect.y + centeringRect.height/2,
        //         r.x + r.width, centeringRect.y + centeringRect.height/2) );

        //     //page spread center guide for spread based products
        //     if (config.pageType==PageType.SPREAD && !page.isCoverPage &&
        //         designer.selectedPageSpread.pages.length==2 && page.isEven)
        //     {
        //         guides.push( new SmartPageGuide(page, r.x + r.width, r.y,
        //             r.x + r.width, r.y + r.height) );
        //     }

        // }

    };

    this.endSnapping = function() {
        guides = [];
        snappedGuides = [];
    };

	this.snapObject = function(rect) {

        snappedGuides = [];
        var snapped = false;
        var m = new PACE.Matrix2D();
        m.rotate(rect.rotation * Math.PI/180);
        m.translate(rect.x, rect.y);
        var p1 = m.transformPoint(0, 0);
        var p2 = m.transformPoint(rect.width, 0);
        var p3 = m.transformPoint(rect.width, rect.height);
        var p4 = m.transformPoint(0, rect.height);

        var pc1 = m.transformPoint(rect.width/2, 0);
        var pc2 = m.transformPoint(rect.width/2, rect.height);
        var pc3 = m.transformPoint(0, rect.height/2);
        var pc4 = m.transformPoint(rect.width, rect.height/2);

        var edges = [{p1:p1, p2:p2, e:"top"},
                    {p1:p2, p2:p3, e:"right"},
                    {p1:p4, p2:p3, e:"bottom"},
                    {p1:p1, p2:p4, e:"left"},
                    {p1:pc1, p2:pc2, e:"vcenter"},
                    {p1:pc3, p2:pc4, e:"hcenter"}];

        var minDistX = Number.MAX_VALUE;
        var minDistY = Number.MAX_VALUE;
        var minYGuide;
        var minXGuide;

        var allGuides = guides.concat();

        if (this.enableSmartSpacing)
            this.doSmartSpacing(rect, allGuides);

        var n = allGuides.length;
        var minDistPerGuide = new Array(n);
        var guide, d, minDist;
        for(var j=0;j<n;j++)
        {
            guide = allGuides[j];
            //if (guide==excludeGuide)
            //    continue;

            minDist = Number.MAX_VALUE;
            for(var i=0;i<6;i++)
            {
                var edgeInfo = edges[i];
                var pp1 = edgeInfo.p1;
                var pp2 = edgeInfo.p2;
                var edge = edgeInfo.e;

                //if (!guide.isValid(edge))
                //    continue;

                //horizontal guides
                if (guide.y1===guide.y2)
                {
                    d = pp1.y - guide.y1;
                    if (pp1.x<=guide.x2 && pp2.x>=guide.x1 && Math.abs(d)<Math.abs(minDistY))
                    {
                        minDistY = d;
                        minYGuide = guide;
                    }

                    if (pp1.x<=guide.x2 && pp2.x>=guide.x1 && Math.abs(d)<minDist)
                        minDist = Math.abs(d);

                } else if (guide.x1===guide.x2) //vertical guides
                {
                    d = pp1.x - guide.x1;
                    if (pp1.y<=guide.y2 && pp2.y>=guide.y1 && Math.abs(d)<Math.abs(minDistX))
                    {
                        minDistX = d;
                        minXGuide = guide;
                    }

                    if (pp1.y<=guide.y2 && pp2.y>=guide.y1 && Math.abs(d)<minDist)
                        minDist = Math.abs(d);
                }
            }
            minDistPerGuide[j] = minDist;
        }

        if (Math.abs(minDistX)<SNAP_DIST)
        {
            rect.x -= minDistX;
            snapped = true;
        }

        if (Math.abs(minDistY)<SNAP_DIST)
        {
            rect.y -= minDistY;
            snapped = true;
        }

        for(j=0;j<n;j++)
        {
            guide = allGuides[j];
            minDist = minDistPerGuide[j];
            var dx = Math.abs( minDist - Math.abs(minDistX) );
            var dy = Math.abs( minDist - Math.abs(minDistY) );

            if (minDist<SNAP_DIST && (dx < 0.0001 || dy < 0.0001))
                snappedGuides.push(guide);
        }

        return snapped;
    };

    this.snapPoint = function (rect, p, edge) {

        snappedGuides = [];
        var snapped = false;
        var minDistX = Number.MAX_VALUE;
        var minDistY = Number.MAX_VALUE;
        var minYGuide;
        var minXGuide;

        var allGuides = guides.concat();

        if (this.enableSmartDimensions && rect)
            this.doSmartDimensions(rect, edge, allGuides);

        if (this.enableSmartSpacing && rect)
            this.doSmartSpacing(rect, allGuides);

        var n = allGuides.length;
        var minDistPerGuide = new Array(n);
        var guide, minDist, d;
        for(var j=0;j<n;j++)
        {
            guide = allGuides[j];
            minDist = Number.MAX_VALUE;
            if (guide.y1===guide.y2) //horizontal
            {
                d = p.y - guide.y1;
                if (p.x>=guide.x1 && p.x<=guide.x2 && Math.abs(d)<Math.abs(minDistY))
                {
                    minDistY = d;
                    minYGuide = guide;
                }
                if (p.x>=guide.x1 && p.x<=guide.x2 && Math.abs(d)<minDist)
                    minDist = Math.abs(d);
            } else if (guide.x1===guide.x2) //vertical
            {
                d = p.x - guide.x1;
                if (p.y>=guide.y1 && p.y<=guide.y2 && Math.abs(d)<Math.abs(minDistX))
                {
                    minDistX = d;
                    minXGuide = guide;
                }
                if (p.y>=guide.y1 && p.y<=guide.y2 && Math.abs(d)<minDist)
                    minDist = Math.abs(d);
            }
            minDistPerGuide[j] = minDist;
        }

        if (Math.abs(minDistX)<SNAP_DIST)
        {
            p.x -= minDistX;
            snapped = true;
        }

        if (Math.abs(minDistY)<SNAP_DIST)
        {
            p.y -= minDistY;
            snapped = true;
        }
        for(j=0;j<n;j++)
        {
            guide = allGuides[j];
            minDist = minDistPerGuide[j];
            var dx = Math.abs( minDist - Math.abs(minDistX) );
            var dy = Math.abs( minDist - Math.abs(minDistY) );

            if (minDist<SNAP_DIST && (dx < 0.0001 || dy < 0.0001))
                snappedGuides.push(guide);
        }
        return snapped;
    };


    this.doSmartSpacing = function(rect, guides) {
        if (rect.rotation!==0)
            return;

        var hrects = [],
            hdist = [],
            vrects = [],
            vdist = [],
            i, j, k, n,
            el, r, el2, r2, x1, y1, x2, y2, dist, found, di;
        //TODO: optimize it - element.getBoundingBox() results should be cached

        for (i = 0, n = spreadElements.length; i < n; i++) {
            el = spreadElements[i];
            if (el.rotation!==0)
                continue;

            var bounds = new PACE.Element(el).getBoundingBox();
            r = new PACE.Element(el).getBoundingBox();
            r.x = rect.x;
            if (r.intersects(rect))
            {
                for (j = 0; j < hrects.length; j++) {
                    el2 = hrects[j];

                    r2 = new PACE.Element(el2).getBoundingBox();
                    if (!r2.intersects(bounds))
                    {
                        if (bounds.x > r2.x + r2.width)
                        {
                            x1 = r2.x + r2.width;
                            y1 = r2.y + r2.height;
                            x2 = bounds.x;
                            y2 = bounds.y + bounds.height;
                        } else {
                            x1 = bounds.x + bounds.width;
                            y1 = bounds.y + bounds.height;
                            x2 = r2.x;
                            y2 = r2.y + r2.height;
                        }
                        dist = x2 - x1;
                        if (dist>0)
                        {
                            found = null;
                            for (k = 0; k < hdist.length; k++) {
                                di = hdist[k];
                                if (di.distance===dist && di.x1===x1)
                                {
                                    found = di;
                                    break;
                                }
                            }
                            if (found)
                            {
                                if (y1>found.y1 || y2>found.y2)
                                {
                                    found.y1 = y1;
                                    found.y2 = y2;
                                }
                            } else
                                hdist.push( {distance:dist, x1:x1, y1:y1, x2:x2, y2:y2} );
                        }
                    }
                }
                hrects.push(el);
            } else {
                r = new PACE.Element(el).getBoundingBox();
                r.y = rect.y;
                if (r.intersects(rect))
                {
                    for (j = 0; j < vrects.length; j++) {
                        el2 = vrects[j];
                        r2 = new PACE.Element(el2).getBoundingBox();

                        if (!r2.intersects(bounds))
                        {
                            if (bounds.y > r2.y + r2.height)
                            {
                                x1 = r2.x + r2.width;
                                y1 = r2.y + r2.height;
                                x2 = bounds.x + bounds.width;
                                y2 = bounds.y;
                            } else {
                                x1 = bounds.x + bounds.width;
                                y1 = bounds.y + bounds.height;
                                x2 = r2.x + r2.width;
                                y2 = r2.y;
                            }
                            dist = y2 - y1;

                            if (dist>0)
                            {
                                found = null;
                                for (k = 0; k < vdist.length; k++) {
                                    di = vdist[k];
                                    if (di.distance===dist && di.y1===y1)
                                    {
                                        found = di;
                                        break;
                                    }
                                }
                                if (found)
                                {
                                    if (x1>found.x1 || x2>found.x2)
                                    {
                                        found.x1 = x1;
                                        found.x2 = x2;
                                    }
                                } else
                                    vdist.push( {distance:dist, x1:x1, y1:y1, x2:x2, y2:y2} );
                            }
                        }
                    }
                    vrects.push(el);
                }
            }
        }

        var distInfo, d, intersects;

        for (i = 0; i < hdist.length; i++) {
            distInfo = hdist[i];
            d = distInfo.distance;
            for (j = 0; j < hrects.length; j++) {
                el = hrects[j];
                r = new PACE.Element(el).getBoundingBox();
                x1 = r.x;
                x2 = r.x + r.width;
                intersects = (x1 >= distInfo.x1 && x1 <= distInfo.x2) ||
                    (x1 - d >= distInfo.x1 && x1 - d <= distInfo.x2);

                if ((r.x - d) + SNAP_DIST > rect.x + rect.width && !intersects)
                    guides.push( new PACE.SmartSpacingGuide(r, distInfo, "right", x1 - d, SNAP_MIN, x1 - d, SNAP_MAX) );

                intersects = (x2 >= distInfo.x1 && x2 <= distInfo.x2) ||
                    (x2 + d >= distInfo.x1 && x2 + d <= distInfo.x2);

                if ((x2 + d) - SNAP_DIST < rect.x && !intersects)
                    guides.push( new PACE.SmartSpacingGuide(r, distInfo, "left", x2 + d, SNAP_MIN, x2 + d, SNAP_MAX) );
            }
        }

        for (i = 0; i < vdist.length; i++) {
            distInfo = vdist[i];
            d = distInfo.distance;
            for (j = 0; j < vrects.length; j++) {
                el = vrects[j];
                r = new PACE.Element(el).getBoundingBox();

                y1 = r.y;
                y2 = r.y + r.height;
                intersects = (y1 >= distInfo.y1 && y1 <= distInfo.y2) ||
                    (y1 - d >= distInfo.y1 && y1 - d <= distInfo.y2) ;

                if ((y1 - d) + SNAP_DIST > rect.y + rect.height && !intersects)
                    guides.push( new PACE.SmartSpacingGuide(r, distInfo, "bottom", SNAP_MIN, y1 - d, SNAP_MAX, y1 - d) );

                intersects = (y2 >= distInfo.y1 && y2 <= distInfo.y2) ||
                    (y2 + d >= distInfo.y1 && y2 + d <= distInfo.y2);

                if ((y2 + d) - SNAP_DIST < rect.y && !intersects)
                    guides.push( new PACE.SmartSpacingGuide(r, distInfo, "top", SNAP_MIN, y2 + d, SNAP_MAX, y2 + d) );
            }
        }

        var closestLeft,
            closestRight,
            closestTop,
            closestBottom;
        for (i = 0; i < hrects.length; i++) {
            el = hrects[i];
            r = new PACE.Element(el).getBoundingBox();

            var dleft = rect.x - (r.x + r.width);
            var dright = r.x - (rect.x + rect.width);
            if (dleft>0)
            {
                if (!closestLeft || dleft < rect.x - (closestLeft.x + closestLeft.width) ||
                    (r.x===closestLeft.x && r.y + r.height>closestLeft.y + closestLeft.height))
                    closestLeft = r;
            } else if (dright>0) {
                if (!closestRight || dright < closestRight.x - (rect.x + rect.width) ||
                    (r.x===closestRight.x && r.y + r.height>closestRight.y + closestRight.height))
                    closestRight = r;
            }
        }

        for (i = 0; i < vrects.length; i++) {
            el = vrects[i];
            r = new PACE.Element(el).getBoundingBox();

            var dtop = rect.y - (r.y + r.height);
            var dbottom = r.y - (rect.y + rect.height);

            if (dtop>0)
            {
                if (!closestTop || dtop < rect.y - (closestTop.y + closestTop.height) ||
                    (r.y===closestTop.y && r.x + r.width>closestTop.x + closestTop.width))
                    closestTop = r;
            } else if (dbottom>0) {
                if (!closestBottom || dbottom < closestBottom.y - (rect.y + rect.height) ||
                    (r.y===closestBottom.y && r.x + r.width>closestBottom.x + closestBottom.width))
                    closestBottom = r;
            }
        }

        if (closestLeft && closestRight) {
            d = (closestRight.x - (closestLeft.x + closestLeft.width) ) / 2 - rect.width/2;
            distInfo = {distance:d,
                x1:closestLeft.x + closestLeft.width, y1:closestLeft.y + closestLeft.height,
                x2:closestLeft.x + closestLeft.width + d, y2:closestLeft.y + closestLeft.height};

            guides.push( new PACE.SmartSpacingGuide(closestRight, distInfo, "right", closestRight.x - d,
                SNAP_MIN, closestRight.x - d, SNAP_MAX, true) );
        }

        if (closestTop && closestBottom) {
            d = (closestBottom.y - (closestTop.y + closestTop.height)) / 2 - rect.height/2;
            distInfo = {distance:d,
                x1:closestTop.x + closestTop.width, y1:closestTop.y + closestTop.height,
                x2:closestTop.x + closestTop.width, y2:closestTop.y + closestTop.height + d};

            guides.push( new PACE.SmartSpacingGuide(closestBottom, distInfo, "bottom", SNAP_MIN,
                closestBottom.y - d, SNAP_MAX, closestBottom.y - d, true) );
        }

        if (layoutCtrl.frameSpacing>0) {
            d = layoutCtrl.frameSpacing * PACE.AppConstants.PPI;
            if (closestBottom) {
                distInfo = {distance:d, x1:closestBottom.right, y1:closestBottom.top - d,
                    x2:closestBottom.right, y2:closestBottom.top};
                guides.push( new PACE.SmartSpacingGuide(closestBottom, distInfo, "bottom", SNAP_MIN,
                    closestBottom.top - d, SNAP_MAX, closestBottom.top - d, false, true) );
            }

            if (closestTop) {
                distInfo = {distance:d, x1:closestTop.right, y1:closestTop.bottom,
                    x2:closestTop.right, y2:closestTop.bottom + d};
                guides.push( new PACE.SmartSpacingGuide(closestTop, distInfo, "top", SNAP_MIN,
                    closestTop.bottom + d, SNAP_MAX, closestTop.bottom + d, false, true) );
            }

            if (closestLeft) {
                distInfo = {distance:d, x1:closestLeft.right, y1:closestLeft.bottom,
                    x2:closestLeft.right + d, y2:closestLeft.bottom};
                guides.push( new PACE.SmartSpacingGuide(closestLeft, distInfo, "left", closestLeft.right + d,
                    SNAP_MIN, closestLeft.right + d, SNAP_MAX, false, true) );
            }

            if (closestRight) {
                distInfo = {distance:d, x1:closestRight.left - d, y1:closestRight.bottom,
                    x2:closestRight.left, y2:closestRight.bottom};
                guides.push( new PACE.SmartSpacingGuide(closestRight, distInfo, "right", closestRight.left - d,
                    SNAP_MIN, closestRight.left - d, SNAP_MAX, false, true) );
            }
        }
    };

    this.doSmartDimensions = function(rect, edge, guides)  {
        var i, n, x, y, el, r;

        if (!edge) return;

        for (i = 0, n = spreadElements.length; i < n; i++) {
            el = spreadElements[i];
            if (el.rotation!==0) continue;

            r = new PACE.Element(el).getBoundingBox();

            if (edge.indexOf("right")>=0)
            {
                x = rect.x + el.width;
                guides.push( new PACE.SmartDimensionGuide(r, x, SNAP_MIN, x, SNAP_MAX) );
            }
            if (edge.indexOf("left")>=0)
            {
                x = (rect.x + rect.width) - el.width;
                guides.push( new PACE.SmartDimensionGuide(r, x, SNAP_MIN, x, SNAP_MAX) );
            }
            if (edge.indexOf("top")>=0)
            {
                y = (rect.y + rect.height) - el.height;
                guides.push( new PACE.SmartDimensionGuide(r, SNAP_MIN, y, SNAP_MAX, y) );
            }
            if (edge.indexOf("bottom")>=0)
            {
                y = rect.y + el.height;
                guides.push( new PACE.SmartDimensionGuide(r, SNAP_MIN, y, SNAP_MAX, y) );
            }
        }
    };

}]);
