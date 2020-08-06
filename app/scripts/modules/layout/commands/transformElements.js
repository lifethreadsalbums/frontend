PACE.TransformElementsCommand = function(elements, rect) {
	"use strict";

	var props = ['x', 'y', 'width', 'height', 'imageX', 'imageY', 
		'imageWidth', 'imageHeight', 'rotation', 'imageRotation', 'opacity'];
		
	this.elements = elements;
	this.rect = rect;
	this.prevState = [];

	for (var i = 0; i < this.elements.length; i++) {
		this.prevState.push(_.pick(elements[i], props));
	}

	function getBoundingBox(elements) {
		var bbox, i, el, elBbox;

		for (i = 0; i < elements.length; i++) {
			el = elements[i];
			elBbox = new PACE.Element(el).getBoundingBox();
			bbox = bbox ? bbox.union(elBbox) : elBbox;
		};
		return bbox;
	}

	this.transformGroup = function(group) {
		var bbox = getBoundingBox(group.elements), 
			i, el;

		for (i = 0; i < group.elements.length; i++) {
			el = group.elements[i];

			var x = el.x / bbox.width,
				y = el.y / bbox.height,
				w = el.width / bbox.width,
				h = el.height / bbox.height,
				imageX = el.imageX / el.width,
				imageY = el.imageY / el.height,
				imageWidth = el.imageWidth / el.width,
				imageHeight = el.imageHeight / el.height;
			
			el.x = x * group.width;
			el.y = y * group.height;
			el.width = w * group.width;
			el.height = h * group.height;
			if (el.type==='ImageElement' || el.type==='ImageStampElement') {
				el.imageX = imageX * el.width;
				el.imageY = imageY * el.height;
				el.imageWidth = imageWidth * el.width;
				el.imageHeight = imageHeight * el.height;
			}
		};
	};

	this.execute = function() {

		var i, el,
			bbox = this.elements.length===1 ? this.elements[0] : getBoundingBox(this.elements),		
			m = new PACE.Element(this.rect).getMatrix(),
			scaleX = this.rect.width / bbox.width, 
			scaleY = this.rect.height / bbox.height,
			m2 = new PACE.Matrix2D();

		m2.scale(scaleX, scaleY);
		m.appendMatrix(m2);

		for (i = 0; i < elements.length; i++) {
			el = elements[i];
			var localX = el.x - bbox.x,
				localY = el.y - bbox.y,
				pt = m.transformPoint(localX, localY),
				imageX = el.imageX / el.width,
				imageY = el.imageY / el.height,
				imageWidth = el.imageWidth / el.width,
				imageHeight = el.imageHeight / el.height;
			el.x = pt.x;
			el.y = pt.y;
			el.width *= scaleX;
			el.height *= scaleY; 
			if (elements.length===1)
				el.rotation = rect.rotation;
			else
				el.rotation += rect.rotation;
			
			if (el.type==='ElementGroup')
				this.transformGroup(el);
			else if (el.type==='ImageElement' || el.type==='ImageStampElement') {
				el.imageX = imageX * el.width;
				el.imageY = imageY * el.height;
				el.imageWidth = imageWidth * el.width;
				el.imageHeight = imageHeight * el.height;
			}
		}

	};

	this.undo = function() {
		for (var i = 0; i < this.elements.length; i++) {
			_.extend(this.elements[i], this.prevState[i]);
		}
	};

};