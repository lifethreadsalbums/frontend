'use strict';

angular.module('pace.dashboard')
.controller('TwitterCtrl', ['$scope', '$state', '_', '$http',
    function ($scope, $state, _, $http) {
        var consumerKey = 'i11QDqiXlFrcAiPehOTkUr7F5',
            consumerSecret = 'Vfc4LiRqzqvBXWcLjqu07Hxh4btDNZ0OWOEakZ09sIuPnpbF2O',
            oauthAccessToken = '166090304-u92jr1vgJIvxEt6QI4HE7atq6MRwksZvhpQJf1A5',
            oauthAccessTokenSecret = 'GZO1Etl9wXtH1ZD2TNIU4xQcYmDu6bClPeOnL5pmpWAf3',

            bearerTokenCredentials = consumerKey + ':' + consumerSecret,
            bearerTokenCredentialsBase64 = btoa(bearerTokenCredentials);

        //
        // TODO: Fetch tweets on server side.
        //

        function getBearerToken() {
            $http({
                method: 'POST',
                // cache: false,
                // dataType: 'jsonp',
                url: 'https://api.twitter.com/oauth2/token',
                data: 'grant_type=client_credentials',
                headers: {
                    'Authorization': 'Basic ' + bearerTokenCredentialsBase64,
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                }
            }).success(function(data, status, headers, config) {
                console.log('[success]');
            }).error(function(data, status, headers, config) {
                console.log('[error]');
            });
        }

        // getBearerToken();
    }
]);