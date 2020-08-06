'use strict';

angular.module('pace.layout')
    .constant('LayoutSettings', {
        arrowKeyOffset: 0.03125 * 72,
        shiftArrowKeyOffset: 0.125 * 72,
        emptyFrameColor: '#29AAE1',
        emptyFrameBackgroundColor: '#29AAE1',
        emptyFrameBackgroundAlpha: 0.15
    })
    .constant('LayoutEvent', {
        LayoutChanged: 'layout:layout-changed'
    })
    .controller('LayoutCtrl', ['$scope', '$stateParams', '$rootScope', '$controller',
        'UndoService', 'SnappingService', 'StoreConfig', 'ImageUploadService', 'UploadEvent',
        'FilmStripItem', 'ImageFile', 'GeomService', 'ngDialog', '$state', 'Product',
        'TemplateService', 'TemplateToFramesService', 'SpreadToTemplateService', 'LayoutTemplate',
        'QueueRequestService', 'LayoutTemplateService', 'TemplateGeneratorService', 'TextEditorService', '$window', '$debounce',
        'Layout', 'KeyboardService', 'LayoutSettings', '$timeout', 'AppConstants', 'FontEvent',
        'LayoutEvent', 'Task', 'NotificationEvent', 'MessageService', 'AuthService', 'ProductService', 'LayoutViewData',
        '$q', 'ProductPrototype', 'DataCacheService', 'IconSet', 'User', 'ImageFileStatus', 'Settings', 'LayoutAutoSaveService',
        'TourService', 'TourEvent', 'DesignerOverviewTourService', 'templatesSettings', 'MainNavService', 'DesignerService', 
        function ($scope, $stateParams, $rootScope, $controller,
            UndoService, SnappingService, StoreConfig, ImageUploadService, UploadEvent,
            FilmStripItem, ImageFile, GeomService, ngDialog, $state, Product,
            TemplateService, TemplateToFramesService, SpreadToTemplateService, LayoutTemplate,
            QueueRequestService, LayoutTemplateService, TemplateGeneratorService, TextEditorService, $window, $debounce,
            Layout, KeyboardService, LayoutSettings, $timeout, AppConstants, FontEvent,
            LayoutEvent, Task, NotificationEvent, MessageService, AuthService, ProductService, LayoutViewData,
            $q, ProductPrototype, DataCacheService, IconSet, User, ImageFileStatus, Settings, LayoutAutoSaveService,
            TourService, TourEvent, DesignerOverviewTourService, templatesSettings, MainNavService, DesignerService) {


            MainNavService.setCurrentController(this);

            this.getCurrentProductInfo = function() {
                return {
                    product: product,
                    section: null,
                    optionUrl: null
                };
            };

//--------------------------------------------------------------------------
//--------------------------- INITIAL SETUP --------------------------------
//--------------------------------------------------------------------------
            var quickArrange = false;

            var productPrototype = {},
                product = {},
                layout = { filmStrip:{ items:[] }, spreads:[], layoutSize:{}, viewState:{} },
                coverLayouts = [],
                userSettings = { settings:{} },
                centerOffset = 0,
                spines = [],
                hinges = [],
                savedLayoutTemplates = [],
                layoutSettings = {},
                layoutViewData,
                isSpreadBased,
                minPages = 10,
                maxPages = 300,
                qaInitialized = false,
                shouldRefreshPrice = false;

            var layoutController = $scope.layoutController = new PACE.LayoutController($scope);
            var autoSaver = new LayoutAutoSaveService($scope, onSave);

            SnappingService.enableSmartPageGuides = true;
            SnappingService.enableSmartEdgeGuides = true;

            $rootScope.designerDisabled = false;

            $scope.autoSaver = autoSaver;
            $scope.productPrototype = productPrototype;
            $scope.product = product;
            $scope.currentProduct = product;
            $scope.layout = layout;
            $scope.editable = true;
            $scope.recentlyUsedControl = $scope.recentlyUsedControl || {};
           
            layout.templatesHistory = layout.templatesHistory || [];
            $scope.templatesHistory = layout.templatesHistory;

            $scope.savedLayoutTemplates = savedLayoutTemplates;

            $scope.layoutVisible = false;
            $scope.selectedToolbar = 0;
            $scope.currentSpread = null;
            $scope.thumbScale = 1;

            $scope.undo = layoutController.undo.bind(layoutController);
            $scope.redo = layoutController.redo.bind(layoutController);

            $scope.templates = [];

            $scope.model = {
                selectedToolsetTop: 'tools1',
                selectedToolset: 'tools1',
                newFrameMode: 'new-frame',
                frameMode: 'frame11',
                toolbarEdits: null,
                prooferSettingsPage: 'client'
            };
            $scope.selectedPageIndices = [];
            $scope.viewMode = layout.viewMode===1 ? 'bleed' : 'normal';
            PACE.LayoutPageClass = $scope.viewMode==='bleed' ? PACE.BookPage : PACE.BookBleedPage;

            $scope.canUndo = UndoService.canUndo.bind(UndoService);
            $scope.canRedo = UndoService.canRedo.bind(UndoService);

            $scope.autoFix = false;
            $scope.autoFixBleeds = false;
            $scope.autoFixPages = false;
            $scope.autoFixLayout = false;
            $scope.autoFixType = false;
            

            //subcontrollers
            var uiCtrl = $controller('DesignerUICtrl', { $scope: $scope });
            

        
//--------------------------------------------------------------------------
//---------------------------- LAYOUT SETUP --------------------------------
//--------------------------------------------------------------------------
            var currentSpread;

            function setupLayout(data, prototype) {
                productPrototype = prototype;
                layoutViewData = data;
                product = data.product;
                layout = data.layout;
                coverLayouts = data.coverLayouts;
                spines = data.spines;
                hinges = data.hinges;
                layoutSettings = data.layoutSettings;
                savedLayoutTemplates = data.savedLayoutTemplates;

                DataCacheService.clearLayoutViewDataCache();
                SnappingService.enableSmartPageGuides = true;
                SnappingService.enableSmartEdgeGuides = true;

                //check local storage
                if (!quickArrange) {
                    var json = localStorage.getItem('layout-' + layout.id),
                        restoredFromLocalStorage = false;
                    if (json) {
                        try {
                            var val = JSON.parse(pako.inflate(json, { to: 'string' }));

                            //var val = JSON.parse(json);
                            if (val.id===layout.id) {
                                console.info('Restoring layout from local storage');
                                layout = val;
                                restoredFromLocalStorage = true;
                            }
                        } catch (error) {
                            console.warning('Layout found in local storage but it\'s not a valid JSON');
                        }
                    }
                }

                product = new Product(product);

                //calculate min & max pages
                isSpreadBased =  (productPrototype.productPageType==='SpreadBased');
                var pageCountOption = productPrototype.getPrototypeProductOption('_pageCount');

                if (pageCountOption.params) {
                    var params = pageCountOption.params;
                    if (params.min) {
                        minPages = ProductService.evalExpression(params.min, product);
                        if (isSpreadBased) minPages *= 2;
                    }
                    if (params.max) {
                        maxPages = ProductService.evalExpression(params.max, product);
                        if (isSpreadBased) maxPages *= 2;
                    }
                }
                //console.log('allowed page range', minPages, maxPages);

                layout.viewState = layout.viewState || {};
                layout.viewState.rightTabIndex = layout.viewState.rightTabIndex || 0;
                layout.viewState.stylesViewIndex = layout.viewState.stylesViewIndex || 0;
                layout.viewState.stylesApplyToOption = layout.viewState.stylesApplyToOption || 'selectedObject';
                layout.viewState.stylesMode = layout.viewState.stylesMode || 'strokeColor';
                layout.viewState.filmstripFilter = layout.viewState.filmstripFilter || 'alphabetical';
                layout.viewState.frameInfoVisible = true;
                layout.viewState.gridInfoVisible = true;
                layout.viewState.gridLineSpacing = 0.5 * 72;

                if (!quickArrange) {
                    layout.recentlyUsedLayoutTemplates = layout.recentlyUsedLayoutTemplates || [];
                    $scope.recentlyUsedLayoutTemplates = layout.recentlyUsedLayoutTemplates;

                    layout.templatesHistory = layout.templatesHistory || [];
                    $scope.templatesHistory = layout.templatesHistory;
                    $scope.savedLayoutTemplates = savedLayoutTemplates;

                    $scope.filmstripModel = {};

                    if (layout.autoFillVariant>0 && layout.autoFillVariant<IconSet['auto-arrange'].length - 1) {
                        $scope.filmstripModel.autoArrangeOption = IconSet['auto-arrange'][layout.autoFillVariant].value;
                    } else {
                        $scope.filmstripModel.autoArrangeOption = 'clear';
                    }

                    layout.autoFillEnabled = $scope.filmstripModel.autoArrangeOption!=='clear';
                }

                //adjust layflat layoutsize
                if (layout.isLayFlat && !layout.lfAdjusted) {
                    var ls = layout.layoutSize;
                    var prop = (ls.pageOrientation==='Horizontal') ? 'width' : 'height';
                    ls[prop] -= AppConstants.LF_HIDDEN_AREA;
                    layout.lfAdjusted = true;
                }

                layout.layoutSize.drawInsideMargins = true;
                layout.layoutSize.drawInsideTrim = true;
                layout.layoutSize.drawSpine = true;
                layout.layoutSize.drawPageNumbers = true;
                layout.layoutSize.allowSinglePageLayouts = true;

                //template default settings
                templatesSettings.fullSpreadSpanModes = ['bleed', 'float'];
                templatesSettings.twoPageLayoutModes = ['spread-two-page', 'full-spread', 'full-spread', 'full-spread', 'full-spread'];
                templatesSettings.fullSpreadSingleSpanModes = ['bleed', 'float'];

                if (layoutSettings) {
                    _.extend(layout.layoutSize, _.pick(layoutSettings,
                        'marginInside', 'marginOutside', 'marginTop', 'marginBottom',
                        'centerRect', 'drawInsideTrim', 'drawInsideMargins', 'drawSpine',
                        'drawPageNumbers', 'allowSinglePageLayouts'));

                    _.extend(templatesSettings, _.pick(layoutSettings,
                        'fullSpreadSpanModes', 'twoPageLayoutModes', 'fullSpreadSingleSpanModes'));
                }

                layout.lps = layout.layoutSize.lps = productPrototype.productPageType==='SpreadBased';
                layout.pageType = productPrototype.productPageType;
                layout.centerOffset = centerOffset;

                var user = AuthService.getCurrentUser();
                $scope.isAdmin = user && user.admin;

                $scope.isSpreadBased = isSpreadBased;
                $scope.productPrototype = productPrototype;
                $scope.product = product;
                $scope.editable = $scope.isAdmin || (product.state === 'New' || product.state === 'Revision') && (!product.orderState || product.orderState==='Pending');

                //load user settings
                if (!quickArrange) {
                    Settings.getUserSettings(product.user.id).then(function(settings) {
                        userSettings = settings;
                        $scope.userSettings = settings;
                        $scope.userSettings.settings.swatches = $scope.userSettings.settings.swatches || [null, '#000000', '#ffffff'];
                        $scope.userSettings.settings.fontSwatches = $scope.userSettings.settings.fontSwatches || [];
                        PACE.minEffectivePPI = settings.settings.minEffectivePPI;
                        new PACE.PreflightLayoutCommand(layout).execute();
                    });

                    if ($scope.isAdmin) {
                        User.query(function(result) {
                            $scope.users = _.sortBy(_.map(result, function(user) {
                                return {
                                    id:user.id,
                                    name: user.firstName + ' ' + user.lastName,
                                    sort: user.lastName
                                };
                            }), 'sort');
                        });
                    }
                    loadProducts();
                }

                //the price breakdown popup uses currentProduct property of the current scope.
                $scope.currentProduct = product;
                $scope.layout = layout;
                $scope.currentSpread = layout.spreads[0];
                $scope.coverLayouts = coverLayouts;
                $scope.currentProductView = ProductService.getProductViewModel(product, productPrototype);
                $scope.recentJob = null;
                $scope.userQuery = product.user.firstName + ' ' + product.user.lastName;
                $scope.currentProductName = product.options._name;

                var attachment = _.findWhere(product.attachments, {type:'LowResPdf'});
                $scope.lowResPdfUrl = attachment ? StoreConfig.urlPrefix + attachment.url + '?v=' + _.now() : null;

                if (coverLayouts) {
                    _.each(coverLayouts, function(coverLayout) {
                        coverLayout.lps = coverLayout.layoutSize.lps = true;
                        coverLayout.spines = spines;
                        coverLayout.hinges = hinges;
                        coverLayout.bookLayout = layout;
                        coverLayout.layoutSize.allowSinglePageLayouts = true;

                        coverLayout.viewState = coverLayout.viewState || {};
                        coverLayout.viewState.frameInfoVisible = true;
                        coverLayout.viewState.gridInfoVisible = true;
                        coverLayout.viewState.gridLineSpacing = 10;
                    });
                }

                //preflight layout
                new PACE.PreflightLayoutCommand(layout).execute();
                new PACE.UpdateFilmstripStatsCommand(layout, coverLayouts).execute();
                //fix image frames
                _.each(layout.spreads, function(spread) {
                    _.each(spread.elements, function(el) {
                        new PACE.FixContentInFrame(el).execute();
                    })
                });

                uiCtrl.updateStatsDebounced();
                layoutController.firstTime = true;

                if (!quickArrange) {
                    var layouts = [ layout ];
                    if (coverLayouts) layouts = layouts.concat(coverLayouts);

                    //enable autosaving
                    autoSaver.setLayouts(layouts);

                    // disable saving view state for admin
                    if ($scope.isAdmin) {
                        autoSaver.setViewStateSaving(false);
                    }

                    autoSaver.setEnabled( $scope.editable );
                    if (restoredFromLocalStorage) autoSaver.setDirty();

                    if (!$scope.publicLayoutTemplates) {
                        LayoutTemplate.getPublic(function(data) {
                            TemplateGeneratorService.setPublicTemplates(data);

                            $timeout(function() {
                                $scope.publicLayoutTemplates = data;
                            }, 1000);

                        });
                    }
                }

                $timeout(function() {
                    $scope.layoutVisible = true;
                    if (!quickArrange) {
                        layoutController.fireEvent('layout:layout-loaded');
                    }
                });

                if (!quickArrange && layout.viewState.rulersVisible) {
                    //force rulers to refresh;
                    $timeout(function() {
                        layoutController.fireEvent('layout:scale-changed');
                    }, 250);
                }

                // check if we are uploading some files from this layout
                _.each(ImageUploadService.getImageFiles(), function(image) {

                    var filmstripItem = _.find(layout.filmStrip.items, function(item) {
                        return item.image &&
                            (item.image.id===image.id || item.image._id===image._id);
                    });
                    if (filmstripItem) {
                        filmstripItem.image = image;
                    }

                });
                _.each(layout.filmStrip.items, function(item) {
                    var image = item.image;
                    if (image.status===ImageFileStatus.UploadInProgress && !image.promise) {
                        //we lost information about the being being uploaded
                        image.status = ImageFileStatus.Rejected;
                        image.errorMessage = 'An error occurred during file upload. Please re-upload this image.';
                    }
                });


                qaInitialized = false;

                if ($scope.isAdmin) {
                    if (!quickArrange) {
                        // set default view mode to bleed for admin
                        $scope.viewMode = 'bleed';
                        layout.viewMode = 1;
                        PACE.LayoutPageClass = PACE.BookPage;
                    }

                    // set default filmstrip filter to admin for admin
                    if (product.orderState === 'PaymentComplete') {
                        layout.viewState.filmstripFilter = 'admin';
                    }
                    if (layout.adminViewState && layout.adminViewState.filmstripFilter) {
                        layout.viewState.filmstripFilter = layout.adminViewState.filmstripFilter;
                    }

                }

                //update book filter label
                var filterItem = _.findWhere($scope.filterOptions, {value:'admin'});
                filterItem.label = productPrototype.productPageType === 'SpreadBased' ? 'Album Order' : 'Book Order';

                // order filmstrip filters by label
                $scope.filterOptions = _.sortBy($scope.filterOptions, 'label');

                // disable dimming used thumbnails for admin when user can no longer edit project
                $scope.disableDimmingThumbnails = $scope.isAdmin && $scope.currentProduct.orderState === 'PaymentComplete';


                if (!quickArrange) {
                    //init proofer compontent
                    $scope.prooferComponentProps.layout = layout;
                    $scope.prooferComponentProps.user = user;
                    $scope.prooferComponentProps.currentSpread = $scope.currentSpread;
                    $scope.prooferComponentProps.isSpreadBased = isSpreadBased;
                    $scope.prooferComponentProps = _.extend({}, $scope.prooferComponentProps);
                }

            }

            $scope.enterQuickArrange = function() {
                if (firstTimeQuickArrange) {
                    $(window).trigger('resize');
                    $scope.quickArrangeCtrl.layoutController.fireEvent('layout:scale-to-fit');
                    firstTimeQuickArrange = false;
                }
                $state.go('layout.arrange', {productId: product.id});
            };

            $scope.initController = function() {
                var prooferCtrl = $controller('DesignerProoferCtrl', { $scope: $scope });
            };

            $scope.initQuickArrange = function() {
                quickArrange = true;
                $scope.$parent.$parent.quickArrangeCtrl = $scope.quickArrangeCtrl;
            };

            function loadLayout(productId) {
                $scope.layoutVisible = false;
                layoutController.fireEvent('layout:layout-loading');
                layoutController.clearSelection();
                if (layoutController.currentRenderer) {
                    layoutController.currentRenderer.clearSelection();
                }

                var layoutViewData = DataCacheService.getLayoutViewData(productId);
                if (layoutViewData.$promise && !layoutViewData.$resolved) {

                    $rootScope.designerSpinner = true;
                    layoutViewData.$promise.then(function(data) {
                        ProductPrototype.get({id:data.product.prototypeId}, function(prototype) {
                            $rootScope.designerSpinner = false;
                            setupLayout(data, prototype);
                            if (!qaInitialized) {
                                $scope.quickArrangeCtrl.setupLayout(data, prototype);
                                qaInitialized = true;
                            }
                        });
                    });

                } else {
                    $rootScope.designerSpinner = true;
                    ProductPrototype.get({id:layoutViewData.product.prototypeId}, function(prototype) {
                        $rootScope.designerSpinner = false;
                        setupLayout(layoutViewData, prototype);
                        if (!qaInitialized) {
                            $scope.quickArrangeCtrl.setupLayout(layoutViewData, prototype);
                            qaInitialized = true;
                        }
                    });
                }
            }


            $scope.$on('$stateChangeSuccess',
                function(event, toState, toParams, fromState, fromParams) {

                    if (quickArrange) {
                        return;
                    }

                    var topState = toState.name.split('.')[0];
                    //console.log('topState', topState)

                    if (topState!=='layout') {
                        $scope.layoutVisible = false;
                        autoSaver.setEnabled(false);
                        return;
                    }

                    var productId = parseInt(toParams.productId);
                    var shouldLoad = ((fromState.name==='' && toState.name==='layout.arrange') || toState.name==='layout') &&
                        fromState.name!=='layout.pages' &&
                        fromState.name!=='layout.arrange';

                    if (fromState.name==='layout' && toState.name==='layout.pages') {
                        $scope.pagesCtrl.setupLayout(layoutViewData);
                    }

                    if (fromState.name==='' && toState.name==='layout.arrange') {
                        $timeout(function() {
                            $('.layout-quick-arrange').removeClass('slide-hide');
                        }, 200);
                    }

                    if (fromState.name==='layout' && toState.name==='layout.arrange') {
                        if (!qaInitialized) {
                            $scope.quickArrangeCtrl.setupLayout(layoutViewData, $scope.productPrototype);
                            qaInitialized = true;
                        } else {
                            $scope.quickArrangeCtrl.layoutController.renderAllDelayed();

                            var spread = layoutController.getCurrentSpread();
                            var r = _.findWhere($scope.quickArrangeCtrl.layoutController.renderers, {spread: spread});
                            if (r) {
                                $scope.quickArrangeCtrl.layoutController.setCurrentRenderer(r);
                                r.makeFirstVisible(0);
                            }
                        }
                    }

                    if (toState.name==='layout' && fromState.name==='layout.arrange') {
                        layoutController.renderAllDelayed();

                        var spread = $scope.quickArrangeCtrl.layoutController.getCurrentSpread();
                        var r = _.findWhere(layoutController.renderers, {spread: spread});
                        if (r) {
                            layoutController.setCurrentRenderer(r);
                            r.makeFirstVisible(0);
                        }
                    }

                    if (shouldLoad) {
                        loadLayout(productId);
                    } else {
                        $scope.layoutVisible = true;
                    }
            });

            this.setupLayout = setupLayout;
            this.layoutController = layoutController;

            var firstTimeQuickArrange = true;

            function refreshPrice() {
                Product.get({id:product.id}, function(result) {
                    if (result) {
                        $scope.product = $scope.currentProduct = result;
                    }
                });
            }

            function loadProducts() {
                if ($scope.isAdmin) {
                    Product.query({userId: $scope.product.user.id}, function(products) {
                        $scope.myProducts = products;
                        uiCtrl.updateProducts();
                    });
                } else {
                    Product.getMyProducts({state:'New'}, function(products) {
                        $scope.myProducts = products;
                        uiCtrl.updateProducts();
                    });
                }
            }

//--------------------------------------------------------------------------
//------------------------------- EVENTS -----------------------------------
//--------------------------------------------------------------------------

            function scrollToSpread(spread) {
                var r = _.findWhere(layoutController.renderers, {spread:spread});
                layoutController.setCurrentRenderer(r);
                r.makeFirstVisible(0);
            }

            function fireLayoutChangedEvent() {
                layoutController.fireEvent(LayoutEvent.LayoutChanged);
            }

            var fireLayoutChangedEventDebounced = $debounce(fireLayoutChangedEvent, 500);

            $scope.$on('layout:filmstrip-order-changed', function(e, args) {
                layout.viewState.filmstripFilter = 'custom';
            });

            $scope.$on('layout:images-dropped', function(e, args) {
                if (e.targetScope!==$scope) return;
                $('.layout').focus();
            });

            $scope.$on('layout:layout-changed', function(e, args) {
                if (e.targetScope!==$scope) {
                    //this event comes from quick arrange
                    return;
                }

                DataCacheService.clear(product.id);
                new PACE.CheckFramesOnSpread(layoutController).execute();

                //update stats
                uiCtrl.updateStatsDebounced();
                uiCtrl.updateFilmstripStatsDebounced();
                uiCtrl.checkSaveTemplateModesDebounced();

                if (layoutController.currentRenderer && coverLayouts &&
                    coverLayouts.indexOf(layoutController.currentRenderer.spreadInfo.layout)>=0) {
                    new PACE.FixCoverLayoutCommand(layoutController.currentRenderer.spreadInfo.layout).execute();
                    layoutController.currentRenderer.render();
                }

                if (quickArrange) {
                    $scope.$parent.$parent.autoSaver.setDirty();
                } else {
                    autoSaver.setDirty();
                }
            });

            $scope.$on('layout:find-image', function(e, imageFile) {
                if (e.targetScope!==$scope) return;
                var elements = _.flatten( _.pluck(layout.spreads, 'elements') );

                var el = _.find(elements, function(el) {
                    return el.imageFile && (el.imageFile===imageFile || el.imageFile.id===imageFile.id);
                });
                if (el) {
                    var r = layoutController.findRenderer(el);
                    if (r) {
                        r.makeFirstVisible();
                        layoutController.selectElements([el], true);
                        layoutController.currentTool = new PACE.SelectionTool(layoutController);
                        layoutController.currentEditor = new PACE.ImageEditor(layoutController);
                        layoutController.currentEditor.beginEdit();
                        layoutController.fireEvent('layout:current-editor-changed');
                    }
                }
            });

            $scope.$on('layout:current-renderer-changed', function(e, args) {
                if (e.targetScope!==$scope) return;
                $scope.currentSpread = layoutController.currentRenderer.spread;

                if (!$scope.model) $scope.model = {};
                $scope.model[(quickArrange ? 'qaSpread' : 'layoutSpread')] = $scope.currentSpread;

                uiCtrl.checkSaveTemplateModesDebounced();

                $scope.prooferComponentProps.currentSpread = $scope.currentSpread;
                $scope.prooferComponentProps = _.extend({}, $scope.prooferComponentProps);
            });

            $scope.$on('layout:selection-modified', function(e, args) {
                if (e.targetScope!==$scope) {
                    return;
                }

                TemplateService.cleanUpSpreadTemplate(
                    $scope.currentSpread,
                    layoutController.selectedElements,
                    $scope.layout);

                new PACE.CheckFramesOnSpread(layoutController).execute();

                uiCtrl.checkSaveTemplateModesDebounced();

                $scope.currentSpread.applyAutoFill = false;
                $scope.currentSpread.autoLayout = false;

                if (quickArrange) {
                    $scope.$parent.$parent.autoSaver.setDirty();
                } else {
                    autoSaver.setDirty();
                }
            });

            $scope.$on('layout:deleting-elements', function(e, args) {
                if (e.targetScope!==$scope) return;

                TemplateService.cleanUpSpreadTemplate(
                    $scope.currentSpread,
                    layoutController.selectedElements,
                    $scope.layout);
            });

            $scope.$on('layout:elements-deleted', function(e, args) {
                if (e.targetScope!==$scope) return;

                // reseting templates history
                var spreadIndex = Math.floor($scope.currentSpread.pageNumber / 2);
                $scope.layout.templatesHistory[spreadIndex] = [];

                // reset lastTemplateMode of currentSpread
                $scope.currentSpread.lastTemplateMode = null;

                if ($scope.currentSpread.elements.length === 0) {
                    // if there is no elements on the template
                    // then the current template should be deleted
                    delete $scope.currentSpread.template;
                    $scope.currentSpread.applyAutoFill = true;
                    $scope.currentSpread.autoLayout = true;
                } else {
                    $scope.currentSpread.applyAutoFill = false;
                    $scope.currentSpread.autoLayout = false;
                }

            });

            $scope.$on('layout:errors-added', function(e, args) {
                if (e.targetScope!==$scope) return;

                if ($scope.viewMode!=='bleed') {
                    $scope.viewMode = 'bleed';
                    $scope.viewModeChanged();
                }

                var renderer = _.findWhere(layoutController.renderers, {spread:args.spread});
                var render = renderer.spreadInfo.getLayoutWarningRenderFn(renderer.canvas);
                renderer.spreadInfo.layoutWarningAnimation = true;

                fabric.util.animate({
                    startValue: 0,
                    endValue: 1,
                    duration: 1000,
                    onChange: function(t) {
                        renderer.canvas.renderAll();
                        if (renderer.spreadInfo.lastLayoutWarningRenderFn)
                            renderer.spreadInfo.lastLayoutWarningRenderFn(1 - t);
                        render(t);
                    },
                    onComplete: function() {
                        renderer.spreadInfo.layoutWarningAnimation = false;
                    }
                });
            });

            $scope.$on('layout:errors-removed', function(e, args) {
                if (e.targetScope!==$scope) return;

                var renderer = _.findWhere(layoutController.renderers, {spread:args.spread});
                var render = renderer.spreadInfo.getLayoutWarningRenderFn(renderer.canvas);
                renderer.spreadInfo.layoutWarningAnimation = true;

                fabric.util.animate({
                    startValue: 1,
                    endValue: 0,
                    duration: 1000,
                    onChange: function(t) {
                        renderer.canvas.renderAll();
                        render(t);
                    },
                    onComplete: function() {
                        renderer.spreadInfo.layoutWarningAnimation = false;
                        renderer.spreadInfo.lastLayoutWarningRenderFn = null;
                    }
                });
            });

            $scope.$on('$stateChangeSuccess', function(e, toState, toParams, fromState, fromParams) {

                if (toState.name==='layout' && fromState.name==='layout.arrange') {
                    layoutController.renderAll();
                    if ($scope.model && $scope.model.qaSpread)
                        scrollToSpread($scope.model.qaSpread);

                    PACE.LayoutPageClass = $scope.viewModeIndex===1 ? PACE.BookPage : PACE.BookBleedPage;
                }

            });

            function refreshTextBoxes() {
                for (var i = 0; i < layoutController.renderers.length; i++) {
                    var elements = layoutController.renderers[i].spread.elements;
                    var textElements = _.filter(elements, function(el) { return el.type==='TextElement' || el.type==='SpineTextElement'});
                    if (textElements.length>0) {
                        layoutController.renderers[i].render();
                    }
                }
            }

            if (!PACE.FontsLoaded) {
                $scope.$on(FontEvent.FontsLoaded, refreshTextBoxes);
            }

            $scope.jobs = [];
            $scope.completedJobs = [];

            $scope.$on(NotificationEvent.NotificationReceived, function(event, notification) {
                if (quickArrange) return;

                if (notification.type==='IccProfileConverted') {
                    var image = JSON.parse(notification.body);
                    _.each(layout.filmStrip.items, function(item) {
                        if (item.image && item.image.id===image.id) {
                            _.extend(item.image, image);
                        }
                    });
                    layout.filmStrip._version = (layout.filmStrip._version || 0) + 1;
                    $scope.$apply();
                }

                if (notification.type==='JobProgress') {
                    var message = JSON.parse(notification.body);
                    if (message.jobType!=='GenerateAlbumPreviewTask') return;

                    var user = AuthService.getCurrentUser();
                    if (message.user && message.user.id!==user.id) return;

                    var job = _.findWhere($scope.completedJobs, {jobId:message.jobId});
                    if (job) return;

                    job = _.findWhere($scope.jobs, {jobId:message.jobId});
                    if (!job && message.progressPercent<100) {
                        job = message;
                        $scope.recentJob = job;
                        $scope.jobs.push(job);
                    }
                    if (message.progressPercent>job.progressPercent) {
                        job.progressPercent = message.progressPercent;
                        $scope.recentJob = job;
                    }
                    if (message.progressPercent===100 && message.isCompleted) {

                        $scope.completedJobs.push(job);
                        $scope.jobs = _.without($scope.jobs, job);
                        $scope.recentJob = null;

                        var user = AuthService.getCurrentUser();
                        MessageService.show('A link to your low resolution PDF will be emailed to '+ user.email +'.');

                        Product.get({id:product.id}, function(value) {
                            var attachment = _.findWhere(value.attachments, {type:'LowResPdf'});
                            if (attachment) {
                                $scope.lowResPdfUrl = StoreConfig.urlPrefix + attachment.url + '?v=' + _.now();
                            }
                        });
                    }
                    $scope.$apply();
                }

                if (notification.type==='CommentTyping') {
                    var comment = JSON.parse(notification.body);
                    layoutController.fireEvent('proofer:comment-typing', comment);
                }

                if (notification.type==='LayoutApproved') {
                    var settings = JSON.parse(notification.body);
                    if ($scope.prooferSettings && $scope.prooferSettings.id===settings.id) {
                        _.extend($scope.prooferSettings, settings);
                        $scope.prooferComponentProps = _.extend({}, $scope.prooferComponentProps);
                        $scope.$apply();
                    }
                }

            });

//--------------------------------------------------------------------------
//------------------------------ AUTO SAVE ---------------------------------
//--------------------------------------------------------------------------
            function onSave(layouts) {
                if (shouldRefreshPrice) {
                    shouldRefreshPrice = false;
                    refreshPrice();
                }
            }
//--------------------------------------------------------------------------
//--------------------------------- PAGES ----------------------------------
//--------------------------------------------------------------------------

            $scope.onPagesKeyUp = function(e) {
                switch(KeyboardService.getShortcut(e)) {
                    case 'DELETE':
                    case 'BACKSPACE':
                        $scope.deletePages();
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        break;
                }
            };

            $scope.onPagesMenuClick = function(key) {
                $scope[key]();
            };

            $scope.addPages2 = function() {
                var pageNumber;
                if ($scope.selectedPageIndices.length>0) {
                    pageNumber = $scope.selectedPageIndices[0] + 1;
                }
                $scope.addPages(pageNumber);
            }

            function showSpineTextWarning() {
                if (coverLayouts) {
                    var hasSpineText;
                    _.each(coverLayouts, function(coverLayout) {
                        var spineTexts  = _.filter(coverLayout.spreads[0].elements, {type:'SpineTextElement'});
                        if (spineTexts && spineTexts.length>0)
                            hasSpineText = true;
                    });

                    if (hasSpineText) {
                        var msg;
                        if (productPrototype.productPageType==='PageBased') {
                            msg = 'The number of pages has just been changed in your book. This has caused your spine width to change. Please check and confirm the size and position of your text.';
                        } else {
                            msg = 'The number of spreads has just been changed in your album. This has caused your spine width to change. Please check and confirm the size and position of your text.';
                        }
                        MessageService.ok(msg);
                    }
                }
            }

            $scope.addPages = function (pageNumber) {
                var dialogScope = $scope.$new(),
                    lastSpread = layout.spreads[layout.spreads.length - 1],
                    lastPageNumber = lastSpread.pageNumber + lastSpread.numPages - 1;

                dialogScope.productPageType = productPrototype.productPageType;
                dialogScope.pageNumber = pageNumber || layoutController.currentRenderer.spread.pageNumber;
                if (productPrototype.productPageType==='PageBased')
                    dialogScope.maxPages = Math.max(0, maxPages - lastPageNumber);
                else
                    dialogScope.maxPages = Math.max(0, (maxPages/2) - layout.spreads.length);

                dialogScope.addPages = function(numPages, location, pageNumber) {
                    var cmd = new PACE.AddPagesCommand(layout, numPages, location, pageNumber);
                    if (coverLayouts) {
                        var commands = [cmd];
                        _.each(coverLayouts, function(coverLayout) {
                            commands.push(new PACE.FixCoverLayoutCommand(coverLayout));
                        });
                        cmd = new PACE.MacroCommand(commands);

                        showSpineTextWarning();
                    }
                    cmd.execute();
                    layoutController.renderAll();
                    UndoService.pushUndo(cmd);
                    fireLayoutChangedEvent();
                };

                ngDialog.open({
                    template: 'views/layout/newPagePopup.html',
                    scope: dialogScope,
                    controller: 'NewPagePopupCtrl',
                    className: 'pace-modal pace-modal-dark pace-modal-pages'
                });
            };

            $scope.deletePages = function() {
                if (!$scope.selectedPageIndices || $scope.selectedPageIndices.length===0) return;

                var cmd = new PACE.DeletePagesCommand(layout, $scope.selectedPageIndices, minPages);
                if (coverLayouts) {
                    var commands = [cmd];
                    _.each(coverLayouts, function(coverLayout) {
                        commands.push(new PACE.FixCoverLayoutCommand(coverLayout));
                    });
                    cmd = new PACE.MacroCommand(commands);
                    showSpineTextWarning();
                }
                cmd.execute();
                $scope.selectedPageIndices.splice(0, $scope.selectedPageIndices.length);

                layoutController.renderAll();
                UndoService.pushUndo(cmd);
                shouldRefreshPrice = true;
                fireLayoutChangedEvent();
            };

            $scope.swapPages = function() {
                var cmd;
                if ($scope.canSwapSpreads) {
                    cmd = new PACE.MacroCommand([
                        new PACE.SwapPagesCommand(layout, [$scope.selectedPageIndices[0], $scope.selectedPageIndices[2]]),
                        new PACE.SwapPagesCommand(layout, [$scope.selectedPageIndices[1], $scope.selectedPageIndices[3]]),
                    ]);
                } else {
                    cmd = new PACE.SwapPagesCommand(layout, $scope.selectedPageIndices);
                }
                cmd.execute();
                layoutController.renderAll();
                UndoService.pushUndo(cmd);
                fireLayoutChangedEvent();
            };

            $scope.deletePagesOrSelection = function() {
                if (layoutController.selectedElements.length===0 && $scope.currentSpread) {
                    var pages = new PACE.SpreadInfoFactory().create($scope.currentSpread, layout).pages,
                        indices = _.map(pages, function(p) { return p.getPageNumber() - 1; });

                    var cmd = new PACE.DeletePagesCommand(layout, indices, minPages);
                    if (coverLayouts) {
                        var commands = [cmd];
                        _.each(coverLayouts, function(coverLayout) {
                            commands.push(new PACE.FixCoverLayoutCommand(coverLayout));
                        });
                        cmd = new PACE.MacroCommand(commands);
                    }
                    cmd.execute();
                    layoutController.renderAll();
                    UndoService.pushUndo(cmd);
                    shouldRefreshPrice = true;
                    fireLayoutChangedEvent();
                } else
                    processKeyShortcut('DELETE');
            };

//--------------------------------------------------------------------------
//-------------------- ADDITIONAL KEYBOARD SHORTCUTS -----------------------
//--------------------------------------------------------------------------
            var toggleViewModeCommand = function() {
                this.execute = function() {
                    $scope.viewMode = $scope.viewMode==='normal' ? 'bleed' : 'normal';
                    $scope.viewModeChanged();
                };
            };

            var toggleGridCommand = function() {
                this.execute = $scope.toggleGrid;
            };

            var toggleGuidesCommand = function() {
                this.execute = $scope.toggleGuides;
            };

            var toggleRulersCommand = function() {
                this.execute = $scope.toggleRulers;
            };

            var eyedropperCommand = function() {
                this.execute = function() {
                    if (layout.viewState.stylesViewIndex===1) {
                        $scope.$broadcast('background-eyedropper-tool');
                    } else if (layout.viewState.stylesViewIndex===3) {
                        $scope.$broadcast('font-eyedropper-tool');
                    }
                }
            };

            var postCommandActions = {
                'RIGHT': function () { $rootScope.$broadcast('tool-spread-right'); },
                'LEFT':  function () { $rootScope.$broadcast('tool-spread-left'); }
            };
            var spreadContextMap = {
                'UP':       { cmd: PACE.PageNavCommand, params:[-1] },
                'DOWN':     { cmd: PACE.PageNavCommand, params:[1] },
                'PAGEUP':   { cmd: PACE.PageNavCommand, params:[-1] },
                'PAGEDOWN': { cmd: PACE.PageNavCommand, params:[1] },
                'SHIFT+UP':       { cmd: PACE.PageNavCommand, params:[-5] },
                'SHIFT+DOWN':     { cmd: PACE.PageNavCommand, params:[5] },
                'SHIFT+PAGEUP':   { cmd: PACE.PageNavCommand, params:[-5] },
                'SHIFT+PAGEDOWN': { cmd: PACE.PageNavCommand, params:[5] },

                'SHIFT+RIGHT': { cmd: PACE.NextHistoryTemplateCommand, params:[$scope.recentlyUsedControl, 'right', false] },
                'ALT+RIGHT':   { cmd: PACE.NextHistoryTemplateCommand, params:[$scope.recentlyUsedControl, 'left', false] },
                'RIGHT':       { cmd: PACE.NextHistoryTemplateCommand, params:[$scope.recentlyUsedControl, 'spread', true] },

                'SHIFT+LEFT':  { cmd: PACE.PrevHistoryTemplateCommand, params:[$scope.recentlyUsedControl] },
                'ALT+LEFT':    { cmd: PACE.PrevHistoryTemplateCommand, params:[$scope.recentlyUsedControl] },
                'LEFT':        { cmd: PACE.PrevHistoryTemplateCommand, params:[$scope.recentlyUsedControl] }
            };
            var selectionContextMap = {
                'N': { cmd: PACE.ApplyToSelectionCommand, params:[PACE.FourSidedBleedCommand] },
                'B': { cmd: PACE.ApplyToSelectionCommand, params:[PACE.TwoSidedBleedCommand] },
                'I': { cmd: PACE.ApplyToSelectionCommand, params:[PACE.FillFrameAndCenterCommand] },
                'O': { cmd: PACE.ApplyToSelectionCommand, params:[PACE.FitFrameToContentCommand] },
                'S': { cmd: PACE.ApplyToSelectionCommand, params:[PACE.FloatingImageSmallCommand] },
                'M': { cmd: PACE.ApplyToSelectionCommand, params:[PACE.FloatingImageMediumCommand] },
                'L': { cmd: PACE.ApplyToSelectionCommand, params:[PACE.FloatingImageLargeCommand] },
                'D': { cmd: PACE.ApplyToSelectionCommand, params:[PACE.SpreadFourSidedBleedCommand] },
                'CTRL+ALT+SHIFT+C': { cmd: PACE.ApplyToSelectionCommand, params:[PACE.CenterContentCommand] },
                'C': { cmd: PACE.CenterSelectionCommand },
                'LEFT':  { cmd: PACE.MoveSelectionCommand, params:[{x:-LayoutSettings.arrowKeyOffset, y: 0}], anim: false, changeDelay:true },
                'RIGHT': { cmd: PACE.MoveSelectionCommand, params:[{x:LayoutSettings.arrowKeyOffset, y: 0}], anim: false, changeDelay:true },
                'UP':    { cmd: PACE.MoveSelectionCommand, params:[{x:0, y: -LayoutSettings.arrowKeyOffset}], anim: false, changeDelay:true },
                'DOWN':  { cmd: PACE.MoveSelectionCommand, params:[{x:0, y: LayoutSettings.arrowKeyOffset}], anim: false, changeDelay:true },
                'SHIFT+LEFT':  { cmd: PACE.MoveSelectionCommand, params:[{x:-LayoutSettings.shiftArrowKeyOffset, y: 0}], anim: false, changeDelay:true },
                'SHIFT+RIGHT': { cmd: PACE.MoveSelectionCommand, params:[{x:LayoutSettings.shiftArrowKeyOffset, y: 0}], anim: false, changeDelay:true },
                'SHIFT+UP':    { cmd: PACE.MoveSelectionCommand, params:[{x:0, y: -LayoutSettings.shiftArrowKeyOffset}], anim: false, changeDelay:true },
                'SHIFT+DOWN':  { cmd: PACE.MoveSelectionCommand, params:[{x:0, y: LayoutSettings.shiftArrowKeyOffset}], anim: false, changeDelay:true },
                'BACKSPACE':   { cmd: PACE.DeleteSelectionCommand },
                'DELETE':      { cmd: PACE.DeleteSelectionCommand },
                'X': { cmd: PACE.ApplyToSelectionCommand, params:[PACE.ResizeToRatio, 3/2]},
                '.': { cmd: PACE.ApplyToSelectionCommand, params:[PACE.ResizeToRatio, 3/2]},
                'Z': { cmd: PACE.ApplyToSelectionCommand, params:[PACE.ResizeToRatio, 1/1]},
                'Q': { cmd: PACE.FixGridCommand },
                'CTRL+ALT+SHIFT+]': { cmd: PACE.SelectionBringToFrontCommand, anim: false },
                'CTRL+ALT+]':       { cmd: PACE.SelectionBringForwardCommand, anim: false },
                'CTRL+ALT+[':       { cmd: PACE.SelectionSendBackwardCommand, anim: false },
                'CTRL+ALT+SHIFT+[': { cmd: PACE.SelectionSendToBackCommand, anim: false }
            };
            var globalContextMap = {
                'CTRL+A':      { cmd: PACE.SelectAllCommand },
                'CTRL+D':      { cmd: PACE.DeselectAllCommand },
                'CTRL+ALT+G':  { cmd: PACE.SelectAllGuidesCommand },
                'CTRL+Z': { cmd: PACE.UndoCommand },
                'CTRL+SHIFT+Z': { cmd: PACE.RedoCommand },
                'CTRL+C': { cmd: PACE.CopyCommand },
                'CTRL+V': { cmd: PACE.PasteCommand },
                '0': { cmd: PACE.ZoomToFitCommand, params:[$scope]},
                '=': { cmd: PACE.ZoomCommand, params:[$scope, true]},
                '-': { cmd: PACE.ZoomCommand, params:[$scope, false]},
                '1': { cmd: PACE.SwitchToolbarCommand, params:[$scope, 1]},
                '2': { cmd: PACE.SwitchToolbarCommand, params:[$scope, 2]},
                '3': { cmd: PACE.SwitchToolbarCommand, params:[$scope, 3]},
                '4': { cmd: PACE.SwitchToolbarCommand, params:[$scope, 4]},
                '5': { cmd: PACE.SwitchToolbarCommand, params:[$scope, 5]},
                'T': { cmd: PACE.ToggleToolCommand, params:[$scope, 'TextTool', 4]},
                'F': { cmd: PACE.ToggleToolCommand, params:[$scope, 'FrameTool', 2]},
                'K': { cmd: PACE.ToggleToolCommand, params:[$scope, 'CropTool', 1]},
                'SPACE': { cmd: PACE.ToggleToolCommand, params:[$scope, 'HandTool']},
                'W': { cmd: toggleViewModeCommand },
                "CTRL+'": { cmd: toggleGridCommand },
                'CTRL+;': { cmd: toggleGuidesCommand },
                'R': { cmd: toggleRulersCommand },
                'E': { cmd: eyedropperCommand }
            };

            var readOnlyShortcuts = [
                'UP', 'DOWN', 'PAGEUP', 'PAGEDOWN', 'SHIFT+UP', 'SHIFT+DOWN', 'SHIFT+PAGEUP', 'SHIFT+PAGEDOWN', 'SPACE', '0', '=', '0'
            ];

            var lockShortcuts = [
                'LEFT',
                'RIGHT',
                'UP',
                'DOWN',
                'SHIFT+LEFT',
                'SHIFT+RIGHT',
                'SHIFT+UP',
                'SHIFT+DOWN'
            ];

            function refreshCurrentEditor() {
                if (layoutController.currentEditor && layoutController.currentEditor.refresh) {
                    layoutController.currentEditor.refresh();
                }
            }

            function processKeyShortcut(shortcut, context) {
                if (!$scope.editable && readOnlyShortcuts.indexOf(shortcut)===-1) return;

                var hasSelection = (layoutController.selectedElements.length || layoutController.selectedGuides.length) && context!=='spread',
                    selectionModified = hasSelection && selectionContextMap[shortcut],
                    lockedSpread = layoutController.currentRenderer.spread.locked && selectionModified && lockShortcuts.indexOf(shortcut)>=0,
                    cmdInfo;

                var backgroundFrame = _.findWhere(layoutController.selectedElements, {type:'BackgroundFrameElement'});
                if (lockedSpread || (selectionModified && backgroundFrame && shortcut!=='DELETE' && shortcut!=='BACKSPACE')) {
                    return;
                }

                cmdInfo = (hasSelection ? selectionContextMap[shortcut] : spreadContextMap[shortcut]) || globalContextMap[shortcut];

                if (!cmdInfo) return false;

                var args = [null, layoutController];
                if (cmdInfo.params)
                    args = _.union(args, cmdInfo.params);

                var cmdInstance = new (Function.prototype.bind.apply(cmdInfo.cmd, args));
                cmdInstance.execute();

                if (cmdInstance.undo)
                    UndoService.pushUndo(cmdInstance);

                if (hasSelection && selectionModified) {
                    cmdInstance.renderer = layoutController.currentRenderer;
                    if (cmdInfo.anim===false) {
                        layoutController.currentRenderer.render();
                        refreshCurrentEditor();
                    } else {
                        layoutController.currentRenderer.renderWithAnimation(refreshCurrentEditor, refreshCurrentEditor);
                    }
                    if (cmdInfo.changeDelay) {
                        fireLayoutChangedEventDebounced();
                    } else {
                        fireLayoutChangedEvent();
                    }

                }
                var postAction = postCommandActions[shortcut];
                if (postAction) postAction();

                return true;
            }

            var prevShortcut;

            $scope.onKeyDown = function(e) {
                var activeElement = $(document.activeElement);
                if (activeElement.is('input') || activeElement.is('textarea')) return;

                if (layoutController.currentEditor instanceof PACE.TextEditor) return;

                var shortcut = KeyboardService.getShortcut(e);

                //ignore subsequent events
                if (shortcut==='SPACE' && shortcut===prevShortcut) return;

                if (shortcut==='BACKSPACE') {
                    //prevent from triggering the browser back arrow
                    e.preventDefault();
                    e.stopPropagation();
                }

                prevShortcut = shortcut;
                if (shortcut && processKeyShortcut(shortcut)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            };

            $scope.onKeyUp = function(e) {
                var shortcut = KeyboardService.getShortcut(e);
                if (shortcut==='SPACE' && layoutController.currentTool.type==='HandTool') {
                    layoutController.currentTool.exit();
                }
                prevShortcut = null;
            };

            $scope.shortcut = processKeyShortcut;

            $scope.spreadsCollapsed = false;
            $scope.collapseSpreads = function() {
                $scope.spreadsCollapsed = !$scope.spreadsCollapsed;
            };

//--------------------------------------------------------------------------
//------------------------------ INITIAL SETUP -----------------------------
//--------------------------------------------------------------------------
            //TODO: do not fire layout-changed event when the layout changes
            $scope.$watch('layout.viewState.rightTabIndex', function(val, oldVal) {
                if (!layoutController.currentRenderer) return;
                if (val===0 && layout.viewState) layout.viewState.stylesViewIndex=0;
                if (val!==oldVal) fireLayoutChangedEvent();
            });

            $scope.$watch('layout.viewState.stylesViewIndex', function(val, oldVal) {
                if (!layoutController.currentRenderer) return;
                if (val!==oldVal) fireLayoutChangedEvent();
            });

            $scope.$watchCollection('selectedPageIndices', function(value) {
                $scope.canSwapSpreads = false;
                $scope.canSwapPages = false;

                if (isSpreadBased && value.length===4) {
                    $scope.canSwapSpreads = true;
                }
                if (!isSpreadBased && value.length===2) {
                    $scope.canSwapPages = true;
                }
                if (!isSpreadBased && value.length===4) {
                    if ((value[1] - value[0]===1) &&
                        (value[3] - value[2]===1) &&
                        (value[0] % 2 !== 0) &&
                        (value[2] % 2 !== 0)) {
                        $scope.canSwapSpreads = true;
                    }
                }
            });

            $scope.$watch('layout.spreads.length', function(val) {
                if (layout && layout.spreads && layout.spreads.length>0) {
                    var lastSpread = layout.spreads[layout.spreads.length - 1],
                        lastPageNumber = lastSpread.pageNumber + lastSpread.numPages - 1;

                    $scope.canAddPages = lastPageNumber < maxPages;

                } else {
                    $scope.canAddPages = false;
                }
            });

            $scope.selectTool('select');

// -------------------------------------------------------------------------
//----------------------------------- TOUR ---------------------------------
//--------------------------------------------------------------------------

            var deregisterStartTour = $rootScope.$on(TourEvent.StartTour, function(event, data) {
                if (data.id === 'designerOverview' && !quickArrange) {
                    startDesignerOverviewTour(true);
                }
            });

            function startDesignerOverviewTour(forceStart) {
                $timeout(function() {
                    TourService.start({
                        id: 'designerOverview',
                        config: DesignerOverviewTourService.getConfig($scope, layoutController, layout),
                        forceStart: forceStart
                    });
                });
            }

            if (!quickArrange) {
                // startDesignerOverviewTour();
            }

            $scope.$on('$destroy', function() {
                if (deregisterStartTour) {
                    deregisterStartTour();
                }
            });


        }
    ])

    .controller('NewPagePopupCtrl', ['$scope', function ($scope) {

        var isPageBased = $scope.productPageType==='PageBased';

        $scope.isPageBased = isPageBased;
        $scope.pageOptions = [
                {label:'After ' + (isPageBased ? 'Page' : 'Spread'), value:0},
                {label:'Before ' + (isPageBased ? 'Page' : 'Spread'), value:1},
                {label:'At Start of Book', value:2},
                {label:'At End of Book', value:3},
            ];
        $scope.numPages = $scope.maxPages===0 ? 0 : (isPageBased ? 2 : 1);
        $scope.pageLocation = 0;
        if (!isPageBased) {
            $scope.pageNumber = Math.max(1, Math.round($scope.pageNumber/2) );
        }

        $scope.ok = function() {
            if (isPageBased) {
                $scope.addPages(Math.min($scope.maxPages, $scope.numPages), $scope.pageLocation, $scope.pageNumber);
            } else {
                $scope.addPages(Math.min($scope.maxPages * 2, $scope.numPages * 2), $scope.pageLocation, $scope.pageNumber * 2 - ($scope.pageLocation===1 ? 1 : 0))
            }
            return true;
        };

    }])

    .controller('SaveLayoutPopupCtrl', ['$scope', function($scope) {
        $scope.save = function() {
            $scope.setSaveLayoutDontShowAgain($scope.dontShowAgain);
            $scope.saveLayout();
            return true;
        };
    }]);
