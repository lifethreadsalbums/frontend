'use strict';

angular.module('paceApp')
    .factory('FileSet', ['$resource', function ($resource) {
        return $resource(apiUrl+'api/fileset/', { }, {

            getByCode: {
            	method:'GET',
            	url: apiUrl + 'api/currentuser/filesets', 
                isArray:true
            }

        });
    }]);
