'use strict';

PACE.ElementGroup = fabric.util.createClass(fabric.Group, {

    type: 'ElementGroup',
    originX: 'left',
    originY: 'top',

    initialize: function(element, options) {
   		
        this.callSuper('initialize', [], options);
        this.lockUniScaling = true;
    },
  
   
    refresh: function() {
    }
    
});