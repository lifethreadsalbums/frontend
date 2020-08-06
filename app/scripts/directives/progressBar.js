'use strict';

angular.module('paceApp')
    .directive('progressBar', [function () {
        return {
            restrict: 'E',
            replace: true,
            template:  '<span class="upload-progress-bar">'+
                        '<div class="progress-bar">'+
                        '<span class="meter-bar" ng-style="{width: progress + \'%\' }"></span>'+
                        '</div>'+
                        '</span>',
            scope: { progress:'=' },
            link: function postLink(scope, element, attrs) {

           
            }
        };

    }]);
