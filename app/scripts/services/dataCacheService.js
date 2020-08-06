'use strict';

angular.module('paceApp')
.service('DataCacheService', ['$cacheFactory', 'LayoutViewData', 'Product', '$q', '$rootScope', 'LoginEvent', 'ModelEvent',
    function DataCacheService($cacheFactory, LayoutViewData, Product, $q, $rootScope, LoginEvent, ModelEvent) {

    var layoutViewCache = $cacheFactory('LayoutViewCache', { capacity: 300 });

    var pageSize = 8,
        products = {
            current: [],
            production: [],
            shipped: []
        },
        loadingState = {
            current: null,
            production: null,
            shipped: null
        },
        self = this;

    function loadProducts(category, deferred, pageIndex, onPageLoad) {
        var fn = 'getMy' + ( S(category).capitalize().s ) + 'Products';

        if (pageIndex===0 && loadingState[category]!==null) return;
        loadingState[category] = 'loading';
        if (!deferred) {
            deferred = $q.defer();
            products[category].$promise = deferred.promise;
        }
        Product[fn]({pageSize:pageSize, pageIndex:pageIndex}, function(result) {

            if (result && result.length>0) {
                for (var i = 0; i < result.length; i++) {
                    products[category].push(result[i]);
                }
                if (onPageLoad) onPageLoad(result, products[category]);
                deferred.notify(result);
                loadProducts(category, deferred, pageIndex + 1, onPageLoad);
            } else {
                loadingState[category] = 'loaded';
                products[category].$resolved = true;
                if (onPageLoad) onPageLoad(result, products[category]);
                deferred.resolve(products[category]);
            }

        }, function(error) {
            console.error('Error loading products ', category, error);
            loadingState[category] = null;
            deferred.reject(error);
        });
        return deferred.promise;
    }

    this.getMyCurrentProducts = function() { return products.current; };

    this.getMyProductionProducts = function() { return products.production; };

    this.getMyShippedProducts = function() { return products.shipped; };

    this.loadMyCurrentProducts = function(onPageLoad) {
        return loadProducts('current', null, 0, onPageLoad);
    };

    this.loadMyProductionProducts = function(onPageLoad) {
        return loadProducts('production', null, 0, onPageLoad);
    };

    this.loadMyShippedProducts = function(onPageLoad) {
        return loadProducts('shipped', null, 0, onPageLoad);
    };

    this.clear = function(productId) {
        products.current = [];
        products.production = [];
        products.shipped = [];

        loadingState.current = null;
        loadingState.production = null;
        loadingState.shipped = null;
        layoutViewCache.removeAll();
    };

    this.clearLayoutViewDataCache = function() {
        layoutViewCache.removeAll();
    };

    this.getLayoutViewData = function(productId) {

        var data = layoutViewCache.get(productId);
        if (data && data.product) return data;

        data = LayoutViewData.get({id:productId});
        layoutViewCache.put(productId, data);

        return data;
    };

    $rootScope.$on(LoginEvent.LogoutSuccess, function() {
        self.clear();
    });


    $rootScope.$on(ModelEvent.ModelChanged, function(event, args) {
        if (args.type==='Product') {
            var all = products.current.concat(products.production).concat(products.shipped);
            _.each(args.items, function(product) {
                var p = _.findWhere(all, {id:product.id});
                if (p) {
                    _.extend(p, product);
                }
            });
        }
    });

}])
.service('ModelService', ['$rootScope', 'ModelEvent',
    function ModelService($rootScope, ModelEvent) {

        this.notify = function(event, modelType, items) {
            $rootScope.$broadcast(event, {type:modelType, items:items});
        };

        this.getSaveInterceptor = function(modelType) {
            var that = this;
            var interceptor = {
                response: function(response) {
                    var items = [];
                    if (angular.isArray(response.resource)) {
                        items = response.resource;
                    } else {
                        items = [response.resource];
                    }
                    that.notify(ModelEvent.ModelChanged, modelType, items);
                    return response.resource;
                }
            }

            return interceptor;
        };

        this.updateList = function(items, newItems) {
            _.each(newItems, function(newItem) {
                var item = _.findWhere(items, {id:newItem.id});
                if (item) {
                    _.extend(item, newItem);
                }
            });
        };

        this.deleteFromList = function(items, deletedItems) {
            _.each(deletedItems, function(deleteItem) {
                var item = _.findWhere(items, {id:deleteItem.id});
                if (item) {
                    var idx = items.indexOf(item);
                    items.splice(idx,1);
                }
            });
        };

    }
]);
