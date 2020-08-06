PACE.FrameEditor = function(layoutController) {
    "use strict";

    var settings = {
        swapFillStyle: 'rgba(119, 210, 246, 0.5)',
        circleFillStyle: 'rgba(137, 137, 137, 0.5)',
        circleStrokeStyle: '#666666',
        cornerStrokeStyle: '#ff7e01',
        cornerFillStyle: '#ffa500',
        rotateOrangeStyle: 'rgba(227, 138, 30, 0.5)',
        scaleOrangeStyle: 'rgba(227, 138, 30, 1)',
        rotateBlueStyle: 'rgba(17, 170, 211, 0.5)',
        scaleBlueStyle: 'rgba(17, 170, 211, 1)'
    };

    var frameRotateCursors = [
        /* top left */     "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAVNJREFUeNpi/P//PwMpgPHAlxogxf3fgacSQ44Mwy4BKV0g3gDEhUBDH5BkGNAAISDlDMT/gLgXiOWRpGuBBrYQNAxoiAqQ6gRifyBmJmBnHU7DgAZNA1KZSEJvgfgrEEsCMSsWLVOZcBi0DMkgUBjFArEU0Dsg711DU34HiLWAcjksWAwqB1KRUC7Ii5VAhdic/xuI04Fy87FGANAgXahLQGA5UGEUFsu6gRQPEFcA5T/iTBpAhROAVD40fFSBit+TkmzQw8wXSk8j1SAUw4CuAsUQP5R7hoEMgOwyKSAWhkb/VnIMY2TY/xmU1wqB+DUQqwPxT2gkaABxDdC7k4g1jAXqOiEoBgF2IDaFsmVJchkoNoHhdQLINkeTOwp0lQ05YdaBRa6X5DCDpTOg62YDqRSo+Cagq/wpMQw59YPy2nWyDYMaOB1I/QEalEtO0gAIMACroYC61XVmXwAAAABJRU5ErkJggg==') 6 6, default",
        /* top right */    "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QjQxMTA1MzMzOEMzMTFFNEE3RkJGN0JBRUE0OEI4NzMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QjQxMTA1MzQzOEMzMTFFNEE3RkJGN0JBRUE0OEI4NzMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCNDExMDUzMTM4QzMxMUU0QTdGQkY3QkFFQTQ4Qjg3MyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCNDExMDUzMjM4QzMxMUU0QTdGQkY3QkFFQTQ4Qjg3MyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PpK8KpMAAAFfSURBVHjapJM9SwNBEIZvY+yCov4AQbBQUEsLG0HEMgYre0ERVMRCG220CKQTJJXYWViIKNbmJ0gCipBCEQQRBU0s/CDnMzCB5cgd2XXg4b2b2Xtv9nbOhGEYRMOU6jtII5zM7AUOYWwzTGaRLRiHN8z6nM0wGeF6FRas2h3MwBOmP22ZBVe1IrqUsOYV3uECDjGuxC1MwW9M7Qs+QbY6AGtQZhebsWa8aQUdhvNIrQzdkIVd7VAij+FxOweQQzZgAmq8qMuq9SAHMK+pIvXlWDPrwQLyyOL9FrU80tzqIGuqiWaJJ1aqG+QaRuEUszn7AJyCh+XtBb3NYt7rbaZxogfSAVP/MqO7bx0biYbXN9ODmdZbGadOeIAP6Tbt2FQGxiK5ftVL185kiF+0IzvO2Hou5fit5B9dbFFa9x2NI6RqpbbJ3XsNrW53CLlRc9PMpz1H4xZD+U+f7fyfAAMA1qmDvbrTTQgAAAAASUVORK5CYII=') 12 6, default",
        /* bottom right */ "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAVNJREFUeNpi/P//PwM5gPHAl8lAiuW/A08mXIwcw4AGaQKpa1CuHtDAyyAGEwN5oAOJnUe2y4CuCgRS69CEA4Gu20COy4qxiFWQ7DKgq7qBVAkO6XpSXfYYiD8D8Wkg/gkVuwnE74D4H7mxyQykPgIxNxArAMPrISWx6Q016C0QP4MJkmuYCZT+CHTVb7INA3pREEhlQbmbkeVYsCjmhybKL0BbS7GYNxWIhaHsuTgNAxqUCKRmAjErEF9Ek2MEUu1AHAlLW7BshGIYNK9tAmIVLC5lA1JhQAxypR5UeDnQoE4MtQz7P08B0tlYvAMK2OfQWBNGEp8ONCgLW3iCXPYSR1iDvCoHZf8F4o1AXA406A7OyIElWqB3aoBUM5LcQ2g+BMX4XqAh7wjGNHIOABqoAKT6gTgAiC8DDdAjJdmgxCZQ8wNQcQI0FBRrX0lNgwABBgBzI3DZ9PCXTgAAAABJRU5ErkJggg==') 13 13, default",
        /* bottom left */  "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAUpJREFUeNpi/P//PwMMMB74UgukxP878OQwkAEY0QyDcbSABl4n1TAmJINqkMQ3ke0yoEEKQPZ9NLkkoOvmk+OyfixyM4GW8JNkGFBDO5AOwCLHCsQdpBjGAsRfgfgyEPMBsTwQ/wbia1D5L2TFJtCFwUBqDRA/AoaVPDkRwISFzQ00mI1Sw/YC8V8gFgbiMIoMA3rtHZDaCOWWAl3HSInLQKAcSusBcTvWQD7wJQ+IuwlmJ6jiaUAqE8pdDsTZQFe/R5L/BKR4gfgoEPcC5dbjNAyqYRmQioRy3wIxyIIzQLwViI8DsSla1qsA5WWshkENLMeSaL9C0yY7Fi1TmHAFJtCmTmjYTQTie1AXcuMwCJwBcLoMi0tB2UsKiHcCsTqS1BwgngS0/DLRhiEZCnKhEBCfBAUD0JANyHmTVAAqYZiAhjShSwAEGADHDndS8YFkRAAAAABJRU5ErkJggg==') 6 12, default"
    ];

    var LOCK_AXIS_THRESHOLD = 10,
        MIN_EDGE_LENGTH = 1.0;

    var renderer = layoutController.currentRenderer,
        canvas = renderer.canvas,
        duplicate = false,
        lastMousePos,
        lastTargetPos,
        lockedAxis,
        mousePosInElementSpace;

    var isSnappingOn = true;
    var isRotateInProgress = false;
    var isMoveInProgress = false;
    var isResizeInProgress = false;

    this.onObjectModified = function(options) {
        var scale = renderer.scale,
            canvas = renderer.canvas,
            target = options.target,
            selectionRect = target.getCoordsInModelSpace(),
            selectedElements = layoutController.selectedElements,
            cmd;

        if (target.type==='group') {
            var commands = [];
            _.each(target.objects, function(obj) {
                var r = obj.getCoordsInModelSpace();

                r.imageX = obj.imageX * target.scaleX;
                r.imageY = obj.imageY * target.scaleX;
                r.imageWidth = obj.imageWidth * target.scaleX;
                r.imageHeight = obj.imageHeight * target.scaleX;

                commands.push(new PACE.TransformElementCommand(obj.element, r));
            });
            cmd = new PACE.MacroCommand(commands);
        } else {
            cmd = new PACE.TransformElementsCommand(selectedElements, selectionRect);
        }
        cmd.renderer = renderer;
        cmd.execute();

        layoutController.undoService.pushUndo(cmd);
        layoutController.snappingService.clearSnappedGuides();
        renderer.render();

        layoutController.fireEvent('layout:selection-modified');

        duplicate = false;
        lastMousePos = null;
        lockedAxis = null;
        currentGap = null;
    };

    this.onObjectScaled = function(options) {
        var target = options.target;
        if (target.type!=='group') return;


        if (currentGap!=null) {

            var elements = _.map(target.objects, function (o) {
                var el = angular.copy(o.element);
                return el;
            });

            var rect = target.getCoordsInModelSpace(),
                gap = currentGap,
                bbox = new PACE.Elements(elements).getBoundingBox();

            gap += (bbox.width>rect.width ? -0.000001 : 0.000001);

            new PACE.TransformElementsCommand(elements, rect).execute();
            new PACE.FixedSpacingCenteredCommand(elements, gap).execute();

            var gm = new PACE.Matrix2D();
            gm.translate(target.width/2, target.height/2);
            gm.rotate(target.angle * Math.PI/180);
            gm.scale(target.scaleX, target.scaleY);
            gm.translate(target.left, target.top);

            gm.invert();

            for (var i = 0; i < target.objects.length; i++) {
                var o = target.objects[i],
                    canvas = target.canvas,
                    offset = target.canvas.offset,
                    el = elements[i];

                var pt = gm.transformPoint((el.x + offset.x) * canvas.scale, (el.y + offset.y) * canvas.scale);

                o.left = pt.x;
                o.top = pt.y;
                o.width = el.width / target.scaleX;
                o.height = el.height / target.scaleY;

                o.imageX = el.imageX / target.scaleX;
                o.imageY = el.imageY / target.scaleY;
                o.imageWidth = el.imageWidth / target.scaleX;
                o.imageHeight = el.imageHeight / target.scaleY;
                o.setCoords();
            }

        }
    };

    this.onMoving = function(options) {
        var target = options.target,
            rect = target.getCoordsInModelSpace(),
            snappingService = layoutController.snappingService;

        //lock the X or Y axis
        if (options.e.shiftKey) {
            var mousePos = {x: options.e.pageX, y: options.e.pageY};
            if (!lastMousePos) lastMousePos = mousePos;

            var dx = Math.abs(lastMousePos.x - mousePos.x),
                dy = Math.abs(lastMousePos.y - mousePos.y);

            if (dx>dy && dx>LOCK_AXIS_THRESHOLD) {
                lockedAxis = 'y';
            } else if (dx<dy && dy>LOCK_AXIS_THRESHOLD) {
                lockedAxis = 'x';
            }
            if (lockedAxis) {
                rect[lockedAxis] = lastTargetPos[lockedAxis];
            } else {
                rect = lastTargetPos;
            }
        } else {
            lockedAxis = null;
        }

        var snapped = snappingService.snapObject(rect);
        target.setPositionFromModel(rect);

        //duplicate selection
        if (options.e.altKey && !duplicate) {
            duplicate = true;
            _.each(layoutController.selectedElements, function(el) {
                var newElement = _.omit(el, '_id', 'id', 'version');
                renderer.spread.elements.push(newElement);
            });
            renderer.render();
            var activeGroup = renderer.canvas.getActiveGroup();
            if (activeGroup) {
                renderer.canvas._currentTransform.target = activeGroup;
            }
            layoutController.snappingService.beginSnapping(layoutController);
        }

        lastMousePos = mousePos;
        lastTargetPos = rect;
    };

    this.onMouseDown = function(options) {
        lastMousePos = {x: options.e.pageX, y: options.e.pageY};
        lockedAxis = null;
        var activeObject = canvas.getActiveObjectOrGroup();
        if (activeObject)
            lastTargetPos = activeObject.getCoordsInModelSpace();
    };

    this.onMouseUp = function (options) {
        layoutController.snappingService.clearSnappedGuides();
        renderer.render();

        var activeObject = canvas.getActiveObjectOrGroup(),
            element = activeObject.element;
        if (activeObject) {
            activeObject.forceCorner = false;
            activeObject.lockUniScaling = false;
        }
    };

    this.onObjectRotating = function(options) {
        if (isSnappingOn) {
            var rotationAngle = normalizeAngle(options.target.angle.toFixed(0));

            if (rotationAngle > -3 && rotationAngle < 3) {
                options.target.angle = 0;
            } else if (rotationAngle > 42 && rotationAngle < 48) {
                options.target.angle = 45;
            } else if (rotationAngle > 87 && rotationAngle < 93) {
                options.target.angle = 90;
            } else if (rotationAngle > 132 && rotationAngle < 138) {
                options.target.angle = 135;
            } else if (rotationAngle > 177 || rotationAngle < -176) {
                options.target.angle = 180;
            } else if (rotationAngle > -48 && rotationAngle < -42) {
                options.target.angle = -45;
            } else if (rotationAngle > -93 && rotationAngle < -87) {
                options.target.angle = -90;
            } else if (rotationAngle > -138 && rotationAngle < -132) {
                options.target.angle = -135;
            }
        }
    }

    this.onRender = function() {
        var ctx = canvas.getSelectionContext(),
            activeObject = canvas.getActiveObjectOrGroup(),
            matrix = activeObject.getMatrix(),
            snappingService = layoutController.snappingService;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        renderer.renderGuides( snappingService.getSnappedGuides() );
        ctx.globalAlpha = 1;

        // frame move
        if (isMoveInProgress && layoutController.scope.layout.viewState.gridInfoVisible) {
            var objectCoords = activeObject.getCoordsInModelSpace();
            var moveX = parseFloat((objectCoords.x / 72).toFixed(4));
            var moveY = parseFloat((objectCoords.y / 72).toFixed(4));

            var boxWidth = 90;

            if (moveX > 1000 || moveY > 1000 || moveX < -1000 || moveY < -1000) {
                boxWidth = 110;
            } else if (moveX > 100 || moveY > 100 || moveX < -100 || moveY < -100) {
                boxWidth = 104;
            } else if (moveX > 10 || moveY > 10 || moveX < -10 || moveY < -10) {
                boxWidth = 97;
            }

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = settings.rotateOrangeStyle;
            var valueBox = new fabric.Rect({
                width: boxWidth, height: 46, left: mousePosInElementSpace.x + 10, top: mousePosInElementSpace.y + 10, angle: 0, rx: 3, ry: 3,
                fill: '#b3b3b3'
            });
            valueBox.render(ctx);
            var moveXValue = 'X: ' + moveX + ' in';
            var moveYValue = 'Y: ' + moveY + ' in';

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.font = '13px Arial';
            ctx.fillText(moveXValue, mousePosInElementSpace.x + 18, mousePosInElementSpace.y + 28);
            ctx.fillText(moveYValue, mousePosInElementSpace.x + 18, mousePosInElementSpace.y + 48);
        }
        // frame resize
        else if (isResizeInProgress && layoutController.scope.layout.viewState.frameInfoVisible) {
            var objectCoords = activeObject.getCoordsInModelSpace();
            var resizeWidth = parseFloat((objectCoords.width / 72).toFixed(4));
            var resizeHeight = parseFloat((objectCoords.height / 72).toFixed(4));

            var boxWidth = 90;

            if (resizeWidth > 1000 || resizeHeight > 1000) {
                boxWidth = 110;
            } else if (resizeWidth > 100 || resizeHeight > 100) {
                boxWidth = 104;
            } else if (resizeWidth > 10 || resizeHeight > 10) {
                boxWidth = 97;
            }

            ctx.fillStyle = settings.rotateOrangeStyle;
            var valueBoxPos = matrix.transformPoint(activeObject.width, activeObject.height);
            var valueBox = new fabric.Rect({
                width: boxWidth, height: 46, left: valueBoxPos.x + 10, top: valueBoxPos.y + 10, angle: 0, rx: 3, ry: 3,
                fill: settings.rotateBlueStyle
            });
            valueBox.render(ctx);

            var resizeWidthValue = 'W: ' + resizeWidth + ' in';
            var resizeHeightValue = 'H: ' + resizeHeight + ' in';

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.font = '13px Arial';
            ctx.fillText(resizeWidthValue, valueBoxPos.x + 18, valueBoxPos.y + 28);
            ctx.fillText(resizeHeightValue, valueBoxPos.x + 18, valueBoxPos.y + 48);
        }
        // frame rotate
        else if (isRotateInProgress && layoutController.scope.layout.viewState.frameInfoVisible) {
            var objectCoords = activeObject.getCoordsInModelSpace(),
                fullWidth = objectCoords.width,
                halfWidth = objectCoords.width / 2,
                fullHeight = objectCoords.height,
                halfHeight = objectCoords.height / 2;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = settings.rotateOrangeStyle;
            var valueBoxPos = matrix.transformPoint(objectCoords.width, objectCoords.height / 2);
            var valueBox = new fabric.Rect({
                width: 40, height: 30, left: mousePosInElementSpace.x + 10, top: mousePosInElementSpace.y + 10, angle: 0, rx: 3, ry: 3,
                fill: settings.rotateBlueStyle
            });
            valueBox.render(ctx);

            var rotationValue = normalizeAngle360(activeObject.angle.toFixed(0));
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.font = '13px Arial';
            ctx.fillText(rotationValue + String.fromCharCode(176), mousePosInElementSpace.x + 31, mousePosInElementSpace.y + 30);

            var globalMatrix = activeObject.getGlobalMatrix();
            ctx.setTransform(globalMatrix.a, globalMatrix.b, globalMatrix.c, globalMatrix.d, globalMatrix.tx, globalMatrix.ty);

            // container to clip angled line going outside of frame
            ctx.beginPath();
            ctx.rect(0, 0, objectCoords.width, fullHeight);
            ctx.clip();

            ctx.strokeStyle = settings.rotateBlueStyle;
            ctx.lineWidth = 3;

            // horizontal line - angled from user perspective
            ctx.beginPath();
            ctx.moveTo(halfWidth, halfHeight);
            ctx.lineTo(fullWidth, halfHeight);
            ctx.stroke();

            // angled line - horizontal from user perspective
            var horizontalLineLength = fullWidth - halfWidth;
            var verticalLineLength = halfHeight;

            if (horizontalLineLength < 0) {
                horizontalLineLength *= -1;
            }

            if (verticalLineLength < 0) {
                verticalLineLength *= -1;
            }

            var angleLineLength = Math.sqrt(Math.pow(horizontalLineLength, 2) + Math.pow(verticalLineLength, 2));
            var objectRightCenterAngled = {};
            objectRightCenterAngled.x = halfWidth + angleLineLength * Math.cos(Math.PI * rotationValue / 180);
            objectRightCenterAngled.y = halfHeight + angleLineLength * Math.sin(Math.PI * rotationValue / 180) * -1;

            ctx.beginPath();
            ctx.moveTo(halfWidth, halfHeight);
            ctx.lineTo(objectRightCenterAngled.x, objectRightCenterAngled.y);
            ctx.stroke();

            // angle arc
            var rotationValueInRadians = rotationValue * Math.PI / 180 * -1;
            var anticlockwise = (rotationValue > 0) ? true : false;
            ctx.beginPath();
            ctx.arc(halfWidth, halfHeight, 50, 0, rotationValueInRadians, anticlockwise);
            ctx.stroke();
        }

        ctx.restore();
    };

    var minDim,
        currentGap;

    function normalizeAngle(angle) {
        while (angle >  180) angle -= 360;
        while (angle < -180) angle += 360;
        return angle;
    }

    function normalizeAngle360(angle) {
        if (angle < 0) {
            angle = parseInt(angle, 10) + 360;
        }

        return angle;
    }

    function findControl(e) {
        var activeObject = canvas.getActiveObjectOrGroup(),
            objectCoords = activeObject.getCoordsInModelSpace(),
            matrix = new PACE.Element(objectCoords).getMatrix(),
            pointer = canvas.getPointer(e),
            pointerInModelSpace = new PACE.Point(pointer.x, pointer.y).toModelSpace(canvas);

        matrix.invert();
        var pointerInElementSpace = matrix.transformPoint(pointerInModelSpace.x, pointerInModelSpace.y);

        var s8 = 8 / canvas.scale,
            s12 = 12 / canvas.scale,
            s16 = 16 / canvas.scale,
            width = objectCoords.width,
            height = objectCoords.height,
            coords = [
                //rotation hot rects
                [-s12, -s12],
                [width + s12, -s12],
                [width + s12, height + s12],
                [-s12, height + s12],
            ],
            n = coords.length;

        for (var i = 0; i < n; i++) {
            var r = new PACE.Rect({ x:coords[i][0] - s8, y:coords[i][1] - s8, width:s16, height:s16 });
            if (r.containsPoint(pointerInElementSpace.x, pointerInElementSpace.y)) {
                return i;
            }
        }

        return -1;
    }

    function onBeforeMouseDown(e) {
        var canvas = renderer.canvas,
            activeObject = canvas.getActiveObjectOrGroup(),
            control = findControl(e);

        if (!activeObject) return;

        if (activeObject.type==='group') {
            minDim = _.min(_.map(activeObject.getObjects(), function(o) {
                return Math.min(o.element.width, o.element.height);
            }));
            activeObject.minScale = (MIN_EDGE_LENGTH * 72) / minDim;
        } else {
            activeObject.minScale = null
        }

        var pointer = canvas.getPointer(e);
        var targetCorner = activeObject._findTargetCorner(pointer),
            middleCorners = { 'mt':'tr', 'mr':'br', 'mb':'br', 'ml':'bl' },
            corner = middleCorners[targetCorner];

        mousePosInElementSpace = pointer;

        if (control !== -1) {
            //rotate frame
            isSnappingOn = !e.shiftKey;
            canvas.upperCanvasEl.addEventListener('mousemove', onRotateMouseMove);
            canvas.upperCanvasEl.addEventListener('mouseup', onRotateMouseUp);
            isRotateInProgress = true;
            canvas.preventMouseDown = true;
            activeObject.forceCorner = 'mtr';
            canvas._beforeTransform(e, activeObject);
            canvas._setupCurrentTransform(e, activeObject);
        } else {
            if (!targetCorner && !corner) {
                isMoveInProgress = true;
            } else {
                isResizeInProgress = true;
            }

            if (corner) {
                activeObject.forceCorner = corner;
                activeObject.centeredScaling = true;
                activeObject.lockUniScaling = true;
            } else {
                activeObject.centeredScaling = false;
                if (activeObject.type === 'group') {
                    activeObject.lockUniScaling = true;
                }
            }

            currentGap = new PACE.Elements(layoutController.selectedElements).getGapSpacing() || PACE.AppConstants.DEFAULT_FIXED_SPACING;

            canvas.preventMouseDown = false;
        }
    }

    function onCanvasMouseMove(e) {
        if (isMoveInProgress) {
            var pointer = canvas.getPointer(e);
            mousePosInElementSpace = pointer;
        }

        if (canvas.preventMouseDown) {
            return;
        }

        var control = findControl(e),
            activeObject = canvas.getActiveObjectOrGroup(),
            objectCoords = activeObject.getCoordsInModelSpace();

        if (control !== -1) {
            var idx = Math.round(objectCoords.rotation / 90),
                cursors = frameRotateCursors;
            canvas.defaultCursor = cursors[((control) + idx) % 4];
            canvas.hoverCursor = cursors[((control) + idx) % 4];
        } else {
            canvas.defaultCursor = 'default';
            canvas.hoverCursor = 'default';
        }
    }

    function onCanvasMouseUp(e) {
        isMoveInProgress = false;
        isResizeInProgress = false;
    }

    function onRotateMouseMove(e) {
        isSnappingOn = !e.shiftKey;
        var pointer = canvas.getPointer(e);
        mousePosInElementSpace = pointer;
    }

    function onRotateMouseUp(e) {
        canvas.upperCanvasEl.removeEventListener('mousemove', onRotateMouseMove);
        canvas.upperCanvasEl.removeEventListener('mouseup', onRotateMouseUp);
        isRotateInProgress = false;

        var activeObject = canvas.getActiveObjectOrGroup();
        if (activeObject)
            activeObject.forceCorner = false;
        canvas.__onMouseUp(e);
        canvas.preventMouseDown = false;
    }

    this.beginEdit = function() {
        var canvas = renderer.canvas,
            activeObject = canvas.getActiveObjectOrGroup(),
            element = activeObject.element;

        canvas.uniScaleTransform = true;
        canvas.snappingService = layoutController.snappingService;
        canvas.on('before:mousedown', onBeforeMouseDown);
        canvas.on('object:scaling', this.onObjectScaled);
        canvas.on('object:modified', this.onObjectModified);
        canvas.on('object:moving', this.onMoving);
        canvas.on('object:rotating', this.onObjectRotating);
        canvas.on('after:render', this.onRender);
        canvas.on('mouse:up', this.onMouseUp);
        canvas.on('mouse:down', this.onMouseDown);
        canvas.upperCanvasEl.addEventListener('mousemove', onCanvasMouseMove);
        canvas.upperCanvasEl.addEventListener('mouseup', onCanvasMouseUp);
        layoutController.snappingService.beginSnapping(layoutController);
        canvas.renderAll();
    };

    this.endEdit = function() {
        var canvas = renderer.canvas;
        isSnappingOn = true;
        canvas.snappingService = undefined;
        canvas.uniScaleTransform = false;
        canvas.off('before:mousedown', onBeforeMouseDown);
        canvas.off('object:scale-equally', this.onObjectScaled);
        canvas.off('object:modified', this.onObjectModified);
        canvas.off('object:moving', this.onMoving);
        canvas.off('object:rotating', this.onObjectRotating);
        canvas.off('after:render', this.onRender);
        canvas.off('mouse:up', this.onMouseUp);
        canvas.off('mouse:down', this.onMouseDown);
        canvas.upperCanvasEl.removeEventListener('mousemove', onCanvasMouseMove);
        canvas.upperCanvasEl.removeEventListener('mouseup', onCanvasMouseUp);
        canvas.upperCanvasEl.removeEventListener('mousemove', onRotateMouseMove);
        canvas.upperCanvasEl.removeEventListener('mouseup', onRotateMouseUp);
        layoutController.snappingService.endSnapping();

        canvas.preventMouseDown = false;

        canvas.getSelectionContext().clearRect(0,0,canvas.width, canvas.height);
    };

};
