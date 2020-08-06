(function() {
    'use strict';

    var FilmstripComponentClass = function(FilmstripItemComponent, ErrorPopupComponent, UndoService, CoverZoneComponent, ngDialog, DataTransferService) {

        var FilmstripItem = FilmstripItemComponent,
            ErrorPopup = ErrorPopupComponent,
            CoverZone = CoverZoneComponent;

        return React.createClass({

            propTypes: {
                filmstrip: React.PropTypes.object.isRequired,
                showInfo: React.PropTypes.bool.isRequired,
                showAdminInfo: React.PropTypes.bool.isRequired,
                showPageNumbers: React.PropTypes.bool.isRequired,
                isSpreadBased: React.PropTypes.bool.isRequired,
                rangeSelectionMode: React.PropTypes.bool.isRequired,
                thumbScale: React.PropTypes.number,
                layoutController: React.PropTypes.object,
                onSelectionChange: React.PropTypes.func,
                onFileInfoClick: React.PropTypes.func,
                filter: React.PropTypes.string,
                disableDimmingThumbnails: React.PropTypes.bool.isRequired,
                selectedContainer: React.PropTypes.object
            },

            getDOMNode: function() {
                return ReactDOM.findDOMNode(this);
            },

            getInitialState: function () {
                return {
                    selectedItems: _.where(this.props.filmstrip.items, {active:true}),
                    hoveredStackId: null,
                    dragging: false
                };
            },

            calculateLeftOffset: function() {
                var parent = this.getDOMNode().parentNode,
                    rect = parent.getBoundingClientRect(),
                    itemWidth = Math.round(150 * this.props.thumbScale),
                    numItems = Math.floor(rect.width / itemWidth),
                    leftOffset = (rect.width - (numItems * itemWidth)) / 2;
                this.setState({leftOffset: leftOffset});
            },

            componentDidMount: function () {
                if (this.props.thumbScale) {
                    this.calculateLeftOffset();
                    window.addEventListener('resize', this.calculateLeftOffset);
                }
                if (this.props.layoutController) {
                    this.props.layoutController.on('layout:find-image-in-filmstrip', this.findImage);
                }
            },

            componentDidUpdate: function(prevProps, prevState) {
                if (this.props.thumbScale && prevProps.thumbScale!==this.props.thumbScale) {
                    this.calculateLeftOffset();
                }
            },

            componentWillUnmount: function () {
                if (this.props.thumbScale) {
                    window.removeEventListener('resize', this.calculateLeftOffset);
                }
            },

            findImage: function(event, image) {
                var items = this.props.filmstrip.items,
                    item = _.find(items, function(fi) {
                        return fi.image===image || fi.image.id===image.id;
                    });

                if (item) {
                    var element = $(this.getDOMNode()),
                        li =  element.find('[id=' + item._id + ']'),
                        pos = li.position(),
                        that = this;

                    var scrollLeft = (element.scrollLeft() + pos.left) - element.width()/2 + li.width()/2;
                    element.stop().animate({ scrollLeft : scrollLeft }, 600);

                    setTimeout(function() {
                        that.selectItems(item);
                    });
                }
            },

            getNumCoverItems: function() {
                var numCoverItems = 0;
                _.each(this.props.filmstrip.items, function(item) {
                    if (item.inCoverZone)
                        numCoverItems++;
                });
                return numCoverItems;
            },

            getSelectedItems: function() {
                return _.where(this.props.filmstrip.items, {active:true});
            },

            selectItems: function(item, ctrl, shift) {

                var tmpItem,
                    items = this.props.filmstrip.items,
                    itemIndex = items.indexOf(item),
                    active,
                    i;

                var selectedItems = _.where(items, {active:true}),
                    lastSelectedIndex = selectedItems.length>0 ?
                        items.indexOf(selectedItems[selectedItems.length - 1]) : 0,
                    firstSelectedIndex = selectedItems.length>0 ?
                        items.indexOf(selectedItems[0]) : 0;

                for (i = 0; i < items.length; i++) {
                    tmpItem = items[i];
                    active = false;

                    if (tmpItem.stackId && tmpItem.stackItemNumber > 1)
                        continue;

                    var isClickedItem = ((item===tmpItem) ||
                                        (item && item._id === tmpItem._id) ||
                                        (item.stackId && tmpItem.stackId === item.stackId)) ? true : false;

                    if (shift) {
                        if (itemIndex < lastSelectedIndex) {
                            active = (i >= itemIndex && i <= lastSelectedIndex);
                        } else if (itemIndex > firstSelectedIndex) {
                            active = (i <= itemIndex && i >= firstSelectedIndex);
                        }
                    } else if (ctrl) {
                        active = (!isClickedItem && tmpItem.active) || (isClickedItem && !!!tmpItem.active);
                    } else {
                        active = isClickedItem;
                    }

                    this.selectItem(tmpItem, active);
                }

                this.setState({selectedItems: _.where(this.props.filmstrip.items, {active:true})});
                if (this.props.onSelectionChange) this.props.onSelectionChange(this.state.selectedItems);
            },

            selectItem: function (item, selected) {
                var items = this.props.filmstrip.items;

                if (selected && !item.active) {
                    item.clickTime = new Date().getTime();
                }
                item.active = selected;

                if (item.stackId) {
                    var stackItems = _.where(items, { stackId: item.stackId });
                    for (var i = 0; i < stackItems.length; i++) {
                        if (selected && !stackItems[i].active) {
                            item.clickTime = new Date().getTime();
                        }
                        stackItems[i].active = selected;
                    }
                }
            },

            onItemMouseDown: function(item, e) {
                var shift = e.shiftKey,
                    ctrl = e.ctrlKey || e.metaKey,
                    selectedItems = this.getSelectedItems();

                if (!(ctrl || shift) && selectedItems.indexOf(item)>=0) {
                    //ignore event, most probably the user is trying to drag the selection
                    return;
                }

                if (this.props.rangeSelectionMode) {
                    ctrl = true;
                    shift = false;
                }
               
                this.selectItems(item, ctrl, shift);
            },

            onItemMouseUp: function(item, e) {
                var shift = e.shiftKey,
                    ctrl = e.ctrlKey || e.metaKey;

                if (this.props.rangeSelectionMode) {
                    return;
                }

                if (!(ctrl || shift))
                    this.selectItems(item, false, false);
            },

            onItemDragStart: function(item, e) {
                var dt = DataTransferService.getDataTransfer(e, 'nativeEvent'),
                    targetEl = $(e.target),
                    ctrl = e.ctrlKey || e.metaKey;

                // configure drag options
                var items = _.where(this.props.filmstrip.items, {active:true});
                dt.setData('text/x-pace-filmstrip-items', JSON.stringify(items));
                if (items.length===1) {
                    dt.setData('text/x-pace-filmstrip-single-item', 'true');
                }
                PACE.filmstripDraggedItems = items;

                var correctImages = _.filter(items, function(item) {
                    return item.image.status!=='Rejected' &&
                        item.image.status!=='Cancelled';
                });
                if (correctImages.length===0) {
                    dt.setData('text/x-pace-rejected-images', 'true');
                }

                // set dragging ghost image
                var dropContainer = document.createElement('div');
                dropContainer.className = 'drop-container';

                var element = $(this.getDOMNode());
                var images = [],
                    w = 0,
                    thumbWidth = 0,
                    maxWidth = Math.round(window.innerWidth * 0.8),
                    thumbSize = 125;
                _.each(items, function(item) {
                    var img = element.find('[id=' + item._id + '] img');
                    if (img.width && img.height) {
                        images.push(img[0]);
                        var rect = PACE.GeomService.fitRect(img[0], {width:thumbSize, height:thumbSize});
                        w += rect.width;
                    }
                    //dropContainer.appendChild(img[0].cloneNode(true));
                });
                if (w>maxWidth) {
                    w = maxWidth;
                    thumbWidth = Math.max(50, Math.round(maxWidth / items.length));
                }

                var canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = 200;
                var ctx = canvas.getContext("2d");
                w = 0;
                _.each(images, function(img) {
                    var rect = PACE.GeomService.fitRect(img, {width:thumbSize, height:thumbSize});
                    ctx.drawImage(img, w, thumbSize/2 - rect.height/2, rect.width, rect.height);
                    if (thumbWidth>0) {
                        w += thumbWidth;
                    } else {
                        w += rect.width;
                    }
                });
                dropContainer.appendChild(canvas);
                document.body.appendChild(dropContainer);

                dt.setDragImage(dropContainer, dropContainer.offsetWidth / 2, dropContainer.offsetHeight / 2);

                this.setState({dragging:true});
                e.stopPropagation();
            },

            onItemDragEnd: function(item, e) {
                var dropContainer = document.getElementsByClassName('drop-container'),
                    i;

                for (i = 0; i < dropContainer.length; i++) {
                    dropContainer[i].parentNode.removeChild(dropContainer[i]);
                }
                this.setState({dragging:false});
            },

            onItemDragOver: function(item, dropIndex, e) {
                this.dropIndex = dropIndex;
            },

            onItemDoubleClick: function(item, e) {
                if (item.stackId) {
                    var stackItems = _.where(this.props.filmstrip.items, { stackId: item.stackId });
                    _.each(stackItems, function(i) {
                        i.stackCollapsed = !i.stackCollapsed;
                    });
                    this.forceUpdate();
                } else if (this.props.layoutController) {
                    this.props.layoutController.fireEvent('layout:find-image', item.image);
                }
            },

            onItemMouseOver: function(item, e) {
                if (item.stackId!==this.state.hoveredStackId)
                    this.setState({hoveredStackId: item.stackId ? item.stackId : null});
            },

            onItemMouseOut: function(item, e) {

            },

            onItemHoverOver: function(item, e) {
                if (item.image.errorMessage) {
                    if (!this.popupContainer) {
                        var popupContainer = document.createElement('div');
                        popupContainer.className = 'error-popup-container';
                        document.body.appendChild(popupContainer);
                        this.popupContainer = popupContainer;
                        $(this.popupContainer).hide().fadeIn(300);
                    }

                    var element = $(this.getDOMNode());

                    var li =  element.find('[id=' + item._id + ']'),
                        rect = li[0].getBoundingClientRect();

                    ReactDOM.render(React.createElement(ErrorPopup, { image: item.image }), this.popupContainer);

                    var popupRect = this.popupContainer.getBoundingClientRect();
                    this.popupContainer.style.top = (rect.top - popupRect.height) + 'px';
                    this.popupContainer.style.left = ((rect.left + rect.width/2) - popupRect.width/2)  + 'px';
                }
            },

            onItemHoverOut: function(item, e) {
                if (this.popupContainer) {
                    var container = $(this.popupContainer);
                    container.fadeOut(300, function() {
                        ReactDOM.unmountComponentAtNode(container[0]);
                        container.remove();
                    });

                    this.popupContainer = null;
                }
            },

            onItemFileInfoClick: function(item, e) {
                this.props.onFileInfoClick(item);
            },

            onItemStarClick: function(item, e) {
                item.image.rating = item.image.rating>0 ? 0 : 1;
                this.forceUpdate();
            },

            onDragOver: function(e) {
                var dt = e.nativeEvent.dataTransfer;
                if (PACE.utils.containsDragType(dt.types,'text/x-pace-filmstrip-items')) {
                    e.preventDefault();
                }
            },

            onDrop: function(e) {
                var self = this,
                    dt = e.nativeEvent.dataTransfer,
                    filmstrip = this.props.filmstrip;

                if (PACE.utils.containsDragType(dt.types, 'text/x-pace-filmstrip-items')) {
                    e.preventDefault();

                    var data = JSON.parse(dt.getData("text/x-pace-filmstrip-items")),
                    ids = _.pluck(data, '_id');

                    //find selected items
                    var items = [];
                    _.each(ids, function(_id) {
                        items.push(_.findWhere(filmstrip.items, {_id: _id}));
                    });

                    filmstrip.items.forEach(function(child) {
                        // Find the ref for this specific child
                        var ref = self.refs[child._id]

                        // Look up the DOM node
                        var domNode = ReactDOM.findDOMNode(ref);

                        // Calculate the bounding box
                        var boundingBox = domNode.getBoundingClientRect();

                        // Store that box in the state, by its key
                        var childState = {};
                        childState[child._id] = boundingBox;
                        self.setState(childState);
                    });

                    var domNodes = items.map(function(item) {
                        return ReactDOM.findDOMNode(self.refs[item._id])
                    });

                    var commands = [
                        new PACE.MoveFilmstripItemsCommand(this.props.filmstrip, items, this.dropIndex),
                        new PACE.UpdateFilmstripOrder(this.props.filmstrip.items)
                    ];

                    if (filmstrip.hasCoverZone) {
                        var coverZoneEl = $(this.getDOMNode()).find('.filmstrip__cover-zone'),
                            rect = coverZoneEl[0].getBoundingClientRect();

                        var inCoverZone = e.pageX>=rect.left && e.pageX<=rect.right &&
                            e.pageY>=rect.top && e.pageY<=rect.bottom;

                        commands.push(new PACE.CoverZoneCommand(items, inCoverZone));
                    }

                    requestAnimationFrame(function() {
                        self.transformItems(domNodes, {
                            opacity: 1,
                            transition: 'opacity 0s'
                        });

                        requestAnimationFrame(function() {
                            self.transformItems(domNodes, {
                                opacity: 0,
                                transition: 'opacity 500ms'
                            });

                            setTimeout(function() {
                                var cmd = new PACE.MacroCommand(commands);
                                cmd.execute();
                                UndoService.pushUndo(cmd);
                                self.props.layoutController.fireEvent('layout:layout-changed');
			                    self.props.layoutController.fireEvent('layout:filmstrip-changed');
            			        self.props.layoutController.fireEvent('layout:filmstrip-order-changed');

                                self.forceUpdate();

                                requestAnimationFrame(function() {
                                    self.transformItems(domNodes, {
                                        opacity: 0,
                                        transition: 'opacity 0s'
                                    });

                                    requestAnimationFrame(function() {
                                        self.transformItems(domNodes, {
                                            opacity: 1,
                                            transition: 'opacity 500ms'
                                        });
                                    });
                                });
                            }, 500);
                        });
                    });
                }
            },

            transformItems: function(domNodes, styles) {
                var keys = Object.keys(styles);

                for (var i=0;i<domNodes.length;i++) {
                    var domNode = domNodes[i];
                    for (var j=0;j<keys.length;j++) {
                        var style = keys[j];
                        domNode.style[style] = styles[style];
                    }
                };
            },

            render: function() {

                var coverZone = this.props.filmstrip.hasCoverZone,
                    ulStyles = {},
                    numCoverItems = this.getNumCoverItems();

                if (this.state.leftOffset) {
                    ulStyles.left = this.state.leftOffset + 'px';
                }
                var items = this.props.filmstrip.items;
                var spreadIds = this.props.selectedContainer ? 
                    _.pluck(this.props.selectedContainer.spreads, '_id') : [];

                var filterFn = {
                    'disabled': function(item) { return item.image.status==='Rejected'; },
                    'unused': function(item) { return item.occurrences.length===0; },
                    'multiple-use': function(item) { return item.occurrences.length>1; },
                    'bySize': function(item) {
                        if (!item.occurrences) return false;
                        var result = false;
                        for (var i = 0; i < item.occurrences.length; i++) {
                            var o = item.occurrences[i]
                            if (spreadIds.indexOf(o.spread._id)>=0) {
                                result = true;
                                break;
                            }
                        }
                        return result;
                    }
                };


                var filter = filterFn[this.props.filter];
                if (filter)
                    items = _.filter(items, filter);

                var classes = classNames({
                    'filmstrip': true,
                    'user-select-none': true,
                    'dragging': this.state.dragging
                });

                return (
                    React.createElement("ul", {id: "filmstrip", style: ulStyles, className: classes, 
                        onDrop: this.onDrop, onDragOver: this.onDragOver}, 
                         coverZone ?
                            React.createElement(CoverZone, {
                                numItems: numCoverItems, 
                                thumbScale: this.props.thumbScale})
                            : null, 
                        
                        items.map(function (item, i) {

                            if (!item._id)
                                item._id = _.uniqueId('filmstrip-item-') + _.now();

                            var hovered = this.state.hoveredStackId!==null && this.state.hoveredStackId===item.stackId;

                            // if (items.isDoubleSpread) {
                            //     console.log('isDoubleSpread', item);
                            // }

                            switch (item.type) {
                            case 'FilmStripImageItem':
                                return (
                                    React.createElement(FilmstripItem, {
                                        ref: item._id, 
                                        key: item._id, 
                                        filmstrip: this.props.filmstrip, 
                                        itemIndex: i, 
                                        id: item._id, 
                                        image: item.image, 
                                        selected: !!item.active, 
                                        firstNonCoverItem: coverZone && i===numCoverItems, 
                                        hovered: hovered, 
                                        showInfo: this.props.showInfo, 
                                        showAdminInfo: this.props.showAdminInfo, 
                                        showPageNumbers: this.props.showPageNumbers, 
                                        isSpreadBased: this.props.isSpreadBased, 
                                        disableDimmingThumbnails: this.props.disableDimmingThumbnails, 
                                        stackId: item.stackId, 
                                        stackItemNumber: item.stackItemNumber, 
                                        stackItemCount: item.stackItemCount, 
                                        stackCollapsed: item.stackCollapsed, 
                                        isDoubleSpread: !!item.isDoubleSpread, 
                                        occurrences: item.occurrences, 
                                        starred: item.image.rating>0, 
                                        thumbScale: this.props.thumbScale, 
                                        onStarClick: this.onItemStarClick.bind(this, item), 
                                        onFileInfoClick: this.onItemFileInfoClick.bind(this, item), 
                                        onMouseDown: this.onItemMouseDown.bind(this, item), 
                                        onMouseUp: this.onItemMouseUp.bind(this, item), 
                                        onMouseOver: this.onItemMouseOver.bind(this, item), 
                                        onMouseOut: this.onItemMouseOut.bind(this, item), 
                                        onHoverOver: this.onItemHoverOver.bind(this, item), 
                                        onHoverOut: this.onItemHoverOut.bind(this, item), 
                                        onDragStart: this.onItemDragStart.bind(this, item), 
                                        onDragEnd: this.onItemDragEnd.bind(this, item), 
                                        onDragOver: this.onItemDragOver.bind(this, item), 
                                        onDoubleClick: this.onItemDoubleClick.bind(this, item)})
                                );

                            }
                        }, this)
                    )
              );
            }
        });
    };

    angular.module('pace.layout').provider('FilmstripComponent', function() {
        this.$get = ['FilmstripItemComponent', 'ErrorPopupComponent', 'UndoService', 'CoverZoneComponent', 'ngDialog', 'DataTransferService', FilmstripComponentClass ];
    });

})();
