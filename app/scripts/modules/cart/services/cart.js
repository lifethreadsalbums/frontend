'use strict';

angular.module('pace.cart').
    factory('Cart', ['$resource', '$rootScope', 'ProductService',
        function($resource, $rootScope, ProductService) {
        /* global apiUrl */

        var interceptor = {
            response: function(response) {
                //console.log('ProductPrototype', response.resource)
                var cart = response.resource;
                if (cart) {
                    _.each(cart.orderItems, function(orderItem) {
                        orderItem.additionalProductInfo = ProductService.getProductViewModel(orderItem.product);
                    });
                }
                return response.resource;
            }
        };


        var Cart = $resource( apiUrl + 'api/cart', {  }, {

            get: { method:'GET', 
                //url: apiUrl + "api/cart?l=en_CA&currency=PLN",
                url: apiUrl + 'api/cart',
                params:{},
                isArray:false,
                interceptor:interceptor
            },

            removeOrderItem: { 
                method:'POST',
                url: apiUrl + 'api/cart/orderItem/:id/remove',
                params:{id:'@id'},
                interceptor:interceptor
            },

            setQuantity: { 
                method:'POST',
                url: apiUrl + 'api/cart/product/:id/setQuantity/:quantity',
                params:{ id:'@id', quantity:"@quantity" },
                interceptor:interceptor
            },

            pay: { 
                method:'POST',
                url: apiUrl + 'api/cart/pay',
                interceptor:interceptor
            },

            save: { 
                method:'POST',
                url: apiUrl + 'api/cart',
                interceptor:interceptor
            },

            empty: { 
                method:'POST',
                url: apiUrl + 'api/cart/empty',
                interceptor:interceptor
            },

            add: { 
                method:'POST',
                url: apiUrl + 'api/cart/add',
                interceptor:interceptor
            },

            addMultiple: { 
                method:'POST',
                url: apiUrl + 'api/cart/addMultiple',
                interceptor:interceptor
            },

        });

        var ShippingOptions = $resource( apiUrl + 'api/cart/shipping' );

        Cart.prototype.reload = function() {
            var that = this;
            Cart.get(function(value) {
                _.extend(that, value);
            });
        };

        Cart.prototype.getAddress = function(type) {
            if (this.addresses) {
                for (var i = 0; i < this.addresses.length; i++) {
                    if (this.addresses[i].addressType===type) 
                        return this.addresses[i];
                }
            }
        };

        Cart.prototype.getShippingOptions = function() {
            
            this.shippingOptions = [];
            if (this.freeShipping) {
                console.log('Free shipping enabled - skipping loading shipping options');
                return;
            }
            var that = this;
            this.loadingShippingOptions = true;

            return ShippingOptions.query(function(value) {
                var options = [];
                for (var i = 0; i < value.length; i++) {
                    var entries = value[i].entries;
                    for (var j = 0; j < entries.length; j++) {
                        var name = entries[j].shippingOption.name, 
                            option = { 
                                name: name,
                                label: name + ' - ' + entries[j].money.displayPrice
                            };
                        if (entries[j].money.amount===0) {
                            option.label = name + ' - FREE'; 
                        }
                        options.push(option);
                    }
                }
                that.shippingOptions = options;
                that.loadingShippingOptions = false;
                
            }, function(error) {
                
            });
        };

        Cart.prototype.getShortAddress = function(type) {

            var address = this.getAddress(type);

            if (address) {
                return address.firstName + " " + address.lastName + ", "+
                    address.addressLine1 + (address.addressLine2 && address.addressLine2 ? ", " + address.addressLine2: "") + ", " +
                    address.city + ", " + address.state.name + ", " + address.zipCode + ", " + address.country.name;
            }
            return "";
        };
        
        
        return Cart;
    }
])
.service('CartService', ['ProductPrototype', 'Cart', 'BuildService', 'ProductService', '$q', 'MessageService', '$state', '$rootScope',
    function CartService(ProductPrototype, Cart, BuildService, ProductService, $q, MessageService, $state, $rootScope) {

        var self = this;

        function onAddToCartError(products, deferred, error) {
            
            if (error.data && error.data.error) {
                if (error.data.type === 'com.poweredbypace.pace.exception.ProductNotDesignedException' ||
                    error.data.type === 'com.poweredbypace.pace.exception.LowResImagesException') {

                    var txt = error.data.error + (error.data.productType==='SinglePrintProduct' ? 
                            ' Do you want to do this now?':
                            ' Would you like to go to the designer to fix these issues now?'),
                        noLabel = 'No';
                        //noLabel = error.data.type === 'com.poweredbypace.pace.exception.LowResImagesException' ? 
                        //    'No, I understand the risks' : 'No';

                    MessageService.ask(txt, 'alert', [
                        {
                            label: 'Yes',
                            callback: function() {
                                deferred.reject(error);
                                if (error.data.productType==='SinglePrintProduct') {
                                    $state.go('build.section.option', {
                                        productId: error.data.productId,
                                        section: 'sizes',
                                        optionUrl: 'sizes-packages'
                                    });
                                    $rootScope.$broadcast('spo-cart-error');
                                } else {
                                    $state.go('layout', {productId: error.data.productId});
                                }
                            }
                        },
                        {
                            label: noLabel,
                            callback: function() {
                                // if (error.data.type === 'com.poweredbypace.pace.exception.LowResImagesException') {
                                //     var product = _.findWhere(products, {id: error.data.productId});
                                //     if (product) {
                                //         product.skipLowResCheck = true;
                                //         self.addToCart(products).then(
                                //             function(cart) {
                                //                 deferred.resolve(cart);
                                //             },
                                //             function(error) {
                                //                 deferred.reject(error);
                                //             }
                                //         );
                                //     }
                                // } else {
                                    deferred.reject(error);
                                //}
                            }
                        }
                    ]);
                    return;
                }

                MessageService.error(error.data.error);
            }
            deferred.reject(error);

        }

        function handleErrors(productView, checkout) {
            var errors = productView.errors.concat();
            errors.sort(function(o1, o2) {
                var groupOrder1 = o1.effectiveGroup ? (o1.effectiveGroup.order || o1.effectiveGroup.id) : 0,
                    groupOrder2 = o2.effectiveGroup ? (o2.effectiveGroup.order || o2.effectiveGroup.id) : 0;

                return ((groupOrder1 * 100000) + o1.id) - ((groupOrder2 * 100000) + o2.id);
            });

            var options = _.reduce(errors, function(memo, val, i) {
                var prefix = '';
                if (i>0) prefix = ', ';
                if (errors.length>1 && i===errors.length-1) prefix = ' and ';
                return memo + prefix + val.effectiveDisplayLabel.toLowerCase();
            }, '');
            options += errors.length>1 ? ' options' : ' option';
            

            var msg;

            if (checkout) {
                msg = 'You cannot check out with the project ' + productView.name + 
                    ' until you select your ' + options;
            } else {
                msg = 'You cannot add the project ' + productView.name + 
                ' to your cart until you select your ' + options;
            }

            msg += '. Would you like to select ' + (errors.length>1 ? 'them' : 'it') + ' now?';
            
            MessageService.confirm(msg, 
                BuildService.goToCoverBuilder.bind(BuildService, productView, errors[0].effectiveCode));
        }

        this.pay = function(cart) {
            var deferred = $q.defer();
            cart.$pay(
                function(order) {
                    deferred.resolve(order);
                }, 
                onAddToCartError.bind(self, [], deferred)
            );
            return deferred.promise;
        };

        this.addToCart = function(products) {
            
            var deferred = $q.defer();

            var productViews = _.map(products, function (product) { 
                return ProductService.getProductViewModel(product).$promise;  
            });

            $q.all(productViews).then(function (views) {

                var errors = [];

                _.each(views, function (productView) {
                    if (productView.numRequired>0) {
                        errors.push(productView);
                    }
                });

                if (errors.length>0) {
                    handleErrors(errors[0], false);
                    deferred.reject();
                } else {
                    Cart.addMultiple(products, function (cart) {
                            
                        deferred.resolve(cart);
                            
                    }, onAddToCartError.bind(self, products, deferred));
                }

            });

            return deferred.promise;
        };


        this.checkCart = function(cart) {

            var deferred = $q.defer();

            var productViews = _.map(cart.orderItems, function (orderItem) { 
                return ProductService.getProductViewModel(orderItem.product).$promise;  
            });

            $q.all(productViews).then(function (views) {

                var errors = [];

                _.each(views, function (productView) {
                    if (productView.numRequired>0) {
                        errors.push(productView);
                    }
                });

                if (errors.length>0) {
                    handleErrors(errors[0], true);
                    deferred.reject();
                } else {
                    deferred.resolve();
                }
            });

            return deferred.promise;
        };

        this.checkout = function() {

            return Cart.get().$promise.then(function(cart) {

                return self.checkCart(cart).then(function() {
                    $state.go('checkout.cart');
                });

            });

        };

    }
]);