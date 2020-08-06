'use strict';

angular.module('pace.layout')
.service('UndoService', [function() {

    var undoStack = [],
        redoStack = [];
    
    var undoAndRedoItemLimit = 25;
    

    var trimUndoRedoStacks = function() {
        var numItems = undoStack.length + redoStack.length;
        if (numItems > undoAndRedoItemLimit)
        {
            var numToSplice = Math.min(numItems-undoAndRedoItemLimit,redoStack.length);
            if (numToSplice)
            {
                redoStack.splice(0,numToSplice);
                numItems = undoStack.length+redoStack.length;
            } 
            if (numItems > undoAndRedoItemLimit)
            {
                numToSplice = Math.min(numItems-undoAndRedoItemLimit,undoStack.length);
                undoStack.splice(0,numToSplice);
            }
        }
    };
    
    this.clearAll = function() {
        undoStack.length = 0;
        redoStack.length = 0;       
    };
    
    this.clearUndo = function() {
        undoStack.length = 0;
    };
    
    this.clearRedo = function() {
        redoStack.length = 0;       
    };
    
    this.canUndo = function() {
        return undoStack.length > 0;
    };
    
    this.peekUndo = function() {
        return undoStack.length > 0 ? undoStack[undoStack.length-1] : null;
    };
    
    this.popUndo = function() {
        return undoStack.pop();
    };
    
    this.pushUndo = function(cmd) {
        undoStack.push(cmd);
        trimUndoRedoStacks();
    };
    
    this.canRedo = function() {
        return redoStack.length > 0;
    };
    
    this.peekRedo = function() {
        return redoStack.length > 0 ? redoStack[redoStack.length-1] : null;
    };
    
    this.popRedo = function() {
        return redoStack.pop();
    };
    
    this.pushRedo = function(cmd) {
        redoStack.push(cmd);
        trimUndoRedoStacks();
    }; 

}]);