'use strict';

PACE.BackgroundFrameElement = fabric.util.createClass(PACE.ImageElement, {
    
    type:'BackgroundFrameElement',

    initialize: function(options) {
        this.callSuper('initialize', options);
        this.lockScalingX = true;
        this.lockScalingY = true;
        this.lockMovementX = true;
        this.lockMovementY = true;
    },

});