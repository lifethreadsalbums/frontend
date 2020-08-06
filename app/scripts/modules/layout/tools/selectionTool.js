PACE.SelectionTool = function(layoutController) {
	'use strict';

	var ctrl = this.layoutController = layoutController;

	this.type = 'SelectionTool';
	ctrl.setSelectionEnabled(true);
	ctrl.setDefaultCursor();

	var getElements = function(target) {
		var elements = [];
		if (target.type==='group') {
			var objects = target.getObjects();
			for (var i = 0; i < objects.length; i++) {
				elements.push( objects[i].element );
			}
		} else {
			elements.push( target.element );
		}
		return elements;
	};

	this.beginEdit = function() {
		if (ctrl.selectedElements.length===1) {
			var element = ctrl.selectedElements[0];
			if (element.type==='ImageElement' && element.imageFile)
				ctrl.currentEditor = new PACE.ImageEditor(ctrl);
			else
				ctrl.currentEditor = new PACE.FrameEditor(ctrl);
		} else if (ctrl.selectedElements.length>0) {
			ctrl.currentEditor = new PACE.FrameEditor(ctrl);
		}
		if (ctrl.currentEditor) {
			ctrl.currentEditor.beginEdit();
			ctrl.fireEvent('layout:current-editor-changed');
		}
	};

	this.onObjectSelected = function(layoutRenderer, options) {
		if (options.target instanceof PACE.Frame)
			return;

		//console.log('onObjectSelected', options.target);

		ctrl.clearSelection();

		if (ctrl.currentRenderer && ctrl.currentRenderer !== layoutRenderer) {
			ctrl.currentRenderer.clearSelection();
		}

		ctrl.setCurrentRenderer(layoutRenderer);
		ctrl.selectElements( getElements(options.target), false );

		this.beginEdit();
	};

	this.onMouseDown = function(layoutRenderer, options) {
		if (!options.target && ctrl.currentRenderer && ctrl.currentRenderer !== layoutRenderer) {
			var prevRenderer = ctrl.currentRenderer;
			ctrl.setCurrentRenderer(layoutRenderer);
			ctrl.clearSelection();
			prevRenderer.clearSelection();
		}

        // deselect currently selected guides if shift isn't pressed
        if(!options.e.shiftKey)
            ctrl.deselectGuides();

        // set the currentTool to FixedGuideTool
        var guide = layoutRenderer.getGuideAtPos(options.e);
        if (guide) {
            guide.selected = true;
            ctrl.currentTool = new PACE.FixedGuideTool(ctrl, PACE.Guide.isVertical(guide) ? 'v' : 'h', guide);
            ctrl.setSelectionEnabled(false);
            ctrl.clearSelection();

            // if the event appears directly over some image element
            // then it gets automatically selected. calling deactivateAll
            // deactivates all items immediately.
            ctrl.currentRenderer.canvas.deactivateAll();
        }
	};

	this.onDoubleClick = function(layoutRenderer, options) {

		var el = options.target ? options.target.element : null;

		if (el && (el.type==='TextElement' || el.type==='SpineTextElement')) {

			if (ctrl.currentEditor instanceof PACE.TextEditor &&
				ctrl.currentEditor.getTarget()===options.target) {
				return;
			}

			if (ctrl.currentEditor) {
				ctrl.currentEditor.endEdit();
			}

			ctrl.currentTool = new PACE.TextTool(ctrl);

			ctrl.currentEditor = new PACE.TextEditor(ctrl);
			ctrl.currentEditor.beginEdit(options.e);
			ctrl.fireEvent('layout:current-editor-changed');

		} else if (el && el.type==='ImageElement') {
			ctrl.fireEvent('layout:find-image-in-filmstrip', el.imageFile);
		}

		if (options.target && ctrl.selectedElements.indexOf(options.target.element)>=0) {
			ctrl.fireEvent('layout:selection-double-click');
		}

	};

	this.onMouseMove = function(layoutRenderer, options) {
		var e = options.e;
		var isLeftClick  = 'which' in e ? e.which === 1 : e.button === 1;
		if (ctrl.currentEditor instanceof PACE.ImageEditor && options.e.altKey && isLeftClick) {
			var target = layoutRenderer.canvas.getActiveObject();
			ctrl.currentEditor.endEdit();
		 	ctrl.currentEditor = new PACE.ImageCropEditor(ctrl,  {e:options.e, target:target});
		 	ctrl.currentEditor.previousTarget = target;
			ctrl.currentEditor.beginEdit();
			ctrl.fireEvent('layout:current-editor-changed');
		}
	};

	this.onMouseUp = function(layoutRenderer, options) {
		if (ctrl.currentEditor instanceof PACE.ImageCropEditor) {
			var target = ctrl.currentEditor.previousTarget;
			ctrl.currentEditor.endEdit();
			layoutRenderer.canvas.setActiveObject(target);
		 	ctrl.currentEditor = new PACE.ImageEditor(ctrl);
			ctrl.currentEditor.beginEdit();
			ctrl.fireEvent('layout:current-editor-changed');
		}
	};

};
