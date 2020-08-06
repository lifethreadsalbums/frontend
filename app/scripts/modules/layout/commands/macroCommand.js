PACE.MacroCommand = function(commands) {
	'use strict';

	this.commands = commands;
        
    this.undo = function() {
        for(var i=commands.length-1;i>=0;i--) {
            commands[i].undo();
        }
    }
    
    this.execute = function(){
    	for (var i=0; i < commands.length; i++) {
    		commands[i].execute();
    	};
    }
};

PACE.MacroCommand.create = function() {
    'use strict';
    
    var commands = [];

    for(var i = 0; i < arguments.length; i++) {
        if(typeof(arguments[i]) !== 'undefined') {
            commands.push(arguments[i]);
        }
    }

    return new PACE.MacroCommand(commands);
};