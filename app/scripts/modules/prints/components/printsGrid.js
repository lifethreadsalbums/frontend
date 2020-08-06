angular.module('pace.order')
.factory('PrintsGridComponent', ['$state', '$controller', 'StoreConfig', 'AngularDropdownComponent', 'GeomService',
    'PaceTooltipService', 'TextEditorService', 'SpreadToolbarService', 'AngularSliderButtonComponent', 'optionVisibilityFilter',
    function($state, $controller, StoreConfig, AngularDropdownComponent, GeomService,
        PaceTooltipService, TextEditorService, SpreadToolbarService, AngularSliderButtonComponent, optionVisibilityFilter) {

        var CSSTransitionGroup = ReactTransitionGroup.CSSTransitionGroup,
            CANVAS_PAD = 300;

        return React.createClass({

            propTypes: {
                container: React.PropTypes.object.isRequired,
                elements: React.PropTypes.array.isRequired,
                product: React.PropTypes.object.isRequired,
                layoutSizeOption: React.PropTypes.object.isRequired,
                layoutController: React.PropTypes.object.isRequired,
                currentImageIndex: React.PropTypes.number,
                fillMode: React.PropTypes.string.isRequired,
                viewMode: React.PropTypes.string.isRequired,
                isSelected: React.PropTypes.bool.isRequired,
                isMiddle: React.PropTypes.bool.isRequired,
                onContainerClick: React.PropTypes.func.isRequired,
                onContainerRemoveClick: React.PropTypes.func.isRequired,
                onContainerDrop: React.PropTypes.func.isRequired,
                onImageModified: React.PropTypes.func.isRequired,
                onToolbarClick: React.PropTypes.func.isRequired,
                onContainerQuantityChange: React.PropTypes.func.isRequired,
                onContainerSizeChange: React.PropTypes.func.isRequired,
                onCurrentImageChange: React.PropTypes.func.isRequired,
                onImageRemoveClick: React.PropTypes.func.isRequired,
                containerRect: React.PropTypes.object.isRequired,
                step: React.PropTypes.number.isRequired,
                numContainers: React.PropTypes.number.isRequired,
                tweakZIndex: React.PropTypes.bool.isRequired,
                showDeletePhotoIcon: React.PropTypes.bool,
                editable: React.PropTypes.bool.isRequired,
                canvasMode: React.PropTypes.bool.isRequired
            },

            getInitialState: function () {
                var qtyOptions = _.times(10, function(i) { return {id:i+1, label: i+1}; });
                var currentToolset = 'tools1',
                    textOpt = TextEditorService.getDefaultOptions();

                return {
                    currentImageIndex: this.props.currentImageIndex || 0,
                    isImageCentered: false,
                    qtyOptions: qtyOptions,
                    currentToolset: currentToolset,
                    textOpt: textOpt
                };
            },

            //------------------------------------------------------
            //----------------- Helper functions -------------------
            //------------------------------------------------------
            getLayoutSize: function(element, container) {
                var spread = container || this.props.container,
                    layoutSize = _.clone(spread.layoutSize),
                    bleed = layoutSize.bleedOutside * 2;

                if (layoutSize.gridX>0 || layoutSize.templateSpread) return layoutSize;

                layoutSize.width = element.width - bleed;
                layoutSize.height = element.height - bleed;
                return layoutSize;
            },

            isTextToolActive: function() {
                var textToolActive = this.props.layoutController.currentTool.type==='TextTool' || 
                    (this.props.layoutController.selectedElements.length===1 &&
                    this.props.layoutController.selectedElements[0].type==='TextElement');

                return textToolActive;
            },

            getScaleForContainer: function() {
                var container = this.props.container,
                    viewMode = this.props.viewMode,
                    isSelected = this.props.isSelected,
                    isZoomed = isSelected && viewMode==='single',
                    step = this.props.step,
                    layoutSize = container.layoutSize;

                if (!(layoutSize.gridX>0 || layoutSize.templateSpread) && 
                    (this.state.currentImageIndex < container.spreads.length && this.state.currentImageIndex >= 0)) {
                    layoutSize = this.getLayoutSize(container.spreads[this.state.currentImageIndex].elements[0]);
                }


                var canvasSize = {
                    width: layoutSize.width + (layoutSize.bleedOutside * 2),
                    height: layoutSize.height + (layoutSize.bleedOutside * 2)
                };

                var containerRect = {
                    width: this.props.containerRect.width - 60,
                    height: this.props.containerRect.height - 168
                };

                if (viewMode==='filmstrip') {
                    containerRect.height = 100;
                }

                if (viewMode==='thumbnail') {
                    containerRect.height = this.props.containerRect.height;
                }

                var rect = GeomService.fitRect( canvasSize, containerRect );
                var scale = rect.width / canvasSize.width;

                if (viewMode==='tile' && !isZoomed) {
                    scale = scale * (0.5 + (0.5 * step));
                }

                return scale;
            },

            getAvailableSizes: function() {
                if (!this.props.container) return [];
                var sizes = [],
                    //sizeType = this.getSizeType(this.props.container.layoutSize),
                    sizeOptions = this.props.layoutSizeOption.prototypeProductOptionValues;

                var sizeOptions = optionVisibilityFilter(sizeOptions, this.props.product);

                for (var i = 0; i < sizeOptions.length; i++) {
                    var sizeOption = sizeOptions[i];
                    sizes.push({
                        id: sizeOption.code,
                        label: sizeOption.code,
                        sizeConfig: sizeOption
                    });
                }

                return sizes;
            },

            getSizeType: function(layoutSize) {
                var sizeType,
                    width = layoutSize.width,
                    height = layoutSize.height;

                if (width > height) {
                    sizeType = 'horizontal';
                } else if (width < height) {
                    sizeType = 'vertical';
                } else {
                    sizeType = 'square';
                }

                return sizeType;
            },

            initCanvas:function(canvas) {
                var el = $(canvas);
                var scope =  {
                        spread: { numPages: 1, elements:[] },
                        layout: { layoutSize:{} },
                        layoutController: this.props.layoutController,
                    },
                    layoutController = this.props.layoutController;

                var ctrl = $controller('SpreadController',
                    {
                        $element: el,
                        $scope: scope,
                        $attrs: {}
                    }
                );

                this.darkPatternImage = new Image();
                this.darkPatternImage.src = '/images/designer-dark-pattern-bg.png';

                this.rendererScope = scope;
                ctrl.scale = ctrl.canvas.scale = 1.0;
                ctrl.canvas.on('after:render', this.onAfterRender.bind(this));
                ctrl.element = el;
                ctrl.register();
                this.renderer = ctrl;

                var element = null;
                if (this.props.container.spreads.length>0) {
                    var element = this.props.container.spreads[this.state.currentImageIndex];
                }
                this.setCurrentImage(element);
            },

            onAfterRender: function() {
                //console.log('after render');
                var renderer = this.renderer,
                    canvas = renderer.canvas;
                var layoutSize = this.props.container.layoutSize,
                    scale = canvas.scale;
                var ctx = canvas.getContext();

                var numImages = this.props.container.spreads.length;

                
                if (layoutSize.gridX>0 && numImages>0) {
                    ctx.save();
                    ctx.setTransform(1,0,0,1,0.5,0.5);
                    ctx.globalAlpha = 1;
                    ctx.strokeStyle = !this.props.isSelected ? '#000000' : '#0bc1f3';
                    ctx.lineWidth = this.props.isSelected ? 3 : 1;
                    var r = new PACE.Rect({x:0,y:0,width:layoutSize.width, height:layoutSize.height}).toCanvasSpace(canvas).round();

                    var w = r.width / layoutSize.gridX,
                        h = r.height / layoutSize.gridY,
                        x = r.x + w, y = r.y + h;
                    for (var i = 0; i < layoutSize.gridX - 1; i++) {
                        ctx.beginPath();
                        ctx.moveTo(Math.round(x), Math.round(r.y));
                        ctx.lineTo(Math.round(x), Math.round(r.y + r.height));
                        ctx.stroke();
                        x += w;    
                    }
                    for (var i = 0; i < layoutSize.gridY - 1; i++) {
                        ctx.beginPath();
                        ctx.moveTo(Math.round(r.x), Math.round(y));
                        ctx.lineTo(Math.round(r.x + r.width), Math.round(y));
                        ctx.stroke();
                        y += h;    
                    }
                    if (!this.props.isSelected) {
                        ctx.strokeRect(r.x, r.y, r.width, r.height);
                    }
                    ctx.restore();
                } 

                if (this.props.canvasMode) {
                    var currentElement = null;

                    if (renderer.spread.elements.length>0) {
                        currentElement = renderer.spread.elements[0];
                    }

                    if (currentElement) {
                        var bleed = Math.round(layoutSize.bleedOutside * scale);
                        var el = new PACE.Element(currentElement).getBoundingBox().toCanvasSpace(canvas).round();
                        
                        ctx.save();
                        ctx.setTransform(1,0,0,1,0,0);
                        ctx.globalAlpha = 0.55;
                        ctx.fillStyle = '#4e4e4e';
                        ctx.fillRect(el.x, el.y, bleed, el.height);
                        ctx.fillRect(el.x + bleed , el.y, el.width - (bleed * 2), bleed);
                        ctx.fillRect(el.x + el.width - bleed, el.y, bleed, el.height);
                        ctx.fillRect(el.x + bleed, el.y + el.height - bleed, el.width - (bleed * 2), bleed);

                        ctx.globalAlpha = 1;
                        var pat = ctx.createPattern(this.darkPatternImage, 'repeat');
                        ctx.fillStyle = pat;
                        
                        ctx.fillRect(el.x, el.y, bleed, bleed);
                        ctx.fillRect(el.x + el.width - bleed , el.y , bleed, bleed);
                        ctx.fillRect(el.x + el.width - bleed , el.y + el.height - bleed, bleed, bleed);
                        ctx.fillRect(el.x, el.y + el.height - bleed, bleed, bleed);

                        if (this.props.isSelected) {                    
                            ctx.font = '12px Arial';
                            ctx.fillStyle = '#000';
                            ctx.lineWidth = 0;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            var txt = 'WRAPS AROUND CANVAS EDGE';

                            var textSize = ctx.measureText(txt);
                            textSize.height = 12;
                            var padh = 20, padv = 3;
                            var rect = GeomService.fitRect(textSize, {width:Math.min(el.width - bleed * 2, el.height - bleed * 2) - padh, height:bleed - padv});
                            var scale = rect.width/textSize.width;

                            var pos = [
                                    [el.x + el.width/2, el.y + bleed/2],
                                    [el.x + el.width - bleed/2, el.y + el.height/2],
                                    [el.x + el.width/2, el.y + el.height - bleed/2],
                                    [el.x + bleed/2, el.y + el.height/2]
                                ],
                                a = [0, 90, 0, 270];
                            for (var i = 0; i < pos.length; i++) {
                                var p = pos[i];
                                ctx.setTransform(1,0,0,1,0,0);
                                ctx.translate(p[0], p[1]);
                                ctx.scale(scale,scale);
                                ctx.rotate(a[i] * Math.PI/180);
                                ctx.fillText(txt, 0, 0);
                            }
                        }
                        ctx.restore();

                        if (canvas.getActiveObject()) {
                            canvas.getActiveObject().drawBorders(ctx);
                        }
                    } else {
                        ctx.clearRect(0,0,canvas.width, canvas.height);
                    }
                }
            },

            setCurrentImage: function(currentSpread, animate, delay) {

                //console.log('setCurrentImage', this.props.container.id, currentSpread);
                var renderer = this.renderer;
                var that = this;

                var spread = { numPages:1, pageNumber:1, elements:[] };
                var layoutSize = _.clone(this.props.container.layoutSize),
                    containerRect = this.props.containerRect;

                var scale = this.scale,
                    size = Math.max(layoutSize.width, layoutSize.height);

                if (!layoutSize.templateSpread) {
                    layoutSize.width = layoutSize.height = size;
                }
                var layout = { layoutSize: layoutSize, viewState:{}, _id: this.props.container._id };

                
                if (renderer.spread.elements.length>0) {
                    var spreadInfoFactory = new PACE.SpreadInfoFactory(),
                        prevBleedRect = spreadInfoFactory.create(renderer.spread, renderer.layout).getBleedRect(),
                        newBleedRect = spreadInfoFactory.create(spread, layout).getBleedRect();

                    var prevSpreadCenter = {
                        x: prevBleedRect.x + prevBleedRect.width / 2,
                        y: prevBleedRect.y,
                    };
                    var newSpreadCenter = {
                        x: newBleedRect.x + newBleedRect.width / 2,
                        y: newBleedRect.y,
                    };
                    _.each(renderer.spread.elements, function(el) {

                        var elMatrix = new PACE.Element(el).getMatrix();
                        var prevCenter = elMatrix.transformPoint(el.width/2, 0);

                        var dx = prevCenter.x - prevSpreadCenter.x,
                            dy = prevCenter.y - prevSpreadCenter.y;

                        var s = el.scale / scale;

                        var m = new PACE.Matrix2D();
                        //m.translate(-prevCenter.x, -prevCenter.y);
                        //m.rotate(el.rotation * Math.PI/180);
                        //m.scale(scale, scale);
                        m.translate(newSpreadCenter.x + (dx * s), newSpreadCenter.y + (dy * s));
                        //m.translate(newSpreadCenter.x, newSpreadCenter.y);

                        el.width = el.width * s;
                        el.height = el.height * s;
                        el.imageX = el.imageX * s;
                        el.imageY = el.imageY * s;
                        el.imageWidth = el.imageWidth * s;
                        el.imageHeight = el.imageHeight * s;
                        el.strokeWidth = el.strokeWidth * s;
                        el.scale = scale;

                        var p = m.transformPoint(-el.width/2, 0);
                        el.x = p.x;
                        el.y = p.y;

                    });
                    renderer.layout = this.rendererScope.layout = layout;
                    renderer.scale = renderer.canvas.scale = scale;
                    renderer.makePages();
                    renderer.render();
                }
                

                this.currentElement = null;
                if (currentSpread) {
                    var templateMode = layoutSize.gridX>0 || layoutSize.templateSpread;

                    spread.elements = _.map(currentSpread.elements, function(element) {
                        var el = angular.copy(element);
                        el.scale = scale;
                        el.originalElement = element;
                        el.containerWidth = containerRect.width;
                        el.containerHeight = containerRect.height;
                        if (element.imageFile) {
                            el.imageFile = element.imageFile;
                        }

                        if (el.type==='ImageElement') {
                            el.locked = true;
                            if (!templateMode) {
                                new PACE.CenterHorizontalyOnSpreadCommand(el, spread, layout).execute();
                            }
                        }
                        return el;
                    });


                    // if (!templateModelayoutSize.templateSpread) {
                    //     var imageElements = _.where(spread.elements, {type:'ImageElement'});
                    //     var tempGroup = { type:'ElementGroup', elements: imageElements },
                    //         rect = new PACE.Element(tempGroup).getBoundingBox();
                    //     rect.rotation = 0;

                    //     new PACE.CenterHorizontalyOnSpreadCommand(rect, spread, layout).execute();
                    //     new PACE.TransformElementsCommand(imageElements, rect).execute();
                    // }

                    this.currentElement = currentSpread.elements[0];
                }

                var currNumElements = renderer.spread.elements.length,
                    nextNumElements = spread.elements.length;
                renderer.spread = this.rendererScope.spread = spread;
                renderer.layout = this.rendererScope.layout = layout;
                renderer.container = this.props.container;
                renderer.scale = renderer.canvas.scale = scale;
                renderer.makePages();
                if (animate) {
                    renderer.renderWithAnimation();
                } else {
                    renderer.render();
                }
                
            },

            getImageUrl: function(element) {
                var url;
                if (element.imageFile.thumbnailAsBase64) {
                    url = element.imageFile.thumbnailAsBase64;
                } else if (element.imageFile.url) {
                    url = StoreConfig.imageUrlPrefix + 'thumbnail/' + element.imageFile.url;
                }
                return url;
            },

            getCurrentElement: function() {
                var idx = this.state.currentImageIndex,
                    container = this.props.container;
                if (idx >= 0 && idx < container.spreads.length &&
                    container.spreads[idx].elements.length > 0) {
                    return container.spreads[idx].elements[0];
                }
            },

            getCurrentSpread: function() {
                var idx = this.state.currentImageIndex,
                    container = this.props.container;
                if (idx >= 0 && idx < container.spreads.length &&
                    container.spreads[idx].elements.length > 0) {
                    return container.spreads[idx];
                }
            },

            isContainerCentered: function() {
                var elNode = ReactDOM.findDOMNode(this);
                var scrollContainer = elNode.parentNode;

                var scrollRect = scrollContainer.getBoundingClientRect();
                var scrollFrom = scrollContainer.scrollLeft;

                var scrollTo = elNode.offsetLeft - (scrollRect.width/2 - elNode.offsetWidth/2);
                var isCentered = Math.abs(scrollFrom - scrollTo) < 20;
                return isCentered;
            },

            checkOrientation: function(container, currentIndex, nextIndex) {
                var prevEl = currentIndex >= 0 && currentIndex < container.spreads.length ? container.spreads[currentIndex].elements[0] : null,
                    prevLayoutSize = prevEl ? this.getLayoutSize(prevEl, container) : container.layoutSize;

                var nextEl = nextIndex >= 0 && nextIndex < container.spreads.length ? container.spreads[nextIndex].elements[0] : null,
                    nextLayoutSize = nextEl ? this.getLayoutSize(nextEl, container) : container.layoutSize;

                if (prevLayoutSize && nextLayoutSize &&
                    prevLayoutSize.width===nextLayoutSize.width && prevLayoutSize.height===nextLayoutSize.height) {
                    return true;
                }
                return false;
            },

//------------------------------------------------------
//-------------- React live cycle stuff ----------------
//------------------------------------------------------

            componentWillMount: function() {
                this.transitionValue = null;
            },

            componentDidMount: function () {
                this.listeners = [
                    this.props.layoutController.on('layout:selection-modified', this.onSelectionModified.bind(this)),
                    this.props.layoutController.on('layout:selection-modifying', this.onSelectionModifying.bind(this)),
                    this.props.layoutController.on('layout:selection-changed', this.onSelectionChanged.bind(this)),
                    this.props.layoutController.on('prints:images-dropped', this.onImagesDroppped.bind(this)),
                    this.props.layoutController.on('layout:find-image', this.onFindImage.bind(this)),
                    this.props.layoutController.on('prints:container-size-changed', this.onContainerSizeChange.bind(this)),
                    this.props.layoutController.on('layout:deleting-elements', this.onDeletingElements.bind(this)),
                    this.props.layoutController.on('build-product-saved', this.onProductSaved.bind(this))
                ];
                PaceTooltipService.start(ReactDOM.findDOMNode(this));
                
                if (this.props.isSelected) {
                    var ctrl = this.props.layoutController,
                    elements = this.props.container.spreads;
                    
                    if (elements.length > 0) {
                        var element = elements[this.state.currentImageIndex];
                        this.setCurrentImage(element, false);
                        var element = this.renderer.spread.elements[0];
                        ctrl.selectElements( [element], true );
                        ctrl.currentTool = new PACE.PrintsSelectionTool(ctrl);
                        ctrl.currentTool.beginEdit();
                    } 

                    //center the item horizontally
                    var elNode = ReactDOM.findDOMNode(this);
                    var scrollContainer = elNode.parentNode;
                    var scrollRect = scrollContainer.getBoundingClientRect();
                    var scrollTo = elNode.offsetLeft - (scrollRect.width/2 - elNode.offsetWidth/2);
                    scrollContainer.scrollLeft = scrollTo;           
                }
            },

            componentWillUnmount: function () {
                _.each(this.listeners, function(listener) { listener(); });
                this.listeners = null;
                PaceTooltipService.stop(ReactDOM.findDOMNode(this));
                this.darkPatternImage = null;
            },

            componentDidUpdate: function() {
                var ctrl = this.props.layoutController,
                    elements = this.props.container.spreads;

                //console.log('componentDidUpdate', this.props.container.id, this.refreshCanvas, this.selectCurrentImage, this.doTransition, this.isAnimating);

                if (this.refreshCanvas) {
                    this.refreshCanvas = false;
                    if (elements.length > 0) {
                        ctrl.clearSelection(true);
                        var element = elements[this.state.currentImageIndex];
                        this.setCurrentImage(element, true);
                    } else {
                        this.setCurrentImage(null, true);
                    }
                }

                if (this.selectCurrentImage) {
                    this.selectCurrentImage = false;
                    ctrl.clearSelection(true);

                    var element = this.renderer.spread.elements[0];
                    if (this.mouseTarget && this.renderer.spread.elements.indexOf(this.mouseTarget)>=0) {
                        element = this.mouseTarget;
                    }

                    if (element && element.type!=='BackgroundFrameElement') {
                        var textToolActive = ctrl.currentTool instanceof PACE.TextTool ||
                            ctrl.currentEditor instanceof PACE.TextEditor;

                        if (element.type==='TextElement') {
                            ctrl.selectElements([element], true);

                            if (textToolActive) {
                                ctrl.currentEditor = new PACE.TextEditor(ctrl);
                                ctrl.currentEditor.beginEdit();
                            }
                        } else if (!textToolActive) {
                            ctrl.selectElements([element], true);
                            if (this.props.editable) {
                                ctrl.currentTool = new PACE.PrintsSelectionTool(ctrl);
                                ctrl.currentTool.beginEdit();
                            }
                        } else {
                            ctrl.setCurrentRenderer(this.renderer);
                        }
                    }
                }

                if (!this.isAnimating && !this.doTransition) {
                    this.renderer.render();
                    //update qty input
                    if (this.refs.imageQtyInput) {
                        var elNode = ReactDOM.findDOMNode(this.refs.imageQtyInput);
                        var sp = this.getCurrentSpread();
                        var qty = (sp && sp.quantity) ? sp.quantity : 1;
                        elNode.value = qty;
                    }

                    var rootNode = ReactDOM.findDOMNode(this);
                    if (this.props.tweakZIndex) {
                        rootNode.style.zIndex = 1;
                        rootNode.style.zIndex = 'auto';
                    }
                }

                if (!this.isAnimating && this.doTransition) {
                    //do scale transition
                    var that = this;

                    this.transitionValue = 0;
                    this.isAnimating = true;

                    var elNode = ReactDOM.findDOMNode(this);
                    var scrollContainer = elNode.parentNode;

                    var scrollRect = scrollContainer.getBoundingClientRect();
                    var scrollFrom = scrollContainer.scrollLeft;
                    var isCentered = this.transitionCentered;

                    var render = function(value) {
                        that.transitionValue = value;

                        var el = that.renderer.spread.elements[0],
                            containerRect = that.props.containerRect,
                            scaleChanged = el && el.scale!==that.scale,
                            containerSizeChanged = el && (el.containerWidth!==containerRect.width || el.containerHeight!==containerRect.height);

                        if (that.isAnimating && that.prevScale && that.prevScale!==that.scale) {
                            scaleChanged = true;
                        }

                        if (el && el.originalElement && (scaleChanged || containerSizeChanged)) {
                            //update the element on canvas when scale or container size has changed
                            var scale = that.scale;
                            if (that.isAnimating && that.prevScale && that.prevScale!==that.scale) {
                                scale = that.prevScale + ((that.scale - that.prevScale) * that.transitionValue);
                            }

                            var spread = that.renderer.spread,
                                layout = that.renderer.layout;

                            for (var i = 0; i < spread.elements.length; i++) {
                                var el = spread.elements[i],
                                    el2 = el.originalElement;

                                el.scale = scale;
                                el.containerWidth = containerRect.width;
                                el.containerHeight = containerRect.height;

                                if (el.type==='ImageElement') {
                                    el.locked = true;
                                    //new PACE.CenterHorizontalyOnSpreadCommand(el, spread, layout).execute();
                                }
                            }
                            that.renderer.scale = that.renderer.canvas.scale = scale;
                        }

                        that.renderAnim();
                        that.renderer.render();

                        //center the item horizontally
                        if (that.props.isSelected || that.props.isMiddle) {
                            var scrollTo = elNode.offsetLeft - (scrollRect.width/2 - elNode.offsetWidth/2);
                            scrollContainer.scrollLeft = isCentered ? scrollTo : scrollFrom + ((scrollTo - scrollFrom) * value);
                        }
                    };

                    fabric.util.animate({
                        startValue: 0,
                        endValue: 1,
                        duration: 500,
                        onChange: render,
                        onComplete: function() {
                            if (that.props.isSelected)
                                that.selectCurrentImage = true;

                            that.transitionValue = null;
                            that.isAnimating = false;
                            that.doTransition = false;
                            that.prevContainerSize = null;
                            that.prevScale = null;
                            that.prevOffsetTop = null;
                            that.transitionCentered = false;

                            render(1.0);
                            that.forceUpdate();

                            that.mouseTarget = null;
                        }
                    });
                }
                
            },

            componentWillReceiveProps: function (nextProps) {
                
                if (nextProps.isSelected !== this.props.isSelected) {
                    this.doTransition = true;
                    if (nextProps.isSelected) {

                        this.selectCurrentImage = true;
                    }
                    this.prevContainerSize = this.containerSize;
                    this.prevScale = this.scale;
                    this.prevMargin = this.margin;
                    this.transitionCentered = this.isContainerCentered();
                }

                if (nextProps.isSelected && nextProps.currentImageIndex !== this.state.currentImageIndex) {

                    var currentImageIndex = this.state.currentImageIndex;
                    var idx = Math.max(0, Math.min(nextProps.currentImageIndex, nextProps.container.spreads.length - 1) );
                    this.setState({currentImageIndex: idx});
                    this.refreshCanvas = true;
                    this.doTransition = true;
                    this.prevContainerSize = this.containerSize;
                    this.prevMargin = this.margin;
                    this.transitionCentered = this.isContainerCentered();

                    if (this.checkOrientation(nextProps.container, currentImageIndex, idx)) {
                        this.selectCurrentImage = true;
                        this.doTransition = false;
                    }
                }

                if (nextProps.elements !== this.props.elements) {
                    this.prevContainerSize = this.containerSize;
                    this.prevMargin = this.margin;
                    this.doTransition = true;
                    this.refreshCanvas = true;
                    this.transitionCentered = this.isContainerCentered();
                }

                var nextRect = nextProps.containerRect || {},
                    prevRect = this.props.containerRect || {};

                if ( (nextProps.numContainers!==this.props.numContainers) ||
                     (nextProps.step!==this.props.step) ||
                     (nextProps.viewMode!==this.props.viewMode) ||
                     (nextRect.width!==prevRect.width || nextRect.height!==prevRect.height)) {

                    this.refreshCanvas = false;
                    this.doTransition = true;
                    this.prevContainerSize = this.containerSize;
                    this.prevScale = this.scale;
                    this.prevMargin = this.margin;
                    if (nextProps.isSelected ||  (nextProps.viewMode!==this.props.viewMode) ) {
                        this.transitionCentered = true;
                    }
                }
            },

//------------------------------------------------------
//----------------- Event handers ----------------------
//------------------------------------------------------
            onProductSaved: function() {
                if (!this.props.isSelected) return;

                //detect size change
                var product = this.props.product;
                var size = product.options.size;
                if (size!==this.size) {
                    var ls = this.props.container.layoutSize,
                        sizeType = this.getSizeType;
                    var sizeOptions = this.getAvailableSizes();
                    sizeOptions = _.filter(sizeOptions, function(size) {
                        return sizeType(ls)===sizeType(size.sizeConfig.layoutSize);
                    });
                    
                    var size;
                    if (product.prevSize) {
                        var prevSize = _.findWhere(sizeOptions, {id:product.prevSize});
                        if (prevSize) size = prevSize;
                    }

                    if (!size) {
                        size = _.min(sizeOptions, function(size) {
                            var ls2 = size.sizeConfig.layoutSize,
                                areaDiff = Math.abs((ls.width * ls.height) - (ls2.width * ls2.height));
                            return areaDiff;
                        });
                    }
                    console.log('closest size', size.id)
                    product.prevSize = this.size;
                    this.onContainerSizeChange(null, size.id);
                }
            },

            onCanvasMouseDown: function(event) {
                if (this.props.tweakZIndex) {
                    var rootNode = ReactDOM.findDOMNode(this);
                    rootNode.style.zIndex = 1000;
                }
            },

            onCanvasMouseUp: function(event) {
                if (this.props.tweakZIndex) {
                    var rootNode = ReactDOM.findDOMNode(this);
                    rootNode.style.zIndex = 'auto';
                }
            },

            onContainerClick: function(event) {
                this.mouseTarget = null;

                if (this.props.isSelected) {
                    var numImages = this.props.container.spreads.length;
                    if (numImages===0) {
                        //check if the user off clicks the container
                        var content = ReactDOM.findDOMNode(this.refs.contentDiv);
                        var rect = content.getBoundingClientRect();
                        var insideContainer = (
                            event.pageX>=rect.left && event.pageY>=rect.top &&
                            event.pageX<=rect.right && event.pageY<=rect.bottom
                        );
                        if (!insideContainer) {
                            this.props.onContainerClick(null);
                        }
                    }
                    return;
                }
                if (this.props.onContainerClick) {
                    this.props.onContainerClick(event);

                    var target = this.renderer.canvas.findTarget(event);
                    this.mouseTarget = target ? target.element : null;
                }
            },

            onContainerDragOver: function(event) {
                var droppableType = 'text/x-pace-filmstrip-items';
                var dt = event.dataTransfer;

                if (PACE.utils.containsDragType(dt.types, droppableType)) {
                    event.stopPropagation();
                    event.preventDefault();
                    dt.dropEffect = 'move';

                    var el = $(event.currentTarget);
                    if (this.props.fillMode !== 'single') {
                        el = $('.prints-container__content');
                    }
                    el.addClass('pace-drag-over');
                }
            },

            onContainerDragLeave: function(event) {
                var el = $(event.currentTarget);
                if (this.props.fillMode !== 'single') {
                    el = $('.prints-container__content');
                }
                el.removeClass('pace-drag-over');
            },

            onContainerDrop: function(event) {
                var el = $(event.currentTarget);
                if (this.props.fillMode !== 'single') {
                    el = $('.prints-container__content');
                }
                el.removeClass('pace-drag-over');
                this.props.onContainerDrop(event);
            },

            fixQty: function(value) {
                var target,
                    refresh = false;
                if (typeof value === 'object') {
                    target = value.target;
                    value = value.target.value;
                }

                if (value==='') return;

                if (_.isString(value)) {
                    var intValue = parseInt(value);
                    if ((intValue+'').length!==value.length) {
                        refresh = true;
                    }
                    value = intValue;
                }

                if (!value || value == 0) {
                    value = 1;
                    refresh = true;
                }
                if (target && refresh) {
                    target.value = value;
                }
                return value;
            },

            onQtyInputFocus: function(event) {
                event.target.select();
            },

            onImageQtyChange: function(value) {
                value = this.fixQty(value);
                if (!value) return;

                var currentSpread = this.getCurrentSpread();
                if (currentSpread) {
                    currentSpread.quantity = value;
                }
                this.forceUpdate();
                this.props.onContainerQuantityChange(this.props.container);
            },

            onImageQtyBlur: function(event) {
                var value = event.target.value;
                if (_.isEmpty(value)) {
                    event.target.value = 1;
                    this.onImageQtyChange(event);
                }
            },

            onContainerSlideChange: function(dir, e) {
                e.stopPropagation();

                var idx = this.state.currentImageIndex,
                    numImages = this.props.container.spreads.length;
                idx = (idx + dir + numImages) % numImages;

                if (this.props.isSelected) {
                    this.transitionCentered = true;
                }
                this.refreshCanvas = true;
                this.doTransition = true;
                this.prevContainerSize = this.containerSize;
                this.prevMargin = this.margin;
                this.orientationChanged = true;

                if (this.checkOrientation(this.props.container, this.state.currentImageIndex, idx)) {
                    this.selectCurrentImage = this.props.isSelected;
                    this.doTransition = false;
                    this.orientationChanged = false;
                }

                this.setState({currentImageIndex: idx});
                if (this.props.onCurrentImageChange) {
                    this.props.onCurrentImageChange(this.props.container, idx);
                }
            },

            onImagesDroppped: function(event, container) {

                if (this.props.container!==container) return;

                this.prevContainerSize = this.containerSize;
                this.prevMargin = this.margin;
                this.doTransition = true;
                this.refreshCanvas = true;
                this.transitionCentered = this.isContainerCentered();

                var idx = this.props.container.currentImageIndex;
                var nextSpread = this.props.container.spreads[idx];
                var nextEl = nextSpread ? nextSpread.elements[0] : null,
                    nextLayoutSize = nextEl ? this.getLayoutSize(nextEl) : this.props.container.layoutSize,
                    prevLayoutSize = this.layoutSize;

                if (prevLayoutSize && nextLayoutSize &&
                    prevLayoutSize.width===nextLayoutSize.width && prevLayoutSize.height===nextLayoutSize.height) {
                    this.doTransition = false;
                    //this.selectCurrentImage = this.props.isSelected;
                }
                this.selectCurrentImage = this.props.isSelected;

                this.setState({currentImageIndex: idx});
                this.forceUpdate();
            },

            onFindImage: function(event, image) {
                var that = this;
                _.each(this.props.container.spreads, function(s,i) {
                    _.each(s.elements, function(el) {
                        if (el.imageFile && el.imageFile.id===image.id) {
                            that.setState({currentImageIndex:i});
                            that.prevContainerSize = that.containerSize;
                            that.doTransition = true;
                            that.refreshCanvas = true;
                            that.forceUpdate();
                        }
                    });
                });
            },

            onSelectionChanged: function() {
                if (!this.props.isSelected) return;
                this.forceUpdate();
            },

            onDeletingElements: function() {
                if (!this.props.isSelected || !this.currentElement) return;

                var ctrl = this.props.layoutController,
                    elements = _.pluck(ctrl.selectedElements, 'originalElement');

                var idx = this.state.currentImageIndex,
                    container = this.props.container,
                    spread = container.spreads[idx];
                
                spread.elements = _.difference(spread.elements, elements);
                ctrl.fireEvent('layout:layout-changed');
            },

            onSelectionModifying: function(e, element) {
                if (!this.props.isSelected || !this.currentElement) return;

                var container = this.props.container,
                    isGrid = container.layoutSize.gridX>0;
                if (isGrid) {
                    _.each(this.renderer.spread.elements, function(el, i) {

                        if (el.type==='ImageElement') {
                            _.extend(el, _.pick(element, 'imageX', 'imageY', 'imageWidth', 'imageHeight', 'imageRotation'));
                        }
                    });
                    this.renderer.render();
                }
            },

            onSelectionModified: function() {

                if (!this.props.isSelected || !this.currentElement) return;

                var ctrl = this.props.layoutController,
                    element = ctrl.selectedElements[0],
                    orientationChanged,
                    forceUpdate = false;

                if (element && element.type==='ImageElement' && !this.props.container.layoutSize.templateSpread) {
                    //new PACE.CenterHorizontalyOnSpreadCommand(element, this.renderer.spread, this.renderer.layout).execute();
                    //update other image elements in grid
                   
                    var rotationChanged = this.currentElement.rotation !== element.rotation;
                    if (rotationChanged) {
                        //normalize rotation;
                        var el = new PACE.Element(element);
                        var bbox = el.getBoundingBox();
                        var m = el.getMatrix();

                        var p = m.transformPoint(element.imageX, element.imageY);

                        element.x = bbox.x;
                        element.y = bbox.y;
                        element.width = bbox.width;
                        element.height = bbox.height;
                        element.imageRotation = element.rotation + element.imageRotation;
                        element.rotation = 0;

                        m = el.getMatrix();
                        m.invert();

                        p = m.transformPoint(p.x, p.y);
                        element.imageX = p.x;
                        element.imageY = p.y;
                    }

                    orientationChanged = (element.width>element.height) !== (this.currentElement.width>this.currentElement.height);
                }
                //update elements on spread
                var currentSpread = this.props.container.spreads[this.state.currentImageIndex],
                    scale = this.scale;

                _.each(this.renderer.spread.elements, function(el, i) {

                    if (el.type==='ImageElement') {
                        _.extend(el, _.pick(element, 'imageX', 'imageY', 'imageWidth', 'imageHeight', 'imageRotation'));
                    }

                    el.scale = scale;
                    var originalElement = el.originalElement;
                    if (!originalElement) {
                        originalElement = el.originalElement = angular.copy(el);
                        currentSpread.elements[i] = originalElement;
                    }

                    originalElement.x = el.x;
                    originalElement.y = el.y;
                    originalElement.width = el.width;
                    originalElement.height = el.height;
                    originalElement.errors = el.errors;
                    if (el.type==='ImageElement') {
                        originalElement.imageX = el.imageX;
                        originalElement.imageY = el.imageY;
                        originalElement.imageWidth = el.imageWidth;
                        originalElement.imageHeight = el.imageHeight;
                        originalElement.imageRotation = el.imageRotation;
                        originalElement.rotation = el.rotation;
                        originalElement.flipX = el.flipX;
                        originalElement.flipY = el.flipY;
                        originalElement.strokeWidth = el.strokeWidth;
                        originalElement.strokeColor = el.strokeColor;
                        originalElement.filter = el.filter;
                    } else if (el.type==='TextElement') {
                        originalElement.text = el.text || '';
                        originalElement.textAlign = el.textAlign;
                        originalElement.styles = angular.copy(el.styles);
                    }
                    //console.log('selection-modified', originalElement)
                });

                if (orientationChanged) {
                    this.prevScale = this.scale;
                    //this.prevContainerSize = this.containerSize;
                    this.prevMargin = this.margin;
                    this.doTransition = true;
                    this.transitionCentered = true;

                    var layoutSize = this.getLayoutSize(this.currentElement);
                    var width = Math.round((layoutSize.width + (layoutSize.bleedOutside * 2)) * this.scale) + 1;
                    var height = Math.round((layoutSize.height + (layoutSize.bleedOutside * 2)) * this.scale) + 1;
                    this.prevContainerSize = {width:width, height:height};

                    var w = Math.round((layoutSize.width + (layoutSize.bleedOutside * 2)) * this.scale) + 1;
                    this.prevMargin = Math.max( ((340 + 30) - w) / 2);
                    this.prevOffsetTop = width/2 - height/2;
                }
                if (!(ctrl.currentEditor instanceof PACE.TextEditor)) {
                    this.forceUpdate();
                }
                ctrl.fireEvent('layout:layout-changed');
            },

            onContainerSizeChange: function(event, id) {
                if (!this.props.isSelected) return;

                var sizeOptions = this.getAvailableSizes();

                var size = _.findWhere(sizeOptions, {id:id});

                var product = this.props.product,
                    container = this.props.container,
                    prevLayoutSize = container.layoutSize;
                product.options[this.props.layoutSizeOption.effectiveCode] = size.id;


                if (!container.originalLayoutSize) {
                    container.originalLayoutSize = container.layoutSize;
                }
                container.layoutSize = size.sizeConfig.layoutSize;
                var containerSizeType = this.getSizeType(container.layoutSize);

                var canvasLayoutSize = _.clone(container.layoutSize),
                    canvasPrevLayoutSize = _.clone(prevLayoutSize);

                canvasLayoutSize.width = canvasLayoutSize.height =
                    Math.max(canvasLayoutSize.width, canvasLayoutSize.height);

                canvasPrevLayoutSize.width = canvasPrevLayoutSize.height =
                    Math.max(canvasPrevLayoutSize.width, canvasPrevLayoutSize.height);

                var scale = canvasLayoutSize.width / canvasPrevLayoutSize.width;

                for (var i = 0; i < container.spreads.length; i++) {
                    var spread = container.spreads[i];

                    var spreadInfoFactory = new PACE.SpreadInfoFactory(),
                    prevBleedRect = spreadInfoFactory.create(spread, {layoutSize:canvasPrevLayoutSize}).getBleedRect(),
                    newBleedRect = spreadInfoFactory.create(spread, {layoutSize:canvasLayoutSize}).getBleedRect();

                    var prevSpreadCenter = {
                        x: prevBleedRect.x + prevBleedRect.width / 2,
                        y: prevBleedRect.y,
                    };
                    var newSpreadCenter = {
                        x: newBleedRect.x + newBleedRect.width / 2,
                        y: newBleedRect.y,
                    };

                    for (var j = 0; j < spread.elements.length; j++) {
                        var el = spread.elements[j],
                            w = container.layoutSize.width + (container.layoutSize.bleedOutside * 2),
                            h = container.layoutSize.height + (container.layoutSize.bleedOutside * 2);
                        if (this.getSizeType(el)!==containerSizeType) {
                            h = container.layoutSize.width + (container.layoutSize.bleedOutside * 2),
                            w = container.layoutSize.height + (container.layoutSize.bleedOutside * 2);
                        }
                        if (el.type==='ImageElement') {
                            new PACE.ResizeImageElement(el, w, h).execute();
                            el.x = newBleedRect.x;
                            el.y = newBleedRect.y;
                        } else {
                            var elMatrix = new PACE.Element(el).getMatrix();
                            var prevCenter = elMatrix.transformPoint(el.width/2, 0);

                            var dx = prevCenter.x - prevSpreadCenter.x,
                                dy = prevCenter.y - prevSpreadCenter.y;

                            var m = new PACE.Matrix2D();
                            m.translate(newSpreadCenter.x + (dx * scale), newSpreadCenter.y + (dy * scale));

                            //el.width *= scale;
                            //el.height *= scale;

                            var p = m.transformPoint(-el.width/2, 0);
                            el.x = p.x;
                            el.y = p.y;

                            // el.fontSize *= scale;
                            // _.each(el.styles, function(lineStyle) {
                            //     _.each(lineStyle, function(charStyle) {
                            //         if (charStyle.fontSize)
                            //             charStyle.fontSize *= scale;
                            //     });
                            // })

                        }
                    }
                }


                this.doTransition = true;
                this.prevContainerSize = this.containerSize;
                this.prevMargin = this.margin;
                this.refreshCanvas = true;
                this.selectCurrentImage = true;
                this.transitionCentered = true;
                this.forceUpdate();

                this.props.onContainerSizeChange(this.props.container);
            },

            onTextOptionsChanged: function(prop, val) {
                //console.log('onTextOptionsChanged', prop, val);
                var textOpt = this.state.textOpt;
                textOpt[prop] = val;
                this.setState({textOpt:textOpt});
                TextEditorService.applyForSelection(this.props.layoutController, textOpt, prop);
            },

            onToolsetChange: function(selectedItem) {
                if (selectedItem==='tools4') {
                    this.props.onToolbarClick('text-tool');
                }
                this.setState({
                    previousToolset: this.state.currentToolset,
                    currentToolset: selectedItem
                });
            },

            onContainerRemoveClick: function(e) {
                e.stopPropagation();
                this.props.onContainerRemoveClick(e);
            },

            onImageRemoveClick: function(e) {
                e.stopPropagation();
                if (this.props.onImageRemoveClick) {
                    this.props.onImageRemoveClick(e);
                }
            },

            toggleBold: function() {
                SpreadToolbarService.toggleBold(this.props.layoutController);
            },

            toggleItalic: function() {
                SpreadToolbarService.toggleItalic(this.props.layoutController);
            },

            renderAnim: function() {
                var container = this.props.container,
                    viewMode = this.props.viewMode,
                    numImages = this.props.container.spreads.length,
                    step = this.props.step,
                    isEmpty = numImages===0,
                    contentStyle = {},
                    contentClasses = 'prints-container__content',
                    isSelected = this.props.isSelected,
                    isZoomed = viewMode==='single' && isSelected,
                    layoutSize = container.layoutSize,
                    isGrid = layoutSize.gridX>0 || layoutSize.templateSpread,
                    templateMode = layoutSize.gridX>0 || layoutSize.templateSpread,
                    isAnimating = this.isAnimating,
                    containerRect = this.props.containerRect,
                    currentElement = this.state.currentImageIndex < container.spreads.length && this.state.currentImageIndex >= 0 ?
                        container.spreads[this.state.currentImageIndex].elements[0] : null;

                if (currentElement) {
                    layoutSize = this.getLayoutSize(currentElement);
                }

                var scale = this.getScaleForContainer();
                this.scale = scale;
                this.layoutSize = layoutSize;

                var width = Math.round((layoutSize.width + (layoutSize.bleedOutside * 2)) * scale);
                var height = Math.round((layoutSize.height + (layoutSize.bleedOutside * 2)) * scale);

                width += 3;
                height += 3;
                
                if (isAnimating && this.prevContainerSize) {
                    width = Math.round(this.prevContainerSize.width + ((width - this.prevContainerSize.width) * this.transitionValue));
                    height = Math.round(this.prevContainerSize.height + ((height - this.prevContainerSize.height) * this.transitionValue));
                }
                //console.log('renderAnim', width)

                var textToolActive = this.isTextToolActive();

                contentStyle.width = width;
                contentStyle.height = height;
                contentStyle.overflow = !isSelected || textToolActive || isAnimating ? 'hidden' : 'visible';

                if (isAnimating && this.prevOffsetTop) {
                    contentStyle.top = (this.prevOffsetTop * (1 - this.transitionValue)) + 'px';
                }

                if (isAnimating && this.prevScale) {
                    scale = this.prevScale + ((scale - this.prevScale) * this.transitionValue);
                }

                var pad = CANVAS_PAD,
                    pad2 = pad * 2,
                    canvasSize = templateMode ? layoutSize.width : Math.max(layoutSize.width, layoutSize.height),
                    canvasWidth = canvasSize + pad2,
                    left = Math.round(width/2 - (canvasWidth / 2 * scale )) - 1,
                    top = Math.round((pad - container.layoutSize.bleedOutside) * scale) - 1;

                var canvasStyle = {
                    left: left + 'px',
                    top: -top + 'px'
                };

                var liStyle = {};
                var margin = 15;

                if (viewMode==='single') {
                    margin = containerRect.width/2;
                }
                if (viewMode==='thumbnail') {
                    margin = 0;
                }

                if (isAnimating && this.prevMargin) {
                    margin = this.prevMargin + ((margin - this.prevMargin) * this.transitionValue);
                }
                this.margin = margin;

                liStyle.marginLeft = liStyle.marginRight = Math.round(margin) + 'px';

                var root = ReactDOM.findDOMNode(this.refs.itemRoot);
                root.style.marginLeft = liStyle.marginLeft;
                root.style.marginRight = liStyle.marginRight;

                var content = ReactDOM.findDOMNode(this.refs.contentDiv);
                content.style.width = contentStyle.width + 'px';
                content.style.height = contentStyle.height + 'px';
                content.style.top = contentStyle.top;
                content.style.overflow = contentStyle.overflow;

                var canvasWrapper = ReactDOM.findDOMNode(this.refs.canvasWrapper);
                canvasWrapper.style.left = canvasStyle.left;
                canvasWrapper.style.top = canvasStyle.top;

                var boxDiv = ReactDOM.findDOMNode(this.refs.boxDiv);
                var boxClasses = 'prints-container__box prints-container__box--primary';
                if (isSelected) {
                    var textToolActive = this.isTextToolActive();
                    if (isGrid || textToolActive || isAnimating || isEmpty || !this.props.editable) {
                        boxClasses += ' prints-container__box--active';
                    }
                }
                boxDiv.className = boxClasses;
            },

//------------------------------------------------------
//---------------------- Render  -----------------------
//------------------------------------------------------
            render: function() {
                if (!this.props.container) return (React.createElement("li", {className: "prints-container"}));

                var container = this.props.container,
                    viewMode = this.props.viewMode,
                    numImages = this.props.container.spreads.length,
                    step = this.props.step,
                    product = this.props.product,
                    qty = product ? product.options._quantity : 1,
                    price = product && product.subtotal ? product.subtotal.displayPrice : '$0',
                    size = product ? product.options.size : null,
                    isEmpty = numImages===0,
                    contentStyle = {},
                    contentClasses = 'prints-container__content',
                    isSelected = this.props.isSelected,
                    isZoomed = viewMode==='single' && isSelected,
                    layoutSize = container.layoutSize,
                    isGrid = layoutSize.gridX>0 || layoutSize.templateSpread,
                    templateMode = layoutSize.gridX>0 || layoutSize.templateSpread,
                    singleImageMode = layoutSize.templateSpread || this.props.canvasMode,
                    isAnimating = this.isAnimating,
                    containerRect = this.props.containerRect,
                    currentElement = this.state.currentImageIndex < container.spreads.length && this.state.currentImageIndex >= 0 ?
                        container.spreads[this.state.currentImageIndex].elements[0] : null,
                    currentSpread = this.getCurrentSpread(),
                    currentElementQty = currentSpread ? (currentSpread.quantity || 1) : 0;

                if (currentElement) {
                    layoutSize = this.getLayoutSize(currentElement);
                }

                var scale = this.getScaleForContainer();
                var textToolActive = this.isTextToolActive();

                this.scale = scale;
                this.price = price;
                this.size = size;

                var width = Math.round((layoutSize.width + (layoutSize.bleedOutside * 2)) * scale);
                var height = Math.round((layoutSize.height + (layoutSize.bleedOutside * 2)) * scale);

                width += 3;
                height += 3;
                
                if (isAnimating && this.prevContainerSize) {
                    width = Math.round(this.prevContainerSize.width + ((width - this.prevContainerSize.width) * this.transitionValue));
                    height = Math.round(this.prevContainerSize.height + ((height - this.prevContainerSize.height) * this.transitionValue));
                }

                this.containerSize = { width:width, height:height };

                contentStyle.width = width;
                contentStyle.height = height;
                contentStyle.overflow = !isSelected || textToolActive || isAnimating ? 'hidden' : 'visible';

                if (isAnimating && this.prevOffsetTop) {
                    contentStyle.top = (this.prevOffsetTop * (1-this.transitionValue)) + 'px';
                }

                var containerSize = (container.layoutSize.displayWidth + ' x ' + container.layoutSize.displayHeight).replace(/\"/g, ''),
                    size = containerSize.replace(/ /g, ''),
                    boxClasses = 'prints-container__box prints-container__box--primary';

                if (isSelected) {
                    contentClasses += ' prints-container__content--selected';

                    if (isGrid || isAnimating || isEmpty || textToolActive || !this.props.editable) {
                        contentClasses += ' prints-container__content--active';
                        boxClasses += ' prints-container__box--active';
                    }
                }

                if (isEmpty) {
                    contentClasses += ' prints-container__content--empty';
                }

                if (isAnimating && this.prevScale) {
                    scale = this.prevScale + ((scale - this.prevScale) * this.transitionValue);
                }

                var pad = CANVAS_PAD,
                    pad2 = pad * 2,
                    canvasSize = templateMode ? layoutSize.width : Math.max(layoutSize.width, layoutSize.height),
                    canvasWidth = canvasSize + pad2,
                    left = Math.round(width/2 - (canvasWidth / 2 * scale )) - 1,
                    top = Math.round((pad - container.layoutSize.bleedOutside) * scale) - 1;

                var canvasStyle = {
                    position: 'absolute',
                    //pointerEvents: isSelected && this.props.editable ? 'auto' : 'none',
                    left: left + 'px',
                    top: -top + 'px'
                };
                if (!this.tweakZIndex) {
                    canvasStyle.zIndex = 0;
                }

                var textOpt = this.state.textOpt;

                var liClasses = classNames({
                    'prints-container': true,
                    'prints-container--grid': true,
                    'prints-container--zoomed': isZoomed,
                    'prints-container--expanded-filmstrip': viewMode==='filmstrip'
                });

                var liStyle = {};
                var margin = 15;

                if (viewMode==='thumbnail') {
                    margin = 0;
                }

                if (viewMode==='single') {
                    margin = containerRect.width / 2;
                }

                if (isAnimating && this.prevMargin) {
                    margin = this.prevMargin + ((margin - this.prevMargin) * this.transitionValue);
                }
                this.margin = margin;

                liStyle.marginLeft = liStyle.marginRight = Math.round(margin) + 'px';
                if (this.props.tweakZIndex) {
                    liStyle.zIndex = 'auto';
                }

                var arrowLeftClass = classNames({
                    'prints-container__arrow': true,
                    'prints-container__arrow--left': true,
                    'prints-container__arrow--disabled': isEmpty
                });

                var arrowRightClass = classNames({
                    'prints-container__arrow': true,
                    'prints-container__arrow--right': true,
                    'prints-container__arrow--disabled': isEmpty
                });

                var cols = layoutSize.gridX,
                    rows = layoutSize.gridY;
                var gridStyle = {
                    'grid-template-columns': 'repeat(' + cols + ',' + (100/cols) + '%)',
                    'grid-template-rows': 'repeat(' + rows + ',' + (100/rows) + '%)',
                };
               
                return (
                    React.createElement("li", {className: liClasses, style: liStyle, ref: "itemRoot"}, 

                        React.createElement("div", {className: contentClasses, style: contentStyle, ref: "contentDiv", 
                            onClick: this.onContainerClick, 
                            onDragOver: this.onContainerDragOver, 
                            onDragLeave: this.onContainerDragLeave, 
                            onDrop: this.onContainerDrop}, 

                            React.createElement("div", {className: "prints-container__box prints-container__box--primary"}, 
                                
                                    isGrid && numImages===0 &&
                                    React.createElement("div", {className: "prints-container__grid", style: gridStyle}, 
                                    
                                        _.times(layoutSize.gridX * layoutSize.gridY, function(i) {
                                            return (
                                                React.createElement("div", {className: "prints-container__grid-cell"}, 
                                                    React.createElement("div", {className: "prints-container__placeholder"}, 
                                                        containerSize, 
                                                        React.createElement("div", {className: "prints-container__placeholder-secondary-label"}, "Drag image(s) here")
                                                    )
                                                )
                                            )}
                                        )
                                    
                                    ), 
                                
                                
                                    !isGrid && numImages===0 &&
                                    React.createElement("div", {className: "prints-container__placeholder"}, 
                                        containerSize, 
                                        React.createElement("div", {className: "prints-container__placeholder-secondary-label"}, "Drag image(s) here")
                                    )
                                
                            ), 

                            React.createElement("div", {style: canvasStyle, ref: "canvasWrapper", 
                                onMouseDown: this.onCanvasMouseDown, 
                                onMouseUp: this.onCanvasMouseUp}, 
                                React.createElement("canvas", {ref: this.initCanvas})
                            ), 

                            React.createElement("div", {ref: "boxDiv", className: boxClasses}), 

                            
                                numImages > 1 && !singleImageMode &&
                                React.createElement("span", {className: arrowLeftClass, 
                                    onClick: this.onContainerSlideChange.bind(this, -1), "data-pace-tooltip": "See previous photo"}, 
                                    React.createElement("img", {className: "prints-container__arrow-icon", 
                                        src: "/images/prints/prints-slider-left-arrow-orange.svg", alt: "Previous"})
                                ), 
                            
                            
                                numImages > 1 && !singleImageMode &&
                                React.createElement("span", {className: arrowRightClass, 
                                    onClick: this.onContainerSlideChange.bind(this, 1), "data-pace-tooltip": "See next photo"}, 
                                    React.createElement("img", {className: "prints-container__arrow-icon prints-container__arrow-icon--right", 
                                        src: "/images/prints/prints-slider-left-arrow-orange.svg", alt: "Next"})
                                ), 
                            

                            
                                (!isGrid && numImages > 0 && isSelected && !this.props.canvasMode) &&
                                React.createElement("div", {className: "prints-photo-copies", "data-pace-tooltip": "Copies of this photo"}, 
                                    React.createElement(AngularDropdownComponent, {
                                        class: "dropdown-button--prints-photo-copies", 
                                        onChange: this.onImageQtyChange, 
                                        options: this.state.qtyOptions, 
                                        labelField: "label", 
                                        valueField: "id", 
                                        direction: "up", 
                                        color: "warning", 
                                        fixedWidth: "20px", 
                                        disabled: !this.props.editable, 
                                        selectedItem: currentElementQty}), 

                                    React.createElement("input", {ref: "imageQtyInput", className: "prints-photo-copies__input", type: "text", 
                                        disabled: !this.props.editable, 
                                        defaultValue: currentElementQty, 
                                        onFocus: this.onQtyInputFocus, 
                                        onChange: this.onImageQtyChange, 
                                        onBlur: this.onImageQtyBlur})
                                )
                            

                        ), 

                         
                            isSelected && !isEmpty && this.props.editable && 
                            React.createElement("img", {className: "prints-container__image-remove", 
                                 src: "/images/prints/icon-trash-orange.png", 
                                 onClick: this.onImageRemoveClick, 
                                 alt: "Delete", "data-pace-tooltip": "Delete this photo"}
                            ), 
                        

                        
                            isSelected && this.props.editable && 
                            React.createElement("img", {className: "prints-container__remove", 
                                 src: "/images/prints/x.svg", 
                                 onClick: this.onContainerRemoveClick, 
                                 alt: "Delete", "data-pace-tooltip": "Delete all photos"}
                            )
                        

                    )
                ); //end return
            }

        });
    }
]);
