PACE.SwitchToolbarCommand = function(layoutController, $scope, toolbar) {

    this.execute = function() {
        $scope.model.selectedToolset = 'tools' + toolbar;
    };

};

PACE.ToggleToolCommand = function(layoutController, $scope, toolType, toolbar) {

    var editors = {
            'TextTool': PACE.TextEditor,
            'CropTool': PACE.ImageCropEditor
        },
        ctrl = layoutController;

    function switchToSelectionTool() {
        var element = (ctrl.selectedElements.length===1) ? ctrl.selectedElements[0] : null;
            
        ctrl.clearSelection();
        ctrl.currentTool = new PACE.SelectionTool(ctrl);
        if (element) {
            ctrl.selectElements([element], true);
            ctrl.currentTool.beginEdit();
        }
        //console.log('currentTool - SelectionTool');
    }

    this.execute = function() {
        var element = (ctrl.selectedElements.length===1) ? ctrl.selectedElements[0] : null;

        if (toolType==='CropTool' && element && 
            (element.type!=='ImageElement' || !element.imageFile)) return;

        if (ctrl.currentTool.type!==toolType) {
            ctrl.clearSelection(true);
            ctrl.currentTool = new PACE[toolType](ctrl);

            //console.log('currentTool', toolType);

            if (toolType==='FrameTool' && $scope.model.newFrameMode!=='new-frame') {
                ctrl.currentTool.setConstraint({ width:3, height: ($scope.model.newFrameMode==='new-frame32' ? 2 : 3) });
            }

            var editorClass = editors[toolType];
            var skipSelection = element && (
                    (element.type!=='TextElement'      && toolType==='TextTool') || 
                    (element.type!=='SpineTextElement' && toolType==='TextTool') || 
                    (element.type!=='ImageElement'     && toolType==='CropTool') || 
                    (toolType==='FrameTool')
                );

            if (element && editorClass && !skipSelection) {
                ctrl.selectElements([element], true);
                ctrl.currentEditor = new editorClass(ctrl);
                ctrl.currentEditor.beginEdit();
            }
            if ($scope && toolbar) {
                $scope.model.selectedToolset = 'tools' + toolbar;

                if (toolType==='TextTool') {
                    $scope.layout.viewState.rightTabIndex = 1;
                    $scope.layout.viewState.stylesViewIndex = 3;
                }

            }
        } else {
            switchToSelectionTool();
        }
        
    };

};