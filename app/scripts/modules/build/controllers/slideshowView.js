'use strict';

angular.module('pace.build')
    .controller('SlideshowViewCtrl', [
                '$scope', 'sectionItem', '$state', 'coverLayout', 'product', 'productPrototype', '_', 
                'BuildService', '$timeout',
        function ($scope, sectionItem, $state, coverLayout, product, productPrototype, _, 
            BuildService, $timeout) {

            function initSlideshow(currentOptionCode) {
                if ($scope.model.productPrototypeChanging) return;
                
                var value = product.options[currentOptionCode],
                    productOption = productPrototype.getPrototypeProductOption(currentOptionCode),
                    productOptionValue = productPrototype.getPrototypeProductOptionValue(currentOptionCode, value);
                    
                if (productOptionValue && productOptionValue.effectiveParams) {
                    $scope.title = productOptionValue.effectiveParams.title;
                    $scope.description = productOptionValue.effectiveParams.description;
                    $scope.slideshow = productOptionValue.effectiveParams.slideshow; 
                } else if (productOption && productOption.effectiveParams && productOption.effectiveParams.slideshow) {
                    $scope.title = productOption.effectiveParams.title;
                    $scope.description = productOption.effectiveParams.description;
                    $scope.slideshow = productOption.effectiveParams.slideshow; 
                } else {
                    $scope.title = undefined;
                    $scope.description = undefined;
                    $scope.slideshow = undefined; 
                }

                if ($scope.slideshow) {
                    $scope.selectSlide($scope.slideshow[0]);
                }
            }

            $scope.$watch('model.currentOptionCode', function(currentOptionCode) {
                if (currentOptionCode) {
                    $scope.$watch('product.options.' + currentOptionCode, function(value) {
                        initSlideshow(currentOptionCode);
                    });
                }
            });
            
            $scope.unselectPreviewSlide = function(slide) {
                $timeout(function() {
                    if ($scope.currentSlide===slide) {
                        $scope.currentSlide = $scope.selectedSlide;
                    }
                }, 100);
            };

            $scope.selectSlide = function(slide) {
                $scope.currentSlide = $scope.selectedSlide = slide;
            };
           
            $scope.selectPreviewSlide = function(slide) {
                $scope.currentSlide = slide;
            };
            
        }]);
