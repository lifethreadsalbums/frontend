'use strict';

angular.module('pace.adminOrders')
    .service('OrdersGridService', function() {
        
    })    
	
    .service('OrdersGridUIService', function() {
        this.getCellStyle = function(params) {
            var style = {};

            if (params.colDef.headerName === 'Order ID' && params.data.type !== 'product') {
                style.fontFamily = '"Museo Sans 700", Helvetica, Arial, sans-serif';
                style.fontWeight = '700';
            } else if (params.colDef.headerName === 'Order ID') {
                style.paddingLeft = '30px';
            }

            if (params.data.type === 'product') {
                style.borderTop = 'none';
            } else {
                style.borderTop = '1px solid #e8e8e8';
            }

            if (params.colDef.headerName === 'Price' && params.data.type !== 'product') {
                style.fontFamily = '"Museo Sans 700", Helvetica, Arial, sans-serif';
                style.fontWeight = '700';
            }

            if (params.colDef.headerName === 'Price') {
                style.textAlign = 'right';
            }

            return style;
        };

        this.getCellClass = function(params) {
            var cellClass = [],
                data = params.data,
                productState;

            if (params.colDef.headerName === 'Status') {
                cellClass.push('ag-cell-custom-status');
            } else if (params.colDef.headerName === 'Payment') {
                cellClass.push('ag-cell-custom-order-state');
            }

            if (data && data.product && data.product.onHold) {
                productState = 'OnHold';
            } else if (data && data.product && data.product.state) {
                productState = data.product.state;
            } else if (data.order.orderItems.length) {
                productState = data.order.orderItems[0].product.state;
            }

            switch (productState) {
                case 'Printing':
                case 'New':
                case 'Bindery':
                    cellClass.push('ag-cell-custom-hover-orange');
                    break;
                case 'Printed':
                    cellClass.push('ag-cell-custom-hover-gray');
                    break;
                case 'ReadyToShip':
                    cellClass.push('ag-cell-custom-hover-blue');
                    break;
                case 'OnHold':
                case 'Cancelled':
                    cellClass.push('ag-cell-custom-hover-red');
                    break;
                case 'Shipped':
                case 'Completed':
                    cellClass.push('ag-cell-custom-hover-green');
                    break;
            }

            return cellClass;
        };

        this.getRowClass = function(params) {
            var classes = [];
            classes.push((params.data.orderIndex % 2 == 0) ? 'order-even' : 'order-odd' );
            classes.push('order-index-' + params.data.orderIndex)

            if (params.data.type === 'order-single') {
                classes.push('ag-row-custom-type-order-single');
            } else if (params.data.type === 'order') {
                classes.push('ag-row-custom-type-order');
            } else if (params.data.type === 'product') {
                classes.push('ag-row-custom-type-product');
            }

            return classes;
        }
    });
