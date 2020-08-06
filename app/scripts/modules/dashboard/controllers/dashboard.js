'use strict';

angular.module('pace.dashboard')
    .controller('DashboardCtrl', ['$scope', '$state', '_', '$timeout', '$rootScope',
        function ($scope, $state, _, $timeout, $rootScope) {
            /* jshint indent: false */
            $rootScope.designerSpinner = false;
        }
    ])
    .controller('TourCtrl', ['$scope', '$state', '_', '$timeout', '$rootScope', 'StoreConfig', '$sce',
        function ($scope, $state, _, $timeout, $rootScope, StoreConfig, $sce) {
            /* jshint indent: false */
            $rootScope.tourUrl = $sce.trustAsResourceUrl(StoreConfig.tourUrl);
        }
    ]);