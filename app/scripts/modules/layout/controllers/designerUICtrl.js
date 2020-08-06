'use strict';

angular.module('pace.layout')
.controller('DesignerUICtrl', ['$scope', 'Layout', 'Task', '$state', 'UndoService', 'LayoutEvent', 'SpreadToTemplateService',
	'LayoutTemplate', '$debounce', 'CommentTool', 'AuthService', '$rootScope', 'CartService',
	function ($scope, Layout, Task, $state, UndoService, LayoutEvent, SpreadToTemplateService,
		LayoutTemplate, $debounce, CommentTool, AuthService, $rootScope, CartService) {

		var layoutController = $scope.layoutController,
			autoSaver = $scope.autoSaver;

		$scope.warningOptions = [
            {
                name: 'All',
                value: 'all'
            },{
                name: 'Images',
                value: 'images'
            },{
                name: 'Bleeds',
                value: 'bleeds'
            },{
                name: 'Blanks',
                value: 'blanks'
            }
        ];

        $scope.selectedWarningOption = $scope.warningOptions[0].value;

        $scope.importPhotosOptions = [
            // {value: 'flickr', label: 'Flickr', labelPreIcon: 'flickr', rightLabel: '0', callback: function() {}},
            // {value: 'smugmug', label: 'SmugMug', labelPreIcon: 'smugmug', rightLabel: '50/55', callback: function() {}},
            // {value: 'zenfolio', label: 'Zenfolio', labelPreIcon: 'zenfolio', rightLabel: '0', callback: function() {}},
            {value: 'upload', label: 'Upload', labelPreIcon: 'hdd', rightLabel: '120/300', callback: function() {}}
        ];

        $scope.filterOptions = [
            {value: 'alphabetical', label: 'Alphabetical', labelPreIcon: 'filter', labelPreIconInvisible: true},
            {value: 'capture-time', label: 'Capture Time', labelPreIcon: 'filter', labelPreIconInvisible: true},
            {value: 'disabled', label: 'Disabled', labelPreIcon: 'filter', labelPreIconInvisible: true},
            {value: 'multiple-use', label: 'Multiple Use', labelPreIcon: 'filter', labelPreIconInvisible: true},
            {value: 'custom', label: 'My Order', labelPreIcon: 'filter', labelPreIconInvisible: true},
            {value: 'star-rating', label: 'Star Rating', labelPreIcon: 'filter', labelPreIconInvisible: true},
            {value: 'unused', label: 'Unused', labelPreIcon: 'filter', labelPreIconInvisible: true},
            {value: 'upload-order', label: 'Uploaded Order', labelPreIcon: 'filter', labelPreIconInvisible: true},
            //{value: 'camera-type', label: 'Camera Type', labelPreIcon: 'filter', labelPreIconInvisible: true},
            {value: 'admin', label: 'Album Order', labelPreIcon: 'filter', labelPreIconInvisible: true}
        ];

        $scope.zoomOptions = [
            {value: 'fit', label: 'Fit'},
            {value: 25, label: '25%'},
            {value: 50, label: '50%'},
            {value: 75, label: '75%'},
            {value: 100, label: '100%'},
            {value: 150, label: '150%'},
            {value: 200, label: '200%'}
        ];
        $scope.zoomOption = 'fit';

        $scope.flpTabIndex = 0;

        $scope.onFLPTabChange = function(index) {
            $scope.flpTabIndex = index;

            PACE.ProoferEnabled = index===1;
            layoutController.fireEvent('layout:proofer-enabled');
            layoutController.renderAllDelayed();
            if (index === 1) {
                $scope.model.selectedToolsetTop = 'tools2';
            } else {
                $scope.model.selectedToolsetTop = 'tools1';
            }
        };

        $scope.topToolsetChanged = function(index) {
            if (index===0) $scope.onFLPTabChange(1);
        };

//--------------------------------------------------------------------------
//-------------------------- STATS & PRODUCTS ------------------------------
//--------------------------------------------------------------------------
        function updateStats() {
        	var layout = $scope.layout;
            var pageBased = layout.pageType==='PageBased',
                spreadInfoFactory = new PACE.SpreadInfoFactory;

            $scope.stats = $scope.stats || {}
            $scope.stats.totalPages = (layout.spreads.length - (layout.lps ? 0 : 1)) * (pageBased ? 2 : 1);

            $scope.stats.usedPages = _.reduce(layout.spreads, function(count, spread) {
                var si = spreadInfoFactory.create(spread, layout),
                    usedPages = 0;
                if (pageBased) {
                    for (var i = si.pages.length - 1; i >= 0; i--) {
                        usedPages += (si.pages[i].getElements().length>0 ? 1 : 0);
                    };
                    return count + usedPages;
                } else {
                    return spread.elements.length > 0 ? count + 1 : count;
                }
            }, 0);
        }

        function updateFilmstripStats() {
        	var layout = $scope.layout,
        		coverLayouts = $scope.coverLayouts;
            new PACE.UpdateFilmstripStatsCommand(layout, coverLayouts).execute();
        }

        var updateFilmstripStatsDebounced = $debounce(updateFilmstripStats, 250);
        var updateStatsDebounced = $debounce(updateStats, 250);

        var saveUserSettings = function() {
            $scope.userSettings.$save();
        };
        var saveUserSettingsDebounced = $debounce(saveUserSettings, 2000);

        function updateProducts() {
            var result = [];
            var productInfo = function(value, indent, disabled) {
                var name = '';
                var details = null;

                if ($scope.isAdmin && value.productNumber) {
                    var info = [];
                    var secondaryInfo = [];

                    if (value.productNumber) {
                        if ($scope.isAdmin && value.batch && value.batch.name) {
                            info.push(value.batch.name + '-' + value.productNumber);
                        } else {
                            info.push(value.productNumber);
                        }
                    }

                    if (value.displayOptions.size) {
                        info.push(value.displayOptions.size);
                    }

                    if (value.displayOptions.productType) {
                        info.push(value.displayOptions.productType);
                    }

                    info.push(((value && value.options._name) ? value.options._name : ''));

                    name = info.join(' ');

                    if (value.displayOptions.bookMaterial) {
                        secondaryInfo.push(value.displayOptions.bookMaterial);
                    }

                    if (value.displayOptions.bookColour) {
                        secondaryInfo.push(value.displayOptions.bookColour);
                    }

                    details = secondaryInfo.join(' ');
                } else {
                    name = ((value && value.options._name) ? value.options._name : '');
                }

                return {
                    id: value.id,
                    name: name,
                    secondaryLabel: details,
                    labelPreIcon: 'projects',
                    indent: indent,
                    disabled: disabled
                };
            };

            _.each($scope.myProducts, function(product) {
                result.push(productInfo(product, false, !product.layoutId));

                if (product.productType !== 'SinglePrintProduct') {
                    _.each(product.children, function (child) {
                        result.push(productInfo(child, true,
                            (child.linkLayout && !product.layoutId) || (!child.linkLayout && !child.layoutId)));
                    });
                }
            });

            $scope.selectedProduct = $scope.product.id;
            $scope.products = result;
        }

        this.updateFilmstripStatsDebounced = updateFilmstripStatsDebounced;
        this.updateStatsDebounced = updateStatsDebounced;
        this.updateProducts = updateProducts;

        $scope.getJobInfo = function() {
            if (!$scope.currentProduct || !Object.keys($scope.currentProduct).length) {
                return '';
            }

            var info = [];

            if ($scope.currentProduct.productNumber) {
                if ($scope.isAdmin && $scope.currentProduct.batch && $scope.currentProduct.batch.name) {
                    info.push($scope.currentProduct.batch.name + '-' + $scope.currentProduct.productNumber);
                } else {
                    info.push($scope.currentProduct.productNumber);
                }
            }

            _.each(['size', 'productType', 'bookMaterial', 'bookColour'], function(prop) {
                var val = $scope.currentProduct.displayOptions[prop];
                if (val) info.push(val);
            });
            
            return info.join(' <span class="spacer-bullet">•</span> ');
        };

//--------------------------------------------------------------------------
//------------------------- USER & PRODUCT SEARCH --------------------------
//--------------------------------------------------------------------------

        $scope.searchUsers = function() {
            if ($scope.userQuery==='') return;
        };

        $scope.onUserSelected = function() {

            $scope.userQuery = $scope.selectedUser.name;
            $scope.currentProductName = '';
            Product.query({userId: $scope.selectedUser.id}, function(products) {
                $scope.myProducts = products;
                updateProducts();
            });

            $scope.selectedUser = null;
        };

        $scope.onUserSearchMouseUp = function(e) {
            e.stopPropagation();
        }



//--------------------------------------------------------------------------
//------------------------- TOOLBARS AND BUTTONS  --------------------------
//--------------------------------------------------------------------------

        function fireLayoutChangedEvent() {
            layoutController.fireEvent(LayoutEvent.LayoutChanged);
        }

        function duplicateAndConvert() {
            new PACE.DuplicateAndConvertCommand(layoutController, $scope.layout).execute();
        }

        function splitImages() {
            new PACE.SplitImagesCommand(layoutController, $scope.layout).execute();
        } 

        $scope.onBookMenuClick = function(key) {
            var fn = {
                duplicateAndConvert: duplicateAndConvert,
                splitImages: splitImages
            };
            if (fn[key]) fn[key]();
        };

        $scope.generateLowResPdf = function() {
            if ($scope.recentJob) return;

            $scope.recentJob = {progressPercent:0};
            $scope.lowResPdfUrl = null;

            var doStuff = function() {
                Task.generateLowResPdf({id:$scope.product.id}, function(response) {

                });
            };

            $scope.autoSaver.saveNow().then(doStuff);
        }

        $scope.selectProduct = function() {
            $state.go($state.current.name, {
                    productId: $scope.selectedProduct,
                    category: null,
                    name: null
                },
                { reload:true }
            );
        };

        $scope.viewModeChanged = function() {
            $scope.layout.viewMode = $scope.viewMode==='bleed' ? 1 : 0;
            PACE.LayoutPageClass = $scope.viewMode==='bleed' ? PACE.BookPage : PACE.BookBleedPage;

            _.invoke(layoutController.renderers, 'makePages');
            layoutController.renderAll();
            $scope.zoomChanged();

            autoSaver.setDirty();
        };

        $scope.clearSelection = function(e) {
            var target = $(e.target);
            if (target.hasClass('spread') || target.hasClass('canvas-wrapper')) {
                layoutController.clearSelection();
                layoutController.currentRenderer.clearSelection();
            }
        };

        $scope.showStyles = function() {
            $scope.layout.viewState.rightTabIndex = 1;
            $scope.layout.viewState.stylesViewIndex = 1;
        };

        $scope.switchToTextTool = function() {
            if (layoutController.currentTool.type!=='TextTool') {
                $scope.shortcut('T');
            }
        };

        $scope.switchToCommentTool = function() {
            if (layoutController.currentTool.type!=='CommentTool') {
                layoutController.clearSelection(true);
                layoutController.currentTool = new CommentTool(layoutController, AuthService.getCurrentUser(), true);
            } else {
                layoutController.currentTool.exit();
            }
        }

        $scope.zoomChanged = function() {
            if ($scope.zoomOption==='fit') {
                $scope.$emit('layout:scale-to-fit');
            } else {
                var scale = $scope.zoomOption/100;
                layoutController.setScaleWithDelay(scale);
            }
        };

        $scope.center = function() {
            var cmd = new PACE.CenterSelectionCommand(layoutController);
            cmd.execute();
            UndoService.pushUndo(cmd);
            layoutController.currentRenderer.renderWithAnimation();
        };

        $scope.selectSpread = function (spread) {
            var renderer = _.find(layoutController.renderers, function (renderer) {
                return renderer.spread && renderer.spread.id === spread.id;
            });

            if (renderer) {
                layoutController.setCurrentRenderer(renderer);
                return true;
            } else return false;
        };

        $scope.autoLayout = function (mode) {
            var cmd = new PACE.AutoLayoutSpreadCommand(
                layoutController.currentRenderer.spread,
                layoutController.currentRenderer.layout,
                layoutController,
                layoutController.currentRenderer,
                mode);

            cmd.execute();
            UndoService.pushUndo(cmd);

            var currentSpread = layoutController.getCurrentSpread();
            currentSpread.autoLayout = true;

            fireLayoutChangedEvent();
        };

        $scope.selectTool = function(tool) {
            var ctrl = $scope.layoutController;
            var tools = {
                select: PACE.SelectionTool,
                contentSelect: PACE.DirectSelectionTool,
                frame: PACE.FrameTool,
                crop: PACE.CropTool,
                text: PACE.TextTool
            };
            ctrl.currentTool = new tools[tool](ctrl);
            $scope.selectedTool = tool;
        };

        $scope.setSaveLayoutDontShowAgain = function(value) {
            $scope.saveLayoutDontShowAgain = value;
        };

        // $scope.scrollToId = function(id) {
        //     $location.hash(id);
        //     $anchorScroll();
        // };

        $scope.addToCart = function () {
            var product = $scope.product;

            var addToCartFn = function() {
                if (product.orderState!==null) {
                    $state.go('checkout.cart');
                } else {
                    CartService.addToCart([product]).then(
                        function (cart) {
                            $state.go('checkout.cart');
                        },
                        function (error) {
                            $rootScope.designerSpinner = false;
                        }
                    );
                }
            };

            $rootScope.designerSpinner = true;
            autoSaver.saveNow().then(addToCartFn);
        };

        $scope.onSwatchChange = function() {
            saveUserSettingsDebounced();
        };

        $scope.toggleFrameInfo = function() {
            $scope.layout.viewState.frameInfoVisible = !$scope.layout.viewState.frameInfoVisible;
        };

        $scope.toggleGridInfo = function() {
            $scope.layout.viewState.gridInfoVisible = !$scope.layout.viewState.gridInfoVisible;
        };

        $scope.publish = function() {
            Layout.publish($scope.layout, function(result) {
                console.log('layou published, rev', result.revision);
            });
        };

//--------------------------------------------------------------------------
//------------------------------- TEMPLATES --------------------------------
//--------------------------------------------------------------------------

        function checkSaveTemplateModes() {
            var spread = layoutController.getCurrentSpread() || layout.spreads[0];

            if (spread.elements.length>0) {
                var template = SpreadToTemplateService.getTemplate(spread, $scope.layout, 'spread');

                if (!template) {
                    $scope.saveTemplateDisabled = true;
                    $scope.saveTemplateOptions[0].isPrimary = true;
                    $scope.saveTemplateOptions[0].disabled = true;
                    $scope.saveTemplateOptions[1].disabled = true;
                    $scope.saveTemplateOptions[2].disabled = true;
                    return;
                }

                //console.log('checkSaveTemplateModes', template)
                $scope.saveTemplateDisabled = false;
                $scope.saveTemplateOptions[0].disabled = false;
                $scope.saveTemplateOptions[1].disabled = !template.left;
                $scope.saveTemplateOptions[2].disabled = !template.right;

                if (template.type==='TwoPageLayoutTemplate' && !(template.left && template.right)) {
                    $scope.saveTemplateOptions[0].isPrimary = false;
                    $scope.saveTemplateOptions[1].isPrimary = !!template.left;
                    $scope.saveTemplateOptions[2].isPrimary = !!template.right;
                } else {
                    $scope.saveTemplateOptions[0].isPrimary = true;
                    $scope.saveTemplateOptions[1].isPrimary = false;
                    $scope.saveTemplateOptions[2].isPrimary = false;
                }
            }
        }

        var checkSaveTemplateModesDebounced = $debounce(checkSaveTemplateModes, 100);

        this.checkSaveTemplateModesDebounced = checkSaveTemplateModesDebounced;

        function saveTemplate(mode) {
            var spread = layoutController.getCurrentSpread(),
                template = SpreadToTemplateService.getTemplate(spread, $scope.layout, 'spread');

            if (mode) {
                template = template[mode];
            }

            if ($scope.recentlyUsedControl.pushSavedLayoutTemplate(template)) {
                var lt = new LayoutTemplate.newLayoutTemplate(angular.copy(template));
                lt.$save(function(value) {
                    template.id = value.id;
                    template.version = value.version;
                    console.log('saved template', template);
                });
            }
            layoutController.fireEvent('layout:layout-saved', template);
        }

        $scope.saveTemplateOptions = [{
                isPrimary: true,
                value: 'saveSpread',
                label: 'Save Spread',
                labelPreIcon: 'save-small-flat',
                callback: saveTemplate.bind(null)
            },
            {
                value: 'saveLeft',
                label: 'Save Left Page',
                labelPreIcon: 'save-small-flat',
                callback: saveTemplate.bind(null, 'left')
            },
            {
                value: 'saveRight',
                label: 'Save Right Page',
                labelPreIcon: 'save-small-flat',
                callback: saveTemplate.bind(null, 'right')
            }
        ];

//--------------------------------------------------------------------------
//-------------------------------- RULERS ----------------------------------
//--------------------------------------------------------------------------

        $scope.toggleRulers = function() {
            $scope.layout.viewState.rulersVisible = !$scope.layout.viewState.rulersVisible;
            //force rulers to refresh;
            $timeout(function() {
                layoutController.fireEvent('layout:scale-changed');
            });
            autoSaver.setDirty();
        };

        $scope.onRulerDrag = function (orientation, event) {
            var ctrl = $scope.layoutController;

            if(!(ctrl.currentTool instanceof PACE.FixedGuideTool)) {
                ctrl.currentTool = new PACE.FixedGuideTool(ctrl, orientation);
                ctrl.deselectGuides();
            }

            if (!layout.viewState.rulersVisible) {
                $scope.toggleRulers();
            }

            if (!layout.viewState.guidesVisible) {
                $scope.toggleGuides();
            }
        };

        $scope.onRulerDragEnd = function (orientation, event) {
            var ctrl = $scope.layoutController;

            if(ctrl.currentTool instanceof PACE.FixedGuideTool) {
                ctrl.currentTool.onExit();
            }
        };

//--------------------------------------------------------------------------
//---------------------------- GRID  & GUIDES ------------------------------
//--------------------------------------------------------------------------

        $scope.toggleGrid = function() {
            $scope.layout.viewState.gridVisible = !$scope.layout.viewState.gridVisible;
            autoSaver.setDirty();
            layoutController.renderAll();
            layoutController.snappingService.endSnapping(layoutController);
            layoutController.snappingService.beginSnapping(layoutController);
        };

        $scope.toggleGuides = function() {
            $scope.layout.viewState.guidesVisible = !$scope.layout.viewState.guidesVisible;
            autoSaver.setDirty();
            layoutController.renderAll();
            layoutController.snappingService.endSnapping(layoutController);
            layoutController.snappingService.beginSnapping(layoutController);
        };

        $scope.toggleEdits = function(type) {
            if ((type === 'pending' && $scope.model.toolbarEdits === 'pending') || (type === 'completed' && $scope.model.toolbarEdits === 'completed')) {
                $scope.model.toolbarEdits = null;
                layoutController.fireEvent('proofer:filter-clicked', 'all');
            } else if (type === 'pending') {
                $scope.model.toolbarEdits = 'pending';
                layoutController.fireEvent('proofer:filter-clicked', 'pending');
            } else if (type === 'completed') {
                $scope.model.toolbarEdits = 'completed';
                layoutController.fireEvent('proofer:filter-clicked', 'completed');
            }
        };

	}
]);
