PACE.CenterOnPageCommand = function(element, spread, layout) {
    'use strict';
    
	this.execute = function() {
        var spreadInfoFactory = new PACE.SpreadInfoFactory(),
            spreadInfo = spreadInfoFactory.create(spread, layout),
            pages = spreadInfo.pages,
            page = _.find(pages, function(page) { return page.containsElement(element); });

        var elementRect = new PACE.Element(element).getBoundingBox();
		var rect = page.getCenteringRect();
		
        var centerOnSpread = false;
        var isHorizontal = layout.layoutSize.pageOrientation==='Horizontal';
        
        //special case - DPS image
        // if (element is PictureBox && PictureBox(element).placedElement && 
        //     PictureBox(element).placedElement.image && 
        //     PictureBox(element).placedElement.image.isDoublePageSpread &&
        //     element.pageSpread.numPages==2)
        // {
        //     centerOnSpread = true;
        // }
        
        if ((isHorizontal && elementRect.width >= page.getPageRect().width) || 
            (!isHorizontal && elementRect.height >= page.getPageRect().height))
            rect = page.getBleedRect();

        if (spread.numPages==2) {
            var pageRect = page.getBleedRect(),
                area1 = pages[0].getElementAreaOnPage(element),
                area2 = pages[1].getElementAreaOnPage(element),
                areaTolerance = 0.1;

            if ((area1>areaTolerance && area2>areaTolerance) || 
                (elementRect.width > pageRect.width && isHorizontal) || 
                (elementRect.height > pageRect.height && !isHorizontal) )
                centerOnSpread = true;
        }
		
        if (centerOnSpread) {
            rect = spreadInfo.getBleedRect();
        }
        
        var center = new PACE.Point(rect.x + rect.width/2, rect.y + rect.height/2);
		
		var m = new PACE.Matrix2D();
		m.rotate(element.rotation * Math.PI/180);
		m.translate(center.x, center.y);
		
		var p = m.transformPoint(-element.width/2, -element.height/2);
		element.x = p.x;
		element.y = p.y;
		
	};

};

/**
 * Centers the 'element' on the 'spread'.
 */
PACE.CenterOnSpreadCommand = function (element, spread, layout) {
    'use strict';
    
    this.execute = function () {
        var spreadInfoFactory = new PACE.SpreadInfoFactory(),
            pages = spreadInfoFactory.create(spread, layout).pages,
            rect = _.reduce(pages, function (acc, page) {
                if (_.isNull(acc)) return page.getCenteringRect();
                else return acc.union(page.getCenteringRect());
            }, null),
            center = new PACE.Point(rect.x + rect.width / 2, rect.y + rect.height / 2),
            m = new PACE.Matrix2D();
        
        m.rotate(element.rotation * Math.PI / 180);
        m.translate(center.x, center.y);
        
        var p = m.transformPoint(-element.width / 2, -element.height / 2);
        element.x = p.x;
        element.y = p.y;
    };
};


PACE.CenterHorizontalyOnSpreadCommand = function (element, spread, layout) {
    'use strict';
    
    this.execute = function () {
        var spreadInfoFactory = new PACE.SpreadInfoFactory(),
            rect = spreadInfoFactory.create(spread, layout).getBleedRect(),
            m = new PACE.Matrix2D(),
            el = new PACE.Element(element),
            bbox = el.getBoundingBox(),
            center = new PACE.Point(rect.x + rect.width / 2, rect.y + bbox.height / 2);
            
        m.rotate(element.rotation * Math.PI / 180);
        m.translate(center.x, center.y);
        
        var p = m.transformPoint(-element.width / 2, -element.height / 2);
        element.x = p.x;
        element.y = p.y;

    };
};
