PACE.DirectSelectionTool = function(layoutController) {
	'use strict';

	this.layoutController = layoutController;

	this.onObjectSelected = function(layoutRenderer, options) {

		var ctrl = this.layoutController;
		if (options.target instanceof PACE.Frame)
			return;

		ctrl.clearSelection();

		if (ctrl.currentRenderer && ctrl.currentRenderer !== layoutRenderer) {
			ctrl.currentRenderer.clearSelection();
		}

		ctrl.currentRenderer = layoutRenderer;
		if (options.target instanceof PACE.ImageElement) {
			ctrl.selectElements([options.target.element], false);
			
			ctrl.currentEditor = new PACE.ImageContentEditor(ctrl, options);
			ctrl.currentEditor.beginEdit();
		}

	};

	this.onMouseDown = function(layoutRenderer, options) {
		var ctrl = this.layoutController;
		
		if (!options.target && ctrl.currentRenderer && ctrl.currentRenderer !== layoutRenderer) {
			ctrl.clearSelection();
			ctrl.currentRenderer.clearSelection();
		}

		if (options.target instanceof PACE.Frame)
			return;
		
		ctrl.currentRenderer = layoutRenderer;

		if (options.target instanceof PACE.ImageElement && ctrl.selectedElements.length===1 &&
			ctrl.selectedElements[0]===options.target.element) {
			//ctrl.clearSelection();
			//ctrl.selectElements([options.target.element], false);
			
			ctrl.currentEditor = new PACE.ImageContentEditor(ctrl, options);
			ctrl.currentEditor.beginEdit();
		}

	};


};