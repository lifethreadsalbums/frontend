'use strict';

angular.module('pace.admin')
    .controller('CouponDetailsCtrl', ['$scope', '$stateParams', '$timeout', '$state', 'AuthService',
        'MessageService', '$rootScope', '$debounce', '$location', 'Currency', '$q', 'StoreConfig', '$interpolate',
        'Timezone', 'users', 'groups',
        function ($scope, $stateParams, $timeout, $state, AuthService,
                  MessageService, $rootScope, $debounce, $location, Currency, $q, StoreConfig, $interpolate,
                  Timezone, users, groups) {

            $scope.users = users;

            $scope.coupon = {
                store: 'all',
                memberships: 'all',
                users: $scope.users,
                type: '',
                code: '',
                discountType: '',
                discountValue: '',
                comment: '',
                activeFrom: '',
                activeTo: '',
                timezone: '',
                maximumUses: '',
                minimumOrderAmount: '',
                affectsCustomServices: false,
                canBeUsedWithOtherCoupons: false,
                canBeUsedWithStudioSample: false,
                couponBlackoutFrom: '',
                couponBlackoutTo: '',
                enabled: true,
                productTypes: 'all',
                productLines: 'all',
                products: 'all',
                materialColour: 'all',
                size: 'all'
            };

            $scope.storeOptions = [
                {value: 'all', label: 'All'},
                {value: 'irisBook', label: 'Iris Book'},
                {value: 'irisPortfolios', label: 'Iris Portfolios'}
            ];

            $scope.storeChanged = function(index) {
                filterMemberships();
            };

            $scope.membershipsOptions = [];

            function filterMemberships() {
                var memberships = _.filter(groups, function(group) {
                    if ($scope.coupon.store === 'irisPortfolios') {
                        return group.store.name === 'IRISportfolios';
                    }

                    return true;
                });

                memberships = _.map(memberships, function(group) {
                    return {value: group.id, label: group.name};
                });

                $scope.membershipsOptions = [{value: 'all', label: 'All'}].concat(memberships);
            }
            filterMemberships();

            $scope.usersSelectedOption = 'all';
            $scope.usersOptions = [
                {value: 'all', label: 'All'},
                {value: 'select', label: 'Select'}
            ];

            $scope.usersChanged = function(index) {
                if (index === 0) {
                    $scope.coupon.users = $scope.users;
                } else {
                    $scope.coupon.users = [];
                }
            };

            $scope.couponTypeOptions = [
                {value: 'coupon', label: 'Coupon'},
                {value: 'credit', label: 'Credit'},
                {value: 'sale', label: 'Sale'}
            ];

            $scope.discountTypeOptions = [
                {value: 'cashValue', label: 'Cash Value'},
                {value: 'percentageOff', label: 'Percentage Off'}
            ];
            $scope.discountValueFormat = '0';
            $scope.discountTypeChanged = function(index) {
                if (index === 0) {
                    $scope.discountValueFormat = '0.[00]';
                } else {
                    $scope.discountValueFormat = '0';
                }
            };

            $scope.expiry = false;
            $scope.expiryChanged = function(value) {
                if (!value) {
                    $scope.coupon.activeFrom = '';
                    $scope.coupon.activeTo = '';
                    $scope.coupon.timezone = '';
                }
            };

            $scope.timezoneOptions = Timezone;

            $scope.limitNumberOfUses = false;
            $scope.limitNumberOfUsesChanged = function(value) {
                if (value) {
                    $scope.coupon.maximumUses = 1;
                } else {
                    $scope.coupon.maximumUses = '';
                }
            };

            $scope.minimumOrderAmountRequired = false;
            $scope.minimumOrderAmountRequiredChanged = function(value) {
                $scope.coupon.minimumOrderAmount = '';
            };

            $scope.couponBlackout = false;

            $scope.productTypesOptions = [
                {value: 'all', label: 'All'},
                {value: 'flushMounts', label: 'Flush Mounts'},
                {value: 'pressBook', label: 'Press Books'}
            ];

            $scope.productLinesOptions = [
                {value: 'all', label: 'All'},
                {value: 'irisBook', label: 'Iris Book'},
                {value: 'irisPortfolios', label: 'Iris Portfolios'}
            ];

            $scope.productsOptions = [
                {value: 'all', label: 'All'}
            ];

            $scope.materialColourOptions = [
                {value: 'all', label: 'All'}
            ];

            $scope.sizeOptions = [
                {value: 'all', label: 'All'}
            ];
        }
    ]);
