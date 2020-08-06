PACE.ChangeTextCommand = function(element, props) {
    'use strict';
	
	this.element = element;
	this.prevState = {
		x: element.x,
		y: element.y,
		text: element.text, 
		fontFamily: element.fontFamily,
		fontSize: element.fontSize,
		fontWeight: element.fontWeight,
		fontStyle: element.fontStyle,
		textAlign: element.textAlign,
		fill: element.fill,
        rotation: element.rotation,
		styles: angular.copy(element.styles)
	};
	this.props = props;


	this.setProps = function(props) {
		for(var prop in props) {
			var val = prop==='styles' ? angular.copy(props[prop]) : props[prop];
			this.element[prop] = val;
		}	
	}
	
	this.execute = function() {
		this.setProps(this.props);
	}

	this.undo = function() {
		this.setProps(this.prevState);
	}

};