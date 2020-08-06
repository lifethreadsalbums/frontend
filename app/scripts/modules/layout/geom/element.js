(function() {
    "use strict";

	PACE.Element = function(element) {
		this.element = element;
	};

	var p = PACE.Element.prototype;

	p.getMatrix = function() {
		var m = new PACE.Matrix2D(),
			rotation = this.element.rotation,
			x = this.element.x,
			y = this.element.y;

		if (typeof rotation==='undefined') rotation = 0;
		if (typeof x==='undefined') x = 0;
		if (typeof y==='undefined') y = 0;

		m.rotate(rotation*Math.PI/180);
		m.translate(x, y);
		return m;
	};

	p.getCenter = function() {
		var m = this.getMatrix();
		return m.transformPoint(this.element.width/2, this.element.height/2);
	};

	p.getBoundingBox = function() {
		
		if (this.element.type==='ElementGroup' && !(this.element.width && this.element.height)) {
			var bbox, i, el, elBbox;

			for (i = 0; i < this.element.elements.length; i++) {
				el = this.element.elements[i];
				elBbox = new PACE.Element(el).getBoundingBox();
				bbox = bbox ? bbox.union(elBbox) : elBbox;
			}
			return bbox;
		} else {
			var m = this.getMatrix();
			var p1 = m.transformPoint(0, 0);
			var p2 = m.transformPoint(this.element.width, 0);
			var p3 = m.transformPoint(this.element.width, this.element.height);
			var p4 = m.transformPoint(0, this.element.height);
			
			//calculate bounding box
			var minx = Math.min( Math.min(p1.x, p2.x), Math.min(p3.x, p4.x) );
			var maxx = Math.max( Math.max(p1.x, p2.x), Math.max(p3.x, p4.x) );
			var miny = Math.min( Math.min(p1.y, p2.y), Math.min(p3.y, p4.y) );
			var maxy = Math.max( Math.max(p1.y, p2.y), Math.max(p3.y, p4.y) );

			return new PACE.Rect({x:minx, y:miny, width:maxx - minx, height:maxy - miny});
		}
	};

	p.hasDefaultCropping = function() {
        var el = this.element,
        	el2 = angular.copy(el),
            eq = PACE.GeomService.equals,
            tol = 2.0;

        new PACE.Element(el2).fillFrame().centerContent();

        return eq(el2.imageX, el.imageX, tol) &&
               eq(el2.imageY, el.imageY, tol) &&
               eq(el2.imageWidth, el.imageWidth, tol) &&
               eq(el2.imageHeight, el.imageHeight, tol);
    }

	// expose certain commands to allow chaining, i.e.:
	//   new PACE.Element(els[0])
    //       .transformElement(frame)
    //       .fillFrame()
    //       .centerContent();

	var commands = ['FillFrameCommand', 'CenterContentCommand', 'TransformElementCommand', 'FixContentInFrame',
		'ResizeImageElement', 'RotateElementCommand', 'FitContentCommand', 'CenterFrameCommand'];

	_.each(commands, function(cmd) {
		var fnName = cmd.replace(/Command$/, '');
		fnName = fnName.charAt(0).toLowerCase() + fnName.substr(1);

		p[fnName] = function() {
			var args = [null, this.element];
			for(var i=0;i<arguments.length;i++) args.push(arguments[i]);

			var cmdInstance = new (Function.prototype.bind.apply(PACE[cmd], args));
            cmdInstance.execute();
            return this;
		};
	});

	PACE.Elements = function(elements) {
		this.element = { type: 'ElementGroup', elements: elements };
	};

	PACE.Elements.prototype = new PACE.Element();

	PACE.Elements.prototype.getGapSpacing = function() {
		var elements = this.element.elements.concat();
		if (elements.length<2)
            return null;

        elements.sort(function(el1, el2) {
            var o1 = el1.x + el1.y * 1000;
            var o2 = el2.x + el2.y * 1000;
            return o1 - o2;
        });
        
        var el1 = elements[0];
        var el2 = elements[1];
        var gap = null;
        if (el2.x >= el1.x + el1.width)
            gap = el2.x - (el1.x + el1.width);
        else if (el1.x >= el2.x + el2.width)
            gap = el1.x - (el2.x + el2.width)
        else if (el2.y >= el1.y + el1.height)
            gap = el2.y - (el1.y + el1.height);
        else if (el1.y >= el2.y + el2.height)
            gap = el1.y - (el2.y + el2.height);
        
        return gap;
	};
	
}());