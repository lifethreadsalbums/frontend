'use strict';

angular.module('pace.order')
    .factory('Store', ['$resource', function($resource){

        return $resource(apiUrl+'api/store/:id', { }, {

        	getCurrent: { method:'GET', url: apiUrl + 'api/store/current', isArray:false },
        	
        });

    }])

    .service('StoreService', ['Store', 'StoreConfig', '$rootScope', '$window',
        function StoreService(Store, StoreConfig, $rootScope, $window) {

            var currentStore,
                that = this;

            this.getCurrentStore = function() {
                if (currentStore) return currentStore;

                var store = Store.getCurrent();
                store.$promise.then(this.setCurrentStore.bind(this));
                return store;
            }

            this.setCurrentStore = function(value) {
                currentStore = value;
                //parse config
                var config = JSON.parse(value.configJson);
                _.extend(StoreConfig, config);
                StoreConfig.storeCode = value.code;

                console.log('Store config loaded', currentStore, StoreConfig);
                $rootScope.appTitle = $window.document.title = StoreConfig.appTitle;
                $rootScope.brandLogo = StoreConfig.logo;
            };

        }
    ]);
