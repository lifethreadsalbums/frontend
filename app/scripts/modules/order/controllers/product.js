'use strict';

angular.module('pace.order')
    .controller('ProductCtrl', ['$scope', '$stateParams', '$timeout', '$state', 'Product', 'AuthService',
        'MessageService', '$rootScope', '$debounce', '$location', 'Currency', 'ProductService',
        'products', 'ProductPrototype', '$q', 'CartService', 'ProductAutoSaveService', 'ModelEvent',
        'TextureCache', 'DataCacheService', 'MainNavService',
        function ($scope, $stateParams, $timeout, $state, Product, AuthService,
            MessageService, $rootScope, $debounce, $location, Currency, ProductService,
            products, ProductPrototype, $q, CartService, ProductAutoSaveService, ModelEvent,
            TextureCache, DataCacheService, MainNavService) {

        //console.log('ProductCtrl', product);
        var product = null,
            productPrototype = null,
            layoutSizeOptionCode = null,
            defaultPrototype = ProductPrototype.getDefault(),
            autoSaver;

        if($state.current.data && typeof $state.current.data.forceReadOnly !== 'undefined') {
            $scope.forceReadOnly = $state.current.data.forceReadOnly;
        } else {
            $scope.forceReadOnly = false;
        }

        $scope.selectedTab = 0;
        $scope.currentProduct = product;
        $scope.saving = false;
        if ($scope.toolBarModel)
            $scope.toolBarModel.isFavourite = !!product.isFavourite;

        MainNavService.setCurrentController(this);

        function selectDuplicate(duplicateId) {
            var product = $scope.currentProduct,
                id = parseInt(duplicateId),
                child = _.findWhere(product.children, {id:id});

            if (child) {
                $scope.selectedTab = product.children.indexOf(child) + 1;
            }
        }

        function setupProduct(product, duplicateId) {
            var currentUser = AuthService.getCurrentUser(),
                isAdmin = currentUser && currentUser.admin;

            $scope.currentProduct = product;
            $scope.readOnly = !isAdmin && product.state!=='New';
            $scope.editable = !$scope.readOnly;
            $rootScope.designerDisabled = !(product.layoutId);
            if (duplicateId) selectDuplicate(duplicateId);

            ProductPrototype.get({id:product.prototypeId}, function(prototype) {
                productPrototype = prototype;
                var layoutSizeOption = productPrototype.getOptionWithAssociatedEntity('layoutSize') || {};
                layoutSizeOptionCode = layoutSizeOption.effectiveCode;
                $scope.productPrototype = productPrototype;

                if (productPrototype.productType!=='SinglePrintProduct') {
                    $scope.children = product.children;
                } else {
                    $scope.children = [];
                }

                autoSaver.setProduct(product, productPrototype);
                autoSaver.setEnabled(!$scope.readOnly);

                if (!product.id) refreshPrice();
            });

            $rootScope.lastProductId = product.id;
        }

        $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            if ($scope.currentProduct && $scope.currentProduct.id && autoSaver.isDirty()) {
                event.preventDefault();
                console.log('product changed, saving before switching state');
                autoSaver.save().then(function() {
                    $state.go(toState.name, toParams);
                });
            }
        });

        $scope.$on('$stateChangeSuccess',
            function(event, toState, toParams, fromState, fromParams) {
                //console.log('stateChangeSuccess', toState, toParams);
                var duplicateId = toParams.duplicateId ? parseInt(toParams.duplicateId) : null;

                if (toState.name.indexOf('.details')>0) {
                    var id = parseInt(toParams.id);
                    $scope.selectedTab = 0;
                    var product = _.findWhere(products, {id:id});
                    if (product) {
                        //oldProduct = angular.copy(product);
                        $timeout(function() {
                            setupProduct(product, duplicateId);
                        }, 500);

                    } else {
                        return Product.get({id:id}, function(value) {
                            //oldProduct = angular.copy(value);
                            setupProduct(value, duplicateId);
                        });
                    }
                } else if (toState.name==='orders.new' || toState.name==='adminOrders.new') {
                    var product;

                    if (toParams.prototypeId) {
                        product = Product.createFromPrototype(toParams.prototypeId, toParams.name);
                    } else if (toParams.reprint) {
                        product = Product.createReprint(parseInt(toParams.id), toParams.name);
                    } else if (toParams.id) {
                        product = Product.createFromTemplate(parseInt(toParams.id), toParams.name);
                    } else {
                        product = new Product({
                            options: {
                                _name: toParams.name,
                                _quantity:1,
                            },
                            children: []
                        });
                    }

                    $q.when(product).then(setupProduct);
                }

            });

        $scope.$on(ModelEvent.ModelChanged, function(event, args) {
            //TODO: fix!!
            // if (args.type==='Product') {
            //     var p = _.findWhere(args.items, {id:$scope.currentProduct.id});
            //     if (p) {
            //         setupProduct(p);
            //     }
            // }
        });

        $scope.addChild = function() {
            var product = $scope.currentProduct;
            ProductService.createDuplicate(product)
                .then(function(child) {
                    product.children.push(child);
                    $scope.selectedTab = product.children.indexOf(child) + 1;
                });
        };

        $scope.reorder = function() {
            $rootScope.productSpinner = true;
            Product.reorder({id:$scope.currentProduct.id}, function(product) {
                $rootScope.productSpinner = false;
                $state.go('orders.current.details', {id:product.id}, {reload:true});
            }, function(err) {
                $rootScope.productSpinner = false;
            });
        };


        $scope.purchase = function(event) {
            if ($scope.productForm.$valid) {
                event.preventDefault();

                //if ($scope.currentProduct)

                //product is already in cart so go to checkout
                if ($scope.currentProduct.orderState==='Pending') {
                    $state.go('checkout.cart');
                    return;
                }

                //add to cart
                $scope.saving = true;
                CartService.addToCart([$scope.currentProduct]).then(
                    function (cart) {
                        $scope.saving = false;
                        $state.go('checkout.cart');
                    },
                    function (error) {
                        $scope.saving = false;
                    }
                );
            }
        };

        $scope.save = function() {

            var product = $scope.currentProduct,
                isNew = !product.id;

            console.log('Saving product...', product);

            $scope.saving = true;
            $rootScope.productDetailsSpinner = true;
            product.$save(function(value) {

                $scope.saving = false;
                $scope.productForm.$setPristine();

                $rootScope.$broadcast('product-saved', { isNew:isNew, product:value });

                if (isNew) {
                    if (product.isReprint) {
                        $state.go('adminOrders.readyToPrint.details', {id:value.id}, {reload:true});
                    } else {
                        DataCacheService.clear();
                        $state.go('dashboard.default.overview.product', {productId:value.id});
                    }
                }
                $rootScope.productDetailsSpinner = false;
                autoSaver.setProduct(product, productPrototype);

            }, function(error) {
                $scope.saving = false;
                $rootScope.productDetailsSpinner = false;

                if (error.data && error.data.error) {
                    if (error.data.type==='com.poweredbypace.pace.exception.ProductNameExistsException') {

                        var txt = 'The project name "' + product.options._name + '" already exists. Please modify it as project names must be unique.';
                        MessageService.ok(txt);
                        return;
                    }
                    MessageService.error(error.data.error);
                }
            });
        };

        /**
        Autosaves the current product when the product has ID, meaning it has been already saved to the DB
        */
        function refreshPrice() {
            var product = $scope.currentProduct;
            Product.calculatePrice(product, function(result) {
                if (result) {
                    product.subtotal = result.subtotal;
                    product.total = result.total;
                    product.productPrices = result.productPrices;
                }
            });
        }

        function deleteProduct() {
            if ($scope.readOnly) return;

            if (!$scope.currentProduct.id) {
                $scope.cancel();
                return;
            }

            MessageService.confirm('Do you really want to delete this project?', function() {
                if (!$scope.currentProduct.id) {
                    $location.url('/orders');
                } else {

                    Product.delete({id:$scope.currentProduct.id}, function() {
                        $rootScope.$broadcast('product-deleted', { id:$scope.currentProduct.id });
                        $scope.currentProduct = null;
                        $state.go('^');
                    });

                }
            });
        }

        function deleteChild(index) {
            if ($scope.readOnly) return;

            ProductPrototype.get({id:$scope.currentProduct.prototypeId}, function(prototype) {
                MessageService.confirm('Do you really want to delete this ' + prototype.duplicateDisplayName +'?',
                    function () {
                        $scope.currentProduct.children.splice(index, 1);
                        $scope.selectedTab = $scope.selectedTab - 1;
                    }
                );
            });
        }

        $scope.toggleOption = function(code) {
            $scope.currentProduct.options[code] = !$scope.currentProduct.options[code];
            $scope.productForm.$setDirty();
        };

        $scope.cancel = function(event) {
            if (event) event.preventDefault();

            MessageService.confirm('Do you really want to cancel this order?',  function() {
               if (!$scope.currentProduct.id) {
                    $state.go('dashboard.default.overview');
                } else {
                    $state.go('orders.current');
                }
            });

        };

        function onSave(product) {
            $scope.productForm.$setPristine();
            var isNew = !product.id;
            $rootScope.$broadcast('product-saved', { isNew:isNew, product:product });
        }

        function onDirty(product) {
            if (!product.id && product.prototypeId && !$scope.saving) {
                refreshPrice();
            }
            $scope.currentProductView = ProductService.getProductViewModel(product);
        }

        autoSaver = new ProductAutoSaveService($scope, onSave, onDirty);

        $scope.handleTabClose = function (index) {
            if (index===0)
                deleteProduct();
            else
                deleteChild(index - 1);
        };

        $scope.toggleLinkLayout = function (index) {
            $scope.currentProduct.children[index - 1].linkLayout = !$scope.currentProduct.children[index - 1].linkLayout;
            $scope.save();
        };

        function gotoState(state, params) {
            $state.go(state, params);
        }

        this.getCurrentProductInfo = function() {
            var activeForm = $scope.productForm.mainProduct.getActiveForm() || 'details';
            activeForm = activeForm.replace('form_','');

            var form = $('[name=form_'+activeForm+']'),
                optionUrl = $scope.productForm.mainProduct.getLastField(),
                formEl;

            //var form = $('[name=form_'+activeForm+']');
            // console.log(form);
            // var optAttr = form.attr('product-options');
            // if (optAttr) {
            //     var options = optAttr.split(',');
            //     if (options.length===1) {
            //         var option = model.productPrototype.getPrototypeProductOption(options[0]);
            //         console.log(option)
            //     }
            // }
            if (optionUrl) {
                formEl = form.find('[name=]'+optionUrl);
                if (formEl.length===0) optionUrl = null;
            }

            if (!optionUrl) {
                formEl = form.find('.form-element[name]');
                if (formEl.length===1) {
                    optionUrl = formEl.attr('name');
                }
            }

            var product = $scope.currentProduct,
                parentProduct = null;
            if ($scope.selectedTab>0) {
                parentProduct = product;
                product = $scope.currentProduct.children[$scope.selectedTab - 1];
            }

            if ($state.params.optionUrl) {
                optionUrl = $state.params.optionUrl;
            }

            if ($state.params.section) {
                activeForm = $state.params.section;
            }

            return { 
                product: product, 
                section: activeForm, 
                optionUrl: optionUrl
            };
        };

        $scope.openDesigner = function() {
            gotoState('layout', { productId:$scope.currentProduct.id });
        };

        $scope.deleteProduct = deleteProduct;

    }]);
