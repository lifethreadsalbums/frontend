'use strict';

angular.module('pace.adminOrders')

    .controller('ReportsCtrl', ['$scope', '$stateParams', '$timeout', '$state', 
        'MessageService', '$rootScope', '$debounce', '$location', '$q', 'StoreConfig', '$resource',
        function ($scope, $stateParams, $timeout, $state, 
            MessageService, $rootScope, $debounce, $location, $q,  StoreConfig, $resource) {

        var Report = $resource(apiUrl + 'api/report', {}, {});

        $scope.reports = Report.query();
        $scope.params = {};
        
        $scope.selectReport = function(report) {
            $scope.selectedReport = report;
            $scope.params = {id: $scope.selectedReport.code};
        };

        $scope.export = function() {
            window.open(apiUrl + 'report?' + jQuery.param($scope.params), '_blank');
        };

    }]);
