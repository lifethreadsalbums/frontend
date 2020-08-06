angular.module('pace.order')

angular.module('pace.order')
.factory('PrintsImageItemComponent', ['$state', '$controller', 'StoreConfig',
    function($state, $controller, StoreConfig) {

        return React.createClass({

            propTypes: {
                element: React.PropTypes.object.isRequired,
                selectedElement: React.PropTypes.object,
                scale: React.PropTypes.number.isRequired,
                onMouseDown: React.PropTypes.func.isRequired,
                onMouseOver: React.PropTypes.func.isRequired,
                onDeleteClick: React.PropTypes.func.isRequired,
            },

            render: function() {
                var element = this.props.element,
                    s = this.props.scale;

                var isRotated = element.rotation===90 || element.rotation===270;
                var canvasSize = _.pick(element, 'width', 'height');

                if (isRotated) {
                    var tmp = canvasSize.width;
                    canvasSize.width = canvasSize.height;
                    canvasSize.height = tmp;
                }

                var rect = {
                    width: Math.round(canvasSize.width * s),
                    height: Math.round(canvasSize.height * s)
                };

                var url = StoreConfig.imageUrlPrefix + 'lowres/' + element.imageFile.url;

                if (element.imageFile.thumbnailAsBase64) {
                    url = element.imageFile.thumbnailAsBase64;
                } else if (element.imageFile.url) {
                    url = StoreConfig.imageUrlPrefix + 'thumbnail/' + element.imageFile.url;
                }

                var itemStyle = {
                    'display': 'inline-block',
                    'position': 'relative',
                    'width': rect.width + 'px',
                    'height': rect.height + 'px',
                    'margin-left': '25px',
                    'zIndex': 0,
                    'overflow': 'hidden',
                    'vertical-align': 'middle',
                    'background': '#fff'
                };

                var s = this.props.scale;
                var imageX = Math.round(element.imageX * s),
                    imageY = Math.round(element.imageY * s),
                    imageWidth = Math.ceil(element.imageWidth * s),
                    imageHeight = Math.ceil(element.imageHeight * s),
                    width = Math.round(element.width * s),
                    height = Math.round(element.height * s);

                var contentStyle = {
                    position: 'absolute',
                    left: imageX + 'px',
                    top: imageY + 'px',
                    width: imageWidth + 'px',
                    height: imageHeight + 'px',
                    'max-width': 'none',
                    //'background-image': 'url(' + url + ')',
                    //'background-size': imageWidth + 'px ' + imageHeight + 'px',
                    //'background-repeat': 'no-repeat',

                    'transform-origin': 'top left',
                    'transform': 'rotate(' + element.imageRotation + 'deg)',

                    /*
                    'image-rendering': 'optimizeSpeed',
                    'image-rendering': '-moz-crisp-edges',
                    'image-rendering': '-o-crisp-edges',
                    'image-rendering': '-webkit-optimize-contrast',
                    'image-rendering': 'pixelated',
                    'image-rendering': 'optimize-contrast',
                    '-ms-interpolation-mode': 'nearest-neighbor'
                    */
                }

                var frameStyle = {
                    'position': 'absolute',
                    'width': width + 'px',
                    'height': height + 'px',
                    'transform-origin': 'top left',
                    'transform': 'rotate(' + element.rotation + 'deg)',
                };

                if (element.rotation === 90) {
                    frameStyle.left = height + 'px';
                } else if (element.rotation === 180) {
                    frameStyle.left = width + 'px';
                    frameStyle.top = height + 'px';
                } else if (element.rotation === 270) {
                    frameStyle.top = width + 'px';
                }

                if (element === this.props.selectedElement) {
                    itemStyle.visibility = 'hidden';
                }

                return (
                     <div onMouseDown={this.props.onMouseDown} onMouseOver={this.props.onMouseOver} style={itemStyle}>
                         <div style={frameStyle}>
                             <img width={imageWidth} height={imageHeight} src={url} style={contentStyle}/>
                         </div>
                    </div>
                );
            }

        });

    }
])

.factory('PrintsImageListComponent', ['$state', '$controller', 'StoreConfig', 'PrintsImageItemComponent',
    function($state, $controller, StoreConfig, PrintsImageItemComponent) {

        return React.createClass({

            propTypes: {
                spread: React.PropTypes.object.isRequired,
                layoutController: React.PropTypes.object.isRequired,
                onSelectionChange: React.PropTypes.func.isRequired,
                onDeleteClick: React.PropTypes.func.isRequired,
            },

            getInitialState: function () {
                return {  };
            },

            componentWillMount: function () {

            },

            getDOMNode: function() {
                return ReactDOM.findDOMNode(this);
            },

            componentWillReceiveProps: function (nextProps) {
                if (nextProps.spread!==this.props.spread) {
                    this.selectElement(null);
                }
            },

            selectElement: function(element) {
                this.setState({selectedElement:element});
                this.props.onSelectionChange(element);
            },

            componentDidMount: function () {
                this.props.layoutController.on('layout:selection-modified', this.onSelectionModified.bind(this));
                this.forceUpdate();
            },

            onSelectionModified: function() {
                //TODO: fix
                this.forceUpdate();
                this.forceUpdate();
            },

            initCanvas:function(canvas) {

                var el = $(canvas);
                var scope =  {
                        spread: { numPages: 1 },
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

                this.rendererScope = scope;
                ctrl.element = el;
                ctrl.register();
                this.renderer = ctrl;
            },

            onImageClick: function(element, e) {
                element.locked = true;
                var spread = _.omit(this.props.spread, 'elements');
                spread.elements = [element];

                var layoutSize = this.getLayoutSize(element, spread);

                this.renderer.spread = this.rendererScope.spread = spread;
                this.renderer.layout = this.rendererScope.layout = { layoutSize: layoutSize, viewState:{} };

                var node = this.getDOMNode(),
                    containerRect = node.getBoundingClientRect(),
                    scale = this.getScale(layoutSize, containerRect );

                this.renderer.makePages();
                this.renderer.scale = this.renderer.canvas.scale = scale;
                this.renderer.render();

                this.props.layoutController.selectElements( [element], true );
                this.props.layoutController.currentTool.beginEdit();
                this.props.layoutController.currentEditor.onDeleteClick = this.onDeleteClick.bind(this, element);

                this.selectElement(element);
            },

            onImageMouseOver: function(element, e) {
                //this.preloadCanvas(element);
            },

            onDeleteClick: function(element, e) {
                e.stopPropagation();
                this.props.onDeleteClick(element);
                if (element === this.state.selectedElement) {
                    this.setState({selectedElement:null});
                }
            },

            preloadCanvas: function(element) {
                // element.locked = true;
                // var spread = _.omit(this.props.spread, 'elements');
                // spread.elements = [element];

                // var layoutSize = this.getLayoutSize(element, spread);

                // this.renderer.spread = this.rendererScope.spread = spread;
                // this.renderer.layout = this.rendererScope.layout = { layoutSize: layoutSize, viewState:{} };


                // this.renderer.makePages();
                // this.renderer.scale = this.renderer.canvas.scale = this.scale;
                // this.renderer.render();
            },

            componentDidUpdate: function() {

            },

            getLayoutSize: function(element, spread) {
                var layoutSize = angular.copy(spread.layoutSize),
                    bleed = layoutSize.bleedOutside * 2;

                layoutSize.width = element.width - bleed;
                layoutSize.height = element.height - bleed;
                return layoutSize;
            },

            getCanvasSize: function(layoutSize) {
                var bleed = layoutSize.bleedOutside * 2,
                    canvasSize = {
                        width : layoutSize.width + bleed,
                        height : layoutSize.height + bleed
                    };
                return canvasSize;
            },

            getScale: function(layoutSize, containerRect) {
                var canvasSize = this.getCanvasSize(layoutSize);

                var rect = PACE.GeomService.fitRectangleProportionally( canvasSize,
                    { width:containerRect.width, height:containerRect.height - 40 } );
                var scale = rect.width / canvasSize.width;

                return scale;
            },

            onMouseDown: function(e) {
                //this.setState({selectedElement:null});
            },

            onKeyDown: function(e) {
                if ((e.keyCode === 8 || e.keyCode === 46) && this.state.selectedElement) {
                    this.onDeleteClick(this.state.selectedElement, e);
                }
            },

            render: function() {
                var spread = this.props.spread,
                    containerRect,
                    elements = [];

                var node = this.getDOMNode(),
                    containerStyle = {};

                if (node && spread) {
                    elements = spread.elements;
                    containerRect = node.getBoundingClientRect();

                    // var minScale = Number.MAX_VALUE;
                    // for (var i = 0; i < elements.length; i++) {
                    //     var scale = this.getScale( this.getLayoutSize(elements[i], spread), containerRect );
                    //     if (scale<minScale) minScale = scale;
                    // }
                    // this.scale = minScale;
                }

                var canvasStyle = {
                    'position': 'absolute',
                    'left': 0,
                    'top': 0,
                    'display': 'none',
                    'overflow': 'hidden'
                };

                if (this.state.selectedElement) {
                    var element = this.state.selectedElement;
                    var idx = elements.indexOf(element),
                        elNode = ReactDOM.findDOMNode(this.refs['image-' + idx]);

                    if (elNode) {
                        var layoutSize = this.getLayoutSize(element, spread);
                        var canvasSize = this.getCanvasSize(layoutSize);
                        var scale = this.getScale(layoutSize, containerRect);

                        var pad = (200 - spread.layoutSize.bleedOutside);
                        var r = elNode.getBoundingClientRect(),
                            midx = elNode.offsetLeft + (r.width/2),
                            midy = elNode.offsetTop + (r.height/2);

                        canvasStyle.left = Math.round(midx - ((200 + layoutSize.width/2) * scale) );
                        canvasStyle.top = Math.round(midy - ((200 + layoutSize.height/2) * scale) );
                        canvasStyle.width = Math.round((layoutSize.width + pad*2) * scale) + 'px';
                        canvasStyle.height = Math.round((layoutSize.height + pad*2) * scale) + 'px';
                        canvasStyle.display = 'block';
                    }
                }

                return (

                    <div id="prints-containers-bottom" className="prints-containers-bottom" tabIndex="0"
                         onMouseDown={this.onMouseDown}
                         onKeyDown={this.onKeyDown}>
                        <div className="prints-containers-bottom--wrapper">

                            {
                                elements.map(function (element, i) {

                                    var ref = 'image-' + i;
                                    var scale = this.getScale( this.getLayoutSize(element, spread), containerRect );

                                    return (

                                        <PrintsImageItemComponent
                                            ref={ref}
                                            element={element}
                                            selectedElement={this.state.selectedElement}
                                            scale={scale}
                                            onMouseDown={this.onImageClick.bind(this, element)}
                                            onMouseOver={this.onImageMouseOver.bind(this, element)}
                                            onDeleteClick={this.onDeleteClick.bind(this, element)} />

                                    );

                            }, this)}

                            <div style={canvasStyle}>
                                <canvas ref={this.initCanvas}></canvas>
                            </div>

                        </div>
                    </div>

                );
            }
        });
    }

]);
