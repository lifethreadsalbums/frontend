'use strict';

angular.module('pace.layout')
    .controller('PreviewCtrl', ['$scope', '$rootScope', 'product', 'layout', function ($scope, $rootScope, product, layout) {

        $scope.product = product;
        $scope.layout = layout;
        $scope.page = 2;
        $scope.isPlaying = true;
       
        
        $scope.toggleSlideshow = function() {

    		if ($scope.isPlaying)
    		    $scope.startSlideshow();
    		else
    			$scope.stopSlideshow();
    			$scope.isPlaying = !$scope.isPlaying;
		};

        $scope.goToPage = function(page) {
            $scope.page = Math.min(layout.spreads.length*2, Math.max(2, page));
        };


        var timer;

        $scope.startSlideshow = function() {
            timer = setInterval(function() {

                $scope.$apply( function() {
                    $scope.page = $scope.page + 2;
                });
                       
            }, 2000);
        };

        $scope.stopSlideshow = function() {
         	clearInterval( timer );
        };

    }]);