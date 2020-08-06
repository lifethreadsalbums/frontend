'use strict';

angular.module('pace.order')
.controller('BatchesCtrl', ['$scope', '$rootScope', '$state', 'Product', 'batches', 'Batch', '_', 
    function ($scope, $rootScope, $state, Product, batches, Batch, _) {
        $scope.batches = batches;

        $scope.new = function() {

            var batch = new Batch({});
            
            batch.$save(function(value) {
                batches.push(value);    
            });
        };

        $scope.submitBatch = function() {
            $rootScope.productDetailsSpinner = true;
            Batch.submit({id: $state.params.batchId}, function(value) {
                var batch = _.findWhere(batches, {id:value.id});
                if (batch) {
                    _.extend(batch, value);
                }
                $rootScope.productDetailsSpinner = false;
            });
        };

    }
]);