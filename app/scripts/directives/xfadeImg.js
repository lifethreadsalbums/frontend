'use strict';

angular.module('paceApp')
.directive('xfadeImg', [function () {
    return {
        template: '<div class="xfade-img"><img class="fade-out"/><img class="fade-out"/></div>',
        replace: true,
        restrict: 'E',
        link: function postLink(scope, element, attrs) {

            var imgs = element.find('img'),
                idx = 0;
            
            imgs.load(function() {
                $(this).removeClass('fade-out').addClass('fade-in');
            });

            attrs.$observe('url', function(value, oldValue) {
                if (value !== oldValue) {
                    $(imgs[idx]).removeClass('fade-in').addClass('fade-out');
                    idx = 1 - idx;
                    imgs[idx].src = value;
                }
            });
        }
    };
}]);
