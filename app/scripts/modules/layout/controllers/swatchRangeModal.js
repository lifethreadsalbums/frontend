'use strict';

angular.module('pace.layout')
    .controller('SwatchRangeModal', ['$scope', function ($scope) {
        
        $scope.swatchRangeValue = '';

        $scope.doOk = function() {
            if (!$scope.swatchRangeValue) return;
            $scope.ok($scope.swatchRangeValue);
            $scope.closeThisDialog();
        };

        $scope.doCancel = function() {
            $scope.cancel();
            $scope.closeThisDialog();
        };

    }]);
