angular.module('pace.proofer')
.factory('ProoferPageThumbComponent', ['AppConstants', 'SpreadThumbComponent', 'GeomService',
    function(AppConstants, SpreadThumbComponent, GeomService) {

        return React.createClass({

            propTypes: {
                spread: React.PropTypes.object.isRequired,
                numPages: React.PropTypes.number.isRequired,
                layout: React.PropTypes.object.isRequired,
                layoutController: React.PropTypes.object.isRequired,
                onPageClick: React.PropTypes.func.isRequired,
                onPageDoubleClick: React.PropTypes.func.isRequired,
                thumbScale: React.PropTypes.number,
                thumbSize: React.PropTypes.number,
                pageType: React.PropTypes.string,
                isSelected: React.PropTypes.bool,
                isCompleted: React.PropTypes.bool,
                isPending: React.PropTypes.bool,
                activeArea: React.PropTypes.object.isRequired,
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
                var layoutController = this.props.layoutController,
                    spread = this.props.spread;

                var renderers = _.filter(layoutController.renderers, function(r) {
                    return r.spread.spreadId === spread._id;
                });
                if (renderers.length===0)
                    throw new Error('Cannot find layout renderer for spread ID='+spread.id);

                this.renderer = renderers[0];
                var element = $(this.getDOMNode());
                this.canvas = element.find('.thumb-canvas')[0];

                this.renderer.canvas.on('after:render', this.afterRender);
                this.afterRender();
            },

            componentWillUnmount: function () {
                if (this.renderer && this.renderer.canvas) {
                    this.renderer.canvas.off('after:render', this.afterRender);
                }
                this.canvas = null;
                this.renderer = null;
                this.thumbEl = null;
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

            renderThumbs: function (renderer, i) {
                var canvas = this.canvas,
                    canvasSize = this.canvasSize;

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
                if (spread.numPages===1 && spread.pageNumber===1) {
                    ctx.translate(canvasSize.width/2, 0);
                }
                ctx.scale(thumbScale, thumbScale);
                ctx.translate(-padding,-padding);

                renderer.canvas.thumbRendering = true;
                renderer.canvas._renderObjects(ctx, activeGroup);
                renderer.canvas._renderActiveGroup(ctx, activeGroup);
                renderer.canvas.thumbRendering = false;

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
                this.renderThumbs(this.renderer);
            },

            getPageIndex: function(left) {
                var spread = this.props.spread;
                return spread.pageNumber - ((spread.numPages==1 || left) ? 1 : 0);
            },

            onPageClick: function(e) {
                this.props.onPageClick(this.props.spread);
            },

            onPageDoubleClick: function(e) {
                this.props.onPageDoubleClick(this.props.spread);
            },

            render: function() {
                var spread = this.props.spread,
                    layoutSize = this.props.layout.layoutSize,
                    isHorizontal = layoutSize.pageOrientation==='Horizontal',
                    isSpreadBased = this.props.pageType==='SpreadBased';

                var spreadInfo = new PACE.SpreadInfoFactory().create(this.props.spread, this.props.layout),
                    leftPage = spreadInfo.getLeftPage(),
                    rightPage = spreadInfo.getRightPage(),
                    scale = this.props.thumbScale || 1.0,
                    elWidth = Math.round(this.canvasSize.width * scale),
                    elHeight = Math.round(this.canvasSize.height * scale);

                var thumbContainerStyles = {
                    width: elWidth + 'px',
                    height: elHeight + 'px'
                };

                var canvasStyles = {};

                if (this.props.thumbScale) {
                    //apply scale and reposition page numbers
                    var prefix = ['WebkitT','MozT', 'msT', 'OT', 't'];
                    _.each(prefix, function(p) {
                        canvasStyles[p + 'ransformOrigin'] = '0 0';
                        canvasStyles[p + 'ransform'] = 'scale(' + scale + ',' + scale + ')';
                    });
                }
                var leftLabel = leftPage ? leftPage.getPageLabel() : null,
                    rightLabel = rightPage ? rightPage.getPageLabel() : null;

                if (leftLabel==='BACK') leftLabel = 'BK';
                if (rightLabel==='FRONT') rightLabel = 'FR';

                if (this.renderer && this.lastSpreadId!==this.props.spread._id) {
                    this.initCanvasSize();
                }

                var that = this;

                return (

                    <div className="spread user-select-none" onMouseDown={this.onPageClick} 
                        onDoubleClick={this.onPageDoubleClick}
                        ref={function(el) { that.thumbEl = el; }}>
                        {
                            !isSpreadBased && leftPage &&
                            <span className="page-no page-left">{leftLabel}</span>
                        }

                        <div className="thumb-container relative" style={thumbContainerStyles}>
                            <canvas className="thumb-canvas"
                                width={this.canvasSize.width}
                                height={this.canvasSize.height}
                                style={canvasStyles}>
                            </canvas>
                        </div>
                        {
                            !isSpreadBased && rightPage &&
                            <span className="page-no page-right">{rightLabel}</span>
                        }
                        {
                            isSpreadBased && leftPage &&
                            <span className="page-no page-spread">{leftLabel}</span>
                        }
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

                );
            }

        });
    }

]);
