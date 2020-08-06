angular.module('pace.order')
.factory('ProductListComponent', ['ProductListItemComponent', 'FadingCircleComponent', '$state', 
    function(ProductListItemComponent, FadingCircleComponent, $state) {

        return React.createClass({

            propTypes: {
                products: React.PropTypes.array.isRequired,
                selectedProducts: React.PropTypes.array.isRequired,
                loadNextPage: React.PropTypes.func,
                canLoadNextPage: React.PropTypes.bool,
                jobs: React.PropTypes.array
            },

            getInitialState: function () {
                return { selectedProducts:[] };
            },

            componentWillMount: function () {
                
            },

            componentDidMount: function () {
                this.scrollToSelection(this.props.selectedProducts);
            },

            componentDidUpdate: function() {
                this.scrollToSelection(this.props.selectedProducts);
            },

            getDOMNode: function() {
                return ReactDOM.findDOMNode(this);
            },

            scrollToSelection: function(selection) {

                if (selection.length===1) {
                    var id = selection[0].id,
                        parentId = id;
                    _.each(this.props.products, function(p) {
                        _.each(p.children, function(child) {
                            if (child.id===id) {
                                parentId = p.id;
                            }
                        })
                    });

                    var node = ReactDOM.findDOMNode(this.refs['product-'+parentId]);                    
                    var panel = this.getDOMNode();
                    if (panel && node && node.offsetTop>panel.clientHeight + panel.scrollTop - 100) {
                        panel.scrollTop = node.offsetTop;
                    }
                }
            },

            selectProduct: function(product, parentProduct, e) {
                var ctrl = e.ctrlKey || e.metaKey,
                    shift = e.shiftKey,
                    products = this.props.products,
                    selection = this.state.selectedProducts,
                    idx = selection.indexOf(product);
                    
                if (ctrl) {
                    if (idx>=0)
                        selection.splice(idx,1);
                    else
                        selection.push(product);
                } else if (shift && selection.length>0) {
                    var first = products.indexOf(selection[0]),
                        index = products.indexOf(product),
                        last = products.indexOf(selection[selection.length - 1]),
                        range;

                    if (index>last)
                        range = [first, index];
                    else
                        range = [index, last];

                    selection = [];
                    for (var i = range[0]; i <= range[1]; i++) {
                        selection.push(products[i]);
                    }
                } else {
                    selection = [product];
                }

                this.setState({selectedProducts: selection});
                
                this.props.selectedProducts.length = 0;
                Array.prototype.push.apply(this.props.selectedProducts, selection);

                var state = $state.current.name.split('.').slice(0,2).join('.'),
                    params = {};
                if (selection.length===1) {
                    var params = {};
                    if (parentProduct) {
                        state += '.details.duplicate';
                        params = {id: parentProduct.id, duplicateId: product.id};
                    } else {
                        state += '.details';
                        params = {id: product.id};
                    }
                } 
                //else {
                    // if ($state.current.name.indexOf('.details')>0) {
                    //     $state.go('^');
                    // }

                //}
                $state.go(state, params);
            },

            onProductClick: function(product, e) {
                var shift = e.shiftKey,
                    ctrl = e.ctrlKey || e.metaKey;

                if (!(ctrl || shift) && this.state.selectedProducts.indexOf(product)>=0) { 
                    //ignore event, most probably the user is trying to drag the selection
                    return;
                }

                this.selectProduct(product, null, e);
            },

            onProductMouseUp: function(product, e) {

                var shift = e.shiftKey,
                    ctrl = e.ctrlKey || e.metaKey;

                if (!(ctrl || shift)) 
                    this.selectProduct(product, null, e);
                
            },

            onDuplicateClick: function(product, child, e) {
                this.selectProduct(child, product, e);
            },

            onListScroll: function(e) {
                var target = e.target,
                    tol = 70;
                if (this.props.canLoadNextPage && target.offsetHeight + target.scrollTop + tol >= target.scrollHeight) {
                    this.props.loadNextPage();
                }
            },

            onItemDragStart: function(item, e) {

                var dt = e.nativeEvent.dataTransfer,
                    targetEl = $(e.target),
                    ctrl = e.ctrlKey || e.metaKey;

                var items = this.state.selectedProducts;
                dt.setData('text/x-pace-products', JSON.stringify(items));


                var dragPreviewElement = document.createElement('div');
                dragPreviewElement.className = 'drop-container sidebar-projects-content';
                var listItems = this.listItems;

                _.each(this.state.selectedProducts, function(p) {

                    var node = ReactDOM.findDOMNode(listItems[p.id]);
                    dragPreviewElement.appendChild(node.cloneNode(true));
                });
                       
                document.body.appendChild(dragPreviewElement);
                dt.setDragImage(dragPreviewElement, 5, 5);
                
            },

            onItemDragEnd: function(item, e) {
                var dropContainer = document.getElementsByClassName('drop-container'),
                    i;

                for (i = 0; i < dropContainer.length; i++) {
                    dropContainer[i].parentNode.removeChild(dropContainer[i]);
                }
            },

            render: function() {
                var products = this.props.products;

                this.listItems = this.listItems || {};
                var listItems = this.listItems;

                return (
                    React.createElement("div", {className: "sidebar-projects-content jobs-footer", onScroll: this.onListScroll}, 
                        products.map(function (product, i) {

                            var jobs = _.where(this.props.jobs, {productId:product.id});

                            var ref = "product-" + product.id;
                            return (

                                React.createElement(ProductListItemComponent, {
                                    ref: ref, 

                                    key: product.id, 
                                    product: product, 
                                    selectedProducts: this.props.selectedProducts, 
                                    onProductMouseUp: this.onProductMouseUp, 
                                    onProductClick: this.onProductClick, 
                                    onDuplicateClick: this.onDuplicateClick, 
                                    onDragStart: this.onItemDragStart.bind(this, product), 
                                    onDragEnd: this.onItemDragEnd.bind(this, product), 
                                    jobs: jobs})
                                
                            );


                        }, this), 
                        
                        
                         this.props.canLoadNextPage ? React.createElement(FadingCircleComponent, null) : null

                    )
                );
            }
        });
    
    }
]);
