'use strict';

angular.module('paceApp')
.factory('TermService', ['$resource', '$cacheFactory', function($resource, $cacheFactory) {
    var cache = $cacheFactory('terms');
    var Country = $resource( apiUrl + 'api/country/:countryId', {countryId:'@id'});
    Country.prototype.getNameAndCode = function() {
        return this.name + (this.countryCode ? " +(" + this.countryCode + ")" : "");
    };
    var Province = $resource( apiUrl + 'api/country/:countryId/provinces' );
    var Category = $resource( apiUrl + 'api/categories' );

    return {
        getCountries: function() {
            var countries = cache.get("countries");
            if (!countries) {
                countries = Country.query(function(value) {
                    var sep = new Country({id:0, name:"-------------------------", disabled: true});
                    value.splice(4, 0, sep);
                });

                cache.put("countries", countries);   
            }
            return countries;
        },

        getProvinces: function(countryId) {
            var provinces = cache.get("provinces" + countryId);
            if (!provinces) {
                provinces = Province.query({countryId:countryId});
                cache.put("provinces" + countryId, provinces);   
            }
            return provinces;
        },

        getCategories: function() {
            return Category.query();
        }
    };
}]);