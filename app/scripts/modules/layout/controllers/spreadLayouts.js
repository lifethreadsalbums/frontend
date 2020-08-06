'use strict';

angular.module('pace.layout')
    .controller('SpreadLayoutsCtrl', ['$scope', 'TemplateService', 'LayoutTemplate',
        function($scope, TemplateService, LayoutTemplate) {
            var padding = {
                    outside: $scope.layout.layoutSize.marginOutside,
                    inside: $scope.layout.layoutSize.marginInside,
                    top: $scope.layout.layoutSize.marginTop,
                    bottom: $scope.layout.layoutSize.marginBottom
                },

                spacing = 20,
                fullSpreadProbability = 0.1,

                nPublicTemplates = $scope.publicTemplates.length,
                publicTemplatesLastIndex = 0,
                nTemplates = 20;

            var publicIterator = 0,
                nextTemplates = function(count) {
                    var t = [];
                    
                    for (var i = 0; i < count; i++) {
                       t.push(
                            TemplateService.getTemplateForSpread(
                                $scope.selectedSpread,
                                $scope.layout,
                                $scope.mode
                            )
                       );
                    }
                    
                    return t;
                };

            var getUpdatedGridSize = function(value, num) {
                var limit = minElements === 0 ? maxElements : minElements,
                    ratio = maxElements / value;
                if(ratio > num) return Math.ceil(ratio);
                else return num;
            };

            var pageElements = _.map(
                new PACE.SpreadInfoFactory().create($scope.selectedSpread, $scope.layout).pages,
                function(page) {
                    return page.getImageElements().length;
                }),
                minElements = _.min(pageElements),
                maxElements = _.max(pageElements),
                numElements = _.reduce(pageElements, function(mem, el) { return mem + el; }, 0);

            if ($scope.selectedSpread.numPages === 1) {                    

                $scope.mode = $scope.selectedSpread.pageNumber === 1 ? 'right' : 'left';
            } else {
                $scope.mode = 'spread';
            }
            
            $scope.maxRows = maxElements;
            $scope.minRows = 1;
            $scope.maxCols = maxElements;
            $scope.minCols = 1;

            $scope.numCols = minElements;
            $scope.numRows = Math.ceil(maxElements / minElements);

            $scope.manualAdjustments = false;

            $scope.generate = function() {
                 var templates = [];
                
                 if ($scope.publicTemplates.length > 0) {
                     templates = _.first($scope.publicTemplates, nTemplates);
                     $scope.publicTemplates = $scope.publicTemplates.slice(nTemplates, $scope.publicTemplates.length);
                 }

                 if (templates.length < nTemplates) {
                     templates = templates.concat(nextTemplates(nTemplates - templates.length));
                 }
                
                $scope.templates = templates;
            };

            $scope.generate();
            
            $scope.$watch('numCols', function(value) {
                $scope.numRows = getUpdatedGridSize(value, $scope.numRows);
            });

            $scope.$watch('numRows', function(value) {
                $scope.numCols = getUpdatedGridSize(value, $scope.numCols);
            });

            $scope.onKeyPressed = function(e) {
                $scope.$apply(function() {
                    switch(e.which) {
                        case 37: // left
                            $scope.numCols = Math.max($scope.numCols - 1, $scope.minCols);
                            break;
                        case 38: // up
                            $scope.numRows = Math.min($scope.numRows + 1, $scope.maxRows);
                            break;
                        case 39: // right
                            $scope.numCols = Math.min($scope.numCols + 1, $scope.maxCols);
                            break;
                        case 40: // down
                            $scope.numRows = Math.max($scope.numRows - 1, $scope.minRows);
                            break;
                    }
                });
            };

            $scope.templateSelected = function (template) {
                if (template.type !== 'TwoPageLayoutTemplate' &&
                    $scope.mode !== 'spread') {
                    var t = { type: 'TwoPageLayoutTemplate'};
                    t[$scope.mode] = template;
                    template = t;
                }

                new PACE.AddTemplateToSpread(
                    $scope.selectedSpread,
                    template, 'spread').execute();
                new PACE.LayoutSpreadCommand(
                    $scope.selectedSpread,
                    $scope.layout.layoutSize,
                    $scope.layoutController.currentRenderer,
                    $scope.layoutController).execute();

                var lt = LayoutTemplate.newLayoutTemplate(template);
                $scope.closeThisDialog();
            };
        }
    ]);
