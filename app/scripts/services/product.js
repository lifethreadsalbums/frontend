'use strict';

angular.module('paceApp').
    factory('Product', ['$resource', '$q', '$cacheFactory', 'ProductPrototype', 'ModelService',
    function($resource, $q, $cacheFactory, ProductPrototype, ModelService) {

        var cache = $cacheFactory('ProductCache', { capacity: 300 });

        var interceptor = {
            response: function(response) {
                //console.log('Product', response.resource)
                if (angular.isArray(response.resource)) {
                    for (var i = 0; i < response.resource.length; i++) {
                        var product = response.resource[i];
                        cache.put(apiUrl + 'api/product/' + product.id, product);
                    };
                }
                return response.resource;
            }
        };

        var Product = $resource(apiUrl+'api/product/:id', {} , {

            query: { method:'GET', isArray:true, interceptor:interceptor },

            queryByDate: {method: 'GET', url: apiUrl + 'api/product/searchByDate', isArray: true},

            get: { method:'GET', isArray:false },

            save: { method:'POST', isArray:false, interceptor: ModelService.getSaveInterceptor('Product') },

            addToCart: { method:'POST', url:apiUrl + 'api/product/addToCart' },

            addToBatch: { method:'POST', url:apiUrl + 'api/product/addToBatch' },

            getCategories: { method:'GET', url:apiUrl + 'api/product/categories', cache:true },

            getMyProducts: { method:'GET', url:apiUrl + 'api/currentuser/products', isArray:true },

            getMyCurrentProducts: { method:'GET', url:apiUrl + 'api/currentuser/products/current', isArray:true, interceptor:interceptor },

            getMyProductionProducts: { method:'GET', url:apiUrl + 'api/currentuser/products/production', isArray:true, interceptor:interceptor },

            getMyShippedProducts: { method:'GET', url:apiUrl + 'api/currentuser/products/shipped', isArray:true, interceptor:interceptor },
            
            countMyCurrentProducts: { method:'GET', url:apiUrl + 'api/currentuser/products/current/count' },

            countMyProductionProducts: { method:'GET', url:apiUrl + 'api/currentuser/products/production/count' },

            countMyShippedProducts: { method:'GET', url:apiUrl + 'api/currentuser/products/shipped/count' },

            count: { method:'GET', url:apiUrl + 'api/product/count' },

            calculatePrice: { method:'POST', url:apiUrl + 'api/product/price' },

            getThumbUrl: { method:'GET', url:apiUrl + 'api/product/:id/thumbUrl', isArray:true },

            saveMultiple: { method:'POST', url:apiUrl + 'api/product/save', isArray:true, interceptor: ModelService.getSaveInterceptor('Product') },

            setState: { method:'POST', url:apiUrl + 'api/product/state', isArray:true, interceptor: ModelService.getSaveInterceptor('Product') },

            search: { method:'GET', url:apiUrl + 'api/search', isArray:true },

            reprint: { method:'POST', url:apiUrl + 'api/product/:id/reprint', params:{id:'@id'}, isArray:false },
            
            reorder: { method:'POST', url:apiUrl + 'api/product/:id/reorder', params:{id:'@id'}, isArray:false },

            markAsPaid: { method:'POST', url:apiUrl + 'api/sa/pay/:id', params:{id:'@id'}, isArray:false }

        });

        Product.createFromPrototype = function(prototypeId, name) {
            return ProductPrototype
                .get({id: prototypeId})
                .$promise
                .then(function(prototype) {
                    var product = new Product({
                        prototypeId: prototype.id,
                        state: 'New',
                        children: [],
                        options: {
                            _name: name,
                            _productPrototype: prototype.code,
                            _quantity: 1
                        }
                    });

                    var prototypeVal = prototype.getPrototypeProductOptionValueInfo('_productPrototype', prototype.code);
                    if (prototypeVal) {
                        var valueParent = prototypeVal.value.parent,
                            optionParent = prototypeVal.option.parent;
                        while(valueParent && optionParent) {
                            product.options[optionParent.effectiveCode] = valueParent.code;

                            var valueInfo = prototype.getPrototypeProductOptionValueInfo(optionParent.effectiveCode, valueParent.code);
                            valueParent = valueInfo.value.parent;
                            optionParent = valueInfo.option.parent;
                        }
                    }
                    return product;

                });
        };

        Product.createFromTemplate = function(id, name) {
            var deferred = $q.defer();
            Product.get({ id:id }, function(value) {
                var product = new Product(value);
                product.id = null;
                product.state = 'New';
                product.children = [];
                product.options = { _name: name, _quantity: 1 }
                product.isFavourite = false;
                deferred.resolve(product);
            });
            return deferred.promise;
        };

        Product.createReprint = function(id, name) {
            return Product
                .get({ id:id })
                .$promise
                .then(function(product) {
                    var newProduct = new Product({
                        prototypeId: product.prototypeId,
                        layoutId: product.layoutId,
                        coverLayoutId: product.coverLayoutId,
                        originalId: id,
                        //state: 'New',
                        isReprint: true,
                        user: angular.copy(product.user),
                        options: angular.copy(product.options)
                    });
                    _.each(newProduct.options, function(value, key) {
                        if (value && (value.id)) {
                            value.id = null;
                        }
                    });
                    _.extend(newProduct.options,  { _name: name, _quantity: 1 });
                    return newProduct;
                });
        };

        return Product;
  }]);
