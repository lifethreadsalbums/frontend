angular.module('paceApp')
    .directive('layoutTemplate', ['GeomService',
        function (GeomService) {
            'use strict';
            
            return {
                templateUrl: 'views/components/layoutTemplate.html',
                replace: true,
                scope: {
                    template: '=',
                    maxSize: '@'
                },
                restrict: "E",
                link: function (scope, element, attrs) {
                    var maxSize = attrs.maxsize,
                        ctx = element[0].getContext('2d'),
                        layoutSize = GeomService.fitRectangleProportionally(
                            {
                                width: scope.template.layoutSize.width,
                                height: scope.template.layoutSize.height
                            },
                            {
                                width: maxSize,
                                height: maxSize
                            }
                        ),
                        drawSplitLine = function (ctx) {
                            if (scope.template.orientation === 'Horizontal') {
                                ctx.fillRect(layoutSize.width, 0, 1, layoutSize.height);
                            } else {
                                ctx.fillRect(0, layoutSize.height, layoutSize.width, 1);
                            }
                        };

                    if (scope.template.type.indexOf('page') > -1) {
                        scope.width = layoutSize.width;
                        scope.height = layoutSize.height;
                    } else {
                        if (scope.template.orientation === 'Horizontal') {
                            scope.width = layoutSize.width * 2;
                            scope.height = layoutSize.height;
                        } else {
                            scope.width = layoutSize.width;
                            scope.height = layoutSize.height * 2;
                        }
                    }

                    scope.$watch('height', function () {
                        ctx.fillStyle = '#c2c2c2';
                        
                        angular.forEach(scope.template.frames, function (value, key) {
                            var x, y, width, height;
                            
                            x = value.x / (scope.template.layoutSize.width / layoutSize.width);
                            y = value.y / (scope.template.layoutSize.height / layoutSize.height);
                            width = value.width / (scope.template.layoutSize.width / layoutSize.width);
                            height = value.height / (scope.template.layoutSize.height / layoutSize.height);
                            
                            if (scope.template.type === 'pageRight') {
                                if(scope.template.orientation === 'Horizontal')
                                    x = (value.x - scope.template.layoutSize.width) / (scope.template.layoutSize.width / layoutSize.width);
                                else
                                    y = (value.y - scope.template.layoutSize.height) / (scope.template.layoutSize.height / layoutSize.height);
                            }
                            
                            ctx.fillRect(x, y, width, height);
                        });
                        
                        if (scope.template.type === 'spread')
                            drawSplitLine(ctx);
                    });
                }
            };
        }
    ]);