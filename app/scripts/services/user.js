'use strict';

angular.module('paceApp').
    factory('User', ['$resource', '$q', 'ModelService', 'ModelEvent', function($resource, $q, ModelService, ModelEvent){
  		var User = $resource( apiUrl + 'api/user/:id', {}, {

  			get: { method:'GET', params:{}, isArray:false },

  			getSummary: { method: 'GET', url: apiUrl + 'api/user/:id/summary', isArray: false },

			getCurrent: { method: 'GET', url: apiUrl + 'api/user/current', isArray: false },

			getGroups: { method: 'GET', url: apiUrl + 'api/userGroup', isArray: true },

            getAllGroups: { method: 'GET', url: apiUrl + 'api/admin/userGroup', isArray: true },

			register: {
				method: 'POST',
				url: apiUrl + 'api/user/register',
				isArray: false
			},

			registerAdmin: {
				method: 'POST',
				url: apiUrl + 'api/user/registeradmin',
				isArray: false
			},

			resendVerificationEmail: { method: 'GET', url: apiUrl + 'api/user/resendVerificationEmail', isArray: false },

            search: { method:'GET', url:apiUrl + 'api/user/search', isArray:true },

            save: { method:'POST', isArray:false, interceptor: ModelService.getSaveInterceptor('User') },

            deleteByIds: { method: 'DELETE', url: apiUrl + 'api/user/remove' },

            reauth: { method: 'POST', url: apiUrl + 'api/user/reauth' }

  		});

        User.delete = function(users) {
            var ids = _.pluck(users, 'id');
            return User.deleteByIds({ids:ids}).$promise.then(function(result) {
                ModelService.notify(ModelEvent.ModelDeleted, 'User', users);
            });
        };

        return User;
	}]);
