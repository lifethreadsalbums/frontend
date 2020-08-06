'use strict';

angular.module('pace.dashboard')
    .controller('CalculatorCtrl', ['$scope', '$state', '_', '$timeout', 'productPrototype', 'sections', 'BuildService', 'ProductPrototype',
                'Product', 'AuthService', '$parse', 'DebossingService', 'Order', 'ProductService',
        function ($scope, $state, _, $timeout, productPrototype, sections, BuildService, ProductPrototype, 
                  Product, AuthService, $parse, DebossingService, Order, ProductService) {
            /* jshint indent: false */

            $scope.customClass = 'level1';
            $scope.quantityOptions = _.map(_.range(0,11), function(item) { return { value:item } });
            $scope.mainQuantityOptions = _.map(_.range(1,11), function(item) { return { value:item } });

            var defaultPrototype = productPrototype,
                defaultProduct = {
                    prototypeId: productPrototype.id,
                    options: {
                        _name: 'Main Album',
                        _quantity: 1,
                    }
                },
                widgetItems = {
                    'BuildStampWidget': [
                        {
                            displayName: '1 Line',
                            code: { type: 'TextStampElement', text:'line1' }
                        },
                        {
                            displayName: '2 Line',
                            code: { type: 'TextStampElement', text:'line1\r\nline2' }
                        }
                    ],
                    'BuildCustomDieWidget': [
                        {
                            displayName: 'Yes',
                            code: { type: 'ImageStampElement' }
                        },
                        {
                            displayName: 'No',
                            code: null
                        }
                    ]
                };
                

            var product = $scope.product = angular.copy(defaultProduct);

            function getNestedOptionCodes(code, result) {
                var result = result || [code];
                var option = productPrototype.getPrototypeProductOption(code),
                    optionValues = option.prototypeProductOptionValues;

                if (optionValues) {
                    var optionValue = productPrototype.getPrototypeProductOptionValue(code, product.options[code]);
                    if (optionValue) {
                        optionValues = [ optionValue ];
                    }
                    _.each(optionValues, function(item) {
                        if (item.children && item.children.length>0 &&
                            item.prototypeProductOption.effectiveCode!=='productType') {

                            var childCode = item.children[0].prototypeProductOption.effectiveCode;
                            if (result.indexOf(childCode)===-1) {
                                result.push(childCode);
                                getNestedOptionCodes(childCode, result);
                            }
                        }
                    });
                }
                return result;
            }

            function makeMenus(sections) {
                var children = _.flatten( _.pluck(sections, 'children') );
                children = _.filter(children, function(item) {
                    return ['_name', '_quantity'].indexOf(item.prototypeProductOption.effectiveCode)<0;
                });
                $scope.menu1 = _.map(children, function(item) {

                    var option = productPrototype.getPrototypeProductOption(item.prototypeProductOption.effectiveCode);

                    return {
                        code: item.prototypeProductOption.effectiveCode,
                        type: item.type,
                        displayLabel: item.displayLabel,
                        option: option, 
                        visibilityExpression: option.visibilityExpression
                    };

                });
                $scope.menu1.push({
                    type: 'AddParentAlbum',
                    displayLabel: 'Add Parent Album'
                });
            }

            function changePrototype(code) {
                $scope.loadingPrototype = true;

                ProductPrototype.getByCode({code:code},
                    function(prototype) {

                        _.each(product.options, function(value, key) {
                            var opt = _.findWhere(defaultPrototype.prototypeProductOptions, { effectiveCode:key });
                            if (!opt)
                                delete product.options[key];
                        });

                        productPrototype = prototype;
                        product.prototypeId = prototype.id;
                        ProductService.fillDefaultValues(product, prototype);

                        BuildService.getSectionsByPrototypeId(prototype.id)
                            .then(function(sections) {
                                makeMenus(sections);
                                $scope.loadingPrototype = false;
                            });
                    });
            }

            function refreshPrice() {

                ProductService.fillDefaultValues(product, productPrototype);

                var fn = function(result) { $scope.order = result };

                $scope.calculatingPrice = true
                Order.calculatePrice(product, function(result) { 
                    $scope.order = result;
                    $scope.calculatingPrice = false;
                });
                $scope.calculatingShippingPrice = true;
                Order.calculateShippingPrice(product, function(result) { 
                    $scope.order = result;
                    $scope.calculatingShippingPrice = false;
                });
            }

            function showDuplicateSizes() {
                var layoutSizeOption = productPrototype.getLayoutSizeOption(),
                    sizeCode = product.options[layoutSizeOption.effectiveCode],
                    layoutSizeOptionValue = productPrototype.getPrototypeProductOptionValue(layoutSizeOption.effectiveCode, sizeCode),
                    layoutSize = layoutSizeOptionValue.layoutSize,
                    ratio = layoutSize.width / layoutSize.height,
                    items = [];

                _.each(layoutSizeOption.prototypeProductOptionValues, function(optionValue) {
                    var ratio2 = optionValue.layoutSize.width / optionValue.layoutSize.height;
                    if (Math.abs(ratio - ratio2)<=0.01) {
                        var item = angular.copy(optionValue);
                        item.quantity = 0;
                        item.type = 'AddParentAlbum';
                        //find duplicate to obtain previously selected qty
                        var dup = _.find(product.children, function(child) {
                            return child.options[layoutSizeOption.effectiveCode] === optionValue.code;
                        });
                        if (dup) {
                            item.quantity = dup.options._quantity;
                        }

                        items.push(item);
                    }
                });

                $scope.menu2 = items;
                $scope.customClass = 'level2';
            }

            $scope.selectItem = function(level, item) {
                
                if (level===1) {
                    $scope.currentItem = item;
                    $scope.currentItemIndex = $scope.menu1.indexOf(item);

                    if (item.type==='AddParentAlbum') {

                        showDuplicateSizes();

                    } else if (widgetItems[item.type]) {

                        var items = widgetItems[item.type];
                        _.each(items, function(widgetItem) {
                            widgetItem.prototypeProductOption = item.option;
                        });
                        $scope.menu2 = items;
                        $scope.customClass = 'level2';

                    } else {

                        BuildService.getProductOptionValuesAsItemList(
                                product, 
                                item.option.effectiveCode)
                            .then(function(items) {
                                $scope.menu2 = items;
                                $scope.customClass = 'level2';
                            });

                    }
                    
                    //console.log('selectItem', item);

                } else if (level>=2) {
                    product.options[item.prototypeProductOption.effectiveCode] = item.code;
                    $scope.currentItem.selected = true;
                    if (item.prototypeProductOption.effectiveCode==='_productPrototype') {
                        changePrototype(item.code);
                    }
                    if (item.children && 
                        item.children.length>0 &&
                        item.prototypeProductOption.effectiveCode!=='_productPrototype' &&
                        item.prototypeProductOption.effectiveCode!=='productType') {
                        $scope.customClass = 'level' + (level+1);
                        $scope['menu' + (level+1)] = item.children;
                    } else {
                        $scope.customClass = 'level1';
                    }
                    refreshPrice();
                } 

		    };

            $scope.isSelected = function(item) {
                if (item.option) {
                    var selected = true,
                        codes = getNestedOptionCodes(item.option.effectiveCode);

                    _.each(codes, function(code) {
                        if (_.isUndefined(product.options[code])) {
                            selected = false;
                        }
                    });

                    return selected;
                } else if (item.prototypeProductOption) {
                    return product.options[item.prototypeProductOption.effectiveCode] === item.code;
                }
                return false;
            };

            $scope.isEnabled = function(index) {
                if (index<=0) {
                    return true;
                } else {
                    return $scope.isSelected($scope.menu1[index - 1]) && 
                        $scope.isEnabled(index - 1);  
                }
            };

            $scope.reset = function() {
                product = $scope.product = angular.copy(defaultProduct);
                productPrototype = defaultPrototype;
                BuildService.getSectionsByPrototypeId(productPrototype.id)
                   .then(makeMenus);
                refreshPrice();
            };

            $scope.makeDuplicates = function() {
                product.children = [];
                var idx = 1;
                _.each($scope.menu2, function(item) {
                    if (item.quantity>0) {
                        var dup = { prototypeId: product.prototypeId };
                        dup.options = angular.copy(product.options);
                        dup.options[item.prototypeProductOption.effectiveCode] = item.code;
                        dup.options._quantity = item.quantity;
                        dup.options._name = 'Parent Album ' + idx;
                        product.children.push(dup);
                        idx++;
                    }
                });
                $scope.customClass = 'level1';
                refreshPrice();
            };

            $scope.done = function() {
                $scope.customClass = 'level1';
                refreshPrice();
            };

            $scope.refreshPrice = refreshPrice;

            makeMenus(sections);
            refreshPrice();

        }
    ]);