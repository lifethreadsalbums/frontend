'use strict';

angular.module('pace.login')
    .controller('TaxExemptionCtrl', ['$scope', '$rootScope', 'User', 'DeepDiff', '$timeout', '$location', 
        '$state', 'Product', 'SessionService', 'StoreConfig',
        function($scope, $rootScope, User, DeepDiff, $timeout, $location, 
            $state, Product, SessionService, StoreConfig) {


            $scope.taxNumberLabel = 'PST Number';
            $scope.taxNumberMask = 'PST-9999-9999';

            if (StoreConfig.taxNumber) {
                $scope.taxNumberLabel = StoreConfig.taxNumber.name;
                $scope.taxNumberMask = StoreConfig.taxNumber.mask;
            }


            $scope.save = function() {
                var user = angular.copy($scope.user);
                user.taxNumber = $scope.noPST ? 'N/A' : $scope.taxExemptionNumber;

                var userRes = new User(user);
                userRes.$save();
                
                return true;
            };

        }
    ]);