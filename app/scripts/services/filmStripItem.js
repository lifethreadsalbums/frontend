'use strict';

angular.module('paceApp').
    factory('FilmStripItem', ['$resource', '$q', 'StoreConfig', function($resource, $q, StoreConfig){

        var FilmStripItem = $resource(apiUrl+'api/filmstripitem/:id', {} , {

        });

        return FilmStripItem;
  }]);