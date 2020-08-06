'use strict';

angular.module('pace.dashboard')
    .service('DashboardOverviewTourService', ['$rootScope', '$timeout', 'StoreConfig', function DashboardOverviewTourService($rootScope, $timeout, StoreConfig) {

        return {
            getConfig: getConfig
        };

        function getConfig($scope) {
            var config = {
                id: 'dashboardOverview'
            };

            var projectsCount = $('.dashboard-overview__panel--projects .tab-pane.active .project-slider__slides > li').length;
            var cartItemsCount = $('.dashboard-cart__items > li').length;

            var projectPlaceholder = $('.tour-project-placeholder');
            var cartItemPlaceholder = $('.tour-cart-item-placeholder');

            var closePriceFrp = function() {
                if ($('.frp.direction-right .frp-content').length) {
                    $scope.currentProduct = null;

                    $timeout(function() {
                        $scope.$emit('frp-nav-click', {view: null});
                    });
                }
            };

            config.steps = [
                {
                    element: '#create-new-project',
                    intro: 'Create a new project.',
                    position: 'top',
                    onBefore: function () {
                        $('.dashboard-overview__panel--projects .tab-pane.active .project-slider__slides > li:first-child .flip__container').removeClass('flip__container--fliped');
                    }
                },
                {
                    element: '.dashboard-overview__panel--projects .tab-pane.active .project-slider__slides > li:first-child .project-overview__front',
                    intro: 'Edit an existing project by mousing over the tile and then jumping to the section you need.',
                    position: 'top',
                    onAfter: function () {
                        $('.dashboard-overview__panel--projects .tab-pane.active .project-slider__slides > li:first-child .flip__container').addClass('flip__container--fliped');
                    }
                },
                {
                    element: '.dashboard-overview__panel--projects .tab-pane.active .project-slider__slides > li:first-child .icon-three-bars',
                    intro: 'Use this to edit and delete your project.',
                    position: 'top',
                    onBefore: function () {
                        $('.dashboard-overview__panel--projects .tab-pane.active .project-slider__slides > li:first-child .flip__container').removeClass('flip__container--fliped');
                        closePriceFrp();
                    }
                },
                {
                    element: '.dashboard-overview__panel--projects .tab-pane.active .project-slider__slides > li:first-child .price-button',
                    intro: 'Click on the price to see a detailed cost breakdown of your project.',
                    position: 'top',
                    onAfter: function () {
                        $('.dashboard-overview__panel--projects .tab-pane.active .project-slider__slides > li:first-child .price-button .split-button').first().trigger('click');
                    }
                },
                {
                    element: '#projects-tab-nav',
                    intro: 'See what projects you are currently designing, are in production, or have been completed and shipped.',
                    position: 'top',
                    onBefore: function () {
                        closePriceFrp();

                        $('#add-to-cart').addClass('is-disabled-primary');

                        if (!cartItemsCount) {
                            cartItemPlaceholder.addClass('hidden');
                            $('.dashboard-overview').append(cartItemPlaceholder);
                            $('#checkout').attr('disabled', 'disabled');
                        }
                    }
                },
                {
                    element: '#add-to-cart',
                    intro: 'Add projects to your shopping cart here. <strong>Tip:</strong> Place multiple projects in your cart and then check out all at once to save on shipping costs!',
                    position: 'top',
                    onBefore: function () {
                        $('#add-to-cart').removeClass('is-disabled-primary');

                        if (!cartItemsCount) {
                            var cartPlaceholderTitle = $('.dashboard-overview__panel--projects .tab-pane.active .project-slider__slides > li:first-child .project-overview__title').first().text();
                            var cartPlaceholderCost = $('.dashboard-overview__panel--projects .tab-pane.active .project-slider__slides > li:first-child .price-button .split-button').first().text();
                            cartItemPlaceholder.find('.dashboard-cart__item-title').text(cartPlaceholderTitle);
                            cartItemPlaceholder.find('.dashboard-cart__item-cost').text(cartPlaceholderCost);
                            $('.dashboard-cart__items').append(cartItemPlaceholder);
                            cartItemPlaceholder.removeClass('hidden');

                            $('#checkout').removeAttr('disabled');
                        }
                    }
                },
                {
                    element: '#checkout',
                    intro: 'Go to your shopping cart and check out here.',
                    position: 'top',
                    onBefore: function () {
                        $('#add-to-cart').addClass('is-disabled-primary');

                        if (!cartItemsCount) {
                            var cartPlaceholderTitle = $('.dashboard-overview__panel--projects .tab-pane.active .project-slider__slides > li:first-child .project-overview__title').first().text();
                            var cartPlaceholderCost = $('.dashboard-overview__panel--projects .tab-pane.active .project-slider__slides > li:first-child .price-button .split-button').first().text();
                            cartItemPlaceholder.find('.dashboard-cart__item-title').text(cartPlaceholderTitle);
                            cartItemPlaceholder.find('.dashboard-cart__item-cost').text(cartPlaceholderCost);
                            $('.dashboard-cart__items').append(cartItemPlaceholder);
                            cartItemPlaceholder.removeClass('hidden');

                            $('#checkout').removeAttr('disabled');
                        }
                    }
                }
            ];

            if (StoreConfig.appCode === 'DR') {
                config.steps.push({
                    element: '.dashboard-overview__panel--pricing',
                    intro: 'Download a current price list and brochure.',
                    position: 'top',
                    onBefore: function () {
                        if (!cartItemsCount) {
                            cartItemPlaceholder.addClass('hidden');
                            $('.dashboard-overview').append(cartItemPlaceholder);
                            $('#checkout').attr('disabled', 'disabled');
                        }
                    }
                });
            } else {
                config.steps.push({
                    element: '.dashboard-pricing-box:first-child button',
                    intro: 'Download a current price list.',
                    position: 'top',
                    onBefore: function () {
                        if (!cartItemsCount) {
                            cartItemPlaceholder.addClass('hidden');
                            $('.dashboard-overview').append(cartItemPlaceholder);
                            $('#checkout').attr('disabled', 'disabled');
                        }
                    }
                });
            }

            config.onBefore = function() {
                if (!projectsCount) {
                    $('.dashboard-overview__panel--projects .tab-pane.active .project-slider__slides').append(projectPlaceholder);
                    $('.tour-project-placeholder .split-button').off('click').on('click', function () {
                        if ($('.frp.direction-right .frp-content').length) {
                            $rootScope.$emit('frp-nav-click', {view: null});
                        } else {
                            $rootScope.$emit('frp-nav-click', {
                                view: 'views/orders/frp-cost-mock.html'
                            });
                        }

                        $timeout(function () {
                            $rootScope.$apply();
                        });
                    });
                    projectPlaceholder.removeClass('hidden');
                }
            };

            config.onAfter = function() {
                if (!projectsCount) {
                    if ($('.frp.direction-right .frp-content').length) {
                        $rootScope.$emit('frp-nav-click', {view: null});
                    }

                    $('.tour-project-placeholder .split-button').off('click');
                    projectPlaceholder.addClass('hidden');
                    $('.dashboard-overview').append(projectPlaceholder);
                } else {
                    if ($('.frp.direction-right .frp-content').length) {
                        $rootScope.$emit('frp-nav-click', {view: null});
                    }
                }

                $('#add-to-cart').addClass('is-disabled-primary');

                if (!cartItemsCount) {
                    cartItemPlaceholder.addClass('hidden');
                    $('.dashboard-overview').append(cartItemPlaceholder);
                    $('#checkout').attr('disabled', 'disabled');
                }
            };

            return config;
        }

    }]);
