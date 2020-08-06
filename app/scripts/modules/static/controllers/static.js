'use strict';

angular.module('pace.static')
.controller('StaticCtrl', ['$scope', '$rootScope', 'StoreConfig', '$sce',
    function ($scope, $rootScope, StoreConfig, $sce) {
        $scope.siteUrl = window.location.protocol + '//' + window.location.hostname;
        $scope.eulaUrl = $sce.trustAsResourceUrl(StoreConfig.eulaUrl);
        $scope.termsUrl = $sce.trustAsResourceUrl(StoreConfig.termsUrl);
        $scope.privacyUrl = $sce.trustAsResourceUrl(StoreConfig.privacyUrl);
        $scope.helpDeskUrl = $sce.trustAsResourceUrl(StoreConfig.helpDeskUrl);
    }
]);
