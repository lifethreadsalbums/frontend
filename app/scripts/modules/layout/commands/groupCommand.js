PACE.GroupCommand = function(spread, elements) {
    'use strict';
    	
	this.elements = angular.copy(elements);
	
	this.execute = function() {

        var group = {
            type:'ElementGroup',
            elements: [],
            rotation:0
        }
        var rect, i, el, idx;
        this.indices = [];
        for (i = 0; i < elements.length; i++) {
            el = elements[i];
            idx = spread.elements.indexOf(el);
            this.indices.push(idx);
            spread.elements.splice(idx,1);
            group.elements.push(el);
            if (!rect)
                rect = new PACE.Element(el).getBoundingBox();
            else
                rect = rect.union( new PACE.Element(el).getBoundingBox() );
        };
        group.x = rect.x;
        group.y = rect.y;
        group.width = rect.width;
        group.height = rect.height;

        for (i = 0; i < group.elements.length; i++) {
            el = group.elements[i];
            el.x -= rect.x;
            el.y -= rect.y;
            delete el.id;
        }

        spread.elements.push(group);   
        this.group = group;
	}

	this.undo = function() {
		var i, el,
			idx = spread.elements.indexOf(this.group);

		spread.elements.splice(idx,1);
		for (i = 0; i < this.elements.length; i++) {
            el = this.elements[i];
            delete el._id;
            idx = Math.min(spread.elements.length - 1, this.indices[i]);
            spread.elements.splice(idx, 0, el);
        }
	}

};

PACE.UngroupCommand = function(spread, group) {

	this.group = group;

	this.execute = function() {

		var i, el,
			idx = spread.elements.indexOf(group);

		spread.elements.splice(idx,1);
		var m = new PACE.Element(group).getMatrix();
		for (i = 0; i < group.elements.length; i++) {
			el = group.elements[i];
			var pt = m.transformPoint(el.x, el.y);
			el.x = pt.x;
			el.y = pt.y;
			el.rotation += group.rotation;
			//delete el._id;
			spread.elements.push(el);
		}

	}

	this.undo = function() {
		var cmd = new PACE.GroupCommand(spread, group.elements);
		cmd.execute();
	}
}