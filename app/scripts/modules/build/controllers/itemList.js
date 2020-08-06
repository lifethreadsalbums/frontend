'use strict';

angular.module('pace.build')
    .controller('ItemListCtrl', ['$scope', 'items', 'section', 'sectionItem', '$state', 'product', 'secondaryOption', 'ProductPrototype',
            'nextSection', 'productPrototype', 'optionVisibilityFilter', 'BuildService', '$rootScope', 'MessageService', 'sections',
            'userSettings', 'AuthService', 'ProductService', '$timeout',
        function ($scope, items, section, sectionItem, $state, product, secondaryOption, ProductPrototype,
            nextSection, productPrototype, optionVisibilityFilter, BuildService, $rootScope, MessageService, sections,
            userSettings, AuthService, ProductService, $timeout) {
        
        var prevState = {}, 
            lastItem = section.children.indexOf(sectionItem)===section.children.length-1;

        var optionCode = sectionItem.prototypeProductOption.effectiveCode,
            prototypeProductOption = productPrototype.getPrototypeProductOption(optionCode);

        $scope.model.label = sectionItem.displayLabel;
        $scope.model.description = sectionItem.displayPrompt;
        $scope.optionCode = sectionItem.prototypeProductOption.effectiveCode;
        $scope.model.nextButtonVisible = true;
        $scope.model.nextButtonEnabled = !!product.options[$scope.optionCode];
        $scope.model.nextButtonLabel = 'Next';
        $scope.model.optionalAddOn = !prototypeProductOption.isRequired;
        $scope.model.printsOption = sectionItem.type==='BuildPrintsOptionWidget' || sectionItem.type==='BuildPrintsSizeOptionWidget';

        $scope.product = product;
        $scope.model.previewOptions = angular.copy(product.options);

        var isLastRequiredOption = (lastItem && !nextSection && prototypeProductOption.isRequired);

        if (isLastRequiredOption) {
            $scope.model.nextButtonLabel = 'Done';
        }

        var isProductCategoryOption = sectionItem.prototypeProductOption.systemAttribute==='ProductCategory';
        if (isProductCategoryOption) 
            $scope.autoSaver.setEnabled(false);
        else
            $scope.autoSaver.setEnabled(true);

        function filterItems(items) {
            var items = _.filter(items, function(item) {
                var childInfo = productPrototype.getPrototypeProductOptionValueChildren($scope.optionCode, item.code);
                if (!childInfo || childInfo.children.length===0) return true;

                var children = optionVisibilityFilter(childInfo.children, product, sectionItem.prototypeProductOption.effectiveCode);
                return (children.length>0); 
            });
            return items;
        }

        function findOptionValue(items, valueCode) {
            for (var i = 0; i < items.length; i++) {
                if (items[i].productOptionValue.code===valueCode) {
                    return items[i];
                }
            }
        }

        function sortItems(items, sortType) {
            items = optionVisibilityFilter(items, product, $scope.optionCode);
            if (items.length===0) return items;

            if (!sortType || sortType==='Default') return items;

            items = _.sortBy(items, function(item) { 
                if (item.layoutSize) {
                    return item.layoutSize.width * item.layoutSize.height;
                }
                return item.productOptionValue.displayName 
            });
            if (sortType==='AlphabeticDescending') {
                items = items.reverse();
            }
            return items;
        }

        function refreshNextButton() {
            if (secondaryOption && secondaryOption.optionCode && secondaryOption.items.length>0) {
                $scope.model.nextButtonEnabled = (product.options[$scope.optionCode] && product.options[secondaryOption.optionCode]);
            } else {
                $scope.model.nextButtonEnabled = !!product.options[$scope.optionCode];
            }
            if (!prototypeProductOption.isRequired) {
                if (!$scope.model.nextButtonEnabled) {
                    $scope.model.nextButtonEnabled = true;
                    $scope.model.nextButtonLabel = 'Skip';
                    $scope.model.optionalAddOn = false;
                } else {
                    $scope.model.nextButtonLabel = 'Next';
                    $scope.model.optionalAddOn = true;
                }
            }

            if (prototypeProductOption.effectiveParams && prototypeProductOption.effectiveParams.allowRemove===false) {
                $scope.model.optionalAddOn = false;
                $scope.model.nextButtonLabel = 'Next';
            }
        }

        function doNesting(items, optionCode) {
            var val = product.options[optionCode],
                optionValue = findOptionValue(items, val);
                
            $scope.items = filterItems(items);
            $scope.optionCode = optionCode;
            $scope.model.currentOptionCode = optionCode;

            if (optionValue) {
                var childInfo = productPrototype.getPrototypeProductOptionValueChildren($scope.optionCode, optionValue.code);

                if (childInfo && childInfo.children.length>0) {
                    secondaryOption.optionCode = childInfo.option.effectiveCode;
                    secondaryOption.items = sortItems(childInfo.children, childInfo.option.sortType);
                }
            }
        }

        function changeCategory(category) {
            var yesCallback = function() {
                    product.options[$scope.optionCode] = category;

                    $rootScope.buildSpinner = true;    
                    ProductPrototype.getDefault(function(productPrototype) {
                        product.prototypeId = productPrototype.id;
                        product.$save(function(value) {
                            BuildService.goToNextWizardStep(sectionItem, section, sections, productPrototype, product, true);
                        });
                    });
                },
                noCallback = function() {
                    product.options[$scope.optionCode] = previousCategory;
                    previousCategory = null;
                };

            var msg = 'Changing ' + sectionItem.displayLabel.toLowerCase() + ' will cause a total reset. Do you wish to continue?';
            MessageService.ask(msg, 'alert', [{ label: 'Yes', callback: yesCallback }, { label: 'No', callback: noCallback }]);
        }

        function checkForPrototypeChanges() {
            var productPrototypeChanged = product.options._productPrototype &&
                product.options._productPrototype!==productPrototype.code && 
                (productPrototype.tag||'').indexOf(product.options._productPrototype)===-1;

            if (product.id && productPrototypeChanged) {
                //show the spinner
                $rootScope.buildSpinner = true;
                $scope.autoSaver.setEnabled(false);
                $scope.model.productPrototypeChanging = true;
                ProductPrototype.getByCode({code:product.options._productPrototype}, function(productPrototype) {

                    var pageCount = product.options._pageCount;
                    if (pageCount>0 && $scope.productPrototype.productPageType!==productPrototype.productPageType) {
                        if (productPrototype.productPageType==='SpreadBased') {
                            product.options._pageCount = (product.options._pageCount / 2) + 1;
                        } else {
                            product.options._pageCount *= 2;
                        }
                    }

                    product.prototypeId = productPrototype.id;
                    product.$save(function(value) {

                        $state.go('build.section.option', {
                            section: section.url,
                            optionUrl: sectionItem.url,
                            productId: value.id,
                            category: null,
                            name: null
                        },
                        { reload:true });

                    });
                });
                return;
            }
        }

        $scope.$watch(function() {
            refreshNextButton();
        });

        var selectedCategory,
            previousCategory;


        $scope.selectItem = function(item) {

            if (isProductCategoryOption) {
                selectedCategory = item.code;
                if (!previousCategory)
                    previousCategory = product.options[$scope.optionCode];
                if (userSettings) {
                    //save recently selected category
                    if (!userSettings.settings) {
                        userSettings.settings = {};
                        userSettings.user = AuthService.getCurrentUser();
                    }
                    userSettings.settings.coverBuilderCategory = selectedCategory;
                    userSettings.$save();
                }
            }
            
            var firstTimeSelection = !product.options[$scope.optionCode];

            product.options = angular.copy($scope.model.previewOptions);
            ProductService.setProductOption(product, productPrototype, $scope.optionCode, item.code);
            
            var childInfo = productPrototype.getPrototypeProductOptionValueChildren($scope.optionCode, item.code);

            if (childInfo && childInfo.children.length>0) {
                secondaryOption.optionCode = childInfo.option.effectiveCode;
                secondaryOption.items = sortItems(childInfo.children, childInfo.option.sortType);
            } else {
                secondaryOption.items = [];
            }

            $scope.fillDefaultValues();
            if (!product.options[secondaryOption.optionCode] && secondaryOption.items.length>0) {
                //preselect first item
                ProductService.setProductOption(product, productPrototype, 
                    secondaryOption.optionCode, secondaryOption.items[0].code);
                $scope.fillDefaultValues();
            }
            if ($scope.model.viewCtrl) $scope.model.viewCtrl.refresh();

            $scope.model.previewOptions = angular.copy(product.options);
            
            checkForPrototypeChanges();
            refreshNextButton();    

            if (item.productOptionValue.params && item.productOptionValue.params.autoNext) {
                $timeout(function() {
                     $scope.$parent.next();
                });
            }        
        };

        $scope.$on('build-next-click', function() {
            if (isProductCategoryOption && selectedCategory && 
                previousCategory!==product.options[$scope.optionCode]) {
                changeCategory(selectedCategory);
                return;
            }
            if (isLastRequiredOption) {
                $scope.finishCoverBuilderWorkflow();
            } else {
                BuildService.goToNextWizardStep(sectionItem, section, sections, productPrototype, product);
            }
        });

        $scope.$on('build-back-click', function() {
            // history.back();
            BuildService.goToNextWizardStep(sectionItem, section, sections, productPrototype, product, false, -1);
        });

        $scope.$on('build-remove-optional-addon-click', function() {
            $scope.model.sidebarAnimation = 'right';
            product.options[optionCode] = null;
            $scope.fillDefaultValues();
            $state.go('^');
        });

        
        doNesting(items, $scope.optionCode);
       
        //preselect first item
        var systemAttribute = sectionItem.prototypeProductOption.systemAttribute;
        if (!product.id && userSettings && userSettings.settings && userSettings.settings.coverBuilderCategory && systemAttribute==='ProductCategory') {
            var item = _.findWhere($scope.items, {code:userSettings.settings.coverBuilderCategory});
            if (item) $scope.selectItem(item);
        }  else if (!product.id && systemAttribute==='ProductPrototype' && product.prototypeId && productPrototype) {
            var item = _.findWhere($scope.items, {code: productPrototype.code});
            if (item) $scope.selectItem(item);
        } else if (['ProductCategory','ProductPrototype'].indexOf(systemAttribute)>=0 && $scope.items.length>0 && !product.id) {
            $scope.selectItem($scope.items[0]);
        }  else if ($scope.items.length===1 && !$scope.model.nextButtonEnabled) {
            $scope.selectItem($scope.items[0]);
        } else if (!prototypeProductOption.isRequired && prototypeProductOption.effectiveParams && prototypeProductOption.effectiveParams.defaultValue) {
            var item = _.findWhere($scope.items, {code: prototypeProductOption.effectiveParams.defaultValue});
            if (item) $scope.selectItem(item);
        }
        
    }]);
