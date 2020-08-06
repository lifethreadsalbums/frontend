'use strict';

angular.module('pace.build')
    .controller('BuildCtrl', ['$scope', '$rootScope', 'product', 'productPrototype', 'sections', '$state', 'Product',
        'BuildService', '$debounce', 'ProductPrototype', '$parse', 'Currency', 'ProductPageType', '$timeout', 'ProductService',
        'MessageService', 'LogoFile', 'DebossingService', 'CartService', 'ProductAutoSaveService', 'DataCacheService', 'currentStore', 'AuthService',
        'MainNavService', '$q',
        function ($scope, $rootScope, product, productPrototype, sections, $state, Product,
            BuildService, $debounce, ProductPrototype, $parse, Currency, ProductPageType, $timeout, ProductService,
            MessageService, LogoFile, DebossingService, CartService, ProductAutoSaveService, DataCacheService, currentStore, AuthService,
            MainNavService, $q) {

            //console.log('BuildCtrl', product);

            MainNavService.setCurrentController(this);

            this.getCurrentProductInfo = function() {
                return { 
                    product: product, 
                    section: $state.params.section, 
                    optionUrl: $state.params.optionUrl
                };
            };

            var savingEnabled = true,
                autoSaver;

            var user = AuthService.getCurrentUser();
            var isAdmin = user && user.admin;

            $scope.product = product;
            $scope.currentProduct = product;
            $scope.productPrototype = productPrototype;
            $scope.sections = sections;
            $scope.stateInfo = {};
            $scope.currentProductView = ProductService.getProductViewModel(product, productPrototype);
            $scope.editable = isAdmin || product.state === 'New' || !product.orderState || product.orderState==='Pending';
            $scope.screenshotMode = !!$state.params.screenshot;

            $scope.isSinglePrintProduct = $rootScope.isSinglePrintProduct = (productPrototype.productType==='SinglePrintProduct');
            $scope.darkTheme = $scope.isSinglePrintProduct;

            var layoutSizeOption = productPrototype.getOptionWithAssociatedEntity('layoutSize') || {},
                layoutSizeOptionCode = layoutSizeOption.effectiveCode;

            var studioSampleOption = productPrototype.getPrototypeProductOption('_studioSample');
            $scope.studioSampleAvailable = !!studioSampleOption;

            $scope.model = {
                nextButtonEnabled: true,
                nextButtonVisible: true,
                nextButtonLabel: 'Next',
                sidebarAnimation: 'left',
                printsOption: false
            };

            //preload default material
            var img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = PACE.StoreConfig.defaultMaterialUrl + '?v=1';

            if (!product.id) {
                fillDefaultValues();
            }

            $scope.onKeyDown = function(e) {
                $scope.$broadcast('build:keydown', e);
            };

            $scope.beforeAddToCartPromises = [];

            function addToCart() {
                if (product.orderState!==null)
                    CartService.checkout().catch(function(error) {
                        $rootScope.buildSpinner = false;
                    });
                else {
                    CartService.addToCart([product]).then(
                        function (cart) {
                            $state.go('checkout.cart');
                        },
                        function (error) {
                            $rootScope.buildSpinner = false;
                            console.log('error', error);
                        }
                    );
                }
            }

            $scope.addToCart = function () {
                $rootScope.buildSpinner = true;
                $scope.beforeAddToCartPromises = [];

                if (autoSaver.isDirty()) {
                    var promise = autoSaver.save();
                    $scope.beforeAddToCartPromises.push(promise);
                }

                $scope.$broadcast('build:before-add-to-cart');

                $q.all($scope.beforeAddToCartPromises).then(addToCart);
            };

            $scope.selectProduct = function() {
                var params = {
                    productId: $scope.selectedProduct.id,
                    category: null,
                    name: null
                };

                if ($scope.selectedProduct.id!==product.parentId &&
                    $scope.selectedProduct.parentId!==product.id &&
                    $scope.selectedProduct.parentId!==product.parentId) {
                    //go to the first section if we are not switching between duplicates
                    params.section = sections[0].url;
                    params.optionUrl = null;
                }
                if ($scope.selectedProduct.parentId && $state.params.optionUrl==='parent-albums') {
                    params.section = $state.params.section;
                    $state.go('build.section', params, { reload:true });
                    return;
                }

                $state.go($state.current.name, params, { reload:true });
            };

            $scope.finishCoverBuilderWorkflow = function() {
                if (product.options._pageCount) {
                    $rootScope.buildSpinner = true;
                    $rootScope.designerDisabled = false;
                    if (productPrototype.productType==='SinglePrintProduct') {
                        $state.go('prints', {productId:product.id});
                    } else if (productPrototype.productType==='DesignableProduct') {
                        $state.go('layout', {productId:product.id});
                    }
                } else {
                    //add to cart
                    $scope.addToCart();
                }
            };

            function updateProducts() {
                var result = [];
                var productInfo = function(value, indent) {
                    return {
                        id: value.id,
                        name: ((value && value.options._name) ? value.options._name : ''),
                        parentId: value.parentId,
                        labelPreIcon: 'projects',
                        indent: indent,
                    };
                };

                _.each($scope.myProducts, function(product) {
                    result.push(productInfo(product, false));
                    if (product.productType !== 'SinglePrintProduct') {
                        _.each(product.children, function (child) {
                            result.push(productInfo(child, true));
                        });
                    }
                });

                $scope.products = result;
            }

            Product.getMyProducts({state:'New'}, function(products) {
                var idx = _.findIndex(products, {id:product.id});
                if (idx>=0)
                    products[idx] = product;
                $scope.myProducts = products;
                updateProducts();
            });

            //prepare sections model
            _.each(sections, function(section) {
                section.requiredItems = [];
                section.optionalItems = [];
                section.optionalItemsVisible = true;
                _.each(section.children, function(item) {
                    if (item.prototypeProductOption.effectiveCode==='_duplicates') {
                        if (!product.parentId)
                            section.optionalItems.push(item);
                        return;
                    }

                    var prototypeProductOption = productPrototype.getPrototypeProductOption(item.prototypeProductOption.effectiveCode);
                    item.visibilityExpression = prototypeProductOption.visibilityExpression;

                    if (prototypeProductOption.isRequired)
                        section.requiredItems.push(item);
                    else
                        section.optionalItems.push(item);
                });
            });

            function processSectionItem(optional, item) {
                item.visible = true;
                if (item.visibilityExpression) {
                    item.visible = ProductService.evalExpression(item.visibilityExpression, product);
                }
                item.enabled = !!($scope.currentProductView.options[item.prototypeProductOption.effectiveCode]);
                item.optional = optional && $scope.currentProductView.numRequired===0;
            }

            $scope.$watch(function() {
                //update number of optional items
                if (!$scope.currentProductView) return;

                for (var i = 0; i < sections.length; i++) {
                    var section = sections[i],
                        count = 0, j, item;

                    for (j = 0; j < section.optionalItems.length; j++) {
                        item = section.optionalItems[j];
                        processSectionItem(true, item);
                        if (item.enabled) count++;
                    }
                    section.numOptionalItems = count;

                    count = 0;
                    for (j = 0; j < section.requiredItems.length; j++) {
                        item = section.requiredItems[j];
                        processSectionItem(false, item);
                        if (item.enabled) count++;
                    }
                    section.numRequiredItems = count;
                    section.enabled = (section.requiredItems.length===0 ||
                        (i>0 && sections[i-1].numRequiredItems===sections[i-1].requiredItems.length) ||
                        count>0);
                };

                $rootScope.designerDisabled = !product.layoutId;

                var totalQty = product.options._quantity;
                for (var i = 0; i < product.children.length; i++) {
                    totalQty += product.children[i].options._quantity;
                };

                $scope.model.addToCartEnabled = $scope.editable && totalQty>0 &&
                    (
                        (product.layoutId) ||
                        ($scope.isSinglePrintProduct)
                    );
            });

            $scope.toggleOption = function(code) {
                $scope.currentProduct.options[code] = !$scope.currentProduct.options[code];
            };

            $scope.changeQuantity = function(increment) {
                if (increment) {
                    product.options._quantity = Math.max(1, product.options._quantity + increment);
                }
            };

            $scope.getOptionUrl = function(section, item) {
                return '#/build/' + product.id + '/' + section.url +
                    (['BuildTextOptionWidget', 'BuildNumericOptionWidget', 'BuildBooleanOptionWidget'].indexOf(item.type)===-1 ? '/' + item.url : '');
            };

            $scope.onOptionClick = function(event, section, item) {
                var value = $scope.currentProductView.options[item.prototypeProductOption.effectiveCode];
                if (!value && !item.optional) {
                    event.preventDefault();
                }
                if (!$scope.editable && item.prototypeProductOption.effectiveCode==='_duplicates') {
                    event.preventDefault();
                }
            };

            function fillDefaultValues() {
                ProductService.validateProduct(product, productPrototype);
                ProductService.fillDefaultValues(product, productPrototype);
                ProductService.validateProduct(product, productPrototype);
                ProductService.fillDefaultValues(product, productPrototype);

                _.each(product.children, function(child) {
                    ProductService.validateChild(child, product, productPrototype);
                    ProductService.fillDefaultValues(child, productPrototype);
                });
            }

            function save() {
                if (!savingEnabled) return;

                if (product.id) {
                    var saveCmd = new PACE.SaveProductCommand(product);
                    var lastSavePromise = saveCmd.execute();
                    lastSavePromise.then(function() {
                        updateProducts();
                    });
                }
            }

            $scope.fillDefaultValues = fillDefaultValues;
            $scope.saveProduct = $debounce(save, 1000);

            $scope.next = function() {

                var productPrototypeChanged = (product.options._productPrototype &&
                    product.options._productPrototype!==productPrototype.code &&
                    (productPrototype.tag||'').indexOf(product.options._productPrototype)===-1) || (!!$state.params.prototypeId);

                //save new product when product prototype has been changed
                if (!product.id && productPrototypeChanged) {
                    //show the spinner
                    $rootScope.buildSpinner = true;
                    autoSaver.setEnabled(false);
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

                            DataCacheService.clear();
                            var section = _.findWhere(sections, { url:$state.params.section });
                            var sectionItem = _.findWhere(section.children, { url:$state.params.optionUrl });

                            var idx = sections.indexOf(section);
                            var nextSection = (idx + 1)<sections.length ? sections[idx + 1] : null;

                            if (nextSection && nextSection.url) {
                                BuildService.goToNextWizardStep(sectionItem, section, sections, productPrototype, value, true);
                            } else {
                                 $scope.$broadcast('build-next-click');
                            }
                        });

                    });
                    return;
                }

                fillDefaultValues();
                $scope.model.sidebarAnimation = 'left';
                //$scope.model.optionalAddOn = false;

                $scope.$broadcast('build-next-click');
            };

            $scope.back = function() {
                $scope.model.sidebarAnimation = 'right';
                $scope.$broadcast('build-back-click');
            };

            $scope.removeOptionalAddon = function() {
                $scope.$broadcast('build-remove-optional-addon-click');
            };

            function onSave(product) {
                updateProducts();
                $scope.$broadcast('build-product-saved');
            }

            function onDirty(product) {
                $scope.currentProductView = ProductService.getProductViewModel(product, productPrototype);
                updateProducts();
            }

            autoSaver = new ProductAutoSaveService($scope, onSave, onDirty);
            autoSaver.setProduct(product, productPrototype);
            autoSaver.setSizeDetection(!$scope.isSinglePrintProduct);
            autoSaver.setPagesDetection(!$scope.isSinglePrintProduct);
            autoSaver.setLinkingDetection(!$scope.isSinglePrintProduct);

            $scope.autoSaver = autoSaver;
            $scope.productAutoSaver = autoSaver;

            function gotoState(state, params) {
                $state.go(state, params);
            }

            function openDesigner() {
                gotoState('layout', { productId: product.id });
            };

           
            $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
                if (toState.name.indexOf('build')===-1 && autoSaver.isDirty() && product.id) {
                    event.preventDefault();
                    console.log('product changed, saving before switching state');
                    $rootScope.buildSpinner = true;
                    autoSaver.save().then(function() {
                        $rootScope.buildSpinner = false;
                        $state.go(toState.name, toParams);
                    });
                }
            });

            $scope.$on('$stateChangeStart',
                function(event, toState, toParams, fromState, fromParams) {

                    var prevParams = fromParams;
                    if (fromState && fromState.name==='') {
                        prevParams = toParams;
                    }

                    if (toParams.section && prevParams.section) {
                        var toSection = _.findWhere(sections, { url:toParams.section }),
                            toSectionItem = toSection && toSection.children ? _.findWhere(toSection.children, { url:toParams.optionUrl }) : null,
                            fromSection = _.findWhere(sections, { url:prevParams.section }),
                            fromSectionItem = fromSection && fromSection.children ? _.findWhere(fromSection.children, { url:prevParams.optionUrl }) : null,
                            toSectionType = toSectionItem ? toSectionItem.type : null,
                            fromSectionType = fromSectionItem ? fromSectionItem.type : null;

                        if (toSectionType==='BuildEndPapersViewWidget' ||
                            fromSectionType==='BuildEndPapersViewWidget' ||
                            toSectionType==='BuildSlideshowViewWidget' ||
                            fromSectionType==='BuildSlideshowViewWidget' ||
                            toSectionType==='BuildNumericOptionSubsectionWidget' ||
                            fromSectionType==='BuildNumericOptionSubsectionWidget' ||
                            (fromSectionType==='BuildBoxViewWidget' && toSectionType!=='BuildBoxViewWidget') ||
                            (fromSectionType!=='BuildBoxViewWidget' && toSectionType==='BuildBoxViewWidget')
                        ) {
                            $('#content, #content2').addClass('fade-animation');
                        } else {
                            $('#content, #content2').removeClass('fade-animation');
                        }
                    }

                    //$scope.model.optionalAddOn = false;
                }
            );

            $scope.$on('$stateChangeSuccess',
                function(event, toState, toParams, fromState, fromParams) {
                    $scope.stateInfo = {
                        fromState: fromState,
                        fromParams: fromParams,
                        toState: toState,
                        toParams: toParams,
                    };
                }
            );

            //assign default logo
            if (product.id && !product.options._name) {
                var logoOption = _.findWhere(productPrototype.prototypeProductOptions, { systemAttribute:'CustomLogo' });
                if (logoOption) {
                    LogoFile.getMyLogos(function(logos) {
                        if (logos && logos.length>0) {
                            var defaultLogo = DebossingService.getDefaultLogo(logos, product, productPrototype, logoOption);
                            product.options[logoOption.effectiveCode] = defaultLogo;
                            //console.log('Default logo', defaultLogo);
                        }
                    });
                }
            }

            $scope.bottomContainerState = '';
            var printsResizedEvent = $rootScope.$on('PRINTS_BOTTOM_CONTAINER_RESIZED', function(e, data) {
                $scope.bottomContainerState = data.state;
            });

            $scope.$on('$destroy', function() {
                printsResizedEvent();
            });

        }]);
