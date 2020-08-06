angular.module('pace.order')

.factory('OrderListItemComponent', ['StoreConfig', 'AuthService', 'AppConstants', 'ShippingService',
    function(StoreConfig, AuthService, AppConstants, ShippingService) {

    return React.createClass({

        propTypes: {
            item: React.PropTypes.object.isRequired,
            selected: React.PropTypes.bool.isRequired,
            customOptions: React.PropTypes.object
        },

        render: function() {
            var dateFormat = this.props.customOptions.dateFormat;

            var order = this.props.item;
            var status = order.state==='PaymentComplete' ? 'Payment Complete' : 'Complete',
                dateCreated = moment(new Date(order.dateCreated)).format(dateFormat);

            order.numProducts = order.numProducts ||
                _.reduce(order.orderItems, function(count, orderItem) {
                        var numProducts = orderItem.product.options._quantity +
                            _.reduce(orderItem.product.children, function(pc, p) {
                                return pc + p.options._quantity;
                            }, 0);
                        return count + numProducts;
                }, 0);

            var itemClassSet = classNames({
                'project-item': true,
                'user-select-none': true,
                'active': this.props.selected
            });

            var statusClassSet = classNames({
                'project-status': true,
                'status-label': true,
                'status-label-green': order.state === 'PaymentComplete',
                'status-label-orange': order.state !== 'PaymentComplete'
            });

            var orderItems = _.filter(order.orderItems, function(oi) {
                return !oi.product.isReprint;
            });

            var hasTrackingId = false,
                carrier, trackingUrl;

            var trackedItem = _.find(orderItems, function(oi) {
                return !!oi.product.options.trackingId;
            });
            if (trackedItem) {
                hasTrackingId = true;
                carrier = trackedItem.product.displayOptions.carrier;
                trackingUrl = ShippingService.getTrackingUrl(trackedItem.product);
            }

            var orderTitle = '#' + order.orderNumber,
                userTitle = order.user.firstName + ' ' + order.user.lastName;
            return (
                React.createElement("div", {className: itemClassSet}, 
                    React.createElement("div", {className: "project-header"}, 
                        React.createElement("span", {className: statusClassSet}, status), 
                        React.createElement("span", {className: "project-id", title: orderTitle}, orderTitle)
                    ), 
                    React.createElement("span", {className: "project-date project-date--right"}, dateCreated), 
                    React.createElement("div", {className: "project-name", title: userTitle}, userTitle), 
                    React.createElement("div", {className: "project-footer"}), 

                    React.createElement("div", {className: "project-details"}, 
                         orderItems.map(function(orderItem) {
                            return (
                                React.createElement("div", {className: "invoice-item__row invoice-item__row--single"}, 
                                     orderItems.length > 1 ? React.createElement("span", {className: "invoice-item__sub-order-id"}, "#", orderItem.product.productNumber) : null, 
                                    React.createElement("span", {className: "invoice-item__project", title: orderItem.product.displayOptions._name}, orderItem.product.displayOptions._name)
                                )
                            );
                        }, this) 
                    ), 

                     hasTrackingId && React.createElement("div", {className: "project-delivery"}, 
                        React.createElement("span", {className: "project-delivery-icon"}), 
                        React.createElement("span", {className: "project-delivery-provider"}, carrier, ": "), 
                        React.createElement("a", {href: trackingUrl, target: "_blank", className: "project-delivery-link"}, trackedItem.product.options.trackingId)
                    )
                )
            );

        }
    });

}])

.factory('OrderListComponent', ['GenericListComponent', 'OrderListItemComponent', function(GenericListComponent, OrderListItemComponent) {
    return GenericListComponent(OrderListItemComponent);
}]);
