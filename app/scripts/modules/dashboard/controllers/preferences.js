'use strict';

angular.module('pace.dashboard')
.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('dashboard.preferences.notifications', {
            url: '/notifications',
            views: {
                'right@dashboard': {
                    controller:'NotificationsCtrl',    
                    templateUrl: 'views/dashboard/notifications.html'
                }
            }
        })
        .state('dashboard.preferences.designer', {
            url: '/designer',
            views: {
                'left@dashboard': {
                    controller:'DesignerPrefsCtrl',    
                    templateUrl: 'views/dashboard/designer.html'
                }
            },
            data: {
                leftPanelHidden: false
            }
        })
        .state('dashboard.preferences.account', {
            resolve: {
                user: ['User', '$stateParams',
                    function(User, $stateParams) {
                        return User.getCurrent().$promise;
                    }
                ],
                countries: ['TermService',
                    function(TermService) {
                        return TermService.getCountries().$promise;
                    }
                ],
                groups: ['User',
                    function(User) {
                        return User.getGroups().$promise;
                    }
                ]
            },
            url: '/account',
            views: {
                'right@dashboard': {
                    controller: 'AccountCtrl',
                    templateUrl: 'views/admin/users/user.html'
                }
            }
        });
}]);