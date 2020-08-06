'use strict';

angular.module('pace.layout')
    .directive('logoSettings', [ function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'views/layout/logoSettings.html',
            scope:{
                logo: '='
            },
            link: function postLink($scope, $element, $attrs) {

                $scope.selectFirstPagePosition = function (row, index) {
                    $scope.selectedFirstPagePosition = {
                        row: row,
                        index: index
                    };
                }
                
                $scope.selectLastPagePosition = function (row, index) {
                    $scope.selectedLastPagePosition = {
                        row: row,
                        index: index
                    };
                }
            }
        };
    }]);