'use strict';

angular.module('paceApp').
    factory('Widget', ['$resource', '_', function($resource, _) {

        var Widget = $resource( apiUrl + 'api/widget/:section/:id', { }, 
        {
        	query: { method:'GET', isArray:true, cache:true },
        	get: { method:'GET', isArray:false, cache:true, params:{section:'build'} }
        });
       
        return Widget;
  }]);