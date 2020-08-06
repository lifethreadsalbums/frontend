angular.module('pace.order')
.factory('ProductListItemComponent', ['$state', 'ProductService', 'AppConstants', 'ShippingService',
    function($state, ProductService, AppConstants, ShippingService) {

        return React.createClass({

            propTypes: {
                product: React.PropTypes.object.isRequired,
                onProductClick: React.PropTypes.func.isRequired,
                onProductMouseUp: React.PropTypes.func.isRequired,
                onDuplicateClick: React.PropTypes.func.isRequired,
                selectedProducts: React.PropTypes.array.isRequired,
                jobs: React.PropTypes.array,
                onDragStart: React.PropTypes.func.isRequired,
                onDragEnd: React.PropTypes.func.isRequired,
            },

            getInitialState: function () {

                var duplicateSelected = false;
                if (this.props.product && this.props.product.children) {
                    for (var i = 0; i < this.props.product.children.length; i++) {
                        var child = this.props.product.children[i];
                        if (_.findWhere(this.props.selectedProducts, {id:child.id}))
                            duplicateSelected = true;
                    };
                }

                return { isExpanded: duplicateSelected  };
            },

            componentWillMount: function () {

            },

            getDOMNode: function() {
                return ReactDOM.findDOMNode(this);
            },

            componentDidMount: function () {
                var thisNode = this.getDOMNode();
                var projectDuplicateItemNodes = thisNode.getElementsByClassName('project-item is-duplicate');
                var projectDuplicatesMaxHeight = 0;

                if (projectDuplicateItemNodes.length) {
                    for (var i = 0, len = projectDuplicateItemNodes.length; i < len; i++) {
                        projectDuplicatesMaxHeight += projectDuplicateItemNodes[i].offsetHeight;
                    }

                    this.setState({
                        projectDuplicatesMaxHeight: projectDuplicatesMaxHeight
                    });
                }
            },

            toggleDup: function(e) {
                this.setState({isExpanded: !this.state.isExpanded});
                e.stopPropagation();
            },

            onProductClick: function(product, e) {
                this.props.onProductClick(product, e);
            },

            onProductMouseUp: function(product, e) {
                this.props.onProductMouseUp(product, e);
            },

            onDuplicateClick: function(product, child, e) {
                this.props.onDuplicateClick(product, child, e);
            },

            onDragStart: function(e) {
                this.props.onDragStart(e);
            },

            onDragEnd: function(e) {
                this.props.onDragEnd(e);
            },

            render: function() {

                var getBoxClasses = function(p) {
                    var boxType = boxes[p.options.boxType],
                        boxClasses = { 'project-case-icon': true };
                    if (boxType) boxClasses[boxType] = true;

                    return classNames(boxClasses);
                }

                var product = this.props.product,
                    selectedProducts = this.props.selectedProducts,
                    children = product.children,
                    hasChildren = product.children && product.children.length>0,
                    projectClassSet = classNames(
                        {
                            'project-item': true,
                            'active': !!(_.findWhere(selectedProducts, {id:product.id})),
                            'user-select-none': true,
                            'has-duplicates': hasChildren
                        }
                    ),
                    boxes = {
                        'clam_shell': 'project-case-icon-claim-shell-box',
                        'presentation_box': 'project-case-icon-presentation-box',
                        'slip_case': 'project-case-icon-slip-case'
                    },
                    boxLabels = {
                        'clam_shell': 'Clam Shell Box',
                        'presentation_box': 'Presentation Box',
                        'slip_case': 'Slip Case'
                    },
                    dateCreated = moment(new Date(product.options._dateCreated)).format(AppConstants.DATE_FORMAT),
                    boxType = boxes[product.options.boxType],
                    boxLabel = boxLabels[product.options.boxType],
                    dupClassSet = classNames(
                        {
                            'project-duplicates' : true,
                            'is-expanded': this.state.isExpanded
                        }
                    ),
                    dupSwitchClassSet = classNames(
                        {
                            'project-toggle-duplicates': true,
                            'clearfix': true,
                            'is-expanded': this.state.isExpanded
                        }
                    ),
                    statusClassSet = classNames(
                        {
                            'project-status': true,
                            'status-label': true,
                            'status-label-green': !(product.state==='New' && !product.inCart),
                            'status-label-orange': (product.state==='New' && !product.inCart),
                        }
                    ),
                    boxClassSet = getBoxClasses(product);

                var status;
                if (product.state==='New')
                    status = 'Designing';
                else if (product.state==='Completed')
                    status = 'Completed';
                else if (product.inCart)
                    status = 'In Your Cart';
                else if (product.state==='Shipped')
                    status = 'Shipped'
                else
                    status = 'In Production';

                var duplicatesContainerStyle = {
                    height: (this.state.isExpanded && this.state.projectDuplicatesMaxHeight) ? this.state.projectDuplicatesMaxHeight : 0
                };

                var jobs = this.props.jobs;
                var priceClasses = { 'project-price':true };
                if (product.subtotal && product.subtotal.currency) {
                    priceClasses['is-' + product.subtotal.currency.toLowerCase()] = true;
                }
                var priceClassNames = classNames(priceClasses);
                var hasTrackingId = !!product.options.trackingId;
                var carrier = product.displayOptions.carrier,
                    trackingUrl = ShippingService.getTrackingUrl(product);

                return (
                    React.createElement("div", {
                        onDragStart: this.onDragStart, onDragEnd: this.onDragEnd}, 
                        React.createElement("div", {className: projectClassSet, onMouseDown: this.onProductClick.bind(this, product), 
                            onMouseUp: this.onProductMouseUp.bind(this, product)}, 

                            React.createElement("div", {className: "project-header"}, 
                                React.createElement("span", {className: statusClassSet}, status), 
                                 (product.productNumber) ? React.createElement("span", {className: "project-id", title: "{product.productNumber}"}, product.productNumber) : null, 
                                React.createElement("span", {className: "project-date"}, dateCreated)
                            ), 
                            React.createElement("div", {className: "project-name", title: product.options._name}, product.options._name), 
                            React.createElement("div", {className: "project-details"}, product.productInfo), 
                            
                                boxType ? React.createElement("div", {className: "project-case"}, 
                                    /* <span className={boxClassSet}></span> */
                                    React.createElement("span", {className: "project-case-name"}, boxLabel)
                                ) : null, 
                            
                            React.createElement("div", {className: "project-footer"}, 
                                React.createElement("span", {className: priceClassNames}, product.total ? product.total.displayPrice : ''), 
                                React.createElement("span", {className: "project-copies"}, React.createElement("span", {className: "icon-book"}), product.children.length + 1)
                            ), 

                             hasTrackingId && React.createElement("div", {className: "project-delivery"}, 
                                React.createElement("span", {className: "project-delivery-icon"}), 
                                React.createElement("span", {className: "project-delivery-provider"}, carrier, ": "), 
                                React.createElement("span", {className: "project-delivery-link"}, React.createElement("a", {href: trackingUrl, target: "_blank"}, product.options.trackingId))
                            ), 

                            
                                hasChildren && product.productType !== 'SinglePrintProduct' ?
                                React.createElement("div", {className: dupSwitchClassSet, onMouseDown: this.toggleDup}, 
                                    React.createElement("span", {className: "project-toggle-duplicates-count"}, product.children.length), 
                                    React.createElement("span", {className: "project-toggle-duplicates-label"}), 
                                    React.createElement("span", {className: "project-toggle-duplicates-arrow"})
                                ) : null, 
                            

                            React.createElement("div", {className: "jobs project-details"}, 
                            
                                jobs.map(function (job, i) {
                                    return (
                                        React.createElement("div", null, 
                                            React.createElement("span", null, job.jobName), 
                                            React.createElement("span", null, " ", job.progressPercent, "%")
                                        )
                                    )
                                }, this)
                            
                            )
                        ), 


                        React.createElement("div", {className: dupClassSet, style: duplicatesContainerStyle}, 
                        
                            children.map(function (child, i) {

                                var dupBoxClassSet = getBoxClasses(child),
                                    dupBoxLabel = boxLabels[child.options.boxType],
                                    childClassSet = classNames(
                                        {
                                            'project-item': true,
                                            'active': !!(_.findWhere(selectedProducts, {id:child.id})),
                                            'user-select-none': true,
                                            'is-duplicate': true
                                        }
                                    );

                                return (

                                    React.createElement("div", {key: i, className: childClassSet, onMouseDown: this.onDuplicateClick.bind(this, product, child)}, 
                                        React.createElement("div", {className: "project-header"}, 
                                             (child.productNumber) ? React.createElement("span", {className: "project-id", title: "{child.productNumber}"}, child.productNumber) : null
                                        ), 
                                        React.createElement("div", {className: "project-name", title: "{child.options._name}"}, child.options._name), 
                                        React.createElement("div", {className: "project-details"}, child.productInfo), 
                                        React.createElement("div", {className: "project-case"}, 
                                            /* <span className={dupBoxClassSet}></span> */
                                            React.createElement("span", {className: "project-case-name"}, dupBoxLabel)
                                        )
                                    )

                                );

                            }, this)
                        
                        )
                    )
                );
            }
        });
    }

]);
