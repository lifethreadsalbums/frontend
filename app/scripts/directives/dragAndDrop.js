'use strict';

angular.module('paceApp')
    .factory('DragDropCache', ['$cacheFactory', function($cacheFactory) {

        var cache = $cacheFactory('draggableDataTransfer');
        return cache;

    }])

    .directive('draggable', ['$parse', 'DragDropCache', function($parse, DragDropCache) {
        return {
            scope: {
                draggableData: '&',
                draggable: '='
            },
            link: function(scope, element, attrs) {
                var dragPreviewElement;
                var key;

                scope.$watch('draggable', function(value) {
                    element[0].draggable = attrs.draggable === '' || value;
                });

                element.on('dragstart', function(e) {
                    var draggableType = attrs.draggableType || 'text/x-pace-draggable-item';
                    var dt = e.originalEvent.dataTransfer;
                    key = _.uniqueId('draggable-item-');

                    DragDropCache.put(key, scope.draggableData());
                    dt.effectAllowed = 'move';
                    dt.setData(draggableType, key);
                    element.addClass('pace-drag-source');

                    if (attrs.draggablePreview) {
                        var previewEl = $(attrs.draggablePreview);
                        dragPreviewElement = document.createElement('div');
                        dragPreviewElement.className = attrs.draggablePreviewClass || 'pace-drag-preview';
                        angular.element(previewEl).each(function() {
                            dragPreviewElement.appendChild(this.cloneNode(true));
                        });
                        document.body.appendChild(dragPreviewElement);
                        dt.setDragImage(dragPreviewElement, 5, 5);
                    }
                });

                element.on('dragend', function(e) {
                    DragDropCache.remove(key);
                    element.removeClass('pace-drag-source');
                    angular.element(dragPreviewElement).remove();
                    dragPreviewElement = null;
                });
            }
        };
    }])

    .directive('droppable', ['$parse', 'DragDropCache', function($parse, DragDropCache) {
        return {
            scope: {
                callback: '&onDrop',
                dragType: '=',
                droppable: '&'
            },
            link: function(scope, element, attrs) {
                element.on('dragover', function(e) {
                    var droppableType = attrs.droppableType || 'text/x-pace-draggable-item';
                    var dt = e.originalEvent.dataTransfer;

                    if (PACE.utils.containsDragType(dt.types, droppableType) && (attrs.droppable === '' || scope.droppable({data: data}))) {
                        e.stopPropagation();
                        e.preventDefault();
                        dt.dropEffect = 'move';
                        element.addClass('pace-drag-over');
                    }
                });

                element.on('dragenter', function(e) {
                    var droppableType = attrs.droppableType || 'text/x-pace-draggable-item';
                    var dt = e.originalEvent.dataTransfer;

                    if (PACE.utils.containsDragType(dt.types, droppableType) && (attrs.droppable === '' || scope.droppable({data: data}))) {
                        element.addClass('pace-drag-over');
                    }
                });

                element.on('dragleave', function(e) {
                    element.removeClass('pace-drag-over');
                });

                element.on('drop', function(e) {
                    var droppableType = attrs.droppableType || 'text/x-pace-draggable-item';
                    var dt = e.originalEvent.dataTransfer;
                    var key = dt.getData(droppableType);
                    var data = DragDropCache.get(key);

                    if (PACE.utils.containsDragType(dt.types, droppableType) && (attrs.droppable === '' || scope.droppable({data: data}))) {
                        e.stopPropagation();
                        element.removeClass('pace-drag-over');
                        scope.$apply(function () {
                            scope.callback({data: data, event:e.originalEvent});
                        });
                    }
                });
            }
        };
    }])

    .directive('dropAction', ['$parse', 'DragDropCache', function($parse, DragDropCache) {
        return {
            scope: {
                callback: '&dropAction',
            },
            link: function(scope, element, attrs) {

                var dropType = attrs.dropType;;

                element.on('dragover', function(e) {
                    var dt = e.originalEvent.dataTransfer;

                    if (!PACE.utils.containsDragType(dt.types, dropType)) return;

                    e.stopPropagation();
                    e.preventDefault();
                    dt.dropEffect = 'move';

                    element.addClass('over');
                });

                element.on('dragenter', function(e) {
                    element.addClass('over');
                });

                element.on('dragleave', function(e) {
                    element.removeClass('over');
                });

                element.on('drop', function(e) {
                    var dt = e.originalEvent.dataTransfer;

                    if (!PACE.utils.containsDragType(dt.types, dropType)) return;
                    var jsonData = dt.getData(dropType);

                    var data = JSON.parse(jsonData);
                    e.preventDefault();
                    e.stopPropagation();
                    element.removeClass('over');
                    scope.$apply(function () {
                        scope.callback({data: data});
                    });

                });
            }
        };
    }]);

