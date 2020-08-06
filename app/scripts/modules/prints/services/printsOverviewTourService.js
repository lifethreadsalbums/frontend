'use strict';

angular.module('pace.layout')
    .service('PrintsOverviewTourService', ['$rootScope', '$timeout', 'StoreConfig', 'TourService', 'FilmstripTourUtilsService', function DesignerOverviewTourService($rootScope, $timeout, StoreConfig, TourService, FilmstripTourUtilsService) {

        return {
            getConfig: getConfig
        };

        function getConfig($scope, layoutController, layout, layoutSizeOption) {
            var config = {
                id: 'printsOverview',
                options: {
                    prevLabel: ''
                }
            };

            var timeoutPromise;
            var containersAdded = 0;

            function removeTourContainers() {
                if (containersAdded) {
                    $scope.containerListProps.selectedContainer = null;

                    for (var i = $scope.layouts.length - 1; i >= 0; i--) {
                        var container = $scope.layouts[i];

                        if (container.layoutSize.isTrial) {
                            var idxProduct = $scope.product.children.indexOf($scope.layouts[i].product);
                            $scope.layouts.splice(i, 1);
                            $scope.product.children.splice(idxProduct, 1);
                        }
                    }

                    $scope.refreshUI();
                    $scope.refreshContainers();

                    // trigger auto save
                    layoutController.fireEvent('layout:layout-changed');

                    containersAdded = 0;
                }
            }

            config.steps = [];

            // step 1
            config.steps.push({
                element: '#sidebar-item-_name',
                intro: 'Start by entering or selecting the required information.',
                position: 'right',
                onBefore: function () {
                    $('#filmstrip-empty-placeholder').removeClass('active');

                    if ($('#import-dropdown').first().hasClass('active')) {
                        $('#import-dropdown').first().trigger('click');
                    }

                    if (!$('#sidebar-item-_name input').val()) {
                        TourService.disableTourButton(true);

                        timeoutPromise = $timeout(function() {
                            $('#sidebar-item-_name input').val('Sample').trigger('change');
                            TourService.disableTourButton(false);
                        }, 1500);
                    }
                }
            });

            // step 2
            config.steps.push({
                element: '#import-dropdown',
                intro: 'Upload your files now or at any time during this process, by dragging and dropping to the filmstrip or using the import photos button.',
                position: 'left',
                onBefore: function () {
                    TourService.disableTourButton(true);

                    timeoutPromise = $timeout(function() {
                        $('#import-dropdown').first().trigger('click');
                        $('#filmstrip-empty-placeholder').addClass('active');

                        timeoutPromise = $timeout(function() {
                            FilmstripTourUtilsService.clearFilmstrip(layoutController, layout);
                            FilmstripTourUtilsService.populateFilmstrip(layoutController, layout);

                            timeoutPromise = $timeout(function() {
                                TourService.disableTourButton(false);
                            }, 1000);
                        }, 1250);
                    }, 1250);
                }
            });

            // step 3
            config.steps.push({
                element: '#sidebar-next',
                intro: 'No need to wait for your files to upload, simply click next to continue.',
                position: 'right',
                onBefore: function () {
                    // TourService.disableTourButton(true);

                    $('#filmstrip-empty-placeholder').removeClass('active');

                    if ($('#import-dropdown').first().hasClass('active')) {
                        $('#import-dropdown').first().trigger('click');
                    }
                }
            });

            // step 4
            config.steps.push({
                element: '#build .sidebar-creator .item-list',
                isDynamicElement: true,
                intro: 'Select from the available options and click next to continue.',
                position: 'right',
                onBefore: function () {
                    TourService.disableTourButton(true);

                    $('#sidebar-next').trigger('click');

                    timeoutPromise = $timeout(function() {
                        // reposition tooltip as container is animated from right
                        $('.introjs-tooltipReferenceLayer').css({left: '20px'});
                    }, 250);

                    timeoutPromise = $timeout(function() {
                        var activeItems = $('#build .sidebar-creator .item-list .item.active');

                        if (!activeItems.length) {
                            timeoutPromise = $timeout(function () {
                                $('#build .sidebar-creator .item-list .item:first-child a').trigger('click');

                                timeoutPromise = $timeout(function() {
                                    TourService.disableTourButton(false);
                                }, 250);
                            }, 2500);
                        } else {
                            TourService.disableTourButton(false);
                        }
                    }, 1250);
                }
            });

            // step 5
            config.steps.push({
                element: '#build .sidebar-creator',
                intro: 'Choose from the available shapes, and then drag and drop your desired sizes directly onto the canvas. Think of each dropped size as a container that you can place as little or as many images as you want into.',
                position: 'right',
                onBefore: function () {
                    TourService.disableTourButton(true);
                    $('#sidebar-next').trigger('click');

                    timeoutPromise = $timeout(function () {
                        // TODO: Remove second Next button click after Paper section is removed from builder
                        $('#sidebar-next').trigger('click');

                        // TODO: remove timeout itself, and switch previous to 2500ms
                        timeoutPromise = $timeout(function () {
                            var i;

                            if (!containersAdded) {
                                containersAdded = (layoutSizeOption.prototypeProductOptionValues.length > 3) ? 3 : layoutSizeOption.prototypeProductOptionValues.length;

                                for (i = 0; i < containersAdded; i++) {
                                    var container = _.clone(layoutSizeOption.prototypeProductOptionValues[i].layoutSize);
                                    container.isTrial = true;
                                    $scope.onContainerDrop(container);
                                }
                            }

                            // deselect containers
                            $scope.containerListProps.selectedContainer = null;

                            timeoutPromise = $timeout(function () {
                                // select first tour container
                                for (i = $scope.layouts.length - 1; i >= 0; i--) {
                                    if ($scope.layouts[i].layoutSize.isTrial) {
                                        $scope.selectContainer($scope.layouts[i]);
                                        break;
                                    }
                                }
                            }, 750);

                            timeoutPromise = $timeout(function () {
                                TourService.disableTourButton(false);
                            }, 250);
                        }, 2500);
                    }, 1250);
                }
            });

            // step 6
            config.steps.push({
                element: '#filmstrip-container',
                intro: 'Drag and sort your images into your desired sizes. Remember you can drag from one to all of your images into each size container.',
                position: 'top',
                onBefore: function () {
                    TourService.disableTourButton(true);
                    $('#fill-single').trigger('click');

                    timeoutPromise = $timeout(function() {
                        FilmstripTourUtilsService.selectFilmstripItems();

                        var container = $scope.containerListProps.selectedContainer;

                        var dataTransferTourEvent = {
                            dataTransfer: {
                                getData: function () {
                                    return JSON.stringify(FilmstripTourUtilsService.getSelectedItems(layout));
                                }
                            }
                        };

                        $scope.onContainerImageDrop(container, dataTransferTourEvent);

                        timeoutPromise = $timeout(function() {
                            $scope.selectContainer(container);

                            timeoutPromise = $timeout(function() {
                                TourService.disableTourButton(false);
                            }, 500);
                        }, 500);
                    }, 1250);
                }
            });

            // step 7
            config.steps.push({
                element: '#fill-all',
                intro: 'You can also fill all your available containers at once with the same photo(s) by selecting  the "Fill all sizes with the same photo"',
                position: 'top',
                onBefore: function () {
                    TourService.disableTourButton(true);

                    timeoutPromise = $timeout(function() {
                        $('#fill-all').trigger('click');
                        TourService.disableTourButton(false);
                    }, 500);
                }
            });

            // step 8
            config.steps.push({
                element: '#resize-filmstrip',
                intro: 'Use the expand feature to see more of your images to easily drag and drop them into your size containers.',
                position: 'right',
                onBefore: function () {
                    TourService.disableTourButton(true);

                    timeoutPromise = $timeout(function() {
                        var resizeSelect = $('#resize-filmstrip');
                        var resizeDropdownId = resizeSelect.data('dropdownMainButtonId');
                        resizeSelect.trigger('click');

                        timeoutPromise = $timeout(function() {
                            $('[data-dropdown-button-id=' + resizeDropdownId + '] li').removeClass('active');

                            var resizeSelectOption = $('[data-dropdown-button-id="' + resizeDropdownId + '"] li').eq(0);
                            resizeSelectOption.addClass('active');

                            timeoutPromise = $timeout(function() {
                                resizeSelectOption
                                    .removeClass('active')
                                    .trigger('click');
                                resizeSelect.trigger('click');

                                timeoutPromise = $timeout(function() {
                                    resizeSelect.trigger('click');

                                    timeoutPromise = $timeout(function() {
                                        $('[data-dropdown-button-id=' + resizeDropdownId + '] li').removeClass('active');

                                        var resizeSelectOption = $('[data-dropdown-button-id="' + resizeDropdownId + '"] li').eq(0);
                                        resizeSelectOption.addClass('active');

                                        timeoutPromise = $timeout(function() {
                                            resizeSelectOption
                                                .removeClass('active')
                                                .trigger('click');
                                            resizeSelect.trigger('click');

                                            TourService.disableTourButton(false);
                                        }, 750);
                                    }, 750);
                                }, 1500);
                            }, 750);
                        }, 750);
                    }, 1500);
                }
            });

            // step 9
            config.steps.push({
                element: '.top-toolbar.qa-edit-toolbar--prints',
                isDynamicElement: true,
                intro: 'The upper canvas tool bar controls what happens to all your photos in the size container. Change overall quantity or size.',
                position: 'right',
                onBefore: function () {

                }
            });

            // step 10
            config.steps.push({
                element: '.bottom-toolbar.qa-edit-toolbar--prints',
                isDynamicElement: true,
                intro: 'The lower canvas tool bar controls what happens to the photo you currently see displayed. Choose from things like, deleting, flipping, adding a border, changing to black and white. You can even add text.',
                position: 'right',
                onBefore: function () {

                }
            });

            // step 11
            config.steps.push({
                element: '.prints-container__content--selected',
                isDynamicElement: true,
                intro: 'You can even change the orientation of a photo. Make a vertical into a horizontal and vice versa!',
                position: 'right',
                onBefore: function () {

                }
            });

            // step 12
            config.steps.push({
                element: '.prints-container__content--selected',
                isDynamicElement: true,
                intro: 'The orange icons inside the container only affect the photo that you see. You can rotate, scale and even change the quantity of that photo within the size container.',
                position: 'right',
                onBefore: function () {

                }
            });

            // step 13
            config.steps.push({
                element: '#prints-sidebar-borders',
                isDynamicElement: true,
                intro: 'Want to add borders to all your photos? Simple switch the border option on and you are done? Or maybe you want to add a border to just one size? Simply click on the container and turn the border option on.',
                position: 'left',
                onBefore: function () {
                    TourService.disableTourButton(true);
                    $scope.selectContainer($scope.containerListProps.selectedContainer);

                    timeoutPromise = $timeout(function() {
                        $('#prints-sidebar-borders ~ .on-off-container input[value="on"]').trigger('click');
                        TourService.disableTourButton(false);
                    }, 1500);
                }
            });

            // step 14
            config.steps.push({
                element: '#prints-sidebar-_productPrototype',
                isDynamicElement: true,
                intro: 'You can even change the product type and its available options for each size container from this panel.',
                position: 'left',
                onBefore: function () {

                }
            });

            // step 15
            config.steps.push({
                element: '#save-as-package',
                intro: 'For quick and easy reordering you can save a set of sizes and their options as a package.',
                position: 'right',
                onBefore: function () {
                    TourService.disableTourButton(true);

                    timeoutPromise = $timeout(function() {
                        $('#save-as-package').trigger('click');

                        timeoutPromise = $timeout(function() {
                            $('.ngdialog input[type="text"]').val('Sample package');

                            timeoutPromise = $timeout(function() {
                                $('.ngdialog .button.color').addClass('hover');

                                timeoutPromise = $timeout(function() {
                                    $('.ngdialog .button.color')
                                        .removeClass('hover')
                                        .trigger('click');

                                    timeoutPromise = $timeout(function() {
                                        TourService.disableTourButton(false);
                                    }, 1250);
                                }, 750);
                            }, 750);
                        }, 1000);
                    }, 1500);
                }
            });

            config.onBefore = function() {
                TourService.disableExitOnRouteChange(true);
            };

            config.onAfter = function() {
                $timeout.cancel(timeoutPromise);
                FilmstripTourUtilsService.clearFilmstrip(layoutController, layout);
                $('#filmstrip-empty-placeholder').removeClass('active');
                removeTourContainers();
                TourService.disableExitOnRouteChange(false);
            };

            return config;
        }

    }]);
