(function() {
    'use strict';

    var LayoutComponentClass = function(SpreadComponent, GeomService, $debounce) {
        var Spread = SpreadComponent;

        return React.createClass({
            propTypes: {
                layout: React.PropTypes.object.isRequired,
                coverLayouts: React.PropTypes.array,
                layoutController: React.PropTypes.object.isRequired,
                product: React.PropTypes.object,
                productPrototype: React.PropTypes.object,
                topToolbar: React.PropTypes.string.isRequired,
                bottomToolbar: React.PropTypes.string.isRequired,
                horizontal: React.PropTypes.bool.isRequired,
                editable: React.PropTypes.bool.isRequired,
            },

            getCoverScales: function() {
                var that = this;

                if (this.props.coverLayouts && this.props.coverLayouts.length>0) {
                    return _.map(this.props.coverLayouts, function(coverLayout) {
                        return that.getScaleToFit(coverLayout, 100);
                    });
                }
            },

            getInitialState: function () {
                return {
                    hoveredSpread: null,
                    placeholderWidth: '50%'
                };
            },

            onMouseOver: function(spread) {
                this.setState({ hoveredSpread: spread });
            },

            componentWillMount: function() {
                var layoutController = this.props.layoutController;

                //layoutController.coverScales = this.getCoverScales();
                //layoutController.scale = this.getScaleToFit();

                if (this.props.horizontal) {
                    var canvasSize = GeomService.getCanvasSize(this.props.layout.layoutSize, 2, 20),
                        containerRect = $('.scrollable-container-wrapper')[0].getBoundingClientRect();

                    this.setState({placeholderWidth: (containerRect.width/2 - canvasSize.width * layoutController.scale/2) +'px' });
                }
            },

            componentDidMount: function () {
                this.topToolbarChildren = $('.' + this.props.topToolbar).children();
                this.bottomToolbarChildren = $('.' + this.props.bottomToolbar).children();

                this.props.layoutController.on('layout:scale-to-fit', this.onScaleToFit);

                if (this.props.horizontal) {
                    var parent = $(this.getDOMNode()).parent().parent().parent().parent();
                    parent.on('size-changed', this.onResize);
                    parent.on('resize-end', this.onResizeEnd);
                }
            },

            componentDidUpdate: function(prevProps, prevState) {
                if (this.props.layout!==prevProps.layout) {
                    this.getDOMNode().scrollTop = 0;
                }
                if (this.state.hoveredSpread!==prevState.hoveredSpread) {
                    var r = _.findWhere(this.props.layoutController.renderers, {spread: this.state.hoveredSpread});
                    if (!r) return;

                    var canvasParent = r.element.parent(),
                        topToolbar = canvasParent.prev(),
                        bottomToolbar = canvasParent.next();

                    topToolbar.append(this.topToolbarChildren);
                    bottomToolbar.append(this.bottomToolbarChildren);
                    this.props.layoutController.hoveredSpread = this.state.hoveredSpread;
                    this.props.layoutController.hoveredRenderer = r;
                    this.props.layoutController.scope.$apply();
                }
            },

            componentWillUnmount: function () {
                if (this.props.horizontal) {
                    var parent = $(this.getDOMNode()).parent().parent().parent();
                    parent.off('size-changed', this.onResize);
                }
                this.props.layoutController.hoveredRenderer = null;
                this.props.layoutController.hoveredSpread = null;
                this.props.layoutController.currentRenderer = null;

                if (this.topToolbarChildren)
                    this.topToolbarChildren.remove();
                if (this.bottomToolbarChildren)
                    this.bottomToolbarChildren.remove();
            },

            getDOMNode: function() {
                return ReactDOM.findDOMNode(this);
            },

            setPlaceholderWidth: function(scale) {
                if (this.props.horizontal) {
                    var canvasSize = GeomService.getCanvasSize(this.props.layout.layoutSize, 2, 20),
                        containerRect = this.getDOMNode().getBoundingClientRect(),
                        scale = this.getScaleToFit();

                    this.setState({placeholderWidth: (containerRect.width/2 - canvasSize.width * scale/2) +'px'});
                }
            },

            onScaleToFit: function() {
                this.onResizeEnd();
                this.setPlaceholderWidth();
            },

            onResizeEnd: function() {
                var scale = this.getScaleToFit(),
                    coverScales = this.getCoverScales();

                this.props.layoutController.setScaleWithDelay(scale, coverScales);
            },

            onResize: function() {
                var scale = this.getScaleToFit(),
                    coverScales = this.getCoverScales();

                this.props.layoutController.setPreviewScale(scale, coverScales);
                this.setPlaceholderWidth();
            },

            getScaleToFit: function(aLayout, aPadding) {
                var layoutController = this.props.layoutController,
                    layout = aLayout || this.props.layout,
                    layoutContainer = $(this.props.horizontal ? '.scrollable-container-wrapper' : '.spread-section'),
                    defaultPadding = 20, //(PACE.LayoutPageClass===PACE.BookBleedPage) ? 20 : 100,
                    canvasPad = aPadding || defaultPadding,
                    canvasSize = GeomService.getCanvasSize(layout.layoutSize, 2, canvasPad),
                    padding = (this.props.horizontal ? 75 : 75),
                    containerRect = { width:layoutContainer.width() - (padding * 2), height:layoutContainer.height() - (padding *2) },
                    rect = GeomService.fitRectangleProportionally( canvasSize, containerRect ),
                    scale = Math.min( rect.width / canvasSize.width, rect.height / canvasSize.height );
                return Math.max(scale, 0.05);
            },

            onLayoutScroll: function(e) {
                if ($(e.target).is('textarea')) {
                   return;
                }
                this.deboundedLayoutScroll();
            },

            deboundedLayoutScroll: $debounce(function(e) {

                var layoutController = this.props.layoutController,
                    horizontal = this.props.horizontal,
                    layoutContainer = $(horizontal ? '.scrollable-container-wrapper' : '.spread-section')[0];

                var containerRect = layoutContainer.getBoundingClientRect(),
                    mid = this.props.horizontal ?
                        containerRect.left + (containerRect.width / 2) :
                        containerRect.top + (containerRect.height / 2);

                var renderer = _.min(layoutController.renderers, function(r) {
                    var rect = r.getBoundingClientRect(),
                        rectMid = horizontal ? rect.left + (rect.width / 2) : rect.top + (rect.height / 2);

                    return Math.abs(mid - rectMid);
                });

                if (renderer) {
                    if (layoutController.currentRenderer && layoutController.currentRenderer !== renderer) {
                        layoutController.clearSelection();
                        layoutController.currentRenderer.clearSelection();
                    }

                    layoutController.setCurrentRenderer(renderer);
                }

            }, 250),

            render: function() {
                var spreads = this.props.layout.spreads,
                    containerClasses = classNames({
                        'scrollable-container': true,
                        'no-rulers': true,
                        'scrollable-container-horizontal' : this.props.horizontal
                    }),
                    placeholderStyle = { width: this.state.placeholderWidth };

                if (this.props.coverLayouts) {
                    spreads = [];
                    _.each(this.props.coverLayouts, function(coverLayout) {
                        spreads = spreads.concat(coverLayout.spreads);
                    });
                    spreads = spreads.concat(this.props.layout.spreads);
                }

                var layoutController = this.props.layoutController;
                if (layoutController.firstTime && spreads.length>0) {
                    layoutController.firstTime = false;
                    layoutController.coverScales = this.getCoverScales();
                    layoutController.scale = this.getScaleToFit();
                }

                return (
                    <div className={containerClasses} onScroll={this.onLayoutScroll}>

                        <div className="spread-placeholder" style={placeholderStyle}>&nbsp;</div>

                        {spreads.map(function (spread, i) {

                            var topClasses = classNames({
                                'hidden': this.state.hoveredSpread!=spread,
                                'qa-edit-toolbar': true,
                                'qa-edit-toolbar-up': true,
                                'fixed-width': true,
                                'top-toolbar': true
                            });

                            var bottomClasses = classNames({
                                'hidden': this.state.hoveredSpread!=spread,
                                'qa-edit-toolbar': true,
                                'qa-edit-toolbar-down': true,
                                'fixed-width': true,
                                'bottom-toolbar': true
                            });
                            var coverSpread = this.props.coverLayouts && i<this.props.coverLayouts.length,
                                layout = coverSpread ? this.props.coverLayouts[i] : this.props.layout;

                            if (!spread._id)
                                spread._id = _.uniqueId('spread-') + _.now();

                            return (
                                <div key={i} className="spread text-center"
                                    onMouseOver={this.onMouseOver.bind(this, spread)}>
                                    <div className="canvas-wrapper">

                                        <div className={topClasses}></div>

                                        <Spread
                                            spread={spread}
                                            layout={layout}
                                            layoutController={this.props.layoutController}
                                            product={this.props.product}
                                            productPrototype={this.props.productPrototype}/>

                                        <div className={bottomClasses}></div>

                                    </div>
                                </div>
                            );
                        }, this)}

                    </div>
                );
            }
        });
    };

    angular.module('pace.layout').provider('LayoutComponent', function() {
        this.$get = ['SpreadComponent', 'GeomService', '$debounce', LayoutComponentClass ];
    });

})();
