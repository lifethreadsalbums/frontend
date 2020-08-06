(function () {
    'use strict';

    angular.module('pace.layout')
        .constant('recentlyUsedTemplatesSettings', {
            historyPerSpread: 20,
            recentlyUsedSize: 30,
            maxFrames: 25,
        })
        .directive('recentlyUsedTemplates', [
            '_', 'recentlyUsedTemplatesSettings', 'LayoutTemplateService', 'LayoutTemplate', 'QueueRequestService', 'TemplateService',
            '$timeout', 'UndoService', 'MessageService', 'templatePreviewSettings', 'GeomService', '$debounce',
            function (_, recentlyUsedTemplatesSettings, LayoutTemplateService, LayoutTemplate, QueueRequestService, TemplateService,
                $timeout, UndoService, MessageService, templatePreviewSettings, GeomService, $debounce) {
                return {
                    replace: true,
                    restrict: 'E',
                    scope: {
                        currentSpread: '=',
                        savedLayoutTemplates: '=',
                        publicLayoutTemplates: '=',
                        //recentlyUsedLayoutTemplates: '=',
                        templatesHistory: '=',
                        layout: '=',
                        layoutController: '=',
                        control: '=',
                        frameMode: '='
                    },
                    templateUrl: 'views/layout/recentlyUsedTemplates.html',
                    link: function (scope, element, attrs) {

//---------------------------------------------------------------------------------------
//----------------------------------- SCOPE SETUP ---------------------------------------
//---------------------------------------------------------------------------------------
                        // LayoutTypeOptions
                        scope.layoutTypeOptions = [
                            {value: 'public', label: 'Suggested Templates'},
                            {value: 'saved', label: 'My Templates'},
                            {value: 'history', label: 'Recently Used'},
                            //{value: 'latest', label: 'Recently Used'},
                            //{value: 'history', label: 'History'},
                        ];

                        scope.templates = [];
                        scope.selectedNumFrames = 1;
                        scope.selectedLayoutType = 'public';
                        scope.selectedTemplateType = 'page';

                        //calculate preview size;
                        var maxSize = templatePreviewSettings.maxSize * 2,
                            spreadInfo = new PACE.Spread({numPages:2, pageNumber:1}, scope.layout);
                        spreadInfo.padding = 0;
                        var rect = spreadInfo.getCanvasSize(),
                            canvasSize = GeomService.fitRect(rect, {width: maxSize, height: maxSize});

                        scope.previewWidth = Math.round(canvasSize.width);
                        scope.previewHeight = Math.round(canvasSize.height);

//---------------------------------------------------------------------------------------
//-------------------------- FILTERING & TEMPLATES SELECTION ----------------------------
//---------------------------------------------------------------------------------------

                        var generatedTemplates = {};

                        function getTemplateCollection() {
                            var types = {
                                'saved': scope.savedLayoutTemplates,
                                'public': scope.publicLayoutTemplates,
                                'history': scope.templatesHistory[scope.layout.spreads.indexOf(scope.currentSpread)] || []
                            }
                            return types[scope.selectedLayoutType];
                        }

                        function templateOrder(t) {
                            return ((TemplateService.isSinglePageTemplate(t) ? 0 : 1) * 1000) +
                                   (TemplateService.getNumCells(t) * 10000) +
                                   (t.index || 0);
                        }

                        function updateNumFramesOptions(templates) {
                            scope.numFramesOptions = [];
                            var n = scope.selectedTemplateType==='page' ? 12 : 25;

                            var enableItems = scope.selectedLayoutType==='saved',
                                counts;
                            if (enableItems) {
                                counts = _.countBy(templates, TemplateService.getNumCells);
                            }

                            for (var i = 1; i <= n; i++) {
                                var item = {
                                    value: i,
                                    label: i + ' Image' + (i>1 ? 's':''),
                                }
                                if (enableItems) {
                                    item.disabled = !(counts[i]>0);
                                }
                                scope.numFramesOptions.push(item);
                            }
                        }

                        function getGeneratedTemplates() {
                            var key = scope.selectedTemplateType + scope.selectedNumFrames;
                            if (generatedTemplates.hasOwnProperty(key))
                                return generatedTemplates[key];

                            var spread = {numPages:2, pageNumber:1, elements:[]},
                                mode = 'spread',
                                elements = [];

                            for(var i=0;i<scope.selectedNumFrames;i++) {
                                var frame = {
                                    type: 'ImageElement',
                                    x: 0, y: 0, width: 1, height: 1,
                                    rotation: 0, opacity: 1, imageRotation: 0,
                                    imageX: 0, imageY: 0,
                                    imageWidth: 1, imageHeight: 1,
                                    imageFile: { width: 1, height: 1 }
                                };
                                elements.push(frame);
                            }

                            if (scope.selectedTemplateType==='page') {
                                mode = 'left';
                                spread.numPages = 1;
                                spread.pageNumber = 2;
                            } else if (!scope.layout.lps) {
                                spread.pageNumber = 2;
                            }

                            var result = [];
                            for (var i = 0; i < 20; i++) {
                                try {
                                    spread.elements = angular.copy(elements);
                                    new PACE.AutoLayoutSpreadCommand(spread,
                                        scope.layout,
                                        scope.layoutController,
                                        undefined,
                                        mode
                                    ).execute();

                                    result.push(spread.template);
                                } catch(e) {
                                    console.error(e);
                                }
                            }
                            //console.log('generateTemplates', key, result);
                            generatedTemplates[key] = result;
                            return result;
                        }

                        function getFilterHash() {
                            var numElements = scope.currentSpread ?
                                _.where(scope.currentSpread.elements, {type:'ImageElement'}).length : 0;

                            return scope.selectedLayoutType + '-' +
                                scope.selectedTemplateType + '-' +
                                scope.selectedNumFrames + '-' +
                                scope.frameMode + '-' +
                                //numElements + '-' +
                                //(scope.currentSpread ? scope.currentSpread._id : 0);
                                (scope.currentSpread ? scope.currentSpread.lastTemplateMode : '')
                        }

                        function updateTemplates() {
                            if (scope.filterHash===getFilterHash()) return;
                            if (!scope.currentSpread) return;

                            var t = getTemplateCollection();
                            if (!t) return;
                            if (scope.selectedLayoutType==='public') {
                                t = t.concat(getGeneratedTemplates());
                            }

                            if (scope.selectedTemplateType==='page')  {
                                t = _.filter(t, TemplateService.isSinglePageTemplate);
                            } else if (scope.selectedTemplateType==='spread') {
                                t = _.filter(t, _.negate(TemplateService.isSinglePageTemplate));
                            }

                            updateNumFramesOptions(t);

                            //filter by number of frames
                            var numFrames = scope.selectedNumFrames;
                            var spreadInfo = new PACE.Spread(scope.currentSpread, scope.layout);

                            t = _.filter(t, function (item) {
                                var numCells = TemplateService.getNumCells(item);

                                if (item.id) {
                                    var spread = {numPages:2, pageNumber:1, elements:[]},
                                        mode = 'spread';

                                    if (scope.selectedTemplateType==='page') {
                                        mode = 'left';
                                        spread.numPages = 1;
                                        spread.pageNumber = 2;
                                    } else if (!scope.layout.lps) {
                                        spread.pageNumber = 2;
                                    }

                                    new PACE.ApplyTemplateCommand(
                                        item,
                                        mode,
                                        spread,
                                        scope.layout,
                                        null,
                                        null,
                                        PACE.AppConstants.DEFAULT_FIXED_SPACING).execute();
                                }

                                if (item.broken) return false;

                                if (numCells === numFrames && item.type==='GridLayoutTemplate' && numCells===1) {
                                    return item.align==='center';
                                }

                                if (numCells === numFrames && item.type==='TwoPageLayoutTemplate' && numCells===1) return false;

                                return (numCells === numFrames) ||
                                    (recentlyUsedTemplatesSettings.maxFrames === numFrames && numCells>=numFrames);
                            });

                            if (scope.selectedLayoutType==='public') {
                                var result = [],
                                    n = t.length;
                                for (var i = 0; i < n; i++) {
                                    t[i].index = t[i].index || i;

                                    var found = _.find(result, function(item) {
                                        return LayoutTemplate.equals(item, t[i]);
                                    });
                                    if (!found)
                                        result.push(t[i]);
                                }

                                t = result;
                                t.sort(function(t1, t2) {
                                    return templateOrder(t2) - templateOrder(t1);
                                });
                            }
                            if (scope.frameMode==='frame32') {
                                //filter out templates with square frames
                                t = _.filter(t, _.negate(TemplateService.hasSquareFrames));
                            }
                            if (scope.selectedLayoutType==='saved') {
                                t.sort(function(t1, t2) {

                                    var o1 = t1.oldId || t1.id;
                                    var o2 = t2.oldId || t2.id;

                                    return (o1 - o2);
                                });
                            }

                            scope.filterHash = getFilterHash();
                            scope.templates = [];
                            var n = t.length;
                            for(var i=n-1;i>=0;i--) {
                                scope.templates.push( _.clone(t[i]) );
                            }
                            //console.log('updateTemplates', getFilterHash(), 'count=', scope.templates.length, scope.frameMode);
                        }

                        var updateTemplatesDebounced = $debounce(updateTemplates, 250);


//---------------------------------------------------------------------------------------
//--------------------------------- UI ACTIONS ------------------------------------------
//---------------------------------------------------------------------------------------
                        scope.changeSelectedTemplateType = function(value) {
                            scope.selectedTemplateType = value;
                            updateTemplates();
                        };

                        scope.onSelectedLayoutTypeChanged = function() {
                            updateTemplatesDebounced();
                        };

                        scope.saveSelectedTemplate = function() {
                            if (!scope.selectedTemplate) return;
                            var lt = new LayoutTemplate.newLayoutTemplate(scope.selectedTemplate);
                            if (scope.control.pushSavedLayoutTemplate(angular.copy(scope.selectedTemplate))) {
                                lt.$save();
                            }
                        };

                        scope.deleteSelectedTemplate = function() {
                            if (!scope.selectedTemplate) return;
                            MessageService.confirm('Do you really want to delete this template?',
                                function() {
                                    var templates = getTemplateCollection();
                                    var item = _.findWhere(templates, {id:scope.selectedTemplate.id});
                                    if (item) {
                                        var idx = templates.indexOf(item);
                                        templates.splice(idx, 1);
                                        scope.filterHash = null;
                                        updateTemplates();
                                        if (scope.selectedLayoutType==='saved') {
                                            LayoutTemplate.delete({id:scope.selectedTemplate.id});
                                        }
                                        scope.selectedTemplate = null;
                                    }
                                });
                        };

                        scope.onMenuClick = function(template, key) {

                            if (template.id) {
                                template = _.find(scope.savedLayoutTemplates, function(t) { return LayoutTemplate.equals(t, template); });
                            }

                            template.publicTemplate = !template.publicTemplate;
                            template.historyId = _.uniqueId(_.now());

                            var lt = new LayoutTemplate(template);

                            var mergeId = function(t1, t2) {
                                _.extend(t1, _.pick(t2, 'id', 'version'));
                            };

                            lt.$save(function(t) {
                                var hasId = !!template.id;

                                mergeId(template, t);
                                if (template.left && t.left) mergeId(template.left, t.left);
                                if (template.right && t.right) mergeId(template.right, t.right);

                                if (!hasId) scope.control.pushSavedLayoutTemplate(angular.copy(template));
                            });

                        };

                        var templateDropped;

                        scope.onDragEnd = function(template) {
                            if (!templateDropped) {
                                scope.selectedTemplate = template;
                            }
                            templateDropped = false;
                        };

                        scope.onTemplateDrop = function(template, dropClass, e) {
                            var draggedTemplate = JSON.parse(e.dataTransfer.getData("text/x-pace-template")),
                                templates = scope.templates,
                                source = _.findWhere(templates, {id:draggedTemplate.id});

                            if (source) {
                                var destIdx = templates.indexOf(template) + (dropClass==='drop-top' ? 0 : 1),
                                    clonedSource = _.clone(source);

                                templates.splice(destIdx, 0, clonedSource);
                                var idx = templates.indexOf(source);
                                templates.splice(idx, 1);

                                templateDropped = true;
                                scope.selectedTemplate = clonedSource;
                                scope.$apply();

                                var order = [];
                                _.each(templates, function(t, index) {
                                    var item = _.findWhere(scope.savedLayoutTemplates, {id:t.id});
                                    if (item && item.oldId!==index) {
                                        item.oldId = index;
                                        order.push({id:item.id, order:index});
                                    }
                                });
                                LayoutTemplate.saveOrder(order);
                            }
                        };

                        scope.changeNumFrames = function(direction) {
                            var currentIndex;
                            _.find(scope.numFramesOptions, function(item, index){
                                if (item.value === scope.selectedNumFrames) {
                                    currentIndex = index;
                                    return true;
                                };
                            });

                            if (direction === 'prev') {
                                if (scope.numFramesOptions[currentIndex - 1]) {
                                    scope.selectedNumFrames = scope.numFramesOptions[currentIndex - 1].value;
                                }
                            } else if (direction === 'next') {
                                if (scope.numFramesOptions[currentIndex + 1]) {
                                    scope.selectedNumFrames = scope.numFramesOptions[currentIndex + 1].value;
                                }
                            }
                            updateTemplatesDebounced();
                        };

                        // template-preview click handler
                        scope.templateSelected = function (template) {
                            scope.selectedTemplate = template;
                        };

//---------------------------------------------------------------------------------------
//------------------------------- WATCHES & EVENTS --------------------------------------
//---------------------------------------------------------------------------------------

                        scope.$on('layout:layout-loading', function() {
                            scope.templates = [];
                        });

                        scope.$watch('selectedTemplate', function() {
                            scope.control.canSaveTemplate = !!scope.selectedTemplate;
                            scope.control.canDeleteTemplate = scope.selectedTemplate && scope.selectedLayoutType!=='public';
                        });

                        scope.$on('layout:layout-saved', function(e, t) {
                            scope.selectedLayoutType = 'saved';
                            scope.selectedTemplateType = TemplateService.isSinglePageTemplate(t) ? 'page' : 'spread';
                            scope.selectedNumFrames = TemplateService.getNumCells(t);
                            scope.filterHash = null;
                            updateTemplatesDebounced();

                        });

                        scope.$watch('frameMode', function (val, oldVal) {
                            if (val===oldVal) return;
                            updateTemplatesDebounced();
                        });


                        // recently used template logic
                        var justSwitchedToNewSpread = false,
                            ruTemplate = null;

                        scope.$watch('currentSpread', function (newSpread, oldSpread) {
                            justSwitchedToNewSpread = true;
                        });

                        scope.$watch('currentSpread.template', function (newT, oldT) {
                            if (justSwitchedToNewSpread) {
                                // current spread has been changed - change flag and do nothing
                                justSwitchedToNewSpread = false;
                            } else if (!LayoutTemplate.equals(newT, oldT)) {
                                // template has been changed, store it as candidate to
                                // recently used and keep in in the history
                                ruTemplate = newT;

                                if (!_.isEmpty(newT) && _.isEmpty(newT.historyId)) {
                                    scope.control.pushTemplatesHistory(newT);
                                }
                            }

                        }, true);

                        scope.$watch('publicLayoutTemplates', function() {
                            updateTemplatesDebounced();
                        });

                        scope.$watch('savedLayoutTemplates', function(val, oldVal) {
                            if (val===oldVal) return;
                            scope.filterHash = null;
                            updateTemplatesDebounced();
                        });

//---------------------------------------------------------------------------------------
//--------------------------------- HISTORY ETC... --------------------------------------
//---------------------------------------------------------------------------------------

                        // method pushing template to the stack
                        var pushTemplate = function (arr, limit, reorderDuplicates, allowDuplicates, template) {
                            var containsTemplate = function (arr, template) {
                                    return !_.isEmpty(_.find(arr, function (t) {
                                        return LayoutTemplate.equals(template, t);
                                    }));
                                },
                                removeDuplicate = function (arr, t) {
                                    for (var i = 0; i < arr.length; i++) {
                                        if (LayoutTemplate.equals(t, arr[i])) {
                                            arr.splice(i, 1);
                                            return;
                                        }
                                    }
                                };

                            if (reorderDuplicates) removeDuplicate(arr, template);

                            if (allowDuplicates || reorderDuplicates || !containsTemplate(arr, template)) {
                                if (limit >= 0 && arr.length > limit)
                                    arr.shift();
                                arr.push(template);

                                if (scope.selectedLayoutType !== 'public') {
                                    updateTemplatesDebounced();
                                }

                                return true;
                            } else return false;
                        };

                        // method for pushing template to saved collection
                        scope.control.pushSavedLayoutTemplate = function(template) {
                            return pushTemplate(scope.savedLayoutTemplates, -1, false, false, template);
                        };

                        scope.control.pushTemplatesHistory = function (template) {
                            if (!_.isEmpty(template) && !_.isUndefined(scope.currentSpread)) {
                                var index = Math.floor(scope.currentSpread.pageNumber / 2),
                                    historySize = recentlyUsedTemplatesSettings.historyPerSpread,
                                    t = angular.copy(template);

                                if (!_.isArray(scope.templatesHistory[index])) {
                                    scope.templatesHistory[index] = [];
                                }

                                t.historyId = template.historyId = _.uniqueId(_.now());
                                pushTemplate(scope.templatesHistory[index], historySize, false, true, t);
                            }
                        };

                        var applyFromHistory = function (shift) {
                            var index = Math.floor(scope.currentSpread.pageNumber / 2),
                                elementsCount = _.reduce(scope.currentSpread.elements, function (c, e) {
                                  if (e.type === 'ImageElement') return c + 1;
                                  else return c;
                                }, 0),
                                arr = _.filter(scope.templatesHistory[index], function (t) {
                                  if (t.type === 'TwoPageLayoutTemplate') {
                                    var c = !_.isEmpty(t.left) ? t.left.numEffectiveCells : 0;
                                    c += !_.isEmpty(t.right) ? t.right.numEffectiveCells : 0;
                                    return c === elementsCount;
                                  } else {
                                    return t.numEffectiveCells === elementsCount;
                                  }
                                }),
                                curr = scope.currentSpread;
                            if (_.isArray(arr) && !_.isEmpty(curr) && !_.isEmpty(curr.template)) {
                                for (var i = 0; i < arr.length; i++) {
                                    var item = arr[i];
                                    if (item.historyId === curr.template.historyId) {
                                        var next = arr[i + shift];
                                        if (!_.isEmpty(next)) {

                                            //scope.templateSelected(angular.copy(next));

                                            var cmd = new PACE.ApplyTemplateCommand(
                                                angular.copy(next),
                                                'spread',
                                                curr,
                                                scope.layout,
                                                null,
                                                null,
                                                PACE.AppConstants.DEFAULT_FIXED_SPACING);

                                            scope.layoutController.execCommand(cmd, true);
                                            scope.layoutController.fireEvent('layout:layout-changed');

                                            return true;
                                        }
                                    }
                                }
                            }
                            return false;
                        };
                        scope.control.applyHistoryPrevious = _.partial(applyFromHistory, -1);
                        scope.control.applyHistoryNext = _.partial(applyFromHistory, 1);
                        scope.control.deleteSelectedTemplate = scope.deleteSelectedTemplate;
                        scope.control.saveSelectedTemplate = scope.saveSelectedTemplate;

//---------------------------------------------------------------------------------------
                    }
                };
            }
        ]);

})();
