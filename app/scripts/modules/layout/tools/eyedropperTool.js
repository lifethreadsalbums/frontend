PACE.EyedropperTool = function(layoutController, callback, callback2, exitCallback) {
	'use strict';

	this.type = 'EyedropperTool';

	var injector = angular.element('body').injector(),
        ColorService = injector.get('ColorService');

	var cursorSrc = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo2Q0Y2RTk3MUFGMjZFNDExOTFEQUE1NjE2NEU0NTUzMSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4OUVFM0JBNTI2QUYxMUU0ODYyQkE0OERDRTI0MkVFNiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4OUVFM0JBNDI2QUYxMUU0ODYyQkE0OERDRTI0MkVFNiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjZDRjZFOTcxQUYyNkU0MTE5MURBQTU2MTY0RTQ1NTMxIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjZDRjZFOTcxQUYyNkU0MTE5MURBQTU2MTY0RTQ1NTMxIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+hNimPQAAAZpJREFUeNqUk01LAlEUhs/o3NGZdNQ+QCFpIUHLok04m1pFFm4S2hVt/C3+BncR0SppEbYphEBo2aJNRKsWKTSijSLjoNN7B5U+bJwuvJx7z53nnXPuzBXS6TT9YyxA15AF7UG6bwoQhm6hR2gNqgQkaV2SpA3Mb6B50QVWobKqqhpjjHRdv7csS+p2u86myMRVJrIrN4NLRVE0RVaIBJv8fp/UbHbIMAys4R5WKRKJCG4GS/1+n4yOwXkKBoMUi8WIVyAIAocf8MyuY4CevpG9Xo+HQ9M0KxAbDAbjvUQiwYMJHUPvfx3iIt5yks/nWTabdRLttoHyP6jVavEqAkidOWcxAU4CrgBOZTKZcbJUuqC3Wo0I7cyiFYzXSQZJnPQvmJctiswS/SKTZZlmQqE7pPf5nm8aXC6XqVgsvmC6CaOnaDTKf6QdqPO1AlfYtu2tYckrP/vlFcx5hCcObrCM75vSNO3f8KiFg3g87iz4J6pWq57hkcFRLpejQqFA9XqdGo2GZ5gPAdd5G/EcOh3GZ35Nvd7vTwEGAKp5rUndcJooAAAAAElFTkSuQmCC') 0 16, default";
	layoutController.setSelectionEnabled(false);

	_.each(layoutController.renderers, function(renderer) {
		renderer.canvas.preventMouseDown = true;
	});
	
	if (layoutController.currentEditor) {
		layoutController.currentEditor.endEdit();
	}
	var selectedElements = layoutController.selectedElements.concat(),
		currentRenderer = layoutController.currentRenderer,
		canCommitColor;

	this.onMouseMove = function (renderer, options) {
	    var canvas = renderer.canvas;
	    var pos = canvas.getPointer(options.e);
	    canvas.defaultCursor = cursorSrc;
	    canvas.upperCanvasEl.style.cursor = cursorSrc;

	    //sample color
	    var ctx = canvas.getContext("2d");
		var data = ctx.getImageData(pos.x, pos.y, 1, 1);
		var red = data.data[0],
		    green = data.data[1],
		    blue = data.data[2];

		canCommitColor = false;

	    if (options.target && (red!==255 || green!==255 || green!==255 || options.target.type==='ImageElement')) {
			callback(red, green, blue);
			canCommitColor = true;
		} else if (this.defaultColor) {
			var color = ColorService.hexToRgb(this.defaultColor);
			callback(color.r, color.g, color.b);
		}
	};

	this.onBeforeMouseDown = function(renderer, options) {
		if (canCommitColor) {
			callback2();
		} 
	};

	this.exit = function() {
		document.body.style.cursor = 'default';
		_.each(layoutController.renderers, function(renderer) {
			renderer.canvas.defaultCursor = 'default';
			renderer.canvas.preventMouseDown = false;
		});
		layoutController.currentTool = new PACE.SelectionTool(layoutController);
		layoutController.currentTool.beginEdit();
		if (exitCallback) exitCallback();
	};

	this.onKeyUp = function(e) {
        if (e.keyCode===27) {
            this.exit();
        }
    };

};