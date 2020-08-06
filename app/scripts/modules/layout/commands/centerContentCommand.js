/**
 * A command for centering the image content withing the frame.
 * @constructor
 * @param {ImageElement} element - The image frame element.
 */
PACE.CenterContentCommand = function(element) {

	//save previous state for undo
	this.element = element;
	this.prevPos = _.pick(element, 'imageX', 'imageY');

	this.execute = function() {
		var m = new PACE.Matrix2D();
		m.translate(-this.element.imageWidth/2, -this.element.imageHeight/2);
		m.rotate(this.element.imageRotation * Math.PI/180);
		m.translate(this.element.width/2, this.element.height/2);
		var pt = m.transformPoint(0,0)
		this.element.imageX = pt.x;
		this.element.imageY = pt.y;
	}

	this.undo = function() {
		_.extend(this.element, this.prevPos);
	}

}