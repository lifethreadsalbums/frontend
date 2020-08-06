'use strict';

angular.module('pace.layout')
    .service('DesignerOverviewTourService', ['$rootScope', '$timeout', 'StoreConfig', 'TourService', 'FilmstripTourUtilsService', function DesignerOverviewTourService($rootScope, $timeout, StoreConfig, TourService, FilmstripTourUtilsService) {

        return {
            getConfig: getConfig
        };

        function getConfig($scope, layoutController, layout) {
            var config = {
                id: 'designerOverview'
            };

            var filmstrip;
            var filmstripItems;
            var filmstripActiveItems;
            var spreadSection;
            var spreads;
            var canvas;
            var canvasRect;
            var timeoutPromise;
            var dropContainerRect;
            var layoutCanvas;
            var isSpreadSwapped = false;
            var isCanvasPopulated = false;
            var isCanvasPopulatedByUser = false;
            var isSwapTargetCanvasPopulated = false;
            var initialUIState = null;

            function DataTransferTour() {
                this.types = [];
                this.transferData = [];

                this.getData = function(type) {
                    return this.transferData[type];
                };

                this.setData = function(type, items) {
                    this.types.push(type);
                    this.transferData[type] = items;
                };

                this.setDragImage = function(img, xOffset, yOffset) {

                };
            }

            function saveInitialUIState() {
                if (!initialUIState) {
                    initialUIState = {};
                }

                // FLP - recently used templates
                if (!initialUIState.templateType) {
                    if ($('#recently-used-templates-page').hasClass('active')) {
                        initialUIState.templateType = 'page';
                    } else if ($('#recently-used-templates-spread').hasClass('active')) {
                        initialUIState.templateType = 'spread';
                    }
                }

                if (!initialUIState.activeLayoutTypeOption) {
                    var layoutTypeSelect = $('#layout-type');
                    var layoutTypeDropdownId = layoutTypeSelect.data('dropdownMainButtonId');

                    if ($('[data-dropdown-button-id=' + layoutTypeDropdownId + '] li.active').length) {
                        initialUIState.activeLayoutTypeOption = $('[data-dropdown-button-id=' + layoutTypeDropdownId + '] li.active');
                    }
                }

                if (!initialUIState.activeLayoutSelectorOption) {
                    var layoutSelectorSelect = $('#layout-selector-select');
                    var layoutSelectorDropdownId = layoutSelectorSelect.data('dropdownMainButtonId');

                    if ($('[data-dropdown-button-id=' + layoutSelectorDropdownId + '] li.active').length) {
                        initialUIState.activeLayoutSelectorOption = $('[data-dropdown-button-id=' + layoutSelectorDropdownId + '] li.active');
                    }
                }

                // FRP - tabs
                if (!initialUIState.rightSidebarTab) {
                    initialUIState.rightSidebarTab = $('#right-sidebar-tabs .nav-tabs a.active');
                }
            }

            function revertInitialUIState() {
                if (initialUIState) {
                    // FLP - recently used templates
                    if (initialUIState.templateType === 'page') {
                        $('#recently-used-templates-page').trigger('click');
                    } else if (initialUIState.templateType === 'spread') {
                        $('#recently-used-templates-spread').trigger('click');
                    }

                    if (initialUIState.activeLayoutTypeOption && initialUIState.activeLayoutTypeOption.length) {
                        initialUIState.activeLayoutTypeOption.first().trigger('click');
                    } else {
                        var layoutTypeSelect = $('#layout-type');
                        var layoutTypeDropdownId = layoutTypeSelect.data('dropdownMainButtonId');
                        $('[data-dropdown-button-id=' + layoutTypeDropdownId + '] li').first().trigger('click');
                    }

                    if (initialUIState.activeLayoutSelectorOption && initialUIState.activeLayoutSelectorOption.length) {
                        $timeout(function() {
                            initialUIState.activeLayoutSelectorOption.first().trigger('click');
                        }, 250);
                    } else {
                        console.log('[get activeLayoutSelectorOption 2]', initialUIState.activeLayoutSelectorOption);
                        var layoutSelectorSelect = $('#layout-selector-select');
                        var layoutSelectorDropdownId = layoutSelectorSelect.data('dropdownMainButtonId');
                        $('[data-dropdown-button-id=' + layoutSelectorDropdownId + '] li').first().trigger('click');
                    }

                    // FRP - tabs
                    if (initialUIState.rightSidebarTab && initialUIState.rightSidebarTab.length) {
                        initialUIState.rightSidebarTab.trigger('click');
                    }
                }
            }

            function checkIfCanvasIsPopulated(spreadNo) {
                return layoutController.renderers[spreadNo].spread.elements.length > 0 ? true : false;
            }

            function animateImageDragToSpreadCenter(isFirst, dataTransfer, animationCallback) {
                var filmstripItemRect = filmstripActiveItems[0].getBoundingClientRect();

                if (isFirst) {
                    $('.drop-container').append('<span class="pace-intro__drag-cursor"></span>');

                    $('.drop-container').css({
                        top: filmstripItemRect.top,
                        left: filmstripItemRect.left,
                        'z-index': 0
                    });
                }

                dropContainerRect = document.getElementsByClassName('drop-container')[0].getBoundingClientRect();

                // animate to canvas center
                $('.drop-container')
                    .animate({
                        top: canvasRect.top + canvasRect.height / 4,
                        left: canvasRect.left + canvasRect.width / 2 - dropContainerRect.width / 2,
                    }, 1250, function () {
                        if (isFirst) {
                            // drag enter on canvas
                            var dragEnterEvent = new CustomEvent('dragenter', {
                                bubbles: true,
                                cancelable: true,
                                view: window,
                                detail: {
                                    dataTransfer: dataTransfer
                                }
                            });
                            canvas.dispatchEvent(dragEnterEvent);
                        }

                        // drag over canvas center
                        var dragOverEvent = new CustomEvent('dragover', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            detail: {
                                dataTransfer: dataTransfer,
                                clientX: canvasRect.left + canvasRect.width / 2,
                                clientY: canvasRect.top + 20
                            }
                        });
                        canvas.dispatchEvent(dragOverEvent);

                        if (isFirst) {
                            timeoutPromise = $timeout(function() {
                                if (typeof animationCallback === 'function') {
                                    animationCallback();
                                }
                            }, 500);
                        } else {
                            timeoutPromise = $timeout(function() {
                                // hide drag preview container
                                $('.drop-container')
                                    .css({'z-index': -1});
                                $('.pace-intro__drag-cursor').remove();

                                if (typeof animationCallback === 'function') {
                                    animationCallback();
                                }
                            }, 500);
                        }
                    });
            }

            function animateImageDragToSpreadLeftPage(dataTransfer, animationCallback) {
                // animate to canvas left page
                $('.drop-container')
                    .animate({
                        top: canvasRect.top + canvasRect.height / 4,
                        left: canvasRect.left + canvasRect.width / 4 - dropContainerRect.width / 2,
                    }, 1250, function() {
                        // drag over canvas left page
                        var dragOverEvent = new CustomEvent('dragover', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            detail: {
                                dataTransfer: dataTransfer,
                                clientX: canvasRect.left + 20,
                                clientY: canvasRect.top + canvasRect.height / 4
                            }
                        });
                        canvas.dispatchEvent(dragOverEvent);

                        if (typeof animationCallback === 'function') {
                            timeoutPromise = $timeout(function() {
                                animationCallback();
                            }, 500);
                        }
                    });
            }

            function animateImageDragToSpreadRightPage(dataTransfer, animationCallback) {
                // animate to canvas right page
                $('.drop-container')
                    .animate({
                        top: canvasRect.top + canvasRect.height / 4,
                        left: canvasRect.right - canvasRect.width / 4 - dropContainerRect.width / 2,
                    }, 1250, function () {
                        // drag over canvas right page
                        var dragOverEvent = new CustomEvent('dragover', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            detail: {
                                dataTransfer: dataTransfer,
                                clientX: canvasRect.right - 20,
                                clientY: canvasRect.top + canvasRect.height / 4
                            }
                        });
                        canvas.dispatchEvent(dragOverEvent);

                        if (typeof animationCallback === 'function') {
                            timeoutPromise = $timeout(function() {
                                animationCallback();
                            }, 500);
                        }
                    });
            }

            function cleanCanvasDragEvents() {
                $('.drop-container').stop(true, false).css({'z-index': -1});
                $('.pace-intro__drag-cursor').remove();

                // drag dragleave on canvas
                if (canvas) {
                    var dragLeaveEvent = new CustomEvent('dragleave', {bubbles: true, cancelable: true, view: window});
                    canvas.dispatchEvent(dragLeaveEvent);
                }

                // drag end on filmstrip
                if (filmstripItems && filmstripItems.length) {
                    var dragEndEvent = new CustomEvent('dragend', {bubbles: true, cancelable: true, view: window});

                    for (var i = 0; i < filmstripItems.length; i++) {
                        filmstripItems[i].dispatchEvent(dragEndEvent);
                    }
                }
            }

            function generateLeftPage() {
                var toolGenerateLeftPage = $('#tool-generate-right-page');

                toolGenerateLeftPage.trigger('mouseover');
                timeoutPromise = $timeout(function() {
                    toolGenerateLeftPage.trigger('mouseout');
                    toolGenerateLeftPage.trigger('click');

                    timeoutPromise = $timeout(function() {
                        generateRightPage();
                    }, 12);
                }, 1250);
            }

            function generateRightPage() {
                var toolGenerateRightPage = $('#tool-generate-left-page');

                toolGenerateRightPage.trigger('mouseover');

                timeoutPromise = $timeout(function() {
                    toolGenerateRightPage.trigger('mouseout');
                    toolGenerateRightPage.trigger('click');

                    timeoutPromise = $timeout(function() {
                        generateSpread();
                    }, 750);
                }, 1250);
            }

            function generateSpread() {
                var toolGenerateSpread = $('#tool-generate-spread');

                toolGenerateSpread.trigger('mouseover');

                timeoutPromise = $timeout(function() {
                    toolGenerateSpread.trigger('mouseout');
                    toolGenerateSpread.trigger('click');

                    timeoutPromise = $timeout(function() {
                        generatePrevLayout();
                    }, 750);
                }, 1250);
            }

            function generatePrevLayout() {
                var toolGeneratePrev = $('#tool-generate-prev-layout');

                toolGeneratePrev.trigger('mouseover');

                timeoutPromise = $timeout(function() {
                    toolGeneratePrev.trigger('mouseout');
                    toolGeneratePrev.trigger('click');

                    timeoutPromise = $timeout(function() {
                        TourService.disableTourButton(false);
                    }, 750);
                }, 1250);
            }

            function animateLayoutDragToSpread(dataTransfer, animationCallback) {
                var layoutCanvasRect = layoutCanvas.getBoundingClientRect();

                // set dragging ghost image
                var dropContainer = document.createElement('div');
                dropContainer.className = 'drop-container';

                var img = new Image();
                img.src = layoutCanvas.toDataURL('image/png');

                // delay to let browser create an image
                timeoutPromise = $timeout(function() {
                    var dropContainerCanvas = document.createElement('canvas');
                    dropContainerCanvas.width = layoutCanvasRect.width;
                    dropContainerCanvas.height = layoutCanvasRect.height;
                    var ctx = dropContainerCanvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, layoutCanvasRect.width, layoutCanvasRect.height);

                    dropContainer.appendChild(dropContainerCanvas);
                    document.body.appendChild(dropContainer);

                    $('.drop-container').append('<span class="pace-intro__drag-cursor"></span>');

                    $('.drop-container').css({
                        top: layoutCanvasRect.top,
                        left: layoutCanvasRect.left,
                        'z-index': 2
                    });

                    dropContainerRect = document.getElementsByClassName('drop-container')[0].getBoundingClientRect();

                    // animate to canvas center
                    $('.drop-container')
                        .animate({
                            top: canvasRect.top + canvasRect.height / 4,
                            left: canvasRect.left + canvasRect.width / 2 - dropContainerRect.width / 2,
                        }, 1250, function () {
                            // drag enter on canvas
                            var dragEnterEvent = new CustomEvent('dragenter', {
                                bubbles: true,
                                cancelable: true,
                                view: window,
                                detail: {
                                    dataTransfer: dataTransfer
                                }
                            });
                            canvas.dispatchEvent(dragEnterEvent);

                            // drag over canvas center
                            var dragOverEvent = new CustomEvent('dragover', {
                                bubbles: true,
                                cancelable: true,
                                view: window,
                                detail: {
                                    dataTransfer: dataTransfer,
                                    clientX: canvasRect.left + canvasRect.width / 2,
                                    clientY: canvasRect.top + 20
                                }
                            });
                            canvas.dispatchEvent(dragOverEvent);

                            timeoutPromise = $timeout(function() {
                                // hide drag preview container
                                $('.drop-container').css({'z-index': -1});
                                $('.pace-intro__drag-cursor').remove();

                                if (typeof animationCallback === 'function') {
                                    animationCallback();
                                }
                            }, 500);
                        });
                }, 100);
            }

            function cleanLayoutDragEvents() {
                $('.drop-container').stop(true, false).css({'z-index': -1}).remove();

                // drag dragleave on canvas
                if (canvas) {
                    var dragLeaveEvent = new CustomEvent('dragleave', {bubbles: true, cancelable: true, view: window});
                    canvas.dispatchEvent(dragLeaveEvent);
                }

                // drag end on layout
                if (layoutCanvas) {
                    var dragEndEvent = new CustomEvent('dragend', {bubbles: true, cancelable: true, view: window});
                    layoutCanvas.dispatchEvent(dragEndEvent);
                }
            }

            function removeSampleMyTemplate() {
                // TODO: remove my template
            }

            function removeSpreadImages() {
                // leave only one image on spread
                if (layoutController.currentRenderer.spread.elements.length > 1) {
                    layoutController.clearSelection();

                    var elements = [];

                    for (var i = 0; i < layoutController.currentRenderer.spread.elements.length; i++) {
                        if (i > 0) {
                            elements.push(layoutController.currentRenderer.spread.elements[i]);
                        }
                    }

                    var cmd = new PACE.DeleteElementsCommand(layoutController.currentRenderer.spread, elements);
                    cmd.execute();
                }
            }

            function swapAllPagesSpread(callback) {
                if (isSpreadSwapped || isSwapTargetCanvasPopulated || isCanvasPopulatedByUser) {
                    callback();
                } else {
                    // clear active item selection to prevent errors
                    layoutController.clearSelection(true);

                    var frpSpreads = $('.frp-pages .scrollable-content .spread');
                    var sourceSpreadLeft = frpSpreads.eq(1).find('.thumb-left')[0];
                    var sourceSpreadRight = frpSpreads.eq(1).find('.thumb-right')[0];
                    var sourceSpreadLeftRect = sourceSpreadLeft.getBoundingClientRect();
                    var sourceSpreadRightRect = sourceSpreadRight.getBoundingClientRect();

                    var mouseDownEvent = new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        ctrlKey: false
                    });
                    sourceSpreadLeft.dispatchEvent(mouseDownEvent);

                    $timeout(function() {
                        // dragstart on source spread
                        var dragStartEvent = new CustomEvent('dragstart', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            detail: {
                                dataTransfer: new DataTransferTour()
                            }
                        });
                        sourceSpreadLeft.dispatchEvent(dragStartEvent);

                        // animate spread drag
                        var targetSpread = frpSpreads[2];
                        var targetSpreadRect = targetSpread.getBoundingClientRect();

                        // remove unneeded canvas to prevent doubling
                        if ($('.drop-container canvas').length > 1) {
                            $('.drop-container canvas').eq(0).remove();
                        }

                        // clear and resize drop containes canvas
                        var canvas = $('.drop-container')[0].getElementsByTagName('canvas')[0];
                        var ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

                        $('.drop-container').css({
                            width: 250,
                            height: 105,
                            overflow: 'hidden'
                        });

                        canvas.style.width = '250px';
                        canvas.style.height = '105px';

                        $('.drop-container').append('<span class="pace-intro__drag-cursor"></span>');

                        $('.drop-container').css({
                            top: sourceSpreadLeftRect.top,
                            left: sourceSpreadLeftRect.left,
                            'z-index': 5
                        });

                        dropContainerRect = document.getElementsByClassName('drop-container')[0].getBoundingClientRect();

                        // animate to canvas center
                        $('.drop-container')
                            .animate({
                                top: targetSpreadRect.top + 9,
                                left: parseInt(targetSpreadRect.right - 50 - dropContainerRect.width / 2, 10),
                            }, 1250, function () {
                                // drag enter on source spread
                                var dragEnterEvent = new CustomEvent('dragenter', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window,
                                    detail: {
                                        dataTransfer: dragStartEvent.detail.dataTransfer
                                    }
                                });
                                targetSpread.dispatchEvent(dragEnterEvent);

                                // drag over target spread center
                                var dragOverEvent = new CustomEvent('dragover', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window,
                                    detail: {
                                        dataTransfer: dragStartEvent.detail.dataTransfer,
                                        pageX: parseInt(targetSpreadRect.right - 50, 10),
                                        pageY: targetSpreadRect.top + 20
                                    }
                                });
                                targetSpread.dispatchEvent(dragOverEvent);

                                // hide drag preview container
                                $('.drop-container').css({'z-index': -1});
                                $('.pace-intro__drag-cursor').remove();

                                // drop spread
                                var dropEvent = new CustomEvent('drop', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window,
                                    detail: {
                                        dataTransfer: dragStartEvent.detail.dataTransfer
                                    }
                                });
                                targetSpread.dispatchEvent(dropEvent);

                                // clean drag events
                                var dragLeaveEvent = new CustomEvent('dragleave', {bubbles: true, cancelable: true, view: window});
                                targetSpread.dispatchEvent(dragLeaveEvent);

                                var dragEndEvent = new CustomEvent('dragend', {bubbles: true, cancelable: true, view: window});
                                sourceSpreadLeft.dispatchEvent(dragEndEvent);

                                $timeout(function() {
                                    layoutController.currentRenderer.render();

                                    isSpreadSwapped = true;

                                    callback();
                                }, 150);
                            });
                    }, 150);
                }
            }

            config.steps = [];

            // step 1
            config.steps.push({
                element: '#import-dropdown',
                intro: 'Click on the import button to open a file window and begin uploading. You can also click anywhere in the image bank. No need to wait for your files to upload you can begin designing right away!',
                position: 'left',
                onBefore: function () {
                    TourService.disableTourButton(true);
                    $timeout.cancel(timeoutPromise);

                    timeoutPromise = $timeout(function() {
                        cleanCanvasDragEvents();
                        FilmstripTourUtilsService.clearFilmstrip(layoutController, layout);
                        $('#filmstrip-empty-placeholder').addClass('active');
                        $('#import-dropdown').first().trigger('click');
                        FilmstripTourUtilsService.populateFilmstrip(layoutController, layout);

                        timeoutPromise = $timeout(function() {
                            TourService.disableTourButton(false);
                        }, 3000);
                    }, 3000);
                }
            });

            // step 2
            config.steps.push({
                element: '#spread-section .spread:nth-child(3) .upper-canvas',
                intro: 'Drag and drop images onto the canvas and let the system choose a layout for you. You can create your layouts as a spread or as left and right pages only by using the blue drop zones.',
                position: 'left',
                onBefore: function () {
                    TourService.disableTourButton(true);

                    $('#filmstrip-empty-placeholder').removeClass('active');

                    if ($('#import-dropdown').first().hasClass('active')) {
                        $('#import-dropdown').first().trigger('click');
                    }

                    FilmstripTourUtilsService.selectFilmstripItems();

                    // scroll to spread
                    var r = layoutController.renderers[1];
                    layoutController.setCurrentRenderer(r);
                    r.makeFirstVisible(0);

                    // show spread toolbars
                    spreadSection = document.getElementById('spread-section');
                    spreads = spreadSection.getElementsByClassName('spread');
                    var mouseOverEvent = new MouseEvent('mouseover', {bubbles: true, cancelable: true, view: window});
                    spreads[1].dispatchEvent(mouseOverEvent);

                    // dragstart on filmstrip
                    filmstrip = document.getElementById('filmstrip-container');
                    filmstripActiveItems = filmstrip.getElementsByClassName('filmstrip-item active');
                    var dragStartEvent = new CustomEvent('dragstart', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        detail: {
                            dataTransfer: new DataTransferTour()
                        }
                    });
                    filmstripActiveItems[0].dispatchEvent(dragStartEvent);

                    // animate images drag
                    canvas = spreads[1].getElementsByClassName('upper-canvas')[0];
                    canvasRect = canvas.getBoundingClientRect();

                    animateImageDragToSpreadCenter(true, dragStartEvent.detail.dataTransfer, function() {
                        animateImageDragToSpreadLeftPage(dragStartEvent.detail.dataTransfer, function() {
                            animateImageDragToSpreadRightPage(dragStartEvent.detail.dataTransfer, function() {
                                animateImageDragToSpreadCenter(false, dragStartEvent.detail.dataTransfer, function() {
                                    if (!isCanvasPopulated) {
                                        // drop images
                                        var dropEvent = new CustomEvent('drop', {
                                            bubbles: true,
                                            cancelable: true,
                                            view: window,
                                            detail: {
                                                dataTransfer: dragStartEvent.detail.dataTransfer
                                            }
                                        });
                                        canvas.dispatchEvent(dropEvent);
                                        isCanvasPopulated = true;
                                    }

                                    cleanCanvasDragEvents();

                                    timeoutPromise = $timeout(function() {
                                        TourService.disableTourButton(false);
                                    }, 1500);
                                });
                            });
                        });
                    });
                }
            });

            // step 3
            config.steps.push({
                element: '#tools-generate-layout',
                intro: 'Generate new layouts by either using these icons or by simply using the arrow keys. Shift + the right arrow will generate a right side only layout. Option + the right arrow will generate a left side and pressing the right arrow will generate a spread based layout. Use the left arrow to go back to a previous layout.',
                position: 'right',
                tooltipClass: 'pace-intro pace-intro--width-450',
                onBefore: function () {
                    $timeout.cancel(timeoutPromise);
                    cleanCanvasDragEvents();

                    if (!isCanvasPopulatedByUser) {
                        TourService.disableTourButton(true);
                        generateLeftPage();
                    }
                }
            });

            // step 4
            config.steps.push({
                element: '#recently-used-templates-type-buttons',
                intro: 'Drag and drop templates to the canvas and then fill them with images. You can select either Single Page or Spread based templates.',
                position: 'right',
                onBefore: function () {
                    TourService.disableTourButton(true);

                    timeoutPromise = $timeout(function() {
                        $('#recently-used-templates-spread').trigger('click');

                        timeoutPromise = $timeout(function() {
                            var layoutTypeSelect = $('#layout-type');
                            var layoutTypeDropdownId = layoutTypeSelect.data('dropdownMainButtonId');
                            layoutTypeSelect.trigger('click');

                            timeoutPromise = $timeout(function() {
                                saveInitialUIState();
                                $('[data-dropdown-button-id=' + layoutTypeDropdownId + '] li').removeClass('active');

                                var layoutTypeSelectOption = $('[data-dropdown-button-id="' + layoutTypeDropdownId + '"] li').eq(0);
                                layoutTypeSelectOption.addClass('active');

                                timeoutPromise = $timeout(function() {
                                    layoutTypeSelectOption
                                        .removeClass('active')
                                        .trigger('click');
                                    layoutTypeSelect.trigger('click');

                                    timeoutPromise = $timeout(function() {
                                        var layoutSelectorSelect = $('#layout-selector-select');
                                        var layoutDropdownId = layoutSelectorSelect.data('dropdownMainButtonId');
                                        layoutSelectorSelect.trigger('click');

                                        timeoutPromise = $timeout(function() {
                                            saveInitialUIState();
                                            $('[data-dropdown-button-id=' + layoutDropdownId + '] li').removeClass('active');

                                            var layoutSelectorSelectOption = $('[data-dropdown-button-id=' + layoutDropdownId + '] li').eq(5);
                                            layoutSelectorSelectOption.addClass('active');

                                            timeoutPromise = $timeout(function() {
                                                layoutSelectorSelectOption
                                                    .removeClass('active')
                                                    .trigger('click');
                                                layoutSelectorSelect.trigger('click');

                                                timeoutPromise = $timeout(function() {
                                                    var layoutSpreadsContainer = document.getElementById('layout-spreads-contianer');
                                                    var layoutSpread = layoutSpreadsContainer.getElementsByClassName('spread')[0];
                                                    layoutCanvas = layoutSpread.getElementsByClassName('template-preview')[0];

                                                    $('.drop-container').empty();

                                                    // select template
                                                    var mouseDownEvent = new MouseEvent('mousedown', {bubbles: true, cancelable: true, view: window, ctrlKey: true});
                                                    layoutCanvas.dispatchEvent(mouseDownEvent);

                                                    timeoutPromise = $timeout(function() {
                                                        // dragstart on templates
                                                        var dragStartEvent = new CustomEvent('dragstart', {
                                                            bubbles: true,
                                                            cancelable: true,
                                                            view: window,
                                                            detail: {
                                                                dataTransfer: new DataTransferTour()
                                                            }
                                                        });
                                                        layoutCanvas.dispatchEvent(dragStartEvent);

                                                        // animate layout drag
                                                        animateLayoutDragToSpread(dragStartEvent.detail.dataTransfer, function() {
                                                            if (!isCanvasPopulatedByUser) {
                                                                // drop template
                                                                var dropEvent = new CustomEvent('drop', {
                                                                    bubbles: true,
                                                                    cancelable: true,
                                                                    view: window,
                                                                    detail: {
                                                                        dataTransfer: dragStartEvent.detail.dataTransfer
                                                                    }
                                                                });
                                                                canvas.dispatchEvent(dropEvent);
                                                            }

                                                            cleanLayoutDragEvents();
                                                            TourService.disableTourButton(false);
                                                        });
                                                    }, 500);
                                                }, 1250);
                                            }, 750);
                                        }, 750);
                                    }, 750);
                                }, 750);
                            }, 750);
                        }, 750);
                    }, 750);
                }
            });

            // step 5
            config.steps.push({
                element: '#save-template',
                intro: 'Save any layout as a spread or as an individual page and access them any time from the “My Templates” tab up above.',
                position: 'right',
                onBefore: function () {
                    TourService.disableTourButton(true);

                    timeoutPromise = $timeout(function() {
                        var saveTemplateSelect = $('#save-template .split-button-drop').first();
                        saveTemplateSelect.trigger('click');

                        timeoutPromise = $timeout(function() {
                            saveTemplateSelect.trigger('click');

                            var saveTemplateBtn = $('#save-template');
                            saveTemplateBtn.trigger('mouseover');
                            saveTemplateBtn.trigger('click');

                            timeoutPromise = $timeout(function() {
                                TourService.disableTourButton(false);
                            }, 500);
                        }, 750);
                    }, 750);
                }
            });

            // step 6
            config.steps.push({
                element: '#spread-section .spread:nth-child(3) .upper-canvas',
                intro: 'Double click on an image in the canvas to locate it in the image bank. Conversely you can double click on an image in the image bank and be taken to where it is in the canvas.',
                position: 'left',
                onBefore: function () {
                    TourService.disableTourButton(true);

                    timeoutPromise = $timeout(function() {
                        // double click on a single image on spread
                        var cmd = new function () {
                            this.execute = function () {
                                layoutController.clearSelection();
                                var elements = [layoutController.currentRenderer.spread.elements[0]];
                                layoutController.selectElements(elements, true);
                                layoutController.currentRenderer.render();
                                layoutController.currentTool = new PACE.SelectionTool(layoutController);
                                layoutController.currentTool.beginEdit();

                                layoutController.onDoubleClick(self, {
                                    e: new MouseEvent('dblclick', {bubbles: true, cancelable: true, view: window}),
                                    target: layoutController.currentRenderer.canvas.getActiveObject()
                                });
                            };
                        };
                        cmd.execute();
                        TourService.disableTourButton(false);
                    }, 1250);
                }
            });

            // step 7
            config.steps.push({
                element: '#filmstrip-container',
                intro: 'Mouse over any thumbnail and click on the hour glass icon (or simply press the space bar) to see a large image preview. You can see important image information and even replace or delete the image.',
                position: 'top',
                onBefore: function () {
                    TourService.disableTourButton(true);

                    timeoutPromise = $timeout(function() {
                        var activeItem = $('#filmstrip-container .filmstrip-item').first();
                        activeItem.addClass('hover');

                        timeoutPromise = $timeout(function() {
                            activeItem.removeClass('hover');

                            var mouseDownEvent = new MouseEvent('mousedown', {bubbles: true, cancelable: true, view: window});
                            activeItem.find('.details')[0].dispatchEvent(mouseDownEvent);

                            timeoutPromise = $timeout(function() {
                                $('.image-info-pop-up .ngdialog-close').trigger('click');
                                TourService.disableTourButton(false);
                            }, 5000);
                        }, 1250);
                    }, 1250);
                }
            });

            // step 8
            config.steps.push({
                element: '#toolset-switch',
                intro: 'The blue tool box reveals various menu sets. Pressing the 1,2,3,4 keys will cycle through the various tool sets.',
                position: 'right',
                onBefore: function () {
                    TourService.disableTourButton(true);

                    removeSampleMyTemplate();

                    timeoutPromise = $timeout(function() {
                        var toolsetSwitch = $('#toolset-switch');
                        var toolsetDropdownId = toolsetSwitch.data('dropdownMainButtonId');
                        var toolsetSwitchOption;
                        toolsetSwitch.trigger('click');

                        timeoutPromise = $timeout(function() {
                            $('[data-dropdown-button-id=' + toolsetDropdownId + '] li').removeClass('active');

                            toolsetSwitchOption = $('[data-dropdown-button-id="' + toolsetDropdownId + '"] li').eq(0);
                            toolsetSwitchOption
                                .addClass('active')
                                .trigger('click');

                            timeoutPromise = $timeout(function() {
                                $('[data-dropdown-button-id=' + toolsetDropdownId + '] li').removeClass('active');

                                toolsetSwitchOption = $('[data-dropdown-button-id="' + toolsetDropdownId + '"] li').eq(1);
                                toolsetSwitchOption
                                    .addClass('active')
                                    .trigger('click');

                                timeoutPromise = $timeout(function() {
                                    $('[data-dropdown-button-id=' + toolsetDropdownId + '] li').removeClass('active');

                                    toolsetSwitchOption = $('[data-dropdown-button-id="' + toolsetDropdownId + '"] li').eq(2);
                                    toolsetSwitchOption
                                        .addClass('active')
                                        .trigger('click');

                                    timeoutPromise = $timeout(function() {
                                        $('[data-dropdown-button-id=' + toolsetDropdownId + '] li').removeClass('active');

                                        toolsetSwitchOption = $('[data-dropdown-button-id="' + toolsetDropdownId + '"] li').eq(3);
                                        toolsetSwitchOption
                                            .addClass('active')
                                            .trigger('click');

                                        timeoutPromise = $timeout(function() {
                                            $('[data-dropdown-button-id=' + toolsetDropdownId + '] li').removeClass('active');

                                            toolsetSwitchOption = $('[data-dropdown-button-id="' + toolsetDropdownId + '"] li').eq(4);
                                            toolsetSwitchOption
                                                .addClass('active')
                                                .trigger('click');

                                            timeoutPromise = $timeout(function() {
                                                toolsetSwitchOption
                                                    .removeClass('active')
                                                    .trigger('click');
                                                toolsetSwitch.trigger('click');

                                                TourService.disableTourButton(false);
                                            }, 2250);
                                        }, 2250);
                                    }, 2250);
                                }, 2250);
                            }, 2250);
                        }, 2250);
                    }, 2250);
                }
            });

            // step 9
            config.steps.push({
                element: '#toolset-switch',
                intro: 'Pressing the s, m, l keys will make a frame resize to small, medium or large. Pressing the b, n and d keys will make a frame fill to the bleed edge, fill the page or go double page spread respectively. You can also use these icons in Tool Set #2',
                position: 'right',
                onBefore: function () {
                    TourService.disableTourButton(true);

                    removeSpreadImages();

                    var toolsetSwitch = $('#toolset-switch');
                    var toolsetDropdownId = toolsetSwitch.data('dropdownMainButtonId');
                    toolsetSwitch.trigger('click');

                    timeoutPromise = $timeout(function() {
                        $('[data-dropdown-button-id=' + toolsetDropdownId + '] li').removeClass('active');

                        var toolsetSwitchOption = $('[data-dropdown-button-id="' + toolsetDropdownId + '"] li').eq(3);
                        toolsetSwitchOption.addClass('active');

                        timeoutPromise = $timeout(function() {
                            toolsetSwitchOption
                                .removeClass('active')
                                .trigger('click');
                            toolsetSwitch.trigger('click');

                            // select single image on spread
                            var cmd = new function() {
                                this.execute = function() {
                                    layoutController.clearSelection();
                                    var elements = [layoutController.currentRenderer.spread.elements[0]];
                                    layoutController.selectElements(elements, true);
                                    layoutController.currentRenderer.render();
                                    layoutController.currentTool = new PACE.SelectionTool(layoutController);
                                    layoutController.currentTool.beginEdit();
                                };
                            };
                            cmd.execute();

                            // center image for better presentation
                            $('.tool-center').trigger('click');

                            timeoutPromise = $timeout(function() {
                                // go through options
                                var currentToolBtn = $('#toolFrameSmall');

                                currentToolBtn
                                    .trigger('mouseover')
                                    .addClass('active');

                                if (!isCanvasPopulatedByUser) {
                                    currentToolBtn
                                        .trigger('click');
                                }

                                timeoutPromise = $timeout(function() {
                                    currentToolBtn
                                        .trigger('mouseout')
                                        .removeClass('active');
                                    currentToolBtn = $('#toolFrameMedium');
                                    currentToolBtn
                                        .trigger('mouseover')
                                        .addClass('active');

                                    if (!isCanvasPopulatedByUser) {
                                        currentToolBtn
                                            .trigger('click');
                                    }

                                    timeoutPromise = $timeout(function() {
                                        currentToolBtn
                                            .trigger('mouseout')
                                            .removeClass('active');
                                        currentToolBtn = $('#toolFrameLarge');
                                        currentToolBtn
                                            .trigger('mouseover')
                                            .addClass('active');

                                        if (!isCanvasPopulatedByUser) {
                                            currentToolBtn
                                                .trigger('click');
                                        }

                                        timeoutPromise = $timeout(function() {
                                            currentToolBtn
                                                .trigger('mouseout')
                                                .removeClass('active');
                                            currentToolBtn = $('#toolFrame2Bleed');
                                            currentToolBtn
                                                .trigger('mouseover')
                                                .addClass('active');

                                            if (!isCanvasPopulatedByUser) {
                                                currentToolBtn
                                                    .trigger('click');
                                            }

                                            timeoutPromise = $timeout(function() {
                                                currentToolBtn
                                                    .trigger('mouseout')
                                                    .removeClass('active');
                                                currentToolBtn = $('#toolFrame4Bleed');
                                                currentToolBtn
                                                    .trigger('mouseover')
                                                    .addClass('active');

                                                if (!isCanvasPopulatedByUser) {
                                                    currentToolBtn
                                                        .trigger('click');
                                                }

                                                timeoutPromise = $timeout(function() {
                                                    currentToolBtn
                                                        .trigger('mouseout')
                                                        .removeClass('active');
                                                    currentToolBtn = $('#toolFrameSpread');
                                                    currentToolBtn
                                                        .trigger('mouseover')
                                                        .addClass('active');

                                                    if (!isCanvasPopulatedByUser) {
                                                        currentToolBtn
                                                            .trigger('click');
                                                    }

                                                    timeoutPromise = $timeout(function() {
                                                        currentToolBtn
                                                            .trigger('mouseout')
                                                            .removeClass('active');

                                                        TourService.disableTourButton(false);
                                                    }, 1250);
                                                }, 1250);
                                            }, 1250);
                                        }, 1250);
                                    }, 1250);
                                }, 1250);
                            }, 1250);
                        }, 750);
                    }, 2250);
                }
            });

            // step 10
            config.steps.push({
                element: '#right-sidebar-tabs .nav-tabs',
                intro: 'The styles tab allows you to access the Text Tool and fonts as well as being able to add background colors and strokes to your images. You can enter text mode at any time by simply pressing the t key on the keyboard.',
                position: 'left',
                onBefore: function () {
                    removeSampleMyTemplate();
                    TourService.disableTourButton(true);

                    $('#right-sidebar-tabs .nav-tabs li:nth-child(2) a').trigger('click');

                    timeoutPromise = $timeout(function() {
                        var optionsView = $('#tab-right-sidebar-options');
                        optionsView.find('.item:nth-child(1)').addClass('active');

                        timeoutPromise = $timeout(function() {
                            optionsView.find('.item:nth-child(1)')
                                .removeClass('active')
                                .trigger('click');

                            timeoutPromise = $timeout(function() {
                                var backgroundBackBtn = $('#tab-background-stroke .back');
                                backgroundBackBtn.addClass('active');

                                timeoutPromise = $timeout(function() {
                                    backgroundBackBtn
                                        .removeClass('active')
                                        .trigger('click');

                                    timeoutPromise = $timeout(function() {
                                        optionsView.find('.item:nth-child(2)').addClass('active');

                                        timeoutPromise = $timeout(function() {
                                            optionsView.find('.item:nth-child(2)')
                                                .removeClass('active')
                                                .trigger('click');

                                            timeoutPromise = $timeout(function() {
                                                var fontsBackBtn = $('#tab-fonts .back');
                                                fontsBackBtn.addClass('active');

                                                timeoutPromise = $timeout(function() {
                                                    fontsBackBtn
                                                        .removeClass('active')
                                                        .trigger('click');

                                                    timeoutPromise = $timeout(function() {
                                                        $('#right-sidebar-tabs .nav-tabs li:nth-child(1) a').trigger('click');
                                                        TourService.disableTourButton(false);
                                                    }, 2000);
                                                }, 1250);
                                            }, 3000);
                                        }, 1250);
                                    }, 2000);
                                }, 1500);
                            }, 3000);
                        }, 1250);
                    }, 3000);
                }
            });

            // step 11
            config.steps.push({
                element: '#all-pages',
                intro: 'All pages will allow you to see all your spreads and rearrange them if you need to.',
                position: 'below',
                onBefore: function () {
                    TourService.disableTourButton(true);
                    TourService.disableExitOnRouteChange(true);

                    timeoutPromise = $timeout(function() {
                        $('#all-pages').trigger('click');

                        timeoutPromise = $timeout(function() {
                            swapAllPagesSpread(function() {
                                timeoutPromise = $timeout(function () {
                                    $('#close-frp-pages').trigger('click');

                                    timeoutPromise = $timeout(function () {
                                        TourService.disableExitOnRouteChange(false);
                                        TourService.disableTourButton(false);
                                    }, 1000);
                                }, 2500);
                            });
                        }, 2500);
                    }, 3000);
                }
            });

            // step 12
            config.steps.push({
                element: '#download-pdf',
                intro: 'Generate a low resolution proof PDF to see a trim version of your album. You will receive a link to the PDF via email and you can also download it directly from here. Send the PDF to your clients to receive final approval.',
                position: 'below',
                onBefore: function () {
                    TourService.disableTourButton(true);

                    timeoutPromise = $timeout(function() {
                        var pdfProgressBar = $('.pdf-progress-bar');
                        pdfProgressBar.removeClass('ng-hide');

                        timeoutPromise = $timeout(function() {
                            var pdfDownload = $('.pdf-download');

                            pdfProgressBar.addClass('ng-hide');
                            pdfDownload.removeClass('ng-hide');

                            timeoutPromise = $timeout(function() {
                                pdfDownload.addClass('ng-hide');

                                TourService.disableTourButton(false);
                            }, 1500);
                        }, 1250);
                    }, 2500);
                }
            });

            config.onBefore = function() {
                saveInitialUIState();
                TourService.disableTourButton(false);

                isCanvasPopulated = checkIfCanvasIsPopulated(1);
                isCanvasPopulatedByUser = checkIfCanvasIsPopulated(1);
                isSwapTargetCanvasPopulated = checkIfCanvasIsPopulated(2);
            };

            config.onAfter = function() {
                $timeout.cancel(timeoutPromise);
                cleanCanvasDragEvents();
                cleanLayoutDragEvents();
                $('#filmstrip-empty-placeholder').removeClass('active');

                if ($('#import-dropdown').first().hasClass('active')) {
                    $('#import-dropdown').first().trigger('click');
                }

                FilmstripTourUtilsService.clearFilmstrip(layoutController, layout);
                FilmstripTourUtilsService.deselectFilmstripItems();
                removeSampleMyTemplate();
                revertInitialUIState();
                TourService.disableTourButton(false);
            };

            return config;
        }

    }]);
