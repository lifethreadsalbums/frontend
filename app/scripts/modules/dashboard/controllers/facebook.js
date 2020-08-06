'use strict';

angular.module('pace.dashboard')
.controller('FacebookCtrl', ['$scope', '$state', '_', '$http', '$rootScope', 'MessageService',
    function ($scope, $state, _, $http, $rootScope, MessageService) {
        var appId = '239771902892285',
            appSecret = '84e69d7d6592ab4ccdc97392eaca3c0e',
            pageId = 'Manaslu.Trek',
            feedsLimit = 25,
            graphTokenUrl = 'https://graph.facebook.com/oauth/access_token?grant_type=client_credentials&client_id=' + appId + '&client_secret=' + appSecret,
            graphUserUrl = 'https://graph.facebook.com/' + pageId + '/?fields=name,picture&callback=?',
            graphPostsUrl = 'https://graph.facebook.com/' + pageId + '/posts/?callback=?&date_format=U&limit=' + feedsLimit,
            accessToken = '',
            userData = null,
            postsData = null;

        $scope.state = 'loading';

        
        function onError(error) {
            MessageService.ask('There was an error while displaying Facebook feed.' , 'alert', [{label: 'Dismiss'}], false, null, '.facebook');
        }
        
        function getToken() {
            return $http({
                method: 'POST',
                url: graphTokenUrl,
                cache: true
            });
        }

        function getUser(response) {
            accessToken = response.data;
            return $.getJSON(graphUserUrl + '&' + accessToken, function(user) {
                userData = user;
            });
        }

        function getFeeds() {
            return $.getJSON(graphPostsUrl + '&' + accessToken, function(posts) {
                postsData = posts;
            });
        }

        function createFeeds() {
            var posts = [],
                post,
                postCount = postsData.data.length,
                i;
            
            for (i = 0; i < postCount; i++) {
                post = postsData.data[i];

                if (post.type !== 'link' && post.type !== 'status') {
                    continue;
                }
                /* jshint camelcase: false */
                post.from.picture = userData.picture.data.url;
                post.created_time = PACE.utils.relativeTime(post.created_time * 1000);
                if (post.message) {
                    post.message = PACE.utils.urlHyperlinks(post.message);
                } else if (post.story) {
                    post.story = PACE.utils.urlHyperlinks(post.story);
                }
                posts.push(post);
            }

            $scope.user = userData;
            $scope.posts = posts;
            $scope.state = 'completed';
            $scope.$apply();
        }

        function startLoader() {
            $rootScope.$broadcast('loader-run', {
                loaderId: 'facebook',
                width: 20,
                radius: 25,
            });
        }

        function stopLoader() {
            $rootScope.$broadcast('loader-stop', {
                loaderId: 'facebook'
            });
        }

        Q
        .fcall(startLoader)
        .then(getToken)
        .then(getUser)
        .then(getFeeds)
        .then(createFeeds)
        .fail(onError)
        .fin(stopLoader);
    }
]);