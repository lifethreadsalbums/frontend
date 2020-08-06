'use strict';

angular.module('pace.layout')
    .directive('pageDividerRenderer', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            require: 'layoutRenderer',
            link: function postLink($scope, $element, $attrs, layoutRendererController) {

                var canvas = layoutRendererController.canvas,
                    layoutSize = layoutRendererController.layoutSize,
                    productPrototype = layoutRendererController.productPrototype,
                    product = layoutRendererController.product;

                canvas.on('after:render', function() {

                    var ctx = canvas.getContext(),
                    offset = canvas.offset,
                    scale = canvas.scale,
                    spineWidth = 20,
                    dividerWidth = 40,
                    spineRect = new PACE.Rect({
                        x: layoutSize.width - dividerWidth / 2,
                        y: 0,
                        width: dividerWidth,
                        height: layoutSize.height
                    })
                        .toCanvasSpace(canvas)
                        .round();

                    ctx.save();
                    ctx.setTransform(1,0,0,1,0,0);

                    var linearGradient1 = ctx.createLinearGradient(
                        spineRect.x,
                        0,
                        spineRect.x + spineRect.width,
                        0
                    );

                    linearGradient1.addColorStop(0, '#ffffff');
                    linearGradient1.addColorStop(0.49, '#dbdbdb');
                    linearGradient1.addColorStop(0.5, '#cbcbcb');
                    linearGradient1.addColorStop(0.51, '#cecece');
                    linearGradient1.addColorStop(1, '#ffffff');

                    ctx.fillStyle = linearGradient1;
                    ctx.fillRect(
                        spineRect.x,
                        spineRect.y,
                        spineRect.width, 
                        spineRect.height
                    );

                    ctx.restore();
                });

                //TODO: optimize it, this watch might be expensive
                $scope.$watch('product', function(product) {
                    layoutRendererController.render();
                }, true);

            }
        };
    }]);