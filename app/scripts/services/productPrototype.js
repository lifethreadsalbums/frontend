'use strict';

angular.module('paceApp')
    .constant('ProductPageType',
        {
            PageBased: 'PageBased',
            SpreadBased: 'SpreadBased'
        }
    )
    .factory('ProductPrototype', ['$resource', '$q', '_', '$cacheFactory', function($resource, $q, _, $cacheFactory){

        var cache = $cacheFactory('ProductPrototypeCache', { capacity: 100 });

        var interceptor = {
            response: function(response) {
                //console.log('ProductPrototype', response.resource)
                if (angular.isArray(response.resource)) {
                    for (var i = 0; i < response.resource.length; i++) {
                        var prototype = response.resource[i];
                        if (prototype.isDefault) {
                            cache.put(apiUrl + 'api/productPrototype?default=true', prototype);
                        }
                        cache.put(apiUrl + 'api/productPrototype/' + prototype.id, prototype);
                        cache.put(apiUrl + 'api/productPrototype?code=' + prototype.code, prototype);
                    }
                }
                return response.resource;
            }
        };

        var ProductPrototype = $resource( apiUrl + 'api/productPrototype/:id', { },
        {
            query: { method:'GET', isArray:true, cache:cache, interceptor:interceptor },
            get: { method:'GET', isArray:false, cache:cache },
            getDefault: { method:'GET', isArray:false, params:{ default:true }, cache:cache },
            getByCode: { method:'GET', isArray:false, params:{ code:'@code' }, cache:cache }
        });

        ProductPrototype.prototype.getPrototypeProductOption = function(code) {
            return _.findWhere(this.prototypeProductOptions, { effectiveCode:code });
        };

        ProductPrototype.prototype.getPrototypeProductOptionValue = function(optionCode, valueCode) {
            var option = _.findWhere(this.prototypeProductOptions, { effectiveCode:optionCode });
            if (option) {
                return _.findWhere(option.prototypeProductOptionValues, { code:valueCode });
            }
        };

        ProductPrototype.prototype.getPrototypeProductOptionValueInfo = function(optionCode, valueCode) {
            var option = _.findWhere(this.prototypeProductOptions, { effectiveCode:optionCode });
            if (option) {
                var valueItem =  _.findWhere(option.prototypeProductOptionValues, { code:valueCode });
                if (valueItem) {
                    return { option:option, value: valueItem };
                }
            }
        };

        ProductPrototype.prototype.getPrototypeProductOptionValueChildren = function(optionCode, valueCode) {
            var childOption = _.find(this.prototypeProductOptions, function(opt) {
                    return opt.parent && opt.parent.effectiveCode===optionCode;
                });
            if (childOption) {
                var children = _.filter(childOption.prototypeProductOptionValues, function(val) {
                    //hiding atmosphere and size 16x12 in the frontend as a quick fix
                    //to-do remove them from the backend
                    return val.parent && val.parent.code===valueCode && (val.code != "16x12" && val.code != "atmosphere") ;
                });
                return { option: childOption, children: children };
            }
        };

        ProductPrototype.prototype.getOptionWithAssociatedEntity = function(entity) {
            for (var i = 0; i < this.prototypeProductOptions.length; i++) {
                var option = this.prototypeProductOptions[i];
                if (option.prototypeProductOptionValues) {
                    for (var j = 0; j < option.prototypeProductOptionValues.length; j++) {
                        if (option.prototypeProductOptionValues[j][entity])
                            return option;
                    }
                }
            }
        };

        ProductPrototype.prototype.getLayoutSizeOption = function() {
            return this.getOptionWithAssociatedEntity('layoutSize');
        };

        ProductPrototype.prototype.getCoverTypeOption = function() {
            return this.getOptionWithAssociatedEntity('coverType');
        };

        return ProductPrototype;
  }]);
