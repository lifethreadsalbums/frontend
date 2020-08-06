'use strict';

PACE.Frame = fabric.util.createClass(fabric.Object, fabric.Observable, {
	originX: 'left',
    originY: 'top',
    type:'frame',
    initialize: function(options) {
        this.callSuper('initialize', options);
    },

    _render: function(ctx) { }
});