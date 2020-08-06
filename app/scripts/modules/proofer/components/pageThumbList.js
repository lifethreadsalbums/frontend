angular.module('pace.proofer')
.factory('ProoferPageThumbListComponent', ['AppConstants', 'ProoferPageThumbComponent', 'ProoferService',
    function(AppConstants, ProoferPageThumbComponent, ProoferService) {

        return React.createClass({

            propTypes: {
                layout: React.PropTypes.object.isRequired,
                layoutController: React.PropTypes.object.isRequired,
                thumbScale: React.PropTypes.number,
                thumbSize: React.PropTypes.number,
                autoCenter: React.PropTypes.bool,
                pageType: React.PropTypes.string,
                onPageClick: React.PropTypes.func.isRequired,
                currentSpread: React.PropTypes.object.isRequired,
            },

            componentDidMount: function() {
                ProoferService.onChange(this.onCommentChange);

                var wrapper = $(ReactDOM.findDOMNode(this)),
                    element = wrapper.find('.scrollable-content.layout__page-thumbnails');
                    
                this.boundResizeHandler = this.resizeHandler.bind(this, wrapper, element);

                // Center thumbnails
                if (this.props.autoCenter) {
                    this.observer = new MutationObserver(this.boundResizeHandler);
                }
                $(window).resize(this.boundResizeHandler);
                this.boundResizeHandler();
            },

            componentWillMount: function () {
                this.thumbRefs = null;
                this.activeArea = null;
                this.container = null;
            },

            resizeHandler: function(wrapper, element) {
                //console.debug('[resizeHandler]', this);
                if (this.props.autoCenter) {
                    this.observer.disconnect();

                    var observerConfig = {
                        attributes: true,
                        childList: true,
                        characterData: false,
                        subtree: true
                    };
                    var itemWidth = element.children('.spread').first().outerWidth(true);
                    var fitItems = Math.floor((wrapper.width() / itemWidth)) || 0;

                    element.width(fitItems * itemWidth);
                    this.observer.observe(element[0], observerConfig);
                }
            },

            onCommentChange: function() {
                this.forceUpdate();
            },

            componentDidUpdate: function() {
                var scrollRect = this.container.getBoundingClientRect(),
                    spreadRect = this.activeArea.getBoundingClientRect();

                if (this.props.currentSpread) {
                    var thumbEl = ReactDOM.findDOMNode(this.thumbRefs[this.props.currentSpread._id]);
                    var pad = 20,
                        left = thumbEl.offsetLeft,
                        width = thumbEl.clientWidth;

                    this.activeArea.style.width = (width + pad*2) + 'px';
                    var scrollLeft = left - this.container.clientWidth/2 + this.activeArea.clientWidth/2;
                    $(this.container).stop().animate({ scrollLeft : scrollLeft }, 500);
                    $(this.activeArea).stop().animate({ left : (left - pad) }, 500);
                }
            },

            render: function() {
                var layout = this.props.layout,
                    spreads = layout.spreads,
                    comments = ProoferService.getComments();

                this.thumbRefs = this.thumbRefs || {};

                var that = this;
                return (
                    React.createElement("div", {className: "proofer-pages"}, 
                        React.createElement("div", {className: "layout__page-thumbnails scrollable-content", ref: function(el) { that.container = el; }}, 
                            React.createElement("div", {className: "active-area", ref: function(el) { that.activeArea = el; }}), 
                            
                                spreads.map(function(spread, i) {
                                    var isSelected = spread === this.props.currentSpread;

                                    var spreadComments = _.filter(comments, function(c) {
                                        return c.spreadId===spread._id;
                                    });
                                    var numCompleted = 0,
                                        numPending = 0;
                                    _.each(spreadComments, function(c) {
                                        if (c.isArchived) return;
                                        if (c.completed) 
                                            numCompleted++;
                                        else
                                            numPending++;
                                    });
                                    
                                    return (

                                        React.createElement(ProoferPageThumbComponent, {
                                            ref: function(el) { that.thumbRefs[spread._id] = el; }, 
                                            key: i, 
                                            spread: spread, 
                                            numPages: spread.numPages, 
                                            layout: layout, 
                                            layoutController: this.props.layoutController, 
                                            thumbSize: this.props.thumbSize, 
                                            thumbScale: this.props.thumbScale, 
                                            onPageClick: this.props.onPageClick, 
                                            onPageDoubleClick: this.props.onPageDoubleClick, 
                                            isSelected: isSelected, 
                                            isCompleted: numCompleted>0, 
                                            isPending: numPending>0, 
                                            pageType: this.props.pageType, 
                                            activeArea: this.activeArea})

                                    );
                                }, this)
                            
                        )
                    )
                );
            }

        });
    }

]);
