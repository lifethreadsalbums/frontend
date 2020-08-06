(function () {
  'use strict';

  angular.module('paceApp')
    .value('pulseClassSettings', {
      duration: 80,
      easing: 'swing'
    })
    .directive('pulseClass', ['pulseClassSettings',
      function (pulseClassSettings) {
        return {
          restrict: 'A',
          scope: {
            pulseOnEvent: '@',
            pulseOnClass: '@',
            shouldPulse: '&'
          },
          link: function postLink(scope, element, attrs) {
            var settings = pulseClassSettings;

            scope.$on(scope.pulseOnEvent, function () {
              if (scope.shouldPulse()) {
                element.addClass(scope.pulseOnClass, {
                  duration: settings.duration,
                  easing: settings.easing,
                  children: true,
                  complete: function () {
                    element.removeClass(scope.pulseOnClass, {
                      duration: settings.duration,
                      easing: settings.easing,
                      children: true
                    });
                  }
                });
              }
            });
          }
        };
      }
    ]);

})();
