angular.module('pace.proofer')

.factory('FlipBookComponent', ['$state', 'StoreConfig', '$rootScope', '$compile', 'SpreadComponent', 'FlipBookCoverComponent', 'GeomService',
    'CommentTool', 'ProoferService',
    function($state, StoreConfig, $rootScope, $compile, SpreadComponent, FlipBookCoverComponent, GeomService,
        CommentTool, ProoferService) {
        return React.createClass({

            propTypes: {
                user:              React.PropTypes.object.isRequired,
                layout:            React.PropTypes.object.isRequired,
                coverLayout:       React.PropTypes.object.isRequired,
                layoutController:  React.PropTypes.object.isRequired,
                product:           React.PropTypes.object.isRequired,
                productPrototype:  React.PropTypes.object.isRequired,
                onPageChanged:     React.PropTypes.func.isRequired,
                onPageChanging:    React.PropTypes.func.isRequired,
                currentSpread:     React.PropTypes.object,
                containerSelector: React.PropTypes.string.isRequired,
                commentsEnabled:   React.PropTypes.bool.isRequired
            },

            getScaleToFit: function() {
                var layoutController = this.props.layoutController,
                    layout = this.props.layout,
                    container = document.querySelector(this.props.containerSelector),
                    canvasSize = GeomService.getCanvasSize(layout.layoutSize, 2, 0),
                    margin = 75,
                    rect = container.getBoundingClientRect(),
                    containerRect = { width: rect.width - (margin * 2), height: rect.height - (margin * 2) },
                    rect2 = GeomService.fitRectangleProportionally( canvasSize, containerRect ),
                    scale = Math.min( rect2.width / canvasSize.width, rect2.height / canvasSize.height );
                return Math.max(scale, 0.05);
            },

            isSpreadBased: function() {
                return this.props.productPrototype.productPageType === 'SpreadBased';
            },

            componentWillMount: function() {
                var layoutController = this.props.layoutController;
                layoutController.scale = this.getScaleToFit();
            },

            componentDidMount: function() {
                var node = ReactDOM.findDOMNode(this).getElementsByClassName('flipbook')[0],
                    scale = this.props.layoutController.scale,
                    layout = this.props.layout,
                    canvasSize = GeomService.getCanvasSize(layout.layoutSize, 2, 0);

                var props = {
                    width: Math.ceil(canvasSize.width * scale),
                    height: Math.ceil(canvasSize.height * scale),
                    duration: 1500,
                    elevation: 150,
                    gradients: true
                };

                //console.log('componentDidMount', props.width, props.height, scale);

                this.turnJs = $(node);
                this.turnJs.turn(props);

                this.turnJs.bind("turned", this.onPageTurned.bind(this));
                this.turnJs.bind("turning", this.onPageTurning.bind(this));

                if (this.isSpreadBased()) {
                    this.turnJs.turn('page', 2);
                }

                var layoutController = this.props.layoutController;
                layoutController.currentTool = new CommentTool(layoutController, this.props.user);

                ProoferService.onChange(this.onCommentChange);

                this.listeners = [
                    this.props.layoutController.scope.$on('layout:find-image', this.onFindImage)
                ];

                var handler = this.onResize.bind(this);
                this.listeners.push(function() { window.removeEventListener('resize', handler); });
                window.addEventListener('resize', handler);

                setTimeout(handler, 500);
            },

            componentWillUnmount: function () {
                 _.each(this.listeners, function(listener) { listener(); });
                // var node = ReactDOM.findDOMNode(this);
                // while (node.firstChild) {
                //     node.removeChild(node.firstChild);
                // };
                this.turnJs = null;
            },

            refreshArrows: function(page) {
                if (!this.turnJs) return;

                var page = Math.floor(page / 2) * 2,
                    numPages = this.turnJs.turn('pages'),
                    isFirst = page === (this.isSpreadBased() ? 2 : 0),
                    isLast = page === (this.isSpreadBased() ? numPages - 1 : numPages);

                this.prevArrow.style.display = isFirst ? 'none' : 'block';
                this.nextArrow.style.display = isLast ? 'none' : 'block';
            },

            onResize: function() {
                var scale = this.getScaleToFit();

                var layout = this.props.layout,
                    canvasSize = GeomService.getCanvasSize(layout.layoutSize, 2, 0);

                var width = Math.ceil(canvasSize.width * scale),
                    height = Math.ceil(canvasSize.height * scale);

                this.props.layoutController.setScale(scale);
                this.turnJs.turn('size', width, height);

                //console.log('onResize', width, height, scale);
            },

            onPageTurning: function(event, page, view) {
                this.refreshArrows(page);
                this.props.onPageChanging(page);
            },

            onPageTurned: function(event, page, view) {
                this.refreshArrows(page);
                this.props.onPageChanged(page);
            },

            onPrevClick: function() {
                this.turnJs.turn('previous');
            },

            onNextClick: function() {
                this.turnJs.turn('next');
            },

            onFindImage: function(e, image) {
                //find renderer
                var firstPage = true;
                var ctrl = this.props.layoutController;
                for (var i = 0; i < ctrl.renderers.length; i++) {
                    var r = ctrl.renderers[i];
                    var el = _.find(r.spread.elements, function(el) {
                        return el.imageFile && el.imageFile.id===image.id;
                    });
                    if (el) {
                        if (firstPage) this.turnJs.turn('page', i + 1);
                        firstPage = false;
                    }
                }
            },

            componentDidUpdate: function(prevProps, prevState) {

                //turn to selected spread
                if (prevProps.currentSpread !== this.props.currentSpread && this.selectedPage >= 0) {
                    var curPage = this.turnJs.turn('page'),
                        page = this.selectedPage + 1;
                    if (page !== curPage) {
                        this.turnJs.turn('page', page);
                    }
                }
                
                this.refreshArrows(this.turnJs.turn('page'));

                if (this.isSpreadBased()) {
                    var pageObjs = this.turnJs.data().pageObjs;
                    for (var key in pageObjs) {
                        var pageData = pageObjs[key].data();
                        
                        var cornerSize = key==='2' ? 0 : 30;
                        if (pageData && 
                            pageData.f && 
                            pageData.f.opts) {
                            pageData.f.opts.cornerSize = cornerSize;
                        }
                    }
                }
                
            },

            onCommentChange: function() {
                this.forceUpdate();
            },

            render: function() {
                var layout = this.props.layout,
                    coverLayout = this.props.coverLayout,
                    spreads = layout.spreads,
                    comments = ProoferService.getComments(),
                    pageClass = 'page',
                    pages = [],
                    that = this,
                    isSpreadBased = this.isSpreadBased();

                this.selectedPage = -1;

                if (isSpreadBased) {
                    pageClass += ' hard';
                    //add empty spread
                    pages.push({
                        numPages: 1,
                        elements: [],
                        pageNumber: 0,
                        spreadId: 0
                    });
                }
                //console.log('selectedEdit', this.props.selectedEdit)

                // if (coverLayout && coverLayout.spreads.length>0) {
                //     spreads = coverLayout.spreads.concat(spreads);

                //     var spreadInfo = PACE.SpreadInfoFactory.create(coverLayout.spreads[0], coverLayout);
                // }

                for (var i = 0; i < spreads.length; i++) {
                    var s = spreads[i],
                        offsetX = s.numPages===1 ? layout.layoutSize.width/2 : 0;
                    for (var j = 0; j < s.numPages; j++) {
                        var elements = angular.copy(s.elements);
                        for (var k = 0; k < elements.length; k++) {
                            var el = elements[k];
                            el.x -= offsetX;

                            var elComments = _.filter(comments, function(c) {
                                return !c.isArchived && c.element && c.element.id === el.id;
                            });
                            el.hasComments = this.props.commentsEnabled && elComments.length>0;
                        }
                
                        if (this.props.currentSpread && this.props.currentSpread._id===s._id) {
                            this.selectedPage = pages.length;
                        }

                        pages.push({
                            numPages: 1,
                            elements: elements,
                            pageNumber: j,
                            spreadId: s._id,
                            comment: s.comment,
                            flipBookSide: j===0 && (i>0 || isSpreadBased) ? 'left' : 'right'
                        });

                        offsetX = layout.layoutSize.width;
                    }
                }

                var pageStyle = {};
                if (!this.props.commentsEnabled) {
                    pageStyle['pointer-events'] = 'none';
                }

                var spreadInfoFactory = {
                    create: function(spread, layout) {
                        var spreadInfo = new PACE.Spread(spread, layout);
                        spreadInfo.padding = 0;
                        spreadInfo.pageClass = PACE.BookBleedPage;
                        spreadInfo.pages[0].x = 0;

                        spreadInfo.getCanvasSize = (function() {
                            return _.pick(this.layout.layoutSize, 'width', 'height');
                        }).bind(spreadInfo);

                        return spreadInfo;
                    }
                };
                //console.log('flipbook render');
                var refFn = function(prop, val) { this[prop] = val; };

                return (
                    React.createElement("div", {className: "flipboook__container"}, 
                        React.createElement("div", {className: "flipbook", id: "flipbook"}, 

                            /*
                            <FlipBookCoverComponent
                                coverLayout={this.props.coverLayout}
                                layoutController={this.props.layoutController}
                                product={this.props.product}
                                productPrototype={this.props.productPrototype}
                                mode="CoverRight"/>
                            <div className="page hard"></div>
                            */

                            
                                pages.map(function (spread, i) {
                                    return (
                                        React.createElement("div", {key: i, className: pageClass, style: pageStyle}, 

                                            React.createElement(SpreadComponent, {
                                                spread: spread, 
                                                layout: layout, 
                                                layoutController: this.props.layoutController, 
                                                product: this.props.product, 
                                                productPrototype: this.props.productPrototype, 
                                                spreadInfoFactory: spreadInfoFactory, 
                                                flipBookSide: spread.flipBookSide})

                                        )
                                    );
                                }, this)
                            
                        ), 
                        React.createElement("span", {className: "slideshow__prev", ref: refFn.bind(this, 'prevArrow'), onClick: this.onPrevClick}), 
                        React.createElement("span", {className: "slideshow__next", ref: refFn.bind(this, 'nextArrow'), onClick: this.onNextClick})
                    )
                );
            }

        });
    }
])
.factory('FlipBookCoverComponent', ['$state', 'StoreConfig', '$rootScope', '$compile',
    function($state, StoreConfig, $rootScope, $compile) {
        return React.createClass({

            propTypes: {
                coverLayout: React.PropTypes.object.isRequired,
                layoutController: React.PropTypes.object.isRequired,
                product: React.PropTypes.object.isRequired,
                productPrototype: React.PropTypes.object.isRequired,
                mode: React.PropTypes.string.isRequired
            },

            componentDidMount: function() {
                var node = ReactDOM.findDOMNode(this);

                var html = '<cover-preview class="animate-show" '+
                    'cover-layout="coverLayout" '+
                    'product="product" '+
                    'product-prototype="productPrototype" '+
                    'layout-controller="layoutController" '+
                    'layout-container="flipbook__cover" '+
                    'mode="mode"></cover-preview>';

                var element = angular.element(html),
                    scope = $rootScope.$new();

                _.extend(scope, this.props);

                node.appendChild(element[0]);
                $compile(element)(scope);
                this.element = element[0];
                this.scope = scope;
            },

            componentWillUnmount: function () {
                var node = ReactDOM.findDOMNode(this);
                while (node.firstChild) {
                    node.removeChild(node.firstChild);
                };
                this.scope.$destroy();
                this.scope = null;
                this.element = null;
            },

            render: function() {
                if (this.scope) {
                    _.extend(this.scope, this.props);
                    if (!this.scope.$$phase) {
                        this.scope.$apply();
                    }
                }
                return (
                    React.createElement("div", {className: "flipbook__cover hard", style: {width:'500px', height:'500px'}})
                );
            }

        });
    }
]);

