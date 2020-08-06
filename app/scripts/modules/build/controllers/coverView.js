'use strict';

angular.module('pace.build')
    .controller('CoverViewCtrl', [
                '$scope', 'sectionItem', '$state', 'coverLayout', 'product', 'productPrototype',
                'secondaryOption', '_', 'BuildService', 'Layout', '$timeout', 'DebossingService', 'Page', 'GeomService', 'ProductService',
        function ($scope, sectionItem, $state, coverLayout, product, productPrototype, 
                  secondaryOption, _, BuildService, Layout, $timeout, DebossingService, Page, GeomService, ProductService) {

            var stamps;
            
            if (!coverLayout.layoutSize) {
                coverLayout = null;
            }
            $scope.label = sectionItem.label;
            $scope.description = sectionItem.description;
            $scope.secondaryOption = secondaryOption;
            $scope.coverLayout = coverLayout;
            $scope.product = product;
            $scope.productPrototype = productPrototype;
            $scope.model.viewCtrl = this;
            $scope.mode = 'CoverRight';

            if (sectionItem.params && sectionItem.params.coverPage==='back') {
                $scope.mode = 'CoverLeft';
            }

            if (sectionItem.params) {
                $scope.optionParams = sectionItem.params;
            }
            
            var layoutController = $scope.layoutController = new PACE.LayoutController($scope);
            layoutController.currentTool = new PACE.SelectionTool(layoutController);
            
            $scope.previewOptionValue = product.options[$scope.secondaryOption.optionCode];
            
            var prototypeOption = _.findWhere(productPrototype.prototypeProductOptions, { systemAttribute:'ProductPrototype' }),
                prototypeCode = product.options[prototypeOption.effectiveCode],
                optionValue = _.findWhere(prototypeOption.prototypeProductOptionValues, { code: prototypeCode });

            if (optionValue) {
                var slideshow = optionValue.productOptionValue.params.slideshow;
                if (slideshow && slideshow.length>0)
                    $scope.productImageUrl = slideshow[0].imageUrl;
            }

            if (productPrototype.coverBuilderMask === 'product' && $scope.productImageUrl) {
                $scope.display = 'product';
            } else if (coverLayout && coverLayout.layoutSize) {
                $scope.display = 'cover';
                $scope.model.coverLayout = coverLayout;
            } 
            // else {
            //     $scope.display = 'product';
            // }
            if (sectionItem.params && sectionItem.params.coverVisible===false) {
                $scope.display = 'none';
            }
            

            var optionWatcher,
                hoverValue;

            $scope.$watch('secondaryOption.optionCode', function(optionCode) {
                $scope.previewOptionValue = product.options[optionCode];
                if (optionWatcher) optionWatcher();
                optionWatcher = $scope.$watch('product.options.' + optionCode, function(value, oldValue) {
                    if (value===oldValue) return;
                    if (value!==hoverValue) $scope.previewOptionValue = value;
                });
            });

            $scope.getLayoutItemStyle = function(item) {
                var maxSize = 0,
                    items = $scope.secondaryOption.items;

                for (var i = 0; i < items.length; i++) {
                    var layoutSize = items[i].layoutSize;
                    if (layoutSize.width > maxSize) maxSize = layoutSize.width;
                    if (layoutSize.height > maxSize) maxSize = layoutSize.height;
                }
                
                var max = 75,
                    w = (item.layoutSize.width / maxSize) * max,
                    h = (item.layoutSize.height / maxSize) * max;
                
                var style = {
                    'width': w + 'px',
                    'height': h + 'px',
                    'margin-left': -w  / 2 + 'px'
                }
                return style;
            };

            var materials = {},
                materialsToPreload = [],
                preloadTimeout;

            function saveStamps() {
                stamps = {};
                _.each(product.options, function(option, code) {
                    if (option && (option.type==='TextStampElement' || option.type==='CameoSetElement')) {
                        stamps[code] = angular.copy(option);
                    }
                });
            }

            function preloadMaterials() {
                _.each(materialsToPreload, function(url) {
                    var img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.src = url + '?v=1';
                    // img.onload = function() {
                    //     console.log('file ' + url + ' preloaded');
                    // };
                });
                materialsToPreload = [];
                preloadTimeout = undefined;
            }

            this.setProduct = function(p) {
                $scope.product = product = p;
                $scope.previewOptionValue = product.options[$scope.secondaryOption.optionCode];
                saveStamps();
            };

            $scope.getThumbUrl = function(item) {
                var url = item.productOptionValue.params.url;
                
                //preload materials
                if (!materials[url]) {
                    materialsToPreload.push(url);
                    materials[url] = true;
                    if (!preloadTimeout) {
                        preloadTimeout = setTimeout(preloadMaterials, 3000);
                    }
                }

                return url.replace('.jpg', '-thumb.jpg').replace('.png', '-thumb.png');
            };

            $scope.selectNone = function(event) {
                if (event.target.nodeName==='CANVAS')
                    return;
                $scope.selectItem(null);
            };

            var previewOptions;

            $scope.selectItem = function(item) {
                var value = item ? item.productOptionValue.code : null,
                    prevValue = product.options[$scope.secondaryOption.optionCode];
                $scope.previewOptionValue = value;
                
                product.options = angular.copy($scope.model.previewOptions);
                ProductService.setProductOption(product, productPrototype, $scope.secondaryOption.optionCode, value);
                $scope.fillDefaultValues();
                refreshCoverPreview();
                $scope.model.nextButtonEnabled = !!(product.options[$scope.secondaryOption.optionCode]);
                $scope.autoSaver.setEnabled(true);
                hoverValue = null;

                $scope.model.previewOptions = angular.copy(product.options);
            };

            var resetPreviewPromise, previewPromise, coverLayoutOptions=[];

            $scope.resetPreviewOptionValue = function() {
                $timeout.cancel(previewPromise);
                $timeout.cancel(resetPreviewPromise);

                resetPreviewPromise = $timeout(function() {
                    if ($scope.previewOptionValue===product.options[$scope.secondaryOption.optionCode])
                        return;
                    product.options = angular.copy($scope.model.previewOptions);
                    refreshCoverPreview();
                    $scope.autoSaver.setEnabled(true);
                    hoverValue = null;
                }, 200);
            };

            $scope.setPreviewOptionValue = function(value) {
                $timeout.cancel(previewPromise);
                $timeout.cancel(resetPreviewPromise);

                previewPromise = $timeout(function() {
                    $scope.autoSaver.setEnabled(false);
                    product.options = angular.copy($scope.model.previewOptions);
                    ProductService.setProductOption(product, productPrototype, $scope.secondaryOption.optionCode, value);
                    $scope.fillDefaultValues();
                    hoverValue = value;
                    
                    refreshCoverPreview();
                }, 150);
            };

            this.refresh = function() {
                if (layoutController.refreshCoverPreview) {
                    layoutController.refreshCoverPreview();
                }
            };

            function refreshCoverPreview() {
                if (coverLayoutOptions.indexOf($scope.secondaryOption.optionCode)===-1 &&
                    layoutController.refreshCoverPreview) {
                    layoutController.refreshCoverPreview();
                } else {
                    //do nothing, cover will be refreshed after the new cover layout has been loaded
                }
            }

            function getCoverLayout(isLayoutSizeOption, option) {
                Layout.getCoverLayout(product, function(coverLayout) {
                    if (coverLayout && coverLayout.layoutSize) {

                        if (BuildService.coverLayoutEquals(coverLayout, $scope.coverLayout)) return;

                        _.each(stamps, function(stamp, code) {
                            product.options[code] = angular.copy(stamp);
                        });


                        DebossingService.fixStamps(product, coverLayout);
                        DebossingService.fixCameos(productPrototype, product, coverLayout);
                        DebossingService.fixMetalPlaques(productPrototype, product, coverLayout);

                        $scope.display = 'cover';
                        $scope.coverLayout = coverLayout;
                        $scope.model.coverLayout = coverLayout;
                        
                    } else {
                        $scope.display = 'product';
                        $scope.coverLayout = null;
                    }
                });
            }

            function watchForCoverChanges(option) {
                if (!option) return;
                coverLayoutOptions.push(option.effectiveCode);
                $scope.$watch('product.options.' + option.effectiveCode, function(value, oldValue) {
                    if (oldValue!=value) {
                        getCoverLayout();
                    }
                });
            };

            saveStamps();

            BuildService.getLayoutSizeOption(product).then(watchForCoverChanges);
            BuildService.getCoverTypeOption(product).then(watchForCoverChanges);

            $timeout(function() {
                layoutController.setSelectionEnabled(false);
            });

        }]);
