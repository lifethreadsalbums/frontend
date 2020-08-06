'use strict';

angular.module('pace.prints')
    .constant('PrintsConstants',
        {
            BORDER_SIZE: 10, //0.25 * 72,
            BORDER_COLOR: '#ffffff'
        }
    )
    .controller('PrintsCtrl', ['$scope', '$state', '$stateParams', '$rootScope', '$timeout', 'AuthService', 'layouts',
        'layout', 'product', 'productPrototype', 'LayoutAutoSaveService', 'layoutSizeOption', 'PrintsService',
        'KeyboardService', 'SpoPackage', 'ngDialog', 'Settings', 'MessageService', 'PrintsConstants', 'FontEvent',
        'TourEvent', 'TourService', 'PrintsOverviewTourService', 'SpoThumbnailService', '$debounce', 'user',
        'layoutViewData', 'ProductService', 'TextEditorService',
        function ($scope, $state, $stateParams, $rootScope, $timeout, AuthService, layouts,
            layout, product, productPrototype, LayoutAutoSaveService, layoutSizeOption, PrintsService,
            KeyboardService, SpoPackage, ngDialog, Settings, MessageService, PrintsConstants, FontEvent,
            TourEvent, TourService, PrintsOverviewTourService, SpoThumbnailService, $debounce, user,
            layoutViewData, ProductService, TextEditorService) {

            // console.log('PrintsCtrl', layouts, product)
            $scope.isAdmin = user && user.admin;
            $scope.editable = $scope.isAdmin || (product.state === 'New' || product.state === 'Revision') && (!product.orderState || product.orderState==='Pending');

            //load user settings
            if (user) {
                Settings.getUserSettings(user.id).then(function(settings) {
                    $scope.userSettings = settings;
                    $scope.userSettings.settings.swatches = $scope.userSettings.settings.swatches || [null, '#000000', '#ffffff'];
                    $scope.userSettings.settings.fontSwatches = $scope.userSettings.settings.fontSwatches || [];
                });
            }

            //set up single prints options
            $scope.optionsTemplate = PrintsService.prepareOptionsTemplate($scope, productPrototype);

            var autoSaver = new LayoutAutoSaveService($scope, onLayoutSave);
            $scope.layout = layout;
            $scope.layouts = layouts;
            $scope.autoSaver = autoSaver;
            $scope.productPrototype = productPrototype;
            $scope.product = product;
            $scope.selectedProduct = product;
            $scope.currentProduct = product;
            var layoutController = $scope.layoutController = new PACE.LayoutController($scope);
            layoutController.currentTool = new PACE.PrintsSelectionTool(layoutController);
            //layoutController.currentTool = new PACE.SelectionTool(layoutController);

            _.each(layouts, function(layout) {
                new PACE.PreflightLayoutCommand(layout).execute();
            });

            layoutController.onDragEnter = function() {};
            layoutController.onDragLeave = function() {};
            layoutController.onDragOver = function() {};
            layoutController.onDrop = function() {};
            layoutController.on('layout:selection-modified', onSelectionModified);

            $scope.filmstripModel = {};

            autoSaver.setLayouts( layouts.concat(layout) );
            autoSaver.setEnabled( $scope.editable );

            $scope.$on('layout:layout-changed', function(e, args) {
                autoSaver.setDirty();
            });

            var ui = {
                sidebarRightEl: $('.prints-sidebar--right')
            };

            layout.viewState = layout.viewState || {};
            layout.viewState.stylesViewIndex = layout.viewState.stylesViewIndex || 0;
            layout.viewState.viewMode = 'tile';
            layout.viewState.fillMode = 'single';
            layout.viewState.stylesApplyToOption = layout.viewState.stylesApplyToOption || 'selectedObject';
            layout.viewState.stylesMode = layout.viewState.stylesMode || 'strokeColor';

            $scope.printsCount = 0;
            $scope.opacity = 100;
            //TODO:...
            $scope.canvasMode = productPrototype.code==='canvas';

            if (layouts.length===0) product.children = [];

            _.each(layouts, function(l, i) {
                l.product = product.children[i];
                l.currentImageIndex = 0;
                PrintsService.sortImages(l);
                
                for (var j = 0; j < l.spreads.length; j++) {
                    if (l.spreads[j].elements.length>0 && l.spreads[j].elements[0].errors &&
                        l.spreads[j].elements[0].errors.length>0) {
                        l.currentImageIndex = j;
                        break;
                    }
                }
            });

            $scope.$on('spo-cart-error', function() {
                _.each(layouts, function(l) {
                    for (var j = 0; j < l.spreads.length; j++) {
                        if (l.spreads[j].elements.length>0 && l.spreads[j].elements[0].errors &&
                            l.spreads[j].elements[0].errors.length>0) {
                            l.currentImageIndex = j;
                            break;
                        }
                    }
                });
                refreshContainers();
                $scope.$apply();
            })

            $scope.layouts = layouts = sortContainers(layouts);

            $scope.containerListProps = {
                layouts: layouts,
                layout: layout,
                product: product,
                productPrototype: productPrototype,
                layoutSizeOption: layoutSizeOption,
                layoutController: layoutController,
                onContainerClick: selectContainer,
                onContainerRemoveClick: removeContainer,
                onContainerDrop: onContainerImageDrop,
                onContainerQuantityChange: onContainerQuantityChange,
                onContainerSizeChange: onContainerSizeChange,
                onToolbarClick: onToolbarClick,
                onToolsetChange: onToolsetChange,
                onCurrentImageChange: onCurrentImageChange,
                onImageRemoveClick: onImageRemoveClick,
                selectedContainer: null,
                editable: $scope.editable,
                canvasMode: $scope.canvasMode,
                bordersEnabled: true
            };

            $scope.applyToOptions = [
                {
                    name: 'Apply to Selected Photo',
                    value: 'selectedObject'
                },
                {
                    name: 'Apply to All Photos',
                    value: 'allPhotos'
                }
            ];

            $scope.importPhotosOptions = [
                {value: 'upload', label: 'Upload', labelPreIcon: 'hdd', rightLabel: '120/300', callback: function() {}}
            ];

            $scope.filterOptions = [
                {value: 'alphabetical', label: 'Alphabetical', labelPreIcon: 'filter', labelPreIconInvisible: true},
                {value: 'bySize', label: 'By Size', labelPreIcon: 'filter', labelPreIconInvisible: true},
                {value: 'capture-time', label: 'Capture Time', labelPreIcon: 'filter', labelPreIconInvisible: true},
                {value: 'disabled', label: 'Disabled', labelPreIcon: 'filter', labelPreIconInvisible: true},
                {value: 'multiple-use', label: 'Multiple Use', labelPreIcon: 'filter', labelPreIconInvisible: true},
                {value: 'custom', label: 'My Order', labelPreIcon: 'filter', labelPreIconInvisible: true},
                {value: 'star-rating', label: 'Star Rating', labelPreIcon: 'filter', labelPreIconInvisible: true},
                {value: 'unused', label: 'Unused', labelPreIcon: 'filter', labelPreIconInvisible: true},
                {value: 'upload-order', label: 'Uploaded Order', labelPreIcon: 'filter', labelPreIconInvisible: true}
            ];

            if ($scope.isAdmin) {
                // set default filmstrip filter to admin for admin
                if (product.orderState === 'PaymentComplete') {
                    layout.viewState.filmstripFilter = 'bySize';
                }
                if (layout.adminViewState && layout.adminViewState.filmstripFilter) {
                    layout.viewState.filmstripFilter = layout.adminViewState.filmstripFilter;
                }
            }

            var saveUserSettings = function() {
                $scope.userSettings.$save();
            };
            var saveUserSettingsDebounced = $debounce(saveUserSettings, 2000);

            function onLayoutSave() {
                for (var i = 0; i < layouts.length; i++) {
                    var layout = layouts[i];
                    layout.product.layoutId = layout.id;
                }
            }

            function refreshContainers() {
                $scope.containerListProps.layouts = layouts;
                $scope.containerListProps = _.clone($scope.containerListProps);
            }
            $scope.refreshContainers = refreshContainers;

            function refreshUI() {
                var props = $scope.containerListProps,
                    hasImages = props.selectedContainer && props.selectedContainer.spreads.length>0;

                $scope.currentPhotoIdx =  hasImages ? props.selectedContainer.currentImageIndex + 1 : '';
                $scope.numImages = hasImages ? '/ ' + props.selectedContainer.spreads.length : '';
                updatePrintsCount();
            }
            $scope.refreshUI = refreshUI;

            function fireLayoutChangeEvent() {
                layoutController.fireEvent('layout:layout-changed');
            }

            function updatePrintsCount() {
                var count = 0;
                var i;

                for (i = 0; i < layouts.length; i ++) {
                    var container = layouts[i],
                        product = container.product;

                    var qty = _.reduce(container.spreads,
                        function(memo, spread) {
                            var q = spread.quantity || product.options._quantity;
                            return memo + q;
                        }, 0);
                    product.options.imageQuantity = qty;

                    if (container.layoutSize.gridX>0) {
                        var numImagesInGrid = container.layoutSize.gridX * container.layoutSize.gridY;
                        product.options.imageQuantity = product.options.imageQuantity * numImagesInGrid;
                    }
                }
                new PACE.UpdateFilmstripStatsCommand(layout,layouts).execute();
            }

            function sortContainers(containers) {
                var result = _.sortBy(containers, function(container) {
                    return container.layoutSize.height * 10000 + container.layoutSize.width;
                });
                for (var i = 0; i < result.length; i++) {
                    result[i].product.childIndex = i;
                }
                return result;
            }

            function deleteCurrentImage() {
                var layout = $scope.containerListProps.selectedContainer,
                    idx = layout.currentImageIndex,
                    isTemplateBased = layout.layoutSize.templateSpread;

                if (isTemplateBased) {
                    var spread = layout.spreads[idx];
                    var el = _.findWhere(spread.elements, {type:'ImageElement'});
                    el.imageFile = null;
                    delete el._id;
                    layout.spreads = layout.spreads.concat();
                } else {
                    layout.spreads.splice(idx, 1);
                    layout.spreads = layout.spreads.concat();
                    if (layout.currentImageIndex>=layout.spreads.length) {
                        layout.currentImageIndex = layout.spreads.length - 1;
                    }
                }
                refreshContainers();
                refreshUI();

                //trigger auto save
                fireLayoutChangeEvent();
            }

            function saveRecentSelectionInfo() {
                SpoThumbnailService.setRecentSelectionInfo({
                    containerId: $scope.containerListProps.selectedContainer ? $scope.containerListProps.selectedContainer.id : null,
                    imageIndex: $scope.containerListProps.selectedContainer ? $scope.containerListProps.selectedContainer.currentImageIndex : -1,
                });
            }

            function addContainer(container, options) {
                var newLayout = {
                    layoutSize: container,
                    spreads: [],
                    currentImageIndex: 0
                };
                if (container.templateSpread) {
                    var spread = angular.copy(container.templateSpread);
                    delete spread.id;
                    delete spread.version;
                    _.each(spread.elements, function(el) {
                        if (el.type==='ImageElement' && el.imageFile) {

                            var filmstrip = layout.filmStrip;
                            var fsItem = _.find(filmstrip.items, function(item) {
                                return item.image.id===el.imageFile.id;
                            });

                            if (!fsItem) {
                                fsItem = {
                                    _id: _.uniqueId('filmstrip-item-') + _.now(),
                                    type: 'FilmStripImageItem',
                                    image: el.imageFile
                                }
                                filmstrip.items.push(fsItem);
                                filmstrip._version = (filmstrip._version || 0) + 1;
                            }
                        }
                        
                        delete el.id;
                        delete el.version;
                    });
                    newLayout.spreads = [spread];
                }
                
                var child = {
                    parentId: product.id,
                    prototypeId: product.prototypeId,
                    linkLayout: false,
                    options: options ? angular.copy(options) : angular.copy(product.options)
                };
                if (!options) {
                    child.options._quantity = 1;
                }
                child.options[layoutSizeOption.effectiveCode] = container.code;

                newLayout.product = child;
                layouts.push(newLayout);
                layouts = sortContainers(layouts);
                $scope.layouts = layouts;

                autoSaver.setLayouts( layouts.concat(layout) );
                product.children.push(child);

                refreshContainers();
                refreshUI();

                //trigger auto save
                fireLayoutChangeEvent();

                if ($scope.containerListProps.selectedContainer ||
                    layout.viewState.viewMode==='single') {
                    $timeout(function() {
                        selectContainer(newLayout);
                    });
                }

                $('.prints').focus();
            };

            function refreshFilmstrip() {
                if ($scope.containerListProps && $scope.containerListProps.selectedContainer &&
                    layout.viewState.filmstripFilter==='bySize') {
                    layout.filmStrip._version = (layout.filmStrip._version || 0) + 1;
                }
            }

            $scope.onContainerDrop = function(container) {
                if (container.data) {
                    //spo package dropped
                    _.each(container.data.layouts, function(l) {
                        var container = angular.copy(l.layoutSize);
                        var optionVal = _.find(layoutSizeOption.prototypeProductOptionValues, function(v) {
                            return v.layoutSize && v.layoutSize.id===l.layoutSize.id;
                        });
                        container.code = optionVal.code;
                        addContainer(container, l.product.options);
                    });
                } else {
                    addContainer(container);
                }
            }

            $scope.onSwatchChange = function() {
                saveUserSettingsDebounced();
            };

            $scope.initFilmstripCtrl = function(ctrl) {
                ctrl.setShowPagesInFileInfo(false);
            };


//--------------------------------------------------------------------
//------------------ Container List Event Handlers  ------------------
//--------------------------------------------------------------------

            function setMinEffectiveDPI(container) {
                if (container && layoutViewData.layoutSettings && 
                    layoutViewData.layoutSettings.effectivePPIExpression) {
                    var val = ProductService.evalExpression(
                        layoutViewData.layoutSettings.effectivePPIExpression,
                        container.product);

                    console.log('minEffectivePPI', val);
                    PACE.minEffectivePPI = val;
                }
            }

            function selectContainer(container) {
                $scope.selectedProduct = container ? container.product : product;
                $scope.selectedBorders = $scope.selectedProduct.options.borders;
                $scope.toggleRightSidebar();

                if (container) {
                    $scope.containerListProps.bordersEnabled = 
                        PrintsService.isBorderEnabled(container.product, productPrototype);
                }

                $scope.containerListProps.selectedContainer = container;

                if (!container) {
                    switchToSelectionTool(false);
                }

                setMinEffectiveDPI(container);

                refreshUI();
                refreshContainers();
                refreshFilmstrip();
                saveRecentSelectionInfo();
            }
            $scope.selectContainer = selectContainer;

            function removeContainer(container) {
                var del = function() {
                    var idx = layouts.indexOf(container);
                    layouts.splice(idx, 1);
                    idx = product.children.indexOf(container.product);
                    product.children.splice(idx, 1);

                    $scope.containerListProps.selectedContainer = null;

                    refreshUI();
                    refreshContainers();

                    //trigger auto save
                    fireLayoutChangeEvent();
                };

                var msg = 'Do you really want to delete this size';
                if (container.spreads.length>0) {
                    msg += ' and all of its associated photos';
                }
                msg += '?';

                MessageService.confirm(msg, del);
            }
            $scope.removeContainer = removeContainer;

            function addImagesToContainer(items, container, index) {
                var hasBorders = container.product.options.borders,
                    existingElements = [],
                    prevSpreads;

                //check if container is empty and has some text boxes on canvas
                if (container.spreads.length===0 && layoutController.currentRenderer &&
                    layoutController.currentRenderer.layout._id === container._id &&
                    layoutController.currentRenderer.spread.elements.length>0) {

                    //copy text boxes
                    var textBoxes = _.where(layoutController.currentRenderer.spread.elements, {type:'TextBox'});
                    existingElements = angular.copy(textBoxes);
                }
                
                prevSpreads = container.spreads;
                if ($scope.canvasMode || container.layoutSize.templateSpread) {
                    container.spreads = [];
                    items = [items[0]];
                }

                _.each(items, function(item) {
                    var spread = {numPages:1, pageNumber:container.spreads.length + 1, elements:[]};

                    var layoutSize = angular.copy(container.layoutSize);
                    var isGrid = layoutSize.gridX>0;

                    if (!isGrid && !layoutSize.templateSpread &&
                        ((item.image.width<item.image.height && layoutSize.width>layoutSize.height) ||
                         (item.image.width>item.image.height && layoutSize.width<layoutSize.height))) {
                        var tmp = layoutSize.width;
                        layoutSize.width = layoutSize.height;
                        layoutSize.height = tmp;
                    }

                    var spreadInfo = PACE.Spread.create(spread, { layoutSize: layoutSize });
                    var el = {
                        type: 'ImageElement',
                        imageFile: item.image,
                        opacity: 1,
                        rotation: 0,
                        quantity: null,
                        strokeWidth: hasBorders ? PrintsConstants.BORDER_SIZE : 0,
                        strokeColor: PrintsConstants.BORDER_COLOR
                    };

                    if (layoutSize.templateSpread) {
                        spread.elements = prevSpreads[0].elements;

                        _.each(spread.elements, function(el) {
                            delete el._id;
                            delete el.id;
                            delete el.version;
                        });
                        var imageEl = _.findWhere(spread.elements, {type:'ImageElement'});
                        if (imageEl) {
                            imageEl.imageFile = item.image;
                            new PACE.FillFrameAndCenterCommand(imageEl).execute();
                        }

                    } else if (layoutSize.gridX>0) {
                        var w = layoutSize.width / layoutSize.gridX,
                            h = layoutSize.height / layoutSize.gridY;
                        var elements = [];

                        for (var i = 0; i < layoutSize.gridX; i++) {
                            for (var j = 0; j < layoutSize.gridY; j++) {
                                var el2 = _.clone(el);
                                el2.x = w * i;
                                el2.y = h * j;
                                el2.width = w;
                                el2.height = h;
                                new PACE.FillFrameAndCenterCommand(el2).execute();
                                elements.push(el2);
                            }    
                        }
                        spread.elements = elements.concat(existingElements);
                    } else {
                        new PACE.FourSidedBleedCommand(el, spreadInfo).execute();
                        spread.elements = [el].concat(existingElements);
                    }
                    existingElements = [];
                    container.spreads.splice(0, 0, spread);
                });

                PrintsService.sortImages(container);
                for (var i = 0; i < container.spreads.length; i++) {
                    var el = container.spreads[i].elements[0];
                    if (el && el.imageFile && el.imageFile===items[0].image) {
                        container.currentImageIndex = i;
                        console.log('images dropped, currentImageIndex', container.currentImageIndex)
                        break;
                    }
                }
            }

            function onContainerImageDrop(container, event) {

                var items = JSON.parse(event.dataTransfer.getData("text/x-pace-filmstrip-items"));
                items = _.filter(items, function(item) {
                    return item.image.status!=='Rejected' &&
                        item.image.status!=='Cancelled';
                });

                items = _.sortBy(items, 'clickTime');

                var items = _.map(items, function(item) {
                    return _.findWhere(layout.filmStrip.items, {_id: item._id});
                });

                var doStuff = function() {
                    if ($scope.layout.viewState.fillMode === 'single') {
                        //add to single container
                        items.reverse();
                        addImagesToContainer(items, container);
                    } else {
                        var existingItems = [],
                            images = {};
                        _.each(layouts, function(l) {
                            _.each(l.spreads, function(s) {
                                var el = s.elements.length>0 ? s.elements[0] : null;
                                if (el && !images[el.imageFile.id]) {
                                    images[el.imageFile.id] = el.imageFile;
                                    existingItems.push({image:el.imageFile});
                                }
                            });
                        });

                        items = items.concat(existingItems);

                        //fill all containers
                        _.each(layouts, function(l) {
                            l.spreads = [];
                            addImagesToContainer(items, l);
                            layoutController.fireEvent('prints:images-dropped', l);
                        });
                    }

                    _.each(layouts, function(l) {
                        setMinEffectiveDPI(l);
                        new PACE.PreflightLayoutCommand(l).execute();
                    });

                    layoutController.fireEvent('prints:images-dropped', container);
                    refreshUI();

                    setMinEffectiveDPI($scope.containerListProps.selectedContainer);
                    
                    //trigger auto save
                    fireLayoutChangeEvent();
                };

                if ($scope.containerListProps.selectedContainer !== container) {
                    doStuff();
                    $timeout(function() {
                        selectContainer(container);
                    }, 650);
                    return;
                }

                doStuff();
            }

            $scope.onContainerImageDrop = onContainerImageDrop;

            function onImageSelectionChange(selectedElement) {
            }

            function onContainerQuantityChange(container) {
                updatePrintsCount();
                $scope.productAutoSaver.save();
                fireLayoutChangeEvent();
            }

            function onContainerSizeChange(container) {
                updatePrintsCount();
                $scope.productAutoSaver.save();
                fireLayoutChangeEvent();
            }

            function centerCurrentImage() {
                var el = layoutController.selectedElements[0];
                if (!el) return;
                new PACE.CenterContentCommand(el).execute();
                layoutController.currentRenderer.renderWithAnimation();
                layoutController.fireEvent('layout:selection-modified');
                refreshContainers();
            }

            function flipCurrentImage(prop) {
                var container = $scope.containerListProps.selectedContainer,
                    spread = container.spreads[container.currentImageIndex],
                    elements;

                if (spread.elements.length===0) return;

                if (container.layoutSize.gridX>0) {
                    elements = spread.elements;
                } else {
                    elements = [_.findWhere(spread.elements, {type:'ImageElement'})];
                }

                _.each(elements, function(el) {
                    el[prop] = !el[prop];
                    el._id = null;
                });
            
                container.spreads = container.spreads.concat();
                refreshContainers();
                fireLayoutChangeEvent();
            }

            function toggleFilter(filter) {
                var container = $scope.containerListProps.selectedContainer,
                    spread = container.spreads[container.currentImageIndex],
                    el = layoutController.selectedElements[0];

                if (el && el.type==='ImageElement') {
                    el.filter = el.filter===filter ? null : filter;
                    layoutController.fireEvent('layout:selection-modified');
                } else {
                    var elements = _.filter(layoutController.currentRenderer.spread.elements, {type:'ImageElement'});
                    _.each(elements, function(el) {
                        el.filter = el.filter===filter ? null : filter;
                        if (el.originalElement) {
                            el.originalElement.filter = el.filter;
                        }
                    });
                    layoutController.currentRenderer.render(); 
                } 
                
                fireLayoutChangeEvent();
                refreshContainers();
            }

            function toggleBorder() {
                var el = layoutController.selectedElements[0];
                if (!el) return;

                el.strokeWidth = el.strokeWidth>0 ? 0 : PrintsConstants.BORDER_SIZE;
                el.strokeColor = PrintsConstants.BORDER_COLOR;
                layoutController.currentRenderer.render();
                layoutController.fireEvent('layout:selection-modified');
            }

            function changeBackgroundBorder(color) {
                var el = _.findWhere(layoutController.currentRenderer.spread.elements, {type:'BackgroundFrameElement'});
                if (!el) return;

                el.backgroundColor = color;
                el.originalElement.backgroundColor = color;
                var textBoxes = _.filter(layoutController.currentRenderer.spread.elements, {type:'SpineTextElement'});
                _.each(textBoxes, function(tb) {
                    var style = TextEditorService.getMergedFontStyle(tb);
                    if (style.fill===color) {
                        var textColor = color==='#ffffff' ? '#000000' : '#ffffff';
                        new PACE.AddFabricStyleToAllCommand(tb, {fill:textColor}).execute();
                    }
                });

                layoutController.currentRenderer.render();
                layoutController.fireEvent('layout:selection-modified');
                refreshContainers();
                fireLayoutChangeEvent();
            } 

            function onToolbarClick(action, imageIndex) {
                if (action==='delete') {
                    deleteCurrentImage();
                } else if (action==='center') {
                    centerCurrentImage();
                } else if (action==='flip-horizontal') {
                    flipCurrentImage('flipX');
                } else if (action==='flip-vertical') {
                    flipCurrentImage('flipY');
                } else if (action==='border') {
                    toggleBorder();
                } else if (action==='bw') {
                    toggleFilter('bw');
                } else if (action==='sepia') {
                    toggleFilter('sepia');
                } else if (action==='styles') {
                    $scope.layout.viewState.rightTabIndex = 1;
                    $scope.layout.viewState.stylesViewIndex = 1;
                } else if (action==='text-tool') {
                    var cmd = new ToggleTextToolCommand(layoutController, $scope, false);
                    cmd.execute();
                } else if (action==='white-border') {
                    changeBackgroundBorder('#ffffff');
                } else if (action==='black-border') {
                    changeBackgroundBorder('#000000');
                }
            }

            function onCurrentImageChange(container, idx) {
                container.currentImageIndex = idx;
                refreshUI();
                saveRecentSelectionInfo();
            }

            function onImageRemoveClick(e) {
                deleteCurrentImage();
            }

            function checkBorders() {
                //check borders for all images in this container
                var container = $scope.containerListProps.selectedContainer;
                if (!container) return;
                var numBorders = _.reduce(container.spreads, function(val, s) {
                    var hasBorder = s.elements.length>0 && s.elements[0].strokeWidth>0;
                    return val + (hasBorder ? 1 : 0);
                }, 0);
                if (numBorders===container.spreads.length) {
                    container.product.options.borders = true;
                } else if (numBorders===0) {
                    container.product.options.borders = false;
                }
                $scope.selectedBorders = container.product.options.borders;
            }

            function onSelectionModified() {
                $timeout(checkBorders);
            }

//----------------------------------------------------------------
//--------------------------- Packages  --------------------------
//----------------------------------------------------------------

            $scope.savePackage = function() {
                var packageLayouts = angular.copy(layouts);
                _.each(packageLayouts, function(l) {
                    if (l.layoutSize.templateSpread) {

                        l.layoutSize.templateSpread = angular.copy(l.spreads[0]);
                        _.each(l.layoutSize.templateSpread.elements, function(el) {
                            delete el.errors;
                        });
                    }
                    l.spreads = [];
                    delete l.id;
                    delete l.version;
                });
                var data = {
                    layouts: packageLayouts,
                };

                var spoPackage = new SpoPackage({
                    user: AuthService.getCurrentUser(),
                    dataJson: JSON.stringify(data)
                });

                var dialogScope = $scope.$new();
                dialogScope.save = function(packageName) {
                    spoPackage.name = packageName;
                    return spoPackage.$save(function(val) {

                        $state.go('build.section.option', {
                            section: 'sizes',
                            optionUrl: 'sizes-packages',
                            productId: product.id,
                            category: null,
                            name: null
                        });

                        $timeout(function() {
                            $scope.$parent.$broadcast('prints:package-saved');
                        }, 500);
                    }, function(error) {
                        console.log('package saving error', error);
                        MessageService.error('This package name currently exists. Please choose another name.');
                    });
                };

                ngDialog.open({
                    template: 'views/prints/savePackageDialog.html',
                    scope: dialogScope,
                    controller: 'SavePackageDialogCtrl',
                    className: 'pace-modal pace-modal-dark pace-modal-pages'
                });

            };

            $scope.deletePackage = function() {
                var del = function() {
                    var p = $scope.model.selectedPackage;
                    SpoPackage.delete({id: p.id}, function() {
                        $scope.$parent.$broadcast('prints:package-deleted', p);
                    });
                    $scope.model.selectedPackage = null;
                };

                MessageService.confirm('Do you really want to delete this package?', del);
            };

//----------------------------------------------------------------
//------------------------- Toolbars etc  ------------------------
//----------------------------------------------------------------

            function onToolsetChange(toolset) {
                var shortcuts = {
                    'tools2': '1',
                    'tools4': 'T'
                };
                processKeyShortcut(shortcuts[toolset]);
            }

            var prevFilter = 'alphabetical';

            $scope.setViewMode = function(mode) {
                if (mode==='single' && !$scope.containerListProps.selectedContainer && layouts.length>0) {
                    selectContainer(layouts[0]);
                    $timeout(function() {
                        $scope.layout.viewState.viewMode = mode;
                        refreshContainers();
                        prevFilter = layout.viewState.filmstripFilter;
                        layout.viewState.filmstripFilter = 'bySize';
                        refreshFilmstrip();
                    }, 800);
                    return;
                }

                $scope.layout.viewState.viewMode = mode;
                if (mode==='single') {
                    prevFilter = layout.viewState.filmstripFilter;
                    layout.viewState.filmstripFilter = 'bySize';
                    refreshFilmstrip();
                } else if (layout.viewState.filmstripFilter === 'bySize') {
                    layout.viewState.filmstripFilter = prevFilter;
                    refreshFilmstrip();
                }
                refreshContainers();
            };

            $scope.setFillMode = function(mode) {
                $scope.layout.viewState.fillMode = mode;
                refreshContainers();
            };

            $scope.toggleRightSidebar = function () {
                var containers;

                if ($scope.layout.viewState.viewMode === 'single') {
                    containers = $('#prints-containers-bottom .prints-container__content--active');
                } else {
                    containers = $('#prints-containers-top .prints-container__content--active');
                }

                if (containers.length) {
                    ui.sidebarRightEl.addClass('expanded');
                } else {
                    ui.sidebarRightEl.removeClass('expanded');
                }
            };

            $scope.setFilmstripSizeOptions = function (optionItemId) {
                $scope.bottomContainerStateOptions = _.filter($scope.bottomContainerStateOptionsAll, function(option) {
                    return option.id !== optionItemId;
                });
            };

            $scope.setFilmstripSize = function (optionItem) {
                $timeout(function() {
                    $scope.setFilmstripSizeOptions(optionItem.id);
                    $scope.bottomContainerState = optionItem.id;
                    $rootScope.$broadcast('PRINTS_BOTTOM_CONTAINER_RESIZED', {state: optionItem.id});

                    switch (optionItem.id) {
                        case 'expanded':
                            $scope.bottomContainerStateLabel = 'Collapse';
                            $scope.layout.viewState.viewMode = 'filmstrip';
                            $timeout(refreshContainers);
                            if (layout.viewState.filmstripFilter === 'bySize') {
                                layout.viewState.filmstripFilter = prevFilter;
                                refreshFilmstrip();
                            }
                            break;
                        case 'normal':
                            $scope.bottomContainerStateLabel = 'Expand / Collapse';
                            $scope.layout.viewState.viewMode = 'tile';
                            $timeout( refreshContainers, 600);
                            break;
                        case 'collapsed':
                            $scope.bottomContainerStateLabel = 'Expand';
                            $scope.layout.viewState.viewMode = 'tile';
                            $timeout( refreshContainers, 600);
                            break;
                    }
                });
            };

            $scope.bottomContainerStateLabel = 'Expand / Collapse';
            $scope.bottomContainerState = 'normal';
            $scope.bottomContainerStateOptions = [];
            $scope.bottomContainerStateOptionsAll = [
                {id: 'expanded', label: 'Expand', callback: $scope.setFilmstripSize},
                {id: 'normal', label: 'Single row', callback: $scope.setFilmstripSize},
                {id: 'collapsed', label: 'Collapse', callback: $scope.setFilmstripSize}
            ];

            $scope.switchPhoto = function(switchTo) {
                var selectedContainer = $scope.containerListProps.selectedContainer,
                    newIdx = selectedContainer.currentImageIndex,
                    numImages = selectedContainer.spreads.length;

                var idx = {
                    'first': 0,
                    'prev': newIdx - 1,
                    'next': newIdx + 1,
                    'last': numImages - 1
                };
                if (_.isString(switchTo)) {
                    newIdx = idx[switchTo];
                } else {
                    newIdx = switchTo;
                }

                newIdx = (newIdx + numImages) % numImages;
                selectedContainer.currentImageIndex = newIdx;

                refreshUI();
                refreshContainers();
                saveRecentSelectionInfo();
            };

            $scope.currentPhotoInputChanged = function() {
                if (!$scope.containerListProps.selectedContainer || $scope.currentPhotoIdx === '') {
                    $scope.switchPhoto(0);
                    return;
                }
                $scope.switchPhoto($scope.currentPhotoIdx - 1);
            };

            $scope.onSwitchPhotoFocus = function(event) {
                $scope.currentPhotoIdx = '';
            };

            $scope.onSwitchPhotoKeyDown = function(event) {
                var keyCode = event.keyCode;
                var keyCodes = [8,9,13,37,39,46,48,49,50,51,52,53,54,55,56,57,96,97,98,99,100,101,102,103,104,105];

                if (keyCodes.indexOf(keyCode) === -1 || event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) {
                    event.stopPropagation();
                    event.preventDefault();
                }
            };

//----------------------------------------------------------------
//---------------------- Keyboard shortcuts  ---------------------
//----------------------------------------------------------------

            function switchToSelectionTool(switchViews) {
                var ctrl = layoutController,
                    element;

                if ($scope.containerListProps.selectedContainer) {
                    if (ctrl.selectedElements.length===1) {
                        element = ctrl.selectedElements[0];
                    } else {
                        element = ctrl.currentRenderer.spread.elements[0];
                    }
                }

                ctrl.clearSelection();
                ctrl.currentTool = new PACE.PrintsSelectionTool(ctrl);
                if (element) {
                    ctrl.selectElements([element], true);
                    ctrl.currentTool.beginEdit();
                }
                if (switchViews) {
                    $scope.layout.viewState.rightTabIndex = 0;
                    layoutController.fireEvent('prints:toolbar-changed', 2);
                }
                layoutController.fireEvent('layout:selection-changed');
            }


            var ToggleTextToolCommand = function(layoutController, $scope, switchViews) {

                this.execute = function() {
                    var ctrl = layoutController;
                    var element = ($scope.containerListProps.selectedContainer && 
                        ctrl.selectedElements.length===1) ? ctrl.selectedElements[0] : null;

                    if (ctrl.currentTool.type!=='TextTool') {
                        ctrl.clearSelection(true);
                        ctrl.currentTool = new PACE.TextTool(ctrl);
                        ctrl.currentTool.selectionToolClass = 'PrintsSelectionTool';

                        if (ctrl.currentRenderer) {
                            var fontSize = Math.round(16 / ctrl.currentRenderer.scale);
                            ctrl.currentTool.setDefaultTextElement({fontSize:fontSize});
                        }

                        if (element && (element.type==='TextElement' || element.type==='SpineTextElement')) {
                            ctrl.selectElements([element], true);
                            ctrl.currentEditor = new PACE.TextEditor(ctrl);
                            ctrl.currentEditor.beginEdit();
                        }
                        $scope.layout.viewState.rightTabIndex = 1;
                        $scope.layout.viewState.stylesViewIndex = 3;

                        layoutController.fireEvent('prints:toolbar-changed', 4);
                        layoutController.fireEvent('layout:selection-changed');
                    } else {
                        switchToSelectionTool(switchViews);
                    }
                };

            };

            var SwitchToolbarCommand = function(layoutController, switchViews) {
                this.execute = function() {
                    switchToSelectionTool(switchViews);
                };
            };

            var globalContextMap = {
                '1': { cmd: SwitchToolbarCommand, params:[true]},
                '2': { cmd: ToggleTextToolCommand, params:[$scope, true]},
                'T': { cmd: ToggleTextToolCommand, params:[$scope, false]},
                'ESCAPE': { cmd: SwitchToolbarCommand, params:[false]}
            };

            function processKeyShortcut(shortcut) {
                var hasSelection = layoutController.selectedElements.length>0,
                    cmdInfo;

                cmdInfo = globalContextMap[shortcut];
                if (!cmdInfo) return false;

                var args = [null, layoutController];
                if (cmdInfo.params)
                    args = _.union(args, cmdInfo.params);

                var cmdInstance = new (Function.prototype.bind.apply(cmdInfo.cmd, args));
                cmdInstance.execute();
                return true;
            }

            $scope.$on('build:keydown', function(event, keyboardEvent) {
                $scope.onKeyDown(keyboardEvent);
            });

            $scope.onKeyDown = function(e) {
                var activeElement = $(document.activeElement);

                if (activeElement.is('input') || activeElement.is('textarea')) {
                    return;
                }
                
                if (layoutController.currentEditor instanceof PACE.TextEditor) return;
                var shortcut = KeyboardService.getShortcut(e);

                if (e.keyCode===39 || e.keyCode===37) {

                    var inc = (e.keyCode===39 ? 1 : -1) * (e.shiftKey ? 10 : 1);
                    var idx = ($scope.currentPhotoIdx - 1 + inc) % $scope.containerListProps.selectedContainer.spreads.length;
                    $scope.containerListProps.selectedContainer.currentImageIndex = idx;
                    refreshUI();
                    refreshContainers();
                    e.preventDefault();
                    e.stopPropagation();

                } else if (shortcut==='DELETE' || shortcut==='BACKSPACE') {
                    var container = $scope.containerListProps.selectedContainer;
                    if (layoutController.selectedElements.length>0 && layoutController.selectedElements[0].type==='TextElement') {
                        new PACE.DeleteSelectionCommand(layoutController).execute();
                        layoutController.currentRenderer.renderWithAnimation();
                        e.preventDefault();
                        e.stopPropagation();
                    } else if (container.spreads.length>0) {
                        //delete current image
                        deleteCurrentImage();
                        e.preventDefault();
                        e.stopPropagation();
                    } else {
                        //delete empty container
                        removeContainer(container);
                        e.preventDefault();
                        e.stopPropagation();
                    }
                } else if (shortcut && processKeyShortcut(shortcut)) {
                    e.preventDefault();
                    e.stopPropagation();
                }

            };

//----------------------------------------------------------------
//------------------------ Init controller  ----------------------
//----------------------------------------------------------------

            $scope.setFilmstripSize($scope.bottomContainerStateOptionsAll[1]);

            $scope.$on('build-product-saved', function() {
                //refreshContainers();
            });

            $scope.$on('build:before-add-to-cart', function() {
                if (layoutController.currentEditor instanceof PACE.TextEditor) {
                    layoutController.currentEditor.endEdit();
                }
                if (autoSaver.isDirty()) {
                    var promise = autoSaver.saveNow();
                    $scope.beforeAddToCartPromises.push(promise);
                }
            });

            function applyBorders(container, border) {
                var renderer = _.find(layoutController.renderers, function(r) {
                    return r.layout._id === container._id;
                });
                var borderWidth = container.layoutSize.borderWidth || PrintsConstants.BORDER_SIZE;
                for (var i = 0; i < container.spreads.length; i++) {
                    var spread = container.spreads[i];
                    if (spread.elements.length>0) {
                        var el = spread.elements[0];
                        if (border && el.strokeWidth===0) {
                            el.strokeColor = PrintsConstants.BORDER_COLOR;
                        }
                        el.strokeWidth = border ? PrintsConstants.BORDER_SIZE : 0;

                        //refresh element on canvas
                        if (renderer && renderer.spread.elements.length>0) {
                            var canvasElement = renderer.spread.elements[0];
                            _.extend(canvasElement, _.pick(el, 'strokeColor', 'strokeWidth'));
                        }
                    }
                }
                if (renderer) renderer.render();
                layoutController.fireEvent('layout:selection-modified');
                fireLayoutChangeEvent();
            }

            $scope.$watch('selectedProduct.options.borders', function(val, oldVal) {
                if (val===oldVal) return;
                if (val===$scope.selectedBorders) return;

                if ($scope.containerListProps.selectedContainer) {
                    applyBorders($scope.containerListProps.selectedContainer, val);
                    $scope.selectedBorders = val;
                }
            });

            $scope.$watch('product.options.borders', function(val, oldVal) {
                if (val===oldVal) return;
                //apply to all containers
                _.each(layouts, function(layout) {
                    if (PrintsService.isBorderEnabled(layout.product, productPrototype)) {
                        layout.product.options.borders = val;
                        applyBorders(layout, val);
                    }
                });
            });

            $scope.$watch('layout.viewState.rightTabIndex', function(val, oldVal) {
                if (val===oldVal) return;
                autoSaver.setDirty();
            });

            $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
                if (autoSaver.isDirty() && !autoSaver.isSaving()) {
                    event.preventDefault();
                    console.log('layout changed, saving before switching state');
                    autoSaver.saveNow().then(function() {
                        $state.go(toState.name, toParams);
                    }, function(error) {
                        console.log('error while saving layout', error);
                        $state.go(toState.name, toParams);
                    });
                }
            });

            $scope.onOptionChange = function() {
                $scope.fillDefaultValues();
                fireLayoutChangeEvent();
            };

            function refreshTextBoxes() {
                for (var i = 0; i < layoutController.renderers.length; i++) {
                    var elements = layoutController.renderers[i].spread.elements;
                    var textElements = _.filter(elements, function(el) {
                        return el.type==='TextElement' || el.type==='SpineTextElement';
                    });
                    if (textElements.length>0) {
                        console.log('fonts loaded, refreshing spread', i);
                        layoutController.renderers[i].render();
                    }
                }
            }

            if (!PACE.FontsLoaded) {
                $scope.$on(FontEvent.FontsLoaded, refreshTextBoxes);
            }

            //sync selection with projects section
            var selectionInfo = SpoThumbnailService.getRecentSelectionInfo();
            if (selectionInfo) {
                //console.log('restore selection', selectionInfo);
                var selectedContainer = _.findWhere(layouts, {id:selectionInfo.containerId});
                if (selectedContainer) {
                    if (selectionInfo.imageIndex>=0) {
                        selectedContainer.currentImageIndex = selectionInfo.imageIndex;
                    }
                    selectContainer(selectedContainer);
                }
            }

            refreshUI();

            var deregisterStartTour = $rootScope.$on(TourEvent.StartTour, function(event, data) {
                if (data.id === 'printsOverview') {
                    startPrintsOverviewTour(true);
                }
            });

            function startPrintsOverviewTour(forceStart) {
                $timeout(function() {
                    TourService.start({
                        id: 'printsOverview',
                        config: PrintsOverviewTourService.getConfig($scope, layoutController, layout, layoutSizeOption),
                        forceStart: forceStart
                    });
                });
            }

            $scope.$on('$destroy', function() {
                deregisterStartTour();
            });
        }
    ])

    .controller('SavePackageDialogCtrl', ['$scope', function ($scope) {

        $scope.ok = function() {
            $scope.saving = true;
            $scope.save($scope.packageName).then(function() {
                $scope.closeThisDialog();
            }, function() {
                $scope.saving = false;
                $('#packageName').focus();
            });

            return true;
        };

    }])

    .directive('spoPackagePreview', [
        '_', 'templatePreviewSettings', 'GeomService', 'TemplateToFramesService', 'TemplateService', 'TemplatePreviewService', '$debounce',
        function (_, templatePreviewSettings, GeomService, TemplateToFramesService, TemplateService, TemplatePreviewService, $debounce) {
            return {
                replace: true,
                restrict: 'E',
                scope: {
                    spoPackage: '=',
                },
                template: '<div style="padding:10px 10px 2px 10px;margin-bottom:10px;text-align:center;border-radius:4px" ng-style="{\'background-color\': spoPackage.isSelected ? \'#828282\' : \'transparent\'}" >'+
                    '<div style="padding:5px;background-color:#fff;line-height:0;"><canvas width="200" height="70"></canvas></div>'+
                    '<input type="text" style="color:#ccc;text-align:center;border:none;background-color:transparent;margin-top:3px;margin-bottom:0;padding:2px" '+
                    ' ng-model-options="{ debounce: 500 }" ng-blur="onNameBlur()" ng-change="onNameChange()" ng-model="packageName"></input></div>',
                link: function (scope, element) {

                    var rect = { width:200, height:70 };
                    var canvas = element.find('canvas')[0],
                        lastSavedName;

                    function render() {

                        var ctx = canvas.getContext('2d');
                        ctx.clearRect(0,0, canvas.width, canvas.height);

                        var maxHeight = _.max(scope.spoPackage.data.layouts, function(layout) {
                            return layout.layoutSize.height
                        }).layoutSize.height;

                        var x = 0,
                            gap = 10,
                            totalWidth = 0,
                            totalHeight = 0,
                            fill = '#66CCFF';

                        _.each(scope.spoPackage.data.layouts, function(layout) {
                            var r = GeomService.fitRect(layout.layoutSize, rect);
                            var step = layout.layoutSize.height / maxHeight;
                            var scale = (0.5 + (0.5 * step)),
                                w = r.width * scale,
                                h = r.height * scale;

                            totalWidth += w + gap;
                            totalHeight += h;
                        });

                        x = canvas.width/2 - totalWidth/2;
                        _.each(scope.spoPackage.data.layouts, function(layout) {
                            var r = GeomService.fitRect(layout.layoutSize, rect);
                            var step = layout.layoutSize.height / maxHeight;
                            var scale = (0.5 + (0.5 * step)),
                                w = r.width * scale,
                                h = r.height * scale,
                                y = canvas.height/2 - h/2;

                            ctx.globalAlpha = 1;
                            ctx.strokeStyle = fill;
                            ctx.lineWidth = 1;
                            ctx.moveTo(x, y);
                            ctx.lineTo(x + w, y + h);

                            ctx.moveTo(x + w, y);
                            ctx.lineTo(x, y + h);
                            ctx.stroke();

                            ctx.fillStyle = fill;
                            ctx.globalAlpha = 0.5;
                            ctx.fillRect(x, y, w, h);
                            x += w + gap;
                        });

                    }

                    scope.onNameBlur = function() {
                        if (scope.packageName==='') {
                            scope.packageName = lastSavedName;
                        }
                    };

                    scope.onNameChange = function() {
                        if (scope.packageName!=='') {
                            scope.spoPackage.name = lastSavedName = scope.packageName;
                        }
                        var state = _.pick(scope.spoPackage, 'isSelected');
                        scope.spoPackage.$save(function(val) {
                            _.extend(scope.spoPackage, state);
                        });
                    };

                    scope.$watch('spoPackage', function(val) {
                        scope.packageName = lastSavedName = val ? val.name : '';
                        if (val) {
                            val.data = JSON.parse(val.dataJson);
                        }
                        render();
                    });
                }
            };
        }
    ]);
