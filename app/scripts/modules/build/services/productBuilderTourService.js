'use strict';

angular.module('pace.build')
    .service('ProductBuilderTourService', ['$rootScope', '$timeout', 'StoreConfig', function ProductBuilderTourService($rootScope, $timeout, StoreConfig) {

        return {
            getConfig: getConfig
        };

        function getConfig($scope) {
            var config = {
                id: 'productBuilder'
            };

            var closePriceFrp = function() {
                if ($('.frp.direction-right .frp-content').length) {
                    $scope.$emit('frp-nav-click', {view: null});
                }
            };

            var handleOnMouseout = function() {
                $timeout(function() {
                    $('.header-secondary-buttons > li:first-child > a').trigger('mouseover');
                });
            };

            var isSampleName = false;
            var isSampleQuantity = false;

            config.steps = [
                {
                    element: '#sidebar-item-_name',
                    intro: 'Start by entering or selecting the required information.',
                    position: 'right',
                    onBefore: function () {
                        if (!$('#sidebar-item-_name input').val()) {
                            $('#sidebar-item-_name input').val('Sample').trigger('change');
                            isSampleName = true;
                        }

                        if (!$('#sidebar-item-_quantity input').val()) {
                            $('#sidebar-item-_quantity input').val('1').trigger('change');
                            isSampleQuantity = true;
                        }
                    }
                }, {
                    element: '#sidebar-next',
                    intro: 'Press next to move forward in the product building process. Please note that <strong>Next</strong> will only become available once you have selected all the required options.',
                    position: 'top'
                }, {
                    element: '#sidebar-back',
                    intro: 'You can use the blue arrow to go back to the previous section if you need to make any changes.',
                    position: 'right',
                    onBefore: function () {
                        if ($('#products-dropdown').first().hasClass('active')) {
                            $('#products-dropdown').first().trigger('click');
                        }
                    }
                }, {
                    element: '#products-dropdown',
                    intro: 'If you have more than one project in the system you can use this drop down to switch projects. You can also switch to any parent album you may have created inside a project to change things like cover materials and colors.',
                    position: 'right',
                    onBefore: function () {
                        closePriceFrp();
                        $('#products-dropdown').first().trigger('click');
                    }
                }, {
                    element: '#pricing-btn',
                    intro: 'At any time in the product building process you can click on the price button to get a detailed breakdown of your project.',
                    position: 'left',
                    onBefore: function () {
                        if ($('#products-dropdown').first().hasClass('active')) {
                            $('#products-dropdown').first().trigger('click');
                        }

                        $('#pricing-btn .split-button').first().trigger('click');

                        $('.header-secondary-buttons > li:first-child > a, .header-secondary-buttons > li:first-child > a ~ .f-dropdown').off('mouseout', handleOnMouseout);
                        $('.header-secondary-buttons > li:first-child > a').trigger('mouseout');
                    }
                }, {
                    element: '.header-secondary-buttons > li:first-child',
                    intro: "Once the build process is complete you can use this bread crumb to jump back to any specific section. Simply click on the option you want to change. You can also click on <strong>View All</strong> to see all the options for that section.",
                    position: 'right',
                    onBefore: function () {
                        closePriceFrp();
                        $('.header-secondary-buttons > li:first-child > a').trigger('mouseover');

                        $('.header-secondary-buttons > li:first-child > a, .header-secondary-buttons > li:first-child > a ~ .f-dropdown').on('mouseout', handleOnMouseout);
                    }
                }
            ];

            config.onBefore = function() {

            };

            config.onAfter = function() {
                closePriceFrp();

                $('.header-secondary-buttons > li:first-child > a, .header-secondary-secondary-buttons > li:first-child > a ~ .f-dropdown').off('mouseout', handleOnMouseout);
                $('.header-secondary-buttons > li:first-child > a').trigger('mouseout');

                if (isSampleName && $('#sidebar-item-_name input').val() === 'Sample') {
                    $('#sidebar-item-_name input').val('').trigger('change');
                }

                if (isSampleQuantity && $('#sidebar-item-_quantity input').val() === '1') {
                    $('#sidebar-item-_quantity input').val('').trigger('change');
                }
            };

            return config;
        }

    }]);
