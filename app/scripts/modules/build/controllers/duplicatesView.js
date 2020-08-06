'use strict';

angular.module('pace.build')
.controller('DuplicatesSidebarCtrl', 
    ['$scope', '$rootScope', 'product', 'productPrototype', '$state', 'sectionItem', 'nextSection', 'section', 'Product', 'ProductService',
        'BuildService', '$timeout', 'StoreConfig', 'MessageService', '$debounce', 'secondaryOption', 'BumpMapService', 'ProductPrototype',

    function ($scope, $rootScope, product, productPrototype, $state, sectionItem, nextSection, section, Product, ProductService,
        BuildService, $timeout, StoreConfig, MessageService, $debounce, secondaryOption, BumpMapService, ProductPrototype) {

        function refreshDuplicatesViews() {
            $scope.duplicatesView = [];
            _.each($scope.duplicates, function(dup) {
                $scope.duplicatesView.push(ProductService.getProductViewModel(dup, productPrototype));
            });
        }

        function addDuplicate() {
            var dup = {
                parentId: product.id,
                prototypeId: product.prototypeId,
                layoutId: product.layoutId,
                linkLayout: true,
                options: angular.copy(product.options)
            };

            _.each(dup.options, function(option) {
                if (_.isObject(option)) {
                    delete option.id;
                    delete option.version;
                    delete option._id;
                    if (option.type==='CameoSetElement') {
                        _.each(option.shapes, function(shape) {
                            delete shape.id;
                            delete shape.version;
                            delete shape._id;
                        });
                    }
                }
            });

            dup.options._name = dup.options._name + '-' + ($scope.duplicates.length + 2);
            dup.options._quantity = 1;

            ProductService.validateProduct(dup, productPrototype);
            ProductService.fillDefaultValues(dup, productPrototype);
            ProductService.validateProduct(dup, productPrototype);

            var currentSizeItemIdx = _.findIndex(sizeItems, function(item) {
                return item.productOptionValue.code===dup.options[sizeOptionCode];
            });

            if (currentSizeItemIdx>=0 && currentSizeItemIdx<sizeItems.length - 1) {
                dup.options[sizeOptionCode] = sizeItems[currentSizeItemIdx + 1].productOptionValue.code;
            }

            $scope.duplicates.push(dup);
            refreshDuplicatesViews();
            chooseSize(dup);

            product.children = $scope.duplicates;
        }

        function chooseSize(dup) {
            secondaryOption.items = sizeItems;
            $scope.currentDuplicate = dup;
            $timeout(function() {
                $scope.model.viewCtrl.setProduct(dup);
            });
        }

        function removeCurrentDuplicate(dup) {
            if ($scope.currentDuplicate) {

                ProductPrototype.get({id:$scope.currentDuplicate.prototypeId}, function(prototype) {
                    MessageService.confirm('Do you really want to delete this ' + prototype.duplicateDisplayName +'?',
                        function () {
                            var idx = product.children.indexOf($scope.currentDuplicate);
                            product.children.splice(idx, 1);
                            $scope.duplicates = product.children.slice();
                            refreshDuplicatesViews();
                            if (product.children.length===0) {
                                $scope.currentDuplicate = null;
                                $scope.model.viewCtrl.setProduct(product);
                                secondaryOption.items = [];
                            } else {
                                idx = Math.max(0, idx-1);
                                chooseSize(product.children[0]);
                            }

                            if (product.children.length===0) {
                                $scope.model.sidebarAnimation = 'right';
                                $scope.model.coverLayout = null;
                                BumpMapService.lastCoverImage = null;
                                $state.go('^');
                            }
                        }
                    );
                });
                
            }
        }

        function removeZeroChildren() {
            for (var i = product.children.length - 1; i >= 0; i--) {
                var child = product.children[i];
                if (child.options._quantity===0 || child.options._quantity==="0") {
                    product.children.splice(i, 1);
                }
            }
            refreshDuplicatesViews();
        }

        var option = productPrototype.getLayoutSizeOption(),
            sizeOptionCode = option.effectiveCode;
       
        
        secondaryOption.optionCode = sizeOptionCode;
        
        var sizeItems = _.filter(option.prototypeProductOptionValues, function(item) {
            if (item.parent) {
                var parentCode = option.parent.effectiveCode,
                    value = item.parent.code;
                return product.options[parentCode] === value;
            } 
            return true;
        });
        sizeItems = angular.copy( _.sortBy(sizeItems, function(item) {
            return  - (item.layoutSize.width * item.layoutSize.height);
        }) );

        for (var i = 0; i < sizeItems.length; i++) {
            var item = sizeItems[i];
            if (item.productOptionValue.code===product.options[sizeOptionCode]) {
                break;
            } else {
                item.disabled = true;
            }
        };
        
        $scope.model.label = sectionItem.displayLabel;
        $scope.model.description = sectionItem.displayPrompt;
        $scope.model.optionalAddOn = true;
        $scope.model.nextButtonLabel = 'Next';
        
        if ($scope.editable) {
            // if (product.parentId) {
            //     Product.get({id:product.parentId}, function(parent) {

            //         product = parent;


            //         if (_.isEmpty(product.children)) {
            //             $scope.duplicates = product.children = [];
            //             addDuplicate();
            //         } else {
            //             $scope.duplicates = product.children;
            //             refreshDuplicatesViews();
            //             chooseSize($scope.duplicates[0]);
            //         }
            //         for (var i = 0; i < sizeItems.length; i++) {
            //             var item = sizeItems[i];
            //             item.disabled = false;
            //         }

            //         for (var i = 0; i < sizeItems.length; i++) {
            //             var item = sizeItems[i];
            //             if (item.productOptionValue.code===product.options[sizeOptionCode]) {
            //                 break;
            //             } else {
            //                 item.disabled = true;
            //             }
            //         }

            //     })

            //     return;
            // }


            if (_.isEmpty(product.children)) {
                $scope.duplicates = product.children = [];
                addDuplicate();
            } else {
                $scope.duplicates = product.children;
                refreshDuplicatesViews();
                chooseSize($scope.duplicates[0]);
            }
        }

        $scope.addDuplicate = addDuplicate;
        $scope.chooseSize = chooseSize;
        $scope.removeCurrentDuplicate = removeCurrentDuplicate;
        $scope.$watch('duplicates', refreshDuplicatesViews, true);

        $scope.onQuantityChanged = function(dup) {
            $timeout(removeZeroChildren);
        }

        $scope.$on('build-next-click', function() {
            product.children = $scope.duplicates;

            removeZeroChildren();

            $scope.saveProduct();
            $scope.model.sidebarAnimation = 'right';
            $scope.model.coverLayout = null;
            BumpMapService.lastCoverImage = null;
            $state.go('^');
        });

        $scope.$on('build-back-click', function() {
            
            // if (sectionItem.prototypeProductOption.systemAttribute==='ProductPrototype') {
            //     //go back to the previous option
            //     var idx = section.children.indexOf(sectionItem),
            //         prevItem = section.children[idx-1];

            //     $state.go('build.section.option', {
            //         section:section.url, 
            //         productId: $state.params.productId,
            //         optionUrl: prevItem.url
            //     });
            //     return;   
            // } else if (sectionItem.prototypeProductOption.systemAttribute==='ProductCategory') {
            //     $state.go('dashboard.default.overview');
            //     return;
            // }
            
            // $state.go('^');
            BumpMapService.lastCoverImage = null;
            $scope.model.coverLayout = null;
            history.back();
            
        });

        $scope.$on('build-remove-optional-addon-click', function() {
            $scope.removeCurrentDuplicate();
        });

    }
]);
