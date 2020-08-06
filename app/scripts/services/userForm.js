'use strict';

angular.module('paceApp')
    .constant('UserFormIsAdminOptions', [
        { value: false, label: 'Customer' },
        { value: true, label: 'Administrator' }
    ])
    .constant('UserFormAccountStatusOptions', [
        { value: 'New', label: 'New - Unverified' },
        { value: 'Verified', label: 'New - Verified' },
        { value: 'Enabled', label: 'Active' },
        { value: 'Suspended', label: 'Suspended' }
    ])
    .factory('UserFormService', ['_', 'TermService', 'User', 'UserFormIsAdminOptions', 'UserFormAccountStatusOptions', '$timeout',
        function(_, TermService, User, UserFormIsAdminOptions, UserFormAccountStatusOptions,  $timeout) {
            var UserForm = {},
                passPlaceholder = 'FakePassword123';

            // preparing the scope object to work with views/admin/users/user.html form
            UserForm.prepScope = function(scope, user, isNewUser) {
                var oldUser;

                if(!scope.countries)
                    scope.countries = TermService.getCountries();
                if(!scope.groups)
                    scope.groups = User.getGroups();

                scope.isAdminOptions = UserFormIsAdminOptions;
                if (user.status==='New') {
                    scope.accountStatusOptions = UserFormAccountStatusOptions.slice(0,1);
                } else if (user.status==='Verified') {
                    scope.accountStatusOptions = UserFormAccountStatusOptions.slice(1);
                } else {
                    scope.accountStatusOptions = UserFormAccountStatusOptions.slice(2);
                }

                // initially preload provinces list for current country
                scope.billingProvinces = (user.billingAddress && user.billingAddress.country &&
                    TermService.getProvinces(user.billingAddress.country.id)) || [];
                scope.shippingProvinces = (user.shippingAddress && user.shippingAddress.country &&
                    TermService.getProvinces(user.shippingAddress.country.id)) || [];

                var resetForm = function(usr) {

                    usr.billingAddress = usr.billingAddress || {};
                    usr.shippingAddress = usr.shippingAddress || {};

                    scope.model = {
                        user: usr,
                        newPassword: isNewUser ? null : passPlaceholder,
                        passwordConfirmation: isNewUser ? null : passPlaceholder,
                        emailConfirmation: usr.email
                    };
                    oldUser = angular.copy(usr);
                };
                resetForm(user);

                // Labels
                scope.isAdminChanged = function() {
                    var val = _.find(UserFormIsAdminOptions, function(option) {
                        return option.value === scope.model.user.admin;
                    });
                    scope.model.isAdminLabel = val && val.label;
                };
                scope.isAdminChanged();

                // Listeners for querying provinces.
                scope.billingCountryChanged = function() {
                    scope.billingProvinces = TermService.getProvinces(scope.model.user.billingAddress.country.id);
                };
                scope.shippingCountryChanged = function() {
                    scope.shippingProvinces = TermService.getProvinces(scope.model.user.shippingAddress.country.id);
                };

                scope.shippingSameAsBillingChanged = function() {
                    if (scope.model.user.shippingAddressSameAsBillingAddress) {
                        //copy billing address
                        _.extend(scope.model.user.shippingAddress,
                            _.omit(scope.model.user.billingAddress, 'id', 'version'));
                    }
                };

                scope.save = function($event) {
                    if(!isNewUser) {

                        if (scope.model.newPassword!==passPlaceholder) {
                            user.newPassword = scope.model.newPassword;
                        } else {
                            user.newPassword = null;
                        }

                        scope.saving = true;
                        user.$save(function() {
                            scope.userForm.$setPristine();
                            scope.saving = false;
                            if(scope.onSaved) scope.onSaved();
                        }, function(error) {
                            console.error('Error while saving user', error);
                            scope.saving = false;
                        });

                    } else {
                        //register new user
                        user.password = scope.model.newPassword;
                        User[scope.model.user.admin ?
                            'registerAdmin' : 'register'](user).$promise
                                .then(function(brandNewUser) {
                                    if(scope.onUserRegistered) scope.onUserRegistered(brandNewUser);
                                });
                    }
                };

                scope.cancel = function() {
                    resetForm(oldUser);
                    if(scope.onCancelled) scope.onCancelled();
                };

                if (isNewUser) {
                    $timeout(function() {
                        scope.userForm.$setDirty();
                    });
                }

            };

            return UserForm;
        }]);
