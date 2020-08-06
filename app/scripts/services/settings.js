'use strict';

angular.module('paceApp').
	factory('Settings', ['$resource', '$q',
		function($resource, $q) {
			var Settings = $resource(apiUrl + 'api/settings/:id', {},
				{
					getProductSettings: { method:'GET', isArray:true }, 
				});

			Settings.getUserSettings = function(userId) {

				var promise1 = Settings.get({userId:userId}).$promise;
				var promise2 = Settings.get({}).$promise;

				return $q.all([promise1, promise2]).then(function(result) {
					var userSettings = result[0],
						storeSettings = result[1];

					userSettings = userSettings || new Settings();
            		userSettings.user = { id: userId };
            		userSettings.settings = _.extend( _.extend({}, storeSettings.settings), userSettings.settings );

					return userSettings;
				});
				
			};

			return Settings;
		}]);