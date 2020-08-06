'use strict';

angular.module('paceApp').
    factory('Layout', ['$resource', '$q', '_', function($resource, $q, _){

        var Layout = $resource(apiUrl + 'api/layout/:id', { }, 
        {
        	query: { method:'GET', isArray:true, cache:false },
        	get: { method:'GET', isArray:false, cache:false },
        	getCoverLayout: { method:'POST', url:apiUrl + 'api/layout/getCoverLayout' },
            getSpines: { method:'GET', url:apiUrl + 'api/layout/spines' },
            getHinges: { method:'GET', url:apiUrl + 'api/layout/hinges' },
            getMultiple: { method:'GET', url:apiUrl + 'api/layout', isArray:true, cache:false, params:{id:'@id'} },

            publish: { method:'POST', url:apiUrl + 'api/layout/:id/publish', isArray:false, cache:false, params:{id:'@id'} },

            duplicateAndConvert: { method:'POST', url:apiUrl + 'api/layout/duplicateAndConvert' },
            splitImages: { method:'POST', url:apiUrl + 'api/layout/splitImages', isArray:true },
        });


        return Layout;
    }]).
    factory('LayoutSnapshot', ['$resource', '$q', '_', function($resource, $q, _){

        var LayoutSnapshot = $resource(apiUrl + 'api/layoutSnapshot/', { }, 
        {
        
        });

        return LayoutSnapshot;
    }]).
    factory('LayoutSize', ['$resource', '$q', '_', function($resource, $q, _){

        var LayoutSize = $resource(apiUrl + 'api/layoutSize/:id', { }, 
        {
        
        });

        return LayoutSize;
    }]).
    factory('LayoutViewData', ['$resource', '$q', '_', function($resource, $q, _){

        var LayoutViewData = $resource(apiUrl + 'api/layoutViewData/:id', { }, 
        {
        
        });

        return LayoutViewData;
    }]).
    factory('SpoPackage', ['$resource', '$q', '_', function($resource, $q, _){

        var SpoPackage = $resource(apiUrl + 'api/spoPackage/:id', { }, 
        {
        
        });

        return SpoPackage;
    }]);
