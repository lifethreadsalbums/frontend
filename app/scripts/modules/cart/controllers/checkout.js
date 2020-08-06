'use strict';

angular.module('pace.cart')
    .controller('CheckoutCtrl', ['$scope', '$rootScope', '$state', '$timeout','Order', 'Product', 'PaymentService',
        'Cart', 'cart', '$window', '$q', '_', '$debounce', 'TermService', 'ProductService', 'ProductPrototype', 'MessageService', 
        'CartService', 'userOrders', 'LeaveSiteService', 'ProductAutoSaveService', 'MainNavService',
        function ($scope, $rootScope, $state, $timeout, Order, Product, PaymentService,
            Cart, cart, $window, $q, _, $debounce, TermService, ProductService, ProductPrototype, MessageService,
            CartService, userOrders, LeaveSiteService, ProductAutoSaveService, MainNavService) {


            MainNavService.setCurrentController(this);

            this.getCurrentProductInfo = function() {

                var product = null;
                if (cart.orderItems.length>0) {
                    product = cart.orderItems[0].product;
                }

                return { 
                    product: product,
                    section: null, 
                    optionUrl: null
                };
            };



            var cartPromise;

            function fixAddresses() {
                cart.billingAddress = null;
                cart.shippingAddress = null;
                cart.dropShippingAddress = null;

                angular.forEach(cart.addresses, function(value, key) {
                    if (value.addressType==='BillingAddress')
                        cart.billingAddress = value;
                    else if (value.addressType==='ShippingAddress')
                        cart.shippingAddress = value;
                    else if (value.addressType==='DropShippingAddress')
                        cart.dropShippingAddress = value;
                });

                if (cart.dropShippingAddress)
                    cart.shipTo = 2;
                else if (cart.shippingAddress)
                    cart.shipTo = 1;
                else
                    cart.shipTo = 0;

                $scope.billingAddress = cart.billingAddress;
                $scope.shippingAddress = cart.shippingAddress;
                $scope.dropShippingAddress = cart.dropShippingAddress;

                if (!$scope.billingAddress) {
                    $scope.billingAddress = {addressType:'BillingAddress'};
                }
                if (!$scope.shippingAddress) {
                    $scope.shippingAddress = angular.copy($scope.billingAddress);
                    $scope.shippingAddress.addressType = 'ShippingAddress';
                    $scope.shippingAddress.id = null;
                }

                if (!$scope.dropShippingAddress) {
                    $scope.dropShippingAddress = {addressType:'DropShippingAddress'};
                }

                if (cart.orderItems.length>0) {
                    cart.notes = cart.orderItems[0].product.options._notes;
                    $rootScope.lastProductId = cart.orderItems[0].product.id;
                }

            }

            function toggleOption(item, option) {
                item.product.options[option] = !item.product.options[option];
                var product = new Product(item.product);

                var res = product.$save(function() {
                    cart.reload();
                });
            }

            function onCartUpdated(result) {
                _.extend(cart, result);
                cartPromise = null;
            }

            function onCartUpdateFail(error) {
                cartPromise = null;
            }

            function setQuantity(item) {
                if (cartPromise) {
                    cartPromise.then(setQuantity.bind(this, item));
                    return;
                }

                var res = Cart.setQuantity( {id: item.id, quantity: item.options._quantity}, onCartUpdated);
                cartPromise = res.$promise;
            }

            function onProductSave() {
                Cart.get(function(result) {
                    _.extend(cart, _.omit(result, 'orderItems'));
                    _.each(cart.orderItems, function(orderItem) {
                        var oi = _.findWhere(result.orderItems, {id:orderItem.id});
                        if (oi) {
                            _.extend(orderItem, _.omit(oi, 'product'));
                        }
                    });
                });
                fixAddresses();
            }

            var autoSavers = {};

            _.each(cart.orderItems, function(oi) {
                var product = oi.product;
                var autoSaver = autoSavers[product.id];
                if (!autoSaver) {
                    console.log('autosaver for', product)
                    ProductPrototype.get({id:product.prototypeId}, function(prototype) {
                        autoSaver = new ProductAutoSaveService($scope, onProductSave);
                        autoSaver.setProduct(product, prototype);
                        autoSavers[product.id] = autoSaver;
                        //autoSaver.setDirty();
                    });
                }
            });

            function setSpoQuantity(product) {
                // var autoSaver = autoSavers[product.id];
                // if (!autoSaver) {
                //     ProductPrototype.get({id:product.prototypeId}, function(prototype) {
                //         autoSaver = new ProductAutoSaveService($scope, onProductSave);
                //         autoSaver.setProduct(product, prototype);
                //         autoSavers[product.id] = autoSaver;
                //         autoSaver.setDirty();
                //     });
                // }
            }



            function removeItem(item) {
                if (cartPromise) {
                    cartPromise.then(removeItem.bind(this, item));
                    return;
                }
                var res = Cart.removeOrderItem({id:item.id}, onCartUpdated);
                cartPromise = res.$promise;
            };

            function saveNotes() {
                // cart.$save(function(result) {
                //     fixAddresses();
                // });
            }

            $scope.saveNotes = $debounce(saveNotes, 500);

            $scope.removeItem = removeItem;

            $scope.setQuantity = $debounce(setQuantity, 500);

            $scope.setSpoQuantity = setSpoQuantity;

            $scope.toggleRush = function() {
                var allProducts = [];
                angular.forEach(cart.orderItems, function(item) {
                    allProducts.push(item.product);
                    allProducts = allProducts.concat(item.product.children);
                });

                var rush = false;
                angular.forEach(allProducts, function(product) {
                    rush = rush || product.options._rush;
                });

                angular.forEach(allProducts, function(product) {
                    product.options._rush = !rush;
                });

                var promises = [];
                angular.forEach(cart.orderItems, function(item) {
                    promises.push( new Product(item.product).$save() );
                });

                $q.all(promises).then(function() {
                    cart.reload();
                });
            };

            $scope.toggleStudioSample = function(item) {
                toggleOption(item, '_studioSample');
            };

            $scope.saveCoupon = function() {
                cart.couponCode = $scope.coupon;
                cart.$save(function(result) {
                    $scope.coupon = '';
                }, function(error) {
                    $scope.coupon = '';
                    if (error.data && error.data.error) {
                        MessageService.error(error.data.error);
                    }
                });
            };

            $scope.onShippingSelected = function() {
                var shippingOptions = cart.shippingOptions,
                    shippingOption = cart.shippingOption;
                cart.$save(function() {
                    fixAddresses();
                    cart.shippingOptions = shippingOptions;
                    cart.shippingOption = shippingOption;
                });
            };

            $scope.back = function() {
                $window.history.back();
            };

            $scope.next = function() {

                var nextState = $state.current.data.nextState;
                $scope.nextDisabled = false;

                if (nextState==='checkout.addressDetails') {

                    fixAddresses();

                } else if (nextState==='checkout.shipping') {

                    if (cart.shipTo===0) {
                        var shippingAddress = _.omit( $scope.billingAddress, 'id', 'version' );
                        shippingAddress.addressType = 'ShippingAddress';
                        cart.addresses = [ $scope.billingAddress, shippingAddress ];

                    } else if (cart.shipTo===1)
                        cart.addresses = [ $scope.billingAddress, $scope.shippingAddress ];
                    else if (cart.shipTo===2)
                        cart.addresses = [ $scope.billingAddress, $scope.dropShippingAddress ];


                    cart.shippingOptions = [];
                    cart.$save( function() {
                        cart.getShippingOptions();
                        fixAddresses();
                    });

                } else if (nextState==='checkout.orderSummary') {

                    cart.$save(fixAddresses);

                } else if (nextState==='checkout.payment') {
                    LeaveSiteService.disable();
                    $rootScope.cartSpinner = true;
                    // cart.$pay(function(order) {

                    //     if (order.state==='PaymentComplete') {
                    //         //skip check out, the order has been marked as PaymentComplete during
                    //         //the prepareForPayment phase
                    //         $state.go('orders.history.details', {id:order.id});
                    //         return;
                    //     }

                    //     fixAddresses();
                    //     PaymentService.pay(cart);
                    // }, function(error) {
                    //     $rootScope.cartSpinner = false;
                    //     MessageService.error(error.data.error);
                    // });
                    CartService.pay(cart).then(
                        function(order) {

                            if (order.state==='PaymentComplete') {
                                //skip check out, the order has been marked as PaymentComplete during
                                //the prepareForPayment phase
                                $state.go('orders.history.details', {id:order.id});
                                return;
                            }

                            fixAddresses();
                            PaymentService.pay(cart);
                        }, function(error) {
                            $rootScope.cartSpinner = false;
                        });

                    return;
                }

                if (cart.freeShipping && nextState==='checkout.shipping') {
                    nextState = 'checkout.orderSummary';
                }

                $state.go(nextState);
            };

            fixAddresses();

            $scope.coupon = '';
            $scope.cart = cart;

            CartService.checkCart(cart).then(
                function() { },
                function() { $state.go('dashboard.default.overview'); }
            );

            if ($state.current.name!=='checkout.cart' && _.isEmpty(cart.orderItems)) {
                $state.go('dashboard.default.overview');
            }

            $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
                if (toState.name==="checkout.shipping" && !cart.shippingOptions) {
                    cart.getShippingOptions();
                }
            });

            $scope.getThumbUrl = function(id) {
                return Product.getThumbUrl({id:id});
            };

            var studioSampleCache = {};

            $scope.isStudioSampleAvailable = function(product) {
                var result = studioSampleCache[product.prototypeId];
                if (result) return result;

                var promise = ProductPrototype.get({id:product.prototypeId}).$promise;
                result = { $promise: promise };
                studioSampleCache[product.prototypeId] = result;
                promise.then(function(productPrototype) {
                    var studioSampleOption = productPrototype.getPrototypeProductOption('_studioSample');
                    result.value = !!studioSampleOption;
                });
                return result;
            }

            // save change invoice number for custom service
            $scope.productNumberChanged = function (item) {
                for (var i = 0; i < cart.orderItems.length; i++) {
                    if (cart.orderItems[i].id === item.orderItemId) {
                        var prev_custom_service_invoice = cart.orderItems[i].product.options._custom_service_invoice;

                        cart.orderItems[i].product.options._custom_service_invoice = item.id;

                        var p = new Product(cart.orderItems[i].product);
                        p.$save(function(result) {

                        }, function(error) {
                            if (error.data && error.data.error) {
                                MessageService.error(error.data.error);
                            }

                            cart.orderItems[i].product.options._custom_service_invoice = prev_custom_service_invoice;
                        });
                    }
                }
            }

            // filter payed products in all user orders and return only is's
            var payedProducts = (function getPayedProducts() {
                var products = [];

                //console.debug('[1]', userOrders);

                for (var i = 0; i < userOrders.length; i++) {
                    if (userOrders[i].state === 'PaymentComplete') {
                        if (userOrders[i].orderItems.length > 1) {
                            products.push({id: userOrders[i].orderNumber});

                            for (var j = 0; j < userOrders[i].orderItems.length; j++) {
                                products.push({
                                    id: userOrders[i].orderItems[j].orderItemNumber,
                                    isSubitem: true
                                });
                            }
                        } else {
                            products.push({id: userOrders[i].orderNumber});
                        }
                    }
                }

                return products;
            })();

            // create dedicated user paid invoice numbers for each cart items
            function getOrderProductNumberOptions(orderItemId) {
                var options = [
                    {
                        label: 'No invoice number',
                        callback: $scope.productNumberChanged
                    }
                ];

                for (var i = 0; i < payedProducts.length; i++) {
                    options.push({
                        id: payedProducts[i].id,
                        label: '#' + payedProducts[i].id,
                        orderItemId: orderItemId,
                        callback: $scope.productNumberChanged,
                        indent: payedProducts[i].isSubitem
                    });
                }

                return options;
            }

            // construct invoice number options data
            function getProductNumberOptions() {
                var options = {};
                var orderItemId;

                for (var i = 0; i < cart.orderItems.length; i++) {
                    orderItemId = cart.orderItems[i].id;
                    options[orderItemId] = getOrderProductNumberOptions(orderItemId);
                }

                return options;
            }

            $scope.productNumberOptions = getProductNumberOptions();
        }
  ]);
