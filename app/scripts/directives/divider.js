'use strict';

angular.module('pace.layout')
    .controller('DividerController', ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {

        var element, next, prev, container,
            isHorizontal, mousePos, elementPos,
            minHeight = $attrs.minHeight ? parseInt($attrs.minHeight) : 50,
            collapsedHeight = $attrs.collapsedHeight ? parseInt($attrs.collapsedHeight) : 0,
            collapsed = false,
            initialPosition;

        function resize(nextOnly) {
            var pos = element.position(),
                totalHeight = container.height();

            if (pos.top===0) return;

            if (!nextOnly) {

                pos.top = Math.max(minHeight, pos.top);

                prev.css('height', pos.top + 'px');
                prev.trigger('size-changed');
            }

            next.css('height', totalHeight - pos.top - element.height() + 'px');
            next.trigger('size-changed');
        }

        function onMouseMove(e) {
            var dx = e.pageX - mousePos.x,
                dy = e.pageY - mousePos.y;

            if (isHorizontal) {
                var top = Math.max(minHeight, elementPos.top + dy);
                element.css('top', top);
            } else
                element.css('left', elementPos.left + dx);
            resize();
        }

        function onMouseUp(e) {
            $(document).unbind('mousemove', onMouseMove);
            $(document).unbind('mouseup', onMouseUp);
            next.trigger('resize-end');
            prev.trigger('resize-end');
        }

        function onMouseDown(e) {
            e.preventDefault();
            $(document).on('mousemove', onMouseMove);
            $(document).on('mouseup', onMouseUp);
            mousePos = {x: e.pageX, y: e.pageY};
            elementPos = element.position();
            if (!initialPosition) initialPosition = element.position();
            next.trigger('resize-begin');
            prev.trigger('resize-begin');
        }

        function onDoubleClick(e) {
            if (!initialPosition) return;
            e.preventDefault();
            var animProps = isHorizontal ? {top:initialPosition.top} : {left:initialPosition.left};
            element.animate(animProps, {
                duration:800,
                progress: function() {
                    resize();
                },
                complete: function() {
                    next.trigger('resize-end');
                    prev.trigger('resize-end');
                }
            });
        }

        function refresh() {
            var top = Math.max(minHeight, prev.height());
            element.css('top', top+'px');
            resize();
        }
    
        this.init = function(el, type) {
            element = el;
            container = el.parent();
            next = el.next();
            prev = el.prev();
            isHorizontal = type==='horizontal';
            
            refresh();

            var $window = $(window);
            $window.resize(refresh);

            element.on('$destroy', function() {
                $window.unbind('resize', refresh);
            });

            element.on('mousedown', onMouseDown);
            element.on('dblclick', onDoubleClick);

        };

        this.collapse = function(collapse) {
            if (collapse) {
                this.position = element.position();
            }
            collapsed = collapse;
            var top = collapse ? collapsedHeight : this.position.top;
            element.animate({ top: top }, {
                duration:800,
                progress: function() {
                    resize(true);
                }
            });
        };

    }])

    .directive('hdivider', ['$timeout', function ($timeout) {
        return {
            restrict: 'E',
            replace:true,
            controller:'DividerController',
            scope: {
                collapsed:'='
            },
            link: function postLink($scope, $element, $attrs, ctrl) {

                $timeout(function() {
                    ctrl.init( $element, 'horizontal' );    
                });
                
                $scope.$watch('collapsed', function(value, oldValue) {
                    if (value!==oldValue) {
                        ctrl.collapse(value);
                    }
                });

            },
            template: '<div class="divider horizontal"><span class="resize-handle"></span></div>'
        };

    }])

    .directive('vdivider', ['$timeout', '$window', '$parse',  function ($timeout, $window, $parse) {
        return {
            restrict: 'E',
            replace:true,
            controller:'DividerController',
            link: function postLink($scope, $element, $attrs, ctrl) {

                //ctrl.init( $element, 'vertical' );
                $timeout(function() {
                    ctrl.init( $element, 'vertical' );    
                });
               
            },
            template: '<div class="divider vertical"><span class="resize-handle"></span></div>'
        };

    }]);