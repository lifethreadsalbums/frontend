'use strict';

angular.module('pace.dashboard', [])
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.when('/dashboard', [function() {
        return '/dashboard/overview';
    }]);

    // $urlRouterProvider.when('/dashboard/social-media', [function() {
    //     return '/dashboard/social-media/twitter';
    // }]);

    $stateProvider

        // Default states
        .state('dashboard', {
            url: '/dashboard',
            controller: 'DashboardCtrl',
            templateUrl: 'views/dashboard/dashboard.html',
            abstract: true,

        })

        .state('dashboard.default', {
            abstract: true,
            views: {
                'sidebar@dashboard': {
                    templateUrl: 'views/dashboard/sidebarDefault.html'
                }
            }
        })

        // Calculator

        .state('dashboard.default.calculator', {
            url: '/calculator',
            views: {
                'right@dashboard': {
                    controller: 'CalculatorCtrl',
                    templateUrl: 'views/dashboard/calculator.html',
                    resolve: {
                        productPrototype:['ProductPrototype', function(ProductPrototype) {
                            return ProductPrototype.getDefault().$promise;
                        }],
                        sections: ['productPrototype', 'BuildService', function(productPrototype, BuildService) {
                            return BuildService.getSectionsByPrototypeId(productPrototype.id);
                        }],
                    }
                }
            },
            data: {
                leftPanelHidden: true
            }
        })

        //Project Preferences

        .state('project-prefs', {
            url: '/prefs/:productId',
            abstract:false,
            templateUrl: 'views/dashboard/projectPrefs.html',
            controller:'ProjectPrefsCtrl',
            resolve: {
                product:['$stateParams', 'Product', function($stateParams, Product) {
                    return Product.get({id:$stateParams.productId}).$promise;
                }],
                user: ['User', function(User) {
                    return User.getCurrent().$promise;
                }],
                userSettings: ['Settings', 'user', function(Settings, user) {
                    return Settings.getUserSettings(user.id);
                }],
                productSettings: ['$stateParams', 'Settings', function($stateParams, Settings) {
                    return Settings.getProductSettings({productId:$stateParams.productId}).$promise;
                }],
                theme: function() { return 'medium-grey'; }
            }
        })


        // Welcome
        .state('welcome', {
            url: '/welcome',
            controller: 'WelcomeCtrl',
            templateUrl: 'views/dashboard/welcome.html',
            resolve: {
                categories: ['TermService', function(TermService) {
                    return TermService.getCategories();
                }],
                currentStore: ['StoreService', function(StoreService) {
                    return StoreService.getCurrentStore().$promise;
                }],
                user: ['User', function(User) {
                    return User.getCurrent().$promise;
                }]
            }
        })

        // Overview
        .state('dashboard.default.overview', {
            url: '/overview?section',
            views: {
                'right@dashboard': {
                    controller:'OverviewCtrl',
                    templateUrl: 'views/dashboard/overview.html'
                }
            },
            resolve: {
                currentStore: ['StoreService', function(StoreService) {
                    return StoreService.getCurrentStore().$promise;
                }],
                cart: ['Cart', function(Cart) {
                    return Cart.get();
                }]
            },
            data: {
                leftPanelHidden: true,
                directionRight: true
            }
        })

        .state('dashboard.default.overview.product', {
            url: '/:productId',
        })


        // Resources
        .state('dashboard.default.resources', {
            url: '/resources',
            views: {
                'left@dashboard': {
                    controller:'ResourcesCtrl',
                    templateUrl: 'views/dashboard/resources.html'
                }
            },
            data: {
                directionRight: true
            }
        })

        // Social Media
        .state('dashboard.default.social-media', {
            url: '/social-media',
            views: {
                'left@dashboard': {
                    templateUrl: 'views/dashboard/socialMedia.html'
                }
            },
            data: {
                directionRight: true
            }
        })
        .state('dashboard.default.social-media.twitter', {
            url: '/twitter',
            views: {
                'left@dashboard': {
                    templateUrl: 'views/dashboard/socialMedia.html'
                },
                'right@dashboard': {
                    controller:'TwitterCtrl',
                    templateUrl: 'views/dashboard/twitter.html'
                }
            },
            data: {
                directionRight: true
            }
        })
        .state('dashboard.default.social-media.facebook', {
            url: '/facebook',
            views: {
                'left@dashboard': {
                    templateUrl: 'views/dashboard/socialMedia.html'
                },
                'right@dashboard': {
                    controller:'FacebookCtrl',
                    templateUrl: 'views/dashboard/facebook.html'
                }
            },
            data: {
                directionRight: true
            }
        })
        .state('dashboard.default.social-media.instagram', {
            url: '/instagram',
            views: {
                'left@dashboard': {
                    templateUrl: 'views/dashboard/socialMedia.html'
                },
                'right@dashboard': {
                    templateUrl: 'views/dashboard/instagram.html'
                }
            },
            data: {
                directionRight: true
            }
        })
        .state('dashboard.default.social-media.pinterest', {
            url: '/pinterest',
            views: {
                'left@dashboard': {
                    templateUrl: 'views/dashboard/socialMedia.html'
                },
                'right@dashboard': {
                    controller:'PinterestCtrl',
                    templateUrl: 'views/dashboard/pinterest.html'
                }
            },
            data: {
                directionRight: true
            }
        })
        .state('dashboard.default.social-media.google-plus', {
            url: '/google-plus',
            views: {
                'left@dashboard': {
                    templateUrl: 'views/dashboard/socialMedia.html'
                },
                'right@dashboard': {
                    controller:'GooglePlusCtrl',
                    templateUrl: 'views/dashboard/googlePlus.html'
                }
            },
            data: {
                directionRight: true
            }
        })

        // Preferences
        .state('dashboard.preferences', {
            url: '/preferences',

            resolve: {
                user: ['User',
                    function(User) {
                        return User.getCurrent().$promise;
                    }
                ],
                userSettings: ['Settings', 'user',
                    function(Settings, user) {
                        return Settings.getUserSettings(user.id);
                    }
                ],
            },

            views: {
                'sidebar@dashboard': {
                    templateUrl: 'views/dashboard/sidebarPreferences.html'
                },
            },
            data: {
                leftPanelHidden: true,
                directionLeft: true
            }
        })

        // Tour
        .state('tour', {
            url: '/tour',
            controller:'TourCtrl',
            templateUrl: 'views/dashboard/tour.html',
            resolve: {
                currentStore: ['StoreService', function(StoreService) {
                    return StoreService.getCurrentStore().$promise;
                }]
            },
        });
}]);
