'use strict';

angular.module('pace.build')

.controller('CameoViewCtrl', [
            '$scope', 'sectionItem', '$state', 'coverLayout', 'product', 'productPrototype',
            'secondaryOption', '_', 'BuildService', 'Layout', '$timeout', 'Page', 'GeomService', 'ProductService',
            'Cameo', 'DebossingService', '$sce', 'CameoSelectionTool', 'section', 'nextSection', 'optionVisibilityFilter',
            'SnappingService', 'MessageService', 'sections',
    function ($scope, sectionItem, $state, coverLayout, product, productPrototype, 
              secondaryOption, _, BuildService, Layout, $timeout, Page, GeomService, ProductService,
              Cameo, DebossingService, $sce, CameoSelectionTool, section, nextSection, optionVisibilityFilter,
              SnappingService, MessageService, sections) {

        SnappingService.enableSmartPageGuides = false;
        SnappingService.enableSmartEdgeGuides = false;

    	var layoutController = new PACE.LayoutController($scope),
            optionCode = sectionItem.prototypeProductOption.effectiveCode,
            prototypeProductOption = productPrototype.getPrototypeProductOption(optionCode),
            coverPage = Page.RIGHT,
            params = sectionItem.params || {};

        $scope.layoutController = layoutController;
        $scope.product = product;
        $scope.productPrototype = productPrototype;
        $scope.coverLayout = $scope.model.coverLayout = coverLayout;
        $scope.model.cameoViewCtrl = this;

        $scope.mode = 'CoverRight';

        function createCameoSetElement(cameo) {
            var currentOption = product.options[optionCode],
                currentShapes = currentOption ? currentOption.shapes : null;
            
            var option = { 
                type: 'CameoSetElement', 
                shapes: [],
                positionCode: cameo.code
            };

            for (var i = 0; i < cameo.shapes.length; i++) {
                var shape = _.extend(cameo.shapes[i], 
                    {
                        type:'CameoElement',
                        opacity: 1,
                        imageRotation: 0,
                        rotation: 0,
                        locked: true,
                    }
                );
                if (currentShapes && i<currentShapes.length) {
                    _.extend(shape, _.pick(currentShapes[i], '_id', 'imageFile', 'imageX', 'imageY', 'imageWidth', 'imageHeight'));

                    var oldRatio = currentShapes[i].width / currentShapes[i].height,
                        newRatio = shape.width / shape.height,
                        keepCrop = GeomService.equals(oldRatio, newRatio, 0.1);
                    if (!keepCrop) {
                        new PACE.FillFrameCommand(shape).execute();
                        new PACE.CenterContentCommand(shape).execute();
                    }
                    new PACE.FixContentInFrame(shape, PACE.StoreConfig.cameoBleed).execute();
                }
                option.shapes.push(shape);
            }
            return option;
        }

        function checkCameo(showError) {
            var cameo = product.options[optionCode];
            if (cameo) {
                //check if images has been selected
                var images = _.filter(cameo.shapes, function(el) {
                    return !!el.imageFile;
                });
                var numMissingImages = cameo.shapes.length - images.length;
                if (numMissingImages>0) {
                    var msg = numMissingImages===1 ? 'Please upload an image for your cameo to continue.' :
                        'Please upload images for your cameos to continue.';
                    if (showError) MessageService.ask(msg, 'alert', null, false, 3000);
                    return false;
                }
            }
            return true;
        }

        function clearOption() {
            product.options[optionCode] = null;
            layoutController.refreshCoverPreview();
        }

        $scope.selectCameo = function(cameo) {
            if (layoutController.selectedElements.length>0) {
                layoutController.clearSelection(true);
            }
            var option = createCameoSetElement(cameo);
            product.options[optionCode] = option;
            
            if (params.resetOptions) {
                _.each(params.resetOptions, function(opt) {
                    product.options[opt] = null;
                });
            }
            layoutController.refreshCoverPreview();
            $scope.model.selectedCameo = cameo;
        };

        $scope.onKeyPress = function(e) {
            var idx = $scope.model.cameos.indexOf($scope.model.selectedCameo);
            if (e.keyCode===39) {
                idx++;
            } else if (e.keyCode===37) {
                idx--;
            }
            idx = Math.max(0, Math.min($scope.model.cameos.length-1, idx));
            $scope.selectCameo($scope.model.cameos[idx]);
        };

        this.selectCameo = $scope.selectCameo;
        layoutController.currentTool = new CameoSelectionTool(layoutController, product, optionCode);

        $scope.$on('build-back-click', function() {
            if (!checkCameo(false)) {
                clearOption();
            }
            //$state.go('^');
            history.back();
        });

        $scope.$on('build-next-click', function() {
            if (!checkCameo(true)) return;
            BuildService.goToNextWizardStep(sectionItem, section, sections, productPrototype, product);
        });

        $scope.$on('build-remove-optional-addon-click', function() {
            $scope.model.sidebarAnimation = 'right';
            clearOption();
            $state.go('^');
        });

        $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            if (!checkCameo(false)) {
                clearOption();
                //event.preventDefault();
            }
        });

        $timeout(function() {
            if (!product.options[optionCode] && $scope.model.cameos.length>0) {
                $scope.selectCameo($scope.model.cameos[0]);
            }
        });

        $('.position-slider').focus();
    }
])

.controller('CameoSidebarCtrl', [
    '$scope', 'sectionItem', '$state', 'coverLayout', 'product', 'productPrototype',
    '_', 'Cameo', 'GeomService', '$sce', 'section', 'nextSection', 'BuildService', 'DebossingService',
    function ($scope, sectionItem, $state, coverLayout, product, productPrototype, 
              _, Cameo, GeomService, $sce, section, nextSection, BuildService, DebossingService) {


        var optionCode = sectionItem.prototypeProductOption.effectiveCode,
            prototypeProductOption = productPrototype.getPrototypeProductOption(optionCode);

    	$scope.model.label = sectionItem.displayLabel;
        $scope.model.description = sectionItem.displayPrompt;
        $scope.model.optionalAddOn = !prototypeProductOption.isRequired;

        $scope.numWindowsOptions = [
            { value:'all', label:'All'},
            { value:1, label:'1'},
            { value:2, label:'2'},
        ];
        $scope.numWindows = 'all';

        $scope.shapeOptions = [
            { value:'all', label:'All'},
            { value:'horizontal', label:'Landscape'},
            { value:'square', label:'Square'},
            { value:'vertical', label:'Vertical'},
        ];
        $scope.shape = 'all';

        $scope.sizeOptions = [
            { value:'all', label:'All'},
            { value:'large', label:'Large'},
            { value:'medium', label:'Medium'},
            { value:'small', label:'Small'},
        ];
        $scope.size = 'all';

        $scope.positionOptions = [];
        $scope.position = 'all';

        function cameoFilter(item) {
            var tags = (item.tags || "").split(','),
                result = true;
            if ($scope.numWindows!=='all' && item.shapes && item.shapes.length!==$scope.numWindows)
                result = false;
            if ($scope.size!=='all' && tags.indexOf($scope.size)===-1)
                result = false;
            if ($scope.shape!=='all' && tags.indexOf($scope.shape)===-1)
                result = false;

            return result;
        }

        function cameoRank(item) {
            //cameo order - num windows, position (oc,cr,br), shape
            var weights = {
                'square': 1000,
                'horizontal': 1100,
                'vertical': 1200,
                'oc': 10,
                'cr': 11,
                'br': 12
            };
            var weight = _.reduce(item.tags.split(','), function(val, tag) {
                return (val + (weights[tag] || 0));
            }, 0);
            var rank = (item.shapes.length * 10000) + weight;
            return rank;
        }

        var cameos = DebossingService.getCameos(productPrototype, product, optionCode);

        var maxSize = 75;
        var canvasSize = GeomService.fitRect(coverLayout.layoutSize, {width: maxSize, height: maxSize}),
            scale = canvasSize.width/coverLayout.layoutSize.width;
        _.each(cameos, function(cameo) {
            var framesHtml = _.map(cameo.shapes, function(f) {
                var span = '<span class="cameo-window" style="position:absolute;'+
                    'width:'+Math.round(f.width * scale)+'px;'+
                    'height:'+Math.round(f.height * scale)+'px;';
                if (f.left) span += 'left:'+Math.round(f.left*scale)+'px;';
                if (f.top) span += 'top:'+Math.round(f.top*scale)+'px;';
                if (f.right) span += 'right:'+Math.round(f.right*scale)+'px;';
                if (f.bottom) span += 'bottom:'+Math.round(f.bottom*scale)+'px;';
                if (_.isNumber(f.centerX)) span += 'left:' + Math.round(canvasSize.width/2 - (f.width * scale)/2 + (f.centerX * scale) - 1) + 'px;';
                if (_.isNumber(f.centerY)) span += 'top:' + Math.round(canvasSize.height/2 - (f.height * scale)/2 + (f.centerY * scale) - 1) + 'px;';
                span += '"></span>';

                return span;
            }).join('');
            
            cameo.previewHtml = $sce.trustAsHtml('<div class="cameo-window" style="display:inline-block;position:relative;width:'+
                Math.round(canvasSize.width) + 'px;height:' + Math.round(canvasSize.height) + 'px;margin-top:' + 
                ((maxSize - canvasSize.height)/2 + 10) + 'px">' + 
                framesHtml + '</div>'); 
        });
        
        $scope.filter = function() {
            $scope.model.cameos = _.sortBy( _.filter(cameos, cameoFilter), cameoRank );
        };

        $scope.filter();

        var currentCamoe = product.options[optionCode];
        if (currentCamoe && currentCamoe.type==='CameoSetElement' && currentCamoe.positionCode) {
            $scope.model.selectedCameo = _.findWhere($scope.model.cameos, {code:currentCamoe.positionCode});
        }
    }
])

.factory('CameoSelectionTool', ['ImageUploadService', 'MessageService', 'UploadEvent', '$timeout', 'ThumbnailMaker',
    function(ImageUploadService, MessageService, UploadEvent, $timeout, ThumbnailMaker) {

        return function CameoSelectionTool(layoutController, product, optionCode) {

            var ctrl = this.layoutController = layoutController;
            ctrl.setSelectionEnabled(true);
            ctrl.getVisibleRenderers = function() { return [ctrl.renderers[0]] };

            this.onKeyDown = function(e) {
                if (e.keyCode===8 && ctrl.selectedElements.length===1 && ctrl.selectedElements[0].type==='CameoElement') {
                    var el = ctrl.selectedElements[0].originalElement;
                    ctrl.clearSelection(true);
                    el.imageFile = null;
                    layoutController.refreshCoverPreview();
                }
            };

            this.onMouseUp = function(layoutRenderer, options) {
                if (options.target && options.target && 
                    options.target.element.type==='CameoElement' && 
                    !options.target.element.imageFile) {
                    
                    //open upload dialog
                    var input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/jpeg';
                    input.style.display = 'none';
                    document.body.appendChild(input);
                    input.onchange = function(e) {
                        checkImageAndUpload(options.target.element.originalElement, input.files[0]);
                        document.body.removeChild(input);
                    };
                    input.click();
                }
            }

            this.onObjectSelected = function(layoutRenderer, options) {

                //console.log('onObjectSelected', options.target)
                if (ctrl.currentRenderer && ctrl.currentRenderer !== layoutRenderer) {
                    ctrl.currentRenderer.clearSelection();
                }

                if (options.target && options.target.element && 
                    options.target.element.type==='CameoElement' &&
                    options.target.element.imageFile) {

                    ctrl.setCurrentRenderer(layoutRenderer);
                    ctrl.selectElements( [options.target.element], false );

                    var element = ctrl.selectedElements[0];

                    var cameos = _.filter(layoutRenderer.canvas.getObjects(), function(obj) {
                        return obj.element && obj.element.type==='CameoElement';
                    });

                    var options = {
                        bleed: PACE.StoreConfig.cameoBleed
                    };
                    
                    ctrl.currentEditor = new PACE.ImageEditor(ctrl, options);
                    ctrl.currentEditor.moveEnabled = false;
                    ctrl.currentEditor.swapEnabled = cameos.length>1;
                    ctrl.currentEditor.beginEdit();
                    
                    ctrl.fireEvent('layout:current-editor-changed');
                    ctrl.fireEvent('layout:selection-modified');
                    
                } else {
                    ctrl.currentRenderer.clearSelection();
                }

            };

            function findTarget(renderer, e) {
                //console.log('findTarget', e.e)
                var mousePos = renderer.canvas.getPointer(e);
                var objects = renderer.canvas.getObjects();
                for (var i = objects.length - 1; i >= 0; i--) {
                    var object = objects[i],
                        m = object.getGlobalMatrix();
                    m.invert();
                    var localMousePos = m.transformPoint(mousePos.x, mousePos.y);

                    if (object.element.type==='CameoElement' && localMousePos.x>=0 && localMousePos.y>=0 &&
                        localMousePos.x<=object.width && localMousePos.y<=object.height) {
                        return object;
                    }
                }
                return null;
            }

            var settings = {
                swapFillStyle: 'rgba(119, 210, 246, 0.5)'
            };

            var imageReplaceIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFQAAAAOCAYAAACxfjtQAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAg1JREFUeNrsV91xwjAMdmgXMCOkI6Qj0BHSEegI4YleeAojwAhmBBghjEBGCCOkcU9pv6p2rBDKQw/dfZcLsn7sfLJE1DSNulCWLVbqLj8kGnGg1vD9fqjXPVA14FB1ixjezy0qtibx2B49eu6j818J8jgG8p2BvwPzyffynac90B5IZRnwY2EcdnULTXrd479PbyDGniDJI/HoE0+cEnI1njV6ciWmPwjX2S8dEZ7pS2/YmifSTwEuvcW6RdpiDowNSUrPzKGzFVCSH4yzIF3i2AvmeVYCZoXYmwvXGwd7DLEUGag99j59DX5NgKEpsM3nq/HYxoG9fGLi6NxDZEV36KWiCWPkMGBtRux7g3sS71+by6vHtpIEmLDDzG94mDFt6OAoyRk8Qx8kFZa6ppLdUkM6s7JPBn4gDXmmX8Qgqi5ZA/gLuC7yk6cp1aDnJX8CNKx0+0o+o7Vd6RbMNh2wfwN5drlae/XoYGbfHBVdoTxfiZ328t852DUNMG5Lek1luBPG7hrXyfH7GmImgpFKUdzf1wM1FamMZSiyp2CMubQpKUGziJFF4KOEpqiAcb74WtKU+GAe9eCasqCncYwuHEMbXczsM2AVjlcLuFutvNB7A/ei9VW0qNmI54qj8XTzG9yhe88YMwsM9noAQ32y6Rn/NozNpcO+EMSZ87+e+cjO/Z8ER7pKavQhwADZ48rmvDlt4gAAAABJRU5ErkJggg==';

            var replaceIcon = new Image();
            replaceIcon.src = imageReplaceIcon;

            function uploadImage(element, file) {
                var imageFiles = ImageUploadService.uploadImages([file]),
                    image = imageFiles[0];

                console.log('Uploading file ' + image.filename);

                image.promise.then(function(value) {
                    console.log('file ' + value.filename + ' complete');
                }, function(err) {
                    
                    MessageService.error(err.error);
                    
                }, function(event) { 

                    if (event.type === UploadEvent.ThumbnailReady) {

                        // element.imageFile = image;
                        // new PACE.FillFrameCommand(element).execute();
                        // new PACE.CenterContentCommand(element).execute();
                        // layoutController.refreshCoverPreview();

                        //generate better quality preview
                        var promise = ThumbnailMaker.makeThumbnail(image.file, image.file.type, 1000);
                        promise.then(function(value) {

                            image.thumbnailAsBase64 = 'data:' + image.file.type + ';base64,' + value;
                            element.imageFile = image;
                            new PACE.FillFrameCommand(element).execute();
                            new PACE.CenterContentCommand(element).execute();
                            new PACE.FixContentInFrame(element, PACE.StoreConfig.cameoBleed).execute();
                            layoutController.refreshCoverPreview();

                        });
                        
                    }
                    
                });
            }

            function checkImageAndUpload(element, file) {
                var cameoSet = product.options[optionCode];
                var cameo = _.find(cameoSet.shapes, function(item) {
                    return item.imageFile && file.name===item.imageFile.filename;
                });
                if (cameo) {
                    var msg = 'This image has already been uploaded for another cameo window. Do you really want to use it again?';
                    MessageService.confirm(msg, function() {
                        uploadImage(element, file);
                    });
                } else {
                    uploadImage(element, file);
                }
            }

            function drawAddReplaceOverlay(renderer, e) {
                var canvas = renderer.canvas,
                    ctx = canvas.getSelectionContext();
                
                var target = findTarget(renderer, e);
                dropTarget = target;
                if (!target) {
                    dropMode = null;
                    return null;
                }

                var isEmptyFrame = !target.element.imageFile;
                    
                var matrix = target.getGlobalMatrix(),
                    mid1 = matrix.transformPoint(target.width/2, target.height/2),
                    topLeft = matrix.transformPoint(0,0);
                    
                matrix.invert();
                var mousePos = canvas.getPointer(e);
                mousePos = matrix.transformPoint(mousePos.x, mousePos.y);

                dropMode = 'replace-' + target.element._id;
                
                return function(t) {
                    ctx.save();
                    ctx.setTransform(1,0,0,1,0,0);
                    ctx.translate(topLeft.x, topLeft.y);
                    ctx.rotate(target.angle * Math.PI/180);

                    ctx.globalAlpha = t;

                    ctx.fillStyle = settings.swapFillStyle;
                    ctx.fillRect(0, 0, target.width*target.scaleX, target.height*target.scaleY);
                        
                    if (!isEmptyFrame) {
                        ctx.setTransform(1,0,0,1,0,0);
                        ctx.drawImage(replaceIcon, Math.round(mid1.x - replaceIcon.width/2), Math.round(mid1.y - replaceIcon.height/2));
                    }
                
                    ctx.restore();
                };
            }

            function clearCanvas(renderer) {
                var canvas = renderer.canvas,
                    ctx = canvas.getSelectionContext();
                    
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            function doTransition(renderer, drawFn) {
                prevDrawFn = currentDrawFn;
                currentDrawFn = drawFn;

                fabric.util.animate({
                    startValue: 0,
                    endValue: 1,
                    duration: 300,
                    onChange: function(value) {
                        clearCanvas(renderer);
                        if (prevDrawFn) prevDrawFn(1 - value);
                        if (currentDrawFn) currentDrawFn(value);
                    }
                });
            }

            var dropTarget, dropMode, currentDrawFn, prevDrawFn;

            this.onDragEnter =  function(layoutRenderer, e) {
                var dt = e.dataTransfer;
                if (PACE.utils.containsDragType(dt.types, 'Files')) {
                     //&& dt.items && 
                    //(dt.items[0].type==='image/jpeg' || dt.items[0].type==='image/png')) {
                    e.preventDefault();
                    dt.dropEffect = 'copy';
                } else {
                    dt.dropEffect = 'none';
                }
            };

            this.onDragOver = function(layoutRenderer, e) {
                var dt = e.dataTransfer;
                if (PACE.utils.containsDragType(dt.types, 'Files')) {
                    e.preventDefault();

                    dropTarget = findTarget(layoutRenderer, e);

                    var prevDropMode = dropMode,
                        drawFn;

                    if (dropTarget) {
                        drawFn = drawAddReplaceOverlay(layoutRenderer, e);
                        dt.dropEffect = 'copy';
                    } else {
                        drawFn = null;
                        dropMode = null;
                        dt.dropEffect = 'none';
                    }

                    if (dropMode!==prevDropMode) {
                        doTransition(layoutRenderer, drawFn);
                    }
                }
            };

            this.onDragLeave = function(renderer, e) {
                dropMode = null;
                doTransition(renderer, null);
                setTimeout(function() {
                    layoutController.currentTool = new CameoSelectionTool(layoutController, product, optionCode);
                });
            };

            this.onDrop = function(layoutRenderer, e) {
                var dt = e.dataTransfer;
                if (dropTarget && dt.files && dt.files.length>0) {
                    var el = dropTarget.element.originalElement;
                    console.log(dt.files[0]);
                    var type = dt.files[0].type;
                    if (type!=='image/jpeg' && type!=='image/png') {
                        MessageService.error('Only JPEG and PNG files are allowed.');
                        dropMode = null;
                        doTransition(layoutRenderer, null);
                    } else {
                        checkImageAndUpload(el, dt.files[0]);
                    }

                }
                setTimeout(function() {
                    layoutController.currentTool = new CameoSelectionTool(layoutController, product, optionCode);
                });
            };


        };  

    }
]);