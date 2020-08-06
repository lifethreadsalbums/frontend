PACE.TransformElementCommand = function(element, pos, prevPos) {
	'use strict';
	
	var props = ['x', 'y', 'width', 'height', 'imageX', 'imageY', 
		'imageWidth', 'imageHeight', 'rotation', 'imageRotation', 'opacity', 
		'backgroundColor', 'strokeColor', 'strokeWidth'],
		defaults = {
			backgroundColor: null,
			strokeColor: null,
			strokeWidth: 0
		};

	this.element = element;
	this.prevPos = prevPos || _.pick(_.defaults(element, defaults), props);
	this.pos = pos;

	this.execute = function() {
		_.extend(this.element, this.pos);
	};

	this.undo = function() {
		_.extend(this.element, this.prevPos);
	};

};