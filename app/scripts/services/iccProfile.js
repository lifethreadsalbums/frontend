'use strict';

angular.module('paceApp').
    factory('IccProfile', ['$resource', function($resource){

        var IccProfile = $resource(apiUrl+'api/iccprofile/:id', {} , {
            
        });

        return IccProfile;

}]);