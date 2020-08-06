'use strict';

angular.module('paceApp')
    .constant('GeomTolerance', 0.001)
    .service('GeomService', ['Page', 'GeomTolerance', function GeomService(Page, GeomTolerance) {

        this.fitRectangleProportionally = this.fitRect = function(rect, container) {
            var sX = container.width / rect.width;
            var sY = container.height / rect.height;
            
            var rRect = rect.width / rect.height;
            var rContainer = container.width / container.height;
            
            var s = rRect >= rContainer ? sX : sY;
            
            return { 
                width: rect.width * s, 
                height: rect.height * s
            };
        };
        
        this.pointToLineDistance = function( A, B, P) {
            var normalLength = Math.sqrt((B.x-A.x)*(B.x-A.x)+(B.y-A.y)*(B.y-A.y));
            return ((P.x-A.x)*(B.y-A.y)-(P.y-A.y)*(B.x-A.x))/normalLength;
        };

        this.equals = function(a,b,tolerance) {
            if (_.isUndefined(tolerance)) tolerance = GeomTolerance;
            return Math.abs(a-b)<tolerance;
        };

        this.roundNumber = function(num, places) {
            return +(Math.round(num + "e+" + places)  + "e-" + places);
        };

        this.getCanvasSize = function(layoutSize, numPages, padding) {
            var canvasSize = {
                    width: Math.floor(layoutSize.width),
                    height: Math.floor(layoutSize.height)
                },
                pad2 = padding * 2;
            if (layoutSize.pageOrientation==='Horizontal' ) { 
                canvasSize.width *= numPages;
            } else {
                canvasSize.height *= numPages;
            }
            canvasSize.width = canvasSize.width + pad2;
            canvasSize.height = canvasSize.height + pad2;
            return canvasSize;
        };

        this.getFloatingImageSize = function(layoutSize, size) {
            var sizes = { 's': 0.4, 'm': 0.6, 'l': 0.8  };
            return { width: layoutSize.width * sizes[size], height: layoutSize.height * sizes[size] };
        };

        this.resizeCoverLayout = function(layout, newSize) {
            var newLayout = {
                layoutSize: newSize,
                spreads: []
            };
            var isHorizontal = layout.layoutSize.pageOrientation==='Horizontal'; 
            
            var scaleY = newSize.height / layout.layoutSize.height;
            var scaleX = newSize.width / layout.layoutSize.width;
            _.each(layout.spreads, function(spread) {
                var newSpread = {
                    numPages: spread.numPages,
                    pageNumber: spread.pageNumber,
                    elements: []
                }
                newLayout.spreads.push(newSpread);

                var oldCenterX = layout.layoutSize.width * (isHorizontal ? spread.numPages : 1) / 2.0;
                var oldCenterY = layout.layoutSize.height * (!isHorizontal ? spread.numPages : 1) / 2.0;
                
                var newCenterX = newLayout.layoutSize.width * (isHorizontal ? spread.numPages : 1) / 2.0;
                var newCenterY = newLayout.layoutSize.height * (!isHorizontal ? spread.numPages : 1) / 2.0;
                _.each(spread.elements, function(el) {
                    var newElement = angular.copy(el);
                    newElement.x = ((newElement.x - oldCenterX) * scaleX) + newCenterX;
                    newElement.y = ((newElement.y - oldCenterY) * scaleY) + newCenterY;
                    newElement.width = newElement.width * scaleX;
                    newElement.height = newElement.height * scaleY;
                    
                    newSpread.elements.push(newElement);
                });
                
            });
            
            return newLayout;
        };


        PACE.GeomService = this;
        
    }]);
