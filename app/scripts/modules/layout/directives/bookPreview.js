'use strict';

angular.module('pace.layout')
	.directive('bookPreview', ['$parse', '$timeout', 'StoreConfig', function ($parse, $timeout, StoreConfig) {
	    return {
	    	restrict: 'E',
	    	replace: true,
	    	scope: {
	    		layout: '=',
	    		page: '='
	    	},
	    	template: '<div class="book-preview"></div>',
	    	controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
	    		
	    		this.next = function() {
	    			$element.turn('next');
	    		};

	    		this.previous = function() {
	    			$element.turn('previous');
	    		};

	    	}],
	      	link: function postLink($scope, $element, $attrs) {

	      		var scale = parseFloat( $attrs.scale );

	      		var layout = $scope.layout;

	      		function renderElement(el, offsetX) {
	      			var frameStyles="left:" + (el.x + offsetX)  * scale + 'px;'+
	      				'top:' + el.y  * scale + 'px;' +
	      				'width: ' + el.width  * scale + 'px;' +
	      				'height:' + el.height * scale + 'px;';

	      			var imgStyles = "left:" + Math.round(el.imageX) * scale + 'px;'+
	      				'top:' +  Math.round(el.imageY) * scale + 'px;' +
	      				'width: ' +  Math.round(el.imageWidth) * scale + 'px;' + 
	      				'max-width: ' +  Math.round(el.imageWidth) * scale + 'px;' +
	      				'height:' +  Math.round(el.imageHeight) * scale + 'px;' + 
	      				'max-height:' +  Math.round(el.imageHeight) * scale + 'px;';

	      			var src = StoreConfig.imageUrlPrefix + 'lowres/' + el.imageFile.url;

	      			return '<div class="frame" style="' + frameStyles + '">' +
	      						'<img src="' + src + '" class="image" style="' + imgStyles +'" />'+
	      					'</div>';
	      		}

	      		function renderSpread(spread, offsetX) {
	      			var spreadStyles = 'width:'+ (layout.layoutSize.width) * scale + 'px;' +
	      				'height:'+ layout.layoutSize.height * scale + 'px;';

	      			var html = '',
	      				offsetX = 0;
	      			for (var j = 0; j < 2; j++) {
		      			
		      			html += '<div class="spread" style="' + spreadStyles +'">';
			      		for (var i = 0; i < spread.elements.length; i++) {
			      			var el = spread.elements[i];
			      			html += renderElement(el, offsetX);
			      		};
			      		html += '</div>';
			      		offsetX = -layout.layoutSize.width ;
		      		};
	      			return html;
	      		}

	      		var emptyPage = '<div class="spread" style="width:'+ layout.layoutSize.width + 'px;' +
	      				'height:' + layout.layoutSize.height + 'px;"></div>';

	      		var html = emptyPage;
	      		for (var i = 0; i < layout.spreads.length; i++) {
	      			var spread = layout.spreads[i];
	      			html += renderSpread(spread);
	      		};
	      		$element.append( angular.element(html) );


	      		$element.turn({
					width: layout.layoutSize.width,
					height: layout.layoutSize.height /2,
					autoCenter: true,
					page: 2
				});

				$scope.$watch('page', function(value, oldValue) {
					if (value!==oldValue) {
						$element.turn('page', value);
					}
					console.log(value)

				});

	      	}
	    };
	}]);