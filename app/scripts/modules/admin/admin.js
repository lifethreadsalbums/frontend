'use strict';

angular.module('pace.admin', [])
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.when('/admin', '/admin/users');

    $stateProvider.userState = function(stateName, url, title, users) {
        return $stateProvider
        .state(stateName, {
            url: url,
            views: {
                'left@admin': {
                    controller:'UserListCtrl',
                    templateUrl: 'views/admin/users/userList.html',
                    resolve: {
                        title: function() { return title; },
                        users: users,
                        emptyCheck: ['$stateParams', '$state', '$q', '$timeout', 'users', function($stateParams, $state, $q, $timeout, users) {
                            if ($stateParams.status === 'New,Verified' || $stateParams.status === 'New' || $stateParams.status === 'Verified') {
                                var deferred = $q.defer();

                                users(1, 0).$promise.then(function(results) {
                                    if (results && results.length) {
                                        deferred.resolve();
                                    } else {
                                        $timeout(function() {
                                            var params = {
                                                q: $stateParams.searchQuery,
                                                role: $stateParams.accountType,
                                                group: $stateParams.userGroup
                                            };

                                            if ($stateParams.status === 'New,Verified') {
                                                params.status = '';
                                            } else {
                                                params.status = 'New,Verified';
                                            }

                                            deferred.reject();

                                            $state.go('admin.users', params, {reload: true});
                                        });
                                    }
                                });

                                return deferred.promise;
                            }
                        }]
                    }
                },
            },
        })

        .state(stateName + '.new', {
            url: '/new',
            views: {
                'right@admin': {
                    controller: 'UserCtrl',
                    templateUrl: 'views/admin/users/user.html',
                    resolve: {
                        user: function() {
                            return {
                                verified: true,
                                changePasswordOnNextLogin: true
                            };
                        }
                    }
                }
            }
        })
        .state(stateName + '.details', {
            url: '/:id',
            views: {
                'right@admin': {
                    controller: 'UserCtrl',
                    templateUrl: 'views/admin/users/user.html',
                    resolve: {
                        user: ['User', '$stateParams',
                            function(User, $stateParams) {
                                return User.get({id: $stateParams.id}).$promise;
                            }
                        ]
                    }
                }
            }
        });
    };

    $stateProvider.couponsState = function(stateName, url, coupons, columns, users, groups) {
        var views =  {
            'right@admin': {
                controller: 'CouponsCtrl',
                templateUrl: 'views/admin/coupons/coupons.html',
                resolve: {
                    users: users
                }
            }
        };

        views['couponDetails@' + stateName] = {
            controller: 'CouponDetailsCtrl',
            templateUrl: 'views/admin/coupons/couponDetails.html',
            resolve: {
                users: users
            }
        };

        return $stateProvider
            .state(stateName, {
                url: url,
                resolve: {
                    coupons: coupons,
                    columns: columns,
                    currentStore: ['StoreService', function(StoreService) {
                        return StoreService.getCurrentStore().$promise;
                    }],
                    user: ['User', function(User) {
                        return User.getCurrent().$promise;
                    }],
                    userSettings: ['Settings', 'user', function(Settings, user) {
                        return Settings.getUserSettings(user.id);
                    }]
                },
                views: views,
                data: {
                    leftPanelHidden: true
                }
            })
            .state(stateName + '.details', {
                url: '/:id',
            });
    };

    $stateProvider
    .state('admin', {
        url: '/admin',
        controller: 'AdminCtrl',
        templateUrl:'views/admin/admin.html',
        abstract:true,
        resolve: {
            countries: ['TermService',
                function(TermService) {
                    return TermService.getCountries().$promise;
                }
            ],
            groups: ['User',
                function(User) {
                    return User.getAllGroups().$promise;
                }
            ],
            user: ['User', function(User) {
                return User.getCurrent().$promise;
            }],
        }
    })
    .state('admin.spines', {
        url:'/spines',
        data: {
            leftPanelHidden: true
        },
        views: {
            'right@admin': {
                controller:'AdminSpinesCtrl',
                templateUrl: 'views/admin/config/spines.html',
                resolve: {
                    spines: ['GenericRule', function(GenericRule) {
                        return GenericRule.get({code:'SPINE_WIDTH'}).$promise
                    }],
                }
            },
        },
    })
    .state('admin.hinges', {
        url:'/hinges',
        data: {
            leftPanelHidden: true
        },
        views: {
            'right@admin': {
                controller:'AdminSpinesCtrl',
                templateUrl: 'views/admin/config/spines.html',
                resolve: {
                    spines: ['GenericRule', function(GenericRule) {
                        return GenericRule.get({code:'HINGE_GAP'}).$promise
                    }],
                }
            },
        },
    })
    .state('admin.thicknesses', {
        url:'/thicknesses',
        data: {
            leftPanelHidden: true
        },
        views: {
            'right@admin': {
                controller:'AdminSpinesCtrl',
                templateUrl: 'views/admin/config/spines.html',
                resolve: {
                    spines: ['GenericRule', function(GenericRule) {
                        return GenericRule.get({code:'BOOK_THICKNESS'}).$promise
                    }],
                }
            },
        },
    })
    .state('admin.reports', {
        url: '/reports',
        data: { leftPanelHidden:true },
        views: {
            'right@admin': {
                controller:'ReportsCtrl',
                templateUrl: 'views/adminOrders/reports.html',
                resolve: {
                    currentStore: ['StoreService', function(StoreService) {
                        return StoreService.getCurrentStore().$promise;
                    }]
                }
            },
        },
    })
    .state('admin.console', {
        url:'/console',
        data: {
            leftPanelHidden: true
        },
        views: {
            'right@admin': {
                controller:'ConsoleCtrl',
                templateUrl: 'views/admin/console.html',
                resolve: {

                }
            },
        },
    })
    .state('admin.skins', {
        url:'/skins',
        data: {
            leftPanelHidden: true
        },
        views: {
            'right@admin': {
                templateUrl: 'views/admin/config/skins.html'
            }
        }
    })
    .state('admin.products', {
        url:'/products',
        views: {
            'left@admin': {
                controller:'AdminProductListCtrl',
                templateUrl: 'views/admin/products/product-list.html',
                resolve: {
                    prototypes: ['ProductPrototype',
                        function(ProductPrototype) {
                            return ProductPrototype.query().$promise;
                        }
                    ],
                }
            },
        },
    })
    .state('admin.products.details', {
        url:'/:id',
        views: {
            'right@admin': {
                controller:'AdminProductDetailsCtrl',
                templateUrl: 'views/admin/products/product-details.html',
                resolve: {
                    productPrototype: ['ProductPrototype', '$stateParams',
                        function(ProductPrototype, $stateParams) {
                            return ProductPrototype.get({id:$stateParams.id}).$promise;
                        }
                    ],
                }
            },
        },

    })

    .userState('admin.users', '/users?q?status?role?group', 'Users Admin Section',
        ['User', '$stateParams', function(User, $stateParams) {
            var params = _.pick($stateParams, 'q', 'status', 'role', 'group');

            return function (pageSize, pageIndex) {
                if (params.q || params.status || params.role || params.group) {
                    params.pageSize = pageSize;
                    params.pageIndex = pageIndex;
                    return User.search(params);
                } else {
                    return User.query({pageSize:pageSize, pageIndex:pageIndex});
                }
            }
        }]
    )

    .couponsState('admin.coupons', '/coupons',
        ['$q', 'Coupon', function($q, Coupon) {
            return function(pageSize, pageIndex) {
                // return Coupon.getCoupons({pageSize: pageSize, pageIndex: pageIndex});

                var data = [];

                if (pageIndex === 0) {
                    data = [{
                        id: 1,
                        status: 'Expired',
                        created: '2017-06-01T00:01:00Z',
                        code: 'SUMMER_SALE_2017',
                        comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In tempor elit nec nisi scelerisque, quis lobortis eros dignissim. Curabitur sagittis gravida odio sit amet semper. Fusce vehicula mattis faucibus.',
                        users: 'all',
                        discount: 25,
                        discountType: 'cashValue',
                        validUntil: '2019-08-31T23:59:00Z',
                        usesLeft: 175,
                        usedCounter: 37
                    }, {
                        id: 2,
                        status: 'Enabled',
                        created: '2017-06-22T00:49:34Z',
                        code: 'WINTER_SALE_2017',
                        comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In tempor elit nec nisi scelerisque, quis lobortis eros dignissim. Curabitur sagittis gravida odio sit amet semper. Fusce vehicula mattis faucibus.',
                        users: [10021],
                        discount: 25,
                        discountType: 'cashValue',
                        validUntil: '2019-08-22T00:49:34Z',
                        usesLeft: 175,
                        usedCounter: 37
                    }, {
                        id: 3,
                        status: 'Enabled',
                        created: '2017-06-23T15:37:00Z',
                        code: 'SUMMER_SALE_2017',
                        comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In tempor elit nec nisi scelerisque, quis lobortis eros dignissim. Curabitur sagittis gravida odio sit amet semper. Fusce vehicula mattis faucibus.',
                        users: [10021, 10042, 10121, 10164, 10071],
                        discount: 10,
                        discountType: 'percentageOff',
                        validUntil: null,
                        usesLeft: null,
                        usedCounter: null
                    }];
                }

                data.$promise = $q.when(data);
                return data;
            }
        }],
        function() {
            return [
                {field: 'status', header: 'Status'},
                {field: 'created', header: 'Created'},
                {field: 'code', header: 'Code'},
                {field: 'users', header: 'Users'},
                {field: 'discount', header: 'Discount'},
                {field: 'validUntil', header: 'Valid Until'},
                {field: 'usesLeft', header: 'Uses Left'},
                {field: 'usedCounter', header: 'Used Counter'},
                {field: 'comment', header: 'Comment'}
            ]
        },
        ['User', '$stateParams', function(User, $stateParams) {
            return User.query({}).$promise.then(function(users) {
                return users;
            });
        }],
        ['User', function(User) {
            return User.getAllGroups().$promise;
        }]
    )
}]);
