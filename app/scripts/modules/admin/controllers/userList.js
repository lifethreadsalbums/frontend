'use strict';

angular.module('pace.admin')
    .controller('UserListCtrl', ['$scope', 'title', '$state', '$location', '_', 'users', 'ModelEvent', 'User',
        'MessageService', 'ModelService', 'ngDialog', '$q', '$rootScope', '$sce', 'groups',
        function ($scope, title, $state, $location, _, users, ModelEvent, User,
            MessageService, ModelService, ngDialog, $q, $rootScope, $sce, groups) {

            if ($state.params.q) $scope.$parent.searchQuery = $state.params.q;
            $scope.$parent.accountStatus = ($state.params.status) ? $state.params.status : null;
            if ($state.params.role) $scope.$parent.accountType = $state.params.role;
            if ($state.params.group) $scope.$parent.userGroup = $state.params.group;

            $scope.remove = function() {
                if (selectedUsers.length > 0) {
                    var msg = 'Do you want to delete the selected user account' + (selectedUsers.length > 1 ? 's' : '') + '?';
                    MessageService.confirm(msg, function() {
                        User.delete(selectedUsers).then(function() {
                            var state = $state.current.name;
                            if (state.indexOf('.details') >= 0)
                                $state.go('^', {reload: true});
                            else
                                $state.reload();
                        });
                    });
                }
            };

            $scope.completeAccountTypeChange = function(password, userId, accountTypeId) {
                changeSelection({userId:userId, accountTypeId:accountTypeId});
            };

            $scope.cancelAccountTypeChange = function(passowrd, userId, accountTypeId) {
                userListComponent.refresh();
            };

            $scope.changeAccountType = function(userId, accountTypeId) {
                var dialogScope = $scope.$new();

                dialogScope.userId = userId;
                dialogScope.accountTypeId = accountTypeId;
                dialogScope.ok = $scope.completeAccountTypeChange;
                dialogScope.cancel = $scope.cancelAccountTypeChange;

                ngDialog.open({
                    template: 'views/admin/users/confirmPassword.html',
                    scope: dialogScope,
                    controller: 'ConfirmPasswordCtrl',
                    className: 'pace-modal pace-modal-light',
                    showClose: false
                });
            };

            function onSelectionChange(params) {
                selectedUsers = params.selectedItems;
                $scope.hasSelection = selectedUsers.length>0;

                if (params.selectedItems.length>0) {
                    var state = $state.current.name;

                    if (state.indexOf('.new') !== -1) {
                        state = state.replace('.new', '');
                    }

                    if (state.indexOf('.details') === -1)
                        state += '.details';

                    $state.go(state, { id: params.selectedItems[0].id });
                }
            }

            var userListComponent;
            var selectedUsers;

            var openedPreviewWindows = {};

            var accountStatusOptions = [];
            var userGroupOptions = [];
            var accountTypeOptions = [];
            var i;
            var optionItem;

            for (i = 0; i < $scope.$parent.accountStatusOptions.length; i++) {
                if (!$scope.$parent.accountStatusOptions[i].value) {
                    continue;
                }

                optionItem = {
                    id: $scope.$parent.accountStatusOptions[i].value,
                    label: $scope.$parent.accountStatusOptions[i].label,
                    hidden: ($scope.$parent.accountStatusOptions[i].value !== 'Enabled' && $scope.$parent.accountStatusOptions[i].value !== 'Suspended') ? true : false
                };
                accountStatusOptions.push(optionItem);
            }

            var userGroupByStore = _.groupBy(groups, function(group) { return group.store.id });

            var userGroups = [];
            _.each(userGroupByStore, function(g, key) {
                if (userGroups.length>0) {
                    userGroups.push({id: 'sep' + key, label: "----------------------------------", disabled: true});
                }
                userGroups = userGroups.concat( _.map(g, function(item) {return {id:item.id, label:item.name}}) );
            });
            userGroupOptions = userGroups;

            for (i = 0; i < $scope.$parent.accountTypeOptions.length; i++) {
                if (!$scope.$parent.accountTypeOptions[i].value) {
                    continue;
                }

                optionItem = {
                    id: $scope.$parent.accountTypeOptions[i].value,
                    label: $scope.$parent.accountTypeOptions[i].label
                };
                accountTypeOptions.push(optionItem);
            }

            function changeSelection(args) {
                var selectedUsers = userListComponent.getSelectedItems();
                var currentUser = _.findWhere(userListComponent.getItems(), {id:args.userId});
                if (selectedUsers.indexOf(currentUser)===-1) {
                    if (selectedUsers.length===1) {
                        selectedUsers = [currentUser];
                    } else {
                        selectedUsers.push(currentUser);
                        userListComponent.setSelectedItems(selectedUsers);
                    }
                }

                var promises = _.map(selectedUsers, function(user) {
                    if (args.statusId) {
                        user.status = args.statusId;
                    } else if (args.accountTypeId) {
                        if (args.accountTypeId==='admin') {
                            user.roles = [{id:1, version:0}, {id:2, version:0}];
                        } else {
                            user.roles = [{id:1, version:0}];
                        }
                    } else {
                        var group = _.findWhere(groups, {id:args.groupId});
                        user.group = group;
                    }
                    return user.$save();
                });
                userListComponent.refresh();
                $q.all(promises).then(function() {
                    // filter out users
                    if ($state.params.status) {
                        var items = userListComponent.getItems();
                        var statuses = $state.params.status.split(',');
                        var filteredItems = _.filter(items, function(item) {
                            return _.contains(statuses, item.status);
                        });
                        userListComponent.setItems(filteredItems);

                        if (!filteredItems.length && ($scope.accountStatus === 'New' || $scope.accountStatus === 'Verified')) {
                            var params = {
                                q: $scope.searchQuery,
                                status: 'New,Verified',
                                role: $scope.accountType,
                                group: $scope.userGroup
                            };

                            $state.go('admin.users', params);
                        } else {
                            var params = {
                                q: $scope.searchQuery,
                                status: $scope.accountStatus,
                                role: $scope.accountType,
                                group: $scope.userGroup
                            };

                            $state.go('admin.users', params);
                        }
                    }
                });
            }

            $scope.userListProps = {
                keyboardNav: true,
                items: users,
                customOptions: {
                    accountStatusOptions: accountStatusOptions,
                    userGroupOptions: userGroupOptions,
                    accountTypeOptions: accountTypeOptions
                },
                onSelectionChange: onSelectionChange,
                onComponentReady: function (component) { userListComponent = component; },
                onItemRendererEvent: function(args) {
                    //console.log('onItemRendererEvent', args);

                    switch (args.type) {
                        case 'StatusClicked':
                        case 'GroupClicked':
                            changeSelection(args);
                            break;
                        case 'AccountTypeClicked':
                            $scope.changeAccountType(args.userId, args.accountTypeId);
                            break;
                        case 'WebsitePreviewClicked':
                            $scope.openWebsitePreview(args.url);
                            break;

                    }
                }
            };

            $scope.$on(ModelEvent.ModelChanged, function(event, args) {
                if (args.type==='User') {
                    var items = userListComponent.getItems();
                    ModelService.updateList(items, args.items);
                    userListComponent.refresh();
                }
            });

            $scope.$on(ModelEvent.ModelDeleted, function(event, args) {
                if (args.type==='User') {
                    var items = userListComponent.getItems();
                    ModelService.deleteFromList(items, args.items);
                    userListComponent.clearSelection();
                }
            })

            $scope.$on('$destroy', function() {
                userListComponent = null;
            });

            $scope.onKeyDown = function(e) {
                var activeElement = $(document.activeElement);
                if (activeElement.is('input') || activeElement.is('textarea')) return;

                var keyCode = event.keyCode;

                if (keyCode === 46 && $scope.hasSelection) {
                    $scope.remove();
                }
            };



            $scope.openWebsitePreview = function(url) {
                var url = $sce.trustAsResourceUrl(url);

                // check if window was already opened in the past and if it wasn't closed already
                if (openedPreviewWindows[url] && !openedPreviewWindows[url].closed) {
                    // close window
                    openedPreviewWindows[url].close();
                    delete openedPreviewWindows[url];
                } else {
                    // open new window
                    openedPreviewWindows[url] = window.open (url, '_blank');
                }
            };

            $scope.$on('$stateChangeSuccess',
                function(event, toState, toParams, fromState, fromParams) {

                    if (toState.name==='admin.users.new' && userListComponent) {
                        userListComponent.clearSelection();
                    }

                }
            );

        }]);
