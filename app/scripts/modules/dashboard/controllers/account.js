'use strict';

angular.module('pace.dashboard')
	.controller('AccountCtrl', ['_', '$scope', '$state', 'UserFormService', 'TermService', 'user', 'countries', 'groups',
		function(_, $scope, $state, UserFormService, TermService, user, countries, groups) {
			$scope.countries = countries;
			$scope.groups = groups;
			$scope.onSaved = function() {
				setPSTDisabled();
			};
			$scope.onCancelled = function() {
				//TODO do something
			};

			UserFormService.prepScope($scope, user);

			$scope.noPSTChanged = function(e) {
				if ($scope.model && $scope.model.noPST) {
					$scope.model.user.taxNumber = 'N/A';
				} else if ($scope.model.user.taxNumber === 'N/A') {
					$scope.model.user.taxNumber = '';
				}

				setPSTMask();
			}

			function setPSTDisabled() {
				if (!$scope.model.user.admin && $scope.model.user.taxNumber) {
					$scope.pstDisabled = true;
				} else {
					$scope.pstDisabled = false;
				}

				setPSTMask();
			}

			function setPSTMask() {
				$scope.pstMask = ($scope.model.noPST || $scope.model.user.taxNumber === 'N/A') ? '' : 'PST-9999-9999';
			}

			setPSTDisabled();
		}]);