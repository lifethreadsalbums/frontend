'use strict';

angular.module('pace.layout')
    .controller('RulerController', ['$scope', '$element', '$attrs', '$parse', function($scope, $element, $attrs, $parse) {

        var layoutController = $parse($attrs.layoutController)($scope),
            scale = layoutController.scale,
            renderer, isHorizontal,
            container,
            rulers = [];
    
        function drawUnitLine(ctx, pos, len, count, labelCachePrefix) {
            ctx.beginPath();

            if (Math.round(count * 10) % 10===0) {
                var label = { text: Math.round(count).toString() };
                
                if (isHorizontal)
                {
                    label.x = pos - (label.text.length>1 ? 10 : 8); 
                    label.y = 0;
                } else {
                    label.x = 0;
                    label.y = pos;
                }
                ctx.font="8px Arial";
                ctx.fillText(label.text, label.x, label.y + 8); 
                
                if (isHorizontal)
                    ctx.moveTo(pos, 0);
                else
                    ctx.moveTo(0, pos);
                
            } else if (Math.round(count * 10) % 5===0) {
                if (isHorizontal)
                    ctx.moveTo(pos, len - 6);
                else
                    ctx.moveTo(len - 6, pos);
            } else {
                if (isHorizontal)
                    ctx.moveTo(pos, len - 3);
                else
                    ctx.moveTo(len - 3, pos);
            }
            
            if (isHorizontal)
                ctx.lineTo(pos, len);
            else
                ctx.lineTo(len, pos);

            ctx.stroke();
        }

        function draw(canvas, index, renderer) {

            // if (isHorizontal) {
            //     renderer = layoutController.currentRenderer;
            // } 

            var size = renderer.getCanvasSize(scale),
                ctx = canvas.getContext("2d");
            
            if (isHorizontal) {
                canvas.width = Math.round(size.width / 2 + 0.5);
                canvas.height = 16;
            } else {
                canvas.width = 16;
                canvas.height = Math.round(size.height + 0.5);
            }

            //console.log('canvas h', canvas.height, size);
            ctx.setTransform(1,0,0,1,0,0);
            ctx.translate(0.5, 0.5);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            var smallestUnit = 1/8,
                pixelsPerUnit = 72,
                offsetX = renderer.offset.x * scale,
                offsetY = renderer.offset.y * scale,
                zeroPosition = isHorizontal ? (index===0 ? offsetX : size.width/2 - offsetX) : offsetY,
                pos = zeroPosition,
                count = 0,
                maxPos = isHorizontal ? canvas.width : canvas.height,
                delta = scale * smallestUnit * pixelsPerUnit;
            
            if (delta>0)
            {
                var len = isHorizontal ? canvas.height : canvas.width;
                
                while (pos < maxPos)
                {
                    drawUnitLine(ctx, Math.round(pos), len, count, "r");
                    pos += delta;
                    count += smallestUnit;
                }
                
                pos = zeroPosition;
                count = 0;
                while (pos > 0)
                {
                    drawUnitLine(ctx, Math.round(pos), len, count, "l");
                    pos -= delta;
                    count += smallestUnit;
                }
            }
            ctx.beginPath();
            if (isHorizontal) {
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 16);
                ctx.moveTo(canvas.width - 1, 0);
                ctx.lineTo(canvas.width - 1, 16);
            } else {
                ctx.moveTo(0, 0);
                ctx.lineTo(16, 0);
                ctx.moveTo(0, canvas.height-0.5);
                ctx.lineTo(16, canvas.height-0.5);
            }
            ctx.stroke();
        }

        function prepareRulers(num) {
            var numRulersToAdd = num - rulers.length,
                i;
            for (i = 0; i < numRulersToAdd; i++) {
                var canvas = document.createElement('canvas');
                container[0].appendChild(canvas);
                canvas.style.position = 'absolute';
                canvas.style.display = 'none';
                rulers.push( canvas );
            }

            // for (i = 0; i < rulers.length; i++) {
            //     var renderer = i<renderers.length ? renderers[i] : 
            //     draw(rulers[i], i);
            // }
        }

        this.positionRulers = function(redraw) {
            var i, offset,
                containerOffset = container.offset();

            if (!layoutController.currentRenderer) return;

            if (isHorizontal) {

                offset = layoutController.currentRenderer.element.parent().offset();
                var size = layoutController.currentRenderer.getCanvasSize(scale);
                if (redraw) {
                    prepareRulers(2);
                }
                for (i = 0; i < rulers.length; i++) {
                    if (redraw) {
                        draw(rulers[i], i, layoutController.currentRenderer);
                    }
                    rulers[i].style.left = (offset.left - containerOffset.left) + (i===1 ? size.width/2: 0) + 'px';
                    rulers[i].style.display = 'block';
                }
            } else {
                var visibleRenderers = layoutController.getVisibleRenderers();
                    
                prepareRulers(visibleRenderers.length + 1);
                for (i = 0; i < rulers.length; i++) {
                    if (i < visibleRenderers.length) {
                        draw(rulers[i], i, visibleRenderers[i]);
                        offset = visibleRenderers[i].element.offset();
                        rulers[i].style.top = (offset.top - containerOffset.top)+'px';
                        rulers[i].style.display = 'block';
                        rulers[i].style.opacity = (visibleRenderers[i].spread===this.currentSpread) ? '1' : '0.5';
                    } else
                        rulers[i].style.display = 'none';
                }
            }
        };

    
        this.init = function(element, type) {
            container = element;
            isHorizontal = type==='horizontal';
            var ctrl = this;
    
            $scope.$on('layout:scale-changed', function() {
                scale = layoutController.scale;
                ctrl.positionRulers(true);
            });

            if (!isHorizontal) {
                
                //ctrl.currentSpread = layoutController.renderers[0].spread;
                $scope.$on('layout:current-renderer-changed', function() {
                    ctrl.currentSpread = layoutController.currentRenderer.spread;
                    ctrl.positionRulers(true);
                });
            }

            scale = layoutController.scale;
            this.positionRulers(true);
        };

        this.dispose = function() {
            rulers = [];
            container.empty();
        };

    }])

    .directive('hruler', ['$timeout', function ($timeout) {
        return {
            restrict: 'E',
            replace:true,
            controller:'RulerController',
            link: function postLink($scope, $element, $attrs, ctrl) {

                var refresh = ctrl.positionRulers.bind(ctrl),
                    container;

                $timeout(function() {
                    ctrl.init( $element, 'horizontal' );
                    container = $('.scrollable-container').first();
                    container.on('scroll', refresh);
                });
               
                var $window = $(window);
                $window.resize(refresh);

                $element.on('$destroy', function() {
                    $window.unbind('resize', refresh);
                    container.off('scroll', refresh);
                    ctrl.dispose();
                });

            },
            template: '<div class="ruler ruler-horizontal"></div>'
        };

    }])

    .directive('vruler', ['$timeout', '$window', '$parse',  function ($timeout, $window, $parse) {
        return {
            restrict: 'E',
            replace:true,
            controller:'RulerController',
            link: function postLink($scope, $element, $attrs, ctrl) {

                var refresh = ctrl.positionRulers.bind(ctrl),
                    container;

                function onScroll() {
                    ctrl.positionRulers();
                }

                $timeout(function() {
                    ctrl.init( $element, 'vertical' );
                    container = $('.scrollable-container').first();
                    container.on('scroll', refresh);
                });

                var $window = $(window);
                $window.resize(refresh);

                $element.on('$destroy', function() {
                    $window.unbind('resize', refresh);
                    container.off('scroll', refresh);
                    ctrl.dispose();
                });

            },
            template: '<div class="ruler ruler-vertical"></div>'
        };

    }]);