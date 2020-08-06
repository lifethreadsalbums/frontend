'use strict';

angular.module('paceApp').
    factory('Currency', ['$resource', '$q', '$cacheFactory', function($resource, $q, $cacheFactory) {

    	var cache = $cacheFactory('CurrencyCache', { capacity: 100 });

        var Currency = $resource(apiUrl+'api/currency', {} , {

            get: { method:'GET', isArray:false },
            format: { method: 'POST', url: apiUrl + 'api/currency/format', isArray:false },
            getAvailable: { method:'GET', url: apiUrl + 'api/currency/available', isArray:true, cache:cache },

        });

        Currency.zeroPrice = {};

        return Currency;
  }]);