'use strict';

angular.module('pace.order')

.directive('attachmentsWidget', ['StoreConfig', function(StoreConfig) {
        return {
            template: '<div class="attachments-widget"><a ng-repeat="item in items" title="{{item.title}}" target="_blank" '+
                'ng-href="{{item.url}}" class="attachment" ng-class="[item.type]"></a></div>',
            replace: true,
            restrict: 'E',
            scope: {
                attachments:'=',
                types:'='
            },
            link: function postLink(scope, element, attrs) {

                function getTitle(a) {
                    return S(a.type).humanize().capitalize().s
                        .replace('Hi', 'High')
                        .replace('jpeg', 'JPEG')
                        .replace('png', 'PNG')
                        .replace('pdf', 'PDF')
                        .replace('zip', 'ZIP')
                        .replace('tiff', 'TIFF');
                }

                scope.$watch('attachments', function(attachments) {
                    var items = [];
                    if (attachments) {
                        if (scope.types) {
                            attachments = _.filter(attachments, function(a) {
                                return scope.types.indexOf(a.type)>=0;
                            });
                        }
                        items = _.map(attachments, function(a) {
                            var url = a.url || '';
                            return {
                                type: url.split('.').pop(),
                                title: getTitle(a),
                                url: StoreConfig.urlPrefix + url
                            }
                        })
                    } 
                    scope.items = items;
                });
                
            }
        };  
    }
]);
