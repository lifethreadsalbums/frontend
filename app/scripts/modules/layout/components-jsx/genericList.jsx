angular.module('pace.order')
.factory('GenericListComponent', ['$state', 'FadingCircleComponent', '$rootScope', 'KeyboardService', function($state, FadingCircleComponent, $rootScope, KeyboardService) {

    return function createList(ItemRenderer) {

        return React.createClass({

                propTypes: {
                    keyboardNav: React.PropTypes.bool,
                    items: React.PropTypes.array.isRequired,
                    selectedItems: React.PropTypes.array,
                    customOptions: React.PropTypes.object,
                    onSelectionChange: React.PropTypes.func,
                    onComponentReady: React.PropTypes.func,
                    onItemRendererEvent: React.PropTypes.func
                },

                //----- PUBLIC API ------
                getItems: function() {
                    return this.state.items;
                },

                setItems: function(items) {
                    this.setState({items: items});
                },

                getSelectedItems: function() {
                    return this.state.selectedItems;
                },

                setSelectedItems: function(items) {
                    this.setState({selectedItems: items});
                },

                refresh: function() {
                    this.forceUpdate();
                },

                clearSelection: function() {
                    this.setState({selectedItems: []});
                    if (this.props.onSelectionChange) {
                        this.props.onSelectionChange({ selectedItems: [] });
                    }
                },
                //-----------------------

                getInitialState: function () {
                    return { items:[], pageIndex:-1, canLoadNextPage:true, selectedItems:[] };
                },

                componentWillMount: function () {
                    this.loadNextPage();
                },

                componentDidMount: function () {
                    if (this.props.onComponentReady) {
                        this.props.onComponentReady(this);
                    }

                    if (this.props.keyboardNav) {
                        document.addEventListener('keydown', this.handleDocumentKeyDown);
                    }
                },

                componentWillUnmount: function() {
                    if (this.props.keyboardNav) {
                        document.removeEventListener('keydown', this.handleDocumentKeyDown);
                    }
                },

                componentDidUpdate: function() {

                },

                handleDocumentKeyDown: function(e) {
                    var self = this,
                        shortcut = KeyboardService.getShortcut(e),
                        currentSingleSelection,
                        selectionIdx;

                    var selection = _.sortBy(this.state.selectedItems, function(item) {
                        return self.state.items.indexOf(item);
                    });

                    switch (shortcut) {
                        case 'UP':
                        case 'SHIFT+UP':
                        case 'ALT+UP':
                        case 'CTRL+UP':
                            e.preventDefault();
                            e.stopPropagation();

                            if (selection.length) {
                                currentSingleSelection = selection[0];
                            } else {
                                currentSingleSelection = this.state.items[0];
                            }

                            selectionIdx = this.state.items.indexOf(currentSingleSelection);

                            if (selectionIdx !== -1) {
                                if (selectionIdx > 0) {
                                    if (shortcut === 'SHIFT+UP') {
                                        selectionIdx -= 10;

                                        if (selectionIdx < 0) {
                                            selectionIdx = 0;
                                        }
                                    } else {
                                        selectionIdx--;
                                    }
                                } else {
                                    selectionIdx = -1;
                                }
                            }

                            break;
                        case 'DOWN':
                        case 'SHIFT+DOWN':
                        case 'ALT+DOWN':
                        case 'CTRL+DOWN':
                            e.preventDefault();
                            e.stopPropagation();

                            if (selection.length === 1) {
                                currentSingleSelection = selection[0];
                            } else if (selection.length > 1) {
                                currentSingleSelection = selection[selection.length - 1];
                            } else {
                                currentSingleSelection = this.state.items[0];
                            }

                            selectionIdx = this.state.items.indexOf(currentSingleSelection);

                            if (selectionIdx !== -1) {
                                if (selectionIdx < this.state.items.length - 2) {
                                    if (shortcut === 'SHIFT+DOWN') {
                                        selectionIdx += 10;

                                        if (selectionIdx > this.state.items.length - 1) {
                                            selectionIdx = this.state.items.length - 1;
                                        }
                                    } else {
                                        selectionIdx++;
                                    }
                                } else {
                                    selectionIdx = -1;
                                }
                            }

                            break;
                    }

                    if (!isNaN(selectionIdx) && selectionIdx !== -1) {
                        this.selectItem(this.state.items[selectionIdx], {});
                        this.refs.selectedListItem.scrollIntoView();
                    }
                },

                loadNextPage: function() {
                    var pageSize = 10;

                    if (this.isLoading) return;
                    this.isLoading = true;

                    var pageIndex = this.state.pageIndex,
                        items = this.state.items,
                        that = this;

                    var result = this.props.items(pageSize, pageIndex + 1);
                    result.$promise.then(function(results) {
                        if (results && results.length>0) {
                            items = items.concat(results);
                            that.setState({items: items, pageIndex:pageIndex + 1});
                        }
                        if (!results || results.length<pageSize) {
                            that.setState({canLoadNextPage:false});
                        }
                        that.isLoading = false;
                    }, function(error) {
                        that.setState({canLoadNextPage:false});
                        that.isLoading = false;
                    });

                },

                onListScroll: function(e) {
                    var target = e.target,
                        tol = 70;
                    if (this.state.canLoadNextPage && target.offsetHeight + target.scrollTop + tol >= target.scrollHeight) {
                        this.loadNextPage();
                    }
                },

                selectItem: function(item, e) {
                    var ctrl = e.ctrlKey || e.metaKey,
                        shift = e.shiftKey,
                        items = this.state.items,
                        selection = this.state.selectedItems,
                        idx = selection.indexOf(item);

                    if (ctrl) {
                        if (idx>=0)
                            selection.splice(idx,1);
                        else
                            selection.push(item);
                    } else if (shift && selection.length>0) {
                        var first = items.indexOf(selection[0]),
                            index = items.indexOf(item),
                            last = items.indexOf(selection[selection.length - 1]),
                            range;

                        if (index>last)
                            range = [first, index];
                        else
                            range = [index, last];

                        selection = [];
                        for (var i = range[0]; i <= range[1]; i++) {
                            selection.push(items[i]);
                        }
                    } else {
                        selection = [item];
                    }

                    this.setState({selectedItems: selection});

                    if (this.props.onSelectionChange) {
                        var params = { selectedItems: selection };
                        this.props.onSelectionChange(params);
                    }

                },

                onItemMouseDown: function(item, e) {
                    var shift = e.shiftKey,
                        ctrl = e.ctrlKey || e.metaKey;

                    if (!(ctrl || shift) && this.state.selectedItems.indexOf(item)>=0) {
                        //ignore event, most probably the user is trying to drag the selection
                        return;
                    }

                    this.selectItem(item, e);
                },

                onItemMouseUp: function(item, e) {

                    var shift = e.shiftKey,
                        ctrl = e.ctrlKey || e.metaKey;

                    if (!(ctrl || shift))
                        this.selectItem(item, e);

                },

                render: function() {
                    var items = this.state.items;

                    return (
                        <div className="generic-list user-select-none" onScroll={this.onListScroll}>
                            {items.map(function (item, i) {

                                var selected = !!(_.findWhere(this.state.selectedItems, {id:item.id}));
                                var divStyle = {
                                    cursor: 'pointer'
                                };
                                var props = {};

                                if (selected) {
                                    props.ref = 'selectedListItem';
                                }

                                return (
                                    <div
                                        {...props}
                                        style={divStyle}
                                        onMouseDown={this.onItemMouseDown.bind(this, item)}
                                        onMouseUp={this.onItemMouseUp.bind(this, item)}>
                                        <ItemRenderer
                                            item={item}
                                            selected={selected}
                                            customOptions={this.props.customOptions}
                                            onItemRendererEvent={this.props.onItemRendererEvent} />
                                    </div>
                                );

                            }, this)}

                            { this.state.canLoadNextPage ? <FadingCircleComponent/> : null }

                        </div>
                    );
                }
            });
    }

}]);
