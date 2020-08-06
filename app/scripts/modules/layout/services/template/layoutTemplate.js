'use strict';

angular.module('pace.layout')
    .constant('layoutTemplateSettings', {
        templateType: 'GridLayoutTemplate',
    
        // set of allowed proportions of frames
        allProps: [ 2/3, 3/2, 1/1 ],
    
        // chunk min and max size
        countMin: 2,
        countMax: 3,
    
        tolerance: 0.01,
    
        validationRetries: 5,
    
        mergeToTarget: true,
        mergeToTargetErrorChance: 0.2,
    
        // merge modes available in a single merging step
        mergeModes: ['HORIZONTAL', 'VERTICAL'],
        // the way of merging a whole template, e.g.
        // randomizing in each step of merging or trying
        // to fit to target
        templateMergingModes: ['random', 'fit-target', 'single-line', 'single-line', 'horizontal', 'vertical'],
        defaultMergingMode: 'fit-target'
    })

    /**
     * Service for generating random GridLayoutTemplates.
     *
     * Note: proportion is a width to height ratio.
     */
    .service('LayoutTemplateService', [
        '_', 'layoutTemplateSettings', 'ValidateTemplateService',
        function (_, layoutTemplateSettings, ValidateTemplateService) {
            var that = this,
                settings = layoutTemplateSettings,
                
                currProps = settings.allProps,
                
                // Checks whether the two given proportions fits.
                // Returns true is both are 'horizontal', 'vertical' or
                // 'square'. 
                fits = function (p1, p2) {
                    return p1 >= 1 && p2 >= 1 || p1 <= 1 && p2 <= 1;
                },
                
                // Maps the array order into array containing
                // arrays of proportions that are allowed for order entries.
                getOrderProps = function (order, props) {
                    return _.map(order, function (o) {
                        var f = _.filter(props, function (p) {
                            return fits(o, p);
                        });
                        
                        if (!_.isEmpty(f)) {
                            return f;
                        } else {
                            throw new Error('unable to find a proportion for ' + o);
                        }
                    });
                },
                
                // returns random element from array
                pickAny = function (arr) {
                    return _.isEmpty(arr) ? undefined : arr[_.random(arr.length - 1)];
                },
                
                splitInHalf = function (arr) {
                    var l = arr.length;
                    return [arr.slice(0, l / 2), arr.slice(l / 2, l)];
                },
                
                // takes a random prefix chunk from the given array and
                // splits the arr into two arrays - prefix and the rest.
                takeChunk = function (arr) {
                    if (_.isEmpty(arr)) {
                        return [];
                    } else {
                        var r = _.random(settings.countMin, Math.min(settings.countMax, arr.length));
                        return [arr.slice(0, r), arr.slice(r, arr.length)];
                    }
                },
                
                getNewTemplate = function (prop, numCells, scheme, rows) {
                    return {
                        type: settings.templateType,
                        desiredProportion: prop,
                        numEffectiveCells: numCells,
                        scheme: scheme,
                        rows: rows
                    };
                },
                
                getSingleTemplate = function (prop, order) {
                    return getNewTemplate(
                        prop, 1,
                        {
                            nCols: 1, nRows: 1,
                            rowHeights: [100],
                            colWidths: [100]
                        },
                        [
                            { cells: [ { rowSpan: 1, colSpan: 1, order: order } ] }
                        ]
                    );
                },
                
                getLevels = function (arr) {
                    var res = [0],
                        acc = 0;
                    
                    for (var i = 0; i < arr.length; i++) {
                        acc += arr[i];
                        res.push(acc);
                    }
                    
                    return res;
                },
                
                unique = function (arr) {
                    var contains = function(arr, value) {
                        return _.some(arr, function(item) {
                            return item - settings.tolerance < value &&
                                item + settings.tolerance > value;
                        });
                    };
                    
                    return _.reduce(arr, function (res, el) {
                        if (!contains(res, el)) {
                            return res.concat(el);
                        }
                        else {
                            return res;
                        }
                    }, []);
                },
                
                mergeLevels = function (arr1, arr2) {
                    var l1 = getLevels(arr1),
                        l2 = getLevels(arr2),
                        sorted = unique(l1.concat(l2).sort(function (a, b) {
                            return a - b;
                        })),
                        dims = [];

                    for (var i = 1; i < sorted.length; i++) {
                        dims.push(sorted[i] - sorted[i - 1]);
                    }

                    return dims;
                },
                
                // Translates the 'index' from the 'oldDimens' to the 'newDimens'.
                getNewIndex = function (oldDimens, newDimens, index) {
                    var val = 0, prefixNew = 0, i,
                        lt = function (a, b) {
                            return a - settings.tolerance < b + settings.tolerance;
                        };
                    
                    for (i = 0; i < index; i++) {
                        val += oldDimens[i];
                    }
                    
                    for (i = 0; i < newDimens.length; i++) {
                        if (lt(val, prefixNew)) {
                            return i;
                        }
                        
                        prefixNew += newDimens[i];
                    }
                    
                    if (lt(val, prefixNew)) {
                        return newDimens.length;
                    }
                    else {
                        return index;
                    }
                },
                
                // Translates old rows into new rows, i.e. 'oldRows' are defined in the
                // space of 'oldDimens' and they are translated to the space of 'newDimens'
                // plus the column offset is being applied.
                //
                // Call for side effect on 'newRows' only.
                translateRows = function (oldRows, newRows, oldDimens, newDimens, colOffset) {
                    if (_.isUndefined(colOffset)) {
                        colOffset = 0;
                    }
                    
                    for (var r = 0; r < oldRows.length; r++) {
                        var row = oldRows[r],
                            
                            newR = getNewIndex(oldDimens, newDimens, r);
                        
                        for (var c = 0; c < row.cells.length; c++) {
                            var cell = row.cells[c];
                            
                            if (_.isUndefined(newRows[newR])) {
                                newRows[newR] = { cells: [] };
                            }
                            
                            if (!_.isUndefined(cell) && !_.isNull(cell)) {
                                if (cell.rowSpan > 0) {
                                    var span = getNewIndex(oldDimens, newDimens, r + cell.rowSpan) - newR;

                                    newRows[newR].cells[c + colOffset] = {
                                        colSpan: cell.colSpan,
                                        rowSpan: span,
                                        order: cell.order
                                    };
                                } else {
                                    newRows[newR].cells[c + colOffset] = {
                                        colSpan: 0,
                                        rowSpan: 0
                                    };
                                }
                            }
                        }
                    }
                },
                
                translateColumns = function (oldRows, newRows, oldDimens, newDimens, rowOffset) {
                    if (_.isUndefined(rowOffset)) {
                        rowOffset = 0;
                    }
                    
                    for (var r = 0; r < oldRows.length; r++) {
                        var row = oldRows[r];
                        
                        for (var c = 0; c < row.cells.length; c++) {
                            var cell = row.cells[c],
                                newC = getNewIndex(oldDimens, newDimens, c);
                            
                            if (_.isUndefined(newRows[r + rowOffset])) {
                                newRows[r + rowOffset] = { cells: [] };
                            }
                            
                            if (!_.isUndefined(cell) && !_.isNull(cell)) {
                                if (cell.colSpan > 0) {
                                    var span = getNewIndex(oldDimens, newDimens, c + cell.colSpan) - newC;

                                    newRows[r + rowOffset].cells[newC] = {
                                        colSpan: span,
                                        rowSpan: cell.rowSpan,
                                        order: cell.order
                                    };
                                } else {
                                    newRows[r + rowOffset].cells[newC] = {
                                        colSpan: 0,
                                        rowSpan: 0
                                    };
                                }
                            }
                        }
                    }
                },
                
                mergeTemplatesHorizontally = function (t1, t2) {
                    var nProp = t1.desiredProportion + t2.desiredProportion,
                        nCells = t1.numEffectiveCells + t2.numEffectiveCells,
                        scheme = {}, rows = [];
                    
                    scheme.nCols = t1.scheme.nCols + t2.scheme.nCols;
                    scheme.colWidths = _.map(t1.scheme.colWidths, function (w) {
                        return w * t1.desiredProportion / nProp; 
                    }).concat(_.map(t2.scheme.colWidths, function (w) {
                        return w * t2.desiredProportion / nProp; 
                    }));
                    
                    var mergedRowHeights = mergeLevels(t1.scheme.rowHeights, t2.scheme.rowHeights);
                    scheme.nRows = mergedRowHeights.length;
                    scheme.rowHeights = mergedRowHeights;
                    
                    translateRows(t1.rows, rows, t1.scheme.rowHeights, scheme.rowHeights, 0);
                    translateRows(t2.rows, rows, t2.scheme.rowHeights, scheme.rowHeights, t1.scheme.nCols);
                    
                    return getNewTemplate(nProp, nCells, scheme, rows);
                },
                
                mergeTemplatesVertically = function (t1, t2) {
                    var nProp = (t1.desiredProportion * t2.desiredProportion) /
                                    (t1.desiredProportion + t2.desiredProportion),
                        nCells = t1.numEffectiveCells + t2.numEffectiveCells,
                        scheme = {}, rows = [];
                    
                    scheme.nRows = t1.scheme.nRows + t2.scheme.nRows;
                    scheme.rowHeights = _.map(t1.scheme.rowHeights, function (h) {
                        return h * nProp / t1.desiredProportion; 
                    }).concat(_.map(t2.scheme.rowHeights, function (h) {
                        return h * nProp / t2.desiredProportion;
                    }));
                    
                    var mergedColWidths = mergeLevels(t1.scheme.colWidths, t2.scheme.colWidths);
                    scheme.nCols = mergedColWidths.length;
                    scheme.colWidths = mergedColWidths;
                    
                    translateColumns(t1.rows, rows, t1.scheme.colWidths, scheme.colWidths, 0);
                    translateColumns(t2.rows, rows, t2.scheme.colWidths, scheme.colWidths, t1.scheme.nRows);
                    
                    return getNewTemplate(nProp, nCells, scheme, rows);
                },
                
                // Merges the templates 't1' and 't2' in two randomally picked modes 'VERTICAL'
                // and 'HORIZONTAL' - 't2' goes either to the right (horizontal) or to the bottom
                // (vertical) of 't1'.
                mergeTemplates = function (t1, t2, targetProp, mergingMode) {
                    var mode = pickAny(settings.mergeModes);
                    
                    if (mergingMode === 'fit-target' && !_.isUndefined(targetProp)) {
                        var propSum = t1.desiredProportion + t2.desiredProportion,
                            // proportion after horizontal merge:
                            hMergeProp = Math.abs(propSum - targetProp),
                            // proportion after vertical merge:
                            vMergeProp = Math.abs((t1.desiredProportion * t2.desiredProportion / propSum) - targetProp);
                        
                        // choosing the proportion in a greedy way - always choosing option
                        // that generates rectangle with proportion closer to the target
                        mode = hMergeProp < vMergeProp ? 'HORIZONTAL' : 'VERTICAL';
                        
                        // the greedy algorithm is randomized, s.t. there is no way
                        // to always get very similar layout templates
                        if (Math.random() < settings.mergeToTargetErrorChance) {
                            mode = mode === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL';
                        }
                    } else if (mergingMode === 'single-line' && !_.isUndefined(targetProp)) {
                        if (targetProp >= 1) mode = 'HORIZONTAL';
                        else mode = 'VERTICAL';
                    } else if (mergingMode === 'horizontal') {
                        mode = 'HORIZONTAL';
                    } else if (mergingMode === 'vertical') {
                        mode = 'VERTICAL';
                    }

                    switch (mode) {
                    case 'VERTICAL':
                        return mergeTemplatesVertically(t1, t2);
                    case 'HORIZONTAL':
                        return mergeTemplatesHorizontally(t1, t2);
                    default:
                        throw new Error('Unknown merge mode.');
                    }
                },
                
                // Generates the template of a chunk, by consuming
                // the 'chunk' array one by one and merging the single
                // templates with the 'mergeTemplate' function.
                getChunkTemplate = function (chunk, order, targetProp, mergingMode) {
                    if (_.isEmpty(chunk)) {
                        return {};
                    }

                    return _.reduce(chunk, function (acc, c) {
                        var t = getSingleTemplate(pickAny(c[1]), order.val++);
                        if (_.isNull(acc)) {
                            return t;
                        } else {
                            return mergeTemplates(acc, t, targetProp, mergingMode);
                        }
                    }, null);
                },
                
                // Generates the template. Works as follows:
                //   0. Start with the tempty result template.
                //   1. take a random prefix chunk of 'orderProps' (e.g. first 3 elements).
                //      entries of orderProps are the tuples of image proportion and
                //      a set of allowed proportions for that image.
                //   2. generate template for that chunk obeying the rules of allowed proportions.
                //   3. merge the template of the chunk with the result template (merge either
                //      vertically of horizontally - i.e. the chunk template goes to the right
                //      or bottom).
                //   4. call the function redursively until orderProps is consumed.
                getTemplate = function (resultTemplate, orderProps, order, targetProp, mergingMode) {
                    var tpl = takeChunk(orderProps),
                        chunkTemplate = getChunkTemplate(tpl[0], order, targetProp, mergingMode),
                        merged = !_.isEmpty(resultTemplate) ?
                            mergeTemplates(resultTemplate, chunkTemplate, targetProp, mergingMode) :
                            chunkTemplate;
                    
                    if (_.isEmpty(tpl[1])) {
                        return merged;
                    } else {
                        return getTemplate(merged, tpl[1], order, targetProp, mergingMode);
                    }
                },
                
                // 1. Partitions the 'orderProps' into chunks.
                // 2. Splits the chunks partition into half and recursively trying to merge
                //    the chunks.
                getTemplateOnTree = function (orderProps, targetProp, mergingMode) {
                    var getOrderPartitioned = function (o) {
                            if (!_.isEmpty(o)) {
                                var tpl = takeChunk(o);
                                return [tpl[0]].concat(getOrderPartitioned(tpl[1]));
                            } else return [];
                        },
                        
                        partition = getOrderPartitioned(orderProps),
                        
                        mergeOnTree = function (arr, order) {
                            if (_.isEmpty(arr)) {
                                return {};
                            } else if (arr.length === 1) {
                                return getChunkTemplate(arr[0], order, targetProp, mergingMode);
                            } else if (arr.length === 2) {
                                return mergeTemplates(
                                        getChunkTemplate(arr[0], order, targetProp, mergingMode),
                                        getChunkTemplate(arr[1], order, targetProp, mergingMode),
                                        targetProp, mergingMode);
                            } else {
                                var split = splitInHalf(arr);
                                return mergeTemplates(
                                        mergeOnTree(split[0], order),
                                        mergeOnTree(split[1], order),
                                        targetProp, mergingMode);
                            }
                        };
                    
                    return mergeOnTree(partition, { val: 0 });
                };
            
            this.mergeTemplates = function (t1, t2, targetProp, mergingMode) {
                return mergeTemplates(t1, t2, targetProp, mergingMode);
            };
            
            /**
             * Generates random layout template of 'order.length' elements. Produced
             * template is a 'gridLayoutTemplate'. The template obeys the 'order' rule
             * - i.e. the proportions of frames provided in the 'order' parameters
             * is resembled in the proportions of the frames from the upper left corner.
             *
             * @param order - an array of numbers with the proportions of images that
             * are going to be fit into the template (e.g. [1, 1.5, 0.6])
             *
             * @param allProps - an array of allowed proportions - if provided only
             * frames of proportions from that set will be produced, otherwise
             * the default value from the propLayoutTemplateSettings is taken.
             *
             * @param targetProp - the proportion of target rectangle that the
             * template should fit
             *
             * @param mergingMode {optional} - general way of merging the template - see settings
             *
             * @param layoutSize {optional} - the layoutSize of the target
             */
            this.nextTemplate = function (order, allProps, targetProp, mergingMode, layoutSize) {
                if(_.isUndefined(allProps)) {
                    allProps = currProps;
                }
                
                if (_.isUndefined(mergingMode)) {
                    mergingMode = settings.defaultMergingMode;
                }
                
                if (_.isEmpty(order)) {
                    throw new Error('Order cannot be empty.');
                }

                var template,
                    templates = [];

                for (var i = 0; i < settings.validationRetries; i++) {
                    template = getTemplateOnTree(
                                        _.zip(order, getOrderProps(order, allProps)),
                                        targetProp, mergingMode);
                    
                    if (ValidateTemplateService.validate(template, targetProp, layoutSize)) {
                        return template;
                    }
                    
                    templates.push(template);
                }
                
                //console.log('sorry. after ' + settings.validationRetries + ' trials, returning improper template');
                if (_.isNumber(targetProp)) {
                    return _.min(templates, function (t) {
                        return Math.abs(targetProp - t.desiredProportion);
                    });
                } else return template;
            };
            
            /**
             * Sets the set of allowed proportions. The proportions will be fixed to
             * the given value for all template from now on.
             */
            this.setCurrProps = function (props) {
                if (_.isArray(props) && _.every(props, _.isNumber)) {
                    currProps = props;
                } else throw new Error('Cannot set proportions: ' + props);
            };
        }
    ]);