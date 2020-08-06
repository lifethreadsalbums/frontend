'use strict';

angular.module('pace.admin')
    .controller('UserCtrl', ['$scope', '$state', '$stateParams', 'UserFormService', 'TermService', 'User',
        '_', 'user', 'countries', 'MessageService',  'groups', 'UserFormIsAdminOptions', 'UserFormAccountStatusOptions', 'ModelEvent',
        function($scope, $state, $stateParams, UserFormService, TermService, User,
            _, user, countries, MessageService, groups, UserFormIsAdminOptions, UserFormAccountStatusOptions, ModelEvent) {

            var userGroupByStore = _.groupBy(groups, function(group) { return group.store.id });

            var userGroups = [];
            _.each(userGroupByStore, function(g, key) {
                if (userGroups.length>0) {
                    userGroups.push({id: 'sep' + key, name: "----------------------------------", disabled: true});
                }
                userGroups = userGroups.concat(g);
            });

            $scope.groups = userGroups;
            $scope.isAdminOptions = UserFormIsAdminOptions;

            UserFormService.prepScope($scope, user, !user.id);

            $scope.onSaved = function() {
                setPSTMask();
            };

            $scope.onUserRegistered = function(brandNewUser) {
                $state.go('admin.users.details', {id:brandNewUser.id}, {reload:true});
            };

            $scope.onCancelled = function() {
                $state.go('admin.users');
            };

            $scope.resendVerificationEmail = function() {
                User.resendVerificationEmail({email:$scope.model.user.email}, function() {
                    MessageService.show('Verification email has been sent to ' + $scope.model.user.email);
                });
            }

            $scope.noPSTChanged = function(e) {
                if ($scope.model && $scope.model.noPST) {
                    $scope.model.user.taxNumber = 'N/A';
                } else if ($scope.model.user.taxNumber === 'N/A') {
                    $scope.model.user.taxNumber = '';
                }

                setPSTMask();
            }

            function setPSTMask() {
                $scope.pstMask = ($scope.model.noPST || $scope.model.user.taxNumber === 'N/A') ? '' : 'PST-9999-9999';
            }

            $scope.pstDisabled = false;
            setPSTMask();

            $scope.$on(ModelEvent.ModelChanged, function(event, args) {
                if (args.type==='User') {
                    var changedUser = _.findWhere(args.items, {id:user.id});
                    if (changedUser) {
                        UserFormService.prepScope($scope, changedUser, !changedUser.id);
                    }
                }
            });
        }
    ]);
