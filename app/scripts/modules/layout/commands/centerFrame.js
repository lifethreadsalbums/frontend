PACE.CenterFrameCommand = function(el, page) {
    'use strict';
    
    var state = _.pick(el, 'x', 'y');

    this.execute = function() {
        var rect = page.getCenteringRect(),
            center = new PACE.Point(rect.x + rect.width/2, rect.y + rect.height/2),
            m = new PACE.Matrix2D(),
            p;

        m.rotate(el.rotation * Math.PI/180);
        m.translate(center.x, center.y);
           
        p = m.transformPoint(-el.width/2, -el.height/2);
        el.x = p.x;
        el.y = p.y;
    };

    this.undo = function() {
        _.extend(el, state);
    };

};