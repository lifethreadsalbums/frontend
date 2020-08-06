'use strict';

angular.module('paceApp')
.filter('where', [function () {  
    return _.where;
}]);
