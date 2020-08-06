'use strict';

angular.module('pace.admin')
    .controller('AdminProductListCtrl', ['$scope', '$state', '$stateParams', 'prototypes',
        function($scope, $state, $stateParams, prototypes) {

            $scope.prototypes = prototypes;

        }
    ])

    .controller('AdminProductDetailsCtrl', ['$scope', '$state', '$stateParams', 'productPrototype',
        function($scope, $state, $stateParams, productPrototype) {

            $scope.productPrototype = productPrototype;

            

        }
    ])
    .factory('GenericRule', ['$resource', function($resource) {

        var GenericRule = $resource(apiUrl+'api/admin/rules/:code', { }, 
        {
            get: { method:'GET', isArray:true },
        });

        return GenericRule;
    }])
    .controller('AdminSpinesCtrl', ['$scope', '$state', '$stateParams', 'spines', 'GenericRule',
        function($scope, $state, $stateParams, spines, GenericRule) {

            var gridApi, rows;

            console.log('spines', spines);
            $scope.spines = spines;
            $scope.onSpineRuleSelected = function() {
                if (!$scope.spineRule) return;
                rows = JSON.parse($scope.spineRule.jsonData);
                gridApi.setRowData( rows );
            }

            function onCellValueChanged() {
                //save data

                $scope.spineRule.jsonData = JSON.stringify(rows);
                new GenericRule($scope.spineRule).$save();

            }

            $scope.gridOptions = {
                debug: true,
                columnDefs: [
                    {headerName: "From", field: "from", width: 150, editable: true},
                    {headerName: "To", field: "to", width: 150, editable: true},
                    {headerName: "Value", field: "value", width: 150, editable:true},
                ],
                onGridReady: function(params) {
                    gridApi = params.api;
                },
                suppressColumnMoveAnimation: true,
                enableColResize: true,
                //suppressCellSelection: true,
                rowSelection: 'multiple',
                //onSelectionChanged: onSelectionChanged,
                onCellValueChanged: onCellValueChanged,
                rowHeight: 30,
                headerHeight: 30,
                enableSorting: false
            };

        
            

        }
    ]);