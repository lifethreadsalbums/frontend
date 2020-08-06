'use strict';

angular.module('pace.layout')
.service('SpreadToolbarService', ['TextEditorService', function(TextEditorService) {

	function getCurrentFontStyles(ctrl, fixCharStyles) {
        var styles = [],
            el = ctrl.selectedElements[0];

        if (!el) return styles;

        var editor = ctrl.currentEditor;
        if (editor instanceof PACE.TextEditor) {
            var target = editor.getTarget();
            if (target.selectionStart===target.selectionEnd) {
                var charStyle = _.pick(el, 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight');
                charStyle = _.extend(charStyle, target.getSelectionStyles());
                styles.push(charStyle);
            } else {
                styles = target.getSelectionStyles(target.selectionStart, target.selectionEnd);
            }
        } else {
            var newLine = /\r?\n/;
            var textLines = el.text.split(newLine);
            if (fixCharStyles && !el.styles) el.styles = {};

            _.each(textLines, function(textLine, lineIndex) {
                if (fixCharStyles && !el.styles[lineIndex]) el.styles[lineIndex] = {};
                _.each(textLine, function(ch, charIndex) {
                    var charStyle = _.pick(el, 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight');
                    if (el.styles[lineIndex][charIndex]) {
                        charStyle = _.extend(charStyle, el.styles[lineIndex][charIndex]);
                    }
                    if (fixCharStyles)
                        el.styles[lineIndex][charIndex] = charStyle;
                    styles.push(charStyle);
                });
            });
        }
        return styles;
    }

    function toggle(el, style, bold, italic) {
        var fontFamily = style.fontFamily || el.fontFamily;
        var font = TextEditorService.findFont(fontFamily);
        if (!font) return;
        var fs = _.findWhere(font.styles, {fontFamily:fontFamily});
        var fs2 = _.find(font.styles, function(fontStyle) {
            return fontStyle.group === fs.group &&
                !!fontStyle.bold === bold &&
                !!fontStyle.italic === italic;
        });

        if (fs2) {
            style.fontFamily = fs2.fontFamily;
        }
    }

    function getBoldItalic(styles) {
        var numBold = 0, numItalic = 0;

        _.each(styles, function(s) {
            if (s.fontFamily) {
                var fontStyle = TextEditorService.findFontStyle(s.fontFamily);
                if (fontStyle.bold) numBold++;
                if (fontStyle.italic) numItalic++;
            }
        });
        return {
            bold: numBold===styles.length,
            italic: numItalic===styles.length
        };
    }

    function toggleFn(toggleBold, toggleItalic, ctrl) {
        var el = ctrl.selectedElements[0];
        var styles = getCurrentFontStyles(ctrl, true);
        var styleInfo = getBoldItalic(styles);

        if (toggleBold) styleInfo.bold = !styleInfo.bold;
        if (toggleItalic) styleInfo.italic = !styleInfo.italic;

        _.each(styles, function(style) {
            toggle(el, style, styleInfo.bold, styleInfo.italic);
        });

        ctrl.currentRenderer.canvas.renderAll();

        var target = el;
        if (ctrl.currentEditor instanceof PACE.TextEditor) {
            target = ctrl.currentEditor.getTarget();
            if (target.selectionStart===target.selectionEnd) {
                ctrl.currentEditor.setSelectionStyles(styles[0], true);
            }
        } else {
            ctrl.currentRenderer.render();
        }
        var cmd = new PACE.ChangeTextCommand(el, {styles:angular.copy(target.styles)});
        cmd.execute();
        ctrl.undoService.pushUndo(cmd);

        ctrl.fireEvent('layout:selection-modified');
    }

    function canToggle(ctrl, toggleBold, toggleItalic) {
        var el = ctrl.selectedElements[0];
        var styles = angular.copy(getCurrentFontStyles(ctrl)),
            styles2 = angular.copy(styles);

        var styleInfo = getBoldItalic(styles);

        if (toggleBold) styleInfo.bold = !styleInfo.bold;
        if (toggleItalic) styleInfo.italic = !styleInfo.italic;

        _.each(styles, function(style) {
            toggle(el, style, styleInfo.bold, styleInfo.italic);
        });
        return !angular.equals(styles, styles2);
    }

    this.toggleBold = toggleFn.bind(null, true, false);

    this.toggleItalic = toggleFn.bind(null, false, true);


}]);