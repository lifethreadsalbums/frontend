PACE.TextEditor = function(layoutController) {
	'use strict';

	var renderer = layoutController.currentRenderer,
		target,
		previousSelectionStyles,
		that = this;

	function getTextFormat(target) {
		var format = {
			width: target.width,
			height: target.height,
			text: target.text, 
			fontFamily: target.fontFamily,
			fontSize: target.fontSize,
			fontWeight: target.fontWeight,
			fontStyle: target.fontStyle,
			textAlign: target.textAlign,
			styles: angular.copy(target.styles), 
		};
        if (_.isString(target.fill)) {
            format.fill = target.fill;
        }
        return format;
	}

	function onTextChanged() {
		//console.log('text changed', target.text);
		var cmd = new PACE.ChangeTextCommand(target.element, getTextFormat(target));
		cmd.execute();
		layoutController.undoService.pushUndo(cmd);
		if (that.onTextChanged) that.onTextChanged();
		layoutController.fireEvent('layout:selection-modified');
        previousSelectionStyles = null;
        onSelectionChanged();
	}
    
    function onSelectionChanged() {
        var selectionStyles = _.pick(target, 'fill', 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'textAlign');

        if (target.selectionStart!==target.selectionEnd) {
            selectionStyles.styles = target.getSelectionStyles(target.selectionStart, target.selectionEnd);
        } else {
            if (target.caretStyle) {
                selectionStyles = _.extend(selectionStyles, target.caretStyle);
            } else {
                var start = Math.max(0, target.selectionStart - 1);
                selectionStyles = _.extend(selectionStyles, target.getSelectionStyles(start));
            }
        }
        
        //if(!_.isEqual(selectionStyles, previousSelectionStyles)) {
            layoutController.fireEvent('layout:text-selection-changed', selectionStyles);
        //}
        
        previousSelectionStyles = selectionStyles;
    }

    function onKeyEscape() {
        layoutController.currentTool.exit();
    }

    function onCursorChanged() {
        target.caretStyle = null;
        previousSelectionStyles = null;
        onSelectionChanged();
    }

    function onObjectModified(options) {
        var scale = renderer.scale,
            canvas = renderer.canvas,
            target = options.target,
            selectionRect = target.getCoordsInModelSpace(),
            selectedElements = layoutController.selectedElements,
            cmd;

        cmd = new PACE.TransformElementsCommand(selectedElements, selectionRect);
        cmd.renderer = renderer;
        cmd.execute();

        layoutController.undoService.pushUndo(cmd);
        layoutController.snappingService.clearSnappedGuides();
        
        layoutController.fireEvent('layout:selection-modified');
    }

    function onBeforeMouseDown(e) {
        var canvas = renderer.canvas,
            activeObject = canvas.getActiveObjectOrGroup();

        if (!activeObject) return;

        var pointer = canvas.getPointer(e),
            targetCorner = activeObject._findTargetCorner(pointer),
            middleCorners = { 'mt':'tr', 'mr':'br', 'mb':'br', 'ml':'bl' },
            corner = middleCorners[targetCorner];

        if (corner) {
            activeObject.forceCorner = corner;
            activeObject.centeredScaling = true;
            activeObject.lockUniScaling = true;
        } else {
            activeObject.lockUniScaling = false;
            activeObject.centeredScaling = false;
        }
    }

    function onMouseUp(options) {
        var canvas = renderer.canvas,
            activeObject = canvas.getActiveObjectOrGroup();

        layoutController.snappingService.clearSnappedGuides();
        
        if (activeObject) {
            activeObject.forceCorner = false;
            activeObject.lockUniScaling = false;
        }
    }
    
    this.getTarget = function() {
    	return target;
    };

    this.setRestrict = function(restrict) {
        target.restrict = restrict;
    };

	this.beginEdit = function(e) {
		console.log('TextEditor - beginEdit');
		var canvas = renderer.canvas;

		target = canvas.getActiveObject();
		if (!target.isEditing) {
            if (target.text && target.element.placeholder && 
                target.text.toLowerCase()===target.element.placeholder.toLowerCase()) {
                target.element.text = '';
                target.refresh();
                target._initDimensions();
                canvas.renderAll();
            }

			target.editable = true;
			target.restrict = this.restrict;

			target.enterEditing();
			
			target.on('changed', onTextChanged);
            target.on('mouseup', onSelectionChanged);
            target.on('key-escape', onKeyEscape);
            target.on('cursor-changed', onCursorChanged);
           
            if (e) {
            	target.setCursorByClick(e);
                onSelectionChanged();
            }

            setTimeout(function() {
            	target.selected = true;
            }, 100);

			console.log('TextEditor - enterEditing()');
		}
        canvas.on('before:mousedown', onBeforeMouseDown);
 		canvas.on('object:modified', onObjectModified);
        canvas.on('mouse:up', onMouseUp);
	};

	this.endEdit = function() {
		console.log('TextEditor - endEdit');
        var canvas = renderer.canvas;

        canvas.off('before:mousedown', onBeforeMouseDown);
        canvas.off('object:modified', onObjectModified);
        canvas.off('mouse:up', onMouseUp);

		target.off('changed', onTextChanged);
		target.off('mouseup', onSelectionChanged);
        target.off('key-escape', onKeyEscape);
        target.off('cursor-changed', onCursorChanged);
		target.exitEditing();
		target.editable = false;

        if (target.text==='' && target.element.placeholder) {
            target.element.text = target.element.placeholder;
            target.element.styles = {};
            target.refresh();
            target._initDimensions();
            canvas.renderAll();
            layoutController.fireEvent('layout:selection-modified');
        }
	};
    
    this.getSelectionStyles = function () {
        var selectionStyles = _.pick(target, 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'textAlign');

        if (target.selectionStart!==target.selectionEnd) {
            selectionStyles.styles = target.getSelectionStyles(target.selectionStart, target.selectionEnd);
        } else {
            if (target.caretStyle) {
                selectionStyles = _.extend(selectionStyles, target.caretStyle);
            } else {
                var loc = target.get2DCursorLocation(target.selectionStart);
                if (target._textLines[loc.lineIndex]==='' && target.styles[loc.lineIndex]) {
                    selectionStyles = target.styles[loc.lineIndex][loc.charIndex] || { };
                } else {
                    var start = Math.max(0, target.selectionStart - 1);
                    selectionStyles = _.extend(selectionStyles, target.getSelectionStyles(start));
                }
            }
        }
        return angular.copy(selectionStyles);
    };

	this.setSelectionStyles = function(styles, focus) {
        if (target.selectionStart===target.selectionEnd) {
            target.caretStyle = styles;
        } else {
		    target.setSelectionStyles(styles);
            target._initDimensions();

            if (target.type==='SpineTextElement') {
                target._autoSize();
            }
            
        }
        if (focus) target.focus();

        var cmd = new PACE.ChangeTextCommand(target.element, getTextFormat(target));
		cmd.execute();

		renderer.canvas.renderAll();
		layoutController.undoService.pushUndo(cmd);
		layoutController.fireEvent('layout:selection-modified');
	};

    this.focus = function() {
        target.focus();
    };

    this.setStyles = function(styles) {
        _.extend(target, styles);

        var newStyles = {};
        for (var i = 0; i < target._textLines.length; i++) {
            var line = target._textLines[i];
            newStyles[i] = {};
            for (var j = 0; j < line.length + 1; j++) {
                var style = target.styles[i] && target.styles[i][j] ? target.styles[i][j] : {};  
                
                for (var key in styles) {
                    delete style[key];
                }
                newStyles[i][j] = style;
            }
        }
        target.styles = newStyles;

        target._forceClearCache = true;
        target._initDimensions();

        var cmd = new PACE.ChangeTextCommand(target.element, getTextFormat(target));
        cmd.execute();

        renderer.canvas.renderAll();
        layoutController.undoService.pushUndo(cmd);
        layoutController.fireEvent('layout:selection-modified');
    };

    this.selectCurrentLine = function() {
        target.selectLine(target.selectionStart);
    };

    this.isLineSelected = function() {
        var pos = Math.floor(target.selectionStart + ((target.selectionEnd - target.selectionStart)/2));
        var newSelectionStart = target.findLineBoundaryLeft(pos),
            newSelectionEnd = target.findLineBoundaryRight(pos);

        return Math.abs(newSelectionStart - target.selectionStart)<2 && Math.abs(newSelectionEnd - target.selectionEnd)<2;
    };

	this.refresh = function() {
		target.setCoordsFromModel(target.element);
		target.refresh();
		renderer.canvas.renderAll();
	};

    this.getSelectionRange = function() {
        return {
            selectionStart: target.selectionStart,
            selectionEnd: target.selectionEnd
        };
    };

};