'use strict';

angular.module('pace.layout')
    .constant('templateToFramesSettings', {
        gridSpacing: 20,
        layoutSpacing: 0.01
    })

    /**
     * For a given GridLayoutTemplate/CustomLayoutTemplate and bounds (e.g. layoutSize)
     * computes set of frames.
     */
    .service('TemplateToFramesService',
        ['_', 'templateToFramesSettings',
        function (_, templateToFramesSettings) {
            var settings = templateToFramesSettings,
                
                subArrSum = function(arr, start, end) {
                    return _.reduce(arr.slice(start, end), function(acc, curr) {
                        return acc + curr;
                    }, 0);
                },
                
                /**
                 * For a given template object and dimensions, returning an array of frames,
                 * where the frame is an object: { x: X, y: Y, width: W, height: H }.
                 * 
                 * @param template Grid template object.
                 * @param width width of the 'canvas'
                 * @param height height of the 'canvas'
                 * @param x0 x-dimension offset
                 * @param y0 y-dimension offset
                 */
                getGridTemplateFrames = function(template, width, height, x0, y0, spacing) {
                    if (spacing && spacing > 0) {
                        width -= (template.scheme.nCols - 1) * spacing;
                        height -= (template.scheme.nRows - 1) * spacing;
                    }
                    
                    if(typeof(spacing) === 'undefined') spacing = settings.layoutSpacing;

                    var getX = function(x, width, height, x0, y0) {
                            return x0 + width * subArrSum(template.scheme.colWidths, 0, x) / 100;
                        },
                        getY = function(y, width, height, x0, y0) {
                            return y0 + height * subArrSum(template.scheme.rowHeights, 0, y) / 100;
                        },
                        getWidth = function(x, span, width, height, x0, y0) {
                            return width * subArrSum(template.scheme.colWidths, x, x + span) / 100;
                        },
                        getHeight = function(y, span, width, height, x0, y0) {
                            return height * subArrSum(template.scheme.rowHeights, y, y + span) / 100;
                        };


                    var prop = width / height,
                        frameOrder = [];

                    if(typeof(template.desiredProportion) !== 'undefined') {
                        if(template.desiredProportion > prop) {
                            var newHeight = width / template.desiredProportion;
                            y0 = y0 + (height - newHeight) / 2;
                            height = newHeight;
                        } else if(template.desiredProportion < prop) {
                            var newWidth = height * template.desiredProportion;
                            x0 = x0 + (width - newWidth) / 2;
                            width = newWidth;
                        }
                    }

                    for(var r = 0; r < template.scheme.nRows; r++) {
                        var row = template.rows[r];
                        if(typeof(row) !== 'undefined') {
                            for(var c = 0; c < template.scheme.nCols; c++) {
                                var cell = row.cells[c];
                                if(!_.isUndefined(cell) && !_.isNull(cell)) {
                                    // cells that are covered by the others (spanned)
                                    // have colSpan == 0 and rowSpan == 0
                                    if(cell.colSpan !== 0 && cell.rowSpan !== 0) {
                                        frameOrder.push([{
                                            x: getX(c, width, height, x0, y0) + c * spacing,
                                            y: getY(r, width, height, x0, y0) + r * spacing,
                                            width: getWidth(c, cell.colSpan, width, height, x0, y0) + (cell.colSpan - 1) * spacing,
                                            height: getHeight(r, cell.rowSpan, width, height, x0, y0) + (cell.rowSpan - 1) * spacing
                                        }, _.isUndefined(cell.order) ? -1 : cell.order]);
                                    }
                                }
                            }
                        }
                    }

                    frameOrder.sort(function (a, b) {
                        return a[1] - b[1];
                    });

                    return _.map(frameOrder, function (a) { return a[0]; });
                },
                
                gridLayoutToFrames = function(template, layoutSize, mode, spacing) {
                    if(typeof(spacing) === 'undefined') spacing = settings.gridSpacing;
                    if(typeof(mode) === 'undefined') mode = 'LeftPage';
                    if(layoutSize.pageOrientation === 'Vertical') {
                        if(mode === 'LeftPage') mode = 'TopPage';
                        else if(mode === 'RightPage') mode = 'BottomPage';
                        else if(mode === 'SpreadHorizontal') mode = 'SpreadVertical';
                    }

                    var w = layoutSize.width,
                        h = layoutSize.height,
                        mI = layoutSize.bleedInside + layoutSize.marginInside,
                        mO = layoutSize.bleedOutside + layoutSize.marginOutside,
                        mT = layoutSize.bleedTop + layoutSize.marginTop,
                        mB = layoutSize.bleedBottom + layoutSize.marginBottom,
                        s = spacing,
                        nCols = template.scheme.nCols,
                        nRows = template.scheme.nRows,

                        fW, fH, fX, fY;

                    switch(mode) {
                        case 'SpreadHorizontal':
                            fW = 2 * (w - mO) - s * (nCols - 1);
                            fH = h - mT - mB - s * (nRows - 1);
                            fX = mB;
                            fY = mT;
                            break;
                        case 'SpreadVertical':
                            fW = w - mT - mB - s * (nCols - 1);
                            fH = 2 * (h - mO) - s * (nRows - 1);
                            fX = mB;
                            fY = mO;
                            break;
                        case 'RightPage':
                            fW = w - mI - mO - s * (nCols -1);
                            fH = h - mT - mB - s * (nRows - 1);
                            fX = w + mI;
                            fY = mT;
                            break;
                        case 'LeftPage':
                            fW = w - mI - mO - s * (nCols - 1);
                            fH = h - mT - mB - s * (nRows - 1);
                            fX = mO;
                            fY = mT;
                            break;
                        case 'TopPage':
                            fW = w - mB - mT - s * (nCols - 1);
                            fH = h - mI - mO - s * (nRows - 1);
                            fX = mB;
                            fY = mO;
                            break;
                        case 'BottomPage':
                            fW = w - mB - mT - s * (nCols - 1);
                            fH = h - mI - mO - s * (nRows - 1);
                            fX = h + mI;
                            fY = mB;
                            break;
                    }

                    return getGridTemplateFrames(template, fW, fH, fX, fY, spacing);
                };

                // customTemplateToFrames = function(template, width, height, x0, y0) {
                //     if(typeof(x0) === 'undefined') x0 = 0;
                //     if(typeof(y0) === 'undefined') y0 = 0;

                //     if(template) {
                //         return _.map(template.frames, function(frame) {
                //             return {
                //                 x: frame.x * width + x0,
                //                 y: frame.y * height + y0,
                //                 width: frame.width * width,
                //                 height: frame.height * height
                //             };
                //         });
                //     } else return [];
                // };

            /**
			 * Generates frames for the template and specific layoutSize.
			 */
            this.getFrames = function(template, layoutSize, pageIndex, totalPages, spacing) {
                var templateToFrames = function(template, pageIndex, mode) {
                    if(typeof(mode) === 'undefined') {
                        mode = 'SpreadHorizontal';
                        if(pageIndex === 1) mode = 'RightPage';
                        else if(pageIndex === totalPages) mode = 'LeftPage';	
                    }

                    var frames = [];

                    if(template) {
                        switch(template.type) {
                            case 'GridLayoutTemplate':
                                frames = gridLayoutToFrames(template, layoutSize, mode, spacing);
                                break;
                            case 'TwoPageLayoutTemplate':
                                frames = templateToFrames(template.left, pageIndex, 'LeftPage', spacing);
                                frames = frames.concat(templateToFrames(template.right, pageIndex + 1, 'RightPage', spacing));
                                break;
                            //case 'CustomLayoutTemplate':
                            //    frames = customTemplateToFrames(template, layoutSize.width, layoutSize.height, spacing);
                            //    break;
                            default:
                                frames = [];
                                break;
                        }
                    }

                    return frames;	
                };

                return templateToFrames(template, pageIndex);				
            };
            
            this.getFramesOfDim = function (template, width, height, x0, y0, spacing) {
                if (template.span === 'full-bleed' && template.numEffectiveCells === 1) {
                    return [{
                        x: x0, y: y0, width: width, height: height
                    }];
                }
                
                switch(template.type) {
                case 'GridLayoutTemplate':
                    return getGridTemplateFrames(template, width, height, x0, y0, spacing);
                //case 'CustomLayoutTemplate':
                //    return customTemplateToFrames(template, width, height, x0, y0);
                default:
                    throw new Error('Don\'t know how to get frames for template of type: ' + template.type);
                }
            };

        }
    ]);