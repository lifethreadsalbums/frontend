PACE.PrintsSelectionTool = function(layoutController) {
    'use strict';

    var ctrl = this.layoutController = layoutController;

    this.type = 'PrintsSelectionTool';
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
            if (element.type==='ImageElement' && element.imageFile) {
                ctrl.currentEditor = new PACE.ImageEditor(ctrl);
                ctrl.currentEditor.swapEnabled = false;
                ctrl.currentEditor.moveEnabled = false;
                ctrl.currentEditor.deleteEnabled = false;
                ctrl.currentEditor.rotationInPlaceEnabled = true;
                ctrl.currentEditor.snapFrameToAngles = [0, 90, 180, 270];
                //ctrl.currentEditor.minSizeWhenIconsAreVisible = 120;
                
                if (ctrl.currentRenderer.layout.layoutSize.gridX>0) {
                    ctrl.currentEditor.showBorder = false;
                }
                if (ctrl.currentRenderer.layout.layoutSize.gridX>0 || ctrl.currentRenderer.layout.layoutSize.templateSpread) {
                    ctrl.currentEditor.rotationEnabled = false;

                }
            } else
                ctrl.currentEditor = new PACE.FrameEditor(ctrl);

            if (element.type==='TextElement' || element.type==='SpineTextElement') {
                ctrl.scope.layout.viewState.rightTabIndex = 1;
                ctrl.scope.layout.viewState.stylesViewIndex = 3;
                ctrl.fireEvent('prints:toolbar-changed', 4);
            } else {
                ctrl.scope.layout.viewState.rightTabIndex = 0;
                layoutController.fireEvent('prints:toolbar-changed', 2);
            }
        } else if (ctrl.selectedElements.length>0) {
            ctrl.currentEditor = new PACE.FrameEditor(ctrl);
        }
        if (ctrl.currentEditor) {
            ctrl.currentEditor.beginEdit();
            ctrl.fireEvent('layout:current-editor-changed');
        }
    };

    this.onObjectSelected = function(layoutRenderer, options) {
        //console.log('onObjectSelected', options.target);

        ctrl.clearSelection();

        if (ctrl.currentRenderer && ctrl.currentRenderer !== layoutRenderer) {
            ctrl.currentRenderer.clearSelection();
        }

        var el = options.target ? options.target.element : null;

        if (el && el.type==='BackgroundFrameElement') {
            ctrl.currentRenderer.clearSelection();
            return;
        }

        ctrl.setCurrentRenderer(layoutRenderer);
        ctrl.selectElements( getElements(options.target), false );

        console.log('onObjectSelected', options.target)

        this.beginEdit();
    };

    this.onSelectionCleared = function(layoutRenderer, options) {
        ctrl.fireEvent('prints:selection-cleared', options);
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

    this.onMouseDown = function (layoutRenderer, options) {
        if (ctrl.selectedElements.length===0 &&
            layoutRenderer.spread.elements.length===0 ) {

            ctrl.setCurrentRenderer(layoutRenderer);
            ctrl.fireEvent('prints:selection-cleared', options);

        }
    };

    this.onKeyUp = function(e) {
        
        if (e.keyCode===27) {
            
        }
        
    };

    this.exit = function() {
        if (ctrl.currentEditor instanceof PACE.TextEditor) {
            ctrl.currentEditor.endEdit();

            var spread = ctrl.currentRenderer.spread;
        
            if (spread.elements.length>0) {
                ctrl.selectElements([spread.elements[0]], true);
                ctrl.currentTool.beginEdit();
            }

            ctrl.scope.layout.viewState.rightTabIndex = 0;
            layoutController.fireEvent('prints:toolbar-changed', 2);

            ctrl.scope.$apply();
        }
    };

};
