PACE.CropTool = function(layoutController) {
	'use strict';

	this.type = 'CropTool';
	
	var ctrl = this.layoutController = layoutController;
	ctrl.setSelectionEnabled(true);
	
	//disable group selection
	angular.forEach(ctrl.renderers, function(r) {
		r.canvas.selection = false;
	});

	var selectedElements = ctrl.selectedElements;

	function isPeriodKey(e) {
		//X = 88, //Period = 190
		return (e.keyCode==88 || e.keyCode==190);
	}

	this.onObjectSelected = function(layoutRenderer, options) {
		if (options.target instanceof PACE.Frame)
			return;

		ctrl.clearSelection();

		if (ctrl.currentRenderer && ctrl.currentRenderer !== layoutRenderer) {
			ctrl.currentRenderer.clearSelection();
		}

		ctrl.currentRenderer = layoutRenderer;
		ctrl.selectElements([options.target.element]);
		
		if (ctrl.selectedElements.length===1) {
			if (ctrl.selectedElements[0].type==='ImageElement') {
				ctrl.currentEditor = new PACE.ImageCropEditor(ctrl, options);
				ctrl.currentEditor.beginEdit();
			} else {
				ctrl.currentTool = new PACE.SelectionTool(ctrl);
		        ctrl.currentTool.beginEdit();
			}
		}
	};

	this.onSelectionCleared = function(layoutRenderer, options) {
		if (this.croppedElement && options.e) {
			ctrl.selectedElements = [this.croppedElement];
			new PACE.ToggleToolCommand(ctrl, ctrl.scope, 'CropTool').execute();
		}
	};

	this.onKeyDown = function(e) {
		if (e.keyCode===13) {
			new PACE.ToggleToolCommand(ctrl, ctrl.scope, 'CropTool').execute();
			e.stopImmediatePropagation();
            e.preventDefault();
		} else if (isPeriodKey(e)) {
            ctrl.currentEditor.setConstraint({width:3, height:2});
            e.stopImmediatePropagation();
            e.preventDefault();
        } else if (e.shiftKey) {
        	ctrl.currentEditor.setConstraint({width:1, height:1});
            e.stopImmediatePropagation();
            e.preventDefault();
        }
	};

	this.onKeyUp = function(e) {
		if (!ctrl.currentEditor) return;
		
		if (isPeriodKey(e) && e.shiftKey) {
			ctrl.currentEditor.setConstraint({width:1, height:1});
		} else if (!e.shiftKey) {
			ctrl.currentEditor.setConstraint(null);
		}
	};

};