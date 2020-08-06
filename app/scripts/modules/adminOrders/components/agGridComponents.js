'use strict';

angular.module('pace.adminOrders')

.factory('GridLazyLoading', function() {

    return function(options) {

        var canLoadNextPage = true,
            loading = false,
            pageSize = options.pageSize || 5,
            pageIndex = 0,
            firstProductLoaded = false;


        function loadPage() {
            if (loading) return;
            var result = options.loadRows(pageSize, pageIndex);
            loading = true;
            return result.$promise.then(function(result) {

                if (!options.gridOptions) return;

                var rows = options.getRows(result);

                if (result.length===0) {
                    canLoadNextPage = false;
                }

                if (pageIndex===0) {
                    options.gridOptions.api.setRowData( rows );
                    options.gridOptions.api.sizeColumnsToFit();
                    var cols = options.gridOptions.columnApi.getAllColumns();
                    options.gridOptions.columnApi.autoSizeColumns(_.pluck(cols,'colId'));
                } else {
                    options.gridOptions.api.addItems( rows.reverse() );
                }

                pageIndex++;
                loading = false;

                var loadMoreRows = false;
                if (options.productId && !firstProductLoaded) {
                    var p = _.find(rows, function(row) {
                        return row.product && row.product.id===options.productId;
                    });
                    if (p) {
                        options.gridOptions.api.forEachNode(function(rowNode) {
                            if (rowNode.data.product && rowNode.data.product.id===options.productId) {
                                rowNode.setSelected(true, true);
                                options.gridOptions.api.ensureIndexVisible(rowNode.childIndex);
                            }
                        });
                        firstProductLoaded = true;
                    } else {
                        loadMoreRows = true;
                    }
                }

                var el = $('.ag-body-viewport')[0];
                if (el.clientHeight===el.scrollHeight) loadMoreRows = true;
                if (canLoadNextPage && loadMoreRows) loadPage();

            }, function(error) {
                loading = false;
            });
        }

        function onScroll(e) {
            var target = e.target,
                tol = 70;
            if (canLoadNextPage && target.offsetHeight + target.scrollTop + tol >= target.scrollHeight) {
                loadPage();
            }
        }

        function reset() {
            loading = false;
            pageIndex = 0;
            loadPage();
        }

        $('.ag-body-viewport').on('scroll', onScroll);

        return {
            loadPage: loadPage,
            reset: reset
        };

    }

})

.factory('JobProgressCellRenderer', function() {

    function JobProgressCellRenderer() {};
    var prototype = JobProgressCellRenderer.prototype;

    prototype.init = function(params) {
        this.eGui = document.createElement('div');
        this.eGui.className = 'pdf-progress-bar';
        this.eGui.innerHTML = '<span class="pdf-progress-bar-track"><span class="pdf-progress-bar-step"></span></span>';
        this.eGui.style.width = '100px';
        this.eGui.style['margin-right'] = '0';
        this.eGui.style.visibility = params.value>0 ? 'visible' : 'hidden';
        this.stepSpan = this.eGui.querySelectorAll('.pdf-progress-bar-step')[0];
        this.stepSpan.style.width = params.value + '%';
    };

    prototype.getGui = function() {
        return this.eGui;
    };

    prototype.refresh = function(params) {
        this.eGui.style.visibility = params.value>0 ? 'visible' : 'hidden';
        this.stepSpan.style.width = params.value + '%';
    };

    return JobProgressCellRenderer;

})

.factory('CurrencyCellRenderer', function() {

    function CurrencyCellRenderer() {};
    var prototype = CurrencyCellRenderer.prototype;

    prototype.init = function(params) {
        var val = params.value || '';
        this.eGui = document.createElement('div');
        this.eGui.innerHTML = '<span class="icon-' + val.toLowerCase() + '"></span>';
        this.eGui.style.width = '20px';
    };

    prototype.getGui = function() {
        return this.eGui;
    };

    return CurrencyCellRenderer;

})

.factory('AttachmentsCellRenderer', function() {

    function AttachmentsCellRenderer() {};
    var p = AttachmentsCellRenderer.prototype;

    p.init = function(params) {
        this.eGui = document.createElement('div');
        this.eGui.className = 'ag-grid-attachment-cell';
        this.refresh(params);
    };

    p.getGui = function() {
        return this.eGui;
    };

    p.refresh = function(params) {
        var row = params.data;
        if (!row.product) return;

        var items = _.map(row.product.attachments, function(a) {
            var url = a.url || '';
            return {
                type: a.type,
                fileType: url.split('.').pop(),
                title: S(a.type).humanize().capitalize().s.replace('Hi', 'High'),
                url: PACE.StoreConfig.urlPrefix + url
            }
        });
        var html = '';
        for (var i = 0; i < items.length; i++) {
            var a = items[i];
            if (a.type==='LowResPdf') continue;
            html += '<a class="attachment ' + a.fileType + '" href="' + a.url + '" target="_blank" title="' + a.title + '"></a>';
        }
        this.eGui.innerHTML = html;

    };

    return AttachmentsCellRenderer;

})

.factory('AgGridRushCellRenderer', function() {

    function AgGridRushCellRenderer() {};
    var p = AgGridRushCellRenderer.prototype;

    p.init = function(params) {
        this.eGui = document.createElement('span');
        this.refresh(params);
    };

    p.getGui = function() {
        return this.eGui;
    };

    p.refresh = function(params) {
        this.eGui.innerHTML = params.value;
        this.eGui.className = params.value ? 'ag-grid-rush-cell' : '';
    };

    return AgGridRushCellRenderer;
})

.factory('AgGridDropdownCellRenderer', function() {

    function AgGridDropdownCellRenderer() {};
    var p = AgGridDropdownCellRenderer.prototype;

    p.init = function(params) {
        this.values = _.indexBy(params.values, 'id');

        this.eGui = document.createElement('span');
        this.refresh(params);

        this.eventListener = function(e) {
            if (params.node.selected) {
                e.stopPropagation();
            }
            var isEditable = (params.colDef.editable && params.data.type!=='order') || 
                (params.colDef.headerEditable && params.data.type==='order');

            if (isEditable) {
                params.api.startEditingCell({colKey:params.column.colId, rowIndex:params.rowIndex});
            }
        };
        this.eGui.addEventListener('click', this.eventListener);
    };

    p.getGui = function() {
        return this.eGui;
    };


    p.refresh = function(params) {
        var val = this.values[params.value];
        var label = val ? val.label : params.value;

        var isEditable = (params.colDef.editable && params.data.type!=='order') || 
                (params.colDef.headerEditable && params.data.type==='order');

        if (!label && isEditable) {
            label = 'Please select';
        }
        this.eGui.innerHTML = label || '';
        var className = label || isEditable ? 'ag-grid-dropdown-cell ' : '';
        if (val && val.className) {
            className += val.className;
        } else if (label) {
            className += 'ag-grid-dropdown-cell--default';
        }
        this.eGui.className = className;

        if (params.data.type === 'order' || params.data.type === 'product') {
            var connector = document.createElement('span');
            connector.classList.add('ag-grid-custom-order-connector');

            if (params.data.type === 'order') {
                connector.classList.add('ag-grid-custom-order-connector--order');
            } else if (params.data.type === 'product') {
                connector.classList.add('ag-grid-custom-order-connector--product');

                if (params.data.lastItem) {
                    connector.classList.add('ag-grid-custom-order-connector--product-last');
                }
            }
            this.eGui.appendChild(connector);
        }
    };

    p.destroy = function() {
        this.eGui.removeEventListener('click', this.eventListener);
    };

    return AgGridDropdownCellRenderer;
})

.factory('AgGridDateCellEditor', ['$compile', '$rootScope', function($compile, $rootScope) {

    function AgGridDateCellEditor() {};
    var p = AgGridDateCellEditor.prototype;

    p.init = function(params) {
        this.eGui = document.createElement('div');
        this.eGui.style.height = '300px';

        var el = angular.element('<datepicker><input class="input-box" ng-model="date" '+
            'type="text" style="margin-bottom:0;width:220px;height:0px;min-height:0px;padding:0;visibility:hidden"/></datepicker>');
        var scope = $rootScope.$new();
        $compile(el)(scope);
        this.eGui.appendChild(el[0]);

        this.eInput = this.eGui.querySelectorAll('.input-box')[0];
        this.scope = scope;

        if (!scope.$$phase) scope.$apply();

        var that = this;
        scope.$watch('date', function(date) {
            console.log('date set', date);
            if (date) {
                setTimeout(function() {
                    that.value = date;
                    params.stopEditing();
                });
            }
        });

    };

    p.getGui = function() { return this.eGui; };

    p.afterGuiAttached = function() {
        $(this.eInput).trigger('click');
    };

    p.getValue = function() { return this.value; };

    p.destroy = function() {
        this.scope.$destroy();
    };

    p.isPopup = function() { return true; };

    return AgGridDateCellEditor;

}])

.factory('AgGridDropdownCellEditor', [function() {

    function AgGridDropdownCellEditor() {};
    var p = AgGridDropdownCellEditor.prototype;

    p.init = function(params) {
        this.eGui = document.createElement('div');
        this.eGui.className = 'ag-grid-dropdown-editor';

        var items = params.values;
        if (!items && params.column.colDef.cellRendererParams) {
            items = params.column.colDef.cellRendererParams.values;
        }
        var html = '';
        if (items) {
            for (var i = 0; i < items.length; i++) {
                //hide current option
                if (params.value===items[i].id) continue;

                var className = 'ag-grid-dropdown-editor__option';
                // if (params.value===items[i].id) {
                //     className += ' ag-grid-dropdown-editor__option--active';
                // }

                html += '<li class="' + className + '" id="'+ items[i].id + '">'+items[i].label+'</li>';
                // if (params.value===items[i].id && items[i].className) {
                //     this.eGui.className += ' ' + items[i].className;
                // }
            }
        }
        this.eGui.innerHTML = '<ul class="ag-grid-dropdown-editor__options">' + html + '</ul>';

        var cellRect = params.eGridCell.getBoundingClientRect();
        this.eGui.style['min-width'] = cellRect.width + 'px';

        var that = this;
        this.eventListener = function(e) {
            var id = e.target.getAttribute('id');
            if (id) {
                that.value = id;
                params.stopEditing();
            }
        };

        this.eGui.addEventListener('click', this.eventListener);

        // close dropdown if clicked on non options item
        this.eventListenerPopupEditor = function(e) {
            if (e.target.classList.contains('ag-popup-editor')) {
                that.value = params.value;
                params.stopEditing();
            }
        };
    };

    p.getGui = function() { return this.eGui; };

    p.afterGuiAttached = function() {
        $(this.eGui).closest('.ag-popup-editor').on('click', this.eventListenerPopupEditor);
    };

    p.getValue = function() { return this.value; };

    p.destroy = function() {
        this.eGui.removeEventListener('click', this.eventListener);
        $(this.eGui).closest('.ag-popup-editor').off('click', this.eventListenerPopupEditor);
    };

    p.isPopup = function() { return true; };

    return AgGridDropdownCellEditor;

}])

.factory('AgGridProductOptionDropdown', ['AgGridDropdownCellEditor', 'ProductPrototype', function(AgGridDropdownCellEditor, ProductPrototype) {

    function AgGridProductOptionDropdown() {}

    AgGridProductOptionDropdown.prototype = new AgGridDropdownCellEditor();

    var originalInitFn = AgGridDropdownCellEditor.prototype.init;

    AgGridProductOptionDropdown.prototype.init = function(params) {

        originalInitFn.apply(this, arguments);

        console.log(params)
        var product = params.node.data.product || params.node.data.orderProducts[0];
        if (!params.values && product && !product.productPrototype) {
            params.stopEditing();
            ProductPrototype.get({id:product.prototypeId}, function(prototype) {
                product.productPrototype = prototype;
                var opt = prototype.getPrototypeProductOption(params.column.colDef.optionCode);
                if (opt && opt.prototypeProductOptionValues) {

                    //TODO: filter by visiblity
                    var values = _.map(opt.prototypeProductOptionValues, function(v) {
                        return {id:v.code, label:v.displayName};
                    });
                    values = _.sortBy(values, 'label');

                    params.column.colDef.cellRendererParams = {values:values};
                    params.api.startEditingCell({colKey:params.column.colId, rowIndex:params.node.childIndex});

                }
                //console.log('prototype loaded', opt)
            });
        }

    };

    return AgGridProductOptionDropdown;
}])

.factory('AgGridOrderIdCellRenderer', ['$rootScope', function($rootScope) {

    function AgGridOrderIdCellRenderer() {};
    var p = AgGridOrderIdCellRenderer.prototype;

    p.init = function(params) {
        this.isNotes = false;
        this.onNoteIndicatorClick = function(e) {
            e.preventDefault();
            e.stopPropagation();

            // console.debug('[send event...]', params);
            // $rootScope.$broadcast('toggle-special-instructions', params.value);
        }

        this.eGui = document.createElement('div');
        this.refresh(params);
    };

    p.getGui = function() {
        return this.eGui;
    };

    p.refresh = function(params) {
        this.isNotes = false;

        if (params.data.type === 'order-single' || params.data.type === 'product') {
            this.isNotes = params.data.product.options._notes ? true : false;
            this.isAdminNotes = params.data.product.options.adminNotes ? true : false;
            this.isCompanyLogo = params.data.product.newCompanyLogo ? true : false;
        } else if (params.data.type === 'order') {
            this.isNotes = params.data.order.orderItems[0].product.options._notes ? true : false;
            this.isAdminNotes = params.data.order.orderItems[0].product.options.adminNotes ? true : false;
            this.isCompanyLogo = params.data.order.orderItems[0].product.newCompanyLogo ? true : false;
        }

        var html = params.value || '';

        if (this.isCompanyLogo) {
            html += '<span title="New Company Logo" class="ag-grid-pace-badge ag-grid-pace-badge--yellow"></span>';
        }

        if (this.isNotes && this.isAdminNotes) {
            html += '<span title="Admin & Customer Notes" class="ag-grid-pace-badge ag-grid-pace-badge--green"></span>';
        } else if (this.isNotes) {
            html += '<span title="Customer Notes" class="ag-grid-pace-badge ag-grid-pace-badge--red"></span>';
        } else if (this.isAdminNotes) {
            html += '<span title="Admin Notes" class="ag-grid-pace-badge ag-grid-pace-badge--blue"></span>';
        }

        this.eGui.innerHTML = html;
        this.eGui.className = 'ag-grid-order-id-cell';

        if (this.isNotes) {
            var noteIndicator = this.eGui.getElementsByClassName('ag-grid-custom-notes-indicator');

            if (noteIndicator.length) {
                noteIndicator[0].removeEventListener('click', this.onNoteIndicatorClick);
                noteIndicator[0].addEventListener('click', this.onNoteIndicatorClick);
            }
        }
    };

    p.destroy = function() {
        if (this.isNotes) {
            var noteIndicator = this.eGui.getElementsByClassName('ag-grid-custom-notes-indicator');

            if (noteIndicator.length) {
                noteIndicator[0].removeEventListener('click', this.onNoteIndicatorClick);
            }
        }
    };

    return AgGridOrderIdCellRenderer;
}])

.factory('AgGridTrackingIdCellRenderer', ['ShippingService', function(ShippingService) {

    function AgGridTrackingIdCellRenderer() {};
    var p = AgGridTrackingIdCellRenderer.prototype;

    p.init = function(params) {
        this.eGui = document.createElement('span');
        this.refresh(params);
        
        this.onClick = function(e) {
            if (params.value && params.data.product) {
                var that = this;
                that.doubleClick = false;
                setTimeout(function() {
                    if (that.doubleClick) return;
                    var url = ShippingService.getTrackingUrl(params.data.product);
                    if (url) {
                        window.open(url, '_blank');
                    }
                }, 500);
                
            }
        };
        this.onDoubleClick = function(e) {
            this.doubleClick = true;
        };
        this.eGui.addEventListener('click', this.onClick);
        this.eGui.addEventListener('dblclick', this.onDoubleClick);
    };

    p.getGui = function() {
        return this.eGui;
    };

    p.refresh = function(params) {
        var val = params.value;
        this.eGui.innerHTML = val || '';
        this.eGui.className = 'editable-cell';
        this.eGui.style.cursor = 'pointer';
        this.eGui.style['text-decoration'] = 'underline';
    };

    p.destroy = function() {
        this.eGui.removeEventListener('click', this.onClick);
        this.eGui.removeEventListener('dblclick', this.onDoubleClick);
    };

    return AgGridTrackingIdCellRenderer;
}])

.factory('AgGridTextCellEditor', [function() {

    function AgGridTextCellEditor() {};
    var p = AgGridTextCellEditor.prototype;

    
    p.init = function(params) {
        // create the cell
        this.eInput = document.createElement('input');
        this.eInput.value = params.value || '';
        this.eInput.style.width = '100%';

        this.onBlur = function() {
            params.stopEditing();
        };
        this.onKeydown = function(event) {
            // this stops the grid from receiving the event and executing keyboard navigation
            if (event.keyCode===13) return;
            event.stopPropagation();
        };

        this.onPaste = function() {
            setTimeout(function() {
                params.stopEditing();    
            })
            
        };
        
        this.eInput.addEventListener('blur', this.onBlur);
        this.eInput.addEventListener('keydown', this.onKeydown);
        this.eInput.addEventListener('paste', this.onPaste);
        this.cancelBeforeStart = false;//!params.node.data.product;
    };

    p.getGui = function() {
        return this.eInput;
    };

    p.afterGuiAttached = function() {
        this.eInput.focus();
        this.eInput.select();
    };

    p.getValue = function() {
        return S(this.eInput.value).trim().s;
    };

    p.destroy = function() {
        this.eInput.removeEventListener('blur', this.onBlur);
        this.eInput.removeEventListener('keydown', this.onKeydown);
        this.eInput.removeEventListener('paste', this.onBlur);
    };

    p.isPopup = function() {
        return false;
    };

    // p.isCancelBeforeStart = function () {
    //     return this.cancelBeforeStart;
    // };

    return AgGridTextCellEditor;

}]);
