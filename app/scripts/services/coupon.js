'use strict';

angular.module('paceApp').
    factory('Coupon', ['$resource', '$q', function($resource, $q) {
  		return $resource( apiUrl + 'api/order/:id', {  }, {
  			get: {method: 'GET', params: {}, isArray: false},
			getCoupons: {method: 'GET', url: apiUrl + 'api/currentuser/coupons', isArray: true}
  		});
	}]);
