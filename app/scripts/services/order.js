'use strict';

angular.module('paceApp').
    factory('Order', ['$resource', function($resource){
  		return $resource( apiUrl + 'api/order', {  }, {

  			get: {method:'GET', params:{}, isArray:false},

            queryByDate: {method: 'GET', url: apiUrl + 'api/order/historyByDate', isArray: true},

            count: { method:'GET', url: apiUrl + 'api/order/count' },

			getMyOrders: { method:'GET', url: apiUrl + 'api/currentuser/orders', isArray:true },

			getMyCompletedRecentOrders: { method:'GET', url: apiUrl + 'api/currentuser/orders?state=Completed&count=10', isArray:true },

			getMyCompletedArchivedOrders: { method:'GET', url: apiUrl + 'api/currentuser/orders?state=Completed&startIndex=10', isArray:true },

			getMyInProductionOrders: { method:'GET', url: apiUrl + 'api/currentuser/orders?state=PaymentComplete', isArray:true },

            getMyShippedOrders: { method:'GET', url: apiUrl + 'api/currentuser/orders?state=PaymentComplete', isArray:true },

			countMyCompletedOrders: { method:'GET', url: apiUrl + 'api/currentuser/orders/count?state=Completed' },

			countMyInProductionOrders: { method:'GET', url: apiUrl + 'api/currentuser/orders/count?state=PaymentComplete' },

            countMyShippedOrders: { method:'GET', url: apiUrl + 'api/currentuser/orders/count?state=PaymentComplete' },

			calculatePrice: { method:'POST', url:apiUrl + 'api/order/price' },

			calculateShippingPrice: { method:'POST', url:apiUrl + 'api/order/shippingPrice' },
  		});
	}]);
