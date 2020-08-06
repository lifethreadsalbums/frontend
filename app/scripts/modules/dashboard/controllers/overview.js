'use strict';

angular.module('pace.dashboard')
    .controller('OverviewCtrl',
    ['$scope', '$rootScope', '$state', '$stateParams', '_', 'MessageService', 'cart',
    'Cart', 'Product', '$timeout', 'Currency', 'ProductService', 'Order', 'AuthService', 'KeyboardService', 'ProductPrototype',
    '$location', '$q', 'CartService', 'DataCacheService', 'StoreConfig', 'TourService', 'DashboardOverviewTourService', 'TourEvent', 'MainNavService',
    'NotificationEvent',
    function ($scope, $rootScope, $state, $stateParams, _, MessageService, cart,
              Cart, Product, $timeout, Currency, ProductService, Order, AuthService, KeyboardService, ProductPrototype,
              $location, $q, CartService, DataCacheService, StoreConfig, TourService, DashboardOverviewTourService, TourEvent, MainNavService,
              NotificationEvent) {

        var currencySender = 'overview',
            currencyEventHandler;

        MainNavService.setCurrentController(this);

        this.getCurrentProductInfo = function() {
            return { 
                product: $scope.model.selectedProject,
                section: null, 
                optionUrl: null
            };
        };

        function getPromotions() {
            return (StoreConfig.dashboard && StoreConfig.dashboard.promotions) || [];
        }

        function addToCart(products) {

            $scope.addingToCart = true;
            $rootScope.designerSpinner = true;

            CartService.addToCart(products).then(
                function (cart) {
                    $rootScope.designerSpinner = false;
                    $scope.addingToCart = false;
                    $scope.cart = cart;

                    var selectedProjects = [];
                    _.each(cart.orderItems, function(orderItem) {
                        var p = _.findWhere($scope.projects.current, {id:orderItem.product.id});
                        if (p) {
                            _.extend(p, orderItem.product);
                        }

                        if (_.findWhere($scope.model.selectedProjects, {id:orderItem.product.id})) {
                            orderItem.product.selected = true;
                            selectedProjects.push(orderItem.product);
                        }
                    });
                    $scope.model.selectedProjects = selectedProjects;
                },
                function (error) {
                    $rootScope.designerSpinner = false;
                    $scope.addingToCart = false;
                }
            );

        }

        function addSelectedToCart() {
            addToCart($scope.model.selectedProjects);
        }

        function addAllToCart() {
            addToCart($scope.projects.current);
        }

        function refreshCurrentProducts() {
            DataCacheService.clear();
            Product.getMyProducts({state: 'New'}, function (value) {
                $scope.projects.current = value;
                $scope.currentCount.count = value.length;
                if ($scope.model.selectedProject) {
                    $scope.model.selectedProject = _.findWhere(value, {id: $scope.model.selectedProject.id});
                }

                $rootScope.designerDisabled = value.length > 0 ? false : true;
            });
        }

        function createNew() {
            $state.go('welcome');
        }

        function openInOrdersPanel(product) {
            $state.go('orders.current.details', {id: product.id});
        }

        function toggleFavourite(product) {
            product.isFavourite = !product.isFavourite;
            new Product(product).$save();
        }

        function deleteProduct(product) {
            if (product.inCart)
                return;

            var del = function(p) {
                $scope.projects.current = _.without($scope.projects.current, p);
                $scope.currentCount.count = $scope.projects.current.length;
                Product.delete({id: p.id});
                DataCacheService.clear();
                $scope.model.selectedProjects = [];
                $scope.model.selectedProject = null;
                $state.go('dashboard.default.overview.product', { productId: null });
            };

            if (product.parentId) {
                ProductPrototype.get({id:product.prototypeId}, function(prototype) {
                    MessageService.confirm('Do you really want to delete this ' + prototype.duplicateDisplayName +'?',
                        function () {
                            //Product.delete({id: product.id}, refreshCurrentProducts);
                            del(product);
                        }
                    );
                });
                return;
            }

            MessageService.confirm('Do you really want to delete this project?',
                function () {
                    //Product.delete({id: product.id}, refreshCurrentProducts);
                    del(product);
                }
            );
        }

        function deleteSelection() {
            MessageService.confirm('Do you really want to delete these project' + ($scope.model.selectedProjects.length>1 ? 's' : '') + '?',
                function() {

                    _.each($scope.model.selectedProjects, function(product) {

                        $scope.projects.current = _.without($scope.projects.current, product);
                        Product.delete({id: product.id});

                    });

                    $scope.currentCount.count = $scope.projects.current.length;
                    DataCacheService.clear();
                    $scope.model.selectedProjects = [];
                    $scope.model.selectedProject = null;
                    $state.go('dashboard.default.overview.product', { productId: null });

                });
        }

        function gotoPricingList(item) {
            if (item) {
                window.open(item.url, '_blank');
            } else {
                window.open(apiUrl + 'download/price-list', '_blank');
            }
        }

        $scope.$on('dashboard:project-menu-click', function (event, arg) {
            var product = arg.project,
                index = arg.index,
                action = [openInOrdersPanel, toggleFavourite, angular.noop, deleteProduct];

            if (index >= 0 && index < action.length)
                action[index](product);
        });

        $scope.$on('dashboard:price-button-click', function (event, arg) {
            var product = arg.project;

            $scope.$emit('frp-nav-click', {view: null});
            if ($scope.currentProduct !== product) {
                $scope.currentProduct = product;
                $scope.$emit('frp-nav-click', {
                    view: 'views/orders/frp-cost.html'
                });
            } else {
                $scope.currentProduct = null;
            }
        });

        function onCartDrop(project) {
            var product = new Product(project);
            product.$addToCart(function () {

            });
        }

        function emptyCart() {
            Cart.empty(function (value) {
                refreshCurrentProducts();
                $scope.cart = value;
            });
        }

        function removeOrderItem(orderItem) {
            Cart.removeOrderItem({id: orderItem.id}, function (value) {
                refreshCurrentProducts();
                $scope.cart = value;
            });
        }

        function selectProduct(id) {
            var allProjects = $scope.projects.current
                .concat($scope.projects.production)
                .concat($scope.projects.completed);

            var p = _.findWhere(allProjects, {id:id});
            if (!p) return;
            p.selected = true;
            $scope.model.selectedProjects = [p];
            $scope.model.selectedProject = p;
            //scroll to the selected project
            $timeout(function() {
                $scope.$broadcast('dashboard:scroll-to-selection');
            }, 0);
        }

        function loadMyProductionProducts() {
            DataCacheService.loadMyProductionProducts(selectProductFromStateParams);
            selectProductFromStateParams();
        }

        function loadMyCompletedProducts() {
            DataCacheService.loadMyShippedProducts(selectProductFromStateParams);
            selectProductFromStateParams();
        }

        $scope.$watch('model.selectedProject', function (project) {
            if (project) {
                $scope.selectedProjectView = ProductService.getProductViewModel(project);
                $state.go('dashboard.default.overview.product', { productId: project.id });
                $rootScope.designerDisabled = !(project.layoutId);
                //$rootScope.lastProductId = project.id;
            } else {
                $scope.selectedProjectView = null;
                $rootScope.designerDisabled = true;
            }
        });

        $scope.$watch('selectedTab', function(value, oldValue) {

            if (value===oldValue) return;

            $scope.model.selectedProjects = [];
            $scope.model.selectedProject = null;
            var allProjects = $scope.projects.current
                .concat($scope.projects.production)
                .concat($scope.projects.completed);
            _.each(allProjects, function(p) { p.selected = false; });

            if (value===1) {
                loadMyProductionProducts();
            } else if (value===2) {
                loadMyCompletedProducts();
            }
        });

        function selectProductFromStateParams() {
            var productId;

            if ($state.params.productId) {
                productId = parseInt($state.params.productId);
            } 
           
            if (productId) {
                selectProduct(productId);
            }
        }

        function loadCurrentProjects() {
            var result = DataCacheService.loadMyCurrentProducts(selectProductFromStateParams);
            selectProductFromStateParams();
            return result;
        }

        function countCurrentProjects() {
            Product.countMyCurrentProducts({}, function (value) {
                $scope.currentCount = value;
            });
        }

        $scope.model = { selectedProject: null, selectedProjects:[] };
        $scope.cart = cart;

        $scope.projects = {
            current: DataCacheService.getMyCurrentProducts(),
            production: DataCacheService.getMyProductionProducts(),
            completed: DataCacheService.getMyShippedProducts(),
        };


        $scope.dashboardConfig = StoreConfig.dashboard;
        $scope.promotions = getPromotions();
        $scope.addSelectedToCart = addSelectedToCart;
        $scope.addAllToCart = addAllToCart;
        $scope.createNew = createNew;
        $scope.deleteProduct = deleteProduct;
        $scope.onCartDrop = onCartDrop;
        $scope.emptyCart = emptyCart;
        $scope.removeOrderItem = removeOrderItem;
        $scope.gotoPricingList = gotoPricingList;
        $scope.selectedTab = 0;

        if ($stateParams.section==='production') {
            $scope.selectedTab = 1;
        } else if ($stateParams.section==='completed') {
            $scope.selectedTab = 2;
        }

        selectProductFromStateParams();

        $scope.addToCartOptions = [
            {
                isPrimary: true,
                value: 'selected',
                label: 'Add selected to cart',
                labelPreIcon: 'cart-blue',
                callback: $scope.addSelectedToCart
            },
            {value: 'all', label: 'Add all to cart', labelPreIcon: 'cart', callback: $scope.addAllToCart}
        ];

        $scope.isAvailableToAddToCart = function () {
            var inCartStatus = _.countBy($scope.projects.current, function (project) {
                return project.inCart ? 'insideCart' : 'outsideCart';
            });

            return (inCartStatus && inCartStatus.outsideCart) ? false : true;
        };

        function selectAll() {
            _.each($scope.projects.current, function(p) { p.selected = true; });
            $scope.model.selectedProjects = $scope.projects.current.concat();
        }

        $scope.checkout = function() {
            CartService.checkCart(cart).then(function() {
                $state.go('checkout.details');
            });
        };

        $scope.reorder = function(product) {
            console.log('reorder', product)
            $rootScope.designerSpinner = true;
            Product.reorder({id:product.id}, function(newProduct) {
                $rootScope.designerSpinner = false;
                $scope.projects.current.push(newProduct);
                $scope.selectedTab = 0;
                $timeout(selectProduct.bind(null, newProduct.id));
            }, function(err) {
                $rootScope.designerSpinner = false;
            });
        };

        $scope.onKeyDown = function(e) {
            var shortcut = KeyboardService.getShortcut(e);
            if (shortcut==='CTRL+A') {
                selectAll();
                e.preventDefault();
                e.stopImmediatePropagation();
            } else if (shortcut==='DELETE' || shortcut==='BACKSPACE') {
                e.preventDefault();
                e.stopImmediatePropagation();
                deleteSelection();
            }
        };

        var loadCurrentProjectsPromise = loadCurrentProjects();

        if (loadCurrentProjectsPromise) {
            loadCurrentProjectsPromise.then(function() {
                startDashboardOverviewTour();
            });
        } else {
            startDashboardOverviewTour();
        }


        countCurrentProjects();

        var now = moment.utc();

        if (StoreConfig.dashboard.messages) {
            for (var i = 0; i < StoreConfig.dashboard.messages.length; i++) {
                var msg = StoreConfig.dashboard.messages[i];
                var from = moment.utc(msg.from);
                var to = moment.utc(msg.to);
                var type = msg.type || 'warning';
                if (now.isAfter(from) && now.isBefore(to)) {
                    $scope.showNotifications = true;
                    $timeout(function() {
                        MessageService.inline(msg.message, type, '.dashboard-notification');
                    });
                    //show only the first message
                    break;
                }
            }
        }

        $scope.productionCount = Product.countMyProductionProducts();
        $scope.completedCount = Product.countMyShippedProducts();

        $rootScope.cart = null;

        var deregisterStartTour = $rootScope.$on(TourEvent.StartTour, function(event, data) {
            if (data.id === 'dashboardOverview') {
                if (loadCurrentProjectsPromise) {
                    loadCurrentProjectsPromise.then(function() {
                        startDashboardOverviewTour(true);
                    });
                } else {
                    startDashboardOverviewTour(true);
                }
            }
        });

        function startDashboardOverviewTour(forceStart) {
            $timeout(function() {
                TourService.start({
                    id: 'dashboardOverview',
                    config: DashboardOverviewTourService.getConfig($scope),
                    forceStart: forceStart
                });
            });
        }

        $scope.$on('$destroy', function() {
            deregisterStartTour();
        });



        $scope.$on(NotificationEvent.NotificationReceived, function(event, notification) {
            if (notification.entityType!=='com.poweredbypace.pace.domain.layout.SpreadComment') return;

            var comment = JSON.parse(notification.body);
            $scope.$broadcast('dashboard:comment-received', comment);

        });


    }
]);
