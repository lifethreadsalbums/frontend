'use strict';

angular.module('pace.dashboard')
.controller('NotificationsCtrl', 
    ['$scope', '$state', '_', 'Settings', 'localize', 'userSettings', 'user',
        function($scope, $state, _, Settings, localize, userSettings, user) {

            var master = angular.copy(userSettings.settings);
            var keys = [
                'dontShowUploadRestrictionWarning',
                'dontShowJobCreationWarning',
                'dontShowTemplateOverlapWarning',
                'dontShowImageSortOrderResetWarning',
                'dontShowAutoFlowResetWarning',
                'sendEmailWhenUserAccountIsDeleted',
                'dontShowdeleteTemplateWarning',
                'sendUploadEmailNotifications'
            ];

            $scope.notifications = _.map(keys, function(key) {
                return {
                    label: localize.getLocalizedString(key),
                    key: key
                }
            });

            $scope.userSettings = userSettings;
            
            $scope.reset = function() {
               userSettings.settings = angular.copy(master);
            };

            $scope.isChanged = function() {
                return !angular.equals(userSettings.settings, master);
            };

            $scope.save = function() {
                var done = function(value) {
                    master = angular.copy(userSettings.settings);
                    $scope.saving = false;
                };
                $scope.$saving = true;
                userSettings.$save(done, done);
            };
        }
]);