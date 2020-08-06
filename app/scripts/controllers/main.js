'use strict';

angular.module('paceApp')
    .controller('MainCtrl', ['$scope', '$rootScope', 'AuthService', '$state', '$location', '_',
        'LoginEvent', 'Cart', 'Currency', 'Product', 'ProductPrototype', '$http', '$templateCache', '$timeout', 'FontLoader',
        'AdminNotificationService', 'StoreConfig', 'TourService', 'TourEvent', 'MainNavService',
        function($scope, $rootScope, AuthService, $state, $location, _,
                 LoginEvent, Cart, Currency, Product, ProductPrototype, $http, $templateCache, $timeout, FontLoader,
                 AdminNotificationService, StoreConfig, TourService, TourEvent, MainNavService) {

            $scope.storeConfig = StoreConfig;


            function preloadStuff() {
                ProductPrototype.query(function() {
                    //load fonts
                    $timeout(FontLoader.load, 0);
                });
            }

            function getCurrentProductId() {
                return $state.params ? ($state.params.productId || $state.params.id) : $rootScope.lastProductId;
            }

            $scope.isLogged = function() {
                return AuthService.isLoggedIn();
            };

            $scope.logout = function() {
                if ($state.current.name==='proofer') {
                    $state.go('proofer-login', $state.params);
                } else {
                    $location.path('/login');
                }
                AuthService.logout();
            };

            $scope.$on(LoginEvent.LoginSuccess, function() {
                $timeout(preloadStuff, 4000);

                Currency.format({ amount: 0.0 }, function(price) {
                    Currency.zeroPrice.displayPrice = price.displayPrice;
                    Currency.zeroPrice.displayCurrency = price.displayCurrency;
                });
            });

            $scope.onKeyDown = function(e) {
                if (e.keyCode === 8 && !$(e.target).is("input:not([readonly]):not([type=radio]):not([type=checkbox]), textarea, [contentEditable], [contentEditable=true]")) {
                    e.preventDefault();
                }
            };

            $scope.gotoCoverBuilder = function() {
                MainNavService.gotoProductBuilder();
            };

            $scope.gotoPrints = function() {
                MainNavService.gotoPrints();
            };

            $scope.gotoDesigner = function() {
                MainNavService.gotoDesigner();
            };

            $scope.gotoProjects = function() {
                MainNavService.gotoProjects();
            };

            $rootScope.designerEnabled = false;

            $scope.gotoDashboard = function() {
                MainNavService.gotoDashboard();
            };

            $scope.gotoAdminOrders = function() {
                if ($rootScope.lastAdminOrderProduct) {
                    $state.go($rootScope.lastAdminOrderProduct.state,
                        {id: $rootScope.lastAdminOrderProduct.id});
                } else {
                    $state.go('adminOrders.orders');
                }
            };

            var deregisterStateChangeSuccess = $rootScope.$on('$stateChangeSuccess', stateChanged);

            function stateChanged() {
                $timeout(function() {
                    $scope.availableTours = TourService.getAvailable();
                });
            }

            $scope.isExapandedTourList = false;

            $scope.showAvailableTours = function() {
                if ($rootScope.tourInProgress) {
                    $scope.isExapandedTourList = false;
                    TourService.stop();
                    return;
                }

                if ($scope.isExapandedTourList) {
                    $scope.isExapandedTourList = false;
                    return;
                }

                if (!$scope.availableTours) {
                    return;
                }

                if ($scope.availableTours.length === 1) {
                    $scope.startTour($scope.availableTours[0].id);
                } else if ($scope.availableTours.length > 1) {
                    $scope.isExapandedTourList = true;
                }
            }

            $scope.startTour = function(tourId) {
                $scope.isExapandedTourList = false;
                $rootScope.$emit(TourEvent.StartTour, {id: tourId});
            };

            $scope.$on('$destroy', function() {
                deregisterStateChangeSuccess();
            });
        }
    ]);
