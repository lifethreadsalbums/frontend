'use strict';

angular.module('pace.order')
    .factory('Batch', ['$resource', function($resource){

        return $resource(apiUrl+'api/batch/:id', { }, {

        	getCurrentBatch: { method:'GET', url: apiUrl + 'api/batch/current', isArray:false },
        	getCurrentBatchItems: { method:'GET', url: apiUrl + 'api/batch/current/items', isArray:true },
        	getCurrentBatchItemCount: { method:'GET', url: apiUrl + 'api/batch/current/items/count', isArray:false },
            getItems: { method:'GET', url: apiUrl + 'api/batch/:id/items', isArray:true },
            submit: { method:'GET', url: apiUrl + 'api/batch/submit', isArray:false },
            count: { method:'GET', url: apiUrl + 'api/batch/count', isArray:false }

        });

    }]);
