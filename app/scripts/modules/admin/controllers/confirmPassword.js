'use strict';

angular.module('pace.admin')
    .controller('ConfirmPasswordCtrl', [
        '$scope', 'User', 'AuthService',
        function($scope, User, AuthService) {
            $scope.password = '';

            $scope.onKeyUp = function(e) {
                $scope.confirmPassowrdForm.password.$setValidity('passwordMismatch', true);
            };

            $scope.doOk = function(e) {
                $scope.confirmPassowrdForm.password.$setValidity('passwordMismatch', true);

                if (!$scope.password) {
                    return;
                }

                checkPassword();
            };

            $scope.doCancel = function() {
                if (typeof $scope.cancel === 'function') {
                    $scope.cancel($scope.userId, $scope.accountTypeId);
                }

                $scope.closeThisDialog();
            };

            function checkPassword() {
                User.reauth({password:$scope.password}).$promise.then(
                    function() {
                        if (typeof $scope.ok === 'function') {
                            $scope.closeThisDialog();
                            $scope.ok($scope.password, $scope.userId, $scope.accountTypeId);
                        }
                    },function() {
                        $scope.confirmPassowrdForm.password.$setValidity('passwordMismatch', false);
                    }
                );

            }
        }
    ]);
