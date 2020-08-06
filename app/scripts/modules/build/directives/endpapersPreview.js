'use strict';

angular.module('pace.build')
    .directive('endpapersPreview', ['Page', 'BumpMapService', '$timeout', 'GeomService', '$debounce', 'coverSettings',
    function (Page, BumpMapService, $timeout, GeomService, $debounce, coverSettings) {

        //directive controller
        var controller = ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {

            $scope.layout = { numPages: 2, elements: [] };

        }];

        //directive's link function
        var link = function($scope, $element, $attrs) {

            var layoutController = $scope.layoutController,
                renderer = layoutController.renderers[0],
                layout = $scope.layout,
                containerClass = '.' + ($attrs.layoutContainer || 'builder__content-primary-inner'),
                $canvasWrap = $element.closest(containerClass),
                $window = $(window),
                spinner = $element.find('.spinner'),
                firstTime = true;

            renderer.canvas.selection = false;
            layoutController.setCurrentRenderer(renderer);

            function autoScale() {
                var size = { width:$canvasWrap.width(), height:$canvasWrap.height() };
                layoutController.scaleToFit(size);
            }

            function prepareLayout() {
                var product = $scope.product;
                layout.elements = [];

                angular.forEach($scope.coverLayout.elements, function(element) {
                    if (element.type==='MaterialElement' || element.type==='ImageElement') {
                        if (firstTime)
                            delete element._id;
                        layout.elements.push(element);
                    }
                });

                var prototypeProductOption = $scope.productPrototype.getPrototypeProductOption($scope.optionCode) || {},
                    pad = 15;

                if (prototypeProductOption) {
                    var endPapersElement = {
                        type:'MaterialElement',
                        x: pad,
                        y: pad,
                        rotation:0,
                        width: $scope.layoutSize.width - pad - 1,
                        height: $scope.layoutSize.height - (pad*2),
                        prototypeProductOption: prototypeProductOption
                    },
                    endPapersElement2 = {
                        type:'MaterialElement',
                        x: $scope.layoutSize.width + 1,
                        y: pad,
                        rotation:0,
                        width: $scope.layoutSize.width - pad,
                        height: $scope.layoutSize.height - (pad*2),
                        prototypeProductOption: prototypeProductOption
                    }
                    layout.elements.push(endPapersElement);
                    layout.elements.push(endPapersElement2);
                }

                firstTime = false;
            }

            $scope.setLoading = function(loading) {
                spinner[loading ? 'show' : 'hide']();
            };

            layoutController.refreshCoverPreview = function() {
                prepareLayout();
                renderer.render();
            };

            $scope.$watch('coverLayout', function(value, oldValue) {
                if(value!=oldValue) {
                    firstTime = true;
                    prepareLayout();

                    $timeout(function() {
                        renderer.canvas.clear();
                        renderer.render();
                    });
                }
            });

            $scope.$watch('optionCode', function(value, oldValue) {
                if(value!=oldValue) {
                    //firstTime = true;
                    prepareLayout();

                    $timeout(function() {
                        renderer.canvas.clear();
                        renderer.render();
                    });
                }
            });

            $scope.$on('$destroy', function() {
                $window.unbind('resize', resizeHandler);
            });

            prepareLayout();

            var resizeHandler = $debounce(autoScale, 500);
            $window.resize(resizeHandler);
            autoScale();
        }

        return {
            scope: {
                coverLayout:'=',
                layoutSize:'=',
                product:'=',
                productPrototype:'=',
                layoutController:'=',
                optionCode:'=',
            },
            replace: true,
            restrict: 'E',
            controller: controller,
            link: link,
            template: '<div> \
                            <canvas layout-renderer spread="layout" layout-size="layoutSize" \
                                disable-watches="true" \
                                page-class="Page" padding="0" product="product" product-prototype="productPrototype"  \
                                page="both" layout-controller="layoutController"> \
                            </canvas> \
                        </div>'
        }
    }
]);
