(function() {
    'use strict';

    var SpreadThumbComponentClass = function(GeomService, DataTransferService) {

        return React.createClass({

            propTypes: {
                spread: React.PropTypes.object.isRequired,
                numPages: React.PropTypes.number.isRequired,
                layout: React.PropTypes.object.isRequired,
                layoutController: React.PropTypes.object.isRequired,
                onPageClick: React.PropTypes.func.isRequired,
                onPageMove: React.PropTypes.func.isRequired,
                onDragStart: React.PropTypes.func.isRequired,
                onDragEnd: React.PropTypes.func.isRequired,
                leftPageSelected: React.PropTypes.bool.isRequired,
                rightPageSelected: React.PropTypes.bool.isRequired,
                thumbScale: React.PropTypes.number,
                thumbSize: React.PropTypes.number,
                pageType: React.PropTypes.string,
                isCompleted: React.PropTypes.bool,
                isPending: React.PropTypes.bool
            },

            getDOMNode: function() {
                return ReactDOM.findDOMNode(this);
            },

            getInitialState: function () {
                return { dropClass: null };
            },

            componentWillMount: function () {
                this.initCanvasSize();
            },

            componentDidMount: function () {
                this.initRenderer();
            },

            componentWillUnmount: function () {
                if (this.renderer && this.renderer.canvas) {
                    this.renderer.canvas.off('after:render', this.afterRender);
                }
                this.canvas = null;
                this.renderer = null;
            },

            componentDidUpdate: function(prevProps, prevState) {
                if (this.renderer &&
                    (this.lastSpreadId!==this.props.spread._id || this.lastNumPages!==this.props.spread.numPages)) {
                    this.afterRender();
                }
            },

            initCanvasSize: function() {
                var spreadInfo = new PACE.SpreadInfoFactory().create(this.props.spread, this.props.layout),
                    padding = 0,
                    size = this.props.thumbSize || 150;

                spreadInfo.padding = 0;
                var rect = spreadInfo.getCanvasSize();

                this.canvasSize = GeomService.fitRectangleProportionally(rect, {width: size, height: size});
                this.canvasSize.width = Math.round(this.canvasSize.width);
                this.canvasSize.height = Math.round(this.canvasSize.height);

                this.scale = this.canvasSize.width / rect.width;
            },

            renderThumbs: function (renderer, canvas, canvasSize) {

                var layoutSize = this.props.layout.layoutSize,
                    isHorizontal = layoutSize.pageOrientation==='Horizontal',
                    thumbScale = this.scale / renderer.scale,
                    padding = renderer.padding * renderer.scale,
                    ctx = this.canvas.getContext('2d'),
                    spread = this.props.spread;

                ctx.save();
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (spread.numPages===1) {
                    ctx.beginPath();
                    if (spread.pageNumber===1)
                        ctx.rect(canvasSize.width/2, 0, canvasSize.width/2, canvasSize.height);
                    else
                        ctx.rect(0, 0, canvasSize.width/2, canvasSize.height);
                    ctx.clip();
                }

                var activeGroup = renderer.canvas.getActiveGroup();

                ctx.fillStyle = '#ffffff';
                if (spread.numPages===1 && spread.pageNumber===1) {
                    ctx.fillRect(canvasSize.width/2, 0, canvasSize.width, canvasSize.height);
                } else {
                    if (layoutSize.gapBetweenPages>0) {
                        var gap = layoutSize.gapBetweenPages * this.scale / 2;
                        ctx.fillRect(0, 0, canvasSize.width / 2 - gap, canvasSize.height);
                        ctx.fillRect(canvas.width/2 + gap, 0, canvasSize.width / 2 - gap, canvasSize.height);
                    } else {
                        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
                    }
                }
                if (spread.numPages===1) {
                    if (spread.pageNumber===1) {
                        ctx.translate(canvasSize.width/4, 0);
                    } else {
                        ctx.translate(-canvasSize.width/4, 0);
                    }
                }
                ctx.scale(thumbScale, thumbScale);
                ctx.translate(-padding,-padding);

                renderer.canvas.thumbRendering = true;
                renderer.canvas._renderObjects(ctx, activeGroup);
                renderer.canvas._renderActiveGroup(ctx, activeGroup);
                renderer.canvas.thumbRendering = false;

                if (spread.hasErrorsLeft || spread.hasErrorsRight) {
                    var render = renderer.spreadInfo.getLayoutWarningRenderFn(renderer.canvas, ctx, true);
                    render(1);
                }

                ctx.restore();

                if (layoutSize.gapBetweenPages===0 && layoutSize.drawSpine) {
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    if (isHorizontal) {
                        var x = Math.round(canvasSize.width/2) - 0.5;
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, canvasSize.height);
                    } else {
                        var y = Math.round(canvasSize.height/2) - 0.5;
                        ctx.moveTo(0, y);
                        ctx.lineTo(canvasSize.width, y);
                    }
                    ctx.stroke();
                }
                this.lastSpreadId = spread._id;
                this.lastNumPages = spread.numPages;
            },

            afterRender: function () {
                this.renderThumbs(this.renderer, this.canvas, this.canvasSize);
            },

            initRenderer: function () {
                var layoutController = this.props.layoutController,
                    spread = this.props.spread;

                var renderer = _.findWhere(layoutController.renderers, { spread:spread });
                if (!renderer)
                    throw new Error('Cannot find layout renderer for spread ID='+spread.id);

                var element = $(this.getDOMNode());
                this.renderer = renderer;
                this.canvas = element.find('.thumb-canvas')[0];

                renderer.canvas.on('after:render', this.afterRender);
                this.afterRender();
            },

            getPageIndex: function(left) {
                var spread = this.props.spread;
                return spread.pageNumber - ((spread.numPages==1 || left) ? 1 : 0);
            },

            onPageClick: function(left, e) {
                if (this.props.layout.layoutSize.coverType) return;

                this.props.onPageClick({
                    index: this.getPageIndex(left),
                    ctrlKey: e.ctrlKey || e.metaKey,
                    shiftKey: e.shiftKey,
                    spread: this.props.spread
                });
            },

            onDragStart: function(left, e) {
                this.props.onDragStart({
                    index: this.getPageIndex(left),
                    dataTransfer: DataTransferService.getDataTransfer(e, 'nativeEvent')
                });
            },

            onDragEnd: function(left, e) {
                this.props.onDragEnd({
                    index: this.getPageIndex(left),
                    dataTransfer: e.nativeEvent.dataTransfer,
                });
            },

            onDragEnter: function(e) {
                if (this.props.layout.layoutSize.coverType) return;
                e.preventDefault();
            },

            onDragLeave: function(e) {
                e.preventDefault();
                this.removeDropPlaceholder();
            },

            onDragOver: function(e) {
                if (this.props.layout.layoutSize.coverType) return;

                DataTransferService.setDetailPageXY(e, 'nativeEvent');

                var dt = DataTransferService.getDataTransfer(e, 'nativeEvent'),
                    spread = this.props.spread,
                    isHorizontal = this.props.layout.layoutSize.pageOrientation==='Horizontal',
                    element = this.getDOMNode();

                if (PACE.utils.containsDragType(dt.types, 'text/x-pace-pages')) {
                    e.preventDefault();
                    dt.dropEffect = 'move';

                    var hasRightPage = spread.numPages===2 || spread.pageNumber===1,
                        hasLeftPage = spread.numPages===2 || spread.pageNumber!==1,
                        index = this.getPageIndex(false),
                        rect = element.getBoundingClientRect(),
                        pageIdx = 0, p1, p2, pagePos,
                        dropClass = 'drop-middle';

                    var leftPageArea = 0.25,
                        rightPageArea = 0.75;

                    if (this.props.pageType==='SpreadBased') {
                        leftPageArea = 0.5;
                        rightPageArea = 0.5;
                    }

                    if (isHorizontal) {
                        p1 = rect.left + (rect.width * leftPageArea);
                        p2 = rect.left + (rect.width * rightPageArea);
                        pagePos = e.nativeEvent.pageX;
                    } else {
                        p1 = rect.top + (rect.height * leftPageArea);
                        p2 = rect.top + (rect.height * rightPageArea);
                        pagePos = e.nativeEvent.pageY;
                    }

                    // if (isHorizontal) {
                    //     p1 = rect.left + (rect.width * 0.5);
                    //     p2 = rect.left + (rect.width * 0.5);
                    //     pagePos = e.nativeEvent.pageX;
                    // } else {
                    //     p1 = rect.top + (rect.height * 0.5);
                    //     p2 = rect.top + (rect.height * 0.5);
                    //     pagePos = e.nativeEvent.pageY;
                    // }

                    if (pagePos < p1 && hasLeftPage) {
                        pageIdx = -1;
                        dropClass = 'drop-left';
                    } else if (pagePos > p2 && hasRightPage) {
                        pageIdx = 1;
                        dropClass = 'drop-right';
                    }

                    this.currentDropIndex = index + pageIdx;
                    this.setState({dropClass: (isHorizontal ? 'h-':'v-') + dropClass });
                }
            },

            onDrop: function(e) {
                e.preventDefault();
                this.props.onPageMove({index: this.currentDropIndex});
                this.removeDropPlaceholder();
            },

            onDoubleClick: function(e) {
                var layoutController = this.props.layoutController,
                    spread = this.props.spread;

                var r = _.findWhere(layoutController.renderers, {spread:spread});
                layoutController.setCurrentRenderer(r);
                r.makeFirstVisible();
            },

            removeDropPlaceholder: function() {
                this.setState({dropClass: null});
            },

            render: function() {
                var spread = this.props.spread,
                    layoutSize = this.props.layout.layoutSize,
                    isHorizontal = layoutSize.pageOrientation==='Horizontal';

                var thumbStyles = {
                    'width': isHorizontal ? '50%' : '100%',
                    'height': isHorizontal ? '100%' : '50%',
                };

                var leftThumbClasses = classNames({
                    'thumb-selection': true,
                    'thumb-left': true,
                    'active': this.props.leftPageSelected
                });

                var rightThumbClasses = classNames({
                    'thumb-selection': true,
                    'thumb-right': true,
                    'active': this.props.rightPageSelected
                });

                var thumbContainerClasses = {
                    'thumb-container' : true,
                    'relative': true
                };
                if (this.state.dropClass)
                    thumbContainerClasses[this.state.dropClass] = true;
                var thumbContainerClassSet = classNames(thumbContainerClasses);

                var spreadInfo = new PACE.SpreadInfoFactory().create(this.props.spread, this.props.layout),
                    leftPage = spreadInfo.getLeftPage(),
                    rightPage = spreadInfo.getRightPage(),
                    scale = this.props.thumbScale || 1.0,
                    elWidth = Math.round(this.canvasSize.width * scale);

                var thumbContainerStyles = {
                    width: elWidth + 'px',
                    height: Math.round(this.canvasSize.height * scale) + 'px'
                };

                var canvasStyles = {},
                    pageLeftStyles = {},
                    pageRightStyles = {};

                if (this.props.thumbScale) {
                    //apply scale and reposition page numbers
                    var prefix = ['WebkitT','MozT', 'msT', 'OT', 't'];
                    _.each(prefix, function(p) {
                        canvasStyles[p + 'ransformOrigin'] = '0 0';
                        canvasStyles[p + 'ransform'] = 'scale(' + scale + ',' + scale + ')';
                    });
                    pageLeftStyles.right = (elWidth + 25) + 'px';
                    pageRightStyles.left = (elWidth + 25) + 'px';
                }
                var leftLabel = leftPage ? leftPage.getPageLabel() : null,
                    rightLabel = rightPage ? rightPage.getPageLabel() : null;

                if (leftLabel==='BACK') leftLabel = 'BK';
                if (rightLabel==='FRONT') rightLabel = 'FR';

                if (!layoutSize.drawPageNumbers) {
                    leftPage = null;
                    rightPage = null;
                }

                if (this.renderer && this.lastSpreadId!==this.props.spread._id) {
                    this.initCanvasSize();
                }

                return (

                    <div className="spread user-select-none"
                        onDragOver={this.onDragOver} onDragEnter={this.onDragEnter}
                        onDragLeave={this.onDragLeave} onDrop={this.onDrop}
                        onDoubleClick={this.onDoubleClick}>
                        {
                            leftPage ?
                            <span className="page-no page-left" style={pageLeftStyles}>{leftLabel}</span>
                            : null
                        }

                        <div className={thumbContainerClassSet} style={thumbContainerStyles}>
                            <canvas className="thumb-canvas"
                                width={this.canvasSize.width}
                                height={this.canvasSize.height}
                                style={canvasStyles}>
                            </canvas>
                            <div className={leftThumbClasses}
                                style={thumbStyles}
                                onMouseDown={this.onPageClick.bind(this, true)}
                                onDragStart={this.onDragStart.bind(this, true)}
                                onDragEnd={this.onDragEnd.bind(this, true)}
                                draggable="true">
                            </div>
                            <div className={rightThumbClasses}
                                style={thumbStyles}
                                onMouseDown={this.onPageClick.bind(this, false)}
                                onDragStart={this.onDragStart.bind(this, false)}
                                onDragEnd={this.onDragEnd.bind(this, false)}
                                draggable="true">
                            </div>
                            <div className="dots">
                                {
                                    this.props.isCompleted &&
                                    <span className="dot dot--green"></span>
                                }
                                {
                                    this.props.isPending &&
                                    <span className="dot dot--orange"></span>
                                }
                            </div>
                        </div>
                        {
                            rightPage ?
                            <span className="page-no page-right" style={pageRightStyles}>{rightLabel}</span>
                            : null
                        }

                        
                    </div>

                );
            }
        });
    };

    angular.module('pace.layout').provider('SpreadThumbComponent', function() {
        this.$get = ['GeomService', 'DataTransferService', SpreadThumbComponentClass ];
    });

})();
