'use strict';

angular.module('pace.layout')
    .directive('addLogo', [ function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'views/layout/addLogo.html',
            scope:{
                logos: '='
            },
            link: function postLink($scope, $element, $attrs) {

                $scope.selectLogo = function(logo){
                    $scope.selectedLogo = logo;
                }
            }
        };
    }]);