'use strict';

angular.module('pace.order')
    .factory('Cameo', ['$resource', function($resource){

        return $resource(apiUrl+'api/cameo/:id', { }, {

        });

    }]);
