'use strict';

angular.module('pace.layout')
    .controller('ImageInfoCtrl', ['$scope', '$timeout', 'UndoService', 'SnappingService', 'StoreConfig', 'GeomService',
        function ($scope, $timeout, UndoService, SnappingService, StoreConfig, GeomService) {

        	var maxWidth  = Math.min(1000, $(document).width() - 382),
				maxHeight = Math.min(1000, $(document).height() - (50 + 16*2)),
				maxH = 0, maxW = 0;

	        _.each($scope.items, function(item) {
	        	var image = item.image;
	        	var lowResSize = GeomService.fitRectangleProportionally( image, { width: 1000, height: 1000 });
	        	if (lowResSize.width>maxW) maxW = lowResSize.width;
	        	if (lowResSize.height>maxH) maxH = lowResSize.height;
	        });

	        var rect = GeomService.fitRectangleProportionally( { width:maxW, height:maxH }, { width: maxWidth, height: maxHeight });
	        $scope.popupWidth = Math.round(rect.width) + 382;
		    $scope.popupHeight = Math.round(rect.height) + 32;
		    $scope.imageHeight = Math.round(rect.height);
		    $scope.imageWidth = Math.round(rect.width);
		    $scope.itemIndex = 0;

	        $scope.showItem = function(index) {
	        	if (index<0 || index>$scope.items.length - 1) return;

	        	var item = $scope.items[index];
	        	$scope.pages = item.occurrences;
	        	$scope.itemIndex = index;

	        	$scope.image = item.image;
		        $scope.sizeText = filesize(item.image.size);

		        $scope.effectivePpi = null;
		        if (item.occurrences && item.occurrences.length>0) {

		        	console.log(item.occurrences)
		        	var element = item.occurrences[0].element;
		        	if ($scope.layoutController.selectedElements.length===1 &&
		        		$scope.layoutController.selectedElements[0].imageFile &&
		        		$scope.layoutController.selectedElements[0].imageFile.id == item.image.id) {
		        		element = $scope.layoutController.selectedElements[0];
		        	}

		        	$scope.effectivePpi = Math.round(72 * element.imageFile.width / element.imageWidth);
		        }

		        if (item.image.file && /tour-sample-[\d]{3}.jpg/.test(item.image.file.name)) {
                    // load tour sample image from app assets
                    $scope.imageUrl = '/images/tour-sample-assets/' + item.image.file.name;
                } else if (item.image.file) {
		        	var reader = new FileReader();

			        reader.onload = function(e) {
			            $scope.imageUrl = reader.result;
			        };

			        reader.readAsDataURL(item.image.file);

		        } else {
                	$scope.imageUrl = StoreConfig.imageUrlPrefix + 'lowres/' + item.image.url;
                }

                $timeout(function() {
                	var imageHeight = Math.round(rect.height) + 32;
                	var asideHeight = $('.image-info-pop-up aside').outerHeight() + 32;
                	var popupMinHeight = Math.max(imageHeight, asideHeight);

				    $scope.popupHeight = isNaN(popupMinHeight) ? 550 : popupMinHeight;
                });
	        };

	        $scope.onKeyPress = function(e) {
	            e.preventDefault();

                var deleteKeyCode = [8, 46];

	        	if (e.keyCode===39) {
	        		$scope.showItem($scope.itemIndex + 1)
	        	} else if (e.keyCode===37) {
	        		$scope.showItem($scope.itemIndex - 1);
	        	} else if (e.keyCode===32) {
	        		$scope.close();
	        	} else if (deleteKeyCode.indexOf(e.keyCode) !== -1) {
                    $scope.delete();
                }
	        };

	        $scope.close = function() {
	        	$scope.closeThisDialog();
	        	$('.filmstrip-container').focus();
	        };

	        $scope.delete = function() {
	        	$scope.deleteFn([ $scope.items[$scope.itemIndex] ]);
	        };

	        $scope.replace = function() {
	        	$scope.replaceFn($scope.items[$scope.itemIndex]);
	        };

	        $scope.$watch('items', function(val) {
	        	if (!val) return;
	        	$scope.showItem($scope.itemIndex);
	        }, true);

	        //$scope.showStackItem(0);

	        setTimeout(function() {
	        	$('.image-info-pop-up').focus();
	        });
        }
    ]);
