'use strict';

angular.module('pace.layout')
    .directive('dragged',
        ['$document',
         function($document) {            
            return {
                restrict: 'A',
                scope: {
                    onItemDrag: '&',
                    onItemDragEnd: '&'
                },
                link: function(scope, element, attrs) {
                    var onMouseUp = function(event) {
                        scope.onItemDragEnd({ event: event });
                        $document.off('mousemove');
                        $document.off('mouseup');
                    };
                    
                    element.on('mousedown', function(event) {
                        event.preventDefault();
                        scope.onItemDrag({ event: event});
                        
                        $document.on('mousemove', function(e) { scope.onItemDrag({ event: e }); });
                        $document.on('mouseup', onMouseUp);
                    });
                }
            };
         }
        ]
    );