'use strict';

angular.module('pace.adminOrders')
.controller('AdminOrderListCtrl', ['$scope', 'orders', 'products', '$state', '$timeout', 'ProductPrototype',
    'GridLazyLoading', 'columns', 'AgGridDropdownCellRenderer', 'AgGridDropdownCellEditor', '$rootScope', 'Product',
    'Task', 'AuthService', 'NotificationEvent', 'JobProgressCellRenderer', 'AgGridProductOptionDropdown', 'Batch',
    'statusDropdownItems', 'AgGridDateCellEditor', 'statuses', 'MessageService', 'AgGridRushCellRenderer', 'CurrencyCellRenderer',
    'TextureCache', 'AttachmentsCellRenderer', 'ModelEvent', 'ModelService', 'KeyboardService', 'Order',
    'currentBatch', 'AgGridOrderIdCellRenderer', 'OrdersGridService', 'userSettings', '$debounce', 'StoreConfig', 'AppConstants', '$parse',
    'ProductService', 'user', 'OrdersGridUIService', 'AgGridTextCellEditor', 'AgGridTrackingIdCellRenderer', 'MainNavService', 'ShippingService',
        function ($scope, orders, products, $state, $timeout, ProductPrototype,
        GridLazyLoading, columns, AgGridDropdownCellRenderer, AgGridDropdownCellEditor, $rootScope, Product,
        Task, AuthService, NotificationEvent, JobProgressCellRenderer, AgGridProductOptionDropdown, Batch,
        statusDropdownItems, AgGridDateCellEditor, statuses, MessageService, AgGridRushCellRenderer, CurrencyCellRenderer,
        TextureCache, AttachmentsCellRenderer, ModelEvent, ModelService, KeyboardService, Order,
        currentBatch, AgGridOrderIdCellRenderer, OrdersGridService, userSettings, $debounce, StoreConfig, AppConstants, $parse,
        ProductService, user, OrdersGridUIService, AgGridTextCellEditor, AgGridTrackingIdCellRenderer, MainNavService, ShippingService) {

		MainNavService.setCurrentController(this);

        this.getCurrentProductInfo = function() {
            var products = getSelectedProducts();
            return { 
                product: products.length>0 ? products[0] : null, 
                section: null, 
                optionUrl: null
            };
        };

        var gridApi,
            hasRushJobs = false,
            orderIndex = 0,
            dateFormat = AppConstants.DATE_FORMAT;

        function errorHandler(err) {
            $rootScope.productSpinner = false;
            MessageService.error(err.statusText);
        }

        function formatDate(date) {
            if (!date) return '';
            return moment(new Date(date)).format(dateFormat);
        }

        function submitBatch() {
            $rootScope.productSpinner = true;
            Batch.submit(function(batch) {
                $rootScope.productSpinner = false;
                $scope.count();
                $state.go('adminOrders.shipped');
            }, errorHandler);
        }

        function updateOrder(order) {
            Order.get({id:order.id}, function(o) {
                order.orderNumber = o.orderNumber;
                var products = [];
                _.each(o.orderItems, function(oi) {
                    products = products.concat([oi.product]);
                    if (oi.product.children.length>0) {
                        products = products.concat(oi.product.children);
                    }
                });
                updateProducts(products);
            });
        }

        $scope.deleteSelectedProduct = function() {
            var selectedProducts = getSelectedProducts();
            if (selectedProducts.length!==1) return;
            var product = selectedProducts[0];

            MessageService.confirm('Do you really want to delete this project?', function() {
                Product.delete({id:product.id}, function() {
                    var nodes = gridApi.getSelectedNodes(),
                        order = nodes[0].data.order;

                    removeProducts([product]);

                    if (order) {
                        updateOrder(order);
                    }

                    $scope.count();
                    $state.go('^');
                }, errorHandler);
            });
        };

        $scope.deleteProduct = function(product) {
            MessageService.confirm('Do you really want to delete this project?', function() {
                Product.delete({id:product.id}, function() {
                    removeProducts([product]);
                    $scope.count();
                    $state.go('^');
                }, errorHandler);
            });
        };

        $scope.addDuplicate = function() {

            var selectedProducts = getSelectedProducts();
            if (selectedProducts.length===1) {

                $rootScope.productSpinner = true;
                var product = selectedProducts[0];

                ProductService.createDuplicate(product)
                    .then(function(child) {
                        new Product(child).$save( function(result) {

                            //insert new row
                            var nodes = gridApi.getSelectedNodes(),
                                data = nodes[0].data,
                                order = data.order;

                            product.children.push(result);

                            if (data.type==='order-single') {
                                data.type = 'order';
                                data.orderProducts = [product, result];
                                delete data.product;
                                gridApi.insertItemsAtIndex(nodes[0].childIndex + 1,[
                                    {
                                        type: 'product',
                                        order: order,
                                        orderIndex: data.orderIndex,
                                        product: result,
                                        lastItem: true
                                    },
                                    {
                                        type: 'product',
                                        order: order,
                                        orderIndex: data.orderIndex,
                                        product: product,
                                    }
                                ]);

                            } else {
                                gridApi.insertItemsAtIndex(nodes[0].childIndex + product.children.length ,[
                                    {
                                        type: 'product',
                                        order: order,
                                        orderIndex: data.orderIndex,
                                        product: result
                                    }
                                ]);
                            }

                            //refresh order ID
                            Order.get({id:order.id}, function(o) {
                                order.orderNumber = o.orderNumber;
                                _.each(o.orderItems, function(oi) {
                                    if (oi.product.id===product.id) {
                                        product.productNumber = oi.product.productNumber;
                                    }
                                    if (oi.product.id===result.id) {
                                        result.productNumber = oi.product.productNumber;
                                    }
                                })
                                gridApi.refreshView();
                            });

                            selectProduct(result);

                            $state.go($state.current.name, {
                                id: result.id
                            });
                            $rootScope.productSpinner = false;

                        }, errorHandler);
                    });



            }
        };

        $scope.onProductMenuClick = function(key) {
            var selectedProducts = getSelectedProducts();

            if (key==='submitBatch') {
                submitBatch();
            } else if (key==='generateProdSheet') {
                Task.generateProductionSheets({id:currentBatch.id});
            } else if (selectedProducts.length===1 && key==='reorder') {

                $rootScope.productSpinner = true;
                Product.reorder({id:selectedProducts[0].id}, function(result) {

                    $state.go('adminOrders.projects.details', {id:result.id});
                    $rootScope.productSpinner = false;

                }, errorHandler);

            } else if (selectedProducts.length===1 && key==='delete') {
                $scope.deleteSelectedProduct();
            } else if (selectedProducts.length===1 && key==='reprint') {

                $rootScope.productSpinner = true;
                Product.reprint({id:selectedProducts[0].id}, function(result) {

                    if ($state.current.name==='adminOrders.orders.details') {

                        //insert new row
                        var nodes = gridApi.getSelectedNodes(),
                            data = nodes[0].data,
                            order = data.order;
                        order.orderItems.push({product:result});

                        if (data.type==='order-single') {
                            data.type = 'order';
                        }

                        gridApi.insertItemsAtIndex(nodes[0].childIndex+1,[
                            {
                                type: 'product',
                                order: order,
                                orderIndex: data.orderIndex,
                                product: result,
                            }
                        ]);

                        selectProduct(result);
                        $state.go($state.current.name, {
                            id: result.id
                        });
                        gridApi.refreshView();
                    } else {
                        $state.go('adminOrders.orders.details', {
                            id: result.id
                        });
                    }

                    $rootScope.productSpinner = false;

                }, errorHandler);

            } else if (Task[key]) {
                _.each(getSelectedProducts(), function(p) {
                    Task[key]({id:p.id});
                });
            } else {
                //custom task
                var mi = StoreConfig.adminOrders.contextMenu.generate ?
                    StoreConfig.adminOrders.contextMenu.generate[key] : null;
                if (mi && mi.task) {
                    var getter = $parse(mi.task);
                    var rows = gridApi.getSelectedRows();
                    if (rows.length>0 && rows[0].order) {
                        var context = {order: rows[0].order, product: rows[0].product};
                        var job = getter(context);
                        console.log('schedule job', job)
                        Task.scheduleJob(job);
                    }
                }
                mi = StoreConfig.adminOrders.contextMenu.export ? 
                    StoreConfig.adminOrders.contextMenu.export[key] : null;
                if (mi && mi.link) {
                    var getter = $parse(mi.link);
                    var rows = gridApi.getSelectedRows();
                    if (rows.length>0 && rows[0].order) {
                        var nodes = gridApi.getSelectedNodes();
                        var context = {
                            order: rows[0].order,
                            product: rows[0].product
                        };
                        var url = getter(context);
                        window.open(url, '_blank');
                    }
                }
            }
        };

        function getSelectedProducts() {
            var rows = gridApi.getSelectedRows(),
                products = [];

            _.each(rows, function(row) {
                if (row.product) {
                    products.push(row.product);
                } else if (row.order) {
                    _.each(row.order.orderItems, function(oi) {
                        products.push(oi.product);
                        if (oi.product.children.length>0) {
                            products.push.apply(products, oi.product.children);
                        }
                    });
                }
            });
            return products;
        }

        this.getSelectedProducts = getSelectedProducts;

        /*
        Update products in the grid
        */
        function updateProducts(products) {
            var numChanges = 0;

            var allProducts = [];
            _.each(products, function(p) {
                allProducts.push(p);
                if (p.children.length>0) {
                    allProducts.push.apply(allProducts, p.children);
                }
            });

            gridApi.forEachNode(function(rowNode) {
                if (rowNode.data.product) {
                    var p = _.findWhere(allProducts, {id:rowNode.data.product.id});
                    if (p) {
                        _.extend(rowNode.data.product, _.omit(p, 'children'));
                        numChanges++;
                    }
                }
            });
            if (numChanges>0) gridApi.refreshView();
        }

        function removeProducts(products) {
            var nodesToRemove = [];
            gridApi.forEachNode(function(rowNode) {
                _.each(products, function(product) {
                    if (rowNode.data.product && rowNode.data.product.id===product.id) {
                        nodesToRemove.push(rowNode);
                        rowNode.data.order.orderItems = _.filter(rowNode.data.order.orderItems, function(oi) {
                            return oi.product.id!==product.id;
                        });
                    }
                    if (rowNode.data.product) {
                        rowNode.data.product.children = _.filter(rowNode.data.product.children, function(p) {
                            return p.id !== product.id;
                        });
                    }
                });

            });

            var singleRowOrders = [];
            gridApi.forEachNode(function(rowNode) {
                if (rowNode.data.type==='order' && rowNode.data.order.orderItems.length===0) {
                    nodesToRemove.push(rowNode);
                }
                if (rowNode.data.type==='order' && rowNode.data.order.orderItems.length===1 &&
                    rowNode.data.order.orderItems[0].product.children.length===0) {
                    rowNode.data.type = 'order-single';
                    singleRowOrders.push(rowNode.data.order);
                    rowNode.data.product = rowNode.data.orderProducts[0];
                }
            });

            gridApi.forEachNode(function(rowNode) {
                if (rowNode.data.type==='product' && singleRowOrders.indexOf(rowNode.data.order)>=0) {
                    nodesToRemove.push(rowNode);
                }
            });

            gridApi.removeItems(nodesToRemove);
            gridApi.refreshView();
        }

        function selectProduct(p) {
            gridApi.forEachNode(function(rowNode) {
                if (rowNode.data.product && rowNode.data.product.id===p.id) {
                    rowNode.setSelected(true, true);
                }
            });
        }

        function removeSelection() {
            removeProducts(getSelectedProducts());
        }

        function onRowDoubleClicked(params) {
            // skip action if clicked cell has editor
            if (params.event.target.__agComponent && params.event.target.__agComponent.column.cellEditor) {
                return;
            }
            // skip action if clicked on project status cell
            var classList = params.event.target.classList;
            for (var i = 0; i < classList.length; i++) {
                if (classList[i].indexOf('project-status') >= 0 ||
                    classList[i].indexOf('editable-cell') >=0 ) {
                    return;
                }
            }

            var selectedRows = gridApi.getSelectedRows();
            if (selectedRows.length===1 && selectedRows[0].product && selectedRows[0].product.layoutId) {
                var p = selectedRows[0].product;

                if (p.productType==='SinglePrintProduct') {
                     MainNavService.gotoProductBuilder();
                } else {
                    $state.go('layout', {productId: p.id});
                }
            }
        }

        function updateCurrentSection() {
            var selectedRows = gridApi.getSelectedRows();
            $scope.model.currentSection = null;
            if (selectedRows.length===1 && selectedRows[0].product && $state.includes('adminOrders.search')) {
                //find selected section
                var states = ['adminOrders.projects', 'adminOrders.orders',
                    'adminOrders.currentBatch', 'adminOrders.shipped', 'adminOrders.completed'],
                    p = selectedRows[0].product;
                for (var i = 0; i < states.length; i++) {
                    var state = $state.get(states[i]),
                        productStates = state.resolve.statuses();
                    if (productStates.indexOf(p.state)>=0) {
                        $scope.model.currentSection = states[i];
                        break;
                    }
                }
            }
        }

        function onSelectionChanged() {
            var selectedRows = gridApi.getSelectedRows(),
                state = $state.current.name;

            $scope.selectedProducts = getSelectedProducts();

            if (selectedRows.length===1 && selectedRows[0].product) {
                if (state.indexOf('.details')===-1)
                    state += '.details';

                $state.go(state, { id: selectedRows[0].product.id });
                $rootScope.designerDisabled = !selectedRows[0].product.isReprint && !(selectedRows[0].product.layoutId);
            } else {
                if (state.indexOf('.details')>0) {
                    $state.go('^');
                }
                $rootScope.designerDisabled = false;
            }

            updateCurrentSection();
        }

        function optionNewValueHandler(params) {
            var products = getSelectedProducts(),
                optionCode = params.colDef.optionCode;

            _.each(products, function(p) {
                if (p.options[optionCode]!==params.newValue) {
                    //update the value
                    p.options[optionCode] = params.newValue;

                    if (params.colDef.cellEditor===AgGridProductOptionDropdown) {
                        var prototype = p.productPrototype;
                        if (!prototype && params.data.orderProducts) {
                            prototype = params.data.orderProducts[0].productPrototype;
                        }
                        
                        var val = prototype.getPrototypeProductOptionValue(optionCode, params.newValue);
                        if (val) {
                            p.displayOptions[optionCode] = val.displayName;
                        }
                    } else if (params.colDef.cellEditor==='popupText' || params.colDef.cellEditor===AgGridTextCellEditor) {
                        p.displayOptions[optionCode] = params.newValue;
                    }

                    if (optionCode==='trackingId') {
                        if (!ShippingService.isTrackingIdValid(params.newValue, p)) {
                            MessageService.error('Please enter a valid tracking ID.');
                            p.options.trackingId = null;
                            p.options.carrier = null;
                        } else {
                            p.options.carrier = ShippingService.getCarrier(params.newValue, p);
                        }
                        setTimeout(function(argument) {
                            $scope.gridOptions.columnApi.autoSizeColumn(params.colDef.colId);
                        });
                    }
                    if (optionCode==='carrier' && params.newValue==='LOCAL_PICKUP') {
                        p.options.trackingId = p.productNumber;
                        p.options.dateDelivered = (new Date()).toISOString();
                        p.options.dateShipped = (new Date()).toISOString();

                        console.log(p)
                    }        
                }
            });
            gridApi.refreshView();

            //save changes
            _.each(products, function(p) {
                if (!(products.length>1 && p.parentId)) {
                    var product = new Product(angular.copy(p));
                    product.$save();
                }
            });
        }

        function optionValueGetter(optionCode, params) {
            if (!params.data.product) return '';

            var p = params.data.product;

            if (p.options[optionCode]===true) return 'Yes';
            if (p.options[optionCode]===false) return 'No';

            if (p.productType==='SinglePrintProduct' && optionCode==='size') {
                var sizes = _.map(p.children, function(child) {
                    return child.displayOptions.size;
                });
                return sizes.join(' • ');
            }

            if (optionCode.startsWith('date')) {
                return optionDateGetter(optionCode, params);
            }

            return p.displayOptions[optionCode];
        }

        function carrierGetter(params) {
            var p = params.data.product || params.data.orderProducts[0];
            return p.displayOptions.carrier;
        }

        function trackingIdGetter(params) {
            var p = params.data.product || params.data.orderProducts[0];
            return p.options.trackingId;
        }

        function optionDateGetter(optionCode, params) {
            if (!params.data.product) return '';
            var date = params.data.product.options[optionCode];
            return formatDate(date);
        }

        var getters = {
            productStatus:  function(params) {
                var row = params.data,
                    product = row.product;
                if (row.type==='order' && row.orderProducts.length>0) {
                    product = row.orderProducts[0];
                }
                if (!product) return '';
                if (product.onHold) return 'OnHold';
                if (product.isReprint) {
                    if (product.state==='Preflight') return 'Reprint';
                    if (product.state==='Printing') return 'Reprinting';
                }
                return product.state;
            },
            quantity: function(params) {
                var row = params.data;
                if (row.type==='order') return;
                return row.product.options._quantity;
            },
            orderId: function(params) {
                var row = params.data;
                if (row.type==='order')
                    return row.order.orderNumber;
                else
                    return row.product.productNumber;
            },
            user: function(params) {
                var row = params.data;
                if (row.type==='order') return;
                var user = row.product.user;
                return user.firstName + ' ' + user.lastName;
            },
            company: function(params) {
                var row = params.data;
                if (row.type==='order') return;
                return row.product.user.companyName;
            },
            price: function(params) {
                var row = params.data;
                if (row.type==='order') return row.order.total.displayPrice;
                if (row.product && row.product.isReprint) return '';
                if (row.product.productType==='SinglePrintProduct') {
                    return row.product.total ? row.product.total.displayPrice : '';    
                }
                return row.product.subtotal ? row.product.subtotal.displayPrice : '';
            },
            currency: function(params) {
                var row = params.data;
                if (row.type==='order') return row.order.total.displayCurrency;
                if (row.product && row.product.isReprint) return '';
                return row.product.subtotal ? row.product.subtotal.displayCurrency : '';
            },
            orderState: function(params) {
                var row = params.data;
                if (row.type==='order') return;
                return (row.order.state === 'PaymentComplete') ? 'PAID' : 'UNPAID';
            },
            orderDate: function(params) {
                if (params.data.type==='product') return '';
                return formatDate(params.data.order.dateCreated);
            },
            productDate: function(params) {
                if (params.data.type==='order') return '';
                var product = params.data.product;
                return formatDate( product.options._dateCreated );
            },
            rush: function(params) {
                var row = params.data;
                if (row.type==='order') return '';
                return (row.product.options._rush) ? 'RUSH' : '';
            },
            studioSample: function(params) {
                var row = params.data;
                if (row.type==='order') return '';
                return (row.product.options._studioSample) ? 'Yes' : 'No';
            },
            dueDate: function(params) {
                var row = params.data;
                if (row.type==='order') return '';
                return (row.product.options._rush) ? formatDate(row.product.options.dueDate) : '';
            },
            currentBatchId: function(params) {
                var row = params.data;
                if (row.type==='order') return '';
                return (currentBatch.name);
            },
            batchId: function(params) {
                var row = params.data;
                if (!(row.product && row.product.batch)) return '';
                return (row.product.batch.name);
            }
        };

        function productStatusNewValueHandler(params) {
            if (!params.newValue || params.newValue===params.oldValue) return;

            var selectedProducts = getSelectedProducts(),
                ids = _.pluck(selectedProducts, 'id'),
                oldValue = params.oldValue,
                newValue = params.newValue;

            var doStuff = function() {

                _.each(selectedProducts, function(p) {
                    if (newValue==='OnHold') {
                        p.onHold = true;
                    } else {
                        p.state = newValue;
                        p.onHold = false;
                    }
                });
                Product.setState({productIds:ids, state:newValue}, function(products) {

                    if (newValue!=='OnHold' && statuses.indexOf(newValue)===-1) {
                        $rootScope.$broadcast('products-moved', products);
                        removeProducts(products);
                    }
                    updateCurrentSection();

                }, function(error) {

                });
                gridApi.refreshView();
            };

            if (newValue==='Shipped') {
                //check tracking Id
                var trackingIds = _.compact(_.map(selectedProducts, function(p) {
                    return p.options.trackingId;
                }));
                if (trackingIds.length<selectedProducts.length) {
                    MessageService.ok('In order to mark an order as shipped you must first enter in a tracking number.');
                    return;
                }
            } 

            if (newValue==='Cancelled') {
                var msg = 'Do you really want to cancel ' + (selectedProducts.length>1 ? 'these orders?' : 'this order?');
                MessageService.confirm(msg, doStuff);
            } 
            // else if (newValue==='OnHold') {
            //     var promises = _.map(selectedProducts, function(p) {
            //         p.onHold = true;
            //         return (new Product(p)).$save();
            //     });
            //     gridApi.refreshView();

            // } 
            else {
                doStuff();
            }
        }

        function orderStateNewValueHandler(params) {
            if (params.newValue===params.oldValue) return;

            if (!user.superAdmin) return;
            if (params.newValue==='PAID') {
                //mark as paid;

                var products = getSelectedProducts();
                if (products.length===1) {
                    $rootScope.productSpinner = true;
                    Product.markAsPaid({id:products[0].id}, function(result) {

                        $state.go('adminOrders.orders.details', {id:products[0].id});
                        $rootScope.productSpinner = false;
                        $scope.$emit('products-moved');

                    }, errorHandler);
                }
            }

            
        }

        function quantityNewValueHandler(params) {
            if (params.newValue===params.oldValue) return;

            var selectedProducts = getSelectedProducts();
            var promises = _.map(selectedProducts, function(p) {
                p.options._quantity = params.newValue;
                return (new Product(p)).$save();
            });
            gridApi.refreshView();
        }

        function orderIdNewValueHandler(params) {
            if (params.newValue===params.oldValue) return;
            var orderId = params.newValue,
                product = params.data.product,
                order = params.data.order;

            if (product) {
                product.productNumber = orderId;
                new Product(product).$save();
            }
        }

        function currentBatchIdNewValueHandler(params) {
            if (params.newValue===params.oldValue) return;
            currentBatch.name = params.newValue;
            currentBatch.$save();
        }

        function monthToComparableNumber(date) {
            if (date === undefined || date === null || date.length !== 10) {
                return null;
            }
            var yearNumber = date.substring(6,10);
            var monthNumber = date.substring(3,5);
            var dayNumber = date.substring(0,2);
            var result = (yearNumber*AppConstants.YEAR_NUMBER) + (monthNumber*AppConstants.MONTH_NUMBER) + dayNumber;
            return result;
        }

        function dateComparator(date1, date2) {
            var date1Number = monthToComparableNumber(date1);
            var date2Number = monthToComparableNumber(date2);
            if (date1Number===null && date2Number===null) {
                return 0;
            }
            if (date1Number===null) {
                return -1;
            }
            if (date2Number===null) {
                return 1;
            }
            return date1Number - date2Number;
        }

        function currencyComparator(price1, price2) {
            var actualPrice1 = price1.substr(1).replace(/[,]/g, '');
            var actualPrice2 = price2.substr(1).replace(/[,]/g, '');
            return  actualPrice1 - actualPrice2;
        }

        var orderStateDropdownItems = [
            //{id: 'UNPAID', label: 'Unpaid'},
            {id: 'PAID', label: 'Paid'}
        ];

        var colParams = {
            productStatus: {
                width: 180,
                editable: true,
                headerEditable: true,
                cellRenderer: AgGridDropdownCellRenderer,
                cellRendererParams: {
                    values: [
                        {id:'Reprint', label:'Reprint', className: 'project-status-orchid'},
                        {id:'Reprinting', label:'Reprinting', className: 'project-status-orchid'},
                        {id:'Printing', label:'Printing', className: 'project-status-orange'},
                        {id:'Bindery', label:'Bindery', className: 'project-status-blue'},
                        {id:'Preflight', label:'Preflight', className: 'project-status-gray'},
                        {id:'Printed', label:'Printed', className: 'project-status-gray'},
                        {id:'ReadyToShip', label:'Ready to Ship', className: 'project-status-blue'},
                        {id:'Shipped', label:'Shipped', className: 'project-status-green'},
                        {id:'Completed', label:'Completed', className: 'project-status-green'},
                        {id:'OnHold', label:'On Hold', className: 'project-status-red'},
                        {id:'Cancelled', label:'Cancelled', className: 'project-status-red'},
                        {id:'New', label:'Designing', className: 'project-status-orange'},
                    ]
                },
                cellEditor: AgGridDropdownCellEditor,
                cellEditorParams: { values: statusDropdownItems },
                newValueHandler: productStatusNewValueHandler
            },
            quantity: {
                editable: true,
                cellRenderer: AgGridDropdownCellRenderer,
                cellRendererParams: {
                    values: _(10).times(function(n) { return {id:n+1, label:n+1, className:'ag-grid-dropdown-cell--default'} })
                },
                cellEditor: AgGridDropdownCellEditor,
                newValueHandler: quantityNewValueHandler
            },
            jobProgress: {
                width: 120,
                field: 'jobProgress',
                cellRenderer: JobProgressCellRenderer,
                hide: true,
                colId: 'jobProgress',
                volatile: true,
            },
            rush: {
                width: 70,
                colId: 'rush',
                cellRenderer: AgGridRushCellRenderer,
                hide: true
            },
            dueDate: {
                colId: 'dueDate',
                hide: true
            },
            currency: {
                colId: 'currency',
                cellRenderer: CurrencyCellRenderer,
            },
            attachments: {
                colId: 'attachments',
                cellRenderer: AttachmentsCellRenderer
            },
            orderState: {
                width: 130,
                //editable: true,
                cellRenderer: AgGridDropdownCellRenderer,
                cellRendererParams: {
                    values: [
                        {id: 'UNPAID', label: 'Unpaid', className:'project-status-red'},
                        {id: 'PAID', label: 'Paid', className:'project-status-green'}
                    ]
                },
                cellEditor: AgGridDropdownCellEditor,
                cellEditorParams: { values: orderStateDropdownItems },
                newValueHandler: orderStateNewValueHandler,
                editable: user.superAdmin
            },
            orderId: {
                editable: true,
                cellEditor: 'popupText',
                cellRenderer: AgGridOrderIdCellRenderer,
                newValueHandler: orderIdNewValueHandler
            },
            currentBatchId: {
                editable: true,
                cellEditor: 'popupText',
                newValueHandler: currentBatchIdNewValueHandler
            }
        };

        var columnDefs = _.map(columns, function(col) {
            var colDef;
            col.sortable = true;
            if (col.field) {
                colDef = {
                    colId: 'field-' + col.field,
                    headerName: col.header,
                    valueGetter: getters[col.field],
                    cellStyle: OrdersGridUIService.getCellStyle,
                    cellClass: OrdersGridUIService.getCellClass
                };

                if (col.sort) {
                    colDef.sort = col.sort;
                }

                if (colParams[col.field]) {
                    _.extend(colDef, colParams[col.field]);
                }
                if(col.header === 'Created'){
                    colDef.comparator = dateComparator;
                }
                if(col.header === 'Price'){
                    colDef.comparator = currencyComparator;
                }
            } else if (col.optionCode) {
                colDef = {
                    colId: 'option-' + col.optionCode,
                    headerName: col.header,
                    valueGetter: optionValueGetter.bind(null, col.optionCode),
                    cellStyle: OrdersGridUIService.getCellStyle,
                    cellClass: OrdersGridUIService.getCellClass
                };

                if (col.expression) {
                    colDef.valueGetter = col.expression;
                }

                if (col.sort) {
                    colDef.sort = col.sort;
                }

                if (col.editable) {
                    colDef.editable = true;
                    colDef.optionCode = col.optionCode;
                    if (col.editor==='dropdown') {
                        colDef.cellRenderer = AgGridDropdownCellRenderer;
                        colDef.cellEditor = AgGridProductOptionDropdown;
                        colDef.newValueHandler = optionNewValueHandler;
                        if (col.optionCode==='carrier') {
                            colDef.valueGetter = carrierGetter;
                            colDef.headerEditable = true;
                        } 
                    } else if (col.editor==='text') {
                        colDef.cellEditor = AgGridTextCellEditor;// 'popupText';
                        colDef.newValueHandler = optionNewValueHandler;
                        if (col.optionCode==='trackingId') {
                            colDef.cellRenderer = AgGridTrackingIdCellRenderer;
                            colDef.valueGetter = trackingIdGetter;
                        }
                    } else if (col.editor==='date') {
                        colDef.cellEditor = AgGridDateCellEditor;
                        colDef.valueGetter = optionDateGetter.bind(null, col.optionCode);
                        colDef.newValueHandler = optionNewValueHandler;
                    }
                }
            } else if (col.expression) {
                colDef = {
                    colId: 'exp-' + col.header,
                    headerName: col.header,
                    valueGetter: col.expression,
                    cellStyle: OrdersGridUIService.getCellStyle,
                    cellClass: OrdersGridUIService.getCellClass
                };

                if (col.sort) {
                    colDef.sort = col.sort;
                }
            }
            if (!colDef.width) {
                //approx width to make the header visible
                colDef.width = (colDef.headerName.length * 12) + 30;
            }

            return colDef;
        });

        function getProductRows(products) {
            var rows = [];
            _.each(products, function(p) {

                if (!(p.productType==='SinglePrintProduct' && p.parentId)) {
                    rows.push({
                        type:'order-single',
                        order: { dateCreated: p.orderDate || p.options._dateCreated, id: p.orderId },
                        product: p,
                        orderIndex: rows.length
                    });
                }
            });
            return rows;
        }

        function getRows(orders) {
            var rows = [];

            _.each(orders, function(o) {

                //filter order items
                // o.orderItems = _.filter(o.orderItems, function(oi) {
                //     return (statuses.indexOf(oi.product.state)>=0);
                // });

                var products = [];
                _.each(o.orderItems, function(oi) {
                    products.push(oi.product);
                    if (oi.product.productType!=='SinglePrintProduct' && oi.product.children.length>0) {
                        products.push.apply(products, oi.product.children);
                    }
                });

                if (products.length>1 || o.isSplit) {
                    var orderProducts = [];
                    rows.push({
                        type:'order',
                        order: o,
                        orderProducts: orderProducts,
                        orderIndex: orderIndex
                    });
                    _.each(products, function(p, i) {
                        if (p.options._rush) {
                            hasRushJobs = true;
                        }
                        if (statuses.indexOf(p.state)>=0) {
                            orderProducts.push(p);
                            rows.push({
                                type:'product',
                                order: o,
                                product: p,
                                orderIndex: orderIndex,
                                lastItem: (i===products.length - 1)
                            });
                        }
                    });
                    orderIndex++;
                } else if (products.length===1) {
                    if (products[0].options._rush) {
                        hasRushJobs = true;
                    }
                    if (statuses.indexOf(products[0].state)>=0) {
                        rows.push({
                            type:'order-single',
                            order: o,
                            product: products[0],
                            orderIndex: orderIndex
                        });

                        orderIndex++;
                    }
                }

            });

            if ($scope.gridOptions.columnApi) {
                $scope.gridOptions.columnApi.setColumnVisible('rush', hasRushJobs );
                $scope.gridOptions.columnApi.setColumnVisible('dueDate', hasRushJobs );
            }
            return rows;
        }

        function onRowDragStart(product, e) {
            var dt = e.dataTransfer;
            dt.setData('text/x-pace-products', JSON.stringify(getSelectedProducts()));
        }

        function onRowDragEnd(product, e) {
            removeProducts(getSelectedProducts());
        }

        function processRowPostCreate(params) {
            var node = params.node;

            if ((node.data.product && node.data.product.state!=='New') || (node.data.type==='order')) {
                var row = params.eRow;
                row.setAttribute('draggable', true);
                row.addEventListener('dragstart', onRowDragStart.bind(null, node.data.product));
                row.addEventListener('dragend', onRowDragEnd.bind(null, node.data.product));
            }
        }

        function checkRush() {
            //TODO: call the server to check if we have any rush column
            // $scope.gridOptions.columnApi.setColumnVisible('rush', hasRushJobs );
        }

        $scope.jobs = [];
        $scope.completedJobs = [];
        $scope.selectedProducts = [];

        $scope.$on(NotificationEvent.NotificationReceived, function(event, notification) {

            if (notification.type==='ProductStateChanged') {
                var products = JSON.parse(notification.body),
                    refresh = false;
                gridApi.forEachNode(function(rowNode) {
                    if (rowNode.data.product) {
                        var p = _.findWhere(products, {id:rowNode.data.product.id});
                        if (p) {
                            rowNode.data.product.state = p.state;
                            refresh = true;
                        }
                    }
                });
                if (refresh) {
                    gridApi.refreshView();
                }
            }

            if (notification.type==='OrderCreated' ||
                notification.type==='BatchSentToPrint') {
                gridLazyLoading.reset();
            }

            if (notification.type==='JobProgress') {
                var message = JSON.parse(notification.body);
                var user = AuthService.getCurrentUser();
                console.debug('progress info', message);
                if (message.user && message.user.id!==user.id) return;

                var job = _.findWhere($scope.completedJobs, {jobId:message.jobId});
                if (job) return;

                if (message.isCompleted && message.productId) {
                    //update product row
                    Product.get({id:message.productId}, function(product) {
                        updateProducts([product]);
                    });
                }

                job = _.findWhere($scope.jobs, {jobId:message.jobId});
                if (!job && message.progressPercent<=100) {
                    job = message;
                    $scope.recentJob = job;
                    $scope.jobs.push(job);
                }
                if (message.progressPercent>job.progressPercent) {
                    job.progressPercent = message.progressPercent;
                    $scope.recentJob = job;
                }
                if (job.progressPercent===100) {
                    $scope.completedJobs.push(job);
                    $scope.jobs = _.without($scope.jobs, job);
                    $scope.recentJob = null;
                }
                //console.log('jobs', $scope.jobs);
                // var jobColVisible = $scope.jobs.length>0;
                // var colState = $scope.gridOptions.columnApi.getColumn('jobProgress');

                // if (colState && colState.visible !== jobColVisible) {
                //     $scope.gridOptions.columnApi.setColumnVisible('jobProgress', jobColVisible );
                // }

                var rowNodes = [];
                gridApi.forEachNode(function(rowNode) {

                    var q;
                    if (rowNode.data.type==='product') {
                        q = {productId:rowNode.data.product.id};
                    } else {
                        q = {orderId:rowNode.data.order.id};    
                    }
                    var jobs = _.where($scope.jobs, q);
                    var progress = jobs.length>0 ? progress = jobs[0].progressPercent : null;
                    if (rowNode.data.jobProgress !== progress) {
                        rowNode.data.jobProgress = progress;
                        rowNodes.push(rowNode);
                    }

                });

                if (rowNodes.length>0) {
                    gridApi.softRefreshView();
                    //gridApi.refreshCells(rowNodes,['jobProgress']);
                }
            }
        });

        $scope.$on(ModelEvent.ModelChanged, function(event, args) {
            if (args.type==='Product') {
                console.log('ModelChanged', args)
                updateProducts(args.items);
            }
        });

        $scope.onKeyDown = function(e) {
            var UP = 38, DOWN = 40,
                BACKSPACE = 8, DELETE = 46, ESC = 27;

            if (e.keyCode === BACKSPACE || e.keyCode===DELETE) {
                var activeElement = $(document.activeElement);
                if (activeElement.is('input') || activeElement.is('textarea')) return;
                $scope.deleteSelectedProduct();
            }

            if (e.keyCode!==UP && e.keyCode!==DOWN) return;
            var model = gridApi.getModel(),
                selectedNodes = gridApi.getSelectedNodes(),
                index = 0;

            if (selectedNodes.length>0) {
                var step = (e.keyCode === UP ? -1 : 1) * (e.shiftKey ? 10 : 1),
                    min = 0,
                    max = model.rootNode.allChildrenCount - 1;
                index = Math.min(max, Math.max(min, selectedNodes[0].childIndex + step));
            }
            var node = model.rootNode.allLeafChildren[index];
            if (node) {
                gridApi.ensureIndexVisible(index);
                node.setSelected(true, true);
            }
        };

        var gridLazyLoading;
        $scope.gridVisible = false;

        var cadFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        });

        var saveGridState = function() {
            var state = {
                column: $scope.gridOptions.columnApi.getColumnState(),
                sort: $scope.gridOptions.api.getSortModel(),
                filter: $scope.gridOptions.api.getFilterModel()
            };

            if (!userSettings.settings.gridState) {
                userSettings.settings.gridState = {};
            }

            userSettings.settings.gridState[$state.current.name] = state;
            userSettings.$save();
        };

        var saveGridStateDebounced = $debounce(saveGridState, 2000);

        var gridContext = {
            formatMoney: function(val) {
                if (isNaN(val)) return '';
                return cadFormatter.format(val);
            }
        };

        if (StoreConfig.adminOrders && StoreConfig.adminOrders.gridContext) {
            _.each(StoreConfig.adminOrders.gridContext, function(val, key) {
                try {
                    var fnString = val.join('\n');
                    var fn = new Function('return ' + fnString)();
                    gridContext[key] = fn;
                } catch(error) {
                    console.error(fn, error);
                }
            });
            //console.debug('gridContext', gridContext);
        }
        if (StoreConfig.adminOrders && StoreConfig.adminOrders.dateFormat) {
            dateFormat = StoreConfig.adminOrders.dateFormat;
        }

        $scope.gridOptions = {
            debug: false,
            columnDefs: columnDefs,
            onGridReady: function(params) {
                var gridPageLoaded = false;
                gridApi = params.api;

                gridLazyLoading = GridLazyLoading({
                    loadRows: orders ? orders : products,
                    getRows: orders ? getRows : getProductRows,
                    gridOptions: $scope.gridOptions,
                    productId: $state.params.id ? parseInt($state.params.id) : null
                });
                $rootScope.gridSpinner = true;
                gridLazyLoading.loadPage().then(function() {
                    $scope.gridVisible = true;
                    $rootScope.gridSpinner = false;

                    // load grid state
                    var gridState = (userSettings.settings && userSettings.settings.gridState && userSettings.settings.gridState[$state.current.name]) ? userSettings.settings.gridState[$state.current.name] : null;

                    if (gridState) {
                        if (gridState.column) {
                            $scope.gridOptions.columnApi.setColumnState(gridState.column);
                        }

                        if (gridState.sort) {
                            $scope.gridOptions.api.setSortModel(gridState.sort);
                        }

                        if (gridState.filter) {
                            $scope.gridOptions.api.setFilterModel(gridState.filter);
                        }
                    }

                    gridPageLoaded = true;
                });

                // save grid state
                $scope.gridOptions.api.addGlobalListener(function(type, event) {
                    if (gridPageLoaded && type.indexOf('column') >= 0) {
                        if (event.type !== 'columnResized' && event.type !== 'columnMoved') {
                            return;
                        }

                        if (event.type === 'columnResized' && !event.finished) {
                            return;
                        }

                        saveGridStateDebounced();
                    }
                });

            },
            suppressColumnMoveAnimation: true,
            enableColResize: true,
            suppressCellSelection: true,
            singleClickEdit: false,
            rowSelection: 'multiple',
            onSelectionChanged: onSelectionChanged,
            onRowDoubleClicked: onRowDoubleClicked,
            processRowPostCreate: processRowPostCreate,
            getRowClass: OrdersGridUIService.getRowClass,
            rowHeight: 40,
            headerHeight: 40,
            enableSorting: true,
            context: gridContext
        };

        function getGenerateMenuItems() {
            var contextMenu = StoreConfig.adminOrders.contextMenu.generate;
            var result = 'generate:{ name: "Generate", visible:selectedProducts.length>0, items:{';
            _.each(contextMenu, function(ci, key) {

                if (ci.separator) {
                    result += '"' + key + '":{ type: "cm_separator" },';
                } else {
                    result += '"' + key + '": { name: "' + ci.label + '"';
                    if (ci.cover) result += ',visible:isMenuItemVisible("generateCover")';
                    result += '},'
                }

            });

            result += '} },';
            return result;
        }

        function getExportMenuItems() {
            var contextMenu = StoreConfig.adminOrders.contextMenu.export;
            if (!contextMenu) return '';
            var result = 'export:{ name: "Export", visible:selectedProducts.length>0, items:{';
            _.each(contextMenu, function(ci, key) {

                if (ci.separator) {
                    result += '"' + key + '":{ type: "cm_separator" },';
                } else {
                    result += '"' + key + '": { name: "' + ci.label + '"},';
                }

            });
            result += '} },';
            result += 'sepExport:{ type: "cm_separator", visible:selectedProducts.length>0 },';
            return result;
        }

        $scope.contextMenu = '{' +
            'delete: { name: "Delete", visible:selectedProducts.length>0 },' +
            '_sep1:{ type: "cm_separator", visible:selectedProducts.length>0 },' +
            getExportMenuItems() +
            getGenerateMenuItems() +

            '_sep2:{ type: "cm_separator", visible:selectedProducts.length>0 },' +
            'reprint: { name: "Reprint", visible:selectedProducts.length>0},' +
            //'sep3:{ type: "cm_separator", visible:selectedProducts.length>0 },' +
            //'submitBatch: {visible: $state.includes("adminOrders.currentBatch"), name: "Submit Batch"}'+
        '}';

        $scope.isMenuItemVisible = function(key) {
            var selectedProducts = getSelectedProducts();
            if (key==='generateCover' && selectedProducts.length===1 &&
                !!selectedProducts[0].coverLayoutId) return true;

            return false;
        };

    }
]);
