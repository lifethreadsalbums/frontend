(function() {
    'use strict';

    var SpreadThumbListComponentClass = function(SpreadThumbComponent, GeomService, MutationObserver, DataTransferService, ProoferService) {

        var SpreadThumb = SpreadThumbComponent;

        return React.createClass({
            observer: null,

            propTypes: {
                layout: React.PropTypes.object.isRequired,
                coverLayouts: React.PropTypes.array,
                layoutController: React.PropTypes.object.isRequired,
                thumbScale: React.PropTypes.number,
                thumbSize: React.PropTypes.number,
                selectedIndices: React.PropTypes.array,
                autoCenter: React.PropTypes.bool,
                pageType: React.PropTypes.string
            },

            getDOMNode: function() {
                return ReactDOM.findDOMNode(this);
            },

            getInitialState: function () {
                return { selectedIndices: [] };
            },

            componentDidMount: function () {
                var self = this,
                    container = $('.scrollable-container').first(),
                    wrapper = $(this.getDOMNode()),
                    element = wrapper.find('.scrollable-content.layout__page-thumbnails'),
                    activeArea = element.find('.active-area').first(),
                    layoutController = this.props.layoutController;

                var onScroll = function() {
                    var scrollTop = container.scrollTop(),
                        containerRect = container[0].getBoundingClientRect(),
                        rect = element[0].getBoundingClientRect(),
                        mid2 = rect.height / 2,
                        lastThumb = element.children().last(),
                        lastThumbBottom = element.scrollTop() + lastThumb.position().top + lastThumb.outerHeight(),
                        height1 = container[0].scrollHeight,
                        height2 = Math.min(lastThumbBottom, element[0].scrollHeight),
                        pos1 = scrollTop / height1,
                        visibleAreaHeight = containerRect.height/height1 * height2,
                        pos2 = (pos1 * height2) - (mid2 - (visibleAreaHeight / 2) ),
                        padTop = 0;

                    element.scrollTop(pos2);
                    activeArea
                        .css('top', (pos1 * height2) + padTop + 'px')
                        .css('height', visibleAreaHeight);
                };

                this.onScrollableContainerScroll = onScroll;
                this.scrollableContainer = container;

                container.on('scroll', onScroll);

                layoutController.on('layout:scale-changed', function() {
                    setTimeout(onScroll, 2000);
                });

                layoutController.on('layout:layout-loaded', function() {
                    setTimeout(onScroll, 2000);
                });

                this.boundResizeHandler = this.resizeHandler.bind(this, wrapper, element);

                // Center thumbnails
                if (this.props.autoCenter) {
                    this.observer = new MutationObserver(this.boundResizeHandler);
                }
                $(window).resize(this.boundResizeHandler);
                this.boundResizeHandler();

                ProoferService.onChange(this.onCommentChange.bind(this));
                layoutController.on('layout:proofer-enabled', this.onProoferEnabled.bind(this));
            },

            componentWillUnmount: function() {
                //console.debug('componentWillUnmount')
                if (this.observer)
                    this.observer.disconnect();

                this.scrollableContainer.off('scroll', this.onScrollableContainerScroll);
                this.scrollableContainer = null;

                $(window).unbind('resize', this.boundResizeHandler);
            },

            onProoferEnabled: function() {
                this.forceUpdate();
            },

            onCommentChange: function() {
                if (PACE.ProoferEnabled) {
                    this.forceUpdate();
                }
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

            selectPages: function(index, ctrl, shift) {
                var selection = (this.props.selectedIndices || this.state.selectedIndices).concat(),
                    idx = selection.indexOf(index);

                if (ctrl) {
                    if (idx>=0)
                        selection.splice(idx,1);
                    else
                        selection.push(index);
                } else if (shift && selection.length>0) {
                    var first = selection[0],
                        last = selection[selection.length - 1],
                        range;

                    if (index>last)
                        range = [first, index];
                    else
                        range = [index, last];

                    selection = [];
                    for (var i = range[0]; i <= range[1]; i++) {
                        selection.push(i);
                    }

                } else {
                    selection = [index];
                }
                selection.sort();
                this.setState({selectedIndices: selection});

                var boundIndices = this.props.selectedIndices;
                if (boundIndices) {
                    boundIndices.splice(0, boundIndices.length);
                    _.each(selection, function(item) { boundIndices.push(item); });
                }
                this.props.layoutController.fireEvent('layout:page-selection-changed');
            },

            selectSpreads: function(spread, ctrl, shift) {
                var selection = (this.props.selectedIndices || this.state.selectedIndices).concat(),
                    index = spread.pageNumber - 1,
                    idx = selection.indexOf(index);

                if (ctrl) {
                    if (idx>=0)
                        selection.splice(idx, spread.numPages);
                    else {
                        selection.push(index);
                        if (spread.numPages===2) selection.push(index + 1);
                    }
                } else if (shift && selection.length>0) {
                    var first = selection[0],
                        last = selection[selection.length - 1],
                        range;

                    if (index>last)
                        range = [first, index + (spread.numPages - 1)];
                    else
                        range = [index, last];

                    selection = [];
                    for (var i = range[0]; i <= range[1]; i++) {
                        selection.push(i);
                    }

                } else {
                    selection = [index];
                    if (spread.numPages===2) selection.push(index + 1);
                }
                selection.sort();
                this.setState({selectedIndices: selection});

                var boundIndices = this.props.selectedIndices;
                if (boundIndices) {
                    boundIndices.splice(0, boundIndices.length);
                    _.each(selection, function(item) { boundIndices.push(item); });
                }
                this.props.layoutController.fireEvent('layout:page-selection-changed');
            },

            onPageClick: function(e) {
                var selectedIndices = this.props.selectedIndices || this.state.selectedIndices;
                if (!(e.ctrlKey || e.shiftKey) && selectedIndices.indexOf(e.index)>=0) {
                    //ignore event, most probably the user is trying to drag the selection
                    return;
                }
                //do selection
                if (this.props.pageType==='SpreadBased') {
                    this.selectSpreads(e.spread, e.ctrlKey, e.shiftKey);
                } else {
                    this.selectPages(e.index, e.ctrlKey, e.shiftKey);
                }
                //this.selectSpreads(e.spread, e.ctrlKey, e.shiftKey);
            },

            onPageMove: function(e) {
                var cmd = new PACE.MovePagesCommand(this.props.layout, this.state.selectedIndices, e.index);
                cmd.execute();
                this.props.layoutController.renderAll();
                this.props.layoutController.fireEvent('layout:layout-changed');
                this.setState({selectedIndices:[]});
            },

            getDragPreview: function(pageIndex) {
                var layoutSize = this.props.layout.layoutSize,
                    layoutController = this.props.layoutController,
                    isLPS = layoutSize.lps,
                    isHorizontal = layoutSize.pageOrientation==='Horizontal',
                    scale,
                    canvasSize,
                    canvas;

                var size = this.props.thumbSize || 150;
                if (this.props.thumbScale) {
                    size = Math.round(size * this.props.thumbScale);
                }
                var rect = {width: size, height: size};
                if (isHorizontal) {
                    rect.width /= 2;
                } else {
                    rect.height /= 2;
                }

                canvas = document.createElement('canvas');
                canvasSize = GeomService.fitRectangleProportionally(layoutSize, rect);
                scale = canvasSize.width / layoutSize.width;

                canvas.width = Math.round(canvasSize.width);
                canvas.height = Math.round(canvasSize.height);

                var spreadIndex = isLPS ? Math.floor(pageIndex/2) : Math.floor((pageIndex+1)/2),
                    renderer = layoutController.renderers[spreadIndex],
                    thumbScale = scale / renderer.scale,
                    padding = renderer.padding * renderer.scale,
                    ctx = canvas.getContext('2d'),
                    left = (pageIndex%2===0 && isLPS) || (!isLPS &&pageIndex%2!==0),
                    clipX = 0, clipY = 0;

                if (!left) {
                    if (isHorizontal) {
                        clipX = canvasSize.width;
                    } else {
                        clipY = canvasSize.height;
                    }
                }

                var activeGroup = renderer.canvas.getActiveGroup();

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

                ctx.scale(thumbScale, thumbScale);
                ctx.translate(-padding,-padding);
                ctx.translate(-clipX / thumbScale, clipY / thumbScale);
                renderer.canvas.thumbRendering = true;
                renderer.canvas._renderObjects(ctx, activeGroup);
                renderer.canvas._renderActiveGroup(ctx, activeGroup);
                renderer.canvas.thumbRendering = false;

                return canvas;
            },

            onDragStart: function(e) {
                var numCoverPages = this.props.coverLayout ? 2 : 0,
                    that = this,
                    dropContainer = document.createElement('div');

                dropContainer.className = 'drop-container';
                _.each(this.state.selectedIndices, function(idx) {
                    dropContainer.appendChild(that.getDragPreview(idx + numCoverPages));
                });
                document.body.appendChild(dropContainer);

                var dt = DataTransferService.getDataTransfer(e);
                dt.setData('text/x-pace-pages', JSON.stringify( this.state.selectedIndices ));
                dt.setDragImage(dropContainer, 5, 5);

                this.dragPreviewElement = dropContainer;
            },

            onDragEnd: function(e) {
                if (this.dragPreviewElement) {
                    document.body.removeChild(this.dragPreviewElement);
                    this.dragPreviewElement = null;
                }
            },

            render: function() {
                var spreads = this.props.layout.spreads;
                if (this.props.coverLayouts) {
                    spreads = [];
                    _.each(this.props.coverLayouts, function(coverLayout) {
                        spreads = spreads.concat(coverLayout.spreads);
                    });
                    spreads = spreads.concat(this.props.layout.spreads);
                }

                var selectedIndices = this.props.selectedIndices || this.state.selectedIndices;
                var comments = ProoferService.getComments();

                return (
                    React.createElement("div", {className: "page-thumbnails-wrapper"}, 
                        React.createElement("div", {className: "scrollable-content layout__page-thumbnails"}, 
                            React.createElement("div", {className: "active-area"}), 
                            spreads.map(function (spread, i) {

                                var coverSpread = this.props.coverLayouts && i < this.props.coverLayouts.length,
                                    layout = coverSpread ? this.props.coverLayouts[i] : this.props.layout,
                                    rps = spread.pageNumber===1 && spread.numPages===1,
                                    leftIndex = (spread.pageNumber - 1) - (rps ? 1 : 0),
                                    rightIndex = leftIndex + 1,
                                    leftPageSelected = !coverSpread && selectedIndices.indexOf(leftIndex)>=0,
                                    rightPageSelected = !coverSpread && selectedIndices.indexOf(rightIndex)>=0;

                                if (!spread._id) {
                                    spread._id = _.uniqueId('spread-') + _.now();
                                }

                               
                                var numCompleted = 0,
                                    numPending = 0;

                                if (PACE.ProoferEnabled) {
                                    _.each(comments, function(c) {
                                        if (c.isArchived || c.spreadId!==spread._id) return;
                                        if (c.completed) 
                                            numCompleted++;
                                        else
                                            numPending++;
                                    });
                                }

                                return (

                                    React.createElement(SpreadThumb, {
                                        key: i, 
                                        spread: spread, 
                                        numPages: spread.numPages, 
                                        layout: layout, 
                                        layoutController: this.props.layoutController, 
                                        leftPageSelected: leftPageSelected, 
                                        rightPageSelected: rightPageSelected, 
                                        thumbSize: this.props.thumbSize, 
                                        thumbScale: this.props.thumbScale, 
                                        onPageClick: this.onPageClick, 
                                        onPageMove: this.onPageMove, 
                                        onDragStart: this.onDragStart, 
                                        onDragEnd: this.onDragEnd, 
                                        pageType: this.props.pageType, 
                                        isCompleted: numCompleted>0, 
                                        isPending: numPending>0})

                                );
                            }, this)
                        )
                    )
                );
            }
        });
    };

    angular.module('pace.layout').provider('SpreadThumbListComponent', function() {
        this.$get = ['SpreadThumbComponent', 'GeomService', 'MutationObserver', 
            'DataTransferService', 'ProoferService', SpreadThumbListComponentClass ];
    });

})();
