'use strict';

angular.module('pace.order')

.directive('spoThumbnailWidget', ['Layout', '$q', 'BuildService', '$rootScope', 'SpoThumbnailService', 'PrintsConstants',
    'LayoutAutoSaveService', '$timeout', 'PrintsService', '$state', 'MessageService',
    function(Layout, $q, BuildService, $rootScope, SpoThumbnailService, PrintsConstants,
        LayoutAutoSaveService, $timeout, PrintsService, $state, MessageService) {
        return {
            template: 
                '<div class="spo-thumbnail-widget" title="">'+
                    '<react-component name="PrintsContainerComponent" props="props" watch-depth="reference"></react-component>'+
                '</div>',
            replace: true,
            restrict: 'E',
            scope: {
                product: '=',
                parentProduct: '=',
                editable: '=',
                restoreSelection: '=',
                adminMode: '='
            },
            link: function postLink($scope, $element, $attrs) {
                var container, 
                    layoutSizeOption,
                    currentImageIndex = 0;

                var layoutController = SpoThumbnailService.getLayoutController();
                
                var autoSaver = new LayoutAutoSaveService($scope, onLayoutSave);
                autoSaver.setEnabled(true);
            
                layoutController.scope.$on('layout:layout-changed', function(e, args) {
                    autoSaver.setDirty();
                });

                layoutController.scope.$on('prints:selection-cleared', onSelectionCleared);

                $scope.props = {
                    layoutController: layoutController,
                };

                var rect = $element[0].getBoundingClientRect();
                //console.log('spoThumbnailWidget', rect)

                var containerRect = {width:rect.width, height:rect.width};
                var recentSelectionInfo = SpoThumbnailService.getRecentSelectionInfo();
                var restoreSelection = $scope.product && recentSelectionInfo && 
                    recentSelectionInfo.containerId===$scope.product.layoutId;

                var shouldSelect = false;
                
                if (restoreSelection && $scope.restoreSelection) {
                    shouldSelect = true;
                    //console.log('restore selection', recentSelectionInfo);
                    //$element[0].scrollIntoView(true);
                }

                $element[0].parentNode.addEventListener('mousedown', onPanelClick);
                $element[0].parentNode.addEventListener('click', onPanelClick);
                
                $scope.$watch('product', function(product) {

                    var p1 = BuildService.getLayoutSizeOption(product),
                        p2 = Layout.get({id:product.layoutId}).$promise;
                    
                    $q.all([p1, p2]).then(function(result) {
                        layoutSizeOption = result[0];
                        container = result[1];
                        PrintsService.sortImages(container);
                        autoSaver.setLayouts([container]);

                        container._id = container._id || _.uniqueId('layout-') + _.now();

                        SpoThumbnailService.addContainer({
                            parentProduct: $scope.parentProduct,
                            container: container,
                            product: product,
                            refreshFn: refreshContainer
                        });

                        if (shouldSelect) {
                            currentImageIndex = recentSelectionInfo.imageIndex;
                            SpoThumbnailService.setSelectedContainer(container);
                            saveRecentSelectionInfo();
                            //$element[0].scrollIntoView(true);
                        }
                        refreshContainer();
                    });

                });

                $scope.$watch('product.options._quantity', function(val, oldVal) {
                    if (val===oldVal || !container) return;
                    updateImageQuantity();
                });

                $scope.$watch('product.options.size', function(val, oldVal) {
                    if (val===oldVal) return;
                    layoutController.fireEvent('prints:container-size-changed', val);  
                });

                $scope.$on('$destroy', function() {
                    if (!autoSaver) return;

                    $element[0].parentNode.removeEventListener('mousedown', onPanelClick);
                    $element[0].parentNode.removeEventListener('click', onPanelClick);

                    //autoSaver.destroy();
                    //SpoThumbnailService.removeContainer(container);
                    //autoSaver = null;
                });

                $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
                    if (autoSaver.isDirty() && !autoSaver.isSaving()) {
                        event.preventDefault();
                        
                        //console.log('layout changed, saving before switching state');

                        autoSaver.saveNow().then(function() {
                            $state.go(toState.name, toParams);
                            SpoThumbnailService.reset();
                            autoSaver.destroy();
                            autoSaver = null;
                        });
                    } else {
                        SpoThumbnailService.reset();
                        autoSaver.destroy();
                        autoSaver = null;
                    }
                });

                function onLayoutSave() {

                }

                function onPanelClick(e) {
                    if (SpoThumbnailService.getSelectedContainer()===container) return;

                    if (!$scope.editable) return;
                    
                    e.stopPropagation();
                    SpoThumbnailService.setSelectedContainer(container);
                    saveRecentSelectionInfo();
                    $scope.$apply();
                };

                function applyBorders(container, border) {
                    var renderer = _.find(layoutController.renderers, function(r) {
                        return r.layout._id === container._id;
                    });
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
                    autoSaver.setDirty();
                }

                $scope.$watch('product.options.borders', function(val, oldVal) {
                    if (val===oldVal) return;
                    
                    applyBorders(container, val);
                });

                function refreshContainer() {
                    $scope.props = {
                        layoutController: layoutController,
                        container: container,
                        elements: container.spreads,
                        product: $scope.product,
                        currentImageIndex: currentImageIndex,
                        layoutSizeOption: layoutSizeOption,
                        isSelected: container === SpoThumbnailService.getSelectedContainer(),
                        fillMode: 'single',
                        containerRect: containerRect,
                        step: 4,
                        isMiddle: false,
                        viewMode: 'thumbnail',
                        numContainers: 1,
                        onContainerSizeChange: onContainerSizeChange,
                        onContainerQuantityChange: onContainerQuantityChange,
                        onContainerClick: onContainerClick,
                        onCurrentImageChange: onCurrentImageChange,
                        onContainerRemoveClick: onContainerRemoveClick,
                        onImageRemoveClick: onImageRemoveClick,
                        editable: $scope.editable
                       //tweakZIndex: true
                    };
                    console.log('editable', $scope.editable)
                }

                function updateImageQuantity() {
                    var qty = _.reduce(container.spreads,
                        function(totalQty, spread) {
                            var q = spread.quantity || $scope.product.options._quantity;
                            return totalQty + q;
                        }, 0);

                    if (container.layoutSize.gridX>0) {
                        var numImagesInGrid = container.layoutSize.gridX * container.layoutSize.gridY;
                        qty = qty * numImagesInGrid;
                    }
                    $scope.product.options.imageQuantity = qty;
                    //console.log('imageQuantity', $scope.product.options.imageQuantity)
                }

                function onContainerSizeChange() {
                    autoSaver.setDirty();
                    SpoThumbnailService.sortContainers();
                }
                
                function onContainerQuantityChange() {
                    updateImageQuantity();
                    autoSaver.setDirty();
                }
                
                function onContainerClick(e) {
                    console.log('onContainerClick', e)
                }

                
                function onImageRemoveClick(e) {
                    var del = function() {
                        var layout = container,
                            idx = currentImageIndex;

                        layout.spreads.splice(idx, 1);
                        layout.spreads = layout.spreads.concat();
                        if (currentImageIndex>=layout.spreads.length) {
                            currentImageIndex = layout.spreads.length - 1;
                        }
                        refreshContainer();
                        updateImageQuantity();
                        
                         //trigger auto save
                        layoutController.fireEvent('layout:layout-changed');
                    };

                    if ($scope.adminMode) {
                        var msg = 'Do you really want to delete this photo?';
                        MessageService.confirm(msg, del);
                    } else {
                        del();
                    }
                }

                function onSelectionCleared() {
                    var selectedContainer = SpoThumbnailService.getSelectedContainer();
                    if (selectedContainer === container) {
                        var renderer = _.find(layoutController.renderers, function(r) {
                            return r.layout._id === container._id;
                        });
                        if (renderer && renderer.spread.elements.length>0) {
                            var canvasElement = renderer.spread.elements[0];
                            layoutController.selectElements([canvasElement], true);
                            layoutController.currentTool.beginEdit();
                        }
                    }
                }

                function saveRecentSelectionInfo() {
                    SpoThumbnailService.setRecentSelectionInfo({
                        containerId: container.id,
                        imageIndex: currentImageIndex
                    });
                }

                function onCurrentImageChange(container, idx) {
                    currentImageIndex = idx;
                    saveRecentSelectionInfo();
                }

                function onContainerRemoveClick() {
                    var del = function() {
                        var idx = $scope.parentProduct.children.indexOf($scope.product);
                        $scope.parentProduct.children.splice(idx, 1);
                        SpoThumbnailService.removeContainer(container);
                        idx = Math.max(0, idx - 1);
                        if (idx<$scope.parentProduct.children.length) {
                            var container = SpoThumbnailService.getContainerByProduct($scope.parentProduct.children[idx]);
                            SpoThumbnailService.setSelectedContainer(container);
                        } else {
                            SpoThumbnailService.setSelectedContainer(null);
                        }
                    };

                    var msg = 'Do you really want to delete this size';
                    if (container.spreads.length>0) {
                        msg += ' and all of its associated photos';
                    }
                    msg += '?';

                    MessageService.confirm(msg, del);
                }
            }
        };  
    }
])
.service('SpoThumbnailService', ['$rootScope', function($rootScope) {

    var containers = [],
        selectedContainer,
        layoutController,
        recentSelectionInfo;


    this.getLayoutController = function() {
        if (!layoutController) {
            var ctrlScope = $rootScope.$new();
            layoutController = new PACE.LayoutController(ctrlScope);
            layoutController.currentTool = new PACE.PrintsSelectionTool(layoutController);
        }
        return layoutController;
    };

    this.getSelectedContainer = function() {
        return selectedContainer;
    };

    this.setSelectedContainer = function(container) {
        selectedContainer = container;
        for (var i = 0; i < containers.length; i++) {
            containers[i].refreshFn();
        }
    };

    this.addContainer = function(containerInfo) {
        containers.push(containerInfo);
    };

    this.removeContainer = function(container) {
        for (var i = 0; i < containers.length; i++) {
            if (containers[i].container === container) {
                containers.splice(i, 1);
                break;
            }
        }
    };

    this.getContainerByProduct = function(product) {
        for (var i = 0; i < containers.length; i++) {
            if (containers[i].product === product) {
                return containers[i].container;
            }
        }  
    };

    this.reset = function() {
        if (!layoutController) return;
        layoutController.scope.$destroy();
        layoutController = null
        selectedContainer = null;
        containers = [];
    };

    this.setRecentSelectionInfo = function(info) {
        recentSelectionInfo = info;
        //console.log('recentSelectionInfo', info);
    };

    this.getRecentSelectionInfo = function() {
        return recentSelectionInfo;
    };

    this.sortContainers = function() {
        
        var result = _.sortBy(containers, function(container) {
            return container.container.layoutSize.height * 10000 + container.container.layoutSize.width;
        });
        for (var i = 0; i < result.length; i++) {
            result[i].product.childIndex = i;
        }
        return result;
        
    };

}]);
