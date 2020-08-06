'use strict';

angular.module('pace.admin')
    .controller('CouponsCtrl', ['$scope', '$state', '$timeout', 'coupons', 'columns', 'users',
        'GridLazyLoading', 'AgGridDropdownCellRenderer', 'AgGridDropdownCellEditor', '$rootScope', 'KeyboardService',
        'GridService', 'userSettings', '$debounce', 'StoreConfig', 'AppConstants', '$parse', 'MessageService',
        function ($scope, $state, $timeout, coupons, columns, users,
                  GridLazyLoading, AgGridDropdownCellRenderer, AgGridDropdownCellEditor, $rootScope, KeyboardService,
                  GridService, userSettings, $debounce, StoreConfig, AppConstants, $parse, MessageService) {

            var gridApi,
                couponIndex = 0,
                dateFormat = AppConstants.DATE_TIME_FORMAT,
                gridLazyLoading;

            $scope.gridVisible = false;

            function errorHandler(err) {
                MessageService.error(err.statusText);
            }

            function formatDate(date) {
                if (!date) return '';
                return moment(new Date(date)).format(dateFormat);
            }

            $scope.onKeyDown = function (e) {
                var UP = 38,
                    DOWN = 40,
                    BACKSPACE = 8,
                    DELETE = 46,
                    ESC = 27;
            };

            function getRowClass(params) {
                var classes = [];
                return classes;
            }

            function getCellStyle(params) {
                var style = {};
                return style;
            }

            function getCellClass(params) {
                var cellClass = [],
                    data = params.data;

                if (params.colDef.headerName === 'Status') {
                    cellClass.push('ag-cell-custom-status');
                }

                return cellClass;
            }

            var getters = {
                status: function(params) {
                    return params.data.status;
                },
                created: function(params) {
                    return formatDate(params.data.created);
                },
                code: function(params) {
                    return params.data.code;
                },
                comment: function(params) {
                    return params.data.comment;
                },
                users: function(params) {
                    // all users
                    if (params.data.users === 'all') return 'All users';

                    // single user
                    if (params.data.users.length === 1) {
                        var couponUser = _.find(users, function(user) {
                            return user.id === params.data.users[0];
                        });

                        if (couponUser) {
                            return couponUser.fullName;
                        }
                        // fallback if user is not found
                        else {
                            return '1 user';
                        }
                    }

                    // multiple users
                    return params.data.users.length + ' users';
                },
                discount: function(params) {
                    if (params.data.discountType === 'cashValue') {
                        return '$' + params.data.discount;
                    } else if (params.data.discountType === 'percentageOff') {
                        return params.data.discount + '%';
                    }

                    return '';
                },
                validUntil: function(params) {
                    if (!params.data.validUntil) return '';

                    return formatDate(params.data.validUntil);
                },
                usesLeft: function(params) {
                    return params.data.usesLeft;
                },
                usedCounter: function(params) {
                    return params.data.usedCounter;
                }
            };

            var colParams = {
                status: {
                    width: 180,
                    editable: true,
                    cellRenderer: AgGridDropdownCellRenderer,
                    cellRendererParams: {
                        values: [
                            {id:'Enabled', label:'Enabled', className: 'project-status-green'},
                            {id:'Expired', label:'Expired', className: 'project-status-red'}
                        ]
                    },
                    cellEditor: AgGridDropdownCellEditor,
                    cellEditorParams: {values: [
                        {id:'Enabled', label:'Enabled'},
                        {id:'Expired', label:'Expired'}
                    ]},
                    // newValueHandler: statusNewValueHandler
                },
                // users: {
                //     width: 250,
                //     editable: true,
                //     cellRenderer: AgGridDropdownCellRenderer,
                //     cellRendererParams: {
                //         values: [
                //             {id: 'UNPAID', label: 'Unpaid', className:'project-status-red'},
                //             {id: 'PAID', label: 'Paid', className:'project-status-green'}
                //         ]
                //     },
                //     cellEditor: AgGridDropdownCellEditor,
                //     cellEditorParams: { values: orderStateDropdownItems },
                //     newValueHandler: orderStateNewValueHandler
                // },
            };

            var columnDefs = _.map(columns, function(col) {
                var colDef;

                if (col.field) {
                    colDef = {
                        colId: 'field-' + col.field,
                        headerName: col.header,
                        valueGetter: getters[col.field],
                        cellStyle: getCellStyle,
                        cellClass: getCellClass
                    };

                    if (col.sort) {
                        colDef.sort = col.sort;
                    }

                    if (colParams[col.field]) {
                        _.extend(colDef, colParams[col.field]);
                    }
                } else if (col.expression) {
                    colDef = {
                        colId: 'exp-' + col.header,
                        headerName: col.header,
                        valueGetter: col.expression,
                        cellStyle: getCellStyle,
                        cellClass: getCellClass
                    };

                    if (col.sort) {
                        colDef.sort = col.sort;
                    }
                }

                if (!colDef.width) {
                    // approx width to make the header visible
                    colDef.width = (colDef.headerName.length * 12) + 30;
                }

                return colDef;
            });

            function getRows(coupons) {
                var rows = [];

                _.each(coupons, function(coupon) {
                    rows.push(coupon);
                });

                return rows;
            }

            $scope.gridOptions = {
                debug: false,
                columnDefs: columnDefs,
                onGridReady: function(params) {
                    var gridPageLoaded = false;
                    gridApi = params.api;

                    gridLazyLoading = GridLazyLoading({
                        loadRows: coupons,
                        getRows: getRows,
                        gridOptions: $scope.gridOptions
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
                    // $scope.gridOptions.api.addGlobalListener(function(type, event) {
                    //     if (gridPageLoaded && type.indexOf('column') >= 0) {
                    //         if (event.type !== 'columnResized' && event.type !== 'columnMoved') {
                    //             return;
                    //         }
                    //
                    //         if (event.type === 'columnResized' && !event.finished) {
                    //             return;
                    //         }
                    //
                    //         saveGridStateDebounced();
                    //     }
                    // });
                },
                suppressColumnMoveAnimation: true,
                enableColResize: true,
                suppressCellSelection: true,
                singleClickEdit: false,
                // rowSelection: 'multiple',
                // onSelectionChanged: onSelectionChanged,
                // onRowDoubleClicked: onRowDoubleClicked,
                // processRowPostCreate: processRowPostCreate,
                getRowClass: getRowClass,
                rowHeight: 40,
                headerHeight: 40,
                enableSorting: false,
                // context: gridContext
            };
        }
    ]);
