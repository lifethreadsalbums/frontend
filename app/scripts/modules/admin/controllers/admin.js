'use strict';

angular.module('pace.admin')

.controller('AdminCtrl', ['$scope', '$state', 'UserFormIsAdminOptions', 'UserFormAccountStatusOptions', 'groups', 'user',
function ($scope, $state, UserFormIsAdminOptions, UserFormAccountStatusOptions, groups, user) {

    $scope.accountTypeOptions = [
		{ label: 'All' },
        { value: 'user', label: 'Customer' },
        { value: 'admin', label: 'Administrator' }
    ];

    $scope.accountStatusOptions = [
    	{ label: 'All' },
        { value: 'New,Verified', label: 'New - All' },
        { value: 'New', label: 'New - Unverified' },
        { value: 'Verified', label: 'New - Verified' },
        { value: 'Enabled', label: 'Active' },
        { value: 'Suspended', label: 'Suspended' }
    ];

    var userGroupByStore = _.groupBy(groups, function(group) { return group.store.id });
    var userGroups = [{name:'All'}];
    _.each(userGroupByStore, function(g, key) {
        userGroups.push({id: 'sep-'+key, name: "----------------------------------", disabled: true});
        userGroups = userGroups.concat( _.map(g, function(item) { return {id:item.id+'', name:item.name}; }) );
    });

    $scope.userGroupOptions = userGroups;

    $scope.search = function() {

        if (!$scope.searchQuery) $scope.searchQuery = null;
        if (!$scope.accountStatus) $scope.accountStatus = null;
        if (!$scope.accountType) $scope.accountType = null;
        if (!$scope.userGroup) $scope.userGroup = null;
        if (!$scope.model) {
            $scope.model={fromDate:null};
            $scope.model={toDate:null};
        }
        var params = {
        	q: $scope.searchQuery,
        	status: $scope.accountStatus,
   		    role: $scope.accountType,
        	group: $scope.userGroup,
            fromDate: $scope.model.fromDate,
            toDate: $scope.model.toDate

        };

        $state.go('admin.users', params);
    };

    if ($state.params.q) $scope.searchQuery = $state.params.q;
    $scope.accountStatus = ($state.params.status) ? $state.params.status : null;
    if ($state.params.role) $scope.accountType = $state.params.role;
    if ($state.params.group) $scope.userGroup = $state.params.group;

    $scope.user = user;
}]);
