'use strict';

angular.module('pace.build')
    .controller('SectionSummaryCtrl', [
                '$scope', '$state', 'product', 'productPrototype', '_', 'Layout', '$timeout', 'sections', 'BuildService',
                'section', 'BumpMapService',
        function ($scope, $state, product, productPrototype, _, Layout, $timeout, sections, BuildService,
            section, BumpMapService) {

            $scope.product = product;
            $scope.productPrototype = productPrototype;
            $scope.mode = 'CoverRight';

            var layoutController = $scope.layoutController = new PACE.LayoutController($scope),
                prototypeOption = _.findWhere(productPrototype.prototypeProductOptions, { systemAttribute:'ProductPrototype' }),
                prototypeCode = product.options[prototypeOption.effectiveCode],
                optionValue = _.findWhere(prototypeOption.prototypeProductOptionValues, { code: prototypeCode });

            if (optionValue) {
                var slideshow = optionValue.productOptionValue.params.slideshow;
                if (slideshow && slideshow.length>0) {
                    $scope.productImageUrl = slideshow[0].imageUrl;
                }
            }
            
            function getCoverLayout() {
                Layout.getCoverLayout(product, function(coverLayout) {
                    if (coverLayout && coverLayout.layoutSize) {
                        $scope.model.coverLayout = coverLayout;
                        $scope.coverLayout = coverLayout;
                        if (section.url==='box' && product.options.boxType) {
                            $scope.display = 'box';
                            BumpMapService.lastCoverImage = null;
                        } else {
                            $scope.display = 'cover';
                            BumpMapService.lastBoxImage = null;
                        }

                        $timeout(function() {
                            layoutController.setSelectionEnabled(false);
                        });
                    } else {
                        $scope.display = 'product';
                    }
                });
            }

            if (productPrototype.coverBuilderMask === 'product' && $scope.productImageUrl) {
                $scope.display = 'product';
            } else if ($scope.model.coverLayout) {
                
                if (section.url==='box' && product.options.boxType) {
                    $scope.display = 'box';
                    BumpMapService.lastCoverImage = null;
                } else {
                    $scope.display = 'cover';
                    BumpMapService.lastBoxImage = null;
                }
                $scope.coverLayout = $scope.model.coverLayout;
                $timeout(function() {
                    layoutController.setSelectionEnabled(false);
                });
            } else {
                $scope.display = 'cover';
                getCoverLayout();
            }



            $scope.onDoubleClick = function(e) {
                BuildService.redirectToStamp(product, productPrototype, sections, e);
            };


        }]);
