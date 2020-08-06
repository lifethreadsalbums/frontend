'use strict';

angular.module('pace.dashboard')
    .directive('instagram', ['$parse', '$timeout', '$rootScope', function ($parse, $timeout, $rootScope) {
        return {
            replace: true,
            restrict: 'E',
            scope: true,
            transclude: true,
            link: function postLink(scope, element, attrs) {
                /* global Instafeed */
                var clientId = 'afc9f9968d1a4220999d6a30807da026',
                    clientSecret = 'b1f7731a50e3418ea298741eb690eaad',
                    userId = 2666166,
                    token = '915099245.afc9f99.44e5aa182ae141c4a370ca4d0495dfe4',
                    feedBox = element.find('#instagram-feed'),
                    parentEl = element.parent(),

                    feed = new Instafeed({
                        target: 'instagram-feed',
                        get: 'user',
                        userId: userId,
                        accessToken: token,
                        clientId: clientId,
                        template:   '<a href="{{link}}" class="instagram-item" target="_blank">' +
                                        '<span class="title">{{caption}}</span>' +
                                        '<img src="{{image}}">' +
                                        '<div>' +
                                            '<span class="likes">{{likes}}</span>' +
                                            '<span class="comments">{{comments}}</span>' +
                                        '</div>' +
                                    '</a>',
                        limit: 9,
                        before: function() {
                            $rootScope.$broadcast('loader-run', {
                                loaderId: 'instagram'
                            });
                        },
                        after: function() {
                            if (this.hasNext()) {
                                setTimeout(function() {
                                    checkScrollPosition();
                                });
                            }
                            
                            $rootScope.$broadcast('loader-stop', {
                                loaderId: 'instagram'
                            });
                        }
                    });

                parentEl.on('scroll', function() {
                    checkScrollPosition();
                });

                function checkScrollPosition() {
                    if (parentEl.scrollTop() + parentEl.innerHeight() >= parentEl[0].scrollHeight ||
                        parentEl.innerHeight() > element.outerHeight()) {
                        feed.next();
                    }
                }

                feed.run();

                element.on('$destroy', function() {
                    parentEl.unbind('scroll');
                });
            },
            template: function() {
                return '<div class="instagram-feed-container">' +
                            '<div id="instagram-feed" centerize></div>' +
                            '<span class="load-more-container">' +
                                '<loader data-loader-id="instagram"></loader>' +
                            '</span>' +
                        '</div>';
            },
        };
    }]);