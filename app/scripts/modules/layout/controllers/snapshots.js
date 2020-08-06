'use strict';

angular.module('pace.layout')
    .controller('SnapshotsCtrl', ['$scope', 'product', 'layout', 'LayoutSnapshot', 'Layout', '$timeout', '$state',
     function ($scope, product, layout, LayoutSnapshot, Layout, $timeout, $state) {

        $scope.layoutCtrl = new PACE.LayoutController($scope);

        //$scope.currentLayout = layout;

        $scope.snapshots = LayoutSnapshot.query({layoutId:layout.id}, function() {
            $scope.$parent.designerSpinner = false;
        });
        $scope.$parent.designerSpinner = true;

        $scope.preview = function(s) {
            $scope.$parent.designerSpinner = true;
            LayoutSnapshot.get({id:s.id, layoutId:s.layoutId}, function(snapshot) {
                $scope.currentSnapshot = snapshot;
                $scope.currentLayout = new Layout(JSON.parse($scope.currentSnapshot.layoutJson));

                _.each($scope.currentLayout.spreads, function(spread) {
                    delete spread._id;
                    _.each(spread.elements, function(el) {
                        delete el._id;
                    });
                });

                $scope.$parent.designerSpinner = false;

                $timeout(function() {
                    $scope.layoutCtrl.renderAll();    
                });
                
                console.log('currentLayout', $scope.currentLayout);
            });
        }

        $scope.restore = function() {

            $scope.$parent.designerSpinner = true;

            var layout = $scope.currentLayout;

            _.each(layout.spreads, function(spread) {
                delete spread.id;
                delete spread.version;
                _.each(spread.elements, function(el) {
                    delete el.id;
                    delete el.version;
                });
            });

            Layout.get({id:layout.id}, function(value) {

                layout.version = value.version;
                layout.filmStrip = value.filmStrip;

                console.log('restoring layout', $scope.currentSnapshot.date);
                layout.$save(function() {
                    console.log('layout restored');

                    $state.go('layout', {productId:product.id}, { reload:true });

                    $scope.$parent.designerSpinner = false;
                });

            });
        };
        

    }]);