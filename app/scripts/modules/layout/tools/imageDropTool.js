PACE.ImageDropTool = function(layoutController) {
    "use strict";

    var settings = {
        margin: 50,
        fillStyle: 'rgba(102, 204, 255, 0.2)',
        swapFillStyle: 'rgba(119, 210, 246, 0.5)',
        overlayFillStyle: 'rgba(0, 0, 0, 0.5)'
    };

    var imageAddIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAANCAYAAADrEz3JAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAXZJREFUeNrcVjFOwzAUTQpLR1dCgqVDGBl9hXRjzRXgCOUI4QjtETqz5QrtFTqwgFTJ2cqEzLf0v3gYO3GASBVPenJiP7v+8f/Pza21mYcL4gvxjPhOvCIeshPHeaBvykFk3E5/+RsFt3uvX8FYBpo2sIb23ttv67kT8Ti3XzEPaIZQ4PdXNoyGqECnIjpD1KKbjHziZeQZkTNnxAfWGT4xxDVoFzy+lXVz98W5LgSXxCd4vyW+wrurl+fEQBpIix1vQFARN7wxP3g3b0285w0bDtRPO8PtzB3L0Q7DMTGlJCVq4oqfVSC1QnMbGFOBucKSx/TkB8Wcqq+4dV/20evrwxoMoQs7MRQXyNvAQFL1S3aWPbjR8o9rsEX7veH8S60Rk2i5Yq3Ws1wVsdiQZbc9p/KpG8l+a8hrpNRMV40UYMN9NbKVNcYKxGHTU8QSiAau4I5QXiAl6O5gf+VYgWjYYGys6LgQ64j7hS7OQnT5f/mv9SHAANrEduS0fIaoAAAAAElFTkSuQmCC',
        imageReplaceIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFQAAAAOCAYAAACxfjtQAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAg1JREFUeNrsV91xwjAMdmgXMCOkI6Qj0BHSEegI4YleeAojwAhmBBghjEBGCCOkcU9pv6p2rBDKQw/dfZcLsn7sfLJE1DSNulCWLVbqLj8kGnGg1vD9fqjXPVA14FB1ixjezy0qtibx2B49eu6j818J8jgG8p2BvwPzyffynac90B5IZRnwY2EcdnULTXrd479PbyDGniDJI/HoE0+cEnI1njV6ciWmPwjX2S8dEZ7pS2/YmifSTwEuvcW6RdpiDowNSUrPzKGzFVCSH4yzIF3i2AvmeVYCZoXYmwvXGwd7DLEUGag99j59DX5NgKEpsM3nq/HYxoG9fGLi6NxDZEV36KWiCWPkMGBtRux7g3sS71+by6vHtpIEmLDDzG94mDFt6OAoyRk8Qx8kFZa6ppLdUkM6s7JPBn4gDXmmX8Qgqi5ZA/gLuC7yk6cp1aDnJX8CNKx0+0o+o7Vd6RbMNh2wfwN5drlae/XoYGbfHBVdoTxfiZ328t852DUNMG5Lek1luBPG7hrXyfH7GmImgpFKUdzf1wM1FamMZSiyp2CMubQpKUGziJFF4KOEpqiAcb74WtKU+GAe9eCasqCncYwuHEMbXczsM2AVjlcLuFutvNB7A/ei9VW0qNmI54qj8XTzG9yhe88YMwsM9noAQ32y6Rn/NozNpcO+EMSZ87+e+cjO/Z8ER7pKavQhwADZ48rmvDlt4gAAAABJRU5ErkJggg==';

    var injector = angular.element('body').injector(),
        UndoService = injector.get('UndoService'),
        TemplateService = injector.get('TemplateService'),
        DataTransferService = injector.get('DataTransferService');

    var addIcon = new Image();
    addIcon.src = imageAddIcon;

    var replaceIcon = new Image();
    replaceIcon.src = imageReplaceIcon;

    var dropTarget = null,
        dropMode,
        prevDrawFn,
        currentDrawFn,
        singleImage,
        spreadHasEmptyFrames,
        spreadHasImageElements;

    function findTarget(renderer, e) {
        //console.log('findTarget', e.e)
        var mousePos = renderer.canvas.getPointer(e);
        var objects = renderer.canvas.getObjects();
        for (var i = objects.length - 1; i >= 0; i--) {
            var object = objects[i],
                m = object.getGlobalMatrix();
            m.invert();
            var localMousePos = m.transformPoint(mousePos.x, mousePos.y);

            if (object.element.type==='ImageElement' && localMousePos.x>=0 && localMousePos.y>=0 &&
                localMousePos.x<=object.width && localMousePos.y<=object.height) {
                return object;
            }
        }
        return null;
    }

    function isEmptyFrame(el) {
        return el.type==='ImageElement' && !el.imageFile;
    }

    function isImageElement(el) {
        return el.type==='ImageElement';
    }

    function hasEmptyFrames(renderer) {
        return _.some(renderer.spread.elements, isEmptyFrame);
    }

    function hasImageElements(renderer) {
        return _.some(renderer.spread.elements, isImageElement);
    }

    function sortFrames(frames) {
        frames.sort(function(f1, f2) {
            var o1 = f1.x + f1.y * 1000;
            var o2 = f2.x + f2.y * 1000;
            return o1 - o2;
        });
        return frames;
    }

    function getEmptyFrames(renderer, e) {
        var page = getPageUnderMouse(renderer, e),
            result = [],
            isSpreadLayout = renderer.spreadInfo.isSpreadLayout();

        if (isSpreadLayout) {
            result = sortFrames( _.filter(renderer.spread.elements, isEmptyFrame) );
        } else if (page) {

            var pages = [page];
            if (renderer.spreadInfo.pages.length===2) {
                pages.push( renderer.spreadInfo.pages[1 - renderer.spreadInfo.pages.indexOf(page)] );
            }

            result = _.reduce(pages, function(frames, page) {
                frames = frames.concat( sortFrames(_.filter(page.getElements(), isEmptyFrame)) );
                return frames;
            }, []);
        }
        if (PACE.filmstripDraggedItems.length < result.length) {
            var mousePos = renderer.canvas.getPointer(e),
                pos = new PACE.Point(mousePos.x, mousePos.y).toModelSpace(renderer.canvas);

            var frameOrder = function(frame) {
                var center = new PACE.Element(frame).getBoundingBox().getCenter();
                return PACE.Point.distance(center, pos);
            };

            var target = _.min(result, frameOrder),
                targetPage = renderer.spreadInfo.getPage(target),
                targetCenter = new PACE.Element(target).getBoundingBox().getCenter();

            var frameOrder3 = function(frame) {
                var center = new PACE.Element(frame).getBoundingBox().getCenter(),
                    page = renderer.spreadInfo.getPage(frame),
                    dx = center.x - targetCenter.x,
                    dy = center.y - targetCenter.y;

                return (Math.abs(page.pageNumber - targetPage.pageNumber) * 1000000) + (Math.abs(dx)) + (Math.abs(dy) * 100);
            };

            result.sort(function(f1, f2) {
                return frameOrder3(f1) - frameOrder3(f2);
            });

            result = result.slice(0, PACE.filmstripDraggedItems.length);
        }
        return result;
    }

    function dropAndFillEmptyFrames(renderer, e, items) {
        var commands = [];

        var frames = getEmptyFrames(renderer, e);
        sortFrames(frames);

        for(var i=0;i<items.length && i<frames.length;i++) {
            var el = frames[i],
                item = items[i];
            var fabricObject = _.findWhere(renderer.canvas.getObjects(), {element:el});
            if (fabricObject) fabricObject.image = new Image();
            commands.push(new PACE.ReplaceContentCommand(el, item.image));
        }
        var macroCmd = new PACE.MacroCommand(commands);
        macroCmd.execute();
        UndoService.pushUndo(macroCmd);

        if (layoutController.selectedElements.length===1 && layoutController.selectedElements[0]===frames[0]) {
            if (layoutController.currentEditor) {
                layoutController.currentEditor.endEdit();
            }
            layoutController.currentEditor = new PACE.ImageEditor(layoutController);
            layoutController.currentEditor.beginEdit();
        }
    }

    function dropItemsOnSpread(renderer, e, items) {
        var canvas = renderer.canvas,
            spread = renderer.spread,
            position = canvas.getPointer(e),
            pages = renderer.spreadInfo.pages,
            page = getPageUnderMouse(renderer, e),
            mode = getMode(renderer, e),
            commands = [],
            autoLayout = true,
            isPngImage = false;

        if (spread.elements.length===0)
            delete spread.template;

        var pageHasEmptyFrames = page && _.some(page.getElements(), isEmptyFrame);

        //if (items.length>1 && pageHasEmptyFrames) {
        if (dropMode.indexOf('frames-')===0) {
            dropAndFillEmptyFrames(renderer, e, items);
            return;
        }

        if (items.length===1 && (/\.(png)$/i).test(items[0].image.filename)) {
            autoLayout = false;
            isPngImage = true;
        }

        if (!autoLayout) {
            mode = 'inPlace';
        }

        if (renderer.layout.layoutSize.coverType) {
            var filmstrip = renderer.layout.bookLayout.filmStrip;

            //find filmstrip items
            var filmstripItems = _.map(items, function(item) {
                return _.findWhere(filmstrip.items, {_id: item._id});
            });

            var coverItems = _.where(filmstrip.items, {inCoverZone:true});

            var coverCmd = new PACE.MoveFilmstripItemsCommand(filmstrip, filmstripItems, coverItems.length);
            coverCmd.execute();
            commands.push(coverCmd);

            coverCmd = new PACE.CoverZoneCommand(filmstripItems, true);
            coverCmd.execute();
            commands.push(coverCmd);

            filmstrip._version = (filmstrip._version || 0) + 1;
        }

        //add elements to spread
        var pos = new PACE.Point(position.x, position.y).toModelSpace(renderer.canvas),
            elements = _.map(items, function(item) {
                var el = {
                    type: 'ImageElement',
                    imageFile: item.image,
                    opacity: 1,
                    rotation: 0
                };

                if (isPngImage) {
                    var dpi = item.image.dpiX || 300;
                    el.imageWidth = el.width = item.image.width * 72/dpi;
                    el.imageHeight = el.height = item.image.height * 72/dpi;
                    el.imageX = 0;
                    el.imageY = 0;
                    el.imageRotation = 0;
                    el.x = pos.x - el.width/2;
                    el.y = pos.y - el.height/2;
                } else {
                    new PACE.FitElementCommand(el, pos, renderer.spread, renderer.layout, mode).execute();
                }
                new PACE.FillFrameCommand(el).execute();
                new PACE.CenterContentCommand(el).execute();

                pos.x += 10;
                pos.y += 10;

                return el;
            });

        var addCmd = new PACE.AddElementsCommand(spread, elements);
        addCmd.execute();
        commands.push(addCmd);

        var txtCmd = new PACE.BringTextElementsToFront(spread);
        txtCmd.execute();
        commands.push( txtCmd );

        if (autoLayout) {
            if (pages.length===1) {
                mode = page.isLeft() ? 'left' : 'right';
            }

            if (renderer.layout.layoutSize.coverType && elements.length===1) {
                var cmd = new PACE.FourSidedBleedCommand(elements[0], mode==='spread' ? renderer.spreadInfo : page);
                cmd.execute();
                commands.push(cmd);
                renderer.renderWithAnimation();
            } else {
                var layoutCmd = new PACE.AutoLayoutSpreadCommand(
                    spread, renderer.layout, layoutController, renderer, mode
                );
                layoutCmd.execute();
                commands.push(layoutCmd);
            }
        } else {

            layoutController.clearSelection();

            if (layoutController.currentRenderer && layoutController.currentRenderer !== renderer) {
                layoutController.currentRenderer.clearSelection();
            }

            layoutController.setCurrentRenderer(renderer);

            renderer.renderWithAnimation(function() {
                layoutController.selectElements( elements, true );
                layoutController.currentRenderer.render();
                if (elements.length===1) {
                    layoutController.currentEditor = new PACE.ImageEditor(layoutController);
                } else {
                    layoutController.currentEditor = new PACE.FrameEditor(layoutController);
                }
                layoutController.currentEditor.beginEdit();
            });

        }

        var macroCmd = new PACE.MacroCommand(commands);
        macroCmd.renderer = renderer;
        UndoService.pushUndo(macroCmd);

        layoutController.scope.$apply();
    }

    function dropAndReplace(renderer, e, items) {
        dropTarget.loaded = false;
        dropTarget.loading = false;
        dropTarget.hiResImageLoaded = false;
        dropTarget.hiResImageLoading = false;

        var isEmptyFrame = !dropTarget.element.imageFile;

        if (isEmptyFrame) {
            //hack to force image transition
            dropTarget.image = new Image();
        }
        var cmd = new PACE.ReplaceContentCommand(dropTarget.element, items[0].image);
        //layoutController.execCommand(cmd);
        cmd.execute();
        UndoService.pushUndo(cmd);

        if (isEmptyFrame && layoutController.selectedElements.length===1 && layoutController.selectedElements[0]===dropTarget.element) {
            if (layoutController.currentEditor) {
                layoutController.currentEditor.endEdit();
            }
            layoutController.currentEditor = new PACE.ImageEditor(layoutController);
            layoutController.currentEditor.beginEdit();
        }
    }

    function getMode(renderer, e) {
        DataTransferService.setDetailClientXY(e);

        if (!renderer.layout.layoutSize.allowSinglePageLayouts) return 'spread';

        var canvas = renderer.canvas,
            m = settings.margin,
            pages = renderer.spreadInfo.pages,
            mousePos = canvas.getPointer(e),
            rects = _.map(pages, function(p) {
                return { mode: (p.isLeft() ? 'left' : 'right'), rect: p.getBleedRect().toCanvasSpace(canvas) };
            });

        if (pages.length===2) {
            var spreadBleed = renderer.spreadInfo.getBleedRect().toCanvasSpace(canvas),
                center = spreadBleed.getCenter(),
                rect = new PACE.Rect({x:center.x - m, y:spreadBleed.y, width: m * 2, height: spreadBleed.height});
            rects.unshift( {mode: 'spread', rect: rect} );
        }

        var rect = _.find(rects, function(r) { return r.rect.containsPoint(mousePos.x, mousePos.y); } );
        return rect ? rect.mode : 'spread';
    }

    function clearCanvas(renderer) {
        var canvas = renderer.canvas,
            ctx = canvas.getSelectionContext();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawEmptyFramesOverlay(renderer, e) {
        var canvas = renderer.canvas,
            ctx = canvas.getSelectionContext();

        var emptyFrames = getEmptyFrames(renderer, e);
        if (emptyFrames.length>0) {
            dropMode = 'frames-';
            var targets = _.map(emptyFrames, function(el) {
                dropMode += el._id;
                return _.findWhere(renderer.canvas.getObjects(), {element:el});
            });
            return function(t) {
                ctx.save();
                _.each(targets, function(target) {
                    var m = target.getGlobalMatrix();
                    ctx.setTransform(m.a, m.b, m.c, m.d, m.tx, m.ty);
                    ctx.globalAlpha = t;
                    ctx.fillStyle = settings.swapFillStyle;
                    ctx.fillRect(0, 0, target.width, target.height);
                });
                ctx.restore();
            };
        }
    }

    function drawAddReplaceOverlay(renderer, e) {
        var canvas = renderer.canvas,
            ctx = canvas.getSelectionContext();

        var target = findTarget(renderer, e);
        dropTarget = target;
        if (!target) {
            dropMode = null;
            return null;
        }

        var isEmptyFrame = !target.element.imageFile;

        var matrix = target.getGlobalMatrix(),
            midY =  target.height*target.scaleY/2,
            mid1 = matrix.transformPoint(target.width/2, target.height*0.25),
            mid2 = matrix.transformPoint(target.width/2, target.height*0.75),
            topLeft = matrix.transformPoint(0,0);

        matrix.invert();
        var mousePos = canvas.getPointer(e);
        mousePos = matrix.transformPoint(mousePos.x, mousePos.y);

        var replaceMode = (isEmptyFrame || mousePos.y < target.height/2);
        dropMode = (replaceMode ? 'replace-' : 'add-') + target.element._id;

        return function(t) {
            ctx.save();
            ctx.setTransform(1,0,0,1,0,0);
            ctx.translate(topLeft.x, topLeft.y);
            ctx.rotate(target.angle * Math.PI/180);

            ctx.globalAlpha = t;

            if (isEmptyFrame) {
                ctx.fillStyle = settings.swapFillStyle;
                ctx.fillRect(0, 0, target.width*target.scaleX, target.height*target.scaleY);
            } else {
                ctx.fillStyle = settings.overlayFillStyle;
                ctx.fillRect(0, (replaceMode ? midY : 0), target.width*target.scaleX, midY);

                ctx.fillStyle = settings.swapFillStyle;
                ctx.fillRect(0, (replaceMode ? 0 : midY), target.width*target.scaleX, midY);

                ctx.setTransform(1,0,0,1,0,0);
                ctx.drawImage(replaceIcon, Math.round(mid1.x - replaceIcon.width/2), Math.round(mid1.y - replaceIcon.height/2));
                ctx.drawImage(addIcon, Math.round(mid2.x - addIcon.width/2), Math.round(mid2.y - addIcon.height/2));
            }

            ctx.restore();
        };
    }

    function drawPageOverlay(renderer, e, page) {
        var canvas = renderer.canvas,
            ctx = canvas.getSelectionContext(),
            rect;

        if (page) {
            rect = page.getBleedRect().toCanvasSpace(canvas).round();
            dropMode = 'page';
        } else {
            var mode = getMode(renderer, e);

            if (renderer.spread.numPages === 1 &&
                ((renderer.spread.pageNumber === 1 && mode!=='right') ||
                (renderer.spread.pageNumber !== 1 && mode!=='left'))) {
                return;
            }

            var bounds = _.map(
                renderer.spreadInfo.pages,
                function (page) {
                    return page.getBleedRect();
                }
            );

            switch (mode) {
                case 'left':
                    rect = bounds[0];
                    break;
                case 'right':
                    if (bounds.length > 1)
                        rect = bounds[1];
                    else rect = bounds[0];
                    break;
                default:
                    if (bounds.length > 1)
                        rect = bounds[0].union(bounds[1]);
                    else rect = bounds[0];
                    break;
            }

            dropMode = 'spread-' + mode;
            rect = rect.toCanvasSpace(canvas).round();
        }

        return function(t) {
            ctx.save();
            ctx.globalAlpha = t;
            ctx.fillStyle = settings.fillStyle;
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            ctx.restore();
        };
    }

    function getPageUnderMouse(renderer, e) {
        var canvas = renderer.canvas,
            pages = renderer.spreadInfo.pages,
            mousePos = canvas.getPointer(e);

        for (var i = pages.length - 1; i >= 0; i--) {
            var rect = pages[i].getBleedRect().toCanvasSpace(canvas);
            if (rect.containsPoint(mousePos.x, mousePos.y)) {
                return pages[i];
            }
        }
        return null;
    }

    function isPageEmpty(spread, page) {
        var rect = page.getBleedRect();
        for (var i = 0; i < spread.elements.length; i++) {
            var elRect = new PACE.Element(spread.elements[i]).getBoundingBox();
            if (rect.intersects(elRect)) {
                return false;
            }
        }
        return true;
    }

    function doTransition(renderer, drawFn) {
        prevDrawFn = currentDrawFn;
        currentDrawFn = drawFn;

        fabric.util.animate({
            startValue: 0,
            endValue: 1,
            duration: 300,
            onChange: function(value) {
                clearCanvas(renderer);
                if (prevDrawFn) prevDrawFn(1 - value);
                if (currentDrawFn) currentDrawFn(value);
            }
        });
    }

    function getDraggedImages(e) {
        var dt = DataTransferService.getDataTransfer(e);
        var items = JSON.parse(dt.getData("text/x-pace-filmstrip-items"));
        items = _.filter(items, function(item) {
            return item.image.status!=='Rejected' &&
                item.image.status!=='Cancelled';
        });

        items = _.sortBy(items, 'clickTime');
        return items;
    }

    this.onDragEnter = function(renderer, e) {
        var dt = DataTransferService.getDataTransfer(e);
        singleImage = PACE.utils.containsDragType(dt.types, 'text/x-pace-filmstrip-single-item');
        spreadHasEmptyFrames = hasEmptyFrames(renderer);
        spreadHasImageElements = hasImageElements(renderer);
    };

    this.onDragOver = function(renderer, e) {
        var prevDropMode = dropMode,
            drawFn;

        if (spreadHasImageElements && (singleImage || spreadHasEmptyFrames)) {
            var page = getPageUnderMouse(renderer, e),
                target = findTarget(renderer, e),
                pageHasEmptyFrames = page && _.some(page.getElements(), isEmptyFrame),
                isTargetEmpty = target && isEmptyFrame(target.element);

            if (pageHasEmptyFrames && (!target || isTargetEmpty) ) {
                drawFn = drawEmptyFramesOverlay(renderer, e);
            } else if (target) {
                drawFn = drawAddReplaceOverlay(renderer, e);
            } else {
                drawFn = drawPageOverlay(renderer, e);
            }
        } else {
            drawFn = drawPageOverlay(renderer, e);
        }

        if (dropMode!==prevDropMode) {
            doTransition(renderer, drawFn);
        }
    };

    this.onDragLeave = function(renderer, e) {
        dropMode = null;
        doTransition(renderer, null);
    };

    this.onDrop = function(renderer, e) {
        var items = getDraggedImages(e);
        clearCanvas(renderer);

        if (dropMode && dropMode.indexOf('replace')===0) {
            dropAndReplace(renderer, e, items);
        } else {
            dropItemsOnSpread(renderer, e, items);
        }
        layoutController.fireEvent('layout:images-dropped');
        layoutController.fireEvent('layout:layout-changed');
    };

};
