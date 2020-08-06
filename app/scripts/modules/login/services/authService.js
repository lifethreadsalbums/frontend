'use strict';

angular.module('pace.login')
    .factory('AuthService', ['$http', '$sanitize', 'SessionService', 'MessageService', 'localize', '$rootScope', 
        '$location', '$timeout', 'LoginEvent', '$cacheFactory', 'StoreService',

        function ($http, $sanitize, SessionService, MessageService, localize, $rootScope, 
            $location, $timeout, LoginEvent, $cacheFactory, StoreService) {
            var currentUser;

            var cacheSession  = function(result) {
                currentUser = $rootScope.currentUser = result.user;
            };

            var uncacheSession = function(out) {
                SessionService.unset('lastPath');
                currentUser = $rootScope.currentUser = null;
            };

            var resendVerificationEmail = function(email) {
                return $http.get(apiUrl + "api/user/resendVerificationEmail?email=" + lastUsername);
            }

            var lastUsername;

            var loginError = function(response) {
                currentUser = $rootScope.currentUser = null;
                $rootScope.$broadcast(LoginEvent.LoginFailed);
            };

            var loginSuccess = function(result) {
                cacheSession(result);
                MessageService.clear();
                StoreService.setCurrentStore(result.store);
                $rootScope.$broadcast(LoginEvent.LoginSuccess);
            }

            var logoutSuccess = function(result) {
                uncacheSession(result);
                MessageService.clear();
                $rootScope.$broadcast(LoginEvent.LogoutSuccess);
                //clear cache
                var caches = ['CurrencyCache'];
                _.each(caches, function(key) {
                    var cache = $cacheFactory.get(key);
                    console.debug('Clearing cache ' + key);
                    cache.removeAll();
                });
            }

            var sanitizedataIn = function(dataIn) {
                return {
                    username: $sanitize(dataIn.username),
                    password: $sanitize(dataIn.password),
                    rememberMe: dataIn.rememberMe
                };
            };


            return {
                getCurrentUser:function() {
                    return currentUser;
                },
                login: function(dataIn) {
                    lastUsername = dataIn.username;
                    var query = "api/login";
                    if(dataIn.rememberMe) {
                        query += '?remember-me=true';
                    }
                    var login = $http.post(apiUrl+query, sanitizedataIn(dataIn));
                    login.success(loginSuccess);
                    login.error(loginError);
                    return login;
                },
                logout: function() {
                    var logout = $http.post(apiUrl+"api/logout");
                    logout.success(logoutSuccess);
                    return logout;
                },
                isLoggedIn: function() {
                    return currentUser!==null;
                },
                isAuthenticated: function() {
                    var promise = $http.get(apiUrl + "api/isAuthenticated");
                    promise.success(function(result) {
                        currentUser = $rootScope.currentUser = result.user;
                    });
                    promise.error(function() {
                       currentUser = $rootScope.currentUser = null; 
                    })
                    return promise;
                },
                resendVerificationEmail: resendVerificationEmail,

                changePassword: function (newPassword) {
                    return $http.post(apiUrl + "api/user/password",{"password":$sanitize(newPassword)});
                }
            };
        
        }]);